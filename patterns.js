'use strict';
/* =========================================================================
   Strumming and picking patterns: a library of one-bar patterns (and your
   own), played by the Rhythm style on fretted instruments and piano, per
   progression or song, with a per-section override. "Auto" is the original
   rhythm that follows the meter's accents.
   Loaded after genres.js and before docs.js.
   ========================================================================= */

/* Steps, one per subdivision of the beat (res = steps per beat):
   D down strum · d soft down · U up strum (top strings) · u soft up · x muted "chuck" · c chop (short, top strings)
   P palm-muted down (low strings) · B bass note · b alternate bass (the 5th, or the next string up)
   p pick the top strings together · 1–4 pick one string counted from the top · T pinch (bass + top string)
   - rest (what's sounding keeps ringing). Meter 'any' patterns are one beat long and repeat on every beat. */
const PATTERNS = [
  { id: 'eighths', name: 'Eighths (down-up)', kind: 'strum', meter: 'any', res: 2, steps: 'DU', genres: ['pop', 'rock', 'folk', 'country'] },
  { id: 'quarters', name: 'Quarter-note downs', kind: 'strum', meter: '4/4', res: 2, steps: 'D-D-D-D-', genres: ['rock', 'punk', 'pop', 'folk'] },
  { id: 'campfire', name: 'Campfire / “old faithful”', kind: 'strum', meter: '4/4', res: 2, steps: 'D-DU-UDU', genres: ['folk', 'pop', 'country', 'rock'] },
  { id: 'folkrock', name: 'Folk rock', kind: 'strum', meter: '4/4', res: 2, steps: 'D-DUDUDU', genres: ['folk', 'rock', 'pop'] },
  { id: 'island', name: 'Island / calypso', kind: 'strum', meter: '4/4', res: 2, steps: 'D--U-UDU', genres: ['pop', 'reggae', 'folk'] },
  { id: 'chuck', name: 'Backbeat chuck', kind: 'strum', meter: '4/4', res: 2, steps: 'D-xU-UxU', genres: ['pop', 'funk', 'rnb', 'gospel'] },
  { id: 'rock8', name: 'Rock eighths (all downs)', kind: 'strum', meter: '4/4', res: 2, steps: 'DDDDDDDD', genres: ['rock', 'punk', 'metal'] },
  { id: 'palm', name: 'Palm-muted chug', kind: 'strum', meter: '4/4', res: 2, steps: 'PPPPPPPP', genres: ['metal', 'punk', 'rock'] },
  { id: 'gallop', name: 'Gallop (palm-muted)', kind: 'strum', meter: '4/4', res: 4, steps: 'P-PPP-PPP-PPP-PP', genres: ['metal'] },
  { id: 'shuffle', name: 'Shuffle (swung eighths)', kind: 'strum', meter: 'any', res: 2, steps: 'Du', swing: 0.33, genres: ['blues', 'jazz', 'country', 'rock'] },
  { id: 'boomchick', name: 'Boom-chick (bass + strum)', kind: 'strum', meter: '4/4', res: 2, steps: 'B-D-b-D-', genres: ['country', 'folk', 'gospel'] },
  { id: 'skank', name: 'Reggae skank (chops on 2 and 4)', kind: 'strum', meter: '4/4', res: 2, steps: '--c---c-', genres: ['reggae'] },
  { id: 'ska', name: 'Ska upstrokes (off-beats)', kind: 'strum', meter: '4/4', res: 2, steps: '-u-u-u-u', genres: ['reggae', 'punk'] },
  { id: 'funk16', name: 'Funk sixteenths (with ghost strums)', kind: 'strum', meter: '4/4', res: 4, steps: 'D-xU-UD-xU-UDxU-', genres: ['funk', 'rnb'] },
  { id: 'pop16', name: 'Pop sixteenths', kind: 'strum', meter: '4/4', res: 4, steps: 'D-D-D-DUD-D-D-DU', genres: ['pop', 'edm', 'cinematic'] },
  { id: 'waltz', name: 'Waltz (boom-chick-chick)', kind: 'strum', meter: '3/4', res: 2, steps: 'B-D-D-', genres: ['folk', 'country', 'classical', 'romantic'] },
  { id: 'strum34', name: '3/4 strum', kind: 'strum', meter: '3/4', res: 2, steps: 'D-DUDU', genres: ['folk', 'pop', 'country'] },
  { id: 'six8', name: '6/8 downs', kind: 'strum', meter: '6/8', res: 1, steps: 'D--D--', genres: ['folk', 'rock', 'cinematic'] },
  { id: 'six8roll', name: '6/8 rolling strum', kind: 'strum', meter: '6/8', res: 1, steps: 'DUDDUD', genres: ['folk', 'pop', 'rock'] },
  { id: 'twelve8', name: '12/8 slow blues', kind: 'strum', meter: '12/8', res: 1, steps: 'DuuDuuDuuDuu', genres: ['blues', 'gospel', 'rnb'] },
  { id: 'travis', name: 'Travis picking', kind: 'pick', meter: '4/4', res: 2, steps: 'T3b2B3b2', genres: ['folk', 'country', 'blues'] },
  { id: 'arp8', name: 'Arpeggio (up and down)', kind: 'pick', meter: '4/4', res: 2, steps: 'B3212321', genres: ['folk', 'pop', 'classical', 'romantic', 'cinematic'] },
  { id: 'pinch', name: 'Folk pinch', kind: 'pick', meter: '4/4', res: 2, steps: 'T-3-b-3-', genres: ['folk', 'country'] },
  { id: 'ballad', name: 'Ballad picking', kind: 'pick', meter: '4/4', res: 2, steps: 'B-32b-32', genres: ['pop', 'rnb', 'folk', 'cinematic'] },
  { id: 'pima', name: 'p-i-m-a (sixteenths)', kind: 'pick', meter: '4/4', res: 4, steps: 'B321b321B321b321', genres: ['classical', 'baroque', 'romantic', 'flamenco'] },
  { id: 'bossa', name: 'Bossa nova', kind: 'pick', meter: '4/4', res: 2, steps: 'T--pb-p-', genres: ['bossa', 'jazz'] },
  { id: 'arp34', name: '3/4 arpeggio', kind: 'pick', meter: '3/4', res: 2, steps: 'B32123', genres: ['classical', 'romantic', 'folk', 'baroque'] },
  { id: 'arp68', name: '6/8 arpeggio', kind: 'pick', meter: '6/8', res: 1, steps: 'B32123', genres: ['folk', 'pop', 'cinematic', 'classical'] },
  { id: 'alberti', name: 'Alberti (low-high-mid-high)', kind: 'pick', meter: 'any', res: 4, steps: 'B132', genres: ['classical', 'baroque'] },
];
const PAT_STEPS = '-DdUuxcPBbpT1234';
const allPatterns = () => [...PATTERNS, ...(LIB.patterns || [])];
const patternById = id => allPatterns().find(p => p.id === id) || null;
// The pattern the Rhythm style plays now (a song section's own one is swapped in by inSection), or null for Auto
const curPattern = () => S.style === 'rhythm' ? patternById(S.strum) : null;
const tsKey = () => `${S.ts.num}/${S.ts.den}`;
const patFits = p => p.meter === 'any' || p.meter === tsKey();
const patText = p => p.steps.split('').map((c, i) => (i && i % p.res === 0 ? ' ' : '') + c).join('');

