# Harmony Bench

An interactive music theory and chord progression app for guitarists, bassists, ukulele players and pianists.

- **Instrument panel**: 6- and 7-string guitar, 4- and 5-string bass, ukulele, baritone ukulele, violin, viola, cello and piano, each with several sounds. Retune any string a half step at a time, add a capo (click the small **actual ⇄** text under the neck to switch to **relative** numbering, counted from the capo like a chord chart; chord charts follow the same choice), use a 15- or 24-fret neck, place finger dots, mute strings, strum, and see the notes and chord name.
- **Playing aids**: a "Solo" highlight that shows the best scale to improvise with over the selected or playing chord (chord tones in color), scale shapes with suggested fingers (see "Scale shapes" below), an outline of where the next chord goes during playback, an easy-capo finder, and a "Pin while scrolling" option that keeps the neck or keyboard on screen.
- **Scales & modes**: 31 scales and modes with their notes, step pattern, intervals and diatonic chords, plus every chord that fits. Compare a scale across all 12 roots.
- **Chord library**: 38 chord types on any root: major, minor, dim, aug, (♭5) also written -5, sus2, sus4, 6, m6, add9, m(add9), 6/9 (6add9), 7, maj7, m7, m7♭5, °7, m(maj7), 7sus4, maj7♯5, 7♯5 (7+5, 7maj5), 7♭5 (7-5), 9, maj9, m9, 9sus4, 11, m11, 13, maj13, m13, altered dominants, and two-note intervals (written as their notes, lower note first, e.g. C–B), so a dyad from a real song's fingering can go into a progression too. Any of them can be a slash chord: pick the **Bass note**. Each type lists the other ways it is written in charts. Playable fingerings are worked out for whatever tuning and capo you set, or piano voicings.
- **Genre guide**: an optional style (Jazz, Metal, Baroque, Pop and 15 more) that steers suggestions, palettes and classic progressions toward that style; off by default.
- **Export one progression or song**: **Export…** next to Save as downloads the open progression or song as it is now (or gives the text to copy), with the custom strumming patterns and saved tunings it uses. Import it with **Backup / transfer… → Import**; you're offered to open it right away.
- **Save as**: lists your saved progressions (or songs) so you can pick one to replace, and if the name you type is already used it asks whether to **Replace** it (with Undo) or **Keep both** (saved as “Name (2)”).
- **Mini player**: while a progression or song plays, scrolling its controls out of view (or switching tabs) brings up a slim bar at the bottom of the screen with Stop, the chord playing and the next one, the bar (and section), tempo − / +, Loop, and ↑ to jump back to the full controls.
- **Voicings per instrument and tuning**: a shape you lock or choose for a chord is remembered for that instrument and tuning. A shape locked in another tuning is still used when the strings it plays are tuned the same (an x32000 Cmaj7 doesn't care what the low string is tuned to). Try the progression on ukulele or in standard tuning and come back to your open tuning: its shapes are still there. Transposing moves all of them.
- **Chord cards**: in the Progression builder, **Names / Charts** switches the cards between chord names and chord charts (mini keyboards on piano) showing the voicing playback uses, or the one you chose (✎). Cards wrap to fit the width; the small **↵** at the top right of a card starts a new line at that chord (to show each section or bar on its own line), and breaks are saved with the progression.
- **Progression builder**: tempo, any time signature (presets or custom, with accent grouping such as 2+2+3), chord lengths in beats or bars, playback styles, transpose, and a voicing choice for each chord. Click Play to start from the selected chord, double-click it to start from the beginning, and click any chord while playing to jump there. Each move between chords is analyzed, next chords are suggested from the whole progression, and substitutions (secondary dominants, borrowed chords, tritone subs) are offered. Select ranges of chords to copy, cut, paste or duplicate, and paste chord charts as text (`| Am | F | C G | E7 |`; common spellings such as C7-5, C7+5, C6add9, C-5, Cmmaj7 and slash chords like Am7/G are understood).
- **Tuner, chord recognition and MIDI keyboard**: a tuner for one note at a time or all strings at once (strum and see every string), a chord recognizer (strum a chord and it is named, shown on the neck and can be added to the progression), using your device's microphone or an audio interface (pick the input and channel), with an adjustable A4 reference. Play a MIDI keyboard through the app: the chord you hold is named and shown, the sustain pedal works, and chords can be added to the progression as you play them. Both need the https address (see "HTTPS" below).
- **Practice and band**: count-in, a speed trainer that raises the tempo each loop, play-along (mute your chords), drums in six styles that follow any time signature, an automatic bass line, and MIDI export (chords, bass and drums) of a progression or a whole song.
- **Print and sheet music**: print a progression or a whole song (or save it as a PDF) with chord diagrams as you voiced them, a bar-by-bar chord chart (optionally with Roman numerals), lyrics, and sheet music. A "Sheet music" button also shows the chords as notation in the app: grand staff for piano, the right clef for each instrument, key signature, time signature, ties and section labels.
- **Song builder**: build songs from sections (verse, chorus, bridge…) with lyrics, arrange them in any order, import saved progressions, and play the whole song. Each section can have its own key, time signature and tempo; the app suggests key changes and transitions (pivot chords, the new key's V7, a borrowed iv, secondary dominants, a lifted final chorus) that you can hear and apply.
- **Saving**: save, save as and open progressions and songs (with names, notes and dates), save your own tunings, and pick up exactly where you left off. When run with Docker (or `node server.js`), saves are stored on the server and shared by every browser and device.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The page: layout and styles |
| `theory.js` | Music theory engine and sound synthesis |
| `app.js` | The interface |
| `playing.js` | Solo scales, scale shapes (3 notes per string and CAGED), next-chord preview, pinned panel, easy-capo finder |
| `band.js` | Count-in, speed trainer, drums, bass line, MIDI export |
| `inputs.js` | Tuner and chord recognition (microphone or audio interface) and MIDI keyboard input |
| `print.js` | Printable chord sheet and the sheet-music view |
| `sections.js` | Song sections with their own key, time signature and tempo; key-change and transition ideas |
| `patterns.js` | Strumming and picking patterns, the pattern editor |
| `analyzer.js` | The analyzer pop-out: where chords outside the key come from, tonicizations, extended dominants and secondary ii–V labels |
| `learn.js` | The Learn tab: lessons with interactive widgets (intervals, scales, chords, circle of fifths, voice leading, chords outside the key, modulation) |
| `examples.js` | Song examples for the Learn tab (chords and analysis only) |
| `genres.js` | Genre guide: style profiles (typical chords, moves, modes, key changes and classic progressions) |
| `vendor/vexflow.js` | [VexFlow](https://www.vexflow.com) 4.2.5, the music-notation library (MIT licence, see `vendor/VEXFLOW-LICENSE.txt`); loaded only when sheet music is shown |
| `docs.js` | Saving and opening, copy/paste, time signatures and the song builder |
| `server.js` | A small server (Node.js, no extra packages) that serves the app over http and https and stores the shared library |
| `Dockerfile`, `docker-compose.yml` | Run it in Docker, Docker Compose or Portainer |

There is no build step and nothing to install besides Node.js (or Docker). The page loads fonts from Google Fonts; everything else is in these files.

**Two ways to host it:**

- **With the server** (Docker, Portainer or `node server.js`, Options D, F and G): your saved tunings, progressions and songs are stored on the server, so every browser and device sees the same library. **Recommended.**
- **As plain files** (GitHub Pages, Nginx, Apache, shared hosting, Options A, B, C and E): the app works fully, but saves stay in each browser separately. Use Backup / transfer to move them.

## Try it on your own computer first

Opening `index.html` directly by double-clicking it works in most browsers. If anything misbehaves, run a tiny local web server instead:

1. Open a terminal in this folder.
2. Run `python3 -m http.server 8000`
3. Open <http://localhost:8000> in your browser.
4. Press `Ctrl+C` in the terminal to stop it.

## Putting it on a server

Pick the section that matches your setup. If you're not sure, see "Not sure what your server runs?" at the end.

### Option A: GitHub Pages (free, no server needed)

1. On GitHub, open this repository and go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**, then click **Save**.
4. Wait a minute or two. The page will be at `https://vmwhelan.github.io/harmony-bench/`.

Every time you push changes to `main`, the site updates automatically.

### Option B: A Linux server with Nginx or Apache

1. Connect to your server: `ssh you@your-server`
2. Get the files onto it:
   ```bash
   cd /var/www
   sudo git clone https://github.com/vmwhelan/harmony-bench.git
   ```
3. Point the web server at that folder.

   **Nginx**: create `/etc/nginx/sites-available/harmony-bench` containing:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/harmony-bench;
       index index.html;
   }
   ```
   Then enable it and reload:
   ```bash
   sudo ln -s /etc/nginx/sites-available/harmony-bench /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

   **Apache**: the simplest option is to put the folder inside your existing web root (often `/var/www/html`). Clone it there instead, and it will be at `http://your-domain.com/harmony-bench/`.

4. To update later:
   ```bash
   cd /var/www/harmony-bench
   sudo git pull
   ```

### Option C: Shared hosting (cPanel, Hostinger, Bluehost and similar)

1. Download this repository from GitHub: **Code → Download ZIP**, then unzip it.
2. In your host's **File Manager** (or an FTP program such as FileZilla), open `public_html`.
3. Make a folder named `harmony-bench` and upload `index.html` and all the `.js` files except `server.js` into it.
4. Visit `https://your-domain.com/harmony-bench/`.

### Option D: Node.js without Docker (shared saves)

1. Make a folder with `server.js` in it, and a `public` folder inside it holding `index.html` and every `.js` file except `server.js`.
2. Run `node server.js` in that folder. It listens on port 8080 (`PORT=9000 node server.js` for another port) and keeps the library in a `data` folder next to `server.js` (`DATA_DIR=/some/folder` to change that).

### Option E: An existing Python app (Flask or Django)

- **Flask**: copy `index.html` and the `.js` files (except `server.js`) into `static/harmony-bench/`. They will be at `/static/harmony-bench/index.html`.
- **Django**: copy `index.html` and the `.js` files (except `server.js`) into one of your `STATICFILES_DIRS` folders, then run `python manage.py collectstatic`.

### Option F: Docker Compose

This repo includes a `Dockerfile` (a small Node.js image with the app and its server) and a `docker-compose.yml`. Your saved library is kept in a Docker volume named `harmony-data`, so it survives restarts, rebuilds and updates.

1. Get the code onto the server (see "Downloading the code to a folder" below), then go into the folder:
   ```bash
   cd ~/music-app
   ```
2. Build and start it in the background:
   ```bash
   docker compose up -d --build
   ```
3. Open `http://your-server:8080`, or `https://your-server:8443` for the tuner and MIDI keyboard (see "HTTPS" below).

Useful commands (run them inside `~/music-app`):

| Do this | Command |
|---|---|
| See if it's running | `docker compose ps` |
| See its log | `docker compose logs -f` (press `Ctrl+C` to stop watching) |
| Stop it | `docker compose down` |
| Update to the newest version | `git pull` then `docker compose up -d --build` |
| Use port 9000 instead of 8080 | `HB_PORT=9000 docker compose up -d --build` (or put `HB_PORT=9000` in a `.env` file in this folder) |
| Use port 9443 instead of 8443 for https | `HB_HTTPS_PORT=9443` (same ways as `HB_PORT`) |
| Back up the saved library to a file | `docker cp harmony-bench:/data/library.json ./library-backup.json` |

### Option G: Portainer

Portainer can pull this repository from GitHub and build it for you.

1. In Portainer, choose your environment (usually **local**), then click **Stacks** → **+ Add stack**.
2. **Name**: `harmony-bench`
3. **Build method**: choose **Repository**.
4. **Repository URL**: `https://github.com/vmwhelan/harmony-bench`
5. **Repository reference**: `refs/heads/main`
6. **Compose path**: `docker-compose.yml`
7. If the repository is **private**, turn on **Authentication**. Enter your GitHub username, and paste a GitHub personal access token as the password. To make a token, go to GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**, give it read-only **Contents** access to this repository, and copy it.
8. Optional, for automatic updates: turn on **GitOps updates**, choose **Polling** and set an interval such as `5m`. Portainer will then rebuild the app whenever you push changes to GitHub.
9. Optional, for different ports: under **Environment variables**, add `HB_PORT` (http, default `8080`) and/or `HB_HTTPS_PORT` (https, default `8443`).
10. Optional: add `HB_HOSTNAMES` with your server's name and/or IP address, for example `192.168.1.50,myserver.local` (see "HTTPS" below).
11. Click **Deploy the stack**.
12. Open `http://your-server:8080` (or the port you chose), or `https://your-server:8443` for the tuner and MIDI keyboard.

To update by hand later: open the stack in Portainer and click **Pull and redeploy**. Your saved library is in the stack's `harmony-data` volume (under **Volumes** in Portainer) and is kept across redeploys. Removing the stack keeps the volume unless you delete it yourself.

## HTTPS (needed for the tuner and MIDI keyboard)

Browsers only allow the microphone, audio interfaces and MIDI devices on secure (`https://`) pages. With Docker or Portainer the app serves both addresses, sharing the same saved library:

- `http://your-server:8080` (or your `HB_PORT`): everything except the tuner and MIDI keyboard.
- `https://your-server:8443` (or your `HB_HTTPS_PORT`): everything.

On first start the server makes its own **self-signed certificate** and keeps it in the data volume (`cert.pem` and `key.pem`), so it stays the same across updates. Because no certificate authority signed it, each browser warns you **once** the first time:

- **Chrome / Edge**: click **Advanced**, then **Proceed to your-server (unsafe)**.
- **Firefox**: click **Advanced…**, then **Accept the Risk and Continue**.
- **Safari / iPhone / iPad**: tap **Show Details**, then **visit this website**, and confirm.

That's expected for a home server; the connection is still encrypted. Do this once per device and browser.

**Optional, `HB_HOSTNAMES`:** list the names or IP addresses you use to reach the server (comma-separated, for example `192.168.1.50,myserver.local`). They are written into the certificate, which some browsers prefer. The certificate is only created once, so if you add or change `HB_HOSTNAMES` later, delete `cert.pem` and `key.pem` from the data volume and restart to make a new one.

**Optional, your own certificate:** if you already have one (for example from Let's Encrypt), copy it into the data volume as `cert.pem` (the full chain) and `key.pem` (the private key) and restart. With Compose:

```bash
docker cp fullchain.pem harmony-bench:/data/cert.pem
docker cp privkey.pem harmony-bench:/data/key.pem
docker compose restart
```

If you already use a reverse proxy (Nginx Proxy Manager, Traefik, Caddy…) that handles HTTPS, point it at port 8080 and ignore 8443.

**Plain-file hosting (Options A–C, E)** needs the web host itself to serve HTTPS (GitHub Pages does).

## Tuner

Click **Tuner** above the neck, then **Start listening** and allow microphone access.

- **Input**: your device's microphone, or an audio interface such as a MOTU M2 or Tascam US-2x2 (plug the guitar or bass into an instrument input with the Hi-Z / INST switch on). Browsers can't use ASIO drivers, but interfaces show up as normal inputs, so pick yours from **Input**. If the list only shows "Default input", click **Start listening** once and allow access; the names then appear.
- **Channel**: **Input 1 (left)**, **Input 2 (right)**, or **Both** mixed. Choose the input your instrument is plugged into.
- **Single note**: play one string at a time. Shows the note, how many cents sharp or flat, the frequency, and which string of your current tuning it is closest to; that string is ringed on the neck in green (in tune), amber (close) or red. Works down to a 5-string bass's low B.
- **All strings**: strum all open strings and let them ring; each string of your current tuning (custom tunings too) gets its own flat/sharp bar, and each string is ringed on the neck by colour. Single note is the more precise of the two.
- **Chord**: strum a chord (or play single notes) and let it ring. After about half a second the chord is named and, on guitar, bass and other fretted instruments, goes on the neck as the fingering that fits what was heard in your current tuning and capo (open tunings and custom tunings too), so the readout, **Strum** and **Replace** work with it. Single notes are placed near where you last played. **+ Add to progression** adds it with that fingering locked; tick **Add each chord I strum to the progression** to write a progression just by playing. **Keep showing the last chord** keeps the name up after the strings stop ringing. Works with any instrument. A clean sound works best: heavy distortion adds notes that aren't there. Octave doublings aren't listed, since they don't change the chord.
- **A4**: the reference pitch (440 Hz is standard).
- **Capo**: with a capo on, the targets are the notes the open strings sound at the capo, so you can touch up tuning with the capo in place.

Turn the input gain up until the level bar moves well when you play, but not so high that the interface's clip light comes on.

## MIDI keyboard

Click **MIDI keyboard** above the neck. Works in Chrome, Edge, Opera and Firefox; Safari does not support MIDI. If the browser refuses, the MIDI panel shows why and how to allow it. **Firefox** on an IP address (like `https://192.168.1.50:8443`) may not offer its MIDI add-on prompt: press Ctrl+I (Page Info) → Permissions → **Access MIDI devices** → untick *Use Default* → **Allow**, then reload. **Chrome/Edge**: site settings (icon left of the address) → *MIDI device control & reprogram* → Allow. Connect the keyboard by USB before or after opening the page; it appears automatically.

- Play and hear the current instrument's sound; the sustain pedal works.
- The chord you hold is named, shown on the keyboard, and highlighted on the neck (with Highlight set to Chord or Solo).
- **+ Add the last chord** adds it to the progression, after the selected chord. Turn on **Add each chord I play to the progression** to build a progression just by playing chords one after another.

## Which key is which (and the key history)

The header's key always says whose key it is, in the small label above it:

- **Explore key** on the **Scales & modes** and **Chord library** tabs. It is only for exploring: changing it (with the header menus or the rows of the Compare table) never changes your progression or song. If it differs from what you are working on, a note at the top of the tab offers **Use the progression's key** (copy it into the explore key) and **Use this key in my progression…**, which asks whether to *keep my chords* (same chords, analyzed in the new key) or *move my chords* (transpose them). Adding a chord from these tabs adds it as you see it, in your progression's own key.
- **Progression key** on the Progression builder, **Song key** on the Song builder, and **Section key: Verse** (for example) while you edit a section's chords.
- Clicking the **Song builder** tab while editing a section closes the section (like **Back to the song**), so the header shows the song's key again.
- A new progression or song starts in the key you were working in. Opening a saved song always uses the song's own key and its sections' keys.
- When the progression's key changes from the header menu, a message says so, with **Undo** (also for a saved progression that becomes a new one). **Whole song − / +** and loading a classic progression have Undo too, and Undo also puts the key back.
- **🕘 Key history** (next to the key) lists every key change, newest first: which key changed (progression, song, a section, or the explore key), from what to what, what happened to the chords (moved, or kept and re-labelled), and what caused it (the header menu, Transpose, Analyze in…, opening a document, Undo…). Tick *Only changes to a progression, song or section key* to hide the rest. A change with no known cause is highlighted: if a key ever seems to change by itself, **Copy as text** and send that along. The history is kept in this browser only (the last 300 changes) and is not part of backups.

## Learn

The **Learn** tab (after Song builder) has short lessons for someone starting from zero, each with something to play with. Terms are explained the first time they appear (hover over a dotted word for a reminder). It uses the explore key in the header, like Scales and the Chord library, so nothing on it changes your progression or song. Pick a lesson on the left (or from the menu on a phone):

1. **Notes as numbers**: the 12 notes on a clock face. Pick two notes to see how many half steps apart they are, the interval's name, its frequency ratio (an octave is 2 : 1, a 5th 3 : 2) and how it sounds, apart and together.
2. **Scales and keys from steps**: build any scale step by step (W W H W W W H for major), see why sharps and flats appear, and hear the modes as the same notes from another starting note.
3. **Chords from stacked thirds**: the 7 chords of the key with their Roman numerals and jobs (tonic, pre-dominant, dominant), as triads or 7ths, each playable.
4. **The circle of fifths**: an interactive circle (major keys outside, relative minors inside). Click a key to see its key signature and its main chords (the shaded wedge) and hear I–IV–V–I; click another to see how far apart they are and how many notes change. The text explains the "math": 7 half steps × 12 visits every note, clockwise is toward the dominant, secondary dominants are one more step clockwise, borrowed chords come from three steps counter-clockwise.
5. **Tension and resolution**: pick a move (V7 → I, vii°7 → I, IV → I, iv → I, V → vi, V7/vi → vi, ♭VII → I, ii → V, or any two chords) and see each voice move on a little piano roll: half steps in red, notes that stay in green. Play each voice alone, only the moving voices, both chords, or a version where the leading tone doesn't resolve, to hear the difference.
6. **Chords outside the key**: reference cards for secondary dominants, extended dominants, secondary leading-tone chords, ii–V of X, secondary subdominants, the rare secondary mediant/submediant/subtonic, ♭VII, borrowed chords, the Neapolitan, tritone substitutes and chromatic mediants: how to build each, an example in C (▶ hear it resolve), how common it is, where it works and when it doesn't, and **Open in analyzer**.
7. **Changing key (modulation)**: pivot chords, going through the new key's V7, the direct "truck-driver" lift and borrowed pivots, with examples to hear, where each goes in a song (into the chorus, the bridge, the last chorus), and a link to the Song builder's key-change ideas.

8. **Songs that break the rules (well)**: short passages from well-known songs, chords only (no lyrics), each showing a chord from outside the key, a chromatic line or a key change: *Eight Days a Week*, *Help!*, *Yesterday*, *In My Life*, *Something*, *Hey Jude*, *Here Comes the Sun* (the Beatles), *Creep* (Radiohead), *Don't Look Back in Anger* (Oasis), *Livin' on a Prayer* (Bon Jovi), and *Jesus, Etc.* and *Heavy Metal Drummer* (Wilco). Each passage is colored like the analyzer (secondary dominants, borrowed chords, brackets where the music visits another key), with ▶ to hear it, notes on what happens and why it works where it is (verse, bridge, coda…), and a tip for your own writing. Click a chord to open it in the analyzer; **Open as a song** loads the example into the Song builder as a new, unsaved song, each section in its own key (for example *Something*'s bridge in A major), so you can play with it. The cards in lessons 6 and 7 link to the matching songs (**Hear it in:**).

   The charts were checked against at least two published sources each (chord sheets and analyses such as Alan W. Pollack's "Notes on" series); songs whose charts the sources disagreed on were left out. They are simplified and the bar lengths are approximate.

You can also open the tab directly with `#learn` at the end of the address.

## The analyzer (chords outside the key)

The analyzer is a panel that opens on the right (at the bottom on a phone) and explains where a chord comes from. It floats over the page, so nothing behind it moves, and it never changes your chords. Close it with **×** or **Esc**. Open it with:

- **Analyze…** above the Progression builder's chords: the whole progression.
- **Why?** on any row of *What could come next* or *Substitutions and approaches*: the progression as if you had added or swapped that chord.
- The chord's description in the detail panel (**Analyze ›**): the selected chord.

**Progression view.** Every chord is outlined by where it comes from: in the key (grey), *secondary* (red: borrowed for a moment from the key of another chord, like a secondary dominant), *borrowed* (purple: from the parallel major or minor, "modal mixture") or *chromatic* (gold). Brackets above the chords mark the spans that visit another key and say which (**→ E minor**), including chains of dominants. The line below is the function flow (T tonic, PD pre-dominant, D dominant, ★ outside color). Click a chord for its details.

**Chord view.** The home key's chords and the key the chord comes from, lined up on one ruler so the same root sits in the same column (C major's C Dm Em F G Am B° above E minor's C D Em F♯° G Am B7): shaded chords are in both keys, the chord is outlined in red and the chord it points at in blue. Below that, each of the chord's notes checked against the home key, with the ones from outside explained ("D♯: the leading tone of E, E minor's raised 7th"); how each voice moves from the chord before and into the chord after (half steps highlighted, notes that stay in green); ▶ buttons to hear the chord, the chord in context, and the chord in its own key (B7 → Em); and what it is, why it works, where it is typically used (turnarounds, pre-choruses, before a cadence) and when it doesn't work.

**More secondary functions.** Labels now read chords in context: a chain of dominants is labelled as extended dominants (A7 → D7 → G7 → C is V7/V/V → V7/V → V7 → I), and a minor 7th that leads into a secondary dominant is its ii (Am7 → D7 → G is ii7/V → V7/V → V, even though Am7 is in the key). Chords that belong to another chord's key are labelled as tonicizations (ii/V, IV/V; rarer ones such as iii/V, vi/x, ♭VII/x are marked rare). The palette's *Secondary dominants* row now also has the leading-tone chords (vii°7/x), and *Substitutions and approaches* offers a vii°7 of the chord and an extended-dominant chain into it, next to its V7 and ii–V.

## Keys in the Song builder

- The key in the header belongs to whatever you are working on: the **progression** (Progression builder), the **song's home key** (Song builder), or a **section** while you edit its chords; the Scales and Chord library tabs have their own explore key (see above). Switching tabs never changes anyone's chords.
- Each section has its own **Key**, **Time** (time signature) and **Tempo** fields. Changing a section's key asks whether to *move the chords* (transpose, same Roman numerals) or *keep the chords* (only analyze them in the new key). Empty Time/Tempo means the song's.
- **Keep every section in the song key**: when on, changing the header key moves every section with it. When off (the default), sections keep their keys, and any section not in the song key is marked in red with **Match to …** (move it into the song key) and **Keep …** (it's a deliberate key change).
- **Playing from anywhere**: click a section's name in the Arrangement to start the song there (it's outlined), then Play; double-click Play to start at the beginning. While the song plays, clicking a section jumps to it, and clicking any chord in the song sheet plays from that chord.
- **Whole song − / +** moves the whole song a half step, every section from its own key, so key changes stay intact.
- **Key changes and transitions** lists ideas for each move between sections (the new key's V7, pivot chords both keys share or, when they share none, a chord borrowed from the parallel key, stronger returns), how to get back to the song key, and **where the song could go next** after its last section: the closely related keys, how many chords they share, what the last chord already is there, and a path in (▶ plays it; **+ Section in …** adds a section in that key). ▶ plays a move; **Apply** changes the song (Undo is in the message that appears).
- Suggestions are played the way you'd play them: chords already in the progression in their locked (✎) or automatic voicing, and the suggested chord in the shape closest to the chord before it. Easy changes (fingers that stay put) rank a little higher and are marked; a suggestion you add, swap in or insert keeps the shape you heard, locked.
- Suggestions also consider the bass line: an inversion (slash chord) is suggested when its bass stays put or moves by a step and then steps into the next chord's bass, e.g. B → **G7/B** → C ("B stays in the bass and steps up a half step to C").
- **What could come next** is for the selected chord: in the middle of the progression its button reads **Insert after …** and puts the chord right there; at the end it reads **+ Add**. Everything else you add goes to the end.
- When the selected chord is the last one of a song section, "what comes next" and the swaps look at the next section's first chord; swaps marked **Swap: leads on** replace the chord with one that leads into it (for a key change, the new key's V7 or a pivot chord).
- **Editing a section's chords** shows where it comes from and where it goes: the previous section's last chord and key, how the first chord follows it, the best first chords after it (**Start with it**), changes to the end of the previous section, and the move out into the next section.
- Saving a progression and then changing its key or scale turns it into a new, unsaved progression, so **Save** can't overwrite the saved one.


**Key analysis in the Song builder.** Each section shows the same analysis as the Progression builder (open **How it works** for the tension chart and how its phrases end). If a section's chords sound centered somewhere other than its key (a verse in C major that really lives on G), it offers **Analyze in G major**, which re-labels just that section with the same chords and voicings. If the whole song sounds centered elsewhere, a note at the top offers to change the song key, re-labelling every section that's in the song key. Both have Undo. A song that spends many bars on IV (C in G major), or ends on it, isn't re-read as another mode of the same notes (C Lydian) while each of its sections still sounds at home in the song key: ending on IV is an open ending, not a new home.
## Strumming and picking patterns

Set **Style** to **Rhythm / pattern** and pick a **Pattern** (Progression builder, or the Song builder for the whole song). **Auto** is the original rhythm that follows the time signature's accents.

- **Strumming**: quarter-note downs, eighths, campfire ("old faithful", D-DU-UDU), folk rock, island, backbeat chuck, rock eighths, palm-muted chug, gallop, shuffle (swung), boom-chick, reggae skank, ska upstrokes, funk and pop sixteenths, waltz and 3/4 strums, 6/8 and 12/8 patterns.
- **Fingerpicking**: Travis picking, arpeggios, folk pinch, ballad picking, p-i-m-a, bossa nova, Alberti, 3/4 and 6/8 arpeggios.
- With a **Genre guide** on, that style's typical patterns are listed first.
- **▶** plays a bar of the pattern on the selected chord; **✎** opens the editor.
- **Restart the pattern on each chord**: normally a pattern runs across the bar, so three chords in one bar share one pass of it. Tick this (next to the Pattern menu) to start the pattern over at every chord change, playing as much as fits. It's saved with the progression or song, and each song section can override it (**Pattern restarts**: song setting, on each chord, or across the bar).
- **Song sections** can each have their own pattern (the **Pattern** menu on the section, next to its tempo): a fingerpicked verse and a strummed chorus, for example. "Song pattern" uses the song's.
- **Make your own**: pick any pattern under **Start from** to use it as a template (its steps, meter, steps per beat and swing load into the editor), or start blank. In the editor, click a grid cell to cycle D (down), U (up), x (muted chuck), B (bass), b (alternate bass), p (pick the top strings), T (pinch); type for the rest (d u soft, c chop, P palm-muted, 1–4 one string from the top, - rest). Set the meter, steps per beat (eighths, triplets, sixteenths) and swing. Your patterns are saved with your library (synced to your server and in backups).
- Patterns play on guitar, ukulele and other fretted instruments and on piano (strums become chord hits); bass and bowed strings keep their own parts. MIDI export plays the pattern too.

## Scale shapes

With the **Scale** or **Solo** highlight on, **Scale shapes** (above the neck) shows one shape at a time instead of the whole neck. Shapes are picked by shape and starting point, not by fret, so the same choice stays selected when you change key and simply moves on the neck.

- **3 notes per string** (2 for pentatonic scales): choose the note it starts on (Root, 2nd, ♭3rd…) and the string it starts on (6th, 5th, 4th…). The shape climbs to the top string and also fills the strings below. It works in any tuning; a dropped string gets an extra note where needed.
- **CAGED**: the five textbook boxes, C, A, G, E and D, about four frets wide (a note between two strings is reached with a one-fret stretch). Minor keys, modes and pentatonics use the shapes of their relative major (A minor pentatonic uses C major's shapes). Needs standard tuning (moved up or down is fine, and 7-strings work).
- **◀ ▶** move the shape to its other places on the neck (an octave up or down) and show its frets; with a capo the frets are counted the way the neck's numbers are (actual frets or from the capo). On a phone the neck scrolls to the shape.

## Genre guide

Pick a style under **Genre guide** in the Progression builder (or the Song builder, for a whole song) to steer the suggestions toward what that style typically uses: Pop, Rock, Metal, Punk, Blues, Jazz, Bossa nova, Folk, Country, R&B / Neo-soul, Gospel, Funk, Reggae, Classical, Baroque, Romantic, Flamenco / Spanish, Cinematic / Epic or EDM.

- **What could come next** gets a **Typical in …** group, and every suggestion that fits the style says why (for example "typical in Jazz: down a 5th, the ii–V–I chain"). Nothing is hidden; chords the style rarely uses just move down the list.
- The chord palette starts with the style's typical chords, substitutions are ordered for the style, and **Load a classic** lists the style's classic progressions first.
- If the key's scale is unusual for the style (Metal in a major key, say), a note offers the usual modes on the same root; your chords stay the same.
- In the Song builder the style also shapes the key-change ideas (Pop: the last-chorus lift up a half or whole step; Classical: to the dominant or relative key), and sections being edited follow the song's style.
- The style is saved with each progression and song. **Off** (the default) leaves every suggestion exactly as before.

## Printing and sheet music

On the **Progression builder** (under the timeline) or the **Song builder** (next to the song sheet):

- **Sheet music** shows or hides the notation. Guitar and bass are written an octave higher than they sound, as is standard; piano uses a grand staff; viola uses the alto clef and cello the bass clef.
- **Print / PDF…** lets you pick what goes on the page (chord diagrams, chord chart, Roman numerals, lyrics, sheet music), then opens your browser's print window. To make a PDF, choose **Save as PDF** (or "Microsoft Print to PDF") as the printer.

The diagrams use the voicing you chose for each chord (or the one playback would use), for your current instrument, tuning and capo.

## Downloading the code to a folder (for example `~/music-app`)

**If `~/music-app` does not exist yet** (the usual case):

```bash
git clone https://github.com/vmwhelan/harmony-bench.git ~/music-app
```

**If `~/music-app` already exists and has files in it**, connect that folder to this repository:

```bash
cd ~/music-app
git init
git remote add origin https://github.com/vmwhelan/harmony-bench.git
git fetch origin
git checkout -b main --track origin/main
```

If that last command complains that files "would be overwritten", those files have the same names as files in the repo. Move them somewhere else first, or let the repo's versions replace them with `git checkout -f -b main --track origin/main`.

**If the repository is private**, Git will ask for a username and password. Enter your GitHub username, and paste a personal access token as the password (GitHub no longer accepts your account password here). Step 7 of the Portainer section explains how to make a token.

To get updates later:

```bash
cd ~/music-app
git pull
```

## Not sure what your server runs?

Connect with `ssh` and try these commands. Whichever one prints a version tells you what you have:

```bash
nginx -v              # Nginx  → Option B
apache2 -v            # Apache (Debian/Ubuntu) → Option B
httpd -v              # Apache (CentOS/Fedora) → Option B
node -v               # Node.js → Option D (or F if Docker is there too)
docker --version      # Docker → Option F or G
```

If you only have a control panel and no command line, use Option C. If you already use Portainer, use Option G.

## Where your saved work is kept

Saved work is never part of the code: `library.json` lives only in the server's data folder (the `harmony-data` Docker volume, or `data/` next to `server.js`), which is excluded from Git (`.gitignore`) and from the Docker image (`.dockerignore`). Publishing the repository or the image shares the app, not anyone's progressions, songs or settings.

**With the server (Docker, Portainer or `node server.js`):** saved tunings, progressions and songs are stored on the server, in `library.json` inside the data volume, and every browser and device that opens the app shares them. Each browser also keeps a copy, so if the server is briefly unreachable you can keep working; changes sync when it is back. The file bar shows the status: **Library on your server**, **Saving to server…** or **Server unreachable**. The first time you open the server version, anything saved earlier in that browser is uploaded automatically.

This is **single-user**: there are no accounts or passwords, and anyone who can open the app can see and change the library. Keep it on your home network, or put it behind a login (for example a reverse proxy with a password) before exposing it to the internet.

**As plain files (no server):** saves stay in the browser you use, on that device. Another browser starts empty, and clearing the browser's site data erases them.

Either way, **Backup / transfer…** (on the Progression builder and Song builder tabs) saves everything to one `.json` file you can keep, and imports one back. Importing adds new items and updates older ones; it never deletes anything.

What is *not* shared between devices: the page as you left it (open tab, current unsaved progression, instrument settings) and the chord clipboard. Those stay per browser.

## Notes

- Sound starts after the first click (browsers block audio until you interact with the page).
- Keyboard shortcuts: `Space` plays or stops the progression, `S` strums the neck, `1`–`7` play the chords of the current key.
- HTTPS is needed for the tuner and MIDI keyboard (see "HTTPS" above); everything else works over plain HTTP.
- In the claude.ai preview the tuner, MIDI keyboard, downloads and printing are blocked by the preview's sandbox; use your server for those.
