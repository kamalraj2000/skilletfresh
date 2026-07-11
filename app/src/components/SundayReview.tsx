'use client';

import { useState } from 'react';
import type { DayPlan, Meal } from '@/lib/data';
import { alternates, EST_GROCERIES, WEEK_LABEL } from '@/lib/data';
import { Chip, Photo } from '@/components/ui';

export function SundayReview({
  days,
  locked,
  onSwap,
  onLock,
  onViewList,
}: {
  days: DayPlan[];
  locked: boolean;
  onSwap: (dayIndex: number, meal: Meal) => void;
  onLock: () => void;
  onViewList: () => void;
}) {
  const [swapDay, setSwapDay] = useState<number | null>(null);
  const [sheetClosing, setSheetClosing] = useState(false);
  const [chosenAlt, setChosenAlt] = useState<number | null>(null);
  const [swappedDay, setSwappedDay] = useState<number | null>(null);

  const closeSheet = () => {
    setSheetClosing(true);
    setTimeout(() => {
      setSwapDay(null);
      setSheetClosing(false);
      setChosenAlt(null);
    }, 240);
  };

  const pickAlternate = (altIndex: number) => {
    if (swapDay === null || chosenAlt !== null) return;
    setChosenAlt(altIndex);
    const day = swapDay;
    // chosen card pulses once, then the sheet drops and the day card cross-fades
    setTimeout(() => {
      onSwap(day, alternates[altIndex]);
      setSwappedDay(day);
      closeSheet();
    }, 360);
  };

  return (
    <div className="screen">
      <div className="brand-row">
        <span className="brand">
          Skillet<em>Fresh</em>
        </span>
        <span className="avatar">P</span>
      </div>

      <div style={{ padding: '14px 20px 14px' }}>
        {locked ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="screen-title" style={{ flex: 1 }}>
                This week&rsquo;s plan
              </h1>
              <span className="locked-pill">Locked</span>
            </div>
            <div className="screen-sub" style={{ marginTop: 3 }}>
              {WEEK_LABEL} · read-only
            </div>
          </>
        ) : (
          <>
            <h1 className="screen-title" style={{ margin: '2px 0 3px' }}>
              Your week is ready
            </h1>
            <div className="screen-sub">{WEEK_LABEL}</div>
            <div
              style={{
                marginTop: 12,
                background: 'var(--green-tint)',
                border: '1px solid var(--green-line)',
                borderRadius: 14,
                padding: '11px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: 'var(--green)',
                  marginTop: 5,
                  flex: 'none',
                }}
              />
              <span style={{ font: '400 13.5px/1.45 var(--font-ui)', color: 'var(--green-deep)' }}>
                7 dinners planned · all under 30 min · protein on target every day
              </span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 16px 16px' }}>
        {days.map((d, i) => (
          <div className={`day-card${swappedDay === i ? ' day-card--swap-in' : ''}`} key={`${d.day}-${d.name}`}>
            <div className="day-card__top">
              <Photo p1={d.p1} p2={d.p2} size={locked ? 72 : 84} label="photo" />
              <div className="day-card__body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="day-card__day">{d.day.toUpperCase()}</span>
                  <Chip green>{d.time} min · under 30 ✓</Chip>
                </div>
                <div className="day-card__name">{d.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  <Chip green>Protein · in band</Chip>
                  <Chip>Carbs · in band</Chip>
                  <Chip>≈{d.cal} cal</Chip>
                </div>
              </div>
            </div>
            {!locked && (
              <div className="day-card__footer">
                <Chip fit>{d.fit}/10</Chip>
                <span className="day-card__reason">{d.reason}</span>
                <button className="btn-secondary swap-btn" onClick={() => setSwapDay(i)}>
                  Swap
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bottom-bar">
        <div style={{ flex: 'none' }}>
          <div className="cost-label">Est. groceries</div>
          <div className="cost-value">{EST_GROCERIES}</div>
        </div>
        <button
          className="btn-primary"
          style={{ flex: 1, height: 52 }}
          onClick={locked ? onViewList : onLock}
        >
          {locked ? 'View shopping list' : 'Lock plan & build list'}
        </button>
      </div>

      {swapDay !== null && (
        <>
          <div className={`scrim${sheetClosing ? ' scrim--closing' : ''}`} onClick={closeSheet} />
          <div className={`sheet${sheetClosing ? ' sheet--closing' : ''}`}>
            <div className="sheet__grab" />
            <div style={{ font: '700 19px var(--font-ui)', marginBottom: 2 }}>
              Swap {days[swapDay].day}&rsquo;s dinner
            </div>
            <div style={{ font: '400 13px var(--font-ui)', color: 'var(--ink-soft)', marginBottom: 14 }}>
              3 alternates, ranked for the rest of your week. Tap one to replace.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alternates.map((a, ai) => (
                <button
                  className={`alt-card${chosenAlt === ai ? ' alt-card--chosen' : ''}`}
                  key={a.name}
                  onClick={() => pickAlternate(ai)}
                >
                  <Photo p1={a.p1} p2={a.p2} size={66} radius={11} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Chip fit>{a.fit}/10</Chip>
                      <Chip green>{a.time} min ✓</Chip>
                    </div>
                    <div style={{ font: '600 15px/1.2 var(--font-ui)' }}>{a.name}</div>
                    <div style={{ font: '400 12px/1.35 var(--font-ui)', color: 'var(--ink-soft)' }}>{a.reason}</div>
                  </div>
                  <span style={{ flex: 'none', font: '400 22px var(--font-ui)', color: '#C9BCA4' }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
