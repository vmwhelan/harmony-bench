'use strict';
/* =========================================================================
   Practice and band: count-in, speed trainer, play-along (mute chords),
   synthesized drums and an automatic bass line that follow the time
   signature, and MIDI export. Drum and bass patterns are generated once as
   events, which both live playback and the MIDI file use.
   Loaded after app.js and before docs.js.
   ========================================================================= */
const DRUM_STYLES = [['off', 'Off'], ['rock', 'Rock'], ['pop', 'Pop'], ['ballad', 'Ballad'], ['halftime', 'Half-time'], ['swing', 'Swing (jazz)']];

/* ---- Drum patterns ----
   Built from the meter's beat groups: in a group of 2 the first beat gets the kick and the second the snare
   (4/4 rock: kick 1 & 3, snare 2 & 4); a group of 3 starts with the kick, or the snare on alternate groups
   (6/8: kick on 1, snare on 4). The last group of every 4th bar is a fill, and a crash marks each new phrase. */
function beatMap(){
  const gIdx = [], gPos = [], gSize = [];
  let b0 = 0;
  tsGroups().forEach((g, gi) => { for (let j = 0; j < g; j++){ gIdx[b0 + j] = gi; gPos[b0 + j] = j; gSize[b0 + j] = g; } b0 += g; });
  return { gIdx, gPos, gSize, groups: tsGroups().length };
}
function drumEvents(style, start, beats){
  const ev = [], n = S.ts.num, M = beatMap(), sub = S.ts.den <= 4 ? 2 : 1;
  const add = (at, kind, vel) => ev.push({ at, kind, vel });
  for (let b = 0; b < beats; b++){
    const B = start + b, inBar = B % n, bar = Math.floor(B / n);
    const gi = M.gIdx[inBar], gp = M.gPos[inBar], gs = M.gSize[inBar];
    if (inBar === 0 && bar > 0 && bar % 4 === 0 && style !== 'ballad') add(b, 'crash', 0.6);
    if (style === 'swing'){
      add(b, 'ride', gp === 0 ? 0.6 : 0.5);
      if (inBar % 2 === 1){ add(b + 2 / 3, 'ride', 0.38); add(b, 'pedal', 0.45); }
      if (inBar === 0) add(b, 'kick', 0.35);
      continue;
    }
    const fill = bar % 4 === 3 && gi === M.groups - 1 && style !== 'ballad';
    if (fill){ for (let s = 0; s < sub * 2; s++) add(b + s / (sub * 2), 'snare', 0.45 + 0.4 * ((gp * sub * 2 + s) / (gs * sub * 2))); continue; }
    let kick = false, snare = false;
    if (style === 'halftime'){
      kick = inBar === 0;
      snare = n % 2 === 0 ? inBar === n / 2 : (gp === 0 && gi === 1);
    } else if (gs === 2){ kick = gp === 0; snare = gp === 1; }
    else if (gs === 3){ if (gp === 0){ kick = gi % 2 === 0; snare = gi % 2 === 1; } else if (M.groups === 1 && style !== 'ballad'){ snare = true; } }
    else { kick = gp === 0; snare = gp === Math.floor(gs / 2); }
    if (style === 'ballad'){ kick = kick && (inBar === 0 || gi % 2 === 0); }
    if (kick) add(b, 'kick', inBar === 0 ? 0.95 : 0.8);
    if (snare) add(b, style === 'ballad' ? 'rim' : 'snare', M.groups === 1 && gp > 0 ? 0.45 : 0.8);
    if (style === 'pop' && gs === 2 && gp === 1 && gi % 2 === 0) add(b + 0.5, 'kick', 0.6);
    const hs = style === 'ballad' ? 1 : style === 'pop' && sub === 2 ? 4 : sub;
    for (let s = 0; s < hs; s++) add(b + s / hs, 'hat', s === 0 ? 0.5 : 0.32);
  }
  return ev;
}

