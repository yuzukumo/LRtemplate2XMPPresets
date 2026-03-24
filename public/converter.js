const PREFERRED_ATTR_ORDER = [
  "WhiteBalance",
  "Temperature",
  "Tint",
  "IncrementalTemperature",
  "IncrementalTint",
  "Exposure2012",
  "Contrast2012",
  "Highlights2012",
  "Shadows2012",
  "Whites2012",
  "Blacks2012",
  "Texture",
  "Clarity2012",
  "Dehaze",
  "Vibrance",
  "Saturation",
  "ParametricShadows",
  "ParametricDarks",
  "ParametricLights",
  "ParametricHighlights",
  "ParametricShadowSplit",
  "ParametricMidtoneSplit",
  "ParametricHighlightSplit",
  "Sharpness",
  "SharpenRadius",
  "SharpenDetail",
  "SharpenEdgeMasking",
  "LuminanceSmoothing",
  "LuminanceNoiseReductionDetail",
  "LuminanceNoiseReductionContrast",
  "ColorNoiseReduction",
  "ColorNoiseReductionDetail",
  "ColorNoiseReductionSmoothness",
  "HueAdjustmentRed",
  "HueAdjustmentOrange",
  "HueAdjustmentYellow",
  "HueAdjustmentGreen",
  "HueAdjustmentAqua",
  "HueAdjustmentBlue",
  "HueAdjustmentPurple",
  "HueAdjustmentMagenta",
  "SaturationAdjustmentRed",
  "SaturationAdjustmentOrange",
  "SaturationAdjustmentYellow",
  "SaturationAdjustmentGreen",
  "SaturationAdjustmentAqua",
  "SaturationAdjustmentBlue",
  "SaturationAdjustmentPurple",
  "SaturationAdjustmentMagenta",
  "LuminanceAdjustmentRed",
  "LuminanceAdjustmentOrange",
  "LuminanceAdjustmentYellow",
  "LuminanceAdjustmentGreen",
  "LuminanceAdjustmentAqua",
  "LuminanceAdjustmentBlue",
  "LuminanceAdjustmentPurple",
  "LuminanceAdjustmentMagenta",
  "SplitToningShadowHue",
  "SplitToningShadowSaturation",
  "SplitToningHighlightHue",
  "SplitToningHighlightSaturation",
  "SplitToningBalance",
  "AutoLateralCA",
  "LensProfileEnable",
  "LensProfileSetup",
  "LensManualDistortionAmount",
  "VignetteAmount",
  "VignetteMidpoint",
  "PostCropVignetteAmount",
  "PostCropVignetteMidpoint",
  "PostCropVignetteFeather",
  "PostCropVignetteRoundness",
  "PostCropVignetteStyle",
  "PostCropVignetteHighlightContrast",
  "ShadowTint",
  "RedHue",
  "RedSaturation",
  "GreenHue",
  "GreenSaturation",
  "BlueHue",
  "BlueSaturation",
  "DefringePurpleAmount",
  "DefringePurpleHueLo",
  "DefringePurpleHueHi",
  "DefringeGreenAmount",
  "DefringeGreenHueLo",
  "DefringeGreenHueHi",
  "PerspectiveUpright",
  "PerspectiveVertical",
  "PerspectiveHorizontal",
  "PerspectiveRotate",
  "PerspectiveAspect",
  "PerspectiveScale",
  "PerspectiveX",
  "PerspectiveY",
  "UprightCenterMode",
  "UprightCenterNormX",
  "UprightCenterNormY",
  "UprightFocalLength35mm",
  "UprightFocalMode",
  "UprightFourSegmentsCount",
  "UprightPreview",
  "UprightTransformCount",
  "UprightVersion",
  "CropConstrainToWarp",
  "GrainAmount",
  "GrainSize",
  "GrainFrequency",
  "ConvertToGrayscale",
  "ToneCurveName",
  "ToneCurveName2012",
  "CameraProfile",
];

