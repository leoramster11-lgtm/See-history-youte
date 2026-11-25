// 3D shots: animated squid, sperm whale, battle, attack on the sphere, x-ray.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { V3, setSeed, squidMaterials, squidBody, squidArm, spermWhale, particles, beam, softDot } from '../render3d/lib.js';

export const RW = 1280, RH = 720;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => (t = clamp(t), t * t * (3 - 2 * t));

let renderer, composer, bloomPass, renderPass;
let M; // squid materials
export function init3d() {
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(RW, RH); renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  composer.addPass(renderPass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.6, 0.55, 0.82);
  composer.addPass(bloomPass); composer.addPass(new OutputPass());
  setSeed(42);
  M = squidMaterials();
  return renderer.domElement;
}

// ---------------------------------------------------------------- dynamic arms
const dyn = new Map(); // key -> group to dispose
function setDyn(scene, key, grp) {
  const old = dyn.get(key);
  if (old) { scene.remove(old); old.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  dyn.set(key, grp); scene.add(grp);
}
const ARM = Array.from({ length: 10 }, (_, i) => ({ len: 1.75 + ((i * 0.618) % 1) * 0.4, ph: i * 1.7 }));
const axisRef = P => V3(P.x, 0, 0);

// pose: {spread, amp, speed, flower(0..1), tentLen, still}
function squidArms(T, pose = {}) {
  const g = new THREE.Group();
  const amp = pose.amp ?? 0.12, sp = pose.speed ?? 1.2, fl = pose.flower ?? 0;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, A = ARM[i], pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, len = A.len;
      let x = -0.38 - t * len * (1 - 0.45 * fl);
      const rr = 0.16 + t * ((pose.spread ?? 0.35) + fl * 1.5);
      x += fl * t * t * len * 0.55;
      const w = Math.sin(T * sp - t * 3.2 + A.ph) * amp * t;
      const w2 = Math.cos(T * sp * 0.8 - t * 2.6 + A.ph) * amp * t;
      pts.push([x + w2 * 0.3, Math.sin(a) * rr + w * Math.cos(a), Math.cos(a) * rr + w * Math.sin(a) + w2 * 0.4]);
    }
    g.add(squidArm(M, pts, 0.1, 0.007, axisRef, { suckers: 40, segs: 110 }));
  }
  for (const side of [-1, 1]) {
    const pts = [], len = 3.6 * (pose.tentLen ?? 1.3);
    for (let k = 0; k <= 7; k++) {
      const t = k / 7;
      const w = Math.sin(T * sp * 0.9 - t * 4 + side) * (amp * 2.2) * t;
      pts.push([-0.38 - t * len * (1 - 0.6 * fl), side * 0.06 + w + fl * t * 1.2 * side, side * (0.08 + 0.35 * t) + Math.cos(T * 0.7 + t * 3) * amp * t]);
    }
    g.add(squidArm(M, pts, 0.065, 0.012, axisRef, { club: true, suckers: 50, segs: 120 }));
  }
  return g;
}

