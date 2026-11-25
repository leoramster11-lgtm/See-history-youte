// 2D overlay: HUD, titles, callouts, vignette, grain.
const W = 1920, H = 1080;
const cv = document.getElementById('ov'); const c = cv.getContext('2d');

function hud(depth, temp, atm, x = 110, y = 140) {
  c.save(); c.letterSpacing = '4px';
  c.font = '500 22px "JetBrains Mono"'; c.fillStyle = 'rgba(150,220,235,.75)'; c.fillText('DEPTH', x, y);
  c.font = '700 64px "JetBrains Mono"'; c.fillStyle = 'rgba(225,250,255,.95)';
  c.shadowColor = 'rgba(120,220,255,.6)'; c.shadowBlur = 18; c.fillText(depth, x, y + 66); c.shadowBlur = 0;
  c.font = '500 22px "JetBrains Mono"'; c.fillStyle = 'rgba(150,220,235,.75)'; c.fillText(`${temp}   ·   ${atm}`, x, y + 108);
  c.strokeStyle = 'rgba(150,220,235,.45)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x, y + 126); c.lineTo(x + 380, y + 126); c.stroke();
  for (let i = 0; i <= 20; i++) { c.beginPath(); c.moveTo(x + i * 19, y + 126); c.lineTo(x + i * 19, y + 126 + (i % 5 ? 6 : 14)); c.stroke(); }
  c.fillStyle = '#ff3b30'; c.shadowColor = '#ff3b30'; c.shadowBlur = 12;
  c.beginPath(); c.arc(W - 150, y - 8, 9, 0, 7); c.fill(); c.shadowBlur = 0;
  c.font = '600 22px "JetBrains Mono"'; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText('REC', W - 130, y);
  c.restore();
}
function title(l1, l2, x, y, size = 112) {
  c.save(); c.letterSpacing = '1px'; c.font = `900 ${size}px "Inter Display", "Inter"`;
  c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 30; c.fillStyle = '#fff'; c.fillText(l1, x, y);
  c.fillStyle = '#ff4a3d'; c.shadowColor = 'rgba(255,60,40,.55)'; c.shadowBlur = 40; c.fillText(l2, x, y + size * 0.98);
  c.restore();
}
function finish(vig = 0.85, lb = 54, grain = 14) {
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vig})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // grain as a separate layer
  const n = document.createElement('canvas'); n.width = W; n.height = H; const nx = n.getContext('2d');
  const id = nx.createImageData(W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = grain; }
  nx.putImageData(id, 0, 0); c.globalCompositeOperation = 'overlay'; c.drawImage(n, 0, 0); c.globalCompositeOperation = 'source-over';
  if (lb) { c.fillStyle = '#000'; c.fillRect(0, 0, W, lb); c.fillRect(0, H - lb, W, lb); }
}
function callout([x, y], [tx, ty], big, small, right = false) {
  c.save(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, 8, 0, 7); c.stroke();
  const e = right ? -40 : 40;
  c.beginPath(); c.moveTo(x, y); c.lineTo(tx, ty); c.lineTo(tx + e, ty); c.stroke();
  c.textAlign = right ? 'right' : 'left'; const ox = right ? tx + e - 10 : tx + e + 10;
  c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 14;
  c.font = '800 36px "Inter Display"'; c.fillStyle = '#fff'; c.fillText(big, ox, ty + 11);
  c.font = '500 19px "JetBrains Mono"'; c.fillStyle = 'rgba(170,225,240,.9)'; c.fillText(small, ox, ty + 40);
  c.restore();
}

export const overlay = {
  scale(p) {
    c.save(); c.letterSpacing = '2px'; c.font = '900 76px "Inter Display"'; c.fillStyle = '#fff';
    c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 24; c.fillText('THE COLOSSAL SQUID', 110, 160);
    c.shadowBlur = 0; c.letterSpacing = '0px'; c.font = 'italic 400 30px "Inter"'; c.fillStyle = 'rgba(255,120,90,.95)';
    c.fillText('Mesonychoteuthis hamiltoni', 114, 206); c.restore();
    callout(p.eye, [p.eye[0] - 120, 330], 'EYE ~30 CM', 'largest in the animal kingdom', true);
    callout(p.mantle, [p.mantle[0] + 40, 300], 'UP TO 500 KG', 'mantle ~2.5 m');
    callout(p.club, [p.club[0] + 40, 780], 'SWIVELING HOOKS', 'on both hunting tentacles');
    c.save(); c.font = '600 21px "JetBrains Mono"'; c.fillStyle = 'rgba(190,230,240,.9)'; c.textAlign = 'center';
    c.fillText('YOU · 1.8 M', p.human[0], p.human[1] - 18); c.restore();
    // ruler
    const [x0, y0] = p.x0, [x1] = p.x1, y = 990, px = (x1 - x0) / p.meters;
    c.save(); c.strokeStyle = 'rgba(160,220,235,.6)'; c.lineWidth = 2; c.font = '500 18px "JetBrains Mono"'; c.fillStyle = 'rgba(160,220,235,.85)';
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    for (let m = 0; m <= Math.floor(p.meters); m++) {
      c.beginPath(); c.moveTo(x0 + m * px, y); c.lineTo(x0 + m * px, y - (m % 5 ? 10 : 22)); c.stroke();
      if (m % 2 === 0) c.fillText(m + ' M', x0 + m * px + 6, y - 10);
    }
    c.restore();
    finish(0.75, 40, 12);
  },
  battle() { finish(0.9, 54, 16); hud('2,000 M', '+0.8 °C', '201 ATM'); c.save(); c.textAlign = 'right'; title('50 TONS', 'VS 500 KG', 1810, 800, 112); c.restore(); },
  hero() { finish(0.9, 54, 16); hud('2,000 M', '+1.2 °C', '201 ATM'); title('THE COLOSSAL', 'SQUID', 110, 800, 112); },
};
