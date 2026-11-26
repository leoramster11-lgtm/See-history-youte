// Renderer, post-processing and the living-water environment (all in 3D).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const RW = 1280, RH = 720;
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => (t = clamp(t), t * t * (3 - 2 * t));
export const ease3 = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// smooth 1D value noise (for handheld camera drift)
export const sn = (t, s = 0) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return lerp(hash(i + s * 57.3), hash(i + 1 + s * 57.3), u) * 2 - 1; };

export const W = {}; // world singleton

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function flakeTex() {
  const [c, x] = canvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  // irregular fibrous blobs
  for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(64 + Math.sin(i * 2.1) * 14, 64 + Math.cos(i * 1.7) * 12, 10 + i * 2, 5 + i, i, 0, 7); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); }
  const t = new THREE.CanvasTexture(c); return t;
}
export function softDot() {
  const [c, x] = canvas(64, 64);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ------------------------------------------------------------ post shader: refraction wobble, CA, blur, grade, grain, vignette
const PostShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uWob: { value: 1 }, uCA: { value: 1 }, uBlur: { value: 0 },
    uWhip: { value: new THREE.Vector2(0, 0) }, uFlash: { value: 0 }, uRed: { value: 0 }, uFade: { value: 1 }, uRes: { value: new THREE.Vector2(RW, RH) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uWob, uCA, uBlur, uFlash, uRed, uFade; uniform vec2 uWhip, uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv = vUv;
      uv += uWob * 0.0016 * vec2(sin(uv.y*21.0 + uTime*1.3) + 0.5*sin(uv.y*47.0 - uTime*0.9), cos(uv.x*17.0 + uTime*1.1));
      vec2 d = uv - 0.5; float r2 = dot(d,d);
      vec3 col = vec3(0.);
      float n = 0.;
      for (int i = -4; i <= 4; i++) {
        float k = float(i) / 4.0;
        vec2 o = uWhip * k * 0.06 + (uBlur > 0. ? vec2(k, mod(float(i)*0.73, 1.0)-0.5) * uBlur * 0.008 : vec2(0.));
        vec2 ca = d * r2 * 0.012 * uCA;
        col.r += texture2D(tDiffuse, uv + o + ca).r; col.g += texture2D(tDiffuse, uv + o).g; col.b += texture2D(tDiffuse, uv + o - ca).b; n += 1.;
      }
      col /= n;
      // grade: lift shadows slightly toward deep teal, crush a little
      col = mix(col, col * vec3(0.92, 1.0, 1.04) + vec3(0.0, 0.006, 0.01), 0.7);
      col = mix(col, vec3(dot(col, vec3(.3,.59,.11))) * vec3(1.6,0.35,0.3), uRed * 0.5);
      col += uFlash;
      col *= 1.0 - smoothstep(0.18, 0.78, r2 * 1.35) * 0.62;
      col += (h(uv * uRes + fract(uTime) * 91.) - 0.5) * 0.035;
      gl_FragColor = vec4(col * uFade, 1.);
    }`,
};

// ------------------------------------------------------------ water pieces
function snowSystem() {
  const N = 9000, pos = new Float32Array(N * 3), rnd = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { pos[i * 3] = hash(i * 1.1); pos[i * 3 + 1] = hash(i * 2.3); pos[i * 3 + 2] = hash(i * 3.7); rnd[i * 2] = hash(i * 4.9); rnd[i * 2 + 1] = hash(i * 6.1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 2));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uCam: { value: V3(0, 0, 0) }, uBox: { value: 26 }, uMap: { value: flakeTex() }, uAmb: { value: 0.25 }, uSize: { value: 1 },
      uDrift: { value: V3(0.12, 0.05, 0.03) }, uL0: { value: V3(0, 0, 0) }, uD0: { value: V3(0, 0, -1) }, uL1: { value: V3(0, 0, 0) }, uD1: { value: V3(0, 0, -1) }, uBeam: { value: 0 },
      uTint: { value: new THREE.Color(0xcfe8e6) }, uFogD: { value: 0.05 },
    },
    vertexShader: `
      attribute vec2 rnd; uniform float uTime, uBox, uSize, uBeam, uAmb, uFogD; uniform vec3 uCam, uDrift, uL0, uD0, uL1, uD1; varying float vA; varying float vRot;
      float cone(vec3 p, vec3 o, vec3 d){ vec3 v = p - o; float z = dot(v, d); if (z < 0.) return 0.; float r = length(v - d*z); float w = 0.12 + z*0.42; return smoothstep(w, 0., r) * exp(-z*0.09); }
      void main(){
        vec3 p = position * uBox;
        p += uDrift * uTime * (0.6 + rnd.x) + vec3(sin(uTime*0.3 + rnd.y*40.)*0.25, sin(uTime*0.21 + rnd.x*30.)*0.2, cos(uTime*0.27+rnd.y*20.)*0.25);
        p = mod(p - uCam + uBox*0.5, uBox) - uBox*0.5 + uCam;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        float dist = -mv.z;
        float lit = uAmb + uBeam * (cone(p, uL0, uD0) + cone(p, uL1, uD1)) * 1.6;
        vA = lit * (0.3 + rnd.x * 0.7) * exp(-dist * uFogD) * smoothstep(0.4, 1.6, dist) * 0.8;
        vRot = rnd.y * 6.28 + uTime * (rnd.x - 0.5);
        gl_PointSize = min(uSize * (1.0 + rnd.y * rnd.y * 3.0) * 40.0 / max(dist, 0.3), 48.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uTint; varying float vA; varying float vRot;
      void main(){ vec2 c = gl_PointCoord - 0.5; float s = sin(vRot), co = cos(vRot); c = mat2(co,-s,s,co)*c*vec2(1.0,1.6); vec4 t = texture2D(uMap, c + 0.5); gl_FragColor = vec4(uTint * t.a * vA, 1.); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  return pts;
}
function bgDome() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color(0x0a3542) }, uBot: { value: new THREE.Color(0x01070a) }, uSun: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 uTop, uBot; uniform float uSun, uTime; varying vec3 vD;
      float n(vec2 p){ return sin(p.x)*sin(p.y); }
      void main(){ float y = vD.y; vec3 c = mix(uBot, uTop, smoothstep(-0.6, 0.9, y));
        float rays = 0.5 + 0.5*n(vec2(atan(vD.x, vD.z)*14.0 + uTime*0.15, 1.0)) * n(vec2(atan(vD.x, vD.z)*7.0 - uTime*0.1, 1.3));
        c += uSun * pow(max(y, 0.), 3.0) * (0.25 + 0.35*rays) * vec3(0.35, 0.75, 0.8);
        gl_FragColor = vec4(c, 1.); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat); m.renderOrder = -10; m.frustumCulled = false;
  return m;
}
// shafts of sunlight from the surface
function godRays() {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uI: { value: 0.5 } },
    vertexShader: `varying vec2 vUv; varying float vF; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.); vec3 n = normalize(normalMatrix*normal); vF = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime, uI; varying vec2 vUv; varying float vF;
      void main(){ float s = 0.55 + 0.45*sin(vUv.x*31.0 + uTime*0.4)*sin(vUv.x*13.0 - uTime*0.23);
        float a = pow(vUv.y, 1.6) * s * pow(vF, 1.5) * uI * 0.22; gl_FragColor = vec4(vec3(0.55, 0.9, 0.95)*a, 1.); }`,
  });
  for (let i = 0; i < 9; i++) {
    const geo = new THREE.CylinderGeometry(1.5 + hash(i) * 3, 0.6, 90, 24, 1, true); geo.translate(0, -45, 0);
    const m = new THREE.Mesh(geo, mat); m.position.set((hash(i + 3) - 0.5) * 60, 0, (hash(i + 7) - 0.5) * 60 - 10);
    m.rotation.set((hash(i + 9) - 0.5) * 0.25, 0, (hash(i + 11) - 0.5) * 0.25); g.add(m);
  }
  g.userData.mat = mat; return g;
}
// underside of the sea surface (seen from below)
function surfaceUnder() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uI: { value: 1 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime, uI; varying vec3 vW;
      void main(){ vec2 p = vW.xz*0.15; float c = 0.;
        for (int i=0;i<3;i++){ float fi=float(i); p += vec2(sin(p.y*1.7+uTime*0.6+fi), cos(p.x*1.3-uTime*0.5+fi*2.)); c += 0.5+0.5*sin(p.x*2.+p.y*1.5); }
        c /= 3.; float bright = pow(c, 4.0);
        float fall = exp(-length(vW.xz)*0.012);
        vec3 col = mix(vec3(0.03,0.22,0.27), vec3(0.6,0.95,0.95), bright) * fall * uI;
        gl_FragColor = vec4(col, 0.92); }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 1, 1), mat); m.rotation.x = Math.PI / 2;
  return m;
}
// small drifting jellies + glowing plankton
function critters() {
  const g = new THREE.Group();
  const bell = new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x9fe6ff, emissive: 0x1a5060, emissiveIntensity: 0.25, transparent: true, opacity: 0.18, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const jel = new THREE.InstancedMesh(bell, mat, 30); jel.frustumCulled = false; g.add(jel);
  const tent = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.005, 2.2, 4, 6, true).translate(0, -1.1, 0), new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.25, depthWrite: false }), 30 * 4);
  tent.frustumCulled = false; g.add(tent);
  // glow plankton
  const N = 500, pos = new Float32Array(N * 3), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = hash(i * 9.1); pos[i * 3 + 1] = hash(i * 8.3); pos[i * 3 + 2] = hash(i * 7.7); ph[i] = hash(i * 5.3) * 100; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const pm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uCam: { value: V3(0, 0, 0) }, uI: { value: 1 }, uMap: { value: softDot() }, uBox: { value: 30 } },
    vertexShader: `attribute float ph; uniform float uTime, uBox; uniform vec3 uCam; varying float vA;
      void main(){ vec3 p = position*uBox + vec3(sin(uTime*0.1+ph)*0.6, uTime*0.03, cos(uTime*0.13+ph)*0.6); p = mod(p - uCam + uBox*0.5, uBox) - uBox*0.5 + uCam;
        vec4 mv = modelViewMatrix*vec4(p,1.); float k = sin(uTime*(0.4+fract(ph)*0.8) + ph); vA = smoothstep(0.85, 1.0, k);
        gl_PointSize = min((2.0 + fract(ph*3.)*4.) * 30.0 / max(-mv.z, 0.5), 14.0); vA *= smoothstep(1.5, 4.0, -mv.z); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uI; varying float vA; void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA * uI; gl_FragColor = vec4(vec3(0.3,0.9,1.0)*a, 1.); }`,
  });
  const pl = new THREE.Points(pg, pm); pl.frustumCulled = false; g.add(pl);
  g.userData = { jel, tent, pm };
  return g;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
