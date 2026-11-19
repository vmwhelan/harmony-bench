'use strict';
/* ================= Instruments ================= */
const INST = {
  guitar: { name: 'Guitar (6-string)', kind: 'guitar', tuning: [40,45,50,55,59,64], presets: [
    ['Standard (E A D G B E)', [40,45,50,55,59,64]], ['Drop D', [38,45,50,55,59,64]], ['Half step down', [39,44,49,54,58,63]],
    ['Whole step down', [38,43,48,53,57,62]], ['Drop C', [36,43,48,53,57,62]], ['DADGAD', [38,45,50,55,57,62]],
    ['Open G (D G D G B D)', [38,43,50,55,59,62]], ['Open D (D A D F♯ A D)', [38,45,50,54,57,62]], ['Open E', [40,47,52,56,59,64]],
    ['Open C (C G C G C E)', [36,43,48,55,60,64]], ['Nashville (high-strung)', [52,57,62,67,59,64]] ] },
  guitar7: { name: 'Guitar (7-string)', kind: 'guitar', defSound: 'eclean', tuning: [35,40,45,50,55,59,64], presets: [
    ['Standard (B E A D G B E)', [35,40,45,50,55,59,64]], ['Drop A', [33,40,45,50,55,59,64]], ['Half step down', [34,39,44,49,54,58,63]],
    ['Russian (D G B D G B D)', [38,43,47,50,55,59,62]], ['Jazz low A (A E A D G B E)', [33,40,45,50,55,59,64]] ] },
  violin: { name: 'Violin', kind: 'bowed', fretless: true, tuning: [55,62,69,76], presets: [
    ['Standard (G D A E)', [55,62,69,76]], ['Cross-tuning (A E A E)', [57,64,69,76]], ['Fiddle (G D G D)', [55,62,67,74]], ['Calico (A E A C♯)', [57,64,69,73]] ] },
  viola: { name: 'Viola', kind: 'bowed', fretless: true, tuning: [48,55,62,69], presets: [ ['Standard (C G D A)', [48,55,62,69]] ] },
  cello: { name: 'Cello', kind: 'bowed', fretless: true, tuning: [36,43,50,57], presets: [
    ['Standard (C G D A)', [36,43,50,57]], ['Kodály scordatura (B F♯ D A)', [35,42,50,57]], ['Fifth-low C to B♭ (B♭ G D A)', [34,43,50,57]] ] },
  bass4: { name: 'Bass (4-string)', kind: 'bass', tuning: [28,33,38,43], presets: [
    ['Standard (E A D G)', [28,33,38,43]], ['Drop D', [26,33,38,43]], ['Half step down', [27,32,37,42]], ['B E A D', [23,28,33,38]] ] },
  bass5: { name: 'Bass (5-string)', kind: 'bass', tuning: [23,28,33,38,43], presets: [
    ['Standard (B E A D G)', [23,28,33,38,43]], ['High C (E A D G C)', [28,33,38,43,48]] ] },
  uke: { name: 'Ukulele (high G)', kind: 'uke', tuning: [67,60,64,69], presets: [
    ['Standard (G C E A, high G)', [67,60,64,69]], ['Low G', [55,60,64,69]], ['D tuning (A D F♯ B)', [69,62,66,71]] ] },
  bari: { name: 'Baritone ukulele', kind: 'uke', tuning: [50,55,59,64], presets: [ ['Standard (D G B E)', [50,55,59,64]] ] },
  piano: { name: 'Piano', kind: 'piano' },
};
let FRETS = 15;
// Sustain menu: how fast strings and pianos decay, and how long a previewed chord sounds (seconds)
const SUSTAIN = { short: { ring: 0.3, chord: 0.7, name: 'Short' }, medium: { ring: 0.45, chord: 1.1, name: 'Medium' }, long: { ring: 0.75, chord: 2.2, name: 'Long' } };
const chordLen = () => SUSTAIN[S.ring].chord;

/* ================= State ================= */
// keyPc/scale: the key in the header. explore: the key of the Scales, Chord library and Learn tabs, which never
// changes a progression or a song (null until first used: it starts as the key in the header)
const DEF = { keyPc: 0, scale: 'harmonic', explore: null, inst: 'guitar', tun: {}, capo: {}, shape: {}, piano: [48, 60, 63, 67], showPiano: true,
  clickMode: 'place', labels: 'interval', overlay: 'scale', tab: 'scales', ext7: false, cmp: 'roots',
  lib: { root: 0, q: 'm', bass: null, inv: false }, snd: {}, frets: 15, ring: 'medium', pinPanel: false, fretNums: 'actual', progCharts: false, shapes: { sys: 'all', deg: 0, str: 0, caged: 'E', slide: 0 }, showNext: true,
  countIn: false, muteChords: false, trainer: { on: false, step: 2, every: 2, target: 120 }, band: { drums: 'off', bass: false, vol: 0.8 },
  tuner: { ref: 440, mode: 'single', dev: '', ch: 'both', chordKeep: true, chordStep: false }, midiIn: { dev: '', step: false },
  notation: false, print: { diagrams: true, chart: true, rn: false, lyrics: true, notation: false }, bpm: 88, defBeats: 4, style: 'rhythm', strum: 'auto', strumRestart: false, loop: true, click: false, smooth: true,
  ts: { num: 4, den: 4, groups: null } };
// W is the workspace: the open progression, the open song, and which song section (if any) the
// progression builder is editing. `prog` always points at the chord list being edited.
let S, prog, W;
(function load(){
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('harmony-bench-v1') || 'null'); } catch (e) {}
  S = Object.assign(JSON.parse(JSON.stringify(DEF)), saved && saved.s ? saved.s : {});
  if (!SC[S.scale]) S.scale = 'harmonic';
  if (S.explore && !(SC[S.explore.scale] && S.explore.pc >= 0 && S.explore.pc < 12)) S.explore = null;
  if (!INST[S.inst]) S.inst = 'guitar';
  S.lib = Object.assign({}, DEF.lib, S.lib || {});
  if (!QMAP[S.lib.q]) S.lib.q = 'm';
  S.snd = S.snd || {};
  S.trainer = Object.assign({}, DEF.trainer, S.trainer || {});
  S.band = Object.assign({}, DEF.band, S.band || {});
  S.tuner = Object.assign({}, DEF.tuner, S.tuner || {});
  S.midiIn = Object.assign({}, DEF.midiIn, S.midiIn || {});
  S.print = Object.assign({}, DEF.print, S.print || {});
  S.shapes = Object.assign({}, DEF.shapes, S.shapes || {});
  // the old "Scale position" menu picked the 3-notes-per-string shape starting on a scale degree
  if (S.scalePos > 0){ S.shapes = { ...S.shapes, sys: '3nps', deg: S.scalePos - 1, str: 0, slide: 0 }; }
  delete S.scalePos;
  if (!SUSTAIN[S.ring]) S.ring = 'medium';
  RING = SUSTAIN[S.ring].ring;
  FRETS = S.frets === 24 ? 24 : 15;
  if (!S.ts || !(S.ts.num >= 1) || ![1,2,4,8,16,32].includes(S.ts.den)) S.ts = { num: 4, den: 4, groups: null };
  const clean = a => (Array.isArray(a) ? a : []).filter(it => it && QMAP[it.q]);
  if (saved && saved.w && saved.w.prog && saved.w.song){
    W = saved.w;
    W.prog.items = clean(W.prog.items);
    W.song.parts = (W.song.parts || []).map(p => ({ ...p, items: clean(p.items), lyrics: p.lyrics || '' }));
    W.song.order = (W.song.order || []).filter(id => W.song.parts.some(p => p.id === id));
  } else {
    const items = saved && Array.isArray(saved.prog) ? clean(saved.prog) : [[0,0,'m',4],[5,3,'m',4],[8,5,'maj',4],[7,4,'7',4]].map(([s,l,q,b]) => ({ s, l, q, b }));
    W = { prog: { id: null, name: '', autoName: true, notes: '', created: null, updated: null, items, saved: null },
      song: { id: null, name: 'Untitled song', artist: '', notes: '', created: null, updated: null, parts: [], order: [], saved: null }, edit: null };
  }
  if (!W.prog.id && (!W.prog.name || W.prog.name === 'Untitled progression')) W.prog.autoName = true;
  const part = W.edit && W.song.parts.find(p => p.id === W.edit);
  if (!part) W.edit = null;
  prog = part ? part.items : W.prog.items;
})();
let saveT = 0;
function saveNow(){ clearTimeout(saveT); saveT = 0; try { localStorage.setItem('harmony-bench-v1', JSON.stringify({ s: S, w: W })); } catch (e) {} }
function save(){ clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
// write any pending change before the page is closed, reloaded or hidden
window.addEventListener('pagehide', () => { if (saveT) saveNow(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && saveT) saveNow(); });
const ui = { focus: null, ident: [], selSlot: 0, selEnd: 0, playing: -1, vSel: null, pal: [], recs: [], subs: [], fits: [], scCards: [], libV: [], prevT: [] };

const $ = s => document.querySelector(s);
const kind = () => INST[S.inst].kind;
const fretted = () => kind() !== 'piano';
function tuning(){
  const d = INST[S.inst].tuning;
  if (!d) return [];
  let t = S.tun[S.inst];
  if (!Array.isArray(t) || t.length !== d.length){ t = d.slice(); S.tun[S.inst] = t; }
  return t;
}
// A capo raises every open string; fingered frets are stored relative to the capo, like a chord chart
const capo = () => fretted() && !INST[S.inst].fretless ? (S.capo[S.inst] || 0) : 0;
// The selected sound for an instrument kind ('guitar', 'piano'…); the current instrument's own choice comes first
function soundFor(k){
  const list = SOUNDS[k] || SOUNDS.guitar;
  const inst = k === kind() ? S.inst : (k === 'piano' ? 'piano' : Object.keys(INST).find(i => INST[i].kind === k));
  return list.find(x => x.id === S.snd[inst]) || list.find(x => x.id === (INST[inst] || {}).defSound) || list[0];
}
const eff = () => tuning().map(m => m + capo());
const maxRel = () => FRETS - capo();
const voicingsFor = (ch, inv = false) => fretVoicings(ch, eff(), inv, maxRel());
function shape(){
  const n = tuning().length;
  let s = S.shape[S.inst];
  if (!Array.isArray(s) || s.length !== n){ s = new Array(n).fill(0); S.shape[S.inst] = s; }
  return s;
}
// notes played on a MIDI keyboard take over the readout and keyboard display while they are shown
const midiActive = () => !!(ui.midiHeld && ui.midiHeld.size);
function activeMidis(){
  if (midiActive()) return [...ui.midiHeld].sort((a, b) => a - b);
  if (!fretted()) return S.piano.slice().sort((a, b) => a - b);
  const t = eff();
  return shape().map((f, i) => f === null ? null : t[i] + f).filter(m => m !== null);
}
function computeKey(){ K = makeKey(S.keyPc, S.scale); ACACHE.clear(); }

/* ================= Sound helpers ================= */
const VO = [];
// opts.hold: sustain until released (press-and-hold); opts.dur: fixed length
function pluckString(s, f, t, vel = 0.85, dest, opts = {}){
  const ctx = ac(); t = t ?? ctx.currentTime;
  cutVoice(VO[s], t);
  VO[s] = playNote(kind(), eff()[s] + f, t, { vel, dest, ...opts });
  return VO[s];
}
function strumFrets(frets, t, dir = 'down', vel = 0.85, dest, onlyTop = 0){
  const ctx = ac(); t = t ?? ctx.currentTime + 0.01;
  let strs = [];
  frets.forEach((f, s) => { if (f !== null) strs.push(s); else { cutVoice(VO[s], t); VO[s] = null; } });
  if (onlyTop) strs = strs.slice(-onlyTop);
  if (dir === 'up') strs.reverse();
  const gap = dir === 'up' ? 0.013 : (dir === 'pick' ? 0.17 : 0.02);
  strs.forEach((s, k) => pluckString(s, frets[s], t + k * gap, vel * (1 - k * 0.025), dest, dest ? {} : { dur: chordLen() + (strs.length - k) * gap }));
}
function rollMidis(midis, t, gap = 0.012, dur = null, dest, vel = 0.75){
  const ctx = ac(); t = t ?? ctx.currentTime + 0.01; dur = dur ?? chordLen();
  midis.slice().sort((a, b) => a - b).forEach((m, k) => playNote(kind() === 'piano' ? 'piano' : kind(), m, t + k * gap, { vel, dur, dest }));
}
function bestFrets(ch){
  const v = voicingsFor(ch);
  return v.list.length ? v.list[v.best] : null;
}
function playChord(ch, load = true){
  ac(); ui.focus = ch;
  if (fretted()){
    const v = bestFrets(ch);
    if (v){
      if (load){ S.shape[S.inst] = v.frets.slice(); ui.vSel = v.frets.join('.'); }
      strumFrets(v.frets);
    } else {
      rollMidis(rootUpper(ch).map(m => kind() === 'bass' ? m - 24 : m), null, 0.02);
      toast(`No playable ${ch.symbol} shape in this tuning within four frets.`);
    }
  } else {
    const pv = pianoVoicings(ch);
    const v = pv.find(p => p.name.startsWith('Two hands')) || pv[0];
    if (load) S.piano = v.midis.slice();
    rollMidis(v.midis);
  }
  renderInstrument();
}
// Plays a list of chords one after another. Each entry is a chord, or a voiced chord { ch, frets } / { ch, midis }
// (a progression chord in its locked or automatic voicing, or a suggestion in the shape it would be played)
function previewSeq(chords, gap = 1.05){
  ui.prevT.forEach(clearTimeout); ui.prevT = [];
  chords.filter(Boolean).forEach((e, i) => ui.prevT.push(setTimeout(() => { playVoiced(e); refreshTabLight(); }, i * gap * 1000)));
}
function playVoiced(e){
  const ch = e.ch || e;
  if (e.frets && fretted()){ ac(); ui.focus = ch; S.shape[S.inst] = e.frets.slice(); strumFrets(e.frets); renderInstrument(); }
  else if (e.midis && !fretted()){ ac(); ui.focus = ch; S.piano = e.midis.slice(); rollMidis(e.midis); renderInstrument(); }
  else playChord(ch);
}

/* ---- Voicings for suggestions ----
   A progression chord sounds in its locked (or automatic) voicing; a suggested chord is voiced close to the
   chord before it, and how far the hand has to move counts a little in the ranking (easy changes first). */
// The voicing playback gives each chord, walking from the first chord as playback does: a chosen (✎) shape or
// keys exactly; otherwise the most common shape, or with Smooth voice leading the one nearest the chord before.
// Fretted: { ch, v } (v is a shape); piano: { ch, midis }; bass: { ch }.
function progVoicings(items, chs){
  let prevPos = null, prevUp = null;
  return items.map((it, i) => {
    const ch = chs ? chs[i] : fromItem(it);
    if (kind() === 'bass') return { ch };
    if (fretted()){
      const cs = getVo(it) ? itemShape(it, ch) : null;
      if (cs){ const v = cs.list[cs.idx]; prevPos = v.pos; return { ch, v, custom: true }; }
      const vl = voicingsFor(ch);
      if (!vl.list.length) return { ch };
      let v = vl.list[vl.best];
      if (S.smooth && prevPos != null) v = vl.list.reduce((b, x) => (Math.abs(x.pos - prevPos) + x.score * 0.4) < (Math.abs(b.pos - prevPos) + b.score * 0.4) ? x : b);
      prevPos = v.pos;
      return { ch, v };
    }
    const cv = it.pv ? itemPiano(it, ch) : null;
    if (cv && cv.custom){ const ms = cv.list[cv.idx].midis.slice().sort((a, b) => a - b); prevUp = ms.length > 1 ? ms.slice(1) : ms; return { ch, midis: ms, custom: true }; }
    const up = S.smooth ? leadUpper(ch, prevUp) : rootUpper(ch);
    prevUp = up;
    return { ch, midis: [pianoBass(ch), ...up] };
  });
}
// A small chart of one chord's voicing (fretted) or a mini keyboard (piano)
function voicingChart(pv){
  if (pv.v) return `<div class="sdg">${diagramSVG(pv.v, pv.ch, eff())}<span class="mono">${fretsText(pv.v.frets)}</span></div>`;
  if (pv.midis){
    const ms = pv.midis, lo = Math.floor(Math.min(...ms) / 12) * 12, hi = Math.max(lo + 23, Math.ceil((Math.max(...ms) + 1) / 12) * 12 - 1);
    return `<div class="sdg">${pianoSVG(lo, hi, ms, { w: 7, h: 40, ref: pv.ch, noOct: true, lbl: () => '' })}</div>`;
  }
  return '<div class="sdg"><span class="muted">no shape</span></div>';
}
function voicedOf(it, ch){
  if (!it || !ch) return null;
  if (fretted() && kind() !== 'bass'){ const s = itemShape(it, ch); return s ? { ch, frets: s.list[s.idx].frets } : { ch }; }
  if (!fretted()){ const p = itemPiano(it, ch); return { ch, midis: p.custom ? p.list[p.idx].midis : [pianoBass(ch), ...rootUpper(ch)] }; }
  return { ch };
}
// How much the fretting hand has to do between two shapes: a finger that stays put costs nothing, each
// finger that moves about 1, string changes (open, muted) less, plus the hand's shift along the neck.
// The same shape slid along the neck is cheap however many fingers it has.
function moveCost(a, b){
  const pos = f => { const fr = f.filter(v => v); return fr.length ? Math.min(...fr) : 0; };
  const pa = pos(a), pb = pos(b), shift = Math.abs(pa - pb);
  let c = 0, same = shift > 0;
  for (let i = 0; i < a.length; i++){
    const x = a[i], y = b[i];
    if (!(x === null && y === null) && !(x > 0 && y > 0 && x - pa === y - pb)) same = false;
    if (x === y) continue;
    if (x === null || y === null) c += (x || y) ? 0.8 : 0.3;
    else if (x === 0 || y === 0) c += 0.8;
    else c += 1 + 0.15 * Math.abs(x - y);
  }
  c += 0.4 * shift;
  return same ? Math.min(c, 1 + 0.6 * shift) : c;
}
// The chord voiced for an easy change from `from` (a voiced chord); cost and fingers kept for guitar-type instruments
function nearVoice(ch, from){
  if (fretted() && kind() !== 'bass'){
    const v = voicingsFor(ch);
    if (!v.list.length) return null;
    if (!from || !from.frets) return { ch, frets: v.list[v.best].frets };
    let best = null;
    v.list.forEach(x => { const c = moveCost(from.frets, x.frets), s = c + 1.5 * x.score; if (!best || s < best.s) best = { x, c, s }; });
    return { ch, frets: best.x.frets, cost: best.c, stay: from.frets.filter((f, i) => f > 0 && f === best.x.frets[i]).length };
  }
  if (!fretted()) return { ch, midis: [pianoBass(ch), ...(from && from.midis ? leadUpper(ch, from.midis.slice(1)) : rootUpper(ch))] };
  return null;
}
function easeNote(v, from){
  if (!v || v.cost == null || !from) return '';
  if (v.cost <= 2.5) return `an easy change from ${from.ch.symbol}${v.stay ? `: ${v.stay} finger${v.stay > 1 ? 's' : ''} stay put` : ''}`;
  if (v.cost >= 6) return `a bigger hand move from ${from.ch.symbol}`;
  return '';
}
const easeBonus = v => !v || v.cost == null ? 0 : v.cost <= 2.5 ? 0.35 : v.cost <= 4 ? 0.15 : v.cost >= 6 ? -0.25 : 0;
/* ---- Locked shapes, remembered per instrument and tuning ----
   item.vos = { 'guitar|38,43,50,55,59,62': { frets, pos }, 'uke|67,60,64,69': {…} }: trying a chord on another
   instrument or tuning never loses the shape chosen for this one. (Older items had one item.vo = { inst, frets,
   pos }; it becomes the entry for that instrument's tuning at the time.) Piano voicings are item.pv. */
const voKey = () => S.inst + '|' + tuning().join(',');
function vosOf(it){
  if (it.vo){
    const inst = it.vo.inst, t = Array.isArray(S.tun[inst]) ? S.tun[inst] : (INST[inst] && INST[inst].tuning) || [];
    it.vos = { [inst + '|' + t.join(',')]: { frets: it.vo.frets, pos: it.vo.pos }, ...(it.vos || {}) };
    delete it.vo;
  }
  return it.vos || null;
}
// The shape locked for this instrument and tuning; failing that, one locked in another tuning of the same
// instrument whose played strings are tuned the same (x32000 doesn't care what the low string is tuned to)
function getVo(it){
  const v = it && vosOf(it);
  if (!v) return null;
  // null: "Auto" was chosen for this tuning on purpose
  if (voKey() in v) return v[voKey()];
  const tun = tuning();
  for (const [k, vo] of Object.entries(v)){
    const [inst, t] = k.split('|'), other = t.split(',').map(Number);
    if (inst === S.inst && other.length === tun.length && vo.frets.every((f, i) => f === null || other[i] === tun[i])) return vo;
  }
  return null;
}
function setVo(it, frets){
  const fr = frets.filter(f => f !== null && f > 0);
  vosOf(it);
  it.vos = { ...(it.vos || {}), [voKey()]: { frets: frets.slice(), pos: fr.length ? Math.min(...fr) : 0 } };
}
function clearVo(it){
  if (!vosOf(it)) return;
  const k = voKey();
  delete it.vos[k];
  if (getVo(it)) it.vos[k] = null;   // a shape from another tuning would apply: keep Auto here
  if (!Object.values(it.vos).some(Boolean)) delete it.vos;
}
// Lock the exact shape on the neck (or the keys held on the keyboard) onto a progression item
function lockFromInstrument(it){
  if (!it || midiActive()) return;
  if (fretted()) setVo(it, shape());
  else it.pv = S.piano.slice().sort((a, b) => a - b);
}
// Lock a heard voicing onto a progression item (what you heard is what plays)
function lockVoice(it, v){
  if (!it || !v) return;
  if (v.frets) setVo(it, v.frets);
  else if (v.midis) it.pv = v.midis.slice().sort((a, b) => a - b);
}
const voicedAt = i => prog[i] ? voicedOf(prog[i], fromItem(prog[i])) : null;
// What follows the chord at `at`: the next chord; at the end of a song section being edited, the next
// section's first chord; otherwise, when looping, the first chord
function nextAfter(chs, at){
  if (at < chs.length - 1) return { ch: chs[at + 1], label: chs[at + 1].symbol, inside: true, voice: () => voicedAt(at + 1) };
  const cur = W.edit && partById(W.edit), nx = cur && sectionNeighbors(cur).next;
  if (nx){ const ch = firstChordOf(nx); return { ch, label: `${ch.symbol} (the start of ${nx.name})`, section: nx, voice: () => voicedOf(nx.items[0], ch) }; }
  if (chs.length > 1) return { ch: chs[0], label: `${chs[0].symbol} (the first chord, if the progression repeats)`, loop: true, voice: () => voicedAt(0) };
  return null;
}
// Whole-chord swaps for X that lead into what follows (for the last chord of a section: the next section,
// with the next key's V7 and pivot chords when it changes key)
function leadInSwaps(X, prev, nx, prevV){
  if (!nx || nx.ch.symbol === X.symbol) return [];
  const cands = candidatePool().map(p => p.ch);
  if (nx.section && !sameKey(secKey(nx.section), keyNow())){
    const k = secKey(nx.section);
    cands.unshift(dom7Of(k), ...pivotsBetween(keyNow(), k).map(x => x.ch));
  }
  const seen = new Set([X.symbol, nx.ch.symbol]);
  const base = cands.filter(c => !seen.has(c.symbol) && seen.add(c.symbol));
  const all = [...base, ...base.flatMap(c => bassVariants(c, prev, nx.ch)).filter(c => !seen.has(c.symbol) && seen.add(c.symbol))];
  return all.map(c => {
    const out = transition(c, nx.ch), v = nearVoice(c, prevV), bm = bassMove(prev, c, nx.ch);
    return { ch: c, out, voice: v, bass: bm.why, s: (prev ? transition(prev, c).score : 1.5) + 1.2 * out.score + easeBonus(v) + bm.s };
  }).sort((a, b) => b.s - a.s).slice(0, 4);
}
function playNoteNow(m){ ac(); playNote(kind() === 'piano' ? 'piano' : kind(), m, null, { vel: 0.85, dur: Math.min(1.2, chordLen()) }); }

/* ---- Press-and-hold on the neck and the keyboard ----
   Notes start on press (not on release), sustain while held, and fade when let go:
   quickly for a fretted note or a piano damper, a little slower for an open string. */
const HOLD = { v: null, tau: 0.12 };
function releaseHeld(){
  if (!HOLD.v || !AU.ctx) return;
  releaseVoice(HOLD.v, AU.ctx.currentTime, HOLD.tau);
  HOLD.v = null;
}
function fretDown(s, f){
  const sh = shape();
  if (S.clickMode === 'place'){ sh[s] = (sh[s] === f && f > 0) ? 0 : f; renderInstrument(); }
  const ff = S.clickMode === 'place' ? (sh[s] ?? f) : f;
  HOLD.v = pluckString(s, ff, null, 0.85, undefined, { hold: true });
  HOLD.tau = kind() === 'bowed' ? 0.1 : ff === 0 ? 0.35 : 0.1;
}
function keyDown(m){
  if (!fretted() && S.clickMode === 'place'){
    const i = S.piano.indexOf(m);
    if (i >= 0) S.piano.splice(i, 1); else S.piano.push(m);
    renderInstrument();
  }
  HOLD.v = playNote('piano', m, null, { vel: 0.85, hold: true });
  HOLD.tau = 0.09;
}
/* ---- Note label: hover a fret or key (or press it on a touch screen) to see the note, its frequency,
   where it is, and what it is in the current key ---- */
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
function noteInfo(el){
  let m, where;
  if (el.dataset.act === 'fret'){
    const s = +el.dataset.s, r = +el.dataset.f, n = tuning().length, inst = INST[S.inst];
    m = eff()[s] + r;
    const strNo = n - s, abs = r + capo();
    const str = `${ORD[strNo - 1] || strNo + 'th'} string (${midiName(tuning()[s])})`;
    where = r === 0 ? `${str}, open${capo() ? ` at the capo (fret ${capo()})` : ''}` : inst.fretless ? `${str}, ${abs} semitone${abs > 1 ? 's' : ''} up` : `${str}, fret ${abs}`;
  } else { m = +el.dataset.m; where = 'Piano key'; }
  const pc = mod(m), inKey = K.pcs.has(pc);
  const role = !inKey ? `Not in ${K.name}` : pc === K.pc ? `The root (1) of ${K.name}` : `Scale degree ${degreeLabel(pc)} of ${K.name}`;
  return `<div><b>${midiName(m)}</b> · ${mtof(m).toFixed(2)} Hz</div><span>${where}</span><span>${role}</span>`;
}
const TIP = { el: null, hideT: 0 };
function showTip(target, x, y, above){
  if (!TIP.el){ TIP.el = document.createElement('div'); TIP.el.className = 'notetip'; TIP.el.setAttribute('role', 'tooltip'); document.body.appendChild(TIP.el); }
  clearTimeout(TIP.hideT);
  TIP.el.innerHTML = noteInfo(target);
  TIP.el.hidden = false;
  const r = TIP.el.getBoundingClientRect(), pad = 8;
  let left = x + 14, top = above ? y - r.height - 28 : y + 18;
  if (left + r.width > window.innerWidth - pad) left = x - r.width - 14;
  if (top + r.height > window.innerHeight - pad) top = y - r.height - 14;
  TIP.el.style.left = Math.max(pad, left) + 'px';
  TIP.el.style.top = Math.max(pad, top) + 'px';
}
function hideTip(delay = 0){ clearTimeout(TIP.hideT); TIP.hideT = setTimeout(() => { if (TIP.el) TIP.el.hidden = true; }, delay); }
const tipTarget = e => e.target.closest && e.target.closest('[data-act="fret"],[data-act="pkey"]');
document.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  const el = tipTarget(e);
  if (el) showTip(el, e.clientX, e.clientY, false); else if (TIP.el && !TIP.el.hidden) hideTip();
});
document.addEventListener('pointerdown', e => { const el = tipTarget(e); if (el && e.pointerType === 'touch') showTip(el, e.clientX, e.clientY, true); }, true);
['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, e => { if (e.pointerType === 'touch') hideTip(700); }));
window.addEventListener('scroll', () => hideTip(), { passive: true });

document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const el = e.target.closest && e.target.closest('[data-act="fret"],[data-act="pkey"]');
  if (!el) return;
  e.preventDefault();
  releaseHeld();
  if (el.dataset.act === 'fret') fretDown(+el.dataset.s, +el.dataset.f);
  else keyDown(+el.dataset.m);
});
['pointerup', 'pointercancel', 'blur'].forEach(ev => window.addEventListener(ev, releaseHeld));
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseHeld(); });