// ---------------------------------------------------------------- scenes
const SC = {};
function envBase(bg, fog) {
  const s = new THREE.Scene(); s.background = new THREE.Color(bg); s.fog = new THREE.FogExp2(bg, fog); return s;
}
function makeBeak() {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x14100d, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  for (const d of [-1, 1]) {
    const geo = new THREE.ConeGeometry(0.16, 0.38, 32, 8); geo.translate(0, 0.19, 0);
    const pos = geo.attributes.position; // curve the cone into a hook
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setZ(i, pos.getZ(i) + y * y * 1.6); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.rotation.set(0, 0, d * Math.PI / 2 + Math.PI); m.scale.set(1, 1, d > 0 ? 1 : 0.9);
    const piv = new THREE.Group(); piv.add(m); piv.userData.d = d; g.add(piv);
  }
  return g;
}
function getSquidScene() {
  if (SC.squid) return SC.squid;
  const s = envBase(0x052530, 0.045);
  s.add(new THREE.HemisphereLight(0x4f8fa8, 0x050102, 0.45));
  const key = new THREE.SpotLight(0xe9f4ff, 140, 40, 0.5, 0.8, 1.5); key.position.set(-3, 4, 7); s.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x58d0ff, 2.6); rim.position.set(3, 4, -7); s.add(rim);
  const under = new THREE.DirectionalLight(0xff5030, 0.35); under.position.set(0, -6, 2); s.add(under);
  const root = new THREE.Group(); s.add(root);
  const body = squidBody(M); root.add(body);
  const beakG = makeBeak(); beakG.position.set(-0.66, 0, 0); beakG.scale.setScalar(1.7); root.add(beakG);
  // x-ray organs
  const xr = new THREE.Group(); xr.visible = false; root.add(xr);
  const hearts = [];
  [[0.55, 0.15, 0.22], [0.55, 0.15, -0.22], [0.75, -0.05, 0]].forEach(p => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff3048 }));
    h.position.set(...p); xr.add(h); hearts.push(h);
  });
  const brain = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 16, 48), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
  brain.rotation.y = Math.PI / 2; brain.position.set(0.05, 0.05, 0); xr.add(brain);
  const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 12), new THREE.MeshBasicMaterial({ color: 0xff9a50, transparent: true, opacity: 0.6 }));
  gut.rotation.z = Math.PI / 2; gut.position.set(0.9, 0.05, 0); xr.add(gut);
  const vessels = new THREE.Group(); xr.add(vessels);
  for (let i = 0; i < 14; i++) {
    const pts = [V3(0.55, 0.1, 0), V3(1.0 + i * 0.08, 0.25 * Math.sin(i), 0.3 * Math.cos(i)), V3(1.6 + i * 0.05, 0.3 * Math.sin(i * 1.3), 0.35 * Math.cos(i * 1.7)), V3(2.2, 0.1 * Math.sin(i), 0.1 * Math.cos(i))];
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 6, false);
    vessels.add(new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0x3aa8ff })));
  }
  // ghost material for x-ray
  const ghost = new THREE.MeshBasicMaterial({ color: 0x4fb8ff, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, wireframe: false });
  const snow = particles(3500, [-14, 14, -7, 7, -12, 10], 0.035, 0xd6ecf2, 0.5); s.add(snow);
  // human for scale
  const hm = new THREE.MeshBasicMaterial({ color: 0x3f6d79 });
  const human = new THREE.Group();
  const cap = (r, l, x, y, rz = 0) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 16), hm); m.position.set(x, y, 0); m.rotation.z = rz; human.add(m); };
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), hm); head.position.y = 1.67; human.add(head);
  cap(0.17, 0.42, 0, 1.25); cap(0.07, 0.7, -0.1, 0.42); cap(0.07, 0.7, 0.1, 0.42); cap(0.05, 0.55, -0.27, 1.2, -0.12); cap(0.05, 0.55, 0.27, 1.2, 0.12);
  human.position.set(1.3, -3.05, 0); s.add(human);
  const cam = new THREE.PerspectiveCamera(30, RW / RH, 0.05, 300);
  SC.squid = { s, root, body, beakG, xr, hearts, brain, vessels, ghost, human, cam, key, rim };
  return SC.squid;
}