function updateCritters(T, cam, amt) {
  const { jel, tent, pm } = W.crit.userData;
  pm.uniforms.uTime.value = T; pm.uniforms.uCam.value.copy(cam.position); pm.uniforms.uI.value = amt;
  const n = Math.round(30 * amt); jel.count = n; tent.count = n * 4;
  const box = 22;
  for (let i = 0; i < n; i++) {
    const base = V3(hash(i * 3.3) * box, hash(i * 4.4) * box, hash(i * 5.5) * box).add(V3(Math.sin(T * 0.05 + i) * 2, T * 0.06 * (0.5 + hash(i)), Math.cos(T * 0.04 + i) * 2));
    const p = V3(((base.x - cam.position.x) % box + box * 1.5) % box - box / 2 + cam.position.x, ((base.y - cam.position.y) % box + box * 1.5) % box - box / 2 + cam.position.y, ((base.z - cam.position.z) % box + box * 1.5) % box - box / 2 + cam.position.z);
    const s = 0.08 + hash(i * 7.7) * 0.22, pulse = 1 + 0.18 * Math.sin(T * 2.2 + i * 1.7);
    _q.setFromEuler(_e.set(Math.sin(T * 0.3 + i) * 0.3, i, Math.cos(T * 0.25 + i) * 0.3));
    _m.compose(p, _q, V3(s * pulse, s / pulse * 0.9, s * pulse)); jel.setMatrixAt(i, _m);
    for (let k = 0; k < 4; k++) {
      const a = k * 1.57 + i; const tp = p.clone().add(V3(Math.cos(a) * s * 0.6, 0, Math.sin(a) * s * 0.6));
      _q.setFromEuler(_e.set(Math.sin(T * 1.3 + k + i) * 0.25, 0, Math.cos(T * 1.1 + k) * 0.25));
      _m.compose(tp, _q, V3(s, s * (1.2 + hash(i + k)), s)); tent.setMatrixAt(i * 4 + k, _m);
    }
  }
  jel.instanceMatrix.needsUpdate = true; tent.instanceMatrix.needsUpdate = true;
}
// bubbles: analytic stream from emitters
function bubbles() {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xdff8ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.45, clearcoat: 1, emissive: 0x204048, emissiveIntensity: 0.4, depthWrite: false });
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), mat, 400); m.frustumCulled = false; m.count = 0;
  return m;
}
export function emitBubbles(list, T) {
  // list: [{p: Vector3, rate, size, spread}]
  const m = W.bub; let k = 0;
  for (const e of list) {
    const life = e.life ?? 4;
    const n = Math.min(160, Math.floor(e.rate * life));
    for (let i = 0; i < n && k < 400; i++) {
      const t0 = Math.floor(T * e.rate) / e.rate - i / e.rate, age = T - t0; if (age < 0 || age > life) continue;
      const id = Math.round(t0 * e.rate) * 1.37 + (e.seed || 0);
      const sp = e.spread ?? 0.15;
      const p = e.p.clone().add(V3((hash(id) - 0.5) * sp + Math.sin(age * 6 + id) * 0.04, age * (e.rise ?? 0.9) * (0.7 + hash(id + 2) * 0.6), (hash(id + 1) - 0.5) * sp + Math.cos(age * 5 + id) * 0.04));
      if (e.vel) p.add(e.vel.clone().multiplyScalar(age));
      const s = (e.size ?? 0.03) * (0.4 + hash(id + 3)) * (1 + age * 0.15);
      _m.compose(p, _q.identity(), V3(s, s * (0.8 + 0.2 * Math.sin(age * 20 + id)), s)); m.setMatrixAt(k++, _m);
    }
  }
  m.count = k; m.instanceMatrix.needsUpdate = true;
}
// volumetric light beam
export function beam(len = 30, radius = 6, color = 0xcfeeff) {
  const geo = new THREE.CylinderGeometry(0.08, radius, len, 48, 24, true);
  geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2); // along -Z... after rotate: from 0 to +Z? (cylinder y- -> z+)
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: 0.3 }, uLen: { value: len }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vZ; varying vec3 vP;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vZ = position.z; vP = position; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uI, uLen, uTime; varying vec3 vN; varying vec3 vV; varying float vZ; varying vec3 vP;
      void main(){ float f = pow(abs(dot(vN, vV)), 2.0); float d = 1. - clamp(abs(vZ)/uLen, 0., 1.);
        float a = atan(vP.y, vP.x); float streak = 0.7 + 0.3*sin(a*9.0 + vZ*0.4 - uTime*0.8)*sin(a*4.0 - uTime*0.3 + vZ*0.2);
        gl_FragColor = vec4(uColor * f * d * d * uI * streak, 1.); }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.userData.mat = mat; return m;
}

