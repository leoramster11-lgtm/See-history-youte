// Shared 3D building blocks: textures, squid, sperm whale, environment.
import * as THREE from 'three';

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

// deterministic random
let seed = 12345;
export function setSeed(s) { seed = s; }
export function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
export const R = (a, b) => a + (b - a) * rnd();

// ---------------------------------------------------------------- textures
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

export function squidSkin(w = 2048, h = 1024) {
  const [c, x] = canvas(w, h), [b, bx] = canvas(w, h);
  x.fillStyle = '#5a0f09'; x.fillRect(0, 0, w, h);
  bx.fillStyle = '#808080'; bx.fillRect(0, 0, w, h);
  // large mottling
  for (let i = 0; i < 260; i++) {
    const px = R(0, w), py = R(0, h), r = R(30, 140);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    const col = rnd() > 0.5 ? '150,40,22' : '40,5,5';
    g.addColorStop(0, `rgba(${col},${R(.15, .35)})`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  // chromatophores
  for (let i = 0; i < 26000; i++) {
    const px = R(0, w), py = R(0, h), r = R(1, 6) * (rnd() > 0.97 ? 2.2 : 1);
    const dark = rnd() > 0.35;
    x.beginPath(); x.arc(px, py, r, 0, 7);
    x.fillStyle = dark ? `rgba(30,2,4,${R(.25, .7)})` : `rgba(235,105,60,${R(.15, .5)})`; x.fill();
    bx.beginPath(); bx.arc(px, py, r, 0, 7);
    bx.fillStyle = dark ? `rgba(40,40,40,${R(.2, .5)})` : `rgba(220,220,220,${R(.2, .5)})`; bx.fill();
  }
  // fine streaks for wet sheen
  for (let i = 0; i < 1600; i++) {
    const px = R(0, w), py = R(0, h), l = R(10, 60);
    bx.strokeStyle = `rgba(255,255,255,${R(.04, .12)})`; bx.lineWidth = R(1, 2);
    bx.beginPath(); bx.moveTo(px, py); bx.lineTo(px + l, py + R(-3, 3)); bx.stroke();
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(b);
  [map, bump].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; });
  return { map, bump };
}

export function whaleSkin(w = 4096, h = 1024) {
  const [c, x] = canvas(w, h), [b, bx] = canvas(w, h);
  // u (x axis) = along body, v (y axis) = around (0 = bottom side, .5 = top)
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#24272a'); g.addColorStop(0.25, '#33383c'); g.addColorStop(0.5, '#3e444a'); g.addColorStop(0.75, '#33383c'); g.addColorStop(1, '#24272a');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  bx.fillStyle = '#808080'; bx.fillRect(0, 0, w, h);
  // blotches
  for (let i = 0; i < 500; i++) {
    const px = R(0, w), py = R(0, h), r = R(20, 120);
    const gg = x.createRadialGradient(px, py, 0, px, py, r);
    const col = rnd() > 0.5 ? '95,100,105' : '20,22,25';
    gg.addColorStop(0, `rgba(${col},${R(.1, .3)})`); gg.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = gg; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  // body wrinkles (behind the head): wavy lines across the body
  for (let i = 0; i < 900; i++) {
    const u = R(0.33, 1) * w, y0 = R(0, h), len = R(40, 220);
    bx.strokeStyle = `rgba(30,30,30,${R(.3, .7)})`; bx.lineWidth = R(2, 5);
    bx.beginPath(); bx.moveTo(u, y0);
    for (let k = 0; k < len; k += 6) bx.lineTo(u + Math.sin(k * 0.08 + i) * 5, y0 + k);
    bx.stroke();
    x.strokeStyle = `rgba(15,17,19,${R(.15, .35)})`; x.lineWidth = R(1.5, 3);
    x.beginPath(); x.moveTo(u, y0); for (let k = 0; k < len; k += 6) x.lineTo(u + Math.sin(k * 0.08 + i) * 5, y0 + k); x.stroke();
  }
  // scars on head: long scratches and sucker rings
  for (let i = 0; i < 240; i++) {
    const u = R(0, 0.36) * w, v = R(0.1, 0.95) * h, l = R(30, 260), a = R(0, Math.PI);
    const col = `rgba(215,218,216,${R(.06, .28)})`;
    x.strokeStyle = col; x.lineWidth = R(1, 3); x.lineCap = 'round';
    x.beginPath(); x.moveTo(u, v); x.quadraticCurveTo(u + Math.cos(a) * l / 2 + R(-20, 20), v + Math.sin(a) * l / 2, u + Math.cos(a) * l, v + Math.sin(a) * l); x.stroke();
    bx.strokeStyle = 'rgba(200,200,200,.6)'; bx.lineWidth = 3; bx.stroke();
  }
  for (let i = 0; i < 110; i++) {
    const u = R(0, 0.34) * w, v = R(0.1, 0.95) * h, r = R(6, 22);
    x.strokeStyle = `rgba(220,220,218,${R(.08, .3)})`; x.lineWidth = R(1.5, 3);
    x.beginPath(); x.arc(u, v, r, 0, 7); x.stroke();
    bx.strokeStyle = 'rgba(210,210,210,.6)'; bx.lineWidth = 4; bx.beginPath(); bx.arc(u, v, r, 0, 7); bx.stroke();
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(b);
  [map, bump].forEach(t => { t.anisotropy = 8; });
  return { map, bump };
}

export function eyeTexture() {
  const [c, x] = canvas(1024, 512);
  // rows from top: pole (pupil) -> iris -> eyeball
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#000'); g.addColorStop(0.17, '#010203'); g.addColorStop(0.18, '#0f3a40');
  g.addColorStop(0.3, '#3b6f78'); g.addColorStop(0.42, '#1a2c30'); g.addColorStop(0.5, '#07090a'); g.addColorStop(1, '#030405');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 1400; i++) {
    const px = R(0, 1024), y0 = R(92, 120), y1 = R(160, 215);
    x.strokeStyle = rnd() > 0.5 ? `rgba(150,215,225,${R(.08, .3)})` : `rgba(200,160,90,${R(.05, .2)})`;
    x.lineWidth = R(1, 3); x.beginPath(); x.moveTo(px, y0); x.lineTo(px + R(-4, 4), y1); x.stroke();
  }
  x.fillStyle = 'rgba(80,230,240,.35)'; x.fillRect(0, 88, 1024, 5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function softDot() {
  const [c, x] = canvas(64, 64);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ---------------------------------------------------------------- generic geometry
// Tube along points with radius(t). Returns {geo, curve}
export function taperedTube(points, radiusFn, segs = 140, radial = 18) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => p.isVector3 ? p : V3(...p)), false, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false);
  const pos = geo.attributes.position, P = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    curve.getPointAt(i / segs, P); const r = radiusFn(i / segs);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j; v.fromBufferAttribute(pos, k).sub(P).multiplyScalar(r).add(P);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return { geo, curve };
}

// Parametric body along +X: radius(x), squareness n(x), vertical stretch sy(x), extra(x, ang) -> dy
export function bodyGeometry(L, profile, opts = {}) {
  const segU = opts.segU || 220, segV = opts.segV || 96;
  // smooth profile lookup through catmull-rom
  const prof = new THREE.CatmullRomCurve3(profile.map(([x, r]) => V3(x, r, 0)), false, 'centripetal');
  const table = prof.getPoints(800);
  const radiusAt = x => {
    for (let i = 1; i < table.length; i++) if (table[i].x >= x) {
      const a = table[i - 1], b = table[i]; return lerp(a.y, b.y, (x - a.x) / Math.max(1e-6, b.x - a.x));
    }
    return table[table.length - 1].y;
  };
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segU; i++) {
    const u = i / segU, x = u * L, r = Math.max(0, radiusAt(x));
    const n = opts.n ? opts.n(x) : 2, sy = opts.sy ? opts.sy(x) : 1;
    for (let j = 0; j <= segV; j++) {
      const v = j / segV, a = v * Math.PI * 2 - Math.PI / 2; // v=0 bottom, .5 top
      const c = Math.cos(a), s = Math.sin(a);
      const se = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n);
      let y = r * se * s * sy, z = r * se * c;
      if (opts.dy) y += opts.dy(x, s);
      pos.push(x, y, z); uv.push(u, v);
    }
  }
  for (let i = 0; i < segU; i++) for (let j = 0; j < segV; j++) {
    const a = i * (segV + 1) + j, b = a + segV + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // surface helper (for wrapping arms)
  g.userData.surface = (x, ang, off = 0) => {
    const r = Math.max(0, radiusAt(x)) + off, n = opts.n ? opts.n(x) : 2, sy = opts.sy ? opts.sy(x) : 1;
    const c = Math.cos(ang), s = Math.sin(ang);
    const se = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n);
    let y = r * se * s * sy; if (opts.dy) y += opts.dy(x, s);
    return V3(x, y, r * se * c);
  };
  return g;
}

