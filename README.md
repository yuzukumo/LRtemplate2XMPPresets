# LRTemplate2XMPFormatter

English | [简体中文](./README.zh-CN.md) | [繁體中文（台灣）](./README.zh-TW.md)

Convert legacy Lightroom `.lrtemplate` develop presets into modern `.xmp` preset files.

## What It Generates

- Output type: `XMP preset`
- `crs:PresetType="Normal"`
- Modern Camera Raw / Lightroom preset metadata
- Preserved tone curves
- Preserved gradient and circular local corrections when present

This project does **not** convert presets into `Look/profile` XMP files.

## Why This Direction

Adobe documents that old `.lrtemplate` presets are migrated to the newer **XMP preset** format in Lightroom Classic.  
That makes `.lrtemplate -> XMP preset` the closest and most correct migration target.

Reference:

- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## Implementations

### Python CLI

File: [`lrtemp2xmp.py`](./lrtemp2xmp.py)

Features:

- Parses LRTemplate structure instead of loose regex extraction
- Fails on unsupported nested tables instead of silently dropping them
- Validates generated XMP before finishing

Usage:

```bash
python3 lrtemp2xmp.py --input-dir ./presets --output-dir ./converted-xmp --group "User Presets"
```

### Cloudflare Worker Frontend

Files:

- [`public/`](./public/)
- [`src/index.js`](./src/index.js)
- [`wrangler.jsonc`](./wrangler.jsonc)

Features:

- Pure frontend conversion in the browser
- No backend conversion service
- Worker only serves static assets
- Batch convert and download ZIP

Reference:

- https://developers.cloudflare.com/workers/static-assets/

Run locally:

```bash
npm install
npm run dev
```

Deploy:

```bash
npm install
npm run deploy
```

## Supported Nested Structures

- `ToneCurvePV2012`
- `ToneCurvePV2012Red`
- `ToneCurvePV2012Green`
- `ToneCurvePV2012Blue`
- `GradientBasedCorrections`
- `CircularGradientBasedCorrections`

If an unsupported nested setting appears, the converter raises an error on purpose.
