const STORAGE_KEY = "tenbuilder-layout-v2";

const appShell = document.getElementById("app-shell");
const canvas = document.getElementById("canvas");
const propertiesPanel = document.getElementById("properties-panel");
const componentButtons = document.querySelectorAll(".component-btn");
const clearCanvasBtn = document.getElementById("clear-canvas");
const previewToggleBtn = document.getElementById("preview-toggle");
const exportBtn = document.getElementById("export-site");

let blocks = loadBlocks();
let selectedBlockId = null;
let dragSourceId = null;
let previewMode = false;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createBlock(type) {
  const id = createId();

  const presets = {
    hero: {
      id,
      type,
      title: "Your Headline Here",
      text: "Describe your product, service, or idea in a clear and powerful way."
    },
    text: {
      id,
      type,
      text: "This is a text block. Click it and edit the content on the right."
    },
    button: {
      id,
      type,
      label: "Click Here",
      url: "#"
    },
    card: {
      id,
      type,
      title: "Card Title",
      text: "Use cards to highlight features, services, or offers."
    },
    image: {
      id,
      type,
      alt: "Image Placeholder"
    }
  };

  return presets[type];
}

function saveBlocks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

function loadBlocks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function renderCanvas() {
  canvas.innerHTML = "";

  if (blocks.length === 0) {
    canvas.classList.add("empty");
    canvas.innerHTML = `
      <div class="empty-state">
        <h3>What do you want to build today?</h3>
        <p>Add components from the left to start building visually.</p>
      </div>
    `;
    renderProperties();
    return;
  }

  canvas.classList.remove("empty");

  blocks.forEach((block, index) => {
    const blockEl = document.createElement("div");
    blockEl.className = `block ${block.type}-block ${block.id === selectedBlockId ? "selected" : ""}`;
    blockEl.dataset.id = block.id;
    blockEl.draggable = !previewMode;

    const controls = previewMode
      ? ""
      : `
        <div class="block-controls">
          <button class="control-btn" data-action="up">⬆ Move</button>
          <button class="control-btn" data-action="down">⬇ Move</button>
          <button class="control-btn" data-action="delete">✕ Delete</button>
        </div>
      `;

    let inner = "";

    if (block.type === "hero") {
      inner = `
        ${controls}
        <h1>${escapeHtml(block.title)}</h1>
        <p>${escapeHtml(block.text)}</p>
      `;
    }

    if (block.type === "text") {
      inner = `
        ${controls}
        <p>${escapeHtml(block.text)}</p>
      `;
    }

    if (block.type === "button") {
      inner = `
        ${controls}
        <a href="${escapeAttribute(block.url)}">${escapeHtml(block.label)}</a>
      `;
    }

    if (block.type === "card") {
      inner = `
        ${controls}
        <h3>${escapeHtml(block.title)}</h3>
        <p>${escapeHtml(block.text)}</p>
      `;
    }

    if (block.type === "image") {
      inner = `
        ${controls}
        <div class="image-placeholder">${escapeHtml(block.alt)}</div>
      `;
    }

    blockEl.innerHTML = inner;

    if (!previewMode) {
      blockEl.addEventListener("click", (e) => {
        const action = e.target.dataset.action;

        if (action) {
          e.stopPropagation();
          handleBlockAction(block.id, action, index);
          return;
        }

        selectedBlockId = block.id;
        renderCanvas();
      });

      blockEl.addEventListener("dragstart", () => {
        dragSourceId = block.id;
        blockEl.classList.add("dragging");
      });

      blockEl.addEventListener("dragend", () => {
        dragSourceId = null;
        blockEl.classList.remove("dragging");
        clearDragOverStates();
      });

      blockEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (dragSourceId !== block.id) {
          blockEl.classList.add("drag-over");
        }
      });

      blockEl.addEventListener("dragleave", () => {
        blockEl.classList.remove("drag-over");
      });

      blockEl.addEventListener("drop", (e) => {
        e.preventDefault();
        blockEl.classList.remove("drag-over");
        if (!dragSourceId || dragSourceId === block.id) return;
        reorderBlocks(dragSourceId, block.id);
      });
    }

    canvas.appendChild(blockEl);
  });

  renderProperties();
}

function clearDragOverStates() {
  document.querySelectorAll(".block").forEach((el) => {
    el.classList.remove("drag-over");
  });
}

