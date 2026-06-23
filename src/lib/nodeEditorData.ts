export interface NodeType {
  id: string;
  label: string;
  category: 'input' | 'generate' | 'audio' | 'composite' | 'output';
  tool: string;
  color: string;
  inputs: string[];
  outputs: string[];
}

export interface GraphNode {
  id: string;
  type: string;
  sceneBinding: number | null;
  position: { x: number; y: number };
  parameters: Record<string, unknown>;
  promptTemplate?: string;
  renderedPrompt?: string;
  core?: boolean; // true = from approved screenplay (other phases), false = user-added in Phase 6
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
}

export const NODE_TYPES: NodeType[] = [
  { id: 'reference.actor', label: 'Actor Ref', category: 'input', tool: 'midjourney-cref', color: '#F59E0B', inputs: [], outputs: ['lookbook'] },
  { id: 't2i.keyframe', label: 'Keyframe', category: 'generate', tool: 'midjourney', color: '#8B5CF6', inputs: ['actor_lock'], outputs: ['keyframe'] },
  { id: 'i2v.scene', label: 'Image→Video', category: 'generate', tool: 'kling-2.0-master', color: '#06D6A0', inputs: ['first_frame'], outputs: ['clip'] },
  { id: 't2v.scene', label: 'Text→Video', category: 'generate', tool: 'kling-2.0-master', color: '#0EA5E9', inputs: ['prompt'], outputs: ['clip'] },
  { id: 'tts.voiceover', label: 'Voiceover', category: 'audio', tool: 'elevenlabs', color: '#EC4899', inputs: ['script'], outputs: ['audio'] },
  { id: 'audio.lipsync', label: 'Lip Sync', category: 'audio', tool: 'sync.so', color: '#F97316', inputs: ['video', 'audio'], outputs: ['synced_video'] },
  { id: 'audio.sfx', label: 'SFX', category: 'audio', tool: 'elevenlabs-sfx', color: '#EF4444', inputs: [], outputs: ['audio'] },
  { id: 'audio.music', label: 'Music', category: 'audio', tool: 'epidemic-load', color: '#D946EF', inputs: [], outputs: ['audio'] },
  { id: 'overlay.text', label: 'Text Overlay', category: 'composite', tool: 'compositor-capcut', color: '#3B82F6', inputs: [], outputs: ['card'] },
  { id: 'transition.cut', label: 'Cut', category: 'composite', tool: 'compositor-capcut', color: '#6366F1', inputs: [], outputs: ['transition'] },
  { id: 'compositor.scene', label: 'Scene Comp', category: 'composite', tool: 'compositor-capcut', color: '#22C55E', inputs: ['video_layer', 'audio_layer', 'overlay_layer', 'sfx_layer'], outputs: ['scene_comp'] },
  { id: 'compositor.master', label: 'Master Comp', category: 'composite', tool: 'compositor-capcut', color: '#14B8A6', inputs: ['scene_comps', 'music', 'transitions'], outputs: ['master_comp'] },
  { id: 'render.output', label: 'Render', category: 'output', tool: 'compositor-capcut', color: '#64748B', inputs: ['master_comp'], outputs: ['final_video'] },
];

export const CATEGORY_LABELS: Record<string, string> = {
  input: 'Input',
  generate: 'Generate',
  audio: 'Audio',
  composite: 'Composite',
  output: 'Output',
};

