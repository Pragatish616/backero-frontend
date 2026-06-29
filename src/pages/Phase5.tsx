import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Mic, Camera, Scissors, Download,
  Copy, Check, ChevronLeft,
  FileDown, Film, Clapperboard, Printer,
  Package, Shield,
  Zap, Sparkles, Loader2,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/Card';
import { cn } from '@/lib/utils';
import { generateProductionPackDOCX } from '@/lib/docxGenerator';
import { phase5 as phase5Api, ApiError } from '@/lib/api';
import { useBriefBootstrap } from '@/lib/useBriefBootstrap';
import PhaseLoadingScreen from '@/components/PhaseLoadingScreen';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DocTab = 'all' | 'actor' | 'camera' | 'edit' | 'script' | 'golden-rules';

interface SceneData {
  sceneNum: number;
  name: string;
  timingStart: number;
  timingEnd: number;
  duration: number;
  dialogue: string;
  action: string;
  cameraShot: string;
  cameraAngle: string;
  cameraMovement: string;
  actorExpression: string;
  actorEnergy: number;
  actorPace: string;
  visual: string;
  audio: string;
  editMarkers: string;
}

interface TimelineEvent {
  time: number;
  type: string;
  emoji: string;
  label: string;
  scene?: number;
}

interface GoldenRule {
  num: number;
  name: string;
  description: string;
  category: string;
}

/* ------------------------------------------------------------------ */
/*  Screenplay Data                                                    */
/* ------------------------------------------------------------------ */

const DEFAULT_SCREENPLAY_SCENES: SceneData[] = [
  {
    sceneNum: 1, name: 'THE HOOK', timingStart: 0, timingEnd: 3, duration: 3,
    dialogue: "I tested 47 skincare products so you don't have to.",
    action: "(Actor: Face fills frame. Eyes wide. Holds up two bottles.)",
    cameraShot: "Close-up", cameraAngle: "Low angle", cameraMovement: "Handheld micro-jolt",
    actorExpression: "Confident, slight smile", actorEnergy: 9, actorPace: "Fast",
    visual: 'Text overlay: "47 PRODUCTS" \u2014 72pt, neon yellow, pop-in at 0.3s',
    audio: "Voice onset at 0.0s. No music. Beat drop at 2.8s.",
    editMarkers: '[{"time":"0.0s","event":"Open on face \u2014 MCU, low angle, handheld"},{"time":"0.3s","event":"47 PRODUCTS text overlay pop-in"},{"time":"0.5s","event":"Actor holds up two bottles \u2014 contrast + motion"},{"time":"2.8s","event":"Hard cut to Scene 2"}]',
  },
  {
    sceneNum: 2, name: 'AUTHORITY GAP', timingStart: 3, timingEnd: 8, duration: 5,
    dialogue: "And I found that 70% of vitamin C serums go bad before you finish them.",
    action: "(Actor: Shakes one bottle. Expression shifts to serious. Holds up one finger.)",
    cameraShot: "Medium", cameraAngle: "Eye level", cameraMovement: "Static, B-cam ECU insert at 5s",
    actorExpression: "Serious, authoritative", actorEnergy: 7, actorPace: "Normal",
    visual: 'Text overlay: "70% GO BAD" \u2014 red, bottom third, warning icon',
    audio: "Low beat enters at 20% volume. Alert SFX at 5.5s.",
    editMarkers: '[{"time":"3.0s","event":"Cut to medium shot"},{"time":"4.0s","event":"70% GO BAD text overlay"},{"time":"5.0s","event":"B-cam ECU on bottle (pattern interrupt)"},{"time":"5.5s","event":"Alert sound effect"}]',
  },
  {
    sceneNum: 3, name: 'THE HACK', timingStart: 8, timingEnd: 15, duration: 7,
    dialogue: "Store it in the fridge. It lasts twice as long.",
    action: "(Actor: Walks to fridge. Opens door. Places bottle inside. Turns back to camera.)",
    cameraShot: "Medium", cameraAngle: "Eye level", cameraMovement: "Push-in 15% from 8\u201312s",
    actorExpression: "Excited-conspiratorial", actorEnergy: 8, actorPace: "Fast \u2192 Slow",
    visual: 'Text overlay: "STORE IN FRIDGE" \u2014 green, checkmark graphic, pop-in at 12.0s',
    audio: "Music builds to 35% volume. 'Ding' SFX on checkmark at 13.0s.",
    editMarkers: '[{"time":"8.0s","event":"Push-in starts, actor walks to fridge"},{"time":"10.0s","event":"Fridge door open \u2014 B-roll insert"},{"time":"12.0s","event":"STORE IN FRIDGE text overlay"},{"time":"13.0s","event":"Ding on checkmark graphic"}]',
  },
  {
    sceneNum: 4, name: 'THE PROOF', timingStart: 15, timingEnd: 25, duration: 10,
    dialogue: "I did this for 30 days. My $60 serum lasted 60 days instead of 30.",
    action: "(Actor: Holds up calendar. Points to dates. Proud expression.)",
    cameraShot: "Medium \u2192 Close-up", cameraAngle: "Eye level", cameraMovement: "Dolly in on product at 18s",
    actorExpression: "Proud, confident", actorEnergy: 7, actorPace: "Normal",
    visual: "$60 \u2192 60 DAYS count-up animation on screen at 18s",
    audio: "Steady beat at 40% volume. Cash register SFX at 22s (peak moment).",
    editMarkers: '[{"time":"15.0s","event":"Cut to calendar shot"},{"time":"18.0s","event":"Count-up animation $60 \u2192 60 DAYS"},{"time":"22.0s","event":"Cash register SFX (ONE PEAK per video)"},{"time":"23.0s","event":"Close-up on product result"}]',
  },
  {
    sceneNum: 5, name: 'CTA', timingStart: 25, timingEnd: 30, duration: 5,
    dialogue: "Save this before your serum goes bad.",
    action: "(Actor: Direct to camera. Points down to save area. Urgent but friendly.)",
    cameraShot: "Close-up", cameraAngle: "Eye level", cameraMovement: "Static, freeze frame",
    actorExpression: "Urgent-friendly", actorEnergy: 8, actorPace: "Normal-urgent",
    visual: '"SAVE THIS" pulsing text, arrow to save area, CTA card freeze at 29.5s',
    audio: "Music fades out over 3s. Pre-CTA silence beat at 29.0s.",
    editMarkers: '[{"time":"25.0s","event":"SAVE THIS pulsing text overlay"},{"time":"27.0s","event":"Actor points to save area"},{"time":"29.0s","event":"Pre-CTA freeze \u2014 silent 1.0s"},{"time":"29.5s","event":"Fade to end"}]',
  },
];

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

