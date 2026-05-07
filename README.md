# TruthShield Web

Vue 3 + Vite frontend for the TruthShield website, iframe panels, and Chrome extension assets.

## Local Development

```bash
npm install
npm run dev
```

Default local URL: `http://127.0.0.1:15173`

## Key Routes

- `/` Truth Hub home
- `/local-news-demo` local article test page
- `/iframe-tooltip` extension tooltip iframe
- `/iframe-vote-panel` article vote panel iframe
- `/profile` user profile, badges, and trust history
- `/donate` ECPay donation page
- `/transparency` public transparency dashboard

## Extension

Load unpacked extension from `public/extension` during local testing.

## Evidence Upload

TruthShield does not store evidence images. The vote panel can optionally upload screenshots directly to an external image host and fill the returned public URL into the evidence field.

Configure a provider with Vite env vars:

```bash
VITE_EVIDENCE_UPLOAD_ENDPOINT=https://api.imgur.com/3/image
VITE_EVIDENCE_UPLOAD_FIELD=image
VITE_EVIDENCE_UPLOAD_URL_PATH=data.link
VITE_EVIDENCE_UPLOAD_AUTH_HEADER=Authorization
VITE_EVIDENCE_UPLOAD_AUTH_VALUE='Client-ID your-client-id'
VITE_EVIDENCE_UPLOAD_MAX_MB=10
VITE_EVIDENCE_IMAGE_HOST_URL=https://imgur.com/upload
VITE_EVIDENCE_CLOUD_DRIVE_URL=https://drive.google.com/drive/my-drive
```

If no upload endpoint is configured, users can still open an external image host or cloud drive and paste the public evidence URL. Do not put private server secrets in frontend env values.
