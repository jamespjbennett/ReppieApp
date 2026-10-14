This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Product

Reppie is a workout log for one person. The later product turns a spoken or typed sentence into sets, then estimates strain and fitness per muscle. Build the log first. Muscle scores, voice, and the mascot read that log. They do not exist yet.

The first slice is one screen. The user types a sentence, sees an editable draft, confirms it, and finds that log in a history list. Store only a confirmed log.

Call the parser through `parseWorkout`. The first parser is a stub with no network and no secret. The screen never calls a model directly. `parserVersion` is `stub-1`. The stub matches a name of letters and spaces, then a count such as `3x8`, then an optional kilogram number. `bench 3x8 80kg` becomes one exercise named Bench, three sets, 8 reps, 80 kg, and a null duration. `bench 3x8` leaves `weightKg` null. A set count above 30 is unmatched, so one keystroke cannot build a row per digit. `pull-up 3x8` and `80lb` are unmatched. An empty sentence has no exercises and cannot be saved. Any other sentence becomes one exercise named from the text and one set of nulls, so the user can fix it. A set field that is not a number blocks Save until the user enters a number or clears it.

The list that exists now lives in memory. `WorkoutJournalProvider` in `src/app/_layout.tsx` holds it. `confirm` is the only function that appends. Reloading the app drops the list. A tab change must not drop it. Do not add `expo-sqlite` until a later commit whose only job is persistence.

Use this shape. `source` stays `text` until voice exists. Leave `reps`, `weightKg`, or `durationSec` null when the user did not say that number. Do not invent a value. Store weight in kilograms.

```ts
type WorkoutLog = {
  id: string;
  createdAt: string;
  source: 'text' | 'voice';
  rawText: string;
  parserVersion: string;
  exercises: ExerciseEntry[];
};

type ExerciseEntry = {
  name: string;
  sets: SetEntry[];
};

type SetEntry = {
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
};
```

The next persistence commit saves the log on the phone with `expo-sqlite`. Use one row per set so a later muscle total is a query. Tables:

- `workout_logs` has `id`, `created_at`, `raw_text`, and `parser_version`.
- `exercises` has `id`, `log_id`, `position`, and `name`.
- `sets` has `id`, `exercise_id`, `position`, `reps`, `weight_kg`, and `duration_sec`.

Put the types in `src/features/workout/types.ts`. Put `parseWorkout` in `src/features/workout/parse-workout.ts`. Put the in-memory list in `src/features/workout/journal.tsx`. The log screen is `src/app/index.tsx`. When persistence lands, put save and list in `src/db/workout-logs.ts` and wrap the app in `SQLiteProvider` from `src/app/_layout.tsx`. Keep non-route code out of `src/app/`.

Keep the model key out of the client. After the stub loop works, add `src/app/api/parse-workout+api.ts` and read the key only in that file, or in a module that only that file imports. Leave `web.output` as `static` until that route exists. The route returns a draft. It does not store the log.

Leave voice input, the Reppie mascot, muscle scores, a hosted database, and a second API project for later. There is one repo and one database, and that database is on the phone.

A session that starts with a hosted database or a second service has ignored this plan. Build the confirm-and-save loop first.

## Decisions

Product and technical decisions live in the Product section above. When one of them changes, edit that section in the same commit as the code. Do not add a second context file. `AGENTS.md` is the file every session loads.

If chat and this file disagree, this file wins. A session that ships `expo-sqlite`, a model key, or a second service because an older chat said to has ignored the current section.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