// The events of a pattern over one chord: { at (beats from the chord's start), idx (indexes into the chord's
// notes, low to high), dir, vel, len: 'ring' | 'short' | 'mute' | 'palm' }.
// Steps are counted from the bar line, so a chord that starts mid-bar plays the rest of the pattern.
function patternEvents(pat, n, startBeat, beats, ch, notes){
  const num = S.ts.num, res = pat.res, L = pat.steps.length, acc = barAccents(), out = [];
  const top = k => [...Array(Math.min(k, n)).keys()].map(i => n - 1 - i).reverse();
  const alt = (() => {
    // the alternate bass: the chord's 5th (or another chord tone) on a low note, else the next note up
    for (let i = 1; i < n; i++){ const t = notes && toneOf(ch, notes[i]); if (t && t.num === 5) return i; }
    return Math.min(1, n - 1);
  })();
  for (let b = 0; b < beats; b++) for (let j = 0; j < res; j++){
    const g = (startBeat + b) % num, step = pat.meter === 'any' ? j : (g * res + j) % L, c = pat.steps[step];
    if (!c || c === '-') continue;
    const sw = pat.swing && j % 2 === 1 ? pat.swing / res : 0;
    const at = b + j / res + sw, a = acc[g] ?? 0, accent = j === 0 ? [0.86, 0.95, 1.05][a] : 0.86;
    const ev = { at, idx: [], dir: 'down', vel: 0.8 * accent, len: 'ring' };
    if (c === 'D' || c === 'd'){ ev.idx = [...Array(n).keys()]; if (c === 'd') ev.vel *= 0.7; }
    else if (c === 'U' || c === 'u'){ ev.idx = top(4); ev.dir = 'up'; ev.vel *= c === 'u' ? 0.5 : 0.68; }
    else if (c === 'x'){ ev.idx = [...Array(n).keys()]; ev.len = 'mute'; ev.vel *= 0.6; }
    else if (c === 'c'){ ev.idx = top(3); ev.len = 'short'; ev.vel *= 0.75; }
    else if (c === 'P'){ ev.idx = [...Array(Math.min(3, n)).keys()]; ev.len = 'palm'; ev.vel *= 0.9; }
    else if (c === 'B'){ ev.idx = [0]; ev.dir = 'pick'; }
    else if (c === 'b'){ ev.idx = [alt]; ev.dir = 'pick'; ev.vel *= 0.92; }
    else if (c === 'p'){ ev.idx = top(3); ev.dir = 'pinch'; ev.vel *= 0.72; }
    else if (c === 'T'){ ev.idx = [...new Set([0, n - 1])]; ev.dir = 'pinch'; }
    else if (c >= '1' && c <= '4'){ ev.idx = [Math.max(0, n - +c)]; ev.dir = 'pick'; ev.vel *= 0.72; }
    else continue;
    out.push(ev);
  }
  return out;
}
const LEN_SECS = { mute: 0.05, short: 0.11, palm: 0.16 };
// Play a pattern on a fretted shape (fingers on the strings that sound; muted strings stay silent)
function playPatternFrets(pat, frets, t, beats, startBeat, ch, dest){
  const spb = 60 / S.bpm, strs = frets.map((f, s) => f === null ? -1 : s).filter(s => s >= 0), et = eff();
  if (!strs.length) return;
  patternEvents(pat, strs.length, startBeat, beats, ch, strs.map(s => et[s] + frets[s])).forEach(ev => {
    let ss = ev.idx.map(i => strs[i]);
    if (ev.dir === 'up') ss = ss.reverse();
    const gap = ev.dir === 'up' ? 0.013 : ev.dir === 'pinch' || ev.dir === 'pick' ? 0.004 : 0.018;
    const tt = t + ev.at * spb, short = LEN_SECS[ev.len];
    ss.forEach((s, k) => pluckString(s, frets[s], tt + k * gap, ev.vel * (1 - k * 0.02), dest, short ? { dur: short } : dest ? {} : { dur: chordLen() + (ss.length - k) * gap }));
  });
}
// Play a pattern on piano notes (low to high): strums become chord hits, picks single notes
function playPatternPiano(pat, midis, t, beats, startBeat, ch, dest){
  const spb = 60 / S.bpm, ms = midis.slice().sort((a, b) => a - b), evs = patternEvents(pat, ms.length, startBeat, beats, ch, ms);
  evs.forEach((ev, i) => {
    const nextAt = i + 1 < evs.length ? evs[i + 1].at : beats, short = LEN_SECS[ev.len];
    const dur = short ? short * 2 : Math.max(0.15, (ev.dir === 'pick' ? beats - ev.at : nextAt - ev.at) * spb * 0.95);
    ev.idx.forEach((x, k) => playNote('piano', ms[x], t + ev.at * spb + (ev.dir === 'up' ? (ev.idx.length - k) : k) * 0.006, { vel: ev.vel, dur, dest }));
  });
}
// A pattern as MIDI notes over one chord: [{ at, dur (beats), midi, vel }]
function patternNotes(pat, midis, startBeat, beats, ch){
  const ms = midis.slice().sort((a, b) => a - b), evs = patternEvents(pat, ms.length, startBeat, beats, ch, ms), spb = 60 / S.bpm, out = [];
  evs.forEach((ev, i) => {
    const next = evs.slice(i + 1).find(e => e.idx.some(x => ev.idx.includes(x)));
    const short = LEN_SECS[ev.len], dur = short ? short / spb : (next ? next.at : beats) - ev.at;
    ev.idx.forEach(x => out.push({ at: ev.at, dur: Math.max(0.05, dur), midi: ms[x], vel: ev.vel }));
  });
  return out;
}

