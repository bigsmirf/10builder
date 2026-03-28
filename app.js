const STORAGE_KEY = "tenbuilder-layout-v2";

const canvas = document.getElementById("canvas");
const componentButtons = document.querySelectorAll(".component-btn");
const clearCanvasBtn = document.getElementById("clear-canvas");
const publishBtn = document.getElementById("publish-btn");

let blocks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

function render() {
  canvas.innerHTML = "";

  blocks.forEach((b, i) => {
    const el = document.createElement("div");
    el.className = "block";

    if (b.type === "text") {
      el.innerHTML = `<p>${b.text}</p>`;
    }

    if (b.type === "button") {
      el.innerHTML = `<a href="#">${b.label}</a>`;
    }

    canvas.appendChild(el);
  });
}

componentButtons.forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.type;

    if (type === "text") {
      blocks.push({ type: "text", text: "New text block" });
    }

    if (type === "button") {
      blocks.push({ type: "button", label: "Click Here" });
    }

    save();
    render();
  };
});

clearCanvasBtn.onclick = () => {
  blocks = [];
  save();
  render();
};

function generateHTML() {
  let html = "";

  blocks.forEach(b => {
    if (b.type === "text") {
      html += `<p>${b.text}</p>`;
    }

    if (b.type === "button") {
      html += `<a href="#">${b.label}</a>`;
    }
  });

  return html;
}

async function publish() {
  const slug = prompt("Enter site name:", "my-site");
  if (!slug) return;

  const html = generateHTML();

  const res = await fetch("/api/publish.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ slug, html, user: "wayne" })
  });

  const data = await res.json();

  if (data.success) {
    window.open(data.url, "_blank");
  } else {
    alert("Publish failed");
  }
}

publishBtn.onclick = publish;

render();
