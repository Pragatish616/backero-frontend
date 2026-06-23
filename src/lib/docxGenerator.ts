import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  convertInchesToTwip, Header, Footer, PageNumber,
} from 'docx';
import { saveAs } from 'file-saver';

/* ═══════════════════════════════════════════════════════════════════ */
/*  SCREENPLAY DATA                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

interface SceneData {
  sceneNum: number; name: string; timingStart: number; timingEnd: number; duration: number;
  dialogue: string; action: string; cameraShot: string; cameraAngle: string; cameraMovement: string;
  actorExpression: string; actorEnergy: number; actorPace: string; visual: string; audio: string;
}

const SCENES: SceneData[] = [
  { sceneNum: 1, name: 'THE HOOK', timingStart: 0, timingEnd: 3, duration: 3, dialogue: "I tested 47 skincare products so you don't have to.", action: "(Actor: Face fills frame. Eyes wide. Holds up two bottles.)", cameraShot: "Close-up", cameraAngle: "Low angle", cameraMovement: "Handheld micro-jolt", actorExpression: "Confident, slight smile", actorEnergy: 9, actorPace: "Fast", visual: 'Text overlay: "47 PRODUCTS" \u2014 72pt, neon yellow, pop-in at 0.3s', audio: "Voice onset at 0.0s. No music. Beat drop at 2.8s." },
  { sceneNum: 2, name: 'AUTHORITY GAP', timingStart: 3, timingEnd: 8, duration: 5, dialogue: "And I found that 70% of vitamin C serums go bad before you finish them.", action: "(Actor: Shakes one bottle. Expression shifts to serious. Holds up one finger.)", cameraShot: "Medium", cameraAngle: "Eye level", cameraMovement: "Static, B-cam ECU insert at 5s", actorExpression: "Serious, authoritative", actorEnergy: 7, actorPace: "Normal", visual: 'Text overlay: "70% GO BAD" \u2014 red, bottom third, warning icon', audio: "Low beat enters at 20% volume. Alert SFX at 5.5s." },
  { sceneNum: 3, name: 'THE HACK', timingStart: 8, timingEnd: 15, duration: 7, dialogue: "Store it in the fridge. It lasts twice as long.", action: "(Actor: Walks to fridge. Opens door. Places bottle inside. Turns back to camera.)", cameraShot: "Medium", cameraAngle: "Eye level", cameraMovement: "Push-in 15% from 8\u201312s", actorExpression: "Excited-conspiratorial", actorEnergy: 8, actorPace: "Fast \u2192 Slow", visual: 'Text overlay: "STORE IN FRIDGE" \u2014 green, checkmark graphic, pop-in at 12.0s', audio: "Music builds to 35% volume. 'Ding' SFX on checkmark at 13.0s." },
  { sceneNum: 4, name: 'THE PROOF', timingStart: 15, timingEnd: 25, duration: 10, dialogue: "I did this for 30 days. My $60 serum lasted 60 days instead of 30.", action: "(Actor: Holds up calendar. Points to dates. Proud expression.)", cameraShot: "Medium \u2192 Close-up", cameraAngle: "Eye level", cameraMovement: "Dolly in on product at 18s", actorExpression: "Proud, confident", actorEnergy: 7, actorPace: "Normal", visual: "$60 to 60 DAYS count-up animation on screen at 18s", audio: "Steady beat at 40% volume. Cash register SFX at 22s (peak moment)." },
  { sceneNum: 5, name: 'CTA', timingStart: 25, timingEnd: 30, duration: 5, dialogue: "Save this before your serum goes bad.", action: "(Actor: Direct to camera. Points down to save area. Urgent but friendly.)", cameraShot: "Close-up", cameraAngle: "Eye level", cameraMovement: "Static, freeze frame", actorExpression: "Urgent-friendly", actorEnergy: 8, actorPace: "Normal-urgent", visual: '"SAVE THIS" pulsing text, arrow to save area, CTA card freeze at 29.5s', audio: "Music fades out over 3s. Pre-CTA silence beat at 29.0s." },
];

const META = {
  title: 'The Vitamin C Mistake Nobody Talks About',
  actor: 'Sarah K.', company: 'GlowLab', platform: 'Instagram',
  format: 'Talking-Head / ABR Hybrid', contentType: 'Educational',
  runtime: '30s', scenes: 5, cuts: 4, words: 42,
  verdict: 'SHIP' as const, score: 87, aspectRatio: '9:16', language: 'English',
};

const GOLDEN_RULES = [
  { num: 1, name: 'Demonstration-First Dialogue', desc: 'Can this be SHOWN instead of SAID? If yes, move to visual. Dialogue is the fallback.', cat: 'Dialogue' },
  { num: 2, name: 'Action-to-Dialogue Ratio >= 2.0', desc: 'For every spoken word, >= 2 words of action/visual description must accompany it.', cat: 'Dialogue' },
  { num: 3, name: 'Silent-Runtime Quota by Format', desc: 'ABR >=50%, Whiteboard >=30%, Two-person >=25%, Talking-head >=20%, Hybrid >=35%.', cat: 'Audio' },
  { num: 4, name: 'Hook Parseable Muted', desc: 'Hook visual + caption alone must carry the full message. VO is multiplier, not carrier.', cat: 'Visual' },
  { num: 5, name: 'Broad -> Narrow -> Niche', desc: 'Hook = BROAD (universal). Body = NARROW (target ICP). CTA = NICHE (only right people convert).', cat: 'Structure' },
  { num: 6, name: "Show, Don't Tell (LOC/EBA/VWFA)", desc: 'Every fact is DEMONSTRATED. Numbers on screen simultaneously. Objects visible. Actions performed.', cat: 'Visual' },
  { num: 7, name: 'No Talking Head > 2s Without Change', desc: 'After 2s static talking-head, MT/V5 habituates. Change: cut, text, prop, gesture, B-roll.', cat: 'Visual' },
  { num: 8, name: 'Silent Moments Mandatory', desc: 'Reaction 0.5\u20131.0s, Product reveal 1.0\u20132.0s, Before/after 1.0s each, Text-only 1.0\u20132.0s, Pre-CTA freeze 1.0s.', cat: 'Audio' },
  { num: 9, name: 'Bridge Words Between Sentences', desc: '"And...", "But here\'s...", "Which means...", "So now...", "And that\'s why..."', cat: 'Dialogue' },
  { num: 10, name: 'Action-Integrated Dialogue (EBA+STS)', desc: 'Every line specifies WHAT THE ACTOR IS DOING. action_parenthetical reads as director\'s note.', cat: 'Dialogue' },
  { num: 11, name: 'Tri-Modal Convergence in 0-1.5s', desc: 'Visual (motion+contrast by 0.5s) + Audio (phoneme at 0.0s) + Written (hero text by 0.3s).', cat: 'Quality' },
  { num: 12, name: 'Research Fidelity Carry-Over', desc: 'Numeric claims match Phase-2 exactly. No inflation. On-screen number = spoken number = paper.', cat: 'Quality' },
  { num: 13, name: 'Studio-Realistic Scope', desc: 'Every camera move, lighting, prop, actor count achievable with available studio_assets.', cat: 'Quality' },
  { num: 14, name: 'Caption Coverage = 100%', desc: 'Every spoken word appears as synced caption block. 85% of social video watched muted.', cat: 'Visual' },
  { num: 15, name: 'One Peak Per Video', desc: 'Exactly ONE energy-10 / speed-ramp / hard-emphasis moment per video. At structural payoff.', cat: 'Structure' },
  { num: 16, name: 'Hook > Script > Format > Edit Priority', desc: 'When in doubt, optimize in this order. Hook must win first. Format is fourth.', cat: 'Structure' },
  { num: 17, name: '5x Outlier Match', desc: 'If reference video provided, match cut rhythm within +\u201320%. Do NOT copy dialogue.', cat: 'Quality' },
  { num: 18, name: 'Staccato Sentences', desc: 'Dialogue = 1-8 word beats. Hard stops. No conjunctions. Drum-like rhythm.', cat: 'Dialogue' },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  STYLE HELPERS                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

const ACCENT = '8B5CF6';
const C_GRAY = '6B7280';

function h(text: string, level: string = 'Heading1'): Paragraph {
  return new Paragraph({
    text,
    heading: level as any,
    spacing: { before: 240, after: 120 },
  });
}

function p(text: string, opts: { bold?: boolean; italic?: boolean; color?: string; size?: number; spacing?: { before?: number; after?: number } } = {}): Paragraph {
  return new Paragraph({
    spacing: opts.spacing || { after: 80 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, color: opts.color, size: opts.size ? opts.size * 2 : undefined })],
  });
}

function cell(text: string, opts: { bold?: boolean; width?: { size: number; type: typeof WidthType.AUTO }; shading?: string; header?: boolean } = {}): TableCell {
  const isBold = opts.bold || opts.header;
  return new TableCell({
    width: opts.width || { size: 100, type: WidthType.AUTO },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text, bold: isBold })],
    })],
  });
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  TABLES                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

function createTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
    rows: [
      new TableRow({
        children: headers.map(h => cell(h, { bold: true, header: true, shading: 'F3F4F6' })),
      }),
      ...rows.map(row => new TableRow({
        children: row.map(c => cell(c)),
      })),
    ],
  });
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DOCUMENT GENERATOR                                               */
/* ═══════════════════════════════════════════════════════════════════ */

