'use strict';
/* ================= Theory core ================= */
const LET = ['C','D','E','F','G','A','B'];
const LPC = [0,2,4,5,7,9,11];
const NUM = ['I','II','III','IV','V','VI','VII'];
const mod = (n, m = 12) => ((n % m) + m) % m;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function accS(n){
  if (n === 0) return '';
  if (n === 1) return '♯';
  if (n === -1) return '♭';
  if (n === 2) return '𝄪';
  if (n === -2) return '𝄫';
  return n > 0 ? '♯'.repeat(n) : '♭'.repeat(-n);
}
const sacc = (l, pc) => mod(pc - LPC[mod(l, 7)] + 6) - 6;
const spell = (l, pc) => LET[mod(l, 7)] + accS(sacc(l, pc));
const MAJ_SEMIS = num => LPC[(num - 1) % 7] + 12 * Math.floor((num - 1) / 7);

function parseDeg(lbl){
  let acc = 0, i = 0;
  while (i < lbl.length){
    const cp = lbl.codePointAt(i);
    if (cp === 0x266D){ acc--; i++; }
    else if (cp === 0x266F){ acc++; i++; }
    else if (cp === 0x1D12B){ acc -= 2; i += 2; }
    else if (cp === 0x1D12A){ acc += 2; i += 2; }
    else break;
  }
  const num = parseInt(lbl.slice(i), 10);
  return { num, acc, semis: MAJ_SEMIS(num) + acc, step: (num - 1) % 7 };
}

const INTNAME = {'1':'root','♭2':'minor 2nd','2':'major 2nd','♯2':'augmented 2nd','♭3':'minor 3rd','3':'major 3rd','♭4':'diminished 4th','4':'perfect 4th','♯4':'augmented 4th','♭5':'diminished 5th','5':'perfect 5th','♯5':'augmented 5th','♭6':'minor 6th','6':'major 6th','𝄫7':'diminished 7th','♭7':'minor 7th','7':'major 7th','♭9':'minor 9th','9':'major 9th','♯9':'augmented 9th','11':'perfect 11th','♯11':'augmented 11th','♭13':'minor 13th','13':'major 13th'};
const SEMI_NAME = ['unison / octave','minor 2nd (half step)','major 2nd (whole step)','minor 3rd','major 3rd','perfect 4th','tritone','perfect 5th','minor 6th','major 6th','minor 7th','major 7th'];
const CHROMA_DEG = ['1','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'];
const roleOf = num => num === 1 ? 'r' : num === 3 ? 't' : num === 5 ? 'f' : num === 7 ? 's' : (num === 2 || num === 4) ? 't' : 'x';

/* ---- chord qualities: id, suffix, name, group, formula ((x) = may be omitted) ---- */
const QDEF = [
  ['maj','','Major triad','Triads','1 3 5'],
  ['m','m','Minor triad','Triads','1 ♭3 5'],
  ['5','5','Power chord','Triads','1 5'],
  ['dim','°','Diminished triad','Triads','1 ♭3 ♭5'],
  ['aug','+','Augmented triad','Triads','1 3 ♯5'],
  ['b5','(♭5)','Major flat 5','Triads','1 3 ♭5'],
  ['sus2','sus2','Suspended 2nd','Suspended','1 2 5'],
  ['sus4','sus4','Suspended 4th','Suspended','1 4 5'],
  ['6','6','Major 6th','Sixths & adds','1 3 (5) 6'],
  ['m6','m6','Minor 6th','Sixths & adds','1 ♭3 (5) 6'],
  ['add9','add9','Add 9','Sixths & adds','1 3 (5) 9'],
  ['madd9','m(add9)','Minor add 9','Sixths & adds','1 ♭3 (5) 9'],
  ['69','6/9','Six-nine','Sixths & adds','1 3 (5) 6 9'],
  ['7','7','Dominant 7th','Sevenths','1 3 (5) ♭7'],
  ['maj7','maj7','Major 7th','Sevenths','1 3 (5) 7'],
  ['m7','m7','Minor 7th','Sevenths','1 ♭3 (5) ♭7'],
  ['m7b5','m7♭5','Half-diminished 7th','Sevenths','1 ♭3 ♭5 ♭7'],
  ['dim7','°7','Diminished 7th','Sevenths','1 ♭3 ♭5 𝄫7'],
  ['mmaj7','m(maj7)','Minor-major 7th','Sevenths','1 ♭3 (5) 7'],
  ['7sus4','7sus4','Dominant 7th sus4','Suspended','1 4 (5) ♭7'],
  ['maj7s5','maj7♯5','Augmented major 7th','Sevenths','1 3 ♯5 7'],
  ['7s5','7♯5','Augmented 7th','Sevenths','1 3 ♯5 ♭7'],
  ['7b5','7♭5','Dominant 7th flat 5','Sevenths','1 3 ♭5 ♭7'],
  ['9','9','Dominant 9th','Extended','1 3 (5) ♭7 9'],
  ['maj9','maj9','Major 9th','Extended','1 3 (5) 7 9'],
  ['m9','m9','Minor 9th','Extended','1 ♭3 (5) ♭7 9'],
  ['9sus4','9sus4','Dominant 9th sus4','Suspended','1 4 (5) ♭7 9'],
  ['11','11','Dominant 11th','Extended','1 (3) (5) ♭7 9 11'],
  ['m11','m11','Minor 11th','Extended','1 ♭3 (5) ♭7 (9) 11'],
  ['13','13','Dominant 13th','Extended','1 3 (5) ♭7 (9) 13'],
  ['maj13','maj13','Major 13th','Extended','1 3 (5) 7 (9) 13'],
  ['m13','m13','Minor 13th','Extended','1 ♭3 (5) ♭7 (9) 13'],
  ['7b9','7♭9','Dominant 7th flat 9','Altered','1 3 (5) ♭7 ♭9'],
  ['7s9','7♯9','Dominant 7th sharp 9','Altered','1 3 (5) ♭7 ♯9'],
  ['7s11','7♯11','Lydian dominant 7th','Altered','1 3 (5) ♭7 ♯11'],
  ['maj7s11','maj7♯11','Lydian major 7th','Altered','1 3 (5) 7 ♯11'],
  ['7b13','7♭13','Dominant 7th flat 13','Altered','1 3 5 ♭7 ♭13'],
  ['dimmaj7','°(maj7)','Diminished major 7th','Altered','1 ♭3 ♭5 7'],
  // two-note intervals (dyads), named by their notes, lower note first: C–B
  ['m2','(m2)','Minor 2nd interval','Intervals','1 ♭2'],
  ['M2','(M2)','Major 2nd interval','Intervals','1 2'],
  ['m3i','(m3)','Minor 3rd interval','Intervals','1 ♭3'],
  ['M3i','(M3)','Major 3rd interval','Intervals','1 3'],
  ['P4','(P4)','Perfect 4th interval','Intervals','1 4'],
  ['TT','(TT)','Tritone interval','Intervals','1 ♭5'],
  ['m6i','(m6)','Minor 6th interval','Intervals','1 ♭6'],
  ['M6i','(M6)','Major 6th interval','Intervals','1 6'],
  ['m7i','(m7)','Minor 7th interval','Intervals','1 ♭7'],
  ['M7i','(M7)','Major 7th interval','Intervals','1 7'],
];
// the interval type for a number of semitones (a 5th is the power chord)
const DYAD_BY_SEMIS = { 1: 'm2', 2: 'M2', 3: 'm3i', 4: 'M3i', 5: 'P4', 6: 'TT', 7: '5', 8: 'm6i', 9: 'M6i', 10: 'm7i', 11: 'M7i' };
const QMAP = {}, QLIST = [], QBYSEMIS = {};
function buildQ(id, sfx, name, group, tones, rank){
  const q = { id, sfx, name, group, rank, tones };
  q.full = tones.map(t => mod(t.semis));
  q.req = tones.filter(t => !t.opt).map(t => mod(t.semis));
  q.minor = tones.some(t => t.num === 3 && mod(t.semis) === 3) && !tones.some(t => t.num === 3 && mod(t.semis) === 4);
  q.formula = tones.map(t => t.opt ? `(${t.lbl})` : t.lbl).join(' ');
  q.dyad = group === 'Intervals';
  return q;
}
QDEF.forEach(([id, sfx, name, group, f], rank) => {
  const tones = f.split(' ').map(tok => {
    const opt = tok.startsWith('(');
    const lbl = tok.replace(/[()]/g, '');
    const p = parseDeg(lbl);
    return { lbl, opt, num: p.num, semis: p.semis, step: p.step, role: roleOf(p.num) };
  });
  const q = buildQ(id, sfx, name, group, tones, rank);
  QMAP[id] = q; QLIST.push(q);
  const k = tones.map(t => t.semis).join(',');
  if (!QBYSEMIS[k]) QBYSEMIS[k] = id;
});
const QGROUPS = [...new Set(QLIST.map(q => q.group))];

function qualityForStack(semis){
  const k = semis.join(',');
  if (QBYSEMIS[k]) return QBYSEMIS[k];
  const id = 'x' + k;
  if (!QMAP[id]){
    const tones = semis.map((s, i) => {
      const num = 2 * i + 1, acc = s - MAJ_SEMIS(num), lbl = accS(acc) + num;
      return { lbl, opt: false, num, semis: s, step: (num - 1) % 7, role: roleOf(num) };
    });
    QMAP[id] = buildQ(id, '(' + tones.slice(1).map(t => t.lbl).join(' ') + ')', 'Unusual stack', 'Other', tones, 99);
    QBYSEMIS[k] = id;
  }
  return id;
}

const RNSFX = { maj:'', m:'', dim:'°', aug:'+', maj7:'maj7', '7':'7', m7:'7', m7b5:'ø7', dim7:'°7', mmaj7:'(maj7)', maj7s5:'+maj7', '7s5':'+7', m6:'6', madd9:'(add9)', m9:'9', m11:'11', m13:'13', '5':'5' };
const rnSuffix = q => RNSFX[q.id] ?? q.sfx;
function romanStr(num, acc, q){
  const base = NUM[(num - 1) % 7];
  return accS(acc) + (q.minor ? base.toLowerCase() : base) + rnSuffix(q);
}

