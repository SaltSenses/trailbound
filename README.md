# Trailbound

## Version 0.7: regional offline maps, expanded paths and Android recorder

Live map → Offline maps & expanded local trails downloads a bounded OSM vector region, or one of the ready-made Canadian packs, into IndexedDB. Each region adds real named path segments to discovery and can be exported/imported independently. The map renderer is bundled locally; the regional 2D basemap has roads, paths, streams, standalone water/land-cover polygons and buildings. It needs no streamed tiles, glyph fonts or sprites. Major multipolygons, terrain contours and offline 3D relief are not included. Tap mapped features to read their names. Offline mode and the last map view persist.

The `android/` project packages the app assets and implements a location foreground service, ongoing notification and SQLite recording independent of WebView visibility. See `android/README.md` for builds, signing, installation, backups and phone validation. A PWA installation cannot provide this service.

## Earlier version 0.5 features

The supplied Alberta CSV and KML were reconciled field by field. All **114** entries are included in `public/data/destinations.json`: **13 sourced coordinate pins** and **101 search/research entries without coordinates**. Access restrictions, coordinate confidence, approach references and overnight notes are retained. The claims in those files have not been independently reverified. Missing coordinates and missing source URLs remain missing. No place is given an invented pin. Built-in records are cached with the offline shell.

Live map starts over Alberta and shows numbered hike clusters. Click a count to list **every indexed hike in the cluster**, including pagination; Show viewed area returns to viewport discovery. Route previews are drawn automatically from the installed pack at zoom 7+, up to 120 previews in a view. Preview geometry is simplified; open a hike for the exact saved geometry. The map catalog remains incomplete. Purple pins are destinations, blue pins are staging candidates.

Destinations → Details & hike planning preserves the source notes and offers nearby indexed hikes, an optional online search for mapped parking/trailhead candidates and terrain-aware draft generation. Nearby distances are straight-line distances to route centres, not connecting hikes. Parking candidates explicitly tagged private/no-access are excluded; the remaining candidates are **not verified legal parking, open trailheads, or available spaces**. Lookups are cached on device. If providers are unavailable, Offline route endpoints to research can use the bundled geometry. These endpoints are explicitly not verified parking or trailheads and may be remote junctions or summits. Overpass providers may time out; the UI reports the failure and retains cached data.

Add a personal destination by latitude/longitude, a coordinate-bearing map URL or a click on Live map. Text-only names, shortened links and unlocated research leads are not automatically geocoded. Personal pins are stored locally and included in backups; built-in records stay intact.

Draft generation sends the chosen start/destination to BRouter using its published `hiking-beta` profile, which uses mapped ways and elevation costs. It does not synthesize safe cross-country paths from topography. Restricted/closed/patrol/staff/guided-only entries disable automatic routing. Disconnected or failed requests do not become straight lines. Routes snapping more than 250 m away from either chosen endpoint are rejected. Successful routes retain a DRAFT name and provenance, including start/end snapping gaps, and can be saved/exported offline. Access, hazards, route suitability and all unmapped final approaches still need verification.

External services: https://github.com/abrensch/brouter and https://brouter.de/brouter/profiles2/ ; OpenStreetMap Overpass providers listed at https://wiki.openstreetmap.org/wiki/Overpass_API . No API key is required by these public endpoints; availability is not guaranteed. Automatic routing requires internet.

Importer: `python scripts/import-destinations.py SOURCE.csv SOURCE.kml` checks every CSV field against KML ExtendedData before producing the JSON catalog. Do not bulk-geocode research leads or silently upgrade coordinate confidence.

## Version 0.4: built-in offline route pack

The app now bundles compressed geometry for **1,538 of its 1,541 indexed Canadian OSM routes**. The initial app installation/update downloads approximately **5.3 MB** for this pack; it expands to about 20 MB of JSON when a route is first loaded. These included routes can be selected for the first time while offline; users do not need to download each one individually. Three indexed relations lack usable direct route geometry and still require a provider or later data repair.

Settings → Built-in offline trails confirms pack installation. Keep the app online until the pack and offline shell are installed. Browser cache eviction or clearing site data removes the installed pack; reopen online to reinstall. This pack contains route lines, not offline terrain/basemap tiles. It does not provide all trails in Canada or establish that the app has more trails than AllTrails.

Maintenance: `node scripts/build-offline-pack.mjs` makes one country-wide data request and rebuilds `public/data/canada-routes.json.gz` and `offline-manifest.json`. Review the resulting counts, run tests, commit both artifacts and publish. Do not run repeated country-wide jobs against public Overpass servers. Dataset integrity tests decompress the actual shipped pack and validate all included catalog geometries. OSM data © OpenStreetMap contributors, ODbL 1.0; https://www.openstreetmap.org/copyright .

## Version 0.3: live 2D and 3D maps

Open Live map to explore a real streamed vector basemap with clustered Canadian trail markers, saved route lines, a highlighted selected route, location and fullscreen controls. Load a catalog route, choose View on 2D / 3D map, then toggle 3D terrain. Elevation comes from Mapterhorn and the basemap from OpenFreeMap; MapLibre GL JS 5.6.2 is loaded on demand from jsDelivr. These public endpoints need no API key but have no guaranteed availability. Online viewing sends map-area tile requests to those providers. The location control asks for browser permission. Terrain has 1.2× vertical exaggeration.

The online basemap and 3D terrain are **not downloaded for offline use**. Offline route geometry and the existing saved collection remain available. WebGL-capable hardware is required for the live map. Marker positions are route centres, not trailheads. Routes in OpenStreetMap may be incomplete, closed, private or unsuitable. Map paths are not verified hiking recommendations.

Provider documentation: https://openfreemap.org/quick_start/ and https://mapterhorn.com/data-access/ . Attribution remains visible on the map and links to elevation data sources.

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


## Release 0.6: map-first discovery

The app opens on the live map. Filter the viewed-area trail list by geometry distance, distance/time baseline, bundled availability or private favorites, and sort by centre proximity, length or name. Favorites persist in IndexedDB and are included in backups. Hide the results panel for more map space. Trail details show geometry length, elevation coverage, source context and an elevation profile only when actual samples exist. Missing or incomplete elevation stays unknown, is excluded by low-ascent filters and cannot produce a confident time-budget verdict. Distance-only times omit unknown climbing and are not complete hiking-time predictions.

Comparison and validation: 27 automated tests plus syntax checks; Chrome checks for combined filters, favorites after reload, direct pack route loading, missing-elevation details, panel hiding, 390px responsive bounds and cached reload with the local server stopped. No native Android field tracking, full offline basemap or complete national trail coverage is claimed.
