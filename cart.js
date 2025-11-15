/* ========= Cart (drawer + page + addToCart) =========
   - Single cart schema across all pages
   - Uses one key: "lokalCartV1"
   - Migrates from old "cart" key (once)
   - Keeps drawer, cart.html, and header badge synced

   Exposes:
     window.addToCart(product[, {open:true|false}])
     window.openCartDrawer()
     window._refreshCartCount()
*/
(function () {
  // ---------- config ----------
  const CART_KEY = "lokalCartV1";
  const LEGACY_KEYS = ["cart"]; // older name, auto-import once

  // Site base for GH Pages subfolder
  const SITE_BASE =
    (document.querySelector('meta[name="site-base"]')?.content || "/")
      .replace(/\/+$/, "/");
  const ORIGIN_BASE = location.origin + SITE_BASE;

  // ---------- helper: migration ----------
  function migrateLegacy() {
    try {
      const rawNew = localStorage.getItem(CART_KEY);
      if (rawNew && JSON.parse(rawNew || "[]").length) return;
    } catch {}

    for (const k of LEGACY_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const data = JSON.parse(raw || "[]");
        if (Array.isArray(data) && data.length) {
          localStorage.setItem(CART_KEY, JSON.stringify(data));
          return;
        }
      } catch {}
    }
  }

  // ---------- helpers ----------
  const parsePeso = (p) => Number(String(p).replace(/[^\d.]/g, "") || 0);
  const fmtPeso = (n) =>
    "₱" +
    Number(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  function getCart() {
    migrateLegacy();
    try {
      const raw = localStorage.getItem(CART_KEY) || "[]";
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveCart(data) {
    localStorage.setItem(CART_KEY, JSON.stringify(data || []));
    window.dispatchEvent(new Event("cart:updated"));
  }

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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

  // ---------- normalize product on "Add to Cart" ----------
  function normalizeProduct(raw) {
    const src =
      typeof structuredClone === "function"
        ? structuredClone(raw || {})
        : JSON.parse(JSON.stringify(raw || {}));

    const id = String(src.id || slugify(src.baseName || src.name || "product"));
    const name = String(src.name || "Unknown");
    const baseName = src.baseName ? String(src.baseName) : name;

    let priceString;
    if (typeof src.price === "number") priceString = fmtPeso(src.price);
    else priceString = String(src.price || "₱0.00");

    return {
      id,
      name,
      baseName,
      size: src.size || "",
      quantity: Number(src.quantity) > 0 ? Number(src.quantity) : 1,
      price: priceString,
      img: src.img || src.image || "",
    };
  }

  // ---------- header bubble ----------
  function updateBadge() {
    const cart = getCart();
    const totalQty = cart.reduce(
      (s, i) => s + (Number(i.quantity) || 0),
      0
    );
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = totalQty;
    });
  }
  window._refreshCartCount = updateBadge;

  // ---------- Drawer DOM refs ----------
  const drawer   = document.getElementById("cdDrawer");
  const overlay  = document.getElementById("cdOverlay");
  const btnOpen  = document.getElementById("openCart");
  const btnClose = document.getElementById("cdClose");
  const itemsEl  = document.getElementById("cdItems");
  const subEl    = document.getElementById("cdSubtotal");
  const agreeEl  = document.getElementById("cdAgree");
  const checkoutEl = document.getElementById("cdCheckout");

  // ---------- Cart page DOM refs ----------
  const pageItems   = document.getElementById("cartItems");
  const pageEmpty   = document.getElementById("cart-empty");
  const pageSummary = document.getElementById("cartSummary");
  const pageTotal   = document.getElementById("cart-total");
  const pageCheckout= document.getElementById("checkoutBtn");
  const pageClear   = document.getElementById("clearCart");
  const pageAgree   = document.getElementById("pageAgree");

  // ---------- Drawer open/close ----------
  function openDrawer() {
    if (!drawer || !overlay) return;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.classList.add("lock-scroll");
    if (sbw > 0) document.body.style.paddingRight = sbw + "px";
    drawer.classList.add("active");
    overlay.classList.add("active");
    drawer.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    renderDrawer();
  }

  function closeDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.remove("active");
    overlay.classList.remove("active");
    drawer.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock-scroll");
    document.body.style.paddingRight = "";
  }

  overlay?.addEventListener("click", closeDrawer);
  btnClose?.addEventListener("click", closeDrawer);
  btnOpen?.addEventListener("click", (e) => {
    e.preventDefault();
    openDrawer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  window.openCartDrawer = openDrawer;

  // ---------- Drawer render ----------
  function renderDrawer() {
    if (!itemsEl) return;

    const cart = getCart();
    itemsEl.innerHTML = "";

    if (cart.length === 0) {
      itemsEl.innerHTML =
        `<p style="color:#666;margin:8px 0;">Your cart is empty.</p>`;
      if (subEl) subEl.textContent = fmtPeso(0);
      if (checkoutEl && agreeEl) checkoutEl.disabled = true;
      updateBadge();
      return;
    }

    let subtotal = 0;

    cart.forEach((item, idx) => {
      const unit = parsePeso(item.price);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const line = unit * qty;
      subtotal += line;

      const row = document.createElement("div");
      row.className = "cd-item";
      row.innerHTML = `
        <img class="cd-thumb" src="${resolveImg(item.img)}" alt="${item.baseName || item.name}">
        <div class="cd-info">
          <h3 class="cd-item-title">${(item.baseName || item.name).replace(/\s+\(Size:.*\)$/, "")}</h3>
          ${item.size ? `<div class="cart-item-size">Size: ${item.size}</div>` : ""}
          <div class="cd-qty" data-index="${idx}">
            <button type="button" data-act="dec" aria-label="Decrease quantity">−</button>
            <input type="number" min="1" value="${qty}" aria-label="Quantity">
            <button type="button" data-act="inc" aria-label="Increase quantity">+</button>
          </div>
          <button class="cd-remove" data-index="${idx}" aria-label="Remove ${item.baseName || item.name}">Remove</button>
        </div>
        <div class="cd-price">${fmtPeso(line)}</div>
      `;
      itemsEl.appendChild(row);
    });

    if (subEl) subEl.textContent = fmtPeso(subtotal);
    if (checkoutEl && agreeEl) {
      checkoutEl.disabled = !(agreeEl.checked && subtotal > 0);
    }
    updateBadge();
  }

  // Drawer qty / remove handlers
  itemsEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const cart = getCart();

    if (btn.classList.contains("cd-remove")) {
      const i = Number(btn.dataset.index);
      cart.splice(i, 1);
      saveCart(cart);
      renderDrawer();
      renderPage();
      updateBadge();
      return;
    }

    const act = btn.dataset.act;
    if (!act) return;

    const wrap = btn.closest(".cd-qty");
    const i = Number(wrap.dataset.index);
    const input = wrap.querySelector("input");

    let val = Math.max(1, Number(input.value) || 1);
    val = act === "inc" ? val + 1 : Math.max(1, val - 1);
    input.value = val;

    if (!cart[i]) return;
    cart[i].quantity = val;
    saveCart(cart);
    renderDrawer();
    renderPage();
    updateBadge();
  });

  itemsEl?.addEventListener("change", (e) => {
    const input = e.target;
    if (input.tagName !== "INPUT") return;
    const wrap = input.closest(".cd-qty");
    const i = Number(wrap.dataset.index);
    const val = Math.max(1, Number(input.value) || 1);
    input.value = val;

    const cart = getCart();
    if (!cart[i]) return;
    cart[i].quantity = val;
    saveCart(cart);
    renderDrawer();
    renderPage();
    updateBadge();
  });

  agreeEl?.addEventListener("change", () => {
    const cart = getCart();
    const subtotal = cart.reduce(
      (s, i) => s + parsePeso(i.price) * (i.quantity || 1),
      0
    );
    if (checkoutEl) checkoutEl.disabled = !(agreeEl.checked && subtotal > 0);
  });

  // ---------- Cart page render ----------
  function renderPage() {
    if (!pageItems) return;

    const cart = getCart();
    pageItems.innerHTML = "";

    const hasItems = cart.length > 0;
    if (pageEmpty)   pageEmpty.style.display   = hasItems ? "none"  : "block";
    if (pageSummary) pageSummary.style.display = hasItems ? "block" : "none";

    if (!hasItems) {
      if (pageTotal) pageTotal.textContent = "0.00";
      if (pageCheckout) pageCheckout.disabled = true;
      updateBadge();
      return;
    }

    let subtotal = 0;

    cart.forEach((item, idx) => {
      const unit = parsePeso(item.price);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const line = unit * qty;
      subtotal += line;

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${resolveImg(item.img)}" alt="${item.baseName || item.name}">
        <div class="cart-item-details">
          <h3 class="cp-title">${(item.baseName || item.name).replace(/\s+\(Size:.*\)$/, "")}</h3>
          ${item.size ? `<div class="cp-size">Size: ${item.size}</div>` : ""}
          <p class="cp-price">${item.price}</p>
          <label class="cp-qty">
            <span>Qty</span>
            <input type="number" min="1" value="${qty}" data-index="${idx}">
          </label>
          <button class="remove-btn" data-index="${idx}">Remove</button>
        </div>
      `;
      pageItems.appendChild(row);
    });

    if (pageTotal) {
      pageTotal.textContent = subtotal.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (pageCheckout && pageAgree) {
      pageCheckout.disabled = !pageAgree.checked;
    }
    updateBadge();
  }

  // Cart page: qty & remove
  pageItems?.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-btn");
    if (!btn) return;

    const i = Number(btn.dataset.index);
    const cart = getCart();
    cart.splice(i, 1);
    saveCart(cart);
    renderPage();
    renderDrawer();
    updateBadge();
  });

  pageItems?.addEventListener("change", (e) => {
    const input = e.target;
    if (input.tagName !== "INPUT") return;

    const i = Number(input.dataset.index);
    const val = Math.max(1, Number(input.value) || 1);
    input.value = val;

    const cart = getCart();
    if (!cart[i]) return;
    cart[i].quantity = val;
    saveCart(cart);
    renderPage();
    renderDrawer();
    updateBadge();
  });

  // Clear cart button
  pageClear?.addEventListener("click", () => {
    if (!confirm("Clear all items from your cart?")) return;
    saveCart([]);
    renderPage();
    renderDrawer();
    updateBadge();
  });

  // Terms gating for checkout on page
  function syncPageCheckoutState() {
    if (!pageCheckout || !pageAgree) return;
    pageCheckout.disabled = !pageAgree.checked;
  }
  pageAgree?.addEventListener("change", syncPageCheckoutState);
  syncPageCheckoutState();

  pageCheckout?.addEventListener("click", () => {
    if (pageCheckout.disabled) return;
    alert("Checkout flow not connected yet. Add your payment/checkout integration.");
  });

  // ---------- cross-tab / cross-page sync ----------
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY || LEGACY_KEYS.includes(e.key)) {
      updateBadge();
      renderDrawer();
      renderPage();
    }
  });

  // ---------- addToCart (global API) ----------
  function addToCart(rawProduct, opts) {
    const p = normalizeProduct(rawProduct);
    const cart = getCart();

    const idx = cart.findIndex((i) => i.id === p.id && i.size === p.size);
    if (idx >= 0) cart[idx].quantity += p.quantity;
    else cart.push(p);

    saveCart(cart);
    updateBadge();
    renderDrawer();
    renderPage();

    const wantOpen =
      (opts && "open" in opts ? opts.open : undefined) ??
      (rawProduct && "open" in rawProduct ? !!rawProduct.open : undefined);
    const silent = rawProduct && rawProduct.silent === true;

    if (!silent && (wantOpen === undefined || wantOpen === true)) {
      openDrawer();
    }
  }

  window.addToCart = addToCart;

  // ---------- initial paint (after DOM ready) ----------
  function initialPaint() {
    updateBadge();
    renderDrawer();
    renderPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialPaint);
  } else {
    initialPaint();
  }

  window.addEventListener("pageshow", () => {
    updateBadge();
  });
})();
