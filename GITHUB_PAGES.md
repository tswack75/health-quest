# Publish To GitHub Pages

This app is already set up to work as a static GitHub Pages site.

## 1. Create a GitHub repo

On GitHub.com:

1. Sign in.
2. Click **New repository**.
3. Name it something like `health-quest`.
4. Keep it public for the easiest GitHub Pages setup.
5. Create the repo without adding extra files if GitHub asks.

## 2. Upload these files

Upload everything from this folder:

- [index.html](/C:/Open%20AI%20Codex/health-quest/index.html)
- [styles.css](/C:/Open%20AI%20Codex/health-quest/styles.css)
- [app.js](/C:/Open%20AI%20Codex/health-quest/app.js)
- [manifest.json](/C:/Open%20AI%20Codex/health-quest/manifest.json)
- [sw.js](/C:/Open%20AI%20Codex/health-quest/sw.js)
- [.nojekyll](/C:/Open%20AI%20Codex/health-quest/.nojekyll)

You can do this in one of two ways:

### Option A: Drag and drop on GitHub

1. Open your new repo on GitHub.
2. Click **Add file**.
3. Click **Upload files**.
4. Drag all files from this folder into the browser.
5. Commit the upload.

### Option B: Use git on your computer

From inside this folder:

```powershell
git init
git add .
git commit -m "Initial Health Quest app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/health-quest.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## 3. Turn on GitHub Pages

In your GitHub repo:

1. Go to **Settings**.
2. Click **Pages** in the left sidebar.
3. Under **Build and deployment**, set:
   - **Source** = `Deploy from a branch`
   - **Branch** = `main`
   - **Folder** = `/ (root)`
4. Save.

GitHub will give you a site URL like:

`https://YOUR-USERNAME.github.io/health-quest/`

## 4. Open it on your iPhone

1. Open that URL in Safari on your iPhone.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Open it from your Home Screen like an app.

## Notes

- Your daily logs, rewards, and app state are stored in browser storage on that device.
- If you later update the app on GitHub, GitHub Pages republishes it automatically.
- If you use the app on both your computer and iPhone, the saved data will not automatically sync between them.
