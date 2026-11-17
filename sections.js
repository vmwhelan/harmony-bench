'use strict';
/* ================= Song sections: keys, meters, tempos, key-change ideas =================
   Each song section has its own key (its chords are stored relative to it) and can have its own time
   signature and tempo. The song has a home key: the key in the header while the Song builder is open.
   Changing the home key only moves the sections when "Keep every section in the song key" is on;
   otherwise sections in another key are flagged until they are matched or kept as a key change.
   Loaded after print.js and before docs.js (which boots the app). */

const sameKey = (a, b) => !!(a && b && a.pc === b.pc && a.scale === b.scale);
const keyName = k => makeKey(k.pc, k.scale).name;
const secKey = p => p.key || W.song.key || keyNow();
const tsEq = (a, b) => !!(a && b && a.num === b.num && a.den === b.den && JSON.stringify(a.groups || null) === JSON.stringify(b.groups || null));
const tsText = ts => `${ts.num}/${ts.den}`;

// Runs fn with the key, time signature and tempo set to a song section's, then puts them back.
// fn must only read (no saving or rendering of the page).
function inSection(p, fn, bpmScale = 1){
  if (!p) return fn();
  const k = secKey(p), saved = { K, keyPc: S.keyPc, scale: S.scale, ts: S.ts, bpm: S.bpm, strum: S.strum, strumRestart: S.strumRestart };
  const swap = k.pc !== S.keyPc || k.scale !== S.scale;
  if (swap){ S.keyPc = k.pc; S.scale = k.scale; K = makeKey(k.pc, k.scale); ACACHE.clear(); }
  if (p.ts) S.ts = p.ts;
  if (p.bpm) S.bpm = Math.round(p.bpm * bpmScale);
  if (p.strum) S.strum = p.strum;
  if (p.strumRestart != null) S.strumRestart = p.strumRestart;
  try { return fn(); }
  finally {
    if (swap){ K = saved.K; ACACHE.clear(); }
    S.keyPc = saved.keyPc; S.scale = saved.scale; S.ts = saved.ts; S.bpm = saved.bpm; S.strum = saved.strum; S.strumRestart = saved.strumRestart;
  }
}
const secTs = p => (p && p.ts) || S.ts;
const secBpm = p => (p && p.bpm) || S.bpm;
// The song in playing order: one entry per chord, with its section and the chord itself (in the section's key)
function songSeq(){
  return W.song.order.flatMap((id, o) => {
    const p = partById(id);
    return p ? p.items.map((it, i) => ({ it, i, o, sec: p, ch: inSection(p, () => fromItem(it)) })) : [];
  });
}

/* ---- Which key the header shows ----
   Scales, Chord library and Learn: the explore key (S.explore), which never changes a progression or a song.
   Song builder: the song's home key. Editing a section: that section's key. Progression builder: the progression's. */
