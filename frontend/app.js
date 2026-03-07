let token = localStorage.getItem("token") || "";

const api = "https://enxoval-maria-cecilia.onrender.com";

const loginBtn = document.getElementById("loginBtn");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");

loginBtn.onclick = login;
addBtn.onclick = openModal;
saveBtn.onclick = saveItem;

/* ------------------------------
RESTORE SESSION
--------------------------------*/

if (token) {
  showApp();
  loadItems();
}

/* ------------------------------
LOGIN
--------------------------------*/

async function login() {
  const user = document.getElementById("user").value;
  const password = document.getElementById("password").value;

  const res = await fetch(api + "/login", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({ user, password }),
  });

  if (!res.ok) {
    alert("Login inválido");
    return;
  }

  const data = await res.json();

  token = data.token;

  localStorage.setItem("token", token);

  showApp();

  loadItems();
}

/* ------------------------------
SHOW APP
--------------------------------*/

function showApp() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
}

/* ------------------------------
API HELPER
--------------------------------*/

async function apiRequest(url, options = {}) {
  const res = await fetch(api + url, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    console.warn("Sessão inválida ou expirada");

    logout();

    return null;
  }

  return res;
}

/* ------------------------------
LOGOUT
--------------------------------*/

function logout() {
  localStorage.removeItem("token");

  location.reload();
}

/* ------------------------------
LOAD ITEMS
--------------------------------*/

async function loadItems() {
  const res = await apiRequest("/items");

  if (!res) return;

  const data = await res.json();

  if (!Array.isArray(data)) {
    console.error("Resposta inesperada da API:", data);
    return;
  }

  render(data);
}

/* ------------------------------
RENDER
--------------------------------*/

function render(items) {
  const container = document.getElementById("items");

  container.innerHTML = "";

  items.forEach((item) => {
    const div = document.createElement("div");

    div.className = "item";

    if (item.checked) {
      div.classList.add("checked");
    }

    div.innerHTML = `
      <span>
      ${iconCategoria(item.categoria)} 
      <b>${item.categoria}</b> — ${item.nome} (${item.quantidade})
      </span>

      <div class="actions">

        <button onclick="toggle('${item.id}')">✔</button>

        <button onclick="removeItem('${item.id}')">🗑</button>

      </div>
    `;

    container.appendChild(div);
  });

  updateProgress(items);
}

/* ------------------------------
CATEGORY ICONS
--------------------------------*/

function iconCategoria(cat) {
  const icons = {
    Roupas: "👕",
    Higiene: "🛁",
    Fraldas: "🧷",
    Alimentação: "🍼",
    Sono: "🌙",
    Passeio: "🚼",
  };

  return icons[cat] || "📦";
}

/* ------------------------------
PROGRESS BAR
--------------------------------*/

function updateProgress(items) {
  const total = items.length;

  if (total === 0) {
    document.getElementById("progress-bar").style.width = "0%";
    document.getElementById("progress-text").innerText = "0 itens";
    return;
  }

  const done = items.filter((i) => i.checked).length;

  const percent = (done / total) * 100;

  document.getElementById("progress-bar").style.width = percent + "%";

  document.getElementById("progress-text").innerText =
    done + " de " + total + " itens concluídos";
}

/* ------------------------------
TOGGLE ITEM
--------------------------------*/

async function toggle(id) {
  await apiRequest("/items/" + id, {
    method: "PUT",

    body: JSON.stringify({ checked: true }),
  });

  loadItems();
}

/* ------------------------------
DELETE ITEM
--------------------------------*/

async function removeItem(id) {
  await apiRequest("/items/" + id, {
    method: "DELETE",
  });

  loadItems();
}

/* ------------------------------
OPEN MODAL
--------------------------------*/

function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

/* ------------------------------
SAVE ITEM
--------------------------------*/

async function saveItem() {
  const categoria = document.getElementById("categoria").value;
  const nome = document.getElementById("nome").value;
  const quantidade = document.getElementById("quantidade").value;

  await apiRequest("/items", {
    method: "POST",

    body: JSON.stringify({
      categoria,
      nome,
      quantidade,
    }),
  });

  document.getElementById("modal").classList.add("hidden");

  loadItems();
}
