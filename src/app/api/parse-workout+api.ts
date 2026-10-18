import type { SetEntry, WorkoutDraft } from '@/features/workout/types';

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

function draftFromSentence(rawText: string): WorkoutDraft {
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

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Expected a sentence.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || typeof (body as { sentence?: unknown }).sentence !== 'string') {
    return Response.json({ error: 'Expected a sentence.' }, { status: 400 });
  }
  return Response.json(draftFromSentence((body as { sentence: string }).sentence));
}
