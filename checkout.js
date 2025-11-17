// checkout.js

const CART_KEY = "lokalCartV1";

const SHIPPING_FLAT_RATE = 180;
const FREE_SHIPPING_THRESHOLD = 2500;

const SITE_BASE = (document.querySelector('meta[name="site-base"]')?.content || "/").replace(/\/+$/, "/");
const ORIGIN_BASE = location.origin + SITE_BASE;

window.lokalCheckout = {
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
};

function parsePeso(p) {
  if (typeof p === "number") return p;
  const s = String(p || "").replace(/[^\d.]/g, "");
  return Number(s || 0);
}

function formatPeso(n) {
  return (
    "₱" +
    Number(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY) || "[]";
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items || []));
  window.dispatchEvent(new Event("cart:updated"));
}

function getItemName(item) {
  return item.baseName || item.name || "Item";
}

function getItemMeta(item) {
  const bits = [];
  if (item.size) bits.push(`Size: ${item.size}`);
  const qty = Math.max(1, Number(item.quantity) || 1);
  bits.push(`Qty: ${qty}`);
  return bits.join(" • ");
}

function lineTotal(item) {
  const price = parsePeso(item.price);
  const qty = Math.max(1, Number(item.quantity) || 1);
  return price * qty;
}

function resolveImg(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const cleaned = String(p).replace(/^\/+/, "");
  const hit = cleaned.match(/(?:^|\/)(images\/.+)$/i);
  const tail = hit ? hit[1] : cleaned;
  try {
    return new URL(tail, ORIGIN_BASE).href;
  } catch {
    return p;
  }
}

// ---------- render (with qty / edit) ----------

function renderCheckoutSummary() {
  const itemsEl = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const shippingEl = document.getElementById("checkout-shipping");
  const totalEl = document.getElementById("checkout-total");

  if (!itemsEl || !subtotalEl || !shippingEl || !totalEl) return;

  const cartItems = loadCart();
  window.lokalCheckout.items = cartItems;

  itemsEl.innerHTML = "";

  if (!cartItems.length) {
    const empty = document.createElement("p");
    empty.className = "checkout-item-meta";
    empty.textContent =
      "Your cart is empty. Add items to your bag before checking out.";
    itemsEl.appendChild(empty);

    subtotalEl.textContent = formatPeso(0);
    shippingEl.textContent = formatPeso(0);
    totalEl.textContent = formatPeso(0);
    window.lokalCheckout.subtotal = 0;
    window.lokalCheckout.shipping = 0;
    window.lokalCheckout.total = 0;
    return;
  }

  let subtotal = 0;

  cartItems.forEach((item, index) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const row = document.createElement("div");
    row.className = "checkout-item-row";
    row.dataset.index = index;

    const name = getItemName(item);
    const meta = getItemMeta(item);
    const imgUrl = resolveImg(item.img || item.image || "");

    const line = lineTotal(item);
    subtotal += line;

    row.innerHTML = `
      <div class="checkout-item-thumb">
        <img src="${imgUrl}" alt="${name}">
      </div>

      <div class="checkout-item-main">
        <div class="checkout-item-main-top">
          <div>
            <div class="checkout-item-name">${name}</div>
            <div class="checkout-item-meta">${meta}</div>
          </div>
          <button type="button" class="checkout-item-remove" data-index="${index}" aria-label="Remove ${name}">×</button>
        </div>

        <div class="checkout-item-actions">
          <span>Qty</span>
          <div class="checkout-qty-control" data-index="${index}">
            <button type="button" class="chk-dec" aria-label="Decrease quantity">−</button>
            <input type="number" class="chk-qty-input" min="1" value="${qty}">
            <button type="button" class="chk-inc" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="checkout-item-edit chk-edit" data-index="${index}">Edit</button>
        </div>
      </div>

      <div class="checkout-item-price">
        ${formatPeso(line)}
      </div>
    `;

    itemsEl.appendChild(row);
  });

  let shipping = 0;
  if (subtotal > 0) {
    shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  }
  const total = subtotal + shipping;

  subtotalEl.textContent = formatPeso(subtotal);
  shippingEl.textContent =
    shipping === 0 && subtotal > 0 ? "FREE" : formatPeso(shipping);
  totalEl.textContent = formatPeso(total);

  window.lokalCheckout.subtotal = subtotal;
  window.lokalCheckout.shipping = shipping;
  window.lokalCheckout.total = total;
}

// ---------- quantity & remove handlers (inline) ----------

