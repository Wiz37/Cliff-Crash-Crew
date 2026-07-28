# App Store Production Checklist

## Build and signing

- Use a Mac with a current Xcode installation.
- Install Node.js 22.12 or newer.
- Run `npm install`, `npm run build`, `npx cap add ios`, and `npx cap sync ios`.
- Open the generated iOS project in Xcode.
- Set the final bundle identifier and Apple Developer team.
- Set version and build numbers.
- Confirm portrait orientation and safe-area behavior.
- Archive and validate the release build.

## Game QA

- Test every vehicle on multiple physical iPhones and at least one iPad.
- Test with silent mode, headphones, phone calls, app backgrounding, low battery, and no network.
- Tune difficulty, star rewards, vehicle prices, and collision thresholds from child playtests.
- Add more courses and randomized targets before commercial release.
- Verify no text or controls are hidden by notches or the home indicator.
- Verify save migration between updates.

## Store requirements

- App icon and launch assets must be generated into the native iOS project.
- Prepare App Store screenshots and an optional preview video.
- Publish a support URL and privacy-policy URL.
- Complete age rating, App Privacy, content rights, and export compliance.
- Review Kids Category rules before selecting a child age band.
- Do not add child-directed advertising, analytics, or purchases without a full policy and privacy review.
