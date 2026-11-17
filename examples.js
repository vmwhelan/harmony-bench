'use strict';
/* ================= Song examples: "Songs that break the rules (well)" =================
   Short passages from well-known songs that show a chord from outside the key, a key change or a chromatic line,
   with notes on why each works where it is. Chords and analysis only: no lyrics.
   Every chart was checked against at least two published sources (chord sheets and analyses such as Alan W.
   Pollack's "Notes on" series); passages the sources disagreed on were left out. Charts are simplified (no
   riffs, inversions only where they matter) and bar lengths are approximate; all are in 4/4 as written here.
   A section's chart uses the app's chord text ("| C | G Am |", % repeats the bar). `look` lists the chords the
   notes talk about, with the label the analysis should give them (checked by the tests).
   Loaded after learn.js and before docs.js. */

const EXAMPLES = [
  { id: 'eight-days', song: 'Eight Days a Week', artist: 'The Beatles', year: 1964, key: { pc: 2, scale: 'major' }, tags: ['Secondary dominant'],
    sections: [
      { name: 'Verse', chart: '| D | E | G | D |\n| D | E | G | D |\n| Bm | G | Bm | E |\n| D | E | G | D |', look: [[1, 'V/V']],
        notes: 'The E major chord is II in D: a secondary dominant (V of V, with a G♯ that is not in the key). It sets up A, but the song goes to G (IV) instead, so the G♯ falls straight to G natural. That clash between neighbouring chords (a "cross relation") is the song\'s sound: bright and a little cheeky.' },
      { name: 'Bridge', chart: '| A | % | Bm | % |\n| E | % | G | A |', look: [[2, 'V/V']],
        notes: 'The bridge leans on the dominant (A) and brings the same E back, again turning to G before landing on A. Placing a borrowed lift (E) right before a plain chord makes the plain chord sound fresh.' },
    ],
    takeaway: 'A secondary dominant doesn\'t have to resolve where it points. II → IV (instead of II → V) gives a lift without the formality of a cadence; it is all over 1960s pop.' },

  { id: 'help', song: 'Help!', artist: 'The Beatles', year: 1965, key: { pc: 9, scale: 'major' }, tags: ['♭VII (borrowed)'],
    sections: [
      { name: 'Verse', chart: '| A | % | C#m | % |\n| F#m | % | D G | A |', look: [[4, '♭VII']],
        notes: 'The verse moves slowly through I, iii and vi (two bars each), then speeds up: D → G → A in quick succession. G is ♭VII, borrowed from A Mixolydian/minor, and it walks up a whole step to A: the classic rock way home, softer than V → I.' },
    ],
    takeaway: 'Speeding up the chord changes at the end of a phrase, and approaching I from ♭VII, makes a phrase ending feel urgent without using V.' },

  { id: 'yesterday', song: 'Yesterday', artist: 'The Beatles', year: 1965, key: { pc: 5, scale: 'major' }, tags: ['Secondary ii–V', 'Secondary dominant'],
    sections: [
      { name: 'Verse', chart: '| F | Em7 A7 | Dm Dm/C | Bb C7 | F |', look: [[1, 'ii7/vi'], [2, 'V7/vi']],
        notes: 'Right after the tonic, Em7 → A7 is a ii–V into D minor (vi): the A7 brings a C♯, a leading tone into D. For a moment the song sounds like it is in D minor; then the bass walks down (D, C, B♭) and B♭ → C7 → F brings it home.' },
    ],
    takeaway: 'A ii–V into vi early in a phrase gives an instant shadow of sadness, and a stepwise bass line makes the way back home feel natural.' },

  { id: 'in-my-life', song: 'In My Life', artist: 'The Beatles', year: 1965, key: { pc: 9, scale: 'major' }, tags: ['Secondary dominant', 'Borrowed iv'],
    sections: [
      { name: 'Verse', chart: '| A | E | F#m | A7 |\n| D | Dm | A | % |', look: [[3, 'V7/IV'], [5, 'iv']],
        notes: 'A7 turns the home chord into a dominant pointing at D (V7 of IV). Then D becomes D minor (iv, borrowed from A minor): its F sinks a half step to E in the A chord. Writers call IV → iv → I the "Beatles cadence"; it is tender and nostalgic.' },
    ],
    takeaway: 'Two small colors: I7 to lean into IV, and iv right after IV to soften the return home. Both work at the end of a phrase.' },

  { id: 'something', song: 'Something', artist: 'The Beatles', year: 1969, key: { pc: 0, scale: 'major' }, tags: ['Chromatic line', 'Secondary dominant', 'Modulation'],
    sections: [
      { name: 'Verse', chart: '| C | Cmaj7 | C7 | F C/E |\n| D7 | G |', look: [[2, 'V7/IV'], [5, 'V7/V']],
        notes: 'Over a held C chord, one voice slides down C → B → B♭ → A (C, Cmaj7, C7, F): a chromatic line. C7 is the V7 of F, so it resolves there; D7 is the V7 of G (V of V) and resolves to it.' },
      { name: 'Bridge', key: { pc: 9, scale: 'major' }, chart: '| A C#m/G# | F#m A/E | D G | A |\n| A C#m/G# | F#m A/E | D G | C |', look: [[4, 'IV'], [5, '♭VII'], [13, '♭III']],
        notes: 'The bridge jumps to A major (the major key of vi), abruptly, with no pivot. The bass walks down A → G♯ → F♯ → E. G (♭VII in A) leads back to A, and the final C (♭III in A) is the old home key, which takes the song straight back into the verse.' },
    ],
    takeaway: 'A bridge in a new key gives contrast; ending the bridge on the old tonic is the simplest way back. A slow chromatic line inside one chord adds motion without changing the harmony.' },

  { id: 'hey-jude', song: 'Hey Jude', artist: 'The Beatles', year: 1968, key: { pc: 5, scale: 'major' }, tags: ['♭VII (borrowed)'],
    sections: [
      { name: 'Verse', chart: '| F | C | C7 | F |\n| Bb | F | C | F |', look: [],
        notes: 'The verse uses only I, IV and V: a plain, singable frame.' },
      { name: 'Coda', chart: '| F | Eb | Bb | F |', look: [[1, '♭VII']],
        notes: 'The long coda swaps C (V) for E♭ (♭VII, borrowed from F minor/Mixolydian): ♭VII → IV → I, two plagal steps down by 4ths. With no leading tone it can loop forever without sounding like an ending, perfect for a sing-along fade.' },
    ],
    takeaway: 'For a loop that should never feel finished, drop V and use ♭VII–IV–I.' },

  { id: 'here-comes-the-sun', song: 'Here Comes the Sun', artist: 'The Beatles', year: 1969, key: { pc: 9, scale: 'major' }, tags: ['♭III and ♭VII (borrowed)'],
    sections: [
      { name: 'Bridge', chart: '| C | G | D | A |\n| E7 |', look: [[0, '♭III'], [1, '♭VII']],
        notes: 'The bridge steps down by 4ths: C → G → D → A, which is ♭III → ♭VII → IV → I, a "double plagal" chain borrowed from A minor/Mixolydian. Each chord is the IV of the next. E7 (V7) then leads back. (The recording uses changing meters here; the bars are simplified.)' },
    ],
    takeaway: 'A chain of IV → I moves (♭III–♭VII–IV–I) sounds like a sunrise: each step is a gentle arrival, and the borrowed chords add warmth.' },

  { id: 'creep', song: 'Creep', artist: 'Radiohead', year: 1992, key: { pc: 7, scale: 'major' }, tags: ['Secondary dominant', 'Borrowed iv'],
    sections: [
      { name: 'The whole song (verse and chorus)', chart: '| G | % | B | % |\n| C | % | Cm | % |', look: [[1, 'V/vi'], [3, 'iv']],
        notes: 'B major is V of E minor (vi), and its D♯ pulls up to E, but the song goes to C instead: the pull is left hanging. Then C turns into C minor (iv, borrowed from G minor), whose E♭ sinks to D in the G chord. Major lift, then minor sigh, over and over.' },
    ],
    takeaway: 'A secondary dominant that doesn\'t resolve, followed by IV → iv, packs tension and melancholy into a four-chord loop.' },

  { id: 'dlbia', song: 'Don\'t Look Back in Anger', artist: 'Oasis', year: 1995, key: { pc: 0, scale: 'major' }, tags: ['Secondary dominant'],
    sections: [
      { name: 'Verse', chart: '| C | G | Am | E |\n| F | G | C Am | G |', look: [[3, 'V/vi']],
        notes: 'E major is V of A minor; its G♯ is a leading tone into A. Here it comes after Am and moves on to F, a step away (a deceptive-sounding move). Some charts write it E7 or E7/G♯, making the bass climb G → G♯ → A.' },
    ],
    takeaway: 'V/vi (III major) is the classic way to add drama to a I–V–vi progression; anthems use it in verses and choruses alike.' },

  { id: 'livin', song: 'Livin\' on a Prayer', artist: 'Bon Jovi', year: 1986, key: { pc: 4, scale: 'aeolian' }, tags: ['Modulation'],
    sections: [
      { name: 'End of the bridge', chart: '| D | % |', look: [[0, 'VII']],
        notes: 'The song is in E minor. Before the last chorus the band holds D, which is VII in E minor…' },
      { name: 'Last chorus', key: { pc: 7, scale: 'aeolian' }, chart: '| Gm | % |', look: [[0, 'i']],
        notes: '…and also V of G minor. Instead of falling back to E minor the music lands in G minor, a minor third higher. The pivot is one chord both keys share, played as a big build-up.' },
    ],
    takeaway: 'The "final chorus lift" works best with preparation: hold a chord that is the new key\'s V, then land. A minor third up (not just a step) sounds even bigger.' },

  { id: 'jesus-etc', song: 'Jesus, Etc.', artist: 'Wilco', year: 2002, key: { pc: 5, scale: 'major' }, tags: ['Secondary dominant', 'Chromatic bass'],
    sections: [
      { name: 'Verse', chart: '| Dm | Am | Dm | Bb |\n| F | Gm | C | Bb |', look: [],
        notes: 'The verse stays in the key, starting on vi (D minor), so the song feels wistful before it ever reaches F. Many players use a capo at the 5th fret with Am-shape chords; this is how it sounds.' },
      { name: 'Chorus', chart: '| F | C/E | Dm | A/C# |', look: [[3, 'V/vi']],
        notes: 'The bass walks down F → E → D → C♯. The last chord, A/C♯, is V of D minor (vi): its C♯ in the bass is a leading tone pulling up to D. A descending bass line with a secondary dominant at the bottom is a lovely way to make a chorus flow.' },
    ],
    takeaway: 'Slash chords let the bass walk by step; put a secondary dominant where the line needs a half step (C♯ → D).' },

  { id: 'heavy-metal-drummer', song: 'Heavy Metal Drummer', artist: 'Wilco', year: 2002, key: { pc: 2, scale: 'major' }, tags: ['♭VII (borrowed)', 'Descending bass'],
    sections: [
      { name: 'Main riff (intro and verse)', chart: '| D | D/C | C | A |', look: [[2, '♭VII'], [3, 'V']],
        notes: 'D with C in the bass (a 7th under the chord) slides into C major, ♭VII borrowed from D Mixolydian, then A (V) points home. The bass line D → C → A and the borrowed C give the riff its sunny, nostalgic rock feel. (Tabs often play it capo 5 with A-shape chords; this is how it sounds.)' },
    ],
    takeaway: 'Put the next chord\'s root in the bass early (D/C) to glide into a borrowed ♭VII.' },
];

