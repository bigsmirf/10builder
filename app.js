const STORAGE_KEY = "tenbuilder-layout-v2";

const canvas = document.getElementById("canvas");
const propertiesPanel = document.getElementById("properties-panel");
const componentButtons = document.querySelectorAll(".component-btn");
const clearCanvasBtn = document.getElementById("clear-canvas");
const previewToggleBtn = document.getElementById("preview-toggle");
const exportBtn = document.getElementById("export-site");

let blocks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let selectedBlockId = null;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

function render() {
  canvas.innerHTML = "";

  blocks.forEach((block, i) => {
    const div = document.createElement("div");
    div.className = "block";

    if (block.type === "hero") {
      div.innerHTML = `<h1>${block.title}</h1><p>${block.text}</p>`;
    }

    if (block.type === "text") {
      div.innerHTML = `<p>${block.text}</p>`;
    }

    if (block.type === "button") {
      div.innerHTML = `<button>${block.label}</button>`;
    }

    if (block.type === "card") {
      div.innerHTML = `<h3>${block.title}</h3><p>${block.text}</p>`;
    }

    if (block.type === "image") {
      div.innerHTML = `<div>Image Placeholder</div>`;
    }

    canvas.appendChild(div);
  });
}

componentButtons.forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.type;

    const block = {
      type,
      title: "Title",
      text: "Text",
      label: "Click"
    };

    blocks.push(block);
    save();
    render();
  };
});

clearCanvasBtn.onclick = () => {
  blocks = [];
  save();
  render();
};

previewToggleBtn.onclick = () => {
  alert("Preview mode coming next");
};

exportBtn.onclick = () => {
  let html = "";

  blocks.forEach(block => {
    if (block.type === "hero") {
      html += `<h1>${block.title}</h1><p>${block.text}</p>`;
    }
    if (block.type === "text") {
      html += `<p>${block.text}</p>`;
    }
    if (block.type === "button") {
      html += `<button>${block.label}</button>`;
    }
    if (block.type === "card") {
      html += `<h3>${block.title}</h3><p>${block.text}</p>`;
    }
  });

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");
};

render();
