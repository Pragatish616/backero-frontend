import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { SkeletonCard, SkeletonLine } from '@/components/Skeleton';

const PHASE_META: Record<
  number,
  { label: string; accent: string; loadingHint: string }
> = {
  1: {
    label: 'Input & Briefing',
    accent: '#06D6A0',
    loadingHint: 'Loading your brief data…',
  },
  2: {
    label: 'Content Structure',
    accent: '#F59E0B',
    loadingHint: 'Loading structure choices…',
  },
  3: {
    label: 'Screenplay',
    accent: '#EF4444',
    loadingHint: 'Loading screenplay scenes…',
  },
  4: {
    label: 'Quality Gate',
    accent: '#8B5CF6',
    loadingHint: 'Loading quality checks…',
  },
  5: {
    label: 'Production Pack',
    accent: '#0EA5E9',
    loadingHint: 'Loading production pack…',
  },
  6: {
    label: 'Prompt Pipeline',
    accent: '#EC4899',
    loadingHint: 'Loading prompt graph…',
  },
};

interface Props {
  phase: number;
  /** Override the default hint text */
  hint?: string;
}

/**
 * Drop-in replacement for the phase page body while the initial data
 * fetch is in-flight.  Renders inside <Layout> so the sidebar / top bar
 * stay visible and interactive — the user never sees a blank white flash.
 */
export default function PhaseLoadingScreen({ phase, hint }: Props) {
  const meta = PHASE_META[phase] ?? PHASE_META[1]!;
  const accent = meta.accent;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {/* ── Header skeleton ──────────────────────────────────── */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accent}20` }}
            >
              <Loader2
                size={18}
                className="animate-spin"
                style={{ color: accent }}
              />
            </div>
            <div className="space-y-1.5">
              <SkeletonLine width={220} height={22} />
              <SkeletonLine width={140} height={12} />
            </div>
          </div>
        </motion.div>

        {/* ── Loading message ──────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-2 text-sm"
          style={{ color: accent }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <Loader2 size={14} className="animate-spin" />
          {hint ?? meta.loadingHint}
        </motion.div>

        {/* ── Progress bar skeleton ────────────────────────────── */}
        <motion.div
          className="flex gap-1 max-w-[280px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-sm bg-bg-quaternary animate-skeleton-shimmer"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </motion.div>

        {/* ── Content skeleton cards ──────────────────────────── */}
        {[3, 4, 2].map((lines, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
          >
            <SkeletonCard lines={lines} />
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
