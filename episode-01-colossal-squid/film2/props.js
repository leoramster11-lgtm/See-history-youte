// Every object in the film, modeled procedurally in 3D. Scale: 1 unit = 1 meter.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { V3, hash, lerp, clamp, beam } from './world.js';
import { setSeed, R, rnd, squidMaterials, squidBody, squidArm, spermWhale, taperedTube, bodyGeometry, eyeTexture } from '../render3d/lib.js';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
const phys = (o) => new THREE.MeshPhysicalMaterial(o);
const std = (o) => new THREE.MeshStandardMaterial(o);
export const P = {}; // all props
export let SM; // squid materials

// ------------------------------------------------------------------ textures
function noiseTex(w, h, base, spots, n = 4000, rmax = 4) {
  const [c, x] = canvas(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) { x.fillStyle = spots[i % spots.length]; x.globalAlpha = 0.05 + hash(i) * 0.25; x.beginPath(); x.arc(hash(i * 1.3) * w, hash(i * 2.7) * h, 0.5 + hash(i * 3.1) * rmax, 0, 7); x.fill(); }
  x.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function screenTex(w = 512, h = 320) { const [c] = canvas(w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.c = c; return t; }

// ------------------------------------------------------------------ YOU: one-person submersible (forward = +X, length ≈ 4 m)
function makeSub() {
  const g = new THREE.Group();
  const yellow = phys({ color: 0xe8a21a, roughness: 0.42, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const dark = phys({ color: 0x1c2024, roughness: 0.5, metalness: 0.6 });
  const steel = phys({ color: 0x9aa3a8, roughness: 0.35, metalness: 0.9 });
  // pontoons
  for (const z of [-0.78, 0.78]) {
    const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 2.9, 12, 24), yellow); p.rotation.z = Math.PI / 2; p.position.set(-0.2, -0.15, z); g.add(p);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.12, 24), dark); stripe.rotation.z = Math.PI / 2; stripe.position.set(0.6, -0.15, z); g.add(stripe);
  }
  // top fairing
  const top = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.5, 1.2, 4, 0.22), yellow); top.position.set(-0.8, 0.45, 0); g.add(top);
  // frame
  for (const z of [-0.5, 0.5]) for (const x of [-1.6, 0, 1.0]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), dark); b.position.set(x, 0.05, z); g.add(b); }
  const skid = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 3.4, 4, 8), steel); skid.rotation.z = Math.PI / 2;
  for (const z of [-0.55, 0.55]) { const s = skid.clone(); s.position.set(-0.1, -0.7, z); g.add(s); }
  // pressure hull behind the dome
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.9, 40), phys({ color: 0x2a2f33, roughness: 0.35, metalness: 0.85 })); hull.rotation.z = Math.PI / 2; hull.position.set(0.25, 0.1, 0); g.add(hull);
  // acrylic dome (front)
  const domeMat = phys({ color: 0xbfeaff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.18, clearcoat: 1, clearcoatRoughness: 0, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.78, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), domeMat); dome.rotation.z = -Math.PI / 2; dome.position.set(0.68, 0.1, 0); g.add(dome);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.06, 12, 48), steel); ring.rotation.y = Math.PI / 2; ring.position.set(0.62, 0.1, 0); g.add(ring);
  // pilot inside
  const skin = phys({ color: 0x8a6550, roughness: 0.6 }), suit = phys({ color: 0x1d3c52, roughness: 0.7 });
  const pilot = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 6, 12), suit); torso.position.set(0, 0, 0); pilot.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), skin); head.position.set(0.03, 0.34, 0); pilot.add(head);
  const set = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.018, 8, 24, Math.PI), dark); set.position.set(0.03, 0.36, 0); set.rotation.y = Math.PI / 2; pilot.add(set);
  for (const z of [-0.16, 0.16]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.26, 4, 8), suit); arm.position.set(0.16, 0.0, z); arm.rotation.z = -1.2; pilot.add(arm); }
  pilot.position.set(0.55, 0.0, 0); g.add(pilot);
  // console screen inside
  const scr = screenTex(); const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false }));
  screen.position.set(0.95, -0.12, 0); screen.rotation.y = -Math.PI / 2; screen.rotation.x = 0.0; g.add(screen);
  // lamps bar + thrusters
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const lampsOn = [], beams = [], spots = [];
  [[-0.62, 0.55], [0.62, 0.55], [-0.85, -0.35], [0.85, -0.35]].forEach(([z, y], i) => {
    const hou = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 16), dark); hou.rotation.z = Math.PI / 2; hou.position.set(1.15, y, z); g.add(hou);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), lampMat); lens.position.set(1.245, y, z); lens.rotation.y = Math.PI / 2; g.add(lens); lampsOn.push(lens);
    if (i < 2) {
      const sp = new THREE.SpotLight(0xeaf6ff, 0, 60, 0.42, 0.75, 1.2); sp.position.set(1.3, y, z); sp.target.position.set(8, y - 0.6, z * 3); g.add(sp, sp.target); spots.push(sp);
      const bm = beam(26, 5.5); bm.position.set(1.3, y, z); bm.lookAt(V3(8, y - 0.6, z * 3)); g.add(bm); beams.push(bm);
    }
  });
  const props = [];
  for (const [x, y, z, rx] of [[-2.0, -0.15, -0.78, 0], [-2.0, -0.15, 0.78, 0], [-0.8, 0.8, 0, 1]]) {
    const duct = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 10, 24), dark); duct.position.set(x, y, z);
    if (rx) duct.rotation.x = Math.PI / 2; else duct.rotation.y = Math.PI / 2; g.add(duct);
    const pr = new THREE.Group(); for (let k = 0; k < 4; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 0.07), steel); bl.rotation.x = k * Math.PI / 4; pr.add(bl); }
    pr.position.set(x, y, z); if (rx) pr.rotation.z = Math.PI / 2; g.add(pr); props.push({ pr, rx });
  }
  // manipulator arm
  const arm = new THREE.Group(); const a1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 10), steel); a1.position.y = -0.3; arm.add(a1);
  const a2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), steel); a2.position.set(0.2, -0.6, 0); a2.rotation.z = 1.0; arm.add(a2);
  arm.position.set(1.0, -0.35, -0.3); g.add(arm);
  // cable (from top)
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 60, 6), phys({ color: 0x6d6f6a, roughness: 0.7 })); cable.position.set(-0.6, 30.7, 0); g.add(cable);
  // strobe
  const strobe = new THREE.PointLight(0xffffff, 0, 40, 1.2); strobe.position.set(1.5, 0.3, 0); g.add(strobe);
  const inner = new THREE.PointLight(0xffd8b0, 1.2, 2.5, 1.5); inner.position.set(0.7, 0.2, 0); g.add(inner);
  g.userData = { dome, domeMat, pilot, screen: scr, lampsOn, beams, spots, props, arm, cable, strobe, inner, lampMat };
  return g;
}
export function subLights(on, T = 0, flick = 0, bI = 0.22) {
  const u = P.sub.userData;
  const f = on * (1 - flick * (Math.sin(T * 61) > 0.3 ? 0.7 : 0));
  u.spots.forEach(s => (s.intensity = 150 * f)); u.beams.forEach(b => (b.userData.mat.uniforms.uI.value = bI * f, b.userData.mat.uniforms.uTime.value = T, b.visible = f > 0.01));
  u.lampMat.color.setScalar(0.15 + 0.85 * f);
}
export function subBeams() { // world-space beam origins/directions for snow lighting
  const u = P.sub.userData; P.sub.updateMatrixWorld(true);
  return u.spots.map(s => { const o = new THREE.Vector3(), t = new THREE.Vector3(); s.getWorldPosition(o); s.target.getWorldPosition(t); return { o, d: t.sub(o).normalize() }; });
}
export function subAnimate(T, thrust = 1) { P.sub.userData.props.forEach(({ pr, rx }, i) => { if (rx) pr.rotation.y = T * 14 * thrust; else pr.rotation.x = T * 18 * thrust + i; }); }

