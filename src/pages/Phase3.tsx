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
  Sparkles,
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

/* Hardcoded fallback removed — all screenplay data comes from the backend */

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

export default function Phase3() {
  const navigate = useNavigate();
  const { briefId, loading: briefLoading, error: briefError, retry: retryBrief } = useBriefBootstrap();

  /* Auto-populated from Phase 1 (read-only) */
  const [platform, setPlatform] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [lengthSec, setLengthSec] = useState(30);
  const [actorCount, setActorCount] = useState(1);
  const [actorName, setActorName] = useState('');
  const [languageCode, setLanguageCode] = useState('EN');

  /* Auto-derived from Phase 2 */
  const [contentType, setContentType] = useState('');
  const [structureName, setStructureName] = useState('');
  const [formatSkin, setFormatSkin] = useState('');

  const [scenes, setScenes] = useState<SceneBeat[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const pageAccent = '#EF4444';

  /* Pull Phase 1 / Phase 2 context for the header bar */
  useEffect(() => {
    if (!briefId) return;
    phase1Api
      .get(briefId)
      .then((res) => {
        if (res.data.platform) setPlatform(res.data.platform);
        if (res.data.aspect_ratio) setAspectRatio(res.data.aspect_ratio as string);
        if (res.data.number_of_actors) setActorCount(res.data.number_of_actors as number);
        if (res.data.on_camera_actor) setActorName(res.data.on_camera_actor as string);
        if (res.data.language) setLanguageCode(res.data.language as string);
        if (res.data.estimated_length) {
          const parsedLen = parseInt(res.data.estimated_length as string, 10);
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
          setGenerating(false);
        } else {
          generate(briefId);
        }
      })
      .catch(() => generate(briefId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefId]);

  const totalRuntime = scenes.length > 0 ? (scenes[scenes.length - 1]?.timingEnd || 0) : 0;
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
                {generating ? ' — generating…' : ''}
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
              Complexity: {contentType || '—'}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-bg-tertiary text-text-tertiary border border-border-subtle">
              Format: {formatSkin || '—'}
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
              {languageCode}
            </span>
          </div>
        </div>

        {/* ═══════════════ Loading / Empty State ═══════════════ */}
        {generating && scenes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: pageAccent }} />
            <p className="text-lg font-semibold text-text-primary mb-1">Generating your screenplay…</p>
            <p className="text-sm text-text-secondary">The AI director is crafting a viral-optimized script from your Phase 1 &amp; 2 inputs.</p>
          </div>
        )}

        {!generating && scenes.length === 0 && !genError && (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border-subtle bg-bg-secondary">
            <Camera className="w-10 h-10 text-text-tertiary mb-4" />
            <p className="text-lg font-semibold text-text-primary mb-1">No screenplay yet</p>
            <p className="text-sm text-text-secondary mb-4">Click below to generate your AI-powered screenplay from Phase 1 &amp; 2 data.</p>
            <button
              onClick={() => briefId && generate(briefId)}
              disabled={!briefId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-text-inverse disabled:opacity-40"
              style={{ backgroundColor: pageAccent }}
            >
              <Sparkles className="w-4 h-4" />
              Generate Screenplay
            </button>
          </div>
        )}

        {genError && scenes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-error/30 bg-error/5">
            <AlertCircle className="w-8 h-8 text-error mb-3" />
            <p className="text-sm text-error mb-3">{genError}</p>
            <button
              onClick={() => briefId && generate(briefId)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-bg-tertiary border border-border-subtle text-text-primary hover:bg-bg-quaternary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {scenes.length > 0 && (<>
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
        </>)}
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
