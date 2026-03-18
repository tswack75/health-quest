# Health Quest

Health Quest is a local-first iPhone-friendly web app for manual daily health logging with a game layer.

## What It Does

- Logs daily steps manually.
- Logs exercise minutes manually.
- Logs weight and body fat percentage manually.
- Includes quick food intake logging for `morning`, `lunch`, `afternoon`, `dinner`, and `other`.
- Converts those into:
  - A daily score
  - XP and levels
  - Current and best streaks
  - Goal bonuses
  - Unlockable custom rewards
- Shows weight and body-fat trends over time.
- Includes a lightweight campaign-story layer.
- Saves everything locally in browser storage.

## Important Apple Limitation

This is a web app, not a native App Store app, so it uses manual entry instead of live HealthKit access.

## Run

1. Quickest path: open [index.html](/C:/Open%20AI%20Codex/health-quest/index.html) in a modern browser.
2. Better app-like path: serve the folder locally with a small web server, then open it in Safari or another browser.
3. Enter your daily numbers and save.

## iPhone Use

If you host this folder somewhere accessible from Safari:

1. Open the app in Safari on your iPhone.
2. Use Share -> Add to Home Screen.
3. Launch it like an app.

## Notes

- Direct Apple HealthKit access requires a native iPhone app. This version is manual-entry by design.
- Service worker install/offline support usually requires HTTP or HTTPS, not `file://`.

## Files

- [index.html](/C:/Open%20AI%20Codex/health-quest/index.html): app shell
- [styles.css](/C:/Open%20AI%20Codex/health-quest/styles.css): UI styling
- [app.js](/C:/Open%20AI%20Codex/health-quest/app.js): state, scoring, rewards, graphs, and rendering
- [manifest.json](/C:/Open%20AI%20Codex/health-quest/manifest.json): PWA metadata
- [sw.js](/C:/Open%20AI%20Codex/health-quest/sw.js): offline caching
