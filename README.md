# Cliff Crash Crew — Godot Mobile Vertical Slice

This is a Godot 4 mobile game project, not an HTML/index-file game. It is designed around a 1080 × 1920 portrait viewport and can be exported as an iOS or Android app from Godot.

## Included now

- One-touch charge-and-launch gameplay
- Air rotation controls for flips
- Destructible block tower
- Wheel break-off, impact flash, particles, camera shake, slow motion, and haptic calls
- Original menu music, engine loop, launch sound, three impact sounds, destruction sound, star sound, and UI sound
- App icon and portrait splash screen
- Garage with 11 vehicles
  - Classics: Bounce Buggy, Chonky Bus, Rocket Van, Banana Blaster
  - Construction: Dozer Dasher, Mega Digger, Dump Crusher
  - Supercars: Turbo Tiger, Neon Hyper GT
  - Semis: Big Rig Blast, Mega Hauler
- Different power, spin, mass, length, and height characteristics
- Unlockable vehicle progression using stars
- Best score and progress saving
- Touch, mouse, and keyboard controls
- No ads, analytics, accounts, tracking, chat, or third-party runtime assets

## Open and run

1. Install a current Godot 4 Standard build and its export templates.
2. Open `project.godot` from this folder.
3. Press the Play Project button.

Desktop testing controls:

- Hold and release the mouse or Space bar to charge and launch.
- Use the left/right arrow keys or the onscreen rotation buttons while airborne.

## Mobile export

The project is already set to portrait orientation and uses the GL Compatibility renderer for broad mobile-device support.

For iOS, open the project on macOS, install the Godot export templates, add an iOS export preset, set your bundle identifier and Apple signing information, export the Xcode project, and archive it in Xcode.

For Android, install the Android SDK/OpenJDK requirements, add an Android export preset, set the package name and signing key, then export an AAB for Google Play.

## Validation completed here

`smoke_test.py` verifies required files, resource references, image sizes, WAV headers, bracket balance, and indentation. It passes in this package.

The project could not be compiled into an iOS build in this Linux environment. It still requires a hands-on Godot editor run, device testing, Apple signing, store metadata, and final QA before submission.