const EMPTY_META = {
  title: '',
  actor: '',
  company: '',
  platform: '',
  format: '',
  contentType: '',
  structure: '',
  runtime: '0s',
  scenes: 0,
  cuts: 0,
  words: 0,
  verdict: '' as 'SHIP' | 'REVISE' | 'REJECT' | '',
  score: 0,
  aspectRatio: '9:16',
  language: 'English',
};

/* ------------------------------------------------------------------ */
/*  Golden Rules                                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_GOLDEN_RULES: GoldenRule[] = [
  { num: 1, name: 'Demonstration-First Dialogue', description: 'Can this be SHOWN instead of SAID? If yes, move to visual. Dialogue is the fallback.', category: 'Dialogue' },
  { num: 2, name: 'Action-to-Dialogue Ratio >= 2.0', description: 'For every spoken word, >= 2 words of action/visual description must accompany it.', category: 'Dialogue' },
  { num: 3, name: 'Silent-Runtime Quota by Format', description: 'ABR >=50%, Whiteboard >=30%, Two-person >=25%, Talking-head >=20%, Hybrid >=35%.', category: 'Audio' },
  { num: 4, name: 'Hook Parseable Muted', description: 'Hook visual + caption alone must carry the full message. VO is multiplier, not carrier.', category: 'Visual' },
  { num: 5, name: 'Broad -> Narrow -> Niche', description: 'Hook = BROAD (universal). Body = NARROW (target ICP). CTA = NICHE (only right people convert).', category: 'Structure' },
  { num: 6, name: "Show, Don't Tell (LOC/EBA/VWFA)", description: 'Every fact is DEMONSTRATED. Numbers on screen simultaneously. Objects visible. Actions performed.', category: 'Visual' },
  { num: 7, name: 'No Talking Head > 2s Without Change', description: 'After 2s static talking-head, MT/V5 habituates. Change: cut, text, prop, gesture, B-roll.', category: 'Visual' },
  { num: 8, name: 'Silent Moments Mandatory', description: 'Reaction 0.5\u20131.0s, Product reveal 1.0\u20132.0s, Before/after 1.0s each, Text-only 1.0\u20132.0s, Pre-CTA freeze 1.0s.', category: 'Audio' },
  { num: 9, name: 'Bridge Words Between Sentences', description: '"And...", "But here\'s...", "Which means...", "So now...", "And that\'s why..."', category: 'Dialogue' },
  { num: 10, name: 'Action-Integrated Dialogue (EBA+STS)', description: "Every line specifies WHAT THE ACTOR IS DOING. action_parenthetical reads as director's note.", category: 'Dialogue' },
  { num: 11, name: 'Tri-Modal Convergence in 0-1.5s', description: 'Visual (motion+contrast by 0.5s) + Audio (phoneme at 0.0s) + Written (hero text by 0.3s).', category: 'Quality' },
  { num: 12, name: 'Research Fidelity Carry-Over', description: 'Numeric claims match Phase-2 exactly. No inflation. On-screen number = spoken number = paper.', category: 'Quality' },
  { num: 13, name: 'Studio-Realistic Scope', description: 'Every camera move, lighting, prop, actor count achievable with available studio_assets.', category: 'Quality' },
  { num: 14, name: 'Caption Coverage = 100%', description: 'Every spoken word appears as synced caption block. 85% of social video watched muted.', category: 'Visual' },
  { num: 15, name: 'One Peak Per Video', description: 'Exactly ONE energy-10 / speed-ramp / hard-emphasis moment per video. At structural payoff.', category: 'Structure' },
  { num: 16, name: 'Hook > Script > Format > Edit Priority', description: 'When in doubt, optimize in this order. Hook must win first. Format is fourth.', category: 'Structure' },
  { num: 17, name: '5x Outlier Match', description: 'If reference video provided, match cut rhythm within +\u201320%. Do NOT copy dialogue.', category: 'Quality' },
  { num: 18, name: 'Staccato Sentences', description: 'Dialogue = 1-8 word beats. Hard stops. No conjunctions. Drum-like rhythm.', category: 'Dialogue' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Dialogue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  Visual: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  Audio: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  Structure: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  Quality: { bg: 'bg-red-500/10', text: 'text-red-400' },
};



/* ------------------------------------------------------------------ */
/*  Color Constants                                                    */
/* ------------------------------------------------------------------ */

const ACCENT = '#8B5CF6';
const SUCCESS = '#22C55E';
const WARNING = '#F59E0B';
const easeOut = [0.4, 0, 0.2, 1] as [number, number, number, number];

/* ------------------------------------------------------------------ */
/*  Helper Functions                                                   */
/* ------------------------------------------------------------------ */

function parseEditMarkers(jsonStr: string) {
  try { return JSON.parse(jsonStr); } catch { return []; }
}

function useClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }, []);
  return { copied, copy };
}

/* ------------------------------------------------------------------ */
/*  CopyButton                                                         */
/* ------------------------------------------------------------------ */