const EXPLORE_TABS = ['scales', 'chords', 'learn'];
const docCtx = () => W.edit && partById(W.edit) ? 'part' : S.tab === 'song' ? 'song' : 'prog';
const keyCtx = () => EXPLORE_TABS.includes(S.tab) ? 'explore' : docCtx();
// The key stored for a context (null if it has none yet)
function ctxKey(ctx){
  if (ctx === 'explore') return S.explore || null;
  if (ctx === 'song') return W.song.key || null;
  if (ctx === 'part'){ const p = partById(W.edit); return p ? secKey(p) : null; }
  return W.prog.keyAt || null;
}
// The key of the document open in the builders (the section being edited, or the progression; on the Song tab, the song)
const docKey = () => ctxKey(docCtx()) || keyNow();
function ctxLabel(ctx = keyCtx()){
  if (ctx === 'explore') return 'Explore key';
  if (ctx === 'song') return 'Song key';
  if (ctx === 'part'){ const p = partById(W.edit); return `Section key: ${p ? p.name : ''}`; }
  return 'Progression key';
}
// "your progression “C Major Progression”" / "the section “Verse”" / "your song “…”"
function docLabel(ctx = docCtx()){
  if (ctx === 'part'){ const p = partById(W.edit); return `the section “${esc(p ? p.name : '')}”`; }
  if (ctx === 'song') return `your song “${esc(W.song.name)}”`;
  refreshAutoName();
  return `your progression “${esc(W.prog.name)}”`;
}
function ensureSongKeys(){
  if (!W.song.key) W.song.key = clone(W.prog.keyAt || keyNow());
  W.song.parts.forEach(p => { if (!p.key) p.key = clone(W.song.key); });
}
// Put a context's key into the header (when that context comes to the front)
function loadCtxKey(ctx){
  const k = ctxKey(ctx);
  if (!k || sameKey(k, keyNow())) return;
  const from = keyNow();
  S.keyPc = k.pc; S.scale = k.scale; computeKey();
  keyLog({ where: ctxLabel(ctx), doc: ctx === 'explore' ? '' : ctx === 'song' ? W.song.name : ctx === 'part' ? (W.song.name || '') : W.prog.name, from, to: k, chords: 'n/a', view: true, cause: ui.keyCause || 'tab' });
}
// Called from renderAll, after any key change or switch of tab
function syncKeys(){
  if (!W) return;
  ensureSongKeys();
  if (!W.prog.keyAt) W.prog.keyAt = keyNow();
  if (!S.explore) S.explore = keyNow();
  const ctx = keyCtx();
  if (ctx !== ui.keyCtx){
    // a different document (or the explore key) is in front now: show its key, change nothing
    ui.keyCtx = ctx;
    loadCtxKey(ctx);
    return;
  }
  if (ctx === 'explore'){ if (!sameKey(S.explore, keyNow())){ S.explore = keyNow(); save(); } }
  else if (ctx === 'prog') keyGuard();
  else if (ctx === 'part'){
    const p = partById(W.edit), now = keyNow();
    if (!sameKey(p.key, now)){
      const from = clone(p.key);
      p.key = now;
      keyLog({ where: ctxLabel('part'), doc: W.song.name, from, to: now, chords: 'moved' });
      save();
    }
  }
  else songKeyChanged();
}
function songKeyChanged(){
  const old = W.song.key, now = keyNow();
  if (sameKey(old, now)) return;
  const moved = [];
  if (W.song.follow){
    const d = now.pc - old.pc;
    W.song.parts.forEach(p => {
      const from = clone(p.key);
      p.key = { pc: mod(p.key.pc + d), scale: p.key.scale === old.scale ? now.scale : p.key.scale };
      if (!sameKey(from, p.key)){ moved.push(p); keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from, to: p.key, chords: 'moved', cause: 'follow' }); }
    });
  }
  const from = clone(old), cause = ui.keyCause;
  W.song.key = clone(now);
  keyLog({ where: 'Song key', doc: W.song.name, from, to: now, chords: moved.length ? `${moved.length} section${moved.length > 1 ? 's' : ''} moved` : 'sections kept their keys' });
  save();
  if (cause === 'header') toast(`The song's home key is now ${esc(keyName(now))}${moved.length ? `; ${moved.length} section${moved.length > 1 ? 's' : ''} moved with it` : '; the sections kept their own keys'}.`, { label: 'Undo', fn: () => { S.keyPc = from.pc; S.scale = from.scale; renderAll(); } });
}
const offKey = p => !sameKey(secKey(p), W.song.key) && !p.keyOk;
// Custom guitar shapes slide along with the chords when a section moves by d semitones
function slideShapes(items, d){
  items.forEach(it => {
    if (Array.isArray(it.pv)) it.pv = it.pv.map(m => m + d);
    // every instrument's and tuning's shape moves (a shape with open strings can't slide: it is kept, and the
    // nearest shape is used if it no longer fits)
    Object.values(vosOf(it) || {}).filter(Boolean).forEach(vo => {
      const moved = vo.frets.map(f => f === null ? null : f + d);
      if (moved.every(f => f === null || (f >= 1 && f <= FRETS))) vo.frets = moved;
      vo.pos = clamp(vo.pos + d, 0, FRETS);
    });
  });
}
/* ---- Key analysis in the Song builder ---- */
// A section's chords, analyzed in a key (by default its own): the same key check as the Progression builder
function partCenter(p){
  if (!p.items.length) return null;
  return inSection(p, () => detectCenter(p.items.map(fromItem), p.items));
}
// Re-label a section in another key: its chords and voicings stay exactly as they are
function rekeyPart(p, pc, scale){
  const keep = inSection(p, () => keepItems(p.items)), from = clone(secKey(p));
  p.key = { pc, scale }; p.keyOk = !sameKey(p.key, W.song.key);
  inSection(p, () => relabelItems(p.items, keep));
  if (!sameKey(from, p.key)) keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from, to: p.key, chords: 'kept (re-labelled)' });
}
// Where the whole song (in arrangement order) feels at home, judged in the song key
function songCenter(){
  const seq = songSeq();
  if (seq.length < 3) return null;
  const c = inSection({ key: W.song.key }, () => detectCenter(seq.map(e => e.ch), seq.map(e => e.it)));
  // another mode of the same notes (G major → C Lydian) only when a section in the song key hears it too:
  // a song can dwell on IV for many bars and still have every section sound at home on I
  if (c && c.same){
    const used = [...new Set(W.song.order)].map(partById).filter(p => p && p.items.length >= 3 && sameKey(secKey(p), W.song.key));
    if (used.length && used.every(p => !partCenter(p))) return null;
  }
  return c;
}
function partAnalysisHTML(p){
  if (!p.items.length) return '';
  const c = partCenter(p), k = secKey(p);
  const chs = inSection(p, () => p.items.map(fromItem));
  const banner = c ? `<div class="banner soft"><span>${c.pc === k.pc ? `Its chords fit <b>${esc(c.name)}</b> better than ${esc(keyName(k))} (${c.inside} of ${c.total} chords).` : `This section sounds centered on <b>${c.chord ? c.chord.symbol : esc(c.name)}</b>, not ${esc(keyName(k))}: it starts or ends there and its strongest moves resolve there.`} Its chords stay the same.</span><button class="btn primary sm" data-act="partRecenter" data-arg="${p.id}" data-pc="${c.pc}" data-scale="${c.scale}">Analyze in ${esc(c.name)}</button></div>` : '';
  return `${banner}<details class="part-an"><summary>How it works</summary>${inSection(p, () => `<div class="tchart">${tensionChart(chs, p.items)}</div><p class="summary">${summary(chs, p.items)}</p>`)}</details>`;
}
function songAnalysisHTML(){
  const c = songCenter();
  if (!c) return '';
  const k = W.song.key;
  return `<div class="banner soft"><span>The song as a whole sounds centered on <b>${c.chord ? c.chord.symbol : esc(c.name)}</b>${c.pc === k.pc ? ` and fits <b>${esc(c.name)}</b> best` : ''}, not ${esc(keyName(k))}. Analyzing it in ${esc(c.name)} re-labels the sections that are in the song key; every chord stays the same.</span><button class="btn primary sm" data-act="songRecenter" data-pc="${c.pc}" data-scale="${c.scale}">Analyze the song in ${esc(c.name)}</button></div>`;
}
// Move a section to another key: 'move' keeps the Roman numerals (the chords change), 'keep' keeps the chords
function setPartKey(p, k, how){
  const from = clone(secKey(p));
  if (!sameKey(from, k)) keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from, to: k, chords: how === 'keep' ? 'kept (re-labelled)' : 'moved' });
  if (how === 'keep'){
    const abs = inSection(p, () => p.items.map(absFromItem));
    p.key = clone(k);
    p.items.splice(0, p.items.length, ...inSection(p, () => abs.map(itemFromAbs)));
  } else {
    slideShapes(p.items, mod(k.pc - secKey(p).pc + 6) - 6);
    p.key = clone(k);
  }
  p.keyOk = !sameKey(p.key, W.song.key);
}
function setPartTs(p, ts){
  const cur = secTs(p), f = ts.num / cur.num;
  p.items.forEach(it => { it.b = Math.max(1, Math.round(it.b * f)); });
  p.ts = tsEq(ts, S.ts) ? null : ts;
}

/* ---- Section header controls (on the Song builder) ---- */
const PC_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
function partKeyHTML(p){
  const k = secKey(p), ts = secTs(p);
  const badge = offKey(p)
    ? `<span class="pill k-weak" title="This section is not in the song key">Not in ${esc(keyName(W.song.key))}</span><button class="btn sm" data-act="pkeyMatch" data-arg="${p.id}" title="Move this section's chords into the song key (the Roman numerals stay the same)">Match to ${esc(keyName(W.song.key))}</button><button class="btn sm" data-act="pkeyOk" data-arg="${p.id}" title="Keep this section in its own key: a deliberate key change">Keep ${esc(keyName(k))}</button>`
    : !sameKey(k, W.song.key) ? `<span class="pill k-color" title="This section is in its own key">Key change</span>` : '';
  return `<div class="pkeys">
    <label class="fld"><span>Key</span><span class="pk2"><select class="pkPc" data-part="${p.id}" aria-label="Section key">${PC_NAMES.map((n, i) => `<option value="${i}"${i === k.pc ? ' selected' : ''}>${n}</option>`).join('')}</select><select class="pkSc" data-part="${p.id}" aria-label="Section scale">${SCLIST.map(sc => `<option value="${sc.id}"${sc.id === k.scale ? ' selected' : ''}>${sc.name}</option>`).join('')}</select></span></label>
    <label class="fld"><span>Time</span><select class="pkTs" data-part="${p.id}" aria-label="Section time signature"><option value="">Song (${tsText(S.ts)})</option>${TS_PRESETS.map(([a, b]) => `<option value="${a}/${b}"${p.ts && tsText(p.ts) === `${a}/${b}` ? ' selected' : ''}>${a}/${b}</option>`).join('')}</select></label>
    <label class="fld"><span>Tempo</span><input type="number" class="pkBpm" data-part="${p.id}" min="30" max="300" placeholder="${S.bpm}" value="${p.bpm || ''}" aria-label="Section tempo (empty: the song tempo)" title="Empty: the song tempo"></label>
    ${S.style === 'rhythm' && kind() !== 'bass' ? `<label class="fld"><span>Pattern</span><select class="pkStrum" data-part="${p.id}" aria-label="Section strumming or picking pattern">${inSection({ ...p, strum: null }, () => patternOptions(p.strum || '', true))}</select></label>
    <label class="fld"><span>Pattern restarts</span><select class="pkRestart" data-part="${p.id}" aria-label="Does the pattern restart on each chord in this section?"><option value=""${p.strumRestart == null ? ' selected' : ''}>Song setting (${S.strumRestart ? 'each chord' : 'across the bar'})</option><option value="1"${p.strumRestart === true ? ' selected' : ''}>On each chord</option><option value="0"${p.strumRestart === false ? ' selected' : ''}>Across the bar</option></select></label>` : ''}
    ${badge}</div>`;
}
// Short note of what differs from the song: shown on the arrangement chips and the song sheet
function partTag(p){
  const bits = [];
  if (!sameKey(secKey(p), W.song.key)) bits.push(keyName(secKey(p)));
  if (p.ts) bits.push(tsText(p.ts));
  if (p.bpm) bits.push(p.bpm + ' BPM');
  const pat = p.strum && S.style === 'rhythm' ? patternById(p.strum) : null;
  if (pat || p.strum === 'auto') bits.push(pat ? pat.name : 'Auto rhythm');
  if (p.strumRestart != null && S.style === 'rhythm') bits.push(p.strumRestart ? 'pattern restarts each chord' : 'pattern runs across the bar');
  return bits.join(' · ');
}

