# Mechanics Helper — Google Play (Android)

Capacitor wraps the **live** web app so a Play build stays current with Railway deploys. iOS is out of scope for this pass.

## Where the Android project lives

This git repo has an odd nested layout. Railway production builds from:

```
index.html/index.html
```

(`rootDirectory` on the MechanicsHelper Railway service). Capacitor, `package.json` scripts, and `android/` are on that same tree. Do not add a second copy of the app at the repo root.

| Item | Value |
|------|--------|
| Application id / package name | `app.mechanicshelper` (reverse-DNS of mechanicshelper.app — **do not change after the first Play upload**) |
| App name | Mechanics Helper |
| `versionCode` | `1` |
| `versionName` | `1.0.0` |
| WebView URL | `https://mechanicshelper.app` (HTTPS only) |
| Allowed hosts | `mechanicshelper.app`, `www.mechanicshelper.app` |
| Fallback shell | `index.html/index.html/native-www/` (shown only if the live site cannot load) |

Bump `versionCode` (integer, always up) and `versionName` in `index.html/index.html/android/app/build.gradle` before each Play upload.

## Agent VM build proof (this PR)

On the cloud agent (JDK 21, Android SDK 36), from `index.html/index.html/android`:

- `./gradlew assembleDebug` — **SUCCESS**
  - `app/build/outputs/apk/debug/app-debug.apk` (4.4 MB)
  - `package: name='app.mechanicshelper' versionCode='1' versionName='1.0.0'`
  - permissions: `INTERNET`, `ACCESS_NETWORK_STATE`, `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` (max SDK 32)
- `./gradlew bundleRelease` — **SUCCESS**
  - `app/build/outputs/bundle/release/app-release.aab` (3.3 MB)
  - **Not Play-upload-ready:** no `keystore.properties` was present, so this AAB is not signed with Leon’s upload key. Create the release keystore (below) before uploading to Console.

Debug APK / AAB artifacts are gitignored; rebuild locally with the scripts above.

## Store listing URLs

- Live app: https://mechanicshelper.app (also www)
- Privacy: https://mechanicshelper.app/privacy
- Terms: https://mechanicshelper.app/terms
- Support: https://mechanicshelper.app/support
- Support email: support@mechanicshelper.app

Play Console phone screenshots (existing product shots, may need a 9:16 recrop in Console): `store/play-screenshots/`.

## Reviewer accounts (from live)

Shop — find code **LWSN**:

- Email: `supadin1234+mhshop@gmail.com`
- Password: `upOE9SiTKdvYNNRy`

Customer:

- Email: `supadin1234+mhcustomer2@gmail.com`
- Password: `Ja5CAIhrEr51oyms`

## Closed testing

Personal Play developer accounts must run **closed testing with at least 12 testers opted in for 14 days** before production. Create the closed track, add testers, wait out the 14 days, then promote. Play Console signup and the AAB upload are Leon’s steps — this repo only produces the bundle.

## Open the Android project

On a machine with Android Studio / JDK 21:

```bash
cd index.html/index.html
npm install
npx cap sync android
npx cap open android    # or: npm run cap:android
```

`npm run cap:sync` copies `native-www` and regenerates Capacitor Android config. It does **not** rebuild the Railway site; the WebView always loads https://mechanicshelper.app.

## Debug APK (no Play keystore)

```bash
cd index.html/index.html
npm run android:assemble
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Debug builds use the default Android debug key.

## Release AAB for Play Console

### 1. Create a release keystore (once)

Do this on Leon’s machine. **Never commit** `release.keystore`, `*.jks`, or `android/keystore.properties`.

```bash
cd index.html/index.html/android
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias mechanicshelper \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass 'YOUR_STORE_PASSWORD' \
  -keypass 'YOUR_KEY_PASSWORD'
```

Keep a backup of `release.keystore` and the passwords. Losing them means you cannot update the Play listing under `app.mechanicshelper`.

### 2. Point Gradle at it

```bash
cp keystore.properties.example keystore.properties
```

Edit `android/keystore.properties`:

```
storeFile=release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=mechanicshelper
keyPassword=YOUR_KEY_PASSWORD
```

`storeFile` is resolved from the `android/` directory (`index.html/index.html/android/release.keystore`).

### 3. Build the Play bundle

```bash
cd index.html/index.html
npm run cap:sync
npm run android:bundle
# → android/app/build/outputs/bundle/release/app-release.aab
```

If `keystore.properties` is missing, `bundleRelease` still produces an **unsigned** AAB that Play Console will reject. Upload only a keystore-signed AAB.

Play Console: **Create app** → package name `app.mechanicshelper` → **Testing → Closed testing** → upload the AAB → attach privacy/terms/support URLs and reviewer accounts above.

## Icons, splash, theme

Brand assets (icon-only car+wrench, no wordmark):

- `index.html/index.html/public/brand/play-icon-512.png`
- `index.html/index.html/public/brand/android/ic_launcher_foreground.png`
- `index.html/index.html/public/brand/android/ic_launcher_background.png`

To regenerate mipmaps / splash after a brand change:

```bash
cd index.html/index.html
python3 scripts/sync-android-icons.py
```

Status bar, splash, and window background use navy `#071834` with gold `#f59e0b` accent.

## Permissions (minimal)

| Permission | Why |
|------------|-----|
| `INTERNET` / `ACCESS_NETWORK_STATE` | Load the live app |
| `CAMERA` | Take photo (file input `capture` + `getUserMedia`) |
| `READ_MEDIA_IMAGES` | Choose photo on some Android 13+ WebView choosers |
| `READ_EXTERNAL_STORAGE` (max SDK 32) | Choose photo on older Android |

No location, mic, contacts, or SMS.

## npm scripts

From `index.html/index.html`:

| Script | What it does |
|--------|----------------|
| `npm run cap:sync` | Sync Capacitor Android project |
| `npm run cap:android` | Open in Android Studio |
| `npm run android:assemble` | Debug APK |
| `npm run android:bundle` | Release AAB (`bundleRelease`) |
| `npm run icons:android` | Rewire mipmap / splash from brand PNGs |
