'use strict';
/* =========================================================================
   Saved library (tunings, progressions, songs), dialogs, clipboard,
   chord-chart text, time signatures and the song builder.
   The library is kept in this browser (localStorage) and, when the app runs
   on the Harmony Bench server (Docker), synced to the server so every browser
   and device shares it. Backup/transfer also moves it as a JSON file or text.
   ========================================================================= */
const LIB_KEY = 'harmony-bench-library';
let LIB = { tunings: [], progressions: [], songs: [], patterns: [], deleted: {}, clip: null };
try { const l = JSON.parse(localStorage.getItem(LIB_KEY) || 'null'); if (l) LIB = Object.assign(LIB, l); } catch (e) {}
LIB.deleted = LIB.deleted || {};
function libSave(){
  let ok = true;
  try { localStorage.setItem(LIB_KEY, JSON.stringify(LIB)); }
  catch (e) { ok = SYNC.mode === 'synced' || SYNC.mode === 'saving'; if (!ok) toast('Could not save: this browser is blocking storage, or it is full. Use Backup / transfer to keep a copy.'); }
  schedulePush();
  return ok;
}

/* ================= Server sync =================
   mode: 'local' (no server: the claude.ai artifact or plain file hosting), 'synced',
   'saving', or 'offline' (server unreachable; changes stay here and sync later).
   Merging keeps the newer copy of each item and remembers deletions, so nothing
   saved on one device is lost by another. */
const SYNC = { mode: 'checking', rev: null, timer: 0, pending: false, lastPull: 0 };
const stamp = r => r.updated || r.created || '';
function mergeLib(a, b){
  const deleted = { ...(a.deleted || {}) };
  Object.entries(b.deleted || {}).forEach(([id, t]) => { if (!deleted[id] || t > deleted[id]) deleted[id] = t; });
  const out = { deleted };
  ['tunings', 'progressions', 'songs', 'patterns'].forEach(key => {
    const m = new Map();
    [...(a[key] || []), ...(b[key] || [])].forEach(r => { if (r && r.id && (!m.has(r.id) || stamp(r) > stamp(m.get(r.id)))) m.set(r.id, r); });
    out[key] = [...m.values()].filter(r => !(deleted[r.id] && deleted[r.id] >= stamp(r)));
  });
  return out;
}
const libData = () => ({ tunings: LIB.tunings, progressions: LIB.progressions, songs: LIB.songs, patterns: LIB.patterns || [], deleted: LIB.deleted });
function applyLib(d){
  Object.assign(LIB, { tunings: d.tunings, progressions: d.progressions, songs: d.songs, patterns: d.patterns || [], deleted: d.deleted });
  try { localStorage.setItem(LIB_KEY, JSON.stringify(LIB)); } catch (e) {}
}
async function apiLibrary(method, body){
  const r = await fetch('api/library', { method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const isJson = (r.headers.get('content-type') || '').includes('json');
  return { status: r.status, data: isJson ? await r.json() : null };
}
async function syncPull(){
  SYNC.lastPull = Date.now();
  let r;
  try { r = await apiLibrary('GET'); }
  catch (e) { if (SYNC.mode !== 'local') SYNC.mode = SYNC.mode === 'checking' ? 'local' : 'offline'; refreshSyncUI(); return; }
  if (r.status !== 200 || !r.data || !r.data.library){ SYNC.mode = 'local'; refreshSyncUI(); return; }
  const before = JSON.stringify(libData());
  const merged = mergeLib(r.data.library, libData());
  SYNC.rev = r.data.rev;
  SYNC.mode = 'synced';
  applyLib(merged);
  // anything this browser had that the server didn't goes up
  if (JSON.stringify(merged) !== JSON.stringify(mergeLib(r.data.library, {})) || SYNC.pending) pushNow();
  if (JSON.stringify(libData()) !== before) refreshAfterSync(); else refreshSyncUI();
}
function schedulePush(){
  if (SYNC.mode === 'local' || SYNC.mode === 'checking'){ SYNC.pending = true; return; }
  SYNC.pending = true;
  clearTimeout(SYNC.timer);
  SYNC.timer = setTimeout(pushNow, 400);
}
async function pushNow(tries = 0){
  clearTimeout(SYNC.timer);
  if (SYNC.mode === 'local') return;
  SYNC.mode = 'saving'; refreshSyncUI();
  let r;
  try { r = await apiLibrary('PUT', { baseRev: SYNC.rev, library: libData() }); }
  catch (e) { SYNC.mode = 'offline'; refreshSyncUI(); return; }
  if (r.status === 200){ SYNC.rev = r.data.rev; SYNC.pending = false; SYNC.mode = 'synced'; refreshSyncUI(); return; }
  if (r.status === 409 && r.data && tries < 3){
    // another device saved first: merge its library with ours, then try again
    SYNC.rev = r.data.rev;
    applyLib(mergeLib(r.data.library, libData()));
    refreshAfterSync();
    return pushNow(tries + 1);
  }
  SYNC.mode = 'offline'; refreshSyncUI();
  toast(`Could not save to the server${r.data && r.data.error ? ': ' + esc(r.data.error) : ''}. Your changes are kept in this browser.`);
}
function syncBadge(){
  const m = {
    synced: ['k-strong', 'Library on your server', 'Saved tunings, progressions and songs are stored on the server and shared by every browser and device.'],
    saving: ['k-ok', 'Saving to server…', ''],
    offline: ['k-weak', 'Server unreachable', 'Changes are kept in this browser and sync when the server is reachable again.'],
    local: ['k-ok', 'Library in this browser only', 'This copy of Harmony Bench has no server storage (for example the claude.ai preview or plain file hosting). Use Backup / transfer to move saves between devices.'],
    checking: ['k-ok', 'Connecting…', ''],
  }[SYNC.mode];
  // nothing to say when all is well; only problems and the browser-only mode are shown
  if (SYNC.mode === 'synced') return '<span class="syncb" hidden></span>';
  return `<span class="pill ${m[0]} syncb" title="${m[2]}">${m[1]}</span>`;
}
function refreshSyncUI(){ document.querySelectorAll('.syncb').forEach(el => { el.outerHTML = syncBadge(); }); }
function refreshAfterSync(){
  renderTools();
  const typing = document.activeElement && document.activeElement.closest('#p-song input, #p-song textarea, .modal');
  if (!typing) renderTab(); else refreshSyncUI();
}
window.addEventListener('focus', () => { if (SYNC.mode !== 'local' && Date.now() - SYNC.lastPull > 4000) syncPull(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && SYNC.mode !== 'local' && Date.now() - SYNC.lastPull > 4000) syncPull(); });
window.addEventListener('online', () => { if (SYNC.mode !== 'local') syncPull(); });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowISO = () => new Date().toISOString();
const fmtDate = iso => { try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso || ''; } };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));

/* ================= Time signatures ================= */
const TS_PRESETS = [[4,4],[3,4],[2,4],[2,2],[6,8],[9,8],[12,8],[5,4],[7,4],[5,8],[7,8],[11,8]];
const BEAT_SYMBOL = { 1: '𝅝', 2: '𝅗𝅥', 4: '♩', 8: '♪', 16: '𝅘𝅥𝅯', 32: '𝅘𝅥𝅰' };
function defaultGroups(n, den){
  if (n % 3 === 0 && n > 3 && den >= 8) return Array(n / 3).fill(3);
  const g = [];
  let r = n;
  while (r > 0){
    if (r === 4){ g.push(2, 2); break; }
    if (r <= 3){ g.push(r); break; }
    g.push(3); r -= 3;
  }
  return g;
}
const tsGroups = (ts = S.ts) => (Array.isArray(ts.groups) && ts.groups.reduce((a, b) => a + b, 0) === ts.num) ? ts.groups : defaultGroups(ts.num, ts.den);
// accent per beat in a bar: 2 = downbeat, 1 = start of a beat group, 0 = other
function barAccents(ts = S.ts){
  const a = new Array(ts.num).fill(0);
  let p = 0;
  tsGroups(ts).forEach(g => { a[p] = 1; p += g; });
  a[0] = 2;
  return a;
}
const tsLabel = (ts = S.ts) => `${ts.num}/${ts.den}`;
const barBeats = () => S.ts.num;
function beatOptions(cur){
  const n = S.ts.num, set = new Set();
  for (let i = 1; i <= n; i++) set.add(i);
  [2, 3, 4, 8].forEach(k => set.add(n * k));
  if (cur) set.add(cur);
  return [...set].sort((a, b) => a - b).map(v => [v, v % n === 0 ? `${v / n} bar${v / n > 1 ? 's' : ''}` : `${v} beat${v > 1 ? 's' : ''}`]);
}
function tsSelectHTML(id){
  const cur = tsLabel(), isPreset = TS_PRESETS.some(([a, b]) => `${a}/${b}` === cur) && !S.ts.groups;
  return `<label class="fld"><span>Time signature</span><select id="${id}" data-ts="1">` +
    TS_PRESETS.map(([a, b]) => `<option value="${a}/${b}"${isPreset && cur === `${a}/${b}` ? ' selected' : ''}>${a}/${b}</option>`).join('') +
    (isPreset ? '' : `<option value="cur" selected>${cur} (${tsGroups().join('+')})</option>`) +
    '<option value="custom">Custom…</option></select></label>';
}
// Changing the meter keeps every chord's length in bars
function setTs(ts){
  const old = S.ts, f = ts.num / old.num;
  const before = { ts: clone(old), prog: clone(W.prog.items), parts: clone(W.song.parts), defBeats: S.defBeats };
  const scale = items => items.forEach(it => { it.b = Math.max(1, Math.round(it.b * f)); });
  if (W.edit) scale(prog);
  else { scale(W.prog.items); W.song.parts.forEach(p => { if (!p.ts) scale(p.items); }); }
  S.ts = ts;
  S.defBeats = Math.max(1, Math.round(S.defBeats * f));
  save(); renderTab();
  toast(`Time signature ${tsLabel()}. Each chord keeps its length in bars.`, { label: 'Undo', fn: () => {
    S.ts = before.ts; S.defBeats = before.defBeats;
    W.prog.items.splice(0, W.prog.items.length, ...before.prog);
    before.parts.forEach(bp => { const p = W.song.parts.find(x => x.id === bp.id); if (p) p.items.splice(0, p.items.length, ...bp.items); });
    save(); renderTab();
  } });
}