/* ---- Key-change and transition ideas ----
   For each move from one section to the next in the arrangement: how to get into a new key (pivot chord,
   the new key's V7), how to get back home, and how to make a same-key return stronger (a borrowed iv, a
   secondary dominant). Plus song-level ideas: lift the last chorus, move the bridge to the IV key. */
function keyTriads(k){ return inSection({ key: k }, () => K.hept ? K.notes.map((_, i) => diatonic(i, false)) : []); }
const rnIn = (k, ch) => inSection({ key: k }, () => analyze(ch).rn);
const lastChordOf = p => p.items.length ? inSection(p, () => fromItem(p.items[p.items.length - 1])) : null;
const firstChordOf = p => p.items.length ? inSection(p, () => fromItem(p.items[0])) : null;
const tonicOf = k => inSection({ key: k }, () => K.hept ? diatonic(0, false) : chordAt(K.pc, K.majorish ? 'maj' : 'm'));
const dom7Of = k => mkChord(mod(k.pc + 7), mod(makeKey(k.pc, k.scale).L + 4, 7), '7');
// Chords that belong to both keys (pivots). If the keys share none, chords borrowed from the parallel key of
// the first one (C minor's Fm, A♭, B♭ for C major) that are at home in the second
function pivotsBetween(kA, kB){
  const tB = keyTriads(kB), inB = c => tB.some(d => d.symbol === c.symbol) && !isDimType(c);
  // best pivots work as a pre-dominant (ii, IV, vi) in the new key; the old tonic itself is a weak one
  const rank = list => list.map(x => ({ ...x, w: (/^(ii|IV|iv|vi|VI)$/.test(rnIn(kB, x.ch)) ? 2 : 0) - (x.ch.rootPc === kA.pc ? 2 : 0) })).sort((a, b) => b.w - a.w);
  const own = keyTriads(kA).filter(inB);
  if (own.length) return rank(own.map(ch => ({ ch, borrowed: false })));
  const par = { pc: kA.pc, scale: makeKey(kA.pc, kA.scale).majorish ? 'aeolian' : 'major' };
  return rank(keyTriads(par).filter(inB).map(ch => ({ ch, borrowed: true, par })));
}
const pivotText = (pv, kA, kB) => `<b>${pv.ch.symbol}</b> ${pv.borrowed ? `(${rnIn(kA, pv.ch)}, borrowed from ${keyName(pv.par)})` : `(${rnIn(kA, pv.ch)} in ${keyName(kA)})`} is ${rnIn(kB, pv.ch)} in ${keyName(kB)}`;
// Ideas for the move from the end of section A into section B (B's first chord, or a target key's tonic)
function pairIdeas(A, B, target){
  const ideas = [], kA = secKey(A), last = A.items[A.items.length - 1];
  const kB = target ? target.key : secKey(B), lastCh = lastChordOf(A), firstCh = target ? tonicOf(kB) : firstChordOf(B);
  const into = target ? target.label : B.name, canSplit = last.b >= 2;
  if (!sameKey(kA, kB)){
    const head = sameKey(kB, W.song.key) ? `Back home to ${keyName(kB)}` : `Into ${keyName(kB)}`;
    const V7 = dom7Of(kB);
    if (canSplit && lastCh.symbol !== V7.symbol)
      ideas.push({ tag: head, kind: 'k-strong', text: `${A.name} → ${into}: end ${A.name} on <b>${V7.symbol}</b>, the V7 of ${keyName(kB)}. Split its last chord (${lastCh.symbol}) into ${lastCh.symbol} + ${V7.symbol} for a strong lead into the new key.`, hear: [lastCh, V7, firstCh], apply: () => splitLast(A, V7) });
    const tB = keyTriads(kB), pv = pivotsBetween(kA, kB).find(x => x.ch.symbol !== lastCh.symbol);
    if (pv && canSplit)
      ideas.push({ tag: pv.borrowed ? 'Borrowed pivot' : 'Pivot chord', kind: 'k-color', text: `${A.name} → ${into}: ${pivotText(pv, kA, kB)}${pv.borrowed ? ' (the two keys share no chords, so borrow one)' : ''}. Ending ${A.name} on it makes the key change smooth: split ${lastCh.symbol} into ${lastCh.symbol} + ${pv.ch.symbol}.`, hear: [lastCh, pv.ch, V7, firstCh], apply: () => splitLast(A, pv.ch) });
    if (tB.some(d => d.symbol === lastCh.symbol))
      ideas.push({ tag: 'Common chord', kind: 'k-ok', text: `${A.name} already ends on <b>${lastCh.symbol}</b>, which is ${rnIn(kB, lastCh)} in ${keyName(kB)}: it works as the pivot as it is, so ${into} can simply start in the new key.`, hear: [lastCh, V7, firstCh] });
    const up = mod(kB.pc - kA.pc);
    if ((up === 1 || up === 2) && kA.scale === kB.scale)
      ideas.push({ tag: 'Direct lift', kind: 'k-ok', text: `${A.name} → ${into} goes up a ${up === 1 ? 'half' : 'whole'} step: a "truck-driver" key change that works with no preparation; adding the new key's V7 makes it smoother.`, hear: [lastCh, firstCh] });
    return ideas;
  }
  if (target) return ideas;
  // same key: make the return into the next section stronger
  const aRn = inSection(A, () => analyze(lastCh)), toTonic = firstCh.rootPc === kA.pc;
  if (canSplit && toTonic && lastCh.qid === 'maj' && mod(lastCh.rootPc - kA.pc) === 5){
    const iv = mkChord(lastCh.rootPc, lastCh.rootL, 'm');
    ideas.push({ tag: 'Borrowed iv', kind: 'k-color', text: `${A.name} → ${into}: split the last ${lastCh.symbol} (${aRn.rn}) into ${lastCh.symbol} + <b>${iv.symbol}</b> (iv, borrowed from the parallel minor). The minor iv sinks into ${firstCh.symbol} with a soft, bittersweet pull.`, hear: [lastCh, iv, firstCh], apply: () => splitLast(A, iv) });
  }
  const sd = mkChord(mod(firstCh.rootPc + 7), mod(firstCh.rootL + 4, 7), '7');
  if (canSplit && !isDimType(firstCh) && mod(lastCh.rootPc - firstCh.rootPc) !== 7 && lastCh.symbol !== sd.symbol)
    ideas.push({ tag: toTonic ? 'Dominant' : 'Secondary dominant', kind: 'k-strong', text: `${A.name} → ${into}: split the last ${lastCh.symbol} into ${lastCh.symbol} + <b>${sd.symbol}</b> (${toTonic ? 'V7' : 'V7 of ' + firstCh.symbol}) so ${A.name} leans into ${firstCh.symbol}.`, hear: [lastCh, sd, firstCh], apply: () => splitLast(A, sd) });
  return ideas;
}
function songIdeas(){
  const ideas = [], s = W.song, seen = new Set();
  const order = s.order.map(partById).filter(Boolean);
  for (let i = 0; i < order.length; i++){
    const A = order[i], B = order[(i + 1) % order.length];
    if (!A.items.length || !B.items.length || (i === order.length - 1 && !S.loop)) continue;
    const pair = A.id + '>' + B.id;
    if (seen.has(pair)) continue; seen.add(pair);
    pairIdeas(A, B).forEach(d => ideas.push({ ...d, from: A.id, to: B.id }));
  }
  // the song ends (or loops) outside its home key: how to get back
  const end = order[order.length - 1];
  if (end && end.items.length && !sameKey(secKey(end), s.key) && !seen.has(end.id + '>home') && !order.some(p => p !== end && sameKey(secKey(p), s.key) && seen.has(end.id + '>' + p.id)))
    pairIdeas(end, null, { key: s.key, label: `the song key (${keyName(s.key)})` }).forEach(d => ideas.push({ ...d, from: end.id, to: 'home' }));
  // song-level key changes
  const chorusIdx = s.order.map((id, o) => ({ p: partById(id), o })).filter(x => x.p && /chorus/i.test(x.p.name) && !/pre/i.test(x.p.name));
  if (chorusIdx.length >= 2){
    const lastC = chorusIdx[chorusIdx.length - 1];
    if (sameKey(secKey(lastC.p), s.key)){
      const k2 = { pc: mod(s.key.pc + 2), scale: s.key.scale };
      ideas.push({ tag: 'Key change idea', kind: 'k-strong', text: `Lift the last ${lastC.p.name} up a whole step, to ${keyName(k2)}: a classic way to give the final chorus more energy. This adds a copy of ${lastC.p.name} in ${keyName(k2)} for the last time it plays.`, apply: () => liftLast(lastC, k2) });
    }
  }
  const bridge = s.parts.find(p => /bridge/i.test(p.name) && sameKey(secKey(p), s.key) && s.order.includes(p.id));
  if (bridge && makeKey(s.key.pc, s.key.scale).hept){
    const k4 = { pc: mod(s.key.pc + 5), scale: s.key.scale };
    ideas.push({ tag: 'Key change idea', kind: 'k-color', text: `Move the ${bridge.name} to ${keyName(k4)} (the IV key) for contrast; the section after it then returns home (see the ideas above once it's moved).`, apply: () => setPartKey(bridge, k4, 'move') });
  }
  return ideas;
}
function splitLast(p, ch){
  const last = p.items[p.items.length - 1], half = Math.floor(last.b / 2);
  last.b -= half;
  const it = inSection(p, () => toItem(ch, half));
  lockVoice(it, nearVoice(ch, voicedOf(last, lastChordOf(p))));
  p.items.push(it);
}
// A move to listen to: the section's last chord as it is voiced, the chords in between voiced near it, and
// the next section's first chord as it is voiced
function voicedPath(A, chords, B){
  const from = voicedOf(A.items[A.items.length - 1], chords[0]), out = [from];
  let cur = from;
  chords.slice(1).forEach((c, j) => {
    const lastOne = j === chords.length - 2;
    const v = lastOne && B && B.items.length && firstChordOf(B).symbol === c.symbol ? voicedOf(B.items[0], c) : nearVoice(c, cur);
    out.push(v || c); cur = v || cur;
  });
  return out;
}
function liftLast(x, k){
  const c = { ...clone(x.p), id: uid(), name: newPartName(`${x.p.name} (up a step)`), key: clone(k), keyOk: true };
  keyLog({ where: `Section key: ${c.name}`, doc: W.song.name, from: secKey(x.p), to: k, chords: 'new copy, moved' });
  slideShapes(c.items, 2);
  W.song.parts.splice(W.song.parts.indexOf(x.p) + 1, 0, c);
  W.song.order[x.o] = c.id;
}
const ideaRow = (d, i) => `<div class="rec idea"><div class="rw"><span class="pill ${d.kind}">${d.tag}</span>${d.text}</div><div class="ra">${d.hear ? `<button class="btn sm" data-act="ideaHear" data-i="${i}" aria-label="Hear it">▶</button>` : ''}${d.apply ? `<button class="btn sm" data-act="ideaDo" data-i="${i}">Apply</button>` : ''}</div></div>`;
function ideasHTML(){
  ui.ideas = songIdeas();
  return (ui.ideas.length ? ui.ideas.map(ideaRow).join('') : '<p class="muted">Ideas for moving between sections appear here once the arrangement has sections with chords.</p>') + nextKeysHTML();
}

