import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { V3, R, setSeed, squidMaterials, squidBody, squidArm, squidFull, spermWhale, particles, beam } from './lib.js';
import { overlay } from './overlay.js';

const W = 1920, H = 1080;
const SCENE = new URLSearchParams(location.search).get('scene') || 'scale';
setSeed({ scale: 11, battle: 23, hero: 37 }[SCENE] || 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('gl').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 400);
let bloom = { strength: 0.7, radius: 0.55, threshold: 0.55 };
const proj = p => { const v = p.clone().project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };

// ============================================================ SCALE
function buildScale() {
  scene.background = new THREE.Color(0x041722);
  scene.fog = new THREE.FogExp2(0x041722, 0.012);
  camera.fov = 20; camera.position.set(-1.3, 2.6, 19.5); camera.lookAt(-1.3, -0.7, 0); camera.updateProjectionMatrix();

  scene.add(new THREE.HemisphereLight(0x7fb8d0, 0x0a0303, 0.7));
  const key = new THREE.DirectionalLight(0xfff1e6, 3.2); key.position.set(-4, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fd8ff, 4.5); rim.position.set(3, 4, -8); scene.add(rim);
  const under = new THREE.DirectionalLight(0xff5a3a, 0.6); under.position.set(0, -6, 3); scene.add(under);

  const M = squidMaterials();
  const sq = squidFull(M, { spread: 0.34, curl: 0.14, tentLen: 1.4, droop: -0.1 });
  sq.rotation.x = 0.12; scene.add(sq);

  // human, 1.8 m
  const hm = new THREE.MeshBasicMaterial({ color: 0x4f7f8c });
  const human = new THREE.Group();
  const cap = (r, l, x, y, rz = 0) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 16), hm); m.position.set(x, y, 0); m.rotation.z = rz; human.add(m); };
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), hm); head.position.y = 1.67; human.add(head);
  cap(0.17, 0.42, 0, 1.25); cap(0.07, 0.7, -0.1, 0.42); cap(0.07, 0.7, 0.1, 0.42);
  cap(0.05, 0.55, -0.27, 1.2, -0.12); cap(0.05, 0.55, 0.27, 1.2, 0.12);
  human.position.set(1.3, -3.05, 0); scene.add(human);

  scene.add(particles(5000, [-16, 12, -6, 7, -10, 6], 0.05, 0xcfe8f0, 0.5));
  scene.add(particles(300, [-16, 12, -6, 7, -4, 10], 0.16, 0xcfe8f0, 0.25));
  // god rays
  for (let i = 0; i < 6; i++) {
    const x = R(-10, 6); scene.add(beam(V3(x, 14, -8), V3(x + R(-3, 3), -8, -6), R(1.5, 3), 0.07, 0x7fc6dd));
  }

  bloom = { strength: 0.5, radius: 0.5, threshold: 0.85 };
  const tentTip = V3(-0.38 - 3.6 * 1.4 * 0.86, 0.15, -0.3);
  return () => overlay.scale({
    proj, eye: proj(V3(-0.02, 0.12, 0.4)), club: proj(tentTip), mantle: proj(V3(1.6, 0.62, 0.3)),
    human: proj(V3(1.3, -1.1, 0)),
    x0: proj(V3(-5.6, -3.3, 0)), x1: proj(V3(2.8, -3.3, 0)), meters: 8.4,
  });
}

