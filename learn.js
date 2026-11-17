'use strict';
/* ================= Learn tab =================
   Short lessons for someone with no theory, each with a widget to play with: notes as numbers, scales from steps,
   chords from stacked thirds, the circle of fifths, tension and resolution (voice leading), chords outside the key,
   and modulation. The tab uses the explore key (like Scales and the Chord library), so nothing here ever changes a
   progression or a song. Loaded after analyzer.js and before docs.js. */

const LESSONS = [
  { id: 'notes', name: 'Notes as numbers' },
  { id: 'scales', name: 'Scales and keys from steps' },
  { id: 'chords', name: 'Chords from stacked thirds' },
  { id: 'circle', name: 'The circle of fifths' },
  { id: 'tension', name: 'Tension and resolution' },
  { id: 'outside', name: 'Chords outside the key' },
  { id: 'modulation', name: 'Changing key (modulation)' },
];
// widget state (not saved)
const LW = { a: 0, b: 7, pick: 0, start: 0, pat: 'major', step: 0, sev: false, circ: null, prevCirc: null, sig: true, wedge: true, pair: 'V7I', pa: null, pb: null };

/* ---- Sound ---- */
const lnKind = () => kind() === 'bass' ? 'piano' : kind();
// steps: [[seconds from now, [midi notes], duration]]
function lnPlay(steps){
  ac();
  const t0 = AU.ctx.currentTime + 0.06, k = lnKind();
  steps.forEach(([t, ms, d]) => ms.forEach(m => playNote(k, m, t0 + t, { vel: 0.75, dur: d || 0.9 })));
}
// chords spelled in a key: [pc offset from the key, letter steps from the key's letter, quality]
const inKeyOf = (k, fn) => inSection({ key: k }, fn);
const cOf = (k, list) => inKeyOf(k, () => list.map(([s, l, q]) => mkChord(K.pc + s, K.L + l, q)));
const C_MAJOR = { pc: 0, scale: 'major' };
const exChords = list => cOf(C_MAJOR, list);
const symList = chs => chs.map(c => c.symbol).join(' → ');
const dfn = (t, d) => `<dfn title="${esc(d)}">${t}</dfn>`;

/* ---- 1. Notes as numbers ---- */
const RATIOS = ['1 : 1', '16 : 15', '9 : 8', '6 : 5', '5 : 4', '4 : 3', '45 : 32', '3 : 2', '8 : 5', '5 : 3', '16 : 9', '15 : 8', '2 : 1'];
const FEEL = ['the same note', 'very tense, grinding', 'tense, stepping', 'sweet, sad', 'sweet, bright', 'open, stable', 'restless (the tritone)', 'open, very stable', 'soft, warm', 'warm, bright', 'bluesy, wants to move', 'sharp, wants to rise', 'the same note an octave up'];
function clockSVG(a, b){
  const R = 104, cx = 130, cy = 130, pt = (i, r) => [cx + r * Math.sin(i * Math.PI / 6), cy - r * Math.cos(i * Math.PI / 6)];
  let o = `<svg viewBox="0 0 260 260" class="ln-clock" role="img" aria-label="The 12 notes on a clock face">`;
  o += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="2"/>`;
  const [ax, ay] = pt(a, R), [bx, by] = pt(b, R);
  o += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="var(--root)" stroke-width="3"/>`;
  for (let i = 0; i < 12; i++){
    const [x, y] = pt(i, R), on = i === a || i === b;
    o += `<g class="ln-cl" data-act="lnNote" data-pc="${i}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="17" fill="${on ? (i === a ? 'var(--root)' : 'var(--third)') : 'var(--raised)'}" stroke="var(--line)"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12.5" font-weight="600" fill="${on ? 'var(--bg)' : 'var(--ink)'}">${PC_NAME(i)}</text></g>`;
    const [nx, ny] = pt(i, R - 34);
    o += `<text x="${nx}" y="${ny + 4}" text-anchor="middle" font-size="10" fill="var(--muted)">${i}</text>`;
  }
  const d = mod(b - a);
  o += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="26" font-weight="800" fill="var(--ink)">${d || 12}</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="var(--muted)">half steps</text>`;
  return o + '</svg>';
}
function lessonNotes(){
  const a = LW.a, b = LW.b, d = mod(b - a) || 12, et = Math.pow(2, d / 12);
  const [p, q] = RATIOS[d].split(' : ').map(Number);
  const opts = sel => PC_NAMES.map((n, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${n}</option>`).join('');
  return `<p>Music uses just <b>12 different notes</b>. After the 12th the names start again, one ${dfn('octave', 'The same note name, higher or lower: the frequency is doubled or halved.')} higher. That makes the notes work like the hours on a clock: count forward 12 and you are back where you started.</p>
    <p>The distance between two notes is counted in ${dfn('half steps', 'The smallest step in Western music: one fret on a guitar, or the next key on a piano (black or white).')} (also called semitones): one fret on a guitar, or the very next key on a piano. Every distance has a name: that is an ${dfn('interval', 'The distance between two notes, named by how many half steps apart they are.')}.</p>
    <div class="ln-w ln-two"><div>${clockSVG(a, b)}<p class="hint">Click two notes on the clock (or pick them below).</p></div>
    <div class="ln-facts">
      <div class="acts"><label class="fld"><span>First note</span><select id="lnA">${opts(a)}</select></label><label class="fld"><span>Second note (above it)</span><select id="lnB">${opts(b)}</select></label></div>
      <p class="ln-big"><b>${PC_NAMES[a]} → ${PC_NAMES[b]}</b>: ${d} half step${d > 1 ? 's' : ''}, a <b>${SEMI_NAME[d % 12] === 'unison / octave' ? (d === 12 ? 'octave' : 'unison') : SEMI_NAME[d]}</b></p>
      <p>Frequency ratio about <b class="mono">${RATIOS[d]}</b> (${(p / q).toFixed(3)}); on a modern piano exactly 2<sup>${d}/12</sup> = ${et.toFixed(3)}. It sounds ${FEEL[d]}.</p>
      <div class="acts"><button class="btn sm" data-act="lnIv" data-arg="apart">▶ One after the other</button><button class="btn sm" data-act="lnIv" data-arg="together">▶ Together</button></div>
    </div></div>
    <h4 class="an-h4">The math</h4>
    <ul class="an-ul"><li>An octave doubles the frequency: A is 220, 440, 880… vibrations per second. That 2 : 1 is why two notes an octave apart sound like “the same note”.</li>
      <li>The other intervals that sound smooth (${dfn('consonant', 'Notes that sound stable and blend together.')}) are the simple ratios: the 5th is 3 : 2, the 4th is 4 : 3, the major 3rd is 5 : 4. Their sound waves line up often.</li>
      <li>Complicated ratios (the half step 16 : 15, the tritone 45 : 32) line up rarely, so they sound tense (${dfn('dissonant', 'Notes that clash and sound like they want to move.')}). Tension isn’t bad: it is what makes music want to move on.</li>
      <li>Modern instruments split the octave into 12 exactly equal steps (each one × 1.0595). That makes the 5th 1.498 instead of 1.5: close enough that we hear it as 3 : 2, and every key sounds equally in tune.</li></ul>`;
}

