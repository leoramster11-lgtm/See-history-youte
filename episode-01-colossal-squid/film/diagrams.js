// Infographic shots (kind = p.k). Clean "documentary motion graphics" look.
import { W, H, clamp, lerp, ease, easeOut, easeOutBack, seg, hash, SPR, snow, bigText, label } from './core.js';
import { TEX, drawEye, drawClub, drawBeak, silhouette, building, whaleSil, squidSil, sub } from './shapes.js';

const CY = '#5fd0ff', RED = '#ff4a3d', SIL = 'rgba(160,215,232,.92)';
function bg(c, T) {
  const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1300); g.addColorStop(0, '#0a2230'); g.addColorStop(1, '#010509');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(95,208,255,.06)'; c.lineWidth = 1;
  const o = (T * 8) % 80;
  for (let x = -o; x < W; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = -o; y < H; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  snow(c, T, { amt: 0.3, vy: 0.004, base: 0.4 });
}
const pop = (lt, t0) => easeOutBack(clamp((lt - t0) / 0.35));
function ground(c, y) { c.strokeStyle = 'rgba(95,208,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(160, y); c.lineTo(W - 160, y); c.stroke(); }
function tag(c, txt, x, y, a = 1, col = '#fff', size = 40) { label(c, txt, x, y, { font: `800 ${size}px "Inter Display"`, ls: '1px', color: col, a }); }

export function pDiagram(c, p, u, lt, T, beat) {
  bg(c, T);
  const k = p.k, sfx = (beat.sfx || []).map(s => s[1]);
  if (k === 'sphere') {
    const r = 260, cx = W / 2, cy = H / 2 + 20, d = ease(seg(lt, 0, 1.2));
    c.save(); c.setLineDash([2000]); c.lineDashOffset = 2000 * (1 - d); c.strokeStyle = CY; c.lineWidth = 4;
    c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.beginPath(); c.arc(cx, cy, r - 24, 0, 7); c.stroke();
    c.beginPath(); c.arc(cx - 90, cy + 10, 70, 0, 7); c.stroke(); c.restore();
    silhouette(c, 'man', cx + 20, cy + 150, 230, 'rgba(160,215,232,.35)');
    const a = ease(seg(lt, 1, 1.6));
    c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - r, cy + r + 50); c.lineTo(cx + r, cy + r + 50); c.stroke();
    tag(c, '≈ 2.1 M', cx, cy + r + 100, a);
    tag(c, 'STEEL WALL', cx + r + 200, cy - 120, ease(seg(lt, 1.8, 2.3)), CY, 30);
    tag(c, '≈ A SMALL CAR CABIN', cx, 190, ease(seg(lt, 2.6, 3.1)), RED, 44);
  } else if (k === 'palm') {
    const ps = p.items === 'elephants' ? 1.05 : 1.35; c.save(); c.translate(W / 2, H * 0.92); c.scale(ps, ps); c.translate(-W / 2, -H * 0.92);
    const by = H * 0.8, cx = W / 2;
    // hand
    c.fillStyle = '#c69c84'; c.beginPath(); c.ellipse(cx, by + 30, 170, 70, 0, 0, 7); c.fill();
    for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(cx - 120 + i * 80, by - 20, 26, 60, 0, 0, 7); c.fill(); }
    const n = p.n, isEl = p.items === 'elephants';
    for (let i = 0; i < n; i++) {
      const t0 = sfx[i] ?? 0.4 + i * 0.4, drop = 1 - ease(clamp((lt - t0 + 0.25) / 0.25));
      if (lt < t0 - 0.25) continue;
      const h = isEl ? 135 : 62, y = by - 20 - i * (isEl ? 118 : 60) - drop * 400;
      silhouette(c, isEl ? 'elephant' : 'car', cx, y, h, SIL);
    }
    c.restore(); tag(c, p.label, cx, 170, ease(seg(lt, n * 0.4, n * 0.4 + 0.5)), RED, 64);
  } else if (k === 'lungs') {
    const s = lerp(1, 0.15, ease(seg(lt, 0.6, 2.6))), cx = W / 2, cy = H / 2;
    c.fillStyle = 'rgba(255,120,120,.8)';
    for (const d of [-1, 1]) { c.beginPath(); c.ellipse(cx + d * 130 * s, cy, 110 * s, 200 * s, d * 0.15, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,120,120,.5)'; c.fillRect(cx - 12 * s, cy - 280 * s, 24 * s, 120 * s);
    const g = ease(seg(lt, 2.6, 3.0));
    c.globalAlpha = g; c.fillStyle = '#f2f2ee'; c.beginPath(); c.arc(cx + 300, cy, 42, 0, 7); c.fill();
    for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc(cx + 300 + Math.cos(i) * 26, cy + Math.sin(i * 1.7) * 26, 4, 0, 7); c.fill(); }
    c.globalAlpha = 1; tag(c, 'GOLF BALL', cx + 300, cy + 90, g, CY, 30);
    tag(c, '6 LITERS → ~60 ML', W / 2, 180, ease(seg(lt, 0.3, 0.8)), RED, 56);
  } else if (k === 'timeline') {
    const y = H / 2, x0 = 220, x1 = W - 220, d = ease(seg(lt, 0, 2));
    c.strokeStyle = CY; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y); c.lineTo(lerp(x0, x1, d), y); c.stroke();
    [['1925', 0, 'DESCRIBED FROM 2 ARMS'], ['1981', 0.32, 'TRAWLER CATCH'], ['2003', 0.55, 'SUBADULT FOUND'], ['2007', 0.78, '495 KG SPECIMEN'], ['2025', 1, 'FIRST LIVE FOOTAGE']].forEach(([yr, t, s], i) => {
      if (d < t) return; const x = lerp(x0, x1, t), a = pop(lt, t * 2);
      c.fillStyle = i === 4 ? RED : '#fff'; c.beginPath(); c.arc(x, y, 12 * a, 0, 7); c.fill();
      tag(c, yr, x, y - 50, a, '#fff', 44); label(c, s, x, y + 60, { a, font: '600 18px "JetBrains Mono"' });
    });
  } else if (k === 'beaks') {
    whaleSil(c, W * 0.12, H * 0.52, 1500, '#16212a', { edge: 'rgba(95,208,255,.3)' });
    c.save(); c.beginPath(); c.ellipse(W * 0.45, H * 0.55, 260, 120, 0, 0, 7); c.strokeStyle = CY; c.setLineDash([10, 8]); c.lineWidth = 3; c.stroke(); c.restore();
    const n = Math.floor(ease(seg(lt, 0.3, 2.5)) * 70);
    for (let i = 0; i < n; i++) { c.save(); c.translate(W * 0.45 + (hash(i) - 0.5) * 420, H * 0.55 + (hash(i + 1) - 0.5) * 170); c.rotate(hash(i + 2) * 6); drawBeak(c, 0, 0, 0.09, 0.2); c.restore(); }
    tag(c, 'HUNDREDS OF BEAKS', W / 2, 190, ease(seg(lt, 0.8, 1.3)), RED, 60);
  } else if (k === 'clock') {
    const cx = W / 2, cy = H / 2, r = 260, a = ease(u) * p.hours * Math.PI * 2;
    c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
    for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.283; c.beginPath(); c.moveTo(cx + Math.cos(aa) * (r - 30), cy + Math.sin(aa) * (r - 30)); c.lineTo(cx + Math.cos(aa) * (r - 10), cy + Math.sin(aa) * (r - 10)); c.stroke(); }
    c.strokeStyle = RED; c.lineWidth = 10; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(a) * (r - 50), cy - Math.cos(a) * (r - 50)); c.stroke();
    c.lineWidth = 14; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(a / 12) * (r - 110), cy - Math.cos(a / 12) * (r - 110)); c.stroke();
    tag(c, `${(ease(u) * p.hours).toFixed(1)} HOURS`, cx, cy + r + 90, 1, RED, 60);
  } else if (k === 'compare') {
    const by = H * 0.86, whale = ['eleph8', 'house6'].includes(p.items[0]);
    const lengthMode = p.items.some(i => ['bus', 'house3', 'house6'].includes(i));
    ground(c, by);
    if (lengthMode) {
      const pxm = whale ? 36 : 56;                       // pixels per meter — true scale
      if (whale) { c.save(); c.translate(560, by); c.rotate(-Math.PI / 2); whaleSil(c, 0, 0, 18 * pxm, '#2c3d48', { edge: 'rgba(95,208,255,.4)' }); c.restore(); tag(c, 'SPERM WHALE · 18 M', 560, by - 18 * pxm - 30, 1, CY, 30); }
      else { squidSil(c, 240, by - 70, 10 * pxm, 'rgba(170,32,20,.95)', { fat: 1.6, tent: 150 }); tag(c, 'COLOSSAL SQUID · ~10 M', 240 + 5 * pxm, by - 160, 1, RED, 30); }
      p.items.forEach((it, i) => {
        const t0 = sfx[i] ?? 0.4 + i * 1.2, a = ease(clamp((lt - t0) / 0.5)); if (a <= 0) return;
        const x = whale ? 1250 : (it === 'bus' ? 1160 : 1700);
        c.save(); c.globalAlpha = a;
        if (it === 'bus') { c.save(); c.translate(x, by); c.scale(12 * pxm / 242, 12 * pxm / 242); silhouette(c, 'bus', 0, 0, 100, 'rgba(160,215,232,.5)'); c.restore(); }
        if (it === 'house3') building(c, x, by, 3, 3.3 * pxm, 4 * pxm);
        if (it === 'house6') building(c, x, by, 6, 3 * pxm, 6 * pxm);
        if (it !== 'bus') silhouette(c, 'man', whale ? x - 260 : 1500, by, 1.8 * pxm, 'rgba(255,255,255,.8)');
        c.restore();
        tag(c, p.labels[i], it === 'bus' ? x : x, it === 'bus' ? by + 60 : by - (it === 'house3' ? 10 * pxm : 18 * pxm) - 40, a, '#fff', 36);
      });
      label(c, 'TO SCALE · PERSON = 1.8 M', W - 300, H - 90, { font: '500 18px "JetBrains Mono"', a: 0.7 });
    } else {
      // weight mode:  [animal]  ≈  [items]
      if (whale) whaleSil(c, 140, by - 140, 640, '#2c3d48', { edge: 'rgba(95,208,255,.4)' });
      else squidSil(c, 170, by - 110, 640, 'rgba(170,32,20,.95)', { fat: 1.7, tent: 110 });
      tag(c, whale ? 'SPERM WHALE' : 'COLOSSAL SQUID', 470, by - 300, 1, whale ? CY : RED, 32);
      tag(c, '≈', 900, by - 120, ease(seg(lt, 0.2, 0.5)), '#fff', 120);
      const n = p.items.length;
      p.items.forEach((it, i) => {
        const t0 = sfx[i] ?? 0.4 + i * 1.2, a = pop(lt, t0); if (a <= 0) return;
        const x = n === 1 ? 1400 : 1130 + i * 290;
        c.save(); c.translate(x, by); c.scale(a, a); c.translate(-x, -by);
        if (it === 'men7') for (let m = 0; m < 7; m++) silhouette(c, 'man', x - 105 + m * 35, by, 190, SIL);
        else if (it === 'eleph8') for (let m = 0; m < 8; m++) silhouette(c, 'elephant', x - 330 + (m % 4) * 190 + (m > 3 ? 95 : 0), by - (m > 3 ? 0 : 150), 130, SIL);
        else silhouette(c, it, x, by, { piano: 150, bear: 150, horse: 190 }[it] || 160);
        c.restore();
        tag(c, p.labels[i], x, by + 55, a, '#fff', n > 1 ? 26 : 38);
      });
    }
  } else if (k === 'eyesize') {
    drawEye(c, T, { zoom: 0.62, pupil: 0.9, light: 0.9, cx: W * 0.3, cy: H / 2 });
    const items = [['DINNER PLATE · 26 CM', 'plate'], ['BASKETBALL · 24 CM', 'ball']];
    items.forEach(([t, kind], i) => {
      const a = pop(lt, sfx[i] ?? 1.8 + i * 2), x = W * (0.62 + i * 0.2), y = H / 2; if (a <= 0) return;
      c.save(); c.translate(x, y); c.scale(a, a);
      if (kind === 'plate') { c.fillStyle = '#e9edee'; c.beginPath(); c.arc(0, 0, 160, 0, 7); c.fill(); c.strokeStyle = '#b9c4c8'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 115, 0, 7); c.stroke(); }
      else { c.fillStyle = '#e07a2a'; c.beginPath(); c.arc(0, 0, 148, 0, 7); c.fill(); c.strokeStyle = '#2a1408'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 148, 0, 7); c.moveTo(-148, 0); c.lineTo(148, 0); c.moveTo(0, -148); c.lineTo(0, 148); c.stroke(); }
      c.restore(); label(c, t, x, y + 230, { a });
    });
    tag(c, 'EYE ≈ 27 CM+', W * 0.3, 170, 1, RED, 60);
  } else if (k === 'lens') {
    drawEye(c, T, { zoom: 0.9, pupil: 0.95, light: 0.5, cx: W * 0.35, cy: H / 2 });
    const a = ease(seg(lt, 0.3, 0.9));
    c.save(); c.globalAlpha = a; c.beginPath(); c.arc(W * 0.35, H / 2, 150, 0, 7); c.fillStyle = 'rgba(200,240,255,.25)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); c.restore();
    const b = pop(lt, 1.2); c.save(); c.translate(W * 0.72, H / 2); c.scale(b, b); c.fillStyle = '#f28a1c'; c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fill();
    for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(160,70,0,.3)'; c.beginPath(); c.arc((hash(i) - 0.5) * 230, (hash(i + 1) - 0.5) * 230, 3, 0, 7); c.fill(); } c.restore();
    label(c, 'LENS ≈ AN ORANGE', W * 0.72, H / 2 + 230, { a: b });
  } else if (k === 'glowwhale') {
    c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(0, 0, W, H);
    const pr = lerp(p.p[0], p.p[1], u), x = lerp(W * 1.0, W * 0.25, pr);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 1600; i++) { const px = hash(i) * W, py = H * 0.25 + hash(i + 1) * H * 0.5;
      const dx = (px - x - 600) / 750, dy = (py - H / 2) / 170; const near = Math.exp(-(dx * dx + dy * dy) * 2.2);
      const on = clamp(near * 3.5 * clamp((pr - 0.05) * 4)) * (0.65 + 0.35 * Math.sin(T * 5 + i)); if (on < 0.04) continue;
      c.globalAlpha = on; c.drawImage(SPR.teal, px - 18, py - 18, 36, 36); }
    c.restore();
    whaleSil(c, x, H / 2, 1300, '#020406', { edge: 'rgba(80,255,215,.15)' });
    if (!p.real) { drawEye(c, T, { zoom: 0.18, pupil: 0.8, light: 0.8, cx: 170, cy: H * 0.82 }); label(c, 'SQUID EYE', 170, H * 0.82 + 100, { font: '600 18px "JetBrains Mono"' }); }
  } else if (k === 'distance') {
    const y = H * 0.6, x0 = 220, x1 = W - 260, d = ease(seg(lt, 0.2, 2.6));
    drawEye(c, T, { zoom: 0.25, pupil: 0.8, light: 0.8, cx: x0, cy: y });
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([14, 10]); c.beginPath(); c.moveTo(x0 + 100, y); c.lineTo(lerp(x0 + 100, x1, d), y); c.stroke(); c.setLineDash([]);
    tag(c, `${Math.round(d * 120)} M`, lerp(x0 + 100, x1, d * 0.5), y - 40, 1, '#fff', 56);
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { c.globalAlpha = d * (0.5 + 0.5 * Math.sin(T * 4 + i)); c.drawImage(SPR.teal, x1 - 60 + hash(i) * 160, y - 80 + hash(i + 1) * 160, 24, 24); } c.restore();
    const f = ease(seg(lt, 3, 3.6)); c.globalAlpha = f; c.fillStyle = '#1d5a2a'; c.fillRect(x0 + 100, y + 80, x1 - x0 - 100, 140); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(x0 + 100, y + 80, x1 - x0 - 100, 140); c.beginPath(); c.moveTo((x0 + 100 + x1) / 2, y + 80); c.lineTo((x0 + 100 + x1) / 2, y + 220); c.stroke(); c.globalAlpha = 1;
    label(c, 'A FOOTBALL FIELD ≈ 105 M', (x0 + x1) / 2, y + 270, { a: f });
  } else if (k === 'cousins') {
    const by = H * 0.65;
    const a = pop(lt, 0.2), b = pop(lt, 0.9);
    c.save(); c.globalAlpha = a; squidSil(c, 260, by - 260, 1250, 'rgba(210,120,80,.8)', { fat: 0.65, tent: 340 }); c.restore();
    tag(c, 'GIANT SQUID · LONGER, THINNER', W / 2, by - 360, a, '#fff', 34);
    c.save(); c.globalAlpha = b; squidSil(c, 520, by + 60, 900, 'rgba(160,30,18,.95)', { fat: 1.7, tent: 120 }); c.restore();
    tag(c, 'COLOSSAL SQUID · HEAVIER', W / 2, by + 200, b, RED, 40);
    const s = ease(seg(lt, 2.6, 3)); if (s > 0) { tag(c, 'MUCH HEAVIER', W * 0.8, by + 60, s, RED, 56); }
  } else if (k === 'hookpull') {
    const pull = Math.sin(clamp(lt / 3) * Math.PI) * 1;
    drawClub(c, W / 2 - 100, H / 2 + 40, 0.9, T, { pull });
    c.fillStyle = '#8fa3ad'; c.save(); c.translate(W / 2 + 120 + pull * 160, H / 2 - 120); c.beginPath(); c.ellipse(0, 0, 160, 55, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(140, 0); c.lineTo(230, -50); c.lineTo(230, 50); c.fill(); c.restore();
    c.strokeStyle = RED; c.lineWidth = 6; c.beginPath(); c.moveTo(W / 2 + 320, H / 2 - 260); c.lineTo(W / 2 + 320 + pull * 200, H / 2 - 260); c.stroke();
    tag(c, 'PREY PULLS →', W / 2 + 400, H / 2 - 300, pull > 0.1 ? 1 : 0, '#fff', 34);
    tag(c, 'HOOK TURNS & DIGS IN', W / 2, H - 170, ease(seg(lt, 1.6, 2)), RED, 50);
  } else if (k === 'brain') {
    const cx = W / 2, cy = H / 2;
    const pr = lerp(p.p[0], p.p[1], u);
    c.fillStyle = 'rgba(255,170,90,.25)'; c.fillRect(cx - 700, cy - 40, 1400, 80); // esophagus
    c.save(); c.strokeStyle = '#ffc860'; c.lineWidth = 70; c.beginPath(); c.ellipse(cx, cy, 70, 170, 0, 0, 7); c.stroke(); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; c.drawImage(SPR.warm, cx - 300, cy - 300, 600, 600); c.restore();
    label(c, 'BRAIN', cx, cy - 250, {}); label(c, 'THROAT', cx - 500, cy - 70, {});
    if (p.warn) {
      const x = lerp(cx - 800, cx + 60, ease(seg(u, 0, 0.6))), s = 1 + 0.4 * ease(seg(u, 0.4, 0.7));
      c.fillStyle = '#c9a36a'; c.beginPath(); c.ellipse(x, cy, 110, 90 * s, 0, 0, 7); c.fill();
      if (u > 0.55) { c.strokeStyle = `rgba(255,60,40,${0.5 + 0.5 * Math.sin(T * 14)})`; c.lineWidth = 12; c.beginPath(); c.ellipse(cx, cy, 120, 210, 0, 0, 7); c.stroke(); tag(c, '⚠ PRESSURE ON THE BRAIN', cx, H - 170, 1, RED, 50); }
    } else tag(c, 'A DONUT-SHAPED BRAIN', cx, H - 170, ease(seg(lt, 0.6, 1.1)), RED, 50);
  } else if (k === 'food') {
    const a = pop(lt, 0.4), b = pop(lt, 1.6);
    c.save(); c.translate(W * 0.3, H / 2); c.scale(a, a); squidSil(c, -300, 0, 600, 'rgba(160,30,18,.95)', { fat: 1.6, tent: 100 }); c.restore();
    label(c, '≈ 500 KG', W * 0.3, H / 2 + 160, { a, font: '800 40px "Inter Display"', color: '#fff' });
    c.save(); c.translate(W * 0.7, H / 2); c.scale(b, b); c.fillStyle = '#e8c48c'; c.beginPath(); c.moveTo(-110, 110); c.lineTo(-110, -40); c.quadraticCurveTo(-120, -130, -40, -130); c.quadraticCurveTo(0, -160, 40, -130); c.quadraticCurveTo(120, -130, 110, -40); c.lineTo(110, 110); c.closePath(); c.fill();
    c.fillStyle = '#f6e6c4'; c.beginPath(); c.moveTo(-90, 95); c.lineTo(-90, -35); c.quadraticCurveTo(-95, -110, -35, -110); c.quadraticCurveTo(0, -135, 35, -110); c.quadraticCurveTo(95, -110, 90, -35); c.lineTo(90, 95); c.closePath(); c.fill(); c.restore();
    label(c, 'ONE SLICE OF BREAD ≈ 30 G', W * 0.7, H / 2 + 200, { a: b, font: '800 40px "Inter Display"', color: '#fff' });
    tag(c, 'PER DAY', W / 2, 180, ease(seg(lt, 2.4, 2.8)), RED, 64);
  } else if (k === 'echo') {
    whaleSil(c, 160, H / 2, 900, '#16222a', { edge: 'rgba(95,208,255,.3)' });
    for (let i = 0; i < 4; i++) { const r = ((lt * 500 + i * 220) % 900); c.strokeStyle = `rgba(95,208,255,${0.7 * (1 - r / 900)})`; c.lineWidth = 4; c.beginPath(); c.arc(170, H / 2, r, -0.5, 0.5); c.stroke(); }
    squidSil(c, W * 0.7, H / 2, 380, 'rgba(160,30,18,.9)', { fat: 1.6 });
    for (let i = 0; i < 3; i++) { const r = ((lt * 500 + i * 300 + 200) % 900); c.strokeStyle = `rgba(255,120,90,${0.5 * (1 - r / 900)})`; c.lineWidth = 3; c.beginPath(); c.arc(W * 0.7, H / 2, r * 0.5, 2.6, 3.7); c.stroke(); }
    tag(c, 'ECHOLOCATION', W / 2, 180, 1, CY, 60);
  } else if (k === 'db') {
    const bars = [['CONVERSATION', 60], ['JET ENGINE', 140], ['SPERM WHALE CLICK*', 230]];
    bars.forEach(([n, v], i) => { const a = ease(seg(lt, 0.3 + i * 0.9, 1 + i * 0.9)), y = H * 0.35 + i * 160, w = (v / 230) * 1100 * a;
      c.fillStyle = i === 2 ? RED : CY; c.fillRect(380, y, w, 70); label(c, n, 360, y + 46, { align: 'right', a: 1 }); tag(c, `${Math.round(v * a)} dB`, 380 + w + 90, y + 50, a, '#fff', 36); });
    label(c, '*underwater dB scale — not directly comparable to air', W / 2, H - 110, { font: '400 18px "JetBrains Mono"', a: 0.6 });
  } else if (k === 'whalestats') {
    [['1 BREATH', 0.4], ['60+ MIN UNDERWATER', 1.2], ['2,000+ M DEEP', 2.6]].forEach(([s, t0], i) => { const a = pop(lt, t0); tag(c, s, W / 2, H * 0.33 + i * 150, a, i === 2 ? RED : '#fff', 76); });
  } else if (k === 'whalebrain') {
    const a = pop(lt, 0.3), b = pop(lt, 2.4);
    c.save(); c.translate(W * 0.32, H / 2); c.scale(a * 2.2, a * 2.2); c.fillStyle = '#e8a6a6'; c.beginPath(); c.ellipse(0, 0, 90, 60, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,40,40,.6)'; c.lineWidth = 2;
    for (let i = 0; i < 12; i++) { c.beginPath(); c.arc((hash(i) - 0.5) * 120, (hash(i + 1) - 0.5) * 70, 14, 0, 3); c.stroke(); } c.restore();
    label(c, 'SPERM WHALE ≈ 8 KG', W * 0.32, H / 2 + 200, { a, font: '800 40px "Inter Display"', color: '#fff' });
    c.save(); c.translate(W * 0.75, H / 2); c.scale(b, b); c.fillStyle = '#e8a6a6'; c.beginPath(); c.ellipse(0, 0, 90, 60, 0, 0, 7); c.fill(); c.restore();
    label(c, 'YOU ≈ 1.4 KG', W * 0.75, H / 2 + 200, { a: b, font: '800 40px "Inter Display"', color: '#fff' });
    tag(c, 'THE BIGGEST BRAIN ON EARTH', W / 2, 180, ease(seg(lt, 1, 1.5)), RED, 60);
  } else if (k === 'unknowns') {
    ['HOW MANY?', 'HOW LONG THEY LIVE?', 'HOW BIG THEY GET?'].forEach((s, i) => { const a = pop(lt, sfx[i] ?? 0.4 + i); tag(c, s, W / 2, H * 0.32 + i * 160, a, i === 2 ? RED : '#fff', 76); tag(c, 'UNKNOWN', W / 2, H * 0.32 + i * 160 + 50, a * 0.7, CY, 26); });
  }
}
