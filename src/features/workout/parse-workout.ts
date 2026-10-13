import type { ExerciseEntry, SetEntry, WorkoutDraft, WorkoutLog } from '@/features/workout/types';

const PARSER_VERSION = 'stub-1';

const MIN_SETS = 1;
const MAX_SETS = 30;

const SENTENCE =
  /^([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)x(\d+)(?:\s+(\d+(?:\.\d+)?)kg)?$/i;

function capitalizeFirst(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function unmatched(rawText: string, trimmed: string): WorkoutDraft {
  return {
    rawText,
    parserVersion: PARSER_VERSION,
    exercises: [
      {
        name: trimmed,
        sets: [{ reps: null, weightKg: null, durationSec: null }],
      },
    ],
  };
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

export async function parseWorkout(rawText: string): Promise<WorkoutDraft> {
  const trimmed = rawText.trim();
  if (trimmed === '') {
    return { rawText, parserVersion: PARSER_VERSION, exercises: [] };
  }

  const match = SENTENCE.exec(trimmed);
  if (!match) return unmatched(rawText, trimmed);

  const setCount = Number(match[2]);
  const reps = Number(match[3]);
  if (
    !Number.isSafeInteger(setCount) ||
    setCount < MIN_SETS ||
    setCount > MAX_SETS ||
    !Number.isSafeInteger(reps)
  ) {
    return unmatched(rawText, trimmed);
  }

  const weightToken = match[4];
  const weightKg = weightToken === undefined ? null : Number(weightToken);
  if (weightKg !== null && !Number.isFinite(weightKg)) return unmatched(rawText, trimmed);

  const sets: SetEntry[] = [];
  for (let index = 0; index < setCount; index += 1) {
    sets.push({ reps, weightKg, durationSec: null });
  }

  return {
    rawText,
    parserVersion: PARSER_VERSION,
    exercises: [{ name: capitalizeFirst(match[1]), sets }],
  };
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
