// Frame dispatcher: timeline -> painters -> overlays -> grade.
import { W, H, clamp, lerp, ease, seg, initSprites, initSnow, hud, bigText, label, finish, mk, SPR, HOOK } from './core.js';
import { initWater, initFlakes, water, murk, flakes, beamHaze, critters, wobble } from './water.js';
import { initTextures, drawBeak as S2B } from './shapes.js';
import * as S2 from './shots2d.js';
import { pDiagram } from './diagrams.js';
import { init3d, render3d, V3 } from './s3d.js';
import { BEATS, TOTAL } from './timeline.js';

const [out, c] = mk(W, H); document.body.appendChild(out);
let ready = false;

const P2 = {
  void: S2.pVoid, eye: S2.pEye, skin: S2.pSkin, surface: S2.pSurface, descent: S2.pDescent, black: S2.pBlack, title: S2.pTitle,
  card: S2.pCard, flash: S2.pFlash, archive: S2.pArchive, map: S2.pMap, sonar: S2.pSonar, split: S2.pSplit, freeze: S2.pFreeze,
  teaser: S2.pTeaser, endcard: S2.pEnd, diagram: pDiagram,
};

function findBeat(T) {
  let lo = 0, hi = BEATS.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (BEATS[m].start <= T) lo = m; else hi = m - 1; }
  return lo;
}

function callout(xy, txy, big, small, right = false, a = 1) {
  const [x, y] = xy, [tx, ty] = txy;
  c.save(); c.globalAlpha = a; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, 8, 0, 7); c.stroke();
  const e = right ? -40 : 40; c.beginPath(); c.moveTo(x, y); c.lineTo(tx, ty); c.lineTo(tx + e, ty); c.stroke();
  c.textAlign = right ? 'right' : 'left'; const ox = right ? tx + e - 10 : tx + e + 10;
  c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 14;
  c.font = '800 38px "Inter Display"'; c.fillStyle = '#fff'; c.fillText(big, ox, ty + 12);
  c.font = '500 20px "JetBrains Mono"'; c.fillStyle = 'rgba(170,225,240,.9)'; c.fillText(small, ox, ty + 42);
  c.restore();
}

