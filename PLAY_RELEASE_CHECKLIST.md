# Google Play release checklist

## Ready in the repository

- Android application ID: `com.mathora.calculator`.
- `targetSdk 36`, `compileSdk 36`, portrait layout, no sensitive permissions.
- App data backup disabled; math evaluation and history are local.
- Spanish privacy policy draft: `public/privacy-policy.html` (ships with the web assets).
- In-app link to the privacy policy.
- Google Play 512 × 512 icon: `public/icon-512.png`.
- Spanish listing copy draft: `PLAY_STORE_LISTING.md`.
- Signed release command: `npm run android:bundle`.
- Static preflight: `npm run release:check`.
- Native release compile and lint: `npm run android:compile` (creates a local APK for device checks).
- JDK 21 and official Android command-line tools have been downloaded into the ignored local `.android-toolchain/` folder; the Android SDK platform is not installed yet.

## Required before the first upload

1. Replace the developer/entity name and contact email in `public/privacy-policy.html`, then publish that page at a stable HTTPS URL. Enter the same URL in Play Console.
2. Install Android SDK Platform 36 and Build Tools 36, accepting the Android SDK license terms in Android Studio or with `sdkmanager`.
3. Create the Play Console app using `com.mathora.calculator`; enable Play App Signing and create/choose an upload key. Keep the private key and passwords outside the repository. Set `MATHORA_UPLOAD_STORE_FILE`, `MATHORA_UPLOAD_STORE_PASSWORD`, `MATHORA_UPLOAD_KEY_ALIAS`, and `MATHORA_UPLOAD_KEY_PASSWORD` only in the build environment.
4. Run `npm run android:bundle`, install the resulting AAB in an internal test track, and verify it on supported Android devices. Complete Play Console's Data safety form, content rating, target audience, app access, store listing, screenshots, and declarations based on the final binary and your intended audience.
5. If your Play Console account is a personal account created after 13 November 2023, complete the required closed test with at least 12 continuously opted-in testers for 14 days and apply for production access.

## Still account- or device-dependent

- Confirm the package ID is available to your Play Console account.
- Resolve the Mathora name before listing: [an existing Google Play calculator uses “Calculator Mathora”](https://play.google.com/store/apps/details?id=com.y2bgames.calculatormathora). Confirm brand rights and choose a clearly distinguishable listing name if needed.
- Provide the legal developer contact and public support details for the listing.
- Android SDK license acceptance, signing-key custody, device testing, Play Console declarations, closed testing (when applicable), and Google's review cannot be completed from this repository alone.
