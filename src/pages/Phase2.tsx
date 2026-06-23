import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/Card';
import { TierBadge } from '@/components/TierBadge';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Shield,
  Heart,
  TrendingUp,
  CheckCircle2,
  Info,
  ChevronRight,
  Zap,
  Target,
  Star,
  Eye,
  Type,
  Volume2,
  Pencil,
  Check,
  Loader2,
} from 'lucide-react';
import { phase2 as phase2Api, ApiError } from '@/lib/api';
import { useBriefBootstrap } from '@/lib/useBriefBootstrap';

/* ═══════════════════════════════════════════════════════════════════ */
/*  CONTENT TYPE → FORMAT → STRUCTURE CORRELATION MAP                */
/* ═══════════════════════════════════════════════════════════════════ */

interface FormatStructureCombo {
  format: string;
  formatTier: string;
  structure: string;
  structureNum: number;
  recommendation: 'best' | 'good' | 'available' | 'avoid';
  why: string;
  dataCitation?: string;
}

interface ContentTypeConfig {
  label: string;
  description: string;
  cta: string;
  frequency: string;
  combos: FormatStructureCombo[];
}

const CORRELATION_MAP: Record<string, ContentTypeConfig> = {
  educational: {
    label: 'Educational',
    description: 'Teach a skill or share knowledge. Builds trust.',
    cta: 'Follow / Save',
    frequency: '3-5x/week',
    combos: [
      { format: 'Whiteboard', formatTier: 'A', structure: 'Step-by-Step', structureNum: 2, recommendation: 'best', why: 'Visual explanation + clear steps = highest retention (42.1%)', dataCitation: '2026 Short-Form Study: Whiteboard educational = 42.1% retention' },
      { format: 'Voiceover + Visuals', formatTier: 'A', structure: 'PAS (Problem→Agitate→Solution)', structureNum: 9, recommendation: 'best', why: 'Emotional arc drives engagement for pain-point topics', dataCitation: 'Buffer 2026: PAS structure increases saves 3.2x' },
      { format: 'Visual Prop Explainer', formatTier: 'S', structure: 'List Structure', structureNum: 7, recommendation: 'good', why: 'Physical props make abstract concepts tangible', dataCitation: 'Platform data: Prop explainers avg 28% higher completion' },
      { format: 'Carousel / Slide Deck', formatTier: 'S', structure: '3-Level Structure', structureNum: 8, recommendation: 'good', why: 'Carousel saves are highest on Instagram for educational', dataCitation: 'Instagram 2026: Carousels = 6.9% engagement rate, highest format' },
      { format: 'Voiceover + Visuals', formatTier: 'A', structure: 'Outcome→Pain→Solution', structureNum: 10, recommendation: 'good', why: 'Aspirational hook pulls viewers into educational content', dataCitation: 'Cross-platform: Outcome-first hooks retain 34% better' },
      { format: 'Whiteboard', formatTier: 'A', structure: 'Time-Based Experiment', structureNum: 12, recommendation: 'available', why: 'Proof-based for data-heavy educational topics', dataCitation: 'Proof content: Time-based experiments avg 2.1M views' },
    ],
  },
  entertaining_education: {
    label: 'Entertaining Education',
    description: 'Teach while entertaining. High energy, personality-driven.',
    cta: 'Follow / Save',
    frequency: '3-4x/week',
    combos: [
      { format: 'Clone (Smart vs Dumb)', formatTier: 'S', structure: 'Smart vs Dumb', structureNum: 4, recommendation: 'best', why: 'Edutainment king: contrast + personality = massive shares', dataCitation: 'TikTok 2026: Smart vs Dumb = highest share rate in edutainment' },
      { format: 'Talking Back & Forth', formatTier: 'S', structure: "Do vs Don't", structureNum: 5, recommendation: 'best', why: 'Dialogue format + personality = authentic entertainment', dataCitation: 'Platform data: Back-forth format = 45% higher watch time' },
      { format: 'Clone (Smart vs Dumb)', formatTier: 'S', structure: 'Myth Bust', structureNum: 6, recommendation: 'good', why: 'Debunking myths with personality = viral potential', dataCitation: 'Myth Bust videos avg 1.8M views on TikTok/Shorts' },
      { format: 'Trending Audio + B-roll', formatTier: 'B', structure: 'List Structure', structureNum: 7, recommendation: 'good', why: 'Trending audio boosts algorithmic distribution', dataCitation: 'TikTok: Trending audio = 3.4x reach boost' },
      { format: 'Talking Back & Forth', formatTier: 'S', structure: 'Before→After', structureNum: 11, recommendation: 'available', why: 'Personal transformation stories with personality', dataCitation: 'Before/After = highest save rate in lifestyle edutainment' },
      { format: 'Visual Prop Explainer', formatTier: 'S', structure: 'Comparison (A vs B)', structureNum: 1, recommendation: 'available', why: 'Physical demonstration with entertaining presentation', dataCitation: 'Cross-platform: Comparison props = 2.3x engagement' },
    ],
  },
  storytelling: {
    label: 'Storytelling',
    description: 'Share personal experiences. Builds followers.',
    cta: 'Follow',
    frequency: '1-2x/week',
    combos: [
      { format: 'Voiceover + Visuals', formatTier: 'A', structure: 'Story Framework', structureNum: 3, recommendation: 'best', why: 'Classic hero journey = emotional investment', dataCitation: 'Short-form study: Story framework = 38% higher completion' },
      { format: 'B-roll Only', formatTier: 'F', structure: 'Before→After', structureNum: 11, recommendation: 'good', why: 'Visual storytelling without narration = powerful transformation', dataCitation: 'Instagram: B-roll Before/After = highest DM rate' },
      { format: 'Voiceover + Visuals', formatTier: 'A', structure: 'Double Down', structureNum: 14, recommendation: 'available', why: 'Repurpose proven personal stories with new twist', dataCitation: 'Double Down = 2.1x efficiency for storytelling creators' },
    ],
  },
  authority: {
    label: 'Authority / Trust',
    description: 'Prove credibility. Case studies, results. Generates leads.',
    cta: 'Comment → DM',
    frequency: '1x/week',
    combos: [
      { format: 'Clone (Smart vs Dumb)', formatTier: 'S', structure: 'Comparison (A vs B)', structureNum: 1, recommendation: 'best', why: 'Authority through clear comparison = trust building', dataCitation: 'B2B data: Comparison content = 4.2x lead gen' },
      { format: 'Whiteboard', formatTier: 'A', structure: 'Myth Bust', structureNum: 6, recommendation: 'best', why: 'Debunking myths positions you as the expert', dataCitation: 'Authority study: Myth Bust = 3.1x credibility boost' },
      { format: 'Carousel / Slide Deck', formatTier: 'S', structure: 'Cost Breakdown', structureNum: 15, recommendation: 'good', why: 'Carousel saves for financial/proof content = highest', dataCitation: 'Instagram: Carousel saves = 109% more than Reels' },
      { format: 'Visual Prop Explainer', formatTier: 'S', structure: 'Time-Based Experiment', structureNum: 12, recommendation: 'good', why: 'Show real results with physical evidence', dataCitation: 'Proof content: Experiment format = 2.8x trust score' },
      { format: 'Whiteboard', formatTier: 'A', structure: 'Fake Case Study', structureNum: 13, recommendation: 'available', why: 'Teach through realistic scenario = expertise demonstration', dataCitation: 'Case study content = 3.5x longer dwell time' },
    ],
  },
  personal: {
    label: 'Personal / Relatable',
    description: 'Behind-the-scenes, personality. Builds community.',
    cta: 'Follow',
    frequency: '1-2x/week',
    combos: [
      { format: 'Talking Back & Forth', formatTier: 'S', structure: 'Story Framework', structureNum: 3, recommendation: 'best', why: 'Conversational + personal = community building', dataCitation: 'Community data: Back-forth personal = 52% higher follow rate' },
      { format: 'Trending Audio + B-roll', formatTier: 'B', structure: 'Before→After', structureNum: 11, recommendation: 'good', why: 'Trending + personal transformation = algorithm boost', dataCitation: 'TikTok: Trending audio personal content = 2.9x reach' },
      { format: 'B-roll Only', formatTier: 'F', structure: 'Double Down', structureNum: 14, recommendation: 'available', why: 'Low-production personal content for consistency', dataCitation: 'B-roll personal = lowest production, highest frequency' },
    ],
  },
  trending: {
    label: 'Trending / Entertainment',
    description: 'Ride trends, participate in challenges. Algorithm boost.',
    cta: 'Share / Comment',
    frequency: 'As needed',
    combos: [
      { format: 'Trending Audio + B-roll', formatTier: 'B', structure: 'Comparison (A vs B)', structureNum: 1, recommendation: 'best', why: 'Trending audio + A vs B debate = viral formula', dataCitation: 'TikTok 2026: Trending audio + comparison = 4.1x shares' },
      { format: 'Clone (Smart vs Dumb)', formatTier: 'S', structure: 'Smart vs Dumb', structureNum: 4, recommendation: 'best', why: 'Personality-driven contrast = entertainment gold', dataCitation: 'Smart vs Dumb = #1 most-shared format on TikTok' },
      { format: 'Trending Audio + B-roll', formatTier: 'B', structure: "Do vs Don't", structureNum: 5, recommendation: 'good', why: "Simple binary choice + trend = easy engagement", dataCitation: "Do/Don't + trending = 2.7x comment rate" },
      { format: 'Carousel / Slide Deck', formatTier: 'S', structure: 'List Structure', structureNum: 7, recommendation: 'good', why: 'Carousel + list = save-worthy trend content', dataCitation: 'Instagram: List carousels = highest save-to-reach ratio' },
      { format: 'Talking Back & Forth', formatTier: 'S', structure: 'Fake Case Study', structureNum: 13, recommendation: 'available', why: 'Entertaining scenario-based content', dataCitation: 'Scenario content = 1.9x share rate on entertainment' },
    ],
  },
};

