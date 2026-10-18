import type { ExerciseEntry, SetEntry, WorkoutDraft } from '@/features/workout/types';

const STUB_VERSION = 'stub-1' as const;
const MODEL_VERSION = 'model-1' as const;
const MODEL_NAME = 'claude-haiku-5-5';

const MIN_SETS = 1;
const MAX_SETS = 30;

const SENTENCE =
  /^([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)x(\d+)(?:\s+(\d+(?:\.\d+)?)kg)?$/i;

const DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    exercises: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          sets: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                reps: { type: ['number', 'null'] },
                weightKg: { type: ['number', 'null'] },
                durationSec: { type: ['number', 'null'] },
              },
              required: ['reps', 'weightKg', 'durationSec'],
            },
          },
        },
        required: ['name', 'sets'],
      },
    },
  },
  required: ['exercises'],
} as const;

function capitalizeFirst(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function unmatched(rawText: string, trimmed: string): WorkoutDraft {
  return {
    rawText,
    parserVersion: STUB_VERSION,
    exercises: [
      {
        name: trimmed,
        sets: [{ reps: null, weightKg: null, durationSec: null }],
      },
    ],
  };
}

function stubDraft(rawText: string): WorkoutDraft {
  const trimmed = rawText.trim();
  if (trimmed === '') {
    return { rawText, parserVersion: STUB_VERSION, exercises: [] };
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
    parserVersion: STUB_VERSION,
    exercises: [{ name: capitalizeFirst(match[1]), sets }],
  };
}

function readModelKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (typeof key !== 'string' || key.trim() === '') return null;
  return key.trim();
}

function nullableNumber(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function draftFromModel(rawText: string, payload: unknown): WorkoutDraft | null {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { exercises?: unknown }).exercises)) {
    return null;
  }
  const exercises: ExerciseEntry[] = [];
  for (const item of (payload as { exercises: unknown[] }).exercises) {
    if (!item || typeof item !== 'object') return null;
    const name = (item as { name?: unknown }).name;
    const setsValue = (item as { sets?: unknown }).sets;
    if (typeof name !== 'string' || name.trim() === '' || !Array.isArray(setsValue)) return null;
    if (setsValue.length > MAX_SETS) return null;
    const sets: SetEntry[] = setsValue.map((set) => {
      if (!set || typeof set !== 'object') return { reps: null, weightKg: null, durationSec: null };
      return {
        reps: nullableNumber((set as { reps?: unknown }).reps),
        weightKg: nullableNumber((set as { weightKg?: unknown }).weightKg),
        durationSec: nullableNumber((set as { durationSec?: unknown }).durationSec),
      };
    });
    exercises.push({
      name: name.trim(),
      sets: sets.length > 0 ? sets : [{ reps: null, weightKg: null, durationSec: null }],
    });
  }
  if (exercises.length === 0) return null;
  return { rawText, parserVersion: MODEL_VERSION, exercises };
}

function modelText(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const stop = (body as { stop_reason?: unknown }).stop_reason;
  if (stop === 'refusal' || stop === 'max_tokens') return null;
  const content = (body as { content?: unknown }).content;
  if (!Array.isArray(content)) return null;
  const block = content.find(
    (item) => item && typeof item === 'object' && (item as { type?: unknown }).type === 'text',
  ) as { text?: unknown } | undefined;
  return typeof block?.text === 'string' ? block.text : null;
}

async function modelDraft(rawText: string, key: string): Promise<WorkoutDraft | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model: MODEL_NAME,
      max_tokens: 2048,
      system: [
        'Turn one workout sentence into exercises and sets.',
        'Leave reps, weightKg, or durationSec null when the sentence did not include that number.',
        'Do not invent a number.',
        'Store weight in kilograms. Convert pounds with weightKg = pounds * 0.45359237, rounded to two decimals.',
        'A count such as 3x8 is three sets of 8 reps.',
        'Keep a hyphen in the exercise name. Capitalize the first letter.',
        'Use one set when the sentence names an exercise and no set count.',
        'An exercise with more than 30 sets is not allowed.',
        'bench 3x8 80kg is Bench, three sets, 8 reps, 80 kg, duration null.',
        'pull-up 3x8 is Pull-up, three sets, 8 reps, weight null, duration null.',
        'plank 60s is Plank, one set, reps null, weight null, duration 60.',
      ].join(' '),
      messages: [{ role: 'user', content: rawText }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: DRAFT_SCHEMA,
        },
      },
    }),
  });
  if (!response.ok) return null;
  const text = modelText(await response.json());
  if (!text) return null;
  try {
    return draftFromModel(rawText, JSON.parse(text));
  } catch {
    return null;
  }
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
  const sentence = (body as { sentence: string }).sentence;
  if (sentence.trim() === '') {
    return Response.json(stubDraft(sentence));
  }
  const key = readModelKey();
  if (key) {
    try {
      const draft = await modelDraft(sentence, key);
      if (draft) return Response.json(draft);
    } catch {
      // The stub still returns an editable draft when the model call fails.
    }
  }
  return Response.json(stubDraft(sentence));
}
