// Reusable drawings: skin texture, the eye, hooks, beak, silhouettes for comparisons.
import { W, H, mk, rnd, R, setSeed, lerp, clamp, SPR } from './core.js';

// ---------------------------------------------------------------- skin (precomputed)
export const TEX = {};
export function initTextures() {
  setSeed(3);
  const [s, x] = mk(2600, 1600);
  const g = x.createRadialGradient(1300, 800, 100, 1300, 800, 1500);
  g.addColorStop(0, '#7a1a11'); g.addColorStop(0.6, '#4a0c08'); g.addColorStop(1, '#2a0504');
  x.fillStyle = g; x.fillRect(0, 0, 2600, 1600);
  for (let i = 0; i < 400; i++) {
    const px = R(0, 2600), py = R(0, 1600), r = R(40, 180);
    const gg = x.createRadialGradient(px, py, 0, px, py, r); const col = rnd() > 0.5 ? '160,45,25' : '30,3,3';
    gg.addColorStop(0, `rgba(${col},${R(.15, .35)})`); gg.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gg; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  for (let i = 0; i < 60000; i++) {
    const px = R(0, 2600), py = R(0, 1600), r = R(1.2, 6) * (rnd() > 0.97 ? 2 : 1);
    x.beginPath(); x.arc(px, py, r, 0, 7);
    x.fillStyle = rnd() > 0.38 ? `rgba(28,2,4,${R(.2, .55)})` : `rgba(235,100,60,${R(.1, .35)})`; x.fill();
  }
  // wet highlights
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(255,210,190,${R(.03, .1)})`; x.fillRect(R(0, 2600), R(0, 1600), R(6, 40), R(1, 2)); }
  TEX.skin = s;
  // iris
  const [ir, ix] = mk(600, 600);
  for (let i = 0; i < 900; i++) {
    const a = R(0, 6.283), r0 = R(150, 175), r1 = R(215, 290);
    ix.beginPath(); ix.moveTo(300 + Math.cos(a) * r0, 300 + Math.sin(a) * r0); ix.lineTo(300 + Math.cos(a) * r1, 300 + Math.sin(a) * r1);
    ix.strokeStyle = rnd() > 0.5 ? `rgba(140,205,220,${R(.06, .26)})` : `rgba(205,165,95,${R(.04, .16)})`; ix.lineWidth = R(1, 3.5); ix.stroke();
  }
  TEX.iris = ir;
}

// ---------------------------------------------------------------- THE EYE
// o: zoom (1 = eye radius 300px), pupil (0.4..1), look [dx,dy], light (0..1), reflect, photophores, wake, cx, cy
export function drawEye(c, T, o) {
  const cx = (o.cx ?? 1180) + Math.sin(T * 0.4) * 6, cy = (o.cy ?? 540) + Math.cos(T * 0.33) * 5;
  const r = 300 * o.zoom, light = o.light ?? 1;
  c.save();
  // skin
  const skinR = o.skinR ?? r * 3.2;
  c.save(); c.beginPath(); c.ellipse(cx, cy, skinR, skinR * 0.85, 0, 0, 7); c.clip();
  c.translate(cx, cy); c.rotate(-0.12); const ss = Math.max(0.9 * o.zoom + 0.3, skinR * 2.4 / 1600);
  c.globalAlpha = light; c.drawImage(TEX.skin, -1300 * ss, -800 * ss, 2600 * ss, 1600 * ss); c.restore();
  if (!o.skinR) { const mg = c.createRadialGradient(cx, cy, r * 1.3, cx, cy, skinR); mg.addColorStop(0, 'rgba(1,6,10,0)'); mg.addColorStop(1, o.bg || 'rgba(4,14,20,1)'); c.fillStyle = mg; c.beginPath(); c.ellipse(cx, cy, skinR + 2, skinR * 0.85 + 2, 0, 0, 7); c.fill(); }
  // skin folds
  for (let k = 0; k < 7; k++) {
    c.beginPath(); c.ellipse(cx, cy, r * 1.25 + k * r * 0.2, r * 1.12 + k * r * 0.18, -0.2, 3.6, 6.0);
    c.strokeStyle = `rgba(15,0,0,${0.4 - k * 0.05})`; c.lineWidth = (14 - k) * o.zoom; c.stroke();
    c.beginPath(); c.ellipse(cx, cy - 6, r * 1.25 + k * r * 0.2, r * 1.12 + k * r * 0.18, -0.2, 3.7, 5.6);
    c.strokeStyle = `rgba(255,140,100,${(0.12 - k * 0.014) * light})`; c.lineWidth = 3; c.stroke();
  }
  // lid
  const lid = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.25);
  lid.addColorStop(0, '#0e0202'); lid.addColorStop(0.6, '#3e0a07'); lid.addColorStop(1, 'rgba(70,15,10,0)');
  c.beginPath(); c.arc(cx, cy, r * 1.25, 0, 7); c.fillStyle = lid; c.fill();
  // eyeball
  const eb = c.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 5, cx, cy, r);
  eb.addColorStop(0, `rgb(${62 * light | 0},${94 * light | 0},${108 * light | 0})`); eb.addColorStop(0.5, '#132028'); eb.addColorStop(1, '#020508');
  c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = eb; c.fill();
  const lx = cx + (o.look?.[0] || 0) * r * 0.25, ly = cy + (o.look?.[1] || 0) * r * 0.25;
  c.save(); c.beginPath(); c.arc(cx, cy, r * 0.94, 0, 7); c.clip();
  c.globalAlpha = 0.85 * light + 0.15; c.drawImage(TEX.iris, lx - r, ly - r, r * 2, r * 2); c.globalAlpha = 1;
  // tapetum glow
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22;
  c.drawImage(SPR.teal, lx - r * 0.85, ly - r * 0.85, r * 1.7, r * 1.7); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  const pr = r * 0.52 * o.pupil;
  c.beginPath(); c.ellipse(lx, ly, pr, pr * 0.94, 0.1, 0, 7); c.fillStyle = '#010203'; c.fill();
  c.beginPath(); c.ellipse(lx, ly, pr + 2, pr * 0.94 + 2, 0.1, 0, 7); c.strokeStyle = 'rgba(90,220,230,.45)'; c.lineWidth = 3; c.stroke();
  // wake reflections: glowing plankton in the pupil
  if (o.wake) {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const a = i * 2.4 + T * 0.2, rr = pr * (0.2 + 0.7 * ((i * 0.37) % 1));
      const s = 10 + 16 * ((i * 0.53) % 1);
      c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(T * 3 + i)) * o.wake;
      c.drawImage(SPR.teal, lx + Math.cos(a) * rr * 0.9 - s, ly + Math.sin(a) * rr * 0.4 + pr * 0.25 - s, s * 2, s * 2);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  // reflections of the lamp
  c.globalCompositeOperation = 'lighter';
  c.beginPath(); c.ellipse(cx - r * 0.32, cy - r * 0.36, r * 0.2, r * 0.1, -0.7, 0, 7); c.fillStyle = `rgba(255,255,255,${0.65 * light})`; c.fill();
  c.beginPath(); c.ellipse(cx - r * 0.33, cy - r * 0.37, r * 0.09, r * 0.045, -0.7, 0, 7); c.fillStyle = '#fff'; c.fill();
  if (o.reflect) {
    // tiny sub with its lamp
    const sx = lx - pr * 0.25, sy = ly + pr * 0.25, sr = Math.max(4, pr * 0.06);
    c.drawImage(SPR.warm, sx - sr * 6, sy - sr * 6, sr * 12, sr * 12);
    c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fillStyle = '#fff'; c.fill();
  }
  c.globalCompositeOperation = 'source-over';
  c.restore();
  // photophores
  if (o.photophores) {
    const pts = [[-0.6, 0.85, 34], [-0.2, 1.0, 26], [0.3, 0.98, 30], [0.7, 0.78, 22]];
    c.globalCompositeOperation = 'lighter';
    pts.forEach(([px, py, s], i) => {
      const k = (0.45 + 0.55 * Math.abs(Math.sin(T * 2 + i))) * Math.min(1, o.photophores);
      const S = s * o.zoom * (o.photophores > 1 ? 5 : 3);
      c.globalAlpha = k; c.drawImage(SPR.blue, cx + px * r - S, cy + py * r - S, S * 2, S * 2);
    });
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}

// ---------------------------------------------------------------- tentacle club with swiveling hooks
export function drawClub(c, cx, cy, sc, T, o = {}) {
  c.save(); c.translate(cx, cy); c.scale(sc, sc); c.rotate(o.rot || -0.15);
  // club body
  const g = c.createLinearGradient(0, -120, 0, 120);
  g.addColorStop(0, '#c4502e'); g.addColorStop(0.45, '#7a1a10'); g.addColorStop(1, '#2a0503');
  c.beginPath(); c.moveTo(-900, -40); c.bezierCurveTo(-300, -60, -100, -130, 200, -120); c.bezierCurveTo(500, -110, 760, -60, 860, 0);
  c.bezierCurveTo(760, 60, 500, 110, 200, 120); c.bezierCurveTo(-100, 130, -300, 60, -900, 40); c.closePath(); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.globalAlpha = 0.6; c.drawImage(TEX.skin, -900, -400, 1800, 800); c.restore();
  // hooks rows
  for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
    const hx = -150 + i * 105 + row * 50, hy = row ? 30 : -45, sz = (1 - Math.abs(i - 4) / 7) * (row ? 0.9 : 1);
    const ang = (o.rotate ? Math.sin(T * 2.2 + i * 0.7) * 0.9 : 0) + (o.pull ? -o.pull * 1.2 : 0);
    // socket
    c.beginPath(); c.ellipse(hx, hy, 26 * sz, 16 * sz, 0, 0, 7); c.fillStyle = '#3a0705'; c.fill();
    c.save(); c.translate(hx, hy); c.rotate(ang);
    const hg = c.createLinearGradient(-10, -80, 20, 0); hg.addColorStop(0, '#fff8ea'); hg.addColorStop(1, '#bba58a');
    c.beginPath(); c.moveTo(-12 * sz, 0); c.quadraticCurveTo(-10 * sz, -70 * sz, 22 * sz, -86 * sz);
    c.quadraticCurveTo(6 * sz, -60 * sz, 12 * sz, 0); c.closePath(); c.fillStyle = hg; c.fill();
    c.strokeStyle = 'rgba(80,40,20,.5)'; c.lineWidth = 1.5; c.stroke();
    c.restore();
  }
  c.restore();
}

// ---------------------------------------------------------------- beak (open 0..1)
export function drawBeak(c, cx, cy, sc, open, o = {}) {
  c.save(); c.translate(cx, cy); c.scale(sc, sc);
  if (!o.bare) {
    const fg = c.createRadialGradient(0, 0, 80, 0, 0, 360);
    fg.addColorStop(0, 'rgba(70,16,11,.95)'); fg.addColorStop(0.6, 'rgba(40,8,6,.7)'); fg.addColorStop(1, 'rgba(20,4,3,0)');
    c.fillStyle = fg; c.beginPath(); c.arc(0, 0, 360, 0, 7); c.fill();
  }
  c.translate(-150, -20);
  const shade = (x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(90,60,35,.55)'); g.addColorStop(0.3, '#20140b'); g.addColorStop(1, '#020101'); return g; };
  // lower mandible (smaller, tucked under)
  c.save(); c.translate(10, 30); c.rotate(open * 0.38);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(120, 8, 205, 22); c.quadraticCurveTo(238, 26, 246, 4);
  c.quadraticCurveTo(250, 70, 190, 110); c.quadraticCurveTo(90, 150, 0, 90); c.closePath(); c.fillStyle = shade(0, 250); c.fill();
  c.strokeStyle = 'rgba(255,230,200,.22)'; c.lineWidth = 5; c.beginPath(); c.moveTo(30, 95); c.quadraticCurveTo(120, 135, 195, 100); c.stroke();
  c.restore();
  // upper mandible: big, with a hooked tip curling down
  c.save(); c.rotate(-open * 0.3);
  c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(10, -70, 200, -120, 300, -40);
  c.quadraticCurveTo(338, 40, 280, 130); c.quadraticCurveTo(262, 60, 220, 34); c.quadraticCurveTo(120, 22, 0, 20); c.closePath();
  c.fillStyle = shade(0, 330); c.fill();
  c.strokeStyle = 'rgba(255,235,210,.3)'; c.lineWidth = 6; c.beginPath(); c.moveTo(60, -45); c.bezierCurveTo(140, -95, 250, -90, 298, -40); c.stroke();
  c.restore();
  c.restore();
}

// ---------------------------------------------------------------- silhouettes (height in px, drawn standing on baseline at x,y)
const SIL = 'rgba(160,215,232,0.92)';
export function silhouette(c, kind, x, y, h, col = SIL) {
  c.save(); c.translate(x, y); c.fillStyle = col; const s = h / 100; c.scale(s, s);
  const P = (pts) => { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fill(); };
  const E = (ax, ay, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(ax, ay, rx, ry, rot, 0, 7); c.fill(); };
  switch (kind) {
    case 'man': E(0, -93, 7, 7); P([[-10, -84], [10, -84], [12, -48], [7, -47], [6, 0], [1, 0], [0, -42], [-1, 0], [-6, 0], [-7, -47], [-12, -48]]); c.fillRect(-16, -83, 5, 36); c.fillRect(11, -83, 5, 36); break;
    case 'car': P([[-110, -12], [-104, -32], [-60, -36], [-34, -62], [40, -62], [70, -36], [106, -30], [112, -12]]); c.fillStyle = '#071219'; E(-62, -10, 17, 17); E(64, -10, 17, 17); break;
    case 'elephant':
      E(-5, -62, 62, 38); E(58, -78, 26, 28); P([[72, -70], [92, -40], [98, -6], [88, -4], [82, -36], [68, -50]]);
      E(40, -80, 22, 30, -0.2);
      c.fillRect(-52, -40, 18, 40); c.fillRect(-24, -40, 18, 40); c.fillRect(14, -40, 18, 40); c.fillRect(36, -44, 16, 44); P([[-66, -70], [-80, -40], [-77, -38], [-63, -62]]); break;
    case 'piano':
      P([[-90, -62], [40, -62], [80, -70], [96, -56], [90, -40], [-90, -40]]); c.fillRect(-84, -40, 8, 40); c.fillRect(70, -40, 8, 40); c.fillRect(-10, -40, 8, 40);
      P([[-86, -62], [-60, -100], [-56, -98], [-80, -62]]); break;
    case 'bear':
      E(0, -52, 58, 30); E(64, -62, 20, 16); E(80, -58, 12, 9); E(58, -76, 5, 5);
      c.fillRect(-46, -40, 18, 40); c.fillRect(-18, -36, 16, 36); c.fillRect(22, -36, 16, 36); c.fillRect(40, -40, 16, 40); break;
    case 'horse':
      E(0, -62, 52, 22); P([[40, -72], [64, -112], [82, -112], [90, -100], [72, -92], [58, -62]]); E(78, -104, 14, 8, 0.4);
      c.fillRect(-44, -48, 9, 48); c.fillRect(-30, -48, 9, 48); c.fillRect(28, -48, 9, 48); c.fillRect(40, -48, 9, 48);
      P([[-50, -70], [-74, -30], [-68, -28], [-46, -62]]); break;
    case 'bull':
      E(0, -60, 60, 28); E(64, -60, 20, 18); P([[70, -76], [86, -96], [80, -74]]); c.fillRect(-48, -40, 13, 40); c.fillRect(-30, -40, 13, 40); c.fillRect(30, -40, 13, 40); c.fillRect(46, -40, 13, 40); break;
    case 'bus':
      P([[-120, -10], [-120, -88], [116, -88], [122, -70], [122, -10]]); c.fillStyle = 'rgba(7,18,25,.85)';
      for (let i = 0; i < 8; i++) c.fillRect(-110 + i * 28, -80, 22, 26); E(-80, -10, 13, 13); E(84, -10, 13, 13); break;
    case 'house': {
      // h corresponds to building height; draw floors count from data
      break;
    }
    case 'squid':
      E(30, -50, 50, 22); E(-24, -50, 14, 14); for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-34, -50); c.quadraticCurveTo(-80, -50 + (i - 2.5) * 10, -120, -50 + (i - 2.5) * 16); c.lineWidth = 4; c.strokeStyle = col; c.stroke(); } break;
  }
  c.restore();
}

export function building(c, x, y, floors, hPerFloor, w, col = SIL) {
  c.save(); c.fillStyle = col;
  c.fillRect(x - w / 2, y - floors * hPerFloor, w, floors * hPerFloor);
  c.fillStyle = 'rgba(6,16,22,.85)';
  for (let f = 0; f < floors; f++) for (let k = 0; k < 4; k++) c.fillRect(x - w / 2 + 8 + k * (w - 16) / 4 + 4, y - (f + 1) * hPerFloor + hPerFloor * 0.25, (w - 16) / 4 - 8, hPerFloor * 0.45);
  c.restore();
}

// ---------------------------------------------------------------- whale silhouette (side, facing left), length L px
export function whaleSil(c, x, y, L, col = '#1b252c', o = {}) {
  c.save(); c.translate(x, y); const s = L / 1000; c.scale(s, s); c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, -40); c.bezierCurveTo(0, -95, 30, -110, 120, -112); c.bezierCurveTo(260, -114, 330, -110, 380, -100);
  c.bezierCurveTo(560, -80, 720, -50, 860, -20); c.lineTo(930, -8); c.bezierCurveTo(960, -40, 990, -60, 1010, -55);
  c.lineTo(980, 0); c.lineTo(1010, 55); c.bezierCurveTo(990, 60, 960, 40, 930, 8); c.lineTo(860, 20);
  c.bezierCurveTo(700, 60, 520, 85, 360, 92); c.bezierCurveTo(220, 96, 120, 80, 60, 70);
  c.bezierCurveTo(20, 62, 0, 30, 0, -40); c.fill();
  // jaw line
  c.strokeStyle = o.edge || 'rgba(255,255,255,.12)'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(40, 62); c.quadraticCurveTo(160, 82, 300, 80); c.stroke();
  c.restore();
}

export function squidSil(c, x, y, L, col = '#7a1a10', o = {}) {
  c.save(); c.translate(x, y); const s = L / 1000; c.scale(s, s); c.fillStyle = col; c.strokeStyle = col;
  c.beginPath(); c.ellipse(700, 0, 300, 95 * (o.fat || 1), 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(900, 0); c.lineTo(1000, -90); c.lineTo(1010, 0); c.lineTo(1000, 90); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(380, 0, 60, 55, 0, 0, 7); c.fill();
  for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(340, (i - 3.5) * 10); c.quadraticCurveTo(150, (i - 3.5) * 22, 0 + (i % 3) * 30, (i - 3.5) * 30); c.lineWidth = 18 - Math.abs(i - 3.5) * 2; c.lineCap = 'round'; c.stroke(); }
  if (o.tent) for (const k of [-1, 1]) { c.beginPath(); c.moveTo(340, k * 8); c.quadraticCurveTo(0, k * 30, -o.tent, k * 40); c.lineWidth = 8; c.stroke(); c.beginPath(); c.ellipse(-o.tent, k * 40, 40, 14, 0, 0, 7); c.fill(); }
  c.restore();
}

// ---------------------------------------------------------------- the research sphere (third-person)
export function sub(c, x, y, r, T, o = {}) {
  c.save();
  if (o.glow) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.2 * Math.sin(T * 3); c.drawImage(SPR.warm, x - r * 4, y - r * 4, r * 8, r * 8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#e9d9a6'); g.addColorStop(0.5, '#a88f52'); g.addColorStop(1, '#2c2412');
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = g; c.fill();
  c.beginPath(); c.arc(x - r * 0.25, y + r * 0.05, r * 0.32, 0, 7); c.fillStyle = '#0d2733'; c.fill();
  c.beginPath(); c.arc(x - r * 0.25, y + r * 0.05, r * 0.32, 0, 7); c.strokeStyle = '#40391f'; c.lineWidth = r * 0.07; c.stroke();
  c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.warm, x - r * 0.25 - r * 0.5, y - r * 0.5, r, r); c.globalCompositeOperation = 'source-over';
  // cable
  c.strokeStyle = 'rgba(200,200,190,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + (o.cableX || 0), -50); c.stroke();
  c.restore();
}