function reorderBlocks(sourceId, targetId) {
  const sourceIndex = blocks.findIndex((b) => b.id === sourceId);
  const targetIndex = blocks.findIndex((b) => b.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;

  const [moved] = blocks.splice(sourceIndex, 1);
  blocks.splice(targetIndex, 0, moved);

  saveBlocks();
  renderCanvas();
}

function renderProperties() {
  if (previewMode) {
    propertiesPanel.innerHTML = `<p class="muted">Preview mode is on.</p>`;
    return;
  }

  const block = blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    propertiesPanel.innerHTML = `<p class="muted">Select a block to edit it.</p>`;
    return;
  }

  let html = `
    <div class="field">
      <label>Block Type</label>
      <input type="text" value="${block.type}" disabled />
    </div>
  `;

  if (block.type === "hero") {
    html += `
      <div class="field">
        <label>Headline</label>
        <input id="prop-title" type="text" value="${escapeAttribute(block.title)}" />
      </div>
      <div class="field">
        <label>Description</label>
        <textarea id="prop-text">${escapeHtml(block.text)}</textarea>
      </div>
    `;
  }

  if (block.type === "text") {
    html += `
      <div class="field">
        <label>Text</label>
        <textarea id="prop-text">${escapeHtml(block.text)}</textarea>
      </div>
    `;
  }

  if (block.type === "button") {
    html += `
      <div class="field">
        <label>Label</label>
        <input id="prop-label" type="text" value="${escapeAttribute(block.label)}" />
      </div>
      <div class="field">
        <label>URL</label>
        <input id="prop-url" type="text" value="${escapeAttribute(block.url)}" />
      </div>
    `;
  }

  if (block.type === "card") {
    html += `
      <div class="field">
        <label>Card Title</label>
        <input id="prop-title" type="text" value="${escapeAttribute(block.title)}" />
      </div>
      <div class="field">
        <label>Card Text</label>
        <textarea id="prop-text">${escapeHtml(block.text)}</textarea>
      </div>
    `;
  }

  if (block.type === "image") {
    html += `
      <div class="field">
        <label>Alt Label</label>
        <input id="prop-alt" type="text" value="${escapeAttribute(block.alt)}" />
      </div>
    `;
  }

  html += `<button class="action-btn" id="save-properties">Save Changes</button>`;
  propertiesPanel.innerHTML = html;

  document.getElementById("save-properties").addEventListener("click", () => {
    saveProperties(block.id);
  });
}

function saveProperties(id) {
  const block = blocks.find((b) => b.id === id);
  if (!block) return;

  if (block.type === "hero" || block.type === "card") {
    const title = document.getElementById("prop-title");
    const text = document.getElementById("prop-text");
    if (title) block.title = title.value;
    if (text) block.text = text.value;
  }

  if (block.type === "text") {
    const text = document.getElementById("prop-text");
    if (text) block.text = text.value;
  }

  if (block.type === "button") {
    const label = document.getElementById("prop-label");
    const url = document.getElementById("prop-url");
    if (label) block.label = label.value;
    if (url) block.url = url.value;
  }

  if (block.type === "image") {
    const alt = document.getElementById("prop-alt");
    if (alt) block.alt = alt.value;
  }

  saveBlocks();
  renderCanvas();
}

function handleBlockAction(id, action, index) {
  if (action === "delete") {
    blocks = blocks.filter((b) => b.id !== id);
    if (selectedBlockId === id) selectedBlockId = null;
  }

  if (action === "up" && index > 0) {
    [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
  }

  if (action === "down" && index < blocks.length - 1) {
    [blocks[index + 1], blocks[index]] = [blocks[index], blocks[index + 1]];
  }

  saveBlocks();
  renderCanvas();
}

componentButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    const block = createBlock(type);
    blocks.push(block);
    selectedBlockId = block.id;
    saveBlocks();
    renderCanvas();
  });
});

clearCanvasBtn.addEventListener("click", () => {
  blocks = [];
  selectedBlockId = null;
  saveBlocks();
  renderCanvas();
});

previewToggleBtn.addEventListener("click", () => {
  previewMode = !previewMode;
  appShell.classList.toggle("preview-mode", previewMode);
  previewToggleBtn.textContent = previewMode ? "Exit Preview" : "Preview";
  renderCanvas();
});

if (exportBtn) {
  exportBtn.addEventListener("click", async () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html" });
    const file = new File([blob], "site.html", { type: "text/html" });

    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Exported Site",
          text: "Your exported 10Builder site"
        });
        return;
      }
    } catch (err) {
      console.log("Share canceled or failed:", err);
    }

    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  });
}

function generateHTML() {
  let content = "";

  blocks.forEach((block) => {
    if (block.type === "hero") {
      content += `<section><h1>${escapeHtml(block.title)}</h1><p>${escapeHtml(block.text)}</p></section>`;
    }
    if (block.type === "text") {
      content += `<p>${escapeHtml(block.text)}</p>`;
    }
    if (block.type === "button") {
      content += `<a href="${escapeAttribute(block.url)}">${escapeHtml(block.label)}</a>`;
    }
    if (block.type === "card") {
      content += `<div><h3>${escapeHtml(block.title)}</h3><p>${escapeHtml(block.text)}</p></div>`;
    }
    if (block.type === "image") {
      content += `<div>${escapeHtml(block.alt)}</div>`;
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Site</title>
</head>
<body>
  ${content}
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");
}

renderCanvas();