/* ================= Toast ================= */
let toastT = 0;
function toast(msg, action){
  const el = $('#toast');
  el.innerHTML = `<span>${msg}</span>` + (action ? `<button data-act="toastAct">${action.label}</button>` : '');
  ui.toastAct = action ? action.fn : null;
  el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, action ? 6000 : 3200);
}

/* ================= Header ================= */
function renderHeader(){
  const kl = $('#keyLbl');
  if (kl && W){ const t = ctxLabel(); kl.textContent = t; kl.title = keyCtx() === 'explore' ? 'The key for exploring scales and chords: changing it never changes your progression or song' : `Changing this key changes ${t.toLowerCase().startsWith('section') ? 'the section being edited' : t === 'Song key' ? 'the song' : 'the progression'}`; }
  const kr = $('#keyRoot');
  kr.innerHTML = Array.from({ length: 12 }, (_, pc) => {
    const l = chooseLetter(pc, SC[S.scale].degs);
    return `<option value="${pc}"${pc === S.keyPc ? ' selected' : ''}>${spell(l, pc)}</option>`;
  }).join('');
  const ks = $('#keyScale');
  if (!ks.options.length){
    ks.innerHTML = SCGROUPS.map(g => `<optgroup label="${g}">` + SCLIST.filter(s => s.group === g).map(s => `<option value="${s.id}">${s.name}</option>`).join('') + '</optgroup>').join('');
  }
  ks.value = S.scale;
  const ins = $('#inst');
  if (!ins.options.length) ins.innerHTML = Object.entries(INST).map(([id, v]) => `<option value="${id}">${v.name}</option>`).join('');
  ins.value = S.inst;
}