/* ---- scales ---- */
const SCDEF = [
  ['major','Major (Ionian)','major','Major modes','1 2 3 4 5 6 7','major',1,'The reference scale: bright and settled. Every mode is described by how it differs from this one.'],
  ['dorian','Dorian','Dorian','Major modes','1 2 ♭3 4 5 6 ♭7','major',2,'Minor with a raised 6th. Soulful and a little hopeful, as in “So What” and “Oye Como Va”. The major IV chord is its fingerprint.'],
  ['phrygian','Phrygian','Phrygian','Major modes','1 ♭2 ♭3 4 5 ♭6 ♭7','major',3,'Minor with a lowered 2nd. Dark and Spanish-tinged; the ♭II chord a half step above home does the heavy lifting.'],
  ['lydian','Lydian','Lydian','Major modes','1 2 3 ♯4 5 6 7','major',4,'Major with a raised 4th. Floating and cinematic; the major II chord gives it away.'],
  ['mixolydian','Mixolydian','Mixolydian','Major modes','1 2 3 4 5 6 ♭7','major',5,'Major with a lowered 7th. Home ground for rock, folk and blues; ♭VII–IV–I is its signature move.'],
  ['aeolian','Natural minor (Aeolian)','minor','Major modes','1 2 ♭3 4 5 ♭6 ♭7','major',6,'The plain minor scale. Moody and open; ♭VI and ♭VII carry most minor-key songs.'],
  ['locrian','Locrian','Locrian','Major modes','1 ♭2 ♭3 4 ♭5 ♭6 ♭7','major',7,'The tonic chord is diminished, so home never feels settled. Mostly heard in metal and jazz.'],
  ['harmonic','Harmonic minor','harmonic minor','Harmonic minor modes','1 2 ♭3 4 5 ♭6 7','harmonic',1,'Natural minor with a raised 7th. The leading tone gives a true major V and a strong pull home, plus an exotic augmented 2nd between ♭6 and 7.'],
  ['locrian6','Locrian ♮6','Locrian ♮6','Harmonic minor modes','1 ♭2 ♭3 4 ♭5 6 ♭7','harmonic',2,'Second mode of harmonic minor: Locrian with a brighter major 6th.'],
  ['ionian5','Ionian ♯5','Ionian ♯5','Harmonic minor modes','1 2 3 4 ♯5 6 7','harmonic',3,'Major with a raised 5th, so the tonic chord turns augmented.'],
  ['dorian4','Dorian ♯4','Dorian ♯4','Harmonic minor modes','1 2 ♭3 ♯4 5 6 ♭7','harmonic',4,'Dorian with a raised 4th. Heard in Eastern European and klezmer music.'],
  ['phrygdom','Phrygian dominant','Phrygian dominant','Harmonic minor modes','1 ♭2 3 4 5 ♭6 ♭7','harmonic',5,'Fifth mode of harmonic minor. Flamenco, klezmer and metal: a major tonic chord with a ♭2 hovering above it.'],
  ['lydian2','Lydian ♯2','Lydian ♯2','Harmonic minor modes','1 ♯2 3 ♯4 5 6 7','harmonic',6,'Lydian with a raised 2nd. Bright and strange.'],
  ['ultraloc','Ultralocrian','Ultralocrian','Harmonic minor modes','1 ♭2 ♭3 ♭4 ♭5 ♭6 𝄫7','harmonic',7,'Seventh mode of harmonic minor, built on the leading tone. Its tonic chord is a diminished 7th.'],
  ['melodic','Melodic minor (jazz minor)','melodic minor','Melodic minor modes','1 2 ♭3 4 5 6 7','melodic',1,'Minor with a raised 6th and 7th. Smooth and modern; the parent of many jazz sounds.'],
  ['dorianb2','Dorian ♭2','Dorian ♭2','Melodic minor modes','1 ♭2 ♭3 4 5 6 ♭7','melodic',2,'Second mode of melodic minor. Dorian with a dark ♭2; fits sus♭9 chords.'],
  ['lydaug','Lydian augmented','Lydian augmented','Melodic minor modes','1 2 3 ♯4 ♯5 6 7','melodic',3,'Lydian with a raised 5th. The sound of maj7♯5.'],
  ['lyddom','Lydian dominant','Lydian dominant','Melodic minor modes','1 2 3 ♯4 5 6 ♭7','melodic',4,'Mixolydian with a ♯4. The sound of 7♯11 chords and tritone substitutes (and the Simpsons theme).'],
  ['mixob6','Mixolydian ♭6','Mixolydian ♭6','Melodic minor modes','1 2 3 4 5 ♭6 ♭7','melodic',5,'Major on the bottom, minor on top. Bittersweet.'],
  ['locrian2','Locrian ♮2','Locrian ♮2','Melodic minor modes','1 2 ♭3 4 ♭5 ♭6 ♭7','melodic',6,'The go-to scale for m7♭5 chords in jazz.'],
  ['altered','Altered (Super Locrian)','altered','Melodic minor modes','1 ♭2 ♭3 ♭4 ♭5 ♭6 ♭7','melodic',7,'Every tension a dominant chord can carry (♭9, ♯9, ♭5, ♯5). Played over V7 chords about to resolve.'],
  ['majpent','Major pentatonic','major pentatonic','Pentatonic & blues','1 2 3 5 6',null,0,'Five notes and no half steps, so nothing clashes. Country, pop and rock melodies.'],
  ['minpent','Minor pentatonic','minor pentatonic','Pentatonic & blues','1 ♭3 4 5 ♭7',null,0,'The first soloing scale most guitarists learn. Rock and blues.'],
  ['blues','Blues','blues','Pentatonic & blues','1 ♭3 4 ♭5 5 ♭7',null,0,'Minor pentatonic plus the ♭5 “blue note”.'],
  ['majblues','Major blues','major blues','Pentatonic & blues','1 2 ♭3 3 5 6',null,0,'Major pentatonic plus a ♭3 that slides up into the 3rd.'],
  ['wholetone','Whole tone','whole tone','Symmetric','1 2 3 ♯4 ♯5 ♭7',null,0,'Six whole steps and no sense of home. Dreamy; fits 7♯5 and augmented chords.'],
  ['dimhw','Diminished (half–whole)','half–whole diminished','Symmetric','1 ♭2 ♭3 3 ♯4 5 6 ♭7',null,0,'Alternating half and whole steps. Fits 7♭9 dominant chords.'],
  ['dimwh','Diminished (whole–half)','whole–half diminished','Symmetric','1 2 ♭3 4 ♭5 ♭6 6 7',null,0,'Alternating whole and half steps. Fits diminished 7th chords.'],
  ['dblharm','Double harmonic','double harmonic','Exotic','1 ♭2 3 4 5 ♭6 7',null,0,'Two augmented 2nds. Middle Eastern and surf-rock flavor (“Misirlou”).'],
  ['hungmin','Hungarian minor','Hungarian minor','Exotic','1 2 ♭3 ♯4 5 ♭6 7',null,0,'Harmonic minor with a raised 4th. Dramatic and gypsy-jazz flavored.'],
  ['bebopdom','Bebop dominant','bebop dominant','Exotic','1 2 3 4 5 6 ♭7 7',null,0,'Mixolydian with an added major 7th, so chord tones land on the beat in eighth-note lines.'],
];
const SC = {}, SCLIST = [];
SCDEF.forEach(([id, name, short, group, f, fam, mode, blurb]) => {
  const degs = f.split(' ').map(lbl => ({ lbl, ...parseDeg(lbl) }));
  const s = { id, name, short, group, degs, fam, mode, blurb };
  SC[id] = s; SCLIST.push(s);
});
const SCGROUPS = [...new Set(SCLIST.map(s => s.group))];
const FAMILY_PARENT = { major:'major', harmonic:'harmonic', melodic:'melodic' };

function chooseLetter(pc, degs){
  let best = null;
  for (let l = 0; l < 7; l++){
    if (Math.abs(sacc(l, pc)) > 1) continue;
    let cost = Math.abs(sacc(l, pc)) * 0.5;
    for (const d of degs){ const a = Math.abs(sacc(l + d.step, pc + d.semis)); cost += a > 1 ? a * 3 : a; }
    if (!best || cost < best.c) best = { l, c: cost };
  }
  return best.l;
}

/* ---- the current key (set by computeKey) ---- */
let K = null;
function makeKey(pc, scaleId){
  const sc = SC[scaleId];
  const L = chooseLetter(pc, sc.degs);
  const notes = sc.degs.map(d => ({ ...d, pc: mod(pc + d.semis), name: spell(L + d.step, pc + d.semis) }));
  const pcs = new Set(notes.map(n => n.pc));
  const hept = notes.length === 7 && new Set(notes.map(n => n.step)).size === 7;
  const fl = notes.filter(n => /♭|𝄫/.test(n.name)).length, sh = notes.filter(n => /♯|𝄪/.test(n.name)).length;
  return { pc, L, sc, notes, pcs, hept, flat: fl > sh ? true : fl < sh ? false : null,
    name: notes[0].name + ' ' + sc.short, majorish: pcs.has(mod(pc + 4)) && !pcs.has(mod(pc + 3)) };
}
const CONV_LETTER = { 1:1, 3:2, 6:3, 8:5, 10:6 };
function letterFor(pc){
  pc = mod(pc);
  const n = K.notes.find(x => x.pc === pc);
  if (n) return mod(K.L + n.step, 7);
  const nat = LPC.indexOf(pc);
  if (nat >= 0) return nat;
  if (K.flat === null) return CONV_LETTER[pc];
  return K.flat ? LPC.indexOf(mod(pc + 1)) : LPC.indexOf(mod(pc - 1));
}
const nameFor = pc => spell(letterFor(pc), mod(pc));
const midiName = m => nameFor(m) + (Math.floor(m / 12) - 1);

function degreeLabel(pc){
  const rel = mod(pc - K.pc);
  const n = K.notes.find(x => x.pc === mod(pc));
  return n ? n.lbl : CHROMA_DEG[rel];
}