/* ---- Where the song could go next ----
   From the last section in the arrangement: the closely related keys (most shared chords first), what the
   section's last chord already is in each, and a path to get there (a pivot if needed, then the new V7). */
const PC_NAME = pc => PC_NAMES[mod(pc)];
function keyRelation(a, b){
  const d = mod(b.pc - a.pc), maj = k => makeKey(k.pc, k.scale).majorish, A = maj(a), B = maj(b);
  if (A && !B) return { 9: 'the relative minor', 0: 'the parallel minor', 2: 'the ii key', 4: 'the iii key', 5: 'the iv key' }[d];
  if (!A && B) return { 3: 'the relative major', 0: 'the parallel major', 8: 'the ♭VI key', 10: 'the ♭VII key', 5: 'the IV key', 7: 'the V key' }[d];
  if (A && B) return { 7: 'the dominant key (V)', 5: 'the subdominant key (IV)', 2: 'up a whole step', 1: 'up a half step', 10: 'the ♭VII key', 3: 'the ♭III key (a chromatic mediant)', 8: 'the ♭VI key (a chromatic mediant)', 9: 'the VI key (a chromatic mediant)', 4: 'the III key (a chromatic mediant)' }[d];
  return { 7: 'the minor v key', 5: 'the iv key', 2: 'up a whole step', 10: 'the ♭VII key' }[d];
}
function nextKeys(p){
  const kA = secKey(p), tA = keyTriads(kA), lastCh = lastChordOf(p);
  const goodRn = /^(I|IV|V|ii|vi|i|iv|v|VI|III|VII)$/;
  const out = [];
  for (let pc = 0; pc < 12; pc++) for (const scale of ['major', 'aeolian']){
    const k = { pc, scale };
    if (sameKey(k, kA)) continue;
    const tB = keyTriads(k), shared = tA.filter(c => tB.some(d => d.symbol === c.symbol));
    const rel = keyRelation(kA, k), lastIn = tB.find(d => d.symbol === lastCh.symbol), lastRn = lastIn ? rnIn(k, lastCh) : null;
    const home = sameKey(k, W.song.key) && !sameKey(kA, W.song.key);
    let score = shared.length + (lastRn && goodRn.test(lastRn) ? 1.5 : 0) + (rel ? 0.6 : 0) + (home ? 3 : 0);
    if (/relative|dominant key|subdominant|parallel/.test(rel || '')) score += 0.8;
    if (/whole step/.test(rel || '')) score += 0.5;
    // a genre guide's typical key changes count like several shared chords
    const gk = genreKeyBonus(kA, k);
    score += gk.s * 4;
    if (score < 2 && !home) continue;
    // the way in: last chord (→ a shared chord if the last chord isn't in the new key) → V7 → I
    const V7 = dom7Of(k), I = tonicOf(k);
    const pivot = !lastIn ? pivotsBetween(kA, k).find(x => x.ch.symbol !== lastCh.symbol) || null : null;
    const path = [lastCh, ...(pivot ? [pivot.ch] : []), ...(lastCh.symbol === V7.symbol ? [] : [V7]), I];
    out.push({ k, rel, shared, lastRn, pivot, path, score, home, gwhy: gk.why });
  }
  // the song's own key always comes first when the section is somewhere else
  out.sort((a, b) => b.home - a.home || b.score - a.score);
  return out.slice(0, out[0] && out[0].home ? 7 : 6);
}
function nextKeysHTML(){
  const order = W.song.order.map(partById).filter(Boolean), p = order[order.length - 1];
  if (!p || !p.items.length) return '';
  ui.nextFrom = p.id; ui.nextKeys = nextKeys(p);
  const lastCh = lastChordOf(p);
  return `<h4 class="nk-h">Where the song could go after ${esc(p.name)} (${esc(keyName(secKey(p)))}, ends on ${lastCh.symbol})</h4>` + ui.nextKeys.map((x, i) => `<div class="rec idea"><div class="rw"><span class="pill ${x.home ? 'k-strong' : 'k-color'}">${esc(keyName(x.k))}</span>${x.home ? '<b>The song key.</b> ' : ''}${x.rel ? `${x.rel[0].toUpperCase() + x.rel.slice(1)}. ` : ''}${x.shared.length ? `Shares ${x.shared.length} chord${x.shared.length === 1 ? '' : 's'} (${x.shared.map(c => c.symbol).join(', ')}).` : 'Shares no chords.'} ${x.lastRn ? `${esc(p.name)} ends on <b>${lastCh.symbol}</b>, already ${x.lastRn} there, so it can lead straight in` : x.pivot ? `Go through ${pivotText(x.pivot, secKey(p), x.k)}` : 'A direct change'}: <span class="mono">${x.path.map(c => c.symbol).join(' → ')}</span>.${x.gwhy ? ` <i class="muted">${esc(x.gwhy)}.</i>` : ''}</div><div class="ra"><button class="btn sm" data-act="nkHear" data-i="${i}" aria-label="Hear the way in">▶</button><button class="btn sm" data-act="nkAdd" data-i="${i}" title="Adds a new section in this key at the end of the arrangement, starting on its tonic">+ Section in ${esc(keyName(x.k))}</button></div></div>`).join('');
}

