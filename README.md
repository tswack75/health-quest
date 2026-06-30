# Health Quest

Health Quest is a local-first iPhone-friendly web app for manual daily health logging with a game layer.

## What It Does

- Logs daily steps manually.
- Logs exercise minutes manually.
- Logs weight and body fat percentage manually.
- Includes normalized food logging with the current meal-v3 model: breakfast, lunch, afternoon snack, dinner, and night snack, while preserving legacy meal-scale history.
- Includes a personalized story engine with daily dispatches, level chapters, region progression, and mini-quests tied to real behavior.
- Converts those into:
  - A daily score
  - XP and levels
  - Current and best streaks
  - Goal bonuses
  - Unlockable custom rewards
- Shows weight and body-fat trends over time.
- Includes a lightweight but persistent campaign-story layer with archive and reward history.
- Saves everything locally in browser storage.
- Includes a visible build version and export timestamp.
- Uses a behavior-weighted scoring model that emphasizes steps, exercise, food structure/control, lighter body-metric bonuses, and now an integrated Strength module.
- Includes a separate `Strength` tab with workout logging and tap-to-open exercise help sheets.
- Includes matching Home A/B/C bodyweight versions for missed gym days, and they count toward strength consistency without replacing gym progression baselines.
- Trend charts now show both raw daily points and a bolder smoothed trend line for easier reading.

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
- Food scoring was updated on April 6, 2026 to a structured five-checkpoint model for new entries going forward. Older food entries remain intact and still appear in history, exports, and trends as legacy data.
- Service worker install/offline support usually requires HTTP or HTTPS, not `file://`.
- The installed PWA is versioned for GitHub Pages updates. New builds bump the visible app version, the manifest URL, the CSS/JS asset URLs, and the service-worker cache name so stale app-shell caches are cleared more reliably. This build is `v4.18.0`.

- Current charts, summaries, XP, streaks, and trend signals are normalized through the active scoring layer instead of relying on older stored score outputs. Raw entries remain unchanged, and `meta.currentScoringVersion` tracks the active scoring rules in use.
- v4.18.0 shifts more scoring weight toward food control, splits snacks into afternoon snack and night snack, and treats night-snack absence as a positive logged outcome when it is recorded intentionally.
- The Strength tab now defaults to an A/B/C 30-minute gym plan, where A and B are the priority two-day-week targets and C is a bonus third day.
- Matching Home A/B/C workouts can be loaded from the Recommended Next Workout card. They count as strength consistency and support strength trends, but gym progression still resumes from the last logged gym numbers.
- Trend Driver now uses normalized scoring and recent directional signals to highlight likely levers such as dinner control, night snacking, and strength consistency without implying certainty or causation.

- Strength logging now keeps a derived `strengthLogs` array alongside the existing workout/session history. It is used for muscle-group trend estimation, e1RM/bodyweight/timed scoring, and backward-compatible progress summaries without breaking older saved workouts.
- The manifest `id` should stay stable so the installed app keeps the same identity and local data container across upgrades. Cache busting should come from asset URLs and the service worker, not from changing the app identity.
- Region thresholds live in `regionThresholds` in [app.js](/C:/Open%20AI%20Codex/health-quest/app.js), and mini-quest XP values live in `miniQuestTemplates` there as well, so later tuning is centralized rather than scattered through render code.
- The service worker uses a network-first strategy for app-shell files, then falls back to cache if offline.
- If a new service worker is waiting, the app can show an in-app refresh/update prompt.
- If the installed PWA still looks old after deploy, open the site in Safari once, then refresh or reopen the installed app.
- Exercise demos live in `assets/exercises/` as local looped media so they stay fast and easy to replace later.
- The workout UI now prefers local `assets/exercises/*.mp4` files first, then `.webm`, then falls back to the bundled local SVG loops if video is missing.
- A helper script at [scripts/fetch-exercise-demos.ps1](/C:/Open%20AI%20Codex/health-quest/scripts/fetch-exercise-demos.ps1) can retry downloads and convert source GIFs into optimized local `.mp4` and `.webm` files later if the source URLs are available.

## Files

- [index.html](/C:/Open%20AI%20Codex/health-quest/index.html): app shell
- [styles.css](/C:/Open%20AI%20Codex/health-quest/styles.css): UI styling
- [app.js](/C:/Open%20AI%20Codex/health-quest/app.js): state, scoring, rewards, graphs, and rendering
- [exercise-help.js](/C:/Open%20AI%20Codex/health-quest/exercise-help.js): strength exercise descriptions, tips, mistakes, and demo paths
- [scripts/fetch-exercise-demos.ps1](/C:/Open%20AI%20Codex/health-quest/scripts/fetch-exercise-demos.ps1): optional utility to fetch and optimize local exercise demo GIFs
- [manifest.json](/C:/Open%20AI%20Codex/health-quest/manifest.json): PWA metadata
- [sw.js](/C:/Open%20AI%20Codex/health-quest/sw.js): offline caching
