const pptxgen = require('pptxgenjs');
const path = require('path');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Zero Coders';
pptx.company = 'Zero Coders';
pptx.subject = 'SIH 2026 · SIH26247 · AERIS';
pptx.title = 'AERIS — AI-Enabled Drone & Counter-Drone Threat Simulation Trainer';
pptx.lang = 'en-IN';
pptx.theme = {
  headFontFace: 'Georgia',
  bodyFontFace: 'Arial',
  lang: 'en-IN'
};
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';
pptx.margin = 0;

const W = 13.333;
const H = 7.5;
const LOGO = path.join(__dirname, 'sih-logo.png');
const OUT = path.join(__dirname, '..', 'AERIS_SIH2026_Proposal.pptx');
const REPO = 'https://github.com/Mithil-7/SIH26247-AERIS';
const SIH_PS = 'https://sih.gov.in/sih2026PS';

const C = {
  navy: '163F66',
  blue: '0876BD',
  blueDark: '0B568D',
  ink: '17232D',
  grey: '5B6870',
  lightGrey: 'EEF3F6',
  line: 'C7D8E2',
  teal: '1B9B98',
  tealLight: 'DDF3EE',
  orange: 'F29A2E',
  orangeLight: 'FFF0D8',
  green: '2E9A60',
  greenLight: 'E1F3E7',
  red: 'D6545E',
  redLight: 'FCE5E7',
  lavender: 'E9E2F7',
  white: 'FFFFFF',
  black: '111111'
};

const shapes = pptx.ShapeType;

function tx(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    margin: opts.margin ?? 0.05,
    fontFace: opts.fontFace || 'Arial',
    fontSize: opts.fontSize || 12,
    color: opts.color || C.ink,
    bold: opts.bold || false,
    italic: opts.italic || false,
    breakLine: false,
    fit: 'shrink',
    valign: opts.valign || 'mid',
    align: opts.align || 'left',
    paraSpaceAfterPt: opts.paraSpaceAfterPt || 0,
    bullet: opts.bullet,
    charSpacing: opts.charSpacing,
    underline: opts.underline,
    hyperlink: opts.hyperlink,
    transparency: opts.transparency,
    isTextBox: true,
    ...opts
  });
}

function rect(slide, x, y, w, h, fill, line = fill, radius = false, transparency = 0) {
  slide.addShape(radius ? shapes.roundRect : shapes.rect, {
    x, y, w, h,
    rectRadius: radius ? 0.08 : undefined,
    fill: { color: fill, transparency },
    line: { color: line, width: 1 }
  });
}

function line(slide, x1, y1, x2, y2, color = C.blue, width = 1.5, arrow = false, dash = 'solid') {
  // PowerPoint is strict about negative extents in line shapes. Normalize
  // the bounding box while retaining the visual connection.
  slide.addShape(shapes.line, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    line: { color, width, dashType: dash, endArrowType: arrow ? 'triangle' : undefined }
  });
}

function circle(slide, x, y, d, fill, lineColor = fill, transparency = 0) {
  slide.addShape(shapes.ellipse, {
    x, y, w: d, h: d,
    fill: { color: fill, transparency },
    line: { color: lineColor, width: 1 }
  });
}

function addLogo(slide, x = 11.55, y = 0.06, w = 1.52, h = 0.74) {
  if (process.env.NO_LOGO) return;
  slide.addImage({ path: LOGO, x, y, w, h, transparency: 0 });
}

function addTeamBadge(slide, text = 'ZERO\nCODERS') {
  slide.addShape(shapes.ellipse, { x: 0.28, y: 0.17, w: 1.45, h: 0.48, fill: { color: C.white, transparency: 100 }, line: { color: '75539C', width: 1.2 } });
  tx(slide, text, 0.37, 0.205, 1.26, 0.39, { fontSize: 9.5, color: C.black, bold: true, align: 'center', valign: 'mid', charSpacing: 0.5 });
}

