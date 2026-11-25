// 2D painters. Signature: (c, p, u, lt, T, beat)  u = 0..1 progress, lt = local seconds, T = global seconds
import { W, H, clamp, lerp, ease, easeOut, easeIn, easeOutBack, seg, hash, SPR, HOOK, snow, drawBeam, beamLit, bigText, label, typeText, mk } from './core.js';
import { TEX, drawEye, drawClub, drawBeak, silhouette, building, whaleSil, squidSil, sub } from './shapes.js';

const sfxTimes = (beat, name) => (beat.sfx || []).filter(s => s[0] === name).map(s => s[1]);
function deep(c, cx = W / 2, cy = H * 0.55, inner = '#04141c', outer = '#000') {
  HOOK.water(c, HOOK.T, { depth: 2000 });
  if (!/^#0[0-9a-f]1[0-9a-f]1/.test(inner)) { const g = c.createRadialGradient(cx, cy, 0, cx, cy, 1300); g.addColorStop(0, inner); g.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.8; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
}
function shakeT(c, amt, T) { c.translate(Math.sin(T * 61) * amt, Math.cos(T * 53) * amt); }

// ---------------------------------------------------------------- VOID: dark water around/through the sphere
function porthole(c, T, o = {}) {
  // interior frame around a round window; returns window circle
  const cx = W / 2, cy = H / 2, r = 430;
  c.save();
  c.beginPath(); c.rect(0, 0, W, H); c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, 7, true);
  const g = c.createRadialGradient(cx, cy, r, cx, cy, 1200); g.addColorStop(0, '#2a2a26'); g.addColorStop(0.15, '#121310'); g.addColorStop(1, '#030303');
  c.fillStyle = g; c.fill('evenodd');
  // rim
  c.beginPath(); c.arc(cx, cy, r + 24, 0, 7); c.strokeStyle = '#3a372c'; c.lineWidth = 46; c.stroke();
  c.beginPath(); c.arc(cx, cy, r + 4, 0, 7); c.strokeStyle = 'rgba(255,240,210,.12)'; c.lineWidth = 3; c.stroke();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; c.beginPath(); c.arc(cx + Math.cos(a) * (r + 24), cy + Math.sin(a) * (r + 24), 9, 0, 7); c.fillStyle = '#58533f'; c.fill(); }
  // instrument LEDs
  [[260, 880, '#ff3b30'], [300, 880, '#3bff7a'], [1640, 860, '#ffb020'], [1680, 860, '#3bd0ff']].forEach(([x, y, col], i) => {
    c.fillStyle = col; c.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(T * (1 + i * 0.3))); c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
  });
  c.globalAlpha = 1; c.restore();
  return { cx, cy, r };
}
export function pVoid(c, p, u, lt, T, beat) {
  c.save();
  if (p.shake) shakeT(c, 6 * (1 - u) + 2, T);
  const push = p.push ? 1 + u * 0.08 : 1;
  c.translate(W / 2, H / 2); c.scale(push, push); c.translate(-W / 2, -H / 2);
  deep(c, W / 2, H * 0.6, p.ink ? '#030a0e' : '#04121a');
  // beam
  let bm = null;
  if (p.lamp) {
    const b0 = p.beam || [0, 0], ang = lerp(b0[0], b0[1], ease(u)) - Math.PI / 2 + 0.05;
    bm = { x: W / 2 - 60, y: H + 80, ang: ang - 0.0, len: 1500, spread: 0.3 };
    let I = 1;
    if (p.lampOn) I = lt < 0.08 ? 0 : lt < 0.16 ? 0.6 : lt < 0.22 ? 0.1 : 1;
    if (p.jitter) I *= 0.9 + 0.1 * Math.sin(T * 40);
    drawBeam(c, bm, I * 0.85);
    if (I < 0.5) bm = null;
  }
  // red skin at the edge of the beam
  if (p.redEdge && bm) {
    const a = ease(seg(u, 0.3, 1));
    c.save(); c.globalAlpha = a * 0.9; c.beginPath(); c.ellipse(W * 0.9, H * 0.3, 520, 380, 0.4, 0, 7); c.clip();
    c.drawImage(TEX.skin, W * 0.55 - lt * 10, -200, 1400, 900); c.restore();
  }
  // passing shape
  if (p.passby) {
    const k = seg(u, 0.15, 0.55), x = lerp(-900, W + 900, easeIn(k) * 0.5 + k * 0.5);
    c.save(); c.globalAlpha = Math.sin(k * Math.PI) * 0.9; c.filter = 'blur(18px)';
    c.drawImage(TEX.skin, x - 700, H * 0.25, 1400, 600); c.restore();
  }
  // ink cloud
  if (p.ink) {
    c.save(); for (let i = 0; i < 26; i++) { const r = 200 + hash(i) * 260; c.globalAlpha = 0.45 * (1 - u * 0.7) * hash(i + 3);
      c.drawImage(SPR.dotBig, W / 2 + (hash(i + 9) - 0.5) * 1400 - r + Math.sin(T * 0.3 + i) * 40, H / 2 + (hash(i + 5) - 0.5) * 800 - r, r * 2, r * 2); }
    c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(10,6,14,${0.6 * (1 - u)})`; c.fillRect(0, 0, W, H); c.restore();
  }
  const jit = p.jitter ? sfxTimes(beat, 'click_whale').reduce((m, t) => Math.max(m, Math.exp(-Math.abs(lt - t) * 8)), 0) * 3 * p.jitter : 0;
  HOOK.critters(c, T, 1);
  snow(c, T, { beam: bm, vy: p.descend ? -0.04 : 0.004, vx: 0.008, amt: 1, jitter: jit, size: p.macro ? 2.4 : 1 });
  // falling beak
  if (p.beakfall) {
    const y = lerp(-200, H + 150, (lt + (p.beakfall - 1) * 4.5) / 9);
    c.save(); c.translate(W / 2 + 80 + Math.sin(lt) * 30, y); c.rotate(lt * 0.4); drawBeak(c, 0, 0, 0.35, 0.1, { bare: 1 }); c.restore();
  }
  // glint of the eye at beam edge
  if (p.glint) {
    const k = seg(u, 0.25, 0.32), f = k > 0 && u < 0.5 ? Math.max(0, 1 - (u - 0.32) * 6) : 0;
    if (f > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = f;
      c.beginPath(); c.arc(W * 0.78, H * 0.3, 120, 0, 7); c.strokeStyle = 'rgba(120,230,240,.8)'; c.lineWidth = 6; c.stroke();
      c.drawImage(SPR.warm, W * 0.78 - 60 - 120, H * 0.3 - 60 - 120, 240, 240); c.restore(); }
  }
  // flake landing on glass
  if (p.flake) { const k = ease(seg(u, 0.1, 0.7)), s = lerp(10, 90, k); c.globalAlpha = 0.9; c.drawImage(SPR.dotBig, W * 0.58 - s, lerp(H * 0.2, H * 0.48, k) - s, s * 2, s * 2); c.globalAlpha = 1; }
  // wide third-person view
  if (p.wide) {
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H);
    const r = 46, x = W / 2 + Math.sin(T * 0.4) * 8, y = H * 0.55 + Math.sin(T * 0.6) * 6;
    c.save(); c.globalCompositeOperation = 'lighter'; drawBeam(c, { x: x - 20, y, ang: -0.2, len: 900, spread: 0.28 }, 0.6); c.restore();
    sub(c, x, y, r, T, { glow: p.glowSub });
  }
  c.restore();
  // interior overlays
  if (p.inside || p.hatch || p.bolts || p.cond || p.breathfog || p.droplet || p.bpm) {
    const ph = porthole(c, T);
    if (p.cond || p.droplet) for (let i = 0; i < (p.droplet ? 6 : 40) * (p.cond ? ease(u) : 1); i++) {
      const a = hash(i) * 6.283, rr = ph.r * Math.sqrt(hash(i + 1)), s = 4 + hash(i + 2) * 10;
      c.beginPath(); c.arc(ph.cx + Math.cos(a) * rr, ph.cy + Math.sin(a) * rr + (p.cond ? u * 20 * hash(i + 4) : 0), s, 0, 7);
      c.fillStyle = 'rgba(200,230,240,.12)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.5; c.stroke();
    }
    if (p.breathfog) { const k = Math.sin(clamp(u * 1.3) * Math.PI); c.globalAlpha = 0.55 * k; c.drawImage(SPR.dotBig, ph.cx - 520, ph.cy - 380, 1040, 760); c.globalAlpha = 1; }
    if (p.hatch) { const k = ease(u); c.save(); c.translate(ph.cx + lerp(-1200, 0, k), ph.cy); c.rotate(k * 2); c.beginPath(); c.arc(0, 0, 640, 0, 7); c.fillStyle = '#1a1a16'; c.fill();
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.beginPath(); c.arc(Math.cos(a) * 560, Math.sin(a) * 560, 22, 0, 7); c.fillStyle = '#4a4636'; c.fill(); } c.restore(); }
    if (p.bolts) { c.save(); c.translate(W * 0.8, H * 0.75); c.rotate(lt * 4 * (1 - u)); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c.lineTo(Math.cos(a) * 90, Math.sin(a) * 90); } c.fillStyle = '#5b5644'; c.fill(); c.strokeStyle = '#2a271e'; c.lineWidth = 6; c.stroke(); c.restore(); }
    if (p.bpm) {
      c.save(); c.translate(1380, 900); c.fillStyle = 'rgba(0,20,10,.7)'; c.fillRect(-20, -70, 440, 110);
      c.strokeStyle = '#3bff7a'; c.lineWidth = 3; c.beginPath();
      for (let x = 0; x < 300; x += 3) { const ph2 = ((x / 300 + T * 2.4) % 1); const y = ph2 > 0.45 && ph2 < 0.5 ? -50 : ph2 > 0.5 && ph2 < 0.53 ? 25 : 0; x ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); c.font = '700 44px "JetBrains Mono"'; c.fillStyle = '#3bff7a'; c.fillText(Math.round(p.bpm + Math.sin(T * 3) * 2), 315, 10);
      c.font = '500 16px "JetBrains Mono"'; c.fillText('BPM', 320, 34); c.restore();
    }
  }
  if (p.frost) { c.save(); c.globalAlpha = 0.5 * ease(u); for (let i = 0; i < 160; i++) { const a = hash(i) * 6.283, d = 0.42 + hash(i + 7) * 0.1; c.strokeStyle = 'rgba(210,235,245,.5)'; c.lineWidth = 1.5;
    const x = W / 2 + Math.cos(a) * W * d, y = H / 2 + Math.sin(a) * H * d * 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(a) * 60 * hash(i + 2), y - Math.sin(a) * 60 * hash(i + 2)); c.stroke(); } c.restore(); }
  if (p.fog) { const k = ease(seg(u, 0.35, 0.9)), x = lerp(-300, W + 300, k); const g = c.createLinearGradient(x - 300, 0, x + 300, 0); g.addColorStop(0, 'rgba(170,190,200,0)'); g.addColorStop(1, 'rgba(170,190,200,.32)'); c.fillStyle = g; c.fillRect(x - 300, 0, W - x + 300 + 300, H); }
  if (p.timer) { const s = lerp(p.timer[0], p.timer[1], ease(u)); label(c, `00:${String(Math.floor(s)).padStart(2, '0')}`.replace('00:60', '01:00'), W / 2, H - 140, { font: '700 72px "JetBrains Mono"', color: 'rgba(255,255,255,.9)' }); }
  if (p.burn) { const k = seg(u, 0.75, 1); if (k > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k; c.drawImage(SPR.warm, -400, -300, W + 800, H + 600); c.fillStyle = `rgba(255,190,120,${k * 0.6})`; c.fillRect(0, 0, W, H); c.restore(); } }
  if (p.lampOn && lt < 0.25) { c.fillStyle = `rgba(220,240,255,${0.25 * (1 - lt / 0.25)})`; c.fillRect(0, 0, W, H); }
}

// ---------------------------------------------------------------- EYE
export function pEye(c, p, u, lt, T) {
  deep(c, W * 0.6, H / 2, '#03080b');
  const z = lerp(p.zoom[0], p.zoom[1], ease(u)), pu = lerp(p.pupil[0], p.pupil[1], ease(seg(u, 0.1, 0.7)));
  let light = p.dark ? 0.55 : 1;
  if (p.reveal) light *= ease(seg(u, 0, 0.6));
  c.save(); c.globalAlpha = 1;
  drawEye(c, T, { skinR: 1600, zoom: z, pupil: pu, light, reflect: p.reflect, photophores: p.photophores, look: p.look ? [p.look[0] * ease(u), p.look[1] * ease(u)] : null, wake: p.wake });
  c.restore();
  // lamp falloff
  const g = c.createRadialGradient(W * 0.45, H * 0.75, 200, W * 0.6, H / 2, 1400);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${p.reveal ? 0.9 - 0.3 * u : 0.75})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'lighter'; drawBeam(c, { x: 40, y: H + 60, ang: -0.62, len: 1700, spread: 0.32 }, 0.22); c.restore();
  HOOK.murk(c, T, 0.35); snow(c, T, { vy: 0.003, amt: 0.7, base: 0.6 });
}

// ---------------------------------------------------------------- SKIN pan
export function pSkin(c, p, u, lt, T) {
  const k = lerp(p.pan[0], p.pan[1], ease(u));
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(-k * 380, -k * 60); c.drawImage(TEX.skin, -300, -300, 2600 * 1.1, 1600 * 1.1); c.restore();
  const g = c.createRadialGradient(W * 0.5, H * 0.55, 100, W * 0.5, H * 0.55, 1100);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.95)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (p.split) {
    const a = ease(seg(u, 0, 0.2));
    c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(2,4,8,.97)'; c.fillRect(0, 0, W / 2, H); c.restore();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(W / 2 - 1, 0, 2, H);
    label(c, 'NATURAL LIGHT AT 2,000 M', W / 4, H - 130, { a }); label(c, 'YOUR LAMP', W * 0.75, H - 130, { a });
  }
  snow(c, T, { vy: 0.004, amt: 0.5 });
}

// ---------------------------------------------------------------- SURFACE
export function pSurface(c, p, u, lt, T) {
  const calm = p.v === 'calm';
  const sky = c.createLinearGradient(0, 0, 0, H * 0.55);
  if (calm) { sky.addColorStop(0, '#5a86a6'); sky.addColorStop(1, '#c9d7de'); } else { sky.addColorStop(0, '#1c242b'); sky.addColorStop(1, '#4a5560'); }
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  if (calm) { c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.warm, W * 0.7 - 300, 40, 600, 600); c.restore(); }
  // iceberg
  c.fillStyle = calm ? '#e8f2f6' : '#9fb0ba';
  c.beginPath(); c.moveTo(W * 0.62, H * 0.52); c.lineTo(W * 0.66, H * 0.4); c.lineTo(W * 0.7, H * 0.43); c.lineTo(W * 0.74, H * 0.36); c.lineTo(W * 0.8, H * 0.45); c.lineTo(W * 0.85, H * 0.52); c.fill();
  // sea layers
  const horizon = H * 0.52;
  for (let L = 0; L < 6; L++) {
    const yb = horizon + L * L * 22 + L * 10, amp = (calm ? 4 : 14) * (1 + L * 1.2), sp = 0.6 + L * 0.25;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) c.lineTo(x, yb + Math.sin(x * 0.006 / (1 + L * 0.3) + T * sp + L) * amp + Math.sin(x * 0.017 + T * sp * 1.7) * amp * 0.3);
    c.lineTo(W, H); c.closePath();
    const sh = calm ? [20 + L * 6, 60 + L * 8, 90 + L * 6] : [14 + L * 5, 24 + L * 5, 30 + L * 6];
    c.fillStyle = `rgb(${sh[0]},${sh[1]},${sh[2]})`; c.fill();
  }
  // ship
  if (['ship', 'storm', 'crane', 'splash', 'wave'].includes(p.v)) {
    const sx = W * (p.v === 'ship' ? lerp(0.3, 0.36, u) : 0.34), sy = horizon + 40 + Math.sin(T * 1.1) * 10, roll = Math.sin(T * 0.9) * 0.05;
    c.save(); c.translate(sx, sy); c.rotate(roll); c.fillStyle = '#0d1114';
    c.beginPath(); c.moveTo(-260, -20); c.lineTo(260, -20); c.lineTo(220, 40); c.lineTo(-230, 40); c.fill();
    c.fillRect(-140, -90, 160, 70); c.fillRect(-100, -130, 70, 40); c.fillRect(120, -150, 12, 130);
    c.strokeStyle = '#0d1114'; c.lineWidth = 8; c.beginPath(); c.moveTo(126, -150); c.lineTo(260, -110); c.stroke();
    c.fillStyle = '#ffcc66'; [[-120, -70], [-80, -70], [-40, -70]].forEach(([x, y]) => c.fillRect(x, y, 16, 12));
    if (p.v === 'crane' || p.v === 'splash') {
      const swing = Math.sin(T * 1.6) * 0.15, drop = p.v === 'splash' ? easeIn(seg(u, 0, 0.4)) * 200 : 0;
      c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(260, -110); c.lineTo(260 + Math.sin(swing) * 120, -110 + 120 + drop); c.stroke();
      if (drop < 190) sub(c, 260 + Math.sin(swing) * 120, 30 + drop, 36, T, { cableX: 0 });
    }
    c.restore();
  }
  if (p.v === 'splash') {
    const k = seg(u, 0.35, 0.8);
    for (let i = 0; i < 60; i++) { const a = -Math.PI / 2 + (hash(i) - 0.5) * 2, v = 300 * hash(i + 3), t2 = k;
      c.fillStyle = 'rgba(230,240,245,.8)'; c.beginPath(); c.arc(W * 0.34 + 300 + Math.cos(a) * v * t2, horizon + 70 + Math.sin(a) * v * t2 + 400 * t2 * t2, 4 + 6 * hash(i + 1), 0, 7); c.fill(); }
    if (u > 0.75) { c.fillStyle = `rgba(10,40,55,${ease(seg(u, 0.75, 1))})`; c.fillRect(0, 0, W, H); }
  }
  if (p.v === 'wave') {
    // big cresting wave in foreground
    const k = ease(u), xc = lerp(W * 1.2, W * 0.35, k), A = lerp(0.25, 0.62, k) * H;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) { const d = (x - xc) / 520, y = H * 0.98 - A * Math.exp(-d * d) * (d < 0 ? 1 : 1 - 0.25 * Math.min(1, d)) + Math.sin(x * 0.02 + T * 2) * 6; c.lineTo(x, y); }
    c.lineTo(W, H); c.closePath(); const wg = c.createLinearGradient(0, H * 0.3, 0, H); wg.addColorStop(0, '#2a4452'); wg.addColorStop(1, '#0a141a'); c.fillStyle = wg; c.fill();
    c.fillStyle = 'rgba(235,242,246,.75)'; for (let i = 0; i < 160; i++) { const x = xc + (hash(i) - 0.5) * 500, d = (x - xc) / 520; c.fillRect(x + Math.sin(T * 3 + i) * 6, H * 0.98 - A * Math.exp(-d * d) - hash(i + 1) * 40 - 6, 3, 3); }
    if (p.building) building(c, W * 0.82, H * 0.88, 6, 110, 180, 'rgba(160,215,232,.85)');
  }
  // rain & spray
  if (!calm) { c.strokeStyle = 'rgba(200,210,220,.18)'; c.lineWidth = 1.5; for (let i = 0; i < 180; i++) { const x = (hash(i) * W + T * 400) % W, y = (hash(i + 1) * H + T * 900) % H; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 26); c.stroke(); } }
  if (calm) { c.strokeStyle = '#1b2228'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { const x = (W * 0.2 + i * 90 + T * 30) % W, y = 200 + i * 25 + Math.sin(T * 3 + i) * 6; c.beginPath(); c.moveTo(x - 16, y - 6); c.quadraticCurveTo(x - 8, y - 12, x, y); c.quadraticCurveTo(x + 8, y - 12, x + 16, y - 6); c.stroke(); } }
  if (p.sink) { const k = ease(u), y = lerp(H, -50, k); c.fillStyle = '#0b3446'; c.fillRect(0, y, W, H); const g = c.createLinearGradient(0, y, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.9)'); c.fillStyle = g; c.fillRect(0, y, W, H); }
}

// ---------------------------------------------------------------- DESCENT (water column)
function waterCol(d) {
  const stops = [[0, [40, 150, 170]], [30, [25, 110, 150]], [100, [12, 70, 120]], [200, [6, 40, 85]], [500, [3, 18, 40]], [800, [1, 8, 18]], [1000, [0, 3, 7]], [2000, [0, 2, 4]]];
  for (let i = 1; i < stops.length; i++) if (d <= stops[i][0]) { const t = (d - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]); return stops[i - 1][1].map((v, k) => Math.round(lerp(v, stops[i][1][k], t))); }
  return stops[stops.length - 1][1];
}
export function pDescent(c, p, u, lt, T) {
  const d = lerp(p.d[0], p.d[1], p.up ? ease(u) : u);
  const col = waterCol(d), col2 = waterCol(d + 150);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgb(${col})`); g.addColorStop(1, `rgb(${col2})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  HOOK.murk(c, T, 0.5 + 0.5 * clamp(d / 600)); if (d > 150) HOOK.critters(c, T, clamp(d / 500));
  const sun = clamp(1 - d / 300);
  if (sun > 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const x = W * (0.1 + i * 0.14) + Math.sin(T * 0.3 + i) * 40;
    c.globalAlpha = sun * 0.18; c.beginPath(); c.moveTo(x, -20); c.lineTo(x + 60, -20); c.lineTo(x + 260, H); c.lineTo(x + 120, H); c.fillStyle = '#bfefff'; c.fill(); } c.restore(); }
  const dir = p.up ? 1 : -1;
  // bioluminescence
  if (p.sparks || d > 250) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 70; i++) { const k = Math.abs(Math.sin(T * (0.8 + hash(i) * 2) + i)); if (k < 0.6) continue;
    const s = 10 + 20 * hash(i + 4); c.globalAlpha = (k - 0.6) * 2.2; c.drawImage(i % 3 ? SPR.blue : SPR.teal, hash(i + 1) * W - s, ((hash(i + 2) * H + T * 20 * -dir) % H + H) % H - s, s * 2, s * 2); } c.restore(); }
  if (p.jelly) { const x = lerp(W * 0.8, W * 0.6, u), y = H * 0.35 + Math.sin(T) * 20, pulse = 1 + 0.1 * Math.sin(T * 3);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.fillStyle = 'rgba(160,210,255,.4)'; c.beginPath(); c.ellipse(x, y, 70 * pulse, 50 / pulse, 0, Math.PI, 0); c.fill();
    c.strokeStyle = 'rgba(160,210,255,.35)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(x - 60 + i * 17, y); for (let k = 0; k < 10; k++) c.lineTo(x - 60 + i * 17 + Math.sin(T * 2 + k + i) * 6, y + k * 22); c.stroke(); } c.restore(); }
  if (p.fish) { c.save(); for (let i = 0; i < 18; i++) { const x = ((hash(i) * W * 1.5 - u * W * 1.8 + W) % (W * 1.5)), y = H * 0.4 + hash(i + 1) * 300; c.fillStyle = 'rgba(200,220,235,.75)'; c.beginPath(); c.ellipse(x, y, 26, 8, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(x + 22, y); c.lineTo(x + 40, y - 10); c.lineTo(x + 40, y + 10); c.fill(); c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.blue, x - 20, y - 4, 16, 16); c.globalCompositeOperation = 'source-over'; } c.restore(); }
  if (p.siph) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 120; k++) { const t = k / 120, x = lerp(W * 0.1, W * 0.9, t), y = H * 0.3 + Math.sin(t * 9 + T) * 90 + t * 120;
    c.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(T * 4 - t * 20)); c.drawImage(SPR.blue, x - 14, y - 14, 28, 28); } c.restore(); }
  // the sphere
  const sx = W / 2 + Math.sin(T * 0.5) * 20, sy = H * 0.5 + Math.sin(T * 0.8) * 10;
  if (d > 150) { c.save(); c.globalCompositeOperation = 'lighter'; drawBeam(c, { x: sx - 10, y: sy + 10, ang: 1.9, len: 700, spread: 0.3 }, 0.5); c.restore(); }
  sub(c, sx, sy, 60, T, { glow: d > 300 });
  // bubbles
  for (let i = 0; i < 30; i++) { const y = ((hash(i) * H - T * 160 * (p.up ? -0.3 : 1)) % H + H) % H; c.beginPath(); c.arc(sx + (hash(i + 2) - 0.5) * 120 + Math.sin(T * 3 + i) * 8, y, 2 + 5 * hash(i + 1), 0, 7); c.strokeStyle = 'rgba(220,240,250,.35)'; c.lineWidth = 1.5; c.stroke(); }
  snow(c, T, { vy: dir * 0.05, amt: clamp(d / 300, 0.3, 1), base: 0.5 });
  // spectrum bar (light absorption)
  if (p.redfade || p.blood) {
    const bands = [['RED', '#ff3b30', 20], ['ORANGE', '#ff9500', 50], ['YELLOW', '#ffd60a', 100], ['GREEN', '#34c759', 150], ['BLUE', '#0a84ff', 400]];
    bands.forEach(([n, colr, dd], i) => { const a = clamp(1 - (d - dd * 0.5) / (dd * 0.8)); const x = W / 2 - 400 + i * 165;
      c.globalAlpha = 0.25 + 0.75 * a; c.fillStyle = colr; c.fillRect(x, H - 190, 150, 18); label(c, n, x + 75, H - 140, { font: '600 18px "JetBrains Mono"', a: 0.3 + 0.7 * a }); });
    c.globalAlpha = 1;
  }
  if (p.blood) {
    c.save(); c.translate(W * 0.78, H * 0.42); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(0, 0, 170, 0, 7); c.fill();
    c.fillStyle = '#c8a088'; c.beginPath(); c.ellipse(0, 60, 50, 140, 0, 0, 7); c.fill();
    const gc = `rgb(${Math.round(lerp(170, 40, ease(u)))},${Math.round(lerp(20, 90, ease(u)))},${Math.round(lerp(20, 50, ease(u)))})`;
    c.fillStyle = gc; c.beginPath(); c.moveTo(0, -95); c.bezierCurveTo(30, -55, 30, -30, 0, -25); c.bezierCurveTo(-30, -30, -30, -55, 0, -95); c.fill(); c.restore();
  }
  if (p.fadeout) { c.fillStyle = `rgba(0,0,0,${ease(u)})`; c.fillRect(0, 0, W, H); }
  if (p.dark) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H); }
}

// ---------------------------------------------------------------- BLACK / TITLE / CARD
export function pBlack(c, p, u, lt, T) {
  HOOK.water(c, T, { depth: 2000, glow: 0.4, murk: 0.6 }); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H);
  HOOK.critters(c, T, 0.6); snow(c, T, { amt: 0.6, vy: 0.003, base: 0.5 });
  if (p.label) typeText(c, p.label, lt, W / 2, H / 2 + 120, { font: '600 34px "JetBrains Mono"', ls: '10px', color: 'rgba(150,220,235,.85)' });
}
export function pTitle(c, p, u, lt, T) {
  deep(c, W / 2, H / 2, '#071a24');
  snow(c, T, { vy: -0.01, amt: 0.8 });
  const k = easeOut(seg(lt, 0, 1.2));
  c.save(); c.globalAlpha = k; c.font = '900 150px "Inter Display"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = `${lerp(40, 6, k)}px`;
  c.shadowColor = 'rgba(80,200,255,.35)'; c.shadowBlur = 50; c.fillStyle = '#fff'; c.fillText(p.l1, W / 2, H / 2 - 40); c.restore();
  // light sweep
  const sx = lerp(-400, W + 400, seg(lt, 0.3, 1.6));
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.drawImage(SPR.warm, sx - 300, H / 2 - 340, 600, 600); c.restore();
  typeText(c, p.l2, lt - 1.4, W / 2, H / 2 + 90, { font: 'italic 500 44px "Inter"', ls: '1px', color: '#ff6a55', dur: 1 });
}
export function pCard(c, p, u, lt, T) {
  const tint = p.tone === 'sepia' ? '#1e160c' : p.tone === 'blue' ? '#04202e' : p.tone === 'red' ? '#1a0606' : '#070d12';
  deep(c, W / 2, H / 2, tint); snow(c, T, { amt: 0.4, vy: 0.003 });
  if (p.glitch && Math.floor(lt * 12) % 5 === 0) c.translate(R2(lt) * 14, 0);
  if (p.type) { p.lines.forEach((l, i) => typeText(c, l, lt - i * 1.1, W / 2, H / 2 - 30 + i * 80, { font: '700 64px "Inter Display"', ls: '2px', color: i ? '#ff6a55' : '#fff', dur: 1 })); return; }
  bigText(c, p.lines, lt, { size: p.huge ? 230 : p.small ? 90 : p.lines.length > 1 ? 112 : 140, accent: p.tone === 'blue' ? '#5fd0ff' : p.tone === 'sepia' ? '#e2b26a' : '#ff4a3d', accentAll: p.lines.length === 1 && p.tone !== 'white' });
}
const R2 = t => Math.sin(t * 913.1) * 0.5 + Math.sin(t * 271.7) * 0.5;

// ---------------------------------------------------------------- FLASH inserts
export function pFlash(c, p, u, lt, T) {
  deep(c, W / 2, H / 2, p.red ? '#1a0303' : '#051018');
  const sc = 1 + u * 0.15;
  c.save(); c.translate(W / 2, H / 2); c.scale(sc, sc); c.translate(-W / 2, -H / 2);
  if (p.kind === 'hooks') drawClub(c, W / 2 + 80, H / 2, 1.05, T, { rotate: p.rotate, pull: p.red ? ease(u) : 0 });
  if (p.kind === 'beak') { const open = p.open ? ease(seg(u, 0.05, 0.3)) : p.chop ? Math.abs(Math.sin(lt * 9)) : Math.abs(Math.sin(lt * 2.2)) * 0.8; drawBeak(c, W / 2, H / 2, 1.2, open); }
  if (p.kind === 'hearts') {
    [-1, 0, 1].forEach((k, i) => { const beat = Math.max(0, Math.sin(lt * 8 - i * 0.9)); const s = 90 * (1 + 0.25 * beat);
      c.save(); c.translate(W / 2 + k * 300, H / 2); c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.blue, -s * 2, -s * 2, s * 4, s * 4); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#2d7fff'; c.beginPath(); c.moveTo(0, s * 0.6); c.bezierCurveTo(-s * 1.2, -s * 0.2, -s * 0.5, -s, 0, -s * 0.4); c.bezierCurveTo(s * 0.5, -s, s * 1.2, -s * 0.2, 0, s * 0.6); c.fill(); c.restore(); });
  }
  if (p.kind === 'whale') {
    c.save(); c.globalCompositeOperation = 'lighter'; const wx = lerp(W * 1.1, -W * 0.6, u); for (let i = 0; i < 700; i++) { const t2 = hash(i), x = wx + t2 * 1650, half = 200 * Math.sin(Math.min(1, t2 * 1.6) * Math.PI * 0.5) * (1 - Math.max(0, t2 - 0.6) * 1.8), y = H / 2 - 20 + (hash(i + 1) > 0.5 ? -1 : 1) * half + (hash(i + 2) - 0.5) * 70; c.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(T * 3 + i)); c.drawImage(SPR.teal, x - 14, y - 14, 28, 28); } c.restore();
    whaleSil(c, lerp(W * 1.1, -W * 0.6, u), H / 2 - 20, 1600, '#05090c', { edge: 'rgba(80,255,215,.25)' });
    for (const t0 of [0.2, 0.9, 1.6]) { const k = lt - t0; if (k > 0 && k < 1.2) { c.beginPath(); c.arc(W * 0.35, H / 2, k * 700, 0, 7); c.strokeStyle = `rgba(150,230,255,${0.5 * (1 - k / 1.2)})`; c.lineWidth = 3; c.stroke(); } }
  }
  c.restore();
  if (p.sepia) sepia(c, T);
  // macro lens bokeh edge
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; for (let i = 0; i < 8; i++) { const s = 140; c.drawImage(SPR.dotBig, hash(i) * W - s, hash(i + 3) * H - s, s * 2, s * 2); } c.restore();
}

function sepia(c, T, modern) {
  c.save();
  if (!modern) {
    c.globalCompositeOperation = 'saturation'; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = '#d6b588'; c.fillRect(0, 0, W, H);
  } else {
    c.globalCompositeOperation = 'multiply'; c.fillStyle = '#9fb8c8'; c.fillRect(0, 0, W, H);
  }
  c.globalCompositeOperation = 'source-over';
  // scratches + flicker
  c.globalAlpha = 0.08 + 0.05 * Math.sin(T * 50); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.globalAlpha = 0.4;
  c.strokeStyle = 'rgba(255,255,240,.6)'; c.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) { const x = hash(Math.floor(T * 24) + i * 31) * W; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 10, H); c.stroke(); }
  c.restore();
  label(c, modern ? 'DRAMATIZED RECONSTRUCTION' : 'ARCHIVE · RECONSTRUCTION', W - 300, H - 90, { font: '500 16px "JetBrains Mono"', a: 0.6 });
}

// ---------------------------------------------------------------- ARCHIVE scenes
export function pArchive(c, p, u, lt, T) {
  const modern = !!p.modern;
  c.fillStyle = modern ? '#0a1218' : '#2a2a2a'; c.fillRect(0, 0, W, H);
  const v = p.v;
  if (v === 'ship' || v === 'boat') {
    const sky = c.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, modern ? '#05080b' : '#8a8a8a'); sky.addColorStop(1, modern ? '#18232b' : '#bdbdbd'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    c.fillStyle = modern ? '#0a1014' : '#555'; c.fillRect(0, H * 0.6, W, H);
    c.save(); c.translate(lerp(W * 0.45, W * 0.55, u), H * 0.6 + Math.sin(T) * 6); c.fillStyle = modern ? '#020304' : '#222';
    c.beginPath(); c.moveTo(-380, -30); c.lineTo(380, -30); c.lineTo(320, 50); c.lineTo(-340, 50); c.fill();
    if (!modern) { c.fillRect(-20, -330, 10, 300); c.fillRect(140, -280, 10, 250); c.fillRect(-200, -110, 60, 80); c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(-15, -330); c.lineTo(-380, -30); c.moveTo(-15, -330); c.lineTo(380, -30); c.stroke(); }
    else { c.fillRect(-200, -130, 260, 100); c.fillRect(160, -200, 14, 170); c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.warm, 60, -320, 260, 260); c.drawImage(SPR.warm, -260, -220, 200, 200); c.globalCompositeOperation = 'source-over'; }
    c.restore();
    if (modern) { c.fillStyle = 'rgba(230,240,250,.6)'; for (let i = 0; i < 200; i++) { const x = (hash(i) * W + T * 120) % W, y = (hash(i + 1) * H + T * 200) % H; c.fillRect(x, y, 2, 2); } }
  } else if (v === 'whale' || v === 'deck') {
    c.fillStyle = modern ? '#1d262c' : '#6e6e6e'; c.fillRect(0, H * 0.55, W, H);
    if (v === 'whale') whaleSil(c, W * 0.15, H * 0.62, 1500, '#1e1e1e');
    else { c.save(); c.translate(W / 2, H * 0.68); c.drawImage(TEX.skin, -500, -140, 1000, 280); c.restore(); squidSil(c, W * 0.2, H * 0.68, 1100, 'rgba(120,25,15,.85)', { fat: 1.6, tent: 150 }); }
    for (let i = 0; i < 6; i++) silhouette(c, 'man', W * (0.12 + i * 0.15) + Math.sin(T + i) * 6, H * 0.88, 260, modern ? '#05080a' : '#2a2a2a');
  } else if (v === 'arms') {
    c.fillStyle = '#6a6a6a'; c.fillRect(0, 0, W, H);
    for (const k of [-1, 1]) { c.save(); c.translate(W / 2 + k * 260, H / 2 + k * 60); c.rotate(k * 0.3); drawClub(c, 0, 0, 0.5, T, {}); c.restore(); }
  } else if (v === 'sketch') {
    c.fillStyle = '#d9cfb8'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, H / 2); c.rotate(-0.03); c.strokeStyle = '#3a2f22'; c.lineWidth = 3;
    const k = ease(u); c.setLineDash([2000]); c.lineDashOffset = 2000 * (1 - k);
    c.beginPath(); c.ellipse(150, -40, 300, 100, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(-190, -40, 60, 55, 0, 0, 7); c.stroke();
    for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-240, -40 + (i - 3.5) * 8); c.quadraticCurveTo(-450, -40 + (i - 3.5) * 25, -620, -40 + (i - 3.5) * 40); c.stroke(); }
    c.setLineDash([]); c.restore();
    c.save(); c.font = 'italic 52px "DejaVu Serif"'; c.fillStyle = '#3a2f22'; c.textAlign = 'center';
    const txt = 'Mesonychoteuthis hamiltoni', n = Math.floor(clamp((lt - 0.8) / 2) * txt.length); c.fillText(txt.slice(0, n), W / 2, H * 0.8);
    c.font = '32px "DejaVu Serif"'; c.fillText('Robson, 1925', W / 2, H * 0.87); c.restore();
  } else if (v === 'scars') {
    c.fillStyle = '#4a4f53'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(230,230,225,.5)'; c.lineWidth = 3;
    for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(hash(i) * W, hash(i + 1) * H, 10 + hash(i + 2) * 30, 0, 7); c.stroke(); }
    for (let i = 0; i < 30; i++) { const x = hash(i + 50) * W, y = hash(i + 51) * H; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 100, y + 30, x + 300 * hash(i + 52), y + 80); c.stroke(); }
    c.save(); c.translate(-u * 200, 0); c.restore();
  } else if (v === 'line') {
    c.fillStyle = '#0a1218'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W * 0.3, H * 0.5); c.rotate(lt * 0.8); c.beginPath(); c.arc(0, 0, 200, 0, 7); c.fillStyle = '#2a3238'; c.fill(); c.strokeStyle = '#6a747a'; c.lineWidth = 16; c.stroke();
    for (let i = 0; i < 6; i++) { c.rotate(1.047); c.fillStyle = '#1a2026'; c.fillRect(-10, 40, 20, 140); } c.restore();
    c.strokeStyle = '#d8d8d0'; c.lineWidth = 3 + Math.sin(T * 60) * 0.6; c.beginPath(); c.moveTo(W * 0.3 + 200, H * 0.5); c.lineTo(W, H * 0.9 + Math.sin(T * 40) * 4); c.stroke();
  } else if (v === 'underwater') {
    c.fillStyle = '#020a10'; c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.warm, W * 0.2, -200, 1100, 900); c.restore();
    c.strokeStyle = 'rgba(220,220,210,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(W * 0.6, 0); c.lineTo(W * 0.55, H * 0.45); c.stroke();
    c.fillStyle = '#7b8a90'; c.beginPath(); c.ellipse(W * 0.55, H * 0.5, 120, 40, 0.3, 0, 7); c.fill();
    const k = ease(seg(u, 0.3, 1)); c.save(); c.globalAlpha = k; c.translate(W * 0.55, H * 0.55); c.rotate(-0.4); c.drawImage(TEX.skin, -600, -150, 1200, 300); c.restore();
  } else if (v === 'museum') {
    c.fillStyle = '#05080a'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(90,150,170,.25)'; c.fillRect(W * 0.12, H * 0.25, W * 0.76, H * 0.5); c.strokeStyle = 'rgba(200,230,240,.5)'; c.lineWidth = 4; c.strokeRect(W * 0.12, H * 0.25, W * 0.76, H * 0.5);
    squidSil(c, W * 0.2, H * 0.5, 1100, 'rgba(140,40,25,.9)', { fat: 1.5, tent: 100 });
    for (let i = 0; i < 4; i++) silhouette(c, 'man', W * (0.2 + i * 0.2), H * 0.95, 300, '#000');
    label(c, 'TE PAPA · WELLINGTON, NEW ZEALAND', W / 2, H * 0.2, { a: ease(u * 3) });
  } else if (v === 'rov' || v === 'rovsquid') {
    c.fillStyle = '#01070b'; c.fillRect(0, 0, W, H); snow(c, T, { vy: 0.01, amt: 0.6 });
    c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.warm, W / 2 - 700, H / 2 - 500, 1400, 1000); c.restore();
    if (v === 'rovsquid') { c.save(); c.translate(W / 2 + Math.sin(T * 0.6) * 40, H / 2 + Math.sin(T * 0.8) * 20); c.globalAlpha = 0.55; squidSil(c, -260, 0, 520, 'rgba(230,240,245,.5)', { fat: 1.2 });
      c.globalAlpha = 1; c.fillStyle = '#081014'; c.beginPath(); c.arc(-60, -6, 14, 0, 7); c.fill(); c.restore(); }
    c.save(); c.font = '500 24px "JetBrains Mono"'; c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillText(`ROV · DEPTH 600 M · ${p.year || '2025'}`, 120, 140); c.fillText('SOUTH SANDWICH ISLANDS', 120, 176);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.strokeRect(W / 2 - 300, H / 2 - 200, 600, 400); c.restore();
  }
  if (p.year) bigText(c, [p.year], lt, { size: 160, y: 200, accent: modern ? '#5fd0ff' : '#e2b26a', accentAll: true });
  sepia(c, T, modern);
}

// ---------------------------------------------------------------- MAP
export function pMap(c, p, u, lt, T) {
  deep(c, W / 2, H / 2, '#04141c');
  c.save(); c.translate(W / 2, H / 2 + 40); const s = 1 + u * 0.3; c.scale(s, s);
  c.strokeStyle = 'rgba(95,208,255,.25)'; c.lineWidth = 1;
  for (let r = 120; r < 700; r += 90) { c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); }
  for (let a = 0; a < 12; a++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a / 12 * 6.283) * 700, Math.sin(a / 12 * 6.283) * 700); c.stroke(); }
  // Antarctica (stylized)
  const pts = [[-260, -60], [-200, -170], [-60, -230], [60, -200], [190, -230], [300, -120], [330, 20], [250, 140], [120, 190], [40, 120], [-20, 160], [-160, 200], [-280, 110]];
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = '#c9dde6'; c.fill();
  c.fillStyle = '#04141c'; c.beginPath(); c.ellipse(20, 140, 70, 45, 0, 0, 7); c.fill(); // Ross Sea notch
  const k = Math.abs(Math.sin(T * 3));
  c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.red, 20 - 60 - k * 40, 190 - 60 - k * 40, 120 + k * 80, 120 + k * 80); c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(20, 190, 10, 0, 7); c.fill();
  c.restore();
  label(c, 'SOUTHERN OCEAN', W / 2, 180, { font: '700 40px "JetBrains Mono"', ls: '12px' });
  label(c, 'ROSS SEA · 2,000 M', W / 2 + 40, H / 2 + 330, { color: '#ff6a55', a: ease(seg(u, 0.3, 0.5)) });
}

// ---------------------------------------------------------------- SONAR
export function pSonar(c, p, u, lt, T) {
  c.fillStyle = '#010a06'; c.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2 + 40, R = 440;
  c.strokeStyle = 'rgba(60,255,140,.3)'; c.lineWidth = 2; for (let r = 110; r <= R; r += 110) { c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); }
  c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
  const a = T * 3; const g = c.createConicGradient ? c.createConicGradient(a, cx, cy) : null;
  if (g) { g.addColorStop(0, 'rgba(60,255,140,.45)'); g.addColorStop(0.12, 'rgba(60,255,140,0)'); g.addColorStop(1, 'rgba(60,255,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); }
  const br = lerp(R * 0.95, R * 0.25, ease(u)), bx = cx + Math.cos(-2.2) * br, by = cy + Math.sin(-2.2) * br;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 + 0.4 * Math.sin(T * 12); c.drawImage(SPR.teal, bx - 70, by - 50, 140 + u * 120, 100); c.restore();
  c.fillStyle = '#3bff8c'; c.beginPath(); c.arc(cx, cy, 8, 0, 7); c.fill();
  label(c, `CONTACT · ${Math.round(lerp(400, 60, ease(u)))} M · CLOSING`, cx, cy + R + 60, { color: '#3bff8c' });
  label(c, 'LARGE BIOLOGIC', bx, by - 60, { color: '#3bff8c', font: '600 20px "JetBrains Mono"' });
}

// ---------------------------------------------------------------- SPLIT / FREEZE / GLASS
export function pSplit(c, p, u, lt, T) {
  deep(c, W / 2, H / 2, '#06121a'); snow(c, T, { amt: 0.4 });
  const both = p.side === 'both', showIn = both || p.side === 'inside', showOut = both || p.side === 'outside';
  const k = both ? ease(seg(lt, 0, 0.5)) : 1;
  if (both) { c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(W / 2 - 1, 0, 2, H * k); }
  const lx = both ? W * 0.27 : W / 2, rx = both ? W * 0.73 : W / 2;
  if (showIn) {
    const x = lx, y = H / 2;
    sub(c, x, y, 150, T, { glow: 1 });
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + T * 0.4; c.strokeStyle = 'rgba(160,30,20,.95)'; c.lineWidth = 26 - i * 2; c.lineCap = 'round';
      c.beginPath(); c.arc(x, y, 170 + i * 6, a, a + 1.3); c.stroke(); }
    if (p.side === 'inside') { for (let i = 0; i < 8; i++) { const a = i * 0.8 + lt; c.strokeStyle = `rgba(255,240,200,${0.7 * Math.abs(Math.sin(lt * 4 + i))})`; c.lineWidth = 3; c.beginPath(); c.moveTo(x + Math.cos(a) * 160, y + Math.sin(a) * 160); c.lineTo(x + Math.cos(a + 0.15) * 200, y + Math.sin(a + 0.15) * 200); c.stroke(); }
      bigText(c, ['YOU SURVIVE'], lt - 0.6, { size: 90, y: H - 180, accent: '#3bff8c', accentAll: true }); }
    label(c, 'INSIDE THE SPHERE', x, 190, {});
  }
  if (showOut) {
    const x = rx, y = H / 2 + 120;
    const pull = p.pull ? ease(u) : 0;
    c.save(); c.translate(x + (p.pull ? -pull * 200 : 0), y);
    if (p.suit) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.drawImage(SPR.blue, -200, -400, 400, 500); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    silhouette(c, 'man', 0, 0, 300, p.suit ? '#9fe6ff' : 'rgba(160,215,232,.9)'); c.restore();
    if (p.pull) { for (let i = 0; i < 5; i++) { c.strokeStyle = 'rgba(150,25,15,.95)'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(-50, H * 0.3 + i * 90); c.quadraticCurveTo(x - 300, y - 200 + i * 40, x - pull * 200, y - 150 + i * 30); c.stroke(); } }
    label(c, 'OUTSIDE', x, 190, {});
  }
}
export function pGlass(c, p, u, lt, T) {
  c.save(); shakeT(c, 5, T);
  c.drawImage(TEX.skin, -200 - lt * 30, -300, 2600, 1600);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const x = hash(i) * W, y = hash(i + 1) * H, r = 40 + hash(i + 2) * 60, sq = 1 + 0.08 * Math.sin(T * 6 + i);
    const g = c.createRadialGradient(x, y, r * 0.2, x, y, r * sq); g.addColorStop(0, '#2a0605'); g.addColorStop(0.5, '#d88a78'); g.addColorStop(0.8, '#f4c4b4'); g.addColorStop(1, 'rgba(120,30,20,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * sq, 0, 7); c.fill(); }
  c.restore();
  porthole(c, T);
}
export function pFreeze(c, p, u, lt, T) {
  pGlass(c, p, 0, 0, 3.3);
  c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H); c.restore();
  c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H);
  bigText(c, [p.q], lt - 0.2, { size: 100 });
}

// ---------------------------------------------------------------- TEASER / END CARD
export function pTeaser(c, p, u, lt, T) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const on = lt > 0.6 ? (lt < 0.8 ? 0.4 : 1) : 0, lx = W / 2, ly = H * 0.35;
  if (on) { c.save(); c.globalCompositeOperation = 'lighter'; const s = 60 + 10 * Math.sin(T * 5); c.drawImage(SPR.teal, lx - s * 3, ly - s * 3, s * 6, s * 6); c.restore(); }
  c.strokeStyle = `rgba(80,140,130,${on * 0.5})`; c.lineWidth = 3; c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx - 60, ly + 60, lx - 160, ly + 140); c.stroke();
  const open = lt > 3 ? Math.max(0, 1 - (lt - 3.2) * 6) : ease(seg(lt, 1.8, 3));
  if (lt > 1.8) {
    c.save(); c.translate(lx - 160, ly + 300); c.globalAlpha = on * 0.9;
    const hg = c.createRadialGradient(0, -120, 40, 0, 0, 460); hg.addColorStop(0, 'rgba(60,90,85,.9)'); hg.addColorStop(1, 'rgba(5,8,8,0)');
    c.fillStyle = hg; c.beginPath(); c.ellipse(0, 0, 460, 300, 0, 0, 7); c.fill();
    const top = 30 - 30 - 170 * open, bot = 30 + 30 + 170 * open;
    c.fillStyle = '#000'; c.beginPath(); c.moveTo(-360, 30); c.quadraticCurveTo(0, top - 40, 360, 30); c.quadraticCurveTo(0, bot + 40, -360, 30); c.fill();
    for (let i = 0; i < 16; i++) { const t3 = i / 15, x = lerp(-300, 300, t3), arc = Math.sin(t3 * Math.PI), h = (60 + 70 * hash(i)) * (0.5 + 0.5 * arc);
      const yT = lerp(30, top - 10, arc), yB = lerp(30, bot + 10, arc);
      c.strokeStyle = 'rgba(230,235,228,.9)'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, yT); c.quadraticCurveTo(x + 14, yT + h * 0.5, x + 4, yT + h); c.stroke();
      c.beginPath(); c.moveTo(x + 10, yB); c.quadraticCurveTo(x - 4, yB - h * 0.5, x + 6, yB - h); c.stroke(); }
    c.restore();
  }
  if (lt > 3.4) bigText(c, ['NEXT: THE ANGLERFISH'], lt - 3.4, { size: 80, y: H - 180, accentAll: true, accent: '#5fd0ff' });
}
export function pEnd(c, p, u, lt, T) {
  deep(c, W / 2, H / 2, '#06202c'); snow(c, T, { vy: 0.02, amt: 0.8 });
  bigText(c, ['THE DESCENT'], lt, { size: 160, y: H / 2 - 80 });
  label(c, 'SUBSCRIBE · THE DESCENT CONTINUES', W / 2, H / 2 + 60, { font: '700 34px "JetBrains Mono"', ls: '8px', color: '#ff6a55', a: ease(seg(lt, 0.6, 1.2)) });
  c.save(); c.globalAlpha = ease(seg(lt, 1, 1.6)); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3; c.strokeRect(W / 2 - 330, H / 2 + 130, 660, 220);
  label(c, 'NEXT EPISODE', W / 2, H / 2 + 190, { font: '500 22px "JetBrains Mono"' }); label(c, 'THE ANGLERFISH', W / 2, H / 2 + 260, { font: '900 60px "Inter Display"', color: '#fff' }); c.restore();
}
