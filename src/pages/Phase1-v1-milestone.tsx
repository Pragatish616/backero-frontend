import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Save,
  RefreshCw,
  Check,
  AlertTriangle,
  Link,
  Zap,
  Eye,
  Flame,
  MessageCircle,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/Card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const ACCENT = '#06D6A0';

const ACTORS = [
  'Sarah Chen',
  'Marcus Johnson',
  'Ava Kim',
  'David Park',
];

const COMPANIES = [
  'GlowUp Beauty',
  'FitLife Co',
  'TechSimplify',
  'Backero',
];

const PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube Shorts',
  'Facebook Reels',
  'Multi-Platform',
];

const LENGTHS = ['15-30s', '30-60s', '60-90s', '90-120s'];

const NICHES = ['Skincare', 'Fitness', 'Finance', 'Food', 'Tech', 'Lifestyle'] as const;
type Niche = (typeof NICHES)[number];

const SUB_NICHES: Record<Niche, string[]> = {
  Skincare: ['Anti-aging', 'Acne', 'Routines', 'Product Reviews'],
  Fitness: ['Home Workouts', 'Gym', 'Nutrition', 'Transformation'],
  Finance: ['Budgeting', 'Investing', 'Side Hustles', 'Saving'],
  Food: ['Quick Recipes', 'Meal Prep', 'Restaurant Reviews', 'Healthy Eating'],
  Tech: ['Gadgets', 'Apps', 'AI Tools', 'Coding'],
  Lifestyle: ['Productivity', 'Morning Routines', 'Travel', 'Organization'],
};

const TIME_TO_VALUE = ['0-3s', '3-5s', '5-10s', '10s+'];
const CONTENT_STYLES = ['Demonstration', 'Reaction', 'Story', 'Comparison', 'Reveal', 'Challenge'];
const COPY_ELEMENTS = [
  { label: 'Full Structure', icon: LayoutGrid, desc: 'The entire video skeleton' },
  { label: 'Hook Only', icon: Zap, desc: 'Just the opening 1-3 seconds' },
  { label: 'Visual Style', icon: Eye, desc: 'Color grading, transitions, graphics' },
  { label: 'Energy', icon: Flame, desc: 'Pacing, music, vibe' },
  { label: 'Tone', icon: MessageCircle, desc: 'Voice, personality, delivery style' },
  { label: 'Format', icon: LayoutGrid, desc: 'Scene layout, shot sequence' },
];

const FLUFF_ROWS = [
  { fluff: '"This serum is amazing"', specific: '"This serum reduced my dark spots in 14 days"' },
  { fluff: '"You should take care of your skin"', specific: '"Store your vitamin C in the fridge — it lasts 2x longer"' },
  { fluff: '"Everyone is talking about this"', specific: '"This went viral on TikTok with 2.4M views"' },
  { fluff: '"It\'s important to moisturize"', specific: '"I skipped moisturizer for a week — this is what happened"' },
  { fluff: '"The best products always work"', specific: '"Product A worked for 8/10 people I tested it on"' },
  { fluff: '"In today\'s world, skincare is essential"', specific: '"I spent $2,000 on products before learning this one hack"' },
  { fluff: '"You need to follow these tips"', specific: '"Step 1: Put it in the fridge. That\'s it."' },
  { fluff: '"This revolutionary formula changes everything"', specific: '"The pH level is 3.5 — that\'s why it actually absorbs"' },
];

const NUGGET_DATA = [
  {
    type: 'Shocking Fact' as const,
    text: '70% of vitamin C serums oxidize before you finish the bottle',
    source: "Extracted from: '70% of vitamin C serums oxidize before you finish the bottle'",
    color: '#EF4444',
    rationale: 'Curiosity gap forces the viewer to watch till the end',
  },
  {
    type: 'Practical Hack' as const,
    text: 'Store serum in the fridge — doubles effectiveness',
    source: "Extracted from: 'Store serum in the fridge — doubles effectiveness'",
    color: '#22C55E',
    rationale: 'Immediate value promise = high save/share rate',
  },
  {
    type: 'Story Hook' as const,
    text: 'I spent $2,000 on serums before learning this one trick',
    source: "Extracted from: 'I spent $2,000 on serums before learning this one trick'",
    color: '#F59E0B',
    rationale: 'Emotional investment drives completion and comment engagement',
  },
];

