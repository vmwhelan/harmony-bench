'use strict';
/* ================= Analyzer pop-out =================
   A floating panel (a drawer on the right on wide screens, a sheet at the bottom on phones) that shows where the
   chords outside the key come from:
   - Chord view: the home key's chords and the source key's chords lined up on one chromatic ruler (the same root in
     the same column), the chord's notes against the home scale, how each voice moves in and out, ▶ buttons, and
     what the chord is, why it works, where it is typically used and when it doesn't work.
   - Progression view: every chord colored by where it comes from, brackets over the spans that visit another key,
     and the function flow. Click a chord for its chord view.
   It reads a snapshot { key, chs, focus } and never changes the progression.
   Also here: functionChain(), the progression-level labels (extended dominants, secondary ii–V) used by the timeline.
   Loaded after patterns.js and before docs.js. */

/* ---- Labels that depend on the chords around a chord ----
   Extended dominants: dominant 7ths that each resolve down a 5th into the next one (A7 → D7 → G7 → C is
   V7/V/V → V7/V → V7 → I). Secondary ii–V: a minor 7th (or m7♭5) whose root falls a 5th into a secondary dominant
   (Am7 → D7 → G is ii/V → V7/V → V), even when the ii chord is in the key. Evaluated in the current key (K). */
function functionChain(chs){
  const n = chs.length, an = chs.map(analyze), over = new Array(n).fill(null), spans = [];
  const fifthDown = (a, b) => a && b && mod(b.rootPc - a.rootPc) === 5;
  const rnAt = i => (over[i] || an[i]).rn;
  // chains of dominant 7ths, from the end of each run
  for (let i = 0; i < n - 1; i++){
    if (!(isDom7(chs[i]) && isDom7(chs[i + 1]) && fifthDown(chs[i], chs[i + 1]))) continue;
    let m = i + 1;
    while (m < n - 1 && isDom7(chs[m + 1]) && fifthDown(chs[m], chs[m + 1])) m++;
    let ok = true;
    for (let k = m - 1; k >= i && ok; k--){
      const next = rnAt(k + 1);
      if (!/^V/.test(next)){ ok = false; break; }
      const rn = 'V' + rnSuffix(chs[k].q) + '/' + next.replace(/^V[^/]*/, 'V');
      over[k] = { ...an[k], rn, origin: 'Extended dominant', fn: 'D', tension: 2.9, target: chs[k + 1].rootPc,
        src: srcKeyFor(chs[k], chs[k + 1].rootPc, false),
        text: `Extended dominant: ${chs[k].symbol} is the V7 of ${chs[k + 1].symbol}, and ${chs[k + 1].symbol} is itself a dominant, so the pull is passed along instead of released. A chain of dominants, each resolving down a 5th into the next, builds tension that is let go only at the end.` };
    }
    if (ok){
      const end = fifthDown(chs[m], chs[m + 1]) ? m + 1 : m;
      spans.push({ from: i, to: end, label: `Chain of dominants into ${chs[end].symbol}`, kind: 'ext' });
    }
    i = m;
  }
  // secondary ii–V
  for (let i = 0; i < n - 1; i++){
    const A = chs[i], B = chs[i + 1], aB = over[i + 1] || an[i + 1];
    if (!(['m', 'm7', 'm7b5'].includes(A.qid) && isDomType(B) && fifthDown(A, B))) continue;
    const tgt = aB.target;
    if (tgt == null || tgt === K.pc || !/^(Secondary dominant|Extended dominant)$/.test(aB.origin)) continue;
    const t = triadOnPc(tgt), minor = t ? t.q.minor : false;
    const rn = (A.qid === 'm7b5' ? 'iiø7' : 'ii' + rnSuffix(A.q)) + '/' + rnOfTriadPc(tgt);
    if (!over[i]) over[i] = { ...an[i], rn, origin: 'Secondary ii–V', fn: 'PD', tension: 2.2, tonic: tgt,
      src: srcKeyFor(A, tgt, minor), inKeyToo: an[i].inKey,
      text: `${an[i].inKey ? `${A.symbol} is in the key (${an[i].rn}), but here` : 'Here'} it works as the ii of ${t ? t.symbol : nameFor(tgt)}: with ${B.symbol} after it, it makes a ii–V that briefly turns ${t ? t.symbol : nameFor(tgt)} into a new home (a “tonicization”), the way jazz and pop spotlight a chord.` };
    const end = fifthDown(B, chs[i + 2]) ? i + 2 : i + 1;
    if (!spans.some(s => s.from <= i && s.to >= end)) spans.push({ from: i, to: end, tonic: tgt, minor, kind: 'iiV' });
  }
  // single secondary chords and tonicizations
  an.forEach((a, i) => {
    const o = over[i] || a, t = o.target != null ? o.target : o.tonic;
    if (t == null || t === K.pc || !/Secondary|Leading-tone|Tonicization|Tritone|Extended/.test(o.origin)) return;
    if (spans.some(s => s.from <= i && s.to >= i)) return;
    const Y = triadOnPc(t);
    const end = chs[i + 1] && chs[i + 1].rootPc === t ? i + 1 : i;
    spans.push({ from: i, to: end, tonic: t, minor: Y ? Y.q.minor : false, kind: 'one' });
  });
  spans.forEach(s => {
    if (s.label) return;
    const k = makeKey(s.tonic, s.minor ? 'aeolian' : 'major');
    s.label = `→ ${k.name}`;
  });
  spans.sort((a, b) => a.from - b.from || b.to - a.to);
  return { an, over, spans, at: i => over[i] || an[i] };
}
// Roman numerals of a list of chords, read in context
const ctxRns = chs => { const fc = functionChain(chs); return chs.map((_, i) => fc.at(i).rn); };

