'use strict';
/* =========================================================================
   Audio and MIDI input: a tuner (single note or all strings at once) and a
   chord recognizer using any audio input (built-in mic, or an interface such as a MOTU M2 or a
   Tascam 2x2, input 1, input 2 or both), and MIDI keyboard input.
   Browsers allow microphones and MIDI only on secure (https) pages.
   Loaded after app.js and before docs.js.
   ========================================================================= */
const TUNER = { stream: null, src: null, an: null, timer: 0, hist: [], open: false, marks: '[]', pos: null };
const MIDI_IN = { access: null, voices: new Map(), down: new Set(), chord: new Set(), deferred: new Set(), sustain: false, allUp: true, open: false, raf: 0 };
const ORDINAL = n => ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][n - 1] || n + 'th';

function secureNote(what){
  const host = location.hostname || 'your-server';
  return `${what} only works on a secure page. Open <b>https://${esc(host)}:8443</b> (your server's https address). The first time, the browser warns that the certificate is not trusted; choose <b>Advanced → Proceed</b> (Chrome/Edge) or <b>Accept the risk</b> (Firefox). It is your own server, so that is safe.`;
}

/* ---- Pitch detection: YIN on the most recent ~170 ms (decimated to half the sample rate), which handles
   notes from a 5-string bass's low B up to the top of a violin ---- */
function yin(x, sr, minF, maxF){
  const tauMin = Math.max(2, Math.floor(sr / maxF)), tauMax = Math.min(Math.floor(sr / minF), Math.floor(x.length / 2));
  const W = x.length - tauMax, d = new Float32Array(tauMax + 1);
  for (let tau = tauMin; tau <= tauMax; tau++){
    let s = 0;
    for (let i = 0; i < W; i++){ const v = x[i] - x[i + tau]; s += v * v; }
    d[tau] = s;
  }
  // cumulative mean normalized difference
  const c = new Float32Array(tauMax + 1);
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++){ run += tau >= tauMin ? d[tau] : 0; c[tau] = tau < tauMin ? 1 : d[tau] * (tau - tauMin + 1) / (run || 1); }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) if (c[t] < 0.15){ while (t + 1 <= tauMax && c[t + 1] < c[t]) t++; tau = t; break; }
  if (tau < 0){ let best = tauMin; for (let t = tauMin; t <= tauMax; t++) if (c[t] < c[best]) best = t; if (c[best] > 0.35) return null; tau = best; }
  let better = tau;
  if (tau > tauMin && tau < tauMax){ const a = d[tau - 1], b = d[tau], g = d[tau + 1], den = a - 2 * b + g; if (den) better = tau + 0.5 * (a - g) / den; }
  return { f: sr / better, clarity: 1 - c[tau] };
}
const midiOfF = f => 69 + 12 * Math.log2(f / S.tuner.ref);
const fOfMidi = m => S.tuner.ref * Math.pow(2, (m - 69) / 12);
const ANALYSIS = { time: null, spec: null, mag: null };
function readTime(){
  const an = TUNER.an, N = 8192;
  if (!ANALYSIS.time) ANALYSIS.time = new Float32Array(an.fftSize);
  an.getFloatTimeDomainData(ANALYSIS.time);
  const src = ANALYSIS.time.subarray(an.fftSize - N), half = new Float32Array(N / 2);
  let rms = 0;
  for (let i = 0; i < N / 2; i++){ const v = (src[2 * i] + src[2 * i + 1]) * 0.5; half[i] = v; rms += v * v; }
  return { x: half, sr: AU.ctx.sampleRate / 2, rms: Math.sqrt(rms / (N / 2)) };
}
function singleReading(){
  const { x, sr, rms } = readTime();
  // the open strings' notes in the current tuning, raised by the capo if one is on
  const tun = fretted() ? eff() : [];
  const lo = tun.length ? fOfMidi(Math.min(...tun)) * 0.7 : 26, hi = 1600;
  const r = rms > 0.004 ? yin(x, sr, Math.max(22, lo), hi) : null;
  if (!r || r.clarity < 0.8){ TUNER.hist = []; return { rms, none: true }; }
  const n = midiOfF(r.f);
  if (TUNER.hist.length && Math.abs(n - TUNER.hist[TUNER.hist.length - 1]) > 0.7) TUNER.hist = [];
  TUNER.hist.push(n);
  if (TUNER.hist.length > 5) TUNER.hist.shift();
  const sorted = TUNER.hist.slice().sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)];
  const m = Math.round(med), cents = (med - m) * 100;
  let str = null;
  if (tun.length){
    let best = 0;
    tun.forEach((t, i) => { if (Math.abs(med - t) < Math.abs(med - tun[best])) best = i; });
    str = { i: best, midi: tun[best], cents: (med - tun[best]) * 100 };
  }
  return { rms, midi: m, cents, f: fOfMidi(med), str };
}
/* All strings at once. Two overlapping 16k-sample FFTs taken 2048 samples apart: for each string, the strongest
   peak near its target (and near its 2nd–5th harmonics, skipping any that land on another string's note) gives
   an exact frequency from the phase advance between the two FFTs, far finer than one FFT bin. */
