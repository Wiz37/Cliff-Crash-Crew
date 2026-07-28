# Cliff Crash Crew — Web + App Store Game

A polished, web-first mobile physics game built with **Phaser 3**, **TypeScript**, **Matter Physics**, **Vite**, and **Capacitor**.

The same game code runs in a browser, installs as a PWA, and can be packaged as a native iOS or Android app. The project is no longer a single-file HTML prototype and no longer uses Godot.

## Included

- Animated menu and garage
- Eleven vehicles across classics, construction equipment, supercars, and semis
- Matter.js vehicle physics with suspended wheels
- Charge-and-launch gameplay
- Midair rotation and flip scoring
- Two destructible block towers
- Breakaway wheels, particles, camera shake, slow motion, and haptics
- Original music, engine loop, launch, crash, destruction, reward, and UI sounds
- Stars, unlocks, selected vehicle, settings, and best-score saving
- Responsive portrait layout
- PWA manifest and offline service worker
- Capacitor configuration for iOS and Android
- GitHub Actions build validation

## Run locally

Install Node.js 22.12 or newer, then:

```bash
npm install
npm run dev
```

Open the local address shown by Vite.

## Production web build

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

## iPhone / App Store workflow

On a Mac with Xcode:

```bash
npm install
npx cap add ios
npm run cap:ios
```

In Xcode:

1. Select your Apple Developer team.
2. Confirm the bundle identifier `com.wiz37.cliffcrashcrew` or replace it with your final identifier.
3. Test on physical iPhones.
4. Archive the app.
5. Upload it through Xcode Organizer to App Store Connect.

After each web-code update, run:

```bash
npm run cap:sync
```

## Android workflow

```bash
npm install
npx cap add android
npm run cap:android
```

Create a signed Android App Bundle in Android Studio for Google Play.

## Controls

- Hold the screen or Space to charge.
- Release to launch.
- Hold the left/right onscreen buttons or arrow keys to rotate in the air.

## Important production work still required

This repository is a high-quality vertical slice and technical foundation. Before App Store submission, complete physical-device QA, add more courses, conduct child playtesting, finalize store screenshots and metadata, add a privacy/support website, and review Apple Kids Category requirements if listing it specifically for children.
