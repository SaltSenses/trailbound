# Trailbound

Live app: https://saltsenses.github.io/trailbound/

## Version 0.2 additions

A bundled Canada index currently contains 1,541 named OpenStreetMap hiking/foot/walking route relations. Search by route name/operator, filter approximate geographic areas, load geometry while online, save it offline and choose Begin hike. This is not all Canadian trails or an AllTrails catalog. Routes absent from OSM relations, unnamed routes, some nested relation geometry and current closures are not covered. Transboundary routes can extend outside Canada. Source data: public/data/canada.json, © OpenStreetMap contributors, ODbL 1.0. The catalog is cached offline; undownloaded route geometry requires the public Overpass service, which has no uptime guarantee.

Refresh the bundled index with `node scripts/update-catalog.mjs`, review the result, run tests and commit/publish the changed dataset. It performs one country-level index request; avoid repeated bulk requests. Broader coverage needs additional licensed government/park datasets and deduplication.

### Automatic app updates

Every push to main runs tests and publishes via GitHub Pages. The workflow stamps the service-worker cache with the full commit SHA so each deployed version is detected without manual version edits. The online app checks on open, on reconnect, on return to the foreground and every 30 seconds while visible. A complete new offline shell must download before activation. It reloads automatically, except while a hike recording is active; then it waits until the hike is saved. Offline devices keep the last installed version until online. Deployment and CDN propagation take time, so changes cannot be instantaneous. Changes in unsaved form fields can be lost during an automatic refresh.


An independent, installable hiking MVP for Windows/laptop and Android. Plain JavaScript modules, IndexedDB, a service worker and static hosting. No ChatGPT account, subscription, production API key or server database is required. The working title can be changed before launch.

## Run now on your laptop

Install Node.js LTS from https://nodejs.org if needed. Open a terminal in this folder:

```sh
npm start
```

Open http://localhost:4387 in Chrome or Edge. Keep the terminal open while serving locally. Use the browser's install command to install the app. Once its application cache is ready, the installed app can reopen offline; for a fresh browser or a cleared cache, start the server again. Do not open index.html directly as a file.

## What works

- Import GPX tracks/routes (multiple segments preserved), view route geometry offline, search and filter by recorded distance/ascent.
- GPS recording while the app is visible, with automatic draft saving and recovery after an interruption. Weak positions above 60 m reported accuracy are skipped. GPS accuracy and elevation vary by device.
- GPX export, full JSON backup/restore, persistent local routes and saved plans.
- Deterministic time estimates and packing guidance, plus optional genuine AI responses from an independently installed local Ollama model.
- Responsive UI and an Android/laptop install manifest. No analytics, proprietary trail database or paid service dependency.

## Important limits of version 0.1

This is a useful personal MVP, not a completed AllTrails replacement. Its initial Canadian OSM catalog is incomplete. It has no terrain/basemap downloads, automatic route generation, verified trail conditions, cloud sync, live weather, offline mobile AI model, turn-by-turn directions, emergency dispatch or reliable background recording. The sample route is fictional and is explicitly labeled. Discovery now includes the bundled mapped Canadian route index and filtering your saved routes.

Routes show north-up geometry, not geographic context. Missing elevation produces zero **recorded** ascent; that does not mean a trail is flat. Estimates do not assess trail safety. Do not rely on a browser recording while the phone is locked. A native Android foreground location service is the next implementation step for reliable background tracking.

## Publish at your own stable URL

1. Create a **public** GitHub repository in your account named `trailbound`. Do not upload location backups or private GPX files.
2. Push this folder's contents to its `main` branch. Example:

   ```sh
   git init -b main
   git add .
   git commit -m "Build Trailbound offline hiking MVP"
   git remote add origin https://github.com/YOUR-USERNAME/trailbound.git
   git push -u origin main
   ```

3. GitHub repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. Actions → Test and deploy Trailbound → Run workflow if the first run occurred before Pages was enabled.
5. Wait for success, then use the URL returned by the deployment (normally `https://YOUR-USERNAME.github.io/trailbound/`). Do not assume publication until that succeeds.
6. On Android, open the URL in Chrome, wait for Settings → Offline readiness to confirm the cache, then choose Install app/Add to Home screen. Open it once, import your routes, switch to airplane mode and verify your actual routes open before leaving.