/* ---- Categories: where a chord is typically used, and when it doesn't work ---- */
const AN_USE = {
  sec: { name: 'Secondary dominant', place: 'Right before the chord it points at: at the end of a phrase as a turnaround into the next section, in a pre-chorus to lift into the chorus, or anywhere a chord should feel like a small arrival.', not: 'When it doesn’t go to its target. A V7/x that wanders off sounds like a wrong turn (unless the next chord is another dominant, a chain, or a deliberate deceptive move). It also clashes with a melody that sings the plain note it changes (C in C major against A7, which has C♯).' },
  lt: { name: 'Secondary leading-tone chord', place: 'Passing between two chords a step apart (C – C♯°7 – Dm), or in place of a secondary dominant for a more dramatic, classical or gospel sound.', not: 'Held for long it sounds unsettled; it needs to move on, by half steps, into its target.' },
  ii: { name: 'Secondary ii–V', place: 'As the first half of a ii–V into a chord you want to spotlight. Very common in jazz standards and in bridges that visit another key for a few bars.', not: 'Without the V7 after it, it is just a chord outside the key and can sound like a mistake.' },
  ext: { name: 'Extended dominant', place: 'Turnarounds and bridges: a run of dominants (E7–A7–D7–G7–C) builds tension that is let go only at the end. Ragtime, jazz, rockabilly and 1960s pop love it.', not: 'A chain that is too long loses the sense of key: keep it to 2–4 chords and land clearly.' },
  tz: { name: 'Tonicization', place: 'Briefly, to hint at another key: often in a bridge, or right before a real key change.', not: 'The rare ones (iii/x, vi/x, ♭VII/x) don’t pull strongly anywhere: use them for color, not to drive the music forward.' },
  borrowed: { name: 'Borrowed chord (modal mixture)', place: 'Where the mood should change without a key change: iv or ♭VI near the end of a phrase or chorus for a bittersweet turn, ♭VII right before the tonic for a rock cadence, ♭III or ♭VI for an anthem-like lift.', not: 'Under a melody note from the major key (an A sung over Fm clashes), or so often that the key becomes unclear.' },
  neap: { name: 'Neapolitan', place: 'Right before V at a dramatic cadence: the end of a chorus or a classical phrase.', not: 'Going anywhere other than the dominant; it is a pre-dominant and wants V next.' },
  tritone: { name: 'Tritone substitute', place: 'In place of a V7 (or V7/x) at a cadence: jazz, bossa nova and soul. The bass slides down a half step into the target.', not: 'In plain folk or rock songs it can sound out of style.' },
  mediant: { name: 'Chromatic mediant', place: 'A cinematic shift between sections (verse → chorus) or a sudden change of light within a phrase.', not: 'Without a shared note or smooth voice leading it sounds like a jump cut.' },
  dom: { name: 'Major dominant in minor', place: 'At cadences in a minor key: the raised 7th makes a leading tone, so V pulls home much harder than the scale’s own v.', not: 'In a modal, folk or rock minor sound, the plain v or ♭VII may fit the style better.' },
  chrom: { name: 'Chromatic chord', place: 'As a passing chord whose notes slide by half step into the next chord.', not: 'When it has no smooth link to the chords around it.' },
  T: { name: 'Tonic function', place: 'Home: the start and end of phrases and sections. iii and vi are softer stand-ins (vi after V makes the deceptive cadence).', not: '' },
  PD: { name: 'Pre-dominant function', place: 'In the middle of a phrase, leading to the dominant (ii–V, IV–V), or straight home for a plagal “amen” ending.', not: '' },
  D: { name: 'Dominant function', place: 'At the end of a phrase: resolving home (a cadence) or left hanging (a half cadence, a question the next phrase answers).', not: '' },
};
function anCat(a){
  const o = a.origin || '';
  if (o === 'Secondary dominant') return 'sec';
  if (o === 'Leading-tone chord') return a.target === K.pc ? 'D' : 'lt';
  if (o === 'Extended dominant') return 'ext';
  if (o === 'Secondary ii–V') return 'ii';
  if (o.startsWith('Tonicization')) return /^ii/.test(a.rn) ? 'ii' : 'tz';
  if (o === 'Borrowed') return 'borrowed';
  if (o === 'Neapolitan') return 'neap';
  if (o === 'Tritone substitute') return 'tritone';
  if (o === 'Chromatic mediant') return 'mediant';
  if (o === 'Major dominant') return 'dom';
  if (o === 'In the key') return a.fn === 'X' ? 'PD' : a.fn;
  return 'chrom';
}
// in key / secondary / borrowed / chromatic: the colors of the progression view
function anOrigin(a){
  const c = anCat(a);
  if (['sec', 'lt', 'ext', 'ii', 'tz', 'tritone'].includes(c)) return 'sec';
  if (['borrowed', 'neap', 'dom'].includes(c)) return 'bor';
  if (c === 'mediant' || c === 'chrom') return 'chr';
  return 'in';
}
const AN_ORIGIN_NAME = { in: 'In the key', sec: 'Secondary (from the key of another chord)', bor: 'Borrowed (from a parallel scale)', chr: 'Chromatic' };