function addFooter(slide, n) {
  slide.addShape(shapes.rect, { x: 0, y: 7.16, w: W, h: 0.34, fill: { color: C.blue }, line: { color: C.blue } });
  tx(slide, 'AERIS  |  SIH 2026', 5.85, 7.205, 1.65, 0.15, { fontSize: 8.5, color: C.white, align: 'center' });
  tx(slide, String(n), 12.62, 7.20, 0.28, 0.15, { fontSize: 9, color: C.white, bold: true, align: 'right' });
}

function addHeader(slide, title, n, kicker = '') {
  slide.background = { color: C.white };
  addTeamBadge(slide);
  addLogo(slide);
  tx(slide, title, 1.82, 0.18, 9.4, 0.48, { fontFace: 'Georgia', fontSize: 25, color: C.black, bold: true, align: 'center', valign: 'mid' });
  addFooter(slide, n);
}

function bulletText(items) { return items.map((item) => `•  ${item}`).join('\n'); }

function card(slide, x, y, w, h, fill, title, body, accent = C.blue, titleSize = 12, bodySize = 10) {
  rect(slide, x, y, w, h, fill, accent, true);
  slide.addShape(shapes.rect, { x, y, w: 0.07, h, fill: { color: accent }, line: { color: accent } });
  tx(slide, title, x + 0.18, y + 0.11, w - 0.3, 0.28, { fontSize: titleSize, bold: true, color: C.navy });
  tx(slide, body, x + 0.18, y + 0.43, w - 0.32, h - 0.52, { fontSize: bodySize, color: C.ink, valign: 'top', breakLine: false, fit: 'shrink' });
}

function addArrow(slide, x1, y1, x2, y2, color = C.blue) { line(slide, x1, y1, x2, y2, color, 1.55, true); }

function addRadarMotif(slide, cx, cy, r) {
  [r, r * .72, r * .44].forEach((d, index) => {
    circle(slide, cx - d / 2, cy - d / 2, d, C.white, index === 0 ? C.line : 'DCE9EF', 100);
  });
  line(slide, cx, cy, cx + r * .7, cy - r * .45, C.teal, 1.1);
  line(slide, cx - r * .54, cy, cx + r * .54, cy, 'DDEAF0', 0.8, false, 'dash');
  line(slide, cx, cy - r * .54, cx, cy + r * .54, 'DDEAF0', 0.8, false, 'dash');
  circle(slide, cx + r * .18, cy - r * .15, 0.10, C.orange, C.orange);
  circle(slide, cx - r * .31, cy + r * .17, 0.065, C.teal, C.teal);
}

function addDroneGlyph(slide, x, y, s, color = C.navy) {
  slide.addShape(shapes.hexagon, { x: x + s * .26, y: y + s * .28, w: s * .48, h: s * .31, fill: { color: C.white, transparency: 15 }, line: { color, width: 2 } });
  line(slide, x + s * .18, y + s * .42, x + s * .82, y + s * .42, color, 2);
  [[.14, .2], [.86, .2], [.14, .72], [.86, .72]].forEach(([px, py]) => {
    circle(slide, x + s * px - s * .07, y + s * py - s * .07, s * .14, C.white, color);
    line(slide, x + s * px, y + s * py, x + s * (px > .5 ? .7 : .3), y + s * .52, color, 1.1);
  });
  circle(slide, x + s * .45, y + s * .39, s * .1, C.orange, C.orange);
}

function addLink(slide, text, x, y, w, h, url, size = 10, color = C.blue) {
  tx(slide, text, x, y, w, h, { fontSize: size, color, underline: { color }, hyperlink: { url }, valign: 'mid' });
}