Public hosting publishes **source and app assets**, not records stored on your device. Each browser/origin has separate storage; changing the hosting URL does not automatically migrate data. Export a backup first, open the new URL and restore it.

GitHub Pages for a public repository is the intended free deployment. A custom domain is optional and costs extra. No paid map subscription is used because this MVP does not download basemaps. HTTPS is required for phone GPS and service workers. If GitHub workflow administration is unavailable to an agent, you must perform the Pages setting step yourself.

## Local AI on your laptop

Optional; all non-AI features work without this. Install Ollama from https://ollama.com and download a model compatible with your hardware, for example:

```sh
ollama pull llama3.2:3b
```

The download requires internet and several GB of storage; model inference uses your own RAM/CPU/GPU. Configure Ollama to allow the local app origin, then restart Ollama. On Windows PowerShell, before starting a new Ollama server:

```powershell
$env:OLLAMA_ORIGINS = 'http://localhost:4387'
ollama serve
```

Quit the existing tray server first if the port is occupied. Avoid wildcard origins. Run Trailbound via `npm start`; Settings defaults to `http://localhost:11434` and model `llama3.2:3b`. Ask a question in Trip studio. Requests go directly from the browser to your configured server, with route name/statistics and the most recently generated plan. GPS coordinate arrays are not included in AI requests.

Hosted HTTPS pages may be blocked from reaching a local HTTP server by browser policy. Use the local laptop URL rather than weakening browser security. Android localhost refers to Android; this does not provide offline phone AI. Do not expose an unauthenticated Ollama server to the internet. Actual model inference must be verified after Ollama is installed; it is not bundled with this app.

## Update, maintain and recover

- Run `npm test` and `npm run check` before every change. The Pages workflow runs both before deploying.
- Commit changes, push to main, and confirm the Actions deployment succeeded. The deployment workflow versions offline assets automatically. Keep the online app visible for up to 30 seconds after deployment; it will refresh once the new cache is ready. Active hike recordings defer refresh until finished.
- Back up in Settings weekly and before updates. Keep an encrypted copy outside this device. Test restoring into a separate browser profile. Backups include location history; never commit them to GitHub.
- Clearing browser data removes routes/plans. Request durable storage, but still maintain backups. There is no central database to recover your private records from.
- Roll back with `git revert` and deploy the resulting commit. Preserve IndexedDB database version/schema during a rollback. Future database migrations need backup/restore verification.
- Keep the static app dependency-free unless a feature needs a library. Review GitHub Actions versions periodically. No build dependencies are installed by this project.

## Architecture and expansion

`public/core.js`: pure route validation, statistics, filtering, plan estimates and GPX export. `app.js`: UI, IndexedDB transactions, GPX XML import, recording and local AI client. `sw.js`: versioned same-origin offline shell. `server.mjs`: development-only loopback server. `tests/`: Node tests. `public/` can be served by any static HTTPS host; it has no Sites or ChatGPT runtime dependency.

Prioritized next releases:

1. Native Android wrapper with an Android foreground location service, permission lifecycle, recording notifications and real-device battery/background tests. A wrapper alone does not solve background GPS.
2. Licensed trail data and MapLibre/PMTiles offline basemaps with download size controls, attribution, storage quotas and offline verification. Do not bulk-download public OpenStreetMap tiles or scrape AllTrails.
3. User accounts and optional device sync through a small authenticated API and PostgreSQL; add conflict handling, encryption policy, deletion/export tools and automatic database backups.
4. AI service behind an authenticated server with provider secrets, rate limits and cost caps; optional on-device model runtime evaluated against actual Android hardware. AI must distinguish recorded facts from suggestions.
5. Live trail discovery, weather and official closure sources, with provenance, timestamps and explicit stale/offline state.

External accounts needed: GitHub for source and Pages. Optional: domain registrar for a custom URL; AI provider only if cloud AI is added; Google Play developer account only if distributing a native APK through Play. No API keys are needed for this release.

