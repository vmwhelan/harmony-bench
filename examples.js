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
    takeaway: 'A secondary dominant doesn\'t have to resolve where it points. II → IV (instead of II → V) gives a lift without the formality of a cadence; it is all over 1960s pop.',
    full: { form: ['Intro', 'Verse', 'Verse', 'Bridge', 'Verse', 'Bridge', 'Verse'], extra: { Intro: { chart: '| D | E | G | D |' } },
      note: 'Form from Alan W. Pollack\'s notes; the intro\'s chords from published chord sheets. The outro (a fade-in/complete ending built from the same chords) is not charted here.' } },

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
      { name: 'Bridge', chart: '| F7 | Bb | Gm7 | C7 | F |', look: [[0, 'V7/IV']],
        notes: 'The bridge starts by turning the home chord into F7, the V7 of B♭: for a moment the song leans toward B♭, then Gm7 → C7 (ii–V) brings it back to F. A secondary dominant at the start of a section announces "something new" without leaving the key.' },
      { name: 'Coda', chart: '| F | Eb | Bb | F |', look: [[1, '♭VII']],
        notes: 'The long coda swaps C (V) for E♭ (♭VII, borrowed from F minor/Mixolydian): ♭VII → IV → I, two plagal steps down by 4ths. With no leading tone it can loop forever without sounding like an ending, perfect for a sing-along fade.' },
    ],
    takeaway: 'For a loop that should never feel finished, drop V and use ♭VII–IV–I.',
    full: { form: ['Verse', 'Verse', 'Bridge', 'Verse', 'Bridge', 'Verse', 'Coda'], note: 'Form from Alan W. Pollack\'s notes and published charts (the long coda repeats until the fade).' } },

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
  { id: 'im-so-tired', song: 'I\'m So Tired', artist: 'The Beatles', year: 1968, key: { pc: 9, scale: 'major' }, tags: ['Secondary dominant'],
    sections: [
      { name: 'Verse', chart: '| A | G#7 | D | E7 |\n| A | F#m | D | E7 |', look: [[1, 'V7/iii'], [3, 'V7']],
        notes: 'G♯7 is the V7 of C♯ minor (iii); two of its notes, B♯ and D♯, are outside A major. It promises C♯m and goes to D instead, a weary sideways slump that suits the song. The second line repeats the shape with the plain F♯m (vi) in its place, so you hear the difference one chord makes.' },
    ],
    takeaway: 'Swap one chord of a repeated line for its secondary dominant (vi → V7/iii here) and the repeat suddenly has a different color, even though the melody barely changes.' },

  { id: 'htae', song: 'Here, There and Everywhere', artist: 'The Beatles', year: 1966, key: { pc: 7, scale: 'major' }, tags: ['Secondary ii–V', 'Key change'],
    sections: [
      { name: 'Verse', chart: '| G Am | Bm C | G Am |\n| Bm C | F#m7b5 B7 |\n| Em Am | Am7 D7 |', look: [[8, 'iiø7/vi'], [9, 'V7/vi'], [13, 'V7']],
        notes: 'The verse climbs step by step, G → Am → Bm → C (I, ii, iii, IV), then F♯m7♭5 → B7 → Em is a ii–V into E minor (vi): a little minor-key cadence inside a major song. Am → D7 then sets up home again.' },
      { name: 'Bridge', key: { pc: 7, scale: 'aeolian' }, chart: '| F7 | Bb | Gm | Cm |\n| D7 | Gm | Cm | D7 |', look: [[0, 'VII7'], [4, 'V7']],
        notes: 'The bridge slips into the parallel minor, G minor. F7 (♭VII in G, and V7 of B♭) leads to B♭ → Gm → Cm, a I–vi–ii in B♭; then D7, the V7 of G minor, tips it to Gm → Cm. The last D7 is also the V7 of G major, so the verse can come straight back in the major.' },
    ],
    takeaway: 'A bridge in the parallel minor (G → G minor) changes the mood completely while keeping the same home note; V7, shared by both, is the door back.' },

  { id: 'because', song: 'Because', artist: 'The Beatles', year: 1969, key: { pc: 1, scale: 'aeolian' }, tags: ['Neapolitan', 'Major dominant in minor'],
    sections: [
      { name: 'Verse', chart: '| C#m | D#m7b5 | G#7 | A |\n| C#m | A7 | D | Ddim |', look: [[1, 'iiø7'], [2, 'V7'], [5, 'V7/♭II'], [6, '♭II']],
        notes: 'In C♯ minor: D♯m7♭5 → G♯7 is the minor-key ii–V (G♯7 borrows the raised 7th, B♯, from harmonic minor). Later A7 slides to D major, the Neapolitan (♭II): a major chord a half step above home, which sounds strange and floating. D diminished then darkens it further before the line returns.' },
    ],
    takeaway: 'The ♭II (Neapolitan) is a dramatic pre-dominant; reaching it from a dominant-7th a 5th above (A7 → D) makes the arrival smooth even though the chord is far outside the key.' },

  { id: 'michelle', song: 'Michelle', artist: 'The Beatles', year: 1965, key: { pc: 5, scale: 'major' }, tags: ['Borrowed chords', 'Chromatic line'],
    sections: [
      { name: 'Verse', chart: '| F | Bbm7 | Eb6 | Ddim7 | C |', look: [[1, 'iv7'], [2, '♭VII6']],
        notes: 'Right after the tonic come two chords borrowed from F minor: B♭m7 (iv7) and E♭6 (♭VII). Their A♭ and E♭ make the verse sound wistful and French-tinged; D diminished slides into C (V).' },
      { name: 'Minor line (intro and middle)', key: { pc: 5, scale: 'aeolian' }, chart: '| Fm | Fm(maj7) | Fm7 | Fm6 |', look: [],
        notes: 'One chord, F minor, while a single voice walks down a half step at a time: F → E → E♭ → D. That chromatic "line cliché" makes a static chord feel like it is moving.' },
    ],
    takeaway: 'Borrowing iv and ♭VII from the parallel minor right after I is a quick way to add melancholy; a chromatic line inside one chord adds motion without changing harmony.' },

  { id: 'penny-lane', song: 'Penny Lane', artist: 'The Beatles', year: 1967, key: { pc: 11, scale: 'major' }, tags: ['Key change', 'Pivot chords'],
    sections: [
      { name: 'Verse', chart: '| B G#m | C#m F#7 |\n| B G#m | Bm7 E |', look: [[3, 'V7'], [6, 'i7'], [7, 'IV']],
        notes: 'The verse starts as a doo-wop I–vi–ii–V in B. The second time, where C♯m is expected, it lands on B minor (borrowed from the parallel minor), then E: IV in B, but about to become V of A.' },
      { name: 'Chorus', key: { pc: 9, scale: 'major' }, chart: '| A | % |', look: [[0, 'I']],
        notes: 'The chorus is in A major, a whole step lower: E (IV of B = V of A) was the pivot. Only the arrival is charted here.' },
      { name: 'Back to the verse', key: { pc: 9, scale: 'major' }, chart: '| F#7 |', look: [[0, 'V7/ii']],
        notes: 'F♯7 is VI7 in A (V7 of Bm), and V7 of B: the pivot that takes the song back up to B for the next verse.' },
    ],
    takeaway: 'To change key between sections, end on a chord that belongs to both keys (E: IV in B, V in A). A borrowed minor chord just before it (Bm7) helps the ear let go of the old key.' },

  { id: 'aditl', song: 'A Day in the Life', artist: 'The Beatles', year: 1967, key: { pc: 7, scale: 'major' }, tags: ['Key change', '♭VII'],
    sections: [
      { name: 'Verse', chart: '| G Bm | Em Em7 | C |', look: [],
        notes: 'The verse floats between G major and E minor (its relative): G, Bm, Em, Em7, C, with a bass line stepping down. It never settles firmly on either.' },
      { name: 'Middle section', key: { pc: 4, scale: 'major' }, chart: '| E | Dsus2 | E | B7sus4 |', look: [[1, '♭VIIsus2'], [3, 'V7sus4']],
        notes: 'After the orchestral build the song cuts straight to E major, with no pivot: a new section, a new singer, a new key. D (♭VII, Mixolydian) and B7sus4 (V) circle E. The direct jump works because E minor was already in the air in the verse; now it turns major.' },
    ],
    takeaway: 'A completely contrasting section can change key with no preparation at all if everything else changes too (tempo feel, singer, texture). Choosing a key the old one hinted at (E, from Em) keeps it connected.' },

  { id: 'im-only-sleeping', song: 'I\'m Only Sleeping', artist: 'The Beatles', year: 1966, key: { pc: 3, scale: 'aeolian' }, tags: ['Minor and relative major', 'Major dominant in minor'],
    sections: [
      { name: 'Verse', chart: '| D#m | G#m | F# | B |\n| F# | A#7 |', look: [[2, 'III'], [5, 'V7']],
        notes: 'In D♯ minor (often called E♭ minor), the verse drifts into its relative major, F♯ (with B, its IV), as if dozing off; then A♯7, the major V7 borrowed from harmonic minor, wakes it back up toward D♯ minor. Played on a guitar tuned down a half step with Em, Am, G, C and B7 shapes.' },
    ],
    takeaway: 'Moving between a minor key and its relative major gives a hazy, in-between mood; the major V7 of the minor key is the anchor that brings you back.' },

  { id: 'fixing-a-hole', song: 'Fixing a Hole', artist: 'The Beatles', year: 1967, key: { pc: 5, scale: 'major' }, tags: ['Augmented chord', 'Major/minor mixture'],
    sections: [
      { name: 'Verse', chart: '| F | C+ | Fm7 | Fm6 |', look: [[2, 'i7']],
        notes: 'F major moves to C augmented (C–E–G♯): its G♯ pushes up to A♭, the minor 3rd of F, so the next chord is F minor. The verse then lives in F minor (a Dorian, folky minor), while the bridges switch back to plain F major.' },
    ],
    takeaway: 'An augmented chord is a great hinge from major to minor on the same tonic: its raised 5th becomes the minor 3rd.' },

  { id: 'karma-police', song: 'Karma Police', artist: 'Radiohead', year: 1997, key: { pc: 9, scale: 'dorian' }, tags: ['Dorian', 'Borrowed ♭VI'],
    sections: [
      { name: 'Opening progression', chart: '| Am | D/F# | Em | G |\n| Am | F | Em | G |', look: [[1, 'IV'], [5, '♭VI']],
        notes: 'A minor with a major D (IV) is the Dorian sound: the F♯ in the bass is the raised 6th. The second time, D is replaced by F (♭VI, from the plain minor), so the same line turns darker. One note, F♯ vs F, changes the whole color.' },
    ],
    takeaway: 'Repeat a line and change one chord between its Dorian and natural-minor versions (IV ↔ ♭VI): an easy way to make the second half of a phrase answer the first.' },

  { id: 'poor-places', song: 'Poor Places', artist: 'Wilco', year: 2002, key: { pc: 10, scale: 'major' }, tags: ['Secondary dominant'],
    sections: [
      { name: 'Main progression', chart: '| Bb | F | Gm | Eb |\n| C7 | Eb |', look: [[4, 'V7/V']],
        notes: 'C7 is II7, the V7 of F (V of V), with an E natural outside B♭ major. Like the Beatles in "Eight Days a Week", it skips its target and falls to E♭ (IV): a bittersweet lift that never resolves. (Charts play it capo 3 with G, D, Em, C, A7 shapes; this is how it sounds.)' },
    ],
    takeaway: 'II7 → IV is a gentle way to brighten a phrase without a cadence; it works especially well in slow, drifting songs.' },
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
// The parts of the full song (in form order), or null if no verified full chart
function exFullParts(ex){
  if (!ex.full) return null;
  return ex.full.form.map(name => ex.sections.find(s => s.name === name) || { name, ...(ex.full.extra || {})[name] });
}
// playback entries: the highlighted sections ('all' or one index), or the full song ('full')
function exSeq(ex, what){
  const parts = what === 'full' ? exFullParts(ex) : what === 'all' ? ex.sections : [ex.sections[+what]];
  const seq = [];
  parts.forEach((s, k) => {
    const key = exSecKey(ex, s), o = what === 'full' ? 'f' + k : 'x' + (what === 'all' ? k : +what);
    const sec = { key, name: s.name, ts: { num: 4, den: 4, groups: null } };
    exChordsOf(ex, s).forEach((x, i) => seq.push({ it: inSection({ key }, () => toItem(x.ch, x.b)), i, o, sec, ch: x.ch }));
  });
  return seq;
}
function exStart(what){
  const ex = exById(LW.song);
  if (PB.on) pbStop();
  pbStart({ ex: exSeq(ex, what), id: ex.id, what }, 0);
}
const exPlaying = () => PB.on && PB.mode === 'ex' && PB.exId === LW.song;

