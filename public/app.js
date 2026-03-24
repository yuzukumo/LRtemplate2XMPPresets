import { convertLrtemplateText, validateXmpText } from "./converter.js";
import { createZipBlob } from "./zip.js";

const groupNameInput = document.querySelector("#groupName");
const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const convertButton = document.querySelector("#convertButton");
const downloadButton = document.querySelector("#downloadButton");
const clearButton = document.querySelector("#clearButton");
const summary = document.querySelector("#summary");
const resultsBody = document.querySelector("#resultsBody");

let selectedFiles = [];
let convertedEntries = [];

function renderResults(rows) {
  resultsBody.innerHTML = "";
  for (const row of rows) {
    const tr = document.createElement("tr");
    const downloadCell = row.downloadUrl
      ? `<a class="download-link" href="${row.downloadUrl}" download="${row.outputFileName}">Save</a>`
      : "—";
    tr.innerHTML = `
      <td><code>${row.sourceName}</code></td>
      <td><code>${row.outputFileName ?? "—"}</code></td>
      <td class="${row.ok ? "status-ok" : "status-error"}">${row.status}</td>
      <td>${downloadCell}</td>
    `;
    resultsBody.append(tr);
  }
}

function setSummary(text) {
  summary.textContent = text;
}

function normalizeFiles(files) {
  return [...files]
    .filter((file) => file.name.toLowerCase().endsWith(".lrtemplate"))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function refreshSelectedSummary() {
  if (!selectedFiles.length) {
    setSummary("No files converted yet.");
    return;
  }
  setSummary(`${selectedFiles.length} file(s) ready to convert.`);
}

async function runConversion() {
  if (!selectedFiles.length) {
    setSummary("Select at least one .lrtemplate file first.");
    return;
  }

  convertedEntries.forEach((item) => {
    if (item.downloadUrl) {
      URL.revokeObjectURL(item.downloadUrl);
    }
  });

  const rows = [];
  convertedEntries = [];
  const groupName = groupNameInput.value.trim() || "User Presets";

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
        status: result.warnings.length ? `OK with ${result.warnings.length} warning(s)` : "OK",
        ok: true,
        downloadUrl,
      });
    } catch (error) {
      rows.push({
        sourceName: file.name,
        outputFileName: null,
        status: error instanceof Error ? error.message : "Unknown error",
        ok: false,
      });
    }
  }

  renderResults(rows);
  downloadButton.disabled = convertedEntries.length === 0;
  setSummary(
    `Converted ${convertedEntries.length} of ${selectedFiles.length} file(s) into XMP presets.`
  );
}

function clearAll() {
  selectedFiles = [];
  convertedEntries.forEach((item) => {
    if (item.downloadUrl) {
      URL.revokeObjectURL(item.downloadUrl);
    }
  });
  convertedEntries = [];
  fileInput.value = "";
  resultsBody.innerHTML = "";
  downloadButton.disabled = true;
  setSummary("No files converted yet.");
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

convertButton.addEventListener("click", () => {
  runConversion().catch((error) => {
    setSummary(error instanceof Error ? error.message : "Conversion failed.");
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
  link.download = "converted-xmp.zip";
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