export const INITIAL_NODES: GraphNode[] = [
  // Scene 1: THE HOOK
  { id: 's1.keyframe', type: 't2i.keyframe', sceneBinding: 1, position: { x: 200, y: 80 },
    core: true, parameters: { aspect_ratio: '9:16', stylize: 250, seed: null }, promptTemplate: '{{scene.camera.shot_size}} of {{scene.action}}...', renderedPrompt: 'Close-up of face filling frame, eyes wide, two bottles held up. Low angle, handheld micro-jolt.' },
  { id: 's1.i2v', type: 'i2v.scene', sceneBinding: 1, position: { x: 400, y: 80 },
    core: true, parameters: { duration_seconds: 3, motion_strength: 0.3, camera_motion: 'Static' }, renderedPrompt: 'Static camera motion. Off-camera VO over B-roll. Duration 3.0s.' },
  { id: 's1.tts', type: 'tts.voiceover', sceneBinding: 1, position: { x: 600, y: 40 },
    core: true, parameters: { voice_id: null, pace: 'Fast', energy: '9/10' }, renderedPrompt: "I tested 47 skincare products so you don't have to." },
  { id: 's1.overlay', type: 'overlay.text', sceneBinding: 1, position: { x: 600, y: 120 },
    core: true, parameters: { text: '47 PRODUCTS', appears_at: 0.3, disappears_at: 2.5, position: 'center', style: '72pt neon yellow' } },
  { id: 's1.sfx1', type: 'audio.sfx', sceneBinding: 1, position: { x: 600, y: 180 },
    core: true, parameters: { timestamp_in_scene: 2.8, duration: 0.5 }, renderedPrompt: 'Beat drop' },
  { id: 's1.comp', type: 'compositor.scene', sceneBinding: 1, position: { x: 800, y: 80 },
    core: true, parameters: { duration_seconds: 3 } },

  // Scene 2: AUTHORITY GAP
  { id: 's2.keyframe', type: 't2i.keyframe', sceneBinding: 2, position: { x: 200, y: 300 },
    core: true, parameters: { aspect_ratio: '9:16', stylize: 250, seed: null }, renderedPrompt: 'Medium shot of actor shaking bottle, serious expression, one finger raised. Eye level.' },
  { id: 's2.i2v', type: 'i2v.scene', sceneBinding: 2, position: { x: 400, y: 300 },
    core: true, parameters: { duration_seconds: 5, motion_strength: 0.4, camera_motion: 'Static' }, renderedPrompt: 'Static camera with B-cam ECU insert at 5s. Duration 5.0s.' },
  { id: 's2.tts', type: 'tts.voiceover', sceneBinding: 2, position: { x: 600, y: 260 },
    core: true, parameters: { voice_id: null, pace: 'Normal', energy: '7/10' }, renderedPrompt: 'And I found that 70% of vitamin C serums go bad before you finish them.' },
  { id: 's2.overlay', type: 'overlay.text', sceneBinding: 2, position: { x: 600, y: 340 },
    core: true, parameters: { text: '70% GO BAD', appears_at: 4.0, disappears_at: 7.0, position: 'bottom-third', style: 'red warning' } },
  { id: 's2.sfx1', type: 'audio.sfx', sceneBinding: 2, position: { x: 600, y: 400 },
    core: true, parameters: { timestamp_in_scene: 5.5, duration: 0.5 }, renderedPrompt: 'Alert SFX' },
  { id: 's2.comp', type: 'compositor.scene', sceneBinding: 2, position: { x: 800, y: 300 },
    core: true, parameters: { duration_seconds: 5 } },

  // Scene 3: THE HACK
  { id: 's3.keyframe', type: 't2i.keyframe', sceneBinding: 3, position: { x: 200, y: 520 },
    core: true, parameters: { aspect_ratio: '9:16', stylize: 250, seed: null }, renderedPrompt: 'Medium shot of actor at open fridge, placing bottle inside. Push-in motion.' },
  { id: 's3.i2v', type: 'i2v.scene', sceneBinding: 3, position: { x: 400, y: 520 },
    core: true, parameters: { duration_seconds: 7, motion_strength: 0.3, camera_motion: 'Push-in' }, renderedPrompt: 'Push-in camera motion. Actor walks to fridge. Duration 7.0s.' },
  { id: 's3.tts', type: 'tts.voiceover', sceneBinding: 3, position: { x: 600, y: 480 },
    core: true, parameters: { voice_id: null, pace: 'Fast→Slow', energy: '8/10' }, renderedPrompt: 'Store it in the fridge. It lasts twice as long.' },
  { id: 's3.overlay', type: 'overlay.text', sceneBinding: 3, position: { x: 600, y: 560 },
    core: true, parameters: { text: 'STORE IN FRIDGE', appears_at: 12.0, disappears_at: 14.0, position: 'center', style: 'green checkmark' } },
  { id: 's3.sfx1', type: 'audio.sfx', sceneBinding: 3, position: { x: 600, y: 620 },
    core: true, parameters: { timestamp_in_scene: 13.0, duration: 0.5 }, renderedPrompt: 'Ding SFX' },
  { id: 's3.comp', type: 'compositor.scene', sceneBinding: 3, position: { x: 800, y: 520 },
    core: true, parameters: { duration_seconds: 7 } },

  // Scene 4: THE PROOF
  { id: 's4.keyframe', type: 't2i.keyframe', sceneBinding: 4, position: { x: 200, y: 740 },
    core: true, parameters: { aspect_ratio: '9:16', stylize: 250, seed: null }, renderedPrompt: 'Medium shot of actor holding calendar, pointing to dates. Dolly in at 18s.' },
  { id: 's4.i2v', type: 'i2v.scene', sceneBinding: 4, position: { x: 400, y: 740 },
    core: true, parameters: { duration_seconds: 10, motion_strength: 0.5, camera_motion: 'Dolly in' }, renderedPrompt: 'Dolly in camera motion. Product close-up at 18s. Duration 10.0s.' },
  { id: 's4.tts', type: 'tts.voiceover', sceneBinding: 4, position: { x: 600, y: 700 },
    core: true, parameters: { voice_id: null, pace: 'Normal', energy: '7/10' }, renderedPrompt: 'I did this for 30 days. My $60 serum lasted 60 days instead of 30.' },
  { id: 's4.overlay', type: 'overlay.text', sceneBinding: 4, position: { x: 600, y: 780 },
    core: true, parameters: { text: '$60 → 60 DAYS', appears_at: 18.0, disappears_at: 22.0, position: 'center', style: 'count-up animation' } },
  { id: 's4.sfx1', type: 'audio.sfx', sceneBinding: 4, position: { x: 600, y: 840 },
    core: true, parameters: { timestamp_in_scene: 22.0, duration: 1.0 }, renderedPrompt: 'Cash register SFX (ONE PEAK)' },
  { id: 's4.comp', type: 'compositor.scene', sceneBinding: 4, position: { x: 800, y: 740 },
    core: true, parameters: { duration_seconds: 10 } },

  // Scene 5: CTA
  { id: 's5.keyframe', type: 't2i.keyframe', sceneBinding: 5, position: { x: 200, y: 960 },
    core: true, parameters: { aspect_ratio: '9:16', stylize: 250, seed: null }, renderedPrompt: 'Close-up of actor pointing down, urgent-friendly expression. Static freeze frame.' },
  { id: 's5.i2v', type: 'i2v.scene', sceneBinding: 5, position: { x: 400, y: 960 },
    core: true, parameters: { duration_seconds: 5, motion_strength: 0.2, camera_motion: 'Static' }, renderedPrompt: 'Static camera. Actor points to save area. Duration 5.0s.' },
  { id: 's5.tts', type: 'tts.voiceover', sceneBinding: 5, position: { x: 600, y: 920 },
    core: true, parameters: { voice_id: null, pace: 'Normal-Urgent', energy: '8/10' }, renderedPrompt: 'Save this before your serum goes bad.' },
  { id: 's5.overlay', type: 'overlay.text', sceneBinding: 5, position: { x: 600, y: 1000 },
    core: true, parameters: { text: 'SAVE THIS', appears_at: 25.0, disappears_at: 29.5, position: 'center', style: 'pulsing text' } },
  { id: 's5.comp', type: 'compositor.scene', sceneBinding: 5, position: { x: 800, y: 960 },
    core: true, parameters: { duration_seconds: 5 } },

  // Global nodes
  { id: 'ref.actor', type: 'reference.actor', sceneBinding: null, position: { x: 40, y: 80 },
    core: true, parameters: { style_lock: 'lifestyle', angles: ['front', '3q-left', '3q-right', 'profile'] }, renderedPrompt: 'Reference sheet of Sarah K., four angles, neutral expression, professional lookbook, 9:16.' },
  { id: 'audio.music', type: 'audio.music', sceneBinding: null, position: { x: 1000, y: 40 },
    core: true, parameters: { duration_seconds: 30 }, renderedPrompt: 'Background music bed. Builds through video, fades at 29s.' },
  { id: 'master.comp', type: 'compositor.master', sceneBinding: null, position: { x: 1000, y: 200 },
    core: true, parameters: { total_runtime: 30 } },
  { id: 'render.out', type: 'render.output', sceneBinding: null, position: { x: 1200, y: 200 },
    core: true, parameters: { resolution: '1080x1920', codec: 'H.264', fps: 30, bitrate: '12Mbps' } },
];

