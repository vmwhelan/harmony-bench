'use strict';
/* =========================================================================
   Playing aids: what to solo with, scale positions on the neck, next-chord
   preview during playback, the pinned instrument panel, and the easy-capo finder.
   Loaded after app.js and before docs.js (which boots the app).
   ========================================================================= */

/* ---- What to solo with ----
   Every 7- or 8-note scale built on the chord's root that contains all the chord tones, ranked by how many
   notes fall outside the current key, then by "avoid notes" (a scale note a half step above a chord tone,
   which clashes when held). Ties keep the scale list's order, so common modes win. */
const SOLO_CACHE = new Map();
function soloScales(ch){
  const key = K.pc + S.scale + '|' + ch.symbol;
  if (SOLO_CACHE.has(key)) return SOLO_CACHE.get(key);
  const list = [];
  SCLIST.forEach((sc, i) => {
    if (sc.degs.length < 7) return;
    const pcs = sc.degs.map(d => mod(ch.rootPc + d.semis)), set = new Set(pcs);
    if (!ch.pcs.every(p => set.has(p))) return;
    const outside = pcs.filter(p => !K.pcs.has(p));
    const avoid = pcs.filter(p => !ch.pcs.includes(p) && ch.pcs.includes(mod(p - 1))).length;
    list.push({ sc, pcs, outside, score: outside.length + avoid * 0.4 + i * 0.001 });
  });
  list.sort((a, b) => a.score - b.score);
  let pent = null;
  if (!isDimType(ch) && ch.qid !== 'aug'){
    const id = hasRel(ch, 3) && !hasRel(ch, 4) ? 'minpent' : hasRel(ch, 4) ? 'majpent' : null;
    if (id) pent = { sc: SC[id], pcs: SC[id].degs.map(d => mod(ch.rootPc + d.semis)) };
  }
  const res = { list: list.slice(0, 3), pent };
  SOLO_CACHE.set(key, res);
  return res;
}
const scaleTitle = (ch, sc) => `${ch.rootName} ${sc.name.replace(/ \(.*\)$/, '')}`;
function soloText(ch){
  const s = soloScales(ch), best = s.list[0];
  if (!best) return `No common scale contains every note of ${ch.symbol}; target its chord tones instead.`;
  const same = best.pcs.length === K.pcs.size && best.pcs.every(p => K.pcs.has(p));
  const why = !best.outside.length ? (same ? `the same notes as ${K.name}, centered on ${ch.rootName}` : `every note is in ${K.name}`)
    : `adds ${best.outside.map(p => { const t = toneOf(ch, p); return t ? `${t.name} (the chord's ${toneWord(t)})` : nameFor(p); }).join(', ')}, outside ${K.name}`;
  const alts = [...s.list.slice(1, 2).map(x => scaleTitle(ch, x.sc)), ...(s.pent ? [scaleTitle(ch, s.pent.sc)] : [])];
  return `<b>${scaleTitle(ch, best.sc)}</b>: ${why}.${alts.length ? ` Also works: ${alts.join(', ')}.` : ''}`;
}
const toneWord = t => t.num === 1 ? 'root' : t.lbl + (t.num === 2 ? 'nd' : t.num === 3 ? 'rd' : 'th');
function soloHTML(ch){
  return `<div class="why"><span class="lbl">Solo over ${ch.symbol}</span><p>${soloText(ch)}</p><div><button class="btn sm" data-act="soloShow">${kind() === 'piano' ? 'Show on the keyboard' : 'Show on the neck'}</button></div></div>`;
}

/* ---- Scale shapes ----
   Chosen by shape and starting point rather than by fret range, so a shape stays selected when the key changes.
   - 3 notes per string (2 for scales of 6 notes or fewer): starts on a chosen scale degree on a chosen string,
     climbs that many notes per string to the top string, and walks down the same way onto the strings below.
     Works for any tuning that isn't re-entrant.
   - CAGED (standard-type tunings): the textbook boxes, a 4-fret window across all strings. A scale note that
     falls between two strings' windows is played by the index finger reaching a fret back on the higher string
     (or, at the nut, by the pinky a fret up on the lower one). The five boxes sit at fixed distances from the
     scale's root on the lowest string: E a fret below it, then D, C, A and G further up.
   Each shape fits in several places on the neck (octaves apart, or in open position); `slide` picks one. */
const reentrant = () => tuning().some((m, i, a) => i > 0 && m < a[i - 1]);
const posAllowed = () => fretted() && !reentrant();
const CAGED = { C: 4, A: 6, G: 9, E: -1, D: 2 };
const DEG_NAMES = ['Root', '♭2nd', '2nd', '♭3rd', '3rd', '4th', '♯4th', '5th', '♭6th', '6th', '♭7th', '7th'];
function cagedOk(){
  const t = eff(), iv = t.slice(1).map((m, i) => m - t[i]);
  return iv.length >= 5 && iv.slice(-5).join() === '5,5,5,4,5' && iv.slice(0, -5).every(x => x === 5);
}
// CAGED names come from the major key the notes belong to: A minor pentatonic or D Dorian use C major's shapes
function cagedRoot(order){
  const same = (iv, R) => iv.length === order.length && iv.every(x => order.includes(mod(R + x)));
  for (let d = 0; d < 12; d++){
    const R = mod(order[0] + d);
    if (same([0, 2, 4, 5, 7, 9, 11], R) || same([0, 2, 4, 7, 9], R)) return R;
  }
  return order.includes(mod(order[0] + 3)) && !order.includes(mod(order[0] + 4)) ? mod(order[0] + 3) : order[0];
}
function shapeFinish(map, frs, base){
  const fretted = frs.filter(r => r > 0), lo = base ?? (fretted.length ? Math.min(...fretted) : 0);
  const finger = new Map();
  map.forEach((r, key) => finger.set(key, r === 0 ? 0 : clamp(r - lo + 1, 1, 4)));
  return { map, finger, lo: Math.min(...frs), hi: Math.max(...frs) };
}
// Every place the chosen shape fits on the neck, lowest first
function shapePlacements(order, o = S.shapes){
  const et = eff(), n = et.length, maxR = maxRel(), N = order.length, out = [];
  if (o.sys === 'caged'){
    if (!cagedOk()) return out;
    const base = mod(mod(cagedRoot(order) - et[0]) + CAGED[o.caged], 12);
    for (let lo = base - 12; lo <= maxR - 4; lo += 12){
      if (lo < -1) continue;
      const map = new Map(), frs = [], add = (s, r) => { if (r >= 0 && r <= maxR && !map.has(s + ':' + r)){ map.set(s + ':' + r, r); frs.push(r); } };
      for (let s = 0; s < n; s++) for (let r = lo; r <= lo + 3; r++) if (order.includes(mod(et[s] + r))) add(s, r);
      // the note between two strings a 4th apart
      for (let s = 0; s < n - 1; s++) if (et[s + 1] - et[s] === 5 && order.includes(mod(et[s] + lo + 4))){
        if (lo - 1 >= 0) add(s + 1, lo - 1); else add(s, lo + 4);
      }
      if (![...Array(n).keys()].every(s => [...map.keys()].some(k => k.startsWith(s + ':')))) continue;
      const low = Math.min(...[...map].filter(([k]) => k.startsWith('0:')).map(([, r]) => r));
      out.push({ ...shapeFinish(map, frs, Math.max(1, lo)), startStr: 0, startPc: mod(et[0] + low) });
    }
    return out;
  }
  const nps = N <= 6 ? 2 : 3, str = Math.min(o.str, n - 1), pc = order[o.deg % N];
  const all = [];
  for (let m = et[0]; m <= et[n - 1] + maxR; m++) if (order.includes(mod(m))) all.push(m);
  all.forEach((m, i) => {
    if (mod(m) !== pc || m < et[str] || m > et[str] + maxR) return;
    const map = new Map(), frs = [];
    const put = (s, mm) => { const r = mm - et[s]; if (mm === undefined || r < 0 || r > maxR) return false; map.set(s + ':' + r, r); frs.push(r); return true; };
    // up: a string keeps an extra note when the next string can't reach it (a dropped string, say)
    let k = i, ok = true;
    for (let s = str; s < n && ok; s++){
      for (let j = 0; ok && (j < nps || (s < n - 1 && all[k] !== undefined && all[k] < et[s + 1])); j++) ok = put(s, all[k++]);
    }
    // down: a note below a string's open note moves on to the next lower string
    k = i - 1;
    for (let s = str - 1; s >= 0 && ok; s--){
      for (let j = 0; ok && j < nps && all[k] !== undefined && all[k] >= et[s]; j++) ok = put(s, all[k--]);
    }
    if (ok) out.push({ ...shapeFinish(map, frs), startStr: str, startPc: pc });
  });
  return out;
}
// The notes the shapes are built from: the key's scale, or the solo scale over the chord
function shapeOrder(){
  if (S.overlay === 'scale') return K.notes.map(x => x.pc);
  if (S.overlay === 'solo'){ const best = soloScales(focusChord()).list[0]; if (best) return best.pcs; }
  return null;
}
// The chosen shape where it sits now ({ ...placement, i, count }), or null for the whole neck
function currentShape(order = shapeOrder()){
  if (!order || S.shapes.sys === 'all' || !posAllowed()) return null;
  const pl = shapePlacements(order);
  if (!pl.length) return null;
  const i = clamp(S.shapes.slide, 0, pl.length - 1);
  return { ...pl[i], i, count: pl.length };
}
// Words for the chosen shape, e.g. "3 notes per string from the 2nd (F♯) on the 6th string, frets 2–6"
function shapeText(p, order){
  const n = eff().length, off = capoOff(), fr = `frets ${p.lo + off}–${p.hi + off}${capo() && !off ? ' above the capo' : ''}`;
  const deg = `${DEG_NAMES[mod(p.startPc - order[0])].toLowerCase()} (${nameFor(p.startPc)})`;
  if (S.shapes.sys === 'caged') return `CAGED ${S.shapes.caged} shape, ${fr}; it starts on the ${deg} on the ${ORDINAL(n)} string`;
  return `${order.length <= 6 ? 2 : 3} notes per string from the ${deg} on the ${ORDINAL(n - p.startStr)} string, ${fr}`;
}

/* ---- What the overlay shows (used by the neck and the keyboard) ---- */
function overlayState(){
  const st = { ov: null, ovCh: null, solo: null, pos: null, finger: null, next: null, nextMidis: null };
  let order = null;
  if (S.overlay === 'scale'){ st.ov = K.pcs; order = K.notes.map(x => x.pc); }
  else if (S.overlay === 'chord'){ st.ovCh = focusChord(); st.ov = new Set(st.ovCh.pcs); }
  else if (S.overlay === 'solo'){
    const ch = focusChord(), best = soloScales(ch).list[0];
    st.ovCh = ch;
    if (best){ st.solo = { ch, ...best }; st.ov = new Set(best.pcs); order = best.pcs; }
    else st.ov = new Set(ch.pcs);
  }
  const p = order && currentShape(order);
  if (p){ st.pos = p.map; st.finger = p.finger; st.shape = p; st.order = order; }
  // where the next chord goes, while a progression plays
  if (PB.on && S.showNext && ui.nextIt){
    const ch = ui.nextCh || fromItem(ui.nextIt);
    st.nextCh = ch;
    if (fretted()){
      const cs = getVo(ui.nextIt) ? itemShape(ui.nextIt, ch) : null;
      const v = cs ? cs.list[cs.idx] : bestFrets(ch);
      if (v) st.next = v.frets;
    } else {
      const pv = ui.nextIt.pv ? itemPiano(ui.nextIt, ch) : null;
      st.nextMidis = pv && pv.custom ? pv.list[pv.idx].midis : [pianoBass(ch), ...(S.smooth && PB.prevUp ? leadUpper(ch, PB.prevUp) : rootUpper(ch))];
    }
  }
  return st;
}
// What the Scale shapes controls offer right now, or null when shapes don't apply
function shapeOptions(){
  if (!posAllowed()) return null;
  const order = shapeOrder();
  if (!order) return null;
  const et = eff(), tun = tuning(), n = et.length;
  return {
    order, nps: order.length <= 6 ? 2 : 3, caged: cagedOk(),
    degs: order.map((pc, i) => ({ value: i, label: `${DEG_NAMES[mod(pc - order[0])]} (${nameFor(pc)})` })),
    strs: et.slice(0, Math.max(1, n - 2)).map((_, s) => ({ value: s, label: `${ORDINAL(n - s)} string (${nameFor(tun[s])})` })),
    cur: currentShape(order),
  };
}

/* ---- Pinned instrument panel ----
   With "Pin while scrolling" on, the panel floats under the header (a spacer keeps its place in the page)
   and its height follows the page: its bottom edge stays on the tabs, so they always touch. Scrolling down,
   it first slides up under the header, then folds step by step: the chord info moves beside the neck and
   the keyboard row shrinks away, then the note line and legend, then the tools rows; fully folded it is the
   compact panel, and the tabs stop right under it. Scrolling back up unfolds it in reverse.
   Heights of each part are measured whenever the panel's content changes (not while scrolling). */
const PIN = { mode: 'flow', M: null, dirty: true, raf: 0, moved: null, on: false };
const PIN_MOVE = ['#tunFld', '#capoFld', '#labGrp', '#ovGrp'];
const instPanel = () => document.querySelector('.inst');
const rowGap = () => parseFloat(getComputedStyle(document.querySelector('.app')).rowGap) || 18;
const hdrBottom = () => document.getElementById('topbar').getBoundingClientRect().bottom;
// where the tabs sit in the page (not where they are stuck): right below the panel, or its spacer
function tabsNatural(){
  const ph = $('#instPh'), base = ph && !ph.hidden ? ph : instPanel();
  return base.getBoundingClientRect().bottom + rowGap();
}
const tabsStuckTop = () => hdrBottom() + (S.pinPanel && PIN.M ? PIN.M.Hc : 0);
// show the current tab from its top, with the tabs at their stuck position
function showTabTop(){ window.scrollTo(0, window.scrollY + tabsNatural() - tabsStuckTop()); }
function setPanelMode(panel, mode){
  if (PIN.mode === mode) return;
  const was = PIN.mode, side = mode === 'side' || mode === 'compact', compact = mode === 'compact';
  const sideWas = was === 'side' || was === 'compact';
  PIN.mode = mode; PIN.on = side;
  panel.classList.toggle('floating', mode !== 'flow');
  panel.classList.toggle('side', side);
  panel.classList.toggle('compact', compact);
  if (side !== sideWas){
    const idOut = $('#idOut'), bar = panel.querySelector('.pinbar');
    (side && fretted() ? panel.querySelector('.cg-neck') : $('#readRow')).appendChild(idOut);
    (side ? panel.querySelector('.actrow') : panel.querySelector('.instfoot')).appendChild(bar);
    if (fretted() && FRETS > 15) renderNeck();
  }
  if (compact && !PIN.moved){
    const box = $('#pinCtl');
    PIN.moved = PIN_MOVE.map(q => $(q)).filter(Boolean).map(el => { const mark = document.createComment('pin'); el.before(mark); box.appendChild(el); return { el, mark }; });
  } else if (!compact && PIN.moved){ PIN.moved.forEach(({ el, mark }) => mark.replaceWith(el)); PIN.moved = null; }
}
function clearFold(panel){
  panel.style.height = '';
  panel.querySelectorAll('.cg').forEach(g => { g.style.height = ''; });
  panel.style.removeProperty('--pk');
}
// The panel's width and position as if it were in the page (a 24-fret neck makes it wider than the page)
function flowBox(){
  const app = document.querySelector('.app'), r = app.getBoundingClientRect(), cs = getComputedStyle(app);
  const colL = r.left + parseFloat(cs.paddingLeft), colW = app.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const need = fretted() ? NECK_TOTAL(FRETS) + 34 : 0, w = Math.max(colW, Math.min(need, innerWidth - 32));
  return { left: colL + (colW - w) / 2, w };
}
function measurePanel(panel, ph){
  const keep = PIN.mode, box = flowBox(), g = c => panel.querySelector('.cg-' + c);
  if (keep === 'flow'){ ph.style.height = panel.offsetHeight + 'px'; ph.hidden = false; }
  clearFold(panel);
  panel.style.left = box.left + 'px'; panel.style.width = box.w + 'px';
  const M = { left: box.left, w: box.w };
  setPanelMode(panel, 'full');
  M.full = panel.offsetHeight;
  setPanelMode(panel, 'side');
  M.T = g('top').offsetHeight; M.F = g('foot').offsetHeight;
  const R = g('read').offsetHeight;
  M.C = panel.offsetHeight - M.T - M.F - (fretted() ? R : 0);   // what never folds before the compact form
  M.rStart = Math.max(1, M.full - M.C - M.T - M.F);
  setPanelMode(panel, 'compact');
  M.Hc = panel.offsetHeight;
  setPanelMode(panel, keep === 'flow' ? 'full' : keep);
  ph.style.height = M.full + 'px'; ph.hidden = false;
  document.documentElement.style.setProperty('--pin-c', M.Hc + 'px');
  PIN.M = M; PIN.dirty = false;
}
function unfloat(panel, ph){
  clearFold(panel);
  ['top', 'left', 'width'].forEach(k => { panel.style[k] = ''; });
  panel.classList.remove('lifted');
  setPanelMode(panel, 'flow');
  ph.hidden = true; PIN.M = null; PIN.dirty = true;
  document.documentElement.style.setProperty('--pin-h', '0px');
  document.documentElement.style.setProperty('--pin-c', '0px');
}
function updatePin(){
  PIN.raf = 0;
  const panel = instPanel(), ph = $('#instPh');
  if (!panel || !ph) return;
  if (!S.pinPanel){ if (PIN.mode !== 'flow') unfloat(panel, ph); return; }
  if (!PIN.M || PIN.dirty) measurePanel(panel, ph);
  const M = PIN.M, hdr = hdrBottom(), spTop = ph.getBoundingClientRect().top;
  const top = Math.max(hdr, spTop);
  // the header slims down first: the panel only starts folding once the header is in its small form
  const slim = document.getElementById('topbar').classList.contains('stuck');
  const h = slim ? clamp(tabsNatural() - top, M.Hc, M.full) : M.full;
  const mode = h >= M.full - 0.5 ? 'full' : h <= M.Hc + 0.5 ? 'compact' : 'side';
  setPanelMode(panel, mode);
  panel.style.top = top + 'px'; panel.style.left = M.left + 'px'; panel.style.width = M.w + 'px';
  panel.classList.toggle('lifted', spTop < hdr - 1);
  if (mode === 'side'){
    // fold in order: the keyboard row first, then the note line and legend, then the tools rows
    let avail = h - M.C;
    const t = clamp(avail, 0, M.T); avail -= t;
    const f = clamp(avail, 0, M.F); avail -= f;
    panel.style.height = h + 'px';
    panel.querySelector('.cg-top').style.height = t + 'px';
    panel.querySelector('.cg-foot').style.height = f + 'px';
    if (fretted()){
      const r = Math.max(0, avail);
      panel.querySelector('.cg-read').style.height = r + 'px';
      panel.style.setProperty('--pk', clamp(r / M.rStart, 0, 1).toFixed(3));
    }
  } else clearFold(panel);
  document.documentElement.style.setProperty('--pin-h', (top + h - hdr) + 'px');
}
const schedulePin = () => { if (!PIN.raf) PIN.raf = requestAnimationFrame(updatePin); };
// the panel's content changed: measure its parts again before the next fold
function pinDirty(){ PIN.dirty = true; if (S.pinPanel) schedulePin(); }
(function setupPin(){
  const panel = instPanel();
  const ph = document.createElement('div');
  ph.id = 'instPh'; ph.hidden = true;
  panel.before(ph);
  window.addEventListener('scroll', () => { if (S.pinPanel) updatePin(); }, { passive: true });
  window.addEventListener('resize', () => { if (S.pinPanel){ unfloat(panel, ph); updatePin(); } });
  // the header slims down with an animation: follow it
  new ResizeObserver(() => { if (S.pinPanel) schedulePin(); }).observe(document.getElementById('topbar'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pinDirty);
})();

/* ---- Easy capo ----
   For capo 0–7, find for each chord the easiest shape (open position, no barre) in the current tuning, and
   name the shape you would finger. Capos are ranked by how many chords become open shapes, then by barres. */
function easyCapo(){
  const seen = new Set(), chords = progChords().filter(c => !seen.has(c.symbol) && seen.add(c.symbol));
  const raw = tuning(), out = [];
  for (let c = 0; c <= 7; c++){
    const tun = raw.map(m => m + c), FR = FRETS - c;
    let easy = 0, barres = 0, posSum = 0;
    const shapes = chords.map(ch => {
      const v = fretVoicings(ch, tun, false, FR);
      const open = v.list.filter(x => !x.barre && x.pos <= 3 && x.fingers <= 3 && x.frets.includes(0)).sort((a, b) => a.score - b.score)[0];
      const pick = open || v.list[v.best];
      if (!pick){ posSum += 12; return { ch, name: '—', frets: null }; }
      if (open) easy++;
      if (pick.barre) barres++;
      posSum += pick.pos;
      const nm = identify(pick.frets.map((f, i) => f === null ? null : raw[i] + f).filter(m => m !== null))[0];
      return { ch, name: nm ? nm.symbol : '?', frets: pick.frets, open: !!open };
    });
    out.push({ c, easy, barres, shapes, total: chords.length, score: easy * 10 - barres * 3 - posSum / Math.max(1, chords.length) });
  }
  return out.sort((a, b) => b.score - a.score);
}
function easyCapoDialog(){
  if (!prog.length){ toast('Add some chords first.'); return; }
  const res = easyCapo().slice(0, 4), cur = capo();
  const rows = res.map(r => `<div class="orow"><div class="oinfo"><b>${r.c ? 'Capo on fret ' + r.c : 'No capo'}${r.c === cur ? ' (current)' : ''}</b>
    <span class="muted">${r.easy} of ${r.total} chords in open shapes${r.barres ? `, ${r.barres} barre${r.barres > 1 ? 's' : ''}` : ', no barres'}</span>
    <span class="capo-shapes">${r.shapes.map(x => `<span><b>${x.ch.symbol}</b> → ${x.name === x.ch.symbol ? '' : `${x.name} shape `}<span class="mono">${x.frets ? x.frets.map(f => f === null ? 'x' : f).join(' ') : 'no shape'}</span></span>`).join('')}</span></div>
    <div class="oacts">${r.c === cur ? '' : `<button class="btn sm primary" data-act="capoUse" data-arg="${r.c}">Use ${r.c ? 'capo ' + r.c : 'no capo'}</button>`}</div></div>`).join('');
  openModal('Easy capo', `<p class="hint">Where to put a capo so this progression's chords use easy open shapes in your tuning (${tuning().map(m => nameFor(m)).join(' ')}). Shape names are what you finger; the sound stays in ${K.name}.</p>${rows}`, [{ label: 'Close', act: 'modalClose' }]);
}

/* ---- Mini player ----
   While a progression or song plays and its controls are scrolled out of sight (or another tab is open), a slim
   bar at the bottom of the screen shows what's playing and keeps Stop, tempo and Loop at hand. */
const MINI = { el: null, now: null };
function miniEl(){
  if (MINI.el) return MINI.el;
  const el = document.createElement('div');
  el.id = 'miniPlayer'; el.className = 'miniplayer'; el.hidden = true;
  el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Playback');
  document.body.appendChild(el);
  return (MINI.el = el);
}
// The play button of the tab that is playing, if it is on screen
const pbTab = () => PB.mode === 'song' ? 'song' : PB.mode === 'ex' ? 'learn' : 'prog';
function transportVisible(){
  const tab = pbTab();
  if (S.tab !== tab) return false;
  const b = document.querySelector(`#p-${tab} .play`);
  if (!b) return false;
  const r = b.getBoundingClientRect(), top = document.getElementById('topbar').getBoundingClientRect().bottom + (S.pinPanel && PIN.M ? PIN.M.Hc : 0);
  return r.bottom > top && r.top < innerHeight;
}
function miniShow(){
  const el = miniEl(), show = PB.on && !transportVisible();
  if (el.hidden === !show) return;
  el.hidden = !show;
  document.body.classList.toggle('mini-on', show);
}
function miniRender(){
  const el = miniEl(), m = MINI.now;
  if (!m) return;
  el.innerHTML = `<button class="play" data-act="miniStop" aria-label="Stop" title="Stop"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor"/></svg></button>
    <div class="mp-now"><b class="mp-sym">${m.sym}</b><span class="mp-next">${m.next ? `→ ${m.next}` : ''}</span></div>
    <span class="mp-where mono">${m.sec ? `${esc(m.sec)} · ` : ''}bar ${m.bar}</span>
    <span class="mp-tempo"><button class="btn sm" data-act="miniTempo" data-d="-5" aria-label="Slower">−</button><span class="mono">${S.bpm}</span><button class="btn sm" data-act="miniTempo" data-d="5" aria-label="Faster">+</button></span>
    <label class="chk"><input type="checkbox" id="miniLoop"${S.loop ? ' checked' : ''}> Loop</label>
    <button class="btn sm" data-act="miniBack" title="Scroll back to the full controls" aria-label="Back to the full controls">↑<span class="long"> Controls</span></button>`;
}
function miniUpdate(e, ch, startBeat){
  MINI.now = { sym: ch.symbol, next: ui.nextCh ? ui.nextCh.symbol : '', sec: (PB.mode === 'song' || PB.mode === 'ex') && e.sec ? e.sec.name : '', bar: Math.floor(startBeat / S.ts.num) + 1 };
  miniRender(); miniShow();
}
window.addEventListener('scroll', () => { if (PB.on) miniShow(); }, { passive: true });
document.addEventListener('change', e => { if (e.target.id === 'miniLoop'){ S.loop = e.target.checked; save(); renderTab(); } });

/* ---- Actions and settings ---- */
Object.assign(ACT, {
  miniStop: () => { pbStop(); },
  miniTempo: el => {
    S.bpm = clamp(S.bpm + +el.dataset.d, 30, 300); save();
    ['#bpmN', '#bpmR'].forEach(id => { const x = $(id); if (x) x.value = S.bpm; });
    miniRender();
  },
  miniBack: () => {
    const tab = pbTab();
    if (PB.mode === 'ex'){ S.learnLesson = 'songs'; LW.song = PB.exId; if (S.tab !== tab){ S.tab = tab; renderAll(); } else renderLearn(); }
    else if (S.tab !== tab){ S.tab = tab; renderAll(); }
    const t = document.querySelector(`#p-${tab} .transport`);
    if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  },
  // move the chosen scale shape to its next place up or down the neck
  shapeSlide: el => {
    const cur = currentShape();
    if (!cur) return;
    S.shapes.slide = clamp(cur.i + +el.dataset.d, 0, cur.count - 1);
    save(); renderInstrument();
  },
  soloShow: () => {
    const X = progChords()[ui.selSlot];
    if (X) ui.focus = X;
    S.overlay = 'solo'; save(); renderInstrument();
    // with "Pin while scrolling" on, the instrument is already on screen
    if (!S.pinPanel) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  },
  easyCapo: () => easyCapoDialog(),
  capoUse: el => {
    const c = +el.dataset.arg;
    S.capo[S.inst] = c;
    S.shape[S.inst] = shape().map(f => f === null ? null : Math.min(f, maxRel()));
    closeModal(); save(); renderInstrument(); refreshTabLight();
    toast(c ? `Capo on fret ${c}. Chord shapes in the library and playback now use it.` : 'Capo removed.');
  },
  pinToggle: () => { S.pinPanel = !S.pinPanel; save(); renderTools(); PIN.dirty = true; updatePin(); },
  pinTop: () => {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    // a smooth scroll can stop a few pixels short when the header and panel change size on the way up
    setTimeout(() => { if (window.scrollY > 0 && window.scrollY < 200) window.scrollTo(0, 0); }, 900);
  },
});
document.addEventListener('change', e => {
  const t = e.target;
  if (['shapeSys', 'shapeDeg', 'shapeStr', 'shapeCaged'].includes(t.id)){
    const k = { shapeSys: 'sys', shapeDeg: 'deg', shapeStr: 'str', shapeCaged: 'caged' }[t.id];
    S.shapes[k] = k === 'deg' || k === 'str' ? +t.value : t.value;
    S.shapes.slide = 0;
    save(); renderInstrument();
  }
  else if (t.id === 'showNext'){ S.showNext = t.checked; save(); renderInstrument(); }
});