function draw3d(type, p, u, lt, T) {
  const { canvas, proj } = render3d(type, p, u, lt, T);
  c.drawImage(canvas, 0, 0, W, H);
  murk(c, T, 0.45); flakes(c, T, { amt: 0.55, vy: 0.003, vx: 0.01, base: 0.7 });
  // shot-specific overlays
  if (type === 'squid3d' && p.cam === 'scale') {
    const a = ease(seg(lt, 0.2, 0.7));
    const hu = proj(V3(1.3, -1.0, 0)); label(c, 'YOU · 1.8 M', hu[0], hu[1] - 20, { a });
    if (p.label === 'weight') callout(proj(V3(1.6, 0.62, 0.3)), [proj(V3(1.6, 0.62, 0.3))[0] + 40, 280], '~500 KG', 'up to half a ton', false, a);
    if (p.label === 'mantle') callout(proj(V3(1.2, 0.6, 0.3)), [proj(V3(1.2, 0.6, 0.3))[0] + 40, 280], 'MANTLE ~2.5 M', 'taller than a doorway', false, a);
    if (p.label === 'length' || p.ruler) {
      const x0 = proj(V3(-5.6, -3.3, 0))[0], x1 = proj(V3(2.8, -3.3, 0))[0], y = 975, d = ease(seg(lt, 0.2, 2));
      c.save(); c.strokeStyle = 'rgba(160,220,235,.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y); c.lineTo(lerp(x0, x1, d), y); c.stroke();
      const px = (x1 - x0) / 8.4; c.font = '500 20px "JetBrains Mono"'; c.fillStyle = 'rgba(160,220,235,.9)';
      for (let m = 0; m <= 8; m++) if (x0 + m * px <= lerp(x0, x1, d)) { c.beginPath(); c.moveTo(x0 + m * px, y); c.lineTo(x0 + m * px, y - (m % 2 ? 10 : 22)); c.stroke(); if (m % 2 === 0) c.fillText(m + ' M', x0 + m * px + 6, y - 10); }
      c.restore();
      label(c, 'UP TO ~10 M (EST.)', lerp(x0, x1, d), y - 50, { a: d, font: '800 36px "Inter Display"', color: '#fff' });
    }
  }
  if (type === 'squid3d' && p.cam === 'beak' && p.p && p.p[0] >= 0.5) {
    c.save(); c.globalAlpha = ease(seg(lt, 0, 0.4)); const open = 0.15 + 0.5 * Math.abs(Math.sin(lt * 2.4)); 
    c.translate(W / 2, H / 2); c.scale(1 + u * 0.1, 1 + u * 0.1); c.translate(-W / 2, -H / 2); S2B(c, W / 2, H / 2, 1.05, open); c.restore();
  }
  if (type === 'squid3d' && p.cam === 'xray') {
    const a = ease(seg(lt, 0.3, 0.8));
    if (p.hearts >= 1) callout(proj(V3(0.55, 0.15, 0.22)), [1350, 260], `${p.hearts} HEART${p.hearts > 1 ? 'S' : ''}`, p.blue ? 'blue, copper-based blood' : 'two for gills, one for body', false, a);
    label(c, 'X-RAY VIEW', W - 230, 1000, { font: '600 20px "JetBrains Mono"', color: '#5fd0ff' });
  }
  if (type === 'squid3d' && p.clock) {
    const s = lt * 600; label(c, `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}  HOURS WAITING`, W / 2, H - 150, { font: '700 48px "JetBrains Mono"', color: '#fff' });
  }
  if (type === 'whale3d' && p.cam === 'skin' && p.mark) {
    for (let i = 0; i < 6; i++) {
      const a = clamp((lt - i * 0.35) * 3), x = 500 + ((i * 337) % 900), y = 380 + ((i * 211) % 380);
      if (p.mark !== 'gouge' && (i % 2 === 0 || p.mark === 'all')) { c.strokeStyle = `rgba(255,74,61,${a})`; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 50, 0, 7); c.stroke(); }
      if (p.mark !== 'ring' && (i % 2 === 1 || p.mark === 'all')) { c.strokeStyle = `rgba(255,74,61,${a})`; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 120, y - 20); c.quadraticCurveTo(x, y + 20, x + 140, y - 40); c.stroke(); }
    }
  }
  if (type === 'whale3d' && p.sonar) {
    for (let i = 0; i < 3; i++) { const r = ((lt * 700 + i * 300) % 1200); c.strokeStyle = `rgba(95,208,255,${0.6 * (1 - r / 1200)})`; c.lineWidth = 4; c.beginPath(); c.arc(W * 0.62, H * 0.6, r, 0, 7); c.stroke(); }
  }
  if (type === 'attack' && p.v === 'cable') {
    const v = lerp(p.tension[0], p.tension[1], ease(u));
    c.save(); c.fillStyle = 'rgba(40,0,0,.6)'; c.fillRect(W - 560, 220, 460, 120);
    c.font = '700 26px "JetBrains Mono"'; c.fillStyle = Math.floor(T * 4) % 2 ? '#ff3b30' : '#ff9d96'; c.fillText('⚠ CABLE LOAD', W - 530, 265);
    c.font = '700 48px "JetBrains Mono"'; c.fillText(`${Math.round(v)}%`, W - 530, 320); c.restore();
  }
  if (type === 'attack' && ['strike', 'slowmo', 'rake', 'spin', 'freeze'].includes(p.v)) {
    // porthole frame + motion smear
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.moveTo(W / 2 + 470, H / 2); c.arc(W / 2, H / 2, 470, 0, 7, true); c.fillStyle = '#0b0b09'; c.fill('evenodd');
    c.beginPath(); c.arc(W / 2, H / 2, 494, 0, 7); c.strokeStyle = '#38352a'; c.lineWidth = 48; c.stroke(); c.restore();
    if (p.v === 'slowmo') label(c, 'SLOW MOTION · 1/8×', W / 2, 160, { font: '600 22px "JetBrains Mono"', color: '#ff6a55' });
  }
}