// caustics texture for shallow scenes (projected via spotlight map)
function causticTex() {
  const [c] = canvas(256, 256); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.userData.c = c; return t;
}
function drawCaustics(T) {
  const c = W.caus.userData.c, x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256); x.globalCompositeOperation = 'lighter'; x.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    x.strokeStyle = `rgba(160,255,240,${0.25 + 0.2 * Math.sin(T + i)})`; x.beginPath();
    for (let k = 0; k <= 12; k++) { const px = k * 22, py = (i * 21 + Math.sin(k * 0.8 + T * 1.3 + i) * 14 + Math.sin(k * 0.3 - T * 0.7) * 10) % 256; k ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
  }
  x.globalCompositeOperation = 'source-over'; W.caus.needsUpdate = true;
}

// ------------------------------------------------------------ init
export function initWorld() {
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setSize(RW, RH); r.setPixelRatio(1); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, RW / RH, 0.03, 900);
  const comp = new EffectComposer(r);
  comp.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.6, 0.5, 0.8); comp.addPass(bloom);
  comp.addPass(new OutputPass());
  const post = new ShaderPass(PostShader); comp.addPass(post);
  Object.assign(W, { r, scene, cam, comp, bloom, post });
  scene.fog = new THREE.FogExp2(0x031820, 0.04);
  W.dome = bgDome(); scene.add(W.dome);
  W.snow = snowSystem(); scene.add(W.snow);
  W.rays = godRays(); scene.add(W.rays);
  W.surfU = surfaceUnder(); scene.add(W.surfU);
  W.crit = critters(); scene.add(W.crit);
  W.bub = bubbles(); scene.add(W.bub);
  W.hemi = new THREE.HemisphereLight(0x3f8fa8, 0x020405, 0.4); scene.add(W.hemi);
  W.key = new THREE.SpotLight(0xe6f4ff, 0, 80, 0.5, 0.8, 1.2); scene.add(W.key, W.key.target);
  W.rim = new THREE.DirectionalLight(0x58d0ff, 0); scene.add(W.rim, W.rim.target);
  W.fill = new THREE.PointLight(0xffb090, 0, 30, 1.5); scene.add(W.fill);
  W.subFill = new THREE.PointLight(0xbfe6f0, 0, 14, 1.4); scene.add(W.subFill);
  W.caus = causticTex();
  W.sun = new THREE.SpotLight(0xbff4ff, 0, 200, 0.7, 0.6, 0.5); W.sun.map = W.caus; scene.add(W.sun, W.sun.target);
  return r.domElement;
}