// ------------------------------------------------------------------ ocean surface with Gerstner waves (seen from above)
const WAVES = [[0.9, 0.2, 60, 0.42], [0.3, 0.9, 31, 0.3], [-0.6, 0.5, 18, 0.2], [0.8, -0.4, 9, 0.12]]; // dirx, dirz, wavelength, steep
export let waveAmp = 1;
export function setWaveAmp(a) { waveAmp = a; P.ocean.material.uniforms.uAmp.value = a; }
export function waveH(x, z, T) {
  let y = 0;
  for (const [dx, dz, L, s] of WAVES) { const k = 2 * Math.PI / L, c = Math.sqrt(9.8 / k), d = Math.hypot(dx, dz); const f = k * ((dx * x + dz * z) / d - c * T); y += (s / k) * Math.sin(f) * waveAmp * 0.55; }
  return y;
}
function makeOcean() {
  const geo = new THREE.PlaneGeometry(900, 900, 300, 300); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uAmp: { value: 1 }, uSky: { value: new THREE.Color(0x2a3c4a) }, uDeep: { value: new THREE.Color(0x020b10) }, uLight: { value: V3(-0.3, 0.6, -0.7) }, uFlash: { value: 0 } }]),
    vertexShader: `
      #include <fog_pars_vertex>
      uniform float uTime, uAmp; varying vec3 vW; varying vec3 vN; varying float vFoam;
      vec3 gw(vec2 dir, float L, float s, vec3 p, inout vec3 tan, inout vec3 bin){
        float k = 6.2831/L; float c = sqrt(9.8/k); vec2 d = normalize(dir); float f = k*(dot(d,p.xz) - c*uTime); float a = (s/k)*uAmp*0.55;
        tan += vec3(-d.x*d.x*(s*uAmp*0.55*sin(f)), d.x*(s*uAmp*0.55*cos(f)), -d.x*d.y*(s*uAmp*0.55*sin(f)));
        bin += vec3(-d.x*d.y*(s*uAmp*0.55*sin(f)), d.y*(s*uAmp*0.55*cos(f)), -d.y*d.y*(s*uAmp*0.55*sin(f)));
        return vec3(d.x*a*cos(f), a*sin(f), d.y*a*cos(f));
      }
      void main(){ vec3 p = position; vec3 tan = vec3(1,0,0), bin = vec3(0,0,1); vec3 o = vec3(0.);
        o += gw(vec2(0.9,0.2), 60., 0.42, p, tan, bin); o += gw(vec2(0.3,0.9), 31., 0.3, p, tan, bin); o += gw(vec2(-0.6,0.5), 18., 0.2, p, tan, bin); o += gw(vec2(0.8,-0.4), 9., 0.12, p, tan, bin); o += gw(vec2(-0.2,-0.9), 4.3, 0.08, p, tan, bin);
        p.y += o.y; p.xz += o.xz*0.6; vN = normalize(cross(bin, tan)); vFoam = smoothstep(2.6*uAmp, 3.6*uAmp, o.y);
        vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <fog_pars_fragment>
      uniform vec3 uSky, uDeep, uLight; uniform float uTime, uFlash; varying vec3 vW; varying vec3 vN; varying float vFoam;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5); }
      void main(){ vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN + 0.06*vec3(sin(vW.x*1.7+uTime*2.), 0., cos(vW.z*1.9-uTime*1.7)));
        float fr = pow(1. - max(dot(N, V), 0.), 4.0);
        vec3 col = mix(uDeep, uSky, fr*0.9);
        vec3 H = normalize(normalize(uLight) + V); col += vec3(0.6,0.7,0.75) * pow(max(dot(N,H),0.), 120.) * 0.6;
        float streak = 0.5+0.5*sin(vW.x*2.3+sin(vW.z*1.7)*2.0+uTime*0.7); float foam = vFoam * (0.4 + 0.6*hs(floor(vW.xz*4.))) * (0.6+0.4*streak);
        col = mix(col, vec3(0.42,0.5,0.55), foam*0.55);
        col += uFlash*0.3;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; return m;
}

// ------------------------------------------------------------------ research ship (bow = +X, ~60 m)
function makeShip(o = {}) {
  const g = new THREE.Group(); const L = o.L ?? 60, B = L * 0.2;
  const hullCol = o.hull ?? 0x8b1f1f;
  const s = new THREE.Shape();
  s.moveTo(-L / 2, -B / 2); s.lineTo(L * 0.25, -B / 2); s.quadraticCurveTo(L * 0.45, -B * 0.4, L / 2, 0); s.quadraticCurveTo(L * 0.45, B * 0.4, L * 0.25, B / 2); s.lineTo(-L / 2, B / 2); s.lineTo(-L / 2, -B / 2);
  const hg = new THREE.ExtrudeGeometry(s, { depth: L * 0.12, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 24 });
  hg.rotateX(-Math.PI / 2); hg.translate(0, -L * 0.07, 0);
  const pos = hg.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), x = pos.getX(i); if (y < -L * 0.03) { pos.setZ(i, pos.getZ(i) * 0.75); } if (x > L * 0.3) pos.setY(i, y + (x - L * 0.3) * 0.12 * (y > 0 ? 1 : 0.3)); }
  hg.computeVertexNormals();
  g.add(new THREE.Mesh(hg, phys({ color: hullCol, roughness: 0.55, metalness: 0.3, clearcoat: 0.3 })));
  const wl = new THREE.Mesh(new THREE.BoxGeometry(L * 0.98, 0.6, B * 0.995), phys({ color: 0x111111, roughness: 0.6 })); wl.position.y = -L * 0.06; g.add(wl);
  const white = phys({ color: 0xd8dcdc, roughness: 0.5, metalness: 0.1 });
  const win = new THREE.MeshBasicMaterial({ color: 0x8a6a40, toneMapped: false });
  const deckY = L * 0.05;
  const blocks = o.small ? [[L * 0.12, deckY + 2, 0, L * 0.18, 4, B * 0.6]] : [[L * 0.12, deckY + 2.5, 0, L * 0.3, 5, B * 0.7], [L * 0.16, deckY + 6.5, 0, L * 0.18, 3.5, B * 0.6], [L * 0.18, deckY + 9.2, 0, L * 0.1, 2.4, B * 0.5]];
  blocks.forEach(([x, y, z, w, h, d]) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.3), white); b.position.set(x, y, z); g.add(b);
    for (let k = 0; k < Math.floor(w / 1.6); k++) for (const sz of [-1, 1]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), win); wn.position.set(x - w / 2 + 0.9 + k * 1.6, y + h * 0.15, sz * (d / 2 + 0.02)); wn.rotation.y = sz > 0 ? 0 : Math.PI; g.add(wn); }
    const front = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.6, h * 0.18), win); front.position.set(x + w / 2 + 0.02, y + h * 0.18, 0); front.rotation.y = Math.PI / 2; g.add(front);
  });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 12, 10), white); mast.position.set(L * 0.2, deckY + 16, 0); g.add(mast);
  const ml = new THREE.PointLight(0xffe0b0, 25, 40, 1.6); ml.position.set(L * 0.2, deckY + 22, 0); g.add(ml);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), win); top.position.copy(ml.position); g.add(top);
  // stern A-frame crane
  const af = new THREE.Group(); const orange = phys({ color: 0xd9761a, roughness: 0.5, metalness: 0.3 });
  for (const z of [-B * 0.35, B * 0.35]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 0.8), orange); leg.position.set(0, 6, z); af.add(leg); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, B * 0.78), orange); bar.position.y = 12; af.add(bar);
  af.scale.setScalar(L / 60); af.position.set(-L / 2 + 2, deckY, 0); af.rotation.z = 0.35; g.add(af);
  const deckLights = [];
  for (let k = 0; k < (o.small ? 2 : 4); k++) { const dl = new THREE.SpotLight(0xffe6c0, 60, 40, 0.8, 0.7, 1.5); dl.position.set(-L * 0.35 + k * 8, deckY + 8, 0); dl.target.position.set(-L * 0.35 + k * 8 - 4, 0, 0); g.add(dl, dl.target); deckLights.push(dl); }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(L * 0.92, 0.3, B * 0.96), phys({ color: 0x3a3f44, roughness: 0.8 })); deck.position.set(-L * 0.03, deckY + 0.15, 0); g.add(deck);
  g.userData = { af, deckY, L, B, deckLights };
  return g;
}

// ------------------------------------------------------------------ simple human (mannequin) ~1.8 m
function makeHuman(color = 0x3f6d79, emissive = 0) {
  const m = phys({ color, roughness: 0.6, emissive, emissiveIntensity: emissive ? 0.4 : 0 });
  const g = new THREE.Group();
  const cap = (r, l, x, y, rz = 0) => { const k = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 16), m); k.position.set(x, y, 0); k.rotation.z = rz; g.add(k); };
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), m); head.position.y = 1.67; g.add(head);
  cap(0.17, 0.42, 0, 1.25); cap(0.07, 0.7, -0.1, 0.42); cap(0.07, 0.7, 0.1, 0.42); cap(0.05, 0.55, -0.27, 1.2, -0.12); cap(0.05, 0.55, 0.27, 1.2, 0.12);
  return g;
}
// scuba diver (horizontal, facing +X)
function makeDiver() {
  const g = new THREE.Group(); const suit = phys({ color: 0x15191d, roughness: 0.6 }), tank = phys({ color: 0xdadfe2, roughness: 0.3, metalness: 0.5 }), fin = phys({ color: 0xf2c500, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.75, 8, 16), suit); body.rotation.z = Math.PI / 2; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), suit); head.position.set(0.62, 0.05, 0); g.add(head);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.16), phys({ color: 0x80d0ff, roughness: 0.1, metalness: 0.4 })); mask.position.set(0.72, 0.07, 0); g.add(mask);
  const tk = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 6, 12), tank); tk.rotation.z = Math.PI / 2; tk.position.set(0.05, 0.22, 0); g.add(tk);
  for (const z of [-0.08, 0.08]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.6, 6, 10), suit); leg.rotation.z = Math.PI / 2; leg.position.set(-0.75, 0, z); g.add(leg);
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.16), fin); f.position.set(-1.25, 0, z); g.add(f); g.userData['fin' + (z > 0 ? 1 : 0)] = f;
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.45, 6, 10), suit); arm.rotation.z = Math.PI / 2 - 0.3; arm.position.set(0.55, -0.12, z * 2.2); g.add(arm);
  }
  const torch = new THREE.SpotLight(0xffffff, 40, 20, 0.35, 0.6, 1.4); torch.position.set(0.85, -0.12, 0.18); torch.target.position.set(5, -0.6, 0.2); g.add(torch, torch.target);
  return g;
}

// ------------------------------------------------------------------ hero eye (radius 1)
function makeEye() {
  const g = new THREE.Group();
  const [c, x] = canvas(1024, 1024);
  // iris: radial fibers, teal/gold
  const cx = 512; x.fillStyle = '#05080a'; x.fillRect(0, 0, 1024, 1024);
  const rg = x.createRadialGradient(cx, cx, 60, cx, cx, 500); rg.addColorStop(0, '#0d2f36'); rg.addColorStop(0.5, '#2f6a72'); rg.addColorStop(0.8, '#123036'); rg.addColorStop(1, '#030506');
  x.fillStyle = rg; x.beginPath(); x.arc(cx, cx, 500, 0, 7); x.fill();
  for (let i = 0; i < 2600; i++) { const a = hash(i) * 6.283, r0 = 120 + hash(i * 2) * 120, r1 = r0 + 80 + hash(i * 3) * 300; x.strokeStyle = hash(i * 5) > 0.6 ? `rgba(220,180,110,${0.05 + hash(i * 7) * 0.18})` : `rgba(140,220,225,${0.05 + hash(i * 7) * 0.25})`; x.lineWidth = 1 + hash(i * 11) * 2.5; x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cx + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a + 0.03) * r1, cx + Math.sin(a + 0.03) * r1); x.stroke(); }
  x.strokeStyle = 'rgba(120,240,240,.35)'; x.lineWidth = 10; x.beginPath(); x.arc(cx, cx, 470, 0, 7); x.stroke();
  const irisTex = new THREE.CanvasTexture(c); irisTex.colorSpace = THREE.SRGBColorSpace;
  const iris = new THREE.Mesh(new THREE.CircleGeometry(0.86, 96), phys({ map: irisTex, roughness: 0.4, emissive: 0x0b3236, emissiveIntensity: 0.6, emissiveMap: irisTex }));
  iris.position.z = 0.82; g.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.42, 96), new THREE.MeshBasicMaterial({ color: 0x000000 })); pupil.position.z = 0.83; g.add(pupil);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), phys({ color: 0x0a0d0f, roughness: 0.3 })); ball.scale.z = 0.85; g.add(ball);
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(1.02, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.42), phys({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0, clearcoat: 1, clearcoatRoughness: 0, depthWrite: false, specularIntensity: 1 }));
  cornea.rotation.x = Math.PI / 2; cornea.scale.z = 0.9; g.add(cornea);
  // skin around (big curved surface with a socket)
  const sk = SM.body.clone(); sk.map = SM.body.map.clone(); sk.map.repeat.set(3, 3); sk.map.needsUpdate = true; sk.bumpMap = SM.body.bumpMap.clone(); sk.bumpMap.repeat.set(3, 3); sk.bumpMap.needsUpdate = true; sk.side = THREE.DoubleSide;
  const sg = new THREE.RingGeometry(1.05, 9, 128, 32); const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) { const px = sp.getX(i), py = sp.getY(i), r = Math.hypot(px, py); sp.setZ(i, 0.55 * Math.exp(-Math.pow((r - 1.35) / 0.35, 2)) - 0.04 * r * r + 0.25); }
  sg.computeVertexNormals();
  const skin = new THREE.Mesh(sg, sk); g.add(skin);
  // eyelid (iris-like closing shutters)
  const lidU = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), sk); lidU.rotation.x = Math.PI / 2; g.add(lidU);
  const lidD = lidU.clone(); g.add(lidD);
  // photophores below
  const glows = [];
  for (let k = 0; k < 5; k++) { const ph = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: 0x7ff0ff, toneMapped: false })); const a = -Math.PI / 2 - 0.7 + k * 0.35; ph.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0.42); g.add(ph); glows.push(ph); }
  const gl = new THREE.PointLight(0x6fe8ff, 0, 4, 1.5); gl.position.set(0, -1.7, 1); g.add(gl);
  g.userData = { iris, pupil, lidU, lidD, glows, gl, skin };
  return g;
}
export function eyeSet(open, pupil, glow = 0) {
  const u = P.eye.userData; const o = clamp(open);
  u.lidU.rotation.set(-lerp(0, Math.PI / 2, o), 0, 0); u.lidD.rotation.set(Math.PI + lerp(0, Math.PI / 2, o), 0, 0);
  u.pupil.scale.setScalar(lerp(0.3, 1.0, pupil)); u.glows.forEach((g, i) => g.material.color.setRGB(0.5 * glow, 0.94 * glow, 1 * glow)); u.gl.intensity = glow * 6;
}

// ------------------------------------------------------------------ beak (parrot-like, two mandibles), ~12 cm
function makeBeak() {
  const g = new THREE.Group();
  const mk = (pts, depth, flip) => {
    const s = new THREE.Shape(); s.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i += 3) s.bezierCurveTo(...pts[i], ...pts[i + 1], ...pts[i + 2]);
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.35, bevelSize: 0.012, bevelSegments: 6, curveSegments: 48, steps: 6 });
    geo.translate(0, 0, -depth / 2);
    const p = geo.attributes.position, col = [];
    let minX = 1e9, maxX = -1e9; for (let i = 0; i < p.count; i++) { minX = Math.min(minX, p.getX(i)); maxX = Math.max(maxX, p.getX(i)); }
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) - minX) / (maxX - minX); // 0 base .. 1 tip
      p.setZ(i, p.getZ(i) * lerp(1.25, 0.18, Math.pow(u, 0.8)));
      const c = lerp(0.22, 0.015, Math.pow(u, 0.5)); col.push(c * 1.0, c * 0.6, c * 0.32);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    return new THREE.Mesh(geo, phys({ vertexColors: true, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.97 }));
  };
  // upper: big hooked hood (tip at +x, curving down)
  const up = mk([[-0.06, 0.0], [-0.06, 0.05], [0.0, 0.075], [0.05, 0.06], [0.085, 0.045], [0.1, 0.0], [0.092, -0.035], [0.075, -0.012], [0.055, 0.0], [0.03, 0.005], [0.0, 0.01], [-0.03, 0.0], [-0.06, 0.0]], 0.07);
  // lower: shorter, curving up, sits below
  const lo = mk([[-0.05, 0.0], [-0.05, -0.05], [0.0, -0.065], [0.04, -0.05], [0.07, -0.035], [0.08, 0.0], [0.072, 0.018], [0.06, 0.0], [0.045, -0.012], [0.02, -0.018], [0.0, -0.012], [-0.03, -0.005], [-0.05, 0.0]], 0.075);
  const pu = new THREE.Group(); pu.add(up); const pl = new THREE.Group(); pl.add(lo); pl.position.y = -0.006;
  g.add(pu, pl);
  // buccal mass (fleshy surround)
  const flesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 32, 24), SM.body); flesh.scale.set(0.8, 1, 1); flesh.position.x = -0.06; g.add(flesh);
  g.userData = { pu, pl };
  return g;
}
export function beakOpen(a) { const u = P.beak.userData; u.pu.rotation.z = a * 0.35; u.pl.rotation.z = -a * 0.45; }

// ------------------------------------------------------------------ hook (swiveling claw)
function hookGeo() {
  const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10, a = t * 2.3; pts.push(V3(Math.sin(a) * 0.5, (1 - Math.cos(a)) * 0.5 * 0.0 + t * 0.9 - Math.pow(t, 3) * 0.2, 0).add(V3(0, 0, 0))); }
  const pts2 = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts2.push(V3(Math.sin(t * 2.6) * 0.38, t * 0.75 + Math.sin(t * Math.PI) * 0.05, 0)); }
  return taperedTube(pts2, t => lerp(0.1, 0.006, Math.pow(t, 0.8)), 40, 12).geo;
}
function makeClub() {
  const g = new THREE.Group();
  const stalk = []; for (let k = 0; k <= 8; k++) { const t = k / 8; stalk.push(V3(t * 3.2, Math.sin(t * 2) * 0.15, 0)); }
  const rf = t => 0.16 + 0.1 * Math.sin(clamp((t - 0.3) / 0.7) * Math.PI);
  const { geo, curve } = taperedTube(stalk, rf, 140, 24); g.add(new THREE.Mesh(geo, SM.arm));
  const hg = hookGeo(), hooks = [], collarG = new THREE.TorusGeometry(0.07, 0.03, 8, 20);
  const hookMat = phys({ color: 0xf1e3c8, roughness: 0.25, clearcoat: 1 }), collarMat = phys({ color: 0x8a4a3c, roughness: 0.5 });
  const Pt = new THREE.Vector3(), Tg = new THREE.Vector3();
  for (let k = 0; k < 24; k++) {
    const t = 0.35 + (k >> 1) / 12 * 0.6, side = k % 2 ? 1 : -1;
    curve.getPointAt(t, Pt); curve.getTangentAt(t, Tg);
    const r = rf(t);
    const base = new THREE.Group(); base.position.copy(Pt).add(V3(0, -r * 0.75, side * r * 0.45));
    const n = V3(0, -1, side * 0.5).normalize(); base.quaternion.setFromUnitVectors(V3(0, 1, 0), n);
    const swiv = new THREE.Group(); base.add(swiv);
    const h = new THREE.Mesh(hg, hookMat); h.scale.setScalar(0.32 + 0.12 * Math.sin(t * Math.PI)); swiv.add(h);
    const col = new THREE.Mesh(collarG, collarMat); col.rotation.x = Math.PI / 2; swiv.add(col);
    g.add(base); hooks.push({ base, swiv, ph: hash(k) * 6.28 });
  }
  // a few suckers
  g.userData = { hooks, curve };
  return g;
}

// ------------------------------------------------------------------ props for comparisons
function makeBasketball() {
  const [c, x] = canvas(1024, 512); x.fillStyle = '#c4581e'; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 30000; i++) { x.fillStyle = `rgba(${hash(i) > 0.5 ? '60,20,5' : '230,120,60'},${0.1 + hash(i * 2) * 0.2})`; x.fillRect(hash(i * 3) * 1024, hash(i * 5) * 512, 2, 2); }
  x.strokeStyle = '#1a0d06'; x.lineWidth = 8; x.beginPath(); x.moveTo(0, 256); x.lineTo(1024, 256); x.stroke();
  for (const u of [256, 768]) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, 512); x.stroke(); }
  for (const u of [0, 512]) { x.beginPath(); for (let k = 0; k <= 64; k++) { const v = k / 64 * 512; const px = u + 256 + Math.sin(k / 64 * Math.PI) * 140; k ? x.lineTo(px, v) : x.moveTo(px, v); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.SphereGeometry(0.12, 64, 32), phys({ map: t, roughness: 0.75, bumpMap: t, bumpScale: 0.5 }));
}
function makePiano() {
  const g = new THREE.Group(); const black = phys({ color: 0x1a1a1c, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, metalness: 0.2 });
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.5, 0); s.lineTo(1.5, 0.35); s.bezierCurveTo(1.3, 0.6, 0.9, 0.7, 0.75, 1.2); s.bezierCurveTo(0.6, 1.75, 0.2, 1.9, 0, 1.9); s.lineTo(0, 0);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 40 }), black);
  body.rotation.x = -Math.PI / 2; body.position.y = 0.62; g.add(body);
  const lid = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false, curveSegments: 40 }), black); lid.rotation.x = -Math.PI / 2; lid.position.y = 0.96;
  const lidP = new THREE.Group(); lidP.add(lid); lidP.rotation.x = 0; lidP.position.set(0, 0, 0); g.add(lidP);
  lid.rotation.set(-Math.PI / 2, 0, 0); lidP.rotation.z = 0; lidP.position.y = 0; const hinge = new THREE.Group(); hinge.position.set(1.5, 0.96, 0); g.add(hinge); g.remove(lidP); lid.position.set(-1.5, 0, 0); hinge.add(lid); hinge.rotation.x = 0; hinge.rotation.set(0, 0, 0); lid.rotation.x = -Math.PI / 2; hinge.rotation.x = -0.6;
  for (const [x, z] of [[0.15, -0.15], [1.35, -0.15], [0.4, -1.6]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.62, 12), black); l.position.set(x, 0.31, z); g.add(l); }
  const kb = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.05, 0.16), phys({ color: 0xf5f2ea, roughness: 0.3 })); kb.position.set(0.75, 0.7, 0.08); g.add(kb);
  for (let k = 0; k < 36; k++) { if ([1, 4, 8, 11, 15, 18, 22, 25, 29, 32].includes(k % 36)) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.03, 0.09), black); bk.position.set(0.05 + k * 0.039, 0.735, 0.05); g.add(bk); } }
  return g;
}
function makeBus() {
  const g = new THREE.Group(); const yel = phys({ color: 0xf2b705, roughness: 0.45, clearcoat: 0.5 }), blk = phys({ color: 0x111111, roughness: 0.6 }), glass = phys({ color: 0x1b2730, roughness: 0.1, metalness: 0.4 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(11, 2.6, 2.5, 4, 0.35), yel); body.position.y = 1.8; g.add(body);
  const hood = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.3, 2.4, 3, 0.25), yel); hood.position.set(6.1, 1.15, 0); g.add(hood);
  for (const z of [-1.26, 1.26]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.12, 0.02), blk); stripe.position.set(0, 1.35, z); g.add(stripe);
    for (let k = 0; k < 8; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), glass); w.position.set(-4.6 + k * 1.25, 2.45, z * 1.005); w.rotation.y = z > 0 ? 0 : Math.PI; g.add(w); }
  }
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), glass); ws.position.set(5.51, 2.5, 0); ws.rotation.y = Math.PI / 2; g.add(ws);
  for (const x of [-3.5, 4.2]) for (const z of [-1.1, 1.1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 24), blk); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, z); g.add(w); }
  return g;
}
function makeCar() {
  const g = new THREE.Group(); const paint = phys({ color: 0xb01818, roughness: 0.25, clearcoat: 1, metalness: 0.4 }), blk = phys({ color: 0x0d0d0d, roughness: 0.7 }), glass = phys({ color: 0x0e1820, roughness: 0.05, metalness: 0.6 });
  const b = new THREE.Mesh(new RoundedBoxGeometry(4.0, 0.75, 1.75, 4, 0.3), paint); b.position.y = 0.65; g.add(b);
  const c = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.65, 1.6, 4, 0.28), glass); c.position.set(-0.2, 1.25, 0); g.add(c);
  for (const x of [-1.3, 1.3]) for (const z of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 24), blk); w.rotation.x = Math.PI / 2; w.position.set(x, 0.33, z); g.add(w); }
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff2d0, toneMapped: false }); for (const z of [-0.6, 0.6]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), hl); l.position.set(2.01, 0.75, z); l.rotation.y = Math.PI / 2; g.add(l); }
  return g;
}
function makeCup() {
  const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push(new THREE.Vector2(0.03 + t * 0.016 + (t > 0.95 ? 0.004 : 0), t * 0.11)); }
  pts.push(new THREE.Vector2(0.044, 0.11)); pts.push(new THREE.Vector2(0.04, 0.11));
  for (let k = 20; k >= 0; k--) { const t = k / 20; pts.push(new THREE.Vector2(0.027 + t * 0.016, t * 0.11 + 0.003)); }
  const geo = new THREE.LatheGeometry(pts, 64);
  const [c, x] = canvas(512, 256); x.fillStyle = '#f2f0e9'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(200,195,185,${hash(i) * 0.3})`; x.beginPath(); x.arc(hash(i * 2) * 512, hash(i * 3) * 256, 1 + hash(i * 4) * 2, 0, 7); x.fill(); }
  x.fillStyle = '#1d6fa3'; x.font = 'bold 44px Inter, sans-serif'; x.fillText('DEEP · 2000 M', 60, 140);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(geo, phys({ map: t, roughness: 0.85, sheen: 0.4, side: THREE.DoubleSide }));
  m.userData.base = Float32Array.from(geo.attributes.position.array);
  return m;
}
export function cupCrush(m, k) { // shrink + crumple
  const p = m.geometry.attributes.position, b = m.userData.base;
  for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2]; const a = Math.atan2(z, x); const w = 1 + k * 0.08 * Math.sin(a * 7 + y * 90) * Math.sin(y * 60); p.setXYZ(i, x * w, y * (1 - k * 0.05 * Math.sin(a * 5)), z * w); }
  p.needsUpdate = true; m.geometry.computeVertexNormals();
}
function makeNugget(seed) {
  const geo = new THREE.SphereGeometry(0.03, 32, 24); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)); const n = 1 + 0.18 * Math.sin(v.x * 180 + seed) * Math.sin(v.y * 150 + seed * 2) + 0.08 * Math.sin(v.z * 400); v.multiplyScalar(n); v.y *= 0.55; v.x *= 1.25; p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, phys({ color: 0xc98a2e, roughness: 0.8, bumpMap: noiseTex(256, 256, '#888', ['#fff', '#000'], 6000, 3), bumpScale: 2, sheen: 0.4, sheenColor: new THREE.Color(0xffcc66) }));
}
function makeSeesaw() {
  const g = new THREE.Group(); const steel = phys({ color: 0x8c9599, roughness: 0.35, metalness: 0.85 }), dark = phys({ color: 0x222628, roughness: 0.6, metalness: 0.5 });
  const fulcrum = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 4), dark); fulcrum.position.y = 1.1; fulcrum.rotation.y = Math.PI / 4; g.add(fulcrum);
  const beamG = new THREE.Group(); beamG.position.y = 2.25; g.add(beamG);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(24, 0.35, 3), steel); beamG.add(plank);
  const L = new THREE.Group(), Rr = new THREE.Group(); L.position.set(-8, 0.2, 0); Rr.position.set(8, 0.2, 0); beamG.add(L, Rr);
  g.userData = { beamG, L, R: Rr };
  return g;
}
function makeRuler() {
  const [c, x] = canvas(1024, 96); x.fillStyle = '#d9b36b'; x.fillRect(0, 0, 1024, 96); x.fillStyle = '#2a1d0c';
  for (let k = 0; k <= 300; k++) { const px = 12 + k * 3.33; const h = k % 10 === 0 ? 40 : k % 5 === 0 ? 26 : 14; x.fillRect(px, 0, 1.5, h); if (k % 10 === 0) { x.font = 'bold 18px Inter, sans-serif'; x.fillText(String(k / 10), px - 5, 66); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.003, 0.03), [phys({ color: 0xd9b36b }), phys({ color: 0xd9b36b }), phys({ map: t, roughness: 0.6 }), phys({ color: 0xd9b36b }), phys({ color: 0xd9b36b }), phys({ color: 0xd9b36b })]);
}
function makeBuilding(floors = 5) {
  const g = new THREE.Group(); const h = floors * 3;
  const mat = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(10, h, 10).translate(0, h / 2, 0), mat));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10, h, 10).translate(0, h / 2, 0)), new THREE.LineBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.8 })); g.add(edges);
  for (let f = 1; f < floors; f++) { const fl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2).translate(0, f * 3, 0)), new THREE.LineBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.4 })); g.add(fl); }
  return g;
}
function makeLungs() {
  const g = new THREE.Group(); const m = phys({ color: 0xd97a82, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0xff9aa0), clearcoat: 0.3 });
  const lungs = new THREE.Group();
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 24), m); l.scale.set(0.75, 1.4, 0.8); l.position.set(s * 0.085, 0, 0); lungs.add(l); }
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 12), phys({ color: 0xe8c0b0, roughness: 0.5 })); tr.position.y = 0.16; lungs.add(tr);
  g.add(lungs);
  const ghost = makeHuman(0x4fb8ff); ghost.traverse(o => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: 0x4fb8ff, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }); });
  ghost.position.y = -1.28; g.add(ghost);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32, 16), phys({ color: 0xf7f7f2, roughness: 0.35, clearcoat: 0.6 })); ball.position.set(0.3, 0, 0); g.add(ball);
  g.userData = { lungs, ball };
  return g;
}
function makeBrain(r, color = 0xd98f8f) {
  const geo = new THREE.SphereGeometry(r, 96, 64); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const f = 1 + 0.035 * Math.sin(v.x * 40 + Math.sin(v.y * 30) * 2) * Math.sin(v.z * 36 + v.y * 20) + 0.02 * Math.sin(v.y * 70); const w = Math.abs(v.z) < 0.04 ? 0.93 : 1; v.multiplyScalar(r * f * w); v.x *= 1.25; v.y *= 0.85; p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, phys({ color, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xffb0b0), clearcoat: 0.4 }));
}
// anglerfish (teaser + descent)
function makeAngler() {
  const g = new THREE.Group(); const skin = phys({ color: 0x1a1512, roughness: 0.55, bumpMap: noiseTex(512, 256, '#777', ['#000', '#fff'], 9000, 3), bumpScale: 3, clearcoat: 0.4 });
  const body = new THREE.Mesh(bodyGeometry(1.0, [[0, 0.05], [0.08, 0.3], [0.3, 0.36], [0.6, 0.26], [0.85, 0.1], [1.0, 0.03]], { segU: 80, segV: 48, sy: () => 1.05 }), skin); body.rotation.y = Math.PI; g.add(body);
  const jaw = new THREE.Group(); jaw.position.set(-0.05, -0.12, 0); g.add(jaw);
  const lowerJ = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), skin); lowerJ.scale.set(0.9, 0.5, 1); jaw.add(lowerJ);
  const tooth = new THREE.ConeGeometry(0.012, 0.11, 8); const tm = phys({ color: 0xe8e0d0, roughness: 0.2, transparent: true, opacity: 0.9 });
  for (let k = 0; k < 18; k++) { const a = Math.PI + (k / 17 - 0.5) * 2.4; const t = new THREE.Mesh(tooth, tm); t.position.set(Math.cos(a) * 0.24 + 0.02, 0.02, Math.sin(a) * 0.26); t.rotation.z = 0.25; jaw.add(t); const t2 = t.clone(); t2.position.y = 0.2; t2.rotation.z = Math.PI - 0.25; g.add(t2); t2.position.add(V3(-0.05, -0.12, 0)); }
  const eyeM = phys({ color: 0x9bd0d0, roughness: 0.05, clearcoat: 1, emissive: 0x0d2a2a }); for (const z of [-0.2, 0.2]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), eyeM); e.position.set(-0.12, 0.17, z); g.add(e); }
  const rod = taperedTube([V3(-0.1, 0.33, 0), V3(-0.2, 0.55, 0), V3(-0.38, 0.62, 0), V3(-0.52, 0.5, 0)], t => lerp(0.012, 0.005, t), 40, 8).geo; g.add(new THREE.Mesh(rod, skin));
  const lure = new THREE.Mesh(new THREE.SphereGeometry(0.022, 24, 16), new THREE.MeshBasicMaterial({ color: 0x9fe8f0 })); lure.position.set(-0.52, 0.48, 0); g.add(lure);
  const ll = new THREE.PointLight(0x9ff4ff, 1.5, 3, 1.6); ll.position.copy(lure.position); g.add(ll);
  const fin = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24, 0, Math.PI), phys({ color: 0x2a2018, transparent: true, opacity: 0.7, side: THREE.DoubleSide })); fin.position.set(0.95, 0, 0); fin.rotation.z = -Math.PI / 2; g.add(fin);
  g.userData = { jaw, lure, ll, fin };
  return g;
}
function makeFish(color = 0x9ab0b8) {
  const g = new THREE.Group(); const m = phys({ color, roughness: 0.25, metalness: 0.6, clearcoat: 0.8 });
  const b = new THREE.Mesh(bodyGeometry(0.3, [[0, 0.01], [0.05, 0.045], [0.15, 0.05], [0.27, 0.015], [0.3, 0.005]], { segU: 40, segV: 24, sy: () => 1.3 }), m); b.rotation.y = Math.PI; g.add(b);
  const tail = new THREE.Mesh(new THREE.CircleGeometry(0.06, 3), m); tail.position.x = 0.3; tail.rotation.z = Math.PI; g.add(tail); g.userData.tail = tail;
  for (let k = 0; k < 4; k++) { const ph = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7fe8ff, toneMapped: false })); ph.position.set(-0.06 + k * 0.05, -0.04, 0.03); g.add(ph); }
  return g;
}
function makeStomach() {
  const g = new THREE.Group();
  const tex = noiseTex(1024, 512, '#4a1210', ['#7a2018', '#2a0606', '#a03a2a'], 12000, 9); tex.repeat.set(3, 2);
  const cave = new THREE.Mesh(new THREE.SphereGeometry(4, 64, 48), phys({ map: tex, bumpMap: tex, bumpScale: 4, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.3, side: THREE.BackSide }));
  const p = cave.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)); v.multiplyScalar(1 + 0.08 * Math.sin(v.x * 2 + v.y) * Math.sin(v.z * 2.3)); p.setXYZ(i, v.x, v.y * 0.7, v.z); } cave.geometry.computeVertexNormals();
  g.add(cave);
  g.userData = { cave };
  return g;
}

