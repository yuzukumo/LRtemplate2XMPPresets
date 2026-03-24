# LRTemplate2XMPFormatter

English | [简体中文](./README.zh-CN.md) | [繁體中文（台灣）](./README.zh-TW.md)

Convert legacy Lightroom `.lrtemplate` develop presets to `.xmp` preset files.

## Use the hosted web app

Use the hosted web app at [https://bridge.yuuhi.de](https://bridge.yuuhi.de).

The web app runs locally in the browser. Preset files are not uploaded. In most cases, you do not need to self-host the app or use the Python CLI.

## Review the output

- `.xmp` preset files
- `crs:PresetType="Normal"`
- Camera Raw / Lightroom preset metadata
- Tone curves when present
- Gradient and circular local corrections when present

This project generates XMP presets. It does not generate `Look/profile` XMP files.

## About the conversion target

Adobe documentation indicates that legacy `.lrtemplate` presets migrate to the XMP preset format in Lightroom Classic. For this reason, this project targets XMP presets rather than Looks.

References:

- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/camera-raw/using/camera-raw-settings.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## Run locally

This repository also includes the following local tools:

- A browser app for self-hosting in [`public/`](./public/)
- A Python CLI in [`lrtemp2xmp.py`](./lrtemp2xmp.py)

Start the web app locally:

```bash
npm install
npm run dev
```

Run the Python CLI:

```bash
python3 lrtemp2xmp.py --input-dir ./presets --output-dir ./converted-xmp --group "User Presets"
```

## Supported nested structures

- `ToneCurvePV2012`
- `ToneCurvePV2012Red`
- `ToneCurvePV2012Green`
- `ToneCurvePV2012Blue`
- `GradientBasedCorrections`
- `CircularGradientBasedCorrections`

If an unsupported nested setting is found, the converter returns an error instead of omitting the data.
