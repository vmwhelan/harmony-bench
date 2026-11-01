'use strict';
/* ================= Print and notation =================
   A printable chord sheet (diagrams, chord chart, lyrics, optional sheet music) for the
   progression or the whole song, and a sheet-music view drawn with VexFlow (vendor/vexflow.js,
   MIT licence), which is loaded the first time it is needed. */

/* ---- Sequences ---- */
// The chords to show: the progression, or the song in arrangement order with section names
function sheetSeq(which){
  // song entries keep their section (part), whose key and time signature they are written in
  if (which === 'song') return songSeq().map(e => ({ it: e.it, sec: e.i === 0 ? e.sec.name : null, part: e.sec, ch: e.ch }));
  return prog.map(it => ({ it, sec: null, part: null, ch: fromItem(it) }));
}
const sheetName = which => which === 'song' ? W.song.name : W.edit ? W.song.parts.find(p => p.id === W.edit).name : W.prog.name;
function tuningText(){
  const t = tuning(), p = (INST[S.inst].presets || []).find(x => x[1].join() === t.join());
  return p ? p[0] : t.map(m => nameFor(m)).join(' ');
}
function sheetInfo(){
  const bits = [esc(K.name), tsLabel(), `${S.bpm} BPM`, esc(INST[S.inst].name)];
  if (fretted()) bits.push(esc(tuningText()));
  if (capo()) bits.push(`Capo ${capo()}`);
  return bits.join(' · ');
}
// The notes each chord is played with: the same voicing playback and MIDI export use; on bass, the root
function sheetVoicings(seq){
  let prevUp = null;
  return seq.map(e => {
    const ch = e.ch;
    if (kind() === 'bass') return [bassRootMidi(ch.bassPc ?? ch.rootPc)];
    const v = exportVoicing(e.it, ch, prevUp);
    if (v.up) prevUp = v.up;
    return [...new Set(v.midis)].sort((a, b) => a - b);
  });
}

