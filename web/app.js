const state = {
  scenarios: [],
  scenario: null,
  threats: [],
  selected: null,
  running: false,
  complete: false,
  startedAt: 0,
  elapsed: 0,
  lastFrame: 0,
  difficulty: 2,
  degradation: 0,
  rng: () => 0.5,
  aiRequest: 0,
  log: [],
  metrics: { score: 0, detected: 0, classified: 0, correct: 0, alerts: 0, resolved: 0, falseActions: 0, reaction: [], aiAccepted: 0, aiOverrides: 0 }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const pad = (value) => String(Math.max(0, Math.floor(value))).padStart(2, '0');

function difficultyName() { return ['Guided', 'Standard', 'Stress'][state.difficulty - 1]; }
function currentTime() { return state.running ? (performance.now() - state.startedAt) / 1000 : state.elapsed; }
function formatTime(seconds) { return `${pad(seconds / 60)}:${pad(seconds % 60)}`; }
function selectedThreat() { return state.threats.find((threat) => threat.id === state.selected); }
function makeRng(seedText) {
  let seed = 2166136261;
  for (const character of seedText) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
  return () => {
    seed += 0x6D2B79F5;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadScenarios() {
  try {
    const response = await fetch('/api/scenarios');
    state.scenarios = (await response.json()).scenarios;
  } catch (error) {
    state.scenarios = [{ id: 'offline', name: 'Offline pack', tag: 'LOCAL / DEMO', description: 'Fallback scenario pack loaded locally.', duration: 90, defaultDegradation: 25, terrain: 'urban', threats: [{ id: 'D-01', role: 'unknown', label: 'Demo track', x: .18, y: .42, vx: .18, vy: .04, speed: .6, priority: 'high', signature: 'synthetic' }] }];
  }
  renderScenarioCards();
  selectScenario(state.scenarios[0]);
}

function renderScenarioCards() {
  $('#scenarioList').innerHTML = state.scenarios.map((scenario) => `<button class="scenario-card ${state.scenario?.id === scenario.id ? 'active' : ''}" data-id="${esc(scenario.id)}"><b>${esc(scenario.name)}</b><small>${esc(scenario.tag)} · ${scenario.threats.length} TRACKS</small><p>${esc(scenario.description)}</p></button>`).join('');
  $$('.scenario-card').forEach((button) => button.addEventListener('click', () => selectScenario(state.scenarios.find((scenario) => scenario.id === button.dataset.id))));
}

function selectScenario(scenario) {
  if (!scenario) return;
  state.scenario = scenario;
  state.degradation = scenario.defaultDegradation;
  $('#degradation').value = state.degradation;
  $('#degradationValue').textContent = `${state.degradation}%`;
  $('#exerciseTitle').textContent = scenario.name;
  $('#metricScenario').textContent = scenario.name;
  $('#metricTag').textContent = scenario.tag;
  $('#arenaArea').textContent = scenario.terrain.toUpperCase();
  resetSession();
  renderScenarioCards();
}

function resetMetrics() { state.metrics = { score: 0, detected: 0, classified: 0, correct: 0, alerts: 0, resolved: 0, falseActions: 0, reaction: [], aiAccepted: 0, aiOverrides: 0 }; }

function resetSession() {
  state.running = false;
  state.complete = false;
  state.elapsed = 0;
  state.lastFrame = 0;
  state.selected = null;
  state.aiRequest += 1;
  state.log = [];
  resetMetrics();
  state.rng = makeRng(`${state.scenario?.id || 'offline'}:${state.difficulty}`);
  state.threats = (state.scenario?.threats || []).map((threat) => ({ ...threat, originX: threat.x, originY: threat.y, status: 'unseen', detectedAt: null, classification: '', confidence: 0, jitter: 0 }));
  $('#aarPanel').hidden = true;
  $('#heroState').textContent = 'READY';
  $('#heroHint').textContent = 'Select a pack to begin';
  $('#simState').textContent = 'STANDBY';
  $('#stateDot').className = 'state-dot';
  $('#startBtn').textContent = 'Start exercise ↗';
  $('#feedValue').textContent = 'STAGED';
  $('#feedNote').textContent = 'Select a radar track to act';
  $('#aiCue').textContent = 'MODEL IDLE';
  $('#aiEvidence').textContent = 'Select a track to request an explainable role cue · human remains in control';
  $('#selectedTrack').textContent = 'None';
  $('#crosshair').hidden = true;
  renderAll();
  logEvent('SYSTEM', `Loaded ${state.scenario?.name || 'scenario'} · ${difficultyName()} difficulty.`);
}

function startSession() {
  if (state.complete) resetSession();
  state.running = true;
  state.complete = false;
  state.startedAt = performance.now() - state.elapsed * 1000;
  $('#heroState').textContent = 'LIVE';
  $('#heroHint').textContent = 'Observe · decide · review';
  $('#simState').textContent = 'LIVE';
  $('#stateDot').className = 'state-dot live';
  $('#startBtn').textContent = 'Pause exercise ‖';
  $('#feedValue').textContent = 'LIVE';
  logEvent('SYSTEM', `Exercise started · ${state.degradation}% sensor degradation.`);
  requestAnimationFrame(loop);
}

function pauseSession() {
  state.elapsed = currentTime();
  state.running = false;
  $('#heroState').textContent = 'PAUSED';
  $('#heroHint').textContent = 'Resume when ready';
  $('#simState').textContent = 'PAUSED';
  $('#stateDot').className = 'state-dot warn';
  $('#startBtn').textContent = 'Resume exercise ↗';
  logEvent('SYSTEM', 'Exercise paused by trainer.');
}

function finishSession(reason = 'Time window complete.') {
  state.elapsed = Math.min(currentTime(), state.scenario.duration);
  state.running = false;
  state.complete = true;
  $('#heroState').textContent = 'COMPLETE';
  $('#heroHint').textContent = reason;
  $('#simState').textContent = 'COMPLETE';
  $('#stateDot').className = 'state-dot';
  $('#startBtn').textContent = 'Run again ↗';
  $('#feedValue').textContent = 'ARCHIVED';
  logEvent('SYSTEM', reason);
  renderAAR();
}

function loop(timestamp) {
  if (!state.running) { drawArena(); return; }
  state.elapsed = currentTime();
  updateThreats(1 / 60);
  renderAll();
  drawArena();
  if (state.elapsed >= state.scenario.duration) finishSession();
  else requestAnimationFrame(loop);
}

function updateThreats(delta) {
  state.threats.forEach((threat) => {
    threat.x += threat.vx * delta * (0.55 + state.difficulty * .2) / Math.max(.35, threat.speed);
    threat.y += threat.vy * delta * (0.55 + state.difficulty * .2) / Math.max(.35, threat.speed);
    if (threat.x > 1.03 || threat.x < -.03) threat.vx *= -1;
    if (threat.y > 1.03 || threat.y < -.03) threat.vy *= -1;
    threat.x = Math.min(1.02, Math.max(-.02, threat.x));
    threat.y = Math.min(1.02, Math.max(-.02, threat.y));
    threat.jitter = Math.sin(state.elapsed * 2.3 + threat.id.length) * state.degradation * .00035;
    if (threat.status === 'unseen' && state.elapsed > 3 + threat.x * 9) {
      if (state.rng() > state.degradation / 125) threat.confidence = Math.max(.25, .92 - state.degradation / 170);
    }
  });
}

function visibleThreat(threat) {
  if (threat.status !== 'unseen') return true;
  const pulse = Math.sin(state.elapsed * 1.7 + threat.id.charCodeAt(1)) * 7;
  return state.degradation < 35 || pulse > state.degradation - 35;
}

function terrainPalette() {
  const terrain = state.scenario?.terrain;
  if (terrain === 'urban') return { base:'#0b1d24', line:'#173b41', accent:'#51e2c2' };
  if (terrain === 'rural') return { base:'#101e1a', line:'#244638', accent:'#94e2aa' };
  return { base:'#111b2b', line:'#273f5c', accent:'#62c9f4' };
}

function drawArena() {
  const canvas = $('#arena');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const palette = terrainPalette();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y <= height; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.strokeStyle = `${palette.accent}44`;
  ctx.setLineDash([5, 6]);
  ctx.beginPath(); ctx.arc(width / 2, height / 2, 175, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(width / 2, height / 2, 90, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#51e2c299';
  ctx.beginPath(); ctx.moveTo(width / 2, height / 2); ctx.lineTo(width * .95, height * .12); ctx.stroke();
  ctx.fillStyle = '#8aaeb766';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('N', width / 2 - 4, 19); ctx.fillText('0.0', 8, height - 10); ctx.fillText('1.0', width - 24, height - 10);
  if (state.scenario?.terrain === 'urban') drawUrban(ctx, width, height);
  if (state.scenario?.terrain === 'rural') drawRural(ctx, width, height);
  if (state.scenario?.terrain === 'perimeter') drawPerimeter(ctx, width, height);
  state.threats.forEach((threat) => drawThreat(ctx, threat, width, height, palette.accent));
  if (state.selected) {
    const threat = selectedThreat();
    if (threat) positionCrosshair(threat, width, height);
  }
}

function drawUrban(ctx, width, height) {
  ctx.strokeStyle = '#34717655'; ctx.lineWidth = 8;
  for (let x = 70; x < width; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, height); ctx.stroke(); }
  ctx.strokeStyle = '#51e2c215'; ctx.lineWidth = 2;
  for (let x = 20; x < width; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, height); ctx.stroke(); }
}
function drawRural(ctx, width, height) { ctx.strokeStyle = '#67a88936'; ctx.lineWidth = 2; for (let x = -50; x < width + 100; x += 55) { ctx.beginPath(); ctx.moveTo(x, height); ctx.bezierCurveTo(x + 80, height * .7, x - 30, height * .45, x + 75, 0); ctx.stroke(); } }
function drawPerimeter(ctx, width, height) { ctx.strokeStyle = '#62c9f433'; ctx.lineWidth = 2; ctx.strokeRect(40, 40, width - 80, height - 80); ctx.strokeRect(95, 95, width - 190, height - 190); }

function drawThreat(ctx, threat, width, height, accent) {
  if (!visibleThreat(threat)) return;
  const x = (threat.x + threat.jitter) * width;
  const y = (threat.y - threat.jitter) * height;
  const selected = state.selected === threat.id;
  const identified = threat.status === 'identified' || threat.status === 'alerted' || threat.status === 'resolved';
  const color = threat.status === 'resolved' ? '#8be5a4' : threat.priority === 'high' ? '#ff737e' : accent;
  ctx.save();
  ctx.globalAlpha = threat.status === 'unseen' ? .72 : 1;
  if (selected) { ctx.strokeStyle = `${color}99`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 20 + Math.sin(state.elapsed * 4) * 2, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = `${color}22`; ctx.strokeStyle = color; ctx.lineWidth = identified ? 2 : 1;
  ctx.beginPath(); ctx.arc(x, y, identified ? 8 : 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.lineTo(x + 13, y); ctx.moveTo(x, y - 13); ctx.lineTo(x, y + 13); ctx.stroke();
  ctx.fillStyle = color; ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.fillText(threat.id, x + 13, y - 10);
  ctx.fillStyle = '#9cb4bb'; ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.fillText(identified ? threat.status.toUpperCase() : `${Math.round(threat.confidence * 100)}%`, x + 13, y + 3);
  ctx.restore();
}

function positionCrosshair(threat, width, height) {
  const wrap = $('.arena-wrap');
  const crosshair = $('#crosshair');
  const canvas = $('#arena');
  const rect = canvas.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  crosshair.style.left = `${rect.left - wrapRect.left + threat.x * rect.width}px`;
  crosshair.style.top = `${rect.top - wrapRect.top + threat.y * rect.height}px`;
  crosshair.hidden = false;
}

function renderAll() {
  const elapsed = currentTime();
  $('#metricTime').textContent = formatTime(elapsed);
  $('#metricTracks').textContent = state.threats.length;
  $('#metricDetected').textContent = state.metrics.detected;
  $('#metricScore').textContent = String(Math.max(0, state.metrics.score)).padStart(3, '0');
  $('#qualityValue').textContent = `${Math.max(20, 100 - state.degradation)}%`;
  $('#degradationValue').textContent = `${state.degradation}%`;
  $('#difficultyValue').textContent = difficultyName();
  $('#trackCount').textContent = String(state.threats.length).padStart(2, '0');
  renderTracks(); renderLog();
}

function renderTracks() {
  $('#trackList').innerHTML = state.threats.length ? state.threats.map((threat) => `<button class="track ${state.selected === threat.id ? 'selected' : ''}" data-id="${esc(threat.id)}"><div class="track-row"><b>${esc(threat.id)} · ${esc(threat.label)}</b><span>${esc(threat.status.toUpperCase())}</span></div><small>${esc(threat.signature)} · priority ${esc(threat.priority)} · confidence ${Math.round(threat.confidence * 100)}%</small><div class="progress"><i style="width:${Math.min(100, Math.max(8, threat.confidence * 100))}%"></i></div></button>`).join('') : '<p class="empty">Start an exercise to populate the track picture.</p>';
  $$('.track').forEach((button) => button.addEventListener('click', () => selectTrack(button.dataset.id)));
}

function renderLog() {
  $('#eventLog').innerHTML = state.log.length ? state.log.slice(-12).reverse().map((entry) => `<div class="log-item"><time>${formatTime(entry.t)}</time><p><strong>${esc(entry.kind)}</strong> ${esc(entry.message)}</p></div>`).join('') : '<p class="empty">Actions and sensor cues will appear here.</p>';
}

function logEvent(kind, message) { state.log.push({ t: currentTime(), kind, message }); renderLog(); }

function selectTrack(id) {
  if (!state.threats.some((threat) => threat.id === id)) return;
  state.selected = id;
  const threat = selectedThreat();
  $('#selectedTrack').textContent = `${threat.id} · ${threat.label}`;
  $('#feedNote').textContent = `${threat.signature} · ${threat.priority} priority`;
  if (threat.status === 'unseen') logEvent('SENSOR', `${threat.id} selected from ${state.degradation ? 'degraded' : 'clean'} feed.`);
  requestAICue(threat);
  renderAll(); drawArena();
}

function modelLabel(label) { return label === 'cargo' ? 'CARGO / CIVILIAN' : label.toUpperCase(); }

async function requestAICue(threat) {
  const requestId = ++state.aiRequest;
  $('#aiCue').textContent = 'RUNNING…';
  $('#aiEvidence').textContent = 'aeris-softmax-v1 · extracting local telemetry features';
  try {
    const response = await fetch('/api/ai/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threat,
        context: {
          night: state.scenario?.id === 'night-corridor',
          swarm: state.scenario?.id === 'swarm-breakout'
        }
      })
    });
    if (!response.ok) throw new Error('AI service unavailable');
    const prediction = await response.json();
    if (requestId !== state.aiRequest) return;
    threat.aiPrediction = prediction.label;
    threat.aiConfidence = prediction.confidence;
    $('#aiCue').textContent = `${modelLabel(prediction.label)} · ${Math.round(prediction.confidence * 100)}%`;
    $('#aiEvidence').textContent = `${prediction.model} · ${prediction.evidence.join(' · ')}`;
  } catch (error) {
    if (requestId !== state.aiRequest) return;
    $('#aiCue').textContent = 'UNAVAILABLE';
    $('#aiEvidence').textContent = 'Start server.py to enable the local trained model';
  }
}

function performAction(action) {
  if (!state.running) { logEvent('SYSTEM', 'Start or resume the exercise before taking an action.'); return; }
  const threat = selectedThreat();
  if (!threat) { state.metrics.falseActions += 1; state.metrics.score -= 3; logEvent('ACTION', `${action.toUpperCase()} attempted without a selected track.`); renderAll(); return; }
  const now = currentTime();
  const classification = $('#classification').value;
  let message = '';
  if (action === 'track') {
    if (threat.status === 'unseen') { threat.status = 'detected'; threat.detectedAt = now; threat.confidence = Math.max(.54, threat.confidence); state.metrics.detected += 1; state.metrics.reaction.push(now); state.metrics.score += 12; message = `${threat.id} acquired in ${now.toFixed(1)}s.`; }
    else { state.metrics.score += 2; message = `${threat.id} track refreshed.`; }
  } else if (action === 'classify') {
    if (threat.status === 'unseen') { state.metrics.score -= 5; state.metrics.falseActions += 1; message = `Classify rejected: acquire ${threat.id} first.`; }
    else if (!classification) { message = 'Choose a role in the classification panel first.'; }
    else { threat.classification = classification; threat.status = 'identified'; state.metrics.classified += 1; const correct = classification === threat.role; if (correct) { state.metrics.correct += 1; state.metrics.score += 18; } else { state.metrics.score -= 9; state.metrics.falseActions += 1; } const aiCue = threat.aiPrediction ? (classification === threat.aiPrediction ? 'AI cue accepted' : 'AI cue overridden') : 'no AI cue'; if (threat.aiPrediction) classification === threat.aiPrediction ? state.metrics.aiAccepted += 1 : state.metrics.aiOverrides += 1; message = `${threat.id} labelled ${classification.toUpperCase()} · ${correct ? 'match' : 'mismatch'} · ${aiCue}.`; }
  } else if (action === 'alert') {
    if (threat.status === 'identified') { threat.status = 'alerted'; state.metrics.alerts += 1; state.metrics.score += threat.priority === 'high' ? 14 : 7; message = `${threat.id} escalated at ${threat.priority} priority.`; }
    else { state.metrics.score -= 4; state.metrics.falseActions += 1; message = `Escalation gate held: identify ${threat.id} before alerting.`; }
  } else if (action === 'intercept') {
    if (threat.status === 'alerted') { threat.status = 'resolved'; state.metrics.resolved += 1; state.metrics.score += threat.priority === 'high' ? 22 : 10; message = `${threat.id} safely resolved in simulation.`; }
    else { state.metrics.score -= 12; state.metrics.falseActions += 1; message = `Unsafe resolution path: ${threat.id} was not alerted.`; }
  }
  logEvent('ACTION', message);
  renderAll(); drawArena();
}

function renderAAR() {
  const m = state.metrics;
  const accuracy = m.classified ? Math.round(m.correct / m.classified * 100) : 0;
  const avgReaction = m.reaction.length ? (m.reaction.reduce((sum, value) => sum + value, 0) / m.reaction.length).toFixed(1) : '—';
  const aiTotal = m.aiAccepted + m.aiOverrides;
  $('#aarSummary').innerHTML = `<div class="aar-stat"><span>SCORE</span><b>${Math.max(0, m.score)}</b></div><div class="aar-stat"><span>CLASSIFICATION</span><b>${accuracy}%</b></div><div class="aar-stat"><span>AVG DETECTION</span><b>${avgReaction}s</b></div><div class="aar-stat"><span>RESOLVED</span><b>${m.resolved}/${state.threats.length}</b></div><div class="aar-stat"><span>AI CUE USE</span><b>${aiTotal ? `${m.aiAccepted}/${aiTotal}` : '—'}</b></div>`;
  const missed = state.threats.filter((threat) => threat.status === 'unseen' || threat.status === 'detected').map((threat) => threat.id);
  $('#aarAdvice').textContent = missed.length ? `Coach cue: revisit ${missed.join(', ')}. Acquire before classifying, then escalate only after role confidence is explicit.` : 'Coach cue: all tracks reached a safe terminal state. Replay with higher degradation to test whether the decision sequence survives uncertainty.';
  $('#aarPanel').hidden = false;
  $('#aarPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

$('#startBtn').addEventListener('click', () => state.running ? pauseSession() : startSession());
$('#resetBtn').addEventListener('click', resetSession);
$('#finishBtn').addEventListener('click', () => { if (state.running) finishSession('Exercise closed by trainer.'); else if (!state.complete) logEvent('SYSTEM', 'Start the exercise before opening an AAR.'); });
$('#replayBtn').addEventListener('click', () => { resetSession(); startSession(); });
$('#difficulty').addEventListener('input', (event) => { state.difficulty = Number(event.target.value); $('#difficultyValue').textContent = difficultyName(); });
$('#degradation').addEventListener('input', (event) => { state.degradation = Number(event.target.value); $('#degradationValue').textContent = `${state.degradation}%`; });
$$('.action').forEach((button) => button.addEventListener('click', () => performAction(button.dataset.action)));
$('#arena').addEventListener('click', (event) => { const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width; const y = (event.clientY - rect.top) / rect.height; const nearest = state.threats.map((threat) => ({ threat, distance: Math.hypot(threat.x - x, threat.y - y) })).sort((a, b) => a.distance - b.distance)[0]; if (nearest && nearest.distance < .07) selectTrack(nearest.threat.id); });
document.addEventListener('keydown', (event) => { const actions = { '1':'track', '2':'classify', '3':'alert', '4':'intercept' }; if (actions[event.key]) performAction(actions[event.key]); });

function idleFrame() { drawArena(); renderAll(); requestAnimationFrame(idleFrame); }
loadScenarios().then(() => idleFrame());