// depth (m) -> water look
export function waterLook(depth, o = {}) {
  const k = clamp(Math.log10(1 + depth) / Math.log10(2001));
  const top = new THREE.Color().setRGB(lerp(0.09, 0.012, k), lerp(0.36, 0.05, k), lerp(0.42, 0.065, k));
  const bot = new THREE.Color().setRGB(lerp(0.01, 0.001, k), lerp(0.07, 0.008, k), lerp(0.09, 0.012, k));
  if (o.tint) { top.lerp(new THREE.Color(o.tint), 0.5); bot.lerp(new THREE.Color(o.tint).multiplyScalar(0.2), 0.5); }
  W.dome.material.uniforms.uTop.value.copy(top); W.dome.material.uniforms.uBot.value.copy(bot);
  W.dome.material.uniforms.uSun.value = o.sun ?? clamp(1 - depth / 250);
  const fogc = top.clone().lerp(bot, 0.55);
  W.scene.fog.color.copy(fogc); W.scene.fog.density = o.fog ?? lerp(0.025, 0.05, k);
  W.hemi.color.setRGB(lerp(0.4, 0.12, k), lerp(0.75, 0.3, k), lerp(0.8, 0.36, k)); W.hemi.intensity = o.amb ?? lerp(1.3, 0.35, k);
  W.rays.visible = depth < 350; W.rays.userData.mat.uniforms.uI.value = clamp(1 - depth / 350) * (o.rays ?? 1);
  W.surfU.visible = depth < 120 && !o.noSurface; W.surfU.position.y = o.surfY ?? 40;
  W.sun.intensity = depth < 60 ? (o.caustics ?? 1) * 260 * clamp(1 - depth / 60) : 0;
  return { top, bot, k };
}

