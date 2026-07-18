'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptReplan, logTonight } from '@/lib/actions';
import type { DayPlanVM, DayStatus, LogChoice, RecipeDetailVM, ReplanEntryVM } from '@/lib/view';
import { DAY_NAMES } from '@/lib/view';
import { Chip, Photo, WeekStrip } from '@/components/ui';

function listDayNames(entries: ReplanEntryVM[]): string {
  const names = entries.map((e) => DAY_NAMES[e.dayIndex]);
  return names.length > 1
    ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
    : names[0];
}

export function TodayView({
  today,
  todayIndex,
  todayLabel,
  portionLabel,
  statuses,
  logged,
  proposal,
}: {
  today: DayPlanVM;
  todayIndex: number;
  todayLabel: string;
  portionLabel: string | null;
  statuses: DayStatus[];
  logged: LogChoice | null;
  proposal: { id: string; entries: ReplanEntryVM[] } | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [justLogged, setJustLogged] = useState(false);

  const log = (choice: LogChoice) => {
    setJustLogged(true);
    startTransition(async () => {
      await logTonight(today.plannedMealId, choice);
    });
  };

  const inBand = statuses.filter((s, i) => i <= todayIndex && s === 'band').length;

  // re-plan diff state — after tapping Skipped or Swapped
  if (proposal && logged && logged !== 'cooked') {
    return (
      <div className="screen">
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ font: '400 13px var(--font-ui)', color: 'var(--ink-faint)' }}>{todayLabel}</div>
          <WeekStrip statuses={statuses} />
        </div>

        <div className="diff-banner">
          <div className="diff-banner__title">
            Plan updated — {listDayNames(proposal.entries)} changed
          </div>
          <div className="diff-banner__body">
            This keeps your protein in band after tonight&rsquo;s {logged === 'swapped' ? 'swap' : 'skip'}. Nothing
            else moved.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 16px 4px' }}>
          {proposal.entries.map((c) => (
            <div className="day-card" key={c.dayIndex}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="day-card__day" style={{ flex: 1 }}>
                  {DAY_NAMES[c.dayIndex].toUpperCase()}
                </span>
                <Chip updated>Updated</Chip>
              </div>
              <div className="diff-was">{c.was}</div>
              <div className="day-card__top">
                <Photo p1={c.meal.p1} p2={c.meal.p2} size={66} radius={11} />
                <div className="day-card__body">
                  <div className="day-card__name" style={{ fontSize: 15 }}>
                    {c.meal.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    <Chip green>{c.meal.time} min ✓</Chip>
                    <Chip green>Protein · in band</Chip>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Chip fit>{c.meal.fit}/10</Chip>
                    <span style={{ font: '400 12px/1.3 var(--font-ui)', color: 'var(--ink-soft)' }}>
                      {c.meal.reason}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px 24px' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', height: 52 }}
            onClick={() => startTransition(async () => acceptReplan(proposal.id))}
          >
            Looks good
          </button>
          <div style={{ textAlign: 'center', font: '400 12px var(--font-ui)', color: 'var(--ink-faint)', marginTop: 10 }}>
            Only {proposal.entries.length > 1 ? `these ${proposal.entries.length} days` : 'this day'} changed —
            the rest of your week is untouched.
          </div>
        </div>
      </div>
    );
  }

  // logged confirmation state — after tapping Cooked
  if (logged === 'cooked') {
    return (
      <div className="screen">
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ font: '400 13px var(--font-ui)', color: 'var(--ink-faint)' }}>{todayLabel}</div>
          <h1 className="screen-title" style={{ fontSize: 25, margin: '2px 0 0' }}>
            Tonight&rsquo;s dinner
          </h1>
          <WeekStrip statuses={statuses} popIndex={justLogged ? todayIndex : undefined} />
        </div>

        <div
          style={{
            margin: '18px 16px 0',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            opacity: 0.85,
          }}
        >
          <Photo p1={today.p1} p2={today.p2} radius={0} style={{ width: '100%', height: 120 }} />
          <div style={{ padding: '13px 16px 14px' }}>
            <div style={{ font: '700 18px/1.2 var(--font-ui)', marginBottom: 7 }}>{today.name}</div>
            <Chip green>Cooked tonight ✓</Chip>
          </div>
        </div>

        <div className="logged-card">
          <div className="logged-card__badge">✓</div>
          <div style={{ font: '700 21px var(--font-ui)', marginBottom: 4 }}>Logged</div>
          <div style={{ font: '700 15px var(--font-data)', color: 'var(--green-deep)', marginBottom: 6 }}>
            {inBand} of {todayIndex + 1} days in band this week
          </div>
          <div style={{ font: '400 13px var(--font-ui)', color: 'var(--ink-soft)' }}>
            {todayIndex < 6 ? `${DAY_NAMES[todayIndex + 1]}'s dinner is ready when you are.` : 'That wraps the week.'}
          </div>
        </div>
      </div>
    );
  }

  // quiet post-log state for skipped/swapped once the re-plan is confirmed
  if (logged) {
    return (
      <div className="screen">
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{ font: '400 13px var(--font-ui)', color: 'var(--ink-faint)' }}>{todayLabel}</div>
          <h1 className="screen-title" style={{ fontSize: 25, margin: '2px 0 0' }}>
            Tonight&rsquo;s dinner
          </h1>
          <WeekStrip statuses={statuses} />
        </div>
        <div className="logged-card">
          <div className="logged-card__badge" style={{ background: 'var(--sand)', boxShadow: 'none' }}>
            ✓
          </div>
          <div style={{ font: '700 21px var(--font-ui)', marginBottom: 4 }}>
            {logged === 'swapped' ? 'Swap logged' : 'Skip logged'}
          </div>
          <div style={{ font: '400 13px var(--font-ui)', color: 'var(--ink-soft)' }}>
            Your plan is updated.{' '}
            {todayIndex < 6 ? `${DAY_NAMES[todayIndex + 1]}'s dinner is ready when you are.` : ''}
          </div>
        </div>
      </div>
    );
  }

  // default — pre-log
  return (
    <div className="screen">
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ font: '400 13px var(--font-ui)', color: 'var(--ink-faint)' }}>{todayLabel}</div>
        <h1 className="screen-title" style={{ fontSize: 25, margin: '2px 0 0' }}>
          Tonight&rsquo;s dinner
        </h1>
        <WeekStrip statuses={statuses} />
      </div>

      <button className="hero-card" onClick={() => router.push('/today/recipe')}>
        <Photo
          p1={today.p1}
          p2={today.p2}
          radius={0}
          className="hero-card__photo"
          style={{ width: '100%' }}
          label={`recipe photo — ${today.name.toLowerCase()}`}
        />
        <div style={{ padding: '15px 16px 16px' }}>
          <div style={{ font: '700 20px/1.2 var(--font-ui)', marginBottom: 9 }}>{today.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
            <Chip green>{today.time} min · under your ceiling ✓</Chip>
            {portionLabel && <Chip>{portionLabel}</Chip>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 11 }}>
            <Chip green>Protein · in band</Chip>
            <Chip>Carbs · in band</Chip>
            <Chip>≈{today.cal} cal</Chip>
          </div>
          <div style={{ font: '600 13px var(--font-ui)', color: 'var(--green)' }}>
            Tap for ingredients &amp; steps ›
          </div>
        </div>
      </button>

      <div className="log-zone">
        <div className="log-zone__prompt">How did tonight go?</div>
        <button className="log-cooked" onClick={() => log('cooked')}>
          Cooked it
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button className="log-other" onClick={() => log('swapped')}>
            Swapped
          </button>
          <button className="log-other" onClick={() => log('skipped')}>
            Skipped
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecipeDetail({
  meal,
  recipe,
}: {
  meal: DayPlanVM;
  recipe: RecipeDetailVM;
}) {
  const router = useRouter();
  return (
    <div className="screen">
      <button className="back-row" onClick={() => router.push('/today')}>
        <span className="caret">‹</span> Today
      </button>
      <Photo
        p1={meal.p1}
        p2={meal.p2}
        radius={18}
        style={{ height: 170, margin: '0 16px' }}
        label="recipe photo"
      />
      <div style={{ padding: '16px 20px 8px' }}>
        <h1 className="screen-title" style={{ fontSize: 24, marginBottom: 9 }}>
          {meal.name}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip green>{meal.time} min · under your ceiling ✓</Chip>
          <Chip>1 skillet</Chip>
          <Chip green>Protein · in band</Chip>
        </div>
      </div>
      <div style={{ padding: '12px 20px 4px' }}>
        <div className="section-label" style={{ marginBottom: 6 }}>
          {recipe.ingredientsLabel}
        </div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '4px 16px',
          }}
        >
          {recipe.ingredients.map((i) => (
            <div className="ingredient-row" key={i.n}>
              <span className="ingredient-row__name">{i.n}</span>
              <span className="ingredient-row__qty">{i.q}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 20px 26px' }}>
        <div className="section-label" style={{ marginBottom: 10 }}>
          Steps
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {recipe.steps.map((t, i) => (
            <div className="step-row" key={i}>
              <span className="step-row__num">{i + 1}</span>
              <span className="step-row__text">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
