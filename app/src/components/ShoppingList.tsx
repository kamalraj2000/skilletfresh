'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { closeReceipt, toggleItem } from '@/lib/actions';
import type { AisleVM } from '@/lib/view';

function toggleIn(aisles: AisleVM[], itemId: string): AisleVM[] {
  return aisles.map((a) => ({
    ...a,
    items: a.items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it)),
  }));
}

export function ShoppingList({
  listId,
  estGroceries,
  aisles,
  receiptDone,
}: {
  listId: string;
  estGroceries: string;
  aisles: AisleVM[];
  receiptDone: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // in-store check-offs must feel instant — optimistic, server catches up
  const [optimisticAisles, applyOptimistic] = useOptimistic(aisles, toggleIn);
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(aisles.filter((a) => a.items.every((i) => !i.checked) && a.items.length <= 6).map((a) => a.name)),
  );
  const [leaving, setLeaving] = useState<string | null>(null);
  const [receipt, setReceipt] = useState('');

  const total = useMemo(() => optimisticAisles.reduce((n, a) => n + a.items.length, 0), [optimisticAisles]);
  const left = useMemo(
    () => optimisticAisles.reduce((n, a) => n + a.items.filter((i) => !i.checked).length, 0),
    [optimisticAisles],
  );
  const allDone = left === 0;

  const commitToggle = (itemId: string) =>
    startTransition(async () => {
      applyOptimistic(itemId);
      await toggleItem(itemId);
    });

  const toggle = (itemId: string, isChecked: boolean) => {
    if (!isChecked) {
      // checked row squishes closed, then re-enters at the bottom of its group
      setLeaving(itemId);
      setTimeout(() => {
        commitToggle(itemId);
        setLeaving(null);
      }, 180);
    } else {
      commitToggle(itemId);
    }
  };

  const submitReceipt = (value: string | null) => {
    const cents =
      value === null ? null : Math.round(Number.parseFloat(value.replace(/[^0-9.]/g, '')) * 100);
    startTransition(async () => {
      await closeReceipt(listId, Number.isFinite(cents as number) ? cents : null);
    });
  };

  const toggleCollapse = (name: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="screen">
      <div style={{ padding: '18px 20px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 className="screen-title" style={{ fontSize: 24 }}>
            Shopping list
          </h1>
          <span style={{ font: '400 13px var(--font-data)', color: 'var(--ink-faint)' }}>
            Est. {estGroceries}
          </span>
        </div>
        {!allDone && (
          <div className="screen-sub" style={{ fontSize: 13.5, marginTop: 2 }}>
            One trip · covers all 7 dinners
          </div>
        )}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${((total - left) / total) * 100}%` }} />
          </div>
          <span style={{ font: '700 12.5px var(--font-data)', color: 'var(--green-deep)', flex: 'none' }}>
            {allDone ? `All ${total} in the cart` : `${left} items left`}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 16px 20px' }}>
        {allDone && !receiptDone && (
          <div className="trip-done">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div className="trip-done__badge">✓</div>
              <div style={{ font: '700 18px var(--font-ui)', color: 'var(--green-deep)' }}>
                That&rsquo;s the whole trip
              </div>
            </div>
            <div style={{ font: '400 13.5px/1.5 var(--font-ui)', color: '#4C6244', margin: '0 0 16px 52px' }}>
              Every dinner this week is now covered.
            </div>
            <div className="receipt-card">
              <div style={{ font: '600 14.5px var(--font-ui)', marginBottom: 3 }}>
                Help SkilletFresh learn prices
              </div>
              <div style={{ font: '400 12.5px/1.45 var(--font-ui)', color: 'var(--ink-soft)', marginBottom: 12 }}>
                Add your receipt total and next week&rsquo;s estimate gets sharper. Totally optional.
              </div>
              <div className="receipt-input">
                <span style={{ font: '400 17px var(--font-data)', marginRight: 6 }}>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Receipt total"
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value)}
                  aria-label="Receipt total"
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, height: 46, fontSize: 14, color: 'var(--ink-soft)' }}
                  onClick={() => submitReceipt(null)}
                >
                  Skip
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1.4, height: 46, fontSize: 14, borderRadius: 12, boxShadow: 'none' }}
                  onClick={() => submitReceipt(receipt || null)}
                >
                  Save total
                </button>
              </div>
            </div>
          </div>
        )}

        {allDone && receiptDone && (
          <div className="trip-done">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div className="trip-done__badge">✓</div>
              <div style={{ font: '700 18px var(--font-ui)', color: 'var(--green-deep)' }}>
                That&rsquo;s the whole trip
              </div>
            </div>
            <div style={{ font: '400 13.5px/1.5 var(--font-ui)', color: '#4C6244', margin: '0 0 14px 52px' }}>
              Every dinner this week is now covered.
            </div>
            <button className="btn-primary" style={{ width: '100%', height: 48 }} onClick={() => router.push('/today')}>
              Go to tonight&rsquo;s dinner
            </button>
          </div>
        )}

        {optimisticAisles.map((aisle) => {
          const doneCount = aisle.items.filter((i) => i.checked).length;
          const aisleDone = doneCount === aisle.items.length;
          const isCollapsed = collapsed.has(aisle.name);

          if (aisleDone) {
            return (
              <div className="aisle-done" key={aisle.name}>
                <span className="aisle-done__check">✓</span>
                <span
                  style={{
                    flex: 1,
                    font: '600 14.5px var(--font-ui)',
                    color: 'var(--ink-soft)',
                    textDecoration: 'line-through',
                  }}
                >
                  {aisle.name}
                </span>
                <span style={{ font: '700 11.5px var(--font-data)', color: 'var(--ink-mute)' }}>
                  {doneCount} of {aisle.items.length}
                </span>
              </div>
            );
          }

          const open = aisle.items.filter((i) => !i.checked);
          const done = aisle.items.filter((i) => i.checked);

          return (
            <div className={`aisle${isCollapsed ? ' aisle--collapsed' : ''}`} key={aisle.name}>
              <button className="aisle__head" onClick={() => toggleCollapse(aisle.name)}>
                <span className="aisle__name">{aisle.name}</span>
                <span className="chip">
                  {isCollapsed ? `${aisle.items.length} items` : `${open.length} left`}
                </span>
                <span className="aisle__caret">{isCollapsed ? '⌄' : '⌃'}</span>
              </button>
              {!isCollapsed &&
                [...open, ...done].map((it) => (
                  <button
                    className={[
                      'item-row',
                      it.checked && 'item-row--done',
                      leaving === it.id && 'item-row--leaving',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={it.id}
                    onClick={() => toggle(it.id, it.checked)}
                  >
                    <span className={`checkbox${it.checked ? ' checkbox--done' : ''}`}>
                      {it.checked ? '✓' : ''}
                    </span>
                    <span className="item-row__name">
                      {it.name} <em>— {it.qty}</em>
                    </span>
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