const SPECIAL_TABLE_KEYS = new Set([
  "ToneCurvePV2012",
  "ToneCurvePV2012Red",
  "ToneCurvePV2012Green",
  "ToneCurvePV2012Blue",
  "GradientBasedCorrections",
  "CircularGradientBasedCorrections",
]);

const IGNORED_SETTING_KEYS = new Set([
  "Defringe",
  "EnableCalibration",
  "EnableCircularGradientBasedCorrections",
  "EnableColorAdjustments",
  "EnableDetail",
  "EnableEffects",
  "EnableGradientBasedCorrections",
  "EnableLensCorrections",
  "EnableSplitToning",
  "EnableTransform",
  "orientation",
]);

const ROOT_IGNORED_KEYS = new Set(["version"]);
const VALUE_IGNORED_KEYS = new Set(["uuid"]);

export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
}

class Scalar {
  constructor(kind, value, raw) {
    this.kind = kind;
    this.value = value;
    this.raw = raw;
  }
}

class TableItem {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}

class Table {
  constructor(items) {
    this.items = items;
  }
}

class Parser {
  constructor(text) {
    this.text = text.replace(/^\uFEFF/, "");
    this.length = this.text.length;
    this.index = 0;
  }

  parse() {
    this.skipWs();
    if (this.peekIdentifier() !== null) {
      const start = this.index;
      const ident = this.parseIdentifier();
      this.skipWs();
      if (this.peek("=")) {
        this.index += 1;
        this.skipWs();
        const value = this.parseValue();
        this.skipWs();
        if (this.index !== this.length) {
          throw new ParseError(`Unexpected trailing content at ${this.index}`);
        }
        return new Table([new TableItem(ident, value)]);
      }
      this.index = start;
    }
    const value = this.parseValue();
    this.skipWs();
    if (this.index !== this.length) {
      throw new ParseError(`Unexpected trailing content at ${this.index}`);
    }
    return value;
  }

  parseValue() {
    this.skipWs();
    if (this.peek("{")) {
      return this.parseTable();
    }
    if (this.peek('"')) {
      return this.parseString();
    }
    const ident = this.peekIdentifier();
    if (ident !== null) {
      if (ident === "true" || ident === "false") {
        this.index += ident.length;
        return new Scalar("bool", ident === "true", ident);
      }
      if (ident === "nil") {
        this.index += ident.length;
        return new Scalar("nil", "", "nil");
      }
      throw new ParseError(`Unexpected bare identifier ${ident} at ${this.index}`);
    }
    if (this.peekNumber()) {
      return this.parseNumber();
    }
    throw new ParseError(`Unexpected token at ${this.index}`);
  }

  parseTable() {
    this.consume("{");
    const items = [];
    while (true) {
      this.skipWs();
      if (this.peek("}")) {
        this.index += 1;
        return new Table(items);
      }
      let key = null;
      const start = this.index;
      const ident = this.peekIdentifier();
      if (ident !== null) {
        key = this.parseIdentifier();
        this.skipWs();
        if (this.peek("=")) {
          this.index += 1;
          this.skipWs();
          items.push(new TableItem(key, this.parseValue()));
        } else {
          this.index = start;
          items.push(new TableItem(null, this.parseValue()));
        }
      } else {
        items.push(new TableItem(null, this.parseValue()));
      }
      this.skipWs();
      if (this.peek(",")) {
        this.index += 1;
        continue;
      }
      if (this.peek("}")) {
        this.index += 1;
        return new Table(items);
      }
      throw new ParseError(`Expected ',' or '}' at ${this.index}`);
    }
  }

  parseString() {
    this.consume('"');
    const chars = [];
    while (this.index < this.length) {
      const ch = this.text[this.index];
      this.index += 1;
      if (ch === '"') {
        const value = chars.join("");
        return new Scalar("string", value, value);
      }
      if (ch === "\\") {
        if (this.index >= this.length) {
          throw new ParseError("Unterminated escape sequence");
        }
        const nxt = this.text[this.index];
        this.index += 1;
        const escapes = { '"': '"', "\\": "\\", n: "\n", r: "\r", t: "\t" };
        chars.push(escapes[nxt] ?? nxt);
        continue;
      }
      chars.push(ch);
    }
    throw new ParseError("Unterminated string literal");
  }

