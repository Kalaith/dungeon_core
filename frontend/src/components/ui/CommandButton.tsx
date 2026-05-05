import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface CommandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'ghost' | 'gold' | 'arcane';
  fullWidth?: boolean;
}

const variantClass = {
  primary:
    'border-emerald-300/40 bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:outline-emerald-200',
  danger:
    'border-rose-300/40 bg-rose-500 text-white hover:bg-rose-400 focus-visible:outline-rose-200',
  ghost:
    'border-slate-600/80 bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:outline-slate-200',
  gold:
    'border-amber-300/40 bg-amber-400 text-slate-950 hover:bg-amber-300 focus-visible:outline-amber-200',
  arcane:
    'border-violet-300/40 bg-violet-500 text-white hover:bg-violet-400 focus-visible:outline-violet-200',
};

export function CommandButton({
  children,
  variant = 'ghost',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: CommandButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${variantClass[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
