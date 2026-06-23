import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Mic,
  Eye,
  Volume2,
  Users,
  Camera,
  Scissors,
  Target,
  AlertCircle,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { phase1 as phase1Api, phase2 as phase2Api, phase3 as phase3Api, ApiError } from '@/lib/api';
import { useBriefBootstrap } from '@/lib/useBriefBootstrap';

/* ═══════════════════════════════════════════════════════════════════ */
/*  TYPES                                                              */
/* ═══════════════════════════════════════════════════════════════════ */

interface SceneBeat {
  sceneNum: number;
  name: string;
  timingStart: number;
  timingEnd: number;
  duration: number;
  dialogue: string;
  action: string;
  camera: { shot: string; angle: string; movement: string };
  actor: { expression: string; energy: number; pace: string };
  visual: string;
  audio: string;
  editMarkers: { time: string; event: string }[];
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  STATIC DATA                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

const KEY_GOLDEN_RULES = [
  { num: 6, name: "Show Don't Tell", desc: 'Every fact must be SHOWN, not just said. If you can show it visually, don\'t say it.' },
  { num: 7, name: 'No Talking Head >2s', desc: 'Must have a visual change every 2 seconds. Talking heads kill retention.' },
  { num: 8, name: 'Silent Moments', desc: 'Reaction shots, product reveals, before/after cuts need no dialogue. Let the viewer absorb.' },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  AUTO-GENERATED SCREENPLAY                                          */
/* ═══════════════════════════════════════════════════════════════════ */

const AUTO_SCREENPLAY: SceneBeat[] = [
  {
    sceneNum: 1, name: 'THE HOOK', timingStart: 0.0, timingEnd: 3.0, duration: 3.0,
    dialogue: "I tested 47 skincare products so you don't have to.",
    action: "(Actor: Face fills frame. Eyes wide. Holds up two bottles.)",
    camera: { shot: "Close-up", angle: "Low angle", movement: "Handheld micro-jolt" },
    actor: { expression: "Confident, slight smile", energy: 9, pace: "Fast" },
    visual: 'Text overlay: "47 PRODUCTS" — 72pt, neon yellow, pop-in at 0.3s',
    audio: "Voice onset at 0.0s. No music. Beat drop at 2.8s.",
    editMarkers: [
      { time: "0.0s", event: "Open on face — MCU, low angle, handheld" },
      { time: "0.3s", event: '"47 PRODUCTS" text overlay pop-in' },
      { time: "0.5s", event: "Actor holds up two bottles — contrast + motion" },
      { time: "2.8s", event: "Hard cut to Scene 2" },
    ],
  },
  {
    sceneNum: 2, name: 'AUTHORITY GAP', timingStart: 3.0, timingEnd: 8.0, duration: 5.0,
    dialogue: "And I found that 70% of vitamin C serums go bad before you finish them.",
    action: "(Actor: Shakes one bottle. Expression shifts to serious. Holds up one finger.)",
    camera: { shot: "Medium", angle: "Eye level", movement: "Static, B-cam ECU insert at 5s" },
    actor: { expression: "Serious, authoritative", energy: 7, pace: "Normal" },
    visual: 'Text overlay: "70% GO BAD" — red, bottom third, warning icon',
    audio: "Low beat enters at 20% volume. Alert SFX at 5.5s.",
    editMarkers: [
      { time: "3.0s", event: "Cut to medium shot" },
      { time: "4.0s", event: '"70% GO BAD" text overlay' },
      { time: "5.0s", event: "B-cam ECU on bottle (pattern interrupt)" },
      { time: "5.5s", event: "Alert sound effect" },
    ],
  },
  {
    sceneNum: 3, name: 'THE HACK', timingStart: 8.0, timingEnd: 15.0, duration: 7.0,
    dialogue: "Store it in the fridge. It lasts twice as long.",
    action: "(Actor: Walks to fridge. Opens door. Places bottle inside. Turns back to camera. Expression: 'That's it.')",
    camera: { shot: "Medium", angle: "Eye level", movement: "Push-in 15% from 8-12s" },
    actor: { expression: "Excited-conspiratorial", energy: 8, pace: "Fast -> Slow" },
    visual: 'Text overlay: "STORE IN FRIDGE" — green, checkmark graphic, pop-in at 12.0s',
    audio: "Music builds to 35% volume. 'Ding' SFX on checkmark at 13.0s.",
    editMarkers: [
      { time: "8.0s", event: "Push-in starts, actor walks to fridge" },
      { time: "10.0s", event: "Fridge door open — B-roll insert" },
      { time: "12.0s", event: '"STORE IN FRIDGE" text overlay' },
      { time: "13.0s", event: "Ding on checkmark graphic" },
    ],
  },
  {
    sceneNum: 4, name: 'THE PROOF', timingStart: 15.0, timingEnd: 25.0, duration: 10.0,
    dialogue: "I did this for 30 days. My $60 serum lasted 60 days instead of 30.",
    action: "(Actor: Holds up calendar. Points to dates. Proud expression.)",
    camera: { shot: "Medium -> Close-up", angle: "Eye level", movement: "Dolly in on product at 18s" },
    actor: { expression: "Proud, confident", energy: 7, pace: "Normal" },
    visual: '"$60 -> 60 DAYS" count-up animation on screen at 18s',
    audio: "Steady beat at 40% volume. Cash register SFX at 22s (peak moment).",
    editMarkers: [
      { time: "15.0s", event: "Cut to calendar shot" },
      { time: "18.0s", event: 'Count-up animation "$60 -> 60 DAYS"' },
      { time: "22.0s", event: "Cash register SFX (ONE PEAK per video)" },
      { time: "23.0s", event: "Close-up on product result" },
    ],
  },
  {
    sceneNum: 5, name: 'CTA', timingStart: 25.0, timingEnd: 30.0, duration: 5.0,
    dialogue: "Save this before your serum goes bad.",
    action: "(Actor: Direct to camera. Points down to save area. Urgent but friendly.)",
    camera: { shot: "Close-up", angle: "Eye level", movement: "Static, freeze frame" },
    actor: { expression: "Urgent-friendly", energy: 8, pace: "Normal-urgent" },
    visual: '"SAVE THIS" pulsing text, arrow to save area, CTA card freeze at 29.5s',
    audio: "Music fades out over 3s. Pre-CTA silence beat at 29.0s.",
    editMarkers: [
      { time: "25.0s", event: '"SAVE THIS" pulsing text overlay' },
      { time: "27.0s", event: "Actor points to save area" },
      { time: "29.0s", event: "Pre-CTA freeze — silent 1.0s (executive decision space)" },
      { time: "29.5s", event: "Fade to end" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

export default function Phase3() {
  const navigate = useNavigate();
  const { briefId, loading: briefLoading, error: briefError, retry: retryBrief } = useBriefBootstrap();

  /* Auto-populated from Phase 1 (read-only) */
  const [platform, setPlatform] = useState('YouTube Shorts');
  const aspectRatio = '9:16';
  const [lengthSec, setLengthSec] = useState(30);
  const actorCount = 1; // Not yet tracked as a dedicated backend field
  const language = 'EN'; // Not yet tracked as a dedicated backend field

  /* Auto-derived from Phase 2 */
  const [contentType, setContentType] = useState('Educational');
  const [structureName, setStructureName] = useState('Step-by-Step');
  const [formatSkin, setFormatSkin] = useState('Demonstration');
  const contentComplexity = 'mid';
  const autoFormatSkin = 'Whiteboard / ABR Hybrid';
  const actorName = actorCount >= 1 ? 'SARAH' : 'VOICEOVER';

  const [scenes, setScenes] = useState<SceneBeat[]>(AUTO_SCREENPLAY);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const pageAccent = '#EF4444';

  /* Pull Phase 1 / Phase 2 context for the header bar */
  useEffect(() => {
    if (!briefId) return;
    phase1Api
      .get(briefId)
      .then((res) => {
        if (res.data.platform) setPlatform(res.data.platform);
        if (res.data.time_to_value) {
          const parsedLen = parseInt(res.data.time_to_value, 10);
          if (!Number.isNaN(parsedLen)) setLengthSec(parsedLen);
        }
      })
      .catch(() => {});
    phase2Api
      .get(briefId)
      .then((res) => {
        if (res.data.content_type) setContentType(res.data.content_type);
        if (res.data.selected_structure) setStructureName(res.data.selected_structure);
        if (res.data.selected_format) setFormatSkin(res.data.selected_format);
      })
      .catch(() => {});
  }, [briefId]);

  /* Load existing screenplay, or generate one if none exists yet */
  const generate = (briefIdArg: string) => {
    setGenerating(true);
    setGenError(null);
    phase3Api
      .generate(briefIdArg)
      .then((res) => {
        const generatedScenes = (res.scenes as SceneBeat[]) ?? [];
        if (generatedScenes.length > 0) {
          setScenes(generatedScenes);
          setIsLive(true);
        }
      })
      .catch((err: unknown) => {
        setGenError(
          err instanceof ApiError ? err.message : 'Could not generate the screenplay — backend unreachable'
        );
      })
      .finally(() => setGenerating(false));
  };

  useEffect(() => {
    if (!briefId) return;
    setGenerating(true);
    phase3Api
      .get(briefId)
      .then((res) => {
        if (res.generated && Array.isArray(res.scenes) && res.scenes.length > 0) {
          setScenes(res.scenes as SceneBeat[]);
          setIsLive(true);
          setGenerating(false);
        } else {
          generate(briefId);
        }
      })
      .catch(() => generate(briefId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefId]);

  const totalRuntime = scenes[scenes.length - 1]?.timingEnd || 30;
  const totalWords = scenes.reduce((sum, s) => sum + s.dialogue.split(/\s+/).filter(Boolean).length, 0);
  const cutCount = scenes.reduce((sum, s) => sum + s.editMarkers.length, 0);

  const handleBack = () => navigate('/phase/2');
  const handleContinue = () => {
    if (!briefId) return;
    phase3Api
      .advance(briefId)
      .then(() => navigate('/phase/4'))
      .catch((err: unknown) => {
        setGenError(err instanceof ApiError ? err.message : 'Could not continue — backend unreachable');
      });
  };

  return (
    <Layout>
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ═══════════════ Page Header ═══════════════ */}
        <div className="flex flex-col items-center justify-center py-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ backgroundColor: `${pageAccent}22` }}
          >
            <span className="text-2xl font-bold" style={{ color: pageAccent }}>3</span>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-text-primary mb-2"
          >
            Production Brief
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary text-center"
          >
            Scene-by-scene production document. Every second planned.
          </motion.p>
          {briefError && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm flex items-center justify-between gap-4 max-w-md w-full">
              <span>{briefError}</span>
              <button onClick={retryBrief} className="underline shrink-0">Retry</button>
            </div>
          )}
          {genError && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm max-w-md w-full">
              {genError} — showing an example screenplay instead.
            </div>
          )}
          {!briefError && briefId && (
            <div className="mt-2 flex items-center gap-3">
              <p className="text-xs text-text-tertiary">
                Brief ID: <span className="font-mono">{briefId}</span>
                {!isLive && !generating ? ' — showing example screenplay' : ''}
              </p>
              <button
                onClick={() => generate(briefId)}
                disabled={generating}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {generating ? (briefLoading ? 'Loading…' : 'Generating…') : 'Regenerate'}
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════ Production Header Bar ═══════════════ */}
        <div className="mb-8 rounded-xl border border-border-subtle bg-[#151821] p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-structure/15 text-accent-structure border border-accent-structure/20">
              {contentType}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-structure/15 text-accent-structure border border-accent-structure/20">
              {structureName}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-structure/15 text-accent-structure border border-accent-structure/20">
              {formatSkin}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-structure/15 text-accent-structure border border-accent-structure/20">
              {lengthSec}s
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-tertiary border border-border-subtle">
              Complexity: {contentComplexity}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-tertiary border border-border-subtle">
              Skin: {autoFormatSkin}
            </span>
          </div>

          {/* Read-only: Populated from Phase 1 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] text-text-tertiary uppercase mr-1">From Phase 1:</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-secondary border border-border-subtle">
              {platform}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-secondary border border-border-subtle">
              {aspectRatio}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-secondary border border-border-subtle">
              {lengthSec}s
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-secondary border border-border-subtle">
              {actorCount} actor{actorCount > 1 ? 's' : ''}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-secondary border border-border-subtle">
              {language}
            </span>
          </div>
        </div>

        {/* ═══════════════ Quick Jump Nav (sticky) ═══════════════ */}
        <div className="sticky top-0 z-30 mb-8 rounded-xl border border-border-subtle bg-[#151821]/95 backdrop-blur-sm p-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Target className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
            {scenes.map((scene) => (
              <a
                key={scene.sceneNum}
                href={`#scene-${scene.sceneNum}`}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap bg-bg-tertiary text-text-tertiary border border-border-subtle hover:text-text-secondary hover:border-border-medium transition-all"
              >
                {scene.timingStart}s · Scene {scene.sceneNum}: {scene.name}
              </a>
            ))}
          </div>
        </div>

        {/* ═══════════════ ALL SCENES — Continuous Scroll ═══════════════ */}
        <div className="space-y-8">
          {scenes.map((scene) => (
            <motion.section
              key={scene.sceneNum}
              id={`scene-${scene.sceneNum}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {/* Scene timing divider */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px flex-1 bg-border-subtle" />
                <span className="text-xs font-mono text-text-tertiary whitespace-nowrap">
                  {scene.timingStart}s – {scene.timingEnd}s
                </span>
                <div className="h-px flex-1 bg-border-subtle" />
              </div>

              {/* Scene header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                     style={{ backgroundColor: `${pageAccent}22`, color: pageAccent }}>
                  {scene.sceneNum}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Scene {scene.sceneNum}: {scene.name}
                  </h2>
                  <p className="text-xs text-text-secondary">{scene.duration.toFixed(1)}s duration</p>
                </div>
              </div>

              {/* DIALOGUE */}
              <div className="mb-4 rounded-xl border border-border-subtle bg-[#151821] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mic className="w-4 h-4" style={{ color: pageAccent }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: pageAccent }}>Dialogue</span>
                </div>
                <p className="text-base font-semibold text-text-primary mb-2">
                  {actorName} {actorCount >= 1 ? '(ON CAMERA)' : '(VOICEOVER)'}
                </p>
                <p className="text-sm text-text-primary leading-relaxed mb-3 font-mono">
                  {scene.dialogue}
                </p>
                <p className="text-xs text-text-secondary italic border-l-2 border-border-subtle pl-3">
                  {scene.action}
                </p>
              </div>

              {/* 4-column: Camera / Actor / Visual / Audio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#151821] border border-border-subtle">
                  <span className="text-[10px] font-bold uppercase text-text-tertiary flex items-center gap-1 mb-2">
                    <Camera className="w-3 h-3" /> Camera
                  </span>
                  <p className="text-xs text-text-primary"><strong>Shot:</strong> {scene.camera.shot}</p>
                  <p className="text-xs text-text-primary"><strong>Angle:</strong> {scene.camera.angle}</p>
                  <p className="text-xs text-text-primary"><strong>Move:</strong> {scene.camera.movement}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#151821] border border-border-subtle">
                  <span className="text-[10px] font-bold uppercase text-text-tertiary flex items-center gap-1 mb-2">
                    <Users className="w-3 h-3" /> Actor
                  </span>
                  <p className="text-xs text-text-primary"><strong>Expression:</strong> {scene.actor.expression}</p>
                  <p className="text-xs text-text-primary"><strong>Energy:</strong> {scene.actor.energy}/10</p>
                  <p className="text-xs text-text-primary"><strong>Pace:</strong> {scene.actor.pace}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#151821] border border-border-subtle">
                  <span className="text-[10px] font-bold uppercase text-text-tertiary flex items-center gap-1 mb-2">
                    <Eye className="w-3 h-3" /> Visual
                  </span>
                  <p className="text-xs text-text-primary leading-relaxed">{scene.visual}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#151821] border border-border-subtle">
                  <span className="text-[10px] font-bold uppercase text-text-tertiary flex items-center gap-1 mb-2">
                    <Volume2 className="w-3 h-3" /> Audio
                  </span>
                  <p className="text-xs text-text-primary leading-relaxed">{scene.audio}</p>
                </div>
              </div>

              {/* Edit Markers */}
              <div className="mb-4 rounded-xl border border-border-subtle bg-[#151821] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Scissors className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs font-bold uppercase text-text-secondary">Edit Markers</span>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-border-subtle" />
                  {scene.editMarkers.map((marker, mIdx) => (
                    <div key={mIdx} className="flex items-start gap-3 mb-2 relative">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5 relative z-10" style={{ backgroundColor: pageAccent }} />
                      <div>
                        <span className="text-xs font-mono font-bold" style={{ color: pageAccent }}>{marker.time}</span>
                        <span className="text-xs text-text-secondary ml-2">{marker.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Golden Rules — shown on every scene */}
              <div className="mb-4 rounded-xl border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-xs font-bold uppercase text-warning">Golden Rules for This Scene</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {KEY_GOLDEN_RULES.map((rule) => (
                    <div key={rule.num} className="p-2.5 rounded-lg bg-bg-tertiary/50">
                      <p className="text-xs font-semibold text-text-primary">{rule.name}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* ═══════════════ Script Stats ═══════════════ */}
        <div className="mt-10 pt-8 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-text-secondary" />
            <h2 className="text-lg font-semibold text-text-primary">Script Stats</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-[#151821] border border-border-subtle">
              <p className="text-2xl font-bold text-text-primary">{totalRuntime.toFixed(1)}s</p>
              <p className="text-[10px] text-text-tertiary uppercase mt-1">Total Runtime</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#151821] border border-border-subtle">
              <p className="text-2xl font-bold text-text-primary">{scenes.length}</p>
              <p className="text-[10px] text-text-tertiary uppercase mt-1">Scene Count</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#151821] border border-border-subtle">
              <p className="text-2xl font-bold text-text-primary">{totalWords}</p>
              <p className="text-[10px] text-text-tertiary uppercase mt-1">Word Count</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#151821] border border-border-subtle">
              <p className="text-2xl font-bold text-text-primary">{cutCount}</p>
              <p className="text-[10px] text-text-tertiary uppercase mt-1">Cut Count</p>
            </div>
          </div>
        </div>

        {/* ═══════════════ Footer ═══════════════ */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-border-subtle">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Phase 2
          </button>
          <button
            onClick={handleContinue}
            disabled={!briefId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: pageAccent }}
          >
            Continue to Phase 4
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </Layout>
  );
}