function CopyButton({ text, small = false, label }: { text: string; small?: boolean; label?: string }) {
  const { copied, copy } = useClipboard();
  return (
    <button
      onClick={() => copy(text)}
      className={cn(
        'flex items-center gap-1.5 rounded-lg transition-all duration-200',
        small ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
        copied
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-quaternary border border-border-subtle'
      )}
    >
      {copied ? <Check size={small ? 12 : 14} /> : <Copy size={small ? 12 : 14} />}
      {copied ? 'Copied!' : (label || 'Copy')}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Action Bar                                                         */
/* ------------------------------------------------------------------ */

function ActionBar({ onCopy, copyText, onPrint }: { onCopy?: () => void; copyText?: string; onPrint?: () => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {copyText !== undefined && (
        <CopyButton text={copyText} />
      )}
      {onCopy !== undefined && !copyText && (
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-quaternary border border-border-subtle transition-all duration-200"
        >
          <Copy size={14} />
          Copy
        </button>
      )}
      {onPrint && (
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-quaternary border border-border-subtle transition-all duration-200"
        >
          <Printer size={14} />
          Print / PDF
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Print Styles                                                       */
/* ------------------------------------------------------------------ */

function PrintStyles() {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .print-only { display: block !important; }
        body { background: white !important; color: black !important; }
      }
      .print-only { display: none; }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab Config                                                         */
/* ------------------------------------------------------------------ */

const TABS: { id: DocTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'all', label: 'All Documents', icon: Package },
  { id: 'actor', label: 'Actor Brief', icon: Mic },
  { id: 'camera', label: 'Camera Sheet', icon: Camera },
  { id: 'edit', label: 'Edit Timeline', icon: Scissors },
  { id: 'script', label: 'Clean Script', icon: FileText },
  { id: 'golden-rules', label: 'Golden Rules', icon: Shield },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  scene_start: 'Scene Start',
  cut: 'Cut',
  text_overlay: 'Text Overlay',
  sfx: 'SFX',
  music_cue: 'Music Cue',
  freeze_frame: 'Freeze Frame',
  loop_point: 'Loop Point',
  caption_beat: 'Caption Beat',
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

/**
 * The backend's Phase 5 pack returns scenes in the same nested shape as
 * Phase 3 (camera.shot/angle/movement, actor.expression/energy/pace,
 * editMarkers as an array of objects). This page's UI expects the flatter
 * shape used by Phase 4's editable scenes (camera- and actor-prefixed
 * fields, editMarkers serialized as a JSON string). This adapts one to
 * the other so none of the render code below needs to change.
 */
function adaptBackendScene(s: Record<string, unknown>): SceneData {
  const camera = (s.camera as Record<string, unknown>) ?? {};
  const actor = (s.actor as Record<string, unknown>) ?? {};
  return {
    sceneNum: Number(s.sceneNum ?? 0),
    name: String(s.name ?? ''),
    timingStart: Number(s.timingStart ?? 0),
    timingEnd: Number(s.timingEnd ?? 0),
    duration: Number(s.duration ?? 0),
    dialogue: String(s.dialogue ?? ''),
    action: String(s.action ?? ''),
    cameraShot: String(camera.shot ?? ''),
    cameraAngle: String(camera.angle ?? ''),
    cameraMovement: String(camera.movement ?? ''),
    actorExpression: String(actor.expression ?? ''),
    actorEnergy: Number(actor.energy ?? 5),
    actorPace: String(actor.pace ?? ''),
    visual: String(s.visual ?? ''),
    audio: String(s.audio ?? ''),
    editMarkers: JSON.stringify(s.editMarkers ?? []),
  };
}

export default function Phase5() {
  const navigate = useNavigate();
  const { briefId, loading: briefLoading, error: briefError, retry: retryBrief } = useBriefBootstrap();
  const [activeTab, setActiveTab] = useState<DocTab>('all');
  const [printFilter, setPrintFilter] = useState<string>('all');

  const [scenes, setScreenplayScenes] = useState<SceneData[]>([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [goldenRules, setGoldenRules] = useState<GoldenRule[]>(DEFAULT_GOLDEN_RULES);
  const [isLive, setIsLive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!briefId) return;
    setDataLoading(true);
    phase5Api
      .get(briefId)
      .then((res) => {
        const liveScenes = (res.scenes as Record<string, unknown>[]) ?? [];
        const liveMeta = res.meta as Record<string, unknown> | undefined;
        const liveRules = (res.golden_rules as Record<string, unknown>[]) ?? [];
        if (liveScenes.length > 0) {
          setScreenplayScenes(liveScenes.map(adaptBackendScene));
          setIsLive(true);
        } else {
          // No live data — use defaults so page is still usable
          setScreenplayScenes(DEFAULT_SCREENPLAY_SCENES);
        }
        if (liveMeta) {
          setMeta({
            title: String(liveMeta.title ?? ''),
            actor: String(liveMeta.actor ?? ''),
            company: String(liveMeta.company ?? ''),
            platform: String(liveMeta.platform ?? ''),
            format: String(liveMeta.format ?? ''),
            contentType: String(liveMeta.contentType ?? ''),
            structure: String(liveMeta.structure ?? ''),
            runtime: String(liveMeta.runtime ?? '0s'),
            scenes: Number(liveMeta.scenes ?? 0),
            cuts: Number(liveMeta.cuts ?? 0),
            words: Number(liveMeta.words ?? 0),
            verdict: (liveMeta.verdict as 'SHIP' | 'REVISE' | 'REJECT' | '') || '',
            score: Number(liveMeta.score ?? 0),
            aspectRatio: String(liveMeta.aspectRatio ?? '9:16') || '9:16',
            language: String(liveMeta.language ?? 'English') || 'English',
          });
        }
        if (liveRules.length > 0) {
          setGoldenRules(liveRules as unknown as GoldenRule[]);
        }
      })
      .catch((err: unknown) => {
        // On error, populate with defaults so the page is still usable
        setScreenplayScenes(DEFAULT_SCREENPLAY_SCENES);
        setLoadError(
          err instanceof ApiError
            ? `${err.message} — showing example data instead.`
            : 'Could not load the production pack — showing example data instead.'
        );
      })
      .finally(() => setDataLoading(false));
  }, [briefId]);

  const handleExportDocx = () => {
    if (!briefId) {
      generateProductionPackDOCX();
      return;
    }
    setExporting(true);
    const url = phase5Api.exportDocxUrl(briefId);
    // Trigger a real download from the backend (which renders the live
    // production pack server-side via python-docx). Falls back to the
    // client-side generator above if the brief has no backend data yet.
    fetch(url, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${briefId}_production_pack.docx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => {
        // Backend export unavailable — fall back to the client-side generator.
        generateProductionPackDOCX();
      })
      .finally(() => setExporting(false));
  };

  /* ---- Timeline Events ---- */
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    const emojiMap: Record<string, string> = {
      scene_start: '\ud83c\udfac',
      cut: '\u2702\ufe0f',
      text_overlay: '\ud83d\udcdd',
      sfx: '\ud83d\udd0a',
      music_cue: '\ud83c\udfb5',
      freeze_frame: '\u2744\ufe0f',
      loop_point: '\ud83d\udd01',
      caption_beat: '\ud83d\udccd',
    };
    scenes.forEach((scene) => {
      events.push({
        time: scene.timingStart,
        type: 'scene_start',
        emoji: emojiMap.scene_start,
        label: `Scene ${scene.sceneNum}: ${scene.name}`,
        scene: scene.sceneNum,
      });
      const markers = parseEditMarkers(scene.editMarkers);
      markers.forEach((m: any) => {
        const time = parseFloat(m.time);
        let type = 'cut';
        let emoji = emojiMap.cut;
        const event = m.event.toLowerCase();
        if (event.includes('text overlay') || event.includes('pop-in') || event.includes('pop-out')) {
          type = 'text_overlay';
          emoji = emojiMap.text_overlay;
        } else if (event.includes('sfx') || event.includes('sound') || event.includes('ding')) {
          type = 'sfx';
          emoji = emojiMap.sfx;
        } else if (event.includes('music') || event.includes('beat')) {
          type = 'music_cue';
          emoji = emojiMap.music_cue;
        } else if (event.includes('freeze')) {
          type = 'freeze_frame';
          emoji = emojiMap.freeze_frame;
        }
        if (!isNaN(time)) events.push({ time, type, emoji, label: m.event, scene: scene.sceneNum });
      });
    });
    return events.sort((a, b) => a.time - b.time);
  }, [scenes]);

  /* ---- JSON Envelope ---- */
  const jsonEnvelope = useMemo(() => ({
    phase: 5,
    skill_version: '1.0',
    pipeline_source: 'scalerock-phase-4-shipped',
    metadata: { ...meta, length_seconds: 30 },
    validation_carry: { verdict: meta.verdict, neural_prediction_score: meta.score },
    documents: {
      actor_brief: {
        format: meta.format,
        content_type: meta.contentType,
        scenes: scenes.map(s => ({
          scene: s.sceneNum,
          timing: `${s.timingStart}-${s.timingEnd}s`,
          dialogue: s.dialogue,
          action: s.action,
          expression: s.actorExpression,
          energy: `${s.actorEnergy}/10`,
          pace: s.actorPace,
        })),
      },
      camera_sheet: {
        aspect_ratio: meta.aspectRatio,
        platform: meta.platform,
        scenes: scenes.map(s => ({
          scene: s.sceneNum,
          timing: `${s.timingStart}-${s.timingEnd}s`,
          shot: s.cameraShot,
          angle: s.cameraAngle,
          movement: s.cameraMovement,
        })),
      },
      edit_timeline: {
        total_runtime_seconds: 30,
        cut_count: 4,
        events: timelineEvents.map(e => ({
          time: `${e.time}s`,
          type: e.type,
          label: e.label,
        })),
      },
      clean_script: {
        title: meta.title,
        word_count: meta.words,
        dialogue: scenes.map(s => ({
          scene: s.sceneNum,
          name: s.name,
          speaker: 'ACTOR',
          line: s.dialogue,
        })),
      },
    },
  }), [timelineEvents]);

  /* ---- Download JSON ---- */
  const handleDownloadJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(jsonEnvelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'production-pack.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [jsonEnvelope]);

  /* ---- Handle Print ---- */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /* ---- Actor Brief Text ---- */
  const actorBriefText = useMemo(() => {
    const lines = [
      `ACTOR BRIEF: ${meta.title}`,
      `Actor: ${meta.actor} | Runtime: ${meta.runtime} | Scenes: ${meta.scenes}`,
      `Format: ${meta.format} | Content Type: ${meta.contentType}`,
      '',
      'GENERAL DIRECTION:',
      'Talking-Head / ABR Hybrid: Hold eye contact. Use physical actions (slam, point, lean)',
      'to break up talking-head segments. Educational modifier: Confidence over enthusiasm.',
      '',
      'SCENE BREAKDOWN:',
      ...scenes.map(s =>
        `Scene ${s.sceneNum} (${s.timingStart}-${s.timingEnd}s): "${s.dialogue}"\n  Action: ${s.action}\n  Expression: ${s.actorExpression} | Energy: ${s.actorEnergy}/10 | Pace: ${s.actorPace}`
      ),
    ];
    return lines.join('\n');
  }, []);

  /* ---- Camera Sheet Text ---- */
  const cameraSheetText = useMemo(() => {
    const lines = [
      `CAMERA SHEET: ${meta.title}`,
      `Aspect Ratio: ${meta.aspectRatio} | Platform: ${meta.platform}`,
      '',
      ...scenes.map(s =>
        `Scene ${s.sceneNum} (${s.timingStart}-${s.timingEnd}s): ${s.cameraShot} | ${s.cameraAngle} | ${s.cameraMovement}`
      ),
    ];
    return lines.join('\n');
  }, []);

  /* ---- Edit Timeline Text ---- */
  const editTimelineText = useMemo(() => {
    const lines = [
      `EDIT TIMELINE: ${meta.title}`,
      `Total Runtime: 30s | Cuts: 4`,
      '',
      ...timelineEvents.map(e => `[${e.time.toFixed(1)}s] ${e.emoji} ${e.label} (${EVENT_TYPE_LABELS[e.type] || e.type})`),
    ];
    return lines.join('\n');
  }, [timelineEvents]);

  /* ---- Clean Script Text ---- */
  const cleanScriptText = useMemo(() => {
    const lines = [
      `${meta.title.toUpperCase()}`,
      `Written by: ${meta.actor} | ${meta.company} | ${meta.runtime}`,
      '',
      ...scenes.flatMap(s => [
        `[Scene ${s.sceneNum}: ${s.name}]`,
        `ACTOR: ${s.dialogue}`,
        `${s.action}`,
        '',
      ]),
      `---`,
      `${meta.words} words | ${meta.scenes} scenes | ${meta.runtime}`,
    ];
    return lines.join('\n');
  }, []);

  /* ---- Golden Rules Text ---- */
  const goldenRulesText = useMemo(() => {
    const lines = [
      '18 GOLDEN RULES',
      '',
      ...goldenRules.map(r => `[${r.category}] #${r.num} ${r.name}\n${r.description}`),
    ];
    return lines.join('\n\n');
  }, []);



  /* ---- Tab Content Switcher ---- */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'all': return <AllDocumentsView />;
      case 'actor': return <ActorBriefView />;
      case 'camera': return <CameraSheetView />;
      case 'edit': return <EditTimelineView />;
      case 'script': return <CleanScriptView />;
      case 'golden-rules': return <GoldenRulesView />;
      default: return <AllDocumentsView />;
    }
  };

  /* ================================================================== */
  /*  SUB-VIEWS                                                          */
  /* ================================================================== */

  /* ---- All Documents (Default) ---- */
  function AllDocumentsView() {
    return (
      <div className="space-y-12">
        <DocumentSection id="actor" title="Actor Brief" icon={<Mic size={18} style={{ color: ACCENT }} />} copyText={actorBriefText}>
          <ActorBriefInner />
        </DocumentSection>

        <DocumentSection id="camera" title="Camera Sheet" icon={<Camera size={18} style={{ color: ACCENT }} />} copyText={cameraSheetText}>
          <CameraSheetInner />
        </DocumentSection>

        <DocumentSection id="edit" title="Edit Timeline" icon={<Scissors size={18} style={{ color: ACCENT }} />} copyText={editTimelineText}>
          <EditTimelineInner />
        </DocumentSection>

        <DocumentSection id="script" title="Clean Script" icon={<FileText size={18} style={{ color: ACCENT }} />} copyText={cleanScriptText}>
          <CleanScriptInner />
        </DocumentSection>

        <DocumentSection id="golden-rules" title="18 Golden Rules" icon={<Shield size={18} style={{ color: ACCENT }} />} copyText={goldenRulesText}>
          <GoldenRulesInner />
        </DocumentSection>
      </div>
    );
  }

  /* ---- Document Section Wrapper ---- */
  function DocumentSection({ id, title, icon, copyText, children }: { id: string; title: string; icon: React.ReactNode; copyText: string; children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const copy = useCallback(async () => {
      try { await navigator.clipboard.writeText(copyText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    }, [copyText]);
    const handlePrintDoc = useCallback(() => {
      setPrintFilter(id);
      setTimeout(() => { window.print(); setTimeout(() => setPrintFilter('all'), 500); }, 100);
    }, [id]);
    return (
      <div className="border border-border-subtle rounded-xl overflow-hidden" data-doc={id}>
        <div className="flex items-center justify-between px-4 py-3 bg-bg-tertiary/40 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border-subtle transition-all">
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handlePrintDoc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border-subtle transition-all">
              <Printer size={12} />
              Print PDF
            </button>
          </div>
        </div>
        <div className="p-4 md:p-5">
          {children}
        </div>
      </div>
    );
  }

  /* ---- Actor Brief ---- */
  function ActorBriefInner() {
    return (
      <>
        <Card className="p-4 border-l-2" style={{ borderLeftColor: ACCENT }}>
          <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            <Clapperboard size={14} style={{ color: ACCENT }} />
            General Direction
          </h4>
          <p className="text-sm text-text-secondary mb-2">
            <strong className="text-text-primary">Talking-Head / ABR Hybrid:</strong> Every second is yours and the lens. Hold eye contact. Use physical actions (slam, point, lean) to break up talking-head segments.
          </p>
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">Educational modifier:</strong> Confidence over enthusiasm. Avoid teacher-energy.
          </p>
        </Card>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-tertiary text-left border-b border-border-subtle">
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Scene</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Timing</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Dialogue</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Action</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Expression</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Energy</th>
                <th className="py-2 font-medium whitespace-nowrap">Pace</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((s, i) => (
                <tr key={s.sceneNum} className={cn('border-b border-border-subtle/50', i % 2 === 0 ? 'bg-bg-tertiary/30' : '')}>
                  <td className="py-2 pr-3 text-text-primary font-medium whitespace-nowrap">{s.sceneNum}: {s.name}</td>
                  <td className="py-2 pr-3 text-text-secondary font-mono text-xs whitespace-nowrap">{s.timingStart}-{s.timingEnd}s</td>
                  <td className="py-2 pr-3 text-text-secondary max-w-[200px] truncate" title={s.dialogue}>{s.dialogue}</td>
                  <td className="py-2 pr-3 text-text-secondary max-w-[200px] truncate" title={s.action}>{s.action}</td>
                  <td className="py-2 pr-3 text-text-secondary whitespace-nowrap">{s.actorExpression}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      s.actorEnergy >= 9 ? 'bg-red-500/15 text-red-400' :
                      s.actorEnergy >= 8 ? 'bg-amber-500/15 text-amber-400' :
                      'bg-blue-500/15 text-blue-400'
                    )}>
                      {s.actorEnergy}/10
                    </span>
                  </td>
                  <td className="py-2 text-text-secondary whitespace-nowrap">{s.actorPace}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Expression &amp; Energy Arc</h4>
          <div className="flex items-end gap-2 h-24 bg-bg-tertiary/30 rounded-lg p-3">
            {scenes.map((s) => (
              <div key={s.sceneNum} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-text-tertiary mb-1">{s.actorEnergy}/10</div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(s.actorEnergy / 10) * 64}px` }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  className="w-full rounded-t"
                  style={{
                    backgroundColor: s.actorEnergy >= 9 ? '#EF4444' : s.actorEnergy >= 8 ? '#F59E0B' : '#3B82F6',
                    opacity: 0.7,
                  }}
                />
                <div className="text-[10px] text-text-secondary mt-1 text-center leading-tight">
                  {s.sceneNum}: {s.name.split(' ').slice(-1)[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function ActorBriefView() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
              <Mic size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Actor Brief</h3>
              <p className="text-sm text-text-secondary">{meta.actor} &middot; {meta.runtime} &middot; {meta.scenes} scenes</p>
            </div>
          </div>
          <ActionBar copyText={actorBriefText} onPrint={handlePrint} />
        </div>
        <ActorBriefInner />
      </div>
    );
  }

  /* ---- Camera Sheet ---- */
  function CameraSheetInner() {
    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-tertiary text-left border-b border-border-subtle">
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Scene</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Timing</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Shot</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Angle</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Movement</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Lens</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Framing Notes</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((s, i) => (
                <tr key={s.sceneNum} className={cn('border-b border-border-subtle/50', i % 2 === 0 ? 'bg-bg-tertiary/30' : '')}>
                  <td className="py-2 pr-3 text-text-primary font-medium whitespace-nowrap">{s.sceneNum}: {s.name}</td>
                  <td className="py-2 pr-3 text-text-secondary font-mono text-xs whitespace-nowrap">{s.timingStart}-{s.timingEnd}s</td>
                  <td className="py-2 pr-3 text-text-secondary whitespace-nowrap">{s.cameraShot}</td>
                  <td className="py-2 pr-3 text-text-secondary whitespace-nowrap">{s.cameraAngle}</td>
                  <td className="py-2 pr-3 text-text-secondary whitespace-nowrap">{s.cameraMovement}</td>
                  <td className="py-2 pr-3 text-text-secondary font-mono text-xs whitespace-nowrap">
                    {s.sceneNum === 1 ? '85mm' : s.sceneNum === 2 ? '50mm' : s.sceneNum === 3 ? '35mm' : s.sceneNum === 4 ? '50mm' : '85mm'}
                  </td>
                  <td className="py-2 text-text-tertiary text-xs whitespace-nowrap">
                    {s.sceneNum === 1 ? 'Shallow DOF, face fill' : s.sceneNum === 2 ? 'B-cam ECU insert' : s.sceneNum === 3 ? 'Wide for fridge walk' : s.sceneNum === 4 ? 'Product dolly' : 'Freeze frame CTA'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Card className="p-4">
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Zap size={14} style={{ color: WARNING }} />
            Lighting Notes (Per Scene)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenes.map((s) => (
              <div key={s.sceneNum} className="bg-bg-tertiary/40 rounded-lg p-3">
                <div className="text-xs font-medium text-text-primary mb-1">Scene {s.sceneNum}: {s.name}</div>
                <div className="text-xs text-text-secondary">
                  <span className="text-text-tertiary">Key:</span> {s.sceneNum === 1 ? 'Bright, even' : s.sceneNum === 5 ? 'Soft, warm' : 'Neutral'} <br />
                  <span className="text-text-tertiary">Fill:</span> {s.sceneNum === 1 ? 'Low (contrast)' : 'Medium'} <br />
                  <span className="text-text-tertiary">Rim:</span> {s.sceneNum === 1 || s.sceneNum === 5 ? 'Yes (separation)' : 'Optional'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  function CameraSheetView() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
              <Camera size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Camera Sheet</h3>
              <p className="text-sm text-text-secondary">{meta.aspectRatio} &middot; {meta.platform}</p>
            </div>
          </div>
          <ActionBar copyText={cameraSheetText} onPrint={handlePrint} />
        </div>
        <CameraSheetInner />
      </div>
    );
  }

  /* ---- Edit Timeline ---- */
  function EditTimelineInner() {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
            const emojiMap: Record<string, string> = {
              scene_start: '\ud83c\udfac',
              cut: '\u2702\ufe0f',
              text_overlay: '\ud83d\udcdd',
              sfx: '\ud83d\udd0a',
              music_cue: '\ud83c\udfb5',
              freeze_frame: '\u2744\ufe0f',
              loop_point: '\ud83d\udd01',
              caption_beat: '\ud83d\udccd',
            };
            return (
              <span key={key} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bg-tertiary text-xs text-text-secondary">
                <span>{emojiMap[key] || '\u25cf'}</span> {label}
              </span>
            );
          })}
        </div>

        <div className="w-full h-8 bg-bg-tertiary rounded-lg flex overflow-hidden">
          {scenes.map((s) => (
            <div
              key={s.sceneNum}
              className="flex items-center justify-center text-[10px] text-white font-medium"
              style={{
                width: `${(s.duration / 30) * 100}%`,
                backgroundColor: ['#8B5CF6', '#06D6A0', '#F59E0B', '#0EA5E9', '#EF4444'][s.sceneNum - 1],
                opacity: 0.75,
              }}
            >
              {s.sceneNum}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-tertiary text-left border-b border-border-subtle">
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Time</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Event</th>
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Type</th>
                <th className="py-2 font-medium whitespace-nowrap">Scene</th>
              </tr>
            </thead>
            <tbody>
              {timelineEvents.map((e, i) => (
                <tr key={i} className={cn('border-b border-border-subtle/50', i % 2 === 0 ? 'bg-bg-tertiary/30' : '')}>
                  <td className="py-2 pr-3 text-text-secondary font-mono text-xs whitespace-nowrap">{e.time.toFixed(1)}s</td>
                  <td className="py-2 pr-3 text-text-primary whitespace-nowrap">
                    <span className="mr-1.5">{e.emoji}</span>
                    {e.label}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      e.type === 'scene_start' ? 'bg-violet-500/15 text-violet-400' :
                      e.type === 'text_overlay' ? 'bg-blue-500/15 text-blue-400' :
                      e.type === 'sfx' ? 'bg-amber-500/15 text-amber-400' :
                      e.type === 'music_cue' ? 'bg-purple-500/15 text-purple-400' :
                      e.type === 'freeze_frame' ? 'bg-cyan-500/15 text-cyan-400' :
                      'bg-emerald-500/15 text-emerald-400'
                    )}>
                      {EVENT_TYPE_LABELS[e.type] || e.type}
                    </span>
                  </td>
                  <td className="py-2 text-text-secondary text-xs whitespace-nowrap">{e.scene !== undefined ? `Scene ${e.scene}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function EditTimelineView() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
              <Scissors size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Edit Timeline</h3>
              <p className="text-sm text-text-secondary">30s runtime &middot; 4 cuts &middot; {timelineEvents.length} events</p>
            </div>
          </div>
          <ActionBar copyText={editTimelineText} onPrint={handlePrint} />
        </div>
        <EditTimelineInner />
      </div>
    );
  }

  /* ---- Clean Script ---- */
  function CleanScriptInner() {
    return (
      <Card className="p-6 bg-bg-tertiary/20 font-mono text-sm leading-relaxed">
        <div className="text-center mb-6">
          <h4 className="text-lg font-bold text-text-primary uppercase tracking-wide">{meta.title}</h4>
          <p className="text-xs text-text-tertiary mt-1">Written by {meta.actor} &middot; {meta.company} &middot; {meta.runtime}</p>
        </div>

        <div className="space-y-6">
          {scenes.map((s) => (
            <div key={s.sceneNum}>
              <div className="text-xs text-text-tertiary mb-1 uppercase tracking-wider">
                Scene {s.sceneNum}: {s.name} ({s.timingStart}-{s.timingEnd}s)
              </div>
              <p className="text-text-primary font-semibold mb-1">ACTOR</p>
              <p className="text-text-primary mb-1">{s.dialogue}</p>
              <p className="text-text-tertiary italic text-xs">{s.action}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border-subtle text-center text-xs text-text-tertiary">
          {meta.words} words &middot; {meta.scenes} scenes &middot; {meta.runtime}
        </div>
      </Card>
    );
  }

  function CleanScriptView() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
              <FileText size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Clean Script</h3>
              <p className="text-sm text-text-secondary">{meta.words} words &middot; {meta.scenes} scenes &middot; {meta.runtime}</p>
            </div>
          </div>
          <ActionBar copyText={cleanScriptText} onPrint={handlePrint} />
        </div>
        <CleanScriptInner />
      </div>
    );
  }

  /* ---- Golden Rules ---- */
  function GoldenRulesInner() {
    const categories = [...new Set(goldenRules.map(r => r.category))];
    return (
      <div className="space-y-6">
        {categories.map((cat) => {
          const rules = goldenRules.filter(r => r.category === cat);
          const colors = CATEGORY_COLORS[cat] || { bg: 'bg-bg-tertiary', text: 'text-text-secondary' };
          return (
            <div key={cat}>
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mb-3', colors.bg, colors.text)}>
                <Sparkles size={12} />
                {cat}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rules.map((rule) => (
                  <Card key={rule.num} className="p-3 border-l-2" style={{ borderLeftColor: colors.text.replace('text-', '').replace('-400', '').replace('blue', '#3B82F6').replace('emerald', '#10B981').replace('purple', '#8B5CF6').replace('amber', '#F59E0B').replace('red', '#EF4444') }}>
                    <div className="flex items-start gap-2">
                      <span className={cn('text-xs font-bold mt-0.5', colors.text)}>#{rule.num}</span>
                      <div>
                        <div className="text-sm font-medium text-text-primary mb-0.5">{rule.name}</div>
                        <div className="text-xs text-text-secondary leading-relaxed">{rule.description}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function GoldenRulesView() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
              <Shield size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">18 Golden Rules</h3>
              <p className="text-sm text-text-secondary">Reference for production team</p>
            </div>
          </div>
          <ActionBar copyText={goldenRulesText} onPrint={handlePrint} />
        </div>
        <GoldenRulesInner />
      </div>
    );
  }

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  /* ── Show skeleton loading screen while initial data loads ── */
  if (briefLoading || dataLoading) {
    return <PhaseLoadingScreen phase={5} />;
  }

  return (
    <Layout>
      <PrintStyles />

      <div className="py-8 pb-12 no-print">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: ACCENT, color: '#fff' }}
            >
              PHASE 5
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: SUCCESS + '20', color: SUCCESS }}
            >
              <Package size={12} />
              SHIP &mdash; {meta.score}/100
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Production Output Pack</h1>
          <p className="text-base text-text-secondary">
            Consolidated from Phase 4 validated screenplay. Read-only export.
          </p>
          {briefError && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm flex items-center justify-between gap-4">
              <span>{briefError}</span>
              <button onClick={retryBrief} className="underline shrink-0">Retry</button>
            </div>
          )}
          {loadError && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
              {loadError}
            </div>
          )}
          {!briefError && briefId && (
            <p className="text-xs text-text-tertiary mt-2">
              Brief ID: <span className="font-mono">{briefId}</span>
              {briefLoading ? ' — loading…' : !isLive ? ' — showing example data' : ' — live data'}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-tertiary">
            <span className="flex items-center gap-1"><Film size={12} /> {meta.title}</span>
            <span>{meta.actor}</span>
            <span>{meta.platform}</span>
            <span>{meta.runtime}</span>
            <span>{meta.format}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              `${meta.scenes} scenes`, `${meta.cuts} cuts`, `${meta.words} words`, meta.aspectRatio, meta.language
            ].map((chip) => (
              <span key={chip} className="px-2 py-0.5 rounded-md bg-bg-tertiary text-xs text-text-secondary border border-border-subtle">
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ---- Tab Bar ---- */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: easeOut }}
          className="mb-6"
        >
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border',
                    isActive
                      ? 'border-border-subtle text-white'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  )}
                  style={isActive ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ---- Tab Content ---- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: easeOut }}
        >
          <Card phaseAccent={ACCENT} className="p-5 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: easeOut }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ---- Footer Navigation ---- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <button
            onClick={() => navigate('/phase/4')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-transparent border border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
          >
            <ChevronLeft size={14} />
            Back to Phase 4
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              <FileDown size={14} />
              Download All as PDF
            </button>
            <button
              onClick={handleExportDocx}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-transparent border border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Download as Word
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-transparent border border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
            >
              <Download size={14} />
              Download JSON Envelope
            </button>
            <button
              onClick={() => navigate('/phase/6')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <Zap size={14} />
              Open in Node Editor
            </button>
          </div>
        </motion.div>
      </div>

      {/* ---- Print-only content ---- */}
      <div className="print-only">
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#111' }}>
          {(printFilter === 'all' || printFilter === 'actor') && (
            <div style={{ marginBottom: '40px', pageBreakBefore: printFilter === 'all' ? 'auto' : 'always' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Actor Brief</h1>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>{meta.title} &middot; {meta.actor} &middot; {meta.runtime}</p>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Scene</th>
                    <th style={{ padding: '6px 8px' }}>Timing</th>
                    <th style={{ padding: '6px 8px' }}>Dialogue</th>
                    <th style={{ padding: '6px 8px' }}>Action</th>
                    <th style={{ padding: '6px 8px' }}>Expression</th>
                    <th style={{ padding: '6px 8px' }}>Energy</th>
                    <th style={{ padding: '6px 8px' }}>Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {scenes.map(s => (
                    <tr key={s.sceneNum} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '6px 8px' }}>{s.sceneNum}: {s.name}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{s.timingStart}-{s.timingEnd}s</td>
                      <td style={{ padding: '6px 8px' }}>{s.dialogue}</td>
                      <td style={{ padding: '6px 8px' }}>{s.action}</td>
                      <td style={{ padding: '6px 8px' }}>{s.actorExpression}</td>
                      <td style={{ padding: '6px 8px' }}>{s.actorEnergy}/10</td>
                      <td style={{ padding: '6px 8px' }}>{s.actorPace}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(printFilter === 'all' || printFilter === 'camera') && (
            <div style={{ marginBottom: '40px', pageBreakBefore: 'always' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Camera Sheet</h1>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Scene</th>
                    <th style={{ padding: '6px 8px' }}>Timing</th>
                    <th style={{ padding: '6px 8px' }}>Shot</th>
                    <th style={{ padding: '6px 8px' }}>Angle</th>
                    <th style={{ padding: '6px 8px' }}>Movement</th>
                  </tr>
                </thead>
                <tbody>
                  {scenes.map(s => (
                    <tr key={s.sceneNum} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '6px 8px' }}>{s.sceneNum}: {s.name}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{s.timingStart}-{s.timingEnd}s</td>
                      <td style={{ padding: '6px 8px' }}>{s.cameraShot}</td>
                      <td style={{ padding: '6px 8px' }}>{s.cameraAngle}</td>
                      <td style={{ padding: '6px 8px' }}>{s.cameraMovement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(printFilter === 'all' || printFilter === 'edit') && (
            <div style={{ marginBottom: '40px', pageBreakBefore: 'always' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Edit Timeline</h1>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Time</th>
                    <th style={{ padding: '6px 8px' }}>Event</th>
                    <th style={{ padding: '6px 8px' }}>Type</th>
                    <th style={{ padding: '6px 8px' }}>Scene</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineEvents.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{e.time.toFixed(1)}s</td>
                      <td style={{ padding: '6px 8px' }}>{e.label}</td>
                      <td style={{ padding: '6px 8px' }}>{EVENT_TYPE_LABELS[e.type] || e.type}</td>
                      <td style={{ padding: '6px 8px' }}>{e.scene !== undefined ? `Scene ${e.scene}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(printFilter === 'all' || printFilter === 'script') && (
            <div style={{ marginBottom: '40px', pageBreakBefore: 'always' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>{meta.title}</h1>
              <p style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginBottom: '24px' }}>Written by {meta.actor} &middot; {meta.company} &middot; {meta.runtime}</p>
              {scenes.map(s => (
                <div key={s.sceneNum} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Scene {s.sceneNum}: {s.name} ({s.timingStart}-{s.timingEnd}s)</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>ACTOR</div>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>{s.dialogue}</div>
                  <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>{s.action}</div>
                </div>
              ))}
              <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #ccc', fontSize: '10px', color: '#888', textAlign: 'center' }}>
                {meta.words} words &middot; {meta.scenes} scenes &middot; {meta.runtime}
              </div>
            </div>
          )}

          {(printFilter === 'all' || printFilter === 'golden-rules') && (
            <div style={{ pageBreakBefore: 'always' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>18 Golden Rules</h1>
              {(() => {
                const cats = [...new Set(goldenRules.map(r => r.category))];
                return cats.map(cat => (
                  <div key={cat} style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</h2>
                    {goldenRules.filter(r => r.category === cat).map(rule => (
                      <div key={rule.num} style={{ marginBottom: '8px', paddingLeft: '12px', borderLeft: '2px solid #ccc' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>#{rule.num} {rule.name}</div>
                        <div style={{ fontSize: '10px', color: '#555' }}>{rule.description}</div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
