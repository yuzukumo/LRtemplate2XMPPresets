import { convertLrtemplateText, validateXmpText } from "./converter.js";
import { createZipBlob } from "./zip.js";

const DEFAULT_GROUP_NAME = "User Presets";
const DEFAULT_LANGUAGE = "en";
const LANGUAGE_STORAGE_KEY = "lrtemplate2xmp-language";

const STRINGS = {
  en: {
    pageTitle: "LRTemplate to XMP Preset",
    languageSwitcher: "Language",
    heroTitle: 'Convert legacy <code>.lrtemplate</code> files into XMP presets',
    heroLead:
      "Conversion runs entirely in your browser. The Cloudflare Worker only serves this static app and never uploads your preset files.",
    groupNameLabel: "Preset group",
    overrideGroupLabel: "Override",
    groupPlaceholder: "Leave the group unchanged",
    groupHint:
      "Disabled by default. Turn this on only if you want every converted preset to use the same Lightroom group.",
    fileInputLabel: 'Select <code>.lrtemplate</code> files',
    fileSelectionAria: "File selection",
    browseButton: "Choose Files",
    noFilesSelected: "No files selected.",
    filesSelected: (count) => `${count} files selected`,
    dropZone: 'Drop <code>.lrtemplate</code> files here',
    convertButton: "Convert Files",
    downloadButton: "Download ZIP",
    clearButton: "Clear",
    notesTitle: "What this app outputs",
    note1: 'XMP preset files with <code>crs:PresetType="Normal"</code>.',
    note2: "Modern XMP metadata aligned to Adobe Camera Raw preset structure.",
    note3: "Tone curves, gradient masks, and circular masks when present.",
    note4: "Configured group names via the input above.",
    resultsTitle: "Results",
    summaryIdle: "No files converted yet.",
    summaryReady: (count) => `${count} file(s) ready to convert.`,
    summaryNeedsFiles: "Select at least one .lrtemplate file first.",
    summaryConverted: (done, total) => `Converted ${done} of ${total} file(s) into XMP presets.`,
    summaryConversionFailed: "Conversion failed.",
    sourceHeader: "Source",
    outputHeader: "Output",
    statusHeader: "Status",
    downloadHeader: "Download",
    saveLink: "Save",
    statusOk: "OK",
    statusOkWarnings: (count) => `OK with ${count} warning(s)`,
    unknownError: "Unknown error",
    zipFileName: "converted-xmp.zip",
  },
  "zh-CN": {
    pageTitle: "LRTemplate 转 XMP 预设",
    languageSwitcher: "语言",
    heroTitle: '把旧版 <code>.lrtemplate</code> 转成 XMP 预设',
    heroLead:
      "转换完全在浏览器本地进行。Cloudflare Worker 只负责提供这个静态页面，不会上传你的预设文件。",
    groupNameLabel: "预设分组",
    overrideGroupLabel: "统一覆盖",
    groupPlaceholder: "默认不修改分组",
    groupHint: "默认关闭。只有开启后，导出的所有预设才会统一写入同一个 Lightroom 分组。",
    fileInputLabel: '选择 <code>.lrtemplate</code> 文件',
    fileSelectionAria: "文件选择",
    browseButton: "选择文件",
    noFilesSelected: "尚未选择文件。",
    filesSelected: (count) => `已选择 ${count} 个文件`,
    dropZone: '把 <code>.lrtemplate</code> 文件拖到这里',
    convertButton: "开始转换",
    downloadButton: "下载 ZIP",
    clearButton: "清空",
    notesTitle: "这个页面会输出什么",
    note1: '生成 <code>crs:PresetType="Normal"</code> 的 XMP 预设文件。',
    note2: "使用现代 Adobe Camera Raw / Lightroom 预设元数据结构。",
    note3: "在源文件存在时保留曲线、渐变蒙版和圆形蒙版。",
    note4: "如果你启用了上方选项，也会写入你指定的分组名。",
    resultsTitle: "转换结果",
    summaryIdle: "还没有转换任何文件。",
    summaryReady: (count) => `已有 ${count} 个文件可转换。`,
    summaryNeedsFiles: "请先至少选择一个 .lrtemplate 文件。",
    summaryConverted: (done, total) => `已成功把 ${done} / ${total} 个文件转换为 XMP 预设。`,
    summaryConversionFailed: "转换失败。",
    sourceHeader: "源文件",
    outputHeader: "输出文件",
    statusHeader: "状态",
    downloadHeader: "下载",
    saveLink: "保存",
    statusOk: "成功",
    statusOkWarnings: (count) => `成功，附带 ${count} 条警告`,
    unknownError: "未知错误",
    zipFileName: "converted-xmp.zip",
  },
  "zh-TW": {
    pageTitle: "LRTemplate 轉 XMP 預設",
    languageSwitcher: "語言",
    heroTitle: '把舊版 <code>.lrtemplate</code> 轉成 XMP 預設',
    heroLead:
      "轉換完全在瀏覽器本地進行。Cloudflare Worker 只負責提供這個靜態頁面，不會上傳你的預設檔案。",
    groupNameLabel: "預設分組",
    overrideGroupLabel: "統一覆寫",
    groupPlaceholder: "預設不修改分組",
    groupHint: "預設關閉。只有開啟後，匯出的所有預設才會統一寫入同一個 Lightroom 分組。",
    fileInputLabel: '選擇 <code>.lrtemplate</code> 檔案',
    fileSelectionAria: "檔案選擇",
    browseButton: "選擇檔案",
    noFilesSelected: "尚未選擇檔案。",
    filesSelected: (count) => `已選擇 ${count} 個檔案`,
    dropZone: '把 <code>.lrtemplate</code> 檔案拖到這裡',
    convertButton: "開始轉換",
    downloadButton: "下載 ZIP",
    clearButton: "清空",
    notesTitle: "這個頁面會輸出什麼",
    note1: '產生 <code>crs:PresetType="Normal"</code> 的 XMP 預設檔。',
    note2: "使用現代 Adobe Camera Raw / Lightroom 預設中繼資料結構。",
    note3: "在來源檔存在時保留曲線、漸變遮罩與圓形遮罩。",
    note4: "如果你啟用了上方選項，也會寫入你指定的分組名稱。",
    resultsTitle: "轉換結果",
    summaryIdle: "還沒有轉換任何檔案。",
    summaryReady: (count) => `已有 ${count} 個檔案可轉換。`,
    summaryNeedsFiles: "請先至少選擇一個 .lrtemplate 檔案。",
    summaryConverted: (done, total) => `已成功把 ${done} / ${total} 個檔案轉換為 XMP 預設。`,
    summaryConversionFailed: "轉換失敗。",
    sourceHeader: "來源檔案",
    outputHeader: "輸出檔案",
    statusHeader: "狀態",
    downloadHeader: "下載",
    saveLink: "儲存",
    statusOk: "成功",
    statusOkWarnings: (count) => `成功，附帶 ${count} 條警告`,
    unknownError: "未知錯誤",
    zipFileName: "converted-xmp.zip",
  },
};