/* ---- chords ---- */
function mkChord(rootPc, rootL, qid, bassPc = null){
  rootPc = mod(rootPc); const q = QMAP[qid];
  const tones = q.tones.map(t => ({ ...t, pc: mod(rootPc + t.semis), name: spell(rootL + t.step, rootPc + t.semis) }));
  const pcs = [...new Set(tones.map(t => t.pc))];
  let bassName = null;
  // an interval is written as its two notes (C–B); its lower note is its root, so it has no slash form
  if (bassPc != null && mod(bassPc) !== rootPc && !q.dyad){
    bassPc = mod(bassPc);
    const bt = tones.find(t => t.pc === bassPc);
    bassName = bt ? bt.name : nameFor(bassPc);
  } else bassPc = null;
  return { rootPc, rootL: mod(rootL, 7), qid, q, tones, pcs, reqPcs: [...new Set(tones.filter(t => !t.opt).map(t => t.pc))],
    rootName: tones[0].name, bassPc, bassName, symbol: q.dyad ? `${tones[0].name}–${tones[1].name}` : tones[0].name + q.sfx + (bassName ? '/' + bassName : '') };
}
const chordAt = (rootPc, qid, bassPc = null, rootL = null) => mkChord(rootPc, rootL ?? letterFor(rootPc), qid, bassPc);
const toneOf = (ch, pc) => ch && ch.tones.find(t => t.pc === mod(pc));
function relLabel(ch, pc){
  const t = toneOf(ch, pc);
  if (t) return t.lbl === '1' ? 'R' : t.lbl;
  return CHROMA_DEG[mod(pc - ch.rootPc)];
}
function roleIn(ch, pc){ const t = toneOf(ch, pc); return t ? t.role : 'x'; }
const hasRel = (ch, s) => ch.pcs.includes(mod(ch.rootPc + s));
const toneName = (ch, s) => { const t = ch.tones.find(t => mod(t.semis) === mod(s)); return t ? t.name : nameFor(ch.rootPc + s); };

function stackChord(notes, L, i, sev){
  const idxs = sev ? [0,2,4,6] : [0,2,4];
  const semis = idxs.map(k => { const j = i + k; return notes[j % 7].semis + 12 * Math.floor(j / 7) - notes[i].semis; });
  return mkChord(notes[i].pc, mod(L + notes[i].step, 7), qualityForStack(semis));
}
const diatonic = (i, sev) => stackChord(K.notes, K.L, i, sev);
function parallelNotes(scaleId){
  const sc = SC[scaleId];
  return sc.degs.map(d => ({ ...d, pc: mod(K.pc + d.semis) }));
}
const scalePcs = id => new Set(SC[id].degs.map(d => mod(K.pc + d.semis)));
function fitsKey(ch){ return ch.pcs.every(p => K.pcs.has(p)); }

/* ---- progression items are stored relative to the key, so they transpose ---- */
const toItem = (ch, b) => ({ s: mod(ch.rootPc - K.pc), l: mod(ch.rootL - K.L, 7), q: ch.qid, b: b || 4, ...(ch.bassPc != null ? { bs: mod(ch.bassPc - K.pc) } : {}) });
// it.nm: a name the player gave the chord (shown instead of the standard one, which stays in name0 and is what
// analysis, suggestions and transposing use)
const fromItem = it => {
  const c = mkChord(mod(K.pc + it.s), mod(K.L + it.l, 7), it.q, it.bs != null ? mod(K.pc + it.bs) : null);
  if (it.nm){ c.name0 = c.symbol; c.symbol = it.nm; c.custom = true; }
  return c;
};

/* ---- identify a chord from sounding notes ---- */
function identify(midis){
  if (!midis.length) return [];
  const sorted = [...midis].sort((a, b) => a - b);
  const bass = mod(sorted[0]);
  const pcs = [...new Set(sorted.map(m => mod(m)))];
  if (pcs.length < 2) return [];
  const cands = [];
  for (const r of pcs){
    const rel = new Set(pcs.map(p => mod(p - r)));
    for (const q of QLIST){
      if (!q.req.every(s => rel.has(s))) continue;
      if (![...rel].every(s => q.full.includes(s))) continue;
      if (q.id === '5' && pcs.length > 2) continue;
      if (q.dyad && r !== bass) continue;
      const missing = new Set(q.full).size - rel.size;
      cands.push({ r, q: q.id, score: q.rank * 0.08 + missing * 0.6 + (r === bass ? 0 : 1.6) });
    }
  }
  // a chord over a bass note that is not one of its notes (E/A: E–G♯–B over A): the upper notes on their own must
  // make a chord of 3 or more notes; it ranks below any reading that uses every note as a chord tone
  const upper = pcs.filter(p => p !== bass || sorted.filter(m => mod(m) === bass).length > 1);
  if (upper.length === pcs.length - 1 && upper.length >= 3){
    for (const r of upper){
      const rel = new Set(upper.map(p => mod(p - r)));
      for (const q of QLIST){
        if (q.dyad || q.id === '5' || !q.req.every(s => rel.has(s)) || ![...rel].every(s => q.full.includes(s))) continue;
        const missing = new Set(q.full).size - rel.size;
        cands.push({ r, q: q.id, score: q.rank * 0.08 + missing * 0.6 + 2.4 });
      }
    }
  }
  cands.sort((a, b) => a.score - b.score);
  const out = [], seen = new Set();
  for (const c of cands){
    const ch = chordAt(c.r, c.q, c.r === bass ? null : bass);
    if (seen.has(ch.symbol)) continue;
    seen.add(ch.symbol); out.push(ch);
    if (out.length >= 6) break;
  }
  return out;
}

/* ---- fretted voicing search: works for any tuning and string count ---- */
const VCACHE = new Map();
// The chords nearest to a set of notes that has no exact name: exact readings first, then chords ranked by how
// many of the notes they leave out (extra) and how many of their own notes are missing. Each: { ch, extra, missing }
function closestChords(midis, n = 8){
  if (!midis.length) return [];
  const sorted = [...midis].sort((a, b) => a - b), bass = mod(sorted[0]), pcs = [...new Set(sorted.map(m => mod(m)))];
  const out = identify(midis).map(ch => ({ ch, extra: [], missing: [] })), seen = new Set(out.map(x => x.ch.symbol));
  if (pcs.length < 2) return out;
  const cands = [];
  for (let r = 0; r < 12; r++) for (const q of QLIST){
    if (q.dyad || q.id === '5') continue;
    const tones = new Set(q.full.map(s => mod(r + s))), extra = pcs.filter(p => !tones.has(p)), missing = q.req.map(s => mod(r + s)).filter(p => !pcs.includes(p));
    if (extra.length + missing.length > 3 || (!pcs.includes(r))) continue;
    // a note under the chord that isn't one of its notes reads as a slash bass, not as a wrong note
    const bassOut = !tones.has(bass), ex = bassOut ? extra.filter(p => p !== bass) : extra;
    cands.push({ r, q: q.id, extra: ex, missing, slash: r !== bass, score: ex.length * 1.2 + missing.length + (r !== bass ? 0.5 : 0) + (bassOut ? 0.4 : 0) + q.rank * 0.05 });
  }
  cands.sort((a, b) => a.score - b.score);
  for (const c of cands){
    const ch = chordAt(c.r, c.q, c.slash ? bass : null);
    if (seen.has(ch.symbol)) continue;
    seen.add(ch.symbol); out.push({ ch, extra: c.extra, missing: c.missing });
    if (out.length >= n) break;
  }
  return out;
}
function fretVoicings(ch, tun, inv = false, FR = 15){
  const n = tun.length;
  const key = tun.join(',') + '|' + FR + '|' + ch.rootPc + ch.qid + '|' + (ch.bassPc ?? '') + '|' + (inv ? 1 : 0);
  if (VCACHE.has(key)) return VCACHE.get(key);
  // a slash chord's bass may be a note outside the chord (E/A): strings may play it too
  const full = new Set(ch.bassPc != null ? [...ch.pcs, ch.bassPc] : ch.pcs), req = ch.reqPcs;
  const reentrant = tun.some((m, i) => i > 0 && m < tun[i - 1]);
  const bassReq = ch.bassPc != null ? ch.bassPc : (inv ? null : ch.rootPc);
  const SPAN = 3, found = new Map();
  const run = (minStr, allowInternal) => {
    for (let p = 0; p <= FR - SPAN; p++){
      const lo = Math.max(1, p), hi = Math.min(FR, p + SPAN);
      const opts = tun.map(open => {
        const o = [null];
        if (full.has(mod(open))) o.push(0);
        for (let f = lo; f <= hi; f++) if (full.has(mod(open + f))) o.push(f);
        return o;
      });
      const cur = new Array(n);
      const rec = i => {
        if (i === n){ evalShape(cur); return; }
        for (const f of opts[i]){ cur[i] = f; rec(i + 1); }
      };
      rec(0);
    }
    function evalShape(sh){
      const played = [];
      for (let i = 0; i < n; i++) if (sh[i] !== null) played.push(i);
      if (played.length < minStr) return;
      const first = played[0], last = played[played.length - 1];
      let internal = 0;
      for (let i = first; i <= last; i++) if (sh[i] === null) internal++;
      if (internal > allowInternal) return;
      const midis = played.map(i => tun[i] + sh[i]);
      const have = new Set(midis.map(m => mod(m)));
      for (const r of req) if (!have.has(r)) return;
      if (!have.has(ch.rootPc)) return;
      const low = Math.min(...midis);
      if (!reentrant && bassReq != null && mod(low) !== bassReq) return;
      const fr = played.map(i => sh[i]).filter(f => f > 0);
      let fingers = fr.length, barre = null, pos = 0, span = 0;
      if (fr.length){
        const mn = Math.min(...fr), mx = Math.max(...fr);
        if (mx - mn > SPAN) return;
        pos = mn; span = mx - mn;
        if (fingers > 4){
          const atMin = played.filter(i => sh[i] === mn);
          const bFrom = atMin[0], bTo = atMin[atMin.length - 1];
          for (let i = bFrom; i <= bTo; i++) if (sh[i] === null || sh[i] < mn) return;
          fingers = 1 + fr.length - atMin.length;
          if (fingers > 4) return;
          barre = { fret: mn, from: bFrom, to: bTo };
        }
      }
      const k = sh.map(f => f === null ? 'x' : f).join('.');
      if (found.has(k)) return;
      let trebleMutes = 0;
      for (let i = last + 1; i < n; i++) trebleMutes++;
      const edge = n - played.length - internal;
      const score = pos * 0.2 + span * 0.55 + fingers * 0.35 + edge * 0.5 + trebleMutes * 0.4 + internal * 2.2 + (barre ? 0.6 : 0) - played.length * 0.35 + (full.size - have.size) * 0.5;
      found.set(k, { frets: sh.slice(), midis, pos, span, barre, score, fingers, bassPc: mod(low) });
    }
  };
  const minS = n >= 6 ? 4 : 3;
  run(Math.min(minS, Math.max(2, ch.pcs.length)), n >= 6 ? 1 : 0);
  if (found.size < 3) run(Math.max(2, minS - 1), n >= 6 ? 1 : 0);
  const sorted = [...found.values()].sort((a, b) => a.score - b.score);
  const picked = [];
  for (const v of sorted){
    if (picked.filter(p => Math.abs(p.pos - v.pos) <= 1).length >= 2) continue;
    picked.push(v);
    if (picked.length >= 12) break;
  }
  picked.sort((a, b) => a.pos - b.pos || a.score - b.score);
  const res = { list: picked, best: Math.max(0, picked.indexOf(sorted[0])) };
  VCACHE.set(key, res);
  return res;
}

