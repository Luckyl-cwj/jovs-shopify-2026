const docxFileInput = document.getElementById("docxFile");
const extractBtn = document.getElementById("extractBtn");
const downloadZipBtn = document.getElementById("downloadZipBtn");
const statusText = document.getElementById("statusText");
const countText = document.getElementById("countText");
const gallery = document.getElementById("gallery");

let selectedFile = null;
let extractedImages = [];

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|bmp|webp|svg|tiff?|emf|wmf)$/i;

setEmptyState("请选择 `.docx` 文件并点击“提取图片”。");

docxFileInput.addEventListener("change", () => {
  selectedFile = docxFileInput.files?.[0] || null;
  extractedImages.forEach((item) => URL.revokeObjectURL(item.url));
  extractedImages = [];
  toggleButtons(false);

  if (!selectedFile) {
    statusText.textContent = "未选择文件。";
    countText.textContent = "";
    setEmptyState("请选择 `.docx` 文件并点击“提取图片”。");
    return;
  }

  if (!selectedFile.name.toLowerCase().endsWith(".docx")) {
    statusText.textContent = "仅支持 `.docx` 文件（`.doc` 无法直接解析）。";
    countText.textContent = "";
    setEmptyState("请重新选择 `.docx` 文件。");
    extractBtn.disabled = true;
    return;
  }

  statusText.textContent = `已选择：${selectedFile.name}`;
  countText.textContent = "";
  setEmptyState("文件已准备好，点击“提取图片”。");
  extractBtn.disabled = false;
});

extractBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    statusText.textContent = "请先选择文件。";
    return;
  }
  if (typeof JSZip === "undefined") {
    statusText.textContent = "JSZip 加载失败，请检查网络后重试。";
    return;
  }

  try {
    statusText.textContent = "正在解析 Word 文件并提取图片...";
    countText.textContent = "";
    setEmptyState("处理中，请稍候...");
    toggleButtons(false);

    extractedImages.forEach((item) => URL.revokeObjectURL(item.url));
    extractedImages = [];

    const zip = await JSZip.loadAsync(await selectedFile.arrayBuffer());
    const candidates = Object.values(zip.files).filter((entry) => {
      return !entry.dir && entry.name.startsWith("word/media/") && IMAGE_EXTENSIONS.test(entry.name);
    });

    if (candidates.length === 0) {
      statusText.textContent = "未发现可提取的图片。";
      countText.textContent = "";
      setEmptyState("该文件中未检测到 `word/media` 图片资源。");
      return;
    }

    const nameCounter = new Map();
    extractedImages = await Promise.all(
      candidates.map(async (entry, index) => {
        const blob = await entry.async("blob");
        const originalName = entry.name.split("/").pop() || `image_${index + 1}`;
        const safeName = getUniqueName(originalName, nameCounter);
        return {
          index: index + 1,
          originalName,
          safeName,
          size: blob.size,
          mime: blob.type || guessMimeByName(originalName),
          blob,
          url: URL.createObjectURL(blob),
        };
      })
    );

    renderGallery(extractedImages);
    statusText.textContent = "提取完成。";
    countText.textContent = `共提取 ${extractedImages.length} 张图片。`;
    downloadZipBtn.disabled = false;
    extractBtn.disabled = false;
  } catch (error) {
    statusText.textContent = "提取失败：文件损坏或不是有效的 `.docx`。";
    countText.textContent = "";
    setEmptyState("请确认文件格式后重试。");
    console.error(error);
  }
});

downloadZipBtn.addEventListener("click", async () => {
  if (!extractedImages.length) {
    statusText.textContent = "没有可下载的图片。";
    return;
  }
  if (typeof JSZip === "undefined") {
    statusText.textContent = "JSZip 加载失败，请检查网络后重试。";
    return;
  }

  try {
    statusText.textContent = "正在打包 ZIP...";
    downloadZipBtn.disabled = true;

    const zip = new JSZip();
    extractedImages.forEach((item) => {
      zip.file(item.safeName, item.blob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const base = selectedFile?.name.replace(/\.docx$/i, "") || "word-images";
    triggerDownload(zipBlob, `${base}-images.zip`);

    statusText.textContent = "ZIP 下载已开始。";
    downloadZipBtn.disabled = false;
  } catch (error) {
    statusText.textContent = "打包失败，请重试。";
    downloadZipBtn.disabled = false;
    console.error(error);
  }
});

function renderGallery(images) {
  if (!images.length) {
    setEmptyState("没有可预览图片。");
    return;
  }

  const cards = images.map((item) => {
    const canPreview = isBrowserPreviewable(item.safeName);
    const thumb = canPreview
      ? `<img src="${item.url}" alt="${escapeHtml(item.safeName)}" loading="lazy" />`
      : `<div class="thumb-fallback">该格式不支持预览</div>`;

    return `
      <article class="card">
        <div class="thumb-wrap">${thumb}</div>
        <div class="card-body">
          <p class="name">${escapeHtml(item.safeName)}</p>
          <p class="sub">${formatBytes(item.size)}</p>
          <button class="download-single" type="button" data-index="${item.index - 1}">下载此图</button>
        </div>
      </article>
    `;
  });

  gallery.innerHTML = cards.join("");
  gallery.querySelectorAll(".download-single").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const img = extractedImages[index];
      if (!img) return;
      triggerDownload(img.blob, img.safeName);
    });
  });
}

function setEmptyState(text) {
  gallery.innerHTML = `<div class="empty">${text}</div>`;
}

function toggleButtons(hasResults) {
  extractBtn.disabled = !selectedFile || !selectedFile.name.toLowerCase().endsWith(".docx");
  downloadZipBtn.disabled = !hasResults;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getUniqueName(name, counter) {
  const key = name.toLowerCase();
  const current = counter.get(key) || 0;
  counter.set(key, current + 1);
  if (current === 0) return name;

  const dot = name.lastIndexOf(".");
  if (dot === -1) return `${name}-${current}`;
  return `${name.slice(0, dot)}-${current}${name.slice(dot)}`;
}

function isBrowserPreviewable(filename) {
  return /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(filename);
}

function guessMimeByName(name) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
    svg: "image/svg+xml",
    tif: "image/tiff",
    tiff: "image/tiff",
    emf: "image/emf",
    wmf: "image/wmf",
  };
  return map[ext] || "application/octet-stream";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
