/* ===== Wishlist — Lokal (single source of truth) =====
   - Handles hearts on all pages
   - Renders wishlist.html
   - Adds items to cart
   - Keeps header bubble in sync
======================================================= */
(function () {
  // use a unique key so nothing else overwrites it
  const KEY = "lokalWishlistV1";
  const LEGACY_KEYS = ["wishlist"]; // old name, will auto-import once
  const CART_KEY = "lokalCartV1";
  const PRODUCT_PAGE = "best-pick/product.html";

  // ---------- Helpers ----------
  const $  = (s, sc) => (sc || document).querySelector(s);
  const $$ = (s, sc) => (sc || document).querySelectorAll(s);

  function migrateLegacy() {
    // if new key already has data, keep it
    try {
      const rawNew = localStorage.getItem(KEY);
      if (rawNew && JSON.parse(rawNew || "[]").length) {
        return;
      }
    } catch {}

    for (const k of LEGACY_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const data = JSON.parse(raw || "[]");
        if (Array.isArray(data) && data.length) {
          localStorage.setItem(KEY, JSON.stringify(data));
          return;
        }
      } catch {}
    }
  }

  const read = () => {
    migrateLegacy();
    try {
      const raw = localStorage.getItem(KEY) || "[]";
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const write = (arr) => {
    localStorage.setItem(KEY, JSON.stringify(arr || []));
    window.dispatchEvent(new Event("wishlist:updated"));
  };

  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function toAbs(p) {
    try {
      if (!p) return p;
      return new URL(p, location.href).href;
    } catch {
      return p;
    }
  }

  async function pushIfAuthed() {
    if (typeof window.syncWishlistIfAuthed === "function") {
      try { await window.syncWishlistIfAuthed(); } catch {}
    }
  }

  const PRODUCTS = (() => {
    try { return JSON.parse(localStorage.getItem("PRODUCTS_CACHE") || "[]"); }
    catch { return []; }
  })();

  function idFrom(data) {
    if (!data) return "";
    if (data.id) return String(data.id);
    if (data.dataset && data.dataset.id) return String(data.dataset.id);
    return slugify(data.name || data.dataset?.name || "");
  }

  // Combine base item with cached product info
  function fullProduct(item) {
    const baseId = idFrom(item) || slugify(item.name || "");
    const found =
      PRODUCTS.find(
        (p) =>
          slugify(p.name || "") === baseId ||
          (item.name && p.name && p.name.trim() === item.name.trim())
      ) || {};

    const primaryImg = toAbs(found.img || item.img || "");
    const imgsRaw = found.images || item.images || [found.img || item.img || ""];
    const images = (Array.isArray(imgsRaw) ? imgsRaw : [imgsRaw])
      .filter(Boolean)
      .map(toAbs);

    return {
      id: baseId,
      name: found.name || item.name || "Unnamed Product",
      price: found.price || item.price || "₱0",
      desc: found.desc || item.desc || "",
      img: primaryImg,
      images: images.length ? images : (primaryImg ? [primaryImg] : []),
      rating: found.rating || item.rating || 4.6,
      reviewsCount: found.reviews || item.reviewsCount || 3,
      bullets: found.bullets || item.bullets || [],
      category: found.category || item.category || "",
      url: item.url || item.dataset?.url || location.href
    };
  }

  // ---------- UI sync ----------
  function updateBadge() {
    const el = $("#wishlistCount");
    if (!el) return;
    const n = read().length;
    el.textContent = n ? String(n) : "";
    el.style.display = n ? "inline-block" : "none";
  }

  function syncHeartStates() {
    const ids = new Set(read().map((x) => x.id));
    $$(".wishlist-btn").forEach((btn) => {
      const id = idFrom(btn.dataset);
      const active = id && ids.has(id);
      btn.classList.toggle("active", !!active);
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = active ? "fa-solid fa-heart" : "fa-regular fa-heart";
      }
    });
  }

  function repaintHearts() {
    updateBadge();
    syncHeartStates();
  }

  // ---------- Core wishlist toggle ----------
  async function toggleWishlist(raw) {
    const id = idFrom(raw);
    if (!id) return;

    const list = read();
    const idx = list.findIndex((x) => x.id === id);

    if (idx > -1) {
      // remove
      list.splice(idx, 1);
    } else {
      // add
      list.push({
        id,
        name: raw.name || raw.dataset?.name || "",
        price: raw.price || raw.dataset?.price || "",
        img: raw.img || raw.dataset?.img || "",
        desc: raw.desc || raw.dataset?.desc || "",
        url: raw.url || raw.dataset?.url || location.href
      });
    }

    write(list);
    await pushIfAuthed();
    repaintHearts();
  }

  // ---------- Wishlist page rendering ----------
  function renderWishlist() {
    const grid = $("#favGrid");
    if (!grid) return; // not on wishlist.html

    const list = read();
    const empty = $("#wlEmpty");
    const favCount = $("#favCount");

    if (empty) empty.hidden = list.length !== 0;
    if (favCount) favCount.textContent = `${list.length} ITEM${list.length === 1 ? "" : "S"}`;

    grid.innerHTML = "";

    list.forEach((item, index) => {
      const p = fullProduct(item);
      const card = document.createElement("article");
      card.className = "wish-card";
      card.dataset.id = p.id;
      card.innerHTML = `
        <div class="img-wrap">
          <a href="#" class="to-detail" data-index="${index}">
            <img src="${p.img}" alt="${p.name}">
          </a>
          <button type="button" class="like-btn" data-remove="${index}" aria-label="Remove ${p.name} from favorites">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
        <div class="info">
          <a href="#" class="to-detail name" data-index="${index}">${p.name}</a>
          <p class="price">${p.price}</p>
          <button type="button" class="cta" data-cart="${index}">Add to Cart</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function openProductDetail(item) {
    if (!item) return;
    const product = fullProduct(item);
    localStorage.setItem("productDetail", JSON.stringify(product));
    const id = slugify(product.name);
    location.href = `${PRODUCT_PAGE}?id=${encodeURIComponent(id)}`;
  }

  // ---------- Cart from wishlist ----------
  function addToCartFromWishlist(product) {
    const p = fullProduct(product);

    if (typeof window.addToCart === "function") {
      window.addToCart({
        id: p.id,
        baseName: p.name,
        name: p.name,
        img: toAbs(p.img),
        price: p.price,
        desc: p.desc || "",
        size: null,
        quantity: 1
      });
    } else {
      // simple localStorage cart fallback using our new cart key
      const cart = (() => {
        try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
      })();

      const exist = cart.findIndex((x) => (x.baseName || x.name) === p.name);
      if (exist > -1) {
        cart[exist].quantity += 1;
      } else {
        cart.push({
          id: p.id,
          baseName: p.name,
          name: p.name,
          img: toAbs(p.img),
          price: p.price,
          desc: p.desc || "",
          size: null,
          quantity: 1
        });
      }
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event("cart:updated"));
    }

    if (typeof window.syncCartIfAuthed === "function") {
      window.syncCartIfAuthed();
    }
    if (typeof window.openCartDrawer === "function") {
      window.openCartDrawer();
    }
  }

  // ---------- Clear & continue ----------
  async function clearAllWishlist() {
    const list = read();
    if (!list.length) return;
    const ok = confirm("Remove all favorites?");
    if (!ok) return;
    write([]);
    await pushIfAuthed();
    renderWishlist();
    repaintHearts();
  }

  function smartContinue() {
    try {
      const ref = document.referrer || "";
      if (ref && new URL(ref).origin === location.origin) {
        history.back();
        return;
      }
    } catch {}
    location.href = "shop-all.html";
  }

  // ---------- Global click handler ----------
  document.addEventListener("click", async (e) => {
    const t = e.target;

    // Hearts on any grid/card (home, best picks, shop-all)
    const heart = t.closest(".wishlist-btn");
    if (heart) {
      e.preventDefault();
      await toggleWishlist(heart.dataset);
      heart.classList.add("pulse");
      setTimeout(() => heart.classList.remove("pulse"), 250);
      return;
    }

    // Wishlist page: open detail
    const detail = t.closest(".to-detail");
    if (detail) {
      e.preventDefault();
      const idx = Number(detail.dataset.index);
      const list = read();
      openProductDetail(list[idx]);
      return;
    }

    // Wishlist page: remove one
    const rm = t.closest("[data-remove]");
    if (rm) {
      e.preventDefault();
      const idx = Number(rm.dataset.remove);
      const list = read();
      list.splice(idx, 1);
      write(list);
      await pushIfAuthed();
      renderWishlist();
      repaintHearts();
      return;
    }

    // ✅ Wishlist page: add to cart AND remove from wishlist
    const addBtn = t.closest("[data-cart]");
    if (addBtn) {
      e.preventDefault();
      const idx = Number(addBtn.dataset.cart);
      const list = read();
      const item = list[idx];
      if (item) {
        // 1) add to cart
        addToCartFromWishlist(item);
        // 2) remove from wishlist list
        list.splice(idx, 1);
        write(list);
        await pushIfAuthed();
        // 3) repaint UI
        renderWishlist();
        repaintHearts();
      }
      return;
    }
  });

  // Header buttons on wishlist page
  document.addEventListener("DOMContentLoaded", () => {
    $("#btnContinue")?.addEventListener("click", smartContinue);
    $("#btnClear")?.addEventListener("click", clearAllWishlist);

    renderWishlist();   // paints only on wishlist.html
    repaintHearts();    // hearts + badge on any page
  });

  // Repaint when other tabs or cloud sync change wishlist
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || LEGACY_KEYS.includes(e.key)) {
      renderWishlist();
      repaintHearts();
    }
  });

  window.addEventListener("wishlist:updated", () => {
    renderWishlist();
    repaintHearts();
  });

  if (window.sb?.auth) {
    sb.auth.onAuthStateChange(() => {
      renderWishlist();
      repaintHearts();
    });
  }

  // Broken-image fallback
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (img && img.tagName === "IMG" && !img.dataset.fallback) {
        img.dataset.fallback = "1";
        img.src = "images/placeholder.png";
        img.alt = "Image not available";
      }
    },
    true
  );
})();