/* ---- State and opening ---- */
// ui.an = { key, part, chs, focus, view: 'chord'|'prog', live, title, from }
function anEl(){
  let el = $('#anPanel');
  if (el) return el;
  el = document.createElement('aside');
  el.id = 'anPanel'; el.className = 'anpanel'; el.hidden = true;
  el.setAttribute('role', 'complementary'); el.setAttribute('aria-label', 'Analyzer');
  document.body.appendChild(el);
  return el;
}
const anIn = fn => inSection({ key: ui.an.key }, fn);
// open with a snapshot; live: follows the progression as it is edited
function anOpenWith(o){
  ui.an = { view: 'chord', live: false, focus: 0, title: '', ...o, key: clone(o.key || docKey()) };
  anEl().hidden = false;
  document.body.classList.add('an-open');
  anRender();
  anEl().scrollTop = 0;
}
function anClose(){
  const el = $('#anPanel');
  if (el) el.hidden = true;
  document.body.classList.remove('an-open');
  if (ui.an) ui.an.closed = true;
}
const anIsOpen = () => !!($('#anPanel') && !$('#anPanel').hidden);
// the live analyzer follows the progression builder (called after renderProg)
function anRefresh(){
  if (!anIsOpen() || !ui.an || !ui.an.live) return;
  ui.an.chs = progChords(); ui.an.key = clone(docKey());
  if (ui.an.view === 'chord') ui.an.focus = clamp(ui.selSlot, 0, Math.max(0, ui.an.chs.length - 1));
  anRender();
}

