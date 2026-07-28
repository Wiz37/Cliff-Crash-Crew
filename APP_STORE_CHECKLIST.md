# App Store Production Checklist

## Project setup

- Replace the placeholder company/bundle information in the iOS export preset.
- Use a unique bundle ID, such as `com.company.cliffcrashcrew`.
- Select the correct Apple development team and provisioning profile.
- Confirm portrait-only orientation.
- Test safe areas on notched iPhones and iPads.
- Verify audio behavior when the app is backgrounded or interrupted by a call.

## Quality work before submission

- Test every vehicle on at least three physical iPhone sizes.
- Tune launch power, obstacle placement, unlock prices, and round length from child playtests.
- Add several more courses so the final product is not dependent on one ramp.
- Add a pause button, restore-session behavior, accessibility options, and parental controls where required.
- Replace or expand procedural vehicle art with a final production art pass if a richer 2D/3D look is desired.
- Add App Store screenshots, preview video, description, keywords, support URL, and privacy-policy URL.

## Monetization

This build contains no ads or purchases. Do not add child-directed advertising or analytics without first completing the required privacy, age-rating, consent, SDK, and store-policy review.

## Submission

- Increment version/build numbers.
- Export the iOS Xcode project from Godot on macOS.
- Build and archive using Xcode.
- Upload through Xcode Organizer or Transporter.
- Complete App Privacy, age rating, content rights, export compliance, and review notes in App Store Connect.