/* ---- 2. Scales and keys from steps ---- */
const LN_PATS = ['major', 'aeolian', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'harmonic'];
function lessonScales(){
  const k = makeKey(LW.start, LW.pat), n = k.notes.length, shown = clamp(LW.step, 0, n);
  const steps = k.notes.map((x, i) => (i + 1 < n ? k.notes[i + 1].semis : 12) - x.semis);
  const stepName = s => s === 1 ? 'H' : s === 2 ? 'W' : 'W+H';
  const boxes = k.notes.map((x, i) => `<span class="ln-n${i < shown ? ' on' : ''}${i === 0 ? ' root' : ''}">${i < shown ? `<button class="ln-nb" data-act="lnNotePlay" data-m="${60 + (LW.start > 7 ? LW.start - 12 : LW.start) + x.semis}" title="Play ${x.name}"><b>${x.name}</b><small>${x.lbl}</small></button>` : '<b>?</b>'}</span>${i < n - 1 ? `<span class="ln-st${i < shown - 1 ? ' on' : ''}">${stepName(steps[i])}</span>` : ''}`).join('') + `<span class="ln-st${shown >= n ? ' on' : ''}">${stepName(steps[n - 1])}</span><span class="ln-n${shown >= n ? ' on' : ''}"><b>${shown >= n ? k.notes[0].name : '?'}</b><small>8</small></span>`;
  const acc = k.notes.filter(x => /[♯♭]/.test(x.name)).map(x => x.name);
  const opts = PC_NAMES.map((nm, i) => `<option value="${i}"${i === LW.start ? ' selected' : ''}>${nm}</option>`).join('');
  const modes = makeKey(0, 'major');
  return `<p>A ${dfn('scale', 'A set of notes in order, picked out of the 12, that a piece of music mostly uses.')} picks 7 of the 12 notes, by a pattern of ${dfn('whole steps (W)', 'Two half steps: two frets on a guitar.')} and ${dfn('half steps (H)', 'One fret, or the next key on a piano.')}. The major scale is <b class="mono">W W H W W W H</b>. Start that pattern on any note and you get that note’s major scale. A ${dfn('key', 'The scale a song mostly uses, plus a home note (the tonic) the music keeps returning to.')} is the scale a song uses, with its first note as home (the ${dfn('tonic', 'The home note of a key, where the music feels at rest.')}).</p>
    <div class="ln-w">
      <div class="acts"><label class="fld"><span>Start on</span><select id="lnStart">${opts}</select></label><label class="fld"><span>Pattern</span><select id="lnPat">${LN_PATS.map(id => `<option value="${id}"${id === LW.pat ? ' selected' : ''}>${SC[id].name}</option>`).join('')}</select></label>
        <button class="btn sm primary" data-act="lnStep">${shown >= n ? 'Start again' : shown ? 'Next step ▶' : 'Build it ▶'}</button><button class="btn sm" data-act="lnScalePlay">▶ Play the scale</button></div>
      <div class="ln-scale">${boxes}</div>
      <p class="hint">${shown === 0 ? `Press <b>Build it</b> to start on ${k.notes[0].name} and take the steps one by one.` : shown < n ? `Next: a ${stepName(steps[shown - 1]) === 'H' ? 'half step (1 fret)' : stepName(steps[shown - 1]) === 'W' ? 'whole step (2 frets)' : 'whole and a half step (3 frets)'} up from ${k.notes[shown - 1].name}.` : `${k.name}: ${k.notes.map(x => x.name).join(' ')}.`}</p>
    </div>
    <h4 class="an-h4">Why sharps and flats appear</h4>
    <p>Each scale uses every letter A to G exactly once, so each note can be written with one letter. To keep the step pattern, some letters have to be raised (${dfn('sharp ♯', 'One half step higher.')}) or lowered (${dfn('flat ♭', 'One half step lower.')}). ${shown >= n ? (acc.length ? `${k.name} needs ${acc.join(', ')}: those are its ${dfn('key signature', 'The sharps or flats a key always uses, written once at the start of each line of music.')}.` : `${k.name} needs none at all.`) : 'Build the scale to see which ones this one needs.'}</p>
    <h4 class="an-h4">Modes: the same notes from another starting point</h4>
    <p>Play C major’s seven notes but treat a different one as home and you get a ${dfn('mode', 'A scale made by starting the major scale (or another scale) on a different note and calling that note home.')}: the steps fall in a different order, so the mood changes.</p>
    <div class="ln-modes">${['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'].map((id, i) => `<button class="cchip" data-act="lnMode" data-pc="${modes.notes[i].pc}" data-id="${id}"><b>${modes.notes[i].name}</b> ${SC[id].name}</button>`).join('')}</div>`;
}

/* ---- 3. Chords from stacked thirds ---- */
function lessonChords(){
  const k = K.hept ? { pc: K.pc, scale: K.sc.id } : { pc: K.pc, scale: K.majorish ? 'major' : 'aeolian' };
  const name = makeKey(k.pc, k.scale).name;
  const chs = inKeyOf(k, () => K.notes.map((_, i) => diatonic(i, LW.sev)));
  const an = inKeyOf(k, () => chs.map(analyze));
  const cards = chs.map((c, i) => `<button class="card ln-card" data-act="lnChord" data-i="${i}"><div class="fn-stripe ${FN_CLASS[an[i].fn]}"></div><span class="main"><span class="rn">${an[i].rn}</span><span class="sym">${c.symbol}</span><span class="nn">${c.tones.map(t => t.name).join(' ')}</span><span class="qn">${FN_NAME[an[i].fn]}</span></span></button>`).join('');
  return `<p>A ${dfn('chord', 'Three or more notes played together.')} is built by stacking every other note of the scale: the 1st, 3rd and 5th notes. Each skip is a ${dfn('3rd', 'An interval of 3 or 4 half steps.')}: a big one (4 half steps, a major 3rd) or a small one (3, a minor 3rd). Big then small makes a ${dfn('major chord', 'Root, major 3rd, perfect 5th: bright.')}; small then big a ${dfn('minor chord', 'Root, minor 3rd, perfect 5th: darker.')}; small and small a ${dfn('diminished chord', 'Root, minor 3rd, diminished 5th: tense.')}. Stack one more 3rd and you get a ${dfn('7th chord', 'A chord with a fourth note, a 3rd above the 5th.')}.</p>
    <p>Building a chord on each of the 7 notes gives the key’s 7 chords. Musicians number them with ${dfn('Roman numerals', 'I to VII: the scale note the chord is built on. Upper case = major, lower case = minor, ° = diminished.')} so the same pattern works in any key: I–IV–V in C is C–F–G, in G it is G–C–D.</p>
    <div class="ln-w"><div class="sec-h"><b>${esc(name)}</b><div class="acts"><div class="seg"><button data-act="lnSev" data-v="0" aria-pressed="${!LW.sev}">Triads</button><button data-act="lnSev" data-v="1" aria-pressed="${LW.sev}">7ths</button></div><button class="btn sm" data-act="lnCad">▶ I–IV–V–I</button></div></div>
      <div class="cards ln-cards">${cards}</div>
      <p class="hint">Click a chord to hear it. The key is the explore key in the header: change it there to hear the same pattern in another key.</p></div>
    <h4 class="an-h4">Jobs: tonic, pre-dominant, dominant</h4>
    <ul class="an-ul"><li><b>${dfn('Tonic', 'Home: rest.')} (T, blue)</b>: I is home. iii and vi share two notes with it, so they feel restful too.</li>
      <li><b>${dfn('Pre-dominant', 'Moving away from home, preparing the dominant.')} (PD, gold)</b>: ii and IV step away from home and lead to V.</li>
      <li><b>${dfn('Dominant', 'The most tension in the key; it pulls back home.')} (D, red)</b>: V (and vii°) hold the most tension and pull back to I. Most songs are this loop: home → away → tension → home.</li></ul>`;
}

