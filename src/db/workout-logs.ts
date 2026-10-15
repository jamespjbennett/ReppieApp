import type { SQLiteDatabase } from 'expo-sqlite';

import type { SetEntry, WorkoutLog } from '@/features/workout/types';

export const DATABASE_NAME = 'reppie.db';

const SCHEMA_VERSION = 1;

type ListRow = {
  log_id: string;
  created_at: string;
  raw_text: string;
  parser_version: string;
  exercise_id: string | null;
  exercise_position: number | null;
  exercise_name: string | null;
  set_position: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
};

export async function initWorkoutDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON');
  await db.execAsync("PRAGMA journal_mode = WAL");
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = result?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        parser_version TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY NOT NULL,
        log_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (log_id) REFERENCES workout_logs(id),
        UNIQUE (log_id, position)
      );
      CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY NOT NULL,
        exercise_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        reps REAL,
        weight_kg REAL,
        duration_sec REAL,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id),
        UNIQUE (exercise_id, position)
      );
    `);
  });
  await db.execAsync('PRAGMA user_version = 1');
}

export async function saveWorkoutLog(db: SQLiteDatabase, log: WorkoutLog): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO workout_logs (id, created_at, raw_text, parser_version) VALUES (?, ?, ?, ?)',
      log.id,
      log.createdAt,
      log.rawText,
      log.parserVersion,
    );
    for (let exerciseIndex = 0; exerciseIndex < log.exercises.length; exerciseIndex += 1) {
      const exercise = log.exercises[exerciseIndex];
      const exerciseId = globalThis.crypto.randomUUID();
      await db.runAsync(
        'INSERT INTO exercises (id, log_id, position, name) VALUES (?, ?, ?, ?)',
        exerciseId,
        log.id,
        exerciseIndex,
        exercise.name,
      );
      await insertSets(db, exerciseId, exercise.sets);
    }
  });
}

async function insertSets(db: SQLiteDatabase, exerciseId: string, sets: SetEntry[]): Promise<void> {
  for (let setIndex = 0; setIndex < sets.length; setIndex += 1) {
    const set = sets[setIndex];
    await db.runAsync(
      'INSERT INTO sets (id, exercise_id, position, reps, weight_kg, duration_sec) VALUES (?, ?, ?, ?, ?, ?)',
      globalThis.crypto.randomUUID(),
      exerciseId,
      setIndex,
      set.reps,
      set.weightKg,
      set.durationSec,
    );
  }
}

export async function listWorkoutLogs(db: SQLiteDatabase): Promise<WorkoutLog[]> {
  const rows = await db.getAllAsync<ListRow>(`
    SELECT
      workout_logs.id AS log_id,
      workout_logs.created_at,
      workout_logs.raw_text,
      workout_logs.parser_version,
      exercises.id AS exercise_id,
      exercises.position AS exercise_position,
      exercises.name AS exercise_name,
      sets.position AS set_position,
      sets.reps,
      sets.weight_kg,
      sets.duration_sec
    FROM workout_logs
    LEFT JOIN exercises ON exercises.log_id = workout_logs.id
    LEFT JOIN sets ON sets.exercise_id = exercises.id
    ORDER BY workout_logs.created_at DESC, exercises.position ASC, sets.position ASC
  `);
  return foldLogs(rows);
}

function foldLogs(rows: ListRow[]): WorkoutLog[] {
  const logs: WorkoutLog[] = [];
  let currentLogId: string | null = null;
  let currentExerciseId: string | null = null;

  for (const row of rows) {
    if (row.log_id !== currentLogId) {
      currentLogId = row.log_id;
      currentExerciseId = null;
      logs.push({
        id: row.log_id,
        createdAt: row.created_at,
        source: 'text',
        rawText: row.raw_text,
        parserVersion: row.parser_version,
        exercises: [],
      });
    }
    const log = logs[logs.length - 1];
    if (row.exercise_id === null || row.exercise_name === null) continue;
    if (row.exercise_id !== currentExerciseId) {
      currentExerciseId = row.exercise_id;
      log.exercises.push({ name: row.exercise_name, sets: [] });
    }
    if (row.set_position === null) continue;
    log.exercises[log.exercises.length - 1].sets.push({
      reps: row.reps,
      weightKg: row.weight_kg,
      durationSec: row.duration_sec,
    });
  }
  return logs;
}