// ---------------------------------------------------------------- squid
export function squidMaterials() {
  const body = squidSkin();
  const arm = squidSkin(1024, 512); arm.map.repeat.set(6, 1); arm.bump.repeat.set(6, 1);
  const mk = t => new THREE.MeshPhysicalMaterial({
    map: t.map, bumpMap: t.bump, bumpScale: 1.6, roughness: 0.5, metalness: 0,
    clearcoat: 0.45, clearcoatRoughness: 0.4, sheen: 0.22, sheenColor: new THREE.Color(0xff7a50), sheenRoughness: 0.5,
  });
  return {
    body: mk(body), arm: mk(arm),
    sucker: new THREE.MeshPhysicalMaterial({ color: 0xa86a5e, roughness: 0.4, clearcoat: 0.6 }),
    hook: new THREE.MeshPhysicalMaterial({ color: 0xf3e6cf, roughness: 0.25, clearcoat: 1 }),
    eye: new THREE.MeshPhysicalMaterial({ map: eyeTexture(), roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
    iris: new THREE.MeshPhysicalMaterial({ color: 0x1f4650, roughness: 0.3, metalness: 0, clearcoat: 1, emissive: 0x0a3a40, emissiveIntensity: 0.6 }),
    glow: new THREE.MeshBasicMaterial({ color: 0x8fe0ff }),
  };
}

// arm with suckers + optional club hooks. ref(P) -> point the suckers face.
export function squidArm(M, points, r0, r1, ref, opts = {}) {
  const grp = new THREE.Group();
  const club = opts.club;
  const rf = t => {
    let r = lerp(r0, r1, Math.pow(t, 0.85));
    if (club && t > 0.74) r += r0 * 0.55 * Math.sin(Math.min(1, (t - 0.74) / 0.24) * Math.PI);
    return r;
  };
  const { geo, curve } = taperedTube(points, rf, opts.segs || 160, 18);
  grp.add(new THREE.Mesh(geo, M.arm));
  const n = opts.suckers ?? 40;
  const sGeo = new THREE.SphereGeometry(1, 12, 8);
  const hGeo = new THREE.ConeGeometry(0.35, 1.8, 8); hGeo.translate(0, 0.9, 0);
  const suck = new THREE.InstancedMesh(sGeo, M.sucker, n * 2);
  const hooks = new THREE.InstancedMesh(hGeo, M.hook, 60);
  let si = 0, hi = 0; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), P = new THREE.Vector3(), T = new THREE.Vector3();
  const tStart = club ? 0.1 : 0.06;
  for (let k = 0; k < n; k++) {
    const t = lerp(tStart, 0.95, k / n);
    if (club && t < 0.74 && k % 3) continue; // tentacle stalks have few suckers
    curve.getPointAt(t, P); curve.getTangentAt(t, T);
    const target = ref(P.clone());
    const d = target.sub(P); d.sub(T.clone().multiplyScalar(d.dot(T))).normalize();
    const r = rf(t);
    for (const side of [-1, 1]) {
      const sideV = new THREE.Vector3().crossVectors(T, d).normalize().multiplyScalar(side * r * 0.38);
      const p = P.clone().add(d.clone().multiplyScalar(r * 0.82)).add(sideV);
      q.setFromUnitVectors(V3(0, 0, 1), d);
      const s = r * 0.34;
      m.compose(p, q, V3(s, s, s * 0.45)); suck.setMatrixAt(si++, m);
      if (club && t > 0.78 && hi < 60 && side === 1 && k % 2 === 0) {
        const up = d.clone().multiplyScalar(-1).add(T.clone().multiplyScalar(-0.5)).normalize();
        q.setFromUnitVectors(V3(0, 1, 0), up.negate());
        const hs = r0 * 0.33;
        m.compose(P.clone().add(d.clone().multiplyScalar(r * 0.9)), q, V3(hs, hs, hs)); hooks.setMatrixAt(hi++, m);
      }
    }
  }
  suck.count = si; hooks.count = hi;
  grp.add(suck); if (hi) grp.add(hooks);
  return grp;
}

// Squid body (mantle+fins+head+eyes). Local: head at origin, mantle toward +X, arms toward -X.
export function squidBody(M) {
  const g = new THREE.Group();
  const prof = [[0, 0.40], [0.3, 0.54], [0.9, 0.67], [1.5, 0.63], [2.0, 0.48], [2.4, 0.25], [2.62, 0.05], [2.66, 0]];
  const mantle = new THREE.Mesh(bodyGeometry(2.66, prof, { segU: 160, segV: 72, sy: () => 0.95 }), M.body);
  mantle.position.x = 0.15; g.add(mantle);
  // fins (broad heart-shaped paddle through the tail)
  const s = new THREE.Shape();
  s.moveTo(1.55, 0);
  s.bezierCurveTo(1.65, 0.65, 2.35, 1.05, 2.62, 0.55);
  s.bezierCurveTo(2.8, 0.25, 2.82, 0.05, 2.82, 0);
  s.bezierCurveTo(2.82, -0.05, 2.8, -0.25, 2.62, -0.55);
  s.bezierCurveTo(2.35, -1.05, 1.65, -0.65, 1.55, 0);
  const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.04, bevelSegments: 4, curveSegments: 40 }), M.body);
  fin.rotation.x = Math.PI / 2; fin.position.y = 0.05; g.add(fin);
  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 64, 48), M.body);
  head.scale.set(1.1, 1.0, 1.08); g.add(head);
  // eyes
  for (const sz of [-1, 1]) {
    const lid = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.045, 16, 48), M.body);
    lid.position.set(-0.02, 0.06, sz * 0.36); lid.rotation.y = sz * 0.25; g.add(lid);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 64, 48), M.eye);
    eye.position.set(-0.02, 0.06, sz * 0.33); eye.rotation.set(sz * Math.PI / 2, 0, 0); eye.rotateZ(-sz * 0.25); g.add(eye);
    for (let k = 0; k < 3; k++) {
      const ph = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), M.glow);
      ph.position.set(-0.12 + k * 0.1, -0.13, sz * 0.4); g.add(ph);
    }
  }
  return g;
}