// ------------------------------------------------------------------ 3D title
let FONT;
export async function loadFont() { FONT = await new FontLoader().loadAsync('/film2/node_modules/three/examples/fonts/helvetiker_bold.typeface.json'); }
function makeText(str, size, mat) {
  const geo = new TextGeometry(str, { font: FONT, size, depth: size * 0.25, curveSegments: 8, bevelEnabled: true, bevelThickness: size * 0.04, bevelSize: size * 0.025, bevelSegments: 4 });
  geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, 0);
  return new THREE.Mesh(geo, mat);
}

// ------------------------------------------------------------------ build all
export function buildProps(scene) {
  setSeed(42); SM = squidMaterials();
  const add = (k, o) => { P[k] = o; o.visible = false; scene.add(o); return o; };
  add('sub', makeSub());
  add('ocean', makeOcean());
  add('ship', makeShip());
  add('trawler', makeShip({ L: 34, small: 1, hull: 0x1f3d6b }));
  add('human', makeHuman());
  add('diver', makeDiver());
  P.squidRoot = add('squidRoot', new THREE.Group());
  P.squidBody = squidBody(SM); P.squidRoot.add(P.squidBody);
  P.squid2Root = add('squid2Root', new THREE.Group()); // second squid (cousin / baby)
  P.squid2Body = squidBody(SM); P.squid2Root.add(P.squid2Body);
  add('whale', spermWhale()); P.whale.userData.jaw = P.whale.children.find(o => o.isGroup && o.position.x > 5); P.whale.userData.surf = P.whale.userData.surface;
  P.whales = []; for (let i = 0; i < 4; i++) { const w = spermWhale(); w.visible = false; scene.add(w); P.whales.push(w); }
  P.eye = add('eye', makeEye());
  P.beak = add('beak', makeBeak());
  P.club = add('club', makeClub());
  P.ball = add('ball', makeBasketball());
  P.piano = add('piano', makePiano());
  P.buses = add('buses', new THREE.Group()); for (let i = 0; i < 4; i++) { const b = makeBus(); b.position.y = i * 2.9; b.rotation.y = i % 2 ? 0.05 : -0.04; P.buses.add(b); }
  P.bus = add('bus', makeBus());
  P.car = add('car', makeCar());
  P.cupA = add('cupA', makeCup()); P.cupB = add('cupB', makeCup());
  P.nuggets = add('nuggets', new THREE.Group()); [0, 1].forEach(i => { const n = makeNugget(i * 3 + 1); n.position.set(i * 0.075 - 0.035, 0.012, i * 0.02); n.rotation.y = i * 1.2; P.nuggets.add(n); });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.012, 48), phys({ color: 0xf2f2ee, roughness: 0.15, clearcoat: 1 })); P.nuggets.add(plate);
  P.seesaw = add('seesaw', makeSeesaw());
  P.ruler = add('ruler', makeRuler());
  P.building = add('building', makeBuilding(5));
  P.lungs = add('lungs', makeLungs());
  P.brainW = add('brainW', makeBrain(0.14)); P.brainH = add('brainH', makeBrain(0.075));
  P.angler = add('angler', makeAngler());
  P.fish = add('fish', makeFish());
  P.school = add('school', new THREE.Group()); for (let i = 0; i < 40; i++) { const f = makeFish(0x8aa4ad); f.position.set(hash(i) * 6, hash(i + 1) * 2, hash(i + 2) * 3); P.school.add(f); }
  P.stomach = add('stomach', makeStomach());
  P.beakPile = add('beakPile', new THREE.Group());
  { const bp = makeBeak(); const meshes = []; bp.traverse(o => { if (o.isMesh && o.geometry.attributes.color) meshes.push(o); });
    meshes.forEach(src => { const im = new THREE.InstancedMesh(src.geometry, src.material, 420); const m = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < 420; i++) { const r = Math.sqrt(hash(i * 3.1)) * 2.4, a = hash(i * 5.7) * 6.283, h = Math.max(0, 0.9 * (1 - r / 2.5)) * hash(i * 2.2) + hash(i) * 0.1; q.setFromEuler(new THREE.Euler(hash(i) * 6, hash(i * 2) * 6, hash(i * 3) * 6)); const s = 0.7 + hash(i * 9) * 0.8; m.compose(V3(Math.cos(a) * r, -2.4 + h, Math.sin(a) * r), q, V3(s, s, s)); im.setMatrixAt(i, m); }
      P.beakPile.add(im); }); }
  P.arms1925 = add('arms1925', new THREE.Group());
  [0, 1].forEach(i => { const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(V3(-1.2 + t * 2.4, -2.0 + Math.sin(t * 3 + i) * 0.3 + 0.2 * i, -0.4 + i * 0.8 + Math.cos(t * 2) * 0.3)); } P.arms1925.add(squidArm(SM, pts, 0.12, 0.02, () => V3(0, -4, 0), { suckers: 40 })); });
  // title
  const tm = phys({ color: 0x8a2a1c, roughness: 0.35, metalness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  P.title = add('title', new THREE.Group());
  const t1 = makeText('COLOSSAL', 1.0, tm); t1.position.y = 0.7; const t2 = makeText('SQUID', 1.0, tm); t2.position.y = -0.7; P.title.add(t1, t2);
  P.title.userData = { t1, t2 };
  // jet of water
  P.jet = add('jet', new THREE.Group());
  { const plate = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.12), phys({ color: 0x4b5357, roughness: 0.4, metalness: 0.9 })); P.jet.add(plate);
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 4, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.7, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false })); stream.rotation.x = Math.PI / 2; stream.position.z = 2.06; P.jet.add(stream);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 24), phys({ color: 0x9aa3a8, roughness: 0.3, metalness: 0.95 })); bar.position.set(0, 0, 3.4); bar.rotation.z = Math.PI / 2; P.jet.add(bar);
    P.jet.userData = { stream, bar }; }
  // ink cloud
  P.ink = add('ink', new THREE.Group());
  { const m = new THREE.MeshBasicMaterial({ color: 0x050208, transparent: true, opacity: 0.4, depthWrite: false }); for (let i = 0; i < 60; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), m); s.position.set((hash(i) - 0.5) * 3, (hash(i + 1) - 0.5) * 2, (hash(i + 2) - 0.5) * 3); s.userData.s = 0.4 + hash(i + 3); P.ink.add(s); } }
  // sonar shells
  P.shells = add('shells', new THREE.Group());
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 10, 0, Math.PI * 2, 0, Math.PI * 0.35), new THREE.MeshBasicMaterial({ color: 0x8ff6ff, transparent: true, opacity: 0.1, wireframe: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.rotation.z = Math.PI / 2; P.shells.add(s); }
  // green "echo" material for sonar view
  P.echoMat = new THREE.MeshBasicMaterial({ color: 0x2ad07a, wireframe: true, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false });
  P.ghostMat = new THREE.MeshBasicMaterial({ color: 0x4fb8ff, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending });
  // x-ray organs (children of squidRoot)
  const xr = new THREE.Group(); xr.visible = false; P.squidRoot.add(xr);
  const hearts = []; [[0.55, 0.15, 0.22], [0.55, 0.15, -0.22], [0.78, -0.05, 0]].forEach(p => { const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), new THREE.MeshBasicMaterial({ color: 0xd02838 })); h.position.set(...p); xr.add(h); hearts.push(h); });
  const brain = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 20, 48), new THREE.MeshBasicMaterial({ color: 0xd8a040 })); brain.rotation.y = Math.PI / 2; brain.position.set(0.05, 0.05, 0); xr.add(brain);
  const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 12), new THREE.MeshBasicMaterial({ color: 0xd08040, transparent: true, opacity: 0.5 })); gut.rotation.z = Math.PI / 2; gut.position.set(0.9, 0.05, 0); xr.add(gut);
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: 0x7ad060 })); xr.add(food);
  const vessels = new THREE.Group(); xr.add(vessels);
  for (let i = 0; i < 14; i++) { const pts = [V3(0.55, 0.1, 0), V3(1.0 + i * 0.08, 0.25 * Math.sin(i), 0.3 * Math.cos(i)), V3(1.6 + i * 0.05, 0.3 * Math.sin(i * 1.3), 0.35 * Math.cos(i * 1.7)), V3(2.2, 0.1 * Math.sin(i), 0.1 * Math.cos(i))]; vessels.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 6, false), new THREE.MeshBasicMaterial({ color: 0x2a88d0 }))); }
  P.xr = { xr, hearts, brain, gut, food, vessels };
  // siphon (jet funnel)
  const siph = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.35, 16, 1, true), SM.body); siph.rotation.z = Math.PI / 2 - 0.3; siph.position.set(-0.15, -0.4, 0); P.squidBody.add(siph);
  P.siphon = siph;
}