/* ---- 4. The circle of fifths ---- */
const CIRC_MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯/G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
const CIRC_MIN = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
const SHARP_ORDER = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯'], FLAT_ORDER = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭'];
const circPos = pc => mod(pc * 7);
function keySig(pos){
  if (pos === 0) return { n: 0, text: 'no sharps or flats' };
  if (pos <= 6) return { n: pos, text: `${pos} sharp${pos > 1 ? 's' : ''}: ${SHARP_ORDER.slice(0, pos).join(' ')}${pos === 6 ? ' (or 6 flats as G♭)' : ''}` };
  const f = 12 - pos;
  return { n: -f, text: `${f} flat${f > 1 ? 's' : ''}: ${FLAT_ORDER.slice(0, f).join(' ')}` };
}
function circleSVG(sel){
  const cx = 170, cy = 170, R1 = 162, R2 = 112, R3 = 70;
  const P = (a, r) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const arc = (i, r0, r1) => {
    const a0 = (i - 0.5) * Math.PI / 6, a1 = (i + 0.5) * Math.PI / 6, [x0, y0] = P(a0, r1), [x1, y1] = P(a1, r1), [x2, y2] = P(a1, r0), [x3, y3] = P(a0, r0);
    return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
  };
  const inWedge = i => LW.wedge && [11, 0, 1].includes(mod(i - sel.pos));
  // Roman numerals in the selected key: a major key's IV I V outside and ii vi iii inside; a minor key's ♭VI ♭III ♭VII and iv i v
  const wedgeRn = (i, inner) => (sel.minor ? (inner ? { 11: 'iv', 0: 'i', 1: 'v' } : { 11: '♭VI', 0: '♭III', 1: '♭VII' }) : (inner ? { 11: 'ii', 0: 'vi', 1: 'iii' } : { 11: 'IV', 0: 'I', 1: 'V' }))[mod(i - sel.pos)];
  let o = `<svg viewBox="0 0 340 340" class="ln-circle" role="img" aria-label="Circle of fifths">`;
  for (let i = 0; i < 12; i++){
    const onMaj = !sel.minor && sel.pos === i, onMin = sel.minor && sel.pos === i;
    o += `<path d="${arc(i, R2, R1)}" class="ln-sec${inWedge(i) ? ' wedge' : ''}${onMaj ? ' on' : ''}" data-act="lnCirc" data-pos="${i}" data-minor="0"/>`;
    o += `<path d="${arc(i, R3, R2)}" class="ln-sec min${inWedge(i) ? ' wedge' : ''}${onMin ? ' on' : ''}" data-act="lnCirc" data-pos="${i}" data-minor="1"/>`;
    // outer ring: key name, key signature under it, Roman numeral nearest the middle; inner ring: name, numeral
    const at = (r, dy) => { const [x, y] = P(i * Math.PI / 6, r); return `x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}"`; };
    o += `<text ${at(147, 5)} text-anchor="middle" class="ln-ct${onMaj ? ' on' : ''}">${CIRC_MAJ[i]}</text>`;
    if (LW.sig){ const ks = keySig(i); o += `<text ${at(131, 3.5)} text-anchor="middle" class="ln-cs${onMaj ? ' on' : ''}">${ks.n === 0 ? 'no ♯/♭' : ks.n > 0 ? ks.n + '♯' : -ks.n + '♭'}</text>`; }
    o += `<text ${at(97, 4)} text-anchor="middle" class="ln-ct min${onMin ? ' on' : ''}">${CIRC_MIN[i]}</text>`;
    if (inWedge(i)) o += `<text ${at(119, 3.5)} text-anchor="middle" class="ln-cr${onMaj ? ' on' : ''}">${wedgeRn(i, false)}</text><text ${at(81, 3.5)} text-anchor="middle" class="ln-cr${onMin ? ' on' : ''}">${wedgeRn(i, true)}</text>`;
  }
  return o + `<text x="${cx}" y="${cy - 6}" text-anchor="middle" class="ln-cc">${sel.minor ? CIRC_MIN[sel.pos] : CIRC_MAJ[sel.pos]}</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" class="ln-cs">${sel.minor ? 'minor' : 'major'}</text></svg>`;
}
// the key's notes as buttons that play them, with the sharps or flats marked
function lnNoteButtons(kk){
  const base = 60 + (kk.pc > 7 ? kk.pc - 12 : kk.pc);
  return kk.notes.map(x => `<button class="ln-note${/[♯♭]/.test(x.name) ? ' acc' : ''}" data-act="lnNotePlay" data-m="${base + x.semis}" title="Play ${x.name}">${x.name}</button>`).join('');
}
// how the selected key's signature follows from its place on the circle
function sigHowHTML(sel, kk){
  const p = sel.pos, majName = CIRC_MAJ[p].split('/')[0], who = sel.minor ? `${esc(kk.name)} uses the key signature of its relative major, ${esc(majName)} major. ` : '';
  if (p === 0) return `<p class="slotnote">${who}C major is at the top of the circle: no sharps or flats, only the white keys of a piano.</p>`;
  if (p <= 6){
    const sh = SHARP_ORDER.slice(0, p), last = sh[p - 1], prev = CIRC_MAJ[p - 1].split('/')[0];
    return `<p class="slotnote">${who}${esc(majName)} major is ${p} step${p > 1 ? 's' : ''} clockwise from C, so it has ${p > 1 ? `the first ${p} sharps` : 'the first sharp'} in the order: <b>${sh.join(' ')}</b>. The newest one, ${last}, is the one ${esc(prev)} major didn’t have: a half step below ${esc(majName)}, it is the key’s leading tone.${p === 6 ? ' Spelled with flats this key is G♭ major (6 flats).' : ''}</p>`;
  }
  const f = 12 - p, fl = FLAT_ORDER.slice(0, f);
  return `<p class="slotnote">${who}${esc(majName)} major is ${f} step${f > 1 ? 's' : ''} counter-clockwise from C, so it has ${f > 1 ? `the first ${f} flats` : 'the first flat'} in the order: <b>${fl.join(' ')}</b>.${f >= 2 ? ` The second-to-last flat, ${fl[f - 2]}, is the key’s name.` : ' (F major is the one to remember: just B♭.)'}</p>`;
}
function relHowText(sel){
  const majPc = mod(sel.pos * 7), M = makeKey(majPc, 'major'), m = makeKey(majPc + 9, 'aeolian');
  return `${esc(m.notes[0].name)} is ${esc(M.notes[0].name)} major’s 6th note, 3 half steps below ${esc(M.notes[0].name)}.`;
}
function lessonCircle(){
  // the circle shows the explore key (a minor key by its relative major's position)
  LW.circ = K.majorish || !K.hept ? { pos: circPos(K.pc), minor: false } : { pos: circPos(K.pc + 3), minor: true };
  const sel = LW.circ, majPc = mod(sel.pos * 7), k = sel.minor ? { pc: majPc + 9, scale: 'aeolian' } : { pc: majPc, scale: 'major' };
  const kk = makeKey(mod(k.pc), k.scale), ks = keySig(sel.pos), rel = sel.minor ? makeKey(majPc, 'major').name : makeKey(majPc + 9, 'aeolian').name;
  let dist = '';
  if (LW.prevCirc && (LW.prevCirc.pos !== sel.pos)){
    const a = makeKey(LW.prevCirc.pos * 7, 'major'), b = makeKey(majPc, 'major'), steps = Math.min(mod(sel.pos - LW.prevCirc.pos), mod(LW.prevCirc.pos - sel.pos));
    const changed = [...b.pcs].filter(p => !a.pcs.has(p));
    dist = `<p class="slotnote">From ${esc(CIRC_MAJ[LW.prevCirc.pos])} major to ${esc(CIRC_MAJ[sel.pos])} major is <b>${steps} step${steps > 1 ? 's' : ''}</b> around the circle, and <b>${changed.length} note${changed.length === 1 ? '' : 's'}</b> change (${changed.map(p => b.notes.find(x => x.pc === p).name).join(', ')}). ${steps <= 1 ? 'Neighbors share 6 of 7 notes: a key change between them sounds smooth.' : steps >= 4 ? 'Far apart: a change between them sounds bold and needs preparing.' : 'A noticeable change, still easy to prepare with a pivot chord.'}</p>`;
  }
  return `<p>Start on C and keep going up a ${dfn('5th', 'An interval of 7 half steps: C up to G.')} (7 half steps): C, G, D, A, E, B, F♯… After 12 steps you are back on C, having visited every one of the 12 notes exactly once (because 7 and 12 share no common factor). Bend that line into a circle and you have the ${dfn('circle of fifths', 'All 12 keys arranged so that neighbors are a 5th apart and share 6 of their 7 notes.')}, the map musicians use to find their way between keys.</p>
    <div class="ln-w ln-two"><div>${circleSVG(sel)}
      <div class="acts"><label class="chk"><input type="checkbox" id="lnSig"${LW.sig ? ' checked' : ''}> Key signatures</label><label class="chk"><input type="checkbox" id="lnWedge"${LW.wedge ? ' checked' : ''}> Chords of the key</label></div></div>
      <div class="ln-facts">
        <p class="ln-big"><b>${esc(kk.name)}</b></p>
        <p>Key signature: <b>${ks.text}</b>.</p>
        <div class="ln-keynotes">${lnNoteButtons(kk)}<button class="btn sm" data-act="lnKeyScale" data-pc="${kk.pc}" data-sc="${kk.sc.id}">▶ Scale</button></div>
        <p class="hint">Click a note to hear it; the sharps or flats of the key are marked.</p>
        ${sigHowHTML(sel, kk)}
        <p>Its ${dfn('relative', 'The major and minor key with the same notes (and key signature), like C major and A minor.')} ${sel.minor ? 'major' : 'minor'} is <b>${esc(rel)}</b>, sitting ${sel.minor ? 'outside it' : 'inside it'} on the circle: same notes, different home. ${relHowText(sel)}</p>
        <div class="acts"><button class="btn sm" data-act="lnRelPlay" data-pos="${sel.pos}">▶ ${esc(makeKey(majPc, 'major').name)} scale, then ${esc(makeKey(majPc + 9, 'aeolian').name)}</button></div>
        ${LW.wedge ? `<p>The shaded wedge holds the key’s main chords: ${sel.minor ? 'i in the middle, iv to the left, v to the right' : 'I in the middle, IV to its left and V to its right on the outside; ii, vi and iii right under them'}. Only the diminished chord is missing.</p>` : ''}
        <div class="acts"><button class="btn sm primary" data-act="lnCircPlay">▶ ${sel.minor ? 'i–iv–V–i' : 'I–IV–V–I'} in ${esc(kk.name)}</button></div>
        ${dist}
        <p class="hint">Clicking a key changes the explore key in the header; your progression and song keep their keys.</p></div></div>
    <h4 class="an-h4">How to tell which sharps or flats a key has</h4>
    <ul class="an-ul"><li><b>Sharps, clockwise.</b> Each step clockwise adds one sharp, always in the same order: <b>F♯ C♯ G♯ D♯ A♯ E♯ B♯</b> (“Father Charles Goes Down And Ends Battle”). G has 1 (F♯), D has 2 (F♯ C♯), A has 3, and so on.</li>
      <li><b>Why one at a time?</b> Moving up a 5th keeps six of the seven notes. The one that changes is the old key’s 4th note, which is raised a half step to become the new key’s 7th, its ${dfn('leading tone', 'The 7th note of a major scale, a half step below the tonic.')}. C → G: F becomes F♯, a half step below G.</li>
      <li><b>Sharp-key shortcut:</b> the last sharp is a half step below the key’s name. Last sharp C♯ → the key is D major.</li>
      <li><b>Flats, counter-clockwise.</b> Each step counter-clockwise adds one flat, in the sharps’ order backwards: <b>B♭ E♭ A♭ D♭ G♭ C♭ F♭</b> (“BEAD-GCF”). Here the old key’s 7th note is lowered to become the new key’s 4th: C → F, B becomes B♭.</li>
      <li><b>Flat-key shortcut:</b> the second-to-last flat is the key’s name (B♭ E♭ A♭ → E♭ major). The one to memorize is F major: one flat, B♭.</li>
      <li><b>At the bottom</b> the two sides meet: F♯ major (6 sharps) and G♭ major (6 flats) are the same notes spelled two ways.</li></ul>
    <h4 class="an-h4">How the inner ring (the minor keys) is laid out</h4>
    <ul class="an-ul"><li>Each minor key sits just inside the major key that has the same notes, its ${dfn('relative major', 'The major key with the same notes and key signature as a minor key, 3 half steps above it.')}. So a minor key uses exactly the key signature of the major key outside it: A minor has no sharps or flats, like C; E minor has one sharp, like G.</li>
      <li>To find the relative minor of a major key, count down 3 half steps (a minor 3rd) from its name, or go up to its 6th note: C → (B, B♭) → A. To go from a minor key to its relative major, count up 3 half steps: A → B♭ → B → C.</li>
      <li>Because every pair is the same distance apart, the inner ring is the outer ring turned by three positions: it also goes up in 5ths as you go clockwise (Am, Em, Bm, F♯m, C♯m…), and each step clockwise adds one sharp, just like the majors.</li></ul>
    <h4 class="an-h4">What the circle explains</h4>
    <ul class="an-ul"><li><b>Clockwise is toward the dominant.</b> One step clockwise from any key is its V: G is V of C. V → I is a step counter-clockwise, the strongest move in music.</li>
      <li><b>A secondary dominant is one more step clockwise.</b> D (V of G) sits one step past G: the “V of V”. A chain of dominants (E → A → D → G → C) walks counter-clockwise around the circle back home.</li>
      <li><b>Borrowed chords come from the parallel key, three steps counter-clockwise.</b> C minor (E♭ major’s relative) sits 3 steps from C major: that is where Fm, A♭ and B♭ come from.</li>
      <li><b>Distance = notes that change.</b> Each step around the circle changes exactly one note, so neighbors (C and G) share 6 notes and a key change between them is smooth; keys far apart (C and F♯) share almost none. Click two keys in turn to compare.</li></ul>`;
}

