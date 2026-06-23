import { cn } from '@/lib/utils';

type Tier = 'S' | 'A' | 'B' | 'F';

interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

const tierConfig: Record<Tier, { bg: string; text: string; border: string }> = {
  'S': {
    bg: 'bg-error/15',
    text: 'text-red-300',
    border: 'border-error/30',
  },
  'A': {
    bg: 'bg-warning/15',
    text: 'text-amber-300',
    border: 'border-warning/30',
  },
  'B': {
    bg: 'bg-info/15',
    text: 'text-blue-300',
    border: 'border-info/30',
  },
  'F': {
    bg: 'bg-gray-500/15',
    text: 'text-gray-300',
    border: 'border-gray-500/30',
  },
};

export function TierBadge({ tier, className }: TierBadgeProps) {
  const config = tierConfig[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {tier}
    </span>
  );
}
