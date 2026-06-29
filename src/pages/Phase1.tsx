import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Save,
  Check,
  AlertTriangle,
  Link,
  Zap,
  Eye,
  Flame,
  MessageCircle,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  Loader2,
  Paperclip,
  ChevronDown,
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
import { phase1 as phase1Api, type KnowledgeNugget, ApiError } from '@/lib/api';
import { useBriefBootstrap } from '@/lib/useBriefBootstrap';
import PhaseLoadingScreen from '@/components/PhaseLoadingScreen';
import AIOperationOverlay from '@/components/AIOperationOverlay';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const ACCENT = '#06D6A0';

const PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube Shorts',
  'Facebook Reels',
  'Multi-Platform',
];

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

/* DEFAULT_FLUFF_ROWS removed — all fluff examples are now AI-generated per niche+topic+language */

/* Hardcoded nugget fallback removed — nuggets come from AI extraction or saved data only */

const BLACKLIST = ['game-changer', 'revolutionary', 'unlock', 'secret', 'mind-blowing', 'insane'];

const DELIVERY_STYLES = [
  'Storyteller / Narrative',
  'Teacher / Explainer',
  'Hype / Energetic',
  'Deadpan / Dry Humor',
  'Conversational / Friend',
  'Confrontational / Debate',
] as const;

const AUDIENCE_LEVELS = [
  { value: 'Total Beginners', label: 'Total Beginners' },
  { value: 'Some Knowledge', label: 'Some Knowledge' },
  { value: 'Advanced / Experts', label: 'Advanced / Experts' },
] as const;

/**
 * The backend's phase1_data table has a single free-text `topic` column and
 * a single free-text `reference_description` column, but this form collects
 * a structured topic breakdown (thePoint / whyTheyCare / theProof /
 * actionableTakeaway) plus a separate copy-element description that have no
 * dedicated columns. We pack them into reference_description as a small
 * tagged block so round-tripping (save -> reload) doesn't lose any data.
 */
function buildReferenceDescription(fields: {
  thePoint: string;
  whyTheyCare: string;
  theProof: string;
  actionableTakeaway: string;
  copyDescription: string;
}) {
  return [
    `[thePoint]${fields.thePoint}`,
    `[whyTheyCare]${fields.whyTheyCare}`,
    `[theProof]${fields.theProof}`,
    `[actionableTakeaway]${fields.actionableTakeaway}`,
    `[copyDescription]${fields.copyDescription}`,
  ].join('\n');
}

function parseReferenceDescription(raw: string) {
  const result: Record<string, string> = {};
  const re = /\[(\w+)\]([\s\S]*?)(?=\n\[\w+\]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    result[m[1]] = m[2].trim();
  }
  return result as {
    thePoint?: string; whyTheyCare?: string; theProof?: string;
    actionableTakeaway?: string; copyDescription?: string;
  };
}

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
/*  Dynamic Niche Examples                                            */
/* ------------------------------------------------------------------ */