// Slide 1 — cover
if (!process.env.SKIP_SLIDE1) {
{
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  addLogo(slide, 10.98, 0.04, 2.1, 0.91);
  tx(slide, 'SMART INDIA HACKATHON 2026', 1.64, 0.15, 8.8, 0.46, { fontFace: 'Georgia', fontSize: 25, bold: true, color: C.navy, align: 'center' });
  // Pale geometric field inspired by the supplied template.
  if (!process.env.NO_COVER_VISUALS) {
    if (!process.env.NO_COVER_HEX) {
      slide.addShape(shapes.hexagon, { x: 7.16, y: 1.22, w: 4.55, h: 4.85, fill: { color: C.lightGrey, transparency: 13 }, line: { color: C.lightGrey, width: 1 } });
      slide.addShape(shapes.hexagon, { x: 8.12, y: 1.8, w: 3.14, h: 3.75, fill: { color: C.white, transparency: 100 }, line: { color: 'D5E2EA', width: 1.4 } });
    }
    if (!process.env.NO_COVER_RADAR) addRadarMotif(slide, 9.65, 3.67, 2.35);
    if (!process.env.NO_COVER_DRONE) addDroneGlyph(slide, 8.82, 2.8, 1.7, C.blueDark);
    if (!process.env.NO_COVER_ACCENT) {
      circle(slide, 10.7, 4.78, 0.22, C.orange, C.orange);
      line(slide, 10.81, 4.89, 11.48, 5.3, C.orange, 1.3, true);
    }
  }
  tx(slide, 'AERIS', 0.52, 1.23, 3.1, 0.62, { fontFace: 'Georgia', fontSize: 30, bold: true, color: C.black });
  tx(slide, 'Adaptive Evaluation & Response Intelligence Simulator', 0.55, 1.93, 5.6, 0.34, { fontSize: 12.5, color: C.navy, bold: true });
  tx(slide, 'Train for the signal you will not get.', 0.55, 2.42, 5.8, 0.42, { fontSize: 17, color: C.teal, bold: true, italic: true });
  tx(slide, 'Problem Statement ID: SIH26247', 0.55, 3.13, 5.8, 0.27, { fontSize: 13, bold: true, color: C.ink });
  tx(slide, 'AI-Enabled Drone & Counter-Drone Threat\nSimulation Trainer', 0.55, 3.51, 5.95, 0.82, { fontSize: 19, bold: true, color: C.black, valign: 'top' });
  tx(slide, bulletText([
    'Organization: Ministry of Defence (MoD)',
    'Department: Defence Services Staff College',
    'Theme: Robotics and Drones',
    'PS Category: Software',
    'Team ID: 167564',
    'Team Name: Zero Coders'
  ]), 0.58, 4.54, 6.0, 1.45, { fontSize: 10.5, color: C.ink, valign: 'top', breakLine: false });
  tx(slide, 'A desktop-first, VR-ready training loop for realistic decisions under uncertainty.', 7.3, 5.72, 4.3, 0.44, { fontSize: 11, color: C.navy, bold: true, align: 'center', italic: true });
  addFooter(slide, 1);
}
}