/* ---- The lesson: "Songs that break the rules (well)" ---- */
LESSONS.push({ id: 'songs', name: 'Songs that break the rules (well)' });
LESSON_HTML.songs = lessonSongs;
function exSecHTML(ex, s, o, si){
  const k = exSecKey(ex, s), chs = exChordsOf(ex, s), on = exPlaying() && PB.exWhat === String(si);
  return `<div class="ex-sec"><div class="sec-h"><h4>${esc(s.name)} <span class="muted">· ${esc(keyName(k))}</span></h4><div class="acts">${si != null ? `<button class="btn sm${on ? ' primary' : ''}" data-act="exPlay" data-s="${si}">${on ? '■ Stop' : '▶ Play'}</button>` : ''}<button class="btn sm" data-act="exAn" data-o="${o}">Open in analyzer</button></div></div>
    ${inSection({ key: k }, () => anStripHTML(chs.map(x => x.ch), -1, 'exChord', `data-xo="${o}"`))}
    ${s.notes ? `<p>${s.notes}</p>` : ''}</div>`;
}
function lessonSongs(){
  const ex = exById(LW.song) || EXAMPLES[0];
  LW.song = ex.id;
  const full = exFullParts(ex), view = full && LW.exView === 'full' ? 'full' : 'parts';
  const list = EXAMPLES.map(e => `<button class="cchip${e === ex ? ' on' : ''}" data-act="exPick" data-id="${e.id}"><b>${esc(e.song)}</b> <span class="muted">${esc(e.artist)}</span>${e.full ? ' <span class="pill k-ok" title="Full song chart available">full</span>' : ''}</button>`).join('');
  const playing = exPlaying(), what = view === 'full' ? 'full' : 'all';
  const transport = `<div class="transport ex-transport">
    <button class="play" data-act="exToggle" aria-label="${playing ? 'Stop' : 'Play'}" title="${playing ? 'Stop' : view === 'full' ? 'Play the whole song' : 'Play every passage in order'} (Space also plays and stops)">${playing ? '<svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8"/></svg>' : '<svg viewBox="0 0 10 10"><path d="M2 1 L9 5 L2 9Z"/></svg>'}</button>
    <span class="hint">${playing ? `Playing ${PB.exWhat === 'full' ? 'the whole song' : PB.exWhat === 'all' ? 'all passages' : esc(ex.sections[+PB.exWhat].name)}` : view === 'full' ? 'Play the whole song' : 'Play all passages'}</span>
    <div class="fld"><span>Tempo ♩=</span><div class="tempo"><input type="number" id="bpmN" min="30" max="300" value="${S.bpm}" aria-label="Tempo in BPM"><span class="lbl">BPM</span></div></div>
    ${styleSelectHTML()}
    <label class="chk"><input type="checkbox" id="loop"${S.loop ? ' checked' : ''}> Loop</label></div>`;
  const tabs = full ? `<div class="seg" role="group" aria-label="Show"><button data-act="exView" data-v="parts" aria-pressed="${view === 'parts'}">The interesting parts</button><button data-act="exView" data-v="full" aria-pressed="${view === 'full'}">Full song</button></div>` : '<span class="hint">Full-song chart not included (only charts every section of which could be verified are).</span>';
  const body = view === 'full'
    ? `<p class="hint">${esc(ex.full.note || '')} Form: ${full.map(p => esc(p.name)).join(' → ')}.</p>` + full.map((s, k) => exSecHTML(ex, { ...s, notes: '' }, 'f' + k, null)).join('')
    : ex.sections.map((s, si) => exSecHTML(ex, s, 'x' + si, si)).join('');
  return `<p>Real songs use chords from outside the key all the time. Each example shows short passages, chords only, colored like the analyzer (grey in the key, red secondary, purple borrowed), with what is going on, why it works where it is, and what you can take from it. ▶ plays it with the full player (Stop, tempo, loop, and the mini player when you scroll away); click a chord to open it in the analyzer; <b>Open as a song</b> loads it into the Song builder (as a new, unsaved song) so you can change it and hear the difference.</p>
    <div class="ex-list">${list}</div>
    <article class="ln-w ex-song"><div class="sec-h"><h3>${esc(ex.song)} <span class="muted">· ${esc(ex.artist)}, ${ex.year}</span></h3><span>${ex.tags.map(t => `<span class="pill k-color">${esc(t)}</span>`).join(' ')}</span></div>
      <div class="acts ex-view">${tabs}</div>
      ${transport}
      ${anLegendHTML()}
      ${body}
      <p class="slotnote"><b>Use it in your own writing:</b> ${ex.takeaway}</p>
      <div class="acts"><button class="btn sm primary" data-act="exSong">Open as a song${full ? ' (full form)' : ''}</button></div>
      <p class="hint">Chords only, from published chord sheets and analyses (checked against at least two), simplified, with approximate bar lengths. Listen to the recording for the real thing.</p></article>`;
}
// "Hear it in a song" links from the lesson cards
const exLinks = ids => ids && ids.length ? `<p class="ex-links"><b>Hear it in:</b> ${ids.map(id => { const e = exById(id); return e ? `<button class="cchip" data-act="exGo" data-id="${id}">${esc(e.song)}</button>` : ''; }).join(' ')}</p>` : '';
// the part shown by a strip (data-xo: x<section> or f<form position>)
function exPartOf(ex, o){ return o[0] === 'f' ? exFullParts(ex)[+o.slice(1)] : ex.sections[+o.slice(1)]; }

