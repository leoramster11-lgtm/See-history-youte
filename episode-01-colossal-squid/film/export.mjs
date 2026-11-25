// Exports: voiceover-en.txt (for AI TTS), script-en.md (shot list), cues.json (for sound engine)
import { BEATS, TOTAL } from './timeline.js';
import fs from 'fs';
const tc = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
let vo = `THE COLOSSAL SQUID — Voice-over script (English)\nRuntime ≈ ${tc(TOTAL)}. Read calm, low and slow (~145 words per minute).\n[pause] = hold 1–2 seconds of silence.\n`;
let md = `# Episode 1 — The Colossal Squid (v2, beat-by-beat)\n\nRuntime **${tc(TOTAL)}** · ${BEATS.length} beats · avg ${(TOTAL / BEATS.length).toFixed(1)} s per beat.\nGenerated from \`film/timeline.js\` — the same file drives the animation and the sound.\n\n`;
let sc = '', words = 0;
for (const b of BEATS) {
  if (b.scene !== sc) { sc = b.scene; vo += `\n\n=== ${sc} ===\n\n`; md += `\n## ${sc}\n\n| Time | Shot | Text on screen | Sound | Voice-over |\n|---|---|---|---|---|\n`; }
  if (b.vo) { vo += b.vo + '\n'; words += b.vo.split(/\s+/).length; } else vo += '[pause]\n';
  const p = Object.entries(b.shot[1]).map(([k, v]) => `${k}:${JSON.stringify(v)}`).join(' ');
  md += `| ${tc(b.start)} | ${b.shot[0]} ${p} | ${(b.slam || b.shot[1].lines || []).join(' / ')} | ${(b.sfx || []).map(s => s[0]).join(', ')} | ${b.vo || '*(silence)*'} |\n`;
}
vo += `\n\n(${words} words)\n`;
fs.writeFileSync('../voiceover-en.txt', vo);
fs.writeFileSync('../script-en.md', md);
fs.writeFileSync('cues.json', JSON.stringify({ total: TOTAL, beats: BEATS.map(b => ({ start: b.start, dur: b.dur, sfx: b.sfx || [], music: b.music || null, scene: b.scene, type: b.shot[0] })) }));
console.log('total', tc(TOTAL), 'beats', BEATS.length, 'words', words);