function getWhaleScene() {
  if (SC.whale) return SC.whale;
  const s = envBase(0x041d27, 0.03);
  s.add(new THREE.HemisphereLight(0x2e6f88, 0x000000, 0.45));
  const top = new THREE.DirectionalLight(0x6fd2ff, 1.4); top.position.set(2, 12, -4); s.add(top);
  const sub = V3(-3.6, -3.4, 7.5);
  const spot = new THREE.SpotLight(0xe8f6ff, 100, 45, 0.6, 0.85, 1.4); spot.position.copy(sub); spot.target.position.set(-1.8, 0.8, 0); s.add(spot, spot.target);
  const warm = new THREE.PointLight(0xffd2b8, 18, 9, 1.4); warm.position.set(-2.5, 3.5, 4.5); s.add(warm);
  const whale = spermWhale(); whale.position.set(-2.2, -0.6, 0.6); whale.rotation.set(0, 0.78, 0.13); s.add(whale);
  const jaw = whale.children.find(o => o.isGroup && o.position.x > 5);
  const glow = particles(1400, [-1, 20, -3, 4, -8, 3], 0.09, 0x55ffd5, 0.7); s.add(glow);
  s.add(particles(5000, [-14, 14, -8, 8, -14, 9], 0.04, 0xd6ecf2, 0.5));
  const ink = particles(260, [-5.5, -1.5, -2.5, 1.0, 0.5, 4.5], 1.6, 0x040207, 0.55, false); ink.visible = false; s.add(ink);
  const bm = beam(sub, V3(-1.8, 0.8, 0), 3.4, 0.12); s.add(bm);
  const squidRoot = new THREE.Group(); whale.add(squidRoot);
  const cam = new THREE.PerspectiveCamera(40, RW / RH, 0.05, 400);
  SC.whale = { s, whale, jaw, glow, ink, cam, spot, squidRoot, surf: whale.userData.surface };
  return SC.whale;
}

// squid wrapped on the whale head, animated
function battleSquid(W, T, wild) {
  const { surf, squidRoot } = W;
  const head = surf(0.45, 0.45, 0.95), dir = V3(-0.8, 0.45, 0.32).normalize();
  if (!W.body) { W.body = squidBody(M); W.body.scale.setScalar(1.25); squidRoot.add(W.body); }
  W.body.position.copy(head).add(V3(Math.sin(T * 5) * 0.05 * wild, Math.cos(T * 4) * 0.05 * wild, 0));
  W.body.quaternion.setFromUnitVectors(V3(1, 0, 0), V3(dir.x + Math.sin(T * 2) * 0.1 * wild, dir.y, dir.z).normalize());
  const base = head.clone().add(dir.clone().multiplyScalar(-0.35));
  const g = new THREE.Group();
  [[4.6, 1.45], [4.2, 1.05], [3.7, 0.55], [3.1, 0.05], [2.6, -0.45], [4.9, 1.9]].forEach(([xe, ae], i) => {
    const a0 = 0.75 + (i - 2.5) * 0.12, pts = [base.clone().add(V3(0, (i - 2.5) * 0.06, (i - 2.5) * 0.05))];
    for (let k = 1; k <= 5; k++) {
      const t = k / 5, x = 0.45 + (xe - 0.45) * t, a = a0 + (ae - a0) * t + Math.sin(t * 5 + i + T * 2.5 * wild) * (0.08 + 0.06 * wild);
      pts.push(surf(x, a, 0.1 + 0.35 * (1 - t) * (1 - t) + 0.05 * wild * Math.sin(T * 6 + i)));
    }
    g.add(squidArm(M, pts, 0.085, 0.008, axisRef, { suckers: 34, segs: 100 }));
  });
  [[V3(-0.9, 0.9, 1.6), V3(-1.3, 0.1, 2.6), V3(-0.9, -0.5, 3.1)], [V3(-1.1, 2.4, 0.9), V3(-1.9, 2.8, 1.5), V3(-2.4, 2.4, 2.0)]].forEach((rest, i) => {
    const wob = k => V3(Math.sin(T * 3 + i + k) * 0.3, Math.cos(T * 2.6 + k) * 0.3, 0).multiplyScalar(0.4 + wild);
    const pts = [base.clone(), base.clone().add(rest[0].clone().multiplyScalar(0.45)), ...rest.map((p, k) => base.clone().add(p).add(wob(k)))];
    g.add(squidArm(M, pts, 0.085, 0.008, () => base.clone().add(V3(-2, 0, 2)), { suckers: 34, segs: 100 }));
  });
  const tA = [base.clone(), surf(1.5, 1.2, 0.35), surf(3.5, 1.45, 0.15), surf(5.8, 1.35 + 0.1 * Math.sin(T * 3), 0.1), surf(7.2, 1.05, 0.12)];
  g.add(squidArm(M, tA, 0.065, 0.012, axisRef, { club: true, suckers: 50, segs: 110 }));
  setDyn(squidRoot, 'battle', g);
}