/* ---- Bass line ----
   Root on the chord's first beat, the 5th or root on other beat groups, and on the chord's last beat a
   chromatic approach note into the next chord's root. Swing walks through the chord tones. */
const bassRootMidi = pc => 28 + mod(pc - 28);
function bassEvents(style, ch, nextCh, start, beats){
  const ev = [], n = S.ts.num, M = beatMap();
  const root = bassRootMidi(ch.bassPc ?? ch.rootPc);
  const fifthT = ch.tones.find(t => t.num === 5), thirdT = ch.tones.find(t => t.num === 3);
  const fifth = root + (fifthT ? mod(fifthT.semis) : 7), third = root + (thirdT ? mod(thirdT.semis) : 4);
  const nextRoot = nextCh ? bassRootMidi(nextCh.bassPc ?? nextCh.rootPc) : null;
  const approach = nextRoot == null ? null : nextRoot > root ? nextRoot - 1 : nextRoot + 1;
  for (let b = 0; b < beats; b++){
    const inBar = (start + b) % n, gp = M.gPos[inBar], last = b === beats - 1;
    let note = null, vel = 0.8;
    if (style === 'swing'){
      note = b === 0 ? root : last && approach != null && beats > 1 ? approach : [root, third, fifth, root + 12][b % 4];
    } else if (b === 0) { note = root; vel = 0.92; }
    else if (last && approach != null && beats > 1 && style !== 'ballad') note = approach;
    else if (gp === 0) note = style === 'ballad' ? null : fifth;
    else if (style !== 'ballad' && style !== 'halftime') { note = root; vel = 0.65; }
    if (note != null) ev.push({ at: b, midi: note, vel, dur: 1 });
    if (style === 'pop' && note != null && !last && S.ts.den <= 4) ev.push({ at: b + 0.5, midi: note, vel: 0.55, dur: 0.5 });
  }
  // each note lasts until the next one
  ev.sort((a, x) => a.at - x.at).forEach((e, i, a) => { e.dur = (i + 1 < a.length ? a[i + 1].at : beats) - e.at; });
  return ev;
}

/* ---- Drum sounds (synthesized live) ---- */
let NOISE = null;
function noiseBuf(){
  if (NOISE) return NOISE;
  const ctx = ac(), len = ctx.sampleRate;
  NOISE = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = NOISE.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return NOISE;
}
function drumBus(){
  if (AU.drums) return AU.drums;
  const ctx = ac(), g = ctx.createGain(), send = ctx.createGain();
  g.gain.value = 0.9; send.gain.value = 0.12;
  g.connect(AU.master); g.connect(send); send.connect(AU.rev);
  AU.drums = g;
  return g;
}
function playDrum(kind, t, vel, dest){
  const ctx = ac();
  const env = (node, peak, decay) => { const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * vel, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0008, t + decay); node.connect(g); g.connect(dest); return g; };
  const noise = (type, f, q, peak, decay) => {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf();
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
    src.connect(flt); env(flt, peak, decay);
    src.start(t, Math.random() * 0.5); src.stop(t + decay + 0.05);
  };
  if (kind === 'kick'){
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    env(o, 1.1, 0.38); o.start(t); o.stop(t + 0.42);
    noise('lowpass', 2500, 0.7, 0.15, 0.02);
  } else if (kind === 'snare' || kind === 'rim'){
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(kind === 'rim' ? 420 : 200, t); o.frequency.exponentialRampToValueAtTime(kind === 'rim' ? 380 : 150, t + 0.08);
    env(o, kind === 'rim' ? 0.35 : 0.45, kind === 'rim' ? 0.05 : 0.12); o.start(t); o.stop(t + 0.15);
    if (kind === 'snare') noise('highpass', 1400, 0.7, 0.55, 0.2);
  } else if (kind === 'hat' || kind === 'pedal') noise('highpass', 8000, 0.7, kind === 'pedal' ? 0.25 : 0.32, 0.05);
  else if (kind === 'ride') noise('bandpass', 7000, 1.5, 0.35, 0.45);
  else if (kind === 'crash') noise('highpass', 5000, 0.5, 0.55, 1.2);
}