/* ================= Modal dialog ================= */
function openModal(title, body, actions){
  const m = $('#modal');
  m.querySelector('.mbox').innerHTML = `<div class="mhead"><h3>${title}</h3><button class="mx" data-act="modalClose" aria-label="Close">×</button></div><div class="mbody">${body}</div>` +
    (actions && actions.length ? `<div class="macts">${actions.map(a => `<button class="btn${a.primary ? ' primary' : ''}" data-act="${a.act}"${a.arg != null ? ` data-arg="${esc(a.arg)}"` : ''}>${a.label}</button>`).join('')}</div>` : '');
  m.hidden = false;
  const f = m.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea');
  if (f) setTimeout(() => { if (!m.contains(document.activeElement)) f.focus(); }, 30);
}
function closeModal(){ $('#modal').hidden = true; ui.modal = null; }

/* ================= Chord chart text (copy / paste) ================= */
const ALIAS = { '':'maj', 'M':'maj', 'maj':'maj', 'Maj':'maj', 'major':'maj', 'm':'m', 'min':'m', 'mi':'m', '-':'m', 'minor':'m',
  'dim':'dim', 'o':'dim', '°':'dim', 'aug':'aug', '+':'aug', '7':'7', 'dom7':'7', 'maj7':'maj7', 'Maj7':'maj7', 'M7':'maj7', 'Δ':'maj7', 'Δ7':'maj7', 'ma7':'maj7',
  'm7':'m7', 'min7':'m7', 'mi7':'m7', '-7':'m7', 'm7b5':'m7b5', 'ø':'m7b5', 'ø7':'m7b5', 'min7b5':'m7b5', '-7b5':'m7b5', 'm7(b5)':'m7b5',
  'dim7':'dim7', 'o7':'dim7', '°7':'dim7', 'mmaj7':'mmaj7', 'mM7':'mmaj7', 'm(maj7)':'mmaj7', 'minmaj7':'mmaj7', '-maj7':'mmaj7', 'm(M7)':'mmaj7',
  'sus':'sus4', 'sus4':'sus4', 'sus2':'sus2', '5':'5', '6':'6', 'm6':'m6', 'min6':'m6', '2':'add9', 'add2':'add9', 'add9':'add9', 'madd9':'madd9', 'm(add9)':'madd9', 'madd2':'madd9',
  '69':'69', '6/9':'69', '6add9':'69', '9':'9', 'maj9':'maj9', 'M9':'maj9', 'Maj9':'maj9', 'm9':'m9', 'min9':'m9', '-9':'m9', '11':'11', 'm11':'m11', 'min11':'m11', '-11':'m11',
  '13':'13', 'maj13':'maj13', 'M13':'maj13', 'm13':'m13', 'min13':'m13', '7b9':'7b9', '7(b9)':'7b9', '7#9':'7s9', '7(#9)':'7s9', '7#11':'7s11', '7(#11)':'7s11',
  'maj7#11':'maj7s11', 'M7#11':'maj7s11', '7#5':'7s5', '7+5':'7s5', '+7':'7s5', 'aug7':'7s5', '7+':'7s5', '7b5':'7b5', '7(b5)':'7b5',
  'maj7#5':'maj7s5', '+maj7':'maj7s5', 'maj7+5':'maj7s5', 'M7#5':'maj7s5', '7sus4':'7sus4', '7sus':'7sus4', '9sus4':'9sus4', '9sus':'9sus4', '7b13':'7b13', 'dim(maj7)':'dimmaj7', 'o(maj7)':'dimmaj7',
  '-5':'b5', 'b5':'b5', '(b5)':'b5', 'maj(b5)':'b5', 'M(b5)':'b5', '7-5':'7b5', '7(-5)':'7b5', '7maj5':'7s5', '7(+5)':'7s5', '7(#5)':'7s5',
  '+5':'aug', 'aug5':'aug', '6(add9)':'69', 'm-5':'dim', 'sus7':'7sus4' };