const groupNameInput = document.querySelector("#groupName");
const overrideGroupInput = document.querySelector("#overrideGroup");
const fileInput = document.querySelector("#fileInput");
const filePicker = document.querySelector("#filePicker");
const browseButton = document.querySelector("#browseButton");
const fileSelection = document.querySelector("#fileSelection");
const dropZone = document.querySelector("#dropZone");
const convertButton = document.querySelector("#convertButton");
const downloadButton = document.querySelector("#downloadButton");
const clearButton = document.querySelector("#clearButton");
const summary = document.querySelector("#summary");
const resultsBody = document.querySelector("#resultsBody");
const localeSwitcher = document.querySelector("#localeSwitcher");
const localeButtons = [...document.querySelectorAll(".locale-button")];

let currentLanguage = DEFAULT_LANGUAGE;
let selectedFiles = [];
let convertedEntries = [];
let resultRows = [];
let summaryState = { type: "idle" };

function t(key, ...args) {
  const entry = STRINGS[currentLanguage][key];
  return typeof entry === "function" ? entry(...args) : entry;
}

function setText(selector, key) {
  document.querySelector(selector).textContent = t(key);
}

function setHtml(selector, key) {
  document.querySelector(selector).innerHTML = t(key);
}

function resolveInitialLanguage() {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && STRINGS[saved]) {
      return saved;
    }
  } catch {
    // Ignore storage access errors and fall back to English.
  }
  return DEFAULT_LANGUAGE;
}

