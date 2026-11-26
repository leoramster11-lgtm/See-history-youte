// Motion graphics (kinetic typography) + sub HUD, drawn on the 1920x1080 canvas over the 3D frame.
const FW = 1920, FH = 1080;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const eo = t => 1 - Math.pow(1 - clamp(t), 3);            // ease out cubic
const eb = t => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }; // ease out back
const RED = '#ff3b2f', WHITE = '#f2f6f7', CYAN = '#7fe6ff';
const F = (w, s) => `${w} ${s}px Inter, "Inter Display", Arial, sans-serif`;

function fitFont(c, text, weight, size, maxW) { c.font = F(weight, size); let w = c.measureText(text).width; if (w > maxW) { size = Math.floor(size * maxW / w); c.font = F(weight, size); } return size; }
function spaced(c, text, x, y, sp, align = 'left') {
  const ta = c.textAlign; c.textAlign = 'left'; let w = 0; for (const ch of text) w += c.measureText(ch).width + sp; w -= sp;
  let px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  for (const ch of text) { c.fillText(ch, px, y); px += c.measureText(ch).width + sp; }
  c.textAlign = ta; return w;
}
function shadow(c, on = true) { c.shadowColor = on ? 'rgba(0,0,0,.65)' : 'transparent'; c.shadowBlur = on ? 24 : 0; c.shadowOffsetY = on ? 4 : 0; }
// fade in/out envelope for an item living [0, life]
function life(lt, len, fin = 0.25, fout = 0.3) { return clamp(lt / fin) * clamp((len - lt) / fout); }