  parseNumber() {
    const start = this.index;
    if ("+-".includes(this.text[this.index])) {
      this.index += 1;
    }
    while (this.index < this.length && /\d/.test(this.text[this.index])) {
      this.index += 1;
    }
    if (this.index < this.length && this.text[this.index] === ".") {
      this.index += 1;
      while (this.index < this.length && /\d/.test(this.text[this.index])) {
        this.index += 1;
      }
    }
    const raw = this.text.slice(start, this.index);
    return new Scalar("number", raw, raw);
  }

  parseIdentifier() {
    const ident = this.peekIdentifier();
    if (ident === null) {
      throw new ParseError(`Expected identifier at ${this.index}`);
    }
    this.index += ident.length;
    return ident;
  }

  peekIdentifier() {
    if (this.index >= this.length) {
      return null;
    }
    const ch = this.text[this.index];
    if (!/[A-Za-z_]/.test(ch)) {
      return null;
    }
    let end = this.index + 1;
    while (end < this.length && /[A-Za-z0-9_]/.test(this.text[end])) {
      end += 1;
    }
    return this.text.slice(this.index, end);
  }

  peekNumber() {
    if (this.index >= this.length) {
      return false;
    }
    const ch = this.text[this.index];
    if ("+-".includes(ch)) {
      return this.index + 1 < this.length && /\d/.test(this.text[this.index + 1]);
    }
    return /\d/.test(ch);
  }

  skipWs() {
    while (this.index < this.length && /\s/.test(this.text[this.index])) {
      this.index += 1;
    }
  }

  peek(token) {
    return this.text.startsWith(token, this.index);
  }

  consume(token) {
    if (!this.peek(token)) {
      throw new ParseError(`Expected ${token} at ${this.index}`);
    }
    this.index += token.length;
  }
}

function parseLrtemplateText(text) {
  const root = new Parser(text).parse();
  if (!(root instanceof Table) || root.items.length !== 1 || root.items[0].key !== "s") {
    throw new ParseError("Input does not start with 's = {...}'");
  }
  if (!(root.items[0].value instanceof Table)) {
    throw new ParseError("Root assignment is not a table");
  }
  return root.items[0].value;
}

function keyed(table) {
  const result = new Map();
  for (const item of table.items) {
    if (item.key === null) {
      throw new ParseError("Expected a keyed table");
    }
    result.set(item.key, item.value);
  }
  return result;
}

function positional(table) {
  const result = [];
  for (const item of table.items) {
    if (item.key !== null) {
      throw new ParseError("Expected a positional table");
    }
    result.push(item.value);
  }
  return result;
}

function asScalar(node, label) {
  if (!(node instanceof Scalar)) {
    throw new ParseError(`Expected scalar for ${label}`);
  }
  return node;
}

function asTable(node, label) {
  if (!(node instanceof Table)) {
    throw new ParseError(`Expected table for ${label}`);
  }
  return node;
}

function scalarText(node, { titleCaseBool }) {
  if (node.kind === "bool") {
    if (titleCaseBool) {
      return node.value ? "True" : "False";
    }
    return node.value ? "true" : "false";
  }
  if (node.kind === "nil") {
    return "";
  }
  return String(node.value);
}

function scalarNumberText(node) {
  return node.raw;
}

function processVersionForOutput(sourceValue) {
  if (sourceValue === "6.7" || sourceValue === "10.0") {
    return "10.0";
  }
  return sourceValue;
}

function versionForOutput() {
  return "10.5";
}