function applyLanguage(language) {
  if (!STRINGS[language]) {
    return;
  }

  currentLanguage = language;
  document.documentElement.lang = language;
  document.title = t("pageTitle");
  localeSwitcher.setAttribute("aria-label", t("languageSwitcher"));
  filePicker.setAttribute("aria-label", t("fileSelectionAria"));

  setHtml("#heroTitle", "heroTitle");
  setText("#heroLead", "heroLead");
  setText("#groupNameLabel", "groupNameLabel");
  setText("#overrideGroupLabel", "overrideGroupLabel");
  groupNameInput.placeholder = t("groupPlaceholder");
  setText("#groupHint", "groupHint");
  setHtml("#fileInputLabel", "fileInputLabel");
  browseButton.textContent = t("browseButton");
  setHtml("#dropZone", "dropZone");
  convertButton.textContent = t("convertButton");
  downloadButton.textContent = t("downloadButton");
  clearButton.textContent = t("clearButton");
  setText("#notesTitle", "notesTitle");
  setHtml("#note1", "note1");
  setText("#note2", "note2");
  setText("#note3", "note3");
  setText("#note4", "note4");
  setText("#resultsTitle", "resultsTitle");
  setText("#sourceHeader", "sourceHeader");
  setText("#outputHeader", "outputHeader");
  setText("#statusHeader", "statusHeader");
  setText("#downloadHeader", "downloadHeader");

  localeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === language);
  });

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage access errors.
  }

  renderSelectedFilesText();
  renderResults(resultRows);
  renderSummary();
}

function syncGroupOverrideState() {
  const enabled = overrideGroupInput.checked;
  groupNameInput.disabled = !enabled;
}

function renderSelectedFilesText() {
  if (!selectedFiles.length) {
    fileSelection.textContent = t("noFilesSelected");
    fileSelection.title = "";
    return;
  }
  if (selectedFiles.length === 1) {
    fileSelection.textContent = selectedFiles[0].name;
    fileSelection.title = selectedFiles[0].name;
    return;
  }
  fileSelection.textContent = t("filesSelected", selectedFiles.length);
  fileSelection.title = selectedFiles.map((file) => file.name).join("\n");
}

function renderSummary() {
  switch (summaryState.type) {
    case "ready":
      summary.textContent = t("summaryReady", summaryState.count);
      break;
    case "needs-files":
      summary.textContent = t("summaryNeedsFiles");
      break;
    case "converted":
      summary.textContent = t("summaryConverted", summaryState.done, summaryState.total);
      break;
    case "error":
      summary.textContent = summaryState.message;
      break;
    case "idle":
    default:
      summary.textContent = t("summaryIdle");
      break;
  }
}

function setSummaryState(nextState) {
  summaryState = nextState;
  renderSummary();
}

function renderResults(rows) {
  resultRows = rows;
  resultsBody.innerHTML = "";

  for (const row of rows) {
    const tr = document.createElement("tr");
    const statusText = row.ok
      ? row.warningCount
        ? t("statusOkWarnings", row.warningCount)
        : t("statusOk")
      : row.errorMessage ?? t("unknownError");
    const downloadCell = row.downloadUrl
      ? `<a class="download-link" href="${row.downloadUrl}" download="${row.outputFileName}">${t("saveLink")}</a>`
      : "—";

    tr.innerHTML = `
      <td><code>${row.sourceName}</code></td>
      <td><code>${row.outputFileName ?? "—"}</code></td>
      <td class="${row.ok ? "status-ok" : "status-error"}">${statusText}</td>
      <td>${downloadCell}</td>
    `;
    resultsBody.append(tr);
  }
}