/* ---- piano voicings ---- */
function closeFrom(order, base){
  const up = [];
  let m = base;
  while (mod(m) !== order[0]) m++;
  up.push(m);
  for (let i = 1; i < order.length; i++){ let x = up[i - 1] + 1; while (mod(x) !== order[i]) x++; up.push(x); }
  return up;
}
function upperPcs(ch){
  let ts = ch.tones.slice();
  if (ts.length > 4) ts = ts.filter(t => !t.opt);
  if (ts.length > 4) ts = ts.filter(t => t.num !== 1);
  return [...new Set(ts.map(t => t.pc))];
}
const rootUpper = ch => closeFrom(upperPcs(ch), 55);
function leadUpper(ch, prev){
  if (!prev) return rootUpper(ch);
  const pcs = upperPcs(ch), c = [];
  for (let k = 0; k < pcs.length; k++){
    const o = pcs.slice(k).concat(pcs.slice(0, k));
    for (let b = 52; b <= 64; b++) if (mod(b) === o[0]) c.push(closeFrom(o, b));
  }
  const cost = u => u.reduce((s, n) => s + Math.min(...prev.map(p => Math.abs(p - n))), 0) + prev.reduce((s, p) => s + Math.min(...u.map(n => Math.abs(p - n))), 0) + Math.abs(u[u.length - 1] - 69) * 0.1;
  return c.sort((a, b) => cost(a) - cost(b))[0];
}
const pianoBass = ch => 36 + (ch.bassPc ?? ch.rootPc);
function pianoVoicings(ch){
  const order = ch.tones.map(t => t.pc).filter((p, i, a) => a.indexOf(p) === i);
  const names = ['Root position','1st inversion','2nd inversion','3rd inversion'];
  const res = [];
  // the bass of a slash chord can be one of its notes (an inversion) or a note outside it (E/A): then it goes underneath
  const inChord = ch.bassPc == null || order.includes(ch.bassPc);
  const start = ch.bassPc != null && inChord ? order.indexOf(ch.bassPc) : 0;
  const under = ms => { let b = Math.min(...ms) - 1; while (mod(b) !== ch.bassPc) b--; return [b, ...ms]; };
  for (let k = 0; k < Math.min(order.length, 4); k++){
    const kk = (start + k) % order.length;
    const o = order.slice(kk).concat(order.slice(0, kk)), ms = closeFrom(o, 53);
    res.push({ name: ch.bassPc != null && k === 0 ? 'Slash bass on the bottom' : names[kk] || `Inversion ${kk}`, midis: inChord ? ms : under(ms) });
  }
  if (order.length >= 4){
    const c = closeFrom(order, 55), d2 = c.slice(), x = d2.splice(d2.length - 2, 1)[0];
    res.push({ name: 'Drop 2 (guitar-like spread)', midis: [x - 12, ...d2].sort((a, b) => a - b) });
  }
  res.push({ name: 'Two hands: bass + chord', midis: [pianoBass(ch), ...rootUpper(ch)] });
  const third = ch.tones.find(t => t.num === 3 || t.num === 2 || t.num === 4), sev = ch.tones.find(t => t.num === 7);
  if (third && sev){
    const b = pianoBass(ch);
    res.push({ name: 'Shell (root, 3rd, 7th)', midis: [b, ...closeFrom([third.pc, sev.pc], b + 9)] });
  }
  const nine = ch.tones.find(t => t.num === 9);
  if (third && sev && nine){
    const f = ch.tones.find(t => t.num === 5);
    res.push({ name: 'Rootless (jazz left hand)', midis: closeFrom([third.pc, f ? f.pc : sev.pc, sev.pc, nine.pc].filter((p, i, a) => a.indexOf(p) === i), 52) });
  }
  return res;
}

/* ================= Harmonic analysis ================= */
const FN_NAME = { T:'Tonic', PD:'Pre-dominant', D:'Dominant', X:'Outside color' };
function triadOnPc(pc){
  if (!K.hept) return null;
  const i = K.notes.findIndex(n => n.pc === mod(pc));
  return i < 0 ? null : diatonic(i, false);
}
function rnOfTriadPc(pc){
  const i = K.notes.findIndex(n => n.pc === mod(pc));
  const t = triadOnPc(pc);
  return t ? romanStr(i + 1, 0, t.q) : CHROMA_DEG[mod(pc - K.pc)];
}
const isDomType = ch => hasRel(ch, 4) && !hasRel(ch, 3) && !hasRel(ch, 11) && !hasRel(ch, 8) && (hasRel(ch, 10) || ch.qid === 'maj');
const isDom7 = ch => hasRel(ch, 4) && hasRel(ch, 10) && !hasRel(ch, 11);
const isDimType = ch => ['dim','dim7','m7b5'].includes(ch.qid);
function findTritone(ch){
  for (let i = 0; i < ch.pcs.length; i++) for (let j = i + 1; j < ch.pcs.length; j++) if (mod(ch.pcs[j] - ch.pcs[i]) === 6) return [ch.pcs[i], ch.pcs[j]];
  return null;
}

// The key a chord outside the key comes from (shown by the analyzer): for a secondary function the key of the chord
// it points at (a minor key for a minor target, harmonic or melodic minor when its notes need them), for a borrowed
// chord the parallel scale. base: the plain version of that key (major or natural minor) the analyzer lines up.
function srcKeyFor(ch, tpc, minorTarget){
  const prefs = minorTarget ? ['aeolian', 'harmonic', 'melodic'] : ['major', 'harmonic', 'melodic', 'mixolydian'];
  const base = minorTarget ? 'aeolian' : 'major';
  for (const id of prefs){ const k = makeKey(tpc, id); if (ch.pcs.every(p => k.pcs.has(p))) return { pc: mod(tpc), scale: id, base, minor: minorTarget }; }
  return { pc: mod(tpc), scale: base, base, minor: minorTarget };
}
// A chord borrowed for a moment from the key of another chord in the key (a tonicization): ii/V, IV/V, iii/V, vi/ii,
// ♭VII/IV… The common ones (ii/x) rank above the rare ones (IV/x, iii/x, vi/x, v/x, ♭VII/x).
const TZ_WEIGHT = { 2: 3, 4: 2, 3: 1, 6: 1, 5: 1, 7: 1 };
function tonicization(ch){
  if (!K.hept) return null;
  let best = null;
  K.notes.forEach((n, i) => {
    if (i === 0) return;
    const Y = diatonic(i, false);
    if (isDimType(Y) || Y.qid === 'aug' || Y.rootPc === ch.rootPc) return;
    const minor = Y.q.minor;
    (minor ? ['aeolian', 'harmonic'] : ['major', 'mixolydian']).forEach(id => {
      const k = makeKey(Y.rootPc, id), d = k.notes.findIndex(x => x.pc === ch.rootPc);
      if (d < 0 || !ch.pcs.every(p => k.pcs.has(p))) return;
      const num = d + 1;
      if (num === 5 && !minor) return;   // V/x is a secondary dominant (found earlier)
      if (id === 'mixolydian' && num !== 7) return;   // only ♭VII/x comes from the mixolydian side
      const w = (TZ_WEIGHT[num] || 0) + ({ 4: 0.5, 3: 0.3, 1: 0.2, 5: 0.2 }[i] || 0) - (id === 'harmonic' ? 0.3 : 0);
      if (!w || (best && best.w >= w)) return;
      const rn = (id === 'mixolydian' ? '♭' : '') + romanStr(num, 0, ch.q);
      best = { w, num, rare: num !== 2, tpc: Y.rootPc, Y, rn: `${rn}/${rnOfTriadPc(Y.rootPc)}`, local: rn, src: { pc: Y.rootPc, scale: id, base: minor ? 'aeolian' : 'major', minor } };
    });
  });
  return best;
}