window.renderFrame = function (T) {
  const i = findBeat(T), b = BEATS[i], lt = T - b.start, u = clamp(lt / b.dur);
  const [type, p] = b.shot;
  HOOK.T = T;
  c.save();
  // global impact shake
  let shake = 0;
  for (const [name, t0] of b.sfx || []) {
    if (/impact|smash|subhit|boom|slam|elephant_thud/.test(name)) { const d = lt - t0; if (d >= 0 && d < 0.5) shake = Math.max(shake, (1 - d / 0.5) * (name === 'impact_big' || name === 'smash' ? 22 : 10)); }
  }
  if (shake) c.translate(Math.sin(T * 71) * shake, Math.cos(T * 63) * shake);
  if (type === 'attack' && p.v === 'glass') S2.pGlass(c, p, u, lt, T, b);
  else if (type === 'squid3d' || type === 'whale3d' || type === 'attack') draw3d(type, p, u, lt, T);
  else P2[type](c, p, u, lt, T, b);
  c.restore();
  if (['void', 'eye', 'skin', 'descent', 'black', 'squid3d', 'whale3d', 'attack', 'flash', 'title', 'card', 'teaser', 'endcard'].includes(type) && !(type === 'descent' && p.d[0] < 1 && p.d[1] < 1)) wobble(c, T, type === 'card' || type === 'title' ? 0.8 : 1.6);
  // slam text
  if (b.slam) {
    const t0 = (b.sfx || []).find(s => /impact/.test(s[0]))?.[1] ?? 0.15;
    bigText(c, b.slam, lt - t0, { size: b.slam.length > 1 ? 104 : 120, y: type === 'diagram' ? H * 0.2 : H * 0.78, fadeOut: b.dur - t0 - 0.3 });
  }
  if (b.hud) {
    const d = lerp(b.hud.d[0], b.hud.d[1], type === 'descent' && p.up ? ease(u) : u);
    hud(c, d, T, clamp(lt / 0.3));
  }
  // flashes
  for (const [name, t0] of b.sfx || []) {
    if (/smash|impact_big/.test(name)) { const d = lt - t0; if (d >= 0 && d < 0.15) { c.fillStyle = `rgba(255,255,255,${0.35 * (1 - d / 0.15)})`; c.fillRect(0, 0, W, H); } }
  }
  // scene change dip
  const prev = BEATS[i - 1];
  if (prev && prev.scene !== b.scene && lt < 0.25) { c.fillStyle = `rgba(0,0,0,${1 - lt / 0.25})`; c.fillRect(0, 0, W, H); }
  // short scene-title lower third
  if (prev && prev.scene !== b.scene || i === 0) b._first = true;
  if (b._first && b.scene !== 'COLD OPEN') { const a = clamp(lt / 0.4) * clamp((2.8 - lt) / 0.4); label(c, b.scene, W / 2, H - 100, { font: '600 24px "JetBrains Mono"', ls: '12px', a, color: 'rgba(255,255,255,.75)' }); }
  finish(c, T, {});
};

window.frameJPEG = function (T, q = 0.9) { window.renderFrame(T); return out.toDataURL('image/jpeg', q).slice(23); };
window.TOTAL = TOTAL;
window.BEATS = BEATS.map(b => ({ start: b.start, dur: b.dur, type: b.shot[0], scene: b.scene }));

(async () => {
  await document.fonts.load('900 100px "Inter Display"'); await document.fonts.load('700 40px "JetBrains Mono"'); await document.fonts.load('500 40px "Inter"');
  initSprites(); initSnow(); initTextures(); init3d(); initWater(); initFlakes();
  Object.assign(HOOK, { water, murk, flakes, beamHaze, critters });
  ready = true; window.__ready = true;
})();
