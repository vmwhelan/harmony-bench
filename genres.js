'use strict';
/* =========================================================================
   Genre guide: an optional style for a progression or a song (saved with it)
   that nudges the suggestions toward the chords and moves typical of that
   style. Nothing is hidden: typical choices rank higher and say why.
   Off (the default) leaves every suggestion exactly as it was.
   Loaded after sections.js and before docs.js.
   ========================================================================= */

// Chords are [semitones above the key root, scale steps above it, chord type]; presets use the PRESETS format.
// roots: weight by how far the chord's root is above the key root (semitones). motion: weight and reason by how
// far the root moves from the chord before. keyChanges: weight and reason by how far a new section's key is
// above the current one ('rel' = the relative key, '*' = any key).
const dom7 = ch => ch.q.full.includes(4) && ch.q.full.includes(10);
// common-practice rule: a dominant goes home (or to vi, the deceptive cadence), not somewhere else
const vResolves = (ch, prev) => prev && analyze(prev).fn === 'D' && analyze(ch).fn !== 'D' && ![0, 9].includes(mod(ch.rootPc - K.pc)) ? [-0.3, ''] : null;
const GENRES = {
  pop: { name: 'Pop', blurb: 'Diatonic triads, the I–V–vi–IV family, add9 and sus colors, and a key lift for the last chorus.',
    qual: { maj: 0.3, m: 0.3, add9: 0.25, sus2: 0.2, sus4: 0.2, madd9: 0.15, maj7: 0.1, m7: 0.1, '7': 0, '6': 0, '5': 0 }, other: -0.3,
    roots: { 0: 0.3, 5: 0.25, 7: 0.25, 9: 0.25, 2: 0.1 }, rootsMinor: { 0: 0.3, 8: 0.3, 3: 0.25, 10: 0.3, 5: 0.15 },
    motion: { 5: [0.15, 'the IV/V pull'], 7: [0.15, 'a strong move up a 5th'], 9: [0.1, 'a step down by a 3rd (I→vi)'] },
    chords: [[0,0,'maj'],[7,4,'maj'],[9,5,'m'],[5,3,'maj'],[0,0,'add9'],[5,3,'add9'],[7,4,'sus4'],[2,1,'m7']],
    chordsMinor: [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj'],[5,3,'m'],[0,0,'madd9']],
    scales: ['major', 'aeolian', 'mixolydian'],
    presets: [
      ['Pop axis: I–V–vi–IV', 'major', [[0,0,'maj'],[7,4,'maj'],[9,5,'m'],[5,3,'maj']]],
      ['Sad axis: vi–IV–I–V', 'major', [[9,5,'m'],[5,3,'maj'],[0,0,'maj'],[7,4,'maj']]],
      ['Doo-wop / ’50s: I–vi–IV–V', 'major', [[0,0,'maj'],[9,5,'m'],[5,3,'maj'],[7,4,'maj']]],
      ['Add9 shimmer: Iadd9–IVadd9–vi7–Vsus4', 'major', [[0,0,'add9'],[5,3,'add9'],[9,5,'m7'],[7,4,'sus4']]],
      ['Minor pop: i–♭VI–♭III–♭VII', 'aeolian', [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj']]]],
    keyChanges: { 1: [1.2, 'the half-step lift for the last chorus'], 2: [1.2, 'the “truck driver” whole-step lift'], rel: [0.4, 'a mood change to the relative key'] } },

  rock: { name: 'Rock', blurb: 'Power chords and major triads, I–IV–V with the borrowed ♭VII, ♭VI and ♭III.',
    qual: { maj: 0.3, '5': 0.35, m: 0.15, sus4: 0.1, '7': 0.05, add9: 0.05 }, other: -0.3,
    roots: { 0: 0.3, 5: 0.25, 7: 0.2, 10: 0.35, 8: 0.25, 3: 0.2, 2: 0.1 },
    motion: { 10: [0.3, 'the I→♭VII drop'], 2: [0.2, 'a whole-step climb (♭VII→I, IV→V)'], 5: [0.15, 'I→IV, the backbone of rock'], 8: [0.15, 'a drop to ♭VI'] },
    chords: [[0,0,'5'],[10,6,'maj'],[5,3,'maj'],[7,4,'maj'],[8,5,'maj'],[3,2,'maj'],[0,0,'maj'],[2,1,'maj']],
    scales: ['major', 'mixolydian', 'aeolian', 'dorian'],
    presets: [
      ['Three-chord rock: I–IV–V–IV', 'major', [[0,0,'maj'],[5,3,'maj'],[7,4,'maj'],[5,3,'maj']]],
      ['Mixolydian rock: I–♭VII–IV–I', 'mixolydian', [[0,0,'maj'],[10,6,'maj'],[5,3,'maj'],[0,0,'maj']]],
      ['Aeolian rock: i–♭VI–♭VII–i', 'aeolian', [[0,0,'m'],[8,5,'maj'],[10,6,'maj'],[0,0,'m']]],
      ['Power-chord riff: I5–♭III5–IV5–I5', 'aeolian', [[0,0,'5'],[3,2,'5'],[5,3,'5'],[0,0,'5']]]],
    keyChanges: { 2: [1, 'a whole-step lift for the last chorus'], 1: [0.6, 'a half-step lift'], 5: [0.4, 'to the IV key'] } },

  metal: { name: 'Metal', blurb: 'Power chords in minor modes: i, ♭II, ♭VI, ♭VII, half steps and the tritone.',
    qual: { '5': 0.5, m: 0.3, dim: 0.15, maj: 0.05, sus2: 0.1, '7': -0.4, m7: -0.2 }, other: -0.5,
    roots: { 0: 0.35, 1: 0.35, 3: 0.2, 5: 0.1, 6: 0.25, 7: 0.05, 8: 0.3, 10: 0.3 },
    motion: { 1: [0.35, 'the menacing half step up (i→♭II)'], 11: [0.3, 'a half-step drop'], 6: [0.3, 'the tritone (the “devil’s interval”)'], 8: [0.2, 'i→♭VI, the epic minor drop'], 2: [0.15, 'a whole-step climb (♭VI→♭VII)'], 3: [0.1, 'up a minor 3rd'] },
    chords: [[0,0,'5'],[1,1,'5'],[3,2,'5'],[6,4,'5'],[8,5,'5'],[10,6,'5'],[0,0,'m'],[7,4,'maj']],
    scales: ['aeolian', 'phrygian', 'harmonic', 'phrygdom', 'locrian', 'dorian'],
    presets: [
      ['Metal: i5–♭VI5–♭VII5–i5', 'aeolian', [[0,0,'5'],[8,5,'5'],[10,6,'5'],[0,0,'5']]],
      ['Phrygian chug: i5–♭II5', 'phrygian', [[0,0,'5',8],[1,1,'5',8]]],
      ['Epic minor: i–♭VI–♭III–♭VII', 'aeolian', [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj']]],
      ['Tritone riff: i5–♭v5–iv5–i5', 'aeolian', [[0,0,'5'],[6,4,'5'],[5,3,'5'],[0,0,'5']]],
      ['Harmonic-minor gallop: i–♭VI–V', 'harmonic', [[0,0,'m'],[8,5,'maj'],[7,4,'maj',8]]]],
    keyChanges: { 11: [1, 'down a half step: heavier'], 1: [0.8, 'up a half step'], rel: [0.4, 'to the relative major for a lift'] } },

  punk: { name: 'Punk', blurb: 'Fast power chords on I, IV, V and vi; simple and loud.',
    qual: { '5': 0.5, maj: 0.3, m: 0.05 }, other: -0.5,
    roots: { 0: 0.3, 5: 0.3, 7: 0.3, 9: 0.1, 10: 0.15 },
    motion: { 5: [0.2, 'I→IV'], 2: [0.2, 'IV→V'], 7: [0.1, 'I→V'] },
    chords: [[0,0,'5'],[5,3,'5'],[7,4,'5'],[9,5,'5'],[10,6,'5'],[3,2,'5']],
    scales: ['major', 'mixolydian', 'aeolian'],
    presets: [
      ['Punk: I5–V5–vi5–IV5', 'major', [[0,0,'5'],[7,4,'5'],[9,5,'5'],[5,3,'5']]],
      ['Punk: I5–IV5–V5–I5', 'major', [[0,0,'5'],[5,3,'5'],[7,4,'5'],[0,0,'5']]],
      ['Punk: I5–♭VII5–IV5', 'mixolydian', [[0,0,'5'],[10,6,'5'],[5,3,'5',8]]]],
    keyChanges: { 2: [0.8, 'up a whole step for the last chorus'] } },

  blues: { name: 'Blues', blurb: 'Dominant 7ths (and 9ths) on I, IV and V, the 12-bar form and the V–IV turnaround.',
    qual: { '7': 0.5, '9': 0.35, '13': 0.2, '7s9': 0.25, m7: 0.1, m: 0.05 }, other: -0.3,
    roots: { 0: 0.3, 5: 0.3, 7: 0.3 },
    motion: { 5: [0.25, 'I7→IV7, the move to bar 5'], 10: [0.15, 'V7→IV7, the blues turnaround'], 7: [0.1, 'up to V7'] },
    rules: [(ch) => [0, 5, 7].includes(mod(ch.rootPc - K.pc)) && dom7(ch) ? [0.2, 'a dominant 7th on I, IV or V'] : null],
    chords: [[0,0,'7'],[5,3,'7'],[7,4,'7'],[0,0,'9'],[5,3,'9'],[7,4,'7s9']],
    chordsMinor: [[0,0,'m7'],[5,3,'m7'],[7,4,'7'],[8,5,'7'],[0,0,'m9']],
    scales: ['mixolydian', 'major', 'dorian', 'aeolian'],
    presets: [
      ['12-bar blues', 'mixolydian', [[0,0,'7'],[0,0,'7'],[0,0,'7'],[0,0,'7'],[5,3,'7'],[5,3,'7'],[0,0,'7'],[0,0,'7'],[7,4,'7'],[5,3,'7'],[0,0,'7'],[7,4,'7']]],
      ['Quick-change 12-bar', 'mixolydian', [[0,0,'7'],[5,3,'7'],[0,0,'7'],[0,0,'7'],[5,3,'7'],[5,3,'7'],[0,0,'7'],[0,0,'7'],[7,4,'7'],[5,3,'7'],[0,0,'7'],[7,4,'7']]],
      ['Minor blues', 'aeolian', [[0,0,'m7'],[0,0,'m7'],[0,0,'m7'],[0,0,'m7'],[5,3,'m7'],[5,3,'m7'],[0,0,'m7'],[0,0,'m7'],[8,5,'7'],[7,4,'7'],[0,0,'m7'],[7,4,'7']]],
      ['8-bar blues', 'mixolydian', [[0,0,'7'],[7,4,'7'],[5,3,'7'],[5,3,'7'],[0,0,'7'],[7,4,'7'],[0,0,'7'],[7,4,'7']]]],
    keyChanges: { 5: [0.5, 'to the IV key'], 2: [0.5, 'up a whole step'] } },

  jazz: { name: 'Jazz', blurb: '7th chords and extensions, ii–V–I chains moving down in 5ths, and tritone substitutions.',
    qual: { maj7: 0.4, m7: 0.4, '7': 0.35, '9': 0.35, m9: 0.3, maj9: 0.3, '13': 0.3, m7b5: 0.3, '7b9': 0.3, '7s9': 0.15, '7s11': 0.2, '6': 0.25, '69': 0.3, m6: 0.2, dim7: 0.15, '7b5': 0.15, '7s5': 0.15, mmaj7: 0.15, m11: 0.2, maj13: 0.2, m13: 0.15, '7sus4': 0.15, '9sus4': 0.15, '11': 0.1, maj: -0.4, m: -0.4, '5': -0.8, add9: -0.2, sus2: -0.2, sus4: -0.2 }, other: 0,
    roots: { 2: 0.2, 7: 0.2, 0: 0.15, 9: 0.15, 4: 0.1, 1: 0.1 },
    motion: { 5: [0.35, 'down a 5th, the ii–V–I chain'], 11: [0.25, 'a half step down (tritone substitution)'], 1: [0.1, 'a chromatic approach'] },
    rules: [(ch, prev) => prev && prev.q.minor && dom7(ch) && mod(ch.rootPc - prev.rootPc) === 5 ? [0.15, 'ii–V'] : null],
    chords: [[2,1,'m7'],[7,4,'7'],[0,0,'maj7'],[9,5,'7'],[1,1,'7'],[4,2,'m7'],[0,0,'69'],[7,4,'13'],[11,6,'m7b5']],
    chordsMinor: [[2,1,'m7b5'],[7,4,'7b9'],[0,0,'m6'],[8,5,'maj7'],[5,3,'m7'],[0,0,'mmaj7']],
    scales: ['major', 'dorian', 'melodic', 'mixolydian', 'lydian', 'aeolian', 'harmonic', 'lyddom', 'altered'],
    presets: [
      ['Jazz ii–V–I', 'major', [[2,1,'m7'],[7,4,'7'],[0,0,'maj7',8]]],
      ['Turnaround: I–vi–ii–V', 'major', [[0,0,'maj7'],[9,5,'m7'],[2,1,'m7'],[7,4,'7']]],
      ['Rhythm changes (A section)', 'major', [[0,0,'maj7',2],[9,5,'7',2],[2,1,'m7',2],[7,4,'7',2],[0,0,'maj7',2],[9,5,'7',2],[2,1,'m7',2],[7,4,'7',2]]],
      ['Minor ii–V–i', 'harmonic', [[2,1,'m7b5'],[7,4,'7b9'],[0,0,'m6',8]]],
      ['Tritone-sub turnaround: I–♭III7–♭VI7–♭II7', 'major', [[0,0,'maj7'],[3,2,'7'],[8,5,'7'],[1,1,'7']]]],
    keyChanges: { '*': [0.3, 'jazz reaches any key through its ii–V'], 2: [0.5, 'up a whole step'], 10: [0.4, 'down a whole step (a common tune shape)'], 3: [0.4, 'up a minor 3rd'] } },

  bossa: { name: 'Bossa nova', blurb: 'Soft maj7, m7, 6/9 and 9th chords, II7 lifts and chromatic slides.',
    qual: { maj7: 0.4, m7: 0.4, '7': 0.25, '9': 0.35, m9: 0.3, '69': 0.4, '6': 0.3, m6: 0.3, '7b9': 0.25, m7b5: 0.25, '13': 0.25, dim7: 0.2, '7s11': 0.2, maj9: 0.3, maj: -0.4, m: -0.4, '5': -0.8 }, other: 0,
    roots: { 0: 0.15, 2: 0.25, 7: 0.2, 9: 0.1, 1: 0.2 },
    motion: { 5: [0.3, 'down a 5th, ii–V–I'], 11: [0.3, 'a chromatic slide down'], 2: [0.15, 'Imaj7→II7, the bossa lift'] },
    chords: [[0,0,'maj7'],[2,1,'7'],[2,1,'m7'],[7,4,'7'],[1,1,'7'],[0,0,'69'],[9,5,'m7']],
    chordsMinor: [[0,0,'m6'],[5,3,'m7'],[7,4,'7b9'],[2,1,'m7b5'],[8,5,'maj7']],
    scales: ['major', 'dorian', 'aeolian', 'melodic'],
    presets: [
      ['Bossa: Imaj7–II7–ii7–V7', 'major', [[0,0,'maj7',8],[2,1,'7',8],[2,1,'m7'],[7,4,'7']]],
      ['Chromatic slide: Imaj7–♭II7–Imaj7', 'major', [[0,0,'maj7'],[1,1,'7'],[0,0,'maj7',8]]],
      ['Minor bossa: i6–iv7–V7♭9', 'harmonic', [[0,0,'m6',8],[5,3,'m7'],[7,4,'7b9']]]],
    keyChanges: { 2: [0.4, 'up a whole step'], 1: [0.4, 'up a half step'], 10: [0.3, 'down a whole step'] } },

  folk: { name: 'Folk', blurb: 'Open triads on I, IV, V and vi, sus colors, modal ♭VII and Dorian IV.',
    qual: { maj: 0.35, m: 0.3, sus4: 0.15, sus2: 0.15, add9: 0.1, '7': 0.05 }, other: -0.35,
    roots: { 0: 0.3, 5: 0.3, 7: 0.3, 9: 0.2, 2: 0.1, 10: 0.15 }, rootsMinor: { 0: 0.3, 10: 0.3, 3: 0.25, 5: 0.2, 8: 0.2, 7: 0.1 },
    motion: { 5: [0.2, 'I→IV'], 7: [0.2, 'I→V'], 10: [0.1, 'a modal ♭VII'] },
    chords: [[0,0,'maj'],[5,3,'maj'],[7,4,'maj'],[9,5,'m'],[2,1,'m'],[10,6,'maj'],[0,0,'sus4'],[7,4,'sus4']],
    chordsMinor: [[0,0,'m'],[10,6,'maj'],[3,2,'maj'],[5,3,'m'],[7,4,'m'],[8,5,'maj']],
    scales: ['major', 'mixolydian', 'dorian', 'aeolian'],
    presets: [
      ['Folk: I–IV–I–V', 'major', [[0,0,'maj'],[5,3,'maj'],[0,0,'maj'],[7,4,'maj']]],
      ['Modal folk: I–♭VII–I', 'mixolydian', [[0,0,'maj'],[10,6,'maj'],[0,0,'maj',8]]],
      ['Dorian folk: i–IV–i–♭VII', 'dorian', [[0,0,'m'],[5,3,'maj'],[0,0,'m'],[10,6,'maj']]],
      ['Minor ballad: i–♭VII–♭VI–♭VII', 'aeolian', [[0,0,'m'],[10,6,'maj'],[8,5,'maj'],[10,6,'maj']]]],
    keyChanges: { 7: [0.5, 'to the V key'], 5: [0.4, 'to the IV key'], 2: [0.4, 'up a whole step'], rel: [0.4, 'to the relative key'] } },

  country: { name: 'Country', blurb: 'Major triads and dominant 7ths, I–IV–V, the II7 secondary dominant and a key lift.',
    qual: { maj: 0.4, '7': 0.25, m: 0.1, '6': 0.1, sus4: 0.05, add9: 0.05 }, other: -0.35,
    roots: { 0: 0.3, 5: 0.3, 7: 0.3, 2: 0.25, 9: 0.15 },
    motion: { 5: [0.25, 'down a 5th (II7→V→I)'], 7: [0.1, 'up to V'], 2: [0.1, 'IV→V'] },
    rules: [(ch) => mod(ch.rootPc - K.pc) === 2 && dom7(ch) ? [0.25, 'II7, the country secondary dominant'] : null],
    chords: [[0,0,'maj'],[5,3,'maj'],[7,4,'maj'],[7,4,'7'],[2,1,'7'],[9,5,'m'],[0,0,'6']],
    scales: ['major', 'mixolydian'],
    presets: [
      ['Country: I–IV–V7–I', 'major', [[0,0,'maj'],[5,3,'maj'],[7,4,'7'],[0,0,'maj']]],
      ['Country II7: I–II7–V7–I', 'major', [[0,0,'maj'],[2,1,'7'],[7,4,'7'],[0,0,'maj']]],
      ['Ragtime: III7–VI7–II7–V7', 'major', [[4,2,'7'],[9,5,'7'],[2,1,'7'],[7,4,'7']]]],
    keyChanges: { 1: [1, 'the half-step lift for the last chorus'], 2: [1, 'the whole-step lift'] } },

  rnb: { name: 'R&B / Neo-soul', blurb: 'Lush 9ths, 11ths and 13ths, minor 9 grooves and IV–iii–ii–I walks.',
    qual: { maj9: 0.4, m9: 0.45, m11: 0.35, '9': 0.3, '13': 0.3, maj7: 0.3, m7: 0.35, '11': 0.25, '7sus4': 0.25, '9sus4': 0.3, '69': 0.2, add9: 0.15, maj13: 0.25, m13: 0.2, maj: -0.4, m: -0.3, '5': -0.8 }, other: 0,
    roots: { 0: 0.15, 2: 0.2, 4: 0.2, 9: 0.2, 5: 0.2, 8: 0.1 },
    motion: { 5: [0.2, 'down a 5th'], 2: [0.15, 'a step up'], 10: [0.15, 'a step down'] },
    chords: [[0,0,'maj9'],[4,2,'m7'],[9,5,'m9'],[2,1,'m9'],[5,3,'maj9'],[7,4,'9sus4'],[2,1,'m11']],
    chordsMinor: [[0,0,'m9'],[5,3,'9'],[10,6,'9sus4'],[8,5,'maj9'],[3,2,'maj7']],
    scales: ['major', 'dorian', 'aeolian', 'mixolydian'],
    presets: [
      ['Neo-soul: Imaj9–iii7–vi9–ii9', 'major', [[0,0,'maj9'],[4,2,'m7'],[9,5,'m9'],[2,1,'m9']]],
      ['Walk down: IVmaj7–iii7–ii7–Imaj7', 'major', [[5,3,'maj7'],[4,2,'m7'],[2,1,'m7'],[0,0,'maj7']]],
      ['Royal Road: IVmaj7–V7–iii7–vi7', 'major', [[5,3,'maj7'],[7,4,'7'],[4,2,'m7'],[9,5,'m7']]],
      ['Minor groove: i9–IV9', 'dorian', [[0,0,'m9',8],[5,3,'9',8]]]],
    keyChanges: { 1: [0.6, 'up a half step'], 2: [0.5, 'up a whole step'], 3: [0.4, 'up a minor 3rd'] } },

  gospel: { name: 'Gospel', blurb: 'I→I7→IV, the IV–iv “amen”, passing diminished chords and 7-3-6-2-5-1 walks.',
    qual: { '7': 0.3, '9': 0.3, maj7: 0.25, m7: 0.3, '13': 0.25, dim7: 0.3, maj: 0.1, '6': 0.15, '7s9': 0.15, '9sus4': 0.2, '11': 0.15, m9: 0.2, '5': -0.8 }, other: -0.2,
    roots: { 0: 0.2, 5: 0.3, 4: 0.15, 9: 0.2, 2: 0.15, 7: 0.1, 6: 0.2 },
    motion: { 5: [0.3, 'down a 5th, the gospel circle'], 1: [0.2, 'a chromatic passing chord'] },
    rules: [
      (ch, prev) => prev && prev.rootPc === ch.rootPc && prev.qid === 'maj' && dom7(ch) ? [0.2, 'I→I7 pushes into IV'] : null,
      (ch, prev) => prev && prev.rootPc === ch.rootPc && !prev.q.minor && ch.q.minor && mod(ch.rootPc - K.pc) === 5 ? [0.3, 'IV→iv, the “amen” color'] : null],
    chords: [[0,0,'maj7'],[0,0,'7'],[5,3,'maj7'],[5,3,'m7'],[6,3,'dim7'],[4,2,'m7'],[9,5,'7'],[2,1,'m9'],[7,4,'9sus4']],
    scales: ['major', 'mixolydian'],
    presets: [
      ['Gospel: I–I7–IV–iv–I', 'major', [[0,0,'maj'],[0,0,'7'],[5,3,'maj'],[5,3,'m'],[0,0,'maj']]],
      ['Passing diminished: IVmaj7–♯iv°7–I–VI7', 'major', [[5,3,'maj7'],[6,3,'dim7'],[0,0,'maj7'],[9,5,'7']]],
      ['The 7-3-6-2-5-1 walk', 'major', [[11,6,'m7b5'],[4,2,'7'],[9,5,'m7'],[2,1,'m7'],[7,4,'7'],[0,0,'maj7']]]],
    keyChanges: { 1: [1, 'the half-step “step up” for the vamp'], 2: [0.8, 'up a whole step'], 3: [0.5, 'up a minor 3rd'] } },

  funk: { name: 'Funk', blurb: 'One- or two-chord vamps on dominant 9ths, 7♯9 and minor 7ths.',
    qual: { '9': 0.5, '7': 0.35, m7: 0.35, m9: 0.3, '7s9': 0.35, '13': 0.3, '7sus4': 0.2, '9sus4': 0.2, '11': 0.2, m11: 0.25, maj: -0.3, m: -0.2 }, other: -0.1,
    roots: { 0: 0.4, 5: 0.25, 10: 0.15, 3: 0.1, 7: 0.1 },
    motion: { 5: [0.2, 'the I→IV vamp'], 10: [0.15, 'down a whole step'] },
    chords: [[0,0,'9'],[0,0,'7s9'],[5,3,'9'],[0,0,'m7'],[5,3,'7'],[10,6,'9'],[3,2,'7']],
    scales: ['mixolydian', 'dorian'],
    presets: [
      ['One-chord vamp: I9', 'mixolydian', [[0,0,'9',16]]],
      ['Dorian vamp: i7–IV9', 'dorian', [[0,0,'m7',8],[5,3,'9',8]]],
      ['I7♯9–IV9', 'mixolydian', [[0,0,'7s9',8],[5,3,'9',8]]]],
    keyChanges: { 2: [0.4, 'up a whole step'], 5: [0.4, 'to the IV key'] } },

  reggae: { name: 'Reggae', blurb: 'Simple triads on I, IV, V and vi (or i–♭VII in minor), played on the off-beat.',
    qual: { maj: 0.35, m: 0.3, '7': 0.1, m7: 0.15 }, other: -0.3,
    roots: { 0: 0.3, 5: 0.3, 7: 0.25, 9: 0.2, 2: 0.15, 10: 0.15 }, rootsMinor: { 0: 0.3, 10: 0.3, 5: 0.25, 3: 0.2 },
    motion: { 5: [0.2, 'I→IV'], 7: [0.2, 'up to V'], 2: [0.1, 'a step up'] },
    chords: [[0,0,'maj'],[5,3,'maj'],[7,4,'maj'],[9,5,'m'],[2,1,'m'],[10,6,'maj']],
    chordsMinor: [[0,0,'m'],[5,3,'m'],[10,6,'maj'],[3,2,'maj']],
    scales: ['major', 'aeolian', 'dorian', 'mixolydian'],
    presets: [
      ['Reggae: I–IV–V–IV', 'major', [[0,0,'maj'],[5,3,'maj'],[7,4,'maj'],[5,3,'maj']]],
      ['Minor reggae: i–♭VII', 'aeolian', [[0,0,'m',8],[10,6,'maj',8]]],
      ['Reggae: I–vi–IV–V', 'major', [[0,0,'maj'],[9,5,'m'],[5,3,'maj'],[7,4,'maj']]]],
    keyChanges: { 2: [0.4, 'up a whole step'], 7: [0.3, 'to the V key'] } },

  classical: { name: 'Classical', blurb: 'Common-practice harmony: triads and V7, strong root moves down a 5th, cadences, and no V→IV.',
    qual: { maj: 0.35, m: 0.35, '7': 0.3, dim: 0.2, dim7: 0.25, m7b5: 0.2, maj7: 0.05, m7: 0.05, aug: 0.05 }, other: -0.5,
    roots: { 0: 0.3, 7: 0.3, 5: 0.25, 2: 0.2, 9: 0.15, 11: 0.15, 4: 0.05, 1: 0.1 },
    motion: { 5: [0.35, 'down a 5th, the strongest progression'], 2: [0.2, 'a step up (IV→V, V→vi)'], 9: [0.15, 'down a 3rd (I→vi)'] },
    rules: [
      (ch, prev) => prev && analyze(prev).fn === 'D' && analyze(ch).fn === 'PD' ? [-0.4, ''] : null,
      (ch, prev) => prev && analyze(prev).fn === 'D' && ch.rootPc === K.pc && analyze(ch).fn === 'T' ? [0.3, 'V→I, an authentic cadence'] : null,
      vResolves],
    chords: [[0,0,'maj'],[5,3,'maj'],[7,4,'maj'],[7,4,'7'],[2,1,'m'],[9,5,'m'],[11,6,'dim'],[2,1,'m7'],[1,1,'maj']],
    chordsMinor: [[0,0,'m'],[5,3,'m'],[7,4,'maj'],[7,4,'7'],[2,1,'dim'],[8,5,'maj'],[11,6,'dim7'],[1,1,'maj']],
    scales: ['major', 'harmonic', 'aeolian', 'melodic'],
    presets: [
      ['Authentic cadence: I–IV–V7–I', 'major', [[0,0,'maj'],[5,3,'maj'],[7,4,'7'],[0,0,'maj']]],
      ['I–ii–V7–I', 'major', [[0,0,'maj'],[2,1,'m'],[7,4,'7'],[0,0,'maj']]],
      ['Deceptive cadence: I–IV–V7–vi', 'major', [[0,0,'maj'],[5,3,'maj'],[7,4,'7'],[9,5,'m']]],
      ['Circle of fifths: I–IV–vii°–iii–vi–ii–V7–I', 'major', [[0,0,'maj'],[5,3,'maj'],[11,6,'dim'],[4,2,'m'],[9,5,'m'],[2,1,'m'],[7,4,'7'],[0,0,'maj']]],
      ['Neapolitan: i–♭II–V7–i', 'harmonic', [[0,0,'m'],[1,1,'maj'],[7,4,'7'],[0,0,'m']]]],
    keyChanges: { 7: [0.9, 'to the dominant, the standard first modulation'], 5: [0.6, 'to the subdominant'], rel: [0.9, 'to the relative key'] } },

  baroque: { name: 'Baroque', blurb: 'Triads and V7 over a moving bass, circle-of-fifths sequences, the descending lament and Pachelbel.',
    qual: { maj: 0.35, m: 0.35, '7': 0.3, dim: 0.25, dim7: 0.2, m7b5: 0.15, maj7: 0.1, m7: 0.15 }, other: -0.6,
    roots: { 0: 0.3, 7: 0.3, 5: 0.2, 2: 0.2, 9: 0.2, 4: 0.15, 11: 0.1 },
    motion: { 5: [0.4, 'down a 5th, the circle-of-fifths sequence'], 2: [0.15, 'a step up'], 9: [0.15, 'down a 3rd'], 7: [0.1, 'up a 5th'] },
    rules: [
      (ch, prev) => prev && analyze(prev).fn === 'D' && analyze(ch).fn === 'PD' ? [-0.4, ''] : null,
      (ch, prev) => prev && analyze(prev).fn === 'D' && ch.rootPc === K.pc && analyze(ch).fn === 'T' ? [0.3, 'V→I, an authentic cadence'] : null,
      vResolves],
    chords: [[0,0,'maj'],[7,4,'maj'],[9,5,'m'],[4,2,'m'],[5,3,'maj'],[2,1,'m'],[7,4,'7'],[11,6,'dim']],
    chordsMinor: [[0,0,'m'],[7,4,'maj'],[5,3,'m'],[10,6,'maj'],[3,2,'maj'],[8,5,'maj'],[2,1,'dim'],[7,4,'7']],
    scales: ['major', 'harmonic', 'aeolian', 'melodic', 'dorian'],
    presets: [
      ['Pachelbel’s Canon', 'major', [[0,0,'maj',2],[7,4,'maj',2],[9,5,'m',2],[4,2,'m',2],[5,3,'maj',2],[0,0,'maj',2],[5,3,'maj',2],[7,4,'maj',2]]],
      ['Romanesca: I–V–vi–iii–IV–I–IV–V', 'major', [[0,0,'maj'],[7,4,'maj'],[9,5,'m'],[4,2,'m'],[5,3,'maj'],[0,0,'maj'],[5,3,'maj'],[7,4,'maj']]],
      ['Minor circle of fifths', 'harmonic', [[0,0,'m'],[5,3,'m'],[10,6,'maj'],[3,2,'maj'],[8,5,'maj'],[2,1,'dim'],[7,4,'7'],[0,0,'m']]],
      ['Lament: i–v–iv–V', 'aeolian', [[0,0,'m'],[7,4,'m'],[5,3,'m'],[7,4,'maj']]]],
    keyChanges: { 7: [0.9, 'to the dominant'], 5: [0.6, 'to the subdominant'], rel: [0.9, 'to the relative key'] } },

  romantic: { name: 'Romantic', blurb: 'Rich chromaticism: diminished 7ths, chromatic-mediant moves (I→♭VI, I→III), the Neapolitan.',
    qual: { maj: 0.25, m: 0.25, '7': 0.3, dim7: 0.35, m7b5: 0.25, maj7: 0.15, m7: 0.15, aug: 0.2, '7b9': 0.15, mmaj7: 0.1, '9': 0.1 }, other: -0.3,
    roots: { 0: 0.25, 7: 0.25, 5: 0.2, 8: 0.25, 4: 0.2, 3: 0.2, 9: 0.2, 1: 0.2 },
    motion: { 5: [0.3, 'down a 5th'], 4: [0.25, 'a chromatic-mediant shift up a 3rd'], 8: [0.25, 'a chromatic-mediant shift down a 3rd'], 3: [0.15, 'up a minor 3rd'], 9: [0.15, 'down a minor 3rd'] },
    rules: [(ch, prev) => prev && analyze(prev).fn === 'D' && analyze(ch).fn === 'PD' ? [-0.2, ''] : null],
    chords: [[0,0,'maj'],[8,5,'maj'],[4,2,'maj'],[5,3,'m'],[1,1,'maj'],[11,6,'dim7'],[7,4,'7'],[9,5,'maj']],
    chordsMinor: [[0,0,'m'],[8,5,'maj'],[1,1,'maj'],[11,6,'dim7'],[7,4,'7'],[4,2,'maj'],[5,3,'m']],
    scales: ['major', 'harmonic', 'aeolian', 'melodic'],
    presets: [
      ['Chromatic mediants: I–♭VI–I–III', 'major', [[0,0,'maj'],[8,5,'maj'],[0,0,'maj'],[4,2,'maj']]],
      ['i–iv–vii°7–i', 'harmonic', [[0,0,'m'],[5,3,'m'],[11,6,'dim7'],[0,0,'m']]],
      ['Neapolitan: i–♭II–vii°7–i', 'harmonic', [[0,0,'m'],[1,1,'maj'],[11,6,'dim7'],[0,0,'m']]]],
    keyChanges: { 4: [0.7, 'a chromatic-mediant key (up a major 3rd)'], 8: [0.7, 'a chromatic-mediant key (down a major 3rd)'], 3: [0.4, 'up a minor 3rd'], 7: [0.5, 'to the dominant'], rel: [0.5, 'to the relative key'] } },

  flamenco: { name: 'Flamenco / Spanish', blurb: 'The Andalusian cadence (i–♭VII–♭VI–V) and the Phrygian ♭II→I half-step landing.',
    qual: { maj: 0.35, m: 0.3, '7': 0.2, '7b9': 0.2, m7: 0.05 }, other: -0.3,
    roots: { 0: 0.3, 1: 0.35, 3: 0.2, 5: 0.2, 7: 0.2, 8: 0.25, 10: 0.25 },
    motion: { 11: [0.35, 'down a half step (♭II→I, the Phrygian cadence)'], 10: [0.2, 'down a whole step (the Andalusian descent)'], 1: [0.15, 'up a half step'] },
    chords: [[0,0,'m'],[10,6,'maj'],[8,5,'maj'],[7,4,'maj'],[7,4,'7b9'],[1,1,'maj']],
    chordsPhrygian: [[0,0,'maj'],[1,1,'maj'],[3,2,'maj'],[5,3,'m'],[8,5,'maj'],[10,6,'m']],
    scales: ['phrygian', 'phrygdom', 'harmonic', 'aeolian'],
    presets: [
      ['Andalusian cadence', 'aeolian', [[0,0,'m'],[10,6,'maj'],[8,5,'maj'],[7,4,'maj']]],
      ['Phrygian cadence: iv–♭III–♭II–I', 'phrygdom', [[5,3,'m'],[3,2,'maj'],[1,1,'maj'],[0,0,'maj',8]]],
      ['Rumba: i–iv–V7', 'harmonic', [[0,0,'m'],[5,3,'m'],[7,4,'7',8]]]],
    keyChanges: { 5: [0.5, 'to the iv key'], 3: [0.4, 'to the relative major'] } },

  cinematic: { name: 'Cinematic / Epic', blurb: 'Big minor progressions (i–♭VI–♭III–♭VII), chromatic-mediant shifts and sus colors.',
    qual: { m: 0.35, maj: 0.3, add9: 0.15, sus2: 0.2, sus4: 0.15, '5': 0.1, maj7: 0.05, madd9: 0.15 }, other: -0.25,
    roots: { 0: 0.3, 8: 0.3, 3: 0.25, 10: 0.25, 5: 0.2, 4: 0.15 }, rootsMajor: { 0: 0.3, 8: 0.3, 4: 0.25, 9: 0.2, 5: 0.2, 3: 0.15 },
    motion: { 8: [0.25, 'i→♭VI, the epic drop'], 4: [0.25, 'a heroic chromatic-mediant move'], 3: [0.15, 'up a minor 3rd'], 2: [0.15, 'a rising whole step'] },
    chords: [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj'],[5,3,'m'],[4,2,'maj'],[0,0,'sus2']],
    chordsMajor: [[0,0,'maj'],[8,5,'maj'],[4,2,'maj'],[9,5,'m'],[5,3,'m'],[3,2,'maj']],
    scales: ['aeolian', 'dorian', 'major', 'lydian', 'harmonic'],
    presets: [
      ['Epic: i–♭VI–♭III–♭VII', 'aeolian', [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj']]],
      ['Heroic: I–♭VI–♭VII–I', 'major', [[0,0,'maj'],[8,5,'maj'],[10,6,'maj'],[0,0,'maj']]],
      ['Mystery: i–III (chromatic mediant)', 'aeolian', [[0,0,'m',8],[4,2,'maj',8]]],
      ['Lydian wonder: I–II', 'lydian', [[0,0,'maj7',8],[2,1,'maj',8]]]],
    keyChanges: { 4: [0.6, 'a chromatic-mediant lift'], 8: [0.6, 'a chromatic-mediant shift'], 1: [0.5, 'a half-step lift for the climax'], 3: [0.4, 'up a minor 3rd'] } },

  edm: { name: 'EDM', blurb: 'Looping four-chord minor progressions, sus and add9 colors for the drop.',
    qual: { m: 0.35, maj: 0.3, sus2: 0.2, sus4: 0.15, add9: 0.2, m7: 0.1, madd9: 0.15, '5': 0.05 }, other: -0.3,
    roots: { 0: 0.25, 8: 0.3, 3: 0.25, 10: 0.25, 5: 0.2 }, rootsMajor: { 9: 0.3, 5: 0.3, 0: 0.25, 7: 0.25, 4: 0.1 },
    motion: { 8: [0.2, 'down to ♭VI'], 2: [0.2, 'a rising whole step'], 5: [0.1, 'up a 4th'] },
    chords: [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj'],[5,3,'m'],[0,0,'madd9']],
    chordsMajor: [[9,5,'m'],[5,3,'maj'],[0,0,'maj'],[7,4,'maj'],[0,0,'add9'],[7,4,'sus4']],
    scales: ['aeolian', 'major', 'dorian'],
    presets: [
      ['EDM: vi–IV–I–V', 'major', [[9,5,'m'],[5,3,'maj'],[0,0,'maj'],[7,4,'maj']]],
      ['EDM: i–♭VI–♭III–♭VII', 'aeolian', [[0,0,'m'],[8,5,'maj'],[3,2,'maj'],[10,6,'maj']]],
      ['EDM: i–♭VII–♭VI–♭VII', 'aeolian', [[0,0,'m'],[10,6,'maj'],[8,5,'maj'],[10,6,'maj']]]],
    keyChanges: { 2: [0.4, 'up a whole step for the last drop'], 1: [0.4, 'up a half step'] } },
};

// The document whose genre applies: the song (also while one of its sections is edited) or the progression
const genreDoc = () => (W.edit || S.tab === 'song') ? W.song : W.prog;
const GENRE = () => GENRES[genreDoc().genre] || null;
// Minor-feeling keys use a profile's minor lists (major-feeling keys its major ones) when it has them
function genreRoots(g){ return (!K.majorish && g.rootsMinor) || (K.majorish && g.rootsMajor) || g.roots; }
function genreChords(){
  const g = GENRE();
  if (!g) return [];
  const spec = (g.chordsPhrygian && (S.scale === 'phrygian' || S.scale === 'phrygdom')) ? g.chordsPhrygian
    : (!K.majorish && g.chordsMinor) || (K.majorish && g.chordsMajor) || g.chords;
  return spec.map(([s, l, q]) => mkChord(K.pc + s, K.L + l, q));
}
// How typical a chord (after `prev`) is in the genre: { s, why }. Kept small, so it nudges and never decides alone.
function styleBonus(ch, prev){
  const g = GENRE();
  if (!g || !ch) return { s: 0, why: '' };
  const why = [];
  let s = 0;
  if (prev && prev.rootPc !== ch.rootPc){
    const mv = g.motion[mod(ch.rootPc - prev.rootPc)];
    if (mv){ s += mv[0]; if (mv[0] > 0) why.push(mv[1]); }
  }
  (g.rules || []).forEach(r => { const x = r(ch, prev); if (x){ s += x[0]; if (x[1]) why.push(x[1]); } });
  const qw = ch.qid in g.qual ? g.qual[ch.qid] : g.other;
  s += qw;
  const qn = QMAP[ch.qid].name.toLowerCase();
  if (qw >= 0.3) why.push(`${/(triad|chord)$/.test(qn) ? qn + 's' : qn + ' chords'} are a staple`);
  const rw = genreRoots(g)[mod(ch.rootPc - K.pc)] || 0;
  s += rw;
  if (rw >= 0.3 && !why.length) why.push(`${analyze(ch).rn} is a typical chord`);
  s = Math.max(-0.8, Math.min(0.8, s));
  return { s, why: s > 0.2 && why.length ? `typical in ${g.name}: ${why[0]}` : s < -0.35 ? `unusual in ${g.name}` : '' };
}
// A new section's key in the genre: { s, why }
function genreKeyBonus(kA, kB){
  const g = GENRE();
  if (!g || !g.keyChanges) return { s: 0, why: '' };
  const d = mod(kB.pc - kA.pc), A = makeKey(kA.pc, kA.scale).majorish, B = makeKey(kB.pc, kB.scale).majorish;
  const rel = A !== B && d === (A ? 9 : 3);
  const kc = (rel && g.keyChanges.rel) || (A === B && g.keyChanges[d]) || g.keyChanges['*'];
  return kc ? { s: kc[0], why: `${g.name}: ${kc[1]}` } : { s: 0, why: '' };
}
function genreSelectHTML(id, val){
  return `<label class="fld" title="Steers the suggestions toward the chords and moves typical of a style. Off: suggestions work as usual."><span>Genre guide</span><select id="${id}"><option value="">Off</option>${Object.entries(GENRES).map(([k, g]) => `<option value="${k}"${val === k ? ' selected' : ''}>${g.name}</option>`).join('')}</select></label>`;
}
// A soft note when the key's scale isn't one the genre usually uses, offering its usual modes on the same root
function genreScaleHint(){
  const g = GENRE();
  if (!g || g.scales.includes(S.scale)) return '';
  const opts = g.scales.slice(0, 3);
  return `<div class="banner soft"><span><b>${g.name}</b> is usually in ${opts.map(s => SC[s].name).join(', ')}. Your chords stay the same if you switch.</span>${opts.map(s => `<button class="btn sm" data-act="recenter" data-pc="${K.pc}" data-scale="${s}">${K.notes[0].name} ${SC[s].name}</button>`).join('')}</div>`;
}
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id !== 'genreProg' && t.id !== 'genreSong') return;
  const d = t.id === 'genreSong' ? W.song : W.prog;
  d.genre = t.value || null;
  save(); renderTab();
});
