let token = localStorage.getItem("token") || "";

const api = "https://enxoval-maria-cecilia.onrender.com";

let currentCategory = "";
let editingItem = null;
let currentItems = [];

const categories = {
  Roupas: "https://i.ibb.co/gFrnWVMJ/roupas-removebg-preview.png",
  Higiene: "https://i.ibb.co/8LgXwzMC/higiene-removebg-preview.png",
  Fraldas: "https://i.ibb.co/1frVpgsq/fraldas-removebg-preview.png",
  "Alimenta\u00e7\u00e3o":
    "https://i.ibb.co/SXg2n8BD/alimenta-o-removebg-preview.png",
  Sono: "https://i.ibb.co/FdhdFBC/sono-removebg-preview.png",
  "Sa\u00edda": "https://i.ibb.co/fdrDrxTk/saida-removebg-preview.png",
  "Mam\u00e3e": "https://i.ibb.co/PzfP35nK/mamae.png",
};

const categoryAliases = {
  "Alimenta\u00e7\u00e3o": "Alimenta\u00e7\u00e3o",
  "Alimenta\u00c3\u00a7\u00c3\u00a3o": "Alimenta\u00e7\u00e3o",
  "Sa\u00edda": "Sa\u00edda",
  "Sa\u00c3\u00adda": "Sa\u00edda",
  "Mam\u00e3e": "Mam\u00e3e",
  "Mam\u00c3\u00a3e": "Mam\u00e3e",
};

const VIEW_TRANSITION_MS = 220;

document.getElementById("loginBtn").addEventListener("click", login);

if (token) {
  showCategories();
}

function normalizeCategoryName(value) {
  const text = String(value || "").trim();
  return categoryAliases[text] || text;
}

function categoryKey(value) {
  return normalizeCategoryName(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeItem(rawItem = {}) {
  const nome = rawItem.nome == null ? "" : String(rawItem.nome);
  const quantidade = Math.max(0, Number(rawItem.quantidade) || 0);

  let concluido = Number(rawItem.concluido);
  if (!Number.isFinite(concluido)) {
    concluido = 0;
  }

  concluido = Math.max(0, Math.min(concluido, quantidade));

  return {
    id: rawItem.id,
    categoria: normalizeCategoryName(rawItem.categoria),
    nome,
    quantidade,
    concluido,
  };
}

function getActiveView() {
  return document.querySelector(".view:not(.hidden)");
}

function switchView(nextViewId) {
  const nextView = document.getElementById(nextViewId);
  const currentView = getActiveView();

  if (!nextView || currentView === nextView) {
    if (nextView) {
      nextView.classList.remove("hidden");
    }

    return;
  }

  nextView.classList.remove("hidden");
  nextView.classList.add("transition-enter");

  requestAnimationFrame(() => {
    if (currentView) {
      currentView.classList.add("transition-leave");
      currentView.classList.remove("is-active");
    }

    nextView.classList.remove("transition-enter");
    nextView.classList.add("is-active");
  });

  window.setTimeout(() => {
    if (currentView) {
      currentView.classList.remove("transition-leave");
      currentView.classList.add("hidden");
    }
  }, VIEW_TRANSITION_MS);
}

async function login() {
  const user = document.getElementById("user").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(api + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });

    if (!res.ok) {
      throw new Error("Falha no login");
    }

    const data = await res.json();

    token = data.token || "";

    if (!token) {
      throw new Error("Token inv\u00e1lido");
    }

    localStorage.setItem("token", token);

    showCategories();
  } catch (error) {
    alert("N\u00e3o foi poss\u00edvel entrar. Verifique usu\u00e1rio e senha.");
    console.error(error);
  }
}

function showCategories() {
  switchView("categories");
  renderCategories();
}

function renderCategories() {
  const grid = document.getElementById("categories-grid");

  grid.innerHTML = "";

  Object.keys(categories).forEach((cat) => {
    const div = document.createElement("div");

    div.className = "category";
    div.innerHTML = `
      <img src="${categories[cat]}" alt="${cat}">
      <span>${cat}</span>
    `;

    div.addEventListener("click", () => openCategory(cat));

    grid.appendChild(div);
  });
}

function back() {
  switchView("categories");
}

async function openCategory(cat) {
  currentCategory = cat;

  document.getElementById("categoria-titulo").innerText = cat;
  switchView("items-screen");

  await loadItems(currentCategory);
}

function ensureItemsScreenVisible() {
  const itemsScreen = document.getElementById("items-screen");
  if (itemsScreen.classList.contains("hidden")) {
    switchView("items-screen");
  }
}