// Slide 2 — proposed solution
if (!process.env.SKIP_SLIDE2) {
{
  const slide = pptx.addSlide();
  addHeader(slide, 'PROPOSED SOLUTION', 2, 'FROM SIGNAL TO DECISION');
  card(slide, 0.44, 1.04, 4.06, 1.62, C.redLight, 'The training gap', 'Classroom instruction and limited live-fire drills are costly, weather-dependent and difficult to repeat at unit scale. Realistic practice must include single drones, swarms and imperfect information.', C.red, 13, 10.3);
  card(slide, 4.77, 1.04, 8.12, 1.62, C.tealLight, 'AERIS — make uncertainty measurable', 'A software simulator that generates varied threat scenarios, deliberately degrades sensor feeds, records operator decisions and explains performance through an after-action review.', C.teal, 13, 10.3);
  tx(slide, 'WHAT THE OFFICIAL BRIEF ASKS FOR', 0.48, 2.99, 3.8, 0.18, { fontSize: 8.5, color: C.teal, bold: true, charSpacing: 1.1 });
  const ask = [
    ['Scenario Forge', 'Scripted + procedurally generated threats across day/night, urban/rural and single/swarm settings.', C.blue, C.lightGrey],
    ['Sensor Fog', 'Dropout, delay, noise and contradictory feeds create decision-making under uncertainty.', C.orange, C.orangeLight],
    ['Decision Coach', 'Scores detection time, threat classification and engagement decisions with an explicit rubric.', C.teal, C.tealLight],
    ['AAR + Replay', 'Tracks individual/unit progress, randomises difficulty and prevents rote learning.', C.green, C.greenLight]
  ];
  ask.forEach((item, index) => {
    const x = 0.44 + index * 3.18;
    rect(slide, x, 3.34, 2.88, 1.46, item[3], item[2], true);
    circle(slide, x + 0.17, 3.58, 0.27, item[2], item[2]);
    tx(slide, String(index + 1).padStart(2, '0'), x + 0.17, 3.605, 0.27, 0.14, { fontSize: 7.5, color: C.white, bold: true, align: 'center' });
    tx(slide, item[0], x + 0.55, 3.49, 2.08, 0.25, { fontSize: 12, color: C.navy, bold: true });
    tx(slide, item[1], x + 0.18, 3.97, 2.47, 0.62, { fontSize: 9.4, color: C.ink, valign: 'top' });
  });
  tx(slide, 'AERIS training loop', 0.52, 5.27, 2.1, 0.2, { fontSize: 11, bold: true, color: C.navy });
  const flow = [
    ['1', 'Generate', 'scenario + ground truth', C.blue, C.lightGrey],
    ['2', 'Degrade', 'feed + confidence', C.orange, C.orangeLight],
    ['3', 'Decide', 'track · classify · alert', C.teal, C.tealLight],
    ['4', 'Review', 'score · coach · replay', C.green, C.greenLight]
  ];
  flow.forEach((item, index) => {
    const x = 2.05 + index * 2.54;
    rect(slide, x, 5.14, 2.08, 0.86, item[4], item[3], true);
    circle(slide, x + 0.12, 5.31, 0.30, item[3], item[3]);
    tx(slide, item[0], x + 0.12, 5.34, 0.30, 0.13, { fontSize: 8, color: C.white, bold: true, align: 'center' });
    tx(slide, item[1], x + 0.52, 5.23, 1.38, 0.20, { fontSize: 11, color: C.navy, bold: true });
    tx(slide, item[2], x + 0.52, 5.55, 1.42, 0.24, { fontSize: 8.5, color: C.grey });
    if (index < flow.length - 1) addArrow(slide, x + 2.09, 5.57, x + 2.45, 5.57, C.blue);
  });
  tx(slide, 'Minimal specialised hardware · desktop first · optional VR path', 3.72, 6.31, 6.15, 0.2, { fontSize: 10, color: C.grey, align: 'center', italic: true });
}
}

