#!/usr/bin/env python3
"""Convert Lightroom .lrtemplate presets into importable .xmp presets."""

from __future__ import annotations

import argparse
import shutil
import uuid
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path


NS = {
    "x": "adobe:ns:meta/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "crs": "http://ns.adobe.com/camera-raw-settings/1.0/",
}

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


PREFERRED_ATTR_ORDER = [
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
]

SPECIAL_TABLE_KEYS = {
    "ToneCurvePV2012",
    "ToneCurvePV2012Red",
    "ToneCurvePV2012Green",
    "ToneCurvePV2012Blue",
    "GradientBasedCorrections",
    "CircularGradientBasedCorrections",
}

IGNORED_SETTING_KEYS = {
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
}

ROOT_IGNORED_KEYS = {"version"}
VALUE_IGNORED_KEYS = {"uuid"}


@dataclass(frozen=True)
class Scalar:
    kind: str
    value: str | bool
    raw: str


@dataclass(frozen=True)
class TableItem:
    key: str | None
    value: "Node"


@dataclass(frozen=True)
class Table:
    items: list[TableItem]


Node = Scalar | Table


class ParseError(RuntimeError):
    pass


class Parser:
    def __init__(self, text: str) -> None:
        self.text = text.lstrip("\ufeff")
        self.length = len(self.text)
        self.index = 0

    def parse(self) -> Node:
        self._skip_ws()
        if self._peek_identifier() is not None:
            start = self.index
            ident = self._parse_identifier()
            self._skip_ws()
            if self._peek("="):
                self.index += 1
                self._skip_ws()
                value = self._parse_value()
                self._skip_ws()
                if self.index != self.length:
                    raise ParseError(f"Unexpected trailing content at {self.index}")
                return Table([TableItem(ident, value)])
            self.index = start
        value = self._parse_value()
        self._skip_ws()
        if self.index != self.length:
            raise ParseError(f"Unexpected trailing content at {self.index}")
        return value

    def _parse_value(self) -> Node:
        self._skip_ws()
        if self._peek("{"):
            return self._parse_table()
        if self._peek('"'):
            return self._parse_string()
        ident = self._peek_identifier()
        if ident is not None:
            if ident in {"true", "false"}:
                self.index += len(ident)
                return Scalar("bool", ident == "true", ident)
            if ident == "nil":
                self.index += len(ident)
                return Scalar("nil", "", "nil")
            raise ParseError(f"Unexpected bare identifier {ident!r} at {self.index}")
        if self._peek_number():
            return self._parse_number()
        raise ParseError(f"Unexpected token at {self.index}")

    def _parse_table(self) -> Table:
        self._consume("{")
        items: list[TableItem] = []
        while True:
            self._skip_ws()
            if self._peek("}"):
                self.index += 1
                return Table(items)
            key: str | None = None
            start = self.index
            ident = self._peek_identifier()
            if ident is not None:
                key = self._parse_identifier()
                self._skip_ws()
                if self._peek("="):
                    self.index += 1
                    self._skip_ws()
                    value = self._parse_value()
                    items.append(TableItem(key, value))
                else:
                    self.index = start
                    value = self._parse_value()
                    items.append(TableItem(None, value))
            else:
                value = self._parse_value()
                items.append(TableItem(None, value))
            self._skip_ws()
            if self._peek(","):
                self.index += 1
                continue
            if self._peek("}"):
                self.index += 1
                return Table(items)
            raise ParseError(f"Expected ',' or '}}' at {self.index}")

    def _parse_string(self) -> Scalar:
        self._consume('"')
        chars: list[str] = []
        while self.index < self.length:
            ch = self.text[self.index]
            self.index += 1
            if ch == '"':
                return Scalar("string", "".join(chars), "".join(chars))
            if ch == "\\":
                if self.index >= self.length:
                    raise ParseError("Unterminated escape sequence")
                nxt = self.text[self.index]
                self.index += 1
                escapes = {
                    '"': '"',
                    "\\": "\\",
                    "n": "\n",
                    "r": "\r",
                    "t": "\t",
                }
                chars.append(escapes.get(nxt, nxt))
                continue
            chars.append(ch)
        raise ParseError("Unterminated string literal")

    def _parse_number(self) -> Scalar:
        start = self.index
        if self.text[self.index] in "+-":
            self.index += 1
        while self.index < self.length and self.text[self.index].isdigit():
            self.index += 1
        if self.index < self.length and self.text[self.index] == ".":
            self.index += 1
            while self.index < self.length and self.text[self.index].isdigit():
                self.index += 1
        raw = self.text[start:self.index]
        return Scalar("number", raw, raw)

    def _parse_identifier(self) -> str:
        ident = self._peek_identifier()
        if ident is None:
            raise ParseError(f"Expected identifier at {self.index}")
        self.index += len(ident)
        return ident

    def _peek_identifier(self) -> str | None:
        if self.index >= self.length:
            return None
        ch = self.text[self.index]
        if not (ch.isalpha() or ch == "_"):
            return None
        end = self.index + 1
        while end < self.length and (
            self.text[end].isalnum() or self.text[end] == "_"
        ):
            end += 1
        return self.text[self.index:end]

    def _peek_number(self) -> bool:
        if self.index >= self.length:
            return False
        ch = self.text[self.index]
        if ch in "+-":
            return self.index + 1 < self.length and self.text[self.index + 1].isdigit()
        return ch.isdigit()

    def _skip_ws(self) -> None:
        while self.index < self.length and self.text[self.index].isspace():
            self.index += 1

    def _peek(self, token: str) -> bool:
        return self.text.startswith(token, self.index)

    def _consume(self, token: str) -> None:
        if not self._peek(token):
            raise ParseError(f"Expected {token!r} at {self.index}")
        self.index += len(token)


