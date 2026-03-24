# LRTemplate2XMPFormatter

English | [简体中文](./README.zh-CN.md) | [繁體中文（台灣）](./README.zh-TW.md)

Convert legacy Lightroom `.lrtemplate` develop presets into modern `.xmp` preset files.

## Use It Online

Hosted web app: [bridge.yuuhi.de](https://bridge.yuuhi.de)

For most users, this is all you need:

- Runs entirely in the browser
- No file upload
- No self-deployment required
- No Python CLI required

## Output

- Output type: `XMP preset`
- `crs:PresetType="Normal"`
- Modern Camera Raw / Lightroom preset metadata
- Preserved tone curves
- Preserved gradient and circular local corrections when present

This project does **not** convert presets into `Look/profile` XMP files.

## Why XMP Preset Instead Of Look

Adobe documents that legacy `.lrtemplate` presets migrate to the newer **XMP preset** format in Lightroom Classic. That makes `.lrtemplate -> XMP preset` the closest and most correct migration target.

References:

- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## Optional Local Tools

The repository still includes:

- A pure frontend web app in [`public/`](./public/) for self-hosting
- A Python CLI in [`lrtemp2xmp.py`](./lrtemp2xmp.py) for local verification or batch workflows

Local web development:

```bash
npm install
npm run dev
```

Optional CLI usage:

```bash
python3 lrtemp2xmp.py --input-dir ./presets --output-dir ./converted-xmp --group "User Presets"
```

## Supported Nested Structures

- `ToneCurvePV2012`
- `ToneCurvePV2012Red`
- `ToneCurvePV2012Green`
- `ToneCurvePV2012Blue`
- `GradientBasedCorrections`
- `CircularGradientBasedCorrections`

If an unsupported nested setting appears, the converter raises an error on purpose instead of silently dropping data.