function getAttackScene() {
  if (SC.attack) return SC.attack;
  const s = envBase(0x041c25, 0.09);
  s.add(new THREE.HemisphereLight(0x2e6f88, 0x000000, 0.25));
  const lamp = new THREE.SpotLight(0xeaf6ff, 60, 30, 0.7, 0.8, 1.3); lamp.position.set(0, -0.3, 0.2); lamp.target.position.set(0, 0, -5); s.add(lamp, lamp.target);
  const rim = new THREE.DirectionalLight(0x5fd0ff, 1.2); rim.position.set(2, 4, -6); s.add(rim);
  s.add(particles(2500, [-6, 6, -4, 4, -14, 0], 0.03, 0xd6ecf2, 0.55));
  // exterior: the sphere
  const sphere = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshPhysicalMaterial({ color: 0xc9a65a, roughness: 0.5, metalness: 0.15, clearcoat: 0.5 }));
  sphere.add(shell);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.32, 48), new THREE.MeshBasicMaterial({ color: 0xffe9c8 })); win.position.set(0, 0, 1.001); sphere.add(win);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 16, 48), new THREE.MeshPhysicalMaterial({ color: 0x4a3f22, metalness: 0.8, roughness: 0.4 })); ring.position.set(0, 0, 1.0); sphere.add(ring);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 30, 8), new THREE.MeshBasicMaterial({ color: 0x8b8d87 })); cable.position.set(0, 16, 0); sphere.add(cable);
  const sl = new THREE.PointLight(0xffe2b0, 10, 8, 1.4); sl.position.set(0, 0.4, 1.8); sphere.add(sl);
  const key2 = new THREE.SpotLight(0xdff2ff, 40, 30, 0.6, 0.8, 1.3); key2.position.set(3, 3, 6); key2.target.position.set(-1, 0, 0); s.add(key2, key2.target);
  sphere.visible = false; s.add(sphere);
  const body = squidBody(M); body.visible = false; s.add(body);
  const cam = new THREE.PerspectiveCamera(55, RW / RH, 0.02, 200);
  SC.attack = { s, sphere, body, cam, lamp, cable };
  return SC.attack;
}