export const INITIAL_EDGES: GraphEdge[] = [
  // Scene 1 connections
  { id: 'e1', from: 'ref.actor:lookbook', to: 's1.keyframe:actor_lock' },
  { id: 'e2', from: 's1.keyframe:keyframe', to: 's1.i2v:first_frame' },
  { id: 'e3', from: 's1.i2v:clip', to: 's1.comp:video_layer' },
  { id: 'e4', from: 's1.tts:audio', to: 's1.comp:audio_layer' },
  { id: 'e5', from: 's1.overlay:card', to: 's1.comp:overlay_layer' },
  { id: 'e6', from: 's1.sfx1:audio', to: 's1.comp:sfx_layer' },
  { id: 'e7', from: 's1.comp:scene_comp', to: 'master.comp:scene_comps' },

  // Scene 2 connections
  { id: 'e8', from: 'ref.actor:lookbook', to: 's2.keyframe:actor_lock' },
  { id: 'e9', from: 's2.keyframe:keyframe', to: 's2.i2v:first_frame' },
  { id: 'e10', from: 's2.i2v:clip', to: 's2.comp:video_layer' },
  { id: 'e11', from: 's2.tts:audio', to: 's2.comp:audio_layer' },
  { id: 'e12', from: 's2.overlay:card', to: 's2.comp:overlay_layer' },
  { id: 'e13', from: 's2.sfx1:audio', to: 's2.comp:sfx_layer' },
  { id: 'e14', from: 's2.comp:scene_comp', to: 'master.comp:scene_comps' },

  // Scene 3 connections
  { id: 'e15', from: 'ref.actor:lookbook', to: 's3.keyframe:actor_lock' },
  { id: 'e16', from: 's3.keyframe:keyframe', to: 's3.i2v:first_frame' },
  { id: 'e17', from: 's3.i2v:clip', to: 's3.comp:video_layer' },
  { id: 'e18', from: 's3.tts:audio', to: 's3.comp:audio_layer' },
  { id: 'e19', from: 's3.overlay:card', to: 's3.comp:overlay_layer' },
  { id: 'e20', from: 's3.sfx1:audio', to: 's3.comp:sfx_layer' },
  { id: 'e21', from: 's3.comp:scene_comp', to: 'master.comp:scene_comps' },

  // Scene 4 connections
  { id: 'e22', from: 'ref.actor:lookbook', to: 's4.keyframe:actor_lock' },
  { id: 'e23', from: 's4.keyframe:keyframe', to: 's4.i2v:first_frame' },
  { id: 'e24', from: 's4.i2v:clip', to: 's4.comp:video_layer' },
  { id: 'e25', from: 's4.tts:audio', to: 's4.comp:audio_layer' },
  { id: 'e26', from: 's4.overlay:card', to: 's4.comp:overlay_layer' },
  { id: 'e27', from: 's4.sfx1:audio', to: 's4.comp:sfx_layer' },
  { id: 'e28', from: 's4.comp:scene_comp', to: 'master.comp:scene_comps' },

  // Scene 5 connections
  { id: 'e29', from: 'ref.actor:lookbook', to: 's5.keyframe:actor_lock' },
  { id: 'e30', from: 's5.keyframe:keyframe', to: 's5.i2v:first_frame' },
  { id: 'e31', from: 's5.i2v:clip', to: 's5.comp:video_layer' },
  { id: 'e32', from: 's5.tts:audio', to: 's5.comp:audio_layer' },
  { id: 'e33', from: 's5.overlay:card', to: 's5.comp:overlay_layer' },
  { id: 'e34', from: 's5.comp:scene_comp', to: 'master.comp:scene_comps' },

  // Master connections
  { id: 'e35', from: 'audio.music:audio', to: 'master.comp:music' },
  { id: 'e36', from: 'master.comp:master_comp', to: 'render.out:master_comp' },
];

export const META_DATA = {
  title: 'The Vitamin C Mistake Nobody Talks About',
  actor: 'Sarah K.',
  company: 'GlowLab',
  platform: 'Instagram',
  format: 'Talking-Head / ABR Hybrid',
  contentType: 'Educational',
  structure: 'D — Shocking Fact',
  runtime: '30s',
  scenes: 5,
  verdict: 'SHIP',
  score: 87,
  aspectRatio: '9:16',
};

export const SCENE_DIALOGUES = [
  { scene: 1, name: 'THE HOOK', text: "I tested 47 skincare products so you don't have to." },
  { scene: 2, name: 'AUTHORITY GAP', text: 'And I found that 70% of vitamin C serums go bad before you finish them.' },
  { scene: 3, name: 'THE HACK', text: 'Store it in the fridge. It lasts twice as long.' },
  { scene: 4, name: 'THE PROOF', text: 'I did this for 30 days. My $60 serum lasted 60 days instead of 30.' },
  { scene: 5, name: 'CTA', text: 'Save this before your serum goes bad.' },
];