// Slide 3 — technical approach
if (!process.env.SKIP_SLIDE3) {
{
  const slide = pptx.addSlide();
  addHeader(slide, 'TECHNICAL APPROACH', 3, 'REPEATABLE SCENARIOS / EXPLAINABLE SCORES');
  tx(slide, 'AERIS architecture: generate the uncertainty, measure the decision.', 0.5, 0.93, 7.3, 0.27, { fontSize: 15, bold: true, color: C.navy });
  tx(slide, 'Every run keeps ground truth, scenario seed and action timeline separate from the trainee feed.', 0.5, 1.25, 7.8, 0.22, { fontSize: 9.5, color: C.grey });
  const nodes = [
    { x: 0.50, y: 1.78, w: 2.0, h: 1.18, title: 'Scenario Forge', body: 'seeded pack\nterrain + time\nsingle / swarm', fill: C.lightGrey, accent: C.blue },
    { x: 2.78, y: 1.78, w: 2.0, h: 1.18, title: 'Threat Behaviour', body: 'roles + priority\nscripted paths\nprocedural variation', fill: C.orangeLight, accent: C.orange },
    { x: 5.06, y: 1.78, w: 2.0, h: 1.18, title: 'Sensor Fog', body: 'dropout + delay\nnoise + confidence\ncontradictory cues', fill: C.orangeLight, accent: C.orange },
    { x: 7.34, y: 1.78, w: 2.0, h: 1.18, title: 'Operator Console', body: 'radar + telemetry\ntrack / classify\nalert / resolve', fill: C.tealLight, accent: C.teal },
    { x: 9.62, y: 1.78, w: 1.45, h: 1.18, title: 'Scoring', body: 'time\naccuracy\nquality', fill: C.greenLight, accent: C.green },
    { x: 11.35, y: 1.78, w: 1.48, h: 1.18, title: 'AAR', body: 'timeline\ncoach\nreplay', fill: C.lavender, accent: '8065B4' }
  ];
  nodes.forEach((node, index) => {
    rect(slide, node.x, node.y, node.w, node.h, node.fill, node.accent, true);
    tx(slide, node.title, node.x + 0.13, node.y + 0.12, node.w - 0.22, 0.22, { fontSize: node.title === 'Operator Console' ? 10.2 : 10.5, color: C.navy, bold: true });
    tx(slide, node.body, node.x + 0.13, node.y + 0.47, node.w - 0.22, 0.55, { fontSize: 8.6, color: C.ink, valign: 'top' });
    if (index < nodes.length - 1) addArrow(slide, node.x + node.w + 0.03, node.y + 0.59, nodes[index + 1].x - 0.05, node.y + 0.59, C.blue);
  });
  // Feedback line for instructor/replay loop.
  line(slide, 12.1, 3.08, 12.1, 3.48, C.teal, 1.2);
  line(slide, 12.1, 3.48, 1.5, 3.48, C.teal, 1.2, true, 'dash');
  tx(slide, 'Instructor feedback / new scenario seed', 4.9, 3.36, 3.15, 0.2, { fontSize: 8.5, color: C.teal, bold: true, align: 'center' });
  card(slide, 0.5, 3.86, 3.0, 1.64, C.lightGrey, 'Prototype now', 'HTML Canvas radar\nLocal JSON scenarios\nPython stdlib server\nNo external APIs required', C.blue, 11.3, 10);
  card(slide, 3.76, 3.86, 3.0, 1.64, C.orangeLight, 'Adaptive layer', 'Difficulty scaling\nRole + priority profiles\nSeed-controlled variation\nGround-truth replay', C.orange, 11.3, 10);
  card(slide, 7.02, 3.86, 3.0, 1.64, C.tealLight, 'Scale-up path', 'Unity / OpenXR option\nONNX or ML-Agents\nFastAPI scenario service\nLocal / on-prem analytics', C.teal, 11.3, 10);
  card(slide, 10.28, 3.86, 2.55, 1.64, C.lavender, 'Evidence', 'Action log\nScore rubric\nAAR timeline\nSession export', '8065B4', 11.3, 10);
  tx(slide, 'Evaluation contract', 0.55, 5.93, 2.1, 0.2, { fontSize: 11, bold: true, color: C.navy });
  const contract = ['scenario ID + seed', 'sensor degradation', 'ground truth', 'operator actions', 'score + timeline'];
  contract.forEach((item, index) => {
    const x = 2.2 + index * 2.08;
    rect(slide, x, 5.81, 1.78, 0.52, index % 2 ? C.tealLight : C.lightGrey, index % 2 ? C.teal : C.blue, true);
    tx(slide, item, x + 0.06, 5.96, 1.66, 0.13, { fontSize: 8.4, color: C.navy, bold: true, align: 'center' });
  });
  tx(slide, 'Offline / on-premises first · full telemetry retained for review', 3.48, 6.55, 6.3, 0.2, { fontSize: 9, color: C.grey, align: 'center', italic: true });
}
}

