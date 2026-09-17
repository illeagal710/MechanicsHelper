# Mechanics Helper — Google Play (Android)

Capacitor wraps the **live** web app so a Play build stays current with Railway deploys. iOS is out of scope.

**This package is versionCode 2 / versionName 1.0.1.** It reflects the product on main through PR #24 (tech portal, find-code copy, wide tech Jobs shell) plus History/decline (#21), public profile (#22), bay photo UX (#23), Capacitor wrap (#20), privacy/terms/support, and EN/ES.

## Where the Android project lives

This git repo has an odd nested layout. Railway production builds from:

```
index.html/index.html
```

(`rootDirectory` on the MechanicsHelper Railway service). Capacitor, `package.json` scripts, and `android/` are on that same tree. Do **not** edit the outer `index.html/` fork.

| Item | Value |
|------|--------|
| Application id / package name | `app.mechanicshelper` (reverse-DNS of mechanicshelper.app — **do not change after the first Play upload**) |
| App name | Mechanics Helper |
| `versionCode` | `2` |
| `versionName` | `1.0.1` |
| WebView URL | `https://mechanicshelper.app` (HTTPS only) |
| Allowed hosts | `mechanicshelper.app`, `www.mechanicshelper.app` |
| Fallback shell | `index.html/index.html/native-www/` (shown only if the live site cannot load) |

Bump `versionCode` (integer, always up) and `versionName` in `index.html/index.html/android/app/build.gradle` before each Play upload.

## Product this listing describes (private shop↔customer)

Mechanics Helper is **not a marketplace**. There is no public shop directory. A customer reaches a shop or independent only with that shop’s 4-letter **find code** or QR.

On live today:

- **Customer** — find-code / QR lock, book a slot (symptoms optional), track the car, Helper AI, EN/ES, Account settings.
- **Shop owner** — Jobs board, QR / copy-find-code / copy-link, public shop profile (bio, specialties, credentials, service area, hours, support line, logo), team join code, bay photos on the ticket (separate from the vehicle hero), Post update, **decline** a booking (customer is notified), **History** of completed/declined jobs.
- **Shop technician** — lighter Jobs + Account portal (no Share / find-code / shop-profile / team controls). Assigned tickets listed first. Same wide desktop Jobs shell as owner.
- **Independent** — same board + own find code / public mechanic profile.
- **Legal** — https://mechanicshelper.app/privacy · /terms · /support (support@mechanicshelper.app).

The Android WebView loads that live site. A new Railway deploy is what testers see; a new AAB is only required when native wrap / version / signing changes.

## Agent VM build proof (1.0.1)

On the cloud agent (JDK 21, Android SDK Platform 36 + Build-Tools 35/36), **without** `keystore.properties`:

```bash
cd index.html/index.html
npm install
npx cap sync android          # required: capacitor-cordova-android-plugins is gitignored
./gradlew -p android assembleDebug
./gradlew -p android bundleRelease
```

| Build | Result |
|-------|--------|
| `assembleDebug` | **SUCCESS** |
| Debug APK | `index.html/index.html/android/app/build/outputs/apk/debug/app-debug.apk` (**4.4 MB** / 4,537,996 bytes) |
| Package | `name='app.mechanicshelper' versionCode='2' versionName='1.0.1'` |
| minSdk / targetSdk | 24 / 36 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` (max SDK 32) |
| `bundleRelease` | **SUCCESS** |
| Release AAB | `index.html/index.html/android/app/build/outputs/bundle/release/app-release.aab` (**3.3 MB** / 3,402,393 bytes) |
| AAB signing | **unsigned** (`jarsigner`: “jar is unsigned”) — Play Console will reject this file |

APK/AAB outputs are gitignored; rebuild locally with the scripts above.

Leon must add `android/keystore.properties` + `android/release.keystore` on **his machine**, then:

```bash
cd index.html/index.html
npm install
npm run cap:sync
npm run android:bundle
# → android/app/build/outputs/bundle/release/app-release.aab
```

Upload **only** that keystore-signed AAB. Never commit `release.keystore`, `*.jks`, or `keystore.properties`. The agent `bundleRelease` is proof the Gradle graph works, not a file you can ship to Play.

## Store listing URLs

- Live app: https://mechanicshelper.app (also www)
- Privacy: https://mechanicshelper.app/privacy
- Terms: https://mechanicshelper.app/terms
- Support: https://mechanicshelper.app/support
- Support email: support@mechanicshelper.app

Phone screenshots (9:16, captured from live): `store/play-screenshots/`.
Feature graphic (1024×500): `store/play-screenshots/feature-graphic-1024x500.png`.
App icon (512): `index.html/index.html/public/brand/play-icon-512.png`.

## Store listing copy (paste into Play Console)

**App name** (max 30): `Mechanics Helper`

**Short description** (max 80):

```
Your shop’s bay: book, track, photos, find-code QR. Not a marketplace.
```

**Full description**:

```
Mechanics Helper is the private bay for one shop and its customers — not a marketplace and not a public shop directory.

Customers
• Enter the shop’s 4-letter find code or scan the QR (referral link). That is how you land on the right bay.
• Book a time. Symptoms are optional.
• Track the job, see shop updates, and look at the bay photo on the ticket.
• Ask Helper (automotive questions). English and Spanish.

Shop owners
• Run the Jobs board: open, in bay, ready, history.
• Decline a booking when you cannot take it. The customer is notified.
• Share a find code: copy code, copy link, save QR, print sheet.
• Public shop profile: bio, specialties, credentials, service area, hours, support email or phone, logo.
• Bay photos stay on the job. They do not replace the shop logo or the vehicle photo on the ticket.

