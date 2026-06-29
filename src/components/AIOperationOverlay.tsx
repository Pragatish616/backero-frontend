import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Brain, Zap, CheckCircle2 } from 'lucide-react';

/* ── Stage messages shown sequentially while the AI works ────────── */

const DEFAULT_STAGES = [
  { icon: Sparkles, text: 'Sending to AI…' },
  { icon: Brain, text: 'Analyzing your brief…' },
  { icon: Zap, text: 'Generating results…' },
];

interface Props {
  /** When true the overlay is visible */
  active: boolean;
  /** Phase accent color (hex) — tints the spinner + text */
  accent?: string;
  /** Custom stage messages to cycle through */
  stages?: { icon?: React.ComponentType<{ size?: number }>; text: string }[];
  /** Interval between stage messages (ms) */
  interval?: number;
  /** When set to true, shows a brief "Done!" flash before unmounting */
  done?: boolean;
  /** Additional className on the wrapper */
  className?: string;
}

/**
 * Renders a frosted-glass overlay inside a `position: relative` parent.
 * Use it to wrap any card or section that is waiting on an AI response,
 * so the user sees a contextual "thinking" animation instead of stale data.
 *
 * Usage:
 * ```tsx
 * <div className="relative">
 *   <Card>…existing content…</Card>
 *   <AIOperationOverlay active={isExtracting} accent="#06D6A0" />
 * </div>
 * ```
 */
export default function AIOperationOverlay({
  active,
  accent = '#6366F1',
  stages = DEFAULT_STAGES,
  interval = 2800,
  done = false,
  className,
}: Props) {
  const [stageIdx, setStageIdx] = useState(0);

  // Cycle through stages
  useEffect(() => {
    if (!active) {
      setStageIdx(0);
      return;
    }
    const timer = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % stages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [active, stages.length, interval]);

  return (
    <AnimatePresence>
      {(active || done) && (
        <motion.div
          className={[
            'absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl',
            'backdrop-blur-sm',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ backgroundColor: 'rgba(11, 12, 15, 0.72)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Spinner ring ──────────────────────────────────── */}
          <motion.div
            className="relative mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {done ? (
              <CheckCircle2
                size={36}
                style={{ color: accent }}
                className="drop-shadow-md"
              />
            ) : (
              <>
                {/* Outer glow ring */}
                <div
                  className="absolute -inset-2 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: accent }}
                />
                <Loader2
                  size={36}
                  className="animate-spin drop-shadow-md"
                  style={{ color: accent }}
                />
              </>
            )}
          </motion.div>

          {/* ── Stage text ────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={done ? 'done' : stageIdx}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: accent }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              {done ? (
                'Done!'
              ) : (
                <>
                  {stages[stageIdx]?.icon &&
                    (() => {
                      const Icon = stages[stageIdx].icon!;
                      return <Icon size={14} />;
                    })()}
                  {stages[stageIdx]?.text}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Micro progress dots ──────────────────────────── */}
          {!done && stages.length > 1 && (
            <div className="flex gap-1.5 mt-3">
              {stages.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === stageIdx ? accent : '#252932',
                    transform: i === stageIdx ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