def parse_lrtemplate(path: Path) -> Table:
    root = Parser(path.read_text(encoding="utf-8", errors="ignore")).parse()
    if not isinstance(root, Table) or len(root.items) != 1 or root.items[0].key != "s":
        raise ParseError(f"{path} does not start with 's = {{...}}'")
    value = root.items[0].value
    if not isinstance(value, Table):
        raise ParseError(f"{path} root assignment is not a table")
    return value


def keyed(table: Table) -> dict[str, Node]:
    result: dict[str, Node] = {}
    for item in table.items:
        if item.key is None:
            raise ParseError("Expected a keyed table")
        result[item.key] = item.value
    return result


def positional(table: Table) -> list[Node]:
    result: list[Node] = []
    for item in table.items:
        if item.key is not None:
            raise ParseError("Expected a positional table")
        result.append(item.value)
    return result


def as_scalar(node: Node, label: str) -> Scalar:
    if not isinstance(node, Scalar):
        raise ParseError(f"Expected scalar for {label}")
    return node


def as_table(node: Node, label: str) -> Table:
    if not isinstance(node, Table):
        raise ParseError(f"Expected table for {label}")
    return node


def scalar_text(node: Scalar, *, title_case_bool: bool) -> str:
    if node.kind == "bool":
        if title_case_bool:
            return "True" if node.value else "False"
        return "true" if node.value else "false"
    if node.kind == "nil":
        return ""
    return str(node.value)


def scalar_number_text(node: Scalar) -> str:
    return node.raw


def process_version_for_output(source_value: str) -> str:
    if source_value in {"6.7", "10.0"}:
        return "10.0"
    return source_value


def version_for_output(process_version: str) -> str:
    if process_version == "10.0":
        return "10.5"
    return "10.5"


def make_alt_tag(parent: ET.Element, tag: str, text: str) -> None:
    elem = ET.SubElement(parent, f"{{{NS['crs']}}}{tag}")
    alt = ET.SubElement(elem, f"{{{NS['rdf']}}}Alt")
    li = ET.SubElement(alt, f"{{{NS['rdf']}}}li")
    li.set("{http://www.w3.org/XML/1998/namespace}lang", "x-default")
    li.text = text


def make_empty_alt_tag(parent: ET.Element, tag: str) -> None:
    make_alt_tag(parent, tag, "")