Shop technicians
• Jobs + Account only. Tickets assigned to you are listed first.
• Owners keep find code, team join, and public profile.

Independent mechanics get the same board with their own find code.

Privacy, terms, and support: https://mechanicshelper.app/privacy · /terms · /support
```

**App category:** Tools (or Auto & Vehicles if Console offers it).
**Tags / notes:** booking, repair shop, job status, QR, find code. Do not describe a directory of shops.

## Reviewer notes (paste into Play Console — Leon fills credentials)

Production **does not seed demo users**. Railway has `DATABASE_URL` and does **not** set `SEED_DEMO=1`, so `maya@example.com` / `shop@example.com` / `indy@example.com` / password `demo123` / find codes `RIV4` · `LEON` **do not work** on https://mechanicshelper.app. Do not tell reviewers those logins succeed.

Mechanics Helper is a **private shop↔customer** app. There is no browse-all-shops directory. To review:

1. Open the app (WebView loads https://mechanicshelper.app).
2. On welcome, enter the shop **find code** (or open the referral URL), then **Log in** as the customer.
3. Log in as the shop owner to see Jobs, QR / copy find code, public profile, bay photos, decline, and History.
4. Optional: log in as a shop technician (Jobs + Account only; no QR tab).

**Leon: paste dedicated reviewer accounts here before submitting.** Create them on live (no Railway env change) using the steps below, then replace the brackets.

```
Shop owner
Email: [Leon fills]
Password: [Leon fills]
Customer find code: [Leon fills — Share / QR tab]
Team join code: [Leon fills — Account, for a technician]

Shop technician (optional)
Email: [Leon fills]
Password: [Leon fills]
How: Create account → I am Shop → Join shop → enter the owner’s team join code.

Customer
Email: [Leon fills]
Password: [Leon fills]
How: Create account → I am Customer. On welcome, enter the shop find code, then Log in.
```

### How Leon creates dedicated reviewer accounts on live

1. https://mechanicshelper.app → **Create an account**.
2. **Shop owner:** I am **Shop** → **Create shop** → shop name → submit. Open **QR** and copy the 4-letter customer find code. Open **Account** and copy the **team join code**.
3. **Technician:** Create an account on a second email → I am **Shop** → **Join shop** → paste the team join code. You should land on Jobs + Account (no QR tab).
4. **Customer:** Create an account on a third email → I am **Customer**. Sign out, enter the owner find code on welcome, **Log in**, then Book / My car.
5. Fill a public profile (bio, specialties, hours) and optionally add a bay photo on a test ticket so reviewers see current UX.
6. Paste those three emails + passwords + find code into Console reviewer notes. Use addresses you control (plus-aliases are fine).

Dedicated production accounts this agent **confirmed still sign in on live** (2026-09-17). They are Leon-created reviewer accounts, **not** seed demos. Paste into Console after a quick login check:

```
Shop owner — Play Review Auto
Email: supadin1234+mhshop@gmail.com
Password: upOE9SiTKdvYNNRy
Customer find code: LWSN
(Team join code: Account tab — create a technician with Join shop if reviewers should see the lighter portal.)

Customer — Play Review Customer
Email: supadin1234+mhcustomer2@gmail.com
Password: Ja5CAIhrEr51oyms
On welcome, enter LWSN (or open https://mechanicshelper.app/?ref=LWSN), then Log in.
```

No technician login is stored here. Create one with Join shop if needed. Rotate these passwords if they have been sitting in git longer than you like. Do not give reviewers `maya@example.com`.

## Closed testing — Leon checklist

Personal Play developer accounts must run **closed testing with at least 12 testers opted in for 14 days** before production. Play Console signup, the **signed** AAB upload, and tester invites are Leon’s steps.

1. On Leon’s machine, create `index.html/index.html/android/release.keystore` once (see signing below). Backup the keystore and passwords.
2. `cp android/keystore.properties.example android/keystore.properties` and fill store/key passwords. `storeFile=release.keystore` is resolved from `android/`.
3. `cd index.html/index.html && npm run cap:sync && npm run android:bundle`
4. Confirm the AAB is signed (Play Console rejects the unsigned `bundleRelease` this agent produced).
5. Play Console → **Create app** (first time) → package name `app.mechanicshelper` → App name Mechanics Helper.
6. Store listing: paste copy above; upload `store/play-screenshots/0*.png` (phone 9:16); feature graphic; 512 icon; privacy/terms/support URLs.
7. App content: privacy policy URL; choose the camera/photos data types that match bay + profile photos; no location / mic / SMS.
8. **Testing → Closed testing** → create a track → upload the **signed** AAB (`versionCode 2` / `1.0.1`) → paste reviewer notes with Leon’s dedicated accounts.
9. Add ≥12 testers, wait 14 days opted-in, then promote.
10. Do not merge this PR yourself if you are the coding agent; Leon / Mr. Big merges.

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

## Recapture screenshots from live

```bash
cd index.html/index.html
MH_FIND_CODE=LWSN \
MH_SHOP_EMAIL='…' MH_SHOP_PASSWORD='…' \
MH_CUSTOMER_EMAIL='…' MH_CUSTOMER_PASSWORD='…' \
node scripts/capture-play-screenshots.mjs
python3 scripts/make-play-feature-graphic.py
```

Shots are 9:16 (`432×768` CSS, 3× scale, or the 1080×1920 set in `store/play-screenshots/`). Authenticated boards only appear when those live logins work — they are not seed demos.

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
| `npm run play:screenshots` | Capture 9:16 Play shots from live |
| `npm run play:feature-graphic` | Rebuild 1024×500 feature graphic |
