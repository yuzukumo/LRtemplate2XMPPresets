# LRTemplate2XMPFormatter

[English](./README.md) | [简体中文](./README.zh-CN.md) | 繁體中文（台灣）

把舊版 Lightroom `.lrtemplate` 顯影預設轉換成現代 `.xmp` 預設檔。

## 產出結果

- 輸出類型：`XMP preset`
- `crs:PresetType="Normal"`
- 使用現代 Camera Raw / Lightroom 預設中繼資料結構
- 保留曲線
- 在來源檔存在時保留漸變與圓形局部修正

這個專案**不會**把預設轉成 `Look/profile` 類型的 XMP。

## 為什麼這樣做

Adobe 官方文件說明，舊的 `.lrtemplate` 預設在 Lightroom Classic 中會遷移成新的 **XMP preset** 格式。  
所以從相容性與語意來看，`.lrtemplate -> XMP preset` 才是最接近官方路線、也最穩妥的目標。

參考資料：

- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## 實作方式

### Python CLI

檔案：[`lrtemp2xmp.py`](./lrtemp2xmp.py)

特色：

- 真正解析 LRTemplate 結構，而不是用鬆散正則硬抓
- 遇到不支援的巢狀表時會直接報錯，不會默默漏掉欄位
- 輸出前會做 XMP 基本驗證

用法：

```bash
python3 lrtemp2xmp.py --input-dir ./presets --output-dir ./converted-xmp --group "User Presets"
```

### Cloudflare Worker 前端版

檔案：

- [`public/`](./public/)
- [`src/index.js`](./src/index.js)
- [`wrangler.jsonc`](./wrangler.jsonc)

特色：

- 轉換在瀏覽器本地完成
- 不需要後端轉換服務
- Worker 只負責靜態資源託管
- 支援批次轉換與 ZIP 下載

參考資料：

- https://developers.cloudflare.com/workers/static-assets/

本地執行：

```bash
npm install
npm run dev
```

部署：

```bash
npm install
npm run deploy
```

## 目前支援的巢狀結構

- `ToneCurvePV2012`
- `ToneCurvePV2012Red`
- `ToneCurvePV2012Green`
- `ToneCurvePV2012Blue`
- `GradientBasedCorrections`
- `CircularGradientBasedCorrections`

如果遇到不支援的巢狀設定，轉換器會刻意報錯，避免產生表面成功、實際不完整的 XMP。