export async function generateProductionPackDOCX() {
  const children: (Paragraph | Table)[] = [];

  /* ─── Title Page ─── */
  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({
    text: 'PRODUCTION OUTPUT PACK',
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: META.title, size: 28, color: ACCENT })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Verdict: ${META.verdict} \u2014 ${META.score}/100`, bold: true, size: 22 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `${META.actor} \u2022 ${META.company} \u2022 ${META.platform} \u2022 ${META.runtime}`, color: C_GRAY, size: 20 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `${META.format} \u2022 ${META.aspectRatio} \u2022 ${META.language}`, color: C_GRAY, size: 18 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `${META.scenes} scenes \u2022 ${META.cuts} cuts \u2022 ${META.words} words`, size: 18, color: C_GRAY })],
    alignment: AlignmentType.CENTER,
  }));
  children.push(new Paragraph({ text: '', pageBreakBefore: true }));

  /* ═══════════════════════════════════════════════════════════════ */
  /*  1. ACTOR BRIEF                                                */
  /* ═══════════════════════════════════════════════════════════════ */
  children.push(h('Actor Brief', HeadingLevel.HEADING_1));
  children.push(p(`${META.actor} \u2022 ${META.runtime} \u2022 ${META.scenes} scenes`, { color: C_GRAY }));
  children.push(new Paragraph({ text: '' }));

  children.push(h('General Direction', HeadingLevel.HEADING_2));
  children.push(p(`${META.format}: Every second is yours and the lens. Hold eye contact. Use physical actions (slam, point, lean) to break up talking-head segments.`, { spacing: { after: 120 } }));
  children.push(p(`${META.contentType} modifier: Confidence over enthusiasm. Avoid teacher-energy.`, { spacing: { after: 200 } }));

  children.push(h('Scene Breakdown', HeadingLevel.HEADING_2));
  children.push(createTable(
    ['Scene', 'Timing', 'Dialogue', 'Action', 'Expression', 'Energy', 'Pace'],
    SCENES.map(s => [
      `${s.sceneNum}: ${s.name}`,
      `${s.timingStart}-${s.timingEnd}s`,
      s.dialogue,
      s.action,
      s.actorExpression,
      `${s.actorEnergy}/10`,
      s.actorPace,
    ])
  ));
  children.push(new Paragraph({ text: '' }));

  children.push(h('Expression & Energy Arc', HeadingLevel.HEADING_2));
  SCENES.forEach(s => {
    children.push(p(`Scene ${s.sceneNum} (${s.name}): ${s.actorExpression} \u2014 Energy ${s.actorEnergy}/10 \u2014 Pace: ${s.actorPace}`));
  });
  children.push(new Paragraph({ text: '', pageBreakBefore: true }));

  /* ═══════════════════════════════════════════════════════════════ */
  /*  2. CAMERA SHEET                                               */
  /* ═══════════════════════════════════════════════════════════════ */
  children.push(h('Camera Sheet', HeadingLevel.HEADING_1));
  children.push(p(`${META.aspectRatio} \u2022 ${META.platform}`, { color: C_GRAY }));
  children.push(new Paragraph({ text: '' }));

  children.push(h('Shot List', HeadingLevel.HEADING_2));
  children.push(createTable(
    ['Scene', 'Timing', 'Shot', 'Angle', 'Movement'],
    SCENES.map(s => [
      `${s.sceneNum}: ${s.name}`,
      `${s.timingStart}-${s.timingEnd}s`,
      s.cameraShot,
      s.cameraAngle,
      s.cameraMovement,
    ])
  ));
  children.push(new Paragraph({ text: '' }));

  children.push(h('Lighting Notes', HeadingLevel.HEADING_2));
  SCENES.forEach(s => {
    children.push(p(`Scene ${s.sceneNum} (${s.name})`, { bold: true, spacing: { before: 100, after: 40 } }));
    children.push(p(`Key: ${s.sceneNum === 1 ? 'Bright, even' : s.sceneNum === 5 ? 'Soft, warm' : 'Neutral'} | Fill: ${s.sceneNum === 1 ? 'Low (contrast)' : 'Medium'} | Rim: ${s.sceneNum === 1 || s.sceneNum === 5 ? 'Yes (separation)' : 'Optional'}`, { color: C_GRAY }));
  });
  children.push(new Paragraph({ text: '', pageBreakBefore: true }));

  /* ═══════════════════════════════════════════════════════════════ */
  /*  3. EDIT TIMELINE                                              */
  /* ═══════════════════════════════════════════════════════════════ */
  children.push(h('Edit Timeline', HeadingLevel.HEADING_1));
  children.push(p(`30s runtime \u2022 4 cuts`, { color: C_GRAY }));
  children.push(new Paragraph({ text: '' }));

  children.push(h('Event Legend', HeadingLevel.HEADING_2));
  const legendItems = [
    '\ud83c\udfac Scene Start', '\u2702\ufe0f Cut', '\ud83d\udcdd Text Overlay',
    '\ud83d\udd0a SFX', '\ud83c\udfb5 Music Cue', '\u2744\ufe0f Freeze Frame',
    '\ud83d\udd01 Loop Point', '\ud83d\udccd Caption Beat',
  ];
  children.push(p(legendItems.join('  \u2022  ')));
  children.push(new Paragraph({ text: '' }));

  children.push(h('Chronological Events', HeadingLevel.HEADING_2));

  /* Build timeline events from edit markers */
  interface TEvent { time: number; label: string; type: string; scene: number }
  const events: TEvent[] = [];
  const emojiMap: Record<string, string> = {
    scene_start: '\ud83c\udfac', cut: '\u2702\ufe0f', text_overlay: '\ud83d\udcdd',
    sfx: '\ud83d\udd0a', music_cue: '\ud83c\udfb5', freeze_frame: '\u2744\ufe0f',
    loop_point: '\ud83d\udd01', caption_beat: '\ud83d\udccd',
  };
  SCENES.forEach(s => {
    events.push({ time: s.timingStart, label: `Scene ${s.sceneNum}: ${s.name}`, type: 'scene_start', scene: s.sceneNum });
    try {
      JSON.parse(s.audio.includes('SFX') || s.audio.includes('beat') ? `[{"time":"${s.timingStart}s","event":"Audio: ${s.audio}"}]` : '[]').forEach((m: any) => {
        if (m.time && m.event) events.push({ time: parseFloat(m.time), label: m.event, type: 'sfx', scene: s.sceneNum });
      });
    } catch { /* audio as event */ }
    events.push({ time: s.timingEnd, label: s.timingEnd < 30 ? `Cut to Scene ${s.sceneNum + 1}` : 'END', type: 'cut', scene: s.sceneNum });
  });
  events.sort((a, b) => a.time - b.time);

  children.push(createTable(
    ['Time', 'Event', 'Type', 'Scene'],
    events.map(e => [
      `${e.time.toFixed(1)}s`,
      `${emojiMap[e.type] || '\u2022'} ${e.label}`,
      e.type.charAt(0).toUpperCase() + e.type.slice(1).replace('_', ' '),
      `Scene ${e.scene}`,
    ])
  ));
  children.push(new Paragraph({ text: '', pageBreakBefore: true }));

  /* ═══════════════════════════════════════════════════════════════ */
  /*  4. CLEAN SCRIPT                                               */
  /* ═══════════════════════════════════════════════════════════════ */
  children.push(h('Clean Script', HeadingLevel.HEADING_1));
  children.push(p(`${META.words} words \u2022 ${META.scenes} scenes \u2022 ${META.runtime}`, { color: C_GRAY }));
  children.push(new Paragraph({ text: '' }));

  children.push(new Paragraph({
    children: [new TextRun({ text: META.title.toUpperCase(), bold: true, size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Written by ${META.actor} \u2022 ${META.company} \u2022 ${META.runtime}`, color: C_GRAY, size: 18 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  }));

  SCENES.forEach(s => {
    children.push(new Paragraph({
      children: [new TextRun({ text: `SCENE ${s.sceneNum}: ${s.name.toUpperCase()}  (${s.timingStart}-${s.timingEnd}s)`, bold: true, size: 18, color: ACCENT })],
      spacing: { before: 200, after: 80 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'ACTOR', bold: true, size: 20 })],
      spacing: { after: 40 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: s.dialogue, size: 22 })],
      spacing: { after: 60 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: s.action, italics: true, color: C_GRAY, size: 18 })],
      spacing: { after: 120 },
    }));
  });

  children.push(new Paragraph({
    children: [new TextRun({ text: `${META.words} words \u2022 ${META.scenes} scenes \u2022 ${META.runtime}`, color: C_GRAY, size: 16 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 300 },
  }));
  children.push(new Paragraph({ text: '', pageBreakBefore: true }));

  /* ═══════════════════════════════════════════════════════════════ */
  /*  5. GOLDEN RULES                                               */
  /* ═══════════════════════════════════════════════════════════════ */
  children.push(h('18 Golden Rules', HeadingLevel.HEADING_1));
  children.push(p('Reference for production team', { color: C_GRAY }));
  children.push(new Paragraph({ text: '' }));

  const categories = [...new Set(GOLDEN_RULES.map(r => r.cat))];
  categories.forEach(cat => {
    children.push(h(cat, HeadingLevel.HEADING_2));
    const rules = GOLDEN_RULES.filter(r => r.cat === cat);
    rules.forEach(rule => {
      children.push(new Paragraph({
        spacing: { before: 80, after: 60 },
        children: [
          new TextRun({ text: `#${rule.num}  `, bold: true, color: ACCENT }),
          new TextRun({ text: rule.name, bold: true }),
        ],
      }));
      children.push(p(rule.desc, { color: C_GRAY }));
    });
    children.push(new Paragraph({ text: '' }));
  });

  /* ═══════════════════════════════════════════════════════════════ */
  /*  BUILD DOCUMENT                                                */
  /* ═══════════════════════════════════════════════════════════════ */

  const doc = new Document({
    creator: 'Scalerock Video Pipeline',
    title: `${META.title} - Production Pack`,
    description: 'Phase 5 output - consolidated production documents',
    sections: [{
      properties: {
        page: {
          margin: { top: convertInchesToTwip(0.8), right: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(0.8) },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: `${META.title}  \u2014  Production Pack`, color: C_GRAY, size: 16 })],
            alignment: AlignmentType.RIGHT,
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Page ', color: C_GRAY, size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], color: C_GRAY, size: 16 }),
              new TextRun({ text: ' of ', color: C_GRAY, size: 16 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], color: C_GRAY, size: 16 }),
            ],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${META.title.replace(/\s+/g, '_')}_Production_Pack.docx`);
}