const ACACHE = new Map();
function analyze(ch){
  const key = K.pc + S.scale + (ch.name0 || ch.symbol) + ch.qid;
  if (ACACHE.has(key)) return ACACHE.get(key);
  const r = analyzeRaw(ch); ACACHE.set(key, r); return r;
}
const keyNameOf = k => makeKey(k.pc, k.scale === 'harmonic' || k.scale === 'melodic' ? k.base || k.scale : k.scale).name;
function analyzeRaw(ch){
  const rel = mod(ch.rootPc - K.pc);
  const inKey = fitsKey(ch);
  const num = mod(ch.rootL - K.L, 7) + 1;
  const keyIdx = K.notes.findIndex(n => n.pc === ch.rootPc);
  const refN = K.hept ? K.notes.find(n => n.step === num - 1) : null;
  const refS = refN ? refN.semis : MAJ_SEMIS(num);
  const acc = mod(rel - refS + 6) - 6;
  const out = { rn: romanStr(num, inKey && K.hept ? 0 : acc, ch.q), num, inKey, fn: 'X', tension: 2, origin: '', text: '', target: null };
  const tonicName = K.notes[0].name;
  const lt = hasRel(ch, 4) ? toneName(ch, 4) : null;

  if (inKey){
    out.origin = 'In the key';
    const n = K.hept ? keyIdx + 1 : (num);
    if (n === 1){ out.fn = 'T'; out.tension = 0.5; out.text = 'Tonic: home base. Stable, nothing needs to move.'; }
    else if (n === 3 || n === 6){ out.fn = 'T'; out.tension = 1.3; out.text = `Tonic substitute: shares two notes with the ${tonicName} chord, so it feels restful but less final.`; }
    else if (n === 2 || n === 4){ out.fn = 'PD'; out.tension = 2; out.text = 'Pre-dominant: steps away from home and sets up the dominant.'; }
    else if (n === 5){
      if (isDomType(ch)){ out.fn = 'D'; out.tension = 3; out.target = K.pc; out.text = `Dominant: the most tension in the key. Its 3rd, ${lt}, is the leading tone a half step below ${tonicName} and wants to rise to it.`; }
      else { out.fn = 'D'; out.tension = 2.3; out.text = 'A minor v: dominant in position but without a leading tone, so it pulls home only gently. Typical of modal and folk sounds.'; }
    } else if (n === 7){
      if (refS === 11 && isDimType(ch)){ out.fn = 'D'; out.tension = 2.9; out.target = K.pc; out.text = `Leading-tone chord: works like a V7 without its root. ${ch.rootName} rises a half step to ${tonicName}.`; }
      else { out.fn = 'D'; out.tension = 2.2; out.text = `Subtonic chord a whole step below home. A softer stand-in for the dominant; ♭VII → I is a classic rock cadence.`; }
    } else { out.fn = 'PD'; out.tension = 1.8; out.text = 'A chord built from the scale.'; }
    if (findTritone(ch) && out.fn !== 'D') out.tension += 0.3;
    if (ch.q.tones.length > 3) out.tension += 0.15;
    return out;
  }
  if (isDomType(ch)){
    const tpc = mod(ch.rootPc + 5);
    if (tpc === K.pc){
      out.fn = 'D'; out.tension = 3; out.target = tpc; out.origin = 'Major dominant';
      out.rn = 'V' + rnSuffix(ch.q); out.src = { pc: K.pc, scale: 'harmonic', base: 'aeolian', minor: true };
      out.text = `A major V borrowed from harmonic minor. Its 3rd, ${lt}, is a leading tone a half step below ${tonicName}, so it pulls home harder than the scale's own v.`;
      return out;
    }
    const t = triadOnPc(tpc);
    if (t && t.qid !== 'dim'){
      out.fn = 'D'; out.tension = 2.8; out.target = tpc; out.origin = 'Secondary dominant';
      out.rn = 'V' + rnSuffix(ch.q) + '/' + rnOfTriadPc(tpc); out.src = srcKeyFor(ch, tpc, t.q.minor);
      out.text = `Secondary dominant of ${t.symbol}. It borrows a dominant from another key for a moment: ${lt} sits a half step below ${t.rootName} and wants to rise to it.`;
      return out;
    }
  }
  if (isDimType(ch)){
    const tpc = mod(ch.rootPc + 1);
    const t = triadOnPc(tpc);
    if (tpc === K.pc || (t && t.qid !== 'dim')){
      out.fn = 'D'; out.tension = 2.8; out.target = tpc; out.origin = 'Leading-tone chord';
      out.rn = 'vii' + rnSuffix(ch.q) + (tpc === K.pc ? '' : '/' + rnOfTriadPc(tpc));
      out.src = srcKeyFor(ch, tpc, tpc === K.pc ? !K.majorish : t.q.minor);
      out.text = `Leading-tone diminished chord aimed at ${tpc === K.pc ? tonicName : t.symbol}. Every note is a half or whole step from a note of the target, so it snaps into place.`;
      return out;
    }
  }
  if (isDom7(ch)){
    const tpc = mod(ch.rootPc - 1);
    const t = tpc === K.pc ? null : triadOnPc(tpc);
    if (tpc === K.pc || (t && t.qid !== 'dim')){
      const v7 = chordAt(tpc + 7, '7');
      out.fn = 'D'; out.tension = 2.9; out.target = tpc; out.origin = 'Tritone substitute';
      out.rn = 'subV7' + (tpc === K.pc ? '' : '/' + rnOfTriadPc(tpc));
      out.src = srcKeyFor(ch, tpc, tpc === K.pc ? !K.majorish : t.q.minor);
      out.text = `Tritone substitute for ${v7.symbol}. Both chords share the tritone ${toneName(ch, 4)}–${toneName(ch, 10)}, and the bass slides down a half step into ${tpc === K.pc ? tonicName : t.symbol}.`;
      return out;
    }
  }
  if (rel === 1 && (ch.qid === 'maj' || ch.qid === 'maj7')){
    out.fn = 'PD'; out.tension = 2.4; out.origin = 'Neapolitan'; out.src = { pc: K.pc, scale: 'phrygian', base: 'phrygian', minor: true };
    out.text = 'Neapolitan chord: a major chord on the lowered 2nd. A dramatic pre-dominant that usually heads to V.';
    return out;
  }
  // the common parallel scales first, then a chord tonicizing another chord of the key (ii/V…), then the rare modes
  const order = K.majorish ? ['aeolian','dorian','mixolydian','harmonic','melodic','major','tz','phrygian','lydian'] : ['major','dorian','harmonic','melodic','aeolian','mixolydian','tz','phrygian','lydian'];
  for (const id of order){
    if (id === 'tz'){
      const tz = tonicization(ch);
      if (!tz) continue;
      out.origin = tz.rare ? 'Tonicization (rare)' : 'Tonicization'; out.rn = tz.rn; out.src = tz.src; out.tonic = tz.tpc;
      out.fn = tz.num === 2 || tz.num === 4 ? 'PD' : tz.num === 7 ? 'D' : 'X';
      out.tension = { PD: 2.3, D: 2.6, X: 2.1 }[out.fn];
      out.text = `Borrowed for a moment from the key of ${tz.Y.symbol} (${keyNameOf(tz.src)}), where it is the ${tz.local}. ${tz.num === 2 ? `As ii of ${tz.Y.symbol} it usually leads to ${tz.Y.symbol}'s own V7, a ii–V that spotlights ${tz.Y.symbol}.` : tz.num === 4 ? `As IV of ${tz.Y.symbol} it leans toward ${tz.Y.symbol} like a plagal (“amen”) move.` : `A rare, colorful choice: heard as ${tz.local} of ${tz.Y.symbol}, it hints at ${keyNameOf(tz.src)} without a strong pull.`}`;
      return out;
    }
    if (id === S.scale) continue;
    const set = scalePcs(id);
    if (ch.pcs.every(p => set.has(p))){
      out.origin = 'Borrowed'; out.from = `${tonicName} ${SC[id].short}`; out.src = { pc: K.pc, scale: id, base: id, minor: !makeKey(K.pc, id).majorish };
      const key = accS(acc) + num;
      const fnMap = { '1':'T', '♭3':'T', '3':'T', '♭6':'PD', '6':'PD', '4':'PD', '2':'PD', '♭2':'PD', '♭7':'PD', '7':'D', '5':'D', '♭5':'X', '♯4':'PD' };
      out.fn = fnMap[key] || 'X';
      if (key === '♭7' && isDom7(ch)){ out.fn = 'D'; out.target = K.pc; }
      out.tension = { T: 1.4, PD: 2.2, D: 2.7, X: 2 }[out.fn];
      const extra = {
        '4': ch.q.minor ? `The minor iv adds a bittersweet sigh: its ${toneName(ch, 3)} falls a half step to the 5th of the key.` : 'The major IV brings a Dorian brightness into a minor key.',
        '♭6': 'The ♭VI is warm and cinematic; its root often falls a half step to V or steps down to ♭VII.',
        '♭7': isDom7(ch) ? 'As ♭VII7 it is the “backdoor dominant”: it resolves up a whole step to I instead of down a 5th.' : 'The ♭VII is the rock and Mixolydian favorite; it often walks straight back to I.',
        '♭3': 'The ♭III is a bold, anthem-like color, a minor-key chord placed into major.',
        '1': ch.q.minor ? 'The minor i turns home dark for a moment.' : 'A major I in a minor key is the “Picardy third”: a bright ending after minor-key drama.',
        '5': ch.q.minor ? 'A minor v softens the dominant: no leading tone.' : 'A major V adds a leading tone the scale lacks.',
        '2': ch.qid === 'dim' || ch.qid === 'm7b5' ? 'The ii° or iiø7 from minor makes the approach to V darker.' : 'The major II is the Lydian color; it often leads to V.',
      }[key] || '';
      out.text = `Borrowed from ${out.from}: the same home note, with notes taken from a parallel scale (modal mixture). ${extra}`;
      return out;
    }
  }
  if ((ch.qid === 'maj' || ch.qid === 'm') && [3,4,8,9].includes(rel)){
    out.fn = 'X'; out.tension = 2.1; out.origin = 'Chromatic mediant';
    out.text = 'Chromatic mediant: a root a 3rd away from home with an unexpected quality. Cinematic and bold; it works best when one note is held in common.';
    return out;
  }
  out.origin = 'Chromatic'; out.fn = 'X'; out.tension = 2.4;
  out.text = 'Outside the key. Chromatic chords work best when their notes move by half step into the next chord.';
  return out;
}

const MOTION = {
  0:['Same root','The foundation stays put while the color changes.'],
  1:['Root up a half step','A chromatic nudge upward.'],
  2:['Root up a step','A stepwise lift. Triads a step apart share no notes, so it sounds fresh.'],
  3:['Root up a minor 3rd','A mediant move: the chords overlap and the change feels like a shift of light.'],
  4:['Root up a major 3rd','A mediant move: smooth inside the key, striking when it borrows.'],
  5:['Root down a 5th','The strongest root motion in tonal music: the first chord acts like the V of the second.'],
  6:['Root moves a tritone','The most distant move. It sounds natural mainly with tritone substitutes.'],
  7:['Root up a 5th','A softer move that runs the circle backwards (like I → V).'],
  8:['Root down a major 3rd','A mediant move: smooth inside the key, cinematic when it borrows.'],
  9:['Root down a minor 3rd','Down a 3rd: the chords share two notes, so it flows.'],
  10:['Root down a step','A stepwise fall, common in rock (I–♭VII, IV–♭III).'],
  11:['Root down a half step','A chromatic slide. Smooth when it is a tritone sub or part of a bass line.'],
};
const MOTION_SHORT = {0:'same',1:'↑½',2:'↑2nd',3:'↑m3',4:'↑M3',5:'↓5th',6:'tritone',7:'↑5th',8:'↓M3',9:'↓m3',10:'↓2nd',11:'↓½'};

