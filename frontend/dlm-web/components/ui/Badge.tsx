import clsx from 'clsx';
import { DoctorStatus } from '@/lib/types/doctor';

interface BadgeProps {
  status: DoctorStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string; dot: string }> = {
  [DoctorStatus.Active]: {
    label:   'Active',
    classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot:     'bg-emerald-500',
  },
  [DoctorStatus.Expired]: {
    label:   'Expired',
    classes: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    dot:     'bg-red-500',
  },
  [DoctorStatus.Suspended]: {
    label:   'Suspended',
    classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot:     'bg-amber-500',
  },
};

export function StatusBadge({ status, className }: BadgeProps) {
  const cfg = statusConfig[status] ?? {
    label:   status,
    classes: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
    dot:     'bg-slate-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        cfg.classes,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
