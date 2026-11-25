// Underwater look: tinted water column, drifting murk, marine-snow flakes, critters, refraction wobble.
import { W, H, mk, clamp, lerp, hash, SPR } from './core.js';

export const WT = {};
function fractal(w, h, seed, tint, gamma = 1.6, amp = 1) {
  const [c, x] = mk(w, h); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647, (s - 1) / 2147483646);
  [[6, 4, 1], [12, 7, 0.55], [24, 14, 0.3], [48, 28, 0.16], [96, 56, 0.08]].forEach(([gw, gh, a]) => {
    const [g, gx] = mk(gw, gh); const id = gx.createImageData(gw, gh);
    for (let i = 0; i < gw * gh; i++) { const v = r() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    gx.putImageData(id, 0, 0);
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * 0.5; x.drawImage(g, 0, 0, w, h);
  });
  const id = x.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.pow(clamp(d[i] / 255 * 1.15 - 0.12), gamma) * amp;
    d[i] = tint[0]; d[i + 1] = tint[1]; d[i + 2] = tint[2]; d[i + 3] = v * 255;
  }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.putImageData(id, 0, 0);
  return c;
}
function flake(size, seed, blur) {
  const [c, x] = mk(size, size); let s = seed;
  const r = () => (s = (s * 16807) % 2147483647, (s - 1) / 2147483646);
  if (blur) x.filter = `blur(${blur}px)`;
  const n = 3 + Math.floor(r() * 4), cx = size / 2;
  for (let i = 0; i < n; i++) {
    x.beginPath(); x.ellipse(cx + (r() - 0.5) * size * 0.3, cx + (r() - 0.5) * size * 0.3, size * (0.06 + r() * 0.14), size * (0.03 + r() * 0.08), r() * 3, 0, 7);
    x.fillStyle = `rgba(215,238,232,${0.35 + r() * 0.5})`; x.fill();
  }
  // fibrous strands
  x.strokeStyle = 'rgba(215,238,232,.35)'; x.lineWidth = Math.max(1, size * 0.02);
  for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx, cx); x.lineTo(cx + (r() - 0.5) * size * 0.7, cx + (r() - 0.5) * size * 0.7); x.stroke(); }
  return c;
}
export function initWater() {
  WT.murk = [fractal(2600, 1600, 11, [40, 120, 125], 1.7, 0.55), fractal(2600, 1600, 29, [20, 80, 95], 1.4, 0.5), fractal(2600, 1600, 57, [70, 150, 150], 2.2, 0.35)];
  WT.flakes = Array.from({ length: 10 }, (_, i) => flake(64, 101 + i * 13, 0));
  WT.bokeh = Array.from({ length: 6 }, (_, i) => flake(160, 401 + i * 17, 9));
  // beam scatter texture (streaky)
  WT.scatter = fractal(1400, 700, 77, [190, 240, 230], 1.2, 0.8);
}