// What a chord pulls toward on its own, whatever the key: a dominant 7th resolves down a 5th,
// a diminished or half-diminished chord resolves up a half step (it is a dominant 7th without its root).
function localTarget(ch){
  if (isDimType(ch)) return { pc: mod(ch.rootPc + 1), how: 'lt' };
  if (isDom7(ch)) return { pc: mod(ch.rootPc + 5), how: 'v7' };
  return null;
}
function transition(A, B){
  const aA = analyze(A), aB = analyze(B);
  const iv = mod(B.rootPc - A.rootPc);
  const common = A.pcs.filter(p => B.pcs.includes(p));
  const lines = [];
  let tag = 'Neutral', score = 1.5, kind = 'ok';
  const tonicB = B.rootPc === K.pc && (aB.inKey || aB.origin === 'Borrowed');
  if (A.symbol === B.symbol){ return { tag: 'Repeat', score: 0.4, kind: 'weak', lines: ['The same chord again: no motion. Fine for holding, but it does not move the music forward.'], common, iv, aA, aB }; }
  const half = [];
  A.pcs.forEach(p => {
    if (B.pcs.includes(p)) return;
    const up = B.pcs.find(q => q === mod(p + 1)), dn = B.pcs.find(q => q === mod(p - 1));
    if (up !== undefined) half.push(`${toneOf(A, p).name} ↑ ${toneOf(B, up).name}`);
    else if (dn !== undefined) half.push(`${toneOf(A, p).name} ↓ ${toneOf(B, dn).name}`);
  });
  const lt = localTarget(A);
  const arrives = (aA.target != null && aA.target === B.rootPc) || (lt && lt.pc === B.rootPc && !isDimType(B));
  if (arrives){
    score = 3; kind = 'strong';
    if (tonicB){
      tag = 'Cadence';
      lines.push(aA.origin === 'Tritone substitute' ? `${aA.rn} → ${aB.rn}: a tritone-sub cadence; the bass slides home by half step.` : aA.origin === 'Leading-tone chord' || isDimType(A) ? `${aA.rn} → ${aB.rn}: a leading-tone cadence.` : `${aA.rn} → ${aB.rn}: an authentic cadence, the strongest way home.`);
    } else {
      tag = 'Resolves';
      if (lt && lt.how === 'lt') lines.push(`${A.symbol} works as a leading-tone chord: it is ${chordAt(A.rootPc + 8, '7').symbol} without its root, so it pulls straight into ${B.symbol}. ${A.rootName} rises a half step to ${B.rootName}.`);
      else if (lt && lt.how === 'v7' && aA.target !== B.rootPc) lines.push(`${A.symbol} acts as the dominant (V7) of ${B.symbol}: its tritone resolves inward and the root falls a 5th.`);
      else lines.push(`${A.symbol} was pointing at ${B.symbol}, and it arrives. The borrowed tension is released.`);
    }
  } else if (aA.fn === 'D' && aA.target === K.pc && aB.inKey && K.hept && K.notes.findIndex(n => n.pc === B.rootPc) === 5){
    tag = 'Deceptive'; score = 2.3; kind = 'color';
    lines.push(`Deceptive cadence: the ear expects ${K.notes[0].name}, and gets ${B.symbol} instead. The bass rises a step rather than falling a 5th.`);
  } else if (aA.fn === 'PD' && aB.fn === 'D'){
    tag = 'Sets up'; score = 2.5; kind = 'strong';
    lines.push('Pre-dominant to dominant: the classic way to build tension before going home.');
  } else if (aA.fn === 'PD' && tonicB && (aA.num === 4 || aA.num === 6)){
    tag = 'Plagal'; score = 2.2; kind = 'strong';
    lines.push(A.q.minor ? `Minor plagal cadence: the ${toneName(A, 3)} sinks a half step to ${toneName(B, 5) || 'the 5th'}. Tender and nostalgic.` : 'Plagal (“amen”) cadence: IV back to I. Gentler than V–I.');
  } else if (iv === 5){
    tag = 'Strong'; score = 2.6; kind = 'strong';
  } else if (aA.fn === 'D' && aB.fn === 'PD'){
    tag = 'Backs off'; score = 1.1; kind = 'weak';
    lines.push('Dominant to pre-dominant is a retrogression: the tension is left hanging. Common in rock and blues (V–IV–I), weaker in classical harmony.');
  } else if (common.length >= 2){
    tag = 'Smooth'; score = 2.1; kind = 'ok';
  } else if (!aB.inKey){
    tag = 'Color'; score = 1.9; kind = 'color';
  } else if (common.length === 0 && half.length >= 2){
    tag = 'Stepwise'; score = 1.9; kind = 'ok';
    lines.push('No shared notes, but the voices can slide by half step into the new chord, so it still sounds connected.');
  } else if (common.length === 0 && (iv === 1 || iv === 11 || iv === 6)){
    tag = 'Abrupt'; score = 0.8; kind = 'weak';
    lines.push('No shared notes and an awkward root move. It can work as a deliberate jolt, but it will not sound “inevitable”.');
  }
  if (!aB.inKey && kind !== 'weak' && tag !== 'Resolves' && tag !== 'Cadence'){ kind = kind === 'strong' ? 'strong' : 'color'; score += 0.1; }
  lines.push(`${MOTION[iv][0]}. ${MOTION[iv][1]}`);
  if (common.length) lines.push(`${common.length} shared note${common.length > 1 ? 's' : ''}: ${common.map(p => toneOf(B, p).name).join(', ')}. Shared notes make changes smooth.`);
  else lines.push('No shared notes, so every voice has to move.');
  if (half.length) lines.push(`Half-step pulls: ${half.join(', ')}. These tiny moves are what make a change feel like it “resolves”.`);
  const tt = findTritone(A);
  if (tt){
    const [x, y] = tt;
    const xr = [mod(x + 1), mod(x - 1)].find(q => B.pcs.includes(q)), yr = [mod(y + 1), mod(y - 1)].find(q => B.pcs.includes(q));
    if (xr !== undefined && yr !== undefined) lines.push(`The tritone ${toneOf(A, x).name}–${toneOf(A, y).name} (the unstable heart of the chord) resolves by half steps to ${toneOf(B, xr).name}–${toneOf(B, yr).name}.`);
  }
  if (tag === 'Neutral' && kind === 'ok' && score < 2) score = 1.5;
  return { tag, score, kind, lines, common, iv, aA, aB };
}

/* ================= Audio ================= */
const SR = 32000;
let RING = 0.45;   // overall sustain: plucked strings and pianos decay at RING × their natural length (set by the Sustain menu)
const AU = { ctx: null, buses: {}, buf: new Map() };

/* ---- Sounds for each kind of instrument ----
   gen: pluck (Karplus–Strong string), piano (additive model), or live synthesis for sustained sounds
   (bowed, organ, ep, pad, synth). chain: tone shaping after the voice ([filter type, freq, gain dB, Q] or
   ['drive', amount]); send: reverb amount; layers: extra strings (12-string octave courses). */
