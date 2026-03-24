# LRTemplate2XMPFormatter

[English](./README.md) | [简体中文](./README.zh-CN.md) | 繁體中文（台灣）

把舊版 Lightroom `.lrtemplate` 顯影預設轉換成現代 `.xmp` 預設檔。

## 直接線上使用

已部署網頁版：[bridge.yuuhi.de](https://bridge.yuuhi.de)

對大多數使用者來說，直接打開網頁就夠了：

- 轉換完全在瀏覽器內完成
- 不上傳檔案
- 不需要自己部署
- 不需要 Python CLI

## 輸出結果

- 輸出類型：`XMP preset`
- `crs:PresetType="Normal"`
- 使用現代 Camera Raw / Lightroom 預設中繼資料結構
- 保留曲線
- 在來源檔存在時保留漸變與圓形局部修正

這個專案**不會**把預設轉成 `Look/profile` 類型的 XMP。

## 為什麼是 XMP Preset，不是 Look

Adobe 官方文件說明，舊 `.lrtemplate` 預設在 Lightroom Classic 中會遷移成新的 **XMP preset** 格式。所以從相容性與語意來看，`.lrtemplate -> XMP preset` 才是最接近官方路線、也最穩妥的目標。

參考資料：

- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## 可選的本地工具

儲存庫裡仍然保留了：

- 可自行託管的純前端網頁版：[`public/`](./public/)
- 用於本地驗證或批次處理的 Python CLI：[`lrtemp2xmp.py`](./lrtemp2xmp.py)

本地網頁開發：

```bash
npm install
npm run dev
```

可選 CLI 用法：

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

如果遇到不支援的巢狀設定，轉換器會直接報錯，而不是默默丟掉資料。
