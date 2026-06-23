import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  phaseAccent?: string;
  hoverable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className, phaseAccent, hoverable = true, onClick, style }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-secondary border border-border-subtle rounded-xl p-6 transition-all duration-200 ease-out',
        hoverable && phaseAccent && `hover:border-[${phaseAccent}]/30`,
        hoverable && !phaseAccent && 'hover:bg-bg-tertiary',
        hoverable && 'hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        ...(phaseAccent && hoverable ? { '--card-accent': phaseAccent } as React.CSSProperties : {}),
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (phaseAccent && hoverable) {
          e.currentTarget.style.borderColor = `${phaseAccent}4D`;
        }
      }}
      onMouseLeave={(e) => {
        if (phaseAccent && hoverable) {
          e.currentTarget.style.borderColor = '';
        }
      }}
    >
      {children}
    </div>
  );
}