/* ── Platform-specific boosts ── */
const PLATFORM_BOOSTS: Record<string, Record<string, number>> = {
  Instagram: { 'Carousel / Slide Deck': 1, 'Visual Prop Explainer': 1 },
  TikTok: { 'Trending Audio + B-roll': 1, 'Clone (Smart vs Dumb)': 1 },
  'YouTube Shorts': { 'Whiteboard': 1, 'Voiceover + Visuals': 1 },
  'Facebook Reels': { 'Talking Back & Forth': 1, 'B-roll Only': 1 },
};

/* ── Recommendation config for badges & borders ── */
const REC_CONFIG: Record<string, { label: string; color: string; borderColor: string; bgColor: string }> = {
  best:     { label: 'Best Match',  color: '#22C55E', borderColor: 'rgba(34,197,94,0.5)',  bgColor: 'rgba(34,197,94,0.1)'  },
  good:     { label: 'Good Fit',    color: '#3B82F6', borderColor: 'rgba(59,130,246,0.5)', bgColor: 'rgba(59,130,246,0.1)' },
  available:{ label: 'Available',   color: '#5C6370', borderColor: 'rgba(92,99,112,0.5)',  bgColor: 'rgba(92,99,112,0.1)'  },
  avoid:    { label: 'Avoid',       color: '#EF4444', borderColor: 'rgba(239,68,68,0.5)',  bgColor: 'rgba(239,68,68,0.1)'  },
};