// ---------------------------------------------------------------- render entry
// returns {canvas, proj} ; proj(vec3) -> [x,y] in 1920x1080 space
export function render3d(type, p, u, lt, T) {
  let scene, cam, bloom = [0.6, 0.55, 0.82];
  if (type === 'squid3d') {
    const Q = getSquidScene(); scene = Q.s; cam = Q.cam;
    const camp = p.cam;
    Q.human.visible = !!p.human; Q.xr.visible = camp === 'xray'; Q.beakG.visible = false; Q.key.intensity = camp === 'passby' ? 45 : 140;
    let pose = { amp: 0.12, speed: 1.2 };
    Q.root.position.set(0, 0, 0); Q.root.rotation.set(0, 0, 0);
    if (camp === 'passby') {
      Q.root.position.set(lerp(-9, 7, u), 0.15, -0.6); Q.root.rotation.set(0.15, 0, 0.05);
      cam.fov = 55; cam.position.set(0, 0, 2.2); cam.lookAt(0, 0, -2); pose = { amp: 0.2, speed: 2 };
      Q.key.position.set(0, -0.5, 2.5); Q.key.target.position.set(0, 0, -2);
    } else {
      Q.key.position.set(-3, 4, 7); Q.key.target.position.set(0, 0, 0);
    }
    if (camp === 'turntable') {
      const a = lerp(-0.4, 0.6, u) + (p.p ? p.p[0] : 0);
      cam.fov = 30; cam.position.set(-1 + Math.sin(a) * 10.5, 1.8, Math.cos(a) * 10.5); cam.lookAt(-1.3, -0.1, 0);
    } else if (camp === 'scale') {
      cam.fov = 20; cam.position.set(-1.3 + u * 0.4, 2.6, 19.5 - u * 0.8); cam.lookAt(-1.3 + u * 0.4, -0.7, 0);
    } else if (camp === 'armdive') {
      cam.fov = 40; const k = ease(u);
      cam.position.set(lerp(3.5, -3.6, k), lerp(1.4, 0.7, k), lerp(3.2, 1.6, k)); cam.lookAt(lerp(0, -4.6, k), 0, 0);
    } else if (camp === 'club') {
      cam.fov = 32; const a = u * 0.8;
      cam.position.set(-4.4 + Math.sin(a) * 1.4, 0.9, 0.5 + Math.cos(a) * 1.4); cam.lookAt(-4.6, 0.2, 0.3); pose = { amp: 0.05, speed: 0.8 };
    } else if (camp === 'beak') {
      const k = p.p ? lerp(p.p[0], p.p[1], u) : u;
      pose = { amp: 0.05, speed: 0.8, flower: 1, spread: 0.6 };
      cam.fov = 45; cam.position.set(lerp(-6, -1.55, ease(Math.min(1, k * 2))), 0.12, 0.25); cam.lookAt(-0.5, 0, 0); Q.key.position.set(-4, 1, 1.5); Q.key.target.position.set(0, 0, 0);
      const open = Math.max(0, (k - 0.5) * 2);
      Q.beakG.children.forEach(pv => { pv.rotation.y = pv.userData.d * (0.08 + ease(open) * 0.35 * (0.6 + 0.4 * Math.sin(lt * 4))); });
    } else if (camp === 'xray') {
      cam.fov = 28; const a = 0.3 + u * 0.3;
      cam.position.set(0.6 + Math.sin(a) * 6.5, 1.4, Math.cos(a) * 6.5); cam.lookAt(0.7, 0, 0);
      Q.hearts.forEach((h, i) => { h.visible = i < (p.hearts || 0); const pulse = 1 + 0.25 * Math.max(0, Math.sin(T * 7 + i * 1.3)); h.scale.setScalar(pulse); h.material.color.set(p.blue ? 0x4090ff : 0xff3048); });
      Q.vessels.visible = !!(p.flow || p.blue);
      Q.vessels.children.forEach((v, i) => v.material.color.set(p.blue ? 0x3aa8ff : 0xff6a80));
      pose = { amp: 0.04, speed: 0.6 };
    } else if (camp === 'still') {
      cam.fov = 30; cam.position.set(-1 + Math.sin(T * 0.05) * 0.5, 1.2, 12); cam.lookAt(-1, 0, 0); pose = { amp: 0.03, speed: 0.4 };
    }
    // ghost body for x-ray
    Q.body.traverse(o => { if (o.isMesh) { if (!o.userData.mat) o.userData.mat = o.material; o.material = camp === 'xray' ? Q.ghost : o.userData.mat; } });
    const arms = squidArms(T, pose);
    if (camp === 'xray') arms.traverse(o => { if (o.isMesh) o.material = Q.ghost; });
    setDyn(Q.root, 'arms', arms);
    cam.aspect = RW / RH; cam.updateProjectionMatrix();
  } else if (type === 'whale3d') {
    const Wh = getWhaleScene(); scene = Wh.s; cam = Wh.cam;
    const c = p.cam; Wh.ink.visible = !!p.ink;
    Wh.whale.position.set(-2.2, -0.6, 0.6); Wh.whale.rotation.set(0, 0.78, 0.13);
    Wh.squidRoot.visible = c === 'battle' || c === 'jaw';
    if (Wh.jaw) Wh.jaw.rotation.z = c === 'jaw' ? (p.snap ? lerp(0.6, 0.05, ease(u * 4)) : lerp(0.3, 0.65, ease(u))) : 0.32;
    if (c === 'emerge') {
      cam.fov = 45; cam.position.set(-9, -0.4, 7); cam.lookAt(-2.2, 0, 0.6);
      Wh.whale.position.set(lerp(3, -2.2, ease(u)), -0.6, lerp(-9, 0.6, ease(u)));
      Wh.spot.intensity = lerp(40, 100, u);
    } else if (c === 'emerge2') {
      cam.fov = 40; const k = ease(u); cam.position.set(lerp(4, 9, k), -1.0, lerp(13, 9, k)); cam.lookAt(lerp(-1, 4, k), 0.2, lerp(-2, -5, k));
    } else if (c === 'skin') {
      cam.fov = 35; const k = u * 0.6 + (p.mark === 'gouge' ? 0.3 : p.mark === 'all' ? 0.5 : 0);
      cam.position.set(lerp(-3.8, -1.0, k), 0.9, lerp(4.2, 2.0, k)); cam.lookAt(lerp(-1.2, 1.6, k), 0.4, lerp(0.5, -1.5, k));
    } else if (c === 'battle') {
      const wild = p.thrash ? 1 : 0.45, k = (p.p ? lerp(p.p[0], p.p[1], u) : u);
      cam.fov = 40; cam.position.set(4.2 - k * 1.2 + Math.sin(T * 30) * 0.03 * wild, -1.2 + k * 0.4, 14.2 - k * 2); cam.lookAt(-0.6, 0.9, -2.2);
      if (p.thrash) Wh.whale.rotation.set(Math.sin(T * 5) * 0.06, 0.78 + Math.sin(T * 3.3) * 0.12, 0.13 + Math.sin(T * 4.1) * 0.05);
      battleSquid(Wh, T, wild);
    } else if (c === 'jaw') {
      cam.fov = 38; cam.position.set(1.2, -4.6, 7.5); cam.lookAt(0.6, -1.6, -1.2);
      battleSquid(Wh, T, 0.9);
    }
    if (c !== 'emerge') Wh.spot.intensity = 100;
    Wh.glow.material.opacity = 0.35 + 0.35 * Math.abs(Math.sin(T * 0.7));
    cam.aspect = RW / RH; cam.updateProjectionMatrix(); bloom = [0.8, 0.6, 0.75];
  } else if (type === 'attack') {
    const A = getAttackScene(); scene = A.s; cam = A.cam;
    const v = p.v; const ext = ['wrap', 'cable', 'release', 'flee'].includes(v);
    A.sphere.visible = ext && v !== 'flee'; A.body.visible = ext;
    const g = new THREE.Group();
    if (!ext) {
      // interior view through the porthole, camera at origin looking -z
      cam.fov = 62; cam.position.set(0, 0, 0); cam.up.set(0, 1, 0);
      const roll = v === 'spin' ? T * 1.4 : 0, shake = v === 'rake' || v === 'strike' ? 0.02 : 0;
      cam.lookAt(Math.sin(T * 47) * shake, Math.cos(T * 39) * shake, -5); cam.rotateZ(roll);
      let k = v === 'strike' ? ease(u * 3) : v === 'slowmo' ? lerp(0.55, 0.9, u) : 1;
      const freeze = v === 'freeze' ? 0 : 1;
      const tt = v === 'freeze' ? 0 : T;
      for (const side of [-1, 1]) {
        const end = V3(side * lerp(3, 0.35, k) + (v === 'rake' ? Math.sin(T * 6) * 0.6 : 0), lerp(-2, -0.1, k) * (side > 0 ? 1 : -0.6), lerp(-12, -1.15, k));
        const pts = [V3(side * 6, -4, -14), V3(side * 3, -2, -9), end.clone().add(V3(side * 0.6, -0.3, -2)), end];
        g.add(squidArm(M, pts.map(q => q.add(V3(Math.sin(tt * 3 + side) * 0.05 * freeze, 0, 0))), 0.2, 0.07, () => V3(0, 0, 0), { club: true, suckers: 44, segs: 100 }));
      }
      if (v === 'spin' || v === 'freeze' || v === 'rake') for (let i = 0; i < 5; i++) {
        const a = i * 1.25 + tt * 0.3;
        const pts = [V3(Math.cos(a) * 4, Math.sin(a) * 3, -8), V3(Math.cos(a) * 1.4, Math.sin(a) * 1.1, -2.2), V3(Math.cos(a + 0.6) * 0.9, Math.sin(a + 0.6) * 0.7, -1.3), V3(Math.cos(a + 1.2) * 1.2, Math.sin(a + 1.2) * 0.9, -1.1)];
        g.add(squidArm(M, pts, 0.26, 0.08, () => V3(0, 0, 0), { suckers: 30, segs: 90 }));
      }
      A.lamp.intensity = 16;
    } else {
      const wrapAmt = v === 'release' ? lerp(1, 0, ease(u)) : v === 'flee' ? 0 : 1;
      cam.fov = 45; const a = 0.6 + u * 0.4;
      cam.position.set(Math.sin(a) * 5.5, 1.2, Math.cos(a) * 5.5); cam.lookAt(-0.6, 0, 0); cam.up.set(0, 1, 0);
      const headPos = v === 'flee' ? V3(lerp(-2.0, -6.5, ease(u)), lerp(0.1, 1.2, u), lerp(0.5, -3.5, ease(u))) : V3(-2.2 - (1 - wrapAmt) * 1.5, 0.1, 0);
      A.body.position.copy(headPos); A.body.rotation.set(0, Math.PI, 0); A.body.scale.setScalar(1.1);
      if (v !== 'flee') for (let i = 0; i < 8; i++) {
        const phi = (i / 8) * Math.PI * 2, pts = [headPos.clone().add(V3(0.45, 0, 0))];
        const Rr = 1.1 + (1 - wrapAmt) * 0.8 + 0.03 * Math.sin(T * 4 + i);
        for (let k2 = 1; k2 <= 6; k2++) {
          const th = 0.25 + (k2 / 6) * 2.5 * wrapAmt + 0.2 * (1 - wrapAmt) * k2 / 6;
          pts.push(V3(-Math.cos(th) * Rr, Math.sin(th) * Rr * Math.cos(phi), Math.sin(th) * Rr * Math.sin(phi)));
        }
        g.add(squidArm(M, pts, 0.15, 0.012, () => V3(0, 0, 0), { suckers: 34, segs: 100 }));
      } else {
        const arms = squidArms(T, { amp: 0.25, speed: 3, spread: 0.1 }); arms.position.copy(headPos); arms.rotation.y = Math.PI; arms.scale.setScalar(1.1); g.add(arms);
      }
      if (v === 'cable') A.sphere.position.set(Math.sin(T * 9) * 0.03, Math.sin(T * 7) * 0.03, 0); else A.sphere.position.set(0, 0, 0);
      A.sphere.rotation.z = v === 'cable' ? Math.sin(T * 2) * 0.15 : 0;
      A.lamp.intensity = 0;
    }
    setDyn(A.s, 'arms', g);
    cam.aspect = RW / RH; cam.updateProjectionMatrix(); bloom = [0.7, 0.55, 0.78];
  }
  bloomPass.strength = bloom[0]; bloomPass.radius = bloom[1]; bloomPass.threshold = bloom[2];
  renderPass.scene = scene; renderPass.camera = cam;
  composer.render();
  const proj = v => { const q = v.clone().project(cam); return [(q.x + 1) / 2 * 1920, (1 - q.y) / 2 * 1080]; };
  return { canvas: renderer.domElement, proj };
}
export { V3 };
