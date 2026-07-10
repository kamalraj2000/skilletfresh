import { useState } from 'react';
import type { Aisle, DayPlan, Meal } from './data';
import { initialAisles, initialDays, replanDiff, TODAY_INDEX } from './data';
import { SundayReview } from './SundayReview';
import { ShoppingList } from './ShoppingList';
import { RecipeDetail, TodayView, type LogChoice } from './TodayView';

type Tab = 'plan' | 'list' | 'today';

export default function App() {
  const [tab, setTab] = useState<Tab>('plan');
  const [recipeOpen, setRecipeOpen] = useState(false);

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
    setDays((prev) => prev.map((d, i) => {
      const change = replanDiff.find((c) => c.dayIndex === i);
      return change ? { ...change.meal, day: d.day } : d;
    }));
    setReplanPending(false);
  };

  return (
    <div className="app-frame">
      {recipeOpen ? (
        <RecipeDetail meal={days[TODAY_INDEX]} onBack={() => setRecipeOpen(false)} />
      ) : tab === 'plan' ? (
        <SundayReview
          days={days}
          locked={locked}
          onSwap={swapMeal}
          onLock={() => {
            setLocked(true);
            setTab('list');
          }}
          onViewList={() => setTab('list')}
        />
      ) : tab === 'list' ? (
        <ShoppingList
          aisles={aisles}
          onToggleItem={toggleItem}
          receiptDone={receiptDone}
          onReceiptClose={() => setReceiptDone(true)}
          onContinueToToday={() => setTab('today')}
        />
      ) : (
        <TodayView
          days={days}
          logged={logged}
          replanPending={replanPending}
          onLog={logTonight}
          onConfirmReplan={confirmReplan}
          onOpenRecipe={() => setRecipeOpen(true)}
        />
      )}

      {!recipeOpen && (
        <nav className="tab-bar" aria-label="Main">
          <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>
            <span className="tab-dot" />
            Week
          </button>
          <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
            <span className="tab-dot" />
            List
          </button>
          <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
            <span className="tab-dot" />
            Today
          </button>
        </nav>
      )}
    </div>
  );
}
