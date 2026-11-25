// Core 2D utilities: math, sprites, particles, light, HUD, text slams, grading.
export const W = 1920, H = 1080;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => (t = clamp(t), t * t * (3 - 2 * t));
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => Math.pow(clamp(t), 3);
export const easeOutBack = t => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const seg = (u, a, b) => clamp((u - a) / (b - a));

let seed = 7;
export const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
export const R = (a, b) => a + (b - a) * rnd();
export const setSeed = s => { seed = s; };
export const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

// ---------------- sprites
export function glowSprite(size, col) {
  const [c, x] = mk(size, size), r = size / 2;
  const g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.2, `rgba(${col},.55)`); g.addColorStop(0.5, `rgba(${col},.15)`); g.addColorStop(1, `rgba(${col},0)`);
  x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
}
export const SPR = {};
export const HOOK = { T: 0 };
export function initSprites() {
  SPR.dot = glowSprite(32, '225,240,248');
  SPR.dotBig = glowSprite(128, '225,240,248');
  SPR.teal = glowSprite(64, '80,255,215');
  SPR.blue = glowSprite(64, '90,190,255');
  SPR.warm = glowSprite(256, '255,236,210');
  SPR.red = glowSprite(256, '255,70,40');
  // beam cone (pointing +x), pre-blurred
  const [b, bx] = mk(1400, 700);
  bx.filter = 'blur(28px)';
  const g = bx.createLinearGradient(0, 0, 1400, 0);
  g.addColorStop(0, 'rgba(205,240,235,.6)'); g.addColorStop(0.4, 'rgba(150,225,215,.24)'); g.addColorStop(1, 'rgba(120,200,200,0)');
  bx.fillStyle = g; bx.beginPath(); bx.moveTo(40, 335); bx.lineTo(1360, 60); bx.lineTo(1360, 640); bx.lineTo(40, 365); bx.closePath(); bx.fill();
  SPR.beam = b;
  // grain tiles
  SPR.grain = [];
  for (let k = 0; k < 6; k++) {
    const [n, nx] = mk(960, 540); const id = nx.createImageData(960, 540), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    nx.putImageData(id, 0, 0); SPR.grain.push(n);
  }
  // vignette
  const [v, vx] = mk(W, H);
  const vg = vx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.02);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.7, 'rgba(0,0,0,.35)'); vg.addColorStop(1, 'rgba(0,0,0,.92)');
  vx.fillStyle = vg; vx.fillRect(0, 0, W, H); SPR.vignette = v;
}

// ---------------- particles (marine snow), 3 depth layers
const SNOW = [];
export function initSnow() {
  setSeed(99);
  for (let i = 0; i < 900; i++) SNOW.push({ x: rnd(), y: rnd(), z: rnd(), ph: rnd() * 6.28, big: rnd() > 0.985 });
}
// vy: screen heights per second (negative = up). beam: {x,y,ang,len,spread} lit region
export function snow(c, T, o = {}) {
  if (HOOK.flakes) return HOOK.flakes(c, T, o);
  const vy = o.vy ?? -0.012, vx = o.vx ?? 0.004, amt = o.amt ?? 1, jit = o.jitter || 0;
  const n = Math.floor(SNOW.length * amt);
  for (let i = 0; i < n; i++) {
    const p = SNOW[i], z = 0.3 + p.z * 0.7;
    let x = ((p.x + T * vx * z + Math.sin(T * 0.3 + p.ph) * 0.004) % 1 + 1) % 1;
    let y = ((p.y + T * vy * z) % 1 + 1) % 1;
    let px = x * (W + 200) - 100, py = y * (H + 200) - 100;
    if (jit) { px += Math.sin(i * 13.1 + T * 90) * jit * 6 * z; py += Math.cos(i * 7.7 + T * 80) * jit * 6 * z; }
    let a = (0.08 + 0.35 * z) * (o.base ?? 0.6);
    if (o.beam) { const lit = beamLit(o.beam, px, py); a += lit * 0.9 * z; }
    if (a < 0.02) continue;
    const s = (p.big ? 14 : 3 + 6 * z * z) * (o.size || 1);
    c.globalAlpha = Math.min(1, a);
    c.drawImage(p.big ? SPR.dotBig : SPR.dot, px - s, py - s, s * 2, s * 2);
  }
  c.globalAlpha = 1;
}
export function beamLit(bm, px, py) {
  const dx = px - bm.x, dy = py - bm.y, d = Math.hypot(dx, dy);
  if (d > bm.len) return 0;
  const a = Math.atan2(dy, dx) - bm.ang, ad = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
  const half = bm.spread;
  if (ad > half) return 0;
  return (1 - ad / half) * (1 - d / bm.len);
}
export function drawBeam(c, bm, I = 1) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = I;
  c.translate(bm.x, bm.y); c.rotate(bm.ang);
  const sc = bm.len / 1360, sy = Math.tan(bm.spread) * bm.len / 290;
  c.scale(sc, sy); c.drawImage(SPR.beam, -40, -350); c.restore();
  if (HOOK.beamHaze) HOOK.beamHaze(c, bm, HOOK.T, I);
}