const BLACKLIST = ['game-changer', 'revolutionary', 'unlock', 'secret', 'mind-blowing', 'insane'];

const easeOut = [0.4, 0, 0.2, 1] as [number, number, number, number];
const spring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

/* ------------------------------------------------------------------ */
/*  Helper Components                                                 */
/* ------------------------------------------------------------------ */

function SectionNumber({ num }: { num: number }) {
  return (
    <span
      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2"
      style={{ borderColor: ACCENT, color: ACCENT }}
    >
      {num}
    </span>
  );
}

function SectionTitle({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <SectionNumber num={num} />
      <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
    </div>
  );
}

function FormLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Label className={cn('text-sm-medium text-text-secondary mb-1.5 block', className)}>
      {children}
    </Label>
  );
}

function InlineExample({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-tertiary italic mt-1">{children}</p>;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export default function Phase1() {
  const navigate = useNavigate();

  /* --- state --- */
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [creator, setCreator] = useState('');
  const [actor, setActor] = useState('');
  const [company, setCompany] = useState('');
  const [platform, setPlatform] = useState('');
  const [estimatedLength, setEstimatedLength] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [actorCount, setActorCount] = useState('1');
  const [language, setLanguage] = useState('EN');

  const [research, setResearch] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [nuggetsVisible, setNuggetsVisible] = useState(false);
  const [selectedNugget, setSelectedNugget] = useState<number | null>(null);

  const [whyNugget, setWhyNugget] = useState('');

  const [niche, setNiche] = useState('');
  const [subNiche, setSubNiche] = useState('');
  const [thePoint, setThePoint] = useState('');
  const [whyTheyCare, setWhyTheyCare] = useState('');
  const [theProof, setTheProof] = useState('');
  const [topicErrors, setTopicErrors] = useState<Record<string, string>>({});

  const [actionableTakeaway, setActionableTakeaway] = useState('');
  const [timeToValue, setTimeToValue] = useState('');
  const [contentStyle, setContentStyle] = useState('');
  const [selfChecks, setSelfChecks] = useState<Record<string, string>>({});
  const [validationChecks, setValidationChecks] = useState<Record<string, boolean>>({});

  const [refUrl, setRefUrl] = useState('');
  const [copyElement, setCopyElement] = useState('');
  const [copyDescription, setCopyDescription] = useState('');

  const [fluffCollapsed, setFluffCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* --- computed --- */
  const researchCharCount = research.length;
  const isResearchReady = researchCharCount > 200;

  const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  const validateTopicField = useCallback((value: string, key: string) => {
    const lower = value.toLowerCase();
    const found = BLACKLIST.find((w) => lower.includes(w));
    if (found) {
      setTopicErrors((prev) => ({ ...prev, [key]: `Generic phrase detected: "${found}". Be specific instead.` }));
    } else {
      setTopicErrors((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  }, []);

  const isFormValid = useMemo(() => {
    return (
      date && creator && actor && company && platform && estimatedLength && aspectRatio && actorCount && language &&
      research.length > 200 &&
      selectedNugget !== null &&
      whyNugget.length > 0 &&
      niche && subNiche && thePoint && whyTheyCare && theProof &&
      actionableTakeaway && timeToValue && contentStyle &&
      refUrl && copyElement && copyDescription
    );
  }, [date, creator, actor, company, platform, estimatedLength, aspectRatio, actorCount, language, research, selectedNugget, whyNugget, niche, subNiche, thePoint, whyTheyCare, theProof, actionableTakeaway, timeToValue, contentStyle, refUrl, copyElement, copyDescription]);

  /* --- handlers --- */
  const handleExtractNuggets = () => {
    if (!isResearchReady) return;
    setExtracting(true);
    setNuggetsVisible(false);
    setTimeout(() => {
      setExtracting(false);
      setNuggetsVisible(true);
    }, 1200);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveDraft = () => showToast('Draft saved successfully');

  const handleSubmit = () => {
    if (!isFormValid) return;
    navigate('/phase/2');
  };

  const selectedNuggetData = selectedNugget !== null ? NUGGET_DATA[selectedNugget] : null;

  /* --- render --- */
  return (
    <Layout>
      <motion.div
        className="max-w-[800px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* ============================================================ */}
        {/* SECTION 1: Page Header                                       */}
        {/* ============================================================ */}
        <motion.div variants={headerVariants} className="pt-10 pb-6">
          <motion.span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ backgroundColor: ACCENT, color: '#0B0C0F' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: spring }}
          >
            PHASE 1
          </motion.span>
          <motion.h1
            className="text-3xl font-bold text-text-primary mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
          >
            Content Input
          </motion.h1>
          <motion.p
            className="text-base text-text-secondary mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.18 }}
          >
            Paste your research. Pick your angle. We&apos;ll build the structure.
          </motion.p>
          <motion.p
            className="text-sm text-text-tertiary flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Save size={14} /> All fields auto-save. You can return anytime.
          </motion.p>
        </motion.div>

        {/* ============================================================ */}
        {/* SECTION 2: In-Phase Progress                                 */}
        {/* ============================================================ */}
        <motion.div variants={cardVariants} className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-1 w-full max-w-[280px]">
            {['ID', 'RSRCH', 'NUG', '1PT', 'TOPIC', 'VAL', 'REF'].map((label, i) => {
              const stepProgress =
                research.length > 0 ? (selectedNugget !== null ? (whyNugget ? (niche ? (actionableTakeaway ? (refUrl ? 7 : 6) : 5) : 4) : 3) : 2) : 1;
              const filled = i < stepProgress;
              const current = i === stepProgress - 1;
              return (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                  <motion.div
                    className="w-full rounded-sm transition-all duration-300"
                    style={{
                      height: current ? 6 : 4,
                      backgroundColor: filled ? ACCENT : '#252932',
                      borderRadius: 2,
                    }}
                    animate={{ height: current ? 6 : 4 }}
                    transition={{ duration: 0.2, ease: easeOut }}
                  />
                  <span className={cn('text-[10px]', filled ? 'text-text-secondary' : 'text-text-tertiary')}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* SECTION 3: The Form                                          */}
        {/* ============================================================ */}

        {/* --- Field 1: Video Identity --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={1} title="Video Identity" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <FormLabel>Production Date</FormLabel>
                <div className="relative">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-bg-tertiary border-border-subtle text-text-primary focus-visible:ring-accent-input/30 pr-10"
                  />
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>
              </div>
              {/* Creator */}
              <div>
                <FormLabel>Content Creator</FormLabel>
                <Input
                  placeholder="Your name"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30"
                />
              </div>
              {/* Actor */}
              <div>
                <FormLabel>On-Camera Actor</FormLabel>
                <Select value={actor} onValueChange={setActor}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select actor" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {ACTORS.map((a) => (
                      <SelectItem key={a} value={a} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Company */}
              <div>
                <FormLabel>Brand / Company</FormLabel>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {COMPANIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Platform */}
              <div>
                <FormLabel>Platform</FormLabel>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Length */}
              <div>
                <FormLabel>Estimated Length</FormLabel>
                <Select value={estimatedLength} onValueChange={setEstimatedLength}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {LENGTHS.map((l) => (
                      <SelectItem key={l} value={l} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ═══ Production Context ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Aspect Ratio */}
              <div>
                <FormLabel>Aspect Ratio</FormLabel>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {['9:16', '1:1', '16:9'].map((r) => (
                      <SelectItem key={r} value={r} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Actors */}
              <div>
                <FormLabel>Actors</FormLabel>
                <Select value={actorCount} onValueChange={setActorCount}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {['1', '2'].map((n) => (
                      <SelectItem key={n} value={n} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {n} actor{Number(n) > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Language */}
              <div>
                <FormLabel>Language</FormLabel>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {['EN', 'HI', 'TA', 'HIN-EN', 'TAM-EN'].map((l) => (
                      <SelectItem key={l} value={l} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="h-6" />


        {/* --- Field 2: Raw Research Dump --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={2} title="Raw Research Dump" />
            <FormLabel>Paste all your research here — articles, stats, notes, quotes, anything.</FormLabel>
            <div className="relative">
              <Textarea
                placeholder={`Paste everything here — don't worry about formatting.\n\nExample:\n- Article: "73% of SaaS companies fail because of poor onboarding"\n- My experience: We reduced churn by 40% with one email change\n- Stat: Average user attention span on Reels is 1.7 seconds\n- Competitor video got 2M views with similar hook\n- Quote from CEO interview about the pivot`}
                value={research}
                onChange={(e) => setResearch(e.target.value)}
                className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 min-h-[240px] resize-vertical"
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {isResearchReady && (
                  <motion.div
                    className="flex items-center gap-1.5"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: spring }}
                  >
                    <span
                      className="w-2 h-2 rounded-full animate-pulse-dot"
                      style={{ backgroundColor: ACCENT }}
                    />
                    <span className="text-xs text-accent-input">Ready for nugget extraction</span>
                  </motion.div>
                )}
              </div>
              <span className="text-xs text-text-tertiary">
                {researchCharCount.toLocaleString()} characters
              </span>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleExtractNuggets}
                disabled={!isResearchReady || extracting}
                className="text-sm-medium font-medium"
                style={{
                  backgroundColor: isResearchReady && !extracting ? ACCENT : undefined,
                  color: isResearchReady && !extracting ? '#0B0C0F' : undefined,
                }}
              >
                {extracting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-1.5" />
                    Extract Nuggets
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        <div className="h-6" />

        {/* --- Field 3: AI Nugget Extraction --- */}
        <AnimatePresence>
          {nuggetsVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <motion.div variants={cardVariants}>
                <Card phaseAccent={ACCENT}>
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle num={3} title="AI Nugget Extraction" />
                    <button
                      onClick={handleExtractNuggets}
                      className="flex items-center gap-1.5 text-sm text-accent-input hover:underline"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  </div>
                  <p className="text-sm-medium text-text-secondary mb-4">
                    AI extracted 3 potential hooks from your research:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {NUGGET_DATA.map((n, i) => (
                      <motion.div
                        key={n.type}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{
                          opacity: selectedNugget !== null && selectedNugget !== i ? 0.5 : 1,
                          y: 0,
                          scale: selectedNugget === i ? 1.02 : 1,
                        }}
                        transition={{
                          opacity: { duration: 0.2 },
                          scale: { duration: 0.3, ease: spring },
                          y: { duration: 0.4, ease: easeOut, delay: i * 0.1 },
                        }}
                        className={cn(
                          'rounded-xl border p-5 transition-colors duration-200',
                          selectedNugget === i
                            ? 'border-2'
                            : 'border-border-subtle bg-bg-tertiary'
                        )}
                        style={
                          selectedNugget === i
                            ? { borderColor: ACCENT, backgroundColor: 'rgba(6, 214, 160, 0.06)' }
                            : undefined
                        }
                      >
                        {/* Nugget type badge */}
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-3"
                          style={{
                            backgroundColor: `${n.color}20`,
                            color: n.color,
                            border: `1px solid ${n.color}30`,
                          }}
                        >
                          {n.type}
                        </span>

                        {/* Nugget text */}
                        <p className="text-base text-text-primary mb-3">{n.text}</p>

                        {/* Source */}
                        <p className="text-xs text-text-tertiary italic mb-4">{n.source}</p>

                        {/* Pick button */}
                        <Button
                          onClick={() => setSelectedNugget(i)}
                          variant={selectedNugget === i ? 'default' : 'outline'}
                          className="w-full text-sm-medium font-medium"
                          style={
                            selectedNugget === i
                              ? { backgroundColor: ACCENT, color: '#0B0C0F' }
                              : undefined
                          }
                        >
                          {selectedNugget === i ? (
                            <>
                              <Check size={16} className="mr-1.5" /> Selected
                            </>
                          ) : (
                            'Pick This One'
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
              <div className="h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Field 4: One Point Selector --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={4} title="One Point Selector" />
            <p className="text-sm-medium text-text-secondary mb-1">
              Which single point will this video make?
            </p>
            <p className="text-sm text-text-tertiary italic mb-5">
              One video = one point. No exceptions.
            </p>

            {selectedNuggetData ? (
              <div className="mb-5">
                <div
                  className="rounded-xl border-2 p-5 mb-4"
                  style={{ borderColor: ACCENT, backgroundColor: 'rgba(6, 214, 160, 0.04)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${selectedNuggetData.color}20`,
                        color: selectedNuggetData.color,
                      }}
                    >
                      {selectedNuggetData.type}
                    </span>
                  </div>
                  <p className="text-base-medium text-text-primary">{selectedNuggetData.text}</p>
                  <p className="text-sm text-text-secondary mt-2">{selectedNuggetData.rationale}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border-subtle bg-bg-tertiary p-5 mb-5 text-center">
                <p className="text-sm text-text-tertiary">
                  Select a nugget from the AI extraction above to see it here.
                </p>
              </div>
            )}

            <div>
              <FormLabel>
                Why This Nugget?{' '}
                <span className="text-text-tertiary font-normal">(max 40 words)</span>
              </FormLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-3 text-sm font-medium"
                  style={{ color: ACCENT }}
                >
                  A [target viewer] scrolling [platform] will stop because
                </span>
                <Textarea
                  value={whyNugget}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (wordCount(val) <= 40) setWhyNugget(val);
                  }}
                  placeholder="...this stat challenges everything they thought they knew about skincare."
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 min-h-[80px] pt-10 resize-vertical"
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: ...this shocking fact about vitamin C oxidation changes how they see their entire routine.</InlineExample>
                <span
                  className={cn(
                    'text-xs',
                    wordCount(whyNugget) > 35 ? 'text-warning' : 'text-text-tertiary'
                  )}
                >
                  {wordCount(whyNugget)}/40 words
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="h-6" />

        {/* --- Field 5: Topic (Forced Format) --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={5} title="Topic — Forced Format" />
            <p className="text-sm-medium text-text-secondary mb-3">
              Define your topic using these exact formats:
            </p>

            {/* Anti-fluff banner */}
            <motion.div
              className="rounded-lg p-3 mb-5 flex items-start gap-2.5"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                borderLeft: '3px solid #EF4444',
              }}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: easeOut, delay: 0.3 }}
            >
              <AlertTriangle size={16} className="text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                AI copypaste detected in 68% of failed videos. These forced formats break generic patterns.
              </p>
            </motion.div>

            {/* Niche & Sub-niche */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <FormLabel>Niche</FormLabel>
                <Select value={niche} onValueChange={(v) => { setNiche(v); setSubNiche(''); }}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select niche" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {NICHES.map((n) => (
                      <SelectItem key={n} value={n} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FormLabel>Sub-Niche</FormLabel>
                <Select value={subNiche} onValueChange={setSubNiche} disabled={!niche}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30 disabled:opacity-50">
                    <SelectValue placeholder={niche ? 'Select sub-niche' : 'Select niche first'} />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {niche && SUB_NICHES[niche as Niche]?.map((sn) => (
                      <SelectItem key={sn} value={sn} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                        {sn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* The Point */}
            <div className="mb-4">
              <FormLabel>
                The Point <span className="text-text-tertiary font-normal">(max 20 words)</span>
              </FormLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-2.5 text-sm font-medium"
                  style={{ color: ACCENT }}
                >
                  This video teaches
                </span>
                <Input
                  value={thePoint}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (wordCount(val) <= 20) { setThePoint(val); validateTopicField(val, 'thePoint'); }
                  }}
                  placeholder="...how to keep your vitamin C serum from oxidizing too early."
                  className={cn(
                    'bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[130px]',
                    topicErrors.thePoint && 'border-error focus-visible:ring-error/30'
                  )}
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: ...how to fix your skincare routine in under 5 minutes.</InlineExample>
                <span className="text-xs text-text-tertiary">{wordCount(thePoint)}/20 words</span>
              </div>
              {topicErrors.thePoint && (
                <p className="text-xs text-error mt-1">{topicErrors.thePoint}</p>
              )}
            </div>

            {/* Why They Care */}
            <div className="mb-4">
              <FormLabel>
                Why They Care <span className="text-text-tertiary font-normal">(max 20 words)</span>
              </FormLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-2.5 text-sm font-medium"
                  style={{ color: ACCENT }}
                >
                  They care because
                </span>
                <Input
                  value={whyTheyCare}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (wordCount(val) <= 20) { setWhyTheyCare(val); validateTopicField(val, 'whyTheyCare'); }
                  }}
                  placeholder="...nobody wants to waste money on serums that stop working halfway through."
                  className={cn(
                    'bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[136px]',
                    topicErrors.whyTheyCare && 'border-error focus-visible:ring-error/30'
                  )}
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: ...73% of people throw away oxidized product they paid good money for.</InlineExample>
                <span className="text-xs text-text-tertiary">{wordCount(whyTheyCare)}/20 words</span>
              </div>
              {topicErrors.whyTheyCare && (
                <p className="text-xs text-error mt-1">{topicErrors.whyTheyCare}</p>
              )}
            </div>

            {/* The Proof */}
            <div className="mb-2">
              <FormLabel>
                The Proof <span className="text-text-tertiary font-normal">(max 20 words)</span>
              </FormLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-2.5 text-sm font-medium"
                  style={{ color: ACCENT }}
                >
                  Trust me because
                </span>
                <Input
                  value={theProof}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (wordCount(val) <= 20) { setTheProof(val); validateTopicField(val, 'theProof'); }
                  }}
                  placeholder="...I've tested 20+ serums and the fridge trick always works."
                  className={cn(
                    'bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[120px]',
                    topicErrors.theProof && 'border-error focus-visible:ring-error/30'
                  )}
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: ...I've reduced product waste by 70% using this one method.</InlineExample>
                <span className="text-xs text-text-tertiary">{wordCount(theProof)}/20 words</span>
              </div>
              {topicErrors.theProof && (
                <p className="text-xs text-error mt-1">{topicErrors.theProof}</p>
              )}
            </div>
          </Card>
        </motion.div>

        <div className="h-6" />


        {/* --- Field 6: Value Delivery --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={6} title="Value Delivery" />

            {/* Actionable Takeaway */}
            <div className="mb-5">
              <FormLabel>
                Actionable Takeaway{' '}
                <span className="text-text-tertiary font-normal">(max 25 words)</span>
              </FormLabel>
              <div className="relative">
                <span
                  className="absolute left-3 top-2.5 text-sm font-medium"
                  style={{ color: ACCENT }}
                >
                  After watching, the viewer will be able to
                </span>
                <Input
                  value={actionableTakeaway}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (wordCount(val) <= 25) setActionableTakeaway(val);
                  }}
                  placeholder="...store their vitamin C serum correctly to double its lifespan."
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[300px]"
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>
                  Example: ...store their vitamin C serum correctly to double its lifespan.
                </InlineExample>
                <span className="text-xs text-text-tertiary">{wordCount(actionableTakeaway)}/25 words</span>
              </div>
            </div>

            {/* Time to Value & Content Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
              <div>
                <FormLabel>Content Style</FormLabel>
                <Select value={contentStyle} onValueChange={setContentStyle}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {CONTENT_STYLES.map((s) => {
                      const styleColors: Record<string, string> = {
                        Demonstration: '#22C55E',
                        Reaction: '#F59E0B',
                        Story: '#8B5CF6',
                        Comparison: '#0EA5E9',
                        Reveal: '#EF4444',
                        Challenge: '#F59E0B',
                      };
                      return (
                        <SelectItem key={s} value={s} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: styleColors[s] || '#9BA3B4' }}
                            />
                            {s}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FormLabel>Time to Value</FormLabel>
                <Select value={timeToValue} onValueChange={setTimeToValue}>
                  <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                    <SelectValue placeholder="Select timing" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-quaternary border-border-medium">
                    {TIME_TO_VALUE.map((t, i) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className={cn(
                          'text-text-primary focus:bg-bg-tertiary focus:text-text-primary',
                          i === 0 && 'bg-success/5'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {i === 0 && <Star size={12} className="text-success flex-shrink-0" />}
                          <span>
                            {t === '10s+'
                              ? '10+ seconds (slow burn, high reward)'
                              : `${t} seconds${i === 0 ? ' (immediate hook + value)' : i === 1 ? ' (hook first, value second)' : i === 2 ? ' (story setup, then payoff)' : ''}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fluff Check — Inline */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base-medium text-text-primary">Fluff Check</h3>
                <p className="text-xs text-text-tertiary">
                  Check your writing against these examples
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border-subtle">
                {/* Table Header */}
                <div
                  className="grid grid-cols-2 gap-0 text-sm-medium text-text-secondary uppercase"
                  style={{ letterSpacing: '0.05em', backgroundColor: '#252932' }}
                >
                  <div className="px-4 py-3 flex items-center gap-2 border-r border-border-subtle">
                    <XCircle size={14} className="text-error" /> FLUFF (Bad)
                  </div>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-success" /> SPECIFIC (Good)
                  </div>
                </div>
                {/* Table Rows */}
                {FLUFF_ROWS.map((row, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      'grid grid-cols-2 gap-0 text-sm',
                      i % 2 === 1 && 'bg-[rgba(255,255,255,0.015)]'
                    )}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: easeOut, delay: i * 0.04 }}
                  >
                    <div
                      className="px-4 py-3 border-r border-border-subtle text-text-secondary line-through"
                      style={{ borderLeft: '3px solid #EF4444' }}
                    >
                      {row.fluff}
                    </div>
                    <div
                      className="px-4 py-3 text-text-primary"
                      style={{ borderLeft: '3px solid #22C55E' }}
                    >
                      {row.specific}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Self-check questions */}
            <div className="mb-5">
              <h3 className="text-base-medium text-text-primary mb-3">Self-Check</h3>
              <div className="space-y-3">
                {[
                  'Does every word earn its place?',
                  'Would a viewer save or share this?',
                  'Is the takeaway actionable within 24 hours?',
                ].map((q, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                    <span className="text-sm text-text-secondary">{q}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`selfcheck-${i}`}
                          checked={selfChecks[`q${i}`] === 'yes'}
                          onChange={() => setSelfChecks((p) => ({ ...p, [`q${i}`]: 'yes' }))}
                          className="accent-accent-input"
                        />
                        <span className="text-sm text-text-secondary">Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`selfcheck-${i}`}
                          checked={selfChecks[`q${i}`] === 'no'}
                          onChange={() => setSelfChecks((p) => ({ ...p, [`q${i}`]: 'no' }))}
                          className="accent-accent-input"
                        />
                        <span className="text-sm text-text-secondary">No</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Validation */}
            <div>
              <h3 className="text-base-medium text-text-primary mb-3">Topic Validation</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'demand', label: 'Demand', desc: 'People search for this' },
                  { key: 'relevance', label: 'Relevance', desc: 'Fits our niche' },
                  { key: 'interest', label: 'Interest', desc: 'Trending or evergreen' },
                  { key: 'knowledge', label: 'Knowledge', desc: 'We have credibility' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={cn(
                      'flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors',
                      validationChecks[item.key]
                        ? 'border-accent-input bg-accent-input/5'
                        : 'border-border-subtle bg-bg-tertiary hover:bg-bg-quaternary'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                          validationChecks[item.key]
                            ? 'bg-success border-success'
                            : 'border-border-medium'
                        )}
                      >
                        {validationChecks[item.key] && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-sm-medium text-text-primary">{item.label}</span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!!validationChecks[item.key]}
                        onChange={(e) =>
                          setValidationChecks((p) => ({ ...p, [item.key]: e.target.checked }))
                        }
                      />
                    </div>
                    <span className="text-xs text-text-tertiary">{item.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="h-6" />

        {/* --- Field 7: Reference Video --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={7} title="Reference Video" />
            <p className="text-sm-medium text-text-secondary mb-1">
              What video are we learning from?
            </p>
            <p className="text-sm text-text-tertiary mb-5">
              Paste a viral video URL and tell us what to extract.
            </p>

            {/* URL Input */}
            <div className="mb-4">
              <FormLabel>Video URL</FormLabel>
              <div className="relative">
                <Link
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <Input
                  type="url"
                  placeholder="https://www.tiktok.com/@creator/video/1234567890"
                  value={refUrl}
                  onChange={(e) => setRefUrl(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-10"
                />
                {refUrl && refUrl.startsWith('http') && (
                  <CheckCircle2
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-success"
                  />
                )}
              </div>
            </div>

            {/* What are we copying */}
            <div className="mb-4">
              <FormLabel>What are we copying?</FormLabel>
              <Select value={copyElement} onValueChange={setCopyElement}>
                <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                  <SelectValue placeholder="Select element" />
                </SelectTrigger>
                <SelectContent className="bg-bg-quaternary border-border-medium">
                  {COPY_ELEMENTS.map((ce) => (
                    <SelectItem
                      key={ce.label}
                      value={ce.label}
                      className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary"
                    >
                      <div className="flex items-center gap-2">
                        <ce.icon size={14} className="text-text-secondary flex-shrink-0" />
                        <span className="text-base-medium">{ce.label}</span>
                        <span className="text-sm text-text-tertiary ml-1">— {ce.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="mb-4">
              <FormLabel>Describe what we&apos;re taking</FormLabel>
              <Textarea
                value={copyDescription}
                onChange={(e) => setCopyDescription(e.target.value)}
                placeholder="e.g., 'The rapid-fire cut sequence from 0:08 to 0:15' or 'The way they reveal the price at the end with a pause'"
                className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 min-h-[80px] resize-vertical"
              />
            </div>

            {/* Viral threshold rule */}
            <div
              className="rounded-lg p-3 flex items-start gap-2.5"
              style={{
                backgroundColor: 'rgba(6, 214, 160, 0.06)',
                borderLeft: `3px solid ${ACCENT}`,
              }}
            >
              <Sparkles size={16} className="text-accent-input flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">Viral Threshold Rule</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Video views &ge; 5x creator&apos;s subscriber count (3x for 1M+ subs)
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="h-6" />

        {/* ============================================================ */}
        {/* SECTION 4: Fluff vs Specific Reference Table                 */}
        {/* ============================================================ */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Fluff vs. Specific — Live Reference
                </h3>
                <p className="text-sm text-text-secondary">
                  Check your writing against these examples before submitting.
                </p>
              </div>
              <button
                onClick={() => setFluffCollapsed(!fluffCollapsed)}
                className="w-9 h-9 rounded-lg hover:bg-bg-tertiary flex items-center justify-center transition-colors text-text-secondary hover:text-text-primary"
              >
                {fluffCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>

            <AnimatePresence>
              {!fluffCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="overflow-hidden rounded-xl border border-border-subtle">
                    <div
                      className="grid grid-cols-2 gap-0 text-sm-medium text-text-secondary uppercase"
                      style={{ letterSpacing: '0.05em', backgroundColor: '#252932' }}
                    >
                      <div className="px-4 py-3 flex items-center gap-2 border-r border-border-subtle">
                        <XCircle size={14} className="text-error" /> FLUFF
                      </div>
                      <div className="px-4 py-3 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-success" /> SPECIFIC
                      </div>
                    </div>
                    {FLUFF_ROWS.map((row, i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          'grid grid-cols-2 gap-0 text-sm',
                          i % 2 === 1 && 'bg-[rgba(255,255,255,0.015)]'
                        )}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: easeOut, delay: i * 0.04 }}
                      >
                        <div
                          className="px-4 py-3 border-r border-border-subtle text-text-secondary line-through"
                          style={{ borderLeft: '3px solid #EF4444' }}
                        >
                          {row.fluff}
                        </div>
                        <div
                          className="px-4 py-3 text-text-primary"
                          style={{ borderLeft: '3px solid #22C55E' }}
                        >
                          {row.specific}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ============================================================ */}
        {/* SECTION 5: Form Actions                                      */}
        {/* ============================================================ */}
        <motion.div
          variants={cardVariants}
          className="mt-10 mb-16 flex flex-col sm:flex-row items-center justify-end gap-4"
        >
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto text-sm-medium font-medium border-border-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          >
            <Save size={16} className="mr-1.5" />
            Save Draft
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full sm:w-auto text-sm-medium font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              isFormValid
                ? { backgroundColor: ACCENT, color: '#0B0C0F' }
                : undefined
            }
          >
            Generate Structure &rarr;
          </Button>
        </motion.div>
      </motion.div>

      {/* ============================================================ */}
      {/* Toast Notification                                           */}
      {/* ============================================================ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border"
            style={{
              backgroundColor: '#252932',
              borderColor: '#3A4050',
            }}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            <CheckCircle2 size={16} className="text-success" />
            <span className="text-sm text-text-primary">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