/* ── Content type icon map ── */
const CONTENT_ICONS: Record<string, typeof GraduationCap> = {
  educational:            GraduationCap,
  entertaining_education: Sparkles,
  storytelling:           BookOpen,
  authority:              Shield,
  personal:               Heart,
  trending:               TrendingUp,
};

/* ── Content type color accents ── */
const CONTENT_ACCENT: Record<string, string> = {
  educational:            '#3B82F6',
  entertaining_education: '#F59E0B',
  storytelling:           '#8B5CF6',
  authority:              '#10B981',
  personal:               '#EC4899',
  trending:               '#EF4444',
};

/* ── Platform types ── */
const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'YouTube Shorts', 'Facebook Reels'] as const;
type PlatformOption = (typeof PLATFORM_OPTIONS)[number];

/* ──────────── Hook State Type ──────────── */
interface HookState {
  status: 'pending' | 'approved' | 'editing';
  content: string;
  original: string;
  rating: 'BAD' | 'GOOD' | 'GREAT';
  visualQuality?: 'BAD' | 'GOOD' | 'GREAT';
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

export default function Phase2() {
  const navigate = useNavigate();
  const { briefId, loading: briefLoading, error: briefError, retry: retryBrief } = useBriefBootstrap();

  /* ── State ── */
  const [contentType, setContentType] = useState('educational');
  const [aiRecommendedType] = useState('educational');
  const [platform, setPlatform] = useState<PlatformOption>('TikTok');
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);
  const [ctaText, setCtaText] = useState('Follow for more skincare hacks');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── Hook state ── */
  const [hooks, setHooks] = useState<Record<string, HookState>>({
    visual: { status: 'pending', content: 'Close-up of woman holding two serum bottles, shocked expression', original: 'Close-up of woman holding two serum bottles, shocked expression', rating: 'GOOD', visualQuality: 'GOOD' },
    written: { status: 'pending', content: 'I wasted $2,000 on THIS', original: 'I wasted $2,000 on THIS', rating: 'GOOD' },
    audio: { status: 'pending', content: 'Energetic, slightly angry: "Stop buying serums!"', original: 'Energetic, slightly angry: "Stop buying serums!"', rating: 'GOOD' },
  });

