# LRtemplate2XMPPresets

[English](./README.md) | 简体中文 | [繁體中文（台灣）](./README.zh-TW.md)

将旧版 Lightroom `.lrtemplate` 显影预设转换为 `.xmp` 预设文件。

## 使用已部署的网页版

可直接使用已部署的网页版：[https://bridge.yuuhi.de](https://bridge.yuuhi.de)。

该网页版在浏览器本地运行。预设文件不会上传。在大多数情况下，无需自行部署，也无需使用 Python CLI。

## 查看输出内容

- `.xmp` 预设文件
- `crs:PresetType="Normal"`
- Camera Raw / Lightroom 预设元数据
- 在源文件包含相关数据时保留曲线
- 在源文件包含相关数据时保留渐变和圆形局部修正

本项目生成的是 XMP 预设，不生成 `Look/profile` 类型的 XMP 文件。

## 关于转换目标

根据 Adobe 文档，旧版 `.lrtemplate` 预设会在 Lightroom Classic 中迁移到 XMP 预设格式。因此，本项目将 XMP 预设作为转换目标，而不是 Look。

参考文档：

- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/camera-raw/using/camera-raw-settings.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## 在本地运行

仓库中同时包含以下本地工具：

- 用于自托管的前端网页应用：[`public/`](./public/)
- Python CLI：[`lrtemp2xmp.py`](./lrtemp2xmp.py)

在本地启动网页应用：

```bash
npm install
npm run dev
```

运行 Python CLI：

```bash
python3 lrtemp2xmp.py --input-dir ./presets --output-dir ./converted-xmp --group "User Presets"
```

## 当前支持的嵌套结构

- `ToneCurvePV2012`
- `ToneCurvePV2012Red`
- `ToneCurvePV2012Green`
- `ToneCurvePV2012Blue`
- `GradientBasedCorrections`
- `CircularGradientBasedCorrections`

如果检测到不支持的嵌套设置，转换器会返回错误，而不是省略相关数据。
