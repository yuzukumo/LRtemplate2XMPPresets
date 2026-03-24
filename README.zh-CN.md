# LRTemplate2XMPFormatter

[English](./README.md) | 简体中文 | [繁體中文（台灣）](./README.zh-TW.md)

把旧版 Lightroom `.lrtemplate` 显影预设转换成现代 `.xmp` 预设文件。

## 生成结果

- 输出类型：`XMP preset`
- `crs:PresetType="Normal"`
- 使用现代 Camera Raw / Lightroom 预设元数据结构
- 保留曲线
- 在源文件存在时保留渐变和圆形局部修正

这个项目**不会**把预设转换成 `Look/profile` 类型的 XMP。

## 为什么这样做

Adobe 官方文档说明，旧 `.lrtemplate` 预设在 Lightroom Classic 中会迁移成新的 **XMP preset** 格式。  
所以从兼容性和语义上看，`.lrtemplate -> XMP preset` 才是最接近官方路线、也最稳妥的目标。

参考资料：

- https://helpx.adobe.com/lightroom-classic/kb/preference-file-and-other-file-locations.html
- https://helpx.adobe.com/lightroom-classic/help/apply-presets.html
- https://developer.adobe.com/xmp/docs/xmp-namespaces/crs/
- https://github.com/AdobeDocs/cis-photoshop-api-docs/blob/main/sample-code/lr-sample-app/crs.xml

## 实现方式

### Python CLI

文件：[`lrtemp2xmp.py`](./lrtemp2xmp.py)

特点：

- 真正解析 LRTemplate 结构，而不是用松散正则硬搜
- 遇到不支持的嵌套表会直接报错，不会悄悄丢字段
- 输出前会做 XMP 基本校验

用法：

```bash
python3 lrtemp2xmp.py --input-dir ./presets --output-dir ./converted-xmp --group "User Presets"
```

### Cloudflare Worker 前端版

文件：

- [`public/`](./public/)
- [`src/index.js`](./src/index.js)
- [`wrangler.jsonc`](./wrangler.jsonc)

特点：

- 转换在浏览器本地完成
- 不需要后端转换服务
- Worker 只负责静态资源托管
- 支持批量转换和 ZIP 下载

参考资料：

- https://developers.cloudflare.com/workers/static-assets/

本地运行：

```bash
npm install
npm run dev
```

部署：

```bash
npm install
npm run deploy
```

## 当前支持的嵌套结构

- `ToneCurvePV2012`
- `ToneCurvePV2012Red`
- `ToneCurvePV2012Green`
- `ToneCurvePV2012Blue`
- `GradientBasedCorrections`
- `CircularGradientBasedCorrections`

如果遇到不支持的嵌套设置，转换器会故意报错，避免生成表面成功、实际不完整的 XMP。
