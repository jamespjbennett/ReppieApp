export type SetEntry = {
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
};

export type ExerciseEntry = {
  name: string;
  sets: SetEntry[];
};

export type WorkoutLog = {
  id: string;
  createdAt: string;
  source: 'text' | 'voice';
  rawText: string;
  parserVersion: string;
  exercises: ExerciseEntry[];
};

export type WorkoutDraft = {
  rawText: string;
  parserVersion: 'stub-1';
  exercises: ExerciseEntry[];
};