// Full squid in neutral pose, arms streaming toward -X.
export function squidFull(M, pose = {}) {
  const g = new THREE.Group();
  g.add(squidBody(M));
  const base = -0.38;
  const axisRef = P => V3(P.x, 0, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const spread = pose.spread ?? 0.35, len = R(1.7, 2.1) * (pose.armLen ?? 1);
    const c = Math.cos(a), s = Math.sin(a);
    const pts = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5, x = base - t * len;
      const rr = 0.16 + t * spread * (1 + 0.6 * Math.sin(t * 3 + i));
      const curl = pose.curl ? Math.sin(t * Math.PI * 1.2 + i) * pose.curl * t : 0;
      pts.push([x, s * rr + curl * c + (pose.droop ?? 0) * t * t, c * rr + curl * s]);
    }
    g.add(squidArm(M, pts, 0.1, 0.007, axisRef, { suckers: 44 }));
  }
  for (const side of [-1, 1]) {
    const len = 3.6 * (pose.tentLen ?? 1);
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      pts.push([base - t * len, side * 0.06 + Math.sin(t * 4 + side) * 0.25 * t + (pose.tentY ?? 0) * t, side * (0.08 + 0.35 * t)]);
    }
    g.add(squidArm(M, pts, 0.06, 0.01, axisRef, { club: true, suckers: 60 }));
  }
  return g;
}

