import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { listWorkoutLogs, saveWorkoutLog } from '@/db/workout-logs';
import { confirmedLog } from '@/features/workout/parse-workout';
import type { WorkoutDraft, WorkoutLog } from '@/features/workout/types';

export type ConfirmOutcome = { kind: 'saved' } | { kind: 'empty' } | { kind: 'busy' } | { kind: 'failed' };

type WorkoutJournalValue = {
  logs: WorkoutLog[];
  saving: boolean;
  confirm: (draft: WorkoutDraft) => Promise<ConfirmOutcome>;
};

const WorkoutJournalContext = createContext<WorkoutJournalValue | null>(null);

export function WorkoutJournalProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [saving, setSaving] = useState(false);
  const writing = useRef(false);
  const readSeq = useRef(0);

  const reload = useCallback(async () => {
    const seq = ++readSeq.current;
    const next = await listWorkoutLogs(db);
    if (seq === readSeq.current) setLogs(next);
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    const seq = ++readSeq.current;
    listWorkoutLogs(db)
      .then((next) => {
        if (!cancelled && seq === readSeq.current) setLogs(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [db]);

  const confirm = useCallback(
    async (draft: WorkoutDraft): Promise<ConfirmOutcome> => {
      const log = confirmedLog(draft);
      if (!log) return { kind: 'empty' };
      if (writing.current) return { kind: 'busy' };
      writing.current = true;
      setSaving(true);
      try {
        await saveWorkoutLog(db, log);
      } catch {
        writing.current = false;
        setSaving(false);
        return { kind: 'failed' };
      }
      try {
        await reload();
      } catch {
        // The row is committed. A failed reread must not invite a second save.
      }
      writing.current = false;
      setSaving(false);
      return { kind: 'saved' };
    },
    [db, reload],
  );

  const value = useMemo(() => ({ logs, saving, confirm }), [logs, saving, confirm]);

  return <WorkoutJournalContext.Provider value={value}>{children}</WorkoutJournalContext.Provider>;
}

export function useWorkoutJournal(): WorkoutJournalValue {
  const journal = useContext(WorkoutJournalContext);
  if (!journal) {
    throw new Error('useWorkoutJournal must be used within WorkoutJournalProvider');
  }
  return journal;
}