/* ================= Instrument panel ================= */
function seg(id, opts, cur){
  $(id).innerHTML = opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join('');
}
function renderTools(){
  const fr = fretted(), fl = !!INST[S.inst].fretless;
  $('#tunGrp').hidden = !fr;
  const snd = soundFor(kind());
  $('#sustainSel').value = S.ring;
  $('#soundSel').innerHTML = SOUNDS[kind()].map(x => `<option value="${x.id}"${x === snd ? ' selected' : ''}>${x.name}</option>`).join('');
  if (fr){
    const t = tuning(), pre = INST[S.inst].presets;
    const mine = userTunings();
    const umatch = mine.find(u => u.tuning.join() === t.join() && (u.capo || 0) === capo());
    const match = umatch ? -1 : pre.findIndex(p => p[1].join() === t.join());
    $('#tunPreset').innerHTML = (match < 0 && !umatch ? `<option value="-1" selected>Custom: ${t.map(m => nameFor(m)).join(' ')}</option>` : '') +
      `<optgroup label="Presets">${pre.map((p, i) => `<option value="${i}"${i === match ? ' selected' : ''}>${p[0]}</option>`).join('')}</optgroup>` +
      (mine.length ? `<optgroup label="My tunings">${mine.map(u => `<option value="u:${u.id}"${u === umatch ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</optgroup>` : '') +
      `<optgroup label="Saved tunings"><option value="__save">Save the current tuning…</option>${mine.length ? '<option value="__manage">Manage my tunings…</option>' : ''}</optgroup>`;
    $('#capoFld').hidden = fl;
    $('#fretsSel').value = String(FRETS);
    $('#fretsLbl').textContent = fl ? 'Positions' : 'Frets';
    $('#capo').innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="${i}"${i === capo() ? ' selected' : ''}>${i ? 'Fret ' + i : 'None'}</option>`).join('');
  }
  $('#clickLbl').textContent = fr ? 'Click a fret to' : 'Click a key to';
  seg('#clickMode', fr ? [['place', 'Place finger'], ['play', 'Just play']] : [['place', 'Toggle note'], ['play', 'Just play']], S.clickMode);
  seg('#labels', [['note', 'Notes'], ['interval', 'Intervals'], ['degree', 'Degrees']], S.labels);
  $('#labels [data-v="degree"]').title = 'Scale degrees (1, ♭3, 5…) in the current key';
  seg('#overlay', [['scale', 'Scale'], ['chord', 'Chord'], ['solo', 'Solo'], ['none', 'Fingers']], S.overlay);
  $('#overlay [data-v="chord"]').title = 'The tones of the selected or playing chord';
  $('#overlay [data-v="solo"]').title = 'The best scale to solo with over the selected or playing chord';
  $('#overlay [data-v="none"]').title = 'Only the notes you are playing';
  // Scale position stays in place (disabled when it doesn't apply) so the tools area never reflows
  const so = shapeOptions(), sh = S.shapes, opt = (v, l, on, dis) => `<option value="${v}"${on ? ' selected' : ''}${dis ? ' disabled' : ''}>${l}</option>`;
  $('#shapeFld').hidden = !posAllowed();
  $('#shapeFld').title = so ? '' : 'Scale shapes work with the Scale and Solo highlights';
  if (so && sh.sys === 'caged' && !so.caged) sh.sys = 'all';
  const sys = so ? sh.sys : 'all';
  $('#shapeSys').disabled = !so;
  $('#shapeSys').innerHTML = opt('all', 'Whole neck', sys === 'all') + opt('3nps', `${so ? so.nps : 3} notes per string`, sys === '3nps') + opt('caged', so && !so.caged ? 'CAGED (needs standard tuning)' : 'CAGED', sys === 'caged', so && !so.caged);
  $('#shapeDeg').hidden = $('#shapeStr').hidden = sys !== '3nps';
  $('#shapeCaged').hidden = sys !== 'caged';
  $('#shapeNav').hidden = sys === 'all';
  if (so && sys === '3nps'){
    if (sh.deg >= so.order.length) sh.deg = 0;
    if (sh.str >= so.strs.length) sh.str = 0;
    $('#shapeDeg').innerHTML = so.degs.map(d => opt(d.value, `from the ${d.label}`, d.value === sh.deg)).join('');
    $('#shapeStr').innerHTML = so.strs.map(d => opt(d.value, `on the ${d.label}`, d.value === sh.str)).join('');
  }
  if (so && sys === 'caged') $('#shapeCaged').innerHTML = Object.keys(CAGED).map(k => opt(k, `${k} shape`, k === sh.caged)).join('');
  const cur = so && so.cur;
  $('#shapeFr').textContent = cur ? `frets ${cur.lo + capoOff()}–${cur.hi + capoOff()}` : so && sys !== 'all' ? 'does not fit' : '';
  $('#shapeNav').querySelectorAll('button').forEach(b => { b.disabled = !cur || (b.dataset.d < 0 ? cur.i === 0 : cur.i === cur.count - 1); });
  $('#showNext').checked = S.showNext;
  $('#pinBtn').setAttribute('aria-pressed', String(!!S.pinPanel));
  $('#tunerBtn').setAttribute('aria-pressed', String(!!TUNER.open));
  $('#midiBtn').setAttribute('aria-pressed', String(!!MIDI_IN.open));
  document.querySelector('.inst').classList.toggle('piano-mode', !fr);
  $('#pianoChk').hidden = !fr;
  $('#showPiano').checked = S.showPiano;
  pinDirty();
}
const refChord = () => ui.ident[0] || ui.focus || null;
// "Chord tones" shows the chord picked last (scale card, library, progression); with nothing picked, the key's home chord
// (a chord held on a MIDI keyboard counts as picked while it is shown)
const focusChord = () => (midiActive() && ui.ident[0]) || ui.focus || (K.hept ? diatonic(0, S.ext7) : chordAt(K.pc, K.majorish ? 'maj' : 'm'));
function labelFor(pc, ref){
  if (S.labels === 'note'){ const t = ref && toneOf(ref, pc); return t ? t.name : nameFor(pc); }
  if (S.labels === 'interval') return ref ? relLabel(ref, pc) : degreeLabel(pc);
  return degreeLabel(pc);
}
const neckLen = f => Math.round(920 * (1 - Math.pow(2, -f / 12)) / (1 - Math.pow(2, -15 / 12)));
const NECK_TOTAL = f => 150 + neckLen(f) + 14, PIN_SIDE = 24 + 288;
// The pinned panel shows all 24 frets when the window is wide enough to draw them at 80% size or more, else 15
function pinnedFrets(){
  if (FRETS <= 15) return FRETS;
  const w = PIN.M ? PIN.M.w : document.querySelector('.inst').offsetWidth;
  return w - PIN_SIDE >= 0.8 * NECK_TOTAL(24) ? FRETS : 15;
}
// When the neck is a little wider than the panel (24 frets on a smaller screen), draw it smaller instead of
// scrolling; --nut tells the keyboard and buttons below where the nut ended up. Phones keep a scrolling neck.
function fitNeck(){
  const wrap = $('#neckWrap'), svg = wrap.querySelector('svg'), panel = $('.inst');
  if (panel.classList.contains('side')) return;
  if (!svg || wrap.hidden){ panel.style.setProperty('--nut', '0px'); return; }
  const total = +svg.getAttribute('width'), s = Math.min(1, wrap.clientWidth / total), ok = s >= 0.7;
  wrap.style.setProperty('--neckfit', ok && s < 1 ? Math.floor(total * s) + 'px' : 'auto');
  panel.style.setProperty('--nut', ok ? Math.round(150 * s) + 'px' : '0px');
}
window.addEventListener('resize', () => fitNeck());
function renderNeck(){
  const wrap = $('#neckWrap');
  if (!fretted()){ wrap.hidden = true; fitNeck(); return; }
  wrap.hidden = false;
  const tun = tuning(), sh = shape(), n = tun.length;
  const panel = document.querySelector('.inst'), NF = panel.classList.contains('side') ? pinnedFrets() : FRETS;
  const gap = n >= 6 ? 30 : n === 5 ? 33 : 38;
  const top = 24, H = top + gap * (n - 1) + 46;
  const fl = !!INST[S.inst].fretless;
  // 24 frets keep the same fret spacing as 15, so the neck simply gets longer
  const nutX = 150, W = neckLen(NF), total = nutX + W + 14;
  // a 24-fret neck widens the instrument panel (not the rest of the page) so it fits without scrolling
  panel.style.setProperty('--neckw', total + 'px');
  const norm = 1 - Math.pow(2, -NF / 12);
  const fx = f => nutX + W * (1 - Math.pow(2, -f / 12)) / norm;
  const cx = f => f === 0 ? nutX - 18 : (fx(f - 1) + fx(f)) / 2;
  const ry = s => top + (n - 1 - s) * gap;
  const ref = refChord();
  const OV = overlayState(), ovCh = OV.ovCh, ov = OV.ov, midiOn = midiActive();
  const midY = top + gap * (n - 1) / 2;
  const MARK = [3,5,7,9,12,15,17,19,21,24];
  let o = `<svg class="neck${fl ? ' fretless' : ''}" viewBox="0 0 ${total} ${H}" width="${total}" height="${H}" role="group" aria-label="${INST[S.inst].name} ${fl ? 'fingerboard' : 'neck'}">`;
  o += `<rect class="wood" x="${nutX}" y="${top - 15}" width="${W}" height="${gap * (n - 1) + 30}" rx="3"/>`;
  if (!fl){
    [3,5,7,9,15,17,19,21].filter(f => f <= NF).forEach(f => { o += `<circle class="inlay" cx="${cx(f)}" cy="${midY}" r="6"/>`; });
    [12,24].filter(f => f <= NF).forEach(f => { o += `<circle class="inlay" cx="${cx(f)}" cy="${midY - gap * Math.min(1, (n - 1) / 2)}" r="6"/><circle class="inlay" cx="${cx(f)}" cy="${midY + gap * Math.min(1, (n - 1) / 2)}" r="6"/>`; });
  }
  // fretless instruments get faint semitone guides instead of fret wires
  for (let f = 1; f <= NF; f++) o += `<line class="fretw" x1="${fx(f)}" y1="${top - 15}" x2="${fx(f)}" y2="${top + gap * (n - 1) + 15}"/>`;
  o += `<rect class="nut" x="${nutX - 5}" y="${top - 15}" width="7" height="${gap * (n - 1) + 30}" rx="1"/>`;
  const cap = capo(), et = eff();
  if (cap){
    o += `<rect x="${nutX - 36}" y="${top - 16}" width="${fx(cap - 1) - nutX + 36}" height="${gap * (n - 1) + 32}" fill="var(--surface)" opacity=".6"/>`;
    o += `<rect x="${fx(cap) - 10}" y="${top - 20}" width="9" height="${gap * (n - 1) + 40}" rx="3" fill="var(--ink)"><title>Capo at fret ${cap}</title></rect>`;
  }
  // with a capo the numbers count from the nut (actual frets) or from the capo, like a chord chart
  const fromCapo = cap && S.fretNums === 'capo';
  for (let f = fromCapo ? cap : 0; f <= NF; f++){
    const num = fromCapo ? f - cap : f;
    o += `<text class="fnum${MARK.includes(num) || f === cap ? ' b' : ''}" x="${cx(f)}" y="${H - 10}">${f === cap && cap ? 'capo ' + cap : f === 0 ? 'open' : num}</text>`;
  }
  if (cap) o += `<text class="fnum flink" data-act="fretNums" x="75" y="${H - 10}"><title>${fromCapo ? 'Relative: fret numbers count from the capo. Click to show the actual fret numbers.' : 'Actual fret numbers. Click to count them from the capo instead (relative).'}</title>${fromCapo ? 'relative' : 'actual'} ⇄</text>`;
  const maxM = Math.max(...tun), minM = Math.min(...tun);
  for (let s = 0; s < n; s++){
    const y = ry(s), w = 1 + 2.2 * (maxM - tun[s]) / Math.max(12, maxM - minM);
    o += `<line class="str${sh[s] === null ? ' dead' : ''}" x1="${nutX - 36}" y1="${y}" x2="${nutX + W}" y2="${y}" stroke-width="${w.toFixed(2)}"/>`;
    o += `<g class="gut" data-act="tune" data-s="${s}" data-d="-1"><circle cx="13" cy="${y}" r="10"/><text x="13" y="${y}">−</text><title>Tune string down a half step</title></g>`;
    o += `<text class="tname" x="43" y="${y}">${midiName(tun[s])}</text>`;
    o += `<g class="gut" data-act="tune" data-s="${s}" data-d="1"><circle cx="73" cy="${y}" r="10"/><text x="73" y="${y}">+</text><title>Tune string up a half step</title></g>`;
    o += `<g class="gut mute${sh[s] === null ? ' on' : ''}" data-act="mute" data-s="${s}"><rect x="93" y="${y - 11}" width="24" height="22" rx="5"/><text x="105" y="${y}">×</text><title>${sh[s] === null ? 'Unmute string' : 'Mute string (not played)'}</title></g>`;
  }
  for (let s = 0; s < n; s++){
    const y = ry(s);
    for (let r = 0; r <= NF - cap; r++){
      const f = r + cap, m = et[s] + r, pc = mod(m), x = cx(f);
      // while MIDI keyboard notes are shown, the neck shows them through the highlight instead of the fingered shape
      const isFinger = sh[s] === r && !midiOn;
      if (isFinger){
        const role = ref ? roleIn(ref, pc) : 'n';
        // a played note that is outside the highlighted scale gets a dashed ring
        const out = S.overlay === 'scale' && !K.pcs.has(pc) ? `<circle cx="${x}" cy="${y}" r="${r === 0 ? 14 : 16.5}" class="outk"><title>${nameFor(pc)} is not in ${K.name}</title></circle>` : '';
        if (r === 0) o += `<g class="mk">${out}<circle cx="${x}" cy="${y}" r="11" class="${role}-f"/><text class="dl ${role}-t" x="${x}" y="${y}">${labelFor(pc, ref)}</text></g>`;
        else o += `<g class="mk">${out}<circle cx="${x}" cy="${y}" r="12.5" class="${role}-f"/>${out ? '' : `<circle cx="${x}" cy="${y}" r="15" class="ring"/>`}<text class="dl ${role}-t" x="${x}" y="${y}">${labelFor(pc, ref)}</text></g>`;
      } else if (ov && ov.has(pc) && !(r === 0 && sh[s] === null) && (!OV.pos || OV.pos.has(s + ':' + r))){
        const fg = OV.finger && OV.finger.get(s + ':' + r);
        const fingerTxt = fg ? `<text class="fng" x="${x + 10}" y="${y - 9}">${fg}</text>` : '';
        if (OV.solo && !toneOf(ovCh, pc)){
          // solo scale: chord tones in color, the other scale notes as plain dots
          o += `<g class="mk"><circle cx="${x}" cy="${y}" r="9.5" class="sd"/><text class="dl sd-t" x="${x}" y="${y}">${labelFor(pc, ovCh)}</text>${fingerTxt}</g>`;
        } else if (ovCh){
          const role = roleIn(ovCh, pc);
          o += `<g class="mk${OV.solo ? '' : ' ghost'}"><circle cx="${x}" cy="${y}" r="9.5" class="${role}-f"/><text class="dl ${role}-t" x="${x}" y="${y}">${labelFor(pc, ovCh)}</text>${fingerTxt}</g>`;
        } else {
          const kr = pc === K.pc;
          o += `<g class="mk"><circle cx="${x}" cy="${y}" r="9.5" class="sd${kr ? ' kr' : ''}"/><text class="dl sd-t" x="${x}" y="${y}">${S.labels === 'note' ? nameFor(pc) : degreeLabel(pc)}</text>${fingerTxt}</g>`;
        }
      }
      if (OV.next && OV.next[s] === r) o += `<circle class="mk nextk" cx="${x}" cy="${y}" r="${r === 0 ? 14 : 16.5}"/>`;
      if (r === 0 && sh[s] === null) o += `<g class="mk"><path class="xm" d="M${x - 6} ${y - 6}L${x + 6} ${y + 6}M${x + 6} ${y - 6}L${x - 6} ${y + 6}"/></g>`;
    }
  }
  // the tuner rings the string (and fret) it hears, colored by how in tune it is
  (ui.tunerMarks || []).forEach(t => { if (t.r <= NF - cap) o += `<circle class="tmark ${t.cls}" cx="${cx(t.r + cap)}" cy="${ry(t.s)}" r="${t.r === 0 ? 15 : 18}"/>`; });
  for (let s = 0; s < n; s++){
    const y = ry(s);
    for (let r = 0; r <= NF - cap; r++){
      const f = r + cap, x0 = f === 0 ? nutX - 34 : fx(f - 1), x1 = f === 0 ? nutX : fx(f);
      o += `<rect class="hit" data-act="fret" data-s="${s}" data-f="${r}" x="${x0}" y="${y - gap / 2}" width="${x1 - x0}" height="${gap}"></rect>`;
    }
  }
  o += '</svg>';
  $('#neck').innerHTML = o;
  fitNeck();
  // when the neck scrolls (phones), bring a newly chosen scale shape into view
  const shKey = OV.shape ? [S.shapes.sys, S.shapes.deg, S.shapes.str, S.shapes.caged, OV.shape.lo, cap].join() : '';
  if (shKey && shKey !== ui.shapeSeen && wrap.scrollWidth > wrap.clientWidth + 4){ const f = OV.shape.lo + cap; wrap.scrollLeft = Math.max(0, (f === 0 ? nutX : fx(f - 1)) - 60); }
  ui.shapeSeen = shKey;
}
function pianoSVG(lo, hi, active, opts = {}){
  const W = opts.w || 22, H = opts.h || 104, BW = W * 0.62, BH = H * 0.62;
  const ref = opts.ref, act = new Set(active), ov = opts.ov, ovCh = opts.ovCh, nx = new Set(opts.next || []);
  const whites = [], blacks = [];
  let wi = 0;
  for (let m = lo; m <= hi; m++){
    if ([1,3,6,8,10].includes(mod(m))) blacks.push({ m, x: wi * W - BW / 2 });
    else { whites.push({ m, x: wi * W }); wi++; }
  }
  const width = wi * W + 2;
  let o = `<svg viewBox="0 0 ${width} ${H + 2}" width="${opts.fit ? '100%' : width}" ${opts.fit ? '' : `height="${H + 2}"`} role="${opts.inter ? 'group' : 'img'}" aria-label="Piano keyboard">`;
  const draw = (k, black) => {
    const pc = mod(k.m), on = act.has(k.m), w = black ? BW : W - 1, h = black ? BH : H, x = black ? k.x : k.x + 1;
    const role = on ? (ref ? roleIn(ref, pc) : 'n') : null;
    o += `<g class="pk"${opts.inter ? ` data-act="pkey" data-m="${k.m}"` : ''}><rect x="${x}" y="1" width="${w}" height="${h}" rx="${black ? 2 : 3}" class="${black ? 'pk-b' : 'pk-w'}${on ? ' ' + role + '-f' : ''}"/>`;
    const cxk = x + w / 2;
    if (on) o += `<text class="pk-lbl ${role}-t" x="${cxk}" y="${h - (black ? 12 : 13)}">${opts.lbl ? opts.lbl(pc, ref) : nameFor(pc)}</text>`;
    else if (ov && ov.has(pc)){
      const r2 = ovCh && (!opts.solo || toneOf(ovCh, pc)) ? roleIn(ovCh, pc) : null;
      o += `<circle class="pk-dot ${r2 ? r2 + '-f' : 'sd'}${!r2 && pc === K.pc ? ' kr' : ''}" cx="${cxk}" cy="${h - (black ? 10 : 12)}" r="${black ? 3.5 : 4.5}"${!r2 && !black ? ' style="stroke:var(--keyline)"' : ''}/>`;
    }
    if (nx.has(k.m)) o += `<rect class="nextk" x="${x + 2}" y="3" width="${w - 4}" height="${h - 4}" rx="2"/>`;
    if (!black && pc === 0 && !on && !opts.noOct) o += `<text class="pk-oct" x="${cxk}" y="${h - 30}">C${Math.floor(k.m / 12) - 1}</text>`;
    o += '</g>';
  };
  whites.forEach(k => draw(k, false));
  blacks.forEach(k => draw(k, true));
  return o + '</svg>';
}
function renderPiano(){
  const show = !fretted() || S.showPiano || midiActive();
  $('#pianoWrap').hidden = !show;
  if (!show) return;
  const big = !fretted(), lo = kind() === 'bass' ? 24 : 36;
  const ref = refChord();
  const OV = overlayState(), ovCh = OV.ovCh, ov = OV.ov;
  // beside the neck the keyboard is always 600px wide (from the nut), whatever its range
  let whites = 0;
  for (let m = lo; m <= 84; m++) if (![1, 3, 6, 8, 10].includes(mod(m))) whites++;
  $('#piano').innerHTML = pianoSVG(lo, 84, activeMidis(), { w: big ? 30 : 598 / whites, h: big ? 150 : 110, ref, ov, ovCh, solo: !!OV.solo, next: OV.nextMidis, inter: true, lbl: (pc, r) => labelFor(pc, r) });
}
function renderReadout(){
  const fr = fretted() && !midiActive();
  $('#acts').innerHTML = fr
    ? (kind() === 'bowed' && soundFor('bowed').gen === 'bowed'
      ? `<button class="btn primary" data-act="strum" data-d="down">Bow chord</button><button class="btn" data-act="strum" data-d="up">Bow (high to low)</button><button class="btn" data-act="strum" data-d="pick">One string at a time</button>`
      : `<button class="btn primary" data-act="strum" data-d="down">Strum ↓</button><button class="btn" data-act="strum" data-d="up">Strum ↑</button><button class="btn" data-act="strum" data-d="pick">Pick</button>`) + `<button class="btn" data-act="clearShape">Open strings</button><button class="btn" data-act="muteAll">Mute all</button><button class="btn" data-act="addIdent" title="Add this chord to the progression" aria-label="Add this chord to the progression">+ Add<span class="long">to progression</span></button><button class="btn" data-act="addCustom" title="Add these exact notes with a name you choose (picks the closest standard chord for analysis)">Add as…</button>`
    : `<button class="btn primary" data-act="strum" data-d="down">Play chord</button><button class="btn" data-act="strum" data-d="pick">Arpeggiate</button><button class="btn" data-act="clearShape">Clear notes</button><button class="btn" data-act="addIdent" title="Add this chord to the progression" aria-label="Add this chord to the progression">+ Add<span class="long">to progression</span></button><button class="btn" data-act="addCustom" title="Add these exact notes with a name you choose (picks the closest standard chord for analysis)">Add as…</button>`;
  // in the Progression builder: overwrite the selected chord with what's on the neck (or keyboard)
  const sel = S.tab === 'prog' && prog[ui.selSlot];
  if (sel) $('#acts').insertAdjacentHTML('beforeend', `<button class="btn" data-act="replaceSel"${ui.ident[0] ? '' : ' disabled'} aria-label="Replace ${fromItem(sel).symbol} with this chord" title="Replace the selected chord (${fromItem(sel).symbol}, chord ${ui.selSlot + 1}) with the chord on the ${fr ? 'neck' : 'keyboard'}, keeping its length and this exact voicing">Replace<span class="long">${fromItem(sel).symbol}</span></button>`);
  const midis = activeMidis();
  const ref = ui.ident[0];
  let notes;
  if (fr){
    const t = eff();
    notes = shape().map((f, s) => f === null ? `<span class="nchip mutedstr" title="${midiName(t[s])} string muted">×</span>` : `<span class="nchip ${ref ? roleIn(ref, t[s] + f) : ''}${S.overlay === 'scale' && !K.pcs.has(mod(t[s] + f)) ? ' outk' : ''}"${S.overlay === 'scale' && !K.pcs.has(mod(t[s] + f)) ? ` title="Not in ${K.name}"` : ''}>${ref && toneOf(ref, t[s] + f) ? toneOf(ref, t[s] + f).name : nameFor(t[s] + f)}<i>${ref ? relLabel(ref, t[s] + f) : degreeLabel(t[s] + f)}</i></span>`).join('');
  } else notes = midis.map(m => `<span class="nchip ${ref ? roleIn(ref, m) : ''}${S.overlay === 'scale' && !K.pcs.has(mod(m)) ? ' outk' : ''}">${midiName(m)}<i>${ref ? relLabel(ref, m) : degreeLabel(m)}</i></span>`).join('');
  // Always the same number of lines (blank ones reserved), so the page below doesn't jump as chords change
  const uniq = [...new Set(midis.map(m => mod(m)))];
  let sym = '–', name = '';
  const lines = [];
  if (!midis.length) name = `Nothing sounding. ${fr ? 'Click frets to place fingers, or unmute strings.' : 'Click keys to add notes.'}`;
  else if (ref){
    const a = analyze(ref);
    sym = ref.symbol;
    name = ref.q.name + (ref.bassName ? `, ${ref.bassName} in the bass` : '');
    lines.push(`In ${K.name}: <b>${a.rn}</b> · ${a.origin}${a.from ? ' (' + a.from + ')' : ''}`);
    if (fr && capo()){
      const raw = shape().map((f, i) => f === null ? null : tuning()[i] + f).filter(m => m !== null), sn = identify(raw)[0];
      lines.push(sn ? `Capo ${capo()}: you finger ${/^[AEF]/.test(sn.symbol) ? 'an' : 'a'} <b>${sn.symbol}</b> shape, and it sounds as <b>${ref.symbol}</b>.` : '');
    }
    if (ui.ident.length > 1) lines.push(`Also reads as: ${ui.ident.slice(1).map(c => `<b>${c.symbol}</b>`).join(', ')}`);
  } else if (uniq.length === 1){ sym = nameFor(uniq[0]); name = `A single note${midis.length > 1 ? ' (in octaves)' : ''}`; }
  else if (uniq.length === 2){
    const s = midis.slice().sort((a, b) => a - b), iv = mod(s[s.length - 1] - s[0]);
    sym = `${nameFor(s[0])}–${nameFor(s[s.length - 1])}`; name = `Interval: ${SEMI_NAME[iv]}`;
    lines.push('Two different notes make an interval; add a third note for a full chord.');
  } else { sym = '?'; name = 'No standard chord name for these notes'; lines.push('Try muting a string or moving one finger, or use <b>Add as…</b> to add it with your own name.'); }
  // #idOut has a fixed height with its content centred, so lines can come and go without moving anything
  const main = `<div class="id-sym">${sym}</div><div class="id-sub"><span class="id-name">${name}</span>${lines.filter(Boolean).map(l => `<span class="alts">${l}</span>`).join('')}</div>`;
  $('#idOut').innerHTML = main + `<div class="chips">${notes}</div>`;
}
function renderOverlayNote(){
  const el = $('#ovNote');
  const OV = overlayState();
  const pos = OV.shape ? ` Showing one shape: ${shapeText(OV.shape, OV.order)}, with suggested fingers.` : '';
  const nxt = OV.nextCh ? ` Dashed outlines show where the next chord (<b>${OV.nextCh.symbol}</b>) goes.` : '';
  if (S.overlay === 'solo'){
    const c = OV.ovCh;
    el.innerHTML = OV.solo ? `Solo scale over <b>${c.symbol}</b>: <b>${scaleTitle(c, OV.solo.sc)}</b>. Chord tones (the safest notes to land on) are in color.${pos}${nxt}` : `No common scale fits ${c.symbol}; showing its chord tones.${nxt}`;
    return;
  }
  if (S.overlay === 'scale'){ el.innerHTML = `Highlighting the notes of <b>${K.name}</b>.${pos}${nxt}`; return; }
  else if (S.overlay === 'chord'){
    const c = focusChord();
    el.innerHTML = `Highlighting the chord tones of <b>${c.symbol}</b> (${analyze(c).rn} in ${K.name}).${ui.focus ? '' : ' Pick a chord in any tab to highlight a different one.'}${nxt}`;
  } else el.innerHTML = `Showing only the notes you are playing.${nxt}`;
}
function renderInstrument(){
  ui.ident = identify(activeMidis());
  renderTools(); renderNeck(); renderPiano(); renderReadout(); renderOverlayNote();
  pinDirty();
  save();
}

/* ================= Scales tab ================= */
const FN_CLASS = { T: 'fnT', PD: 'fnPD', D: 'fnD', X: 'fnX' };
function stepName(d){ return d === 1 ? 'H' : d === 2 ? 'W' : d === 3 ? 'W+H' : d === 4 ? '2W' : d + '½'; }
function renderScales(){
  const sc = K.sc, el = $('#p-scales');
  let rel = '';
  if (sc.fam){
    const parent = SC[FAMILY_PARENT[sc.fam]], d = parent.degs[sc.mode - 1];
    const ppc = mod(K.pc - d.semis), pl = mod(K.L - d.step, 7);
    if (sc.mode > 1) rel = `Mode ${sc.mode} of ${spell(pl, ppc)} ${parent.short}: the same seven notes, starting from its ${['','1st','2nd','3rd','4th','5th','6th','7th'][sc.mode]} note.`;
    else rel = `Its modes: ${SCLIST.filter(s => s.fam === sc.fam).map(s => s.name).join(', ')}.`;
  }
  let notes = '';
  K.notes.forEach((n, i) => {
    notes += `<button class="sn${i === 0 ? ' root' : ''}" data-act="snote" data-i="${i}" title="${n.lbl}: ${INTNAME[n.lbl] || ''} above ${K.notes[0].name}"><b>${n.name}</b><span class="dg">${n.lbl}</span><span class="iv">${INTNAME[n.lbl] || ''}</span></button>`;
    const nx = i + 1 < K.notes.length ? K.notes[i + 1].semis : 12, d = nx - n.semis;
    notes += `<span class="step${d === 3 ? ' aug' : ''}" title="${SEMI_NAME[d]}">${stepName(d)}</span>`;
  });
  notes += `<button class="sn" data-act="snote" data-i="${K.notes.length}"><b>${K.notes[0].name}</b><span class="dg">8</span><span class="iv">octave</span></button>`;
  const pattern = K.notes.map((n, i) => stepName((i + 1 < K.notes.length ? K.notes[i + 1].semis : 12) - n.semis)).join(' – ');

  let chords = '';
  ui.scCards = [];
  if (K.hept){
    chords = '<div class="cards">' + K.notes.map((n, i) => {
      const ch = diatonic(i, S.ext7); ui.scCards.push(ch);
      const a = analyze(ch), on = ui.focus && ui.focus.symbol === ch.symbol;
      return `<div class="card${on ? ' on' : ''}"><div class="fn-stripe ${FN_CLASS[a.fn]}"></div><button class="main" data-act="scCard" data-i="${i}"><span class="rn">${a.rn}</span><span class="sym">${ch.symbol}</span><span class="qn">${ch.q.name}</span><span class="nn">${ch.tones.map(t => t.name).join(' ')}</span></button><button class="add" data-act="scAdd" data-i="${i}" aria-label="Add ${ch.symbol} to progression">+</button></div>`;
    }).join('') + '</div>';
  } else chords = `<p class="hint">${sc.name} has ${K.notes.length} notes, so it does not stack into seven chords built in 3rds. Every chord that fits the scale is listed below.</p>`;

  ui.fits = [];
  const fitsHtml = K.notes.map((n, i) => {
    const qs = QLIST.filter(q => q.full.every(s => K.pcs.has(mod(n.pc + s))));
    const chips = qs.map(q => {
      const ch = mkChord(n.pc, mod(K.L + n.step, 7), q.id);
      ui.fits.push(ch);
      return `<button class="cchip${ui.focus && ui.focus.symbol === ch.symbol ? ' on' : ''}" data-act="fit" data-i="${ui.fits.length - 1}" title="${q.name}">${ch.symbol}</button>`;
    }).join('');
    return `<div class="fitrow"><span class="who">${n.lbl} · ${n.name}</span><div class="chips">${chips || '<span class="muted">none</span>'}</div></div>`;
  }).join('');

  let cmp = '';
  if (S.cmp === 'roots'){
    cmp = `<table class="grid"><thead><tr><th>Root</th>${sc.degs.map(d => `<th>${d.lbl}</th>`).join('')}<th>Accidentals</th></tr></thead><tbody>` +
      Array.from({ length: 12 }, (_, pc) => {
        const k = makeKey(pc, S.scale);
        const accs = k.notes.reduce((a, n) => a + Math.abs(sacc(k.L + n.step, n.pc)), 0);
        return `<tr class="${pc === K.pc ? 'cur' : ''}" data-act="cmpRoot" data-pc="${pc}"><td class="n first">${k.notes[0].name} ${sc.short}</td>${k.notes.map(n => `<td class="n">${n.name}</td>`).join('')}<td class="n" style="font-weight:400">${accs}</td></tr>`;
      }).join('') + '</tbody></table>';
  } else {
    // the scale's own family, plus the major modes (the reference everything is compared with) when it is from another family
    const groups = sc.group === 'Major modes' ? [sc.group] : [sc.group, 'Major modes'];
    const row = s => {
      const k = makeKey(K.pc, s.id);
      return `<tr class="${s.id === S.scale ? 'cur' : ''}" data-act="cmpScale" data-id="${s.id}"><td>${s.name}</td>${k.notes.map(n => `<td class="n">${n.name} <span class="${n.acc ? 'alt' : 'muted'}" style="font-size:11px">${n.lbl}</span></td>`).join('')}</tr>`;
    };
    cmp = `<table class="grid"><thead><tr><th>Scale</th><th colspan="8">Notes from ${K.notes[0].name} (red = differs from major)</th></tr></thead><tbody>` +
      groups.map(g => (groups.length > 1 ? `<tr class="grp"><th colspan="9">${g}</th></tr>` : '') + SCLIST.filter(s => s.group === g).map(row).join('')).join('') + '</tbody></table>';
  }

  el.innerHTML = `${exploreBannerHTML()}
  <div class="sc-title"><span class="lbl">Scale</span><h2>${K.name.replace(sc.short, sc.name)}</h2><p class="hint">${sc.blurb}</p>${rel ? `<p class="hint">${rel}</p>` : ''}<p class="hint"><button class="linkish" data-act="lnLesson" data-id="relative">Relative and parallel scales, explained ›</button></p></div>
  <div class="sec"><div class="sec-h"><h3>Notes and steps</h3><span class="mono muted" style="font-size:12.5px">${pattern}</span></div>
    <div class="scnotes">${notes}</div>
    <p class="hint">W = whole step (2 frets), H = half step (1 fret), W+H = augmented 2nd (3 frets). Each note shows its interval above the root. Click a note to hear it.</p>
    <div class="acts"><button class="btn" data-act="playScale" data-d="up">▶ Play ascending</button><button class="btn" data-act="playScale" data-d="down">▶ Play descending</button></div></div>
  <div class="sec"><div class="sec-h"><h3>Chords in this scale</h3>${K.hept ? `<div class="seg" id="extSeg"><button data-v="0" aria-pressed="${!S.ext7}">Triads</button><button data-v="1" aria-pressed="${S.ext7}">Sevenths</button></div>` : ''}</div>
    ${chords}
    ${K.hept ? `<p class="hint">Stack every other note of the scale to build each chord. The colored bar shows its job: <span class="tag"><i class="fnT"></i>tonic</span> <span class="tag"><i class="fnPD"></i>pre-dominant</span> <span class="tag"><i class="fnD"></i>dominant</span>. Click a chord to hear it and see it on the neck; <b>+</b> adds it to the progression.</p>` : ''}</div>
  <div class="sec"><h3>Every chord that fits</h3><p class="hint">Every chord type in the library whose notes all belong to ${K.name}, listed by root.</p><div class="fits">${fitsHtml}</div></div>
  <div class="sec"><div class="sec-h"><h3>Compare</h3><div class="seg" id="cmpSeg"><button data-v="roots" aria-pressed="${S.cmp === 'roots'}">This scale from all 12 roots</button><button data-v="family" aria-pressed="${S.cmp === 'family'}">Related scales from ${K.notes[0].name}</button></div></div>
    <div class="scroller">${cmp}</div><p class="hint">Click a row to switch to it.${S.cmp === 'family' ? ` Every row starts on ${K.notes[0].name}, so these are the ${K.notes[0].name} <i>parallel</i> scales: same home, different notes.` : ''}</p></div>`;
}

/* ================= Chord library tab ================= */
function libChord(){
  const pc = S.lib.root;
  return chordAt(pc, S.lib.q, QMAP[S.lib.q].dyad ? null : S.lib.bass);
}
// With a capo, fret numbers are either the actual frets (counted from the nut) or counted from the capo
const capoOff = () => capo() && S.fretNums !== 'capo' ? capo() : 0;
const fretsText = (frets, sep = ' ') => frets.map(f => f === null ? 'x' : f + capoOff()).join(sep);
// A chord chart. With a capo and actual fret numbers, the capo is drawn where the nut would be and the frets
// are labelled from the nut.
function diagramSVG(v, ch, tun){
  const n = tun.length, fr = v.frets.filter(f => f !== null && f > 0), off = capoOff();
  const mx = fr.length ? Math.max(...fr) : 0, start = mx <= 4 ? 1 : Math.min(...fr);
  const dx = n >= 6 ? 15 : 18, x0 = 28, y0 = 26, dy = 18, NF = 5;
  const width = x0 + dx * (n - 1) + 14, height = y0 + dy * NF + 6;
  let o = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">`;
  if (start === 1) o += `<rect class="${off ? 'dg-capo' : 'dg-nut'}" x="${x0 - 1}" y="${y0 - 3}" width="${dx * (n - 1) + 2}" height="4"${off ? `><title>Capo on fret ${off}</title></rect>` : '/>'}`;
  if (start > 1 || off) o += `<text class="dg-fr" x="${x0 - 7}" y="${y0 + dy * 0.5 + 3}">${start + off}fr</text>`;
  for (let i = 0; i <= NF; i++) o += `<line class="dg-line" x1="${x0}" y1="${y0 + i * dy}" x2="${x0 + dx * (n - 1)}" y2="${y0 + i * dy}"/>`;
  for (let i = 0; i < n; i++) o += `<line class="dg-line" x1="${x0 + i * dx}" y1="${y0}" x2="${x0 + i * dx}" y2="${y0 + NF * dy}"/>`;
  if (v.barre) o += `<rect class="dg-barre" x="${x0 + v.barre.from * dx - 7}" y="${y0 + (v.barre.fret - start + 0.5) * dy - 7}" width="${(v.barre.to - v.barre.from) * dx + 14}" height="14" rx="7"/>`;
  v.frets.forEach((f, i) => {
    const x = x0 + i * dx;
    if (f === null){ o += `<text class="dg-x" x="${x}" y="${y0 - 11}">×</text>`; return; }
    const pc = mod(tun[i] + f), role = roleIn(ch, pc);
    if (f === 0){ o += `<circle cx="${x}" cy="${y0 - 11}" r="4.5" fill="none" stroke-width="1.8" class="${role}-s"/>`; return; }
    const y = y0 + (f - start + 0.5) * dy;
    o += `<circle cx="${x}" cy="${y}" r="7" class="${role}-f"/><text class="dl ${role}-t" style="font-size:8px" x="${x}" y="${y}">${relLabel(ch, pc)}</text>`;
  });
  return o + '</svg>';
}
function renderLib(){
  const el = $('#p-chords'), ch = libChord(), a = analyze(ch);
  const roots = Array.from({ length: 12 }, (_, pc) => `<button data-act="libRoot" data-pc="${pc}" aria-pressed="${pc === S.lib.root}" class="${K.pcs.has(pc) ? 'inkey' : ''}">${nameFor(pc)}</button>`).join('');
  const groups = QGROUPS.map(g => `<div class="qg"><span class="lbl">${g}</span><div class="chips">${QLIST.filter(q => q.group === g).map(q => {
    const fit = q.full.every(s => K.pcs.has(mod(S.lib.root + s)));
    return `<button class="cchip qchip${fit ? ' fit' : ''}${q.id === S.lib.q ? ' on' : ''}" data-act="libQ" data-q="${q.id}" title="${q.name}: ${q.formula}">${q.dyad ? chordAt(S.lib.root, q.id).symbol : nameFor(S.lib.root) + q.sfx}</button>`;
  }).join('')}</div></div>`).join('');
  const formula = ch.tones.map(t => `<span class="dot ${t.role}-f" style="background:var(--${{ r: 'root', t: 'third', f: 'fifth', s: 'seventh', x: 'ext' }[t.role]})"></span><span class="fm">${t.lbl}${t.opt ? '*' : ''} · ${t.name}</span><span class="muted">${INTNAME[t.lbl] || ''}</span>`).join('');
  let voic = '';
  ui.libV = [];
  if (fretted()){
    const tun = eff(), v = voicingsFor(ch, S.lib.inv);
    ui.libV = v.list;
    const cur = shape().map(f => f === null ? 'x' : f).join('.');
    voic = v.list.length ? `<div class="shapes">` + v.list.map((x, i) => {
      const nm = x.bassPc !== ch.rootPc && ch.bassPc == null ? `${ch.symbol}/${toneOf(ch, x.bassPc) ? toneOf(ch, x.bassPc).name : nameFor(x.bassPc)}` : ch.symbol;
      const key = x.frets.map(f => f === null ? 'x' : f).join('.');
      return `<button class="shape${key === cur ? ' on' : ''}" data-act="libV" data-i="${i}" title="${fretsText(x.frets)}">${diagramSVG(x, ch, tun)}<span class="cap"><b>${nm}</b><br>${fretsText(x.frets)}${x.barre ? ' · barre' : ''}</span></button>`;
    }).join('') + '</div>'
      : `<p class="hint">No shape for ${ch.symbol} fits within four frets on this tuning${S.lib.inv ? '' : ' with the root in the bass. Try allowing inversions'}.</p>`;
  } else {
    const pv = pianoVoicings(ch);
    ui.libV = pv;
    voic = '<div class="pvs">' + pv.map((p, i) => {
      const lo = Math.floor(Math.min(...p.midis) / 12) * 12, hi = Math.max(lo + 23, Math.ceil((Math.max(...p.midis) + 1) / 12) * 12 - 1);
      return `<button class="pv" data-act="libV" data-i="${i}"><span class="lbl">${p.name}</span>${pianoSVG(lo, hi, p.midis, { w: 12, h: 52, ref: ch, fit: true, noOct: true, lbl: () => '' })}<span class="mono" style="font-size:12px">${p.midis.map(m => midiName(m)).join(' ')}</span></button>`;
    }).join('') + '</div>';
  }
  const bassOpts = `<option value="">Root in the bass</option>` + Array.from({ length: 12 }, (_, pc) => pc === S.lib.root ? '' : `<option value="${pc}"${S.lib.bass === pc ? ' selected' : ''}>Slash: /${nameFor(pc)}</option>`).join('');
  el.innerHTML = `${exploreBannerHTML()}
  <div class="libtop"><div class="sec-h"><h2>Chord library</h2><p class="hint">Pick a root and any of ${QLIST.length} chord types; for a slash chord, choose its <b>Bass note</b>. Roots underlined in red are in ${K.name}; a red dot marks chord types that fit the scale on that root.</p></div>
    <div class="roots">${roots}</div><div class="qgroups">${groups}</div></div>
  <div class="libmain">
    <div class="panel libinfo">
      <span class="lbl">${ch.q.group}</span><div class="big-sym">${ch.symbol}</div><div class="id-name">${ch.q.name}</div>
      ${aliasesFor(ch.q.id).length ? `<p class="hint">Also written: ${aliasesFor(ch.q.id).map(a => esc(ch.rootName + a)).join(', ')}</p>` : ''}
      <div class="formula">${formula}</div>
      ${ch.tones.some(t => t.opt) ? '<p class="hint">* can be left out. Guitarists usually drop the 5th first.</p>' : ''}
      <p class="hint">In ${K.name}: <b style="color:var(--ink)">${a.rn}</b> · ${a.origin}${a.from ? ' (' + a.from + ')' : ''}. ${a.text}</p>
      ${ch.q.dyad ? '' : `<label class="fld"><span>Bass note</span><select id="libBass">${bassOpts}</select></label>`}
      <div class="acts"><button class="btn primary" data-act="libPlay">▶ Play</button><button class="btn" data-act="libAdd">+ Add to progression</button></div>
    </div>
    <div class="sec"><div class="sec-h"><h3>${fretted() ? 'Fingerings for your tuning' : 'Piano voicings'}</h3>${fretted() ? `<label class="chk"><input type="checkbox" id="libInv"${S.lib.inv ? ' checked' : ''}> Allow inversions (any chord tone in the bass)</label>` : ''}</div>
      ${fretted() ? `<p class="hint">Calculated for ${INST[S.inst].name.toLowerCase()} tuned ${tuning().map(m => nameFor(m)).join(' ')}${capo() ? `, capo on fret ${capo()} (fret numbers ${S.fretNums === 'capo' ? 'are counted from the capo, like a chord chart' : 'are the actual frets; the bar at the top of a chart is the capo'})` : ''}${INST[S.inst].fretless ? ': within one hand position (about four semitones), using double and triple stops across neighboring strings. Numbers are semitones above the open string. Click a fingering to load it and hear it.' : ': at most four frets apart, four fingers or a barre, no more than one muted string in the middle. Click a shape to load it onto the neck and strum it.'}</p>` : '<p class="hint">Click a voicing to load it onto the keyboard and hear it.</p>'}
      ${voic}</div>
  </div>`;
}

/* ================= Progression tab ================= */
const PRESETS = [
  ['Pop “axis”: I–V–vi–IV', 'major', [[0,0,'maj'],[7,4,'maj'],[9,5,'m'],[5,3,'maj']]],
  ['Doo-wop: I–vi–IV–V', 'major', [[0,0,'maj'],[9,5,'m'],[5,3,'maj'],[7,4,'maj']]],
  ['Jazz ii–V–I', 'major', [[2,1,'m7'],[7,4,'7'],[0,0,'maj7',8]]],
  ['Jazz turnaround: I–vi–ii–V', 'major', [[0,0,'maj7'],[9,5,'m7'],[2,1,'m7'],[7,4,'7']]],
  ['Pachelbel’s Canon', 'major', [[0,0,'maj',2],[7,4,'maj',2],[9,5,'m',2],[4,2,'m',2],[5,3,'maj',2],[0,0,'maj',2],[5,3,'maj',2],[7,4,'maj',2]]],
  ['12-bar blues', 'mixolydian', [[0,0,'7'],[0,0,'7'],[0,0,'7'],[0,0,'7'],[5,3,'7'],[5,3,'7'],[0,0,'7'],[0,0,'7'],[7,4,'7'],[5,3,'7'],[0,0,'7'],[7,4,'7']]],
  ['Secondary dominant chain: I–VI7–II7–V7–I', 'major', [[0,0,'maj'],[9,5,'7'],[2,1,'7'],[7,4,'7'],[0,0,'maj']]],
  ['Borrowed iv (“Creep”): I–III–IV–iv', 'major', [[0,0,'maj'],[4,2,'maj'],[5,3,'maj'],[5,3,'m']]],
  ['Backdoor: IV–iv7–♭VII7–I', 'major', [[5,3,'maj7'],[5,3,'m7'],[10,6,'7'],[0,0,'maj7']]],
  ['Royal Road (J-pop)', 'major', [[5,3,'maj7'],[7,4,'7'],[4,2,'m7'],[9,5,'m7']]],
  ['Mixolydian rock: I–♭VII–IV–I', 'mixolydian', [[0,0,'maj'],[10,6,'maj'],[5,3,'maj'],[0,0,'maj']]],
  ['Andalusian cadence', 'aeolian', [[0,0,'m'],[10,6,'maj'],[8,5,'maj'],[7,4,'maj']]],
  ['Minor pop: i–♭VI–♭III–♭VII', 'aeolian', [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj']]],
  ['Minor ii–V–i', 'harmonic', [[2,1,'m7b5'],[7,4,'7'],[0,0,'m',8]]],
  ['Harmonic minor: i–iv–♭VI–V7', 'harmonic', [[0,0,'m'],[5,3,'m'],[8,5,'maj'],[7,4,'7']]],
  ['Dorian vamp: i7–IV7', 'dorian', [[0,0,'m7'],[5,3,'7']]],
  ['Lydian lift: I–II', 'lydian', [[0,0,'maj7'],[2,1,'maj']]],
  ['Phrygian: i–♭II', 'phrygian', [[0,0,'m'],[1,1,'maj']]],
];
function progChords(){ return prog.map(fromItem); }
function barAt(i, end){
  const b = prog.slice(0, i + (end ? 1 : 0)).reduce((a, it) => a + it.b, 0);
  return end ? Math.ceil(b / S.ts.num) : Math.floor(b / S.ts.num) + 1;
}
function candidatePool(){
  const pool = [], seen = new Set();
  const add = (ch, group) => { if (seen.has(ch.symbol)) return; seen.add(ch.symbol); pool.push({ ch, group }); };
  const g = GENRE();
  if (g) genreChords().forEach(c => add(c, `Typical in ${g.name}`));
  if (K.hept){
    K.notes.forEach((_, i) => add(diatonic(i, false), 'In the key'));
    K.notes.forEach((_, i) => add(diatonic(i, true), 'In the key (7ths)'));
    K.notes.forEach((n, i) => {
      if (diatonic(i, false).qid === 'dim') return;
      const c = mkChord(n.pc + 7, K.L + n.step + 4, '7');
      if (!fitsKey(c)) add(c, 'Secondary dominants');
    });
    // their leading-tone chords (vii°7/x): a diminished 7th a half step below each chord of the key
    K.notes.forEach((n, i) => {
      if (i === 0 || diatonic(i, false).qid === 'dim') return;
      const c = mkChord(n.pc + 11, K.L + n.step + 6, 'dim7');
      if (!fitsKey(c)) add(c, 'Secondary dominants');
    });
    const par = K.majorish ? 'aeolian' : 'major';
    const pn = parallelNotes(par);
    pn.forEach((_, i) => { const c = stackChord(pn, K.L, i, false); if (!fitsKey(c)) add(c, 'Borrowed from ' + (K.majorish ? 'minor' : 'major')); });
    if (K.majorish){ add(mkChord(K.pc + 10, K.L + 6, '7'), 'Borrowed from minor'); add(mkChord(K.pc + 5, K.L + 3, 'm7'), 'Borrowed from minor'); }
    else { add(mkChord(K.pc + 7, K.L + 4, '7'), 'Borrowed from major'); add(mkChord(K.pc + 5, K.L + 3, 'maj'), 'Borrowed from major'); }
  } else {
    K.notes.forEach(n => ['maj','m','7','m7','sus4','5'].forEach(q => { const c = mkChord(n.pc, K.L + n.step, q); if (fitsKey(c)) add(c, 'In the key'); }));
  }
  add(mkChord(K.pc + 1, K.L + 1, 'maj'), 'Substitutes & specials');
  add(mkChord(K.pc + 1, K.L + 1, '7'), 'Substitutes & specials');
  add(mkChord(K.pc + 11, K.L + 6, 'dim7'), 'Substitutes & specials');
  if (K.majorish){ add(mkChord(K.pc + 4, K.L + 2, 'maj'), 'Substitutes & specials'); add(mkChord(K.pc + 8, K.L + 5, 'maj'), 'Substitutes & specials'); }
  else { add(mkChord(K.pc + 9, K.L + 5, 'm'), 'Substitutes & specials'); add(mkChord(K.pc, K.L, 'maj'), 'Substitutes & specials'); }
  return pool;
}
// Where a new chord after `at` would sit in the bar and in the phrase. Phrases are taken as groups of
// 4 bars (which also make 8- and 16-bar phrases): bars 1–2 establish the key, bar 3 builds tension,
// bar 4 cadences. `follower` is what plays after it: the next chord, or the first chord if it repeats.
function slotContext(chs, at){
  const n = S.ts.num, PH = 4 * n, len = S.defBeats;
  const start = prog.slice(0, at + 1).reduce((a, it) => a + it.b, 0), end = start + len;
  const nx = nextAfter(chs, at), inside = !!(nx && nx.inside), follower = nx ? nx.ch : null;
  const barNo = Math.floor(start / n) + 1, beatNo = start % n + 1, onBeat1 = start % n === 0;
  const pBar = Math.floor((start % PH) / n);
  const endsPhrase = end % PH === 0;
  const level = end % (4 * PH) === 0 ? 16 : end % (2 * PH) === 0 ? 8 : 4;
  const weight = level === 16 ? 1.5 : level === 8 ? 1.25 : 1;
  const where = `bar ${barNo}${onBeat1 ? '' : `, beat ${beatNo}`}`;
  const nextName = nx ? nx.label : 'the next phrase';
  let role, note;
  if (pBar === 3 && onBeat1 && endsPhrase){ role = 'cadence'; note = `It would fill bar ${barNo}, the last bar of a ${level}-bar phrase: the place for a cadence, landing home or pausing on V.`; }
  else if (pBar === 3 && onBeat1){ role = 'arrival'; note = `It would start bar ${barNo}, the last bar of a ${level === 4 ? '4' : level}-bar phrase, where a cadence usually lands.`; }
  else if (endsPhrase){ role = 'turnaround'; note = `It would end the ${level}-bar phrase (${where}): a turnaround that pulls into ${nextName}.`; }
  else if (pBar === 2){ role = 'precadence'; note = `It would sit in ${where}, the third bar of the phrase: build tension toward the cadence in bar ${barNo + 1}.`; }
  else if (!onBeat1 && end % n === 0){ role = 'approach'; note = `It would be on a weak beat (${where}) right before a bar line: a passing or approach chord into ${nextName} fits.`; }
  else { role = 'open'; note = `It would sit in ${where}, early in the phrase, where stable chords establish the key.`; }
  return { start, end, barNo, beatNo, role, note, follower, inside, level, weight, section: nx && nx.section };
}
/* ---- Bass line ----
   Inversions earn their place by what the bass does: staying on the previous bass note (a pedal under a new
   chord), then stepping by a half step into the next chord's bass (B → G7/B → C), or walking by step. */
const bassOf = ch => ch.bassPc ?? ch.rootPc;
const bassStep = (x, y) => Math.min(mod(y - x), mod(x - y));
function bassMove(prev, c, next){
  const b0 = prev ? bassOf(prev) : null, b1 = bassOf(c), b2 = next ? bassOf(next) : null;
  let s = 0, why = '';
  const stays = b0 != null && b0 === b1 && c.rootPc !== prev.rootPc;
  const into = b2 != null ? bassStep(b1, b2) : null, dir = b2 != null && mod(b2 - b1) <= 6 ? 'up' : 'down';
  if (stays) s += 0.25;
  if (into === 1) s += 0.35;
  else if (into === 2) s += 0.1;
  else if (into === 6) s -= 0.15;
  const line = b0 != null && b2 != null && bassStep(b0, b1) <= 2 && into >= 1 && into <= 2;
  if (line) s += 0.2;
  // a chord over its own 5th (second inversion) is unstable: only worth it for a very good reason
  const t = c.bassPc != null ? toneOf(c, c.bassPc) : null;
  if (t && t.num === 5) s -= 0.35;
  if (stays && into === 1) why = `${nameFor(b1)} stays in the bass and steps ${dir} a half step to ${nameFor(b2)}`;
  else if (into === 1 && c.bassPc != null) why = `the bass (${nameFor(b1)}) steps ${dir} a half step to ${nameFor(b2)}`;
  else if (line && c.bassPc != null) why = `a stepwise bass line: ${nameFor(b0)} → ${nameFor(b1)} → ${nameFor(b2)}`;
  else if (stays) why = `${nameFor(b1)} stays in the bass`;
  return { s, why };
}
// The inversions of c worth suggesting between prev and next: the bass stays on prev's bass note or moves
// by a step from it, and then moves by a step into next's bass. Only shapes playable on the current instrument.
function bassVariants(c, prev, next){
  if (!prev || !next || c.bassPc != null) return [];
  const b0 = bassOf(prev), b2 = bassOf(next), out = [];
  c.tones.forEach(t => {
    if (t.pc === c.rootPc || out.some(v => v.bassPc === t.pc)) return;
    if (!(bassStep(b0, t.pc) <= 2 && bassStep(t.pc, b2) >= 1 && bassStep(t.pc, b2) <= 2)) return;
    if (t.num === 5) return;   // no second inversions (a chord over its own 5th)
    const v = mkChord(c.rootPc, c.rootL, c.qid, t.pc);
    if (/C♭|F♭|E♯|B♯|𝄫|𝄪/.test(v.bassName || '')) return;   // awkwardly spelled basses
    if (fretted() && kind() !== 'bass' && !voicingsFor(v).list.length) return;
    out.push(v);
  });
  return out;
}
// Scores candidates for the slot after `at`: the move from the chord before, the move into what follows
// (the next chord, or the first chord when it loops or might be repeated), the slot's place in the bar and
// phrase, whether home has been visited yet, and repetition. The list always opens with chords that
// resolve and chords that set up what comes next.
function recommendations(chs, at){
  const pool = candidatePool();
  const A = chs[at] || null, fromV = voicedAt(at);
  if (!A){
    const starts = pool.filter(p => { const a = analyze(p.ch); return a.inKey && (a.fn === 'T' || a.num === 4); }).slice(0, 6);
    return starts.map(p => ({ ch: p.ch, tr: null, ctx: [], group: 'Good first chords', why: analyze(p.ch).text }));
  }
  const sc = slotContext(chs, at), F = sc.follower;
  ui.slotCtx = sc;
  // the next section's first chord is what really follows: it counts most
  const fw = sc.section ? 0.9 : sc.inside ? 0.6 : S.loop ? 0.45 : 0.25;
  const visitedHome = chs.some(c => c.rootPc === K.pc && analyze(c).fn === 'T');
  const counts = {};
  chs.forEach(c => { counts[c.symbol] = (counts[c.symbol] || 0) + 1; });
  const home = K.hept ? diatonic(0, false) : chordAt(K.pc, K.majorish ? 'maj' : 'm');
  const rate = ch => {
    const tr = transition(A, ch), a = analyze(ch), ctx = [], lt = localTarget(ch);
    const isHome = ch.rootPc === K.pc && a.fn === 'T';
    const pullsToF = F && ((lt && lt.pc === F.rootPc) || (a.target != null && a.target === F.rootPc));
    let score = tr.score;
    if (F && F.symbol !== ch.symbol){
      const t2 = transition(ch, F);
      score += fw * (t2.score - 1.6);
      const how = sc.inside ? '' : sc.section ? ` at the start of ${sc.section.name}` : S.loop ? ' when the loop restarts' : ' if the progression repeats';
      if (t2.score >= 2.3) ctx.push(`leads well into ${F.symbol}${how} (${t2.tag.toLowerCase()})`);
      else if (t2.kind === 'weak') ctx.push(`moves awkwardly into ${F.symbol}${how}`);
    }
    switch (sc.role){
      case 'cadence': case 'arrival':
        if (isHome){ score += (sc.role === 'cadence' ? 0.7 : 0.6) * sc.weight; ctx.push(`lands home in bar ${sc.barNo}: a full cadence that closes the ${sc.level}-bar phrase`); }
        else if (a.fn === 'D' && (a.target === K.pc || (lt && lt.pc === K.pc))){ score += 0.3 * sc.weight; ctx.push(`pauses on the dominant in bar ${sc.barNo}: a half cadence, a question the next phrase answers`); }
        break;
      case 'turnaround':
        if (pullsToF){ score += 0.6; ctx.push(`a turnaround: pulls into ${F.symbol} at the start of the next phrase`); }
        else if (isHome){ score += 0.2; ctx.push('rests at home before the next phrase'); }
        break;
      case 'precadence':
        if (a.fn === 'D'){ score += 0.35; ctx.push(`builds tension in bar ${sc.barNo}, ready to resolve in bar ${sc.barNo + 1}`); }
        else if (a.fn === 'PD'){ score += 0.3; ctx.push(`a pre-dominant in bar ${sc.barNo} sets up the cadence`); }
        break;
      case 'approach':
        if (pullsToF){ score += 0.45; ctx.push(`a quick approach chord into ${F.symbol} on the next downbeat`); }
        break;
      default:
        if (a.fn === 'T' || a.fn === 'PD') score += 0.1;
    }
    if (!visitedHome && chs.length >= 3 && isHome && a.inKey){ score += 0.4; ctx.push('the progression has not visited home yet'); }
    const c = counts[ch.symbol] || 0;
    if (c >= 2){ score -= 0.25 * (c - 1); ctx.push(`already used ${c} times`); }
    // how the hand gets there from the previous chord's actual shape
    const voice = nearVoice(ch, fromV), en = easeNote(voice, fromV);
    score += easeBonus(voice);
    if (en) ctx.push(en);
    const bm = bassMove(A, ch, F);
    score += bm.s;
    if (bm.why) ctx.unshift(bm.why);
    // the genre guide (if on) nudges typical chords up and unusual ones down
    const sb = styleBonus(ch, A);
    score += sb.s;
    if (sb.why) ctx.unshift(sb.why);
    return { ch, tr, score, ctx, voice };
  };
  // pinned: chords that resolve, and chords that set up what follows
  const taken = new Set([A.symbol]);
  // a chord, or its inversion when that gives a better bass line (V7 of the next chord as G7/B after B)
  const bestBass = ch => { if (!ch) return ch; const vs = bassVariants(ch, A, F); if (!vs.length) return ch; const all = [ch, ...vs].map(c => ({ c, s: rate(c).score })); return all.sort((a, b) => b.s - a.s)[0].c; };
  const pin = (ch, group, why) => {
    if (group !== 'Resolves') ch = bestBass(ch);   // resolutions land in root position
    if (!ch || taken.has(ch.symbol)) return null;
    taken.add(ch.symbol);
    const r = rate(ch);
    r.group = group;
    r.ctx = [why, ...r.ctx.filter(x => !x.startsWith('leads well into'))];
    return r;
  };
  const aA = analyze(A), tA = localTarget(A), tgt = aA.target != null ? aA.target : tA ? tA.pc : null;
  const resolves = [];
  if (tgt != null){
    const t = triadOnPc(tgt) || chordAt(tgt, K.majorish || tgt !== K.pc ? 'maj' : 'm');
    resolves.push(pin(t && !isDimType(t) ? t : chordAt(tgt, 'maj'), 'Resolves', `releases the pull of ${A.symbol}`));
  }
  const otherKeyNext = sc.section && !sameKey(secKey(sc.section), keyNow());
  if (!(A.rootPc === K.pc && aA.fn === 'T') && !otherKeyNext) resolves.push(pin(home, 'Resolves', 'lands home on the tonic'));
  const setups = [];
  if (F){
    const how = sc.inside ? `into ${F.symbol}` : sc.section ? `into ${F.symbol}, the start of ${sc.section.name}` : `back into ${F.symbol}${S.loop ? ' when the loop restarts' : ' if the progression repeats'}`;
    setups.push(pin(chordAt(F.rootPc + 7, '7'), 'Sets up what comes next', `the dominant (V7) of ${F.symbol}: creates tension that pulls ${how}`));
    setups.push(pin(chordAt(F.rootPc - 1, 'dim7'), 'Sets up what comes next', `a leading-tone chord of ${F.symbol}: every note slides by step ${how}`));
  }
  // with a genre guide on: the best of its typical chords here
  const g = GENRE();
  const typical = g ? genreChords().filter(c => !taken.has(c.symbol) && c.rootPc !== A.rootPc).map(rate).filter(r => r.score >= 1.6).sort((a, b) => b.score - a.score).slice(0, 4) : [];
  typical.forEach(r => { taken.add(r.ch.symbol); r.group = `Typical in ${g.name}`; });
  const rows = pool.filter(p => !taken.has(p.ch.symbol)).map(p => rate(p.ch));
  // a few inversions, when they make a better bass line than the chord in root position
  const inv = pool.flatMap(p => bassVariants(p.ch, A, F)).filter(c => !taken.has(c.symbol)).map(rate)
    .filter(r => r.score > (rows.find(x => x.ch.rootPc === r.ch.rootPc && x.ch.qid === r.ch.qid) || { score: 0 }).score).sort((a, b) => b.score - a.score).slice(0, 3);
  rows.push(...inv);
  rows.sort((a, b) => b.score - a.score);
  const good = rows.filter(r => r.score >= 2.3).slice(0, 6);
  const color = rows.filter(r => r.score >= 1.6 && r.score < 2.3).slice(0, 5);
  const weak = rows.filter(r => r.tr.kind === 'weak' || r.score < 1.2).slice(-3);
  // before another section, what leads into it comes first
  const pinned = sc.section ? [...setups.filter(Boolean), ...resolves.filter(Boolean)] : [...resolves.filter(Boolean), ...setups.filter(Boolean)];
  return [...pinned, ...typical, ...good.map(r => ({ ...r, group: 'Works well' })), ...color.map(r => ({ ...r, group: 'Smooth or colorful' })), ...weak.map(r => ({ ...r, group: 'Usually weak' }))];
}

/* ---- per-chord voicings in the progression ---- */
// Fretted: the item's locked shape for this instrument and tuning (getVo). A shape the player fingered themselves is kept exactly, as long as it
// still plays the chord; otherwise (new key, tuning or capo) the nearest shape on the neck is used.
// Piano: item.pv = a voicing name from pianoVoicings(), or the exact keys (an array of notes) the player chose.
function ownShape(frets, ch){
  if (!frets || frets.length !== eff().length || frets.every(f => f === null)) return null;
  const t = eff(), midis = frets.map((f, i) => f === null ? null : t[i] + f).filter(m => m !== null);
  const have = new Set(midis.map(m => mod(m)));
  if (!have.has(ch.rootPc) || !ch.q.req.every(s => have.has(mod(ch.rootPc + s)))) return null;
  const fr = frets.filter(f => f !== null && f > 0), pos = fr.length ? Math.min(...fr) : 0;
  return { frets: frets.slice(), midis, pos, span: fr.length ? Math.max(...fr) - pos : 0, barre: null, score: 0, fingers: fr.length, bassPc: mod(Math.min(...midis)), own: true };
}
function itemShape(it, ch){
  const v = voicingsFor(ch), vo = getVo(it);
  if (vo){
    const k = vo.frets.join();
    let i = v.list.findIndex(x => x.frets.join() === k);
    if (i < 0){
      let own = ownShape(vo.frets, ch);
      // the chord moved but the shape didn't: the same shape slid along the neck, if it plays the chord
      for (let d = 1; !own && d <= 12; d++) for (const sg of [d, -d]){
        if (own) break;
        const sl = vo.frets.map(f => f === null || f === 0 ? f : f + sg);
        if (sl.every(f => f === null || f === 0 || (f >= 1 && f <= FRETS)) && sl.some(f => f > 0)){
          own = ownShape(sl, ch);
          const j = own ? v.list.findIndex(x => x.frets.join() === sl.join()) : -1;
          if (j >= 0) return { list: v.list, idx: j, custom: true };
        }
      }
      if (own) return { list: [own, ...v.list], idx: 0, custom: true };
    }
    if (!v.list.length) return null;
    if (i < 0) i = v.list.reduce((bi, x, j) => Math.abs(x.pos - vo.pos) < Math.abs(v.list[bi].pos - vo.pos) ? j : bi, 0);
    return { list: v.list, idx: i, custom: true };
  }
  if (!v.list.length) return null;
  return { list: v.list, idx: v.best, custom: false };
}
function itemPiano(it, ch){
  const list = pianoVoicings(ch);
  if (Array.isArray(it.pv)) return { list: [{ name: 'Your voicing', midis: it.pv.slice() }, ...list], idx: 0, custom: true };
  const i = it.pv ? list.findIndex(p => p.name === it.pv) : -1;
  return { list, idx: i, custom: i >= 0 };
}
const hasCustomVoicing = it => kind() === 'piano' ? !!it.pv : !!getVo(it);
function playItem(i){
  const it = prog[i], ch = fromItem(it);
  if (!hasCustomVoicing(it) || kind() === 'bass'){ playChord(ch); return; }
  ac(); ui.focus = ch;
  if (fretted()){ const s = itemShape(it, ch); S.shape[S.inst] = s.list[s.idx].frets.slice(); strumFrets(S.shape[S.inst]); }
  else { const p = itemPiano(it, ch); S.piano = p.list[p.idx].midis.slice(); rollMidis(S.piano); }
  renderInstrument();
}
function substitutions(X){
  const res = [], aX = analyze(X), seen = new Set([X.symbol]);
  const push = (chs, kind, why) => { const k = chs.map(c => c.symbol).join(' '); if (seen.has(k)) return; seen.add(k); res.push({ chs, kind, why }); };
  const sev = X.q.tones.length > 3;
  if (K.hept && aX.inKey){
    K.notes.forEach((_, i) => {
      const c = diatonic(i, sev);
      if (c.rootPc === X.rootPc) return;
      const common = c.pcs.filter(p => X.pcs.includes(p)).length;
      if (common >= 2) push([c], 'swap', `Shares ${common} notes with ${X.symbol}, so it can do a similar job with a different color.`);
    });
  }
  const pn = parallelNotes(K.majorish ? 'aeolian' : 'major');
  const li = mod(X.rootL - K.L, 7);
  if (K.hept){
    const b = stackChord(pn, K.L, li, sev);
    if (b.symbol !== X.symbol) push([b], 'swap', `Borrowed version from ${K.notes[0].name} ${K.majorish ? 'minor' : 'major'}: same root position in the scale, opposite mood.`);
  }
  ['maj7','7','m7','6','m6','add9','sus2','sus4','9','m9','maj9','7sus4'].forEach(q => {
    const c = mkChord(X.rootPc, X.rootL, q);
    if (q !== X.qid && fitsKey(c) && res.length < 12) push([c], 'swap', `Richer color on the same root (${QMAP[q].name.toLowerCase()}), still inside the scale.`);
  });
  if (isDomType(X) && aX.target != null){
    const ts = chordAt(X.rootPc + 6, '7');
    push([ts], 'swap', `Tritone substitution: ${ts.symbol} shares the tritone of ${X.symbol}, and its bass slides down a half step to the target.`);
    if (aX.target === K.pc) push([mkChord(K.pc + 10, K.L + 6, '7')], 'swap', 'Backdoor dominant ♭VII7: approaches home from a whole step below, softer and bluesier than V7.');
    push([chordAt(X.rootPc + 1, 'dim7')], 'swap', 'Diminished 7th on the 3rd of the dominant: the same pull, more drama (it is a V7♭9 without its root).');
  }
  if (!isDimType(X) && X.qid !== 'aug'){
    const V = chordAt(X.rootPc + 7, '7');
    if (V.symbol !== X.symbol) push([V], 'before', `Put its own dominant (V7 of ${X.symbol}) in front, so the arrival feels inevitable.`);
    const lt = chordAt(X.rootPc - 1, 'dim7');
    if (lt.symbol !== X.symbol) push([lt], 'before', `Put its leading-tone chord (vii°7 of ${X.symbol}) in front: ${lt.rootName} rises a half step to ${X.rootName} and every other note slides by step into ${X.symbol}. More dramatic than V7, a classic gospel and show-tune move.`);
    const ii = chordAt(X.rootPc + 2, X.q.minor ? 'm7b5' : 'm7');
    push([ii, V], 'before', `Put a ii–V of ${X.symbol} in front (a “tonicization”): for two chords ${X.symbol} becomes a new home. The jazz way to spotlight a chord.`);
    const VV = chordAt(X.rootPc + 2, '7');
    if (V.symbol !== X.symbol) push([VV, V], 'before', `An extended dominant chain into ${X.symbol}: ${VV.symbol} is the V7 of ${V.symbol}, which is the V7 of ${X.symbol}. Each chord resolves down a 5th into the next, so the pull builds twice before it lands.`);
  }
  if (GENRE()) res.sort((a, b) => styleBonus(b.chs[0], null).s - styleBonus(a.chs[0], null).s);
  return res;
}
// Which note does the progression treat as home? Weighs the first and last chords, where dominants and
// leading-tone chords resolve, and how long each chord lasts. Returns a suggestion only when it clearly
// differs from the selected key and a scale with the same notes starts on that note.
// The 7-note scales on a root, best fit first: fewest chord notes outside the scale (weighted by chord length),
// then the scale with the current key's notes, then the familiar scales before the exotic ones
const COMMON_SCALES = ['major', 'aeolian', 'dorian', 'mixolydian', 'harmonic', 'melodic', 'lydian', 'phrygian', 'locrian'];
function scaleFits(pc, chs, w){
  return SCLIST.filter(sc => sc.degs.length === 7).map(sc => {
    const k = makeKey(pc, sc.id), ci = COMMON_SCALES.indexOf(sc.id);
    const out = chs.reduce((a, c, i) => a + w[i] * c.pcs.filter(p => !k.pcs.has(p)).length, 0);
    return { sc, k, out, inside: chs.filter(c => c.pcs.every(p => k.pcs.has(p))).length, same: [...k.pcs].every(p => K.pcs.has(p)), rank: ci < 0 ? 50 : ci };
  }).sort((a, b) => a.out - b.out || b.same - a.same || a.rank - b.rank);
}
// Where the progression feels at home, and the scale on that root its chords fit best. Suggested when the
// center isn't the key's root, or (same root) when another scale fits the chords far better than the key's.
const MODE_MARGIN = { major: 2, aeolian: 2, harmonic: 2.5, mixolydian: 3, dorian: 3, melodic: 3, phrygian: 4.5, lydian: 5, locrian: 6 };
function detectCenter(chs, items = prog){
  if (chs.length < 3 || !K.hept) return null;
  const sc = {};
  const add = (pc, v) => { sc[pc] = (sc[pc] || 0) + v; };
  const w = chs.map((c, i) => items[i].b / S.ts.num);
  chs.forEach((c, i) => { if (!isDimType(c)) add(c.rootPc, 0.5 * w[i]); });
  if (!isDimType(chs[0])) add(chs[0].rootPc, 2);
  // a song ending on IV (Cmaj7 in G) is an open ending, not a new home
  const last = chs[chs.length - 1];
  const openIV = K.sc.id === 'major' && mod(last.rootPc - K.pc) === 5 && !hasRel(last, 3) && !hasRel(last, 8) && !hasRel(last, 10);
  if (!isDimType(last) && !openIV) add(last.rootPc, 1.5);
  const n = chs.length;
  for (let i = 0; i < n; i++){
    if (i === n - 1 && !S.loop) break;
    const A = chs[i], B = chs[(i + 1) % n], t = localTarget(A);
    if (isDimType(B)) continue;
    if (t && t.pc === B.rootPc) add(B.rootPc, 2.5);
    // a dominant 7th down a 5th is strong evidence of home; a plain major chord moving by a 5th either way is
    // weak (G → C may be I → IV, and C → G may be IV → I, a plagal return home), so it counts a little both ways
    else if (mod(B.rootPc - A.rootPc) === 5 && isDomType(A)) add(B.rootPc, A.q.full.includes(10) ? 1.2 : 0.6);
    else if (mod(B.rootPc - A.rootPc) === 7 && (A.qid === 'maj' || A.qid === 'maj7')) add(B.rootPc, 0.6);
  }
  const best = +Object.keys(sc).sort((a, b) => sc[b] - sc[a])[0];
  const cur = chs.reduce((a, c, i) => a + w[i] * c.pcs.filter(p => !K.pcs.has(p)).length, 0);
  const fit = scaleFits(best, chs, w)[0];
  const res = { pc: best, scale: fit.sc.id, name: fit.k.name, chord: chs.find(c => c.rootPc === best), same: fit.same, inside: fit.inside, curInside: chs.filter(c => c.pcs.every(p => K.pcs.has(p))).length, total: n };
  // another mode of the same notes (G major → C Lydian) needs much more evidence, the rarer the mode the more
  const margin = fit.same ? (MODE_MARGIN[fit.sc.id] ?? 3) : 2;
  if (best !== K.pc) return sc[best] >= (sc[K.pc] || 0) + margin && fit.out <= cur ? res : null;
  // same root: only when another scale is a much better fit (borrowed chords alone don't trigger this)
  return fit.sc.id !== K.sc.id && cur >= 2 && fit.out <= cur / 3 ? res : null;
}
// Change the key but keep every chord exactly as it is (progression, song sections and custom voicings)
// Only the chords open in the builder are re-labelled (the progression, or the song section being edited):
// every other section keeps its own key and chords. Same chords, so locked voicings stay as they are.
// the same chords written in the current key (K): Roman numerals change, chords and voicings don't
function relabelItems(items, keep){
  items.splice(0, items.length, ...keep.map(x => { const it = itemFromAbs({ ...x.a, keyPc: -1 }); if (x.vos) it.vos = x.vos; if (x.pv) it.pv = x.pv; return it; }));
}
const keepItems = items => items.map(it => ({ a: absFromItem(it), vos: vosOf(it), pv: it.pv }));
function rekeyKeepingChords(pc, scale){
  const keep = keepItems(prog), from = keyNow();
  S.keyPc = pc; S.scale = scale; computeKey();
  relabelItems(prog, keep);
  const part = W.edit && partById(W.edit);
  if (part){ part.key = keyNow(); part.keyOk = !sameKey(part.key, W.song.key); }
  else W.prog.keyAt = keyNow();   // the same chords: still the same (saved) progression
  if (!sameKey(from, keyNow())) keyLog({ where: ctxLabel(part ? 'part' : 'prog'), doc: part ? W.song.name : W.prog.name, from, to: keyNow(), chords: 'kept (re-labelled)' });
  ui.focus = null; save(); renderAll();
}
function summary(chs, items = prog){
  if (!chs.length) return 'Add chords to see how the progression works.';
  const an = chs.map(analyze);
  const trs = chs.slice(1).map((c, i) => transition(chs[i], c));
  if (S.loop && chs.length > 1) trs.push(transition(chs[chs.length - 1], chs[0]));
  const cad = trs.filter(t => t.tag === 'Cadence').length, dec = trs.filter(t => t.tag === 'Deceptive').length;
  const outside = an.filter(a => !a.inKey).length, weak = trs.filter(t => t.kind === 'weak').length;
  const flow = an.map(a => a.fn === 'X' ? '★' : a.fn).join(' → ');
  const parts = [];
  parts.push(`Function flow: <b class="mono">${flow}</b>.`);
  parts.push(an[0].fn === 'T' && an[0].num === 1 ? 'It starts at home, which sets up the key clearly.' : 'It starts away from the tonic, so the key is implied and only confirmed later.');
  const last = an[an.length - 1];
  if (last.fn === 'D') parts.push(S.loop ? 'It ends on a dominant, which pulls straight back to the start each time it loops.' : 'It ends on a dominant (a half cadence): it sounds like a question.');
  else if (last.fn === 'T' && last.num === 1) parts.push('It ends at home, so it feels finished.');
  if (cad) parts.push(`${cad} cadence${cad > 1 ? 's' : ''} resolve${cad > 1 ? '' : 's'} home.`);
  if (dec) parts.push('There is a deceptive cadence, a built-in surprise.');
  if (outside) parts.push(`${outside} chord${outside > 1 ? 's come' : ' comes'} from outside the key (★), adding color.`);
  if (weak) parts.push(`${weak} move${weak > 1 ? 's are' : ' is'} marked weak; the suggestions panel shows stronger options.`);
  // how each 4-bar phrase ends
  const n = S.ts.num, PH = 4 * n, total = items.reduce((x, it) => x + it.b, 0);
  let pos = 0;
  const ends = [];
  chs.forEach((c, i) => {
    pos += items[i].b;
    if (pos % PH === 0){
      const a = analyze(c), home = c.rootPc === K.pc && a.fn === 'T';
      ends.push(`bar ${pos / n} ends on <b>${c.symbol}</b> (${a.rn}): ${home ? 'a full stop, home' : a.fn === 'D' ? 'a half cadence, a question' : 'an open ending'}`);
    }
  });
  if (ends.length) parts.push(`Phrase endings: ${ends.slice(0, 6).join('; ')}.`);
  if (total % PH !== 0) parts.push(`It is ${+(total / n).toFixed(2)} bars long; phrases usually come in 4 or 8 bars, so the loop point may feel early or late.`);
  return parts.join(' ');
}
function tensionChart(chs, items = prog){
  if (!chs.length) return '';
  const total = items.reduce((s, it) => s + it.b, 0), W = 1000, H = 120, L = 56, T = 10, B = 22;
  const sx = b => L + (W - L - 6) * b / total, sy = v => T + (H - T - B) * (1 - v / 3.5);
  let o = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tension over the progression">`;
  [[0.5, 'rest'], [2, 'motion'], [3.2, 'tension']].forEach(([v, l]) => { o += `<line x1="${L}" x2="${W - 6}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${L - 6}" y="${sy(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${l}</text>`; });
  let b = 0;
  const pts = [];
  chs.forEach((ch, i) => {
    const a = analyze(ch), x0 = sx(b), x1 = sx(b + items[i].b), y = sy(a.tension);
    o += `<rect x="${x0 + 2}" y="${y}" width="${Math.max(2, x1 - x0 - 4)}" height="${H - B - y}" rx="3" fill="var(--fn-${a.fn.toLowerCase()})" opacity="${i === ui.selSlot ? 0.95 : 0.55}" data-act="slot" data-i="${i}" style="cursor:pointer"/>`;
    o += `<text x="${(x0 + x1) / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--ink)">${a.rn}</text>`;
    pts.push(`${(x0 + x1) / 2},${y}`);
    b += items[i].b;
  });
  o += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
  pts.forEach(p => { const [x, y] = p.split(','); o += `<circle cx="${x}" cy="${y}" r="3" fill="var(--ink)"/>`; });
  return o + '</svg>';
}
const styleSelectHTML = () => `<label class="fld"><span>Style</span><select id="style"><option value="sustain"${S.style === 'sustain' ? ' selected' : ''}>Sustained</option><option value="rhythm"${S.style === 'rhythm' ? ' selected' : ''}>Rhythm / pattern</option><option value="arp"${S.style === 'arp' ? ' selected' : ''}>Arpeggio / picking</option></select></label>`;
function renderProg(){
  const el = $('#p-prog');
  if (ui.selSlot >= prog.length) ui.selSlot = prog.length - 1;
  if (ui.selEnd == null || ui.selEnd >= prog.length || ui.selEnd < 0) ui.selEnd = ui.selSlot;
  const [sa, sb] = selRange();
  const chs = progChords();
  const BAR = S.ts.num;
  let bar = 1;
  const charts = S.progCharts && kind() !== 'bass', PV = charts ? progVoicings(prog) : null;
  // Roman numerals read in context: extended dominants and secondary ii–V chains
  const FC = functionChain(chs);
  const tl = chs.map((ch, i) => {
    const a = FC.at(i), it = prog[i];
    let conn = '';
    if (i > 0){
      const tr = transition(chs[i - 1], ch);
      conn = `<div class="conn k-${tr.kind}" title="${tr.lines[0].replace(/"/g, '')}"><span>${MOTION_SHORT[tr.iv]}</span><b>${tr.tag}</b></div>`;
    }
    const startBar = bar; bar += it.b / BAR;
    // a new line here, chosen on the card (↵)
    const brk = i > 0 && it.br;
    return (brk ? '<div class="tl-break"></div>' : '') + conn + `<div class="slot${i === ui.selSlot ? ' on' : ''}${sb > sa && i >= sa && i <= sb ? ' insel' : ''}${i === ui.playing ? ' now' : ''}" draggable="true" data-act="slot" data-i="${i}" style="--b:${Math.min(16, it.b * 4 / BAR)}">
      <div class="fn-stripe ${FN_CLASS[a.fn]}"></div>
      <div class="top"><span>${a.rn}${hasCustomVoicing(it) ? ' <span title="Custom voicing">✎</span>' : ''}</span><span class="bar">${Number.isInteger(startBar) ? 'bar ' + startBar : ''}${i ? `<button data-act="brk" data-i="${i}" class="brk" aria-pressed="${!!it.br}" title="${it.br ? 'Join the line above' : 'Start a new line here'}" aria-label="${it.br ? 'Join the line above' : 'Start a new line at this chord'}">↵</button>` : ''}</span></div>
      <div class="sym">${ch.symbol}</div>${charts ? voicingChart(PV[i]) : ''}
      <div class="ctl"><select data-act="beats" data-i="${i}" aria-label="Length of ${ch.symbol}">${beatOptions(it.b).map(([v, l]) => `<option value="${v}"${v === it.b ? ' selected' : ''}>${l}</option>`).join('')}</select>
      <button data-act="mv" data-i="${i}" data-d="-1" aria-label="Move left">‹</button><button data-act="mv" data-i="${i}" data-d="1" aria-label="Move right">›</button><button data-act="rm" data-i="${i}" aria-label="Remove">×</button></div></div>`;
  }).join('') || '<p class="empty">No chords yet. Use the suggestions, the palette below, or <b>+</b> anywhere in the app.</p>';

  const X = chs[ui.selSlot] || null;
  let detail = '<p class="muted">Select a chord in the timeline to see why it works.</p>';
  ui.subs = [];
  if (X){
    const a = FC.at(ui.selSlot);
    const pi = ui.selSlot > 0 ? ui.selSlot - 1 : (S.loop && chs.length > 1 ? chs.length - 1 : -1);
    const prev = pi >= 0 ? chs[pi] : null, nx = nextAfter(chs, ui.selSlot), next = nx && !(nx.loop && !S.loop) ? nx.ch : null;
    const trIn = prev ? transition(prev, X) : null, trOut = next ? transition(X, next) : null;
    // substitutions, starting with whole-chord swaps that lead into what follows; each voiced near the chord before
    const prevV = pi >= 0 ? voicedAt(pi) : null;
    ui.subNext = next ? nx : null; ui.subPrev = pi;
    ui.subs = [...leadInSwaps(X, prev, next ? nx : null, prevV).map(x => ({ chs: [x.ch], kind: 'swap', lead: true, voices: [x.voice],
      why: `Leads into ${nx.label}: ${x.out.lines[0]}${x.bass ? ` ${x.bass[0].toUpperCase() + x.bass.slice(1)}.` : ''}${easeNote(x.voice, prevV) ? ` It is ${easeNote(x.voice, prevV)}.` : ''}` })), ...substitutions(X)];
    ui.subs.forEach(s => {
      if (s.voices) return;
      let from = prevV;
      s.voices = s.chs.map(c => { const v = nearVoice(c, from); from = v || from; return v; });
      const en = s.kind === 'swap' ? easeNote(s.voices[0], prevV) : '';
      if (en) s.why += ` It is ${en}.`;
    });
    const sub = ui.subs.map((s, i) => `<div class="rec"><button class="rs" data-act="subSolo" data-i="${i}" title="Play ${s.chs.length > 1 ? 'these chords' : 'just this chord'}">${s.chs.map(c => c.symbol).join(' ')}<small>${(s.kind === 'before' ? ctxRns([...s.chs, X]).slice(0, -1) : s.chs.map(c => analyze(c).rn)).join(' ')}</small></button><div class="rw"><span class="pill ${s.lead ? 'k-strong' : s.kind === 'swap' ? 'k-color' : 'k-strong'}">${s.lead ? 'Swap: leads on' : s.kind === 'swap' ? 'Swap' : 'Insert before'}</span>${s.why}</div><div class="ra"><button class="btn sm" data-act="subHear" data-i="${i}" aria-label="Hear it">▶</button><button class="btn sm" data-act="subWhy" data-i="${i}" title="Open it in the analyzer: where it comes from and how it moves">Why?</button><button class="btn sm" data-act="subDo" data-i="${i}">${s.kind === 'swap' ? 'Swap' : 'Insert'}</button></div></div>`).join('');
    const trBlock = (tr, label) => tr ? `<div class="why"><span class="lbl">${label}</span><div><span class="pill k-${tr.kind}">${tr.tag}</span></div><ul>${tr.lines.map(l => `<li>${l}</li>`).join('')}</ul></div>` : '';
    const it = prog[ui.selSlot];
    let voic = '';
    ui.slotV = [];
    if (kind() === 'bass') voic = '<p class="hint">On bass, playback plays a bass line on each chord\'s root, so there is no chord voicing to choose.</p>';
    else if (fretted()){
      const s = itemShape(it, X);
      if (s){
        ui.slotV = s.list;
        const cards = s.list.map((x, j) => `<button class="shape${s.custom && j === s.idx ? ' on' : ''}" data-act="slotV" data-i="${j}">${diagramSVG(x, X, eff())}<span class="cap">${fretsText(x.frets)}</span></button>`);
        if (s.custom && !S.vOpen) cards.unshift(cards.splice(s.idx, 1)[0]);
        voic = `<div class="shapes" id="vgrid"><button class="shape${s.custom ? '' : ' on'}" data-act="slotV" data-i="-1"><span class="cap"><b>Auto</b><br>${S.smooth ? 'chosen by smooth<br>voice leading' : 'most common<br>shape'}</span></button>` + cards.join('') + '</div>';
      } else voic = '<p class="hint">No playable shape in this tuning.</p>';
    } else {
      const p = itemPiano(it, X);
      ui.slotV = p.list;
      voic = `<div class="pvs" id="vgrid"><button class="pv${p.custom ? '' : ' on'}" data-act="slotV" data-i="-1" style="${p.custom ? '' : 'border-color:var(--ink)'}"><span class="lbl">Auto</span><span class="hint">${S.smooth ? 'Chosen by smooth voice leading' : 'Bass note plus a root-position chord'}</span></button>` +
        p.list.map((v, j) => { const lo = Math.floor(Math.min(...v.midis) / 12) * 12; return `<button class="pv" data-act="slotV" data-i="${j}" style="${p.custom && j === p.idx ? 'border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)' : ''}"><span class="lbl">${v.name}</span>${pianoSVG(lo, Math.max(lo + 23, Math.ceil((Math.max(...v.midis) + 1) / 12) * 12 - 1), v.midis, { w: 12, h: 46, ref: X, fit: true, noOct: true, lbl: () => '' })}</button>`; }).join('') + '</div>';
    }
    detail = `<div class="dhead"><div class="big-sym">${X.symbol}</div><div><div class="mono" style="font-size:20px;font-weight:600">${a.rn}</div><button class="tag an-link" data-act="anSel" title="Open in the analyzer: where it comes from, its notes and how the voices move"><i class="${FN_CLASS[a.fn]}"></i>${FN_NAME[a.fn]} · ${a.origin}${a.src ? ` (from ${esc(keyNameOf(a.src))})` : ''} <span class="an-go">Analyze ›</span></button></div></div>
      <p>${a.text}</p>
      ${X.custom ? `<p class="slotnote">You named this chord <b>${esc(X.symbol)}</b>. Harmony Bench treats it as <b>${X.name0}</b>, the closest standard chord, for the analysis and suggestions, and plays the exact notes you chose. A custom name doesn't change when you transpose. <span class="acts" style="margin-top:6px"><button class="btn sm" data-act="ccRename">Rename…</button><button class="btn sm" data-act="ccClear">Use the name ${X.name0}</button></span></p>` : `<p><button class="btn sm" data-act="ccRename" title="Show this chord under a name you choose">Give it your own name…</button></p>`}
      ${trBlock(trIn, `Coming in from ${prev ? prev.symbol : ''}`)}
      ${trBlock(trOut, `Going out to ${next ? nx.label : ''}`)}
      ${soloHTML(X)}
      <div class="sec"><h3>Voicing for this chord</h3><p class="hint">Pick how ${X.symbol} is played in this spot. Auto lets the app choose; any other choice is kept for this chord (marked ✎) and used in playback.</p>${voic}${ui.slotV.length ? `<button class="btn sm vtoggle" id="vToggle" data-act="vToggle" hidden></button>` : ''}</div>
      <h3>Substitutions and approaches</h3><div class="recs">${sub || '<p class="muted">None found.</p>'}</div>`;
  }
  // what could come next: after the selected chord (its button inserts it right there)
  const at = X ? ui.selSlot : chs.length - 1, mid = at < chs.length - 1;
  ui.recAt = at;
  const A = chs[at] || null, nxA = A ? nextAfter(chs, at) : null, Nx = nxA && (nxA.inside || nxA.section || S.loop) ? nxA.ch : null;
  ui.recs = recommendations(chs, at);
  let lastG = '';
  const recs = ui.recs.map((r, i) => {
    const head = r.group !== lastG ? `<div class="rgroup">${r.group}</div>` : '';
    lastG = r.group;
    const a = analyze(r.ch), tr = r.tr;
    return head + `<div class="rec"><button class="rs" data-act="recSolo" data-i="${i}" title="Play just this chord">${r.ch.symbol}<small>${a.rn}</small></button><div class="rw">${tr ? `<span class="pill k-${tr.kind}">${tr.tag}</span>` : ''}${a.inKey ? '' : `<span class="pill k-color">${a.origin}</span>`}${tr ? tr.lines[0] : r.why}${r.ctx && r.ctx.length ? ` <i class="muted">In context: ${r.ctx.join('; ')}.</i>` : ''}</div><div class="ra"><button class="btn sm" data-act="recHear" data-i="${i}" aria-label="Hear the move">▶</button><button class="btn sm" data-act="recWhy" data-i="${i}" title="Open it in the analyzer: where it comes from and how it moves">Why?</button><button class="btn sm" data-act="recAdd" data-i="${i}">${mid ? `Insert after ${A.symbol}` : '+ Add'}</button></div></div>`;
  }).join('');

  const pool = candidatePool();
  ui.pal = pool.map(p => p.ch);
  const groups = [...new Set(pool.map(p => p.group))];
  const pal = groups.map(g => `<div class="palrow"><span class="lbl">${g}</span><div class="chips">${pool.map((p, i) => p.group !== g ? '' : `<span class="pchip"><button class="p" data-act="palHear" data-i="${i}">${p.ch.symbol}<small>${analyze(p.ch).rn}</small></button><button class="a" data-act="palAdd" data-i="${i}" aria-label="Add ${p.ch.symbol}">+</button></span>`).join('')}</div></div>`).join('');

  const curPart = W.edit ? W.song.parts.find(p => p.id === W.edit) : null;
  const clip = LIB.clip ? LIB.clip.items.map(a => mkChord(a.pc, a.L, a.q, a.bs).symbol).join(' ') : '';
  el.innerHTML = `
  <div class="sec-h"><h2>Progression builder</h2><p class="hint">Changing the mode keeps the chords and re-analyzes them against the new scale.</p></div>
  ${curPart ? `<div class="banner"><span>Editing the <b>${esc(curPart.name)}</b> section of the song <b>${esc(W.song.name)}</b>. Changes go straight into the song.</span><button class="btn primary sm" data-act="backToSong">← Back to the song</button></div>`
    : fileBar('prog').replace('<button class="btn sm" data-act="backup">', `<button class="btn sm" data-act="toSong">Make into a song…</button><button class="btn sm" data-act="backup">`)}
  <div class="transport">
    <div class="fld"><span>Key</span><div class="tempo"><button class="btn" data-act="transpose" data-d="-1" title="Transpose down a half step" aria-label="Transpose down a half step">−</button><b class="mono" style="min-width:9ch;text-align:center">${K.notes[0].name} ${K.sc.short}</b><button class="btn" data-act="transpose" data-d="1" title="Transpose up a half step" aria-label="Transpose up a half step">+</button></div></div>
    <button class="play" data-act="play" aria-label="${PB.on ? 'Stop' : 'Play'} progression" title="${PB.on ? 'Click to stop. Double-click to restart from the first chord.' : 'Click to play from the selected chord. Double-click to play from the first chord.'} (Space also plays and stops.)">${PB.on ? '<svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8"/></svg>' : '<svg viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9Z"/></svg>'}</button>
    <div class="fld"><span title="Tempo counts the beat unit of the time signature">Tempo ${BEAT_SYMBOL[S.ts.den] || ''}=</span><div class="tempo"><input type="range" id="bpmR" min="30" max="300" value="${S.bpm}" aria-label="Tempo"><input type="number" id="bpmN" min="30" max="300" value="${S.bpm}" aria-label="Tempo in BPM"><span class="lbl">BPM</span></div></div>
    ${tsSelectHTML('tsSel')}
    <label class="fld"><span>New chord length</span><select id="defBeats">${beatOptions(S.defBeats).map(([v, l]) => `<option value="${v}"${v === S.defBeats ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    ${styleSelectHTML()}
    ${patternControlHTML()}
    <label class="chk"><input type="checkbox" id="loop"${S.loop ? ' checked' : ''}> Loop</label>
    <label class="chk"><input type="checkbox" id="clk"${S.click ? ' checked' : ''}> Click</label>
    <label class="chk" title="Voices each chord close to the one before, so the notes move as little as possible. On piano it picks the nearest inversion; on guitar and ukulele it picks the shape nearest on the neck. Off, every chord uses its standard voicing. Chords with a custom voicing (✎) always keep it."><input type="checkbox" id="smooth"${S.smooth ? ' checked' : ''}> Smooth voice leading</label>
    <label class="fld"><span>Load a classic</span><select id="preset"><option value="">Choose…</option>${(() => { const g = GENRE(), all = PRESETS.map((p, i) => `<option value="${i}">${p[0]}</option>`).join(''); return g ? `<optgroup label="${g.name} classics">${g.presets.map((p, i) => `<option value="g${i}">${p[0]}</option>`).join('')}</optgroup><optgroup label="Other classics">${all}</optgroup>` : all; })()}</select></label>
    ${curPart ? `<div class="fld"><span>Genre guide</span><span class="mono" title="A section follows its song's genre guide; change it on the Song builder tab">${GENRE() ? GENRE().name : 'Off'} (song)</span></div>` : genreSelectHTML('genreProg', W.prog.genre)}
    ${fretted() && !INST[S.inst].fretless && kind() !== 'bass' ? '<button class="btn" data-act="easyCapo" title="Find a capo position that turns these chords into easy open shapes">Easy capo…</button>' : ''}
    <button class="btn" data-act="clear">Clear</button>
  </div>
  ${practiceHTML('prog')}
  <div class="tlbar">
    ${kind() !== 'bass' ? `<div class="seg" id="progView" role="group" aria-label="Chord cards show"><button data-v="0" aria-pressed="${!charts}">Names</button><button data-v="1" aria-pressed="${charts}" title="Show each chord's chart: the shape playback uses, or the one you chose (✎)">Charts</button></div>` : ''}
    <button class="btn sm" data-act="anOpen"${prog.length ? '' : ' disabled'} title="Open the analyzer: where every chord comes from, which chords visit another key, and the function flow">Analyze…</button>
    <span class="hint">Cards wrap to fit; click ↵ on a chord (top right) to start a new line there, e.g. at each new section or bar.</span>
  </div>
  <div class="timeline${charts ? ' charts' : ''}" id="timeline">${tl}</div>
  <div class="seltools">
    <span class="hint">${sb > sa ? `<b>${sb - sa + 1} chords selected</b> (bars ${barAt(sa)}–${barAt(sb, true)})` : 'Click a chord to select it; Shift-click another to select a range.'}</span>
    <button class="btn sm" data-act="clipCopy"${prog.length ? '' : ' disabled'} title="Ctrl/Cmd+C">Copy</button>
    <button class="btn sm" data-act="clipCut"${prog.length ? '' : ' disabled'} title="Ctrl/Cmd+X">Cut</button>
    <button class="btn sm" data-act="clipPaste"${clip ? '' : ' disabled'} title="${clip ? `Pastes the chords you copied (${esc(clip)}${LIB.clip.from ? `, copied in ${esc(LIB.clip.from)}` : ''}${LIB.clip.at ? ` on ${fmtDate(LIB.clip.at)}` : ''}) after the selected chord. Ctrl/Cmd+V.` : 'Nothing copied yet: select chords and click Copy (or Ctrl/Cmd+C).'}">Paste copied chords${clip ? `: <span class="mono">${esc(clip.length > 40 ? clip.slice(0, 40) + '…' : clip)}</span>` : ''}</button>
    <button class="btn sm" data-act="selDup"${prog.length ? '' : ' disabled'} title="Ctrl/Cmd+D">Duplicate</button>
    <button class="btn sm" data-act="selDel"${prog.length ? '' : ' disabled'} title="Delete key">Delete</button>
    <button class="btn sm" data-act="pasteText">Paste chord text…</button>
    <button class="btn sm" data-act="copyText"${prog.length ? '' : ' disabled'}>Copy as text…</button>
    ${notationButton()}
    <button class="btn sm" data-act="printSheet" data-arg="prog"${prog.length ? '' : ' disabled'} title="Chord diagrams, chart and sheet music, to print or save as PDF">Print / PDF…</button>
  </div>
  ${S.notation ? '<div class="panel notation" id="notationProg"></div>' : ''}
  ${curPart ? sectionLinksHTML(curPart, chs) : ''}
  <div class="tchart">${tensionChart(chs)}</div>
  ${(() => {
    const c = detectCenter(chs);
    if (!c) return '';
    const why = c.pc === K.pc ? `Its chords fit <b>${c.name}</b> better than ${K.name}: ${c.inside} of ${c.total} chords are in ${c.name}, ${c.curInside} in ${K.name}.`
      : c.same ? `This progression sounds centered on <b>${c.chord.symbol}</b>, not ${K.notes[0].name}: it starts or ends there and its strongest moves resolve there. <b>${K.name}</b> has the same notes as <b>${c.name}</b>, so analyzing from ${c.chord.rootName} makes the Roman numerals and cadences match what you hear.`
      : `This progression sounds centered on <b>${c.chord.symbol}</b>, not ${K.notes[0].name}: it starts or ends there and its strongest moves resolve there. Its chords fit <b>${c.name}</b> best (${c.inside} of ${c.total} chords are in it; ${c.curInside} are in ${K.name}), so analyzing in ${c.name} makes the Roman numerals and cadences match what you hear.`;
    return `<div class="banner soft"><span>${why} Your chords stay exactly the same.</span><button class="btn primary sm" data-act="recenter" data-pc="${c.pc}" data-scale="${c.scale}">Analyze in ${c.name}</button></div>`;
  })()}
  ${GENRE() ? `<p class="hint genre-note"><b>Genre guide: ${GENRE().name}.</b> ${GENRE().blurb} Typical choices are listed first; everything else is still there.</p>${genreScaleHint()}` : ''}
  <p class="summary">${summary(chs)}</p>
  <div class="progcols">
    <div class="panel detail">${detail}</div>
    <div class="panel detail"><div class="sec-h"><h3>What could come next</h3><span class="hint">after ${A ? A.symbol : 'the start'}${Nx ? `, before ${Nx.symbol}` : ''}</span></div>${A && ui.slotCtx ? `<p class="slotnote"><b>Where it goes:</b> ${ui.slotCtx.note}</p>` : ''}<p class="hint">Ranked by how well each chord follows ${A ? A.symbol : 'the start'}, where it falls in the bar and phrase, how it leads into ${Nx ? Nx.symbol : 'the first chord if the progression repeats'}, whether the progression has been home yet, and repetition. The list always opens with chords that resolve and chords that set up what comes next. ▶ plays the move; ${mid ? `Insert puts it right after ${A.symbol}` : '+ Add puts it at the end'}.</p><div class="recs">${recs}</div></div>
  </div>
  <div class="panel palette"><h3>Add any chord</h3><p class="hint">Click a name to hear it, <b>+</b> to add it at the end of the progression. Anything from the chord library can be added too.</p>${pal}</div>`;
  fitVoicingRow();
  paintNotation('prog');
  renderReadout();   // the instrument panel's Replace button names the selected chord
  anRefresh();
}
// Collapsed, the voicing grid shows only its first row; the toggle says how many more there are.
// Cards past the first row are hidden (not clipped), so the row keeps its natural height even when
// web fonts arrive late; it is recalculated when the fonts load or the panel changes width.
function fitVoicingRow(){
  const g = $('#vgrid'), btn = $('#vToggle');
  if (!g || !btn) return;
  const kids = [...g.children];
  kids.forEach(k => { k.hidden = false; });
  if (!kids.length) return;
  const top0 = kids[0].offsetTop, extra = kids.filter(k => k.offsetTop > top0 + 2);
  btn.hidden = extra.length === 0;
  if (S.vOpen){ btn.textContent = 'Show fewer voicings ▴'; return; }
  extra.forEach(k => { k.hidden = true; });
  btn.textContent = `Show ${extra.length} more voicing${extra.length > 1 ? 's' : ''} ▾`;
  if (window.ResizeObserver && g.dataset.watched !== '1'){
    g.dataset.watched = '1';
    let w = g.clientWidth;
    new ResizeObserver(() => { if (g.isConnected && g.clientWidth !== w){ w = g.clientWidth; fitVoicingRow(); } }).observe(g);
  }
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (S.tab === 'prog') fitVoicingRow(); });
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { if (S.tab === 'prog') fitVoicingRow(); });
window.addEventListener('resize', () => { if (S.tab === 'prog') fitVoicingRow(); });

/* ================= Progression playback ================= */
const PB = { on: false, timers: [], mode: 'prog' };
// mode: 'prog' (the timeline being edited), 'song' (the song's arrangement) or { part: id } (one song section)
// from: index of the chord to start on (the beat count up to it keeps the bar accents right)
function pbStart(mode = 'prog', from = 0){
  let seq;
  // song entries carry their section, whose key, time signature and tempo they play in
  if (mode === 'song') seq = songSeq();
  // a Learn-tab song example: entries built by examples.js, each with its section (key, name)
  else if (mode && mode.ex) seq = mode.ex;
  else if (mode && mode.part){ const p = W.song.parts.find(x => x.id === mode.part); const o = W.song.order.indexOf(mode.part); seq = p ? p.items.map((it, i) => ({ it, i, o: o < 0 ? 'p' + p.id : o, part: p.id, sec: p, ch: inSection(p, () => fromItem(it)) })) : []; }
  else seq = prog.map((it, i) => ({ it, i }));
  if (!seq.length){ toast(mode === 'song' ? 'Add sections with chords to the arrangement first.' : 'Add a chord first.'); return; }
  const ctx = ac();
  from = clamp(from || 0, 0, seq.length - 1);
  Object.assign(PB, { on: true, mode: mode === 'prog' ? 'prog' : mode && mode.ex ? 'ex' : 'song', exId: mode && mode.ex ? mode.id : null, exWhat: mode && mode.ex ? mode.what : null, seq, n: from, beat: seq.slice(0, from).reduce((a, e) => a + e.it.b, 0), startedAt: performance.now(), t: ctx.currentTime + 0.12, prevUp: null, prevPos: null, bassV: null, timers: [] });
  PB.out = ctx.createGain(); PB.kind = kind(); PB.out.connect(busFor(soundFor(PB.kind)));
  bandStart(ctx);
  tick(); renderTab();
}
function pbStop(){
  PB.on = false;
  clearTimeout(PB.timer); PB.timers.forEach(clearTimeout); PB.timers = [];
  if (PB.out && AU.ctx){ const g = PB.out; g.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.04); setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 400); }
  VO.forEach((v, s) => { if (v && AU.ctx) cutVoice(v, AU.ctx.currentTime); VO[s] = null; });
  PB.out = null; ui.playing = -1; ui.nextIt = null; ui.nextCh = null;
  bandStop();
  document.querySelectorAll('.sc-chip.now,.arr.now,.sh-part.now,.an-c.now').forEach(x => x.classList.remove('now'));
  renderTab();
  miniShow();
}
function tick(){
  if (!PB.on) return;
  const ctx = AU.ctx;
  while (PB.on && PB.t < ctx.currentTime + 0.35){
    if (PB.n >= PB.seq.length){ if (S.loop) { PB.n = 0; PB.beat = 0; bandOnLoop(); } else break; }
    const e = PB.seq[PB.n];
    // a section's own tempo follows the speed trainer in proportion; each section starts on a downbeat
    const sc = S.bpm / (PB.startBpm || S.bpm), bpm = e.sec && e.sec.bpm ? e.sec.bpm * sc : S.bpm, dur = e.it.b * 60 / bpm;
    if (e.sec && e.i === 0) PB.beat = 0;
    // a progression always plays in its own key, even while the header shows the explore key
    inSection(e.sec || (PB.mode === 'prog' ? { key: docKey() } : null), () => sched(e, PB.t, dur), sc);
    PB.t += dur; PB.beat += e.it.b; PB.n++;
  }
  if (!S.loop && PB.n >= PB.seq.length && ctx.currentTime > PB.t + 0.1){ pbStop(); return; }
  PB.timer = setTimeout(tick, 40);
}
// Strums, piano hits and clicks follow the meter: strongest on the downbeat, strong on each beat group (e.g. 2+2+3 in 7/8)
function sched(e, t, dur){
  const it = e.it, i = e.i, ch = e.ch || fromItem(it), k = PB.kind, spb = 60 / S.bpm, beats = it.b, dest = PB.out;
  const acc = barAccents(), n = S.ts.num, compound = S.ts.den >= 8, start = PB.beat;
  const A = b => acc[(start + b) % n];
  let frets = null, pmidis = null;
  if (k === 'piano'){
    const cv = it.pv ? itemPiano(it, ch) : null;
    let up, bass;
    if (cv && cv.custom){
      const ms = cv.list[cv.idx].midis.slice().sort((a, b) => a - b);
      bass = ms[0]; up = ms.length > 1 ? ms.slice(1) : ms;
    } else { up = S.smooth ? leadUpper(ch, PB.prevUp) : rootUpper(ch); bass = pianoBass(ch); }
    PB.prevUp = up;
    pmidis = [bass, ...up];
    if (S.style === 'sustain'){ playNote('piano', bass, t, { vel: 0.8, dur, dest }); up.forEach(m => playNote('piano', m, t, { vel: 0.7, dur, dest })); }
    else if (curPattern()) playPatternPiano(curPattern(), pmidis, t, beats, S.strumRestart ? 0 : start, ch, dest);
    else if (S.style === 'rhythm'){
      for (let b = 0; b < beats; b++){
        const a = A(b);
        if (a > 0 || b === 0){ let len = 1; while (b + len < beats && A(b + len) === 0) len++; playNote('piano', bass, t + b * spb, { vel: a === 2 ? 0.85 : 0.7, dur: len * spb, dest }); }
        up.forEach(m => playNote('piano', m, t + b * spb, { vel: [0.48, 0.62, 0.75][a], dur: spb * 0.85, dest }));
      }
    } else {
      playNote('piano', bass, t, { vel: 0.8, dur, dest });
      const arp = [...up, ...up.slice(1, -1).reverse()], per = compound ? 1 : 2;
      for (let x = 0; x < beats * per; x++) playNote('piano', arp[x % arp.length], t + x * spb / per, { vel: 0.6, dur: spb * 1.5, dest });
    }
  } else if (k === 'bass'){
    const tun = eff(), pc = ch.bassPc ?? ch.rootPc, f = mod(pc - tun[0]), r = tun[0] + f;
    frets = tun.map((_, s) => s === 0 ? f : null);
    const third = ch.tones.find(x => x.num === 3) || ch.tones[1];
    const fifth = ch.tones.find(x => x.num === 5), r5 = fifth ? r + mod(fifth.semis) : r + 7;
    const steps = S.style === 'sustain' ? 1 : beats;
    for (let b = 0; b < steps; b++){
      const a = A(b), tt = t + b * spb;
      let note;
      if (S.style === 'sustain') note = r;
      else if (S.style === 'rhythm') note = a === 2 || b === 0 ? r : a === 1 ? r5 : (b % 2 ? r + 12 : r);
      else note = [r, r + mod(third.semis), r5, r + 12][b % 4];
      cutVoice(PB.bassV, tt);
      PB.bassV = playNote('bass', note, tt, { vel: a === 2 || b === 0 ? 0.92 : a === 1 ? 0.8 : 0.68, dest, dur: S.style === 'sustain' ? dur : spb * 0.95 });
    }
  } else {
    const v = voicingsFor(ch);
    let pick = null;
    const cs = getVo(it) ? itemShape(it, ch) : null;
    if (cs){ pick = cs.list[cs.idx]; PB.prevPos = pick.pos; frets = pick.frets; }
    else if (v.list.length){
      pick = v.list[v.best];
      if (S.smooth && PB.prevPos != null) pick = v.list.reduce((b, x) => (Math.abs(x.pos - PB.prevPos) + x.score * 0.4) < (Math.abs(b.pos - PB.prevPos) + b.score * 0.4) ? x : b);
      PB.prevPos = pick.pos; frets = pick.frets;
    }
    if (frets && k === 'bowed' && soundFor(k).gen === 'bowed'){
      // bowed strings sustain: the chord is re-bowed on each accent group (or held, or played one note per beat)
      const tun = eff(), ms = frets.map((f, s) => f === null ? null : tun[s] + f).filter(m => m !== null);
      VO.forEach((v, s) => { cutVoice(v, t); VO[s] = null; });
      if (S.style === 'arp') for (let b = 0; b < beats; b++) playNote(k, ms[b % ms.length], t + b * spb, { vel: A(b) ? 0.8 : 0.65, dur: spb * 1.05, dest });
      else {
        const starts = S.style === 'sustain' ? [0] : [...Array(beats).keys()].filter(b => b === 0 || A(b) > 0);
        starts.forEach((b, j) => { const len = (j + 1 < starts.length ? starts[j + 1] : beats) - b; ms.forEach((m, x) => playNote(k, m, t + b * spb + x * 0.012, { vel: b === 0 ? 0.8 : 0.68, dur: len * spb * 0.97, dest })); });
      }
    } else if (frets){
      if (S.style === 'sustain') strumFrets(frets, t, 'down', 0.85, dest);
      else if (curPattern()) playPatternFrets(curPattern(), frets, t, beats, S.strumRestart ? 0 : start, ch, dest);
      else if (S.style === 'rhythm'){
        for (let b = 0; b < beats; b++){
          const a = A(b);
          if (compound){
            // eighth-note meters: down-strum on group starts, lighter alternating strums in between
            if (a > 0 || b === 0) strumFrets(frets, t + b * spb, 'down', a === 2 ? 0.9 : 0.75, dest);
            else strumFrets(frets, t + b * spb, b % 2 ? 'up' : 'down', 0.45, dest, 4);
          } else {
            strumFrets(frets, t + b * spb, 'down', [0.62, 0.75, 0.9][a], dest);
            if (b % 2 === 1 || (a === 0 && n % 2 === 1)) strumFrets(frets, t + (b + 0.5) * spb, 'up', 0.48, dest, 4);
          }
        }
      } else {
        const strs = frets.map((f, s) => f === null ? -1 : s).filter(s => s >= 0), per = compound ? 1 : 2;
        for (let x = 0; x < beats * per; x++){
          const s = x % 2 === 0 ? strs[(x / 2) % 2 === 0 ? 0 : Math.min(1, strs.length - 1)] : strs[strs.length - 1 - ((x >> 1) % Math.min(3, strs.length))];
          pluckString(s, frets[s], t + x * spb / per, x % 2 === 0 ? 0.8 : 0.6, dest);
        }
      }
    } else rollMidis(rootUpper(ch), t, 0.02, dur, dest);
  }
  if (S.click) for (let b = 0; b < beats; b++) clickAt(t + b * spb, A(b));
  bandSched(e, t, ch);
  PB.timers.push(setTimeout(() => {
    if (!PB.on) return;
    ui.focus = ch;
    const ni = PB.seq.indexOf(e) + 1, nextE = ni < PB.seq.length ? PB.seq[ni] : (S.loop ? PB.seq[0] : null);
    ui.nextIt = nextE ? nextE.it : null; ui.nextCh = nextE ? nextE.ch || fromItem(nextE.it) : null;
    if (frets) S.shape[S.inst] = frets.slice();
    if (pmidis && kind() === 'piano') S.piano = pmidis.slice();
    miniUpdate(e, ch, start);
    renderInstrument();
    if (PB.mode === 'prog'){ ui.playing = i; ui.selSlot = i; ui.selEnd = i; if (S.tab === 'prog') renderProg(); }
    else if (PB.mode === 'ex'){
      document.querySelectorAll('.an-c.now').forEach(x => x.classList.remove('now'));
      document.querySelectorAll(`.an-c[data-xo="${e.o}"][data-i="${i}"]`).forEach(x => x.classList.add('now'));
    }
    else {
      document.querySelectorAll('.sc-chip.now,.arr.now,.sh-part.now').forEach(x => x.classList.remove('now'));
      document.querySelectorAll(`.sc-chip[data-o="${e.o}"][data-ci="${i}"], .sc-chip[data-o="p${e.part || W.song.order[e.o]}"][data-ci="${i}"]`).forEach(x => x.classList.add('now'));
      document.querySelectorAll(`.arr[data-o="${e.o}"], .sh-part[data-o="${e.o}"]`).forEach(x => x.classList.add('now'));
    }
  }, Math.max(0, (t - AU.ctx.currentTime) * 1000)));
}

/* ================= Frozen header =================
   The header is pinned; a spacer keeps its full height in the page so the top looks unchanged.
   Once the page scrolls, the header slims down ('stuck'), and --hdr-now tracks its current height
   for scroll offsets. */
(function frozenHeader(){
  const bar = document.getElementById('topbar'), root = document.documentElement;
  // The spacer's height (--hdr-full) is only taken from the header at rest: measured mid-animation it would
  // shrink and grow back, and the browser would shift the page (re-slimming the header just as it opened).
  let animating = 0;
  const measure = () => {
    if (!bar.classList.contains('stuck') && !animating) root.style.setProperty('--hdr-full', bar.querySelector('.top').getBoundingClientRect().height + 'px');
    root.style.setProperty('--hdr-now', bar.offsetHeight + 'px');
  };
  const onScroll = () => {
    const stuck = window.scrollY > 24;
    if (stuck !== bar.classList.contains('stuck')){
      bar.classList.toggle('stuck', stuck);
      clearTimeout(animating);
      animating = setTimeout(() => { animating = 0; measure(); }, 260);
    }
  };
  if (window.ResizeObserver) new ResizeObserver(measure).observe(bar);
  window.addEventListener('resize', () => { if (bar.classList.contains('stuck')){ bar.classList.remove('stuck'); measure(); } onScroll(); measure(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  measure(); onScroll();
})();

/* ================= Rendering glue ================= */
function renderTab(){
  // a switch between the progression, a song section and the song brings that document's key into the header
  if (W && ui.keyCtx !== undefined && keyCtx() !== ui.keyCtx){ renderAll(); return; }
  ['scales','chords','prog','song','learn'].forEach(t => {
    $('#p-' + t).hidden = S.tab !== t;
    if (S.tab !== t) $('#p-' + t).innerHTML = '';
    $('#t-' + t).setAttribute('aria-selected', String(S.tab === t));
  });
  if (S.tab === 'scales') renderScales();
  else if (S.tab === 'chords') renderLib();
  else if (S.tab === 'song') renderSong();
  else if (S.tab === 'learn') renderLearn();
  else renderProg();
}
function refreshTabLight(){ if (S.tab !== 'prog') renderTab(); }
function renderAll(){ computeKey(); syncKeys(); renderHeader(); renderInstrument(); renderTab(); }
// chords are always added at the end of the progression (pasting is the one thing that goes after the selection)
function addToProg(ch, after = prog.length - 1){
  const at = prog.length ? Math.min(prog.length, after + 1) : 0;
  // chords are stored relative to the document's key (on Scales or the Chord library the header shows the explore key)
  prog.splice(at, 0, inSection({ key: docKey() }, () => toItem(ch, S.defBeats)));
  ui.selSlot = at;
  save();
  if (S.tab === 'prog') renderProg();
  toast(`Added ${ch.symbol} to the progression.`, S.tab === 'prog' ? null : { label: 'View', fn: () => { S.tab = 'prog'; renderTab(); } });
}

// Load a classic progression into the builder (optionally in its own scale); Undo puts back the chords, the key
// and, for a saved progression that became a new one, the saved one
function loadPreset(p, useScale){
  const old = prog.slice(), oldKey = keyNow(), wasDoc = W.edit ? null : { id: W.prog.id, created: W.prog.created, updated: W.prog.updated, saved: W.prog.saved, autoName: W.prog.autoName, name: W.prog.name };
  if (PB.on) pbStop();
  keyWhy('preset');
  if (useScale) S.scale = p[1];
  computeKey();
  setProg(p[2].map(([s, l, q, b]) => ({ s, l, q, b: Math.max(1, Math.round((b || 4) * S.ts.num / 4)) })));
  ui.selSlot = 0;
  renderAll();
  toast(`Loaded ${p[0]} in ${K.name}.`, { label: 'Undo', fn: () => {
    setProg(old);
    if (!sameKey(oldKey, keyNow())){ S.keyPc = oldKey.pc; S.scale = oldKey.scale; renderAll(); }
    if (wasDoc) Object.assign(W.prog, wasDoc);
    save(); renderAll();
  } });
}

/* ================= Events ================= */
const ACT = {
  tab: el => {
    // if the tabs are stuck at the top, show the new tab from its beginning, right under them
    const stuck = tabsNatural() < tabsStuckTop() - 1;
    // the Song tab shows the song, so a section being edited is closed (as with "Back to the song")
    if (el.dataset.tab === 'song' && W.edit){ if (PB.on) pbStop(); leavePart(); prog = W.prog.items; }
    keyWhy('tab');
    S.tab = el.dataset.tab; save(); renderAll();
    if (stuck) showTabTop();
  },
  tune: el => {
    const s = +el.dataset.s, t = tuning();
    t[s] = clamp(t[s] + +el.dataset.d, 12, 100);
    renderInstrument(); refreshTabLight();
    const f = shape()[s]; pluckString(s, f === null ? 0 : f);
  },
  mute: el => { const s = +el.dataset.s, sh = shape(); sh[s] = sh[s] === null ? 0 : null; renderInstrument(); },
  strum: el => {
    const d = el.dataset.d;
    if (fretted()) strumFrets(shape(), null, d);
    else rollMidis(activeMidis(), null, d === 'pick' ? 0.16 : 0.012);
  },
  fretNums: () => { S.fretNums = S.fretNums === 'capo' ? 'actual' : 'capo'; save(); renderAll(); },
  clearShape: () => { if (fretted()) S.shape[S.inst] = shape().map(() => 0); else S.piano = []; renderInstrument(); },
  muteAll: () => { S.shape[S.inst] = shape().map(() => null); renderInstrument(); },
  // the chord goes into the progression exactly as it is fingered on the neck (or held on the keyboard)
  addIdent: () => {
    const ch = ui.ident[0];
    if (!ch){ if (new Set(activeMidis().map(m => mod(m))).size >= 2) customChordDialog(); else toast('Play at least two different notes first.'); return; }
    addToProg(ch);
    lockFromInstrument(prog[ui.selSlot]);
    save();
    if (S.tab === 'prog') renderProg();
  },
  // overwrite the selected chord with the one on the instrument (same length, this exact voicing)
  replaceSel: () => {
    const ch = ui.ident[0], i = ui.selSlot, old = prog[i] && clone(prog[i]);
    if (!ch || !old) return;
    const was = fromItem(old).symbol;
    prog[i] = inSection({ key: docKey() }, () => toItem(ch, old.b));
    lockFromInstrument(prog[i]);
    save(); renderProg();
    toast(`Replaced ${was} with ${ch.symbol} (chord ${i + 1}).`, { label: 'Undo', fn: () => { prog[i] = old; save(); renderProg(); } });
  },
  snote: el => {
    const i = +el.dataset.i, base = 48 + K.pc + (K.pc > 7 ? -12 : 0) + 12;
    const semis = i >= K.notes.length ? 12 : K.notes[i].semis;
    playNoteNow(base + semis);
  },
  playScale: el => {
    ac();
    const base = 48 + K.pc + (K.pc > 7 ? -12 : 0) + 12;
    let seq = [...K.notes.map(n => n.semis), 12];
    if (el.dataset.d === 'down') seq.reverse();
    const t0 = AU.ctx.currentTime + 0.05, k = kind() === 'piano' ? 'piano' : kind(), off = k === 'bass' ? -24 : 0;
    seq.forEach((s, i) => playNote(k, base + s + off, t0 + i * 0.28, { vel: 0.8, dur: 0.5 }));
    seq.forEach((s, i) => setTimeout(() => {
      const btns = document.querySelectorAll('#p-scales .sn');
      btns.forEach(b => b.classList.remove('lit'));
      const idx = s === 12 ? K.notes.length : K.notes.findIndex(n => n.semis === s);
      if (btns[idx]) btns[idx].classList.add('lit');
      if (i === seq.length - 1) setTimeout(() => btns.forEach(b => b.classList.remove('lit')), 400);
    }, (0.05 + i * 0.28) * 1000));
  },
  scCard: el => { playChord(ui.scCards[+el.dataset.i]); renderScales(); },
  presetGo: el => { const p = ui.presetPending; closeModal(); if (p) loadPreset(p, el.dataset.arg === 'scale'); },
  scAdd: el => addToProg(ui.scCards[+el.dataset.i], prog.length - 1),
  fit: el => { playChord(ui.fits[+el.dataset.i]); renderScales(); },
  cmpRoot: el => { keyWhy('compare'); S.keyPc = +el.dataset.pc; ui.focus = null; renderAll(); },
  cmpScale: el => { keyWhy('compare'); S.scale = el.dataset.id; ui.focus = null; renderAll(); },
  libRoot: el => { S.lib.root = +el.dataset.pc; S.lib.bass = null; const ch = libChord(); playChord(ch); renderLib(); },
  libQ: el => { S.lib.q = el.dataset.q; const ch = libChord(); playChord(ch); renderLib(); },
  libPlay: () => { playChord(libChord()); renderLib(); },
  libAdd: () => addToProg(libChord(), prog.length - 1),
  libV: el => {
    const v = ui.libV[+el.dataset.i], ch = libChord(); ui.focus = ch;
    if (fretted()){ S.shape[S.inst] = v.frets.slice(); strumFrets(v.frets); }
    else { S.piano = v.midis.slice(); rollMidis(v.midis); }
    renderInstrument(); renderLib();
  },
  // click: play from the selected chord; a second click right after (a double-click) restarts from the beginning
  play: () => {
    // the second click of a double-click restarts from the beginning, whether the first one started or stopped it
    const now = performance.now(), dbl = now - (ui.playClick || 0) < 450 && !ui.playDbl;
    ui.playClick = now; ui.playDbl = dbl;
    if (dbl){ if (PB.on) pbStop(); pbStart('prog', 0); return; }
    if (PB.on) pbStop(); else pbStart('prog', ui.selSlot);
  },
  slot: (el, e) => {
    const i = +el.dataset.i;
    if (e && e.shiftKey && prog.length){ ui.selEnd = i; renderProg(); return; }
    ui.selSlot = i; ui.selEnd = i;
    // while playing, clicking a chord restarts playback from it
    if (PB.on && PB.mode === 'prog'){ pbStop(); pbStart('prog', i); return; }
    playItem(i);
    renderProg();
  },
  recenter: el => {
    const old = { pc: S.keyPc, scale: S.scale };
    keyWhy('recenter');
    rekeyKeepingChords(+el.dataset.pc, el.dataset.scale);
    toast(`Now analyzing in ${K.name}. Same chords, same notes.`, { label: 'Undo', fn: () => rekeyKeepingChords(old.pc, old.scale) });
  },
  vToggle: () => { S.vOpen = !S.vOpen; save(); renderProg(); },
  slotV: el => {
    const j = +el.dataset.i, it = prog[ui.selSlot];
    if (!it) return;
    if (j < 0){ if (fretted()) clearVo(it); else delete it.pv; }
    else if (fretted()) setVo(it, ui.slotV[j].frets);
    else it.pv = ui.slotV[j].name;
    save();
    if (!PB.on) playItem(ui.selSlot);
    renderProg();
  },
  transpose: el => {
    const d = +el.dataset.d, savedId = !W.edit && W.prog.id;
    keyWhy('transpose');
    S.keyPc = mod(S.keyPc + d);
    // keep custom shapes in the same area of the neck: slide them by the same amount
    slideShapes(prog, d);
    ui.focus = null;
    renderAll();
    if (!PB.on && prog[ui.selSlot]) playItem(ui.selSlot);
    // a saved progression that became a new one already says so (with Undo)
    if (!(savedId && !W.prog.id)) toast(`Transposed to ${K.name}.`, { label: 'Undo', fn: () => ACT.transpose({ dataset: { d: -d } }) });
  },
  mv: el => {
    const i = +el.dataset.i, j = i + +el.dataset.d;
    if (j < 0 || j >= prog.length) return;
    [prog[i], prog[j]] = [prog[j], prog[i]]; ui.selSlot = j; save(); renderProg();
  },
  brk: el => { const it = prog[+el.dataset.i]; if (!it) return; if (it.br) delete it.br; else it.br = true; save(); renderProg(); },
  rm: el => {
    const i = +el.dataset.i, it = prog.splice(i, 1)[0];
    if (ui.selSlot >= prog.length) ui.selSlot = prog.length - 1;
    save(); renderProg();
    toast('Chord removed.', { label: 'Undo', fn: () => { prog.splice(i, 0, it); ui.selSlot = i; save(); renderProg(); } });
  },
  // previews play the progression's chords in their own voicings and the suggestion in the shape it would get
  recHear: el => { const r = ui.recs[+el.dataset.i]; previewSeq([voicedAt(ui.selSlot), r.voice || r.ch]); },
  recAdd: el => { const r = ui.recs[+el.dataset.i]; addToProg(r.ch, ui.recAt ?? prog.length - 1); lockVoice(prog[ui.selSlot], r.voice); save(); if (S.tab === 'prog') renderProg(); },
  recSolo: el => { const r = ui.recs[+el.dataset.i]; previewSeq([r.voice || r.ch]); },
  subSolo: el => { const s = ui.subs[+el.dataset.i]; previewSeq(s.chs.map((c, j) => s.voices[j] || c)); },
  subHear: el => {
    const s = ui.subs[+el.dataset.i], i = ui.selSlot, mid = s.chs.map((c, j) => s.voices[j] || c);
    const before = ui.subPrev >= 0 ? voicedAt(ui.subPrev) : null;
    const after = s.kind === 'swap' ? (ui.subNext ? ui.subNext.voice() : null) : voicedAt(i);
    previewSeq([before, ...mid, after]);
  },
  subDo: el => {
    const s = ui.subs[+el.dataset.i], i = ui.selSlot, old = prog.slice();
    if (s.kind === 'swap'){ prog[i] = toItem(s.chs[0], prog[i].b); lockVoice(prog[i], s.voices[0]); }
    else { const b = Math.max(1, Math.round(prog[i].b / s.chs.length)); prog.splice(i, 0, ...s.chs.map((c, j) => { const it = toItem(c, s.chs.length > 1 ? b : prog[i].b); lockVoice(it, s.voices[j]); return it; })); }
    save(); renderProg();
    toast(s.kind === 'swap' ? `Swapped in ${s.chs[0].symbol}.` : `Inserted ${s.chs.map(c => c.symbol).join(' ')}.`, { label: 'Undo', fn: () => { setProg(old); renderProg(); } });
  },
  palHear: el => { playChord(ui.pal[+el.dataset.i]); },
  palAdd: el => addToProg(ui.pal[+el.dataset.i]),
  clear: () => {
    const old = prog.slice(); if (PB.on) pbStop();
    setProg([]); ui.selSlot = 0; ui.selEnd = 0; renderProg();
    toast('Progression cleared.', { label: 'Undo', fn: () => { setProg(old); renderProg(); } });
  },
  toastAct: () => { const f = ui.toastAct; $('#toast').hidden = true; keyWhy('undo'); if (f) f(); },
};
document.addEventListener('click', e => {
  // segmented buttons without their own action (data-act) set the setting named by their group's id
  const segB = e.target.closest('.seg button:not([data-act])');
  if (segB){
    const id = segB.parentElement.id, v = segB.dataset.v;
    if (id === 'clickMode') S.clickMode = v;
    else if (id === 'labels') S.labels = v;
    else if (id === 'overlay') S.overlay = v;
    else if (id === 'extSeg'){ S.ext7 = v === '1'; renderScales(); }
    else if (id === 'cmpSeg'){ S.cmp = v; renderScales(); }
    else if (id === 'progView'){ S.progCharts = v === '1'; save(); renderProg(); return; }
    renderInstrument();
    return;
  }
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'SELECT' || el.dataset.act === 'fret' || el.dataset.act === 'pkey') return;
  const f = ACT[el.dataset.act];
  if (f){ e.preventDefault(); f(el, e); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'keyRoot'){ keyWhy('header'); S.keyPc = +t.value; if (PB.on && keyCtx() !== 'explore') pbStop(); ui.focus = null; renderAll(); }
  else if (t.id === 'keyScale'){ keyWhy('header'); S.scale = t.value; ui.focus = null; renderAll(); }
  else if (t.id === 'inst'){ if (PB.on) pbStop(); S.inst = t.value; ui.focus = null; renderAll(); }
  else if (t.id === 'tunPreset' && t.value === '__save'){ renderTools(); ACT.tunSave(); }
  else if (t.id === 'tunPreset' && t.value === '__manage'){ renderTools(); ACT.tunManage(); }
  else if (t.id === 'soundSel'){
    if (PB.on) pbStop();
    S.snd[S.inst] = t.value; save(); renderInstrument();
    if (fretted()) strumFrets(shape()); else rollMidis(activeMidis());
  }
  else if (t.id === 'sustainSel'){
    S.ring = t.value; RING = SUSTAIN[S.ring].ring; save();
    if (fretted()) strumFrets(shape()); else rollMidis(activeMidis());
  }
  else if (t.id === 'fretsSel'){
    S.frets = +t.value; FRETS = S.frets;
    S.shape[S.inst] = shape().map(f => f === null ? null : Math.min(f, maxRel()));
    save(); renderInstrument(); refreshTabLight();
  }
  else if (t.id === 'tunPreset' && t.value.startsWith('u:')){ const u = LIB.tunings.find(x => x.id === t.value.slice(2)); if (u) applyTuning(u); }
  else if (t.id === 'tunPreset'){ const i = +t.value; if (i >= 0){ S.tun[S.inst] = INST[S.inst].presets[i][1].slice(); renderInstrument(); refreshTabLight(); strumFrets(shape()); } }
  else if (t.id === 'capo'){ S.capo[S.inst] = +t.value; const mr = maxRel(); S.shape[S.inst] = shape().map(f => f === null ? null : Math.min(f, mr)); renderInstrument(); refreshTabLight(); strumFrets(shape()); }
  else if (t.id === 'showPiano'){ S.showPiano = t.checked; renderInstrument(); }
  else if (t.id === 'libInv'){ S.lib.inv = t.checked; renderLib(); save(); }
  else if (t.id === 'libBass'){ S.lib.bass = t.value === '' ? null : +t.value; playChord(libChord()); renderLib(); }
  else if (t.dataset.act === 'beats'){ prog[+t.dataset.i].b = +t.value; save(); renderProg(); }
  else if (t.id === 'defBeats'){ S.defBeats = +t.value; save(); }
  else if (t.id === 'style'){ S.style = t.value; save(); renderTab(); }
  else if (t.id === 'loop'){ S.loop = t.checked; save(); renderTab(); }
  else if (t.id === 'clk'){ S.click = t.checked; save(); }
  else if (t.id === 'smooth'){ S.smooth = t.checked; save(); if (S.progCharts) renderProg(); }
  else if (t.id === 'bpmN' || t.id === 'bpmR'){ S.bpm = clamp(+t.value || 90, 30, 300); save(); renderTab(); }
  else if (t.id === 'preset' && t.value !== ''){
    const p = t.value[0] === 'g' ? GENRE().presets[+t.value.slice(1)] : PRESETS[+t.value];
    // a song section keeps its scale unless you say otherwise
    if (W.edit && p[1] !== S.scale){
      ui.presetPending = p;
      const part = partById(W.edit);
      openModal(`Load “${esc(p[0])}”`, `<p>This classic is written in ${esc(SC[p[1]].name)}; the section “${esc(part ? part.name : '')}” is in ${esc(K.name)}.</p><p class="hint"><b>Keep ${esc(K.name)}</b>: the same chords, analyzed in the section's key. <b>Change the scale</b>: the section's key becomes ${esc(makeKey(K.pc, p[1]).name)}.</p>`,
        [{ label: 'Cancel', act: 'modalClose' }, { label: `Keep ${esc(K.name)}`, act: 'presetGo', arg: 'keep' }, { label: `Change to ${esc(makeKey(K.pc, p[1]).name)}`, act: 'presetGo', arg: 'scale', primary: true }]);
      t.value = '';
      return;
    }
    loadPreset(p, true);
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'bpmR'){ S.bpm = +e.target.value; const n = $('#bpmN'); if (n) n.value = S.bpm; }
});
document.addEventListener('keydown', e => {
  if (e.target.closest('input,select,textarea') || !$('#modal').hidden) return;
  if ((e.metaKey || e.ctrlKey) && !e.altKey && S.tab === 'prog'){
    // text selected on the page: let the browser copy it as usual instead of copying chords
    if (String(window.getSelection ? window.getSelection() : '').trim()) return;
    const k = e.key.toLowerCase(), map = { c: 'clipCopy', x: 'clipCut', v: 'clipPaste', d: 'selDup' };
    if (map[k] && (k !== 'v' || LIB.clip)){ e.preventDefault(); ACT[map[k]](); }
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.tab === 'prog' && prog.length){ e.preventDefault(); ACT.selDel(); return; }
  if (e.code === 'Space'){ e.preventDefault(); PB.on ? pbStop() : S.tab === 'learn' && S.learnLesson === 'songs' ? ACT.exToggle() : S.tab === 'song' ? pbStart('song', songIndexAt(ui.songFrom || 0)) : pbStart('prog', ui.selSlot); }
  else if (e.key === 's' || e.key === 'S'){ fretted() ? strumFrets(shape()) : rollMidis(activeMidis()); }
  else if (/^[1-7]$/.test(e.key) && K.hept){ playChord(diatonic(+e.key - 1, S.ext7)); refreshTabLight(); }
});
let dragI = -1;
document.addEventListener('dragstart', e => { const s = e.target.closest && e.target.closest('.slot'); if (!s) return; dragI = +s.dataset.i; s.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(dragI)); } catch (x) {} });
document.addEventListener('dragover', e => { if (dragI >= 0 && e.target.closest && e.target.closest('#timeline')) e.preventDefault(); });
document.addEventListener('drop', e => {
  const s = e.target.closest && e.target.closest('.slot');
  if (dragI < 0) return;
  e.preventDefault();
  const j = s ? +s.dataset.i : prog.length - 1;
  if (j !== dragI){ const it = prog.splice(dragI, 1)[0]; prog.splice(j, 0, it); ui.selSlot = j; ui.selEnd = j; save(); }
  dragI = -1; renderProg();
});
document.addEventListener('dragend', () => { dragI = -1; document.querySelectorAll('.slot.drag').forEach(s => s.classList.remove('drag')); });

/* ================= Chords the finder can't name =================
   "Add as…" (and "+ Add" when the notes have no standard name): the closest standard chords, each saying which of
   the played notes it leaves out or which of its notes are missing, and a name of your own. The chord is added
   with the exact notes played (a locked voicing), so it always sounds as played; the chosen standard chord is what
   analysis, suggestions and transposing use. */
function customChordDialog(){
  const midis = activeMidis(), sorted = [...midis].sort((a, b) => a - b);
  if (new Set(sorted.map(m => mod(m))).size < 2){ toast('Play at least two different notes first.'); return; }
  const m = closestChords(midis);
  if (!m.length){ toast('No chord is close to these notes.'); return; }
  ui.cc = { m, frets: fretted() && !midiActive() ? shape().slice() : null, midis: sorted, edited: false };
  // a note spelled as it relates to a chord's root (D♯ against A, not E♭)
  const STEP = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6], rel = (ch, pc) => spell(ch.rootL + STEP[mod(pc - ch.rootPc)], pc);
  const names = (ch, ps) => ps.map(p => rel(ch, p)).join(', ');
  const rows = m.map((x, i) => {
    const diff = x.extra.length || x.missing.length ? [x.extra.length ? `your ${names(x.ch, x.extra)} ${x.extra.length > 1 ? 'aren’t' : 'isn’t'} in it` : '', x.missing.length ? `it has ${names(x.ch, x.missing)}, which you aren’t playing` : ''].filter(Boolean).join('; ') : 'exactly your notes';
    return `<label class="cc-row"><input type="radio" name="ccPick" value="${i}"${i === 0 ? ' checked' : ''}><b>${x.ch.symbol}</b><span class="muted">${x.ch.q.name}${x.ch.bassName ? `, ${x.ch.bassName} in the bass` : ''}</span><span class="cc-diff${diff === 'exactly your notes' ? ' k-strong' : ''}">${diff}</span></label>`;
  }).join('');
  const sel = S.tab === 'prog' && prog[ui.selSlot] ? fromItem(prog[ui.selSlot]).symbol : null;
  openModal('Add these notes as a chord', `<p>Your notes: <b class="mono">${sorted.map(x => rel(m[0].ch, x) + (Math.floor(x / 12) - 1)).join(' ')}</b>${ui.ident[0] ? '' : ' (no standard chord name)'}.</p>
    <div class="fld"><span>Closest chords (used for analysis and suggestions)</span><div class="cc-list">${rows}</div></div>
    <label class="fld"><span>Name to show</span><input id="ccName" type="text" maxlength="24" value="${esc(m[0].ch.symbol)}"></label>
    <p class="hint">The chord is added with exactly the notes you are playing, so it always sounds like this. The name is only what is shown on the chord card, chart and print-out.</p>`,
    [{ label: 'Cancel', act: 'modalClose' }, ...(sel ? [{ label: `Replace ${esc(sel)}`, act: 'ccGo', arg: 'replace' }] : []), { label: 'Add to progression', act: 'ccGo', arg: 'add', primary: true }]);
}
document.addEventListener('change', e => {
  if (e.target.name === 'ccPick' && ui.cc && !ui.cc.edited){ const x = ui.cc.m[+e.target.value]; if (x) $('#ccName').value = x.ch.symbol; }
});
document.addEventListener('input', e => { if (e.target.id === 'ccName' && ui.cc) ui.cc.edited = true; });
// the played notes locked onto an item, and the custom name (none when it equals the standard one)
function ccApply(it, ch, name){
  if (ui.cc.frets && fretted()) setVo(it, ui.cc.frets);
  else it.pv = ui.cc.midis.slice();
  if (name && name !== ch.symbol) it.nm = name; else delete it.nm;
}
Object.assign(ACT, {
  addCustom: () => customChordDialog(),
  ccGo: el => {
    const cc = ui.cc; if (!cc) return;
    const pick = document.querySelector('input[name=ccPick]:checked'), x = cc.m[pick ? +pick.value : 0], name = ($('#ccName').value || '').trim();
    closeModal();
    if (el.dataset.arg === 'replace' && prog[ui.selSlot]){
      const i = ui.selSlot, old = clone(prog[i]), was = fromItem(old).symbol;
      prog[i] = inSection({ key: docKey() }, () => toItem(x.ch, old.b));
      ccApply(prog[i], x.ch, name);
      save(); renderProg();
      toast(`Replaced ${esc(was)} with ${esc(name || x.ch.symbol)}.`, { label: 'Undo', fn: () => { prog[i] = old; save(); renderProg(); } });
      return;
    }
    addToProg(x.ch);
    ccApply(prog[ui.selSlot], x.ch, name);
    save(); if (S.tab === 'prog') renderProg();
    toast(`Added ${esc(name || x.ch.symbol)}${name && name !== x.ch.symbol ? ` (analyzed as ${x.ch.symbol})` : ''} to the progression.`, S.tab === 'prog' ? null : { label: 'View', fn: () => { S.tab = 'prog'; renderAll(); } });
  },
  ccRename: () => {
    const it = prog[ui.selSlot]; if (!it) return;
    const ch = fromItem(it);
    ui.modal = { mode: 'ccRename' };
    openModal('Name this chord', `<label class="fld"><span>Name to show</span><input id="ccNewName" type="text" maxlength="24" value="${esc(ch.symbol)}"></label><p class="hint">Harmony Bench still treats it as <b>${ch.name0 || ch.symbol}</b> for analysis and suggestions. Leave the name empty to use the standard one.</p>`,
      [{ label: 'Cancel', act: 'modalClose' }, { label: 'Rename', act: 'ccRenameOk', primary: true }]);
  },
  ccRenameOk: () => {
    const it = prog[ui.selSlot]; if (!it) return;
    const name = ($('#ccNewName').value || '').trim(), std = fromItem({ ...it, nm: undefined }).symbol;
    if (name && name !== std) it.nm = name; else delete it.nm;
    closeModal(); save(); renderProg();
  },
  ccClear: () => { const it = prog[ui.selSlot]; if (!it) return; delete it.nm; save(); renderProg(); },
});
