/* ========= Cart (drawer + page + addToCart) =========
   - Single cart schema across all pages
   - Works on GH Pages subpaths (resolves image URLs)
   - Cross-tab sync (storage event)
   - Optional Supabase sync per user (if table exists)

   Exposes:
     window.addToCart(product[, {open:true|false}])
     window.openCartDrawer()
     window._refreshCartCount()
*/
(function () {
  // ---------- config ----------
  const CART_KEY = "cart";

  // Site base for GH Pages subfolder
  const SITE_BASE =
    (document.querySelector('meta[name="site-base"]')?.content || "/")
      .replace(/\/+$/, "/");
  const ORIGIN_BASE = location.origin + SITE_BASE;

  // ---------- helpers ----------
  const parsePeso = (p) => Number(String(p).replace(/[^\d.]/g, "") || 0);
  const fmtPeso = (n) =>
    "₱" +
    Number(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  };
  const saveCart = (data) => localStorage.setItem(CART_KEY, JSON.stringify(data || []));

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
    return new URL(tail, ORIGIN_BASE).href;
  }

  // One-time migration to absolute image urls
  (function migrateCartImagePaths() {
    const cart = getCart();
    let changed = false;
    for (const it of cart) {
      if (it?.img && !/^https?:\/\//i.test(it.img)) {
        try {
          const cleaned = String(it.img).replace(/^\/+/, "");
          const hit = cleaned.match(/(?:^|\/)(images\/.+)$/i);
          const tail = hit ? hit[1] : cleaned;
          it.img = new URL(tail, ORIGIN_BASE).href;
          changed = true;
        } catch {}
      }
    }
    if (changed) saveCart(cart);
  })();

  // ---------- schema + add ----------
  function normalizeProduct(raw) {
    const src = (typeof structuredClone === "function")
      ? structuredClone(raw || {})
      : JSON.parse(JSON.stringify(raw || {}));

    const id = String(src.id || slugify(src.baseName || src.name || "product"));
    const name = String(src.name || "Unknown");
    const baseName = src.baseName ? String(src.baseName) : name;

    let priceString;
    if (typeof src.price === "number") priceString = fmtPeso(src.price);
    else priceString = String(src.price || "₱0.00");

    return {
      id,                    // product id (style-level)
      name,                  // may include size suffix
      baseName,              // style title without size
      size: src.size || "",  // variant
      quantity: Number(src.quantity) > 0 ? Number(src.quantity) : 1,
      price: priceString,    // display string
      img: src.img || src.image || "",
    };
  }

  function addToCart(rawProduct, opts) {
    const p = normalizeProduct(rawProduct);
    const cart = getCart();

    // Uniqueness by (id + size)
    const idx = cart.findIndex((i) => i.id === p.id && i.size === p.size);
    if (idx >= 0) cart[idx].quantity += p.quantity;
    else cart.push(p);

    saveCart(cart);
    updateBadge();
    renderDrawer();
    renderPage();
    queueSaveCloud();

    const wantOpen =
      (opts && "open" in opts ? opts.open : undefined) ??
      (rawProduct && "open" in rawProduct ? !!rawProduct.open : undefined);
    const silent = rawProduct && rawProduct.silent === true;
    if (!silent && (wantOpen === undefined || wantOpen === true)) openDrawer();
  }

  // ---------- Drawer refs ----------
  const drawer   = document.getElementById("cdDrawer");
  const overlay  = document.getElementById("cdOverlay");
  const btnOpen  = document.getElementById("openCart");
  const btnClose = document.getElementById("cdClose");
  const itemsEl  = document.getElementById("cdItems");
  const subEl    = document.getElementById("cdSubtotal");
  const agreeEl  = document.getElementById("cdAgree");
  const checkoutEl = document.getElementById("cdCheckout");

  // ---------- Cart page refs ----------
  const pageItems   = document.getElementById("cartItems");
  const pageEmpty   = document.getElementById("cart-empty");
  const pageSummary = document.getElementById("cartSummary");
  const pageTotal   = document.getElementById("cart-total");
  const pageCheckout= document.getElementById("checkoutBtn");
  const pageClear   = document.getElementById("clearCart");

  const countBadges = document.querySelectorAll(".cart-count");

  function updateBadge() {
    const cart = getCart();
    const totalQty = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    countBadges.forEach((el) => { el.textContent = totalQty; });
  }
  window._refreshCartCount = updateBadge;

  function itemTitleHTML(item) {
    const title = (item.baseName || item.name || "").replace(/\s+\(Size:.*\)$/, "");
    const size = item.size ? `<div class="cart-item-size">Size: ${item.size}</div>` : "";
    return `<h3 class="cd-item-title">${title}</h3>${size}`;
  }

  // ===================== Drawer =====================
  function renderDrawer() {
    if (!itemsEl) return;

    const cart = getCart();
    itemsEl.innerHTML = "";

    if (cart.length === 0) {
      itemsEl.innerHTML = `<p style="color:#666;margin:8px 0;">Your cart is empty.</p>`;
      if (subEl) subEl.textContent = fmtPeso(0);
      if (checkoutEl) checkoutEl.disabled = !(agreeEl && agreeEl.checked);
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
          ${itemTitleHTML(item)}
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
    if (checkoutEl && agreeEl) checkoutEl.disabled = !(agreeEl.checked && subtotal > 0);
    updateBadge();
  }

  itemsEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.classList.contains("cd-remove")) {
      const i = Number(btn.dataset.index);
      const cart = getCart();
      cart.splice(i, 1);
      saveCart(cart);
      renderDrawer(); renderPage(); updateBadge(); queueSaveCloud();
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

    const cart = getCart();
    cart[i].quantity = val;
    saveCart(cart);
    renderDrawer(); renderPage(); updateBadge(); queueSaveCloud();
  });

  itemsEl?.addEventListener("change", (e) => {
    const input = e.target;
    if (input.tagName !== "INPUT") return;
    const wrap = input.closest(".cd-qty");
    const i = Number(wrap.dataset.index);
    const val = Math.max(1, Number(input.value) || 1);
    input.value = val;

    const cart = getCart();
    cart[i].quantity = val;
    saveCart(cart);
    renderDrawer(); renderPage(); updateBadge(); queueSaveCloud();
  });

  agreeEl?.addEventListener("change", () => {
    const cart = getCart();
    const subtotal = cart.reduce((s, i) => s + parsePeso(i.price) * (i.quantity || 1), 0);
    if (checkoutEl) checkoutEl.disabled = !(agreeEl.checked && subtotal > 0);
  });

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
  btnOpen?.addEventListener("click", (e) => { e.preventDefault(); openDrawer(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  // expose
  window.openCartDrawer = openDrawer;
  window.addToCart = addToCart;

  // ===================== Cart Page =====================
  function renderPage() {
    if (!pageItems) return;

    const cart = getCart();
    pageItems.innerHTML = "";

    const hasItems = cart.length > 0;
    if (pageEmpty)   pageEmpty.style.display   = hasItems ? "none"  : "block";
    if (pageSummary) pageSummary.style.display = hasItems ? "block" : "none";

    let subtotal = 0;

    if (!hasItems) {
      if (pageTotal) pageTotal.textContent = "0.00";
      if (pageCheckout) pageCheckout.disabled = true;
      updateBadge();
      return;
    }

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
    if (pageCheckout) pageCheckout.disabled = false;
    updateBadge();
  }

  pageItems?.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-btn");
    if (!btn) return;
    const i = Number(btn.dataset.index);
    const cart = getCart();
    cart.splice(i, 1);
    saveCart(cart);
    renderPage(); renderDrawer(); updateBadge(); queueSaveCloud();
  });

  pageItems?.addEventListener("change", (e) => {
    const input = e.target;
    if (input.tagName !== "INPUT") return;
    const i = Number(input.dataset.index);
    const val = Math.max(1, Number(input.value) || 1);
    input.value = val;
    const cart = getCart();
    cart[i].quantity = val;
    saveCart(cart);
    renderPage(); renderDrawer(); updateBadge(); queueSaveCloud();
  });

  pageClear?.addEventListener("click", () => {
    if (!confirm("Clear all items from your cart?")) return;
    saveCart([]);
    renderPage(); renderDrawer(); updateBadge(); queueSaveCloud();
  });

  pageCheckout?.addEventListener("click", () => {
    if (pageCheckout.disabled) return;
    alert("Checkout flow not connected yet. Add your payment/checkout integration.");
  });

  // cross-tab sync
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) {
      updateBadge(); renderDrawer(); renderPage();
    }
  });

  // ===================== Optional: Supabase sync =====================
  // Table (suggested):
  //   cart_items(user_id uuid, product_id text, name text, base_name text,
  //              size text, price text, img text, quantity int, updated_at timestamp)
  // PK: (user_id, product_id, size)
  // RLS: user_id = auth.uid()
  let saveTimer = null;

  function debounce(fn, ms) {
    return function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(fn, ms);
    };
  }

  async function getUserId() {
    try {
      if (!window.sb || !sb.auth) return null;
      const { data:{ session } } = await sb.auth.getSession();
      return session?.user?.id || null;
    } catch { return null; }
  }

  async function loadCloudCart() {
    const uid = await getUserId();
    if (!uid) return;
    try {
      const { data, error } = await sb
        .from("cart_items")
        .select("product_id,name,base_name,size,price,img,quantity,updated_at")
        .eq("user_id", uid);

      if (error) throw error;
      const cloud = (data || []).map(r => ({
        id: r.product_id,
        name: r.name,
        baseName: r.base_name || r.name,
        size: r.size || "",
        price: r.price || "₱0.00",
        img: r.img || "",
        quantity: Number(r.quantity) || 1
      }));
      saveCart(cloud);
      renderPage(); renderDrawer(); updateBadge();
    } catch (err) {
      // If table doesn't exist, ignore silently
      console.info("Cloud cart load skipped:", err?.message || err);
    }
  }

  async function saveCloudCart() {
    const uid = await getUserId();
    if (!uid) return;
    const cart = getCart();
    try {
      // Replace all items for this user (simple, reliable)
      await sb.from("cart_items").delete().eq("user_id", uid);
      if (cart.length) {
        const rows = cart.map(it => ({
          user_id: uid,
          product_id: it.id,
          name: it.name,
          base_name: it.baseName || it.name,
          size: it.size || "",
          price: it.price,
          img: it.img,
          quantity: Number(it.quantity) || 1,
          updated_at: new Date().toISOString()
        }));
        await sb.from("cart_items").upsert(rows, { onConflict: "user_id,product_id,size" });
      }
    } catch (err) {
      console.info("Cloud cart save skipped:", err?.message || err);
    }
  }

  const queueSaveCloud = debounce(saveCloudCart, 800);

  // React to auth state:
  (function watchAuth(){
    if (!window.sb || !sb.auth) return;
    sb.auth.onAuthStateChange(async (evt, session) => {
      if (session?.user?.id) {
        // Signed in → pull cloud into local
        await loadCloudCart();
      } else {
        // Signed out → clear local (so header shows 0) but keep cloud data for next login
        saveCart([]);
        renderPage(); renderDrawer(); updateBadge();
      }
    });
  })();

  // ========= initial paint =========
  updateBadge();
  renderPage();
  renderDrawer();
  // If already signed in when loading this page, pull cloud now
  getUserId().then(uid => { if (uid) loadCloudCart(); });

})();
