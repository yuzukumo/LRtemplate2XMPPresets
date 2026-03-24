# LRTemplate2XMPFormatter

[English](./README.md) | 简体中文 | [繁體中文（台灣）](./README.zh-TW.md)

把旧版 Lightroom `.lrtemplate` 显影预设转换成现代 `.xmp` 预设文件。

## 直接在线使用

已部署网页版：[bridge.yuuhi.de](https://bridge.yuuhi.de)

对大多数用户来说，直接打开网页就够了：

- 转换完全在浏览器内完成
- 不上传文件
- 不需要自己部署
- 不需要 Python CLI

## 输出结果

- 输出类型：`XMP preset`
- `crs:PresetType="Normal"`
- 使用现代 Camera Raw / Lightroom 预设元数据结构
- 保留曲线
- 在源文件存在时保留渐变和圆形局部修正

这个项目**不会**把预设转换成 `Look/profile` 类型的 XMP。

## 为什么是 XMP Preset，不是 Look

Adobe 官方文档说明，旧 `.lrtemplate` 预设在 Lightroom Classic 中会迁移成新的 **XMP preset** 格式。所以从兼容性和语义上看，`.lrtemplate -> XMP preset` 才是最接近官方路线、也最稳妥的目标。

参考资料：

- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## 可选的本地工具

仓库里仍然保留了：

- 可自行托管的纯前端网页版：[`public/`](./public/)
- 用于本地校验或批量处理的 Python CLI：[`lrtemp2xmp.py`](./lrtemp2xmp.py)

本地网页开发：

```bash
npm install
npm run dev
```

可选 CLI 用法：

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

如果遇到不支持的嵌套设置，转换器会直接报错，而不是悄悄丢掉数据。