function fft(re, im){
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++){
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j){ let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1){
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
    for (let i = 0; i < n; i += len){
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++){
        const a = i + k, b2 = a + half, xr = re[b2] * cr - im[b2] * ci, xi = re[b2] * ci + im[b2] * cr;
        re[b2] = re[a] - xr; im[b2] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const POLY = { N: 16384, H: 2048, win: null, hist: [] };
function spectrum(src, off){
  const N = POLY.N, re = new Float32Array(N), im = new Float32Array(N);
  for (let i = 0; i < N; i++) re[i] = src[off + i] * POLY.win[i];
  fft(re, im);
  return { re, im };
}
// Two FFTs of the latest audio, 2048 samples apart: magnitudes, a noise floor, and exact peak frequencies from the phase advance
function twoSpectra(){
  const an = TUNER.an, sr = AU.ctx.sampleRate, N = POLY.N, H = POLY.H, binHz = sr / N;
  if (!ANALYSIS.time) ANALYSIS.time = new Float32Array(an.fftSize);
  an.getFloatTimeDomainData(ANALYSIS.time);
  if (!POLY.win){ POLY.win = new Float32Array(N); for (let i = 0; i < N; i++) POLY.win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)); }
  const L = ANALYSIS.time.length, A = spectrum(ANALYSIS.time, L - N - H), B = spectrum(ANALYSIS.time, L - N);
  const mag = k => Math.hypot(B.re[k], B.im[k]);
  let floor = 0, cnt = 0;
  for (let k = Math.ceil(40 / binHz); k < 2500 / binHz; k++){ floor += mag(k); cnt++; }
  floor /= Math.max(1, cnt);
  const instF = k => {
    const p1 = Math.atan2(A.im[k], A.re[k]), p2 = Math.atan2(B.im[k], B.re[k]);
    let dev = p2 - p1 - 2 * Math.PI * k * H / N;
    dev -= 2 * Math.PI * Math.round(dev / (2 * Math.PI));
    return (k + dev * N / (2 * Math.PI * H)) * binHz;
  };
  return { binHz, mag, floor, instF };
}
function polyReading(){
  const { binHz, mag, floor, instF } = twoSpectra();
  const tun = eff();
  return tun.map((t, i) => {
    const f0 = fOfMidi(t);
    const hs = [0, 1, 2, 3, 4].filter(h => h === 0 || !tun.some((u, j) => j !== i && [0, 12].some(o => Math.abs(t + 12 * Math.log2(h + 1) - (u + o)) < 0.6)));
    let wsum = 0, csum = 0, fundamental = 0;
    hs.forEach(h => {
      const fc = f0 * (h + 1), k0 = Math.floor(fc * Math.pow(2, -0.6 / 12) / binHz), k1 = Math.ceil(fc * Math.pow(2, 0.6 / 12) / binHz);
      let kp = -1, mp = 0;
      for (let k = Math.max(1, k0); k <= k1; k++){ const m = mag(k); if (m > mp){ mp = m; kp = k; } }
      if (kp < 0 || mp < floor * 6) return;
      const cents = 1200 * Math.log2(instF(kp) / fc);
      if (Math.abs(cents) > 60) return;
      if (h === 0) fundamental = mp;
      wsum += mp; csum += mp * cents;
    });
    const heard = wsum > floor * 12 && (fundamental > 0 || hs.length > 1);
    // Median of this string's last 5 readings, so one odd frame doesn't make the bar jump
    const hist = POLY.hist[i] = heard ? (POLY.hist[i] || []).concat(csum / wsum).slice(-5) : [];
    const med = hist.slice().sort((a, b) => a - b)[Math.floor(hist.length / 2)];
    return { i, midi: t, cents: heard ? med : 0, heard };
  });
}

/* Chord recognition. Every spectral peak gets an exact frequency (from the phase advance). Working up from the lowest note, a note counts when its own peak is clear of the noise and it has an
   overtone; its harmonics' peaks are then removed, so a low string's overtones aren't heard as extra notes.
   Readings from the last second vote, so one odd frame doesn't change the chord and strings that fade first
   still count. */