const NICHE_EXAMPLES: Record<string, {
  whyNuggetPlaceholder: string;
  whyNuggetExample: string;
  thePointPlaceholder: string;
  thePointExample: string;
  whyTheyCarePlaceholder: string;
  whyTheyCareExample: string;
  theProofPlaceholder: string;
  theProofExample: string;
  takeawayPlaceholder: string;
  takeawayExample: string;
}> = {
  Skincare: {
    whyNuggetPlaceholder: '...this stat challenges everything they thought they knew about skincare.',
    whyNuggetExample: '...this shocking fact about vitamin C oxidation changes how they see their entire routine.',
    thePointPlaceholder: '...how to keep your vitamin C serum from oxidizing too early.',
    thePointExample: '...how to fix your skincare routine in under 5 minutes.',
    whyTheyCarePlaceholder: '...nobody wants to waste money on serums that stop working halfway through.',
    whyTheyCareExample: '...73% of people throw away oxidized product they paid good money for.',
    theProofPlaceholder: "...I've tested 20+ serums and the fridge trick always works.",
    theProofExample: "...I've reduced product waste by 70% using this one method.",
    takeawayPlaceholder: '...store their vitamin C serum correctly to double its lifespan.',
    takeawayExample: '...store their vitamin C serum correctly to double its lifespan.',
  },
  Fitness: {
    whyNuggetPlaceholder: '...this data proves everything they believed about cardio is backwards.',
    whyNuggetExample: '...this study showing 12 minutes beats 60 minutes for fat loss will make them rethink their entire routine.',
    thePointPlaceholder: '...why 80% of gym-goers waste time on exercises that don\'t build muscle.',
    thePointExample: '...how to cut your workout time in half and get better results.',
    whyTheyCarePlaceholder: '...they\'re spending 6 hours/week in the gym but only 2 actually matter.',
    whyTheyCareExample: '...the average gym member wastes $480/year on a routine that doesn\'t work.',
    theProofPlaceholder: "...I gained 8 lbs of muscle in 90 days doing only 3 exercises.",
    theProofExample: "...my client dropped 14% body fat without a single minute of cardio.",
    takeawayPlaceholder: '...build a 20-minute routine that outperforms a 60-minute gym session.',
    takeawayExample: '...replace their 5-day split with a 3-day program that builds more muscle.',
  },
  Finance: {
    whyNuggetPlaceholder: '...this hidden fee structure is silently eating their retirement savings.',
    whyNuggetExample: '...this one account setting could save them $12,000 over 10 years.',
    thePointPlaceholder: '...why keeping money in a savings account actually loses you $3,000/year.',
    thePointExample: '...how to automate investments so your money grows while you sleep.',
    whyTheyCarePlaceholder: '...inflation is eroding their purchasing power by 6% every year they wait.',
    whyTheyCareExample: '...the average person loses $47,000 by age 40 just from inaction.',
    theProofPlaceholder: "...I turned $200/month into $48,000 in 5 years using one strategy.",
    theProofExample: "...my portfolio grew 340% using a method any beginner can copy.",
    takeawayPlaceholder: '...set up an automated investment system in under 10 minutes tonight.',
    takeawayExample: '...open the right account and make their first investment before bed tonight.',
  },
  Food: {
    whyNuggetPlaceholder: '...this cooking mistake ruins the flavor of 90% of home-cooked meals.',
    whyNuggetExample: '...learning that restaurants use this one trick will change how they cook forever.',
    thePointPlaceholder: '...why salting pasta water isn\'t enough — and what chefs actually do.',
    thePointExample: '...how to make restaurant-quality food using only a $15 pan.',
    whyTheyCarePlaceholder: '...they\'re spending $400/month eating out when the same meal costs $6 at home.',
    whyTheyCareExample: '...the average family wastes $1,800/year on food that goes bad before they eat it.',
    theProofPlaceholder: "...I cut my food budget by 60% and eat better than I did before.",
    theProofExample: "...my meal prep system feeds a family of 4 for $5.20/person/day.",
    takeawayPlaceholder: '...make tonight\'s dinner in 15 minutes using 5 pantry ingredients.',
    takeawayExample: '...prep 5 meals in 45 minutes this Sunday that taste better than takeout.',
  },
  Tech: {
    whyNuggetPlaceholder: '...this hidden feature in their phone saves 2 hours per week instantly.',
    whyNuggetExample: '...discovering this AI tool does in 30 seconds what takes them 3 hours manually.',
    thePointPlaceholder: '...why 90% of people use AI tools wrong and get garbage output.',
    thePointExample: '...how to automate 80% of your repetitive tasks using one free tool.',
    whyTheyCarePlaceholder: '...they\'re manually doing tasks that AI can handle in 10 seconds flat.',
    whyTheyCareExample: '...the average knowledge worker wastes 28 hours/month on tasks AI already does better.',
    theProofPlaceholder: "...I automated my entire workflow and saved 15 hours per week.",
    theProofExample: "...my team shipped 3x faster after I set up this one automation pipeline.",
    takeawayPlaceholder: '...set up one AI automation tonight that saves them 5 hours this week.',
    takeawayExample: '...install this free tool and automate their first task in under 3 minutes.',
  },
  Lifestyle: {
    whyNuggetPlaceholder: '...this morning routine hack backed by neuroscience triples their productivity.',
    whyNuggetExample: '...learning that successful people all skip this one "essential" habit will shock them.',
    thePointPlaceholder: '...why waking up at 5am is actually destroying your productivity.',
    thePointExample: '...how to design a morning routine that actually fits your life.',
    whyTheyCarePlaceholder: '...they\'re burning out trying to follow routines designed for someone else\'s life.',
    whyTheyCareExample: '...78% of people abandon productivity systems within 2 weeks because they\'re wrong for them.',
    theProofPlaceholder: "...I restructured my mornings and gained back 2 hours of deep work daily.",
    theProofExample: "...I went from 3 productive hours/day to 7 by changing one habit.",
    takeawayPlaceholder: '...redesign tomorrow morning using the 3-block system starting tonight.',
    takeawayExample: '...try the 90-minute focus block tomorrow and see the difference by lunch.',
  },
};

