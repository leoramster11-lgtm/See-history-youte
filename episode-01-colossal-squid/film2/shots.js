// Shot library. Every shot: (c) => env, where c = {u (0..1 within shot), t (s), T (global s), p (params), dur}.
// Each shot positions props + camera (always moving) and returns environment settings for the water.
import * as THREE from 'three';
import { W, V3, lerp, clamp, ease, ease3, sn, hash, emitBubbles, waterLook } from './world.js';
import { P, SM, subLights, subBeams, subAnimate, eyeSet, beakOpen, cupCrush, waveH, setWaveAmp } from './props.js';
import { squidArm } from '../render3d/lib.js';

export const ANCH = {}; // name -> Vector3 (world) for motion-graphics callouts
const A = (k, v) => (ANCH[k] = v.clone());

// ------------------------------------------------------------ helpers
const cam = () => W.cam;
function camAt(T, pos, tgt, fov = 40, hand = 0.03, roll = 0) {
  const c = W.cam; c.fov = fov; c.up.set(0, 1, 0);
  c.position.copy(pos).add(V3(sn(T * 0.35, 1), sn(T * 0.3, 2), sn(T * 0.33, 3)).multiplyScalar(hand));
  c.lookAt(tgt.clone().add(V3(sn(T * 0.4, 4), sn(T * 0.37, 5), 0).multiplyScalar(hand * 0.5)));
  if (roll) c.rotateZ(roll);
}
function orbit(T, center, r, a, h, fov = 40, hand = 0.03, tgtOff = V3(0, 0, 0)) { camAt(T, V3(center.x + Math.sin(a) * r, center.y + h, center.z + Math.cos(a) * r), center.clone().add(tgtOff), fov, hand); }
function face(obj, dir) { const d = dir.clone().normalize(); obj.rotation.set(0, -Math.atan2(d.z, d.x), Math.asin(clamp(d.y, -1, 1)), 'YZX'); }
const show = (...o) => o.forEach(x => (x.visible = true));
function deepLights(k = 1) { W.key.intensity = 0; W.rim.intensity = 0; W.fill.intensity = 0; W.hemi.intensity *= k; }
function placeSubAt(pos, dir, on = 1, T = 0, bI = 0.22) { show(P.sub); P.sub.position.copy(pos); face(P.sub, dir); subLights(on, T, 0, bI); W.subFill.intensity = 14; W.subFill.position.copy(pos).add(V3(1.5, 3, 3)); subAnimate(T); P.sub.userData.pilot.visible = true; return on > 0.01 ? subBeams() : []; }
// sub hidden behind the camera but its lamps light the scene (you are in the sub)
function lightsFromCam(T, on = 1, off = V3(0, -0.4, 0)) {
  const c = W.cam; const dir = new THREE.Vector3(); c.getWorldDirection(dir);
  P.sub.position.copy(c.position).add(off).add(dir.clone().multiplyScalar(-1.6)); face(P.sub, dir); subLights(on, T); P.sub.visible = true;
  P.sub.traverse(o => { if (o.isMesh) o.visible = false; }); P.sub.userData.beams.forEach(b => (b.visible = on > 0.01));
  return subBeams();
}
function subMeshesVisible() { P.sub.traverse(o => { if (o.isMesh) o.visible = true; }); }

// ------------------------------------------------------------ squid arms
const dyn = new Map();
function setDyn(parent, key, grp) { const old = dyn.get(key); if (old) { old.parent && old.parent.remove(old); old.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } dyn.set(key, grp); if (grp) parent.add(grp); }
const ARM = Array.from({ length: 10 }, (_, i) => ({ len: 1.75 + ((i * 0.618) % 1) * 0.4, ph: i * 1.7 }));
const axisRef = P_ => V3(P_.x, 0, 0);
// pose {amp, speed, spread, flower, tentLen, strike(0..1), droop, thin, mat}
export function squidArms(T, pose = {}) {
  const g = new THREE.Group();
  const amp = pose.amp ?? 0.12, sp = pose.speed ?? 1.2, fl = pose.flower ?? 0, sk = pose.strike ?? 0, th = pose.thin ?? 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, Ar = ARM[i], pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, len = Ar.len * (pose.armLen ?? 1);
      let x = -0.38 - t * len * (1 - 0.45 * fl);
      const rr = 0.16 + t * ((pose.spread ?? 0.35) + fl * 1.5);
      x += fl * t * t * len * 0.55;
      const w = Math.sin(T * sp - t * 3.2 + Ar.ph) * amp * t, w2 = Math.cos(T * sp * 0.8 - t * 2.6 + Ar.ph) * amp * t;
      pts.push([x + w2 * 0.3, Math.sin(a) * rr + w * Math.cos(a) - (pose.droop ?? 0) * t * t, Math.cos(a) * rr + w * Math.sin(a) + w2 * 0.4]);
    }
    g.add(squidArm(SM, pts, 0.1 / th, 0.007, axisRef, { suckers: 36, segs: 90 }));
  }
  for (const side of [-1, 1]) {
    const pts = [], len = 3.6 * (pose.tentLen ?? 1.3) * (1 + sk * 0.6);
    for (let k = 0; k <= 7; k++) {
      const t = k / 7, w = Math.sin(T * sp * 0.9 - t * 4 + side) * (amp * 2.2) * t * (1 - sk);
      pts.push([-0.38 - t * len * (1 - 0.6 * fl), side * 0.06 + w + fl * t * 1.2 * side - (pose.droop ?? 0) * t * 0.5, side * (0.08 + 0.35 * t * (1 - sk * 0.9)) + Math.cos(T * 0.7 + t * 3) * amp * t * (1 - sk)]);
    }
    g.add(squidArm(SM, pts, 0.065 / th, 0.012, axisRef, { club: true, suckers: 44, segs: 100 }));
  }
  if (pose.mat) g.traverse(o => { if (o.isMesh) o.material = pose.mat; });
  return g;
}
function squidShow(T, pos, dir, pose = {}, key = 'arms', root = P.squidRoot, body = P.squidBody) {
  show(root); root.position.copy(pos); face(root, dir.clone().negate()); // squid faces -X locally (arms forward)
  root.scale.setScalar(pose.scale ?? 1);
  body.traverse(o => { if (o.isMesh) { if (!o.userData.mat) o.userData.mat = o.material; o.material = pose.mat || o.userData.mat; } });
  setDyn(root, key, squidArms(T, pose));
}

// battle: squid wrapped on whale head (whale local coords)
function battleSquid(T, wild) {
  const surf = P.whale.userData.surf; const root = P.squidRoot;
  P.whale.add(root); show(root); root.scale.setScalar(1.25);
  const head = surf(0.45, 0.45, 0.95), dir = V3(-0.8, 0.45, 0.32).normalize();
  root.position.copy(head).add(V3(Math.sin(T * 5) * 0.05 * wild, Math.cos(T * 4) * 0.05 * wild, 0));
  root.quaternion.setFromUnitVectors(V3(1, 0, 0), V3(dir.x + Math.sin(T * 2) * 0.1 * wild, dir.y, dir.z).normalize());
  P.squidBody.traverse(o => { if (o.isMesh && o.userData.mat) o.material = o.userData.mat; });
  const base = head.clone().add(dir.clone().multiplyScalar(-0.35));
  const g = new THREE.Group();
  [[4.6, 1.45], [4.2, 1.05], [3.7, 0.55], [3.1, 0.05], [2.6, -0.45], [4.9, 1.9]].forEach(([xe, ae], i) => {
    const a0 = 0.75 + (i - 2.5) * 0.12, pts = [base.clone().add(V3(0, (i - 2.5) * 0.06, (i - 2.5) * 0.05))];
    for (let k = 1; k <= 5; k++) { const t = k / 5, x = 0.45 + (xe - 0.45) * t, a = a0 + (ae - a0) * t + Math.sin(t * 5 + i + T * 2.5 * wild) * (0.08 + 0.06 * wild); pts.push(surf(x, a, 0.1 + 0.35 * (1 - t) * (1 - t) + 0.05 * wild * Math.sin(T * 6 + i))); }
    g.add(squidArm(SM, pts, 0.085, 0.008, axisRef, { suckers: 30, segs: 90 }));
  });
  [[V3(-0.9, 0.9, 1.6), V3(-1.3, 0.1, 2.6), V3(-0.9, -0.5, 3.1)], [V3(-1.1, 2.4, 0.9), V3(-1.9, 2.8, 1.5), V3(-2.4, 2.4, 2.0)]].forEach((rest, i) => {
    const wob = k => V3(Math.sin(T * 3 + i + k) * 0.3, Math.cos(T * 2.6 + k) * 0.3, 0).multiplyScalar(0.4 + wild);
    const pts = [base.clone(), base.clone().add(rest[0].clone().multiplyScalar(0.45)), ...rest.map((p, k) => base.clone().add(p).add(wob(k)))];
    g.add(squidArm(SM, pts, 0.085, 0.008, () => base.clone().add(V3(-2, 0, 2)), { suckers: 30, segs: 90 }));
  });
  const tA = [base.clone(), surf(1.5, 1.2, 0.35), surf(3.5, 1.45, 0.15), surf(5.8, 1.35 + 0.1 * Math.sin(T * 3), 0.1), surf(7.2, 1.05, 0.12)];
  g.add(squidArm(SM, tA, 0.065, 0.012, axisRef, { club: true, suckers: 44, segs: 100 }));
  setDyn(P.whale, 'battle', g);
}
// arms wrapping the sub (world coords around sub position)
function wrapArms(T, center, amt, scale = 1.3) {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const phi = (i / 8) * Math.PI * 2, pts = [center.clone().add(V3(-2.6, 0.4, 0))];
    const Rr = (1.25 + (1 - amt) * 0.9 + 0.04 * Math.sin(T * 4 + i)) * scale;
    for (let k = 1; k <= 6; k++) { const th = 0.25 + (k / 6) * 2.6 * amt + 0.2 * (1 - amt) * k / 6; pts.push(center.clone().add(V3(-Math.cos(th) * Rr - 0.4, Math.sin(th) * Rr * Math.cos(phi) * 0.8, Math.sin(th) * Rr * Math.sin(phi)))); }
    g.add(squidArm(SM, pts, 0.15, 0.012, () => center.clone(), { suckers: 30, segs: 90 }));
  }
  return g;
}
function hideDyn() { for (const [k, g] of dyn) if (g) g.visible = false; }

// ------------------------------------------------------------ reset (called each frame before a shot)
export function resetScene() {
  if (P.squidRoot.parent !== W.scene) W.scene.add(P.squidRoot);
  for (const k of Object.keys(P)) { const o = P[k]; if (o && o.isObject3D && o.parent === W.scene) o.visible = false; }
  P.whales.forEach(w => (w.visible = false));
  if (P.squidRoot.parent !== W.scene) W.scene.add(P.squidRoot);
  P.squidRoot.scale.setScalar(1); P.squidRoot.quaternion.identity(); P.squidRoot.rotation.set(0, 0, 0); P.squid2Root.scale.setScalar(1);
  P.xr.xr.visible = false; subMeshesVisible(); P.sub.userData.domeMat.opacity = 0.18; P.sub.userData.strobe.intensity = 0; P.sub.userData.cable.visible = false; P.sub.rotation.set(0, 0, 0);
  for (const [, g] of dyn) if (g) g.visible = true;
  setDyn(P.whale, 'battle', null); setDyn(P.squidRoot, 'arms', null); setDyn(P.squid2Root, 'arms2', null); setDyn(W.scene, 'wrap', null); setDyn(W.scene, 'misc', null);
  P.whale.position.set(0, 0, 0); P.whale.rotation.set(0, 0, 0); P.whale.scale.setScalar(1); P.whale.userData.jaw.rotation.z = 0.32;
  P.whale.traverse(o => { if (o.isMesh) { if (!o.userData.mat) o.userData.mat = o.material; o.material = o.userData.mat; } });
  P.squid2Body.traverse(o => { if (o.isMesh && o.userData.mat) o.material = o.userData.mat; });
  W.key.intensity = 0; W.rim.intensity = 0; W.fill.intensity = 0; W.key.map = null; W.subFill.intensity = 0;
  emitBubbles([], 0); for (const k in ANCH) delete ANCH[k];
}