const CHORD = { hist: [], shown: null, cand: null, same: 0, rmsAvg: 0, quiet: 0, skip: 0, added: false, frets: null };
function chordReading(){
  const { binHz, mag, instF } = twoSpectra();
  // the noise floor as a median, so a rich chord's own peaks don't raise it
  const ms = [];
  for (let k = Math.ceil(40 / binHz); k < 2500 / binHz; k++) ms.push(mag(k));
  ms.sort((a, b) => a - b);
  const floor = ms[Math.floor(ms.length / 2)] || 1e-9, peaks = [];
  for (let k = Math.ceil(30 / binHz), k1 = Math.floor(5000 / binHz); k < k1; k++){
    const m = mag(k);
    if (m > floor * 5 && m > mag(k - 1) && m >= mag(k + 1)) peaks.push({ f: instF(k), a: m });
  }
  const et = fretted() ? eff() : [];
  const lo = et.length ? Math.min(...et) : kind() === 'bass' ? 28 : 36;
  const hi = et.length ? Math.min(90, Math.max(...et) + 15) : 88;
  const near = (f, c) => { let best = -1; peaks.forEach((p, i) => { if (Math.abs(1200 * Math.log2(p.f / f)) < c && (best < 0 || p.a > peaks[best].a)) best = i; }); return best; };
  const harm = {};
  for (let m = lo; m <= hi; m++){ const f0 = fOfMidi(m); harm[m] = []; for (let h = 1; h <= 10 && f0 * h < 5000; h++) harm[m].push(near(f0 * h, h === 1 ? 30 : 40)); }
  const R = peaks.map(p => p.a), picked = [], top = Math.max(0, ...R), most = fretted() ? et.length : 8;
  // lowest note first, so each string claims its own overtones before a higher note can be mistaken for one
  for (let m = lo; m <= hi && picked.length < most; m++){
    const hs = harm[m], a = hs.map(i => i < 0 ? 0 : R[i]);
    // an overtone must sound too (even if a lower note shares it), which rules out lone noise spikes
    if (!(a[0] > floor * 8 && a[0] > top * 0.06) || !hs.slice(1).some(i => i >= 0 && peaks[i].a > floor * 4)) continue;
    picked.push(m);
    hs.forEach((i, h) => { if (h && i >= 0) R[i] = 0; });
  }
  return picked.sort((a, b) => a - b);
}
// A playable fingering (frets above the capo, null = muted) that sounds every note heard, with the same bass note,
// plus octaves of them: many strings, few fingers (a barre counts as one), low on the neck, no muted strings in the
// middle
function fitShape(midis){
  const et = eff(), n = et.length, pcs = new Set(midis.map(m => mod(m))), low = midis[0];
  if (n > 6) return null;
  let best = null;
  const cur = new Array(n);
  for (let p = 1; p <= 12; p++){
    const opts = et.map(t => [null, 0, p, p + 1, p + 2, p + 3].filter(r => r === null || (r <= maxRel() && pcs.has(mod(t + r)) && t + r >= low)));
    const go = s => {
      if (s < n){ for (const r of opts[s]){ cur[s] = r; go(s + 1); } return; }
      const notes = cur.map((r, i) => r === null ? null : et[i] + r).filter(x => x !== null);
      if (notes.length < 3 || Math.min(...notes) !== low || !midis.every(m => notes.includes(m))) return;
      const on = cur.map(r => r !== null), inner = on.slice(on.indexOf(true), on.lastIndexOf(true) + 1).filter(x => !x).length;
      const fr = cur.filter(r => r !== null && r > 0), bar = fr.length ? Math.min(...fr) : 0;
      const fingers = (fr.length ? 1 : 0) + fr.filter(r => r > bar).length;
      if (fingers > 4) return;
      // high up the neck a full barre is more likely than one mixed with open strings
      const opens = bar > 4 ? cur.filter(r => r === 0).length : 0;
      const score = Math.max(0, ...fr) * 0.3 - notes.length * 0.5 + fingers * 0.4 + inner * 3 + opens * 0.1;
      if (!best || score < best.score) best = { score, frets: cur.slice() };
    };
    go(0);
  }
  return best && best.frets;
}
// Where on the neck these exact notes are most likely played: each on its own string, within one hand position,
// near the last position heard (else as low as possible). Frets above the capo, null = muted
function placeNotes(midis, near){
  const et = eff(), n = et.length, top = maxRel(), cur = new Array(n).fill(null);
  let best = null;
  const go = k => {
    if (k === midis.length){
      const fr = cur.filter(r => r !== null && r > 0);
      if (fr.length && Math.max(...fr) - Math.min(...fr) > 3) return;
      // open strings can be reached from any position
      const at = fr.length ? Math.min(...fr) : 0;
      const score = fr.length ? (near == null ? at : Math.abs(at - near)) + Math.max(...fr) * 0.1 : 0.5;
      if (!best || score < best.score) best = { score, frets: cur.slice() };
      return;
    }
    for (let s = 0; s < n; s++){
      const r = midis[k] - et[s];
      if (cur[s] !== null || r < 0 || r > top) continue;
      cur[s] = r; go(k + 1); cur[s] = null;
    }
  };
  go(0);
  return best && best.frets;
}
function chordFrame(rms){
  const on = rms > 0.004;
  // a new strum: much louder than the recent level
  if (on && rms > 0.012 && rms > CHORD.rmsAvg * 1.8){ CHORD.hist = []; CHORD.skip = 3; CHORD.added = false; CHORD.fresh = true; }
  CHORD.rmsAvg = CHORD.rmsAvg * 0.8 + rms * 0.2;
  if (!on){
    CHORD.hist = [];
    if (++CHORD.quiet > 28 && S.tuner.chordKeep === false && CHORD.shown) heardShow(null, true);
    return;
  }
  CHORD.quiet = 0;
  if (CHORD.skip > 0){ CHORD.skip--; return; }
  CHORD.hist = CHORD.hist.concat([chordReading()]).slice(-12);
  const need = Math.max(2, Math.ceil(CHORD.hist.length * 0.45)), count = {};
  CHORD.hist.forEach(r => r.forEach(m => { count[m] = (count[m] || 0) + 1; }));
  const vote = Object.keys(count).map(Number).filter(m => count[m] >= need).sort((a, b) => a - b);
  if (CHORD.hist.length < 3 || !vote.length) return;
  const key = vote.join(',');
  CHORD.same = key === CHORD.cand ? CHORD.same + 1 : 0; CHORD.cand = key;
  if (CHORD.same < 1 || (CHORD.shown && key === CHORD.shown.join(','))) return;
  // as a chord fades its quieter strings drop out: keep showing the whole chord until the next strum
  if (CHORD.shown && !CHORD.fresh && vote.every(m => CHORD.shown.some(x => mod(x) === mod(m)))) return;
  CHORD.fresh = false;
  heardShow(vote);
  if (S.tuner.chordStep && !CHORD.added && new Set(vote.map(m => mod(m))).size >= 3 && identify(vote)[0]){ CHORD.added = true; ACT.chordAdd(); }
}
// Show what was heard. On a fretted instrument it goes on the neck as the fingering (shape) it fits, in the current
// tuning and capo, so the readout names it and + Add / Replace use it; it is not played back, which the microphone
// would hear. Notes that fit no fingering (and any notes on piano) show like notes held on a MIDI keyboard.
function heardShow(midis, clearNeck){
  CHORD.shown = midis;
  CHORD.frets = midis && fretted() ? (midis.length >= 3 && fitShape(midis)) || placeNotes(midis, CHORD.pos) : null;
  if (CHORD.frets){
    S.shape[S.inst] = CHORD.frets.slice();
    const fr = CHORD.frets.filter(r => r !== null && r > 0);
    CHORD.pos = fr.length ? Math.min(...fr) : 0;
    if (ui.heardAudio) ui.midiHeld = null;
    ui.heardAudio = false;
  } else if (midis){ ui.midiHeld = new Set(midis); ui.heardAudio = true; }
  else {
    if (ui.heardAudio) ui.midiHeld = null;
    ui.heardAudio = false;
    if (clearNeck && fretted()) S.shape[S.inst] = shape().map(() => null);
  }
  renderInstrument();
}
function chordBoxHTML(){
  const m = CHORD.shown;
  if (!m) return '<div class="tn-chord idle"><div class="tn-note">–</div><span>Strum a chord (or play a note) and let it ring.</span></div>';
  const ids = identify(m), ch = ids[0], fr = CHORD.frets;
  const big = ch ? esc(ch.symbol) : m.length === 1 ? `${nameFor(m[0])}<sub>${Math.floor(m[0] / 12) - 1}</sub>` : m.map(x => midiName(x)).join(' ');
  return `<div class="tn-chord"><div class="tn-note">${big}</div><div class="tn-read">
    <span>${m.map(x => midiName(x)).join(' ')}</span>
    ${ids.length > 1 ? `<span class="muted">or ${ids.slice(1, 3).map(c => esc(c.symbol)).join(', ')}</span>` : ''}
    ${fr ? `<span class="muted">On the neck: <b class="mono">${fr.map(r => r === null ? 'x' : r).join(fr.some(r => r > 9) ? '-' : '')}</b>${capo() ? ` (capo ${capo()})` : ''}</span>` : ''}</div>
    <button class="btn" data-act="chordAdd"${ch ? '' : ' disabled'}>+ Add<span class="long">to progression</span></button></div>`;
}