/* ---- Hooks called from the playback engine in app.js ---- */
const bandBassSound = () => soundFor('bass');
const bassLineOn = () => S.band.bass && kind() !== 'bass';
function bandStart(ctx){
  PB.loops = 0; PB.startBpm = S.bpm;
  PB.out.gain.value = S.muteChords ? 0 : 1;
  PB.drumOut = ctx.createGain(); PB.drumOut.gain.value = S.band.vol; PB.drumOut.connect(drumBus());
  PB.bandBassOut = ctx.createGain(); PB.bandBassOut.gain.value = S.band.vol; PB.bandBassOut.connect(busFor(bandBassSound()));
  PB.bandBassV = null;
  // count-in: one bar of clicks before the music starts
  if (S.countIn){
    const spb = 60 / S.bpm, acc = barAccents();
    for (let b = 0; b < S.ts.num; b++) clickAt(PB.t + b * spb, acc[b]);
    PB.t += S.ts.num * spb;
  }
}
function bandStop(){
  const t = AU.ctx ? AU.ctx.currentTime : 0;
  [PB.drumOut, PB.bandBassOut].forEach(g => { if (g){ try { g.gain.setTargetAtTime(0, t, 0.04); setTimeout(() => g.disconnect(), 400); } catch (e) {} } });
  PB.drumOut = PB.bandBassOut = null;
  if (S.trainer.on && PB.startBpm && S.bpm !== PB.startBpm){
    const reached = S.bpm;
    S.bpm = PB.startBpm; save();
    toast(`Speed trainer reached ${reached} BPM. Tempo reset to ${S.bpm}.`, { label: `Keep ${reached}`, fn: () => { S.bpm = reached; save(); renderTab(); } });
  }
}
// each time the progression loops: the speed trainer may raise the tempo
function bandOnLoop(){
  PB.loops = (PB.loops || 0) + 1;
  const tr = S.trainer;
  if (!tr.on || PB.loops % Math.max(1, tr.every) !== 0 || S.bpm >= tr.target) return;
  S.bpm = Math.min(tr.target, S.bpm + Math.max(1, tr.step));
  ['#bpmN', '#bpmR'].forEach(id => { const el = $(id); if (el) el.value = S.bpm; });
  const st = $('#trStatus'); if (st) st.textContent = `Now ${S.bpm} BPM`;
}
function bandSched(e, t, ch){
  const style = S.band.drums, spb = 60 / S.bpm, beats = e.it.b, start = PB.beat;
  if (style !== 'off') drumEvents(style, start, beats).forEach(d => playDrum(d.kind, t + d.at * spb, d.vel, PB.drumOut));
  if (bassLineOn()){
    const ni = PB.seq.indexOf(e) + 1, nextE = ni < PB.seq.length ? PB.seq[ni] : (S.loop ? PB.seq[0] : null);
    const snd = bandBassSound();
    bassEvents(style === 'off' ? 'rock' : style, ch, nextE ? nextE.ch || fromItem(nextE.it) : null, start, beats).forEach(x => {
      const tt = t + x.at * spb;
      cutVoice(PB.bandBassV, tt);
      PB.bandBassV = playNote(snd, x.midi, tt, { vel: x.vel, dur: x.dur * spb * 0.95, dest: PB.bandBassOut });
    });
  }
}

/* ---- MIDI export (Standard MIDI File, type 1) ---- */
const GM = { steel: 25, jumbo: 25, warm: 25, bright: 25, nylon: 24, twelve: 25, eclean: 27, ejazz: 26, ecrunch: 29, edist: 30,
  finger: 33, picked: 34, acoustic: 32, upright: 32, arco: 43, synth: 38, concert: 24, tenor: 24,
  grand: 0, upright_p: 0, epiano: 4, organ: 16, harpsi: 6, pad: 89, solo: 40, section: 48, sordino: 40, pizz: 45 };
