# TruthShield Firefox Source Package - 0.1.26

This source package is provided for Mozilla Add-ons review.

## Add-on

- Name: TruthShield
- Version: 0.1.26
- Firefox add-on ID: `truthshield@otus.tw`
- License: MIT

## Build Environment

- macOS 15.5 was used for this package.
- Node.js 24.x
- npm 11.x
- `zip` command line utility

The extension source is plain HTML/CSS/JavaScript. It is not minified, obfuscated, bundled with webpack/browserify, or transpiled. The Firefox package script copies `public/extension`, removes local development origins, adjusts the Firefox manifest fields, runs the release checker, and creates the ZIP.

## Build Steps

From the extracted source package root:

```sh
npm ci
npm run package:extension:firefox
```

The generated Firefox package will be:

```text
dist/truthshield-firefox-extension.zip
```

This should match the submitted AMO package for version 0.1.26.

## Files Included

- `public/extension/`: extension source files
- `scripts/package-extension-firefox.mjs`: Firefox package script
- `scripts/check-extension-release.mjs`: release validation script
- `package.json` and `package-lock.json`: npm scripts and locked dependencies

No production secrets, API tokens, cookies, private keys, or environment files are required or included.