/* ---- Choosing ---- */
function patternOptions(sel, withSong){
  const g = typeof GENRE === 'function' ? GENRE() : null, gid = g && Object.keys(GENRES).find(k => GENRES[k] === g);
  const opt = p => `<option value="${esc(p.id)}"${sel === p.id ? ' selected' : ''} title="${esc(patText(p))}">${esc(p.name)}${p.meter === 'any' || p.meter === tsKey() ? '' : ` (${p.meter})`}</option>`;
  const fit = allPatterns().filter(patFits), other = allPatterns().filter(p => !patFits(p));
  const mine = (LIB.patterns || []).filter(patFits);
  const typical = gid ? fit.filter(p => (p.genres || []).includes(gid)) : [];
  const grp = (label, list) => list.length ? `<optgroup label="${esc(label)}">${list.map(opt).join('')}</optgroup>` : '';
  return (withSong ? `<option value=""${!sel ? ' selected' : ''}>Song pattern</option>` : '') +
    `<option value="auto"${sel === 'auto' ? ' selected' : ''}>Auto (follows the meter)</option>` +
    grp(`Typical in ${g ? g.name : ''}`, typical) +
    grp('Strumming', fit.filter(p => p.kind === 'strum' && !mine.includes(p))) +
    grp('Fingerpicking', fit.filter(p => p.kind === 'pick' && !mine.includes(p))) +
    grp('Your patterns', mine) + grp('Other meters', other) +
    `<option value="__new">Make your own…</option>`;
}
function patternControlHTML(){
  if (S.style !== 'rhythm' || kind() === 'bass') return '';
  const p = patternById(S.strum);
  return `<label class="fld"><span>Pattern</span><span class="patrow"><select id="strum" aria-label="Strumming or picking pattern">${patternOptions(p ? p.id : 'auto')}</select><button class="btn sm" data-act="patHear" title="Hear one bar of this pattern on the selected chord" aria-label="Hear the pattern">▶</button><button class="btn sm" data-act="patEdit" title="${p && !PATTERNS.includes(p) ? 'Edit this pattern' : 'Make your own pattern (starting from this one)'}" aria-label="Edit the pattern">✎</button></span></label>
    <label class="chk" title="Start the pattern over at every chord change (it plays as much as fits), instead of running it across the bar"><input type="checkbox" id="strumRestart"${S.strumRestart ? ' checked' : ''}> Restart the pattern on each chord</label>`;
}