/* ---- Rendering ---- */
function anRender(){
  const el = anEl(), A = ui.an;
  if (!A) return;
  const body = anIn(() => A.chs.length ? (A.view === 'prog' ? anProgHTML() : anChordHTML()) : '<p class="muted">Add chords to the progression to analyze them.</p>');
  const focusIn = () => el.querySelectorAll('.an-scroll').forEach(sc => { const f = sc.querySelector('.an-cell.focus, .an-c.on'); if (f && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = Math.max(0, f.offsetLeft - sc.clientWidth / 2 + f.offsetWidth / 2); });
  el.innerHTML = `<div class="an-h"><div class="an-t"><span class="lbl">Analyzer · ${esc(keyName(A.key))}</span><b>${esc(A.title || (A.view === 'prog' ? 'The progression' : 'Chord'))}</b></div>
    <div class="seg an-seg" role="group" aria-label="Analyzer view"><button data-act="anView" data-v="prog" aria-pressed="${A.view === 'prog'}">Progression</button><button data-act="anView" data-v="chord" aria-pressed="${A.view === 'chord'}">Chord</button></div>
    <button class="mx" data-act="anClose" aria-label="Close the analyzer" title="Close (Esc)">×</button></div>${body}`;
  focusIn();
}
// a chord's name and Roman numeral, small
const anChip = (ch, rn, cls = '') => `<span class="an-cell ${cls}"><b>${ch.symbol}</b><small>${rn}</small></span>`;
// '2' → '2nd', '♭6' → '♭6th'
const degOrd = l => { const n = +l.replace(/[^\d]/g, ''); return l + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); };
function anChordHTML(){
  const A = ui.an, chs = A.chs, i = clamp(A.focus, 0, chs.length - 1), ch = chs[i];
  const fc = functionChain(chs), a = fc.at(i), cat = anCat(a), use = AN_USE[cat];
  const prev = i > 0 ? chs[i - 1] : null, next = i < chs.length - 1 ? chs[i + 1] : null;
  const tgt = a.target != null ? a.target : a.tonic != null ? a.tonic : null;
  const tgtCh = tgt != null ? (next && next.rootPc === tgt ? next : (triadOnPc(tgt) || chordAt(tgt, 'maj'))) : null;
  const src = a.src || null, srcK = src ? makeKey(src.pc, src.base || src.scale) : null, srcFull = src ? makeKey(src.pc, src.scale) : null;
  // the ruler: 12 columns from the home tonic; the home key's chords, and the source key's
  // plain triads keep the rows easy to read; the chord itself is shown as it is
  const sev = false;
  const home = K.hept ? K.notes.map((_, j) => diatonic(j, sev)) : [];
  const srcRow = srcK && srcK.hept ? srcK.notes.map((_, j) => stackChord(srcK.notes, srcK.L, j, sev)) : [];
  const homeRn = c => analyze(c).rn;
  const srcRn = c => inSection({ key: { pc: srcK.pc, scale: srcK.sc.id } }, () => analyze(c).rn);
  const cols = Array.from({ length: 12 }, (_, j) => mod(K.pc + j));
  const homeAt = pc => home.find(c => c.rootPc === pc), srcAt = pc => pc === ch.rootPc ? ch : srcRow.find(c => c.rootPc === pc);
  const shared = c => c && home.some(h => h.symbol === c.symbol) && (srcRow.some(s => s.symbol === c.symbol) || c === ch);
  const head = cols.map(pc => `<span class="an-col">${nameFor(pc)}</span>`).join('');
  const row1 = cols.map(pc => { const c = homeAt(pc); return c ? anChip(c, homeRn(c), `${shared(c) && srcRow.length ? 'shared' : ''}${tgtCh && c.rootPc === tgt ? ' target' : ''}${c.symbol === ch.symbol ? ' focus' : ''}`) : '<span class="an-cell empty"></span>'; }).join('');
  const row2 = srcRow.length ? cols.map(pc => { const c = srcAt(pc); if (!c) return '<span class="an-cell empty"></span>'; const isF = c === ch || c.symbol === ch.symbol; return anChip(c, isF ? (srcFull.pcs && ch.pcs.every(p => srcFull.pcs.has(p)) ? inSection({ key: { pc: srcFull.pc, scale: srcFull.sc.id } }, () => analyze(ch).rn) : '★') : srcRn(c), `${home.some(h => h.symbol === c.symbol) ? 'shared' : ''}${isF ? ' focus' : ''}${tgtCh && c.rootPc === tgt && !isF ? ' target' : ''}`); }).join('')
    : cols.map(pc => pc === ch.rootPc ? anChip(ch, a.rn, 'focus') : '<span class="an-cell empty"></span>').join('');
  const srcName = src ? keyNameOf(src) : '';
  const ruler = `<div class="an-scroll"><div class="an-ruler">
    ${head}
    <span class="an-rl">${esc(K.name)} <small>home key</small></span>${row1}
    <span class="an-rl">${src ? esc(srcName) : 'Outside the key'} <small>${src ? (cat === 'borrowed' || cat === 'neap' || cat === 'dom' ? 'where it is borrowed from' : 'where it comes from') : 'this chord'}</small></span>${row2}
  </div></div>
  <p class="hint an-key">${src ? `Shaded chords are in both keys. ${ch.symbol} is outlined${tgtCh ? `; it points at <b>${tgtCh.symbol}</b> (outlined in the home key)` : ''}. ${src.scale !== (src.base || src.scale) ? `Its notes come from ${esc(SC[src.scale].name.toLowerCase())} on ${esc(srcK.notes[0].name)}.` : ''}` : `${ch.symbol} is not in any key next door: it is a color chord.`}</p>
  ${tgtCh ? `<p class="an-arrow"><b>${ch.symbol}</b> <span aria-hidden="true">──►</span> <b>${tgtCh.symbol}</b> <span class="muted">${a.rn} → ${analyze(tgtCh).rn}</span></p>` : ''}`;
  // the chord's notes against the home scale
  const notes = ch.tones.map(t => {
    const inHome = K.pcs.has(t.pc);
    let why = inHome ? `in ${K.name}` : `not in ${K.name}`;
    if (!inHome && src){
      const sn = srcFull.notes[0].name, deg = srcFull.notes.find(x => x.pc === t.pc);
      if (mod(src.pc - t.pc) === 1 && src.pc !== K.pc) why = `the leading tone of ${sn}: a half step below it, it pulls up into ${sn}${srcK.pcs.has(t.pc) ? '' : ` (${srcName}’s raised 7th, from harmonic minor)`}`;
      else if (mod(src.pc - t.pc) === 1) why = `the leading tone: a half step below ${sn}, it pulls up into it (from harmonic minor)`;
      else if (deg) why = `the ${degOrd(deg.lbl)} note of ${srcName}${srcK.pcs.has(t.pc) ? '' : ` (from ${SC[src.scale].name.toLowerCase()})`}${cat === 'borrowed' ? `, borrowed into ${K.name}` : ''}`;
    }
    if (!inHome && t.num === 7 && isDom7(ch)) why += '; as the 7th of a dominant it wants to fall a step';
    return `<span class="an-note${inHome ? '' : ' out'}"><b>${t.name}</b><small>${t.lbl === '1' ? 'root' : t.lbl}</small><i>${why}</i></span>`;
  }).join('');
  // voice leading prev → chord → next (the upper voices, voiced as smoothly as playback does)
  const v1 = leadUpper(ch, prev ? rootUpper(prev) : null), v0 = prev ? rootUpper(prev) : null, v2 = next ? leadUpper(next, v1) : null;
  const near = (m, list) => list.reduce((b, x) => Math.abs(x - m) < Math.abs(b - m) ? x : b, list[0]);
  const step = (x, y, chX, chY) => {
    const d = y - x, ad = Math.abs(d), nm = (c, m) => (toneOf(c, m) || { name: nameFor(m) }).name;
    const how = d === 0 ? 'stays' : `${d > 0 ? '↑' : '↓'} ${ad === 1 ? 'half step' : ad === 2 ? 'whole step' : ad + ' half steps'}`;
    return `<span class="an-mv${ad === 1 ? ' half' : d === 0 ? ' hold' : ''}">${how}</span><b>${nm(chY, y)}</b>`;
  };
  const vl = v1.slice().sort((x, y) => y - x).map(m => {
    const t = toneOf(ch, m), role = t && t.num === 3 && isDomType(ch) && a.fn === 'D' ? 'leading tone' : t && t.num === 7 && isDom7(ch) ? '7th' : '';
    return `<div class="an-vrow">${v0 ? (() => { const p = near(m, v0); return `<b>${(toneOf(prev, p) || { name: nameFor(p) }).name}</b>${step(p, m, prev, ch).replace(/<b>.*<\/b>$/, '')}`; })() : ''}<b class="an-me">${t ? t.name : nameFor(m)}${role ? `<small>${role}</small>` : ''}</b>${v2 ? step(m, near(m, v2), ch, next) : ''}</div>`;
  }).join('');
  const tr = next ? transition(ch, next) : null;
  const own = tgt != null && tgtCh ? (a.tonic != null && a.target == null ? [ch, chordAt(tgt + 7, '7'), tgtCh] : [ch, tgtCh])
    : src ? [stackChord(srcFull.notes, srcFull.L, 0, false), ch, stackChord(srcFull.notes, srcFull.L, 0, false)] : null;
  ui.anPlay = { chord: [ch], ctx: [prev, ch, next].filter(Boolean), own };
  const nav = chs.length > 1 ? `<div class="an-nav">${chs.map((c, j) => `<button class="cchip${j === i ? ' on' : ''}" data-act="anChord" data-i="${j}">${c.symbol}</button>`).join('')}</div>` : '';
  return `${nav}
    <div class="an-head"><div class="big-sym">${ch.symbol}</div><div><div class="mono an-rn">${a.rn}</div><span class="pill an-o-${anOrigin(a)}">${esc(use ? use.name : a.origin)}</span>${a.inKeyToo ? ' <span class="pill k-ok">also in the key</span>' : ''}</div></div>
    <div class="acts"><button class="btn sm" data-act="anPlay" data-arg="chord">▶ Chord</button>${prev || next ? `<button class="btn sm" data-act="anPlay" data-arg="ctx">▶ ${[prev, ch, next].filter(Boolean).map(c => c.symbol).join(' → ')}</button>` : ''}${own ? `<button class="btn sm" data-act="anPlay" data-arg="own" title="${src ? `In ${esc(srcName)}` : ''}">▶ In its own key: ${own.map(c => c.symbol).join(' → ')}</button>` : ''}</div>
    <p>${a.text}</p>
    <h4 class="an-h4">Where it comes from</h4>${ruler}
    <h4 class="an-h4">Its notes</h4><div class="an-notes">${notes}</div>
    ${v0 || v2 ? `<h4 class="an-h4">How the voices move</h4><div class="an-vl">${vl}</div><p class="hint">${prev ? prev.symbol + ' → ' : ''}<b>${ch.symbol}</b>${next ? ' → ' + next.symbol : ''}, top voice first. Half steps (highlighted) are the strongest pulls; notes that stay tie the chords together.</p>` : ''}
    ${tr ? `<h4 class="an-h4">Why it works into ${next.symbol}</h4><ul class="an-ul">${tr.lines.slice(0, 4).map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
    ${use ? `<h4 class="an-h4">Where it is used</h4><p>${use.place}</p>${use.not ? `<h4 class="an-h4">When it doesn’t work</h4><p>${use.not}</p>` : ''}` : ''}`;
}
// The strip of chords colored by origin, with brackets over the tonicized spans and the function flow (in the key K).
// act/attrs: what clicking a chord does
function anStripHTML(chs, focus, act = 'anChord', attrs = ''){
  const fc = functionChain(chs), n = chs.length;
  // brackets in rows so overlapping spans don't collide
  const levels = [];
  fc.spans.forEach(s => { let l = levels.findIndex(end => end < s.from); if (l < 0){ l = levels.length; levels.push(-1); } levels[l] = s.to; s.level = l; });
  const L = levels.length;
  const br = fc.spans.map(s => `<span class="an-br an-br-${s.kind}" style="grid-column:${s.from + 1} / ${s.to + 2};grid-row:${s.level + 1}" title="${esc(s.label)}">${esc(s.label)}</span>`).join('');
  const cells = chs.map((c, i) => { const a = fc.at(i), o = anOrigin(a); return `<button class="an-c an-o-${o}${i === focus ? ' on' : ''}" style="grid-row:${L + 1}" data-act="${act}" data-i="${i}" ${attrs} title="${esc(a.origin)}"><b>${c.symbol}</b><small>${a.rn}</small></button>`; }).join('');
  const fns = chs.map((c, i) => { const a = fc.at(i); return `<span class="an-fn" style="grid-row:${L + 2}"><i class="${FN_CLASS[a.fn]}"></i>${a.fn === 'X' ? '★' : a.fn}</span>`; }).join('');
  return `<div class="an-scroll"><div class="an-prog" style="grid-template-columns:repeat(${n}, minmax(62px, 1fr))">${br}${cells}${fns}</div></div>`;
}
const anLegendHTML = (counts = {}) => `<div class="an-legend">${Object.keys(AN_ORIGIN_NAME).map(k => `<span><i class="an-sw an-o-${k}"></i>${AN_ORIGIN_NAME[k]}${counts[k] ? ` (${counts[k]})` : ''}</span>`).join('')}</div>`;
function anProgHTML(){
  const A = ui.an, chs = A.chs, fc = functionChain(chs);
  const counts = { in: 0, sec: 0, bor: 0, chr: 0 };
  chs.forEach((c, i) => counts[anOrigin(fc.at(i))]++);
  const outside = chs.map((c, i) => ({ c, i, a: fc.at(i) })).filter(x => anOrigin(x.a) !== 'in');
  return `${anLegendHTML(counts)}
    ${anStripHTML(chs, A.focus)}
    <p class="hint">Brackets mark chords that visit another key for a moment (a tonicization) and where they land. The bottom line is the function flow: T tonic (home), PD pre-dominant (moving away), D dominant (tension), ★ outside color. Click a chord for the details.</p>
    ${outside.length ? `<h4 class="an-h4">Chords from outside ${esc(K.name)}</h4><div class="recs">${outside.map(x => `<div class="rec idea"><div class="rw"><span class="pill an-o-${anOrigin(x.a)}">${x.c.symbol} · ${x.a.rn}</span>${esc(AN_USE[anCat(x.a)] ? AN_USE[anCat(x.a)].name : x.a.origin)}${x.a.src ? `, from ${esc(keyNameOf(x.a.src))}` : ''}.</div><div class="ra"><button class="btn sm" data-act="anChord" data-i="${x.i}">Details</button></div></div>`).join('')}</div>` : `<p>Every chord is in ${esc(K.name)}.</p>`}`;
}

/* ---- Actions ---- */
Object.assign(ACT, {
  anOpen: () => anOpenWith({ chs: progChords(), view: 'prog', live: true, focus: ui.selSlot, title: W.edit ? `Section: ${(partById(W.edit) || {}).name || ''}` : W.prog.name }),
  anSel: () => anOpenWith({ chs: progChords(), view: 'chord', live: true, focus: ui.selSlot, title: W.edit ? `Section: ${(partById(W.edit) || {}).name || ''}` : W.prog.name }),
  anClose: () => anClose(),
  anView: el => { ui.an.view = el.dataset.v; anRender(); },
  anChord: el => { ui.an.focus = +el.dataset.i; ui.an.view = 'chord'; anRender(); anEl().scrollTop = 0; },
  anPlay: el => { const p = ui.anPlay && ui.anPlay[el.dataset.arg]; if (p) previewSeq(p); },
  // "Why?" on a suggestion: the progression as if it were added after the selected chord
  recWhy: el => {
    const r = ui.recs[+el.dataset.i]; if (!r) return;
    const chs = progChords(), at = ui.recAt ?? chs.length - 1;
    const list = [...chs.slice(0, at + 1), r.ch, ...chs.slice(at + 1)];
    anOpenWith({ chs: list, focus: at + 1, view: 'chord', title: chs[at] ? `If ${r.ch.symbol} came after ${chs[at].symbol}` : `Starting with ${r.ch.symbol}` });
  },
  // "Why?" on a substitution: the progression with the swap or the chords inserted before
  subWhy: el => {
    const s = ui.subs[+el.dataset.i]; if (!s) return;
    const chs = progChords(), i = ui.selSlot, X = chs[i];
    const list = s.kind === 'swap' ? [...chs.slice(0, i), ...s.chs, ...chs.slice(i + 1)] : [...chs.slice(0, i), ...s.chs, X, ...chs.slice(i + 1)];
    anOpenWith({ chs: list, focus: i, view: 'chord', title: s.kind === 'swap' ? `${s.chs.map(c => c.symbol).join(' ')} in place of ${X.symbol}` : `${s.chs.map(c => c.symbol).join(' ')} before ${X.symbol}` });
  },
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && anIsOpen() && $('#modal').hidden){ anClose(); } });