// per-frame environment update. env: {depth, snow, beams:[{o,d}], crit, wob, surfY,...}
export function updateWorld(T, env) {
  const cam = W.cam;
  W.dome.position.copy(cam.position);
  W.dome.material.uniforms.uTime.value = T;
  const su = W.snow.material.uniforms;
  su.uTime.value = T; su.uCam.value.copy(cam.position);
  su.uAmb.value = env.snowAmb ?? (env.depth < 200 ? 0.35 : 0.12);
  su.uSize.value = env.snowSize ?? 1;
  su.uFogD.value = env.snowFog ?? 0.05;
  const bm = env.beams || [];
  su.uBeam.value = bm.length ? (env.beamSnow ?? 1) : 0;
  if (bm[0]) { su.uL0.value.copy(bm[0].o); su.uD0.value.copy(bm[0].d).normalize(); }
  if (bm[1]) { su.uL1.value.copy(bm[1].o); su.uD1.value.copy(bm[1].d).normalize(); } else if (bm[0]) { su.uL1.value.copy(bm[0].o); su.uD1.value.copy(bm[0].d).normalize(); }
  if (env.drift) su.uDrift.value.copy(env.drift); else su.uDrift.value.set(0.12, 0.05, 0.03);
  W.snow.visible = env.snow !== 0;
  W.rays.userData.mat.uniforms.uTime.value = T; W.rays.position.set(cam.position.x * 0.7, (env.surfY ?? 40), cam.position.z * 0.7);
  W.surfU.material.uniforms.uTime.value = T;
  W.crit.visible = (env.crit ?? 1) > 0; if (W.crit.visible) updateCritters(T, cam, env.crit ?? 1);
  if (W.sun.intensity > 0) { drawCaustics(T); W.sun.position.set(cam.position.x + 5, cam.position.y + 40, cam.position.z); W.sun.target.position.set(cam.position.x, cam.position.y - 10, cam.position.z - 5); }
  const pu = W.post.uniforms;
  pu.uTime.value = T; pu.uWob.value = env.wob ?? 1; pu.uCA.value = env.ca ?? 1; pu.uBlur.value = env.blur ?? 0;
  pu.uWhip.value.set(env.whip?.[0] ?? 0, env.whip?.[1] ?? 0); pu.uFlash.value = env.flash ?? 0; pu.uRed.value = env.red ?? 0; pu.uFade.value = env.fade ?? 1;
  W.bloom.strength = env.bloom?.[0] ?? 0.6; W.bloom.radius = env.bloom?.[1] ?? 0.5; W.bloom.threshold = Math.max(0.82, env.bloom?.[2] ?? 0.85);
  W.r.toneMappingExposure = env.exposure ?? 1.0;
}
export function renderWorld() { W.cam.updateProjectionMatrix(); W.comp.render(); return W.r.domElement; }
export function project(v) { const q = v.clone().project(W.cam); return [(q.x + 1) / 2 * 1920, (1 - q.y) / 2 * 1080, q.z < 1]; }
