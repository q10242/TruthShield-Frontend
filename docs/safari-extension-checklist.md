# Safari Extension Checklist

TruthShield does not currently ship a public Safari build. Safari support is prepared as a separate packaging target because it requires Xcode and App Store/TestFlight distribution.

## Build the Xcode project

```bash
npm run package:extension:safari
```

Optional production-origin override:

```bash
TRUTHSHIELD_EXTENSION_WEB_ORIGIN=https://truth-shield.otus.tw \
TRUTHSHIELD_EXTENSION_API_ORIGIN=https://truth-shield-api.otus.tw \
npm run package:extension:safari
```

Optional Apple bundle identifier override:

```bash
TRUTHSHIELD_SAFARI_BUNDLE_ID=tw.otus.truthshield.safari \
npm run package:extension:safari
```

Generated files:

- `dist/safari-extension-package`
- `dist/safari/TruthShield Safari/TruthShield Safari.xcodeproj`

The generated Safari project is intentionally kept under `dist/` and is not committed. Recreate it from source when preparing a TestFlight or App Store build.

## Local QA

1. Open `dist/safari/TruthShield Safari/TruthShield Safari.xcodeproj` in Xcode.
2. Select the macOS scheme first and run the app.
3. Enable the extension in Safari Settings > Extensions.
4. Test these flows:
   - popup opens and shows the current article URL
   - content script injects the TruthShield banner on supported news pages
   - vote panel can open from popup and page banner
   - right-click context menu actions work, if Safari exposes the menu item
   - options and diagnostics pages load
   - login sync does not leak Authorization responses into cache
5. Repeat on iOS/iPadOS through Xcode or TestFlight before public release.

## Release Notes

- Public distribution requires Apple Developer Program access, App Store Connect, and Apple review.
- TestFlight is the preferred pre-release path.
- Do not add Safari to `build:release` until CI has a macOS/Xcode environment and signing is deliberately configured.
- If `xcodebuild` reports CoreSimulator version mismatch, update Xcode/macOS before iOS simulator QA.
