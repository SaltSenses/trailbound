# Trailbound Android 0.7.0 — Pixel 8 Pro test build

Install the APK attached to this release on your Pixel 8 Pro. It is the exact build verified by workflow run 41395739871, not a new rebuild. SHA-256: b42922603a55914570cdc66f1328e639a18855fc2e18b860cc94db2e4a692014.

This is a debug-signed device-test release. Permanent signing and real-phone field validation are still pending. Export native tracks, library data and regional maps before replacing any installed preview; different CI builds may use different test signing keys. This release will not silently replace its APK.

1. Open the APK download on your Pixel and use Android's installer. Only approve the installation if you intend to install your Trailbound test app. If Android blocks it or requests an unexpected action, report the exact message.
2. Open Trailbound → Record a hike → Android background recorder. Enter a hike name. Start outside with the app visible, then grant precise location and notifications.
3. Wait for several GPS points and check the persistent recording notification. Lock the screen for a 30-minute walk. Reopen the app and check that the saved point count increased.
4. Finish background recording → Copy to hike library → export GPX. Export native tracks too. Verify timestamps cover the screen-locked period.
5. Live map → Offline maps & expanded local trails → choose a region → verify its map. Repeat a short recording with airplane mode enabled.

The app bundles five regional 2D basemaps and 649 extra named path segments alongside its national OSM route catalog. These are not complete Canadian coverage or verified full hikes. Offline contours and 3D relief are not included.

Android compilation, JVM tests, lint and three emulator tests passed, including packaged map readability, offline UI/catalog startup and screen-off SQLite recording. Real Pixel behavior is still to be tested. A force-stop or reboot can interrupt tracking; Resume interrupted service starts an unfinished track from the visible app.

Source and signing instructions: android/README.md in the repository. Your Chrome/PWA and Android storage are separate; transfer via exports/imports. No paid maps account or API key is needed.
