# Firefox Extension Candidate Checklist

TruthShield's Chrome extension is close to WebExtension-compatible, but Firefox should be treated as a separate release track until QA is complete.

## Build

```bash
npm run package:extension:firefox
```

Generated artifacts:

- `dist/firefox-extension-package`
- `dist/truthshield-firefox-extension.zip`
- `dist/truthshield-firefox-extension-v<version>.zip`

## Manual QA Before Any Listing

- Load `dist/firefox-extension-package` through `about:debugging`.
- Confirm popup opens and can reach the production web/API origins.
- Confirm content script detects supported article pages and does not inject on blocked paths.
- Confirm context menus work on article links.
- Confirm the vote panel iframe opens and auth handoff still works.
- Confirm YouTube uses the compact marker and does not cover video controls.
- Confirm diagnostics page can report origin/health state.

Do not submit to AMO until the candidate package passes the checklist and the release owner approves a Firefox version.