// Slide 4 — feasibility and viability
if (!process.env.SKIP_SLIDE4) {
{
  const slide = pptx.addSlide();
  addHeader(slide, 'FEASIBILITY AND VIABILITY', 4, 'BUILDABLE NOW / EXTENSIBLE LATER');
  tx(slide, 'AERIS is intentionally desktop-first: the evaluation value is in repeatability, not specialised hardware.', 0.5, 0.96, 8.3, 0.25, { fontSize: 13, bold: true, color: C.navy });
  card(slide, 0.5, 1.45, 3.55, 1.12, C.lightGrey, 'Buildable prototype', 'Dependency-light web console + Python server; synthetic scenarios keep the demo self-contained.', C.blue, 11.5, 9.6);
  card(slide, 0.5, 2.77, 3.55, 1.12, C.tealLight, 'Deployment fit', 'Runs offline or on-premises and scales from one trainee to instructor-led unit sessions.', C.teal, 11.5, 9.6);
  card(slide, 0.5, 4.09, 3.55, 1.12, C.orangeLight, 'VR-ready by design', 'The scenario, telemetry and scoring contracts remain portable to desktop, Unity or OpenXR.', C.orange, 11.5, 9.6);
  rect(slide, 0.5, 5.45, 3.55, 0.82, C.navy, C.navy, true);
  tx(slide, 'MVP → SCALE', 0.7, 5.58, 1.2, 0.15, { fontSize: 8, color: '9ADFD7', bold: true, charSpacing: 1.1 });
  tx(slide, 'Browser simulator  →  immersive multi-user trainer', 0.7, 5.83, 3.05, 0.18, { fontSize: 9.4, color: C.white, bold: true });
  tx(slide, 'Challenge', 4.44, 1.43, 2.5, 0.22, { fontSize: 11.5, color: C.navy, bold: true });
  tx(slide, 'Mitigation built into the design', 8.18, 1.43, 3.6, 0.22, { fontSize: 11.5, color: C.navy, bold: true });
  const rows = [
    ['Realism vs scope', 'Seeded scenario packs + behaviour profiles make each run explainable and repeatable.', C.blue],
    ['Imperfect sensor feeds', 'Explicit fault injector for dropout, delay, noise and confidence loss; ground truth stays separate.', C.orange],
    ['Scoring bias', 'Visible rubric, instructor override and action timeline instead of an opaque AI score.', C.teal],
    ['Device variability', 'Desktop-first control surface; optional Unity/OpenXR renderer later.', C.green],
    ['Sensitive context', 'Synthetic/non-operational data in prototype; on-prem deployment path for controlled evaluation.', '8065B4']
  ];
  rows.forEach((row, index) => {
    const y = 1.78 + index * 0.77;
    rect(slide, 4.42, y, 3.12, 0.58, C.white, C.line, true);
    rect(slide, 7.72, y, 5.10, 0.58, index % 2 ? C.lightGrey : C.tealLight, row[2], true);
    circle(slide, 4.58, y + 0.16, 0.18, row[2], row[2]);
    tx(slide, row[0], 4.87, y + 0.14, 2.43, 0.2, { fontSize: 9.6, color: C.ink, bold: true });
    tx(slide, row[1], 7.93, y + 0.10, 4.62, 0.33, { fontSize: 8.7, color: C.ink, valign: 'mid' });
  });
  rect(slide, 4.42, 5.84, 8.4, 0.53, C.orangeLight, C.orange, true);
  tx(slide, 'Validation loop  ·  same seed → new seed → higher degradation → AAR → replay', 4.66, 6.02, 7.9, 0.16, { fontSize: 9.4, color: C.navy, bold: true, align: 'center' });
  tx(slide, 'No external API or live operational feed is required to demonstrate the requested training loop.', 2.88, 6.58, 7.6, 0.18, { fontSize: 9, color: C.grey, align: 'center', italic: true });
}
}