/* ---- Tuner drawer ---- */
const tuneClass = c => Math.abs(c) <= 3 ? 'in' : Math.abs(c) <= 12 ? 'near' : 'off';
function renderTunerBox(){
  const box = $('#tunerBox');
  box.hidden = !TUNER.open;
  if (!TUNER.open) return;
  const poly = S.tuner.mode === 'poly' && fretted(), chord = S.tuner.mode === 'chord';
  box.innerHTML = `<div class="drawer-h"><b>Tuner</b><span class="muted" id="tnStatus">${TUNER.stream ? 'Listening' : 'Not listening'}</span><button class="mx" data-act="tunerToggle" aria-label="Close the tuner">×</button></div>
    ${!window.isSecureContext ? `<p class="hint">${secureNote('The tuner')}</p>` : ''}
    <div class="drawer-row">
      <label class="fld"><span>Input</span><select id="tnDev"><option value="">Default input</option></select></label>
      <label class="fld"><span>Channel</span><select id="tnCh"><option value="both"${S.tuner.ch === 'both' ? ' selected' : ''}>Both</option><option value="l"${S.tuner.ch === 'l' ? ' selected' : ''}>Input 1 (left)</option><option value="r"${S.tuner.ch === 'r' ? ' selected' : ''}>Input 2 (right)</option></select></label>
      <div class="fld"><span>Mode</span><div class="seg" id="tnMode"><button data-v="single" aria-pressed="${!poly && !chord}">Single note</button><button data-v="poly" aria-pressed="${poly}"${fretted() ? '' : ' disabled'}>All strings</button><button data-v="chord" aria-pressed="${chord}">Chord</button></div></div>
      <label class="fld"><span>A4 =</span><input type="number" id="tnRef" min="430" max="450" step="0.5" value="${S.tuner.ref}"></label>
      <button class="btn ${TUNER.stream ? '' : 'primary'}" data-act="tunerListen">${TUNER.stream ? 'Stop' : 'Start listening'}</button>
      <div class="lvl" title="Input level"><i id="tnLvl"></i></div>
    </div>
    ${chord ? `<div class="drawer-row"><label class="chk"><input type="checkbox" id="tnKeep"${S.tuner.chordKeep !== false ? ' checked' : ''}> Keep showing the last chord</label><label class="chk"><input type="checkbox" id="tnStep"${S.tuner.chordStep ? ' checked' : ''}> Add each chord I strum to the progression</label></div>` : ''}
    <div id="tnOut" class="tn-out">${chord ? chordBoxHTML() : poly ? '' : '<div class="tn-note">–</div>'}</div>
    <p class="hint">${chord ? `Strum a chord or play a note and let it ring; it goes on the neck as the fingering it fits in your tuning${capo() ? ' (with the capo)' : ''}. Works best with a clean sound (no heavy distortion).` : poly ? `Strum all the open strings and let them ring; each string shows how far it is from its target in the current tuning${capo() ? `, with the capo on fret ${capo()}` : ''}.` : `Play one note at a time; the neck rings the string it hears (in your current tuning${capo() ? ', with the capo' : ''}). In tune within ±3 cents shows green.`} Audio interfaces (MOTU, Tascam, Focusrite…) appear in the Input list once listening; choose the channel your instrument is plugged into.</p>`;
  fillDevices();
}
async function fillDevices(){
  const sel = $('#tnDev');
  if (!sel || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  try {
    const devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput' && d.deviceId !== 'default');
    sel.innerHTML = '<option value="">Default input</option>' + devs.map((d, i) => `<option value="${esc(d.deviceId)}"${d.deviceId === S.tuner.dev ? ' selected' : ''}>${esc(d.label || `Input ${i + 1}`)}</option>`).join('');
  } catch (e) {}
}
async function tunerListen(){
  if (TUNER.stream){ tunerStop(); renderTunerBox(); return; }
  if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('The tuner needs the https address of your server.'); return; }
  const ctx = ac();
  try {
    TUNER.stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: S.tuner.dev ? { exact: S.tuner.dev } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 2 } } });
  } catch (e) {
    const why = e.name === 'NotAllowedError' ? 'Microphone access was blocked. Allow it in the browser (the icon at the left of the address bar). In the claude.ai preview the microphone is not available; use your server.' :
      e.name === 'NotFoundError' ? 'No audio input was found. Plug in a microphone or interface.' :
      e.name === 'OverconstrainedError' ? 'That input is not connected any more; choose another.' : 'Could not open the audio input: ' + e.message;
    if (e.name === 'OverconstrainedError') S.tuner.dev = '';
    toast(esc(why)); renderTunerBox(); return;
  }
  TUNER.src = ctx.createMediaStreamSource(TUNER.stream);
  const split = ctx.createChannelSplitter(2), mix = ctx.createGain();
  TUNER.src.connect(split);
  if (S.tuner.ch !== 'r') split.connect(mix, 0);
  if (S.tuner.ch !== 'l') split.connect(mix, 1);
  TUNER.an = ctx.createAnalyser(); TUNER.an.fftSize = 32768; TUNER.an.smoothingTimeConstant = 0.2;
  mix.connect(TUNER.an);
  TUNER.mix = mix; TUNER.split = split; TUNER.hist = []; POLY.hist = [];
  ANALYSIS.time = ANALYSIS.spec = null;
  renderTunerBox();
  TUNER.timer = setInterval(tunerFrame, 70);
}
function tunerMarks(list){
  const key = JSON.stringify(list);
  if (key === TUNER.marks) return;
  TUNER.marks = key; ui.tunerMarks = list;
  renderNeck();
}
function tunerStop(){
  clearInterval(TUNER.timer);
  if (TUNER.stream) TUNER.stream.getTracks().forEach(t => t.stop());
  try { TUNER.src && TUNER.src.disconnect(); TUNER.mix && TUNER.mix.disconnect(); } catch (e) {}
  TUNER.stream = TUNER.src = TUNER.an = null;
  CHORD.hist = []; CHORD.cand = null;
  if (CHORD.shown) heardShow(null);
  tunerMarks([]);
}
function tunerFrame(){
  const out = $('#tnOut');
  if (!out || !TUNER.an){ tunerStop(); return; }
  const lvl = $('#tnLvl');
  if (S.tuner.mode === 'chord'){
    const { rms } = readTime();
    if (lvl) lvl.style.width = Math.min(100, Math.max(0, (20 * Math.log10(rms + 1e-9) + 60) * 1.8)) + '%';
    const before = CHORD.shown;
    chordFrame(rms);
    if (CHORD.shown !== before) out.innerHTML = chordBoxHTML();
    return;
  }
  if (S.tuner.mode === 'poly' && fretted()){
    const { rms } = readTime();
    if (lvl) lvl.style.width = Math.min(100, Math.max(0, (20 * Math.log10(rms + 1e-9) + 60) * 1.8)) + '%';
    const rows = polyReading(), n = rows.length;
    tunerMarks(rows.filter(r => r.heard).map(r => ({ s: r.i, r: 0, cls: tuneClass(r.cents) })));
    out.innerHTML = rows.slice().reverse().map(r => `<div class="pt-row ${r.heard ? tuneClass(r.cents) : 'quiet'}"><span class="pt-name">${ORDINAL(n - r.i)} · ${midiName(r.midi)}</span><div class="pt-bar"><b></b>${r.heard ? `<i style="left:${50 + r.cents * 50 / 60}%"></i>` : ''}</div><span class="pt-c">${r.heard ? (Math.abs(r.cents) <= 3 ? 'in tune' : `${r.cents > 0 ? '+' : ''}${r.cents.toFixed(0)}¢ ${r.cents > 0 ? 'sharp' : 'flat'}`) : '—'}</span></div>`).join('');
    return;
  }
  const r = singleReading();
  if (lvl) lvl.style.width = Math.min(100, Math.max(0, (20 * Math.log10(r.rms + 1e-9) + 60) * 1.8)) + '%';
  if (r.none){ out.classList.add('idle'); return; }
  out.classList.remove('idle');
  if (fretted()){
    // ring the open string being tuned, or where a fretted note most likely is
    if (r.str && Math.abs(r.str.cents) <= 50) tunerMarks([{ s: r.str.i, r: 0, cls: tuneClass(r.str.cents) }]);
    else {
      const fr = placeNotes([r.midi], TUNER.pos), s = fr ? fr.findIndex(x => x !== null) : -1;
      if (s >= 0){ TUNER.pos = fr[s]; tunerMarks([{ s, r: fr[s], cls: tuneClass(r.cents) }]); }
    }
  }
  const c = r.cents, name = nameFor(r.midi), oct = Math.floor(r.midi / 12) - 1;
  const strTxt = r.str ? (Math.abs(r.str.cents) <= 50 ? `${ORDINAL(tuning().length - r.str.i)} string (${midiName(r.str.midi)}): ${Math.abs(r.str.cents) <= 3 ? 'in tune' : `${Math.abs(r.str.cents).toFixed(0)}¢ ${r.str.cents > 0 ? 'sharp, tune down' : 'flat, tune up'}`}` : `Closest string: ${ORDINAL(tuning().length - r.str.i)} (${midiName(r.str.midi)}), ${Math.abs(r.str.cents / 100).toFixed(1)} semitones ${r.str.cents > 0 ? 'above' : 'below'}`) : '';
  out.innerHTML = `<div class="tn-main ${tuneClass(c)}"><div class="tn-note">${name}<sub>${oct}</sub></div><div class="tn-read"><b>${c > 0 ? '+' : ''}${c.toFixed(1)}¢</b> ${Math.abs(c) <= 3 ? 'in tune' : c > 0 ? 'sharp' : 'flat'}<span>${r.f.toFixed(2)} Hz</span></div></div>
    <div class="tn-meter ${tuneClass(c)}"><span>−50</span><span>0</span><span>+50</span><b></b><i style="left:${50 + Math.max(-50, Math.min(50, c))}%"></i></div>
    ${strTxt ? `<div class="tn-str">${strTxt}</div>` : ''}`;
}