// ------------------------------------------------------------ the shots
const DARK = new THREE.MeshBasicMaterial({ color: 0x02080a });
export const SHOTS = {};
const S = SHOTS;
const D = 2000;

S.sub_lights = ({ u, T, t }) => {
  waterLook(D); const on = t < 0.35 ? 0 : t < 0.55 ? (Math.sin(t * 80) > 0 ? 0.6 : 0.1) : 1;
  const bm = placeSubAt(V3(0, 0, 0), V3(1, -0.05, 0), on, T);
  camAt(T, V3(lerp(-2.6, -1.4, ease(u)), lerp(0.9, 0.7, u), lerp(-1.8, -1.4, u)), V3(6, -0.3, 0.3), 46, 0.02);
  emitBubbles([{ p: V3(-2.1, -0.1, 0.78), rate: 6, size: 0.02 }], T);
  return { depth: D, beams: bm, crit: 0.6, bloom: [0.9, 0.5, 0.7], snowAmb: 0.05 };
};
S.sub_orbit = ({ u, T, p }) => {
  waterLook(D);
  let on = p.lightsOff ? 1 - ease((u - 0.45) * 4) : 1;
  const pos = V3(p.approach ? u * 2.2 : 0, p.rise ? u * 1.5 : Math.sin(T * 0.4) * 0.1, 0);
  const bm = placeSubAt(pos, V3(1, -0.04, 0), on, T);
  if (p.creak) P.sub.position.add(V3(sn(T * 9, 7), sn(T * 8, 8), 0).multiplyScalar(0.02));
  const a = (p.a ?? 0) + u * 0.55, r = p.close ? 4.2 : 7.5;
  orbit(T, pos.clone().add(V3(0.3, 0, 0)), r, a + Math.PI * 0.5, 1.2 - u * 0.4, p.close ? 38 : 42, 0.05);
  if (p.shadow || p.squid) { squidShow(T, V3(lerp(14, 9, u), 1.5, -6 + u * 3), V3(-1, 0, 0.3), { amp: 0.15, speed: 1 }); }
  emitBubbles([{ p: pos.clone().add(V3(-2.1, -0.1, 0.78)), rate: 7 }, { p: pos.clone().add(V3(-2.1, -0.1, -0.78)), rate: 7, seed: 3 }, ...(p.rise ? [{ p: pos.clone().add(V3(-0.8, 0.9, 0)), rate: 20, size: 0.04, seed: 5 }] : [])], T);
  return { depth: D, beams: bm, crit: 1, bloom: [0.75, 0.5, 0.75] };
};
S.sub_pov = ({ u, T, p }) => {
  waterLook(D);
  const bm = placeSubAt(V3(0, 0, 0), V3(1, 0, 0), 0.6, T, 0.12); P.sub.userData.pilot.visible = false; P.sub.userData.domeMat.opacity = 0.07; P.sub.userData.lampsOn.forEach(l => (l.visible = false));
  camAt(T, V3(0.62, 0.42, 0), V3(6, 0.1 + Math.sin(T * 0.3) * 0.2, Math.sin(T * 0.2) * 0.4), 62, 0.015);
  if (p.pass === 'tentacle') {
    const k = ease3(clamp((u - 0.1) / 0.75)); const zc = lerp(-7, 7, k), g = new THREE.Group(); W.key.intensity = 80; W.key.angle = 0.5; W.key.position.set(1, 1, 0); W.key.target.position.set(5, 0, zc * 0.5);
    const pts = []; for (let i = 0; i <= 6; i++) { const s = i / 6; pts.push(V3(4.2 + Math.sin(s * 3 + T) * 0.4, -1.4 + s * 2.6, zc - s * 3.2 + Math.sin(T * 2 + s * 4) * 0.4)); }
    g.add(squidArm(SM, pts, 0.18, 0.03, () => V3(0, 0, 0), { club: true, suckers: 40, segs: 80 })); setDyn(W.scene, 'misc', g);
  }
  return { depth: D, beams: bm, crit: 1, wob: 1.3, bloom: [0.8, 0.5, 0.72] };
};
function drawScreen(kind, T, u) {
  const tex = P.sub.userData.screen, c = tex.userData.c, x = c.getContext('2d'); const w = c.width, h = c.height;
  x.fillStyle = kind === 'alarm' ? (Math.sin(T * 10) > 0 ? '#3a0505' : '#140202') : '#02100c'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(60,255,160,.25)'; x.lineWidth = 1;
  if (kind === 'sonar' || kind === 'clicks') {
    const cx = w / 2, cy = h - 10;
    for (let r = 60; r < 320; r += 60) { x.beginPath(); x.arc(cx, cy, r, Math.PI, 0); x.stroke(); }
    const a = Math.PI + ((T * 1.6) % Math.PI); x.strokeStyle = 'rgba(80,255,170,.9)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 300, cy + Math.sin(a) * 300); x.stroke();
    if (kind === 'sonar') { const bl = 0.6 + 0.4 * Math.sin(T * 3); x.fillStyle = `rgba(120,255,180,${bl})`; x.beginPath(); x.ellipse(cx + 70, cy - 170, 60 * ease(u * 2), 14, -0.3, 0, 7); x.fill(); }
    if (kind === 'clicks') { x.strokeStyle = 'rgba(120,255,200,.9)'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < w; i++) { const k = (i + T * 200) % 90 < 6 ? 1 : 0; const y = h * 0.35 + (k ? Math.sin(i) * 60 : Math.sin(i * 0.3) * 3); i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
    x.fillStyle = 'rgba(120,255,190,.9)'; x.font = 'bold 22px monospace'; x.fillText(kind === 'sonar' ? 'SONAR · CONTACT' : 'HYDROPHONE · CLICKS', 16, 30);
  } else if (kind === 'alarm') {
    x.fillStyle = '#ff4a3a'; x.font = 'bold 40px monospace'; x.fillText('CABLE LOAD', 30, 90); x.font = 'bold 64px monospace'; x.fillText((1.2 + u * 1.3).toFixed(1) + ' T', 30, 180);
    x.fillStyle = '#ff4a3a'; x.fillRect(30, 220, (w - 60) * clamp(0.4 + u * 0.6), 30); x.strokeStyle = '#ff8a7a'; x.strokeRect(30, 220, w - 60, 30);
  }
  tex.needsUpdate = true;
}
S.cockpit = ({ u, T, p }) => {
  waterLook(D);
  const bm = placeSubAt(V3(0, 0, 0), V3(1, 0, 0), p.screen === 'alarm' ? (Math.sin(T * 7) > 0 ? 1 : 0.4) : 1, T, 0.05); P.sub.userData.pilot.visible = false;
  drawScreen(p.screen, T, u);
  camAt(T, V3(lerp(0.38, 0.5, ease(u)), 0.12, lerp(0.22, 0.1, u)), V3(0.95, -0.12, 0), lerp(48, 38, u), 0.006);
  P.sub.userData.inner.intensity = p.screen === 'alarm' ? 2 : 1.2; P.sub.userData.inner.color.set(p.screen === 'alarm' ? 0xff3020 : 0xffd8b0);
  A('sonar', V3(0.95, -0.05, 0.05));
  if (p.screen !== 'alarm') squidShow(T, V3(9, 0.5, 2), V3(-1, 0, -0.2), { amp: 0.1 });
  return { depth: D, beams: bm, crit: 0.5, bloom: [0.6, 0.4, 0.85], red: p.screen === 'alarm' ? 0.25 + 0.2 * Math.sin(T * 7) : 0 };
};
S.eye_open = ({ u, T, p, t }) => {
  waterLook(D); show(P.eye); P.eye.position.set(0, 0, 0); P.eye.rotation.set(0, 0, 0); P.eye.scale.setScalar(1);
  const [o0, o1] = p.open ?? [0.15, 0.75], open = ease((u - o0) / (o1 - o0));
  const flash = p.flash ? clamp(1 - t * 1.2) : 0;
  eyeSet(open, p.flash ? 0.2 + 0.6 * (1 - flash) : lerp(0.5, 1, ease(u * 1.3)), 0.4 + 0.6 * open);
  const z = lerp(p.slow ? 8 : 9.5, p.slow ? 5.5 : 3.6, ease3(u));
  camAt(T, V3(Math.sin(T * 0.15) * 0.4, 0.15 + Math.cos(T * 0.2) * 0.15, z), V3(0, 0, 0), 32, 0.02);
  W.key.intensity = 60 + flash * 800; W.key.position.set(2.5, 2.5, 7); W.key.target.position.set(0, 0, 0); W.key.angle = 0.4; W.key.color.set(0xd8f0ff);
  W.rim.intensity = 0.6; W.rim.position.set(-3, 2, -2);
  return { depth: D, beams: [], crit: 0.6, bloom: [0.9, 0.5, 0.72], flash: flash * 0.5, exposure: 1.1 };
};
S.eye_close = ({ u, T, p }) => {
  waterLook(D); show(P.eye); P.eye.position.set(0, 0, 0); P.eye.rotation.set(0, 0, 0); P.eye.scale.setScalar(1);
  const open = p.far ? 1 - ease((u - 0.75) * 5) : 1 - ease((u - 0.55) * 3);
  eyeSet(open, 0.8, open);
  const z = lerp(p.far ? 14 : 5, p.far ? 22 : 9, ease(u));
  camAt(T, V3(0.3, 0.2, z), V3(0, 0, 0), 32, 0.02);
  W.key.intensity = 40 * (1 - u * 0.6); W.key.position.set(2.5, 2.5, 7); W.key.target.position.set(0, 0, 0);
  return { depth: D, beams: [], crit: 0.4, bloom: [0.9, 0.5, 0.72], exposure: 1.1 };
};
S.title3d = ({ u, T }) => {
  waterLook(D); show(P.title); P.title.position.set(0, 0, 0); P.title.rotation.set(0, Math.sin(T * 0.2) * 0.08, 0);
  camAt(T, V3(lerp(-1.5, 1.2, u), lerp(-0.4, 0.2, u), lerp(10, 7.5, ease(u))), V3(0, 0, 0), 40, 0.03);
  W.key.intensity = 160; W.key.angle = 0.32; W.key.penumbra = 0.6; W.key.position.set(lerp(-9, 9, ease(u)), 3, 6); W.key.target.position.set(lerp(-4, 4, ease(u)), 0, 0); W.key.color.set(0xeaf6ff);
  W.rim.intensity = 1.5; W.rim.position.set(0, 3, -5); W.rim.color.set(0x58d0ff);
  return { depth: D, beams: [{ o: W.key.position.clone(), d: W.key.target.position.clone().sub(W.key.position) }], crit: 0.8, bloom: [0.8, 0.5, 0.75] };
};
S.squid_pass = ({ u, T, p }) => {
  waterLook(D);
  const x = p.reveal ? lerp(-10, 1.5, ease(u)) : lerp(-11, 11, u);
  squidShow(T, V3(x, 0.2 + Math.sin(T * 0.5) * 0.2, p.reveal ? -1.5 : -3), V3(-1, 0.05, 0.15), { amp: 0.18, speed: 1.6 });
  camAt(T, V3(p.reveal ? x * 0.3 - 2 : 0, 0.6, 5.5), V3(x * (p.reveal ? 0.7 : 0.6), 0, -2), p.reveal ? 50 : 44, 0.04);
  const bm = p.dark ? lightsFromCam(T, 0.35) : lightsFromCam(T, 1);
  A('squid', P.squidRoot.position);
  return { depth: D, beams: bm, crit: 1, bloom: [0.7, 0.5, 0.78] };
};
// ---------------- surface
function oceanScene(T, amp = 1, night = 1) {
  show(P.ocean); setWaveAmp(amp); P.ocean.material.uniforms.uTime.value = T; P.ocean.position.set(0, 0, 0);
  W.scene.fog.color.set(night ? 0x0b141a : 0x3a4c58); W.scene.fog.density = 0.006;
  W.dome.material.uniforms.uTop.value.set(night ? 0x1a2833 : 0x5a7486); W.dome.material.uniforms.uBot.value.set(night ? 0x0a1218 : 0x2a3c48); W.dome.material.uniforms.uSun.value = 0;
  W.hemi.color.set(0x5a7a90); W.hemi.groundColor.set(0x05080a); W.hemi.intensity = night ? 0.7 : 1.5;
  W.rays.visible = false; W.surfU.visible = false; W.sun.intensity = 0;
  W.rim.intensity = night ? 0.5 : 1.5; W.rim.color.set(0xa0c0d0); W.rim.position.set(-40, 30, -60);
  const light = Math.sin(T * 0.9) > 0.985 ? 1 : 0; // lightning
  P.ocean.material.uniforms.uFlash.value = light * night;
  return light * night;
}
function shipAt(ship, T, x = 0, z = 0, yaw = 0) {
  show(ship); const h = waveH(x, z, T), hf = waveH(x + 10, z, T), hb = waveH(x - 10, z, T), hl = waveH(x, z + 4, T), hr = waveH(x, z - 4, T);
  ship.position.set(x, h - 1.2, z); ship.rotation.set((hl - hr) * 0.08, yaw, (hf - hb) * 0.03);
}
S.ship_storm = ({ u, T, p }) => {
  const amp = p.big ? 1.9 : 1.35; const fl = oceanScene(T, amp);
  shipAt(P.ship, T, 0, 0, 0.3);
  const c = p.cam;
  if (c === 'aerial') camAt(T, V3(lerp(-90, -60, u), 45 - u * 8, lerp(60, 40, u)), V3(0, 0, 0), 40, 0.3);
  else if (c === 'deck') camAt(T, V3(-10, P.ship.position.y + 14, 22), V3(10, P.ship.position.y + 4, -2 + u * 4), 50, 0.25);
  else if (c === 'wave') camAt(T, V3(lerp(50, 35, u), 2 + waveH(40, 20, T) * 0.4, 25), V3(0, 4, 0), 42, 0.25);
  else if (c === 'bow') camAt(T, V3(55, 8, -28), V3(0, 3, 0), 44, 0.3);
  else camAt(T, V3(lerp(70, 50, u), 3 + waveH(60, -30, T) * 0.5, -30 + u * 10), V3(0, 3, 0), 36, 0.2);
  if (c === 'bow' || c === 'wave') emitBubbles([{ p: V3(28, P.ship.position.y + 2, 0), rate: 40, size: 0.25, rise: 2, spread: 10, life: 1.6, vel: V3(-6, 3, 0) }], T);
  return { depth: 0, snow: 0, crit: 0, wob: 0, bloom: [0.7, 0.5, 0.8], flash: fl * 0.25, exposure: 1.1 };
};
S.wave_building = ({ u, T }) => {
  oceanScene(T, 1.9); shipAt(P.ship, T, -20, -10, 0.2);
  show(P.building); P.building.position.set(10, -1, 0); P.building.scale.setScalar(lerp(0.01, 1, ease3(u * 2)));
  camAt(T, V3(lerp(60, 48, u), 6, 40), V3(0, 7, 0), 40, 0.2);
  A('building', V3(10, 15, 0));
  return { depth: 0, snow: 0, crit: 0, wob: 0, bloom: [0.9, 0.5, 0.6], exposure: 1.1 };
};
S.trawler = ({ u, T, p }) => {
  oceanScene(T, 0.6, 0); shipAt(P.trawler, T, 0, 0, 0);
  // squid hauled at the side (partly out of water) on a line
  const sq = V3(-6, 1.5 + ease(u) * 1.2 + waveH(-6, 6, T) * 0.3, 7.2);
  squidShow(T, sq, V3(0, -1, 0.1), { amp: 0.05, speed: 0.6, droop: 1.6, spread: 0.1 });
  if (p.close) camAt(T, V3(-1, 4, 16 - u * 2), sq.clone().add(V3(0, -0.5, 0)), 36, 0.15);
  else camAt(T, V3(lerp(30, 22, u), 7, 32), V3(-2, 2, 0), 38, 0.15);
  W.key.intensity = 120; W.key.position.set(-6, 12, 10); W.key.target.position.copy(sq); W.key.angle = 0.35;
  A('squid', sq);
  return { depth: 0, snow: 0, crit: 0, wob: 0, bloom: [0.6, 0.5, 0.85], exposure: 1.0 };
};
S.deck_sub = ({ u, T, p }) => {
  oceanScene(T, 1.1); shipAt(P.ship, T, 0, 0, 0);
  const deckP = V3(-24, P.ship.userData.deckY + 1.0, 0).applyMatrix4(P.ship.matrixWorld.clone());
  P.ship.updateMatrixWorld(true); const dp = V3(-24, P.ship.userData.deckY + 1.0, 0); P.ship.localToWorld(dp);
  placeSubAt(dp, V3(1, 0, 0), 0.25, T); P.sub.rotation.x = P.ship.rotation.x; P.sub.userData.cable.visible = true; P.sub.userData.cable.position.y = 30.7;
  P.sub.userData.pilot.visible = true;
  if (p.close) camAt(T, dp.clone().add(V3(3.2 - u, 0.9, 1.8)), dp.clone().add(V3(0.6, 0.2, 0)), 42, 0.08);
  else camAt(T, dp.clone().add(V3(-5 + u * 2, 5, 12)), dp, 40, 0.15);
  emitBubbles([{ p: dp.clone().add(V3(0, 8, 0)), rate: 60, size: 0.012, rise: -9, spread: 14, life: 0.8 }], T); // rain
  return { depth: 0, snow: 0, crit: 0, wob: 0, bloom: [0.7, 0.5, 0.8], exposure: 1.1 };
};
S.ship_crane = ({ u, T }) => {
  oceanScene(T, 1.1); shipAt(P.ship, T, 0, 0, 0); P.ship.updateMatrixWorld(true);
  P.ship.userData.af.rotation.z = lerp(0.35, -0.45, ease(u));
  const sp = V3(-30 - ease(u) * 6, P.ship.userData.deckY + 5 - ease(u) * 4, 0); P.ship.localToWorld(sp);
  placeSubAt(sp, V3(1, 0, 0), 0.3, T); P.sub.rotation.z = Math.sin(T * 1.3) * 0.12; P.sub.userData.cable.visible = true; P.sub.userData.cable.position.y = 30.7;
  camAt(T, V3(-48, 3, 18), sp.clone().add(V3(4, 2, 0)), 40, 0.2);
  return { depth: 0, snow: 0, crit: 0, wob: 0, bloom: [0.7, 0.5, 0.8], exposure: 1.1 };
};
S.splashdown = ({ u, T, t }) => {
  waterLook(4, { surfY: 3, sun: 0.4 });
  const y = lerp(4, -2.5, ease3(clamp(u * 1.6)));
  placeSubAt(V3(0, y, 0), V3(1, -0.15, 0), 0.6, T);
  camAt(T, V3(6, -4.5, 7), V3(0, y - 0.5, 0), 50, 0.08);
  const burst = clamp(1 - Math.abs(u - 0.3) * 2);
  emitBubbles([{ p: V3(0, y, 0), rate: 120 * burst + 10, size: 0.06, spread: 2.5, rise: 1.6, life: 2.5 }], T);
  return { depth: 4, beams: [], crit: 0.3, surfY: 3, bloom: [0.8, 0.5, 0.75], wob: 1.4 };
};
S.descent = ({ u, T, p }) => {
  const [d0, d1] = p.d ?? [0, 100], d = lerp(d0, d1, u);
  waterLook(d);
  const y = -u * 3; const bm = placeSubAt(V3(0, y, 0), V3(1, -0.2, 0.1), d > 150 ? 1 : 0.5, T);
  if (p.close) camAt(T, V3(3, y + 1.0, 3.2), V3(0.5, y - 0.2, 0), 42, 0.05); else camAt(T, V3(8, y - 1 + u * 1.5, 6), V3(0, y - 0.5, 0), 40, 0.05);
  if (p.diver) { show(P.diver); P.diver.position.set(5.2, y + 0.1, 3.6); P.diver.rotation.set(0, 2.2 + Math.sin(T * 0.3) * 0.1, -0.1); W.key.intensity = 25; W.key.angle = 0.5; W.key.position.set(6, y + 3, 5); W.key.target.position.copy(P.diver.position); A('diver', P.diver.position.clone().add(V3(0, 0.3, 0))); }
  emitBubbles([{ p: V3(-2.1, y - 0.1, 0.78), rate: 6, seed: 1 }, { p: V3(-0.8, y + 0.9, 0), rate: 9, seed: 2 }], T);
  return { depth: d, beams: d > 120 ? bm : [], crit: 1, drift: V3(0.08, 0.35, 0.03), surfY: 30 + d * 0, bloom: [0.7, 0.5, 0.78] };
};
S.blood = ({ u, T }) => {
  const d = lerp(2, 30, u); waterLook(d, { surfY: 4 });
  const g = new THREE.Group(); const k = clamp(u * 1.2);
  const col = new THREE.Color().setRGB(lerp(0.6, 0.03, k), lerp(0.03, 0.3, k), lerp(0.02, 0.14, k));
  for (let i = 0; i < 70; i++) { const age = (i / 70); const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22 * (1 - age * 0.7), depthWrite: false }); const s = new THREE.Mesh(new THREE.SphereGeometry(0.015 + age * 0.09, 12, 8), m); s.position.set(Math.sin(i * 1.7 + T * 0.5) * age * 0.12, -age * 0.9 - u * 0.3, Math.cos(i * 2.3 + T * 0.4) * age * 0.12); g.add(s); }
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.1, clearcoat: 1 })); drop.scale.y = 1.3; drop.position.set(0, -0.95 - u * 0.3, 0); g.add(drop);
  setDyn(W.scene, 'misc', g);
  camAt(T, V3(0.5, -0.3 - u * 0.4, 1.2), V3(0, -0.6 - u * 0.4, 0), 40, 0.01);
  W.key.intensity = 30; W.key.position.set(0, 4, 2); W.key.target.position.set(0, -0.5, 0); W.key.color.set(0xcff8ff);
  return { depth: d, crit: 0.6, bloom: [0.6, 0.4, 0.85] };
};
S.underside = ({ u, T, p }) => {
  const d = p.dim ? 220 : 30; waterLook(d, { surfY: 25, sun: p.dim ? 0.25 : 1 });
  placeSubAt(V3(0, 18 - u * 4, 0), V3(1, -0.3, 0), 0.5, T);
  camAt(T, V3(2, 6 - u * 2, 10), V3(0, 18, 0), 55, 0.05);
  emitBubbles([{ p: P.sub.position.clone(), rate: 10, size: 0.05 }], T);
  return { depth: d, crit: 0.8, surfY: 25, bloom: [0.8, 0.5, 0.75] };
};
S.creatures = ({ u, T, p }) => {
  const d = p.teaser ? 1500 : p.who === 'angler' ? 600 : 2000; waterLook(d);
  let bm = [];
  if (p.who === 'angler') {
    show(P.angler); const x = lerp(1.4, -1.2, u); P.angler.position.set(x, Math.sin(T * 0.6) * 0.05, 0); P.angler.rotation.set(0, 0.2 + Math.sin(T * 0.4) * 0.1, 0); P.angler.scale.setScalar(1);
    P.angler.userData.jaw.rotation.z = -0.15 - 0.1 * Math.sin(T * 1.2); P.angler.userData.fin.rotation.y = Math.sin(T * 6) * 0.5;
    P.angler.userData.ll.intensity = 1.2 + 0.5 * Math.sin(T * 3) * (p.teaser ? Math.sin(T * 9) : 1);
    camAt(T, V3(x * 0.4 - 0.6, 0.25, 2.2 - u * 0.4), P.angler.position.clone().add(V3(-0.2, 0.1, 0)), 40, 0.02);
    A('lure', P.angler.position.clone().add(V3(-0.52, 0.48, 0))); W.key.intensity = 4; W.key.angle = 0.6; W.key.penumbra = 0.8; W.key.position.copy(W.cam.position).add(V3(0.5, 1.2, 0.5)); W.key.target.position.copy(P.angler.position); W.key.color.set(0xbfe6ff);
    if (!p.teaser) bm = lightsFromCam(T, 0.25);
  } else {
    show(P.fish); const x = lerp(-2, 1.5, u); P.fish.position.set(x, 0.2 + Math.sin(T * 2) * 0.03, 0.2); P.fish.rotation.set(0, Math.PI, Math.sin(T * 10) * 0.05); P.fish.userData.tail.rotation.y = Math.sin(T * 14) * 0.6;
    camAt(T, V3(x - 0.4, 0.3, 1.4), P.fish.position, 38, 0.02); bm = lightsFromCam(T, 0.3);
  }
  return { depth: d, beams: bm, crit: 1, bloom: [1.0, 0.5, 0.65] };
};
S.cup = ({ u, T, p }) => {
  waterLook(1000); show(P.cupA, P.cupB);
  const k = p.phase ? ease((u - 0.25) / 0.5) : 0;
  P.cupA.position.set(-0.09, 0, 0); P.cupB.position.set(0.09, 0, 0); P.cupB.scale.set(lerp(1, 0.42, k), lerp(1, 0.38, k), lerp(1, 0.42, k)); cupCrush(P.cupB, k);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.3), new THREE.MeshPhysicalMaterial({ color: 0x3a4044, metalness: 0.8, roughness: 0.4 })); tray.position.y = -0.011; const g = new THREE.Group(); g.add(tray); setDyn(W.scene, 'misc', g);
  const a = lerp(-0.4, 0.5, u) + (p.phase ? 0.4 : 0);
  orbit(T, V3(0, 0.05, 0), p.phase ? 0.45 : 0.6, a, 0.12, 40, 0.004);
  W.key.intensity = 2.5; W.key.angle = 0.6; W.key.position.set(0.5, 1, 1); W.key.target.position.set(0, 0, 0); W.key.color.set(0xeaf6ff); W.rim.intensity = 0.8; W.rim.position.set(-1, 1, -1);
  return { depth: 1000, crit: 0.4, snowSize: 0.3, bloom: [0.5, 0.4, 0.9] };
};
S.pressure_car = ({ u, T }) => {
  waterLook(D);
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.6, 96, 1), new THREE.MeshPhysicalMaterial({ color: 0x6e777c, metalness: 0.9, roughness: 0.35 })); plate.position.y = -0.3; g.add(plate);
  const k = ease3(clamp((u - 0.1) / 0.45)); const press = clamp((u - 0.55) * 4);
  const pin = new THREE.Mesh(new THREE.BoxGeometry(0.0254 * 8, 1.0 - press * 0.15, 0.0254 * 8), new THREE.MeshPhysicalMaterial({ color: 0xb8c0c4, metalness: 0.95, roughness: 0.2, emissive: 0x2a4a50, emissiveIntensity: 0.4 * press })); pin.position.y = 0.5 - press * 0.075; g.add(pin);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25 + press * 1.4, 64), new THREE.MeshBasicMaterial({ color: 0x8ff6ff, transparent: true, opacity: 0.5 * press * (1 - clamp((u - 0.8) * 5)), side: THREE.DoubleSide, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; g.add(ring);
  setDyn(W.scene, 'misc', g);
  show(P.car); P.car.position.set(0, lerp(9, 1.0 - press * 0.15, k), 0); P.car.rotation.set(0, 0.6, press * 0.02 * Math.sin(T * 30));
  camAt(T, V3(lerp(7, 5, u), lerp(1.2, 0.6, u), 7), V3(0, lerp(2.5, 1, u), 0), 42, 0.04 + press * 0.03);
  W.key.intensity = 160; W.key.angle = 0.5; W.key.position.set(4, 9, 6); W.key.target.position.set(0, 0, 0); W.key.color.set(0xeaf6ff); W.rim.intensity = 1.2; W.rim.position.set(-6, 5, -6);
  A('pin', V3(0, 0.5, 0));
  return { depth: D, crit: 0.5, bloom: [0.6, 0.5, 0.85], beams: [{ o: W.key.position.clone(), d: V3(-4, -9, -6) }] };
};
S.jet = ({ u, T }) => {
  waterLook(D); show(P.jet); P.jet.position.set(0, 0, 0); P.jet.rotation.set(0, 0, 0);
  const on = ease(u * 4); P.jet.userData.stream.scale.set(1, on, 1); P.jet.userData.stream.position.z = 0.06 + 2 * on;
  P.jet.userData.bar.position.y = -ease((u - 0.4) * 2) * 0.4;
  camAt(T, V3(lerp(3.5, 2.5, u), 0.8, lerp(1, 2.5, u)), V3(0, 0, 2), 42, 0.03);
  emitBubbles([{ p: V3(0, 0, 3.3), rate: 160 * on, size: 0.02, spread: 0.4, rise: 0.5, life: 1.2, vel: V3(0, 0.4, 1.2) }], T);
  W.key.intensity = 60; W.key.position.set(3, 4, 4); W.key.target.position.set(0, 0, 2); W.key.angle = 0.5; W.fill.intensity = 4 * on; W.fill.position.set(0, 0, 3.3); W.fill.color.set(0xaef4ff);
  return { depth: D, crit: 0.4, bloom: [1.0, 0.5, 0.7] };
};
S.lungs = ({ u, T }) => {
  waterLook(D); show(P.lungs); P.lungs.position.set(0, 0, 0);
  const k = ease3(clamp((u - 0.2) / 0.5)); const s = lerp(1, 0.17, k);
  P.lungs.userData.lungs.scale.setScalar(s * (1 + 0.04 * Math.sin(T * 2) * (1 - k)));
  P.lungs.userData.ball.visible = u > 0.7; P.lungs.userData.ball.position.set(0.18, 0, 0.05);
  camAt(T, V3(lerp(1.4, 0.7, ease(u)), 0.1, lerp(1.4, 0.8, ease(u))), V3(0, 0, 0), 38, 0.01);
  W.key.intensity = 6; W.key.angle = 0.6; W.key.position.set(1, 2, 2); W.key.target.position.set(0, 0, 0); W.rim.intensity = 1; W.rim.position.set(-1, 1, -2);
  return { depth: D, crit: 0.3, bloom: [0.6, 0.5, 0.85], red: k * 0.3 };
};
S.squid_scale = ({ u, T }) => {
  waterLook(D);
  const x = lerp(-1, 1.5, u);
  squidShow(T, V3(x, 0.3, -1.6), V3(-1, 0, 0), { amp: 0.12, speed: 1.2 });
  placeSubAt(V3(x - 1, -0.3, 1.4), V3(1, 0, 0), 1, T);
  camAt(T, V3(x - 1.5, 1.4, 13.5), V3(x - 1.8, 0, 0), 36, 0.04);
  W.key.intensity = 160; W.key.angle = 0.25; W.key.penumbra = 0.8; W.key.color.set(0xe6f4ff); W.key.position.set(x - 2, 4, 9); W.subFill.intensity = 3; W.key.target.position.set(x - 2, 0, -1.6);
  A('squid_len', V3(x - 3.5, 1.4, -1.6)); A('sub_len', V3(x - 1, -1.0, 1.4));
  return { depth: D, beams: subBeams(), crit: 0.8, bloom: [0.7, 0.5, 0.78] };
};
S.squid_orbit = ({ u, T, p }) => {
  waterLook(D);
  squidShow(T, V3(0, 0, 0), V3(-1, 0.05, 0), { amp: p.slow ? 0.06 : 0.12, speed: p.slow ? 0.5 : 1.2, mat: p.ghost ? P.ghostMat : null });
  const a = [0.1, -0.35, 0.4, -0.6, 0.25, 2.9, -0.2][Math.round(p.a ?? 0) % 7] + u * 0.5;
  orbit(T, V3(p.arms ? -2.2 : -1, 0, 0), p.arms ? 5 : 9, a, 1.4 - u * 0.6, 36, 0.05);
  const bm = lightsFromCam(T, 1, V3(0.5, 0.6, 0.5));
  W.rim.intensity = 1.8; W.rim.position.set(3, 4, -7); W.rim.color.set(0x58d0ff);
  A('squid', V3(0, 0.5, 0));
  return { depth: D, beams: bm, crit: 0.8, bloom: [0.7, 0.5, 0.78] };
};
S.squid_close = ({ u, T, p }) => {
  waterLook(D);
  squidShow(T, V3(0, 0, 0), V3(-1, 0, 0), { amp: 0.06, speed: 0.6 });
  if (p.glow) { camAt(T, V3(lerp(-0.6, -0.3, u), 0.18, 1.4), V3(-0.02, 0.0, 0.35), 34, 0.01); }
  else camAt(T, V3(lerp(2.6, 0.6, ease(u)), 0.9, 1.2), V3(lerp(2.2, 0.4, ease(u)), 0.2, 0.2), 38, 0.015);
  const bm = lightsFromCam(T, 0.12, V3(0.3, 0.5, 0.3));
  W.rim.intensity = 1.5; W.rim.position.set(2, 4, -5);
  if (p.glow) { W.fill.intensity = 0.6 + 0.3 * Math.sin(T * 3); W.fill.color.set(0x7ff0ff); W.fill.position.set(-0.1, -0.15, 0.6); }
  return { depth: D, beams: bm, crit: 0.4, bloom: [0.9, 0.5, 0.7] };
};
S.squid_hunt = ({ u, T, p }) => {
  waterLook(D);
  const strike = p.phase === 1 ? ease3(clamp((u - (p.fast ? 0.1 : 0.5)) / 0.25)) : 0;
  squidShow(T, V3(0, 0, 0), V3(-1, -0.05, 0), { amp: 0.05, speed: 0.5, spread: 0.9, tentLen: 1.1, strike, droop: -0.2 });
  if (p.phase === 1) { show(P.fish); const fx = lerp(-7.5, -6.2, u); P.fish.position.set(fx, 0.1 + Math.sin(T * 2) * 0.05, 0.1); P.fish.rotation.set(0, 0, 0); P.fish.scale.setScalar(2.2); P.fish.userData.tail.rotation.y = Math.sin(T * 14) * 0.6; if (strike > 0.9) P.fish.visible = false; }
  const c = p.cam ?? 0;
  if (p.phase === 1) camAt(T, V3(-3.5, 1.2, 6.5 - strike), V3(-4.5, 0, 0), 40, 0.04 + strike * 0.04);
  else if (c === 1) orbit(T, V3(-1.5, 0, 0), 8, 0.3 + u * 0.4, 0.8, 38, 0.04);
  else if (c === 2) camAt(T, V3(-4.5, -1.5, 6 - u), V3(-1.5, 0.2, 0), 44, 0.04);
  else if (c === 3) camAt(T, V3(lerp(4, 2, u), 2, 8), V3(-1.5, 0, 0), 40, 0.04);
  else camAt(T, V3(lerp(-2.5, 0.5, u), 1.5, 8), V3(-1.5, 0, 0), 40, 0.04);
  const bm = lightsFromCam(T, 0.7, V3(0.6, 0.6, 0.4)); W.key.intensity = 120; W.key.angle = 0.5; W.key.penumbra = 0.8; W.key.position.copy(W.cam.position).add(V3(0, 3, 0)); W.key.target.position.set(-1.5, 0, 0);
  W.rim.intensity = 1.2; W.rim.position.set(3, 4, -7);
  return { depth: D, beams: bm, crit: 0.8, bloom: [0.7, 0.5, 0.78] };
};
S.options_bg = ({ u, T, p }) => {
  waterLook(D, p.red ? { tint: 0x300808 } : {});
  squidShow(T, V3(0, 0, -6), V3(-1, 0, 0.2), { amp: 0.1, speed: 0.8 });
  camAt(T, V3(lerp(-2, 2, u), 0.5, 8), V3(0, 0, -6), 40, 0.05);
  const bm = lightsFromCam(T, 0.5);
  return { depth: D, beams: bm, crit: 0.6, blur: 2.5, bloom: [0.6, 0.5, 0.8], red: p.red ? 0.35 : 0, fade: 0.75 };
};
S.seesaw = ({ u, T, p }) => {
  waterLook(D); show(P.seesaw); const { beamG, L, R: Rr } = P.seesaw.userData;
  const big = p.what === 'buses'; P.seesaw.scale.setScalar(big ? 1 : 0.42); P.seesaw.position.set(0, -2, 0);
  const drop = p.phase === 1 ? ease3(clamp(u / 0.35)) : 0; // right item lands
  beamG.rotation.z = lerp(0.18, 0, ease(clamp((u - 0.35) / 0.3))) * (p.phase === 1 ? 1 : 1) + Math.sin(T * 3) * 0.004 * (1 - drop);
  setDyn(W.scene, 'misc', null);
  L.updateMatrixWorld(true);
  if (big) {
    const wp = V3(0, 0, 0); L.localToWorld(wp);
    show(P.whale); P.whale.position.copy(wp).add(V3(-8, 1.7, 0)); P.whale.rotation.set(0, 0, -beamG.rotation.z);
    show(P.buses); const bp = V3(0, 0, 0); Rr.localToWorld(bp); P.buses.position.copy(bp).add(V3(-5.5, lerp(14, 0, drop), 0)); P.buses.rotation.set(0, 0, -beamG.rotation.z);
    camAt(T, V3(lerp(-8, 6, u), 8, 38), V3(0, 4, 0), 44, 0.1);
  } else {
    const wp = V3(0, 0, 0); L.localToWorld(wp);
    squidShow(T, wp.clone().add(V3(0.6, 0.55, 0)), V3(-1, 0, 0), { amp: 0.04, speed: 0.6, droop: 0.35, scale: 0.55 });
    show(P.piano); const bp = V3(0, 0, 0); Rr.localToWorld(bp); P.piano.position.copy(bp).add(V3(-0.75, lerp(5, 0, drop), 0.9)); P.piano.rotation.set(0, 0, -beamG.rotation.z);
    camAt(T, V3(lerp(-2, 1.5, u), 1.4, 8.5), V3(0.5, 0, 0), 40, 0.05);
  }
  W.key.intensity = big ? 2400 : 500; if (!big) { W.fill.intensity = 30; W.fill.color.set(0xcfe8ff); W.fill.position.set(4, 3, 4); } W.key.angle = 0.7; W.key.position.set(0, 18, 14); W.key.target.position.set(0, 0, 0); W.key.color.set(0xe8f4ff);
  W.rim.intensity = 2; W.rim.position.set(0, 6, -10); W.rim.color.set(0x58d0ff);
  return { depth: D, crit: 0.6, bloom: [0.6, 0.5, 0.85], beams: [{ o: W.key.position.clone(), d: V3(0, -18, -14) }] };
};
S.eye_ball = ({ u, T, p }) => {
  waterLook(D); show(P.eye); const s = 0.135; P.eye.scale.setScalar(s); P.eye.position.set(0, 0, 0); P.eye.rotation.set(0, -0.25, 0);
  eyeSet(1, 0.85 + 0.1 * Math.sin(T), p.phase === 3 ? 0.35 * ease(u * 2) : 0.15);
  const ph = p.phase;
  if (ph >= 1) { show(P.ball); const k = ph === 1 ? ease3(clamp(u / 0.6)) : 1; P.ball.position.set(lerp(1.2, 0.33, k), Math.sin(T * 0.8) * 0.01, 0.06); P.ball.rotation.set(T * 0.2, T * 0.3, 0); }
  if (ph === 0) camAt(T, V3(0.1, 0.05, lerp(1.4, 0.55, ease(u))), V3(0, 0, 0), 36, 0.004);
  else if (ph === 1) camAt(T, V3(0.17, 0.08, lerp(0.95, 0.85, u)), V3(0.16, 0, 0), 40, 0.004);
  else if (ph === 2) orbit(T, V3(0.16, 0, 0), 0.9, -0.5 + u * 0.6, 0.15, 40, 0.004);
  else camAt(T, V3(0.05, -0.12, lerp(0.7, 0.5, u)), V3(0, -0.12, 0), 38, 0.004);
  W.key.intensity = 6; W.key.angle = 0.5; W.key.position.set(0.8, 0.9, 1.6); W.key.target.position.set(0.1, 0, 0); W.key.color.set(0xe8f4ff); W.rim.intensity = 1.0; W.rim.position.set(-1, 1, -1);
  A('eye', V3(0, 0.15, 0)); A('ball', P.ball.position.clone().add(V3(0, 0.13, 0)));
  return { depth: D, crit: 0.3, snowSize: 0.25, bloom: [0.9, 0.5, 0.7] };
};
S.eye_glow = ({ u, T, p }) => {
  waterLook(D, { fog: 0.006 });
  const g = new THREE.Group(); // distant whale outlined by glowing plankton
  show(P.whale); P.whale.position.set(-8, -2, -120); P.whale.rotation.set(0, 0.4, 0); P.whale.traverse(o => { if (o.isMesh) o.material = DARK; });
  const N = 400, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const x = hash(i) * 16, a = hash(i * 2) * 6.28, r = 1.7 + hash(i * 3) * 1.2; pos[i * 3] = x; pos[i * 3 + 1] = Math.sin(a) * r * (x < 12 ? 1 : 0.4); pos[i * 3 + 2] = Math.cos(a) * r * (x < 12 ? 1 : 0.4); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x55ffd5, size: 0.35 + 0.15 * Math.sin(T * 3), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); P.whale.add(pts); g.userData.pts = pts;
  setDyn(P.whale, 'battle', pts);
  if (p.phase === 0) { show(P.eye); P.eye.scale.setScalar(0.135); P.eye.position.set(-0.22, 0.02, 0.45); P.eye.rotation.set(0, Math.PI - 0.6, 0); eyeSet(1, 1, 0.2); camAt(T, V3(0.05, 0.06, 0.95 - u * 0.15), V3(-3, -0.5, -120), 40, 0.004); W.key.intensity = 3; W.key.position.set(0.4, 0.5, 1.2); W.key.target.position.set(-0.22, 0, 0.45); }
  else camAt(T, V3(0, 0, lerp(0, -95, ease3(u))), V3(-6, -2, -120), 40, 0.02);
  A('whaleglow', V3(-2, -2, -120));
  return { depth: D, crit: 0.4, bloom: [1.2, 0.5, 0.5], snowAmb: 0.08 };
};
S.hooks = ({ u, T, p }) => {
  waterLook(D); show(P.club); P.club.position.set(0, 0, 0); P.club.rotation.set(0, 0, 0);
  P.club.userData.hooks.forEach(({ swiv, ph }, i) => { swiv.rotation.y = p.phase === 1 || p.phase === 2 ? Math.sin(T * 2.2 + ph) * 1.2 : Math.sin(T * 0.6 + ph) * 0.15; swiv.rotation.x = p.phase === 3 ? 0.4 : 0; });
  const ph = p.phase;
  if (ph === 0) camAt(T, V3(lerp(0.2, 2.6, ease(u)), -0.55, 1.1), V3(lerp(0.6, 2.8, ease(u)), -0.15, 0), 36, 0.01);
  else if (ph === 1) orbit(T, V3(2.0, -0.2, 0), 1.0, -0.6 + u * 1.2, -0.4, 38, 0.01);
  else if (ph === 2) camAt(T, V3(2.1, -0.5, 0.35 - u * 0.1), V3(2.0, -0.28, 0.05), 30, 0.004);
  else {
    const g = new THREE.Group(); const slab = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 2), new THREE.MeshPhysicalMaterial({ color: 0x5a1a14, roughness: 0.5, clearcoat: 0.6 })); slab.position.set(1.8, -0.45 - Math.sin(T * 4) * 0.03 - u * 0.05, 0); g.add(slab); setDyn(W.scene, 'misc', g);
    P.club.position.y = u * 0.08 + Math.sin(T * 6) * 0.01; camAt(T, V3(1.4, -0.2, 1.6), V3(1.9, -0.35, 0), 40, 0.02);
  }
  const bm = lightsFromCam(T, p.phase === 3 ? 0.08 : 0.2, V3(0.2, 0.4, 0.2));
  W.rim.intensity = 1.5; W.rim.position.set(1, 3, -3); W.rim.color.set(0x58d0ff);
  A('hook', V3(2.0, -0.3, 0.1));
  return { depth: D, beams: bm, crit: 0.5, snowSize: 0.4, bloom: [0.7, 0.5, 0.8] };
};
S.beak = ({ u, T, p }) => {
  waterLook(D);
  const fl = p.phase === 0 ? ease(u * 1.3) : 1;
  squidShow(T, V3(0, 0, 0), V3(-1, 0, 0), { amp: 0.05, speed: 0.8, flower: fl, spread: 0.6 });
  show(P.beak); P.beak.position.set(-0.55, 0, 0); P.beak.rotation.set(0, Math.PI, 0); P.beak.scale.setScalar(1.3);
  const open = p.phase === 2 ? Math.max(0, Math.sin(T * 9)) : p.phase === 1 ? ease((u - 0.3) * 2) * (0.6 + 0.4 * Math.sin(T * 3)) : 0.1;
  beakOpen(open);
  if (p.phase === 0) camAt(T, V3(lerp(-6, -1.4, ease(u)), 0.15, 0.25), V3(-0.4, 0, 0), 44, 0.01);
  else camAt(T, V3(-0.95 + Math.sin(T * 0.3) * 0.05, 0.08, 0.32 - u * 0.05), V3(-0.62, 0, 0), 36, 0.004);
  const bm = lightsFromCam(T, 0.08, V3(0.1, 0.25, 0.1));
  W.key.intensity = 3; W.key.angle = 0.6; W.key.position.set(-1.3, 0.6, 0.6); W.key.target.position.set(-0.6, 0, 0); W.key.color.set(0xffe8d0);
  if (p.phase === 2) emitBubbles([{ p: V3(-0.7, 0, 0), rate: 40, size: 0.006, spread: 0.1, rise: 0.1, life: 1.5, vel: V3(-0.15, 0.02, 0) }], T);
  A('beak', V3(-0.66, 0.08, 0));
  return { depth: D, beams: bm, crit: 0.3, snowSize: 0.3, bloom: [0.7, 0.5, 0.8] };
};
S.xray = ({ u, T, p }) => {
  waterLook(D, { tint: 0x002030 });
  squidShow(T, V3(0, 0, 0), V3(-1, 0, 0), { amp: 0.04, speed: 0.6, mat: P.ghostMat });
  const X = P.xr; X.xr.visible = true; const f = p.focus;
  X.hearts.forEach((h, i) => { h.visible = f === 'hearts' || f === 'blood' || f === 'all'; h.scale.setScalar(1 + 0.3 * Math.max(0, Math.sin(T * 7 + i * 1.3))); h.material.color.set(f === 'blood' ? 0x4090ff : 0xff3048); });
  X.vessels.visible = f === 'blood' || f === 'all'; X.vessels.children.forEach(v => v.material.color.set(f === 'blood' ? 0x3aa8ff : 0xff6a80));
  X.brain.visible = true; X.gut.visible = f === 'food' || f === 'brain' || f === 'all';
  X.food.visible = f === 'food'; const fx = lerp(-0.7, 1.6, (u * 1.1) % 1); X.food.position.set(fx, 0.05, 0); X.food.scale.setScalar(p.big ? 2.2 : 1);
  const warn = p.big && Math.abs(fx - 0.05) < 0.3; X.brain.material.color.set(warn ? (Math.sin(T * 20) > 0 ? 0xff2020 : 0xffc860) : 0xffc860); X.brain.scale.setScalar(warn ? 1.15 : 1);
  if (f === 'brain' || f === 'food') camAt(T, V3(lerp(-0.2, 0.5, u), 0.7, 2.8 - u * 0.3), V3(0.4, 0.05, 0), 38, 0.01);
  else if (f === 'hearts' || f === 'blood') orbit(T, V3(0.7, 0, 0), 2.6, 0.4 + u * 0.5, 0.6, 36, 0.01);
  else orbit(T, V3(0, 0, 0), 7, 0.3 + u * 0.4, 1.2, 34, 0.02);
  A('brain', P.squidRoot.localToWorld(V3(0.05, 0.22, 0))); A('gut', P.squidRoot.localToWorld(V3(1.2, 0.1, 0)));
  return { depth: D, crit: 0.3, bloom: [0.7, 0.5, 0.85] };
};
S.nuggets = ({ u, T, p }) => {
  waterLook(D); show(P.nuggets); P.nuggets.position.set(0, 0, 0); P.nuggets.rotation.set(0.1, T * 0.2, 0);
  squidShow(T, V3(-3.5, -0.3, -6), V3(-1, 0, -0.4), { amp: 0.1, speed: 0.8 });
  if (p.phase === 1) camAt(T, V3(0.05, 0.12, lerp(0.42, 0.32, u)), V3(0, 0.01, 0), 40, 0.003);
  else camAt(T, V3(lerp(0.9, 0.4, ease(u)), 0.25, 0.9), V3(-0.3, 0, -1.5), 40, 0.01);
  W.key.intensity = 1.5; W.key.angle = 0.5; W.key.position.set(0.4, 1.2, 0.8); W.key.target.position.set(0, 0, 0); W.key.color.set(0xfff0dc);
  const bm = lightsFromCam(T, 0.15);
  return { depth: D, beams: bm, crit: 0.3, snowSize: 0.3, bloom: [0.6, 0.5, 0.85] };
};
S.cousins = ({ u, T }) => {
  waterLook(D);
  squidShow(T, V3(0, 1.4, 0), V3(-1, 0, 0), { amp: 0.1, speed: 1.0 });
  show(P.squid2Root); P.squid2Root.position.set(0.5, -1.4, 0); face(P.squid2Root, V3(1, 0, 0)); P.squid2Root.scale.set(1.15, 0.55, 0.55);
  setDyn(P.squid2Root, 'arms2', squidArms(T + 2, { amp: 0.14, speed: 1.0, armLen: 1.6, tentLen: 2.6, thin: 1.3 }));
  camAt(T, V3(lerp(-3, 0, u), 0.5, 16), V3(-2, 0, 0), 40, 0.04);
  const bm = lightsFromCam(T, 1, V3(0.5, 0.6, 0.5));
  return { depth: D, beams: bm, crit: 0.7, bloom: [0.7, 0.5, 0.78] };
};
S.squid_jet = ({ u, T, p }) => {
  waterLook(D);
  const x = p.cam ? u * 5 : ease3(clamp((u - 0.45) / 0.5)) * 6;
  squidShow(T, V3(x, 0, 0), V3(-1, 0, 0), { amp: 0.06, speed: 2, spread: 0.12 });
  const pump = 1 + 0.08 * Math.sin(T * 8); P.squidBody.scale.set(1, pump, pump);
  const sp = P.squidRoot.localToWorld(V3(-0.2, -0.45, 0));
  emitBubbles([{ p: sp, rate: 90, size: 0.025, spread: 0.08, rise: 0.05, life: 1.4, vel: V3(-3.5, -0.4, 0) }], T);
  if (p.cam) camAt(T, V3(x - 2, 1.2, 5), V3(x - 1, 0, 0), 40, 0.05);
  else camAt(T, V3(lerp(-1.5, 1, u), 1, 5.5), V3(lerp(-0.5, 2, u), -0.2, 0), 40, 0.04);
  const bm = lightsFromCam(T, 0.8, V3(0.4, 0.6, 0.4));
  A('siphon', sp);
  return { depth: D, beams: bm, crit: 0.7, bloom: [0.7, 0.5, 0.78] };
};
// ---------------- attack
S.attack_ext = ({ u, T, p }) => {
  waterLook(D);
  const sc = V3(0, 0, 0); const bm = placeSubAt(sc, V3(1, 0, 0), 1, T);
  const v = p.v;
  if (v === 'approach') {
    squidShow(T, V3(lerp(14, 6, ease(u)), 0.5, lerp(-4, -1, u)), V3(-1, 0, 0.2), { amp: 0.15, speed: 1.4, spread: 0.6 });
    camAt(T, V3(-4, 1.2, 6), V3(4, 0.2, -1), 44, 0.05);
  } else if (v === 'hooks') {
    const g = new THREE.Group(); const k = u;
    const pts = [V3(3.5, 1.6, -1.5), V3(2.2, 1.2, -0.6), V3(1.4, 0.7 - k * 0.6, 0.2), V3(1.0, 0.4 - k * 0.9, 0.7)];
    g.add(squidArm(SM, pts, 0.18, 0.08, () => V3(0.68, 0.1, 0), { club: true, suckers: 40, segs: 80 })); setDyn(W.scene, 'wrap', g);
    camAt(T, V3(2.4, 0.4, 1.6), V3(0.9, 0.2, 0.3), 36, 0.03);
  } else {
    show(P.squidRoot); P.squidRoot.position.set(-2.6, 0.6, 0); face(P.squidRoot, V3(1, 0, 0)); setDyn(P.squidRoot, 'arms', null);
    setDyn(W.scene, 'wrap', wrapArms(T, sc, v === 'wrap' ? ease(u * 1.5) : 1));
    if (v === 'cable') { P.sub.userData.cable.visible = true; P.sub.position.add(V3(sn(T * 6, 1), sn(T * 5, 2), 0).multiplyScalar(0.1)); P.sub.rotation.z = Math.sin(T * 2) * 0.15; }
    orbit(T, V3(-0.8, 0.2, 0), v === 'cable' ? 8 : 6.5, 0.6 + u * 0.5, v === 'cable' ? 2.5 : 1.0, 42, 0.06);
  }
  return { depth: D, beams: bm, crit: 0.8, bloom: [0.8, 0.5, 0.72] };
};
S.attack_pov = ({ u, T, p }) => {
  waterLook(D);
  const bm = placeSubAt(V3(0, 0, 0), V3(1, 0, 0), 0.3, T, 0.15); P.sub.userData.pilot.visible = false; P.sub.userData.domeMat.opacity = 0.07; P.sub.userData.lampsOn.forEach(l => (l.visible = false));
  const v = p.v; const roll = v === 'spin' ? Math.sin(T * 1.2) * 0.6 : 0;
  camAt(T, V3(0.6, 0.38, 0), V3(5, 0.1, 0), 64, v === 'shake' ? 0.05 : 0.015, roll);
  const g = new THREE.Group();
  if (v !== 'shake') {
    const k = v === 'strike' ? ease3(clamp(u * 2.2)) : 1;
    for (const side of [-1, 1]) {
      if (v === 'strike' && side > 0) continue;
      const end = V3(lerp(9, 1.55, k), side * lerp(2, 0.2, k) + (v === 'rake' ? Math.sin(T * 5 + side) * 0.35 : 0), side * lerp(3, 0.35, k));
      const pts = [V3(12, side * 4, side * 6), V3(7, side * 2, side * 3), end.clone().add(V3(1.2, side * 0.3, side * 0.5)), end];
      g.add(squidArm(SM, pts, 0.22, 0.08, () => V3(0.6, 0.38, 0), { club: true, suckers: 40, segs: 80 }));
    }
    if (v === 'spin' || v === 'rake') for (let i = 0; i < 4; i++) { const a = i * 1.5 + T * 0.4; const pts = [V3(7, Math.sin(a) * 3, Math.cos(a) * 4), V3(2.6, Math.sin(a) * 1.0, Math.cos(a) * 1.4), V3(1.6, Math.sin(a + 0.6) * 0.7, Math.cos(a + 0.6) * 0.9), V3(1.5, Math.sin(a + 1.2) * 0.9, Math.cos(a + 1.2) * 1.1)]; g.add(squidArm(SM, pts, 0.26, 0.08, () => V3(0.6, 0.38, 0), { suckers: 26, segs: 70 })); }
  }
  setDyn(W.scene, 'wrap', g);
  return { depth: D, beams: bm, crit: 0.6, wob: 1.5, bloom: [0.8, 0.5, 0.72] };
};
S.strobe = ({ u, T, p, t }) => {
  waterLook(D);
  const sc = V3(0, 0, 0); placeSubAt(sc, V3(1, 0, 0), 1, T);
  const fl = Math.sin(t * 38) > 0.2 ? 1 : 0; const sOn = p.phase < 2 ? fl : 0;
  P.sub.userData.strobe.intensity = sOn * 3000;
  if (p.phase === 0) { setDyn(W.scene, 'wrap', wrapArms(T, sc, 1 - u * 0.2)); show(P.squidRoot); P.squidRoot.position.set(-2.6, 0.6, 0); face(P.squidRoot, V3(1, 0, 0)); setDyn(P.squidRoot, 'arms', null); orbit(T, V3(0, 0, 0), 6, 0.9 + u * 0.3, 1, 44, 0.08); }
  else if (p.phase === 1) { setDyn(W.scene, 'wrap', wrapArms(T, sc, 1 - ease(u))); show(P.squidRoot); P.squidRoot.position.set(-2.6 - u, 0.6, 0); face(P.squidRoot, V3(1, 0, 0)); setDyn(P.squidRoot, 'arms', null); orbit(T, V3(0, 0, 0), 7, 1.3 + u * 0.3, 1, 44, 0.1); }
  else {
    const k = ease(u); squidShow(T, V3(lerp(-3, -9, ease3(u)), lerp(0.6, 2, u), lerp(0, -4, u)), V3(1, 0.1, -0.4), { amp: 0.25, speed: 3, spread: 0.1 });
    show(P.ink); P.ink.position.set(-3.2, 0.8, 0); P.ink.children.forEach((s, i) => s.scale.setScalar(s.userData.s * lerp(0.2, 2.2, k)));
    orbit(T, V3(-2, 0.5, 0), 8, 1.0 + u * 0.2, 1, 44, 0.05);
  }
  return { depth: D, beams: subBeams(), crit: 0.8, bloom: [1.0, 0.5, 0.6], flash: sOn * 0.22, exposure: 1 + sOn * 0.4 };
};
// ---------------- whale
function whaleKey(tgt, k = 1) { const dd = W.cam.position.distanceTo(tgt); W.key.intensity = 500 * k * Math.min(1, Math.pow(dd / 16, 2)); W.key.angle = 0.55; W.key.penumbra = 0.8; W.key.color.set(0xdff0ff); W.key.position.copy(W.cam.position).add(V3(2, 5, 0)); W.key.target.position.copy(tgt); W.rim.intensity = 1.6 * k; W.rim.color.set(0x6fd2ff); W.rim.position.set(tgt.x + 4, tgt.y + 12, tgt.z - 8); W.rim.target.position.copy(tgt); }
function whaleSwim(T, pos, yaw, pitch = 0, speed = 1) {
  show(P.whale); P.whale.position.copy(pos); P.whale.rotation.set(0, yaw, pitch + Math.sin(T * 0.8 * speed) * 0.02, 'YZX');
}
S.whale_emerge = ({ u, T, p }) => {
  waterLook(D);
  const z = p.far ? lerp(-60, -40, u) : lerp(-30, -8, ease(u));
  whaleSwim(T, V3(p.far ? -4 : -2, -1, z), Math.PI / 2 + 0.1, 0); // snout toward camera (+z)
  camAt(T, V3(0.5, 0.2, 10), V3(-2, -1, z), p.far ? 34 : 40, 0.04);
  const bm = lightsFromCam(T, p.far ? 0.4 : 0.8); whaleKey(V3(-2, -1, z), p.far ? 0.6 : 1);
  return { depth: D, beams: bm, crit: 0.7, bloom: [0.8, 0.5, 0.72] };
};
S.whale_click = ({ u, T, p }) => {
  waterLook(D);
  whaleSwim(T, V3(0, 0, 0), 0.0, 0); // snout at x=0, body +X; faces -X
  show(P.shells); P.shells.position.set(-0.3, 0.3, 0);
  P.shells.children.forEach((s, i) => { const ph = ((T * 0.9 + i / 5) % 1); s.scale.setScalar(0.5 + ph * (p.scan ? 30 : 12)); s.material.opacity = 0.4 * (1 - ph); s.rotation.set(0, 0, Math.PI / 2); });
  if (p.sub) { placeSubAt(V3(-9, 0.3, 1), V3(1, 0, 0), 1, T); P.sub.position.add(V3(sn(T * 30, 1), sn(T * 28, 2), 0).multiplyScalar(0.06)); camAt(T, V3(-14, 2, 9), V3(-5, 0, 0), 42, 0.05); }
  else if (p.scan) { squidShow(T, V3(-22, 0, 0), V3(1, 0, 0), { amp: 0.1, mat: P.echoMat }); camAt(T, V3(lerp(4, -4, u), 3, 12), V3(-8, 0, 0), 44, 0.05); }
  else if (p.close) camAt(T, V3(-4.5, 0.6, 3.5 - u), V3(0, 0.4, 0), 40, 0.03);
  else orbit(T, V3(2, 0, 0), 14, -0.9 + u * 0.4, 1.5, 40, 0.05);
  const bm = lightsFromCam(T, 0.5); whaleKey(V3(3, 0, 0), 0.8);
  return { depth: D, beams: bm, crit: 0.6, bloom: [0.9, 0.5, 0.7] };
};
S.whale_pass = ({ u, T, p }) => {
  waterLook(D);
  const x = lerp(16, -16, u);
  whaleSwim(T, V3(x, -0.5, -5), 0, 0); // moving -X (snout first)
  if (p.sub) { placeSubAt(V3(-1, -2.5, 3), V3(1, 0, 0.2), 1, T); A('sub', V3(-1, -2, 3)); }
  if (p.squid) squidShow(T, V3(-14, 1, -9), V3(-1, 0, 0), { amp: 0.12 });
  camAt(T, V3(x * 0.35, 1, 18), V3(x * 0.6, -0.5, -5), p.dark ? 46 : 42, 0.05); whaleKey(V3(x + 6, -0.5, -5), p.dark ? 0.5 : 1);
  const bm = p.sub ? subBeams() : lightsFromCam(T, p.dark ? 0.4 : 0.8);
  return { depth: D, beams: bm, crit: 0.8, bloom: [0.7, 0.5, 0.78] };
};
S.whale_head = ({ u, T }) => {
  waterLook(D, { tint: 0x002030 });
  whaleSwim(T, V3(0, 0, 0), 0, 0); P.whale.traverse(o => { if (o.isMesh) o.material = P.ghostMat; });
  const g = new THREE.Group();
  const sperm = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.35, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false })); sperm.scale.set(2.6, 0.9, 0.9); sperm.position.set(2.7, 0.4, 0); g.add(sperm);
  const br = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff7a90, toneMapped: false })); br.position.set(5.4, -0.2, 0); br.scale.setScalar(1 + 0.08 * Math.sin(T * 3)); g.add(br);
  setDyn(W.scene, 'misc', g);
  orbit(T, V3(3, 0, 0), 12, -0.9 + u * 0.5, 1.5, 38, 0.03);
  A('brain', V3(5.4, 0.1, 0)); A('spermaceti', V3(2.7, 1.3, 0));
  return { depth: D, crit: 0.3, bloom: [1.0, 0.6, 0.4] };
};
S.brains = ({ u, T }) => {
  waterLook(D); show(P.brainW, P.brainH);
  P.brainW.position.set(-0.22, 0, 0); P.brainH.position.set(0.22, -0.06, 0); P.brainW.rotation.y = T * 0.25; P.brainH.rotation.y = T * 0.25;
  const g = new THREE.Group(); for (const [x, r] of [[-0.22, 0.16], [0.22, 0.09]]) { const ped = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, 0.5, 48), new THREE.MeshPhysicalMaterial({ color: 0x1a1f22, roughness: 0.3, metalness: 0.6 })); ped.position.set(x, x < 0 ? -0.38 : -0.39, 0); g.add(ped); }
  setDyn(W.scene, 'misc', g);
  camAt(T, V3(lerp(-0.3, 0.3, u), 0.25, 1.4), V3(0, -0.03, 0), 36, 0.005);
  W.key.intensity = 4; W.key.angle = 0.5; W.key.position.set(0.5, 1.5, 1.4); W.key.target.position.set(0, 0, 0); W.key.color.set(0xfff0e0); W.rim.intensity = 1.5; W.rim.position.set(-1, 1, -2);
  A('brainW', V3(-0.22, 0.17, 0)); A('brainH', V3(0.22, 0.05, 0));
  return { depth: D, crit: 0.2, snowSize: 0.3, bloom: [0.6, 0.5, 0.85] };
};
S.whale_sleep = ({ u, T, p }) => {
  waterLook(25, { surfY: 18 });
  const pos = [[0, 0, 0], [7, 1, -6], [-6, -1, -9], [12, 0.5, -16], [-12, 1.5, -20]];
  const ws = [P.whale, ...P.whales];
  ws.forEach((w, i) => { show(w); w.position.set(pos[i][0], 3 + pos[i][1] + Math.sin(T * 0.3 + i) * 0.2, pos[i][2]); w.rotation.set(0, i * 0.8, -Math.PI / 2 + 0.05 + Math.sin(T * 0.2 + i) * 0.02, 'YZX'); });
  if (p.close) camAt(T, V3(4, lerp(-6, -2, u), 9), V3(0, -3, 0), 44, 0.04);
  else camAt(T, V3(lerp(-6, 6, u), -10, 32), V3(0, -4, -8), 42, 0.05);
  whaleKey(V3(0, 3, -6), 0.4);
  return { depth: 25, crit: 0.6, surfY: 18, bloom: [0.8, 0.5, 0.75] };
};
S.whale_dive = ({ u, T, p }) => {
  const deep = p.deep ?? 0; const d = deep === 0 ? lerp(5, 60, u) : deep === 1 ? lerp(600, 1200, u) : 2000;
  waterLook(d, { surfY: 14 });
  if (deep === 0) { whaleSwim(T, V3(lerp(-4, 2, u), lerp(12, 2, ease(u)), 0), 0, lerp(0, -0.9, ease(u))); camAt(T, V3(-2, -6, 18), V3(0, 6 - u * 4, 0), 50, 0.04); }
  else { whaleSwim(T, V3(0, -u * 6, 0), 0.3, -1.3); camAt(T, V3(-6, -u * 6 - 2, 14), V3(0, -u * 6 - 2, 0), 44, 0.04); }
  emitBubbles([{ p: P.whale.localToWorld(V3(0.6, 1.4, 0)), rate: 20, size: 0.08, spread: 0.6 }], T); whaleKey(P.whale.localToWorld(V3(6, 0, 0)), deep ? 0.8 : 0.5);
  const bm = deep ? lightsFromCam(T, 0.6) : [];
  return { depth: d, beams: bm, crit: 0.8, surfY: 14, drift: V3(0.05, 0.4, 0), bloom: [0.7, 0.5, 0.78] };
};
S.breath = ({ u, T, p }) => {
  if (p.phase === 0) {
    const fl = oceanScene(T, 0.5, 0); W.scene.fog.density = 0.004;
    whaleSwim(T, V3(0, 0.2 + waveH(0, 0, T) * 0.3, 0), 0.3, 0); W.hemi.intensity = 2.2; W.rim.intensity = 2.5; W.rim.position.set(-20, 30, 20);
    camAt(T, V3(lerp(-13, -10, u), 2.5, 11), V3(4, 0.5, 0), 40, 0.15); whaleKey(V3(4, 0.5, 0), 0.6);
    emitBubbles([{ p: P.whale.localToWorld(V3(0.4, 1.6, 0.4)), rate: 120 * clamp(1 - Math.abs(u - 0.35) * 3), size: 0.12, spread: 0.6, rise: 6, life: 1.5, vel: V3(0.5, 0, -0.5) }], T);
    return { depth: 0, snow: 0, crit: 0, wob: 0, exposure: 1.1, bloom: [0.6, 0.5, 0.85] };
  }
  waterLook(lerp(100, 900, u)); whaleSwim(T, V3(0, -u * 8, 0), 0.4, -1.35);
  camAt(T, V3(-10, -u * 8 - 4, 16), V3(0, -u * 8 - 4, 0), 44, 0.04); whaleKey(V3(0, -u * 8 - 4, 0), 0.8);
  return { depth: lerp(100, 900, u), crit: 0.8, drift: V3(0.05, 0.5, 0), bloom: [0.7, 0.5, 0.78] };
};
S.battle = ({ u, T, p }) => {
  waterLook(D);
  show(P.whale); P.whale.position.set(-2.2, -0.6, 0.6); P.whale.rotation.set(0, 0.78, 0.13);
  const wild = p.thrash ? 1 : 0.45; if (p.thrash) P.whale.rotation.set(Math.sin(T * 5) * 0.06, 0.78 + Math.sin(T * 3.3) * 0.12, 0.13 + Math.sin(T * 4.1) * 0.05);
  battleSquid(T, wild);
  if (p.jaw) P.whale.userData.jaw.rotation.z = lerp(0.65, 0.08, ease(clamp((u - 0.4) * 4)));
  const c = p.cam;
  if (c === 0) camAt(T, V3(4.2 - u * 1.2, -1.2 + u * 0.4, 14.2 - u * 2), V3(-0.6, 0.9, -2.2), 40, 0.05 + wild * 0.04);
  else if (c === 1) camAt(T, V3(-6, 2, 5 - u), V3(-3, 0.8, 0), 44, 0.1);
  else if (c === 2) camAt(T, V3(-1, 3.5, 6), V3(-2.5, 0.5, 0), 42, 0.12);
  else if (c === 3) camAt(T, V3(6 + u * 4, 0, 16 + u * 4), V3(0, 0, -2), 38, 0.05);
  else if (c === 4) orbit(T, V3(-1, 0.5, -1), 13, 0.2 + u * 0.4, 1.5, 40, 0.06);
  else camAt(T, V3(1.2, -4.6, 7.5), V3(0.6, -1.6, -1.2), 38, 0.06);
  const bm = lightsFromCam(T, 0.45, V3(-1, -1, 1)); whaleKey(V3(-1, 0.5, -1), 0.5);
  W.rim.intensity = 1.4; W.rim.position.set(2, 12, -4); W.rim.color.set(0x6fd2ff);
  return { depth: D, beams: bm, crit: 0.8, bloom: [0.8, 0.5, 0.75] };
};
S.scars = ({ u, T, p }) => {
  waterLook(D); show(P.whale); P.whale.position.set(0, 0, 0); P.whale.rotation.set(0, 0, 0);
  const surf = P.whale.userData.surf;
  const c = p.close ?? 0;
  if (c === 0) camAt(T, V3(lerp(-3, 1, u), 1.6, 5.5), V3(lerp(0.5, 3, u), 0.6, 0), 38, 0.03);
  else if (c === 1) camAt(T, V3(lerp(1.0, 2.0, u), 1.6, 4.2), V3(lerp(1.4, 2.4, u), 0.7, 0.8), 36, 0.01);
  else camAt(T, V3(lerp(2.8, 4.0, u), 0.6, 4.2), V3(lerp(3.0, 4.2, u), 0.3, 0.9), 36, 0.01);
  const bm = lightsFromCam(T, 0.3, V3(0.5, 1, 0.5)); W.key.intensity = 22; W.key.angle = 0.6; W.key.penumbra = 0.7; W.key.color.set(0xe6f2ff); W.key.position.copy(W.cam.position).add(V3(-1, 3, 1)); W.key.target.position.set(2.5, 0.5, 0.8);
  A('scar_ring', surf(1.8, 0.6, 0)); A('scar_gash', surf(3.3, 0.2, 0));
  return { depth: D, beams: bm, crit: 0.4, bloom: [0.6, 0.5, 0.85] };
};
S.stomach = ({ u, T, p }) => {
  waterLook(30, { fog: 0.08, tint: 0x200404 }); W.dome.visible = false; show(P.stomach); P.stomach.position.set(0, 0, 0);
  if (p.arms) show(P.arms1925); if (p.pile) show(P.beakPile);
  const c = p.close ?? 0;
  if (c === 0) camAt(T, V3(lerp(-2, 1, u), 0.2, 2.5), V3(0, -1.8, 0), 50, 0.03);
  else if (c === 1) camAt(T, V3(0.4, -1.1, 1.2 - u * 0.3), V3(0, -2.1, 0), 42, 0.02);
  else camAt(T, V3(-0.3, -1.6, 0.7 - u * 0.15), V3(0, -2.3, 0), 40, 0.01);
  W.key.intensity = [30, 10, 4][c]; W.key.angle = 0.45; W.key.penumbra = 0.5; W.key.position.copy(W.cam.position).add(V3(0.2, 0.3, 0)); W.key.target.position.set(sn(T * 0.4, 9) * 0.6, -2.2, sn(T * 0.3, 8) * 0.6); W.key.color.set(0xfff2e0);
  return { depth: 30, snow: 0, crit: 0, bloom: [0.5, 0.5, 0.85], wob: 0.6, exposure: 1.15 };
};
S.ascent = ({ u, T, p }) => {
  const [d0, d1] = p.d ?? [2000, 1500], d = lerp(d0, d1, u); waterLook(d, { surfY: 30 });
  const y = u * 3; const bm = placeSubAt(V3(0, y, 0), V3(1, 0.25, 0), 0.8, T);
  camAt(T, p.up ? V3(2, y - 5, 4) : V3(6, y + 1.5, 5), p.up ? V3(0, y + 4, 0) : V3(0, y, 0), p.up ? 55 : 42, 0.05);
  emitBubbles([{ p: V3(-2.1, y - 0.1, 0.78), rate: 8 }, { p: V3(-0.8, y + 0.9, 0), rate: 18, seed: 4 }], T);
  return { depth: d, beams: d > 150 ? bm : [], crit: 1, drift: V3(0.06, -0.3, 0.02), surfY: 30, bloom: [0.7, 0.5, 0.78] };
};
S.baby = ({ u, T, p }) => {
  waterLook(600);
  const s = 0.04; squidShow(T, V3(0, 0, 0), V3(-1, 0.1, 0.2), { amp: 0.15, speed: 2, scale: s });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffc0b0, transparent: true, opacity: 0.45, roughness: 0.1, clearcoat: 1, emissive: 0x401010, emissiveIntensity: 0.15, depthWrite: false });
  P.squidRoot.traverse(o => { if (o.isMesh && o !== P.siphon) { if (!o.userData.mat) o.userData.mat = o.material; o.material = glass; } });
  show(P.ruler); P.ruler.position.set(-0.08, -0.07, 0.05); P.ruler.rotation.set(0.2, 0, 0);
  if (p.close) camAt(T, V3(lerp(-0.05, 0.03, u), 0.03, 0.22), V3(-0.03, 0, 0), 38, 0.002);
  else orbit(T, V3(-0.06, 0, 0), 0.6, -0.3 + u * 0.6, 0.12, 38, 0.003);
  const bm = lightsFromCam(T, 0.02);
  W.key.intensity = 0.4; W.key.angle = 0.6; W.key.position.set(0.3, 0.4, 0.5); W.key.target.position.set(0, 0, 0);
  A('baby', V3(-0.1, 0.05, 0));
  return { depth: 600, beams: bm, crit: 0.5, snowSize: 0.15, bloom: [0.8, 0.5, 0.75] };
};
S.angler_close = ({ u, T }) => {
  waterLook(1500); show(P.angler); P.angler.position.set(0, 0, 0); P.angler.rotation.set(0, -0.5 + u * 0.3, 0); P.angler.scale.setScalar(1);
  P.angler.userData.jaw.rotation.z = -0.1 - 0.35 * ease((u - 0.4) * 3); P.angler.userData.ll.intensity = 1.4 + 0.6 * Math.sin(T * 4);
  camAt(T, V3(-1.4 + u * 0.5, 0.3, 0.9 - u * 0.2), V3(-0.2, 0.15, 0), 40, 0.01); W.key.intensity = 3; W.key.angle = 0.6; W.key.position.set(-1, 1.2, 1.2); W.key.target.position.set(0, 0, 0);
  return { depth: 1500, crit: 0.3, bloom: [1.1, 0.5, 0.6], snowAmb: 0.06 };
};
S.sonar_view = ({ u, T }) => {
  waterLook(D, { tint: 0x001a10 }); W.scene.fog.density = 0.01;
  squidShow(T, V3(0, 0, 0), V3(-1, 0, 0.2), { amp: 0.12, mat: P.echoMat });
  show(P.shells); P.shells.position.set(14, 0, 0); P.shells.children.forEach((s, i) => { const ph = ((T * 0.8 + i / 5) % 1); s.scale.setScalar(0.5 + ph * 16); s.material.opacity = 0.35 * (1 - ph); s.rotation.set(0, 0, -Math.PI / 2); });
  orbit(T, V3(-1, 0, 0), 9, 0.5 + u * 0.6, 1.5, 40, 0.03);
  return { depth: D, crit: 0, snow: 0, bloom: [0.6, 0.5, 0.85], red: 0 };
};
S.endcard = ({ u, T }) => {
  waterLook(D); show(P.title); P.title.position.set(0, 0.6, 0); P.title.rotation.set(0, Math.sin(T * 0.2) * 0.06, 0); P.title.scale.setScalar(0.8);
  show(P.eye); P.eye.position.set(0, 0.4, -9); P.eye.scale.setScalar(2.2); eyeSet(1, 0.8, 0.6);
  camAt(T, V3(0, 0.4, lerp(11, 10, u)), V3(0, 0.2, 0), 40, 0.02);
  W.key.intensity = 70; W.key.angle = 0.4; W.key.position.set(Math.sin(T * 0.4) * 6, 3, 6); W.key.target.position.set(0, 0.5, 0); W.rim.intensity = 1.2; W.rim.position.set(0, 3, -5);
  return { depth: D, crit: 0.8, bloom: [0.8, 0.5, 0.75], beams: [{ o: W.key.position.clone(), d: V3(-W.key.position.x, -2.5, -6) }] };
};
// aliases
S.whale_buses = S.seesaw;