// Slide 5 — impact and benefits
if (!process.env.SKIP_SLIDE5) {
{
  const slide = pptx.addSlide();
  addHeader(slide, 'IMPACT AND BENEFITS', 5, 'MEASURE READINESS / IMPROVE THE NEXT RUN');
  tx(slide, 'Success metrics to benchmark during evaluation', 0.5, 1.03, 5.0, 0.25, { fontSize: 14, bold: true, color: C.navy });
  tx(slide, 'AERIS reports outcomes rather than making unsupported deployment claims.', 0.5, 1.34, 7.7, 0.2, { fontSize: 9.5, color: C.grey });
  const metrics = [
    ['TIME TO DETECT', 'reaction time', 'Time from first cue to deliberate track acquisition.', C.lightGrey, C.blue],
    ['CLASSIFICATION', 'role accuracy', 'Correct role assignment across unknown, scout, decoy and cargo tracks.', C.tealLight, C.teal],
    ['DECISION QUALITY', 'policy score', 'Sequence, priority and safe escalation against an explicit rubric.', C.orangeLight, C.orange],
    ['LEARNING CURVE', 'replay gain', 'Performance change across repeated seeds and rising degradation.', C.lavender, '8065B4']
  ];
  metrics.forEach((metric, index) => {
    const x = 0.5 + index * 3.18;
    rect(slide, x, 1.77, 2.85, 1.8, metric[3], metric[4], true);
    tx(slide, metric[0], x + 0.18, 1.98, 2.45, 0.17, { fontSize: 8.3, color: C.navy, bold: true, charSpacing: .8 });
    tx(slide, metric[1], x + 0.18, 2.30, 2.45, 0.26, { fontSize: 17, color: C.blueDark, bold: true });
    tx(slide, metric[2], x + 0.18, 2.78, 2.45, 0.46, { fontSize: 9.3, color: C.ink, valign: 'top' });
  });
  tx(slide, 'WHO BENEFITS', 0.52, 4.04, 1.6, 0.18, { fontSize: 8.5, color: C.teal, bold: true, charSpacing: 1.1 });
  const who = [
    ['Trainee', 'More repetitions\nclearer feedback', C.blue],
    ['Instructor', 'Evidence-led AAR\nscenario controls', C.orange],
    ['Unit / evaluator', 'Comparable sessions\nreadiness trend', C.teal],
    ['Programme owner', 'Scalable exercises\nless live dependency', C.green]
  ];
  who.forEach((item, index) => {
    const x = 0.5 + index * 3.18;
    rect(slide, x, 4.35, 2.85, 0.95, C.white, item[2], true);
    circle(slide, x + 0.18, 4.58, 0.18, item[2], item[2]);
    tx(slide, item[0], x + 0.51, 4.51, 1.85, 0.18, { fontSize: 10.5, color: C.navy, bold: true });
    tx(slide, item[1], x + 0.51, 4.76, 1.95, 0.31, { fontSize: 9, color: C.grey, valign: 'top' });
  });
  tx(slide, 'Operational value chain', 0.52, 5.72, 2.1, 0.2, { fontSize: 11.5, color: C.navy, bold: true });
  const chain = [
    ['REPEAT', 'without live range', C.lightGrey, C.blue],
    ['MEASURE', 'decision trace', C.tealLight, C.teal],
    ['COACH', 'specific cue', C.orangeLight, C.orange],
    ['REPLAY', 'harder scenario', C.greenLight, C.green]
  ];
  chain.forEach((item, index) => {
    const x = 2.45 + index * 2.48;
    rect(slide, x, 5.62, 1.98, 0.76, item[2], item[3], true);
    tx(slide, item[0], x + 0.10, 5.78, 1.78, 0.16, { fontSize: 9.5, color: C.navy, bold: true, align: 'center', charSpacing: .7 });
    tx(slide, item[1], x + 0.10, 6.08, 1.78, 0.15, { fontSize: 8.5, color: C.grey, align: 'center' });
    if (index < chain.length - 1) addArrow(slide, x + 2.03, 6.0, x + 2.35, 6.0, C.blue);
  });
  tx(slide, 'Illustrative metrics are deliberately left for organiser imagery / evaluator scenarios.', 3.05, 6.72, 7.3, 0.16, { fontSize: 8.5, color: C.grey, align: 'center', italic: true });
}
}