/* ---- MIDI keyboard ---- */
function renderMidiBox(){
  const box = $('#midiBox');
  box.hidden = !MIDI_IN.open;
  if (!MIDI_IN.open) return;
  const ins = MIDI_IN.access ? [...MIDI_IN.access.inputs.values()] : [];
  const status = !navigator.requestMIDIAccess ? 'This browser has no MIDI support (Chrome, Edge, Opera and Firefox do; Safari does not).' : !MIDI_IN.access ? 'Not connected' : ins.length ? `${ins.length} device${ins.length > 1 ? 's' : ''} found` : 'No MIDI devices found. Plug one in; it appears here automatically.';
  box.innerHTML = `<div class="drawer-h"><b>MIDI keyboard</b><span class="muted">${esc(status)}</span><button class="mx" data-act="midiToggle" aria-label="Close MIDI keyboard input">×</button></div>
    ${!window.isSecureContext ? `<p class="hint">${secureNote('MIDI keyboard input')}</p>` : MIDI_IN.err ? midiHelpHTML(MIDI_IN.err) : ''}
    <div class="drawer-row">
      <label class="fld"><span>Device</span><select id="midiDev"><option value="">All MIDI inputs</option>${ins.map(i => `<option value="${esc(i.id)}"${S.midiIn.dev === i.id ? ' selected' : ''}>${esc(i.name || 'MIDI input')}</option>`).join('')}</select></label>
      <label class="chk" title="When you release a chord, it is added at the end of the progression"><input type="checkbox" id="midiStep"${S.midiIn.step ? ' checked' : ''}> Add each chord I play to the progression</label>
      <button class="btn sm" data-act="midiAdd">+ Add the last chord</button>
      <button class="btn sm" data-act="midiClear">Clear</button>
    </div>
    <p class="hint">Plays with the current instrument's sound (${esc(soundFor(kind()).name)}). The sustain pedal works. The chord you hold is named above and shown on the keyboard.</p>`;
}
async function midiOpen(){
  if (!navigator.requestMIDIAccess){ renderMidiBox(); return; }
  MIDI_IN.err = null;
  try { MIDI_IN.access = await navigator.requestMIDIAccess(); }
  catch (e) { MIDI_IN.err = e; renderMidiBox(); return; }
  MIDI_IN.access.onstatechange = () => { midiAttach(); renderMidiBox(); };
  midiAttach(); renderMidiBox();
}
// Why the browser refused MIDI, and how to allow it in this browser
function midiHelpHTML(e){
  const ua = navigator.userAgent, framed = (() => { try { return window.self !== window.top; } catch (x) { return true; } })();
  const brave = !!(navigator.brave), edge = /Edg\//.test(ua), ff = /Firefox\//.test(ua), chrome = /Chrome\//.test(ua) && !edge;
  const steps = framed ? 'This page is inside a preview frame (such as the claude.ai preview), which does not allow MIDI. Open Harmony Bench at your server\'s https address instead.'
    : brave ? 'Brave turns Web MIDI off by default. Click the lion (Shields) or the icon left of the address, open <b>Site settings</b>, set <b>MIDI device control</b> (and <b>MIDI devices</b>) to <b>Allow</b>, reload the page, then click <b>Try again</b>.'
    : ff ? 'Firefox only allows MIDI through a <b>site permission add-on</b>, and does not offer it for every address (such as an IP address). Allow it directly instead: press <b>Ctrl+I</b> (Page Info; on a Mac <b>Cmd+I</b>), open <b>Permissions</b>, find <b>Access MIDI devices</b>, untick <b>Use Default</b> and choose <b>Allow</b>. Reload the page, then click <b>Try again</b>. (Alternative: in <span class="mono">about:config</span> set <span class="mono">dom.webmidi.gated</span> to <b>false</b>.)'
    : (chrome || edge) ? `Click the icon left of the address (${edge ? 'the lock' : 'the tune / lock icon'}), open <b>Site settings</b>, and set <b>MIDI device control &amp; reprogram</b> (and <b>MIDI devices</b>, if listed) to <b>Allow</b>. If the browser asked earlier and it was dismissed or blocked, it stays blocked until you change it there. Reload the page, then click <b>Try again</b>.`
    : 'Allow MIDI for this site in the browser\'s site settings, reload, then click Try again.';
  return `<div class="banner"><span><b>The browser refused MIDI access</b> <span class="muted mono">(${esc(e && e.name || 'error')}${e && e.message ? ': ' + esc(e.message) : ''})</span><br>${steps}</span><button class="btn sm primary" data-act="midiRetry">Try again</button></div>`;
}
function midiAttach(){
  if (!MIDI_IN.access) return;
  MIDI_IN.access.inputs.forEach(inp => { inp.onmidimessage = MIDI_IN.open && (!S.midiIn.dev || inp.id === S.midiIn.dev) ? onMidi : null; });
}
function onMidi(ev){
  const [st, d1, d2] = ev.data, cmd = st & 0xf0;
  if (cmd === 0x90 && d2 > 0) midiNoteOn(d1, d2 / 127);
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) midiNoteOff(d1);
  else if (cmd === 0xb0 && d1 === 64) midiPedal(d2 >= 64);
}
const midiSound = () => kind() === 'piano' ? 'piano' : kind();
function midiNoteOn(m, v){
  ac();
  if (MIDI_IN.allUp){ MIDI_IN.chord.clear(); MIDI_IN.allUp = false; }
  const old = MIDI_IN.voices.get(m);
  if (old) releaseVoice(old, AU.ctx.currentTime, 0.04);
  MIDI_IN.voices.set(m, playNote(midiSound(), m, null, { vel: 0.3 + 0.7 * v, hold: true }));
  MIDI_IN.down.add(m); MIDI_IN.chord.add(m); MIDI_IN.deferred.delete(m);
  midiShow();
}
function midiRelease(m){ const v = MIDI_IN.voices.get(m); if (v && AU.ctx) releaseVoice(v, AU.ctx.currentTime, kind() === 'bowed' ? 0.1 : 0.12); MIDI_IN.voices.delete(m); }
function midiNoteOff(m){
  MIDI_IN.down.delete(m);
  if (MIDI_IN.sustain) MIDI_IN.deferred.add(m); else midiRelease(m);
  if (!MIDI_IN.down.size){
    MIDI_IN.allUp = true;
    if (S.midiIn.step && new Set([...MIDI_IN.chord].map(x => mod(x))).size >= 3){ const ch = identify([...MIDI_IN.chord])[0]; if (ch) addToProg(ch); }
  }
  midiShow();
}
function midiPedal(on){
  MIDI_IN.sustain = on;
  if (!on){ MIDI_IN.deferred.forEach(midiRelease); MIDI_IN.deferred.clear(); }
}
// the chord being played stays on display until the next one starts
function midiShow(){
  ui.midiHeld = new Set(MIDI_IN.chord);
  ui.heardAudio = false;
  if (MIDI_IN.raf) return;
  MIDI_IN.raf = requestAnimationFrame(() => { MIDI_IN.raf = 0; renderInstrument(); });
}