/* ---- Hearing a pattern: two bars on the selected chord (or what's on the neck or keyboard) ---- */
function patternPreview(pat){
  const ctx = ac(), t = ctx.currentTime + 0.05, num = S.ts.num;
  const it = S.tab === 'prog' ? prog[ui.selSlot] : null;
  const ch = it ? fromItem(it) : (ui.ident[0] || focusChord());
  if (fretted()){
    const v = it ? (progVoicings([it])[0].v || null) : null, frets = v ? v.frets : shape();
    if (kind() === 'bass') return;
    playPatternFrets(pat, frets, t, num * 2, 0, ch);
  } else {
    const ms = it ? progVoicings([it])[0].midis : activeMidis();
    if (ms && ms.length) playPatternPiano(pat, ms, t, num * 2, 0, ch);
  }
}

/* ---- Your own patterns ---- */
const PAT_CYCLE = ['-', 'D', 'U', 'x', 'B', 'b', 'p', 'T', 'd', 'u', 'c', 'P', '1', '2', '3', '4'];
function patternEditor(base){
  const own = base && !PATTERNS.includes(base);
  const p = base ? { ...base } : { name: '', meter: tsKey(), res: 2, steps: '', swing: 0 };
  if (!own){ p.id = null; p.name = base ? base.name + ' (my version)' : 'My pattern'; if (p.meter === 'any'){ p.meter = tsKey(); p.steps = p.steps.repeat(S.ts.num); } }
  const len = (+p.meter.split('/')[0] || S.ts.num) * p.res;
  p.steps = (p.steps || '').padEnd(len, '-').slice(0, len);
  ui.modal = { mode: 'pattern', pat: p };
  openModal(own ? 'Edit pattern' : 'Make your own pattern', `<div class="form">
    <label class="fld"><span>Start from</span><select id="patFrom" aria-label="Start from a pattern">${templateOptions(base)}</select></label>
    <label class="fld"><span>Name</span><input id="patName" type="text" maxlength="60" value="${esc(p.name)}"></label>
    <div class="patopts">
      <label class="fld"><span>Meter</span><select id="patMeter">${['4/4', '3/4', '2/4', '6/8', '12/8', '5/4', '7/8'].concat([tsKey()]).filter((v, i, a) => a.indexOf(v) === i).map(m => `<option${m === p.meter ? ' selected' : ''}>${m}</option>`).join('')}</select></label>
      <label class="fld"><span>Steps per beat</span><select id="patRes">${[[1, '1'], [2, '2 (eighths in 4/4)'], [3, '3 (triplets)'], [4, '4 (sixteenths)']].map(([v, l]) => `<option value="${v}"${v === p.res ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="fld"><span>Swing</span><select id="patSwing">${[[0, 'Straight'], [0.17, 'Light swing'], [0.33, 'Triplet swing']].map(([v, l]) => `<option value="${v}"${Math.abs(v - (p.swing || 0)) < 0.01 ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    </div>
    <div class="patgrid" id="patGrid"></div>
    <label class="fld"><span>Steps (type them, or click the grid)</span><input id="patSteps" class="mono" type="text" value="${esc(p.steps)}" spellcheck="false"></label>
    <p class="hint"><b>D</b> down · <b>U</b> up · <b>x</b> muted chuck · <b>B</b> bass · <b>b</b> alternate bass · <b>p</b> pick the top strings · <b>T</b> pinch (bass + top) · <b>d u</b> soft · <b>c</b> chop · <b>P</b> palm-muted · <b>1–4</b> one string from the top · <b>-</b> rest. Click a cell to cycle; right-click to clear.</p>
  </div>`, [...(own ? [{ label: 'Delete', act: 'patDelete' }] : []), { label: '▶ Hear it', act: 'patTry' }, { label: 'Cancel', act: 'modalClose' }, { label: 'Save', act: 'patSave', primary: true }]);
  drawPatGrid();
}
// Every pattern as a starting point, grouped as in the Pattern menu (patterns for this meter first)
function templateOptions(sel){
  const opt = q => `<option value="${esc(q.id)}"${sel && sel.id === q.id ? ' selected' : ''}>${esc(q.name)}${q.meter === 'any' || q.meter === tsKey() ? '' : ` (${q.meter})`}</option>`;
  const grp = (label, list) => list.length ? `<optgroup label="${esc(label)}">${list.map(opt).join('')}</optgroup>` : '';
  const fit = allPatterns().filter(patFits), other = allPatterns().filter(q => !patFits(q)), mine = LIB.patterns || [];
  return `<option value=""${sel ? '' : ' selected'}>Blank</option>` + grp('Strumming', fit.filter(q => q.kind === 'strum' && !mine.includes(q))) +
    grp('Fingerpicking', fit.filter(q => q.kind === 'pick' && !mine.includes(q))) + grp('Your patterns', mine) + grp('Other meters', other.filter(q => !mine.includes(q)));
}
// Load a pattern into the editor as the starting point (its steps, meter, subdivision and swing)
function loadTemplate(id){
  const t = id ? patternById(id) : null, nameEl = $('#patName'), cur = (nameEl.value || '').trim();
  const meter = t ? (t.meter === 'any' ? tsKey() : t.meter) : $('#patMeter').value, num = +meter.split('/')[0];
  const mSel = $('#patMeter');
  if (![...mSel.options].some(o => o.value === meter)) mSel.insertAdjacentHTML('beforeend', `<option>${meter}</option>`);
  mSel.value = meter;
  $('#patRes').value = String(t ? t.res : 2);
  const sw = t && t.swing ? t.swing : 0;
  $('#patSwing').value = String([0, 0.17, 0.33].reduce((a, b) => Math.abs(b - sw) < Math.abs(a - sw) ? b : a));
  $('#patSteps').value = t ? (t.meter === 'any' ? t.steps.repeat(num) : t.steps) : '';
  // a name that was only a placeholder follows the template
  if (!cur || cur === 'My pattern' || / \(my version\)$/.test(cur)) nameEl.value = t ? `${t.name} (my version)` : 'My pattern';
  drawPatGrid();
}
function readPatForm(){
  const p = ui.modal.pat;
  p.name = ($('#patName').value || '').trim() || 'My pattern';
  p.meter = $('#patMeter').value; p.res = +$('#patRes').value; p.swing = +$('#patSwing').value;
  const len = (+p.meter.split('/')[0]) * p.res;
  p.steps = ($('#patSteps').value || '').replace(/\s+/g, '').split('').filter(c => PAT_STEPS.includes(c)).join('').padEnd(len, '-').slice(0, len);
  p.kind = /[DdUuxcP]/.test(p.steps) ? 'strum' : 'pick';
  return p;
}
function drawPatGrid(){
  const p = readPatForm(), num = +p.meter.split('/')[0];
  const sub = p.res === 2 ? ['', '&'] : p.res === 3 ? ['', '&', 'a'] : p.res === 4 ? ['', 'e', '&', 'a'] : [''];
  $('#patSteps').value = patText(p);
  $('#patGrid').innerHTML = [...Array(num).keys()].map(b => `<div class="patbeat">${[...Array(p.res).keys()].map(j => { const i = b * p.res + j, c = p.steps[i]; return `<button type="button" class="patcell${c !== '-' ? ' on' : ''}" data-act="patCell" data-i="${i}"><small>${j ? sub[j] : b + 1}</small><b>${c === '-' ? '·' : esc(c)}</b></button>`; }).join('')}</div>`).join('');
}

Object.assign(ACT, {
  patHear: () => { const p = patternById(S.strum); if (p) patternPreview(p); else toast('Auto follows the meter: pick a pattern to hear it, or press Play.'); },
  patEdit: () => patternEditor(patternById(S.strum)),
  patCell: el => {
    const p = readPatForm(), i = +el.dataset.i, c = p.steps[i];
    const nx = PAT_CYCLE[(PAT_CYCLE.indexOf(c) + 1) % 7];   // the click cycles the common ones; type the rest
    p.steps = p.steps.slice(0, i) + nx + p.steps.slice(i + 1);
    $('#patSteps').value = p.steps; drawPatGrid();
  },
  patTry: () => patternPreview(readPatForm()),
  patSave: () => {
    const p = readPatForm();
    LIB.patterns = LIB.patterns || [];
    const now = nowISO();
    if (p.id){ const i = LIB.patterns.findIndex(x => x.id === p.id); if (i >= 0) LIB.patterns[i] = { ...p, updated: now }; }
    else { p.id = 'my-' + uid(); LIB.patterns.push({ ...p, created: now, updated: now }); }
    S.strum = p.id; S.style = 'rhythm';
    if (libSave()){ closeModal(); save(); renderTab(); toast(`Saved the pattern “${esc(p.name)}”.`); }
  },
  patDelete: () => {
    const p = ui.modal.pat, i = (LIB.patterns || []).findIndex(x => x.id === p.id);
    if (i < 0) return;
    const rec = LIB.patterns.splice(i, 1)[0];
    LIB.deleted[rec.id] = nowISO();
    if (S.strum === rec.id) S.strum = 'auto';
    libSave(); closeModal(); save(); renderTab();
    toast(`Deleted the pattern “${esc(rec.name)}”.`, { label: 'Undo', fn: () => { rec.updated = nowISO(); delete LIB.deleted[rec.id]; LIB.patterns.splice(i, 0, rec); libSave(); renderTab(); } });
  },
});
document.addEventListener('contextmenu', e => {
  const c = e.target.closest && e.target.closest('.patcell');
  if (!c) return;
  e.preventDefault();
  const p = readPatForm(), i = +c.dataset.i;
  p.steps = p.steps.slice(0, i) + '-' + p.steps.slice(i + 1);
  $('#patSteps').value = p.steps; drawPatGrid();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'strum' || t.id === 'songStrum'){
    if (t.value === '__new'){ t.value = S.strum; patternEditor(null); return; }
    S.strum = t.value; save(); renderTab();
  } else if (t.id === 'strumRestart'){ S.strumRestart = t.checked; save(); renderTab(); }
  else if (t.classList && t.classList.contains('pkRestart')){
    const p = partById(t.dataset.part); if (!p) return;
    if (t.value === '') delete p.strumRestart; else p.strumRestart = t.value === '1';
    save(); renderSong();
  } else if (t.classList && t.classList.contains('pkStrum')){
    const p = partById(t.dataset.part); if (!p) return;
    if (t.value === '__new'){ t.value = p.strum || ''; patternEditor(null); return; }
    p.strum = t.value || null; if (!p.strum) delete p.strum;
    save(); renderSong();
  } else if (t.id === 'patFrom') loadTemplate(t.value);
  else if (['patMeter', 'patRes', 'patSwing', 'patSteps'].includes(t.id)) drawPatGrid();
});