const DEFAULT_EXAMPLES = NICHE_EXAMPLES['Tech']; // fallback

function getNicheExamples(niche: string) {
  return NICHE_EXAMPLES[niche] || DEFAULT_EXAMPLES;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export default function Phase1() {
  const navigate = useNavigate();
  const { briefId, loading: briefLoading, error: briefError, retry: retryBrief } = useBriefBootstrap();

  /* --- state --- */
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [creator, setCreator] = useState('');
  const [actor, setActor] = useState('');
  const [actorBrief, setActorBrief] = useState('');
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
  const [liveNuggets, setLiveNuggets] = useState<KnowledgeNugget[] | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

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

  type FluffRow = { fluff: string; specific: string };
  const [fluffRows, setFluffRows] = useState<FluffRow[]>([]);
  const [fluffLoading, setFluffLoading] = useState(false);
  const [fluffGenerated, setFluffGenerated] = useState(false);

  /* Creator Voice (optional) */
  const [creatorVoiceOpen, setCreatorVoiceOpen] = useState(false);
  const [deliveryStyle, setDeliveryStyle] = useState('');
  const [sampleHook, setSampleHook] = useState('');
  const [audienceLevel, setAudienceLevel] = useState('');

  const nicheEx = useMemo(() => getNicheExamples(niche), [niche]);

  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  /* --- load existing Phase 1 data for this brief, if any --- */
  useEffect(() => {
    if (!briefId) return;
    setLoadingExisting(true);
    phase1Api
      .get(briefId)
      .then((res) => {
        const d = res.data;
        if (d.platform) setPlatform(d.platform);
        if (d.niche) setNiche(d.niche);
        if (d.sub_niche) setSubNiche(d.sub_niche);
        if (d.viral_reference_url) setRefUrl(d.viral_reference_url);
        if (d.time_to_value) setTimeToValue(d.time_to_value);
        if (d.content_style) setContentStyle(d.content_style);
        if (d.on_camera_actor) setActor(d.on_camera_actor);
        if (d.actor_brief) setActorBrief(d.actor_brief as string);
        if (d.actor_brief) setDeliveryStyle(d.actor_brief as string);
        if (d.brand_company) setCompany(d.brand_company);
                if (d.language) setLanguage(d.language);
        if (d.content_creator) setCreator(d.content_creator);
        if ((d as any).sample_hook) setSampleHook((d as any).sample_hook);
        if (d.content_style) {
          setContentStyle(d.content_style);
          // If it's an audience level value, also set that
          if (['Total Beginners', 'Some Knowledge', 'Advanced / Experts'].includes(d.content_style)) {
            setAudienceLevel(d.content_style);
          }
        }
        if (d.number_of_actors) setActorCount(String(d.number_of_actors));
        if (d.aspect_ratio) setAspectRatio(d.aspect_ratio);
        if (d.estimated_length) setEstimatedLength(d.estimated_length);
        if (d.production_date) setDate(d.production_date);
        if (d.nugget_rationale) setWhyNugget(d.nugget_rationale);
        if (d.selected_nugget_index !== null && d.selected_nugget_index !== undefined) {
          setSelectedNugget(d.selected_nugget_index);
        }
        if (d.knowledge_nuggets && d.knowledge_nuggets.length > 0) {
          setLiveNuggets(d.knowledge_nuggets);
          setNuggetsVisible(true);
        }
        if (d.copy_elements && d.copy_elements.length > 0) {
          setCopyElement(d.copy_elements[0]);
        }
        if (d.reference_description) {
          // reference_description carries the structured topic breakdown +
          // copy-element notes that don't have dedicated backend columns.
          const parsed = parseReferenceDescription(d.reference_description);
          if (parsed.thePoint) setThePoint(parsed.thePoint);
          if (parsed.whyTheyCare) setWhyTheyCare(parsed.whyTheyCare);
          if (parsed.theProof) setTheProof(parsed.theProof);
          if (parsed.actionableTakeaway) setActionableTakeaway(parsed.actionableTakeaway);
          if (parsed.copyDescription) setCopyDescription(parsed.copyDescription);
        }
      })
      .catch(() => {
        // 404 just means no Phase 1 data saved yet for this brief — that's fine.
      })
      .finally(() => setLoadingExisting(false));
  }, [briefId]);

  /* --- fetch AI fluff examples on demand --- */
  const fetchFluffExamples = useCallback(() => {
    if (!briefId) return;
    setFluffLoading(true);
    phase1Api
      .fluffExamples(briefId, niche, thePoint, language)
      .then((res) => {
        if (res.examples && res.examples.length >= 3) {
          setFluffRows(res.examples);
          setFluffGenerated(true);
        }
      })
      .catch(() => {})
      .finally(() => setFluffLoading(false));
  }, [briefId, niche, thePoint, language]);

  /* --- computed --- */
  const researchCharCount = research.length;
  const isResearchReady = researchCharCount > 200;

  /* --- auto-save language & duration to DB so AI calls always read the latest --- */
  useEffect(() => {
    if (!briefId || !language) return;
    phase1Api.save(briefId, { language, estimated_length: estimatedLength } as never).catch(() => {});
  }, [briefId, language, estimatedLength]);

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
    if (!isResearchReady || !briefId) return;
    setExtracting(true);
    setNuggetsVisible(false);
    setExtractError(null);
    phase1Api
      .extractNuggets(briefId, thePoint || niche || 'General topic', research, language)
      .then((res) => {
        setLiveNuggets(res.nuggets);
        setNuggetsVisible(true);
      })
      .catch((err: unknown) => {
        setExtractError(
          err instanceof ApiError ? err.message : 'Could not extract nuggets — is the backend running?'
        );
        // Fall back to the bundled demo nuggets so the UI is still usable offline.
        setLiveNuggets(null);
        setNuggetsVisible(true);
      })
      .finally(() => setExtracting(false));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const nuggetSource = liveNuggets ?? [];

  const buildPayload = () => ({
    platform: platform || null,
    niche: niche || null,
    sub_niche: subNiche || null,
    topic: [thePoint, whyTheyCare, theProof].filter(Boolean).join(' ') || null,
    viral_reference_url: refUrl || null,
    copy_elements: copyElement ? [copyElement] : null,
    time_to_value: timeToValue || null,
    content_style: contentStyle || null,
    hook_text: selectedNugget !== null ? nuggetSource[selectedNugget]?.text ?? null : null,
    knowledge_nuggets: liveNuggets ?? null,
    on_camera_actor: actor || null,
    actor_brief: deliveryStyle || actorBrief || null,
    brand_company: company || null,
    reference_description: buildReferenceDescription({
      thePoint, whyTheyCare, theProof, actionableTakeaway, copyDescription,
    }),
    selected_nugget_index: selectedNugget,
    nugget_rationale: whyNugget || null,
    language: language || null,
    content_creator: creator || null,
    number_of_actors: actorCount ? parseInt(actorCount, 10) : null,
    aspect_ratio: aspectRatio || null,
    estimated_length: estimatedLength || null,
    production_date: date || null,
    sample_hook: sampleHook || null,
  });

  const handleSaveDraft = () => {
    if (!briefId) return;
    setSaving(true);
    phase1Api
      .save(briefId, buildPayload())
      .then(() => showToast('Draft saved successfully'))
      .catch((err: unknown) => {
        showToast(err instanceof ApiError ? `Save failed: ${err.message}` : 'Save failed — backend unreachable');
      })
      .finally(() => setSaving(false));
  };

  const handleSubmit = () => {
    if (!isFormValid || !briefId) return;
    setSaving(true);
    phase1Api
      .advance(briefId, buildPayload())
      .then(() => navigate('/phase/2'))
      .catch((err: unknown) => {
        showToast(err instanceof ApiError ? `Could not continue: ${err.message}` : 'Could not continue — backend unreachable');
      })
      .finally(() => setSaving(false));
  };

  const selectedNuggetData = selectedNugget !== null ? nuggetSource[selectedNugget] : null;

  /* --- render --- */
  /* ── Show skeleton loading screen while initial data loads ── */
  if (briefLoading || loadingExisting) {
    return <PhaseLoadingScreen phase={1} />;
  }

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

          {briefError && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm flex items-center justify-between gap-4">
              <span>{briefError}</span>
              <button onClick={retryBrief} className="underline shrink-0">Retry</button>
            </div>
          )}
          {!briefError && briefId && (
            <p className="text-xs text-text-tertiary">
              Brief ID: <span className="font-mono">{briefId}</span>
              {briefLoading || loadingExisting ? ' — loading…' : ''}
            </p>
          )}
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
            {['ID', 'RSRCH', '1PT', 'TOPIC', 'VAL', 'REF'].map((label, i) => {
              const stepProgress =
                date && creator ? (research.length > 0 ? (selectedNugget !== null ? (whyNugget ? (niche && actionableTakeaway ? (refUrl ? 6 : 5) : 4) : 3) : 2) : 1) : 1;
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
                <Input
                  placeholder="Enter actor name"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30"
                />
              </div>
              {/* Actor Brief */}
              <div>
                <FormLabel>Actor Brief</FormLabel>
                <Textarea
                  placeholder="Describe the actor's on-screen style, tone, or key personality notes for the AI director..."
                  value={actorBrief}
                  onChange={(e) => setActorBrief(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 min-h-[72px] resize-none"
                />
              </div>
              {/* Company */}
              <div>
                <FormLabel>Brand / Company</FormLabel>
                <Input
                  placeholder="Enter brand or company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30"
                />
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
                <Input
                  placeholder="e.g. 30-60s"
                  value={estimatedLength}
                  onChange={(e) => setEstimatedLength(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30"
                />
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
                <FormLabel>Number of Actors</FormLabel>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="e.g. 2"
                  value={actorCount}
                  onChange={(e) => setActorCount(e.target.value)}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30"
                />
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

            {/* File attachments */}
            <div className="mt-4 mb-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-subtle bg-bg-tertiary hover:bg-bg-quaternary cursor-pointer transition-colors">
                  <Paperclip size={16} className="text-text-secondary" />
                  <span className="text-sm text-text-secondary">Attach Files</span>
                  <input type="file" multiple className="sr-only" onChange={handleFileChange} />
                </label>
                {attachedFiles.length > 0 && (
                  <span className="text-xs text-text-tertiary">
                    {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached
                  </span>
                )}
              </div>
              {attachedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachedFiles.map((file, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-bg-tertiary border border-border-subtle text-text-secondary"
                    >
                      {file.name}
                      <button
                        onClick={() => removeAttachedFile(i)}
                        className="text-text-tertiary hover:text-error ml-1"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
              {extractError && (
                <p className="text-xs text-error mt-2">
                  {extractError} — showing example nuggets instead.
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* --- Field 3: One Point Selector --- */}
        <motion.div variants={cardVariants}>
          <div className="relative">
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={3} title="One Point Selector" />
            <p className="text-sm-medium text-text-secondary mb-1">
              Which single point will this video make?
            </p>
            <p className="text-sm text-text-tertiary italic mb-5">
              AI gives 3 options. You pick 1. One video = one point. No exceptions.
            </p>

            {/* AI-generated nugget options */}
            {nuggetsVisible ? (
              <div className="mb-5">
                {/* Selected nugget display */}
                {selectedNuggetData && (
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
                )}

                {/* 3 Nugget option cards for selection */}
                <p className="text-sm-medium text-text-secondary mb-3">
                  AI extracted 3 potential hooks from your research:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {nuggetSource.map((n, i) => (
                    <motion.div
                      key={`${n.type}-${i}`}
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
                      <p className="text-base text-text-primary mb-3">{n.text}</p>
                      <p className="text-xs text-text-tertiary italic mb-4">{n.source}</p>
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
              </div>
            ) : (
              <div className="rounded-xl border border-border-subtle bg-bg-tertiary p-5 mb-5 text-center">
                <p className="text-sm text-text-tertiary">
                  Click &quot;Extract Nuggets&quot; in the Research Dump above to see AI-generated options.
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
                  placeholder={nicheEx.whyNuggetPlaceholder}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 min-h-[80px] pt-10 resize-vertical"
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: {nicheEx.whyNuggetExample}</InlineExample>
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
          <AIOperationOverlay
            active={extracting}
            accent={ACCENT}
            stages={[
              { text: 'Sending research to AI…' },
              { text: 'Extracting knowledge nuggets…' },
              { text: 'Ranking by viral potential…' },
            ]}
          />
          </div>
        </motion.div>

        <div className="h-6" />

        {/* --- Field 4: Topic (Forced Format) --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={4} title="Topic — Forced Format" />
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
                  placeholder={nicheEx.thePointPlaceholder}
                  className={cn(
                    'bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[130px]',
                    topicErrors.thePoint && 'border-error focus-visible:ring-error/30'
                  )}
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: {nicheEx.thePointExample}</InlineExample>
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
                  placeholder={nicheEx.whyTheyCarePlaceholder}
                  className={cn(
                    'bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[136px]',
                    topicErrors.whyTheyCare && 'border-error focus-visible:ring-error/30'
                  )}
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: {nicheEx.whyTheyCareExample}</InlineExample>
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
                  placeholder={nicheEx.theProofPlaceholder}
                  className={cn(
                    'bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[120px]',
                    topicErrors.theProof && 'border-error focus-visible:ring-error/30'
                  )}
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>Example: {nicheEx.theProofExample}</InlineExample>
                <span className="text-xs text-text-tertiary">{wordCount(theProof)}/20 words</span>
              </div>
              {topicErrors.theProof && (
                <p className="text-xs text-error mt-1">{topicErrors.theProof}</p>
              )}
            </div>
          </Card>
        </motion.div>

        <div className="h-6" />


        {/* --- Field 5: Value Delivery --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={5} title="Value Delivery" />

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
                  placeholder={nicheEx.takeawayPlaceholder}
                  className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 pl-[300px]"
                />
              </div>
              <div className="flex justify-between mt-1">
                <InlineExample>
                  Example: {nicheEx.takeawayExample}
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

            {/* Fluff Check — Rebuilt */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base-medium text-text-primary">Fluff Check</h3>
                <button
                  onClick={fetchFluffExamples}
                  disabled={fluffLoading || !niche}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-tertiary hover:bg-bg-quaternary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-secondary"
                >
                  {fluffLoading ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Sparkles size={11} />
                  )}
                  {fluffLoading ? 'Generating…' : fluffGenerated ? 'Regenerate for this topic' : 'Generate examples for my topic'}
                </button>
              </div>

              {!fluffLoading && fluffRows.length === 0 && (
                <div className="rounded-xl border border-border-subtle bg-bg-secondary flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Sparkles size={20} className="text-text-tertiary mb-2" />
                  <p className="text-sm text-text-secondary mb-1">
                    {niche
                      ? 'Click "Generate examples" to get AI examples for ' + niche + (thePoint ? ' — ' + thePoint.slice(0, 40) : '')
                      : 'Select a niche first, then generate examples'}
                  </p>
                  <p className="text-xs text-text-tertiary">Examples will be in your selected language</p>
                </div>
              )}

              {fluffLoading && (
                <div className="overflow-hidden rounded-xl border border-border-subtle animate-pulse">
                  <div className="grid grid-cols-2 gap-0 bg-[#252932]">
                    <div className="px-4 py-3 h-10 border-r border-border-subtle" />
                    <div className="px-4 py-3 h-10" />
                  </div>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="grid grid-cols-2 gap-0 border-t border-border-subtle">
                      <div className="px-4 py-4 border-r border-border-subtle"><div className="h-3 bg-bg-tertiary rounded w-3/4" /></div>
                      <div className="px-4 py-4"><div className="h-3 bg-bg-tertiary rounded w-5/6 mb-1" /><div className="h-3 bg-bg-tertiary rounded w-2/3" /></div>
                    </div>
                  ))}
                </div>
              )}

              {!fluffLoading && fluffRows.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border-subtle">
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
                  {fluffRows.map((row, i) => (
                    <motion.div
                      key={i}
                      className={cn('grid grid-cols-2 gap-0 text-sm', i % 2 === 1 && 'bg-[rgba(255,255,255,0.015)]')}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease: easeOut, delay: i * 0.06 }}
                    >
                      <div className="px-4 py-3 border-r border-border-subtle text-text-secondary line-through" style={{ borderLeft: '3px solid #EF4444' }}>
                        {row.fluff}
                      </div>
                      <div className="px-4 py-3 text-text-primary" style={{ borderLeft: '3px solid #22C55E' }}>
                        {row.specific}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
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

        {/* --- Field 6: Reference Video --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <SectionTitle num={6} title="Reference Video" />
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

        {/* --- Field 7: Creator Voice (Optional) --- */}
        <motion.div variants={cardVariants}>
          <Card phaseAccent={ACCENT}>
            <button
              type="button"
              onClick={() => setCreatorVoiceOpen((p) => !p)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <SectionNumber num={7} />
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-text-primary">Creator Voice</h2>
                  <p className="text-xs text-text-tertiary mt-0.5">Helps AI sound like YOU</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: creatorVoiceOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-text-tertiary" />
              </motion.div>
            </button>

            <AnimatePresence>
              {creatorVoiceOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="pt-5 space-y-5">
                    {/* Delivery Style */}
                    <div>
                      <FormLabel>Delivery Style</FormLabel>
                      <Select value={deliveryStyle} onValueChange={(v) => { setDeliveryStyle(v); setActorBrief(v); }}>
                        <SelectTrigger className="bg-bg-tertiary border-border-subtle text-text-primary focus:ring-accent-input/30">
                          <SelectValue placeholder="How does the creator deliver content?" />
                        </SelectTrigger>
                        <SelectContent className="bg-bg-quaternary border-border-medium">
                          {DELIVERY_STYLES.map((s) => (
                            <SelectItem key={s} value={s} className="text-text-primary focus:bg-bg-tertiary focus:text-text-primary">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sample Hook */}
                    <div>
                      <FormLabel>
                        Sample Hook <span className="text-text-tertiary font-normal">(optional)</span>
                      </FormLabel>
                      <Textarea
                        value={sampleHook}
                        onChange={(e) => setSampleHook(e.target.value)}
                        placeholder="Paste a hook from one of your best videos... (helps AI match your voice)"
                        className="bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-tertiary focus-visible:ring-accent-input/30 min-h-[72px] resize-vertical"
                      />
                    </div>

                    {/* Audience Level */}
                    <div>
                      <FormLabel>Audience Level</FormLabel>
                      <div className="flex flex-wrap gap-3">
                        {AUDIENCE_LEVELS.map((lvl) => (
                          <label
                            key={lvl.value}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors',
                              audienceLevel === lvl.value
                                ? 'border-accent-input bg-accent-input/5'
                                : 'border-border-subtle bg-bg-tertiary hover:bg-bg-quaternary'
                            )}
                          >
                            <input
                              type="radio"
                              name="audience-level"
                              value={lvl.value}
                              checked={audienceLevel === lvl.value}
                              onChange={() => setAudienceLevel(lvl.value)}
                              className="accent-accent-input"
                            />
                            <span className="text-sm text-text-primary">{lvl.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ============================================================ */}
        {/* SECTION 4: Form Actions                                      */}
        {/* ============================================================ */}
        <motion.div
          variants={cardVariants}
          className="mt-10 mb-16 flex flex-col sm:flex-row items-center justify-end gap-4"
        >
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || !briefId}
            className="w-full sm:w-auto text-sm-medium font-medium border-border-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <Save size={16} className="mr-1.5" />}
            Save Draft
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || saving || !briefId}
            className="w-full sm:w-auto text-sm-medium font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              isFormValid
                ? { backgroundColor: ACCENT, color: '#0B0C0F' }
                : undefined
            }
          >
            {saving && <Loader2 size={16} className="mr-1.5 animate-spin" />}
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
