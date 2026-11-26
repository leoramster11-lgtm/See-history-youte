// Frame engine: timeline -> 3D shot -> post -> motion graphics -> JPEG.
import { BEATS, TOTAL } from './timeline.js';
import { initWorld, updateWorld, renderWorld, project, W, V3, clamp, sn } from './world.js';
import { buildProps, loadFont } from './props.js';
import { SHOTS, ANCH, resetScene } from './shots.js';
import { drawMG, hud, scene_label, endcard } from './mg.js';

const FW = 1920, FH = 1080;
const out = document.createElement('canvas'); out.width = FW; out.height = FH; document.body.appendChild(out);
const c = out.getContext('2d');
const IMPACT = { impact: 0.6, impact_big: 1, slam: 1, boom: 0.8, smash: 1, subhit: 0.35, thud: 0.4, elephant_thud: 0.5, crack: 0.3, snap: 0.3 };

function findBeat(T) { let lo = 0, hi = BEATS.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (BEATS[m].start <= T) lo = m; else hi = m - 1; } return lo; }

window.renderFrame = function (T) {
  T = clamp(T, 0, TOTAL - 1e-3);
  const bi = findBeat(T), B = BEATS[bi], lb = T - B.start;
  let si = 0; while (si < B.shots.length - 1 && B.shots[si + 1].start <= lb) si++;
  const sh = B.shots[si], st = lb - sh.start, u = clamp(st / sh.dur);
  resetScene();
  const fn = SHOTS[sh.name] || SHOTS.sub_orbit;
  // shot-local time keeps animation continuous inside a shot; global T for ambient motion
  const env = fn({ u, t: st, T, p: sh.p, dur: sh.dur }) || {};
  // ---- camera shake: beat-level + synced to impact sounds
  let shake = (B.shake || 0) * 0.25 * Math.exp(-lb * 0.8);
  for (const s of B.sfx) { const k = IMPACT[s[0]]; if (k && lb >= s[1]) shake += k * Math.exp(-(lb - s[1]) * 7); }
  if (shake > 0.001) { const cam = W.cam; cam.position.add(V3(sn(T * 31, 11), sn(T * 29, 12), sn(T * 27, 13)).multiplyScalar(0.06 * shake)); cam.rotateZ(sn(T * 23, 14) * 0.01 * shake); }
  // ---- transitions: whip blur around cuts, flash on beat start, dip at scene change
  const isCutStart = !(si === 0 && bi === 0);
  const dIn = st, dOut = sh.dur - st; const dir = ((bi * 7 + si * 3) % 2) ? 1 : -1;
  let whip = 0; if (isCutStart && dIn < 0.09) whip = (1 - dIn / 0.09); if (dOut < 0.09) whip = Math.max(whip, 1 - dOut / 0.09);
  env.whip = [whip * dir * 0.6, 0];
  let flash = env.flash || 0; if (B.flash && lb < 0.5) flash += B.flash * Math.exp(-lb * 9) * 0.6;
  for (const s of B.sfx) { const k = IMPACT[s[0]]; if (k && k >= 0.8 && lb >= s[1]) flash += 0.12 * Math.exp(-(lb - s[1]) * 14); }
  env.flash = flash;
  const prevScene = bi > 0 ? BEATS[bi - 1].scene : null, nextScene = bi < BEATS.length - 1 ? BEATS[bi + 1].scene : null;
  let fade = env.fade ?? 1;
  if (prevScene && prevScene !== B.scene) fade *= clamp(lb / 0.35);
  if (nextScene && nextScene !== B.scene) fade *= clamp((B.dur - lb) / 0.3);
  if (bi === 0) fade *= clamp(lb / 0.15);
  if (bi === BEATS.length - 1) fade *= clamp((B.dur - lb) / 1.2);
  env.fade = fade;
  updateWorld(T, env);
  const gl = renderWorld();
  c.drawImage(gl, 0, 0, FW, FH);
  // ---- overlays
  if (B.hud && sh.name !== 'options_bg') { const [d0, d1] = B.hud.d; const d = d0 + (d1 - d0) * clamp(lb / B.dur); hud(c, d, T, fade * clamp(lb / 0.3 + (prevScene === B.scene && BEATS[bi - 1].hud ? 1 : 0))); }
  const ctx = { hud: !!B.hud, anchor: k => { const v = ANCH[k]; if (!v) return null; const [x, y, ok] = project(v); return ok ? [x, y] : null; } };
  c.globalAlpha = 1;
  drawMG(c, B.mg, lb, B.dur, ctx);
  if (prevScene !== B.scene && B.scene !== 'COLD OPEN' && B.scene !== 'NEXT TIME') scene_label(c, B.scene, lb - 0.3);
  if (sh.name === 'endcard') endcard(c, lb);
  if (fade < 1) { c.fillStyle = `rgba(0,0,0,${1 - fade})`; c.fillRect(0, 0, FW, FH); }
};
window.frameJPEG = function (T, q = 0.9) { window.renderFrame(T); return out.toDataURL('image/jpeg', q).split(',')[1]; };
window.BEATS = BEATS.map(b => ({ start: b.start, dur: b.dur, shots: b.shots.map(s => ({ name: s.name, start: s.start, dur: s.dur })) }));
window.TOTAL = TOTAL;
(async () => {
  await document.fonts.load('900 100px Inter'); await document.fonts.load('700 30px Inter');
  initWorld(); await loadFont(); buildProps(W.scene);
  window.renderFrame(0.5);
  window.__ready = true;
})().catch(e => { console.error('INIT FAIL', e.stack || e); });