function nonzeroScalar(node) {
  if (!node) {
    return false;
  }
  if (node.kind === "bool") {
    return Boolean(node.value);
  }
  if (node.kind === "nil") {
    return false;
  }
  const raw = node.raw.trim();
  const value = Number(raw);
  if (!Number.isNaN(value)) {
    return Math.abs(value) > 1e-9;
  }
  return Boolean(raw);
}

function stableUuid(sourceId, stem) {
  const seed = `lrtemplate:${sourceId}:${stem}`;
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  const parts = seeds.map((initial) => {
    let hash = initial >>> 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0").toUpperCase();
  });
  return parts.join("");
}

function buildAttrOrder(settings) {
  const ordered = PREFERRED_ATTR_ORDER.filter((key) => settings.has(key));
  const leftovers = [...settings.keys()].filter((key) => !ordered.includes(key)).sort();
  return ordered.concat(leftovers);
}

function escapeText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replaceAll('"', "&quot;");
}

function indent(level) {
  return " ".repeat(level);
}

function renderAltTag(tag, value, level) {
  const li =
    value === ""
      ? `${indent(level + 2)}<rdf:li xml:lang="x-default" />`
      : `${indent(level + 2)}<rdf:li xml:lang="x-default">${escapeText(value)}</rdf:li>`;
  return [
    `${indent(level)}<crs:${tag}>`,
    `${indent(level + 1)}<rdf:Alt>`,
    li,
    `${indent(level + 1)}</rdf:Alt>`,
    `${indent(level)}</crs:${tag}>`,
  ];
}

function renderCurve(tag, node, level) {
  const values = positional(asTable(node, tag));
  if (values.length % 2 !== 0) {
    throw new ParseError(`${tag} does not contain point pairs`);
  }
  const lines = [`${indent(level)}<crs:${tag}>`, `${indent(level + 1)}<rdf:Seq>`];
  for (let i = 0; i < values.length; i += 2) {
    const x = scalarNumberText(asScalar(values[i], `${tag}[${i}]`));
    const y = scalarNumberText(asScalar(values[i + 1], `${tag}[${i + 1}]`));
    lines.push(`${indent(level + 2)}<rdf:li>${escapeText(`${x}, ${y}`)}</rdf:li>`);
  }
  lines.push(`${indent(level + 1)}</rdf:Seq>`, `${indent(level)}</crs:${tag}>`);
  return lines;
}

function renderCorrectionMasks(node, level) {
  const lines = [`${indent(level)}<crs:CorrectionMasks>`, `${indent(level + 1)}<rdf:Seq>`];
  for (const maskNode of positional(asTable(node, "CorrectionMasks"))) {
    const mask = keyed(asTable(maskNode, "CorrectionMasks[]"));
    const attrs = [];
    for (const [key, value] of mask.entries()) {
      attrs.push(
        `crs:${key}="${escapeAttr(scalarText(asScalar(value, `mask.${key}`), { titleCaseBool: false }))}"`
      );
    }
    lines.push(`${indent(level + 2)}<rdf:li ${attrs.join(" ")} />`);
  }
  lines.push(`${indent(level + 1)}</rdf:Seq>`, `${indent(level)}</crs:CorrectionMasks>`);
  return lines;
}

function renderCorrectionRangeMask(node, level) {
  const attrs = [];
  for (const [key, value] of keyed(asTable(node, "CorrectionRangeMask")).entries()) {
    attrs.push(
      `crs:${key}="${escapeAttr(scalarText(asScalar(value, `CorrectionRangeMask.${key}`), { titleCaseBool: false }))}"`
    );
  }
  return `${indent(level)}<crs:CorrectionRangeMask ${attrs.join(" ")} />`;
}