/* ---- Parsing and playing ---- */
const exById = id => EXAMPLES.find(e => e.id === id);
const exSecKey = (ex, s) => s.key || ex.key;
// a section's chords, spelled in its key
function exChordsOf(ex, s){
  return inSection({ key: exSecKey(ex, s) }, () => {
    const ts = S.ts; S.ts = { num: 4, den: 4, groups: null };
    try { return parseChart(s.chart).chords.map(c => ({ ch: mkChord(c.pc, c.L, c.q, c.bs), b: c.b })); }
    finally { S.ts = ts; }
  });
}
// plays chords with their lengths at a moderate tempo
function exPlay(list, bpm = 100){
  ui.prevT.forEach(clearTimeout); ui.prevT = [];
  let t = 0;
  const spb = 60 / bpm;
  list.forEach(x => { ui.prevT.push(setTimeout(() => { playChord(x.ch); refreshTabLight(); }, t * 1000)); t += Math.min(x.b, 4) * spb; });
}

/* ---- The lesson: "Songs that break the rules (well)" ---- */
LESSONS.push({ id: 'songs', name: 'Songs that break the rules (well)' });
LESSON_HTML.songs = lessonSongs;
function lessonSongs(){
  const ex = exById(LW.song) || EXAMPLES[0];
  LW.song = ex.id;
  const list = EXAMPLES.map(e => `<button class="cchip${e === ex ? ' on' : ''}" data-act="exPick" data-id="${e.id}"><b>${esc(e.song)}</b> <span class="muted">${esc(e.artist)}</span></button>`).join('');
  const secs = ex.sections.map((s, si) => {
    const k = exSecKey(ex, s), chs = exChordsOf(ex, s);
    return `<div class="ex-sec"><div class="sec-h"><h4>${esc(s.name)} <span class="muted">· ${esc(keyName(k))}</span></h4><div class="acts"><button class="btn sm primary" data-act="exPlay" data-s="${si}">▶ Play</button><button class="btn sm" data-act="exAn" data-s="${si}">Open in analyzer</button></div></div>
      ${inSection({ key: k }, () => anStripHTML(chs.map(x => x.ch), -1, 'exChord', `data-s="${si}"`))}
      <p>${s.notes}</p></div>`;
  }).join('');
  return `<p>Real songs use chords from outside the key all the time. Each example shows a short passage, chords only, colored like the analyzer (grey in the key, red secondary, purple borrowed), with what is going on, why it works where it is, and what you can take from it. ▶ plays it; click a chord to open it in the analyzer; <b>Open as a song</b> loads it into the Song builder (as a new, unsaved song) so you can change it and hear the difference.</p>
    <div class="ex-list">${list}</div>
    <article class="ln-w ex-song"><div class="sec-h"><h3>${esc(ex.song)} <span class="muted">· ${esc(ex.artist)}, ${ex.year}</span></h3><span>${ex.tags.map(t => `<span class="pill k-color">${esc(t)}</span>`).join(' ')}</span></div>
      ${anLegendHTML()}
      ${secs}
      <p class="slotnote"><b>Use it in your own writing:</b> ${ex.takeaway}</p>
      <div class="acts"><button class="btn sm primary" data-act="exSong">Open as a song</button></div>
      <p class="hint">Chords only, from published chord sheets and analyses (checked against at least two), simplified, with approximate bar lengths. Listen to the recording for the real thing.</p></article>`;
}
// "Hear it in a song" links from the lesson cards
const exLinks = ids => ids && ids.length ? `<p class="ex-links"><b>Hear it in:</b> ${ids.map(id => { const e = exById(id); return e ? `<button class="cchip" data-act="exGo" data-id="${id}">${esc(e.song)}</button>` : ''; }).join(' ')}</p>` : '';