function wireInlineQtyControls() {
  const itemsEl = document.getElementById("checkout-items");
  if (!itemsEl) return;

  itemsEl.addEventListener("click", (e) => {
    const dec = e.target.closest(".chk-dec");
    const inc = e.target.closest(".chk-inc");
    const removeBtn = e.target.closest(".checkout-item-remove");
    const editBtn = e.target.closest(".chk-edit");

    if (dec || inc) {
      const control = e.target.closest(".checkout-qty-control");
      if (!control) return;
      const index = Number(control.dataset.index);
      const cart = loadCart();
      if (!cart[index]) return;

      let qty = Math.max(1, Number(cart[index].quantity) || 1);
      qty = dec ? Math.max(1, qty - 1) : qty + 1;
      cart[index].quantity = qty;
      saveCart(cart);
      renderCheckoutSummary();
      return;
    }

    if (removeBtn) {
      const index = Number(removeBtn.dataset.index);
      const cart = loadCart();
      if (!cart[index]) return;
      cart.splice(index, 1);
      saveCart(cart);
      renderCheckoutSummary();
      return;
    }

    if (editBtn) {
      const index = Number(editBtn.dataset.index);
      openEditModal(index);
      return;
    }
  });

  itemsEl.addEventListener("change", (e) => {
    if (!e.target.classList.contains("chk-qty-input")) return;
    const control = e.target.closest(".checkout-qty-control");
    const index = Number(control.dataset.index);
    const cart = loadCart();
    if (!cart[index]) return;
    let qty = Math.max(1, Number(e.target.value) || 1);
    cart[index].quantity = qty;
    saveCart(cart);
    renderCheckoutSummary();
  });
}

// ---------- Edit modal ----------

let editingIndex = null;

function openEditModal(index) {
  const cart = loadCart();
  const item = cart[index];
  if (!item) return;

  editingIndex = index;

  const overlay = document.getElementById("chkEditOverlay");
  const imgEl = document.getElementById("chkEditImg");
  const nameEl = document.getElementById("chkEditName");
  const priceEl = document.getElementById("chkEditPrice");
  const sizeInput = document.getElementById("chkEditSize");
  const qtyInput = document.getElementById("chkEditQty");

  const name = getItemName(item);
  imgEl.src = resolveImg(item.img || item.image || "");
  imgEl.alt = name;
  nameEl.textContent = name;
  priceEl.textContent = item.price || formatPeso(parsePeso(item.price));
  sizeInput.value = item.size || "";
  qtyInput.value = Math.max(1, Number(item.quantity) || 1);

  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  const overlay = document.getElementById("chkEditOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  editingIndex = null;
}

function wireEditModal() {
  const overlay = document.getElementById("chkEditOverlay");
  if (!overlay) return;

  const btnClose = document.getElementById("chkEditClose");
  const btnDec = document.getElementById("chkEditDec");
  const btnInc = document.getElementById("chkEditInc");
  const btnSave = document.getElementById("chkEditSave");
  const qtyInput = document.getElementById("chkEditQty");

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeEditModal();
  });

  btnClose?.addEventListener("click", closeEditModal);

  btnDec?.addEventListener("click", () => {
    const v = Math.max(1, Number(qtyInput.value) || 1);
    qtyInput.value = Math.max(1, v - 1);
  });

  btnInc?.addEventListener("click", () => {
    const v = Math.max(1, Number(qtyInput.value) || 1);
    qtyInput.value = v + 1;
  });

  btnSave?.addEventListener("click", () => {
    if (editingIndex === null) return;
    const cart = loadCart();
    const item = cart[editingIndex];
    if (!item) return;

    const sizeVal = document.getElementById("chkEditSize").value.trim();
    const qtyVal = Math.max(1, Number(qtyInput.value) || 1);

    item.size = sizeVal;
    item.quantity = qtyVal;

    saveCart(cart);
    renderCheckoutSummary();
    closeEditModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
  });
}

// ---------- Form handling (submit order) ----------

function handleCheckoutForm() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cartItems = loadCart();
    if (!cartItems.length) {
      alert("Your cart is empty. Please add items before checking out.");
      return;
    }

    const formData = new FormData(form);
    const shippingData = {
      fullName: formData.get("fullName")?.trim(),
      email: formData.get("email")?.trim(),
      phone: formData.get("phone")?.trim(),
      address: formData.get("address")?.trim(),
      city: formData.get("city")?.trim(),
      state: formData.get("state")?.trim(),
      zip: formData.get("zip")?.trim(),
      country: formData.get("country"),
    };

    const order = {
      createdAt: new Date().toISOString(),
      items: window.lokalCheckout.items,
      subtotal: window.lokalCheckout.subtotal,
      shipping: window.lokalCheckout.shipping,
      total: window.lokalCheckout.total,
      shippingData,
    };

    try {
      localStorage.setItem("lokalLastOrder", JSON.stringify(order));
    } catch (err) {
      console.warn("Could not store order locally:", err);
    }

    alert(
      "Order placed successfully! (Demo)\n\n" +
        "Total charged: " +
        formatPeso(window.lokalCheckout.total)
    );

    saveCart([]); // clears + fires cart:updated
    window.location.href = "index.html";
  });
}

// ---------- init ----------

function initCheckout() {
  console.log("Checkout script loaded.");
  renderCheckoutSummary();
  wireInlineQtyControls();
  wireEditModal();
  handleCheckoutForm();
}

window.addEventListener("cart:updated", renderCheckoutSummary);
window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) renderCheckoutSummary();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCheckout);
} else {
  initCheckout();
}