// ---------------- HUD
export function depthTemp(d) {
  if (d < 100) return 4.5 - d * 0.01;
  if (d < 500) return lerp(3.5, 2.0, (d - 100) / 400);
  if (d < 1000) return lerp(2.0, 1.5, (d - 500) / 500);
  return lerp(1.5, 1.2, Math.min(1, (d - 1000) / 1000));
}
const fmt = n => Math.round(n).toLocaleString('en-US');
export function hud(c, depth, T, alpha = 1) {
  const x = 110, y = 130;
  c.save(); c.globalAlpha = alpha; c.letterSpacing = '4px';
  c.font = '500 22px "JetBrains Mono"'; c.fillStyle = 'rgba(150,220,235,.75)'; c.fillText('DEPTH', x, y);
  c.font = '700 64px "JetBrains Mono"'; c.fillStyle = 'rgba(225,250,255,.95)';
  c.shadowColor = 'rgba(120,220,255,.55)'; c.shadowBlur = 16; c.fillText(fmt(depth) + ' M', x, y + 66); c.shadowBlur = 0;
  c.font = '500 22px "JetBrains Mono"'; c.fillStyle = 'rgba(150,220,235,.75)';
  c.fillText(`${depthTemp(depth) >= 0 ? '+' : ''}${depthTemp(depth).toFixed(1)} °C   ·   ${fmt(depth / 10.06 + 1)} ATM`, x, y + 108);
  c.strokeStyle = 'rgba(150,220,235,.45)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x, y + 126); c.lineTo(x + 380, y + 126); c.stroke();
  const off = (depth * 0.7) % 19;
  for (let i = 0; i <= 20; i++) { const xx = x + i * 19 - off; if (xx < x) continue; c.beginPath(); c.moveTo(xx, y + 126); c.lineTo(xx, y + 126 + ((i + Math.floor(depth * 0.7 / 19)) % 5 ? 6 : 14)); c.stroke(); }
  if (Math.floor(T * 1.2) % 2 === 0) { c.fillStyle = '#ff3b30'; c.shadowColor = '#ff3b30'; c.shadowBlur = 12; c.beginPath(); c.arc(W - 150, y - 8, 9, 0, 7); c.fill(); c.shadowBlur = 0; }
  c.font = '600 22px "JetBrains Mono"'; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText('REC', W - 130, y);
  c.font = '500 18px "JetBrains Mono"'; c.fillStyle = 'rgba(150,220,235,.55)';
  const s = Math.floor(T), tc = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(Math.floor((T % 1) * 24)).padStart(2, '0')}`;
  c.fillText(tc, W - 280, y + 40);
  c.restore();
}

// ---------------- text
export function bigText(c, lines, u, o = {}) {
  // u = local time in seconds since slam start
  const size = o.size || 120, cx = o.x ?? W / 2, cy = o.y ?? H / 2;
  const a = clamp(u / 0.12) * (o.fadeOut ? 1 - clamp((u - o.fadeOut) / 0.3) : 1);
  if (a <= 0) return;
  const sc = 1 + 0.35 * (1 - easeOutBack(clamp(u / 0.35))) + 0.03 * u;
  c.save(); c.globalAlpha = a; c.translate(cx, cy); c.scale(sc, sc);
  c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.letterSpacing = '2px';
  c.font = `900 ${size}px "Inter Display", "Inter"`; c.letterSpacing = '2px';
  const mw = Math.max(...lines.map(l => c.measureText(l).width)), fit = Math.min(1, (W - 260) / mw);
  c.scale(fit, fit);
  const lh = size * 1.02, y0 = -(lines.length - 1) * lh / 2;
  lines.forEach((l, i) => {
    const accent = o.accentAll || (lines.length > 1 && i === lines.length - 1) ? (o.accent || '#ff4a3d') : '#ffffff';
    const sz = i === 0 && o.firstSize ? o.firstSize : size;
    c.font = `900 ${sz}px "Inter Display", "Inter"`;
    c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 40; c.fillStyle = accent;
    if (accent !== '#ffffff') { c.shadowColor = accent === '#ff4a3d' ? 'rgba(255,60,40,.55)' : 'rgba(80,200,255,.5)'; }
    c.fillText(l, 0, y0 + i * lh);
  });
  c.restore();
}
export function label(c, txt, x, y, o = {}) {
  c.save(); c.font = o.font || '600 26px "JetBrains Mono"'; c.letterSpacing = o.ls || '3px';
  c.textAlign = o.align || 'center'; c.fillStyle = o.color || 'rgba(190,232,245,.92)';
  c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 12; c.globalAlpha = o.a ?? 1; c.fillText(txt, x, y); c.restore();
}
export function typeText(c, txt, u, x, y, o = {}) {
  const n = Math.floor(clamp(u / (o.dur || 1.2)) * txt.length);
  label(c, txt.slice(0, n) + (n < txt.length && Math.floor(u * 6) % 2 ? '▍' : ''), x, y, o);
}

// ---------------- grade
export function finish(c, T, o = {}) {
  c.drawImage(SPR.vignette, 0, 0);
  c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = o.grain ?? 0.07;
  c.drawImage(SPR.grain[Math.floor(T * 24) % 6], 0, 0, W, H); c.restore();
  if (o.letterbox !== false) { c.fillStyle = '#000'; c.fillRect(0, 0, W, 54); c.fillRect(0, H - 54, W, 54); }
}
