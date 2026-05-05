import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = '',
  contentClassName = '',
}: PanelProps) {
  return (
    <section
      className={`rounded-lg border border-slate-700/80 bg-slate-900/82 shadow-[0_20px_60px_rgba(0,0,0,0.28)] ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-slate-700/70 px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-100">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      <div className={contentClassName || 'p-4'}>{children}</div>
    </section>
  );
}