def add_curve(parent: ET.Element, tag: str, node: Node) -> None:
    values = positional(as_table(node, tag))
    if len(values) % 2:
        raise ParseError(f"{tag} does not contain point pairs")
    elem = ET.SubElement(parent, f"{{{NS['crs']}}}{tag}")
    seq = ET.SubElement(elem, f"{{{NS['rdf']}}}Seq")
    for index in range(0, len(values), 2):
        x = scalar_number_text(as_scalar(values[index], f"{tag}[{index}]"))
        y = scalar_number_text(as_scalar(values[index + 1], f"{tag}[{index + 1}]"))
        li = ET.SubElement(seq, f"{{{NS['rdf']}}}li")
        li.text = f"{x}, {y}"


def add_correction_masks(parent: ET.Element, masks_table: Table) -> None:
    masks = ET.SubElement(parent, f"{{{NS['crs']}}}CorrectionMasks")
    seq = ET.SubElement(masks, f"{{{NS['rdf']}}}Seq")
    for mask_node in positional(masks_table):
        mask = keyed(as_table(mask_node, "CorrectionMasks[]"))
        li = ET.SubElement(seq, f"{{{NS['rdf']}}}li")
        for key, value in mask.items():
            li.set(
                f"{{{NS['crs']}}}{key}",
                scalar_text(as_scalar(value, f"mask.{key}"), title_case_bool=False),
            )


def add_correction_range_mask(parent: ET.Element, range_node: Table) -> None:
    range_elem = ET.SubElement(parent, f"{{{NS['crs']}}}CorrectionRangeMask")
    for key, value in keyed(range_node).items():
        range_elem.set(
            f"{{{NS['crs']}}}{key}",
            scalar_text(
                as_scalar(value, f"CorrectionRangeMask.{key}"),
                title_case_bool=False,
            ),
        )


def add_corrections(parent: ET.Element, tag: str, node: Node) -> None:
    corrections = ET.SubElement(parent, f"{{{NS['crs']}}}{tag}")
    seq = ET.SubElement(corrections, f"{{{NS['rdf']}}}Seq")
    for correction_node in positional(as_table(node, tag)):
        correction = keyed(as_table(correction_node, f"{tag}[]"))
        li = ET.SubElement(seq, f"{{{NS['rdf']}}}li")
        desc = ET.SubElement(li, f"{{{NS['rdf']}}}Description")
        masks_node = correction.pop("CorrectionMasks", None)
        range_node = correction.pop("CorrectionRangeMask", None)
        for key, value in correction.items():
            if isinstance(value, Table):
                raise ParseError(f"Unsupported nested table in {tag}.{key}")
            desc.set(
                f"{{{NS['crs']}}}{key}",
                scalar_text(as_scalar(value, f"{tag}.{key}"), title_case_bool=False),
            )
        if masks_node is None:
            raise ParseError(f"{tag} entry is missing CorrectionMasks")
        add_correction_masks(desc, as_table(masks_node, f"{tag}.CorrectionMasks"))
        if range_node is not None:
            add_correction_range_mask(
                desc,
                as_table(range_node, f"{tag}.CorrectionRangeMask"),
            )


def nonzero_scalar(node: Scalar | None) -> bool:
    if node is None:
        return False
    if node.kind == "bool":
        return bool(node.value)
    if node.kind == "nil":
        return False
    raw = node.raw.strip()
    try:
        return abs(float(raw)) > 1e-9
    except ValueError:
        return bool(raw)


def stable_uuid(source_id: str, stem: str) -> str:
    base = uuid.uuid5(uuid.NAMESPACE_URL, f"lrtemplate:{source_id}:{stem}")
    return base.hex.upper()


def build_attr_order(settings: dict[str, Scalar]) -> list[str]:
    ordered = [key for key in PREFERRED_ATTR_ORDER if key in settings]
    leftovers = sorted(key for key in settings if key not in ordered)
    return ordered + leftovers


