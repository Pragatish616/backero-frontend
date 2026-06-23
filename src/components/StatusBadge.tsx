import { cn } from '@/lib/utils';

type Status = 'Draft' | 'In Progress' | 'Pending Approval' | 'Approved' | 'Rejected';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { bg: string; text: string }> = {
  'Draft': {
    bg: 'bg-bg-quaternary',
    text: 'text-text-secondary',
  },
  'In Progress': {
    bg: 'bg-accent-input/12',
    text: 'text-accent-input',
  },
  'Pending Approval': {
    bg: 'bg-warning/12',
    text: 'text-warning',
  },
  'Approved': {
    bg: 'bg-success/12',
    text: 'text-success',
  },
  'Rejected': {
    bg: 'bg-error/12',
    text: 'text-error',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {status}
    </span>
  );
}
