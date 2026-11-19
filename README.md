# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/allianzero/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/allianzero/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio — turn your photo and a caption into GTA 6-style cover art: multi-panel poster layouts, drag-to-crop photos, sunset / neon / noir colour grades, big condensed display lettering over a procedural Vice City sunset, exported as a PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080. Static files only, works offline in desktop Chrome, your photos never leave your machine.

## Run it

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

Upload a photo (or try the bundled AI-made samples), pick a layout, grade and lettering, type your title, and hit **Export PNG**.

## Layout

- `app/` — the static web app (`index.html`, `style.css`, `src/cover.js` the cover renderer, `src/editor.js` the editor, `src/shots.js` the screenshot scenes, `samples/` three AI-generated sample photos, `fonts/` Noto Sans under the SIL Open Font License)
- `screenshots/` — 4 screenshots taken from the app itself
- `main.ts` — the entry program: copies `app/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

No Rockstar logo, artwork, character or font is used: the sunset, palms, sun and lettering are all drawn or set from scratch, and the fonts are OFL-licensed Noto Sans.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