// ------------------------------------------------------------------ items
const MG = {};
MG.kicker = (c, it, lt, len, ctx) => {
  const a = life(lt, len); if (a <= 0) return;
  c.save(); c.globalAlpha = a; shadow(c);
  const x = 110, y = ctx && ctx.hud ? 300 : 140, k = eo(lt / 0.5);
  c.fillStyle = RED; c.fillRect(x, y - 34, 6, 46);
  c.font = F(700, 30); c.fillStyle = WHITE;
  c.beginPath(); c.rect(x + 20, y - 50, 1400 * k, 80); c.clip();
  spaced(c, it.t, x + 26 - (1 - k) * 60, y, 5);
  c.restore();
};
MG.title = (c, it, lt, len) => {
  const a = clamp((len - lt) / 0.35); if (lt < 0 || a <= 0) return;
  const lines = it.t, n = lines.length; c.save(); c.textAlign = 'center';
  let size = n > 2 ? 120 : 150; for (const l of lines) size = Math.min(size, fitFont(c, l, 900, size, FW - 260));
  const lh = size * 1.02, y0 = FH / 2 - (n - 1) * lh / 2 + size * 0.35;
  lines.forEach((l, i) => {
    const k = eo((lt - i * 0.14) / 0.45); if (k <= 0) return;
    const y = y0 + i * lh;
    c.save(); c.globalAlpha = a; c.beginPath(); c.rect(0, y - size * 1.0, FW, size * 1.25); c.clip();
    c.translate(FW / 2, y + (1 - k) * size * 1.1); const s = lerp(1.12, 1, eo((lt - i * 0.14) / 0.9)); c.scale(s, s);
    c.font = F(900, size); shadow(c); c.fillStyle = (it.red || []).includes(i) ? RED : WHITE; c.fillText(l, 0, 0);
    c.restore();
  });
  const k2 = eo((lt - n * 0.14 - 0.15) / 0.5); c.globalAlpha = a; c.fillStyle = RED;
  const uw = 420 * k2; c.fillRect(FW / 2 - uw / 2, y0 + (n - 1) * lh + size * 0.32, uw, 8);
  c.restore();
};
MG.big = (c, it, lt, len) => {
  const a = life(lt, len, 0.2, 0.35); if (a <= 0) return;
  const target = parseFloat(String(it.t).replace(/[^0-9.]/g, '')); const dec = (String(it.t).split('.')[1] || '').length;
  const k = eo(lt / 1.0); let shown = it.t;
  if (it.count && !isNaN(target)) { const v = lerp(it.from ?? 0, target, k); shown = v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: (it.from ?? 0) < 1000 && target >= 10000 }); }
  c.save(); c.globalAlpha = a; shadow(c);
  const x = 120, y = FH - 210, s = 230, sl = eo(lt / 0.35);
  c.font = F(900, s); const w = c.measureText(shown).width;
  // panel
  const g = c.createLinearGradient(x - 40, 0, x + w + 520, 0); g.addColorStop(0, 'rgba(0,10,14,.55)'); g.addColorStop(1, 'rgba(0,10,14,0)');
  c.fillStyle = g; c.fillRect(x - 40, y - s * 0.82, (w + 560) * sl, s * 1.25);
  c.fillStyle = it.warn ? RED : WHITE; c.fillText(shown, x - (1 - sl) * 80, y);
  if (it.unit) { c.font = F(800, 90); c.fillStyle = it.warn ? WHITE : RED; c.fillText(it.unit, x + w + 26, y - s * 0.02); }
  if (it.sub) { c.font = F(700, 32); c.fillStyle = CYAN; const sk = eo((lt - 0.4) / 0.5); c.beginPath(); c.rect(x, y + 20, 1400 * sk, 70); c.clip(); spaced(c, it.sub, x + 4, y + 66, 4); }
  c.restore();
};
MG.stamp = (c, it, lt, len) => {
  if (lt < 0) return; const a = clamp((len - lt) / 0.3); if (a <= 0) return;
  const k = clamp(lt / 0.16), s = k < 1 ? lerp(2.6, 1, k * k) : 1 + 0.04 * Math.exp(-(lt - 0.16) * 12) * Math.sin((lt - 0.16) * 60);
  c.save(); c.globalAlpha = a * clamp(lt / 0.05); c.translate(FW / 2 + (it.big ? 0 : 0), FH / 2 + (it.big ? 0 : 230)); c.rotate(-0.12); c.scale(s, s);
  const size = it.big ? 220 : 120; c.font = F(900, size); const w = c.measureText(it.t).width;
  c.strokeStyle = RED; c.lineWidth = size * 0.08; c.strokeRect(-w / 2 - size * 0.3, -size * 0.85, w + size * 0.6, size * 1.15);
  c.fillStyle = RED; c.textAlign = 'center'; c.fillText(it.t, 0, size * 0.22);
  // grunge holes
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 90; i++) { const h = Math.sin(i * 91.7) * 43758.5; const r = h - Math.floor(h); c.beginPath(); c.arc((r - 0.5) * (w + size * 0.6), (Math.sin(i * 13.3) * 0.5) * size, 2 + r * 6, 0, 7); c.fill(); }
  c.restore();
};
MG.options = (c, it, lt, len) => {
  const a = life(lt, len, 0.3, 0.4); if (a <= 0) return;
  c.save(); c.globalAlpha = a; shadow(c);
  const x = 260, y0 = 300;
  c.font = F(800, 40); c.fillStyle = CYAN; spaced(c, 'YOUR OPTIONS', x, y0, 8);
  c.fillStyle = RED; c.fillRect(x, y0 + 20, 260 * eo(lt / 0.5), 5);
  const picked = it.pickAt != null && lt > it.pickAt, n = it.items.length;
  const cycle = it.pickAt ? Math.floor(clamp((lt - 1.0) / (it.pickAt - 1.0)) * n * 0.999) : -1;
  it.items.forEach((s, i) => {
    const k = eo((lt - 0.3 - i * 0.35) / 0.45); if (k <= 0) return;
    const y = y0 + 130 + i * 128, px = x - (1 - k) * 120;
    const isPick = picked && i === it.pick, struck = picked && i !== it.pick, hi = !picked && i === cycle;
    c.globalAlpha = a * k * (struck ? 0.45 : 1);
    if (isPick || hi) { const pk = isPick ? eb((lt - it.pickAt) / 0.35) : 1; c.fillStyle = isPick ? 'rgba(255,59,47,.9)' : 'rgba(127,230,255,.16)'; c.fillRect(px - 30, y - 66, (1260) * pk, 96); }
    c.font = F(900, 58); c.fillStyle = isPick ? '#fff' : WHITE; c.fillText(`${i + 1}.`, px, y); c.fillText(s, px + 90, y);
    if (struck) { const sk = eo((lt - it.pickAt - 0.1 - i * 0.08) / 0.3); const tw = c.measureText(s).width + 90; c.fillStyle = RED; c.fillRect(px - 6, y - 24, (tw + 12) * sk, 7); }
  });
  c.restore();
};
MG.loc = (c, it, lt, len) => {
  const a = life(lt, len); if (a <= 0) return;
  c.save(); c.globalAlpha = a; shadow(c);
  const x = 120, y = FH - 190;
  const pin = eb(lt / 0.4); c.fillStyle = RED; c.beginPath(); c.arc(x + 16, y - 46, 14 * pin, 0, 7); c.fill(); c.fillRect(x + 14, y - 46, 4, 46 * pin);
  c.font = F(900, 84); c.fillStyle = WHITE; const n = Math.floor(clamp((lt - 0.15) / 0.7) * it.t.length); c.fillText(it.t.slice(0, n), x + 52, y);
  c.font = F(700, 32); c.fillStyle = CYAN; const sk = eo((lt - 0.8) / 0.5); c.beginPath(); c.rect(x + 52, y + 12, 1200 * sk, 60); c.clip(); spaced(c, it.s || '', x + 56, y + 58, 4);
  c.restore();
};
MG.callout = (c, it, lt, len, ctx) => {
  const a = life(lt, len, 0.2, 0.3); if (a <= 0) return;
  const pt = ctx.anchor(it.a); if (!pt) return;
  const [ax, ay] = pt; c.save(); c.globalAlpha = a; shadow(c, false);
  const dx = ax > FW * 0.62 ? -1 : 1, ex = ax + dx * 150, ey = ay - 120;
  const k1 = eo(lt / 0.3), k2 = eo((lt - 0.25) / 0.3);
  c.strokeStyle = WHITE; c.lineWidth = 3;
  c.beginPath(); c.arc(ax, ay, 9, 0, 7); c.stroke(); c.beginPath(); c.arc(ax, ay, 9 + 22 * ((lt * 1.3) % 1), 0, 7); c.globalAlpha = a * (1 - (lt * 1.3) % 1); c.stroke(); c.globalAlpha = a;
  c.beginPath(); c.moveTo(ax + dx * 9 * 0.7, ay - 6); c.lineTo(lerp(ax, ex, k1), lerp(ay, ey, k1)); if (k1 >= 1) c.lineTo(ex + dx * 260 * k2, ey); c.stroke();
  c.font = F(800, 40); c.textAlign = dx > 0 ? 'left' : 'right'; shadow(c); c.fillStyle = WHITE;
  const n = Math.floor(clamp((lt - 0.4) / 0.4) * it.t.length); c.fillText(it.t.slice(0, n), ex + dx * 8, ey - 16);
  c.restore();
};
function fmtTime(s, hours) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (hours ? `${h}:${String(m).padStart(2, '0')}` : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); }
MG.timer = (c, it, lt, len) => {
  const a = life(lt, len, 0.2, 0.3); if (a <= 0) return;
  let v = (it.t0 ?? 0) + Math.max(0, lt) * (it.rate ?? 1); if (it.stop) v = Math.min(v, it.stop);
  c.save(); c.globalAlpha = a; shadow(c);
  const cx = FW / 2, cy = 330, r = 150;
  c.lineWidth = 14; c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
  c.strokeStyle = it.big ? RED : CYAN; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + ((v % 60) / 60) * Math.PI * 2 + (it.big ? Math.min(v / 5400, 1) * 0 : 0)); c.stroke();
  c.textAlign = 'center'; c.font = F(900, it.big ? 96 : 110); c.fillStyle = WHITE; c.fillText(fmtTime(v, it.big), cx, cy + 36);
  c.font = F(800, 34); c.fillStyle = it.big ? RED : CYAN; spaced(c, it.label || '', cx, cy + r + 70, 6, 'center');
  c.restore();
};
MG.meter = (c, it, lt, len) => {
  const a = life(lt, len); if (a <= 0) return;
  c.save(); c.globalAlpha = a; shadow(c);
  const x = FW - 420, y = 820, n = 24, k = eo(lt / 1.6), val = Math.round(it.v1 * k);
  for (let i = 0; i < n; i++) { const on = i / n < k; const hh = 14, yy = y - i * (hh + 6); c.fillStyle = on ? (i > n * 0.75 ? RED : i > n * 0.5 ? '#ffb02e' : '#3cff9a') : 'rgba(255,255,255,.12)'; c.fillRect(x, yy, 160 + i * 4, hh); }
  c.font = F(900, 110); c.fillStyle = WHITE; c.textAlign = 'left'; c.fillText(String(val), x, y - n * 20 - 40);
  c.font = F(800, 46); c.fillStyle = RED; c.fillText(it.unit, x + c.measureText(String(val)).width * 0 + 230, y - n * 20 - 40);
  c.font = F(700, 28); c.fillStyle = CYAN; spaced(c, it.label || '', x, y + 56, 4);
  c.restore();
};
MG.vs = (c, it, lt, len) => {
  const a = life(lt, len); if (a <= 0) return;
  c.save(); c.globalAlpha = a; shadow(c);
  const y = FH - 140, k = eo(lt / 0.45);
  c.font = F(900, 54); c.fillStyle = WHITE; c.textAlign = 'right'; c.fillText(it.a, FW / 2 - 90 - (1 - k) * 300, y);
  c.textAlign = 'left'; c.fillText(it.b, FW / 2 + 90 + (1 - k) * 300, y);
  const vk = eb((lt - 0.25) / 0.35); c.save(); c.translate(FW / 2, y - 18); c.scale(vk, vk); c.fillStyle = RED; c.beginPath(); c.arc(0, 0, 52, 0, 7); c.fill(); c.font = F(900, 44); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('VS', 0, 16); c.restore();
  c.restore();
};
MG.depthbar = (c, it, lt, len) => {
  const a = life(lt, len); if (a <= 0) return;
  c.save(); c.globalAlpha = a; shadow(c);
  const x = FW - 330, y0 = 150, y1 = FH - 130, maxD = 4000, k = eo(lt / 0.6);
  const Y = d => y0 + (y1 - y0) * d / maxD;
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#3aa8c8'); g.addColorStop(0.12, '#0d3a4a'); g.addColorStop(1, '#010608');
  c.fillStyle = g; c.fillRect(x, y0, 26, (y1 - y0) * k);
  c.font = F(700, 24); c.fillStyle = 'rgba(255,255,255,.6)'; for (let d = 0; d <= maxD; d += 1000) { c.fillRect(x - 12, Y(d), 12, 2); c.fillText(`${d.toLocaleString('en-US')} M`, x - 140, Y(d) + 8); }
  (it.marks || []).forEach(([d, label], i) => {
    const mk = eo((lt - 0.5 - i * 0.4) / 0.4); if (mk <= 0) return; c.globalAlpha = a * mk;
    const you = label === 'YOU'; c.fillStyle = you ? RED : WHITE; c.beginPath(); c.arc(x + 13, Y(d), you ? 13 : 9, 0, 7); c.fill();
    c.font = F(800, you ? 36 : 30); c.fillText(label, x + 46, Y(d) + 12);
  });
  c.restore();
};

