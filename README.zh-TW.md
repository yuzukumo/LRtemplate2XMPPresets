# LRTemplate2XMPFormatter

[English](./README.md) | [简体中文](./README.zh-CN.md) | 繁體中文（台灣）

將舊版 Lightroom `.lrtemplate` 顯影預設轉換為 `.xmp` 預設檔。

## 使用已部署的網頁版

可直接使用已部署的網頁版：[https://bridge.yuuhi.de](https://bridge.yuuhi.de)。

此網頁版在瀏覽器本地執行。預設檔案不會上傳。在大多數情況下，無須自行部署，也無須使用 Python CLI。

## 檢視輸出內容

- `.xmp` 預設檔
- `crs:PresetType="Normal"`
- Camera Raw / Lightroom 預設中繼資料
- 在來源檔包含相關資料時保留曲線
- 在來源檔包含相關資料時保留漸變與圓形局部修正

本專案產生的是 XMP 預設，不產生 `Look/profile` 類型的 XMP 檔案。

## 關於轉換目標

根據 Adobe 文件，舊版 `.lrtemplate` 預設會在 Lightroom Classic 中遷移到 XMP 預設格式。因此，本專案將 XMP 預設作為轉換目標，而不是 Look。

參考文件：

- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/camera-raw/using/camera-raw-settings.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## 在本地執行

儲存庫中同時包含以下本地工具：

- 用於自架的前端網頁應用程式：[`public/`](./public/)
- Python CLI：[`lrtemp2xmp.py`](./lrtemp2xmp.py)

在本地啟動網頁應用程式：

```bash
npm install
npm run dev
```

執行 Python CLI：

```bash
python3 lrtemp2xmp.py --input-dir ./presets --output-dir ./converted-xmp --group "User Presets"
```

## 目前支援的巢狀結構

- `ToneCurvePV2012`
- `ToneCurvePV2012Red`
- `ToneCurvePV2012Green`
- `ToneCurvePV2012Blue`
- `GradientBasedCorrections`
- `CircularGradientBasedCorrections`

如果偵測到不支援的巢狀設定，轉換器會回傳錯誤，而不是省略相關資料。