Object.assign(ACT, {
  exPick: el => { if (PB.on && PB.mode === 'ex') pbStop(); LW.song = el.dataset.id; renderLearn(); },
  exGo: el => { LW.song = el.dataset.id; S.learnLesson = 'songs'; save(); renderLearn(); showTabTop(); },
  exView: el => { if (PB.on && PB.mode === 'ex') pbStop(); LW.exView = el.dataset.v; renderLearn(); },
  exToggle: () => { if (exPlaying()) pbStop(); else exStart(exFullParts(exById(LW.song)) && LW.exView === 'full' ? 'full' : 'all'); },
  exPlay: el => { if (exPlaying() && PB.exWhat === el.dataset.s) pbStop(); else exStart(el.dataset.s); },
  exChord: el => {
    const ex = exById(LW.song), s = exPartOf(ex, el.dataset.xo);
    anOpenWith({ chs: exChordsOf(ex, s).map(x => x.ch), key: exSecKey(ex, s), focus: +el.dataset.i, view: 'chord', title: `${ex.song}: ${s.name}` });
  },
  exAn: el => {
    const ex = exById(LW.song), s = exPartOf(ex, el.dataset.o);
    anOpenWith({ chs: exChordsOf(ex, s).map(x => x.ch), key: exSecKey(ex, s), focus: -1, view: 'prog', title: `${ex.song}: ${s.name}` });
  },
  // a new, unsaved song: one section per passage (or per part of the full form), each in its own key
  exSong: () => {
    const ex = exById(LW.song), full = exFullParts(ex);
    guardDirty('song', () => {
      if (PB.on) pbStop();
      leavePart();
      keyWhy('open');
      W.song = blankSong();
      W.song.name = `${ex.song} (example)`; W.song.artist = ex.artist; W.song.key = clone(ex.key);
      W.song.notes = `Chord example from the Learn tab. ${ex.takeaway}`;
      const made = {};
      (full || ex.sections).forEach(s => {
        if (made[s.name]){ W.song.order.push(made[s.name].id); return; }
        const k = exSecKey(ex, s), p = addPart(s.name, []);
        made[s.name] = p;
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
