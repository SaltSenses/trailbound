# Trailbound Android

The native app packages the web UI, local MapLibre renderer, Canadian relation geometry and ready-made regional packs. Its dedicated recorder uses Android LocationManager GPS updates in a location foreground service with an ongoing notification. Each accepted fix is immediately committed to SQLite with timestamp, accuracy and optional altitude. Stale fixes (>30 seconds), accuracy worse than 60 m and invalid coordinates are rejected. Service restarts and long gaps are marked as separate track segments. Closing the activity does not stop the service. Force-stop, reboot, revoked permissions and some manufacturer battery controls can stop it; reopen and use Resume interrupted service. No boot receiver or silent permission expansion is used.

## Build and install

GitHub Actions → Build Android app produces `trailbound-android-preview`, containing a signed debug APK for testing and an unsigned release APK. Download the artifact, extract it and install the debug APK on Android 8 or later. The phone will ask whether to allow installation from the chosen source. The unsigned APK cannot be installed until signed. Keep Android System WebView current; gzip route decompression needs a modern WebView. No Google Maps key, paid subscription or Google Play account is required for sideloading.

The debug key on an ephemeral CI runner is not a permanent distribution identity. Do not depend on preview APK upgrades retaining data: a differently signed build cannot replace the installed app, and uninstalling erases its data. Export native tracks, library backup and regions before changing builds. Native and Chrome/PWA storage are separate; use exports/imports to transfer data. Native tracks remain in SQLite after Copy to hike library, and native JSON backups preserve them even when incomplete. GPX export from the library preserves sample timestamps and segment gaps.

## Permanent signing

Use Android Studio on your laptop: open `android/`, let it install the matching Android SDK/JDK/Gradle, then Build → Generate Signed App Bundle or APK → APK → Create new keystore. Choose your own private passwords and alias. Store that keystore and its passwords in separate secure backups; never commit them or send them in chat. The same signing key must sign every future release. Increase `versionCode` for every distributed upgrade. Direct sideloaded native APK updates require approving Android's installer; web PWA updates are automatic separately.

For command-line signed builds, set TRAILBOUND_KEYSTORE (absolute path), TRAILBOUND_STORE_PASSWORD, TRAILBOUND_KEY_ALIAS and TRAILBOUND_KEY_PASSWORD in your local process environment and run `gradle -p android assembleRelease` with Gradle 8.13, JDK 17 and Android SDK 36. The Gradle build uses them only if present. In a CI signing setup, store the keystore and passwords in GitHub Actions encrypted secrets restricted to your own repository; no signing credentials are currently configured or committed. The connected GitHub tool cannot configure those secrets. Source code and unsigned builds already work independently of ChatGPT.

## Recording and backups

Open Record a hike → Android background recorder → Start background recording. Grant precise location and notification permissions. Wait outdoors for several fixes; verify the ongoing recording notification. Lock the screen. Reopen the app to inspect its native point count, then Finish background recording. Copy to hike library for the map, planning and GPX export. Export native tracks directly to a file as an additional backup. Native files use Android's document picker; app-private SQLite is excluded from automatic cloud backup.

Offline maps: download or import regions while online, choose Use offline basemap, inspect the map, then enable airplane mode. Regions retain actual source geometry; they are not an authoritative completeness, access or safety claim. Export each region separately. Personal library backups do not embed regional basemaps.

## Required phone acceptance test

CI includes JVM tests and an Android emulator test that injects GPS fixes while the activity is backgrounded and the screen is off, then verifies SQLite persistence. It is not a substitute for device validation. Before relying on this for hiking, test on your actual phone: record 15–30 minutes outdoors with screen locked; verify point timestamps span that period and the path is plausible; repeat with airplane mode and a downloaded region; finish/export; restart the app and verify persisted data. Test an interrupted service and Resume; verify a force-stop does not pretend it continued. Check the app's battery settings if the manufacturer stops its notification. Android service behavior varies by phone. No claim of verified phone reliability is made until those checks pass.

References: https://developer.android.com/develop/background-work/services/fgs/service-types#location and https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start .

For your Google Pixel 8 Pro: install the APK, grant Precise location and notifications, start outside while the app is visible, and verify the persistent notification before locking the screen. If recording stops, inspect Settings → Apps → Trailbound → App battery usage and its background allowance. Names vary by Android version. Use a 30-minute screen-off walk followed by an airplane-mode repeat, then export and inspect sample times. Restore exported native JSON through Settings & backup to copy usable tracks into the library; native service state is never reactivated by an import.


## Android 0.8 Trans Canada Trail preview

This debug APK is named Trailbound Preview 0.8 and uses ca.trailbound.app.preview so it can be installed beside the older preview without uninstalling or erasing it. App data is separate. Export native tracks, library backups and regional packs from the older app and import copies if needed. The 243 TCT sections are packaged in the APK; no per-section network request is required. Android tests check offline TCT browsing and prevent beginning a ferry as a hike. Future APK updates still require a permanent signing identity you control.