function normalizeFiles(files) {
  return [...files]
    .filter((file) => file.name.toLowerCase().endsWith(".lrtemplate"))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function refreshSelectedSummary() {
  renderSelectedFilesText();
  if (!selectedFiles.length) {
    setSummaryState({ type: "idle" });
    return;
  }
  setSummaryState({ type: "ready", count: selectedFiles.length });
}

async function runConversion() {
  if (!selectedFiles.length) {
    setSummaryState({ type: "needs-files" });
    return;
  }

  convertedEntries.forEach((item) => {
    if (item.downloadUrl) {
      URL.revokeObjectURL(item.downloadUrl);
    }
  });

  const rows = [];
  convertedEntries = [];
  const groupName = overrideGroupInput.checked ? groupNameInput.value.trim() || DEFAULT_GROUP_NAME : "";

  for (const file of selectedFiles) {
    try {
      const text = await file.text();
      const result = convertLrtemplateText(text, {
        fileName: file.name,
        groupName,
      });
      validateXmpText(result.xmpText, groupName);
      const blob = new Blob([result.xmpText], { type: "application/xml" });
      const downloadUrl = URL.createObjectURL(blob);

      convertedEntries.push({
        name: result.outputFileName,
        text: result.xmpText,
        downloadUrl,
      });
      rows.push({
        sourceName: file.name,
        outputFileName: result.outputFileName,
        warningCount: result.warnings.length,
        ok: true,
        downloadUrl,
      });
    } catch (error) {
      rows.push({
        sourceName: file.name,
        outputFileName: null,
        ok: false,
        errorMessage: error instanceof Error ? error.message : t("unknownError"),
      });
    }
  }

  renderResults(rows);
  downloadButton.disabled = convertedEntries.length === 0;
  setSummaryState({
    type: "converted",
    done: convertedEntries.length,
    total: selectedFiles.length,
  });
}

function clearAll() {
  selectedFiles = [];
  convertedEntries.forEach((item) => {
    if (item.downloadUrl) {
      URL.revokeObjectURL(item.downloadUrl);
    }
  });
  convertedEntries = [];
  resultRows = [];
  fileInput.value = "";
  downloadButton.disabled = true;
  renderResults([]);
  renderSelectedFilesText();
  setSummaryState({ type: "idle" });
}

function applyFiles(files) {
  selectedFiles = normalizeFiles(files);
  refreshSelectedSummary();
}

function activateDropZone(active) {
  dropZone.classList.toggle("is-active", active);
}

fileInput.addEventListener("change", (event) => {
  applyFiles(event.target.files ?? []);
});

overrideGroupInput.addEventListener("change", () => {
  syncGroupOverrideState();
});

browseButton.addEventListener("click", () => {
  fileInput.click();
});

convertButton.addEventListener("click", () => {
  runConversion().catch((error) => {
    setSummaryState({
      type: "error",
      message: error instanceof Error ? error.message : t("summaryConversionFailed"),
    });
  });
});

downloadButton.addEventListener("click", () => {
  if (!convertedEntries.length) {
    return;
  }
  const zipBlob = createZipBlob(
    convertedEntries.map((entry) => ({ name: entry.name, text: entry.text }))
  );
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = t("zipFileName");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

clearButton.addEventListener("click", () => {
  clearAll();
});

["dragenter", "dragover"].forEach((type) => {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    activateDropZone(true);
  });
});

["dragleave", "dragend", "drop"].forEach((type) => {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    activateDropZone(false);
  });
});

dropZone.addEventListener("drop", (event) => {
  const files = event.dataTransfer?.files ?? [];
  applyFiles(files);
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});

dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

localeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

syncGroupOverrideState();
applyLanguage(resolveInitialLanguage());
