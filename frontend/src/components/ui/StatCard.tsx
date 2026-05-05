import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'mana' | 'gold' | 'souls' | 'danger' | 'neutral' | 'growth';
  meterValue?: number;
}

const toneClass = {
  mana: 'border-sky-300/25 bg-sky-500/10 text-sky-100',
  gold: 'border-amber-300/25 bg-amber-500/10 text-amber-100',
  souls: 'border-violet-300/25 bg-violet-500/10 text-violet-100',
  danger: 'border-rose-300/25 bg-rose-500/10 text-rose-100',
  growth: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100',
  neutral: 'border-slate-600/80 bg-slate-800/80 text-slate-100',
};

export function StatCard({
  label,
  value,
  detail,
  tone = 'neutral',
  meterValue,
}: StatCardProps) {
  const width = Math.max(0, Math.min(100, meterValue ?? 0));

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass[tone]}`}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-normal opacity-75">
        {label}
      </div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div className="text-lg font-bold leading-none">{value}</div>
        {detail ? <div className="text-[0.68rem] opacity-80">{detail}</div> : null}
      </div>
      {meterValue !== undefined ? (
        <progress
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/35 accent-current"
          value={width}
          max={100}
          aria-label={`${label} meter`}
        />
      ) : null}
    </div>
  );
}