function gmProgram(snd){
  if (snd.kind === 'piano' && snd.id === 'upright') return 0;
  if (snd.kind === 'piano' && snd.id === 'bright') return 1;
  if (snd.kind === 'bowed' && snd.id === 'solo') return { violin: 40, viola: 41, cello: 42 }[S.inst] ?? 40;
  return GM[snd.id] ?? 0;
}
const vlq = n => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const utf8 = s => [...new TextEncoder().encode(s)];
const meta = (type, bytes) => [0xff, type, ...vlq(bytes.length), ...bytes];
function trackChunk(events){
  events.sort((a, b) => a.tick - b.tick || a.ord - b.ord);
  const data = [];
  let last = 0;
  events.forEach(e => { data.push(...vlq(e.tick - last), ...e.bytes); last = e.tick; });
  data.push(0, 0xff, 0x2f, 0);
  return [0x4d, 0x54, 0x72, 0x6b, ...u32(data.length), ...data];
}
// Chord voicing for export: the custom voicing if there is one, otherwise the shape or voicing playback would use
function exportVoicing(it, ch, prevUp){
  if (fretted()){
    const s = itemShape(it, ch), v = s ? s.list[s.idx] : null, et = eff();
    if (v) return { midis: v.frets.map((f, i) => f === null ? null : et[i] + f).filter(m => m !== null) };
  }
  const pv = it.pv ? itemPiano(it, ch) : null;
  if (pv && pv.custom) return { midis: pv.list[pv.idx].midis };
  const up = S.smooth ? leadUpper(ch, prevUp) : rootUpper(ch);
  return { midis: [pianoBass(ch), ...up], up };
}
function buildMidi(seq, sections){
  const PPQ = 480, tpb = PPQ * 4 / S.ts.den, quarterBpm = S.bpm * 4 / S.ts.den;
  const conductor = [
    { tick: 0, ord: 0, bytes: meta(0x03, utf8(sections ? W.song.name : W.prog.name)) },
    { tick: 0, ord: 0, bytes: meta(0x51, [...u32(Math.round(60e6 / quarterBpm))].slice(1)) },
    { tick: 0, ord: 0, bytes: meta(0x58, [S.ts.num, Math.log2(S.ts.den), 24, 8]) },
  ];
  const chordsT = [], bassT = [], drumsT = [];
  const snd = soundFor(kind()), prog0 = gmProgram(snd);
  chordsT.push({ tick: 0, ord: 0, bytes: meta(0x03, utf8(`${INST[S.inst].name} (${snd.name})`)) }, { tick: 0, ord: 1, bytes: [0xc0, prog0] });
  const bassOn = bassLineOn() || kind() === 'bass';
  if (bassOn) bassT.push({ tick: 0, ord: 0, bytes: meta(0x03, utf8('Bass')) }, { tick: 0, ord: 1, bytes: [0xc1, gmProgram(kind() === 'bass' ? snd : bandBassSound())] });
  if (S.band.drums !== 'off') drumsT.push({ tick: 0, ord: 0, bytes: meta(0x03, utf8('Drums')) });
  const DRUM_NOTE = { kick: 36, snare: 38, rim: 37, hat: 42, pedal: 44, ride: 51, crash: 49 };
  // ticks run on; each section can change the tempo, time signature (and so the length of a beat) and key
  let tick0 = 0, bb = 0, prevUp = null, lastTempo = quarterBpm, lastTs = tsText(S.ts);
  seq.forEach((e, idx) => inSection(e.sec, () => {
    if (e.sec && e.i === 0) bb = 0;   // sections start on a downbeat, as in playback
    const tpbS = PPQ * 4 / S.ts.den, qb = S.bpm * 4 / S.ts.den;
    const ch = e.ch || fromItem(e.it), beats = e.it.b, t0 = Math.round(tick0), t1 = Math.round(tick0 + beats * tpbS);
    if (e.sec && e.i === 0){
      if (qb !== lastTempo){ conductor.push({ tick: t0, ord: 0, bytes: meta(0x51, [...u32(Math.round(60e6 / qb))].slice(1)) }); lastTempo = qb; }
      if (tsText(S.ts) !== lastTs){ conductor.push({ tick: t0, ord: 0, bytes: meta(0x58, [S.ts.num, Math.log2(S.ts.den), 24, 8]) }); lastTs = tsText(S.ts); }
    }
    if (sections && e.i === 0) conductor.push({ tick: t0, ord: 1, bytes: meta(0x06, utf8(sections[idx])) });
    chordsT.push({ tick: t0, ord: 2, bytes: meta(0x01, utf8(ch.symbol)) });
    if (kind() !== 'bass'){
      const v = exportVoicing(e.it, ch, prevUp);
      if (v.up) prevUp = v.up;
      // a strumming or picking pattern plays as its strums and picks; otherwise the chord is held
      const pat = curPattern();
      if (pat) patternNotes(pat, v.midis, S.strumRestart ? 0 : bb, beats, ch).forEach(x => {
        const a = Math.round(tick0 + x.at * tpbS), z = Math.round(tick0 + Math.min(beats, x.at + x.dur) * tpbS) - 6;
        chordsT.push({ tick: a, ord: 3, bytes: [0x90, x.midi, Math.round(x.vel * 105)] }, { tick: Math.max(a + 1, z), ord: 0, bytes: [0x80, x.midi, 0] });
      });
      else v.midis.forEach(m => { chordsT.push({ tick: t0, ord: 3, bytes: [0x90, m, 84] }); chordsT.push({ tick: t1 - 8, ord: 0, bytes: [0x80, m, 0] }); });
    }
    const next = seq[idx + 1] || (S.loop ? seq[0] : null), nextCh = next ? next.ch || fromItem(next.it) : null;
    const at = b => Math.round(tick0 + b * tpbS);
    if (bassOn) bassEvents(S.band.drums === 'off' ? 'rock' : S.band.drums, ch, nextCh, bb, beats).forEach(x => {
      const a = at(x.at), z = at(x.at + x.dur) - 6;
      bassT.push({ tick: a, ord: 3, bytes: [0x91, x.midi, Math.round(x.vel * 110)] }, { tick: Math.max(a + 1, z), ord: 0, bytes: [0x81, x.midi, 0] });
    });
    if (S.band.drums !== 'off') drumEvents(S.band.drums, bb, beats).forEach(d => {
      const a = at(d.at);
      drumsT.push({ tick: a, ord: 3, bytes: [0x99, DRUM_NOTE[d.kind], Math.round(d.vel * 120)] }, { tick: a + 30, ord: 0, bytes: [0x89, DRUM_NOTE[d.kind], 0] });
    });
    tick0 += beats * tpbS; bb += beats;
  }));
  const tracks = [conductor, chordsT, ...(bassOn ? [bassT] : []), ...(S.band.drums !== 'off' ? [drumsT] : [])];
  return new Uint8Array([0x4d, 0x54, 0x68, 0x64, ...u32(6), 0, 1, 0, tracks.length, (PPQ >> 8) & 255, PPQ & 255, ...tracks.flatMap(trackChunk)]);
}
function exportMidi(which){
  let seq, sections = null, name;
  if (which === 'song'){
    sections = [];
    seq = songSeq(); seq.forEach(e => sections.push(e.sec.name));
    name = W.song.name;
  } else { seq = prog.map((it, i) => ({ it, i })); name = W.edit ? W.song.parts.find(p => p.id === W.edit).name : W.prog.name; }
  if (!seq.length){ toast('Nothing to export yet.'); return; }
  const bytes = buildMidi(seq, sections);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
  a.download = `${(name || 'harmony-bench').replace(/[^\w\- ]+/g, '').trim() || 'harmony-bench'}.mid`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  toast(`Downloading ${a.download}: chords${bassLineOn() || kind() === 'bass' ? ', bass' : ''}${S.band.drums !== 'off' ? ', drums' : ''}. If nothing downloads, this preview may block downloads; it works on your own server.`);
}

