// Exports: ../voiceover-en.txt (for AI TTS), ../script-en.md (shot list), cues.json (sound engine incl. auto UI/cut sounds)
import { BEATS, TOTAL } from './timeline.js';
import fs from 'fs';
const tc = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const SURF = new Set(['ship_storm', 'wave_building', 'trawler', 'deck_sub', 'ship_crane']);
let vo = `THE COLOSSAL SQUID — Voice-over script (English)\nRuntime ≈ ${tc(TOTAL)}. Read with tension, ~150 words per minute. One line = one beat on screen.\n`;
let md = `# Episode 1 — The Colossal Squid (v3, all-3D)\n\nRuntime **${tc(TOTAL)}** · ${BEATS.length} beats · ${BEATS.reduce((a, b) => a + b.shots.length, 0)} shots (avg ${(TOTAL / BEATS.reduce((a, b) => a + b.shots.length, 0)).toFixed(1)} s per shot).\n\n`;
let sc = '', words = 0;
const out = [];
BEATS.forEach((b, bi) => {
  if (b.scene !== sc) { sc = b.scene; vo += `\n=== ${sc} ===\n\n`; md += `\n## ${sc}\n\n| Time | Shots | On-screen | Voice-over |\n|---|---|---|---|\n`; }
  if (b.vo) { vo += `[${tc(b.start)}] ${b.vo}\n`; words += b.vo.split(/\s+/).length; }
  const txt = b.mg.map(m => m.t ? (Array.isArray(m.t) ? m.t.join(' ') : m.t) + (m.unit ? ' ' + m.unit : '') : m.items ? m.items.join(' / ') : m.a ? `${m.a} vs ${m.b}` : m.k).join(' · ');
  md += `| ${tc(b.start)} | ${b.shots.map(s => s.name).join(', ')} | ${txt} | ${b.vo || '—'} |\n`;
  const sfx = [...b.sfx];
  b.shots.forEach((s, si) => { if (bi + si > 0) sfx.push([['cut1', 'cut2', 'cut3'][(bi + si) % 3], Math.max(0, s.start - 0.12), 0.35]); });
  if (bi > 0 && BEATS[bi - 1].scene !== b.scene) sfx.push(['whoosh_big', 0, 0.6]);
  for (const m of b.mg) {
    const a = m.at;
    if (m.k === 'title') sfx.push(['hit_text', a, 0.8]);
    if (m.k === 'stamp') sfx.push(['stamp', a, 1]);
    if (m.k === 'big') { if (m.count) sfx.push(['counter', a, 0.5]); sfx.push(['hit_soft', a + (m.count ? 1.0 : 0), 0.6]); }
    if (m.k === 'kicker') sfx.push(['ui_tick', a, 0.5]);
    if (m.k === 'callout') sfx.push(['ui_blip', a, 0.5]);
    if (m.k === 'loc') sfx.push(['typewriter', a + 0.15, 0.4]);
    if (m.k === 'vs') sfx.push(['swish', a, 0.5], ['ui_blip', a + 0.25, 0.5]);
    if (m.k === 'meter') sfx.push(['meter_rise', a, 0.6]);
    if (m.k === 'depthbar') (m.marks || []).forEach((_, i) => sfx.push(['ui_blip', a + 0.5 + i * 0.4, 0.4]));
    if (m.k === 'options') { sfx.push(['ui_open', a, 0.6]); m.items.forEach((_, i) => sfx.push(['ui_item', a + 0.3 + i * 0.35, 0.5])); if (m.pickAt != null) sfx.push(['ui_select', a + m.pickAt, 0.8], ['scribble', a + m.pickAt + 0.1, 0.5]); }
  }
  out.push({ start: b.start, dur: b.dur, sfx, music: b.music, scene: b.scene, type: SURF.has(b.shots[0].name) || (b.shots[0].name === 'breath' && b.shots[0].p.phase === 0) ? 'surface' : b.shots[0].name === 'endcard' ? 'endcard' : 'under', hud: !!b.hud });
});
vo += `\n(${words} words)\n`;
fs.writeFileSync('../voiceover-en.txt', vo); fs.writeFileSync('../script-en.md', md);
fs.writeFileSync('cues.json', JSON.stringify({ total: TOTAL, beats: out }));
console.log('total', tc(TOTAL), 'beats', BEATS.length, 'words', words);
