import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { parseWorkout } from '@/features/workout/parse-workout';
import { useWorkoutJournal } from '@/features/workout/journal';
import type { SetEntry, WorkoutDraft } from '@/features/workout/types';
import { useTheme } from '@/hooks/use-theme';

type SetField = 'reps' | 'weightKg' | 'durationSec';

type SetFieldRead = { kind: 'pending' } | { kind: 'value'; value: number | null };

const SET_FIELDS: readonly SetField[] = ['reps', 'weightKg', 'durationSec'];

const FIELD_LABEL: Record<SetField, string> = {
  reps: 'Reps',
  weightKg: 'Weight kg',
  durationSec: 'Duration sec',
};

function fieldKey(exerciseIndex: number, setIndex: number, field: SetField): string {
  return `${exerciseIndex}:${setIndex}:${field}`;
}

function readSetField(text: string): SetFieldRead {
  if (text.trim() === '') return { kind: 'value', value: null };
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const value = Number(text);
    if (Number.isFinite(value)) return { kind: 'value', value };
  }
  return { kind: 'pending' };
}

function shownField(
  uncommitted: Readonly<Record<string, string>>,
  exerciseIndex: number,
  setIndex: number,
  field: SetField,
  value: number | null,
): string {
  const typed = uncommitted[fieldKey(exerciseIndex, setIndex, field)];
  if (typed !== undefined) return typed;
  if (value === null) return '';
  return String(value);
}

function writeExerciseName(draft: WorkoutDraft, exerciseIndex: number, name: string): WorkoutDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, name } : exercise,
    ),
  };
}

function writeSetField(
  draft: WorkoutDraft,
  exerciseIndex: number,
  setIndex: number,
  field: SetField,
  value: number | null,
): WorkoutDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, exerciseAt) => {
      if (exerciseAt !== exerciseIndex) return exercise;
      return {
        ...exercise,
        sets: exercise.sets.map((set, setAt) => {
          if (setAt !== setIndex) return set;
          return { ...set, [field]: value };
        }),
      };
    }),
  };
}

function formatSet(set: SetEntry, index: number): string {
  const parts = [`Set ${index + 1}`];
  if (set.reps !== null) parts.push(`${set.reps} reps`);
  if (set.weightKg !== null) parts.push(`${set.weightKg} kg`);
  if (set.durationSec !== null) parts.push(`${set.durationSec} sec`);
  return parts.join(', ');
}

export default function HomeScreen() {
  const theme = useTheme();
  const { logs, confirm } = useWorkoutJournal();
  const [sentence, setSentence] = useState('');
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [uncommitted, setUncommitted] = useState<Record<string, string>>({});
  const saveLocked = useRef(false);
  const hasPending = Object.keys(uncommitted).length > 0;
  const canSave = draft !== null && draft.exercises.length > 0 && !hasPending;

  async function onParse() {
    const next = await parseWorkout(sentence);
    saveLocked.current = false;
    setDraft(next);
    setUncommitted({});
  }

  function onSave() {
    if (!draft || draft.exercises.length === 0 || saveLocked.current) return;
    confirm(draft);
    saveLocked.current = true;
    setDraft(null);
    setUncommitted({});
  }

  function onSetText(exerciseIndex: number, setIndex: number, field: SetField, text: string) {
    const key = fieldKey(exerciseIndex, setIndex, field);
    const read = readSetField(text);
    if (read.kind === 'pending') {
      setUncommitted((current) => ({ ...current, [key]: text }));
      return;
    }
    setUncommitted((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setDraft((current) =>
      current ? writeSetField(current, exerciseIndex, setIndex, field, read.value) : current,
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Welcome to Reppie
          </ThemedText>

          <TextInput
            accessibilityLabel="Workout sentence"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSentence}
            placeholder="bench 3x8 80kg"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={sentence}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void onParse();
            }}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText>Parse</ThemedText>
          </Pressable>

          {draft && draft.exercises.length === 0 ? (
            <ThemedText type="small">No exercises in that sentence.</ThemedText>
          ) : null}

          {hasPending ? (
            <ThemedText type="small">Enter a number or clear the field before saving.</ThemedText>
          ) : null}

          {draft?.exercises.map((exercise, exerciseIndex) => (
            <ThemedView key={exerciseIndex} style={styles.exercise}>
              <TextInput
                accessibilityLabel="Exercise name"
                onChangeText={(name) => {
                  setDraft((current) =>
                    current ? writeExerciseName(current, exerciseIndex, name) : current,
                  );
                }}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                value={exercise.name}
              />
              {exercise.sets.map((set, setIndex) => (
                <ThemedView key={setIndex} style={styles.setRow}>
                  {SET_FIELDS.map((field) => (
                    <ThemedView key={field} style={styles.field}>
                      <ThemedText type="small">{FIELD_LABEL[field]}</ThemedText>
                      <TextInput
                        accessibilityLabel={`${FIELD_LABEL[field]}, set ${setIndex + 1}`}
                        keyboardType="decimal-pad"
                        onChangeText={(text) => onSetText(exerciseIndex, setIndex, field, text)}
                        style={[
                          styles.input,
                          { color: theme.text, backgroundColor: theme.backgroundElement },
                        ]}
                        value={shownField(uncommitted, exerciseIndex, setIndex, field, set[field])}
                      />
                    </ThemedView>
                  ))}
                </ThemedView>
              ))}
            </ThemedView>
          ))}

          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={onSave}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.backgroundElement },
              !canSave && styles.buttonDisabled,
              pressed && canSave && styles.pressed,
            ]}>
            <ThemedText>Save</ThemedText>
          </Pressable>

          {logs.map((log) => (
            <ThemedView key={log.id} style={styles.log}>
              <ThemedText>{log.rawText}</ThemedText>
              {log.exercises.map((exercise, exerciseIndex) => (
                <ThemedView key={`${log.id}-${exerciseIndex}`}>
                  <ThemedText type="smallBold">{exercise.name}</ThemedText>
                  {exercise.sets.map((set, setIndex) => (
                    <ThemedText key={`${log.id}-${exerciseIndex}-${setIndex}`} type="small">
                      {formatSet(set, setIndex)}
                    </ThemedText>
                  ))}
                </ThemedView>
              ))}
            </ThemedView>
          ))}

          {Platform.OS === 'web' && <WebBadge />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    paddingHorizontal: Spacing.four,
    ...Platform.select({
      web: { paddingTop: Spacing.six },
      default: { paddingTop: Spacing.three },
    }),
  },
  title: {
    textAlign: 'center',
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  exercise: {
    gap: Spacing.two,
  },
  setRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  field: {
    flex: 1,
    gap: Spacing.one,
  },
  log: {
    gap: Spacing.one,
  },
});