Object.assign(ACT, {
  exPick: el => { LW.song = el.dataset.id; renderLearn(); },
  exGo: el => { LW.song = el.dataset.id; S.learnLesson = 'songs'; save(); renderLearn(); showTabTop(); },
  exPlay: el => { const ex = exById(LW.song), s = ex.sections[+el.dataset.s]; exPlay(exChordsOf(ex, s)); },
  exChord: el => {
    const ex = exById(LW.song), s = ex.sections[+el.dataset.s];
    anOpenWith({ chs: exChordsOf(ex, s).map(x => x.ch), key: exSecKey(ex, s), focus: +el.dataset.i, view: 'chord', title: `${ex.song}: ${s.name}` });
  },
  exAn: el => {
    const ex = exById(LW.song), s = ex.sections[+el.dataset.s];
    anOpenWith({ chs: exChordsOf(ex, s).map(x => x.ch), key: exSecKey(ex, s), focus: -1, view: 'prog', title: `${ex.song}: ${s.name}` });
  },
  // a new, unsaved song with one section per passage, each in its own key
  exSong: () => {
    const ex = exById(LW.song);
    guardDirty('song', () => {
      if (PB.on) pbStop();
      leavePart();
      keyWhy('open');
      W.song = blankSong();
      W.song.name = `${ex.song} (example)`; W.song.artist = ex.artist; W.song.key = clone(ex.key);
      W.song.notes = `Chord example from the Learn tab. ${ex.takeaway}`;
      ex.sections.forEach(s => {
        const k = exSecKey(ex, s), p = addPart(s.name, []);
        p.key = clone(k); p.keyOk = !sameKey(k, ex.key);
        p.items.push(...inSection({ key: k }, () => exChordsOf(ex, s).map(x => toItem(x.ch, x.b))));
        keyLog({ where: `Section key: ${p.name}`, doc: W.song.name, from: null, to: k, chords: 'new section (example)' });
      });
      prog = W.prog.items;
      S.tab = 'song'; save(); renderAll(); showTabTop();
      toast(`Opened “${esc(ex.song)}” as a new song (not saved). Change anything; Save keeps it.`);
    });
  },
});