/* ---- While editing a section: where it comes from and where it goes ---- */
// Swap the section's last chord for one that leads into the next section (voiced near the chord before it)
function outSwapsHTML(p, chs, next){
  const n = chs.length, at = n - 1, nx = nextAfter(chs, at);
  if (!nx || !nx.section) return '';
  const pi = n > 1 ? n - 2 : -1, prevV = pi >= 0 ? voicedAt(pi) : null;
  ui.outSwaps = leadInSwaps(chs[at], pi >= 0 ? chs[pi] : null, nx, prevV); ui.outNext = nx; ui.outPrev = pi;
  if (!ui.outSwaps.length) return '';
  return `<p class="lbl">Or swap the last chord (${chs[at].symbol})</p><div class="recs">${ui.outSwaps.map((x, i) => `<div class="rec"><button class="rs" data-act="outHear" data-i="${i}">${x.ch.symbol}<small>${analyze(x.ch).rn}</small></button><div class="rw"><span class="pill k-${x.out.kind}">${x.out.tag}</span>into ${nx.label}: ${x.out.lines[0]}${(() => { const n = [x.bass, easeNote(x.voice, prevV)].filter(Boolean).join('; '); return n ? ` <i class="muted">${n[0].toUpperCase() + n.slice(1)}.</i>` : ''; })()}</div><div class="ra"><button class="btn sm" data-act="outHear" data-i="${i}" aria-label="Hear it">▶</button><button class="btn sm" data-act="outSwap" data-i="${i}">Swap</button></div></div>`).join('')}</div>`;
}
function sectionNeighbors(p){
  const order = W.song.order, o = order.indexOf(p.id), lo = order.lastIndexOf(p.id);
  if (o < 0) return {};
  const prevId = o > 0 ? order[o - 1] : S.loop && order.length > 1 ? order[order.length - 1] : null;
  const nextId = lo < order.length - 1 ? order[lo + 1] : S.loop && order.length > 1 ? order[0] : null;
  const ok = id => { const q = id && partById(id); return q && q.items.length ? q : null; };
  return { prev: ok(prevId), next: ok(nextId) };
}
// Good first chords for this section after the previous section's last chord (in this section's key)
function openingIdeas(prevCh, chs, prevV){
  const F = chs[1] || null, seen = new Set();
  const base = candidatePool().map(x => x.ch).filter(c => !seen.has(c.symbol) && seen.add(c.symbol));
  const all = [...base, ...base.flatMap(c => bassVariants(c, prevCh, F)).filter(c => !seen.has(c.symbol) && seen.add(c.symbol))];
  return all.map(c => {
    const tr = transition(prevCh, c), a = analyze(c), voice = nearVoice(c, prevV), bm = bassMove(prevCh, c, F);
    let sc = tr.score + (a.inKey ? 0.6 : 0) + (c.rootPc === K.pc && a.fn === 'T' ? 0.5 : 0) + easeBonus(voice) + bm.s + styleBonus(c, prevCh).s;
    if (F && F.symbol !== c.symbol) sc += 0.3 * (transition(c, F).score - 1.6);
    const ease = [bm.why, easeNote(voice, prevV)].filter(Boolean).join('; ');
    return { ch: c, tr, a, sc, voice, ease };
  }).sort((x, y) => y.sc - x.sc).slice(0, 6);
}
function sectionLinksHTML(p, chs){
  const { prev, next } = sectionNeighbors(p);
  if (!prev && !next) return '';
  ui.ideas = songIdeas();
  const rows = filter => ui.ideas.map((d, i) => filter(d) ? ideaRow(d, i) : '').join('');
  let h = '';
  if (prev){
    const pc = lastChordOf(prev), first = chs[0], kP = secKey(prev);
    ui.openPrev = voicedOf(prev.items[prev.items.length - 1], pc) || pc; ui.opening = openingIdeas(pc, chs, ui.openPrev.frets || ui.openPrev.midis ? ui.openPrev : null);
    const tr = first ? transition(pc, first) : null;
    h += `<div class="lk"><div class="sec-h"><h3>Coming in from ${esc(prev.name)}</h3><span class="hint">${esc(prev.name)} (${esc(keyName(kP))}) ends on <b>${pc.symbol}</b>: ${rnIn(kP, pc)} there${sameKey(kP, secKey(p)) ? '' : `, ${analyze(pc).rn} in this section's key (${esc(K.name)})`}.</span></div>
      ${tr ? `<p><span class="pill k-${tr.kind}">${tr.tag}</span> ${pc.symbol} → ${first.symbol}: ${tr.lines[0]}</p>` : ''}
      <p class="lbl">Good first chords after ${pc.symbol}</p>
      <div class="recs">${ui.opening.map((x, i) => `<div class="rec"><button class="rs" data-act="openHear" data-i="${i}" title="Hear ${pc.symbol} → ${x.ch.symbol}">${x.ch.symbol}<small>${x.a.rn}</small></button><div class="rw"><span class="pill k-${x.tr.kind}">${x.tr.tag}</span>${x.tr.lines[0]}${x.ease ? ` <i class="muted">${x.ease[0].toUpperCase() + x.ease.slice(1)}.</i>` : ''}</div><div class="ra"><button class="btn sm" data-act="openHear" data-i="${i}" aria-label="Hear it">▶</button><button class="btn sm" data-act="openUse" data-i="${i}"${first && first.symbol === x.ch.symbol ? ' disabled' : ''}>${first && first.symbol === x.ch.symbol ? 'Starts with it' : 'Start with it'}</button></div></div>`).join('')}</div>
      ${rows(d => d.from === prev.id && d.to === p.id) ? `<p class="lbl">Or change the end of ${esc(prev.name)}</p><div class="recs">${rows(d => d.from === prev.id && d.to === p.id)}</div>` : ''}</div>`;
  }
  if (next && chs.length){
    const nf = firstChordOf(next), last = chs[chs.length - 1], tr = transition(last, nf);
    h += `<div class="lk"><div class="sec-h"><h3>Going out to ${esc(next.name)}</h3><span class="hint">${esc(next.name)} is in ${esc(keyName(secKey(next)))} and starts on <b>${nf.symbol}</b>.</span></div>
      <p><span class="pill k-${tr.kind}">${tr.tag}</span> ${last.symbol} → ${nf.symbol}: ${tr.lines[0]}</p>
      ${rows(d => d.from === p.id && d.to === next.id) ? `<div class="recs">${rows(d => d.from === p.id && d.to === next.id)}</div>` : ''}
      ${outSwapsHTML(p, chs, next)}</div>`;
  } else if (chs.length && !sameKey(secKey(p), W.song.key)){
    h += `<div class="lk"><div class="sec-h"><h3>Back to the song key</h3></div><div class="recs">${rows(d => d.from === p.id && d.to === 'home')}</div></div>`;
  }
  return `<div class="panel links">${h}</div>`;
}

Object.assign(ACT, {
  partRecenter: el => {
    const p = partById(el.dataset.arg); if (!p) return;
    keyWhy('partRecenter');
    const old = clone(secKey(p)), was = p.keyOk;
    rekeyPart(p, +el.dataset.pc, el.dataset.scale);
    save(); renderSong();
    toast(`${esc(p.name)} is now analyzed in ${esc(keyName(p.key))}. Same chords.`, { label: 'Undo', fn: () => { rekeyPart(p, old.pc, old.scale); p.keyOk = was; save(); renderSong(); } });
  },
  songRecenter: el => {
    const old = clone(W.song.key), nk = { pc: +el.dataset.pc, scale: el.dataset.scale };
    const moved = W.song.parts.filter(p => sameKey(secKey(p), old));
    keyWhy('songRecenter');
    moved.forEach(p => rekeyPart(p, nk.pc, nk.scale));
    keyLog({ where: 'Song key', doc: W.song.name, from: old, to: nk, chords: 'kept (re-labelled)' });
    W.song.key = clone(nk); moved.forEach(p => { p.keyOk = false; });
    S.keyPc = nk.pc; S.scale = nk.scale; computeKey();
    save(); renderAll();
    toast(`The song is now in ${esc(keyName(nk))}. Same chords.`, { label: 'Undo', fn: () => { moved.forEach(p => rekeyPart(p, old.pc, old.scale)); keyLog({ where: 'Song key', doc: W.song.name, from: W.song.key, to: old, chords: 'kept (re-labelled)' }); W.song.key = clone(old); moved.forEach(p => { p.keyOk = false; }); S.keyPc = old.pc; S.scale = old.scale; computeKey(); save(); renderAll(); } });
  },
  pkeyMatch: el => { const p = partById(el.dataset.arg); if (!p) return; keyWhy('match'); setPartKey(p, W.song.key, 'move'); p.keyOk = false; save(); renderSong(); },
  pkeyOk: el => { const p = partById(el.dataset.arg); if (!p) return; p.keyOk = true; save(); renderSong(); },
  pkeyGo: el => {
    const m = ui.keyMove; closeModal(); if (!m) return;
    const p = partById(m.id); if (!p) return;
    keyWhy('section'); setPartKey(p, m.key, el.dataset.arg); save(); renderSong();
  },
  songShift: el => {
    const d = +el.dataset.d;
    if (ui.keyCause !== 'undo') keyWhy('songShift');
    W.song.parts.forEach(p => { const from = clone(secKey(p)); p.key = { pc: mod(from.pc + d), scale: from.scale }; slideShapes(p.items, d); keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from, to: p.key, chords: 'moved' }); });
    const from = clone(W.song.key);
    W.song.key = { pc: mod(W.song.key.pc + d), scale: W.song.key.scale };
    keyLog({ where: 'Song key', doc: W.song.name, from, to: W.song.key, chords: 'moved (whole song)' });
    S.keyPc = W.song.key.pc; S.scale = W.song.key.scale; save(); renderAll();
    toast(`Moved the whole song ${d > 0 ? 'up' : 'down'} a half step: it is now in ${esc(keyName(W.song.key))}.`, { label: 'Undo', fn: () => ACT.songShift({ dataset: { d: -d } }) });
  },
  ideaHear: el => { const d = ui.ideas[+el.dataset.i]; if (d && d.hear) previewSeq(d.from ? voicedPath(partById(d.from), d.hear, d.to !== 'home' ? partById(d.to) : null) : d.hear); },
  ideaDo: el => {
    const d = ui.ideas[+el.dataset.i]; if (!d || !d.apply) return;
    const before = clone({ parts: W.song.parts, order: W.song.order });
    keyWhy('idea'); d.apply(); save(); renderTab();
    toast(`${d.tag}: applied.`, { label: 'Undo', fn: () => { W.song.parts.forEach((p, i) => { const b = before.parts.find(x => x.id === p.id); if (b){ p.items.splice(0, p.items.length, ...b.items); if (!sameKey(secKey(p), b.key)) keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from: secKey(p), to: b.key, chords: 'moved back' }); p.key = b.key; p.keyOk = b.keyOk; } }); W.song.parts = W.song.parts.filter(p => before.parts.some(b => b.id === p.id)); W.song.order = before.order; save(); renderTab(); } });
  },
  nkHear: el => { const x = ui.nextKeys[+el.dataset.i]; if (x) previewSeq(voicedPath(partById(ui.nextFrom), x.path, null)); },
  nkAdd: el => {
    const x = ui.nextKeys[+el.dataset.i]; if (!x) return;
    const from = partById(ui.nextFrom), p = addPart('Section', []);
    p.key = clone(x.k); p.keyOk = !sameKey(x.k, W.song.key); p.name = newPartName(`Section in ${keyName(x.k)}`);
    keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from: null, to: x.k, chords: 'new section', cause: 'addSection' });
    p.items.push(inSection(p, () => toItem(tonicOf(x.k), S.defBeats)));
    save(); renderSong();
    toast(`Added “${esc(p.name)}”. Edit its chords to see how it follows ${esc(from.name)}; the ideas above now include the move into it.`);
  },
  outHear: el => { const x = ui.outSwaps[+el.dataset.i]; if (x) previewSeq([ui.outPrev >= 0 ? voicedAt(ui.outPrev) : null, x.voice || x.ch, ui.outNext.voice()]); },
  outSwap: el => {
    const x = ui.outSwaps[+el.dataset.i]; if (!x) return;
    const i = prog.length - 1, old = clone(prog[i]);
    prog[i] = toItem(x.ch, old.b); lockVoice(prog[i], x.voice);
    save(); renderProg();
    toast(`${x.ch.symbol} now ends the section.`, { label: 'Undo', fn: () => { prog[i] = old; save(); renderProg(); } });
  },
  openHear: el => { const x = ui.opening[+el.dataset.i]; if (x) previewSeq([ui.openPrev, x.voice || x.ch]); },
  openUse: el => {
    const x = ui.opening[+el.dataset.i]; if (!x) return;
    const it = toItem(x.ch, S.defBeats); lockVoice(it, x.voice);
    prog.unshift(it); ui.selSlot = 0; ui.selEnd = 0;
    save(); renderProg(); toast(`${x.ch.symbol} now opens the section.`);
  },
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'songFollow'){ W.song.follow = t.checked; save(); renderSong(); return; }
  const p = t.dataset && t.dataset.part ? partById(t.dataset.part) : null;
  if (!p) return;
  if (t.classList.contains('pkPc') || t.classList.contains('pkSc')){
    const box = t.closest('.pkeys'), k = { pc: +box.querySelector('.pkPc').value, scale: box.querySelector('.pkSc').value };
    if (!p.items.length){ keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from: secKey(p), to: k, chords: 'none yet', cause: 'section' }); p.key = k; p.keyOk = !sameKey(k, W.song.key); save(); renderSong(); return; }
    ui.keyMove = { id: p.id, key: k };
    openModal(`${esc(p.name)} in ${esc(keyName(k))}`, `<p>How should the chords of ${esc(p.name)} change?</p>
      <p class="hint"><b>Move the chords</b> transposes them: the Roman numerals stay the same (I–V–vi–IV in ${esc(keyName(secKey(p)))} becomes I–V–vi–IV in ${esc(keyName(k))}).<br><b>Keep the chords</b> leaves every chord as it is and only analyzes the section in the new key.</p>`,
      [{ label: 'Cancel', act: 'modalClose' }, { label: 'Keep the chords', act: 'pkeyGo', arg: 'keep' }, { label: 'Move the chords', act: 'pkeyGo', arg: 'move', primary: true }]);
    // until confirmed, the selects show the current key again
    box.querySelector('.pkPc').value = String(secKey(p).pc); box.querySelector('.pkSc').value = secKey(p).scale;
  } else if (t.classList.contains('pkTs')){
    const [a, b] = t.value ? t.value.split('/').map(Number) : [S.ts.num, S.ts.den];
    setPartTs(p, t.value ? { num: a, den: b, groups: null } : S.ts); save(); renderSong();
  } else if (t.classList.contains('pkBpm')){
    const v = Math.round(+t.value);
    p.bpm = v >= 30 && v <= 300 && v !== S.bpm ? v : null; save(); renderSong();
  }
});

/* ================= Key-change log =================
   Every change of a document's key (and every time the header shows a different key) is written to a small log in
   this browser (the last 300), with what caused it. Not part of the library, so it is not synced or backed up.
   keyWhy(cause) is called by each action that can change a key, just before it does; the cause lasts until the
   current click or change is handled. A change with no cause is logged as "unexplained" and highlighted. */
const KEYLOG_KEY = 'harmony-bench-keylog', KEYLOG_MAX = 300;
const KEY_CAUSES = {
  header: 'Header key or scale menu', compare: 'Scales tab: a row of the compare table', transpose: 'Transpose − / +',
  recenter: '“Analyze in …” (same chords)', preset: 'Loaded a classic progression', open: 'Opened a saved document',
  tab: 'Switched tabs or documents (the header shows that one’s key)', follow: '“Keep every section in the song key” moved it with the song',
  section: 'Section key menu', match: '“Match to the song key”', songShift: 'Whole song − / +', undo: 'Undo',
  useKey: '“Use this key in my progression…”', exploreSync: '“Use the progression’s key”', new: 'New document',
  addSection: 'Added a section', idea: 'Applied a key-change idea', boot: 'App start', songRecenter: '“Analyze the song in …”',
  partRecenter: '“Analyze in …” on a section', learn: 'Learn tab', unexplained: 'Unexplained',
};
function keyWhy(cause){
  ui.keyCause = cause;
  // the cause covers everything this click or change does, and nothing after it
  queueMicrotask(() => { if (ui.keyCause === cause) ui.keyCause = null; });
}
function keyLogRead(){
  try { const a = JSON.parse(localStorage.getItem(KEYLOG_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function keyLog(e){
  const list = keyLogRead();
  list.push({ t: Date.now(), where: e.where, doc: e.doc || '', from: e.from ? keyName(e.from) : null, to: e.to ? keyName(e.to) : null,
    chords: e.chords || 'n/a', view: !!e.view, cause: e.cause || ui.keyCause || 'unexplained' });
  while (list.length > KEYLOG_MAX) list.shift();
  try { localStorage.setItem(KEYLOG_KEY, JSON.stringify(list)); } catch (err) {}
}
const fmtLogTime = t => { const d = new Date(t); return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`; };
const logLine = x => `${fmtLogTime(x.t)} · ${x.where}${x.doc ? ` (${x.doc})` : ''}: ${x.from || '—'} → ${x.to || '—'} · chords: ${x.chords} · cause: ${KEY_CAUSES[x.cause] || x.cause}`;
function keyHistHTML(){
  const docOnly = !!ui.keyHistDoc, all = keyLogRead().reverse(), list = docOnly ? all.filter(x => !x.view && x.where !== 'Explore key') : all;
  const bad = all.filter(x => x.cause === 'unexplained').length;
  const rows = list.map(x => `<div class="kl-row${x.cause === 'unexplained' ? ' kl-bad' : ''}${x.view ? ' kl-view' : ''}"><span class="kl-t mono">${esc(fmtLogTime(x.t))}</span><span class="kl-w"><b>${esc(x.where)}</b>${x.doc ? ` <span class="muted">${esc(x.doc)}</span>` : ''}</span><span class="kl-k mono">${esc(x.from || '—')} → <b>${esc(x.to || '—')}</b></span><span class="kl-c">${x.view ? 'shown in the header, nothing changed' : `chords: ${esc(x.chords)}`}</span><span class="kl-why${x.cause === 'unexplained' ? ' alt' : ''}">${esc(KEY_CAUSES[x.cause] || x.cause)}</span></div>`).join('');
  return `<p class="hint">Every key change, newest first: which key changed, from what to what, what happened to the chords, and what caused it. Kept in this browser only (the last ${KEYLOG_MAX}).${bad ? ` <b style="color:var(--root)">${bad} change${bad > 1 ? 's have' : ' has'} no known cause</b> (highlighted): please mention ${bad > 1 ? 'them' : 'it'} if you report a key that changed by itself.` : ''}</p>
    <label class="chk"><input type="checkbox" id="klDoc"${docOnly ? ' checked' : ''}> Only changes to a progression, song or section key</label>
    <div class="kl-list">${rows || '<p class="muted">Nothing logged yet.</p>'}</div>`;
}
function openKeyHist(){
  openModal('Key history', keyHistHTML(), [{ label: 'Clear', act: 'keyHistClear' }, { label: 'Copy as text', act: 'keyHistCopy' }, { label: 'Close', act: 'modalClose', primary: true }]);
}

/* ---- The explore key on Scales, Chord library and Learn ----
   When it differs from the open document's key: copy the document's key in, or use this key in the document
   (keeping its chords, or moving them). */
function exploreBannerHTML(){
  if (keyCtx() !== 'explore') return '';
  const dk = docKey(), ctx = docCtx(), what = ctx === 'part' ? 'section' : 'progression';
  if (sameKey(dk, keyNow())) return `<p class="hint explore-note">Exploring <b>${esc(K.name)}</b>, the same key as ${docLabel()}. Changing the key on this tab never changes ${what === 'section' ? 'the section' : 'your progression'}.</p>`;
  return `<div class="banner soft explore"><span>You are exploring <b>${esc(K.name)}</b>. ${docLabel()[0].toUpperCase() + docLabel().slice(1)} is in <b>${esc(keyName(dk))}</b> and stays there: changing the key on this tab never changes it.</span>
    <span class="acts"><button class="btn sm" data-act="exploreSync">Use the ${what}'s key</button><button class="btn sm primary" data-act="exploreApply">Use this key in my ${what}…</button></span></div>`;
}
// The progression (or the section being edited) moves to key k: 'keep' keeps every chord, 'move' transposes them
function docSetKey(k, how){
  const ctx = docCtx();
  if (ctx === 'part'){ const p = partById(W.edit); setPartKey(p, k, how); return; }
  const d = W.prog, from = clone(d.keyAt);
  if (sameKey(from, k)) return;
  if (how === 'keep'){
    const keep = inSection({ key: from }, () => keepItems(d.items));
    inSection({ key: k }, () => relabelItems(d.items, keep));
    d.keyAt = clone(k);
    keyLog({ where: 'Progression key', doc: d.name, from, to: k, chords: 'kept (re-labelled)' });
  } else {
    slideShapes(d.items, mod(k.pc - from.pc + 6) - 6);
    progKeyTo(k);
  }
}
Object.assign(ACT, {
  keyHist: () => openKeyHist(),
  keyHistClear: () => { try { localStorage.removeItem(KEYLOG_KEY); } catch (e) {} openKeyHist(); },
  keyHistCopy: () => {
    const txt = keyLogRead().reverse().map(logLine).join('\n') || '(empty)', ok = copyToSystem(txt);
    openModal('Key history as text', `<p class="hint">${ok ? 'Copied to your clipboard. ' : 'Select the text below and copy it (Ctrl+C / Cmd+C). '}</p><textarea id="copyBox" rows="14" class="mono" readonly>${esc(txt)}</textarea>`, [{ label: 'Back', act: 'keyHist' }, { label: 'Done', act: 'modalClose', primary: true }]);
    setTimeout(() => { const t = $('#copyBox'); if (t){ t.focus(); t.select(); } }, 40);
  },
  exploreSync: () => { keyWhy('exploreSync'); const k = docKey(); S.keyPc = k.pc; S.scale = k.scale; ui.focus = null; renderAll(); },
  exploreApply: () => {
    const k = keyNow(), ctx = docCtx(), items = ctx === 'part' ? partById(W.edit).items : W.prog.items, what = ctx === 'part' ? 'section' : 'progression';
    ui.exploreTo = k;
    if (!items.length){ ACT.exploreApplyGo({ dataset: { arg: 'move' } }); return; }
    const dk = docKey(), sample = inSection({ key: dk }, () => items.slice(0, 4).map(it => fromItem(it).symbol)).join(' – ');
    const movedSyms = inSection({ key: k }, () => items.slice(0, 4).map(it => fromItem(it).symbol)).join(' – ');
    openModal(`Use ${esc(K.name)} in ${docLabel()}`, `<p>${docLabel()[0].toUpperCase() + docLabel().slice(1)} is in ${esc(keyName(dk))}. What should happen to its chords?</p>
      <p class="hint"><b>Keep my chords</b>: every chord stays exactly as it is (${esc(sample)}${items.length > 4 ? ' …' : ''}); they are just analyzed in ${esc(K.name)}, so their Roman numerals change.<br><b>Move my chords</b>: the chords are transposed so they keep their Roman numerals (${esc(sample)} becomes ${esc(movedSyms)}${items.length > 4 ? ' …' : ''}).${ctx === 'prog' && W.prog.id ? ` Moving the chords of a saved progression makes it a new, unsaved one; the saved one stays as it was.` : ''}</p>`,
      [{ label: 'Cancel', act: 'modalClose' }, { label: 'Keep my chords', act: 'exploreApplyGo', arg: 'keep' }, { label: 'Move my chords', act: 'exploreApplyGo', arg: 'move', primary: true }]);
  },
  exploreApplyGo: el => {
    const k = ui.exploreTo; closeModal(); if (!k) return;
    keyWhy('useKey');
    const what = docCtx() === 'part' ? 'section' : 'progression';
    docSetKey(k, el.dataset.arg);
    save(); renderAll();
    toast(`Your ${what} is now in ${esc(keyName(k))}${el.dataset.arg === 'keep' ? ' (same chords)' : ' (chords moved)'}.`);
  },
});
document.addEventListener('change', e => { if (e.target.id === 'klDoc'){ ui.keyHistDoc = e.target.checked; openKeyHist(); } });