function renderCorrections(tag, node, level) {
  const lines = [`${indent(level)}<crs:${tag}>`, `${indent(level + 1)}<rdf:Seq>`];
  for (const correctionNode of positional(asTable(node, tag))) {
    const correction = keyed(asTable(correctionNode, `${tag}[]`));
    const masksNode = correction.get("CorrectionMasks");
    const rangeNode = correction.get("CorrectionRangeMask");
    correction.delete("CorrectionMasks");
    correction.delete("CorrectionRangeMask");

    const attrs = [];
    for (const [key, value] of correction.entries()) {
      if (value instanceof Table) {
        throw new ParseError(`Unsupported nested table in ${tag}.${key}`);
      }
      attrs.push(
        `crs:${key}="${escapeAttr(scalarText(asScalar(value, `${tag}.${key}`), { titleCaseBool: false }))}"`
      );
    }

    if (!masksNode) {
      throw new ParseError(`${tag} entry is missing CorrectionMasks`);
    }

    lines.push(`${indent(level + 2)}<rdf:li>`);
    lines.push(`${indent(level + 3)}<rdf:Description ${attrs.join(" ")}>`);
    lines.push(...renderCorrectionMasks(masksNode, level + 4));
    if (rangeNode) {
      lines.push(renderCorrectionRangeMask(rangeNode, level + 4));
    }
    lines.push(`${indent(level + 3)}</rdf:Description>`);
    lines.push(`${indent(level + 2)}</rdf:li>`);
  }
  lines.push(`${indent(level + 1)}</rdf:Seq>`, `${indent(level)}</crs:${tag}>`);
  return lines;
}