  const [editText, setEditText] = useState<Record<string, string>>({});

  const allHooksApproved = Object.values(hooks).every((h) => h.status === 'approved');

  /* ── Load existing Phase 2 data (and Phase 1's platform) for this brief ── */
  useEffect(() => {
    if (!briefId) return;
    phase2Api
      .get(briefId)
      .then((res) => {
        const d = res.data;
        if (d.content_type) setContentType(d.content_type);
        if (d.selected_format && d.selected_structure) {
          setSelectedCombo(`${d.selected_format}|${d.selected_structure}`);
        }
        if (d.cta_text) setCtaText(d.cta_text);
        if (res.platform) setPlatform(res.platform as PlatformOption);
      })
      .catch(() => {
        /* No Phase 2 data saved yet — fine, keep defaults. */
      });
  }, [briefId]);

  /* ── Derived data ── */
  const currentConfig = CORRELATION_MAP[contentType];

  const sortedCombos = useMemo(() => {
    const combos = currentConfig?.combos ?? [];
    const order = { best: 0, good: 1, available: 2, avoid: 3 };
    return [...combos].sort((a, b) => order[a.recommendation] - order[b.recommendation]);
  }, [currentConfig]);

  /* ── Handlers ── */
  const handleComboSelect = (format: string, structure: string) => {
    setSelectedCombo(`${format}|${structure}`);
  };

  const selectedComboData = useMemo(() => {
    if (!selectedCombo) return null;
    const [format, structure] = selectedCombo.split('|');
    return sortedCombos.find((c) => c.format === format && c.structure === structure) ?? null;
  }, [selectedCombo, sortedCombos]);

  const handleBack = () => navigate('/phase/1');

  const handleContinue = () => {
    if (!allHooksApproved || !briefId) return;
    setSaving(true);
    setSaveError(null);
    const [format, structure] = selectedCombo ? selectedCombo.split('|') : [null, null];
    phase2Api
      .save(briefId, {
        content_type: contentType,
        selected_format: format,
        selected_structure: structure,
        format_tier: selectedComboData?.formatTier ?? null,
        recommendation_level: selectedComboData?.recommendation ?? null,
        platform_boost_applied: false,
        cta_text: ctaText,
        cta_type: currentConfig?.cta ?? null,
      })
      .then(() => phase2Api.advance(briefId))
      .then(() => navigate('/phase/3'))
      .catch((err: unknown) => {
        setSaveError(err instanceof ApiError ? err.message : 'Could not continue — backend unreachable');
      })
      .finally(() => setSaving(false));
  };