def convert_preset(source_path: Path, target_path: Path, group_name: str) -> list[str]:
    root = parse_lrtemplate(source_path)
    root_map = keyed(root)
    expected_root = {"id", "internalName", "title", "type", "value", *ROOT_IGNORED_KEYS}
    unexpected_root = sorted(key for key in root_map if key not in expected_root)
    if unexpected_root:
        raise ParseError(f"{source_path} has unexpected root keys: {unexpected_root}")

    value_map = keyed(as_table(root_map["value"], "value"))
    expected_value = {"settings", *VALUE_IGNORED_KEYS}
    unexpected_value = sorted(key for key in value_map if key not in expected_value)
    if unexpected_value:
        raise ParseError(f"{source_path} has unexpected value keys: {unexpected_value}")

    settings_map = keyed(as_table(value_map["settings"], "settings"))
    unsupported = sorted(
        key
        for key, value in settings_map.items()
        if isinstance(value, Table) and key not in SPECIAL_TABLE_KEYS
    )
    if unsupported:
        raise ParseError(
            f"{source_path} has unsupported nested setting keys: {unsupported}"
        )

    process_source = scalar_text(
        as_scalar(
            settings_map.get("ProcessVersion", Scalar("string", "10.0", "10.0")),
            "ProcessVersion",
        ),
        title_case_bool=True,
    )
    process_version = process_version_for_output(process_source)
    xmp_version = version_for_output(process_version)
    source_id = scalar_text(as_scalar(root_map["id"], "id"), title_case_bool=True)
    preset_name = scalar_text(
        as_scalar(root_map.get("title", root_map.get("internalName")), "title"),
        title_case_bool=True,
    )

    xmpmeta = ET.Element(f"{{{NS['x']}}}xmpmeta")
    rdf = ET.SubElement(xmpmeta, f"{{{NS['rdf']}}}RDF")
    desc = ET.SubElement(rdf, f"{{{NS['rdf']}}}Description")
    desc.set(f"{{{NS['rdf']}}}about", "")
    desc.set(f"{{{NS['crs']}}}PresetType", "Normal")
    desc.set(f"{{{NS['crs']}}}Cluster", "")
    desc.set(f"{{{NS['crs']}}}UUID", stable_uuid(source_id, source_path.stem))
    desc.set(f"{{{NS['crs']}}}SupportsAmount", "False")
    desc.set(f"{{{NS['crs']}}}SupportsColor", "True")
    desc.set(f"{{{NS['crs']}}}SupportsMonochrome", "True")
    desc.set(f"{{{NS['crs']}}}SupportsHighDynamicRange", "True")
    desc.set(f"{{{NS['crs']}}}SupportsNormalDynamicRange", "True")
    desc.set(f"{{{NS['crs']}}}SupportsSceneReferred", "True")
    desc.set(f"{{{NS['crs']}}}SupportsOutputReferred", "True")
    desc.set(f"{{{NS['crs']}}}CameraModelRestriction", "")
    desc.set(f"{{{NS['crs']}}}Copyright", "")
    desc.set(f"{{{NS['crs']}}}ContactInfo", "")
    desc.set(f"{{{NS['crs']}}}Version", xmp_version)
    desc.set(f"{{{NS['crs']}}}ProcessVersion", process_version)

    scalar_settings: dict[str, Scalar] = {}
    for key, value in settings_map.items():
        if key in SPECIAL_TABLE_KEYS or key in IGNORED_SETTING_KEYS or key == "ProcessVersion":
            continue
        if isinstance(value, Table):
            continue
        scalar_settings[key] = value

    override_vignette = nonzero_scalar(
        scalar_settings.get("VignetteAmount")
    ) or nonzero_scalar(scalar_settings.get("PostCropVignetteAmount"))
    scalar_settings.setdefault(
        "OverrideLookVignette",
        Scalar("bool", override_vignette, "true" if override_vignette else "false"),
    )
    scalar_settings.setdefault("HasSettings", Scalar("bool", True, "true"))

    for key in build_attr_order(scalar_settings):
        desc.set(
            f"{{{NS['crs']}}}{key}",
            scalar_text(scalar_settings[key], title_case_bool=True),
        )

    make_alt_tag(desc, "Name", preset_name)
    make_empty_alt_tag(desc, "ShortName")
    make_empty_alt_tag(desc, "SortName")
    make_alt_tag(desc, "Group", group_name)
    make_empty_alt_tag(desc, "Description")

    for curve_key in [
        "ToneCurvePV2012",
        "ToneCurvePV2012Red",
        "ToneCurvePV2012Green",
        "ToneCurvePV2012Blue",
    ]:
        if curve_key in settings_map:
            add_curve(desc, curve_key, settings_map[curve_key])

    if "GradientBasedCorrections" in settings_map:
        add_corrections(
            desc,
            "GradientBasedCorrections",
            settings_map["GradientBasedCorrections"],
        )
    if "CircularGradientBasedCorrections" in settings_map:
        add_corrections(
            desc,
            "CircularGradientBasedCorrections",
            settings_map["CircularGradientBasedCorrections"],
        )

    look = ET.SubElement(desc, f"{{{NS['crs']}}}Look")
    look.set(f"{{{NS['crs']}}}Name", "")

    tree = ET.ElementTree(xmpmeta)
    ET.indent(tree, space=" ", level=0)
    tree.write(target_path, encoding="utf-8", xml_declaration=False)

    warnings: list[str] = []
    missing_defaults = sorted(
        key
        for key in ["Temperature", "Tint", "WhiteBalance", "Exposure2012", "Contrast2012"]
        if key not in scalar_settings
    )
    if missing_defaults:
        warnings.append(
            f"{source_path.name}: missing common scalar keys "
            f"{', '.join(missing_defaults)}"
        )
    return warnings