function stemFromName(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

export function convertLrtemplateText(text, options = {}) {
  const fileName = options.fileName ?? "preset.lrtemplate";
  const groupName = options.groupName === undefined ? "User Presets" : options.groupName;
  const root = parseLrtemplateText(text);
  const rootMap = keyed(root);

  for (const key of rootMap.keys()) {
    if (!["id", "internalName", "title", "type", "value"].includes(key) && !ROOT_IGNORED_KEYS.has(key)) {
      throw new ParseError(`Unexpected root key: ${key}`);
    }
  }

  const valueMap = keyed(asTable(rootMap.get("value"), "value"));
  for (const key of valueMap.keys()) {
    if (key !== "settings" && !VALUE_IGNORED_KEYS.has(key)) {
      throw new ParseError(`Unexpected value key: ${key}`);
    }
  }

  const settingsMap = keyed(asTable(valueMap.get("settings"), "settings"));
  for (const [key, value] of settingsMap.entries()) {
    if (value instanceof Table && !SPECIAL_TABLE_KEYS.has(key)) {
      throw new ParseError(`Unsupported nested setting key: ${key}`);
    }
  }

  const processSourceNode = settingsMap.get("ProcessVersion") ?? new Scalar("string", "10.0", "10.0");
  const processSource = scalarText(asScalar(processSourceNode, "ProcessVersion"), { titleCaseBool: true });
  const processVersion = processVersionForOutput(processSource);
  const xmpVersion = versionForOutput(processVersion);
  const sourceId = scalarText(asScalar(rootMap.get("id"), "id"), { titleCaseBool: true });
  const titleNode = rootMap.get("title") ?? rootMap.get("internalName");
  const presetName = scalarText(asScalar(titleNode, "title"), { titleCaseBool: true });

  const scalarSettings = new Map();
  for (const [key, value] of settingsMap.entries()) {
    if (SPECIAL_TABLE_KEYS.has(key) || IGNORED_SETTING_KEYS.has(key) || key === "ProcessVersion") {
      continue;
    }
    if (value instanceof Table) {
      continue;
    }
    scalarSettings.set(key, value);
  }

  const overrideVignette =
    nonzeroScalar(scalarSettings.get("VignetteAmount")) ||
    nonzeroScalar(scalarSettings.get("PostCropVignetteAmount"));
  if (!scalarSettings.has("OverrideLookVignette")) {
    scalarSettings.set(
      "OverrideLookVignette",
      new Scalar("bool", overrideVignette, overrideVignette ? "true" : "false")
    );
  }
  if (!scalarSettings.has("HasSettings")) {
    scalarSettings.set("HasSettings", new Scalar("bool", true, "true"));
  }

  const descAttrs = [
    ['rdf:about', ""],
    ['crs:PresetType', "Normal"],
    ['crs:Cluster', ""],
    ['crs:UUID', stableUuid(sourceId, stemFromName(fileName))],
    ['crs:SupportsAmount', "False"],
    ['crs:SupportsColor', "True"],
    ['crs:SupportsMonochrome', "True"],
    ['crs:SupportsHighDynamicRange', "True"],
    ['crs:SupportsNormalDynamicRange', "True"],
    ['crs:SupportsSceneReferred', "True"],
    ['crs:SupportsOutputReferred', "True"],
    ['crs:CameraModelRestriction', ""],
    ['crs:Copyright', ""],
    ['crs:ContactInfo', ""],
    ['crs:Version', xmpVersion],
    ['crs:ProcessVersion', processVersion],
  ];

  for (const key of buildAttrOrder(scalarSettings)) {
    const value = scalarText(scalarSettings.get(key), { titleCaseBool: true });
    descAttrs.push([`crs:${key}`, value]);
  }

  const lines = [
    '<x:xmpmeta xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:x="adobe:ns:meta/">',
    " <rdf:RDF>",
    `  <rdf:Description ${descAttrs
      .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
      .join(" ")}>`,
    ...renderAltTag("Name", presetName, 3),
    ...renderAltTag("ShortName", "", 3),
    ...renderAltTag("SortName", "", 3),
    ...renderAltTag("Group", groupName, 3),
    ...renderAltTag("Description", "", 3),
  ];

  for (const key of ["ToneCurvePV2012", "ToneCurvePV2012Red", "ToneCurvePV2012Green", "ToneCurvePV2012Blue"]) {
    if (settingsMap.has(key)) {
      lines.push(...renderCurve(key, settingsMap.get(key), 3));
    }
  }

  if (settingsMap.has("GradientBasedCorrections")) {
    lines.push(...renderCorrections("GradientBasedCorrections", settingsMap.get("GradientBasedCorrections"), 3));
  }
  if (settingsMap.has("CircularGradientBasedCorrections")) {
    lines.push(
      ...renderCorrections(
        "CircularGradientBasedCorrections",
        settingsMap.get("CircularGradientBasedCorrections"),
        3
      )
    );
  }

  lines.push('   <crs:Look crs:Name="" />', "  </rdf:Description>", " </rdf:RDF>", "</x:xmpmeta>");

  const warnings = [];
  const missingDefaults = ["Temperature", "Tint", "WhiteBalance", "Exposure2012", "Contrast2012"].filter(
    (key) => !scalarSettings.has(key)
  );
  if (missingDefaults.length) {
    warnings.push(`${fileName}: missing common scalar keys ${missingDefaults.join(", ")}`);
  }

  return {
    outputFileName: `${stemFromName(fileName)}.xmp`,
    displayName: presetName,
    xmpText: lines.join("\n"),
    warnings,
  };
}

export function validateXmpText(xmpText, expectedGroup) {
  if (!/crs:PresetType="Normal"/.test(xmpText)) {
    throw new ParseError("Output is missing PresetType=Normal");
  }
  if (!/crs:UUID="[^"]+"/.test(xmpText)) {
    throw new ParseError("Output is missing a UUID");
  }
  const groupMatch = xmpText.match(
    /<crs:Group>\s*<rdf:Alt>\s*(?:<rdf:li xml:lang="x-default">([\s\S]*?)<\/rdf:li>|<rdf:li xml:lang="x-default"\s*\/>)/
  );
  const groupValue = groupMatch ? (groupMatch[1] ?? "") : null;
  if (groupValue === null || groupValue !== expectedGroup) {
    throw new ParseError("Output group does not match the requested group");
  }
  const nameMatch = xmpText.match(
    /<crs:Name>\s*<rdf:Alt>\s*<rdf:li xml:lang="x-default">([\s\S]*?)<\/rdf:li>/
  );
  if (!nameMatch || !nameMatch[1].trim()) {
    throw new ParseError("Output is missing a display name");
  }
  return true;
}