  const handleHookEdit = (key: string) => {
    setHooks((prev) => ({ ...prev, [key]: { ...prev[key], status: 'editing' } }));
    setEditText((prev) => ({ ...prev, [key]: hooks[key].content }));
  };

  const handleHookSave = (key: string) => {
    setHooks((prev) => ({
      ...prev,
      [key]: { ...prev[key], status: 'pending', content: editText[key] || prev[key].content },
    }));
  };

  const handleHookCancel = (key: string) => {
    setHooks((prev) => ({ ...prev, [key]: { ...prev[key], status: 'pending' } }));
  };

  const handleHookApprove = (key: string) => {
    setHooks((prev) => ({ ...prev, [key]: { ...prev[key], status: 'approved' } }));
  };

  const setHookRating = (key: string, rating: 'BAD' | 'GOOD' | 'GREAT') => {
    setHooks((prev) => ({ ...prev, [key]: { ...prev[key], rating } }));
  };

  const setVisualQuality = (key: string, visualQuality: 'BAD' | 'GOOD' | 'GREAT') => {
    setHooks((prev) => ({ ...prev, [key]: { ...prev[key], visualQuality } }));
  };

  /* ── Render helpers ── */
  const pageAccent = '#F59E0B';

  return (
    <Layout>
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ═══════════════ Page Header ═══════════════ */}
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ backgroundColor: `${pageAccent}22` }}
          >
            <span className="text-2xl font-bold" style={{ color: pageAccent }}>2</span>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-text-primary mb-2"
          >
            Phase 2: Structure
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary text-center max-w-md"
          >
            AI-generated skeleton: content type, format, script template, hooks.
          </motion.p>
          {briefError && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm flex items-center justify-between gap-4 max-w-md w-full">
              <span>{briefError}</span>
              <button onClick={retryBrief} className="underline shrink-0">Retry</button>
            </div>
          )}
          {!briefError && briefId && (
            <p className="text-xs text-text-tertiary mt-2">
              Brief ID: <span className="font-mono">{briefId}</span>
              {briefLoading ? ' — loading…' : ''}
            </p>
          )}
        </div>

        {/* ═══════════════ Section 1: Content Type ═══════════════ */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                 style={{ backgroundColor: `${pageAccent}22`, color: pageAccent }}>
              1
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Content Type</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4 ml-11">
            Choose your content strategy. Format & structure combos will auto-filter.
          </p>

          <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
            {Object.entries(CORRELATION_MAP).map(([key, config]) => {
              const Icon = CONTENT_ICONS[key];
              const accent = CONTENT_ACCENT[key];
              const isSelected = contentType === key;
              const isAiRecommended = aiRecommendedType === key;

              return (
                <motion.div
                  key={key}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    phaseAccent={pageAccent}
                    hoverable
                    onClick={() => {
                      setContentType(key);
                      setSelectedCombo(null);
                    }}
                    className={isSelected ? 'relative border-2 border-accent-structure p-3' : 'relative p-3'}
                  >
                    {/* AI Recommended badge */}
                    {isAiRecommended && (
                      <div className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning/20 text-warning border border-warning/30 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5" />
                        AI
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mb-1.5"
                           style={{ backgroundColor: `${accent}18`, color: accent }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <span className="text-xs font-semibold text-text-primary leading-tight">
                            {config.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary mb-1.5 leading-tight line-clamp-2">{config.description}</p>
                        <div className="flex items-center justify-center gap-2 text-[9px] text-text-tertiary">
                          <span className="flex items-center gap-0.5">
                            <Target className="w-2.5 h-2.5" />
                            {config.cta}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            {config.frequency}
                          </span>
                        </div>
                      </div>

                      {/* Radio circle */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-1.5 ${
                        isSelected ? 'border-accent-structure' : 'border-text-tertiary'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-accent-structure" />}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════ Section 2: Format & Structure (MERGED) ═══════════════ */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                 style={{ backgroundColor: `${pageAccent}22`, color: pageAccent }}>
              2
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Format &amp; Structure</h2>
          </div>
          <p className="text-sm text-text-secondary mb-3 ml-11">
            Auto-filtered based on your content type. Each combo pairs a production format with a proven script structure.
          </p>

          {/* Info bar */}
          <div className="ml-11 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary border border-border-subtle">
            <Info className="w-4 h-4 text-accent-structure flex-shrink-0" />
            <p className="text-xs text-text-secondary">
              Showing <strong className="text-text-primary">{sortedCombos.length}</strong> combos recommended for{' '}
              <strong className="text-text-primary">{currentConfig?.label}</strong>.{' '}
              Data from Buffer 2026, TikTok/Instagram platform studies.
            </p>
          </div>

          {/* Platform selector */}
          <div className="ml-11 mb-4 flex items-center gap-2">
            <span className="text-xs text-text-tertiary">Platform:</span>
            <div className="flex gap-1.5">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={
                    platform === p
                      ? 'px-2.5 py-1 rounded-lg text-xs font-medium transition-all bg-accent-structure/20 text-accent-structure border border-accent-structure/30'
                      : 'px-2.5 py-1 rounded-lg text-xs font-medium transition-all bg-bg-tertiary text-text-tertiary border border-border-subtle hover:text-text-secondary'
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Combo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {sortedCombos.map((combo, idx) => {
                const comboKey = `${combo.format}|${combo.structure}`;
                const isSelected = selectedCombo === comboKey;
                const recConfig = REC_CONFIG[combo.recommendation];
                const isBoosted = PLATFORM_BOOSTS[platform]?.[combo.format] !== undefined;

                return (
                  <motion.div
                    key={comboKey}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                  >
                    <Card
                      hoverable
                      onClick={() => handleComboSelect(combo.format, combo.structure)}
                      className={isSelected ? 'relative' : 'relative'}
                      style={
                        isSelected
                          ? {
                              borderColor: recConfig.borderColor,
                              boxShadow: `0 0 20px ${recConfig.bgColor}`,
                              borderWidth: '2px',
                            }
                          : undefined
                      }
                    >
                      {/* Recommendation badge */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: recConfig.bgColor,
                            color: recConfig.color,
                          }}
                        >
                          {recConfig.label}
                        </span>
                        {isBoosted && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-info/10 text-info border border-info/20 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Boosted on {platform}
                          </span>
                        )}
                      </div>

                      {/* Format + Structure */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <TierBadge tier={combo.formatTier as 'S' | 'A' | 'B' | 'F'} />
                          <span className="text-sm font-semibold text-text-primary">
                            {combo.format}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
                          <span className="text-accent-structure font-bold">
                            #{combo.structureNum}
                          </span>
                          <span className="text-text-secondary">
                            {combo.structure}
                          </span>
                        </div>
                      </div>

                      {/* Why it works */}
                      <p className="text-xs text-text-secondary mb-2 leading-relaxed">
                        {combo.why}
                      </p>

                      {/* Data citation */}
                      {combo.dataCitation && (
                        <p className="text-[10px] text-text-tertiary mb-3 italic">
                          {combo.dataCitation}
                        </p>
                      )}

                      {/* Radio selector */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-accent-structure' : 'border-text-tertiary'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-accent-structure" />}
                        </div>
                        <span className="text-[10px] text-text-tertiary">
                          {isSelected ? 'Selected' : 'Click to select'}
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Custom Combo Card */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4"
          >
            <div className="rounded-xl border-2 border-dashed border-border-medium p-4 text-center cursor-pointer hover:border-accent-structure/50 hover:bg-bg-tertiary transition-all group">
              <p className="text-sm font-semibold text-text-secondary group-hover:text-accent-structure transition-colors">
                + Add Custom Format/Structure Combo
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Define your own correlated combos (unlimited slots)
              </p>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════ Section 3: Hook Framework ═══════════════ */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                 style={{ backgroundColor: `${pageAccent}22`, color: pageAccent }}>
              3
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Hook Framework</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4 ml-11">
            Review each hook type. Approve or edit.
          </p>

          <div className="space-y-4 ml-11">
            {([
              { key: 'visual', label: 'Visual Hook', icon: Eye, iconColor: '#EF4444', example: 'Close-up of woman holding two serum bottles, shocked expression' },
              { key: 'written', label: 'Written Hook', icon: Type, iconColor: '#06D6A0', example: 'I wasted $2,000 on THIS' },
              { key: 'audio', label: 'Audio Hook', icon: Volume2, iconColor: '#8B5CF6', example: 'Energetic, slightly angry: "Stop buying serums!"' },
            ] as const).map((hookDef) => {
              const key = hookDef.key;
              const hook = hooks[key];
              const Icon = hookDef.icon;
              const isEditing = hook.status === 'editing';

              return (
                <Card
                  key={key}
                  phaseAccent={hook.status === 'approved' ? '#22C55E' : undefined}
                  className={hook.status === 'approved' ? 'border border-green-500/50' : ''}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" style={{ color: hookDef.iconColor }} />
                      <span className="text-base font-semibold text-text-primary">{hookDef.label}</span>
                    </div>
                    {hook.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/12 text-green-500">
                        <Check className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {hook.status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/12 text-amber-500">
                        Pending Review
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="py-2">
                    {isEditing ? (
                      <textarea
                        value={editText[key] || ''}
                        onChange={(e) => setEditText((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-[#1A1D27] border border-[#2A2E3A] rounded-lg p-3 text-sm text-text-primary focus:border-border-medium focus:outline-none resize-y min-h-[80px]"
                        maxLength={key === 'written' ? 50 : undefined}
                      />
                    ) : (
                      <p className="text-sm text-text-primary">{hook.content}</p>
                    )}
                    {key === 'written' && !isEditing && (
                      <span className="text-xs text-text-tertiary mt-1 block">{hook.content.split(' ').length}/8 words</span>
                    )}
                  </div>

                  {/* Quality Rating */}
                  <div className="border-t border-border-subtle pt-3 mt-3">
                    <span className="text-xs font-medium text-text-secondary block mb-2">Quality Rating</span>
                    <div className="flex gap-2">
                      {(['BAD', 'GOOD', 'GREAT'] as const).map((r) => {
                        const isSelected = hook.rating === r;
                        const rColor = r === 'BAD' ? '#EF4444' : r === 'GOOD' ? '#F59E0B' : '#22C55E';
                        return (
                          <button
                            key={r}
                            onClick={() => setHookRating(key, r)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all duration-150 ${isSelected ? 'scale-105' : ''}`}
                            style={{
                              backgroundColor: isSelected ? rColor : `${rColor}18`,
                              color: isSelected ? '#fff' : rColor,
                            }}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                    {hook.rating === 'GREAT' && (
                      <div className="mt-2 text-xs text-text-tertiary">
                        Stops scroll in &lt;1s · Creates curiosity gap · Matches content type · Under 8 words or under 3s visual
                      </div>
                    )}
                    {hook.rating === 'GOOD' && (
                      <div className="mt-2 text-xs text-text-tertiary">
                        Some motion · Color contrast present · Text + visual combined
                      </div>
                    )}
                    {hook.rating === 'BAD' && (
                      <div className="mt-2 text-xs text-red-400">
                        REJECT — Must rewrite: Static image · No movement in first 2s · Text-only opening
                      </div>
                    )}
                  </div>

                  {/* Visual Hook Quality — SEPARATE rating */}
                  {key === 'visual' && (
                    <div className="border-t border-border-subtle pt-3 mt-3">
                      <span className="text-xs font-medium text-text-secondary block mb-2">Visual Hook Quality</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(['BAD', 'GOOD', 'GREAT'] as const).map((r) => {
                          const isSelected = hook.visualQuality === r;
                          const rColor = r === 'BAD' ? '#EF4444' : r === 'GOOD' ? '#F59E0B' : '#22C55E';
                          return (
                            <button
                              key={r}
                              onClick={() => setVisualQuality(key, r)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${isSelected ? 'scale-105' : ''}`}
                              style={{ backgroundColor: isSelected ? rColor : `${rColor}18`, color: isSelected ? '#fff' : rColor }}
                            >
                              {r}
                            </button>
                          );
                        })}
                        <span className="text-xs text-text-tertiary ml-2">
                          {hook.visualQuality === 'GREAT' && 'Pattern interrupt · Movement in first 0.5s · No text needed'}
                          {hook.visualQuality === 'GOOD' && 'Some motion · Color contrast present · Text + visual combined'}
                          {hook.visualQuality === 'BAD' && 'Static image · No movement in first 2s · Text-only opening'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleHookCancel(key)}
                          className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleHookSave(key)}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-[#0B0C0F] transition-all hover:-translate-y-px"
                          style={{ backgroundColor: pageAccent }}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleHookEdit(key)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-medium hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleHookApprove(key)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#0B0C0F] transition-all hover:-translate-y-px active:translate-y-0"
                          style={{ backgroundColor: pageAccent }}
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ═══════════════ Section 4: CTA ═══════════════ */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                 style={{ backgroundColor: `${pageAccent}22`, color: pageAccent }}>
              4
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Call to Action</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4 ml-11">
            Matched CTA type: <strong className="text-accent-structure">{currentConfig?.cta}</strong>
          </p>

          <div className="ml-11">
            <Card phaseAccent={pageAccent}>
              <div className="space-y-4">
                {/* CTA type pills */}
                <div className="flex flex-wrap gap-2">
                  {['Follow / Save', 'Follow', 'Comment → DM', 'Share / Comment'].map((ctaType) => {
                    const isActive = currentConfig?.cta === ctaType;
                    return (
                      <span
                        key={ctaType}
                        className={
                          isActive
                            ? 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-accent-structure/20 text-accent-structure border border-accent-structure/30'
                            : 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-bg-tertiary text-text-tertiary border border-border-subtle'
                        }
                      >
                        {ctaType}
                      </span>
                    );
                  })}
                </div>

                {/* CTA text input */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Your CTA Text
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-structure/50 transition-colors"
                    placeholder="Enter your call to action..."
                  />
                </div>

                {/* Preview */}
                <div className="p-3 rounded-lg bg-bg-tertiary border border-border-subtle">
                  <p className="text-[10px] text-text-tertiary mb-1 uppercase tracking-wide">Preview</p>
                  <p className="text-sm text-text-primary">
                    &ldquo;{ctaText || 'Follow for more skincare hacks'}&rdquo;
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ═══════════════ Selection Summary ═══════════════ */}
        <AnimatePresence>
          {selectedCombo && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="mb-16"
            >
              <Card phaseAccent={pageAccent} className="border-accent-structure/40">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent-structure flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Selected:{" "}
                      <span className="text-accent-structure">{selectedCombo.split('|')[0]}</span>
                      {" → "}
                      <span className="text-accent-structure">{selectedCombo.split('|')[1]}</span>
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      This format + structure combo will be used to generate your script skeleton in the next phase.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ═══════════════ Footer Navigation ═══════════════ */}
        {saveError && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            {saveError}
          </div>
        )}
        <div className="flex items-center justify-between pt-8 border-t border-border-subtle">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Phase 1
          </button>
          <button
            onClick={handleContinue}
            disabled={!allHooksApproved || saving || !briefId}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-text-inverse transition-opacity ${
              allHooksApproved && !saving ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ backgroundColor: pageAccent }}
            title={allHooksApproved ? '' : 'Approve all 3 hooks to continue'}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Continue to Phase 3
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </Layout>
  );
}