const ACOUSTIC = [['highpass', 75], ['peaking', 105, 3.5, 1], ['peaking', 2800, 2.5, 0.9], ['lowpass', 9000]];
const BOWED_BODY = [['highpass', 55], ['peaking', 290, 4, 1.2], ['peaking', 1050, 3, 1.4], ['peaking', 2900, 4, 1.1], ['lowpass', 7500]];
const SOUNDS = {
  guitar: [
    { id: 'steel', name: 'Acoustic steel-string', p: { t60: [7.5, 2.8], bright: 0.36, pick: 0.15 }, chain: ACOUSTIC, send: 0.5 },
    { id: 'jumbo', name: 'Full-body acoustic (jumbo)', p: { t60: [9, 3.4], bright: 0.42, pick: 0.17 }, chain: [['highpass', 62], ['peaking', 95, 6, 0.8], ['peaking', 220, 3, 1], ['peaking', 3000, 2, 1], ['lowpass', 8000]], send: 0.55 },
    { id: 'warm', name: 'Warm acoustic', p: { t60: [7, 2.6], bright: 0.58, pick: 0.2 }, chain: [['highpass', 70], ['peaking', 140, 3, 1], ['lowpass', 4200]], send: 0.5 },
    { id: 'bright', name: 'Bright acoustic', p: { t60: [6, 2.2], bright: 0.18, pick: 0.1 }, chain: [['highpass', 110], ['peaking', 3800, 5, 0.8], ['lowpass', 12000]], send: 0.45 },
    { id: 'nylon', name: 'Classical (nylon strings)', p: { t60: [5, 1.9], bright: 0.64, pick: 0.22 }, chain: [['highpass', 75], ['peaking', 190, 3, 1], ['peaking', 1200, -2, 1], ['lowpass', 4500]], send: 0.55 },
    { id: 'twelve', name: '12-string acoustic', p: { t60: [7.5, 2.8], bright: 0.32, pick: 0.14 }, layers: [{ off: 12, gain: 0.45, delay: 0.007, below: 57 }, { off: 0, gain: 0.5, delay: 0.005, below: 128, from: 57, det: 6 }], chain: ACOUSTIC, send: 0.55, gain: 0.45 },
    { id: 'eclean', name: 'Electric clean', p: { t60: [9, 4.5], bright: 0.3, pick: 0.12 }, chain: [['highpass', 80], ['peaking', 2200, 3, 1], ['lowpass', 6000]], send: 0.35 },
    { id: 'ejazz', name: 'Electric jazz (neck pickup)', p: { t60: [6.5, 3], bright: 0.6, pick: 0.25 }, chain: [['highpass', 70], ['peaking', 280, 3, 1], ['lowpass', 2300]], send: 0.35 },
    { id: 'ecrunch', name: 'Electric crunch', p: { t60: [10, 6], bright: 0.3, pick: 0.12 }, chain: [['highpass', 90], ['drive', 8], ['peaking', 1600, 3, 1], ['lowpass', 4200]], send: 0.3, gain: 0.32 },
    { id: 'edist', name: 'Electric distortion', p: { t60: [12, 8], bright: 0.28, pick: 0.12 }, chain: [['highpass', 100], ['drive', 40], ['peaking', 750, -4, 1], ['peaking', 2500, 3, 1], ['lowpass', 3800]], send: 0.25, gain: 0.24 },
  ],
  bass: [
    { id: 'finger', name: 'Electric bass (fingered)', p: { t60: [9, 4.5], bright: 0.62, pick: 0.2 }, chain: [['highpass', 32], ['peaking', 85, 3, 0.9], ['lowpass', 3200]], send: 0.18, gain: 0.75 },
    { id: 'picked', name: 'Electric bass (picked)', p: { t60: [8, 4], bright: 0.35, pick: 0.1 }, chain: [['highpass', 35], ['peaking', 90, 2, 0.9], ['peaking', 1300, 4, 1], ['lowpass', 5000]], send: 0.15, gain: 0.7 },
    { id: 'acoustic', name: 'Acoustic bass guitar', p: { t60: [5, 2.5], bright: 0.5, pick: 0.18 }, chain: [['highpass', 40], ['peaking', 120, 4, 1], ['peaking', 700, 3, 1], ['lowpass', 3600]], send: 0.3, gain: 0.75 },
    { id: 'upright', name: 'Upright / stand-up (plucked)', p: { t60: [2.4, 1.3], bright: 0.72, pick: 0.3 }, chain: [['highpass', 35], ['peaking', 95, 4, 1], ['peaking', 450, 2, 1], ['lowpass', 2200]], send: 0.35, gain: 0.85 },
    { id: 'arco', name: 'Orchestral (bowed double bass)', gen: 'bowed', b: { cut: 5, vib: 0.14, voices: 1, attack: 0.14 }, chain: [['highpass', 30], ['peaking', 110, 4, 1], ['peaking', 500, 3, 1.2], ['lowpass', 3500]], send: 0.55, gain: 0.5 },
    { id: 'synth', name: 'Synth bass', gen: 'synth', chain: [['highpass', 30], ['lowpass', 8000]], send: 0.12, gain: 0.42 },
  ],
  uke: [
    { id: 'concert', name: 'Soprano / concert', p: { t60: [3.4, 1.7], bright: 0.6, pick: 0.27 }, chain: [['highpass', 160], ['peaking', 420, 3, 1.1], ['peaking', 2400, 2, 1], ['lowpass', 7000]], send: 0.5 },
    { id: 'tenor', name: 'Tenor (warmer, longer)', p: { t60: [4.5, 2.2], bright: 0.66, pick: 0.25 }, chain: [['highpass', 120], ['peaking', 300, 3, 1], ['lowpass', 5000]], send: 0.55 },
    { id: 'bright', name: 'Bright', p: { t60: [3, 1.5], bright: 0.35, pick: 0.18 }, chain: [['highpass', 180], ['peaking', 3000, 4, 1], ['lowpass', 9000]], send: 0.45, gain: 0.5 },
  ],
  piano: [
    { id: 'grand', name: 'Grand piano', gen: 'piano', pp: { bright: 1, decay: 1 }, chain: [['highpass', 30], ['lowpass', 11000]], send: 0.55, gain: 0.42 },
    { id: 'bright', name: 'Bright piano', gen: 'piano', pp: { bright: 1.7, decay: 0.9 }, chain: [['highpass', 40], ['peaking', 3000, 4, 1], ['lowpass', 13000]], send: 0.45, gain: 0.38 },
    { id: 'upright', name: 'Mellow upright', gen: 'piano', pp: { bright: 0.55, decay: 0.7 }, chain: [['highpass', 40], ['lowpass', 4800]], send: 0.4, gain: 0.46 },
    { id: 'epiano', name: 'Electric piano', gen: 'ep', chain: [['highpass', 40], ['lowpass', 7000]], send: 0.4, gain: 0.32 },
    { id: 'organ', name: 'Organ', gen: 'organ', chain: [['highpass', 40], ['lowpass', 6000]], send: 0.4, gain: 0.2 },
    { id: 'harpsi', name: 'Harpsichord', p: { t60: [4, 1.6], bright: 0.05, pick: 0.45, range: [36, 84] }, chain: [['highpass', 120], ['peaking', 2500, 3, 1], ['lowpass', 10000]], send: 0.5, gain: 0.42 },
    { id: 'pad', name: 'Synth pad', gen: 'pad', chain: [['highpass', 60], ['lowpass', 6000]], send: 0.7, gain: 0.2 },
  ],
  bowed: [
    { id: 'solo', name: 'Solo (expressive vibrato)', gen: 'bowed', b: { cut: 7, vib: 0.22, voices: 1, attack: 0.09 }, chain: BOWED_BODY, send: 0.55, gain: 0.42 },
    { id: 'section', name: 'String section', gen: 'bowed', b: { cut: 6, vib: 0.15, voices: 3, attack: 0.2 }, chain: BOWED_BODY, send: 0.75, gain: 0.36 },
    { id: 'sordino', name: 'Muted (con sordino)', gen: 'bowed', b: { cut: 3.4, vib: 0.18, voices: 1, attack: 0.13 }, chain: BOWED_BODY, send: 0.55, gain: 0.5 },
    { id: 'pizz', name: 'Pizzicato (plucked)', p: { t60: [1.3, 0.6], bright: 0.55, pick: 0.3, range: [36, 88] }, chain: BOWED_BODY, send: 0.6, gain: 0.7 },
  ],
};
const PLUCK_RANGE = { guitar: [40, 80], bass: [23, 55], uke: [50, 80], piano: [36, 84], bowed: [36, 88] };
Object.entries(SOUNDS).forEach(([kd, list]) => list.forEach(s => { s.kind = kd; s.gen = s.gen || 'pluck'; if (s.gain == null) s.gain = 0.55; if (s.p && !s.p.range) s.p.range = PLUCK_RANGE[kd]; }));

function makeIR(ctx, dur){
  const len = Math.floor(ctx.sampleRate * dur), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++){
    const d = ir.getChannelData(c); let lp = 0;
    for (let i = 0; i < len; i++){
      const t = i / len, a = 0.25 + t * 0.7;
      lp = a * lp + (1 - a) * (Math.random() * 2 - 1);
      d[i] = lp * Math.pow(1 - t, 3) * (i < 200 ? i / 200 : 1);
    }
  }
  return ir;
}
function ac(){
  if (!AU.ctx){
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = new C(); AU.ctx = ctx;
    AU.master = ctx.createGain(); AU.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25;
    AU.master.connect(comp); comp.connect(ctx.destination);
    AU.rev = ctx.createConvolver(); AU.rev.buffer = makeIR(ctx, 2.6);
    const revOut = ctx.createGain(); revOut.gain.value = 0.32;
    AU.rev.connect(revOut); revOut.connect(AU.master);
    AU.click = ctx.createGain(); AU.click.gain.value = 0.25; AU.click.connect(AU.master);
  }
  if (AU.ctx.state === 'suspended') AU.ctx.resume();
  return AU.ctx;
}
function driveCurve(k){
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++){ const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}
// One effect chain per sound, built the first time it is used
function busFor(snd){
  const ctx = ac();
  if (AU.buses[snd.kind + snd.id]) return AU.buses[snd.kind + snd.id];
  const input = ctx.createGain();
  let node = input;
  (snd.chain || []).forEach(([type, f, g, q]) => {
    let n;
    if (type === 'drive'){ n = ctx.createWaveShaper(); n.curve = driveCurve(f); n.oversample = '4x'; }
    else { n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (g != null) n.gain.value = g; n.Q.value = q != null ? q : 0.7; }
    node.connect(n); node = n;
  });
  node.connect(AU.master);
  const send = ctx.createGain(); send.gain.value = snd.send ?? 0.4; node.connect(send); send.connect(AU.rev);
  AU.buses[snd.kind + snd.id] = input;
  return input;
}

