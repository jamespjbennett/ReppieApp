import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { confirmedLog } from '@/features/workout/parse-workout';
import type { WorkoutDraft, WorkoutLog } from '@/features/workout/types';

type WorkoutJournalValue = {
  logs: WorkoutLog[];
  confirm: (draft: WorkoutDraft) => void;
};

const WorkoutJournalContext = createContext<WorkoutJournalValue | null>(null);

export function WorkoutJournalProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  const confirm = useCallback((draft: WorkoutDraft) => {
    const log = confirmedLog(draft);
    if (!log) return;
    setLogs((current) => [log, ...current]);
  }, []);

  const value = useMemo(() => ({ logs, confirm }), [logs, confirm]);

  return <WorkoutJournalContext.Provider value={value}>{children}</WorkoutJournalContext.Provider>;
}

export function useWorkoutJournal(): WorkoutJournalValue {
  const journal = useContext(WorkoutJournalContext);
  if (!journal) {
    throw new Error('useWorkoutJournal must be used within WorkoutJournalProvider');
  }
  return journal;
}