/* ---- 5. Tension and resolution ---- */
const PAIRS = {
  V7I: ['V7 → I', [[7, 4, '7'], [0, 0, 'maj']], 'The dominant 7th holds a tritone (B and F in C) that splits apart by half steps: B rises to C, F falls to E. That is the strongest pull in tonal music, an authentic cadence.'],
  vii7I: ['vii°7 → I', [[11, 6, 'dim7'], [0, 0, 'maj']], 'A diminished 7th is a V7 without its root: every note is a half or whole step from a note of the home chord, so it snaps into place.'],
  IVI: ['IV → I', [[5, 3, 'maj'], [0, 0, 'maj']], 'The plagal (“amen”) cadence: C stays, F falls a half step to E, A falls a step to G. Gentler than V–I, no leading tone.'],
  ivI: ['iv → I', [[5, 3, 'm'], [0, 0, 'maj']], 'The minor iv (borrowed from C minor): its A♭ sinks a half step to G. Bittersweet and nostalgic.'],
  Vvi: ['V → vi', [[7, 4, 'maj'], [9, 5, 'm']], 'The deceptive cadence: the ear expects home (I) and gets vi. The leading tone still rises to C, but the bass goes up a step instead of down a 5th.'],
  V7vi: ['V7/vi → vi', [[4, 2, '7'], [9, 5, 'm']], 'A secondary dominant: E7 is the V7 of Am, so G♯ rises a half step to A just like B rises to C in G7 → C.'],
  bVIII: ['♭VII → I', [[10, 6, 'maj'], [0, 0, 'maj']], 'The rock cadence: no leading tone; B♭ rises a whole step to C and D and F slide to C and E. Strong but relaxed.'],
  iiV: ['ii → V', [[2, 1, 'm7'], [7, 4, '7']], 'Pre-dominant to dominant: D and F stay or step, C falls to B (the 7th of ii becomes the 3rd of V). The way into a cadence.'],
};
// the two chords voiced like playback (close, smooth), with the bass; and which note each voice goes to
function voicePair(A, B){
  const upA = rootUpper(A), upB = leadUpper(B, upA);
  const bA = 40 + mod(A.rootPc - 4), bB0 = 40 + mod(B.rootPc - 4), bB = [bB0 - 12, bB0, bB0 + 12].reduce((x, y) => Math.abs(y - bA) < Math.abs(x - bA) ? y : x);
  const near = m => upB.reduce((x, y) => Math.abs(y - m) < Math.abs(x - m) ? y : x, upB[0]);
  const voices = [...upA.slice().sort((x, y) => y - x).map(m => ({ from: m, to: near(m) })), { from: bA, to: bB, bass: true }];
  return voices;
}
function pianoRoll(A, B, vs, wrong){
  const all = vs.flatMap(v => [v.from, wrong && v === wrong.v ? wrong.to : v.to]), lo = Math.min(...all) - 1, hi = Math.max(...all) + 1, rows = hi - lo + 1;
  const H = Math.min(9, 240 / rows), W = 300, x0 = 54, cw = 92, gap = 60, top = 18;
  const y = m => top + (hi - m) * H;
  let o = `<svg viewBox="0 0 ${W} ${top + rows * H + 8}" class="ln-roll" role="img" aria-label="How each voice moves">`;
  for (let m = lo; m <= hi; m++){ const blk = [1, 3, 6, 8, 10].includes(mod(m)); o += `<rect x="${x0}" y="${y(m)}" width="${cw * 2 + gap}" height="${H}" fill="${blk ? 'var(--sunk)' : 'none'}" opacity=".6"/>`; if (mod(m) === 0) o += `<text x="${x0 - 6}" y="${y(m) + H - 1}" text-anchor="end" font-size="9" fill="var(--muted)">C${Math.floor(m / 12) - 1}</text>`; }
  o += `<text x="${x0 + cw / 2}" y="12" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">${A.symbol}</text><text x="${x0 + cw * 1.5 + gap}" y="12" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">${B.symbol}</text>`;
  vs.forEach((v, i) => {
    const to = wrong && v === wrong.v ? wrong.to : v.to, d = to - v.from, col = d === 0 ? 'var(--good)' : Math.abs(d) === 1 ? 'var(--root)' : v.bass ? 'var(--muted)' : 'var(--third)';
    o += `<rect x="${x0 + 4}" y="${y(v.from) + 1}" width="${cw - 8}" height="${Math.max(3, H - 2)}" rx="2" fill="${col}"/><rect x="${x0 + cw + gap + 4}" y="${y(to) + 1}" width="${cw - 8}" height="${Math.max(3, H - 2)}" rx="2" fill="${col}"/>`;
    o += `<line x1="${x0 + cw - 4}" y1="${y(v.from) + H / 2}" x2="${x0 + cw + gap + 4}" y2="${y(to) + H / 2}" stroke="${col}" stroke-width="2" ${wrong && v === wrong.v ? 'stroke-dasharray="4 3"' : ''}/>`;
  });
  return o + '</svg>';
}
const mvText = d => d === 0 ? 'stays' : `${d > 0 ? '↑' : '↓'} ${Math.abs(d) === 1 ? 'half step' : Math.abs(d) === 2 ? 'whole step' : Math.abs(d) + ' half steps'}`;
function tensionPair(){
  const k = { pc: K.pc, scale: 'major' };
  if (LW.pair === 'custom'){
    const list = lnChoiceChords();
    return inKeyOf(k, () => [list[LW.pa ?? 4], list[LW.pb ?? 0]]).map(x => x);
  }
  return cOf(k, PAIRS[LW.pair][1]);
}
// the chords offered in "any two chords": the key's chords, their dominants and the common borrowed ones
function lnChoiceChords(){
  return inKeyOf({ pc: K.pc, scale: 'major' }, () => {
    const out = [];
    K.notes.forEach((_, i) => out.push(diatonic(i, false)));
    K.notes.forEach((_, i) => out.push(diatonic(i, true)));
    [[2, 1, '7'], [4, 2, '7'], [9, 5, '7'], [11, 6, 'dim7'], [5, 3, 'm'], [8, 5, 'maj'], [10, 6, 'maj'], [1, 1, 'maj']].forEach(([s, l, q]) => out.push(mkChord(K.pc + s, K.L + l, q)));
    return out;
  });
}
function lessonTension(){
  const [A, B] = tensionPair(), vs = voicePair(A, B);
  // the leading tone (rising a half step) if there is one, else any half step, else any moving voice
  const lt = vs.find(v => !v.bass && v.to - v.from === 1) || vs.find(v => !v.bass && Math.abs(v.to - v.from) === 1) || vs.find(v => !v.bass && v.to !== v.from);
  // the "wrong" version: that voice leaps down to the next note of B instead of resolving
  const bNotes = vs.map(v => v.to), down = lt ? [...new Set(bNotes)].filter(m => m < lt.from - 2).sort((x, y) => y - x)[0] : null;
  LW.wrong = lt && down != null ? { v: lt, to: down } : null;
  LW.voices = vs; LW.AB = [A, B];
  const name = (c, m) => (toneOf(c, m) || { name: nameFor(m) }).name;
  const rows = vs.map((v, i) => `<div class="ln-vrow"><button class="btn sm" data-act="lnVoice" data-i="${i}" aria-label="Play this voice">▶</button><span>${v.bass ? 'Bass' : i === 0 ? 'Top voice' : `Voice ${i + 1}`}</span><b>${name(A, v.from)}</b><span class="an-mv${Math.abs(v.to - v.from) === 1 ? ' half' : v.to === v.from ? ' hold' : ''}">${mvText(v.to - v.from)}</span><b>${name(B, v.to)}</b>${v === lt && !v.bass ? `<small>${Math.abs(v.to - v.from) === 1 ? 'the strongest pull' : 'the main move'}</small>` : ''}</div>`).join('');
  const custom = LW.pair === 'custom', list = custom ? lnChoiceChords() : null;
  const opts = sel => list.map((c, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${c.symbol}</option>`).join('');
  return `<p>Some notes and chords sound at rest; others sound like they need to go somewhere. That pull is ${dfn('tension', 'The feeling that a sound has to move on.')}, and going where it wants is ${dfn('resolution', 'Tension released: the music arrives somewhere stable.')}. Each note of a chord is a ${dfn('voice', 'One line of notes, as if one singer sang it: the top note of each chord, the bass, and so on.')}, and ${dfn('voice leading', 'How each voice moves from one chord to the next: the smaller the moves, the smoother it sounds.')} is how each one moves to the next chord.</p>
    <div class="ln-w"><div class="acts"><label class="fld"><span>Move</span><select id="lnPair">${Object.entries(PAIRS).map(([id, p]) => `<option value="${id}"${id === LW.pair ? ' selected' : ''}>${p[0]}</option>`).join('')}<option value="custom"${custom ? ' selected' : ''}>Any two chords…</option></select></label>
      ${custom ? `<label class="fld"><span>From</span><select id="lnPa">${opts(LW.pa ?? 4)}</select></label><label class="fld"><span>To</span><select id="lnPb">${opts(LW.pb ?? 0)}</select></label>` : ''}
      <span class="hint">in ${esc(makeKey(K.pc, 'major').name)} (the explore key)</span></div>
      <div class="ln-two">${pianoRoll(A, B, vs, null)}<div class="ln-vl">${rows}
        <div class="acts"><button class="btn sm primary" data-act="lnTen" data-arg="both">▶ Both chords</button><button class="btn sm" data-act="lnTen" data-arg="moving">▶ Only the voices that move</button>${LW.wrong ? `<button class="btn sm" data-act="lnTen" data-arg="wrong">▶ The ${name(A, LW.wrong.v.from)} doesn’t resolve</button>` : ''}</div></div></div>
      <p>${custom ? transition(A, B).lines.slice(0, 2).join(' ') : PAIRS[LW.pair][2]}</p>
      ${LW.wrong ? `<p class="hint">Compare with <b>The ${name(A, LW.wrong.v.from)} doesn’t resolve</b>: it jumps down to ${name(B, LW.wrong.to)} instead of moving ${LW.wrong.v.to > LW.wrong.v.from ? 'up' : 'down'} a ${Math.abs(LW.wrong.v.to - LW.wrong.v.from) === 1 ? 'half' : 'whole'} step to ${name(B, LW.wrong.v.to)}. The chord still changes, but the pull is left hanging.</p>` : ''}</div>
    <h4 class="an-h4">Why half steps pull</h4>
    <ul class="an-ul"><li>A note a half step away from a stable note sounds like it is leaning on it. The 7th note of the major scale, a half step under home, is called the ${dfn('leading tone', 'The 7th note of the scale, a half step below the tonic, which pulls up into it.')} because it leads up into the tonic.</li>
      <li>A dominant 7th (G7: G B D F) contains a ${dfn('tritone', '6 half steps, exactly half an octave: the most unstable interval.')}, B–F, the most unstable interval. Its two notes resolve in opposite directions (${dfn('contrary motion', 'Two voices moving in opposite directions.')}): B up to C, F down to E.</li>
      <li>Notes the chords share can simply stay (green), which ties the chords together.</li>
      <li>${dfn('Authentic cadence', 'V (or V7) → I: the strongest ending.')} (V–I) has the leading tone and the tritone; the ${dfn('plagal cadence', 'IV → I, the “amen” ending.')} (IV–I) has neither, so it sounds softer.</li></ul>`;
}

/* ---- 6. Chords outside the key ---- */
const OUT_CARDS = [
  { cat: 'sec', title: 'Secondary dominant (V7/x)', how: 'Pick a chord of the key (not I, not the diminished one) and build a dominant 7th a 5th above it: a major chord with a minor 7th. Its 3rd is a half step under the target’s root.', ex: [[0, 0, 'maj'], [9, 5, '7'], [2, 1, 'm'], [7, 4, '7'], [0, 0, 'maj']], focus: 1, note: 'A7 is the V7 of Dm (V7/ii): its C♯ rises to D.', common: 'Very common', songs: ['eight-days', 'im-so-tired', 'poor-places', 'in-my-life', 'something', 'creep', 'dlbia', 'jesus-etc'] },
  { cat: 'ext', title: 'Extended dominants', how: 'String secondary dominants together, each the V7 of the next, so every chord resolves down a 5th into another dominant until the last one lands.', ex: [[0, 0, 'maj'], [4, 2, '7'], [9, 5, '7'], [2, 1, '7'], [7, 4, '7'], [0, 0, 'maj']], focus: 2, note: 'E7 → A7 → D7 → G7 → C walks round the circle of fifths back home.', common: 'Common (ragtime, jazz, 1960s pop)' },
  { cat: 'lt', title: 'Secondary leading-tone chord (vii°7/x)', how: 'Build a diminished 7th chord a half step below the target’s root. It is a secondary dominant without its root, with every note a step from the target.', ex: [[0, 0, 'maj'], [1, 0, 'dim7'], [2, 1, 'm'], [7, 4, '7'], [0, 0, 'maj']], focus: 1, note: 'C♯°7 slides up into Dm: C♯ → D, E → F, G → F, B♭ → A.', common: 'Common (gospel, show tunes, classical)' },
  { cat: 'ii', title: 'Secondary supertonic: ii–V of X', how: 'Put the ii chord of the target’s key in front of its V7: a minor 7th a whole step above the target (m7♭5 for a minor target), then the V7.', ex: [[0, 0, 'maj'], [9, 5, 'm7'], [2, 1, '7'], [7, 4, 'maj'], [0, 0, 'maj']], focus: 1, note: 'Am7 → D7 → G is a ii–V into G: for two chords G is home.', common: 'Very common in jazz; common in pop bridges', songs: ['yesterday', 'htae'] },
  { cat: 'tz', title: 'Secondary subdominant (IV/x)', how: 'Use the IV chord of another chord’s key, so the target is approached the plagal way.', ex: [[0, 0, 'maj'], [0, 0, '7'], [5, 3, 'maj'], [10, 6, 'maj'], [5, 3, 'maj'], [0, 0, 'maj']], focus: 3, note: 'B♭ is the IV of F (IV/IV): C7 → F → B♭ → F. The same chord is also heard as ♭VII borrowed from C minor.', common: 'Occasional' },
  { cat: 'tz', title: 'Secondary mediant, submediant and subtonic (iii/x, vi/x, ♭VII/x)', how: 'Borrow the iii, vi or ♭VII of another chord’s key. They hint at that key without pulling hard.', ex: [[0, 0, 'maj'], [11, 6, 'm'], [9, 5, 'm'], [2, 1, '7'], [7, 4, 'maj']], focus: 1, note: 'Bm is the iii of G (iii/V): it colors the move toward G.', common: 'Rare: color, not direction' },
  { cat: 'borrowed', title: 'Subtonic ♭VII', how: 'The major chord a whole step below home, borrowed from the parallel minor (or Mixolydian). It walks back up a whole step to I.', ex: [[0, 0, 'maj'], [10, 6, 'maj'], [5, 3, 'maj'], [0, 0, 'maj']], focus: 1, note: 'C → B♭ → F → C: the classic rock move.', common: 'Very common in rock and folk', songs: ['help', 'hey-jude', 'heavy-metal-drummer', 'here-comes-the-sun', 'aditl'] },
  { cat: 'borrowed', title: 'Borrowed chords (modal mixture): iv and ♭VI', how: 'Take a chord from the parallel minor key (same home note, minor scale): iv, ♭VI, ♭III, ♭VII.', ex: [[0, 0, 'maj'], [5, 3, 'maj'], [5, 3, 'm'], [0, 0, 'maj'], [8, 5, 'maj'], [10, 6, 'maj'], [0, 0, 'maj']], focus: 2, note: 'F → Fm → C (A♭ sinks to G), then A♭ → B♭ → C, the ♭VI–♭VII–I lift.', common: 'Very common', songs: ['in-my-life', 'creep', 'michelle', 'karma-police', 'fixing-a-hole', 'here-comes-the-sun'] },
  { cat: 'neap', title: 'Neapolitan (♭II)', how: 'A major chord on the lowered 2nd note (D♭ in C), usually right before V.', ex: [[0, 0, 'maj'], [1, 1, 'maj'], [7, 4, '7'], [0, 0, 'maj']], focus: 1, note: 'D♭ → G7 → C: the D♭ falls a half step to C (via B), very dramatic.', common: 'Occasional (classical, film, metal)' , songs: ['because'] },
  { cat: 'tritone', title: 'Tritone substitute (subV7)', how: 'Replace a V7 with the dominant 7th a tritone away: they share the same tritone, and the bass slides down a half step into the target.', ex: [[0, 0, 'maj'], [2, 1, 'm7'], [1, 1, '7'], [0, 0, 'maj']], focus: 2, note: 'Dm7 → D♭7 → C instead of Dm7 → G7 → C.', common: 'Common in jazz and soul' },
  { cat: 'mediant', title: 'Chromatic mediants', how: 'A major or minor chord a 3rd away from another chord with an unexpected quality, keeping one note in common.', ex: [[0, 0, 'maj'], [4, 2, 'maj'], [0, 0, 'maj'], [8, 5, 'maj'], [0, 0, 'maj']], focus: 1, note: 'C → E → C → A♭ → C: one note stays each time (E, then C), everything else shifts.', common: 'Occasional (film music, prog, some pop)' },
];
function lessonOutside(){
  return `<p>Most songs mostly use the 7 chords of their key. A chord with a note from outside the key stands out: it adds color or a stronger pull. Almost every outside chord is borrowed from somewhere nearby: from the key of another chord (${dfn('secondary', 'A chord that works for another chord of the key the way V works for I.')} chords, a brief ${dfn('tonicization', 'Treating a chord other than I as home for a moment.')}) or from the ${dfn('parallel key', 'The key with the same home note but the other mode: C major and C minor.')} (${dfn('borrowed', 'Taken from the parallel key: modal mixture.')} chords). Examples are in C major; ▶ plays them, and <b>Open in analyzer</b> shows where each note comes from.</p>
    <div class="ln-cards2">${OUT_CARDS.map((c, i) => { const chs = exChords(c.ex), rns = inKeyOf(C_MAJOR, () => ctxRns(chs)), use = AN_USE[c.cat] || {}; return `<div class="ln-oc panel"><h4>${c.title}</h4><p class="mono ln-ex">${chs.map((ch, j) => `<span class="${j === c.focus ? 'ln-f' : ''}">${ch.symbol}<small>${rns[j]}</small></span>`).join('')}</p>
      <div class="acts"><button class="btn sm primary" data-act="lnOut" data-i="${i}">▶ Hear it resolve</button><button class="btn sm" data-act="lnOutAn" data-i="${i}">Open in analyzer</button><span class="pill k-ok">${c.common}</span></div>
      <p><b>How to build it:</b> ${c.how} ${c.note}</p>${use.place ? `<p><b>Where it works:</b> ${use.place}</p>` : ''}${use.not ? `<p><b>When it doesn’t:</b> ${use.not}</p>` : ''}${exLinks(c.songs)}</div>`; }).join('')}</div>`;
}

/* ---- 7. Modulation ---- */
const MODS = [
  { title: 'Pivot chord', to: 'G major', ex: [[0, 0, 'maj'], [5, 3, 'maj'], [9, 5, 'm'], [2, 1, '7'], [7, 4, 'maj'], [0, 0, 'maj'], [7, 4, 'maj']], text: 'Find a chord both keys share and use it as the hinge. Am is vi in C and ii in G, so after Am the D7 (V7 of G) tips the music into G.', where: 'The smoothest way into a new section: a bridge, or a verse that moves to the dominant key.', songs: ['penny-lane'] },
  { title: 'Through the new key’s V7', to: 'E♭ major', ex: [[0, 0, 'maj'], [5, 3, 'maj'], [7, 4, 'maj'], [10, 6, '7'], [3, 2, 'maj']], text: 'Just play the dominant 7th of the new key: B♭7 points straight at E♭. No shared chord is needed; the V7 does the work.', where: 'Into a chorus or a bridge in a more distant key, when you want a clear, deliberate change.' },
  { title: 'Direct (“truck-driver”) lift', to: 'D major', ex: [[0, 0, 'maj'], [9, 5, 'm'], [5, 3, 'maj'], [7, 4, 'maj'], [2, 1, 'maj'], [11, 6, 'm'], [7, 4, 'maj'], [9, 5, 'maj']], text: 'Simply start the next section a half or whole step higher with no preparation. The jump itself is the effect: a burst of energy.', where: 'The last chorus. Used so often in pop that it can sound cheesy; works best once, near the end.', songs: ['aditl'] },
  { title: 'Borrowed pivot', to: 'A♭ major', ex: [[0, 0, 'maj'], [5, 3, 'maj'], [5, 3, 'm'], [3, 2, '7'], [8, 5, 'maj']], text: 'When the two keys share no chord, borrow one: Fm is iv in C (from C minor) and vi in A♭. Then E♭7, the V7 of A♭, lands it.', where: 'A dramatic shift to a distant, darker or warmer key: a bridge or an outro.' },
];
function lessonModulation(){
  return `<p>A ${dfn('modulation', 'Moving the music’s home to a new key, for a while or for good.')} (key change) moves home somewhere else. A brief visit (a few chords, like a secondary dominant) is a tonicization; a real modulation stays long enough that the new tonic feels like home. Examples start in C major.</p>
    <div class="ln-cards2">${MODS.map((m, i) => { const chs = exChords(m.ex); return `<div class="ln-oc panel"><h4>${m.title} <span class="muted">→ ${m.to}</span></h4><p class="mono ln-ex">${chs.map(c => `<span>${c.symbol}</span>`).join('')}</p>
      <div class="acts"><button class="btn sm primary" data-act="lnMod" data-i="${i}">▶ Hear it</button><button class="btn sm" data-act="lnModAn" data-i="${i}">Open in analyzer</button></div>
      <p>${m.text}</p><p><b>Where it goes:</b> ${m.where}</p>${exLinks(m.songs)}</div>`; }).join('')}</div>
    ${exLinks(['something', 'htae', 'penny-lane', 'aditl'])}
    <h4 class="an-h4">Where key changes go in a song</h4>
    <ul class="an-ul"><li><b>Into the chorus</b>: a pre-chorus that ends on the new key’s V7 makes the chorus burst out in the new key.</li>
      <li><b>The bridge</b>: the classic place to visit another key (often IV, the relative minor, or a key a 3rd away) and come back home for the last chorus.</li>
      <li><b>The final chorus</b>: lift it up a half or whole step for a big finish.</li></ul>
    <p>The <b>Song builder</b> lets each section have its own key and suggests these moves between sections (pivot chords, the new key’s V7, the last-chorus lift) under <i>Key changes and transitions</i>.</p>
    <div class="acts"><button class="btn sm" data-act="tab" data-tab="song">Open the Song builder</button></div>`;
}

/* ---- The tab ---- */
const LESSON_HTML = { notes: lessonNotes, scales: lessonScales, chords: lessonChords, circle: lessonCircle, tension: lessonTension, outside: lessonOutside, modulation: lessonModulation };
function renderLearn(){
  const el = $('#p-learn'), cur = LESSONS.find(l => l.id === S.learnLesson) || LESSONS[0], i = LESSONS.indexOf(cur);
  el.innerHTML = `<div class="sec-h"><h2>Learn</h2><p class="hint">Short lessons with something to play with in each. Everything here uses the explore key in the header and never changes your progression or song.</p></div>
    <div class="learn">
      <nav class="ln-nav" aria-label="Lessons">${LESSONS.map((l, j) => `<button data-act="lnGo" data-id="${l.id}" aria-current="${l === cur}"><span class="mono">${j + 1}</span>${l.name}</button>`).join('')}</nav>
      <label class="fld ln-pick"><span>Lesson</span><select id="lnPick">${LESSONS.map((l, j) => `<option value="${l.id}"${l === cur ? ' selected' : ''}>${j + 1}. ${l.name}</option>`).join('')}</select></label>
      <article class="ln-body"><h3>${i + 1}. ${cur.name}</h3>${LESSON_HTML[cur.id]()}
        <div class="ln-next">${i > 0 ? `<button class="btn sm" data-act="lnGo" data-id="${LESSONS[i - 1].id}">‹ ${LESSONS[i - 1].name}</button>` : '<span></span>'}${i < LESSONS.length - 1 ? `<button class="btn sm primary" data-act="lnGo" data-id="${LESSONS[i + 1].id}">${LESSONS[i + 1].name} ›</button>` : ''}</div></article>
    </div>`;
}
function lnSetKey(pc, scale){ keyWhy('learn'); S.keyPc = mod(pc); S.scale = scale; ui.focus = null; renderAll(); }
const lnChordMidis = ch => [pianoBass(ch) + 12, ...rootUpper(ch)];
Object.assign(ACT, {
  lnGo: el => { S.learnLesson = el.dataset.id; save(); renderLearn(); const t = $('#p-learn'); if (t && t.getBoundingClientRect().top < 0) showTabTop(); },
  lnNote: el => { const pc = +el.dataset.pc; if (LW.pick === 0) LW.a = pc; else LW.b = pc; LW.pick = 1 - LW.pick; lnPlay([[0, [60 + pc], 0.8]]); renderLearn(); },
  lnIv: el => { const a = 60 + LW.a, b = a + (mod(LW.b - LW.a) || 12); lnPlay(el.dataset.arg === 'apart' ? [[0, [a], 0.9], [0.7, [b], 1.2]] : [[0, [a, b], 1.6]]); },
  lnStep: () => {
    const k = makeKey(LW.start, LW.pat), n = k.notes.length;
    LW.step = LW.step >= n ? 0 : LW.step + 1;
    const base = 60 + (LW.start > 7 ? LW.start - 12 : LW.start);
    if (LW.step > 0) lnPlay([[0, [base + k.notes[LW.step - 1].semis], 0.7]]);
    if (LW.step === n) lnPlay([[0.45, [base + 12], 0.9]]);
    renderLearn();
  },
  lnScalePlay: () => { const k = makeKey(LW.start, LW.pat), base = 60 + (LW.start > 7 ? LW.start - 12 : LW.start); lnPlay([...k.notes.map(x => x.semis), 12].map((s, i) => [i * 0.3, [base + s], 0.5])); LW.step = k.notes.length; renderLearn(); },
  lnMode: el => { LW.start = +el.dataset.pc; LW.pat = el.dataset.id; LW.step = 7; renderLearn(); ACT.lnScalePlay(); },
  lnSev: el => { LW.sev = el.dataset.v === '1'; renderLearn(); },
  lnChord: el => {
    const k = K.hept ? { pc: K.pc, scale: K.sc.id } : { pc: K.pc, scale: K.majorish ? 'major' : 'aeolian' };
    const ch = inKeyOf(k, () => diatonic(+el.dataset.i, LW.sev)); lnPlay([[0, lnChordMidis(ch), 1.4]]);
  },
  lnCad: () => {
    const k = K.hept ? { pc: K.pc, scale: K.sc.id } : { pc: K.pc, scale: K.majorish ? 'major' : 'aeolian' };
    previewSeq(inKeyOf(k, () => [0, 3, 4, 0].map(i => diatonic(i, LW.sev))), 0.9);
  },
  lnCirc: el => {
    const pos = +el.dataset.pos, minor = el.dataset.minor === '1';
    LW.prevCirc = LW.circ; LW.circ = { pos, minor };
    const majPc = pos * 7;
    lnSetKey(minor ? majPc + 9 : majPc, minor ? 'aeolian' : 'major');
  },
  lnCircPlay: () => {
    const s = LW.circ, majPc = mod(s.pos * 7), k = s.minor ? { pc: mod(majPc + 9), scale: 'harmonic' } : { pc: majPc, scale: 'major' };
    previewSeq(inKeyOf(k, () => [0, 3, 4, 0].map(i => diatonic(i, false))), 0.9);
  },
  lnNotePlay: el => lnPlay([[0, [+el.dataset.m], 0.9]]),
  lnKeyScale: el => { const k = makeKey(+el.dataset.pc, el.dataset.sc), base = 60 + (k.pc > 7 ? k.pc - 12 : k.pc); lnPlay([...k.notes.map(x => x.semis), 12].map((s, i) => [i * 0.3, [base + s], 0.5])); },
  // the relative major's scale, then the relative minor's: the same notes from another home
  lnRelPlay: el => {
    const majPc = mod(+el.dataset.pos * 7), M = makeKey(majPc, 'major'), base = 60 + (majPc > 7 ? majPc - 12 : majPc);
    const up = (b, k) => [...k.notes.map(x => x.semis), 12].map(s => b + s);
    const notes = [...up(base, M), ...up(base - 3, makeKey(majPc + 9, 'aeolian'))];
    lnPlay(notes.map((m, i) => [i * 0.28 + (i >= 8 ? 0.5 : 0), [m], 0.45]));
  },
  lnVoice: el => { const v = LW.voices[+el.dataset.i]; if (v) lnPlay([[0, [v.from], 0.8], [0.8, [v.to], 1.1]]); },
  lnTen: el => {
    const vs = LW.voices, w = LW.wrong, arg = el.dataset.arg;
    if (arg === 'moving'){ const mv = vs.filter(v => v.to !== v.from); lnPlay([[0, mv.map(v => v.from), 1], [1, mv.map(v => v.to), 1.5]]); }
    else lnPlay([[0, vs.map(v => v.from), 1], [1, vs.map(v => arg === 'wrong' && w && v === w.v ? w.to : v.to), 1.6]]);
  },
  lnOut: el => { const c = OUT_CARDS[+el.dataset.i]; previewSeq(exChords(c.ex), 0.9); },
  lnOutAn: el => { const c = OUT_CARDS[+el.dataset.i]; anOpenWith({ chs: exChords(c.ex), key: C_MAJOR, focus: c.focus, view: 'chord', title: c.title }); },
  lnMod: el => { const m = MODS[+el.dataset.i]; previewSeq(exChords(m.ex), 0.85); },
  lnModAn: el => { const m = MODS[+el.dataset.i]; anOpenWith({ chs: exChords(m.ex), key: C_MAJOR, focus: 0, view: 'prog', title: `${m.title} → ${m.to}` }); },
});
document.addEventListener('change', e => {
  const t = e.target, v = t.value;
  if (t.id === 'lnPick'){ S.learnLesson = v; save(); renderLearn(); }
  else if (t.id === 'lnA'){ LW.a = +v; renderLearn(); }
  else if (t.id === 'lnB'){ LW.b = +v; renderLearn(); }
  else if (t.id === 'lnStart'){ LW.start = +v; LW.step = 0; renderLearn(); }
  else if (t.id === 'lnPat'){ LW.pat = v; LW.step = 0; renderLearn(); }
  else if (t.id === 'lnSig'){ LW.sig = t.checked; renderLearn(); }
  else if (t.id === 'lnWedge'){ LW.wedge = t.checked; renderLearn(); }
  else if (t.id === 'lnPair'){ LW.pair = v; renderLearn(); }
  else if (t.id === 'lnPa'){ LW.pa = +v; renderLearn(); }
  else if (t.id === 'lnPb'){ LW.pb = +v; renderLearn(); }
});
