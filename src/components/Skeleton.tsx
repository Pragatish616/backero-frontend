import { cn } from '@/lib/utils';

/**
 * Base shimmer skeleton block.
 * Renders a pulsing placeholder that matches the dark UI palette.
 */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'rounded-md bg-bg-quaternary animate-skeleton-shimmer',
        className
      )}
      style={style}
    />
  );
}

/* ── Preset shapes ─────────────────────────────────────────────────── */

export function SkeletonLine({
  width = '100%',
  height = 14,
  className,
}: {
  width?: string | number;
  height?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={className}
      style={{ width, height, borderRadius: 4 }}
    />
  );
}

export function SkeletonCircle({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={className}
      style={{ width: size, height: size, borderRadius: '50%' }}
    />
  );
}

/**
 * A card-shaped skeleton that mirrors the <Card /> wrapper used in every phase.
 */
export function SkeletonCard({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-bg-secondary border border-border-subtle rounded-xl p-6 space-y-3',
        className
      )}
    >
      <SkeletonLine width="40%" height={18} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={14}
        />
      ))}
    </div>
  );
}