// ---------------------------------------------------------------- sperm whale (local: snout at x=0, body toward +X, 16 m)
export function spermWhale() {
  const L = 16;
  const tex = whaleSkin();
  const mat = new THREE.MeshPhysicalMaterial({ map: tex.map, bumpMap: tex.bump, bumpScale: 2.2, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.5 });
  const prof = [[0, 0], [0.12, 0.95], [0.45, 1.35], [1.2, 1.52], [3, 1.62], [5, 1.62], [6.5, 1.5], [9, 1.28], [11.5, 0.88], [13.5, 0.48], [15, 0.26], [16, 0.16]];
  const geo = bodyGeometry(L, prof, {
    n: x => lerp(3.4, 2.05, smooth(Math.min(1, Math.max(0, (x - 3.8) / 3)))),
    sy: x => lerp(1.12, 0.95, smooth(Math.min(1, Math.max(0, (x - 4) / 4)))),
    dy: (x, s) => (s > 0 ? 0.22 * Math.exp(-Math.pow((x - 10) / 0.7, 2)) * Math.pow(s, 6) : 0) - 0.1 * smooth(Math.min(1, Math.max(0, (x - 6) / 8))),
  });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat));
  g.userData.surface = geo.userData.surface;
  // lower jaw (open)
  const jawMat = new THREE.MeshPhysicalMaterial({ color: 0x9a9c99, roughness: 0.6, map: tex.map });
  const jaw = new THREE.Group();
  const jg = bodyGeometry(4.4, [[0, 0], [0.12, 0.12], [0.6, 0.2], [2.5, 0.26], [4.4, 0.32]], { sy: () => 0.55, segU: 80, segV: 32 });
  const jm = new THREE.Mesh(jg, jawMat); jm.position.x = -4.4; jaw.add(jm);
  const teethMat = new THREE.MeshPhysicalMaterial({ color: 0x9c9586, roughness: 0.55, clearcoat: 0.2 });
  const tg = new THREE.ConeGeometry(0.045, 0.16, 10); tg.translate(0, 0.08, 0);
  for (let k = 0; k < 22; k++) for (const sz of [-1, 1]) {
    const t = new THREE.Mesh(tg, teethMat); const x = -4.15 + k * 0.17;
    t.position.set(x, 0.1, sz * (0.07 + 0.02 * k / 22) * 1.6); jaw.add(t);
  }
  jaw.position.set(5.3, -1.62, 0); jaw.rotation.z = 0.32; g.add(jaw);
  // mouth interior (dark)
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.7), new THREE.MeshBasicMaterial({ color: 0x0a0608, side: THREE.DoubleSide }));
  mouth.rotation.x = Math.PI / 2; mouth.position.set(3.2, -1.62, 0); g.add(mouth);
  // eyes
  for (const sz of [-1, 1]) {
    const p = geo.userData.surface(5.7, sz > 0 ? -0.45 : Math.PI + 0.45, -0.02);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.05, clearcoat: 1 }));
    e.position.copy(p); e.scale.set(1.3, 0.8, 1); g.add(e);
  }
  // flippers
  for (const sz of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat);
    f.scale.set(0.9, 0.08, 0.42); f.position.set(6.6, -1.15, sz * 1.45); f.rotation.set(sz * 0.5, sz * 0.5, -0.3); g.add(f);
  }
  // flukes
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.6, 0.6, 1.2, 1.9, 1.9, 2.35); s.bezierCurveTo(1.6, 1.6, 1.4, 0.6, 1.5, 0.12);
  s.lineTo(1.5, -0.12); s.bezierCurveTo(1.4, -0.6, 1.6, -1.6, 1.9, -2.35); s.bezierCurveTo(1.2, -1.9, 0.6, -0.6, 0, 0);
  const fl = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 }), mat);
  fl.rotation.x = Math.PI / 2; fl.position.set(15.6, -1.0, 0); g.add(fl);
  return g;
}

// ---------------------------------------------------------------- environment
export function particles(count, box, size, color, opacity, additive = true) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = R(box[0], box[1]); pos[i * 3 + 1] = R(box[2], box[3]); pos[i * 3 + 2] = R(box[4], box[5]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    size, map: softDot(), color, transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true,
  }));
}

// visible light cone from `from` toward `to`
export function beam(from, to, radius, intensity = 0.25, color = 0xbfe6ff) {
  const len = from.distanceTo(to);
  const geo = new THREE.CylinderGeometry(0.05, radius, len, 64, 30, true);
  geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: intensity }, uLen: { value: len } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vZ;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vZ = position.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uI; uniform float uLen; varying vec3 vN; varying vec3 vV; varying float vZ;
      void main(){ float f = pow(abs(dot(vN, vV)), 2.2); float d = 1. - clamp(vZ/uLen, 0., 1.); gl_FragColor = vec4(uColor, f*d*d*uI); }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(from); m.lookAt(to);
  return m;
}
