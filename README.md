# Health Quest

Health Quest is a local-first iPhone-friendly web app that turns Apple Health exports into a simple habit game.

## What It Does

- Imports Apple Health `export.xml` files directly in the browser.
- Aggregates steps, exercise minutes, walking/running distance, flights climbed, sleep, and mindfulness sessions.
- Includes quick food intake logging for `morning`, `lunch`, `snack`, `dinner`, and `other`.
- Converts those into:
  - Daily quest progress
  - A points score
  - Current and best streaks
  - Levels
  - Unlockable badges
- Saves everything locally in browser storage.

## Important Apple Limitation

This is a web app, not a native App Store app, so it does **not** connect directly to HealthKit on iPhone.

The practical privacy-friendly web flow is:

1. Export Apple Health data from the Health app.
2. Unzip the export if Apple gives you a `.zip`.
3. Open this app and choose `export.xml`.

## Run

1. Quickest path: open [index.html](/C:/Open%20AI%20Codex/health-quest/index.html) in a modern browser.
2. Better app-like path: serve the folder locally with a small web server, then open it in Safari or another browser.
3. Optionally tap **Load Demo Data** to try the app.
4. Import your Apple Health `export.xml`.

## iPhone Use

If you host this folder somewhere accessible from Safari:

1. Open the app in Safari on your iPhone.
2. Use Share -> Add to Home Screen.
3. Launch it like an app.

## Notes

- Direct Apple HealthKit access requires a native iPhone app. This version uses Apple Health exports instead.
- Service worker install/offline support usually requires HTTP or HTTPS, not `file://`.

## Files

- [index.html](/C:/Open%20AI%20Codex/health-quest/index.html): app shell
- [styles.css](/C:/Open%20AI%20Codex/health-quest/styles.css): UI styling
- [app.js](/C:/Open%20AI%20Codex/health-quest/app.js): import, parsing, scoring, rendering
- [manifest.json](/C:/Open%20AI%20Codex/health-quest/manifest.json): PWA metadata
- [sw.js](/C:/Open%20AI%20Codex/health-quest/sw.js): offline caching