Object.assign(ACT, {
  tunerToggle: () => { TUNER.open = !TUNER.open; if (!TUNER.open) tunerStop(); renderTunerBox(); renderTools(); },
  tunerListen: () => tunerListen(),
  midiToggle: () => {
    MIDI_IN.open = !MIDI_IN.open;
    if (MIDI_IN.open){ if (!MIDI_IN.access) midiOpen(); else midiAttach(); }
    else { midiAttach(); MIDI_IN.voices.forEach((v, m) => midiRelease(m)); ui.midiHeld = null; renderInstrument(); }
    renderMidiBox(); renderTools();
  },
  midiRetry: () => midiOpen(),
  midiAdd: () => { const ch = identify([...(ui.midiHeld || [])])[0]; if (ch) addToProg(ch); else toast('Play a chord of three or more notes first.'); },
  chordAdd: () => {
    const ch = CHORD.shown && identify(CHORD.shown)[0];
    if (!ch){ toast('Strum a chord of three or more notes first.'); return; }
    addToProg(ch);
    if (CHORD.frets) lockVoice(prog[ui.selSlot], { frets: CHORD.frets });
    save();
    if (S.tab === 'prog') renderProg();
  },
  midiClear: () => { MIDI_IN.chord.clear(); ui.midiHeld = null; renderInstrument(); },
});
document.addEventListener('click', e => {
  const b = e.target.closest('#tnMode button');
  if (!b || b.disabled) return;
  S.tuner.mode = b.dataset.v; save(); TUNER.hist = []; POLY.hist = []; CHORD.hist = [];
  if (CHORD.shown) heardShow(null);
  tunerMarks([]);
  renderTunerBox();
}, true);
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'tnKeep'){ S.tuner.chordKeep = t.checked; save(); }
  else if (t.id === 'tnStep'){ S.tuner.chordStep = t.checked; save(); }
  else if (t.id === 'tnDev'){ S.tuner.dev = t.value; save(); if (TUNER.stream){ tunerStop(); tunerListen(); } }
  else if (t.id === 'tnCh'){ S.tuner.ch = t.value; save(); if (TUNER.stream){ tunerStop(); tunerListen(); } }
  else if (t.id === 'tnRef'){ S.tuner.ref = clamp(+t.value || 440, 430, 450); save(); }
  else if (t.id === 'midiDev'){ S.midiIn.dev = t.value; save(); midiAttach(); }
  else if (t.id === 'midiStep'){ S.midiIn.step = t.checked; save(); }
});