// ------------------------------------------------------------------ HUD (inside-the-sub readout)
export function hud(c, depth, T, alpha = 1) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha = alpha * 0.9; shadow(c, false);
  const m = 46; c.strokeStyle = 'rgba(200,240,245,.55)'; c.lineWidth = 3;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [FW - m, m, -1, 1], [m, FH - m, 1, -1], [FW - m, FH - m, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 46); c.lineTo(x, y); c.lineTo(x + sx * 46, y); c.stroke(); }
  c.fillStyle = 'rgba(210,245,250,.9)'; c.font = '600 22px "DejaVu Sans Mono", monospace'; c.fillText('DEPTH', 92, 102);
  c.font = '700 56px "DejaVu Sans Mono", monospace'; c.fillText(`${Math.round(depth).toLocaleString('en-US')} M`, 90, 160);
  c.font = '600 24px "DejaVu Sans Mono", monospace';
  c.fillText(`${(depth / 10 + 1).toFixed(0)} ATM   ${(depth > 200 ? 1.5 + 2 * Math.exp(-depth / 600) : 8).toFixed(1)} °C`, 92, 198);
  for (let i = 0; i < 30; i++) c.fillRect(92 + i * 10, 214, 2, i % 5 ? 6 : 12);
  c.fillStyle = Math.sin(T * 4) > 0 ? '#ff3b2f' : 'rgba(255,59,47,.25)'; c.beginPath(); c.arc(FW - 200, 92, 10, 0, 7); c.fill();
  c.fillStyle = 'rgba(210,245,250,.9)'; c.font = '600 24px "DejaVu Sans Mono", monospace'; c.fillText('REC', FW - 180, 101);
  const s = Math.floor(T); c.fillText(`${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(Math.floor((T % 1) * 60)).padStart(2, '0')}`, FW - 300, 140);
  c.restore();
}
export function scene_label(c, name, lt) {
  const a = clamp(lt / 0.3) * clamp((2.2 - lt) / 0.5); if (a <= 0) return;
  c.save(); c.globalAlpha = a; shadow(c); c.textAlign = 'center';
  c.font = F(700, 26); c.fillStyle = CYAN; spaced(c, 'CHAPTER', FW / 2, 92, 8, 'center');
  c.font = F(900, 54); c.fillStyle = WHITE; spaced(c, name, FW / 2, 150, 6, 'center');
  c.restore();
}
export function endcard(c, lt) {
  c.save(); shadow(c); c.textAlign = 'center';
  const k = eo((lt - 1.2) / 0.6); c.globalAlpha = k;
  c.fillStyle = RED; const w = 520 * eb((lt - 1.2) / 0.5); c.fillRect(FW / 2 - w / 2, FH - 300, w, 110);
  c.font = F(900, 62); c.fillStyle = '#fff'; c.fillText('SUBSCRIBE', FW / 2, FH - 224);
  c.font = F(700, 30); c.fillStyle = CYAN; c.globalAlpha = eo((lt - 1.8) / 0.6); spaced(c, 'NEW MONSTER EVERY EPISODE', FW / 2, FH - 130, 6, 'center');
  c.restore();
}
export function drawMG(c, items, lb, beatDur, ctx) {
  for (const it of items) {
    const lt = lb - it.at; if (lt < 0) continue;
    const len = (it.len ?? (beatDur - it.at));
    if (lt > len) continue;
    MG[it.k]?.(c, it, lt, len, ctx);
  }
}
