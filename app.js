const STORAGE_KEY = "tenbuilder-layout-v2";

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

/* =========================
   CORE
========================= */

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
      url: ""
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

  return presets[type] || null;
}

/* =========================
   STORAGE
========================= */

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

/* =========================
   RENDER CANVAS
========================= */

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
          <button data-action="up">⬆</button>
          <button data-action="down">⬇</button>
          <button data-action="delete">✕</button>
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
      const safeUrl = block.url && block.url.trim() !== "" ? escapeAttribute(block.url) : "";
      inner = `
        ${controls}
        ${
          safeUrl
            ? `<p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(block.label)}</a></p>`
            : `<p><a href="" onclick="return false;">${escapeHtml(block.label)}</a></p>`
        }
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
        <div>Image: ${escapeHtml(block.alt)}</div>
      `;
    }

    blockEl.innerHTML = inner;

    if (!previewMode) {
      blockEl.onclick = (e) => {
        const action = e.target.dataset.action;

        if (action) {
          e.stopPropagation();
          handleBlockAction(block.id, action, index);
          return;
        }

        selectedBlockId = block.id;
        renderCanvas();
      };
    }

    canvas.appendChild(blockEl);
  });

  renderProperties();
}

/* =========================
   PROPERTIES PANEL
========================= */

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
      <label>Type</label>
      <input value="${block.type}" disabled />
    </div>
  `;

  if (block.type === "hero" || block.type === "card") {
    html += `
      <input id="prop-title" value="${escapeAttribute(block.title)}" />
      <textarea id="prop-text">${escapeHtml(block.text)}</textarea>
    `;
  }

  if (block.type === "text") {
    html += `<textarea id="prop-text">${escapeHtml(block.text)}</textarea>`;
  }

  if (block.type === "button") {
    html += `
      <input id="prop-label" value="${escapeAttribute(block.label)}" />
      <input id="prop-url" value="${escapeAttribute(block.url)}" placeholder="https://example.com" />
    `;
  }

  if (block.type === "image") {
    html += `<input id="prop-alt" value="${escapeAttribute(block.alt)}" />`;
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
      block.url = document.getElementById("prop-url").value.trim();
    }

    if (block.type === "image") {
      block.alt = document.getElementById("prop-alt").value;
    }

    saveBlocks();
    renderCanvas();
  };
}

/* =========================
   ACTIONS
========================= */

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

/* =========================
   COMPONENT EVENTS
========================= */

componentButtons.forEach((btn) => {
  btn.onclick = () => {
    const block = createBlock(btn.dataset.type);
    if (!block) return;

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

/* =========================
   EXPORT
========================= */

function generatePublishedHTML() {
  let content = "";

  blocks.forEach((block) => {
    if (block.type === "hero") {
      content += `
        <section>
          <h1>${escapeHtml(block.title)}</h1>
          <p>${escapeHtml(block.text)}</p>
        </section>
      `;
    }

    if (block.type === "text") {
      content += `
        <section>
          <p>${escapeHtml(block.text)}</p>
        </section>
      `;
    }

    if (block.type === "button") {
      const safeUrl = block.url && block.url.trim() !== "" ? escapeAttribute(block.url) : "";
      content += `
        <section>
          ${
            safeUrl
              ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(block.label)}</a>`
              : `<a href="" onclick="return false;">${escapeHtml(block.label)}</a>`
          }
        </section>
      `;
    }

    if (block.type === "card") {
      content += `
        <section>
          <h3>${escapeHtml(block.title)}</h3>
          <p>${escapeHtml(block.text)}</p>
        </section>
      `;
    }

    if (block.type === "image") {
      content += `
        <section>
          <div>${escapeHtml(block.alt)}</div>
        </section>
      `;
    }
  });

  return `<div>${content}</div>`;
}

function exportSite() {
  const html = `<!DOCTYPE html><html><body>${generatePublishedHTML()}</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  window.open(URL.createObjectURL(blob), "_blank");
}

/* =========================
   PUBLISH
========================= */

async function publishSite() {
  if (blocks.length === 0) {
    alert("Add content before publishing.");
    return;
  }

  const input = prompt("Enter your site name", "my-site");
  if (!input) return;

  const slug = slugify(input);
  const html = generatePublishedHTML();

  try {
    const res = await fetch("/api/publish.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ slug, html, user: "wayne" })
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Publish failed");
    }

    const panel = document.getElementById("publish-result");
    const link = document.getElementById("publish-link");

    const fullUrl = isAbsoluteUrl(data.url)
      ? data.url
      : new URL(data.url, window.location.origin).toString();

    link.href = fullUrl;
    link.textContent = fullUrl;

    panel.classList.remove("hidden");
  } catch (err) {
    alert("Publish failed: " + err.message);
  }
}

if (exportBtn) exportBtn.onclick = exportSite;
if (publishBtn) publishBtn.onclick = publishSite;

/* =========================
   HELPERS
========================= */

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value));
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

/* =========================
   INIT
========================= */

renderCanvas();
