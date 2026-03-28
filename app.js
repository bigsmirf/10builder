const STORAGE_KEY = "tenbuilder-layout-v2";
const PUBLISH_KEY = "tenbuilder-published-sites-v1";

const appShell = document.getElementById("app-shell");
const canvas = document.getElementById("canvas");
const propertiesPanel = document.getElementById("properties-panel");
const componentButtons = document.querySelectorAll(".component-btn");
const clearCanvasBtn = document.getElementById("clear-canvas");
const previewToggleBtn = document.getElementById("preview-toggle");
const exportBtn = document.getElementById("export-btn");
const publishBtn = document.getElementById("publish-btn");

let blocks = loadBlocks();
let selectedBlockId = null;
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

function loadPublishedSites() {
  try {
    const raw = localStorage.getItem(PUBLISH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePublishedSites(sites) {
  localStorage.setItem(PUBLISH_KEY, JSON.stringify(sites));
}

function renderCanvas() {
  canvas.innerHTML = "";

  if (blocks.length === 0) {
    canvas.innerHTML = `
      <div class="empty-state">
        <h3>What do you want to build today?</h3>
        <p>Add components from the left to start building visually.</p>
      </div>
    `;
    renderProperties();
    return;
  }

  blocks.forEach((block, index) => {
    const blockEl = document.createElement("div");
    blockEl.className = `block ${block.id === selectedBlockId ? "selected" : ""}`;
    blockEl.dataset.id = block.id;

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
        <p><a href="${escapeAttribute(block.url)}">${escapeHtml(block.label)}</a></p>
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
        <div>Image Placeholder: ${escapeHtml(block.alt)}</div>
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
    }

    canvas.appendChild(blockEl);
  });

  renderProperties();
}

function renderProperties() {
  if (previewMode) {
    propertiesPanel.innerHTML = `<p>Preview mode is on.</p>`;
    return;
  }

  const block = blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    propertiesPanel.innerHTML = `<p>Select a block to edit it.</p>`;
    return;
  }

  let html = `
    <div class="field">
      <label>Block Type</label>
      <input type="text" value="${block.type}" disabled />
    </div>
  `;

  if (block.type === "hero" || block.type === "card") {
    html += `
      <div class="field">
        <label>Title</label>
        <input id="prop-title" type="text" value="${escapeAttribute(block.title)}" />
      </div>
      <div class="field">
        <label>Text</label>
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

  if (block.type === "image") {
    html += `
      <div class="field">
        <label>Alt Label</label>
        <input id="prop-alt" type="text" value="${escapeAttribute(block.alt)}" />
      </div>
    `;
  }

  html += `<button id="save-properties">Save</button>`;
  propertiesPanel.innerHTML = html;

  document.getElementById("save-properties").onclick = () => {
    if (block.type === "hero" || block.type === "card") {
      block.title = document.getElementById("prop-title").value;
      block.text = document.getElementById("prop-text").value;
    }

    if (block.type === "text") {
      block.text = document.getElementById("prop-text").value;
    }

    if (block.type === "button") {
      block.label = document.getElementById("prop-label").value;
      block.url = document.getElementById("prop-url").value;
    }

    if (block.type === "image") {
      block.alt = document.getElementById("prop-alt").value;
    }

    saveBlocks();
    renderCanvas();
  };
}

function handleBlockAction(id, action, index) {
  if (action === "delete") {
    blocks = blocks.filter((b) => b.id !== id);
    if (selectedBlockId === id) {
      selectedBlockId = null;
    }
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
  btn.onclick = () => {
    const type = btn.dataset.type;
    const block = createBlock(type);
    blocks.push(block);
    selectedBlockId = block.id;
    saveBlocks();
    renderCanvas();
  };
});

clearCanvasBtn.onclick = () => {
  blocks = [];
  selectedBlockId = null;
  saveBlocks();
  renderCanvas();
};

previewToggleBtn.onclick = () => {
  previewMode = !previewMode;
  appShell.classList.toggle("preview-mode", previewMode);
  previewToggleBtn.textContent = previewMode ? "Exit Preview" : "Preview";
  renderCanvas();
};

function generatePublishedHTML() {
  let content = "";

  blocks.forEach((block) => {
    if (block.type === "hero") {
      content += `
        <section class="published-hero">
          <h1>${escapeHtml(block.title)}</h1>
          <p>${escapeHtml(block.text)}</p>
        </section>
      `;
    }

    if (block.type === "text") {
      content += `
        <section class="published-text">
          <p>${escapeHtml(block.text)}</p>
        </section>
      `;
    }

    if (block.type === "button") {
      content += `
        <section class="published-button">
          <a href="${escapeAttribute(block.url)}">${escapeHtml(block.label)}</a>
        </section>
      `;
    }

    if (block.type === "card") {
      content += `
        <section class="published-card">
          <h3>${escapeHtml(block.title)}</h3>
          <p>${escapeHtml(block.text)}</p>
        </section>
      `;
    }

    if (block.type === "image") {
      content += `
        <section class="published-image">
          <div class="placeholder">${escapeHtml(block.alt)}</div>
        </section>
      `;
    }
  });

  return `
    <div class="published-shell">
      ${content}
    </div>
  `;
}

function exportSite() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exported Site</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${generatePublishedHTML()}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "index.html";
  a.click();
}

function publishSite() {
  if (blocks.length === 0) {
    alert("Add at least one block before publishing.");
    return;
  }

  const input = prompt("Enter a project name or slug", "my-site");
  if (!input) return;

  const slug = slugify(input);
  const sites = loadPublishedSites();

  sites[slug] = {
    slug,
    html: generatePublishedHTML(),
    updatedAt: new Date().toISOString()
  };

  savePublishedSites(sites);

  const url = `${window.location.origin}/published.html?site=${encodeURIComponent(slug)}`;
  window.open(url, "_blank");
}

if (exportBtn) {
  exportBtn.onclick = exportSite;
}

if (publishBtn) {
  publishBtn.onclick = publishSite;
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