// depth 0..2000 -> base colors
function cols(depth) {
  const k = clamp(depth / 2000);
  const top = [lerp(16, 6, k), lerp(70, 30, k), lerp(85, 38, k)], bot = [lerp(2, 0, k), lerp(16, 8, k), lerp(22, 11, k)];
  return { top: `rgb(${top.map(Math.round)})`, bot: `rgb(${bot.map(Math.round)})` };
}
export function water(c, T, o = {}) {
  const { top, bot } = cols(o.depth ?? 2000);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(0.55, bot); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // faint downwelling glow from above (water, not space)
  const rg = c.createRadialGradient(W * 0.5, -200, 50, W * 0.5, -200, 1300);
  rg.addColorStop(0, `rgba(60,150,160,${0.22 * (o.glow ?? 1)})`); rg.addColorStop(1, 'rgba(60,150,160,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
  murk(c, T, o.murk ?? 1);
}
export function murk(c, T, a = 1) {
  c.save(); c.globalCompositeOperation = 'screen';
  WT.murk.forEach((m, i) => {
    const sp = [0.012, 0.02, 0.03][i];
    const x = -300 + Math.sin(T * sp + i * 2) * 260 - ((T * sp * 600) % 300), y = -250 + Math.cos(T * sp * 0.8 + i) * 160;
    c.globalAlpha = a * [0.55, 0.45, 0.3][i]; c.drawImage(m, x, y);
  });
  c.restore();
}
// marine snow: irregular flakes, drifting with current, near ones out of focus
const PS = [];
export function initFlakes() { for (let i = 0; i < 520; i++) PS.push({ x: hash(i * 3.1), y: hash(i * 7.3), z: hash(i * 1.7), ph: hash(i * 5.9) * 6.28, v: Math.floor(hash(i * 9.1) * 10) }); }
export function flakes(c, T, o = {}) {
  const vy = o.vy ?? 0.004, vx = o.vx ?? 0.008, amt = o.amt ?? 1, jit = o.jitter || 0;
  const n = Math.floor(PS.length * amt);
  for (let i = 0; i < n; i++) {
    const p = PS[i], z = p.z;
    const par = 0.35 + z * 0.9;
    let x = (((p.x + T * vx * par + Math.sin(T * 0.25 + p.ph) * 0.01 * par) % 1) + 1) % 1;
    let y = (((p.y + T * vy * par + Math.sin(T * 0.4 + p.ph * 2) * 0.004) % 1) + 1) % 1;
    let px = x * (W + 300) - 150, py = y * (H + 300) - 150;
    if (jit) { px += Math.sin(i * 13.1 + T * 90) * jit * 6 * par; py += Math.cos(i * 7.7 + T * 80) * jit * 6 * par; }
    let a = 0.12 + 0.35 * z;
    if (o.beam) a += beamLight(o.beam, px, py) * (0.7 + z);
    a *= o.base ?? 1;
    if (a < 0.03) continue;
    const near = z > 0.965;
    const s = near ? 34 + (z - 0.965) * 1200 : (4 + 16 * z * z) * (o.size || 1);
    c.save(); c.globalAlpha = Math.min(near ? 0.3 : 1, a); c.translate(px, py); c.rotate(p.ph + T * 0.2 * (p.v % 2 ? 1 : -1));
    c.drawImage(near ? WT.bokeh[p.v % 6] : WT.flakes[p.v], -s, -s, s * 2, s * 2); c.restore();
  }
}
function beamLight(bm, px, py) {
  const dx = px - bm.x, dy = py - bm.y, d = Math.hypot(dx, dy);
  if (d > bm.len) return 0;
  const a = Math.atan2(dy, dx) - bm.ang, ad = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
  if (ad > bm.spread) return 0;
  return (1 - ad / bm.spread) * (1 - d / bm.len);
}
// volumetric scatter inside the beam
export function beamHaze(c, bm, T, I = 1) {
  c.save(); c.beginPath(); c.moveTo(bm.x, bm.y);
  c.arc(bm.x, bm.y, bm.len, bm.ang - bm.spread, bm.ang + bm.spread); c.closePath(); c.clip();
  c.globalCompositeOperation = 'lighter';
  c.translate(bm.x, bm.y); c.rotate(bm.ang);
  const g = c.createLinearGradient(0, 0, bm.len, 0); g.addColorStop(0, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.35 * I; c.drawImage(WT.scatter, -100 - ((T * 25) % 200), -350 + Math.sin(T * 0.3) * 40, bm.len + 300, 700);
  c.restore();
}
// small life drifting through the water
export function critters(c, T, amt = 1) {
  c.save();
  for (let i = 0; i < Math.round(6 * amt); i++) {
    const sp = 0.01 + hash(i + 40) * 0.015;
    const x = ((hash(i + 41) + T * sp) % 1.2) * W - 100, y = H * (0.15 + 0.7 * hash(i + 42)) + Math.sin(T * 0.5 + i) * 30;
    if (i % 3 === 0) { // tiny jelly
      const s = 10 + 14 * hash(i + 43), pulse = 1 + 0.15 * Math.sin(T * 3 + i);
      c.globalAlpha = 0.35; c.fillStyle = 'rgba(170,225,235,.5)'; c.beginPath(); c.ellipse(x, y, s * pulse, s * 0.7 / pulse, 0, Math.PI, 0); c.fill();
      c.strokeStyle = 'rgba(170,225,235,.35)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - s * 0.6 + k * s * 0.4, y); c.quadraticCurveTo(x - s * 0.6 + k * s * 0.4 + Math.sin(T * 2 + k) * 4, y + s, x - s * 0.6 + k * s * 0.4, y + s * 2.2); c.stroke(); }
    } else { // copepod: jerky little shrimp
      const jerk = Math.max(0, Math.sin(T * 1.3 + i * 2)) ** 20 * 30;
      const s = 4 + 4 * hash(i + 44);
      c.globalAlpha = 0.45; c.fillStyle = 'rgba(220,170,140,.8)'; c.beginPath(); c.ellipse(x + jerk, y, s * 1.6, s * 0.6, 0.2, 0, 7); c.fill();
      c.strokeStyle = 'rgba(220,190,170,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + jerk - s, y); c.lineTo(x + jerk - s * 4, y - s * 2); c.moveTo(x + jerk - s, y); c.lineTo(x + jerk - s * 4, y + s * 1.5); c.stroke();
    }
  }
  // bioluminescent blinks
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14 * amt; i++) {
    const k = Math.sin(T * (0.7 + hash(i + 60)) + i * 4); if (k < 0.92) continue;
    const s = 10 + 16 * hash(i + 61); c.globalAlpha = (k - 0.92) * 12;
    c.drawImage(i % 2 ? SPR.blue : SPR.teal, hash(i + 62) * W - s, hash(i + 63) * H - s, s * 2, s * 2);
  }
  c.restore();
}
// refraction wobble (post-process on the finished frame)
let TMP;
export function wobble(c, T, amp = 1.6) {
  if (!TMP) TMP = mk(W, H);
  const [t, tx] = TMP; tx.clearRect(0, 0, W, H); tx.drawImage(c.canvas, 0, 0);
  for (let y = 0; y < H; y += 6) {
    const dx = Math.sin(y * 0.011 + T * 1.4) * amp + Math.sin(y * 0.027 - T * 0.9) * amp * 0.5;
    c.drawImage(t, 0, y, W, 6, dx, y, W, 6);
  }
}