async function loadItems(category = currentCategory) {
  if (category) {
    currentCategory = category;
  }

  try {
    const res = await fetch(api + "/items", {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) {
      throw new Error("Falha ao carregar itens");
    }

    const rawItems = await res.json();

    currentItems = rawItems.map(normalizeItem).filter((item) => {
      return categoryKey(item.categoria) === categoryKey(currentCategory);
    });

    renderItems(currentItems);
  } catch (error) {
    alert("N\u00e3o foi poss\u00edvel carregar os itens.");
    console.error(error);
  }
}

function renderItems(items) {
  const container = document.getElementById("items");

  container.innerHTML = "";

  let total = 0;
  let done = 0;

  items.forEach((item) => {
    const safeItem = normalizeItem(item);
    const itemId = String(safeItem.id || "").replace(/'/g, "\\'");

    const itemDone = Number(safeItem.concluido) || 0;
    const itemTotal = Number(safeItem.quantidade) || 0;

    total += itemTotal;
    done += itemDone;

    const div = document.createElement("div");

    div.className = "item";
    div.innerHTML = `
      <span>${safeItem.nome || "Item"} (${itemDone}/${itemTotal})</span>
      <div class="actions">
        <button type="button" onclick="checkItem('${itemId}')">OK</button>
        <button type="button" onclick="editItem('${itemId}')">Editar</button>
      </div>
    `;

    container.appendChild(div);
  });

  document.getElementById("summary").innerText =
    `Conclu\u00eddo ${done} de ${total}`;

  const percent = total === 0 ? 0 : (done / total) * 100;

  document.getElementById("progress-bar").style.width = `${percent}%`;
}

function openCreateModal() {
  editingItem = null;

  document.getElementById("modal-title").innerText = "Novo item";
  document.getElementById("item-name").value = "";
  document.getElementById("item-qty").value = "";
  document.getElementById("item-done").value = "0";

  document.getElementById("deleteBtn").classList.add("hidden");
  document.getElementById("modal").classList.remove("hidden");
}

function editItem(id) {
  const item = currentItems.find((entry) => String(entry.id) === String(id));

  if (!item) {
    return;
  }

  const safeItem = normalizeItem(item);

  editingItem = safeItem.id;

  document.getElementById("modal-title").innerText = "Editar item";
  document.getElementById("item-name").value = safeItem.nome;
  document.getElementById("item-qty").value = String(safeItem.quantidade);
  document.getElementById("item-done").value = String(safeItem.concluido);

  document.getElementById("deleteBtn").classList.remove("hidden");
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  editingItem = null;
}

function normalizeDoneValue(doneValue, qtyValue) {
  const quantidade = Math.max(0, Number(qtyValue) || 0);
  let concluido = Math.max(0, Number(doneValue) || 0);

  if (concluido > quantidade) {
    concluido = quantidade;
  }

  return { quantidade, concluido };
}

async function saveItem() {
  const nome = document.getElementById("item-name").value.trim();
  const qtyInput = document.getElementById("item-qty").value;
  const doneInput = document.getElementById("item-done").value;

  const { quantidade, concluido } = normalizeDoneValue(doneInput, qtyInput);

  const body = {
    categoria: currentCategory,
    nome,
    quantidade,
    concluido,
  };

  try {
    if (editingItem) {
      await fetch(api + "/items/" + editingItem, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(api + "/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
      });
    }

    closeModal();
    await loadItems(currentCategory);
    ensureItemsScreenVisible();
  } catch (error) {
    alert("N\u00e3o foi poss\u00edvel salvar o item.");
    console.error(error);
  }
}

async function deleteItem() {
  if (!editingItem) {
    return;
  }

  try {
    await fetch(api + "/items/" + editingItem, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });

    closeModal();
    await loadItems(currentCategory);
    ensureItemsScreenVisible();
  } catch (error) {
    alert("N\u00e3o foi poss\u00edvel excluir o item.");
    console.error(error);
  }
}

async function checkItem(id) {
  const item = currentItems.find((entry) => String(entry.id) === String(id));

  if (!item) {
    return;
  }

  const safeItem = normalizeItem(item);
  const value = window.prompt(
    "Quantidade conclu\u00edda",
    String(safeItem.concluido),
  );

  if (value === null) {
    return;
  }

  const { concluido } = normalizeDoneValue(value, safeItem.quantidade);

  try {
    await fetch(api + "/items/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ concluido }),
    });

    await loadItems(currentCategory);
    ensureItemsScreenVisible();
  } catch (error) {
    alert("N\u00e3o foi poss\u00edvel atualizar o item.");
    console.error(error);
  }
}