// ============================================================ BATTLE
function buildBattle() {
  scene.background = new THREE.Color(0x01070b);
  scene.fog = new THREE.FogExp2(0x01090e, 0.028);
  camera.fov = 40; camera.position.set(4.2, -1.2, 14.2); camera.lookAt(-0.6, 0.9, -2.2); camera.updateProjectionMatrix();

  scene.add(new THREE.HemisphereLight(0x3d7f99, 0x000000, 0.35));
  const top = new THREE.DirectionalLight(0x7fdcff, 2.2); top.position.set(2, 12, -4); scene.add(top);
  const sub = V3(-3.6, -3.4, 7.5);
  const spot = new THREE.SpotLight(0xe8f6ff, 120, 40, 0.55, 0.8, 1.4);
  spot.position.copy(sub); spot.target.position.set(-1.8, 0.8, 0.0); scene.add(spot, spot.target);
  const warm = new THREE.PointLight(0xffd2b8, 40, 9, 1.4); warm.position.set(-2.5, 3.5, 4.5); scene.add(warm);

  const whale = spermWhale();
  whale.position.set(-2.2, -0.6, 0.6); whale.rotation.set(0, 0.78, 0.13);
  scene.add(whale);
  const surf = whale.userData.surface;

  // squid attached at the front-top of the head (whale-local coords)
  const M = squidMaterials();
  const head = surf(0.45, 0.45, 0.95);
  const dir = V3(-0.8, 0.45, 0.32).normalize();
  const body = squidBody(M);
  body.position.copy(head); body.quaternion.setFromUnitVectors(V3(1, 0, 0), dir); body.scale.setScalar(1.25);
  whale.add(body);
  const base = head.clone().add(dir.clone().multiplyScalar(-0.35));
  const axisRef = P => V3(P.x, 0, 0);

  const wraps = [
    [4.6, 1.45], [4.2, 1.05], [3.7, 0.55], [3.1, 0.05], [2.6, -0.45], [4.9, 1.9],
  ];
  wraps.forEach(([xe, ae], i) => {
    const a0 = 0.75 + (i - 2.5) * 0.12;
    const pts = [base.clone().add(V3(0, (i - 2.5) * 0.06, (i - 2.5) * 0.05))];
    for (let k = 1; k <= 5; k++) {
      const t = k / 5;
      const x = 0.45 + (xe - 0.45) * t, a = a0 + (ae - a0) * t + Math.sin(t * 5 + i) * 0.08;
      pts.push(surf(x, a, 0.1 + 0.35 * (1 - t) * (1 - t)));
    }
    whale.add(squidArm(M, pts, 0.085, 0.008, axisRef, { suckers: 40 }));
  });
  // two free arms flailing toward camera / outward
  [[V3(-0.9, 0.9, 1.6), V3(-1.3, 0.1, 2.6), V3(-0.9, -0.5, 3.1)], [V3(-1.1, 2.4, 0.9), V3(-1.9, 2.8, 1.5), V3(-2.4, 2.4, 2.0)]].forEach((rest, i) => {
    const pts = [base.clone(), base.clone().add(rest[0].clone().multiplyScalar(0.45)), ...rest.map(p => base.clone().add(p))];
    whale.add(squidArm(M, pts, 0.085, 0.008, P => base.clone().add(V3(-2, 0, 2)), { suckers: 40 }));
  });
  // tentacles: one raking over the head, one coiling in front of the lens with hooks visible
  const tA = [base.clone(), surf(1.5, 1.2, 0.35), surf(3.5, 1.45, 0.15), surf(5.8, 1.35, 0.1), surf(7.2, 1.05, 0.12)];
  whale.add(squidArm(M, tA, 0.065, 0.012, axisRef, { club: true, suckers: 60 }));
  const tB = [base.clone(), base.clone().add(V3(-0.6, -0.4, 1.0)), base.clone().add(V3(-1.2, -1.6, 2.1)), base.clone().add(V3(-0.4, -2.6, 2.9)), base.clone().add(V3(0.6, -2.4, 3.3)), base.clone().add(V3(0.9, -1.6, 3.4))];
  whale.add(squidArm(M, tB, 0.065, 0.012, P => base.clone().add(V3(1, -1.5, 1)), { club: true, suckers: 60 }));

  // bioluminescent wake, snow, ink
  const glowPts = particles(1400, [-1, 20, -3, 4, -8, 3], 0.09, 0x55ffd5, 0.85); glowPts.position.set(0, 0, 0); scene.add(glowPts);
  scene.add(particles(6000, [-14, 14, -8, 8, -14, 9], 0.045, 0xd6ecf2, 0.55));
  const ink = particles(220, [-5.5, -1.5, -2.5, 1.0, 0.5, 4.5], 1.6, 0x050208, 0.5, false); scene.add(ink);

  scene.add(beam(sub, V3(-1.8, 0.8, 0.0), 3.4, 0.22));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); lamp.position.copy(sub); scene.add(lamp);
  bloom = { strength: 0.9, radius: 0.6, threshold: 0.72 };
  return () => overlay.battle();
}

// ============================================================ HERO
function buildHero() {
  scene.background = new THREE.Color(0x010508);
  scene.fog = new THREE.FogExp2(0x010608, 0.06);
  camera.fov = 38; camera.position.set(-0.4, 0.35, 4.6); camera.lookAt(0.4, 0.05, 0); camera.updateProjectionMatrix();

  scene.add(new THREE.HemisphereLight(0x3d7f99, 0x000000, 0.25));
  const sub = V3(-3.2, -1.6, 5);
  const spot = new THREE.SpotLight(0xe8f6ff, 170, 30, 0.38, 0.7, 1.5);
  spot.position.copy(sub); spot.target.position.set(0.3, 0.1, 0); scene.add(spot, spot.target);
  const rim = new THREE.DirectionalLight(0x6fd8ff, 1.8); rim.position.set(2, 3, -5); scene.add(rim);

  const M = squidMaterials();
  const sq = squidFull(M, { spread: 0.75, curl: 0.45, armLen: 1.0, tentLen: 0.9, tentY: 0.4 });
  sq.rotation.set(0.05, Math.PI / 2 + 0.55, 0.12); sq.position.set(0.9, 0, -0.6);
  scene.add(sq);

  scene.add(particles(4000, [-5, 5, -3, 3, -4, 4], 0.025, 0xd6ecf2, 0.6));
  scene.add(particles(120, [-5, 5, -3, 3, -1, 3.5], 0.09, 0xd6ecf2, 0.35));
  scene.add(beam(sub, V3(0.6, 0.1, -0.4), 2.6, 0.22));
  bloom = { strength: 0.7, radius: 0.6, threshold: 0.8 };
  return () => overlay.hero();
}

const after = ({ scale: buildScale, battle: buildBattle, hero: buildHero })[SCENE]();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom.strength, bloom.radius, bloom.threshold));
composer.addPass(new OutputPass());
composer.render();
await document.fonts.ready;
after();
window.__done = true;