/* ---- Sheet music (VexFlow) ---- */
const NOTATION = { loading: null, cache: new Map() };
function loadVexFlow(){
  if (window.Vex && window.Vex.Flow) return Promise.resolve(window.Vex.Flow);
  if (!NOTATION.loading) NOTATION.loading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'vendor/vexflow.js';
    s.onload = () => window.Vex && window.Vex.Flow ? res(window.Vex.Flow) : rej(new Error('The notation library did not start.'));
    s.onerror = () => { NOTATION.loading = null; s.remove(); rej(new Error('Could not load the notation library (vendor/vexflow.js).')); };
    document.head.appendChild(s);
  });
  return NOTATION.loading;
}
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parseNote(name){
  const r = name.slice(1), n = re => (r.match(re) || []).length;
  return { L: name[0], alter: n(/♯/g) - n(/♭/g) + 2 * (n(/𝄪/gu) - n(/𝄫/gu)) };
}
const KEY_SIGS = [['C', 0], ['G', 1], ['D', 2], ['A', 3], ['E', 4], ['B', 5], ['F#', 6], ['C#', 7], ['F', -1], ['Bb', -2], ['Eb', -3], ['Ab', -4], ['Db', -5], ['Gb', -6], ['Cb', -7]];
function sigAlter(count, L){
  if (count > 0) return 'FCGDAEB'.indexOf(L) < count ? 1 : 0;
  if (count < 0) return 'BEADGCF'.indexOf(L) < -count ? -1 : 0;
  return 0;
}
// Key signature: for 7-note scales the signature that matches the most scale notes as spelled
// (D Dorian gets C major's, A harmonic minor gets A minor's plus a G♯); otherwise the major or minor key on the root
function keySignature(){
  const notes = K.notes.map(n => parseNote(n.name));
  if (K.hept){
    let best = KEY_SIGS[0], bs = -1;
    KEY_SIGS.forEach(s => {
      const sc = notes.filter(n => sigAlter(s[1], n.L) === n.alter).length;
      if (sc > bs || (sc === bs && Math.abs(s[1]) < Math.abs(best[1]))){ best = s; bs = sc; }
    });
    return best[0];
  }
  const tonic = mod(K.pc + (K.majorish ? 0 : 3));
  const pcOf = s => mod(LETTER_PC[s[0][0]] + (s[0][1] === '#' ? 1 : s[0][1] === 'b' ? -1 : 0));
  const c = KEY_SIGS.filter(s => pcOf(s) === tonic).sort((a, b) => (K.flat === true ? a[1] - b[1] : K.flat === false ? b[1] - a[1] : 0) || Math.abs(a[1]) - Math.abs(b[1]));
  return c[0][0];
}
function vfKey(name, midi){
  const { L, alter } = parseNote(name);
  const oct = Math.round((midi - alter - LETTER_PC[L]) / 12) - 1;
  return `${L.toLowerCase()}${['bb', 'b', '', '#', '##'][alter + 2] || ''}/${oct}`;
}
// Clef and written octave for the current instrument (guitar and bass are written an octave higher than they sound)
function notationSetup(){
  const k = kind();
  if (k === 'piano') return { grand: true, shift: 0 };
  if (S.inst === 'viola') return { clef: 'alto', shift: 0 };
  if (S.inst === 'cello') return { clef: 'bass', shift: 0 };
  if (k === 'bass') return { clef: 'bass', shift: 12, oct: '8vb' };
  if (S.inst === 'violin' || S.inst === 'uke') return { clef: 'treble', shift: 0 };
  return { clef: 'treble', shift: 12, oct: '8vb' };
}
// Note values in sixteenths: a chord of any length becomes tied notes
const DURS = [[24, 'w', 1], [16, 'w', 0], [12, 'h', 1], [8, 'h', 0], [6, 'q', 1], [4, 'q', 0], [3, '8', 1], [2, '8', 0], [1, '16', 0]];
function splitDur(six){
  const out = [];
  for (const d of DURS) while (six >= d[0] - 1e-9){ out.push(d); six -= d[0]; }
  return out;
}
function notationKey(which, width){
  return JSON.stringify([which, width, sheetSeq(which).map(e => [e.it, e.sec, e.part && [e.part.key, e.part.ts]]), K.name, S.ts, S.inst, tuning(), capo(), S.smooth, S.loop, S.ring]);
}
// Draws the chords as sheet music into el. Returns false if the library could not be loaded.
async function drawNotation(el, which, opts = {}){
  const width = Math.max(300, Math.floor(opts.width || el.clientWidth || 800));
  const key = notationKey(which, width) + (opts.print ? 'p' : '');
  if (NOTATION.cache.has(key)){ el.innerHTML = NOTATION.cache.get(key); return true; }
  let VF;
  try { VF = await loadVexFlow(); }
  catch (e) { el.innerHTML = `<p class="hint">${esc(e.message)} Sheet music is unavailable.</p>`; return false; }
  const seq = sheetSeq(which);
  if (!seq.length){ el.innerHTML = '<p class="muted">No chords yet.</p>'; return true; }
  const chs = seq.map(e => e.ch), voic = sheetVoicings(seq);
  const set = notationSetup();
  // bars are worked out section by section: each section can have its own key signature and meter
  const groups = [];
  seq.forEach((e, i) => { if (!groups.length || e.sec) groups.push({ part: e.part, from: i, items: [] }); groups[groups.length - 1].items.push(e.it); });
  const bars = groups.flatMap(g => inSection(g.part, () => barSegments(g.items).map(segs => ({ segs: segs.map(x => ({ ...x, idx: x.idx + g.from })), sig: keySignature(), ts: clone(S.ts) }))));
  const per = opts.perRow || (width >= 1000 ? 4 : width >= 700 ? 3 : width >= 340 ? 2 : 1);
  const staffs = set.grand ? [{ clef: 'treble', lo: 60, hi: 200 }, { clef: 'bass', lo: 0, hi: 59 }] : [{ clef: set.clef, lo: 0, hi: 200 }];
  const rowH = set.grand ? 260 : 180, gap = 95, top = 44;
  const rows = Math.ceil(bars.length / per);
  const host = document.createElement('div');
  const R = new VF.Renderer(host, VF.Renderer.Backends.SVG);
  R.resize(width, top + rows * rowH);
  const ctx = R.getContext();
  const ink = opts.print ? '#000' : getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000';
  ctx.setFillStyle(ink); ctx.setStrokeStyle(ink);
  // how much room the clef, key and time signatures take at the start of a row
  const room = (bar, first) => {
    const s = new VF.Stave(0, 0, 400);
    s.addClef(staffs[0].clef).addKeySignature(bar.sig);
    if (first) s.addTimeSignature(tsText(bar.ts));
    return s.getNoteStartX() - new VF.Stave(0, 0, 400).getNoteStartX();
  };
  const ties = [], prevLast = staffs.map(() => null);
  const symFont = getComputedStyle(document.body).fontFamily || 'sans-serif';
  bars.forEach((bar, b) => {
    const segs = bar.segs, sig = bar.sig, n = bar.ts.num, den = bar.ts.den, prev = bars[b - 1];
    const r = Math.floor(b / per), c = b % per, rowStart = c === 0;
    const extra = room(bars[r * per], r === 0), x0 = 10, avail = width - 20 - (set.grand ? 14 : 0) - extra;
    const w = avail / Math.min(per, bars.length - r * per || per);
    const bw = w + (rowStart ? extra : 0), x = x0 + (set.grand ? 14 : 0) + (rowStart ? 0 : extra + c * w);
    const y = top + r * rowH;
    const staves = staffs.map((sf, k) => {
      const st = new VF.Stave(x, y + k * gap, bw);
      if (rowStart){ st.addClef(sf.clef, 'default', set.oct); st.addKeySignature(sig); }
      else if (prev.sig !== sig) st.addKeySignature(sig, prev.sig);
      if (b === 0 || !tsEq(prev.ts, bar.ts)) st.addTimeSignature(tsText(bar.ts));
      if (which === 'prog' && S.loop && bars.length > 1){
        if (b === 0) st.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
        if (b === bars.length - 1) st.setEndBarType(VF.Barline.type.REPEAT_END);
      } else if (b === bars.length - 1) st.setEndBarType(VF.Barline.type.END);
      if (k === 0){
        const sec = segs.find(s => !s.cont && seq[s.idx].sec);
        if (sec) st.setSection(seq[sec.idx].sec, -32);
      }
      st.setContext(ctx).draw();
      return st;
    });
    if (set.grand && rowStart){
      [['brace'], ['singleLeft']].forEach(([t]) => new VF.StaveConnector(staves[0], staves[1]).setType(VF.StaveConnector.type[t === 'brace' ? 'BRACE' : 'SINGLE_LEFT']).setContext(ctx).draw());
    }
    if (set.grand) new VF.StaveConnector(staves[0], staves[1]).setType(VF.StaveConnector.type[b === bars.length - 1 ? 'BOLD_DOUBLE_RIGHT' : 'SINGLE_RIGHT']).setContext(ctx).draw();
    const voices = staffs.map((sf, k) => {
      const notes = [];
      segs.forEach(s => {
        const ch = chs[s.idx];
        const ms = voic[s.idx].filter(m => m >= sf.lo && m <= sf.hi);
        const keys = ms.map(m => { const t = mod(m) === ch.bassPc ? { name: ch.bassName } : toneOf(ch, m); return vfKey(t ? t.name : spell(letterFor(m), mod(m)), m + set.shift); });
        const pieces = splitDur(s.beats * 16 / den);
        pieces.forEach((d, j) => {
          const rest = !keys.length;
          const note = new VF.StaveNote({ clef: sf.clef, keys: rest ? [sf.clef === 'bass' ? 'd/3' : sf.clef === 'alto' ? 'c/4' : 'b/4'] : keys, duration: d[1] + (d[2] ? 'd' : '') + (rest ? 'r' : ''), auto_stem: true });
          if (d[2]) VF.Dot.buildAndAttach([note], { all: true });
          if (k === 0 && j === 0 && !s.cont){
            note.addModifier(new VF.Annotation(ch.symbol).setFont(symFont, 13, 'bold').setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0);
          }
          // tie to the previous piece of the same chord (also across bar lines)
          const prev = prevLast[k];
          if (!rest && prev && (j > 0 || s.cont)) ties.push({ a: prev.note, b: note, n: keys.length, row: prev.row !== r });
          prevLast[k] = rest ? null : { note, row: r };
          notes.push(note);
        });
      });
      const v = new VF.Voice({ num_beats: n, beat_value: den }).setMode(VF.Voice.Mode.SOFT);
      v.addTickables(notes);
      VF.Accidental.applyAccidentals([v], sig);
      return v;
    });
    const fmt = new VF.Formatter();
    voices.forEach(v => fmt.joinVoices([v]));
    fmt.format(voices, Math.max(40, staves[0].getNoteEndX() - staves[0].getNoteStartX() - 14));
    voices.forEach((v, k) => v.draw(ctx, staves[k]));
  });
  ties.forEach(t => {
    const idx = [...Array(t.n).keys()];
    if (t.row){
      new VF.StaveTie({ first_note: t.a, first_indices: idx }).setContext(ctx).draw();
      new VF.StaveTie({ last_note: t.b, last_indices: idx }).setContext(ctx).draw();
    } else new VF.StaveTie({ first_note: t.a, last_note: t.b, first_indices: idx, last_indices: idx }).setContext(ctx).draw();
  });
  const svg = host.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${top + rows * rowH}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Sheet music: ${chs.map(c => c.symbol).join(', ')}`);
  const html = host.innerHTML + (set.oct && !opts.print ? `<p class="hint">Written an octave higher than it sounds, as is usual for ${kind() === 'bass' ? 'bass' : 'guitar'}.</p>` : '');
  if (NOTATION.cache.size > 20) NOTATION.cache.clear();
  NOTATION.cache.set(key, html);
  el.innerHTML = html;
  return true;
}
// Called after the progression or song tab renders
function paintNotation(which){
  if (!S.notation) return;
  const el = $(which === 'song' ? '#notationSong' : '#notationProg');
  if (!el) return;
  const key = notationKey(which, Math.floor(el.clientWidth));
  if (NOTATION.cache.has(key)) el.innerHTML = NOTATION.cache.get(key);
  else {
    el.innerHTML = '<p class="muted">Drawing the sheet music…</p>';
    drawNotation(el, which);
  }
}
const notationButton = () => `<button class="btn sm tgl" data-act="notationToggle" aria-pressed="${!!S.notation}" title="Show the chords as sheet music">Sheet music</button>`;
let notationW = 0;
window.addEventListener('resize', () => {
  if (!S.notation) return;
  clearTimeout(notationW);
  notationW = setTimeout(() => paintNotation(S.tab === 'song' ? 'song' : 'prog'), 200);
});

/* ---- Printable chord sheet ---- */
function printDialog(which){
  const song = which === 'song';
  ui.printWhich = which;
  const P = S.print;
  openModal(song ? 'Print the song' : 'Print the progression', `<div class="form">
    <p class="hint">Opens your browser's print window; choose your printer, or <b>Save as PDF</b>.</p>
    <label class="chk"><input type="checkbox" id="prDiag"${P.diagrams ? ' checked' : ''}${kind() === 'bass' ? ' disabled' : ''}> Chord diagrams (${fretted() ? `${esc(INST[S.inst].name)} shapes as voiced` : 'piano voicings'})</label>
    <label class="chk"><input type="checkbox" id="prChart"${P.chart ? ' checked' : ''}> Chord chart (bars)</label>
    <label class="chk"><input type="checkbox" id="prRn"${P.rn ? ' checked' : ''}> Roman numerals under the chords</label>
    ${song ? `<label class="chk"><input type="checkbox" id="prLyr"${P.lyrics ? ' checked' : ''}> Lyrics</label>` : ''}
    <label class="chk"><input type="checkbox" id="prNot"${P.notation ? ' checked' : ''}> Sheet music</label></div>`,
    [{ label: 'Cancel', act: 'modalClose' }, { label: 'Print…', act: 'printGo', primary: true }]);
}
function chartHTML(items, rn){
  if (!items.length) return '<p class="muted">No chords</p>';
  const chs = items.map(fromItem);
  return `<div class="pr-bars">${barSegments(items).map(segs => `<div class="pr-bar">${segs.map(s => `<span class="pr-c">${s.cont ? '<b>%</b>' : `<b>${chs[s.idx].symbol}</b>${rn ? `<small>${analyze(chs[s.idx]).rn}</small>` : ''}`}</span>`).join('')}</div>`).join('')}</div>`;
}
function diagramsHTML(seq){
  if (kind() === 'bass') return '';
  // the shapes playback uses (a chosen ✎ shape, or the Auto one, with smooth voice leading if it's on)
  const voic = sheetVoicings(seq), shapes = fretted() ? progVoicings(seq.map(e => e.it), seq.map(e => e.ch)) : null, seen = new Set(), cards = [];
  seq.forEach((e, i) => {
    const ch = e.ch;
    if (fretted()){
      const v = shapes[i].v;
      const k = ch.symbol + '|' + (v ? v.frets.join() : '');
      if (seen.has(k)) return; seen.add(k);
      cards.push(`<div class="pr-dg"><b>${ch.symbol}</b>${v ? diagramSVG(v, ch, eff()) + `<span class="mono">${fretsText(v.frets)}</span>` : '<span class="muted">no shape</span>'}</div>`);
    } else {
      const ms = voic[i], k = ch.symbol + '|' + ms.join();
      if (seen.has(k)) return; seen.add(k);
      const lo = Math.floor(Math.min(...ms) / 12) * 12, hi = Math.max(lo + 23, Math.ceil((Math.max(...ms) + 1) / 12) * 12 - 1);
      cards.push(`<div class="pr-dg pr-pk"><b>${ch.symbol}</b>${pianoSVG(lo, hi, ms, { w: 11, h: 46, ref: ch, fit: true, noOct: true })}</div>`);
    }
  });
  return `<div class="pr-dgs">${cards.join('')}</div>`;
}
async function printSheet(which){
  const P = S.print, song = which === 'song', seq = sheetSeq(which);
  if (!seq.length){ toast('Nothing to print yet.'); return; }
  let area = $('#printArea');
  if (!area){ area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
  let body = '';
  if (P.diagrams) body += diagramsHTML(seq);
  if (song){
    if (W.song.order.length > 1) body += `<p class="pr-arr"><b>Arrangement:</b> ${W.song.order.map(id => esc((partById(id) || {}).name || '')).join(' → ')}</p>`;
    W.song.order.forEach(id => {
      const p = partById(id); if (!p) return;
      const tag = partTag(p);
      body += `<section class="pr-sec"><h2>${esc(p.name)}${tag ? ` <small>${esc(tag)}</small>` : ''}</h2>${P.chart ? inSection(p, () => chartHTML(p.items, P.rn)) : ''}${P.lyrics && p.lyrics.trim() ? `<pre class="pr-lyr">${esc(p.lyrics.trim())}</pre>` : ''}</section>`;
    });
  } else if (P.chart) body += chartHTML(prog, P.rn);
  const notes = !song && !W.edit && W.prog.notes ? `<p class="pr-notes">${esc(W.prog.notes)}</p>` : song && W.song.notes ? `<p class="pr-notes">${esc(W.song.notes)}</p>` : '';
  area.innerHTML = `<header class="pr-head"><h1>${esc(sheetName(which))}</h1>${song && W.song.artist ? `<div class="pr-by">${esc(W.song.artist)}</div>` : ''}<div class="pr-info">${sheetInfo()}</div>${notes}</header>${body}${P.notation ? '<section class="pr-sec pr-not"><h2>Sheet music</h2><div id="prNotation"></div></section>' : ''}<footer class="pr-foot">Harmony Bench</footer>`;
  if (P.notation) await drawNotation($('#prNotation'), which, { width: 700, perRow: 4, print: true });
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  window.print();
  if (framed) toast('If no print window opened, this preview blocks printing. It works on your own server.');
}
window.addEventListener('afterprint', () => { const a = $('#printArea'); if (a) a.innerHTML = ''; });

Object.assign(ACT, {
  printSheet: el => printDialog(el.dataset.arg),
  printGo: () => {
    const g = id => { const x = $('#' + id); return x ? x.checked : S.print[{ prDiag: 'diagrams', prChart: 'chart', prRn: 'rn', prLyr: 'lyrics', prNot: 'notation' }[id]]; };
    S.print = { diagrams: g('prDiag'), chart: g('prChart'), rn: g('prRn'), lyrics: g('prLyr'), notation: g('prNot') };
    save(); closeModal();
    printSheet(ui.printWhich || 'prog');
  },
  notationToggle: () => { S.notation = !S.notation; save(); renderTab(); },
});