/* Karplus–Strong plucked string with fractional-delay tuning, pick-position comb and pitch-dependent decay */
function pluckBuffer(snd, m){
  const key = snd.kind + snd.id + m + '|' + RING;
  if (AU.buf.has(key)) return AU.buf.get(key);
  const ctx = ac(), f = mtof(m), P0 = snd.p;
  const T60 = RING * lerp(P0.t60[0], P0.t60[1], clamp((m - P0.range[0]) / (P0.range[1] - P0.range[0]))), bright = P0.bright, pick = P0.pick;
  const dur = Math.min(T60 * 0.9, 9);
  const N = Math.floor(SR * dur), buf = ctx.createBuffer(1, N, SR), out = buf.getChannelData(0);
  const P = SR / f;
  const L = Math.max(2, Math.floor(P + 0.4));
  const frac = P - (L - 0.5), C = (1 - frac) / (1 + frac);
  const line = new Float32Array(L), ex = new Float32Array(L);
  let y = 0;
  for (let i = 0; i < L; i++){ y = bright * y + (1 - bright) * (Math.random() * 2 - 1); ex[i] = y; }
  const pd = Math.max(1, Math.round(pick * L));
  let mean = 0;
  for (let i = 0; i < L; i++){ line[i] = ex[i] - (i >= pd ? ex[i - pd] : 0) * 0.9; mean += line[i]; }
  mean /= L;
  for (let i = 0; i < L; i++) line[i] -= mean;
  const rho = Math.pow(0.001, 1 / (f * T60));
  let idx = 0, apx = 0, apy = 0, peak = 1e-6;
  for (let n = 0; n < N; n++){
    const a = line[idx], b = line[idx + 1 < L ? idx + 1 : 0];
    out[n] = a;
    const v = rho * 0.5 * (a + b);
    const ap = C * v + apx - C * apy; apx = v; apy = ap;
    line[idx] = ap;
    if (++idx === L) idx = 0;
    if (n < 4000){ const av = Math.abs(a); if (av > peak) peak = av; }
  }
  const fade = Math.floor(SR * 0.08), g = 0.9 / peak;
  for (let n = 0; n < N; n++){ out[n] *= g; if (n > N - fade) out[n] *= (N - n) / fade; }
  AU.buf.set(key, buf);
  return buf;
}
/* Additive piano: slightly inharmonic partials, two-stage decay, a detuned second string and hammer noise */
function pianoBuffer(snd, m){
  const key = snd.kind + snd.id + m + '|' + RING;
  if (AU.buf.has(key)) return AU.buf.get(key);
  const ctx = ac(), f = mtof(m), pf = Math.pow(2, (60 - m) / 24), pp0 = snd.pp || { bright: 1, decay: 1 }, pp = { ...pp0, decay: pp0.decay * RING * 1.2 };
  const dur = clamp(5.5 * pf * pp.decay, 1.2, 5);
  const N = Math.floor(SR * dur), buf = ctx.createBuffer(1, N, SR), out = buf.getChannelData(0);
  const B = 0.00018 * Math.pow(2, (m - 40) / 18);
  const nP = Math.max(2, Math.min(18, Math.floor(10000 / f)));
  for (let k = 1; k <= nP; k++){
    const fk = f * k * Math.sqrt(1 + B * k * k);
    if (fk > SR * 0.45) break;
    const amp = Math.pow(k, -1.15) * Math.pow(k, (pp.bright - 1) * 0.6) * (0.4 + 1.2 * Math.abs(Math.sin(Math.PI * k * 0.13))) * (k === 1 ? 1.2 : 1);
    const tf = 0.28 * pf * pp.decay / (1 + 0.3 * k), ts = 3.4 * pf * pp.decay / (1 + 0.14 * k);
    const strings = k <= 4 ? [1, 1.0007] : [1];
    for (const det of strings){
      const w = 2 * Math.PI * fk * det / SR, c = Math.cos(w), s = Math.sin(w);
      let x = 1, yy = 0, ef = 0.6 * amp / strings.length, es = 0.4 * amp / strings.length;
      const df = Math.exp(-1 / (tf * SR)), ds = Math.exp(-1 / (ts * SR));
      for (let n = 0; n < N; n++){
        out[n] += (ef + es) * yy;
        const nx = x * c - yy * s; yy = x * s + yy * c; x = nx;
        ef *= df; es *= ds;
        if ((n & 1023) === 0){ const r = 1 / Math.sqrt(x * x + yy * yy); x *= r; yy *= r; }
      }
    }
  }
  const atk = Math.floor(SR * 0.003);
  for (let n = 0; n < atk; n++) out[n] *= n / atk;
  let lp = 0;
  const hn = Math.floor(SR * 0.012);
  for (let n = 0; n < hn; n++){ lp = 0.7 * lp + 0.3 * (Math.random() * 2 - 1); out[n] += lp * 0.25 * pp.bright * (1 - n / hn); }
  let peak = 1e-6;
  for (let n = 0; n < Math.min(N, 6000); n++) peak = Math.max(peak, Math.abs(out[n]));
  const g = 0.9 / peak, fade = Math.floor(SR * 0.1);
  for (let n = 0; n < N; n++){ out[n] *= g; if (n > N - fade) out[n] *= (N - n) / fade; }
  AU.buf.set(key, buf);
  return buf;
}
function bufferVoice(snd, m, t, o, dest){
  const ctx = AU.ctx;
  const src = ctx.createBufferSource();
  src.buffer = snd.gen === 'piano' ? pianoBuffer(snd, m) : pluckBuffer(snd, m);
  src.playbackRate.value = Math.pow(2, ((Math.random() - 0.5) * 3 + (o.det || 0)) / 1200);
  const g = ctx.createGain(), v = (o.vel ?? 0.8) * (0.9 + Math.random() * 0.18) * snd.gain;
  g.gain.value = v;
  src.connect(g); g.connect(dest);
  src.start(t);
  if (o.dur != null){
    g.gain.setValueAtTime(v, t + o.dur);
    g.gain.setTargetAtTime(0, t + o.dur, snd.gen === 'piano' ? 0.1 : 0.06);
    src.stop(t + o.dur + 0.8);
  }
  return { g, stop: tt => { try { src.stop(tt); } catch (e) {} } };
}
// Live-synthesized sustained sounds. Each returns { g, stop }; notes without a length ring for ~1.4 s.
function envVoice(ctx, t, dur, v, attack, release, dest){
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + attack);
  g.gain.setValueAtTime(v, t + Math.max(attack, dur));
  g.gain.setTargetAtTime(0, t + Math.max(attack, dur), release);
  g.connect(dest);
  return g;
}
const LIVE = {
  bowed(snd, m, t, o, dest){
    const ctx = AU.ctx, f = mtof(m), b = snd.b, dur = o.dur ?? (o.hold ? 30 : 1.4), v = (o.vel ?? 0.8) * snd.gain;
    const out = envVoice(ctx, t, dur, v, b.attack, 0.12, dest);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(12000, f * b.cut); lp.Q.value = 0.8;
    lp.connect(out);
    const nodes = [];
    for (let k = 0; k < b.voices; k++){
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f;
      osc.detune.value = (k - (b.voices - 1) / 2) * 9 + (Math.random() - 0.5) * 3;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5 + Math.random() * 1.2;
      const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(b.vib * 100, t + 0.5);
      lfo.connect(lg); lg.connect(osc.detune);
      const vg = ctx.createGain(); vg.gain.value = 1 / Math.sqrt(b.voices);
      osc.connect(vg); vg.connect(lp);
      nodes.push(osc, lfo);
    }
    nodes.forEach(n => { n.start(t); n.stop(t + dur + 1); });
    return { g: out, stop: tt => nodes.forEach(n => { try { n.stop(tt); } catch (e) {} }) };
  },
  organ(snd, m, t, o, dest){
    const ctx = AU.ctx, f = mtof(m), dur = o.dur ?? (o.hold ? 30 : 1.4), v = (o.vel ?? 0.8) * snd.gain;
    const out = envVoice(ctx, t, dur, v, 0.008, 0.06, dest), nodes = [];
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6.2; const lg = ctx.createGain(); lg.gain.value = 4; lfo.connect(lg);
    [[0.5, 0.55], [1, 1], [2, 0.65], [3, 0.4], [4, 0.3], [6, 0.12], [8, 0.08]].forEach(([r, a]) => {
      if (f * r > 12000) return;
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f * r; lg.connect(osc.detune);
      const g = ctx.createGain(); g.gain.value = a; osc.connect(g); g.connect(out); nodes.push(osc);
    });
    nodes.push(lfo);
    nodes.forEach(n => { n.start(t); n.stop(t + dur + 0.5); });
    return { g: out, stop: tt => nodes.forEach(n => { try { n.stop(tt); } catch (e) {} }) };
  },
  pad(snd, m, t, o, dest){
    const ctx = AU.ctx, f = mtof(m), dur = o.dur ?? (o.hold ? 30 : 1.6), v = (o.vel ?? 0.8) * snd.gain;
    const out = envVoice(ctx, t, dur, v, 0.35, 0.5, dest), nodes = [];
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.linearRampToValueAtTime(Math.min(9000, f * 5), t + 0.8); lp.Q.value = 1.5; lp.connect(out);
    [-8, 0, 7].forEach(d => { const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f; osc.detune.value = d; const g = ctx.createGain(); g.gain.value = 0.4; osc.connect(g); g.connect(lp); nodes.push(osc); });
    nodes.forEach(n => { n.start(t); n.stop(t + dur + 3); });
    return { g: out, stop: tt => nodes.forEach(n => { try { n.stop(tt); } catch (e) {} }) };
  },
  synth(snd, m, t, o, dest){
    const ctx = AU.ctx, f = mtof(m), dur = o.dur ?? (o.hold ? 30 : 0.8), v = (o.vel ?? 0.8) * snd.gain;
    const out = envVoice(ctx, t, dur, v, 0.005, 0.05, dest), nodes = [];
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 7;
    lp.frequency.setValueAtTime(Math.min(8000, f * 14), t); lp.frequency.setTargetAtTime(f * 2.2, t, 0.09); lp.connect(out);
    [['sawtooth', 0], ['square', -1200]].forEach(([type, d]) => { const osc = ctx.createOscillator(); osc.type = type; osc.frequency.value = f; osc.detune.value = d; const g = ctx.createGain(); g.gain.value = 0.5; osc.connect(g); g.connect(lp); nodes.push(osc); });
    nodes.forEach(n => { n.start(t); n.stop(t + dur + 0.5); });
    return { g: out, stop: tt => nodes.forEach(n => { try { n.stop(tt); } catch (e) {} }) };
  },
  ep(snd, m, t, o, dest){
    // two-operator FM: a soft tine with a bell-like attack that mellows as it decays
    const ctx = AU.ctx, f = mtof(m), pf = Math.pow(2, (60 - m) / 24), v = (o.vel ?? 0.8) * snd.gain, ring = 2.4 * pf;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(v, t + 0.003); out.gain.setTargetAtTime(0, t + 0.003, 0.75 * pf);
    if (o.dur != null) out.gain.setTargetAtTime(0, t + o.dur, 0.08);
    out.connect(dest);
    const car = ctx.createOscillator(); car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.frequency.value = f;
    const mi = ctx.createGain(); mi.gain.setValueAtTime(f * 2.2, t); mi.gain.setTargetAtTime(f * 0.25, t, 0.35);
    const bell = ctx.createOscillator(); bell.frequency.value = f * 14;
    const bi = ctx.createGain(); bi.gain.setValueAtTime(f * 1.4, t); bi.gain.setTargetAtTime(0, t, 0.03);
    mod.connect(mi); mi.connect(car.frequency); bell.connect(bi); bi.connect(car.frequency);
    car.connect(out);
    const nodes = [car, mod, bell], end = t + (o.dur != null ? o.dur + 0.6 : ring);
    nodes.forEach(n => { n.start(t); n.stop(end); });
    return { g: out, stop: tt => nodes.forEach(n => { try { n.stop(tt); } catch (e) {} }) };
  },
};
// k: a sound object, or an instrument kind ('guitar', 'piano'…) meaning that kind's selected sound
function playNote(k, m, t, o = {}){
  const ctx = ac();
  const snd = typeof k === 'string' ? soundFor(k) : k;
  m = Math.round(clamp(m, 12, 108));
  const start = Math.max(t ?? ctx.currentTime, ctx.currentTime), dest = o.dest || busFor(snd);
  const v = (snd.gen === 'pluck' || snd.gen === 'piano') ? bufferVoice(snd, m, start, o, dest) : LIVE[snd.gen](snd, m, start, o, dest);
  (snd.layers || []).forEach(L => {
    if (m >= L.below || m < (L.from || 0)) return;
    (v.extra = v.extra || []).push(bufferVoice(snd, m + L.off, start + L.delay, { ...o, vel: (o.vel ?? 0.8) * L.gain, det: L.det || 0 }, dest));
  });
  return v;
}
// Lets a held note go: fades over `tau` seconds (a damper or a lifted finger), then stops it
function releaseVoice(v, t, tau){
  if (!v) return;
  [v, ...(v.extra || [])].forEach(x => {
    try { const now = x.g.gain.value; x.g.gain.cancelScheduledValues(t); x.g.gain.setValueAtTime(now, t); x.g.gain.setTargetAtTime(0, t, tau); x.stop(t + tau * 8); } catch (e) {}
  });
}
function cutVoice(v, t){
  if (!v) return;
  [v, ...(v.extra || [])].forEach(x => {
    try { x.g.gain.cancelScheduledValues(t); x.g.gain.setTargetAtTime(0, t, 0.025); x.stop(t + 0.3); } catch (e) {}
  });
}
// level: 2 = downbeat, 1 = start of a beat group, 0 = other beats
function clickAt(t, level){
  const ctx = ac(), o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square'; o.frequency.value = [1200, 1600, 2100][+level || 0];
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime([0.22, 0.35, 0.5][+level || 0], t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  o.connect(g); g.connect(AU.click); o.start(t); o.stop(t + 0.06);
}
