import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const phaseLabels = ['Input', 'Structure', 'Execution', 'Validation', 'Output'];
const phaseColors = ['#06D6A0', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9'];

interface PhaseProgressProps {
  currentPhase?: number; // 0 = dashboard, 1-5 = phases
  completedPhases?: number[];
}

export function PhaseProgress({ currentPhase = 0, completedPhases = [] }: PhaseProgressProps) {
  return (
    <div className="flex items-center justify-center w-full max-w-[400px] h-8">
      <div className="flex items-center w-full relative">
        {/* Connecting line background */}
        <div className="absolute left-0 right-0 top-[5px] h-0.5 bg-border-subtle -translate-y-1/2" />

        {/* Connecting line fill */}
        <motion.div
          className="absolute left-0 top-[5px] h-0.5 bg-success -translate-y-1/2"
          initial={{ width: '0%' }}
          animate={{
            width: currentPhase > 0
              ? `${((Math.min(currentPhase - 1, 4)) / 4) * 100}%`
              : '0%'
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* Phase dots */}
        <div className="flex items-center justify-between w-full relative z-10">
          {phaseLabels.map((label, index) => {
            const phaseNum = index + 1;
            const isCompleted = completedPhases.includes(phaseNum) || phaseNum < currentPhase;
            const isCurrent = phaseNum === currentPhase;
            const isUpcoming = phaseNum > currentPhase;
            const color = phaseColors[index];

            return (
              <div key={phaseNum} className="flex flex-col items-center gap-1.5">
                <motion.div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 flex items-center justify-center',
                    isCompleted && 'bg-success border-success',
                    isCurrent && 'border-[var(--dot-color)]',
                    isUpcoming && 'bg-bg-quaternary border-border-medium'
                  )}
                  style={isCurrent ? {
                    '--dot-color': color,
                    backgroundColor: color,
                    boxShadow: `0 0 0 4px ${color}33`,
                  } as React.CSSProperties : undefined}
                  animate={isCurrent ? {
                    scale: [1, 1.3, 1],
                  } : {}}
                  transition={isCurrent ? {
                    duration: 0.4,
                    ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                  } : {}}
                >
                  {isCompleted && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1.5 4L3 5.5L6.5 2"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs whitespace-nowrap',
                    isUpcoming && 'text-text-tertiary',
                    (isCurrent || isCompleted) && 'text-text-secondary'
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
