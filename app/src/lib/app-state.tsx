'use client';

// Interim client-side state for the ported prototype: holds the cross-tab
// state that App.tsx lifted in the Vite SPA. Removed in Phase 4 when pages
// become server components backed by Postgres.

import { createContext, useContext, useState } from 'react';
import type { Aisle, DayPlan, Meal } from '@/lib/data';
import { initialAisles, initialDays, replanDiff } from '@/lib/data';
import type { LogChoice } from '@/components/TodayView';

interface AppState {
  days: DayPlan[];
  locked: boolean;
  aisles: Aisle[];
  receiptDone: boolean;
  logged: LogChoice | null;
  replanPending: boolean;
  swapMeal: (dayIndex: number, meal: Meal) => void;
  lockPlan: () => void;
  toggleItem: (aisleName: string, itemId: string) => void;
  closeReceipt: (total: string | null) => void;
  logTonight: (choice: LogChoice) => void;
  confirmReplan: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [days, setDays] = useState<DayPlan[]>(initialDays);
  const [locked, setLocked] = useState(false);
  const [aisles, setAisles] = useState<Aisle[]>(initialAisles);
  const [receiptDone, setReceiptDone] = useState(false);
  const [logged, setLogged] = useState<LogChoice | null>(null);
  const [replanPending, setReplanPending] = useState(false);

  const swapMeal = (dayIndex: number, meal: Meal) =>
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? { ...meal, day: d.day } : d)));

  const toggleItem = (aisleName: string, itemId: string) =>
    setAisles((prev) =>
      prev.map((a) =>
        a.name === aisleName
          ? { ...a, items: a.items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it)) }
          : a,
      ),
    );

  const logTonight = (choice: LogChoice) => {
    setLogged(choice);
    // a skip or swap triggers the agent re-plan, delivered as a diff
    if (choice !== 'cooked') setReplanPending(true);
  };

  const confirmReplan = () => {
    setDays((prev) =>
      prev.map((d, i) => {
        const change = replanDiff.find((c) => c.dayIndex === i);
        return change ? { ...change.meal, day: d.day } : d;
      }),
    );
    setReplanPending(false);
  };

  return (
    <AppStateContext.Provider
      value={{
        days,
        locked,
        aisles,
        receiptDone,
        logged,
        replanPending,
        swapMeal,
        lockPlan: () => setLocked(true),
        toggleItem,
        closeReceipt: () => setReceiptDone(true),
        logTonight,
        confirmReplan,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