QLIST.forEach(q => { const k = q.sfx.replace(/♭/g, 'b').replace(/♯/g, '#'); if (!(k in ALIAS)) ALIAS[k] = q.id; });
// the other ways a chord type is written in charts (shown in the Chord library), e.g. 7♭5 → 7-5, 7(b5)
const aliasesFor = id => Object.keys(ALIAS).filter(k => ALIAS[k] === id && k !== QMAP[id].sfx.replace(/♭/g, 'b').replace(/♯/g, '#')).map(k => k.replace(/b(?=\d)/g, '♭').replace(/#/g, '♯'));
function parseChordToken(tok){
  let t = tok.replace(/♭/g, 'b').replace(/♯/g, '#').replace(/[,;.]+$/, '');
  let beats = null;
  const dm = t.match(/^(.*):(\d+)$/);
  if (dm){ t = dm[1]; beats = Math.max(1, Math.min(64, +dm[2])); }
  let bass = null;
  const sm = t.match(/^(.+)\/([A-G])([#b]?)$/);
  if (sm){ t = sm[1]; bass = mod(LPC[LET.indexOf(sm[2])] + (sm[3] === '#' ? 1 : sm[3] === 'b' ? -1 : 0)); }
  // an interval written as its two notes, lower first: C–B or C-B
  const dy = t.match(/^([A-G])(#|b)?[–-]([A-G])(#|b)?$/);
  if (dy){
    const L = LET.indexOf(dy[1]), pc = mod(LPC[L] + (dy[2] === '#' ? 1 : dy[2] === 'b' ? -1 : 0));
    const q = DYAD_BY_SEMIS[mod(LPC[LET.indexOf(dy[3])] + (dy[4] === '#' ? 1 : dy[4] === 'b' ? -1 : 0) - pc)];
    return q ? { pc, L, q, bass: null, beats } : null;
  }
  const m = t.match(/^([A-G])(#|b)?(.*)$/);
  if (!m) return null;
  const L = LET.indexOf(m[1]);
  const pc = mod(LPC[L] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0));
  const q = ALIAS[m[3]];
  if (!q) return null;
  return { pc, L, q, bass, beats };
}
// "| Cm | Fm | Ab G7 |" → each bar is split evenly; "%" repeats the previous chord; "Cm:3" sets an exact length in beats.
// Text without bar lines gives each chord the default length.
function parseChart(txt){
  const out = [], errors = [];
  txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
    if (/^(key|tempo|time|title|artist|bpm)\b/i.test(line) || /^\[.*\]$/.test(line)) return;
    const hasBars = line.includes('|');
    const bars = hasBars ? line.split('|').map(s => s.trim()).filter(Boolean) : [line];
    const toks = bars.flatMap(b => b.split(/\s+/)).filter(Boolean);
    const good = toks.filter(t => /^%(:\d+)?$/.test(t) || parseChordToken(t)).length;
    if (!toks.length || good / toks.length < 0.5) return;
    bars.forEach(bar => {
      const parsed = bar.split(/\s+/).filter(Boolean).map(t => {
        const rm = t.match(/^%(?::(\d+))?$/);
        if (rm) return { rep: true, beats: rm[1] ? +rm[1] : null };
        const c = parseChordToken(t);
        if (!c) errors.push(t);
        return c;
      }).filter(Boolean);
      if (!parsed.length) return;
      let fixed = 0, free = 0;
      parsed.forEach(p => { if (p.beats) fixed += p.beats; else free++; });
      const total = hasBars ? Math.max(S.ts.num, fixed) : 0;
      const each = hasBars ? (free ? Math.max(1, Math.floor((total - fixed) / free)) : 0) : S.defBeats;
      let rem = hasBars && free ? Math.max(0, (total - fixed) - each * free) : 0;
      parsed.forEach(p => {
        let b = p.beats || each;
        if (!p.beats && rem > 0){ b += rem; rem = 0; }
        if (p.rep){ if (out.length) out[out.length - 1].b += b; }
        else out.push({ pc: p.pc, L: p.L, q: p.q, bs: p.bass, b });
      });
    });
  });
  return { chords: out, errors };
}
function barSegments(items){
  const n = S.ts.num, bars = [];
  let cur = [], fill = 0;
  items.forEach((it, idx) => {
    let left = it.b, cont = false;
    while (left > 0){
      const take = Math.min(left, n - fill);
      cur.push({ idx, beats: take, cont });
      fill += take; left -= take; cont = true;
      if (fill === n){ bars.push(cur); cur = []; fill = 0; }
    }
  });
  if (cur.length) bars.push(cur);
  return bars;
}
function chartText(items, perLine = 4){
  const syms = items.map(it => fromItem(it).symbol);
  const n = S.ts.num;
  const bars = barSegments(items).map(segs => {
    const even = segs.every(s => s.beats === segs[0].beats) && segs.reduce((a, s) => a + s.beats, 0) === n;
    return segs.map(s => (s.cont ? '%' : syms[s.idx]) + (even ? '' : ':' + s.beats)).join(' ');
  });
  const lines = [];
  for (let i = 0; i < bars.length; i += perLine) lines.push('| ' + bars.slice(i, i + perLine).join(' | ') + ' |');
  return lines.join('\n');
}
const absFromItem = it => ({ pc: mod(K.pc + it.s), L: mod(K.L + it.l, 7), q: it.q, b: it.b, bs: it.bs != null ? mod(K.pc + it.bs) : null, keyPc: K.pc, vos: vosOf(it), pv: it.pv, br: it.br });
function itemFromAbs(a){
  const it = toItem(mkChord(a.pc, a.L, a.q, a.bs), a.b);
  if (a.keyPc === K.pc){ if (a.vos) it.vos = clone(a.vos); if (a.pv) it.pv = clone(a.pv); }
  if (a.br) it.br = true;
  return it;
}
function copyToSystem(text){
  try { if (navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(text).catch(() => {}); return true; } } catch (e) {}
  return false;
}

/* ================= Documents: the open progression and the open song ================= */
const SETTING_KEYS = ['keyPc','scale','bpm','ts','style','strum','strumRestart','loop','click','smooth','defBeats'];
function snapSettings(){
  const o = {};
  SETTING_KEYS.forEach(k => { o[k] = clone(S[k]); });
  if (fretted()){ o.inst = S.inst; o.tuning = tuning().slice(); o.capo = capo(); } else o.inst = S.inst;
  o.sound = soundFor(kind()).id;
  return o;
}
function applySettings(o){
  if (!o) return;
  SETTING_KEYS.forEach(k => { if (o[k] !== undefined) S[k] = clone(o[k]); });
  if (o.inst && INST[o.inst]){ S.inst = o.inst; if (o.tuning) S.tun[o.inst] = o.tuning.slice(); if (o.capo != null) S.capo[o.inst] = o.capo; if (o.sound) S.snd[o.inst] = o.sound; }
  if (!SC[S.scale]) S.scale = 'major';
}
// A document is saved with its own key, whatever the header shows at the time
const withKey = (o, k) => k ? { ...o, keyPc: k.pc, scale: k.scale } : o;
function docContent(k){
  if (k === 'prog') refreshAutoName();
  const d = W[k];
  return k === 'prog'
    ? { name: d.name, notes: d.notes, items: d.items, settings: withKey(snapSettings(), d.keyAt), ...(d.genre ? { genre: d.genre } : {}) }
    : { name: d.name, artist: d.artist, notes: d.notes, key: d.key, follow: !!d.follow, parts: d.parts, order: d.order, settings: withKey(snapSettings(), d.key), ...(d.genre ? { genre: d.genre } : {}) };
}
function isDirty(k){
  const d = W[k];
  if (!d.saved) return k === 'prog' ? d.items.length > 0 : d.parts.length > 0;
  return d.saved !== JSON.stringify(docContent(k));
}
// a new progression starts in the key of the document you are in
const blankProg = () => ({ id: null, name: '', autoName: true, notes: '', created: null, updated: null, items: [], saved: null, genre: null, keyAt: W ? clone(docKey()) : null });
// Until a new progression is saved or renamed, its name follows the key: "C Major Progression", "A Dorian Progression"…
const titleCase = s => s.replace(/(^|[\s(–-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
function autoProgName(){
  const base = `${K.notes[0].name} ${titleCase(K.sc.short)} Progression`, taken = new Set(LIB.progressions.map(r => r.name));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
function refreshAutoName(){ if (W.prog.autoName && !W.prog.id) W.prog.name = W.prog.keyAt ? inSection({ key: W.prog.keyAt }, autoProgName) : autoProgName(); }
// A saved progression whose key or scale is changed becomes a new, unsaved progression (its chords changed),
// so Save can't overwrite the saved one; it takes the default name for the new key.
const keyNow = () => ({ pc: S.keyPc, scale: S.scale });
function keyGuard(){
  if (!W || W.edit) return;
  progKeyTo(keyNow());
}
// The progression's key becomes k with its chords moving along (they are stored relative to the key)
function progKeyTo(k){
  const d = W.prog;
  if (!d.keyAt){ d.keyAt = clone(k); return; }
  if (sameKey(d.keyAt, k)) return;
  const from = clone(d.keyAt), cause = ui.keyCause, was = { id: d.id, created: d.created, updated: d.updated, saved: d.saved, autoName: d.autoName, name: d.name };
  d.keyAt = clone(k);
  keyLog({ where: 'Progression key', doc: d.name, from, to: k, chords: d.items.length ? 'moved' : 'none yet' });
  save();
  // put back the key and, for a saved progression, the saved one it was
  const undo = { label: 'Undo', fn: () => {
    keyLog({ where: 'Progression key', doc: d.name, from: d.keyAt, to: from, chords: 'moved back' });
    Object.assign(d, was, { keyAt: from });
    if (keyCtx() === 'prog'){ S.keyPc = from.pc; S.scale = from.scale; }
    save(); renderAll();
  } };
  if (!d.id){
    if ((cause === 'header' || !cause) && d.items.length) toast(`Your progression moved to ${esc(keyName(k))}: its chords moved with it.`, undo);
    return;
  }
  Object.assign(d, { id: null, created: null, updated: null, saved: null, autoName: true });
  d.name = inSection({ key: k }, autoProgName);
  toast(`New key, so this is now a new progression, “${esc(d.name)}”. “${esc(was.name)}” is still saved as it was.`, undo);
}
const blankSong = () => ({ id: null, name: 'Untitled song', artist: '', notes: '', created: null, updated: null, parts: [], order: [], saved: null, genre: null });
const listOf = k => k === 'prog' ? LIB.progressions : LIB.songs;
const kindName = k => k === 'prog' ? 'progression' : 'song';
function activeContainer(){
  if (W.edit){ const p = W.song.parts.find(x => x.id === W.edit); if (p) return p; W.edit = null; }
  return W.prog;
}
function setProg(arr){ prog = arr; activeContainer().items = arr; save(); }
function storeDoc(k, asNew){
  const d = W[k], list = listOf(k);
  if (asNew || !d.id){ d.id = uid(); d.created = nowISO(); }
  d.updated = nowISO();
  if (k === 'prog' && !d.keyAt) d.keyAt = keyNow();
  const rec = { id: d.id, created: d.created, updated: d.updated, ...clone(docContent(k)) };
  const i = list.findIndex(x => x.id === d.id);
  if (i >= 0) list[i] = rec; else list.unshift(rec);
  if (libSave()){ d.saved = JSON.stringify(docContent(k)); save(); toast(`Saved “${esc(d.name)}”.`); }
  renderTab();
}
function loadDoc(k, rec){
  if (PB.on) pbStop();
  const d = clone(rec);
  if (k === 'prog'){ W.prog = { ...blankProg(), ...d, autoName: false }; W.prog.items = (W.prog.items || []).filter(it => it && QMAP[it.q]); }
  else {
    W.song = { ...blankSong(), ...d };
    W.song.parts.forEach(p => { p.items = (p.items || []).filter(it => it && QMAP[it.q]); p.lyrics = p.lyrics || ''; });
  }
  const from = keyNow();
  applySettings(rec.settings);
  // the document's own key goes in the header; a song's sections keep theirs (its saved settings never move them)
  const st = rec.settings || {}, own = k === 'song' ? (W.song.key || { pc: st.keyPc || 0, scale: SC[st.scale] ? st.scale : 'major' }) : { pc: S.keyPc, scale: S.scale };
  if (k === 'song'){ W.song.key = clone(own); W.song.parts.forEach(p => { if (!p.key) p.key = clone(W.song.key); }); }
  else W.prog.keyAt = clone(own);
  S.keyPc = from.pc; S.scale = from.scale;
  W.edit = null;
  docItems(k).forEach(vosOf);
  S.tab = k === 'prog' ? 'prog' : 'song';
  // the header shows the opened document's key: nothing is written back
  ui.keyCtx = keyCtx();
  keyWhy('open'); loadCtxKey(ui.keyCtx);
  computeKey();
  W[k].saved = JSON.stringify(docContent(k));
  prog = W.prog.items;
  ui.selSlot = 0; ui.selEnd = 0; ui.focus = null;
  save(); renderAll();
}
// Runs `go` now, or first asks what to do with unsaved changes
function guardDirty(k, go){
  if (!isDirty(k)){ go(); return; }
  ui.pending = go;
  openModal('Unsaved changes', `<p>“${esc(W[k].name)}” has changes that are not saved yet.</p>`, [
    { label: 'Cancel', act: 'modalClose' }, { label: 'Discard changes', act: 'pendingGo' }, { label: 'Save first', act: 'pendingSave', arg: k, primary: true }]);
}
function docMetaForm(k, d, prefixName){
  return `<div class="form">
    <label class="fld"><span>Name</span><input id="mName" type="text" maxlength="120" value="${esc(prefixName ?? d.name)}"></label>
    ${k === 'song' ? `<label class="fld"><span>Artist or writer</span><input id="mArtist" type="text" maxlength="120" value="${esc(d.artist || '')}"></label>` : ''}
    <label class="fld"><span>Notes</span><textarea id="mNotes" rows="4" maxlength="4000" placeholder="Ideas, where you used it, strumming pattern…">${esc(d.notes || '')}</textarea></label>
    <p class="hint">Saved with it: the chords and their lengths, custom voicings, key and scale, time signature, tempo, playback style${k === 'song' ? ', sections, lyrics and arrangement' : ''}, plus your instrument, its sound, tuning and capo.</p></div>`;
}
/* ---- Save as: replace a saved one, or save a new copy ---- */
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
// "Verse riff" → "Verse riff (2)" (or the next free number)
function freeName(k, name){
  const taken = new Set(listOf(k).map(r => r.name.trim().toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let n = 2; ; n++){ const c = `${name} (${n})`; if (!taken.has(c.toLowerCase())) return c; }
}
function openSaveAs(k, form){
  const d = W[k], list = listOf(k).slice().sort((a, b) => String(b.updated || '').localeCompare(String(a.updated || '')));
  const base = form || { name: d.id ? d.name + ' (copy)' : d.name, notes: d.notes, artist: d.artist };
  ui.modal = { k, mode: 'saveas' };
  openModal(`Save ${kindName(k)} as…`, docMetaForm(k, { ...d, notes: base.notes, artist: base.artist }, base.name).replace('</label>', '</label><p class="hint" id="mNameHint"></p>') +
    (list.length ? `<div class="fld"><span>Or replace a saved ${kindName(k)}</span><div class="replist">${list.map(r => `<button type="button" class="rep" data-act="saveAsPick" data-arg="${esc(r.id)}"><b>${esc(r.name)}</b><small>${fmtDate(r.updated)}</small></button>`).join('')}</div></div>` : ''),
    [{ label: 'Cancel', act: 'modalClose' }, { label: 'Save', act: 'metaOk', primary: true }]);
  nameHint();
}
// While typing: say when the name is already used
function nameHint(){
  const m = ui.modal, el = $('#mNameHint'), inp = $('#mName');
  if (!m || m.mode !== 'saveas' || !el || !inp) return;
  const hit = listOf(m.k).find(r => sameName(r.name, inp.value || ''));
  el.innerHTML = hit ? `A saved ${kindName(m.k)} is already called <b>${esc(hit.name)}</b>. When you save, you can replace it or keep both.` : '';
  document.querySelectorAll('.replist .rep').forEach(b => b.setAttribute('aria-pressed', String(!!hit && b.dataset.arg === hit.id)));
}
function readMetaForm(k){
  const d = W[k];
  const name = ($('#mName').value || '').trim();
  if (!name){ $('#mName').focus(); toast('Give it a name first.'); return false; }
  d.name = name;
  if (k === 'prog') d.autoName = false;
  d.notes = $('#mNotes').value;
  if (k === 'song' && $('#mArtist')) d.artist = $('#mArtist').value;
  return true;
}
function fileBar(k){
  if (k === 'prog') refreshAutoName();
  const d = W[k], dirty = isDirty(k), n = kindName(k);
  return `<div class="filebar">
    <div class="fb-id"><span class="lbl">${k === 'prog' ? 'Progression' : 'Song'}</span><b class="fb-name">${esc(d.name)}</b>${dirty ? '<span class="pill k-weak">unsaved changes</span>' : d.id ? '<span class="pill k-strong">saved</span>' : ''}<span class="muted fb-date">${d.updated ? 'last saved ' + fmtDate(d.updated) : 'not saved yet'}</span>${syncBadge()}${d.notes ? `<span class="fb-notes">${esc(d.notes)}</span>` : ''}</div>
    <div class="fb-acts">
      <button class="btn sm" data-act="docNew" data-arg="${k}">New</button>
      <button class="btn sm" data-act="docOpen" data-arg="${k}">Open… <span class="muted">(${listOf(k).length})</span></button>
      <button class="btn sm primary" data-act="docSave" data-arg="${k}">Save</button>
      <button class="btn sm" data-act="docSaveAs" data-arg="${k}">Save as…</button>
      <button class="btn sm" data-act="docExport" data-arg="${k}" title="Download this ${n} as a file (with the custom patterns and tunings it uses), to share it or move it to another Harmony Bench">Export…</button>
      <button class="btn sm" data-act="docDetails" data-arg="${k}">Name &amp; notes…</button>
      <button class="btn sm" data-act="backup">Backup / transfer…</button>
    </div></div>`;
}
function openList(k){
  const list = listOf(k).slice().sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  const rows = list.map(r => {
    const st = r.settings || {}, key = SC[st.scale] ? makeKey(st.keyPc || 0, st.scale).name : '';
    const beats = k === 'prog' ? (r.items || []).reduce((a, it) => a + it.b, 0) : (r.order || []).reduce((a, id) => a + ((r.parts || []).find(p => p.id === id)?.items || []).reduce((x, it) => x + it.b, 0), 0);
    const size = k === 'prog' ? `${(r.items || []).length} chords` : `${(r.parts || []).length} sections`;
    return `<div class="orow"><div class="oinfo"><b>${esc(r.name)}</b>${r.artist ? ` <span class="muted">· ${esc(r.artist)}</span>` : ''}<span class="muted">${esc(key)} · ${st.ts ? `${st.ts.num}/${st.ts.den}` : '4/4'} · ${st.bpm || ''} BPM · ${size} · ${Math.ceil(beats / ((st.ts && st.ts.num) || 4))} bars</span><span class="muted">Saved ${fmtDate(r.updated)}${r.created && r.created !== r.updated ? ` · created ${fmtDate(r.created)}` : ''}</span>${r.notes ? `<span class="onotes">${esc(r.notes)}</span>` : ''}</div>
      <div class="oacts"><button class="btn sm primary" data-act="docLoad" data-arg="${k}:${r.id}">Open</button><button class="btn sm" data-act="docDup" data-arg="${k}:${r.id}">Duplicate</button><button class="btn sm" data-act="docDel" data-arg="${k}:${r.id}">Delete</button></div></div>`;
  }).join('');
  openModal(`Open a saved ${kindName(k)}`, rows || `<p class="muted">Nothing saved yet. Use <b>Save</b> to keep the current ${kindName(k)}.</p>`);
}

/* ================= Backup / transfer ================= */
function backupDialog(){
  const json = JSON.stringify({ app: 'harmony-bench', version: 1, exported: nowISO(), library: { tunings: LIB.tunings, progressions: LIB.progressions, songs: LIB.songs, patterns: LIB.patterns || [] } });
  openModal('Backup / transfer', `
    <p>${SYNC.mode === 'synced' || SYNC.mode === 'saving' ? 'Your saved tunings, progressions and songs are stored on your Harmony Bench server and shared by every browser and device' : 'Your saved tunings, progressions and songs live in this browser on this device'}: ${LIB.tunings.length} tunings, ${LIB.progressions.length} progressions, ${LIB.songs.length} songs. A backup file is a copy you can keep, or import into another copy of Harmony Bench.</p>
    <div class="acts"><button class="btn primary" data-act="backupDownload">Download backup file</button><label class="btn">Import a backup file<input type="file" id="importFile" accept=".json,application/json" hidden></label></div>
    <label class="fld"><span>Backup as text (select all and copy, or paste one here to import)</span><textarea id="backupText" rows="7" class="mono" style="font-size:11.5px">${esc(json)}</textarea></label>
    <p class="hint">Importing adds anything new and updates items that have a newer save; nothing is deleted.</p>`,
    [{ label: 'Close', act: 'modalClose' }, { label: 'Import from the text box', act: 'backupImportText', primary: true }]);
}
/* ---- Export one progression or song ----
   The open one, as it is now (unsaved changes included), plus what it needs to be rebuilt elsewhere: the custom
   strumming patterns it uses and the saved tunings that match its tuning. Voicings are part of its chords.
   The file has the backup format, so Backup / transfer → Import reads it. */
function docExportData(k){
  const d = W[k], content = clone(docContent(k)), now = nowISO();
  const rec = { id: d.id || uid(), created: d.created || now, updated: now, ...content };
  const st = rec.settings || {};
  const used = new Set([st.strum, ...(k === 'song' ? (rec.parts || []).map(p => p.strum) : [])].filter(Boolean));
  const patterns = (LIB.patterns || []).filter(pt => used.has(pt.id));
  const tunings = (LIB.tunings || []).filter(t => t.inst === st.inst && st.tuning && t.tuning.join() === st.tuning.join());
  return { app: 'harmony-bench', version: 1, exported: now, kind: k === 'prog' ? 'progression' : 'song', name: d.name,
    library: { tunings, progressions: k === 'prog' ? [rec] : [], songs: k === 'song' ? [rec] : [], patterns } };
}
function exportDialog(k){
  const data = docExportData(k), json = JSON.stringify(data);
  ui.exportFile = { name: `${(W[k].name || 'harmony-bench').replace(/[^\w\- ]+/g, '').trim() || 'harmony-bench'}.harmony-bench.json`, json };
  const extras = [data.library.patterns.length ? `${data.library.patterns.length} custom pattern${data.library.patterns.length > 1 ? 's' : ''}` : '', data.library.tunings.length ? `${data.library.tunings.length} saved tuning${data.library.tunings.length > 1 ? 's' : ''}` : ''].filter(Boolean);
  openModal(`Export ${kindName(k)}`, `<p>“${esc(W[k].name)}” as it is now${isDirty(k) ? ' (including unsaved changes)' : ''}: its chords, voicings, ${k === 'song' ? 'sections, arrangement, lyrics, ' : ''}key, tempo, time signature, playback style and instrument${extras.length ? `, plus ${extras.join(' and ')} it uses` : ''}.</p>
    <div class="acts"><button class="btn primary" data-act="exportDownload">Download file</button></div>
    <label class="fld"><span>Or copy the text</span><textarea id="exportText" rows="6" class="mono" style="font-size:11.5px" readonly>${esc(json)}</textarea></label>
    <p class="hint">To open it in another Harmony Bench: <b>Backup / transfer… → Import a backup file</b> (or paste the text there). It is added to the saved ${k === 'prog' ? 'progressions' : 'songs'}; nothing else is changed.</p>`,
    [{ label: 'Close', act: 'modalClose' }]);
}
function importBackup(txt){
  let data;
  try { data = JSON.parse(txt); } catch (e) { toast('That is not a Harmony Bench backup (could not read it).'); return; }
  const lib = data && data.library;
  if (!lib){ toast('That is not a Harmony Bench backup.'); return; }
  let added = 0, updated = 0;
  ['tunings','progressions','songs','patterns'].forEach(key => {
    LIB[key] = LIB[key] || [];
    (lib[key] || []).forEach(r => {
      if (!r || !r.id) return;
      const i = LIB[key].findIndex(x => x.id === r.id);
      if (i < 0){ LIB[key].push(r); added++; }
      else if ((r.updated || r.created || '') > (LIB[key][i].updated || LIB[key][i].created || '')){ LIB[key][i] = r; updated++; }
    });
  });
  if (!libSave()) return;
  closeModal(); renderAll();
  // a single exported progression or song: offer to open it
  const one = data.kind === 'song' ? (lib.songs || [])[0] : data.kind === 'progression' ? (lib.progressions || [])[0] : null;
  const k = data.kind === 'song' ? 'song' : 'prog';
  if (one) toast(`Imported the ${kindName(k)} “${esc(one.name)}”.`, { label: 'Open it', fn: () => { const rec = listOf(k).find(r => r.id === one.id); if (rec) guardDirty(k, () => loadDoc(k, rec)); } });
  else toast(`Imported: ${added} new, ${updated} updated.`);
}

/* ================= Saved tunings ================= */
const userTunings = () => LIB.tunings.filter(t => t.inst === S.inst);
function tuningsDialog(){
  const rows = userTunings().map(t => `<div class="orow"><div class="oinfo"><b>${esc(t.name)}</b><span class="muted">${t.tuning.map(m => midiName(m)).join(' ')}${t.capo ? ` · capo ${t.capo}` : ''} · saved ${fmtDate(t.created)}</span></div>
    <div class="oacts"><button class="btn sm primary" data-act="tunUse" data-arg="${t.id}">Use</button><button class="btn sm" data-act="tunDel" data-arg="${t.id}">Delete</button></div></div>`).join('');
  openModal(`My ${INST[S.inst].name.toLowerCase()} tunings`, rows || '<p class="muted">No saved tunings for this instrument.</p>');
}
function applyTuning(t){
  S.tun[t.inst] = t.tuning.slice();
  S.capo[t.inst] = t.capo || 0;
  S.shape[S.inst] = shape().map(f => f === null ? null : Math.min(f, maxRel()));
  renderInstrument(); refreshTabLight(); strumFrets(shape());
}

/* ================= Song builder ================= */
const PART_TYPES = ['Intro','Verse','Pre-chorus','Chorus','Bridge','Solo','Interlude','Breakdown','Outro'];
const partById = id => W.song.parts.find(p => p.id === id);
const beatsOf = items => items.reduce((a, it) => a + it.b, 0);
function fmtTime(beats){ return fmtSecs(beats * 60 / S.bpm); }
function fmtSecs(x){ const s = Math.round(x); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function chordStrip(items, o){
  if (!items.length) return '<span class="muted">No chords yet</span>';
  const chs = items.map(fromItem);
  return barSegments(items).map(segs => `<span class="sbar">${segs.map(s => `<span class="sc-chip${s.cont ? ' cont' : ''}" data-o="${o}" data-ci="${s.idx}">${s.cont ? '%' : chs[s.idx].symbol}</span>`).join('')}</span>`).join('');
}
function newPartName(base){
  const names = new Set(W.song.parts.map(p => p.name));
  if (!names.has(base)) return base;
  let i = 2;
  while (names.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}
function addPart(name, items = []){
  const p = { id: uid(), name: newPartName(name), items, lyrics: '', key: clone(W.song.key || keyNow()) };
  W.song.parts.push(p);
  W.song.order.push(p.id);
  save();
  return p;
}
// Song playback can start at any section (arrangement position o) or any chord in it (ci)
function songIndexAt(o, ci = 0){ const k = songSeq().findIndex(e => e.o === o && e.i === ci); return k < 0 ? 0 : k; }
function playSongFrom(o, ci = 0){ if (PB.on) pbStop(); ui.songFrom = o; pbStart('song', songIndexAt(o, ci)); }
// clicking a chord in the song sheet plays the song from that chord
document.addEventListener('click', e => { const c = e.target.closest('.sheet .sc-chip'); if (c && c.dataset.o !== undefined) playSongFrom(+c.dataset.o, +c.dataset.ci); });
function editPart(id){
  if (PB.on) pbStop();
  const p = partById(id);
  W.edit = id;
  // the section's own time signature and tempo apply while it is edited; the song's come back afterwards
  W.editStash = { ts: clone(S.ts), bpm: S.bpm };
  if (p.ts) S.ts = clone(p.ts);
  if (p.bpm) S.bpm = p.bpm;
  prog = p.items;
  ui.selSlot = 0; ui.selEnd = 0;
  S.tab = 'prog'; save(); renderAll();
  showTabTop();
}
function leavePart(){
  const p = W.edit && partById(W.edit), st = W.editStash;
  if (p && st){
    p.ts = tsEq(S.ts, st.ts) ? null : clone(S.ts);
    p.bpm = S.bpm !== st.bpm ? S.bpm : null;
    S.ts = st.ts; S.bpm = st.bpm;
  }
  W.edit = null; W.editStash = null;
}
function songSheetText(){
  const s = W.song, lines = [s.name + (s.artist ? ' — ' + s.artist : ''), `Key: ${K.name} · ${tsLabel()} · ${S.bpm} BPM`, ''];
  s.order.forEach(id => {
    const p = partById(id); if (!p) return;
    const tag = partTag(p);
    lines.push(`[${p.name}${tag ? ' — ' + tag : ''}]`, inSection(p, () => chartText(p.items)) || '(no chords)');
    if (p.lyrics.trim()) lines.push(p.lyrics.trim());
    lines.push('');
  });
  return lines.join('\n').trim();
}
function renderSong(){
  const el = $('#p-song'), s = W.song;
  ensureSongKeys();
  // bars and running time add up section by section (each can have its own meter and tempo)
  const used = s.order.map(partById).filter(Boolean);
  const bars = used.reduce((a, p) => a + Math.ceil(beatsOf(p.items) / secTs(p).num), 0);
  const secs = used.reduce((a, p) => a + beatsOf(p.items) * 60 / secBpm(p), 0);
  const flagged = s.parts.filter(p => s.order.includes(p.id) && offKey(p)).length;
  const parts = s.parts.map(p => {
    const uses = s.order.filter(id => id === p.id).length;
    return `<div class="part${offKey(p) ? ' offkey' : ''}" data-part="${p.id}">
      <div class="part-h"><input class="pname" data-part="${p.id}" value="${esc(p.name)}" aria-label="Section name" maxlength="60">
        <span class="muted mono" style="font-size:12px">${Math.ceil(beatsOf(p.items) / secTs(p).num)} bars · used ${uses}×</span></div>
      ${partKeyHTML(p)}
      <div class="strip">${inSection(p, () => chordStrip(p.items, 'p' + p.id))}</div>
      ${partAnalysisHTML(p)}
      <div class="acts">
        <button class="btn sm primary" data-act="partEdit" data-arg="${p.id}">Edit chords</button>
        <button class="btn sm" data-act="partPlay" data-arg="${p.id}">▶ Play</button>
        <button class="btn sm" data-act="partImport" data-arg="${p.id}">Import progression…</button>
        <button class="btn sm" data-act="partPaste" data-arg="${p.id}"${LIB.clip ? '' : ' disabled'}>Paste copied chords</button>
        <button class="btn sm" data-act="partArr" data-arg="${p.id}">+ Arrangement</button>
        <button class="btn sm" data-act="partDup" data-arg="${p.id}">Duplicate</button>
        <button class="btn sm" data-act="partDel" data-arg="${p.id}">Delete</button>
      </div>
      <label class="fld"><span>Lyrics</span><textarea class="lyrics" data-part="${p.id}" rows="4" placeholder="Lyrics for this section…">${esc(p.lyrics)}</textarea></label>
    </div>`;
  }).join('');
  if (!(ui.songFrom < s.order.length)) ui.songFrom = 0;
  const arr = s.order.map((id, o) => {
    const p = partById(id); if (!p) return '';
    const tag = partTag(p);
    return `<span class="arr${offKey(p) ? ' offkey' : ''}${o === ui.songFrom ? ' from' : ''}" data-o="${o}"><button class="arr-name" data-act="arrPick" data-arg="${o}" title="Play the song from here">${esc(p.name)}</button>${tag ? `<small>${esc(tag)}</small>` : ''}<button data-act="arrMv" data-arg="${o}:-1" aria-label="Move earlier">‹</button><button data-act="arrMv" data-arg="${o}:1" aria-label="Move later">›</button><button data-act="arrRm" data-arg="${o}" aria-label="Remove from arrangement">×</button></span>`;
  }).join('<span class="muted">→</span>');
  const sheet = s.order.map((id, o) => {
    const p = partById(id); if (!p) return '';
    const tag = partTag(p);
    return `<div class="sh-part" data-o="${o}"><div class="sh-name">${esc(p.name)}${tag ? ` <span class="sh-tag">${esc(tag)}</span>` : ''}</div><div class="strip">${inSection(p, () => chordStrip(p.items, o))}</div>${p.lyrics.trim() ? `<pre class="sh-lyr">${esc(p.lyrics.trim())}</pre>` : ''}</div>`;
  }).join('');
  el.innerHTML = `
  <div class="sec-h"><h2>Song builder</h2><p class="hint">A song is made of sections (verse, chorus…). Each section is a chord progression you edit with all the progression-builder tools; then set the order they are played in.</p></div>
  ${fileBar('song')}
  <div class="transport">
    <button class="play" data-act="songPlay" aria-label="${PB.on && PB.mode === 'song' ? 'Stop' : 'Play'} song" title="${PB.on && PB.mode === 'song' ? 'Click to stop. Double-click to restart from the beginning.' : 'Click to play from the section picked in the arrangement. Double-click to play from the beginning.'} Click a section in the arrangement, or a chord in the song sheet, to start there. (Space also plays and stops.)">${PB.on && PB.mode === 'song' ? '<svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8"/></svg>' : '<svg viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9Z"/></svg>'}</button>
    <div class="fld"><span>Whole song</span><div class="tempo"><button class="btn" data-act="songShift" data-d="-1" title="Move the whole song down a half step (every section moves from its own key)" aria-label="Whole song down a half step">−</button><b class="mono" style="min-width:9ch;text-align:center" title="The song's home key (also in the header)">${K.notes[0].name} ${K.sc.short}</b><button class="btn" data-act="songShift" data-d="1" title="Move the whole song up a half step (every section moves from its own key)" aria-label="Whole song up a half step">+</button></div></div>
    <div class="fld"><span>Tempo ${BEAT_SYMBOL[S.ts.den] || ''}=</span><div class="tempo"><input type="number" id="bpmN" min="30" max="300" value="${S.bpm}" aria-label="Tempo in beats per minute"><span class="lbl">BPM</span></div></div>
    ${tsSelectHTML('tsSel')}
    ${styleSelectHTML()}
    ${patternControlHTML()}
    <label class="chk"><input type="checkbox" id="loop"${S.loop ? ' checked' : ''}> Loop</label>
    <label class="chk" title="On: changing the key in the header moves every section with it. Off: sections keep their keys, and any section not in the song key is flagged until you match it or keep it as a key change."><input type="checkbox" id="songFollow"${s.follow ? ' checked' : ''}> Keep every section in the song key</label>
    ${genreSelectHTML('genreSong', s.genre)}
    <span class="muted mono">${s.order.length} sections · ${bars} bars · ${fmtSecs(secs)}</span>
  </div>
  ${practiceHTML('song')}
  ${songAnalysisHTML()}
  ${flagged ? `<div class="banner"><span><b>${flagged} section${flagged > 1 ? 's are' : ' is'} not in the song key (${esc(keyName(s.key))}).</b> Match ${flagged > 1 ? 'them' : 'it'} to the song key, or keep ${flagged > 1 ? 'them' : 'it'} as a deliberate key change, in the section below.</span></div>` : ''}
  <div class="sec"><div class="sec-h"><h3>Sections</h3><div class="acts"><select id="partNew" aria-label="Add a section"><option value="">+ Add a section…</option>${PART_TYPES.map(t => `<option>${t}</option>`).join('')}<option value="__custom">Custom name…</option></select></div></div>
    <div class="parts">${parts || '<p class="muted">No sections yet. Add one above, or use “Make into a song” on the Progression builder tab.</p>'}</div></div>
  <div class="sec"><h3>Arrangement</h3><p class="hint">The order the song plays in. A section can appear more than once (Verse → Chorus → Verse → Chorus).</p>
    <div class="arrange">${arr || '<span class="muted">Empty</span>'}</div>
    ${s.parts.length ? `<select id="arrAdd" aria-label="Add a section to the arrangement"><option value="">+ Add to the end…</option>${s.parts.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>` : ''}</div>
  <div class="sec"><div class="sec-h"><h3>Key changes and transitions</h3><span class="hint">Ideas for moving between sections: getting into and out of a new key, and stronger returns. ▶ plays the move; Apply changes the song (with Undo).</span></div>
    <div class="recs">${ideasHTML()}</div></div>
  <div class="sec"><div class="sec-h"><h3>Song sheet</h3><div class="acts"><button class="btn sm" data-act="sheetCopy">Copy as text…</button>${notationButton()}<button class="btn sm" data-act="printSheet" data-arg="song"${s.order.length ? '' : ' disabled'}>Print / PDF…</button></div></div>
    <div class="sheet panel"><div class="sh-title"><b>${esc(s.name)}</b>${s.artist ? ` <span class="muted">— ${esc(s.artist)}</span>` : ''}<div class="muted mono" style="font-size:12px">${esc(K.name)} · ${tsLabel()} · ${S.bpm} BPM</div></div>${sheet || '<p class="muted">Add sections to the arrangement to see the sheet.</p>'}</div>
    ${S.notation ? '<div class="panel notation" id="notationSong"></div>' : ''}</div>`;
  paintNotation('song');
}
function importDialog(partId){
  ui.importPart = partId;
  refreshAutoName();
  const opts = [`<option value="__cur">The Progression builder's current chords (“${esc(W.prog.name)}”)</option>`].concat(
    LIB.progressions.map(r => `<option value="${r.id}">${esc(r.name)} — ${esc(SC[(r.settings || {}).scale] ? makeKey(r.settings.keyPc, r.settings.scale).name : '')}</option>`)).join('');
  openModal(`Import into “${esc(partById(partId).name)}”`, `<div class="form">
    <label class="fld"><span>Progression</span><select id="impSrc">${opts}</select></label>
    <fieldset class="fld"><legend class="lbl">If it was saved in a different key</legend>
      <label class="chk"><input type="radio" name="impMode" value="rn" checked> Keep the Roman numerals: move the chords into this section's key (${esc(keyName(secKey(partById(partId))))})</label>
      <label class="chk"><input type="radio" name="impMode" value="abs"> Keep the exact chord names</label></fieldset>
    <fieldset class="fld"><legend class="lbl">Where</legend>
      <label class="chk"><input type="radio" name="impWhere" value="append" checked> Add after the section's chords</label>
      <label class="chk"><input type="radio" name="impWhere" value="replace"> Replace the section's chords</label></fieldset></div>`,
    [{ label: 'Cancel', act: 'modalClose' }, { label: 'Import', act: 'importGo', primary: true }]);
}

/* ================= Actions ================= */
Object.assign(ACT, {
  modalClose: () => closeModal(),
  pendingGo: () => { const f = ui.pending; ui.pending = null; closeModal(); if (f) f(); },
  pendingSave: el => {
    const k = el.dataset.arg, f = ui.pending; ui.pending = null;
    if (W[k].id){ storeDoc(k, false); closeModal(); if (f) f(); }
    else { ui.afterSave = f; ACT.docSaveAs({ dataset: { arg: k } }); }
  },
  docNew: el => {
    const k = el.dataset.arg;
    guardDirty(k, () => {
      if (PB.on) pbStop();
      if (k === 'prog'){ W.prog = blankProg(); if (!W.edit) prog = W.prog.items; }
      else { const key = clone(docKey()); leavePart(); W.song = blankSong(); W.song.key = key; prog = W.prog.items; }
      ui.selSlot = 0; ui.selEnd = 0; save(); renderTab();
    });
  },
  docOpen: el => openList(el.dataset.arg),
  docLoad: el => {
    const [k, id] = el.dataset.arg.split(':'), rec = listOf(k).find(r => r.id === id);
    if (!rec) return;
    closeModal();
    guardDirty(k, () => loadDoc(k, rec));
  },
  docDup: el => {
    const [k, id] = el.dataset.arg.split(':'), list = listOf(k), rec = list.find(r => r.id === id);
    if (!rec) return;
    const c = { ...clone(rec), id: uid(), name: rec.name + ' (copy)', created: nowISO(), updated: nowISO() };
    list.unshift(c); libSave(); openList(k);
  },
  docDel: el => {
    const [k, id] = el.dataset.arg.split(':');
    if (ui.confirmDel !== id){ ui.confirmDel = id; el.textContent = 'Confirm delete'; el.classList.add('primary'); return; }
    ui.confirmDel = null;
    const list = listOf(k), i = list.findIndex(r => r.id === id), rec = list[i];
    list.splice(i, 1); LIB.deleted[id] = nowISO(); libSave();
    if (W[k].id === id){ W[k].id = null; W[k].saved = null; }
    openList(k); renderTab();
    toast(`Deleted “${esc(rec.name)}”.`, { label: 'Undo', fn: () => { rec.updated = nowISO(); list.splice(i, 0, rec); libSave(); renderTab(); } });
  },
  docSave: el => { const k = el.dataset.arg; if (W[k].id) storeDoc(k, false); else ACT.docSaveAs(el); },
  docSaveAs: el => openSaveAs(el.dataset.arg),
  docExport: el => exportDialog(el.dataset.arg),
  exportDownload: () => {
    const f = ui.exportFile; if (!f) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([f.json], { type: 'application/json' }));
    a.download = f.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    toast('Download started. If nothing downloads, copy the text in the box instead.');
  },
  // picking a saved one fills in its name: Save then asks to replace it
  saveAsPick: el => { const r = listOf(ui.modal.k).find(x => x.id === el.dataset.arg); if (!r) return; $('#mName').value = r.name; nameHint(); },
  saveAsBack: () => { const m = ui.modal; openSaveAs(m.k, m.form); },
  saveNewCopy: () => {
    const m = ui.modal, d = W[m.k];
    Object.assign(d, { name: freeName(m.k, m.form.name), notes: m.form.notes }, m.k === 'song' && m.form.artist != null ? { artist: m.form.artist } : {});
    if (m.k === 'prog') d.autoName = false;
    closeModal(); storeDoc(m.k, true); const f = ui.afterSave; ui.afterSave = null; if (f) f();
  },
  saveReplace: () => {
    const m = ui.modal, k = m.k, d = W[k], list = listOf(k), i = list.findIndex(r => r.id === m.hit);
    if (i < 0){ toast('That one is gone; saving a new copy instead.'); ACT.saveNewCopy(); return; }
    const old = clone(list[i]), was = { id: d.id, created: d.created, saved: d.saved, name: d.name, notes: d.notes, autoName: d.autoName, ...(k === 'song' ? { artist: d.artist } : {}) };
    Object.assign(d, { name: m.form.name, notes: m.form.notes, id: old.id, created: old.created }, k === 'song' && m.form.artist != null ? { artist: m.form.artist } : {});
    if (k === 'prog') d.autoName = false;
    closeModal(); storeDoc(k, false);
    const f = ui.afterSave; ui.afterSave = null; if (f) f();
    if (was.id !== old.id) toast(`Replaced the saved “${esc(old.name)}”.`, { label: 'Undo', fn: () => {
      const j = list.findIndex(r => r.id === old.id);
      old.updated = nowISO(); if (j >= 0) list[j] = old; else list.unshift(old);
      Object.assign(d, was); libSave(); save(); renderTab();
    } });
  },
  docDetails: el => {
    const k = el.dataset.arg;
    ui.modal = { k, mode: 'details' };
    openModal(`${k === 'prog' ? 'Progression' : 'Song'} name and notes`, docMetaForm(k, W[k]), [{ label: 'Cancel', act: 'modalClose' }, { label: 'Apply', act: 'metaOk', primary: true }]);
  },
  metaOk: () => {
    const m = ui.modal; if (!m) return;
    // the name is already used: replace that one, or keep both
    if (m.mode === 'saveas'){
      const name = ($('#mName').value || '').trim(), hit = name && listOf(m.k).find(r => sameName(r.name, name));
      if (hit){
        const form = { name, notes: $('#mNotes').value, artist: $('#mArtist') ? $('#mArtist').value : null }, copy = freeName(m.k, name);
        ui.modal = { k: m.k, mode: 'saveclash', form, hit: hit.id };
        openModal('That name is already used', `<p>A saved ${kindName(m.k)} is already called <b>${esc(hit.name)}</b> (saved ${fmtDate(hit.updated)}).</p><p class="hint"><b>Replace</b> overwrites it with what you have open now (you can undo right after). <b>Keep both</b> saves this one as “${esc(copy)}”.</p>`,
          [{ label: 'Back', act: 'saveAsBack' }, { label: `Keep both: save as “${esc(copy)}”`, act: 'saveNewCopy' }, { label: `Replace “${esc(hit.name)}”`, act: 'saveReplace', primary: true }]);
        return;
      }
    }
    if (!readMetaForm(m.k)) return;
    closeModal();
    if (m.mode === 'saveas'){ storeDoc(m.k, true); const f = ui.afterSave; ui.afterSave = null; if (f) f(); }
    else { save(); renderTab(); }
  },
  backup: () => backupDialog(),
  backupDownload: () => {
    const txt = $('#backupText').value, a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
    a.download = `harmony-bench-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    toast('Download started. If nothing downloads, copy the text in the box instead.');
  },
  backupImportText: () => importBackup($('#backupText').value),
  tunSave: () => {
    ui.modal = { mode: 'tuning' };
    openModal('Save this tuning', `<div class="form"><label class="fld"><span>Name</span><input id="mName" type="text" maxlength="60" placeholder="e.g. Open D for slide"></label>
      <p class="hint">${esc(INST[S.inst].name)}: ${tuning().map(m => midiName(m)).join(' ')}${capo() ? `, capo ${capo()}` : ''}. Saved tunings appear in the Tuning menu.</p></div>`,
      [{ label: 'Cancel', act: 'modalClose' }, { label: 'Save', act: 'tunSaveOk', primary: true }]);
  },
  tunSaveOk: () => {
    const name = ($('#mName').value || '').trim();
    if (!name){ toast('Give the tuning a name.'); return; }
    LIB.tunings.push({ id: uid(), name, inst: S.inst, tuning: tuning().slice(), capo: capo(), created: nowISO(), updated: nowISO() });
    if (libSave()){ closeModal(); renderInstrument(); toast(`Saved tuning “${esc(name)}”.`); }
  },
  tunManage: () => tuningsDialog(),
  tunUse: el => { const t = LIB.tunings.find(x => x.id === el.dataset.arg); if (t){ closeModal(); applyTuning(t); } },
  tunDel: el => {
    const id = el.dataset.arg;
    if (ui.confirmDel !== id){ ui.confirmDel = id; el.textContent = 'Confirm delete'; el.classList.add('primary'); return; }
    LIB.tunings = LIB.tunings.filter(t => t.id !== id); LIB.deleted[id] = nowISO(); libSave(); tuningsDialog(); renderInstrument();
  },
  // clipboard and selections in the progression timeline
  clipCopy: () => clipCopy(false),
  clipCut: () => clipCopy(true),
  clipPaste: () => pasteItems((LIB.clip ? LIB.clip.items : []).map(itemFromAbs)),
  selDup: () => { const [a, b] = selRange(); if (a < 0) return; pasteItems(prog.slice(a, b + 1).map(it => clone(it))); },
  selDel: () => {
    const [a, b] = selRange(); if (a < 0) return;
    const old = prog.slice();
    prog.splice(a, b - a + 1);
    ui.selSlot = Math.min(a, prog.length - 1); ui.selEnd = ui.selSlot;
    save(); renderProg();
    toast(`Deleted ${b - a + 1} chord${b > a ? 's' : ''}.`, { label: 'Undo', fn: () => { setProg(old); renderProg(); } });
  },
  copyText: () => {
    const [a, b] = selRange();
    const items = b > a ? prog.slice(a, b + 1) : prog;
    const txt = `Key: ${K.name} · ${tsLabel()} · ${S.bpm} BPM\n${chartText(items)}\n${items.map(it => analyze(fromItem(it)).rn).join(' – ')}`;
    const ok = copyToSystem(txt);
    openModal(b > a ? 'Copy the selected chords as text' : 'Copy the progression as text', `<p class="hint">${ok ? 'Copied to your clipboard. ' : 'Select the text below and copy it (Ctrl+C / Cmd+C). '}You can paste this into a message or document, or back into Harmony Bench with “Paste chord text…”.</p><textarea id="copyBox" rows="6" class="mono" readonly>${esc(txt)}</textarea>`, [{ label: 'Done', act: 'modalClose', primary: true }]);
    setTimeout(() => { const t = $('#copyBox'); if (t){ t.focus(); t.select(); } }, 40);
  },
  pasteText: () => {
    openModal('Paste chord text', `<p class="hint">Type or paste chord names. Bar lines <b>|</b> split each bar evenly; <b>%</b> repeats the previous chord; <b>Cm:3</b> sets an exact length in beats. Without bar lines each chord gets ${S.defBeats} beats. Example: <span class="mono">| Am | F | C G | E7 |</span></p>
      <textarea id="pasteBox" rows="6" class="mono" placeholder="| Am | F | C G | E7 |"></textarea><div id="pastePrev" class="hint"></div>`,
      [{ label: 'Cancel', act: 'modalClose' }, { label: 'Insert after the selection', act: 'pasteTextGo', primary: true }]);
  },
  pasteTextGo: () => {
    const { chords, errors } = parseChart($('#pasteBox').value);
    if (!chords.length){ toast('No chord names recognized.'); return; }
    closeModal();
    pasteItems(chords.map(c => toItem(mkChord(c.pc, c.L, c.q, c.bs), c.b)));
    if (errors.length) toast(`Skipped what I could not read: ${esc(errors.slice(0, 6).join(' '))}`);
  },
  toSong: () => {
    if (!prog.length){ toast('Add some chords first.'); return; }
    if (!W.song.parts.length){ W.song = blankSong(); W.song.key = clone(docKey()); W.song.name = W.prog.autoName ? W.prog.name.replace(/Progression( \d+)?$/, 'Song') : W.prog.name; W.song.genre = W.prog.genre || null; addPart('Verse', clone(prog)); S.tab = 'song'; save(); renderTab(); toast('Started a song with this progression as its first section.'); return; }
    openModal('Make into a song', `<p>Your open song “${esc(W.song.name)}” already has ${W.song.parts.length} section${W.song.parts.length > 1 ? 's' : ''}.</p>`,
      [{ label: 'Cancel', act: 'modalClose' }, { label: 'Start a new song', act: 'toSongNew' }, { label: `Add as a section of “${esc(W.song.name)}”`, act: 'toSongAdd', primary: true }]);
  },
  toSongAdd: () => { closeModal(); const k = clone(docKey()), p = addPart('Section', clone(prog)); p.key = k; keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from: null, to: k, chords: 'new section (the progression’s chords)', cause: 'addSection' }); S.tab = 'song'; save(); renderAll(); },
  toSongNew: () => { closeModal(); const items = clone(prog), genre = W.prog.genre || null, key = clone(docKey()); guardDirty('song', () => { W.song = blankSong(); W.song.genre = genre; W.song.key = key; addPart('Verse', items); S.tab = 'song'; save(); renderAll(); }); },
  backToSong: () => { if (PB.on) pbStop(); leavePart(); prog = W.prog.items; S.tab = 'song'; save(); renderAll(); },
  // song sections
  partEdit: el => editPart(el.dataset.arg),
  partPlay: el => { if (PB.on) pbStop(); pbStart({ part: el.dataset.arg }); },
  partImport: el => importDialog(el.dataset.arg),
  importGo: () => {
    const p = partById(ui.importPart); if (!p) return;
    const src = $('#impSrc').value, mode = document.querySelector('input[name=impMode]:checked').value, where = document.querySelector('input[name=impWhere]:checked').value;
    let items, srcKey;
    if (src === '__cur'){ items = clone(W.prog.items); const k = W.prog.keyAt || keyNow(); srcKey = makeKey(k.pc, k.scale); }
    else { const r = LIB.progressions.find(x => x.id === src); if (!r) return; items = clone(r.items); srcKey = makeKey(r.settings.keyPc, r.settings.scale); }
    // into the section's own key
    if (mode === 'abs') items = inSection(p, () => items.map(it => itemFromAbs({ pc: mod(srcKey.pc + it.s), L: mod(srcKey.L + it.l, 7), q: it.q, b: it.b, bs: it.bs != null ? mod(srcKey.pc + it.bs) : null, keyPc: srcKey.pc, vos: vosOf(it), pv: it.pv, br: it.br })));
    if (where === 'replace') p.items.splice(0, p.items.length, ...items); else p.items.push(...items);
    closeModal(); save(); renderSong();
    toast(`Imported ${items.length} chords into “${esc(p.name)}”.`);
  },
  partPaste: el => { const p = partById(el.dataset.arg); if (!p || !LIB.clip) return; p.items.push(...LIB.clip.items.map(itemFromAbs)); save(); renderSong(); toast(`Pasted ${LIB.clip.items.length} chords into “${esc(p.name)}”.`); },
  partArr: el => { W.song.order.push(el.dataset.arg); save(); renderSong(); },
  partDup: el => {
    const p = partById(el.dataset.arg); if (!p) return;
    const c = { ...clone(p), id: uid(), name: newPartName(p.name) };
    W.song.parts.splice(W.song.parts.indexOf(p) + 1, 0, c); save(); renderSong();
  },
  partDel: el => {
    const id = el.dataset.arg;
    if (ui.confirmDel !== id){ ui.confirmDel = id; el.textContent = 'Confirm delete'; el.classList.add('primary'); return; }
    ui.confirmDel = null;
    const before = clone({ parts: W.song.parts, order: W.song.order });
    W.song.parts = W.song.parts.filter(p => p.id !== id);
    W.song.order = W.song.order.filter(x => x !== id);
    save(); renderSong();
    toast('Section deleted.', { label: 'Undo', fn: () => { W.song.parts = before.parts; W.song.order = before.order; save(); renderSong(); } });
  },
  arrMv: el => {
    const [o, d] = el.dataset.arg.split(':').map(Number), j = o + d, a = W.song.order;
    if (j < 0 || j >= a.length) return;
    [a[o], a[j]] = [a[j], a[o]]; save(); renderSong();
  },
  arrRm: el => { W.song.order.splice(+el.dataset.arg, 1); save(); renderSong(); },
  // like the progression's Play: from the section picked in the arrangement; a double-click starts at the beginning
  songPlay: () => {
    // the second click of a double-click restarts from the beginning, whether the first one started or stopped it
    const now = performance.now(), dbl = now - (ui.playClick || 0) < 450 && !ui.playDbl;
    ui.playClick = now; ui.playDbl = dbl;
    if (dbl){ if (PB.on) pbStop(); pbStart('song', 0); return; }
    if (PB.on) pbStop(); else pbStart('song', songIndexAt(ui.songFrom || 0));
  },
  // pick where the song starts; while it plays, jump there
  arrPick: el => { const o = +el.dataset.arg; if (PB.on && PB.mode === 'song') playSongFrom(o, 0); else { ui.songFrom = o; renderSong(); } },
  sheetCopy: () => {
    const txt = songSheetText(), ok = copyToSystem(txt);
    openModal('Song sheet as text', `<p class="hint">${ok ? 'Copied to your clipboard. ' : 'Select the text below and copy it (Ctrl+C / Cmd+C). '}</p><textarea id="copyBox" rows="14" class="mono" readonly>${esc(txt)}</textarea>`, [{ label: 'Done', act: 'modalClose', primary: true }]);
    setTimeout(() => { const t = $('#copyBox'); if (t){ t.focus(); t.select(); } }, 40);
  },
});
function selRange(){
  if (!prog.length) return [-1, -1];
  const a = Math.max(0, Math.min(ui.selSlot, ui.selEnd ?? ui.selSlot)), b = Math.min(prog.length - 1, Math.max(ui.selSlot, ui.selEnd ?? ui.selSlot));
  return [a, b];
}
function clipCopy(cut){
  const [a, b] = selRange(); if (a < 0) return;
  const items = prog.slice(a, b + 1);
  LIB.clip = { items: items.map(absFromItem), from: K.name, at: nowISO() };
  libSave();
  copyToSystem(chartText(items));
  if (cut){
    const old = prog.slice();
    prog.splice(a, b - a + 1);
    ui.selSlot = Math.max(0, Math.min(a, prog.length - 1)); ui.selEnd = ui.selSlot;
    save(); renderProg();
    toast(`Cut ${items.length} chord${items.length > 1 ? 's' : ''}. Paste them anywhere, including into another progression or a song section.`, { label: 'Undo', fn: () => { setProg(old); renderProg(); } });
  } else { renderProg(); toast(`Copied ${items.length} chord${items.length > 1 ? 's' : ''}. Select where they should go, then Paste.`); }
}
function pasteItems(items){
  if (!items.length){ toast('Nothing to paste. Copy some chords first.'); return; }
  const [, b] = selRange(), at = prog.length ? b + 1 : 0;
  prog.splice(at, 0, ...items);
  ui.selSlot = at; ui.selEnd = at + items.length - 1;
  save(); renderProg();
  toast(`Pasted ${items.length} chord${items.length > 1 ? 's' : ''}.`);
}

/* ================= Song inputs (typing does not re-render) ================= */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.classList.contains('pname')){ const p = partById(t.dataset.part); if (p){ p.name = t.value; save(); } }
  else if (t.classList.contains('lyrics')){ const p = partById(t.dataset.part); if (p){ p.lyrics = t.value; save(); } }
  else if (t.id === 'mName') nameHint();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.classList.contains('pname')) renderSong();
  else if (t.id === 'partNew' && t.value){
    if (t.value === '__custom'){
      ui.modal = { mode: 'partname' };
      openModal('New section', '<label class="fld"><span>Name</span><input id="mName" type="text" maxlength="60" placeholder="e.g. Post-chorus"></label>', [{ label: 'Cancel', act: 'modalClose' }, { label: 'Add', act: 'partNameOk', primary: true }]);
    } else { addPart(t.value); renderSong(); }
  }
  else if (t.id === 'arrAdd' && t.value){ W.song.order.push(t.value); save(); renderSong(); }
  else if (t.id === 'importFile' && t.files && t.files[0]){
    const r = new FileReader(); r.onload = () => importBackup(String(r.result)); r.readAsText(t.files[0]);
  }
  else if (t.dataset.ts){
    if (t.value === 'custom'){
      const g = tsGroups().join('+');
      openModal('Custom time signature', `<div class="form"><div class="acts">
        <label class="fld"><span>Beats per bar</span><input id="tsNum" type="number" min="1" max="32" value="${S.ts.num}"></label>
        <label class="fld"><span>Beat unit</span><select id="tsDen">${[2,4,8,16].map(d => `<option value="${d}"${d === S.ts.den ? ' selected' : ''}>${d} (${BEAT_SYMBOL[d]})</option>`).join('')}</select></label></div>
        <label class="fld"><span>Accent grouping (optional)</span><input id="tsGroups" type="text" value="${g}" placeholder="e.g. 2+2+3"></label>
        <p class="hint">Grouping sets where the accents fall, which the click and the strumming follow. 7/8 can be 2+2+3 or 3+2+2; leave it as is for the usual feel. Tempo counts the beat unit.</p></div>`,
        [{ label: 'Cancel', act: 'modalClose' }, { label: 'Apply', act: 'tsOk', primary: true }]);
      renderTab();
    } else if (t.value !== 'cur'){ const [n, d] = t.value.split('/').map(Number); setTs({ num: n, den: d, groups: null }); }
  }
});
Object.assign(ACT, {
  partNameOk: () => { const n = ($('#mName').value || '').trim(); if (!n) return; closeModal(); addPart(n); renderSong(); },
  tsOk: () => {
    const num = clamp(Math.round(+$('#tsNum').value || 4), 1, 32), den = +$('#tsDen').value;
    const gs = ($('#tsGroups').value || '').split('+').map(x => parseInt(x, 10)).filter(x => x > 0);
    const groups = gs.length && gs.reduce((a, b) => a + b, 0) === num && gs.join('+') !== defaultGroups(num, den).join('+') ? gs : null;
    if (gs.length && gs.reduce((a, b) => a + b, 0) !== num){ toast(`The grouping adds up to ${gs.reduce((a, b) => a + b, 0)}, not ${num}. Using the default grouping.`); }
    closeModal(); setTs({ num, den, groups });
  },
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden){ closeModal(); return; }
  if (e.key === 'Enter' && !$('#modal').hidden && e.target.tagName === 'INPUT'){ const p = $('#modal .macts .primary'); if (p){ e.preventDefault(); p.click(); } }
}, true);

/* ================= Boot ================= */
// Every chord list in the open progression or song
const docItems = k => k === 'prog' ? W.prog.items : W.song.parts.flatMap(p => p.items);
// Older saved shapes (one per item) become per-instrument-and-tuning ones; an unchanged document stays saved
function upgradeShapes(){
  ['prog', 'song'].forEach(k => {
    const items = docItems(k);
    if (!items.some(it => it.vo)) return;
    const clean = W[k].saved && !isDirty(k);
    items.forEach(vosOf);
    if (clean) W[k].saved = JSON.stringify(docContent(k));
  });
}
(function boot(){
  upgradeShapes();
  const h = (location.hash || '').slice(1);
  if (h === 'scales' || h === 'chords' || h === 'song') S.tab = h;
  if (h === 'progression') S.tab = 'prog';
  // the header starts with the key of whatever is in front (the explore key, the progression, the song or the
  // section being edited), so the first render only reads keys and never writes the stored header key into a document
  ensureSongKeys();
  if (!W.prog.keyAt) W.prog.keyAt = keyNow();
  if (!S.explore) S.explore = keyNow();
  ui.keyCtx = keyCtx();
  keyWhy('boot'); loadCtxKey(ui.keyCtx);
  computeKey();
  if (!S.shape[S.inst] && fretted()){
    const v = bestFrets(diatonic(0, false));
    if (v) S.shape[S.inst] = v.frets.slice();
  }
  if (K.hept) ui.focus = diatonic(0, false);
  renderAll();
  syncPull();
})();