/* ---- Controls (shown under the transport on the progression and song tabs) ---- */
function practiceHTML(which){
  const tr = S.trainer;
  return `<div class="practice">
    <div class="pgrp"><span class="lbl">Practice</span>
      <label class="chk" title="One bar of clicks before playback starts"><input type="checkbox" id="countIn"${S.countIn ? ' checked' : ''}> Count-in</label>
      <label class="chk" title="Silence your instrument's chords and play them yourself, with the band"><input type="checkbox" id="muteChords"${S.muteChords ? ' checked' : ''}> Mute chords (play along)</label>
      <span class="trainer"><label class="chk"><input type="checkbox" id="trOn"${tr.on ? ' checked' : ''}> Speed trainer:</label> +<input type="number" id="trStep" min="1" max="20" value="${tr.step}" aria-label="BPM to add"> BPM every <input type="number" id="trEvery" min="1" max="16" value="${tr.every}" aria-label="Loops between increases"> loop${tr.every > 1 ? 's' : ''}, up to <input type="number" id="trTarget" min="30" max="300" value="${tr.target}" aria-label="Target tempo"> <span class="muted" id="trStatus">${PB.on && tr.on ? `Now ${S.bpm} BPM` : ''}</span></span>
    </div>
    <div class="pgrp"><span class="lbl">Band</span>
      <label class="fld"><span>Drums</span><select id="drumStyle">${DRUM_STYLES.map(([v, l]) => `<option value="${v}"${S.band.drums === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="chk" title="${kind() === 'bass' ? 'Your instrument is already the bass' : 'An automatic bass line under the chords'}"><input type="checkbox" id="bassLine"${S.band.bass ? ' checked' : ''}${kind() === 'bass' ? ' disabled' : ''}> Bass line</label>
      <label class="fld"><span>Band volume</span><input type="range" id="bandVol" min="0" max="1.5" step="0.05" value="${S.band.vol}"></label>
      <button class="btn sm" data-act="midiExport" data-arg="${which}" title="Chords, bass and drums as a MIDI file for GarageBand, Logic, Ableton, etc.">Download MIDI</button>
    </div></div>`;
}
Object.assign(ACT, { midiExport: el => exportMidi(el.dataset.arg) });
document.addEventListener('change', e => {
  const t = e.target, tr = S.trainer;
  if (t.id === 'countIn') S.countIn = t.checked;
  else if (t.id === 'muteChords'){ S.muteChords = t.checked; if (PB.on && PB.out) PB.out.gain.setTargetAtTime(S.muteChords ? 0 : 1, AU.ctx.currentTime, 0.03); }
  else if (t.id === 'trOn') tr.on = t.checked;
  else if (t.id === 'trStep') tr.step = clamp(Math.round(+t.value || 2), 1, 20);
  else if (t.id === 'trEvery') tr.every = clamp(Math.round(+t.value || 1), 1, 16);
  else if (t.id === 'trTarget') tr.target = clamp(Math.round(+t.value || 120), 30, 300);
  else if (t.id === 'drumStyle') S.band.drums = t.value;
  else if (t.id === 'bassLine') S.band.bass = t.checked;
  else return;
  save();
});
document.addEventListener('input', e => {
  if (e.target.id !== 'bandVol') return;
  S.band.vol = +e.target.value; save();
  if (PB.on && AU.ctx) [PB.drumOut, PB.bandBassOut].forEach(g => g && g.gain.setTargetAtTime(S.band.vol, AU.ctx.currentTime, 0.05));
});
