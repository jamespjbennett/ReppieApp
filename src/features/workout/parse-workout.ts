import type { ExerciseEntry, SetEntry, WorkoutDraft, WorkoutLog } from '@/features/workout/types';

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isSetEntry(value: unknown): value is SetEntry {
  if (!value || typeof value !== 'object') return false;
  const set = value as SetEntry;
  return isNullableNumber(set.reps) && isNullableNumber(set.weightKg) && isNullableNumber(set.durationSec);
}

function isWorkoutDraft(value: unknown): value is WorkoutDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as WorkoutDraft;
  if (draft.parserVersion !== 'stub-1' || typeof draft.rawText !== 'string' || !Array.isArray(draft.exercises)) {
    return false;
  }
  return draft.exercises.every(
    (exercise) =>
      exercise &&
      typeof exercise.name === 'string' &&
      Array.isArray(exercise.sets) &&
      exercise.sets.every(isSetEntry),
  );
}

export async function parseWorkout(rawText: string): Promise<WorkoutDraft> {
  const response = await fetch('/api/parse-workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence: rawText }),
  });
  if (!response.ok) {
    throw new Error('Parse failed');
  }
  const body: unknown = await response.json();
  if (!isWorkoutDraft(body)) {
    throw new Error('Parse failed');
  }
  return body;
}

function copyExercises(exercises: ExerciseEntry[]): ExerciseEntry[] {
  return exercises.map((exercise) => ({
    name: exercise.name,
    sets: exercise.sets.map((set) => ({
      reps: set.reps,
      weightKg: set.weightKg,
      durationSec: set.durationSec,
    })),
  }));
}

export function confirmedLog(draft: WorkoutDraft): WorkoutLog | null {
  if (draft.exercises.length === 0) return null;
  return {
    id: globalThis.crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source: 'text',
    rawText: draft.rawText,
    parserVersion: draft.parserVersion,
    exercises: copyExercises(draft.exercises),
  };
}
