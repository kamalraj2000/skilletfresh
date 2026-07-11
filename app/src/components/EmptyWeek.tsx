export function EmptyWeek() {
  return (
    <div className="screen" style={{ justifyContent: 'center', textAlign: 'center', padding: '0 32px' }}>
      <div style={{ font: '700 20px var(--font-ui)', marginBottom: 8 }}>No plan yet</div>
      <div style={{ font: '400 14px/1.5 var(--font-ui)', color: 'var(--ink-soft)' }}>
        Your week of dinners arrives Sunday at 6&nbsp;PM.
      </div>
    </div>
  );
}