def validate_output(path: Path, expected_group: str) -> None:
    root = ET.fromstring(path.read_text(encoding="utf-8", errors="ignore"))
    desc = root.find(".//rdf:Description", NS)
    if desc is None:
        raise ParseError(f"{path} is missing rdf:Description")
    if desc.get(f"{{{NS['crs']}}}PresetType") != "Normal":
        raise ParseError(f"{path} is missing PresetType=Normal")
    if desc.get(f"{{{NS['crs']}}}UUID") in {"", None}:
        raise ParseError(f"{path} is missing a UUID")
    group = root.find(".//crs:Group/rdf:Alt/rdf:li", NS)
    if group is None or group.text != expected_group:
        raise ParseError(f"{path} group mismatch")
    name = root.find(".//crs:Name/rdf:Alt/rdf:li", NS)
    if name is None or not (name.text or "").strip():
        raise ParseError(f"{path} is missing a display name")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Lightroom LRTemplate presets into modern XMP presets."
    )
    parser.add_argument(
        "--input-dir",
        default=".",
        help="Directory containing .lrtemplate files. Defaults to the current directory.",
    )
    parser.add_argument(
        "--output-dir",
        default="converted-xmp",
        help="Directory where converted .xmp files will be written.",
    )
    parser.add_argument(
        "--group",
        default="User Presets",
        help="Lightroom preset group name to write into the XMP metadata.",
    )
    parser.add_argument(
        "--replace-output",
        action="store_true",
        help="Delete and recreate the output directory before writing files.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    if not input_dir.exists():
        raise SystemExit(f"Input directory does not exist: {input_dir}")

    sources = sorted(input_dir.glob("*.lrtemplate"))
    if not sources:
        raise SystemExit(f"No .lrtemplate files found in {input_dir}")

    if output_dir.exists() and args.replace_output:
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    warnings: list[str] = []
    used_names: set[str] = set()
    converted: list[Path] = []
    for source in sources:
        candidate = f"{source.stem}.xmp"
        if candidate in used_names:
            suffix = 2
            while f"{source.stem} {suffix}.xmp" in used_names:
                suffix += 1
            candidate = f"{source.stem} {suffix}.xmp"
        used_names.add(candidate)
        target = output_dir / candidate
        warnings.extend(convert_preset(source, target, args.group))
        validate_output(target, args.group)
        converted.append(target)

    print(f"Converted {len(converted)} preset(s) into {output_dir}")
    if warnings:
        print("Warnings:")
        for item in warnings:
            print(f"  {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
