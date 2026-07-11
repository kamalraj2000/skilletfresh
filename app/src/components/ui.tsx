import { DAY_LETTERS, TODAY_INDEX } from '@/lib/data';

export function Photo({
  p1,
  p2,
  size,
  radius = 12,
  label,
  className,
  style,
}: {
  p1: string;
  p2: string;
  size?: number;
  radius?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`photo${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(140deg, ${p1}, ${p2})`,
        ...style,
      }}
    >
      {label && <span className="photo__label">{label}</span>}
    </div>
  );
}

export function Chip({
  green,
  fit,
  updated,
  children,
}: {
  green?: boolean;
  fit?: boolean;
  updated?: boolean;
  children: React.ReactNode;
}) {
  const mod = fit ? ' chip--fit' : updated ? ' chip--updated' : green ? ' chip--green' : '';
  return <span className={`chip${mod}`}>{children}</span>;
}

export type DayStatus = 'band' | 'today' | 'skip' | 'up';

export function WeekStrip({
  statuses,
  popIndex,
}: {
  statuses: DayStatus[];
  popIndex?: number;
}) {
  return (
    <div className="week-strip">
      {statuses.map((s, i) => (
        <div className="week-strip__day" key={i}>
          <span className="week-strip__label">{DAY_LETTERS[i]}</span>
          <span
            className={[
              'week-strip__dot',
              s === 'band' && 'week-strip__dot--band',
              s === 'band' && i === popIndex && 'week-strip__dot--band-pop',
              s === 'today' && 'week-strip__dot--today',
              s === 'skip' && 'week-strip__dot--skip',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        </div>
      ))}
    </div>
  );
}

/** week strip derived from what's been logged so far */
export function stripStatuses(loggedToday: 'band' | 'skip' | null): DayStatus[] {
  return DAY_LETTERS.map((_, i) => {
    if (i < TODAY_INDEX) return 'band';
    if (i === TODAY_INDEX) return loggedToday ?? 'today';
    return 'up';
  });
}