// Slide 6 — research and references
if (!process.env.SKIP_SLIDE6) {
{
  const slide = pptx.addSlide();
  addHeader(slide, 'RESEARCH AND REFERENCES', 6, 'SOURCE · PROTOTYPE · EVALUATION');
  card(slide, 0.5, 1.04, 4.0, 2.25, C.lightGrey, 'Official problem reference', bulletText([
    'SIH26247 — AI-Enabled Drone & Counter-Drone Threat Simulation Trainer.',
    'Ministry of Defence (MoD) · Defence Services Staff College.',
    'Software · Robotics and Drones.',
    'Expected: desktop/VR simulator, scripted/procedural scenarios, decision-tree scoring, AAR and difficulty randomisation.'
  ]), C.blue, 12, 9.4);
  addLink(slide, 'sih.gov.in/sih2026PS', 0.72, 2.86, 2.0, 0.18, SIH_PS, 9.2);
  card(slide, 4.68, 1.04, 3.86, 2.25, C.tealLight, 'AERIS prototype repository', 'Working web prototype included:\n• scenario packs\n• radar / telemetry console\n• degradation controls\n• action scoring\n• event log + AAR\n• local Python server', C.teal, 12, 9.6);
  addLink(slide, 'github.com/Mithil-7/SIH26247-AERIS', 4.92, 2.86, 3.26, 0.18, REPO, 8.7);
  card(slide, 8.72, 1.04, 4.1, 2.25, C.orangeLight, 'Evaluation plan', bulletText([
    'Run urban, night and swarm packs with fixed and new seeds.',
    'Sweep sensor degradation from clean to noisy.',
    'Compare detection time, role accuracy, decision quality, false actions and replay gain.',
    'Preserve scenario ID, seed, ground truth and action timeline for every run.'
  ]), C.orange, 12, 9.4);
  tx(slide, 'TECHNICAL BASIS', 0.52, 3.76, 1.9, 0.17, { fontSize: 8.5, color: C.teal, bold: true, charSpacing: 1.1 });
  const refs = [
    ['Deterministic simulation', 'Seed-controlled scenario generation makes repeatability and held-out testing possible.'],
    ['Human-readable scoring', 'A decision tree and timeline make the result coachable instead of opaque.'],
    ['Desktop → VR path', 'The training contract is renderer-agnostic; specialised hardware remains optional.'],
    ['Offline / on-prem', 'Synthetic data and local telemetry support a controlled evaluation environment.']
  ];
  refs.forEach((ref, index) => {
    const x = 0.5 + (index % 2) * 6.22;
    const y = 4.1 + Math.floor(index / 2) * 0.86;
    rect(slide, x, y, 5.65, 0.64, index % 2 ? C.white : C.lightGrey, C.line, true);
    circle(slide, x + 0.17, y + 0.20, 0.18, index % 2 ? C.teal : C.blue, index % 2 ? C.teal : C.blue);
    tx(slide, ref[0], x + 0.48, y + 0.12, 2.05, 0.17, { fontSize: 9.8, color: C.navy, bold: true });
    tx(slide, ref[1], x + 2.45, y + 0.10, 2.94, 0.30, { fontSize: 8.7, color: C.grey, valign: 'mid' });
  });
  rect(slide, 0.5, 6.02, 12.32, 0.6, C.navy, C.navy, true);
  tx(slide, 'ZERO CODERS', 0.78, 6.19, 1.35, 0.17, { fontSize: 9.5, color: '9ADFD7', bold: true, charSpacing: 1.1 });
  addLink(slide, REPO, 2.22, 6.16, 5.32, 0.20, REPO, 10.4, '8EDBD5');
  tx(slide, 'Team ID: 167564', 8.04, 6.17, 3.88, 0.18, { fontSize: 9.5, color: C.white, align: 'right' });
}
}

(async () => {
  await pptx.writeFile({ fileName: OUT });
  console.log(`Wrote ${OUT}`);
})();
