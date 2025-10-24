/* ===== Wishlist — Final Full Version for Lokal =====
   ✅ Full product data from PRODUCTS_CACHE
   ✅ Clickable hearts everywhere
   ✅ Solid red hearts (active)
   ✅ Silent add to cart (no alert)
======================================================== */
(function () {
  const PRODUCT_PAGE = "best-pick/product.html";
  const KEY = "wishlist";

  // ---------- Helpers ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const read = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const write = (a) => localStorage.setItem(KEY, JSON.stringify(a));
  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const PRODUCTS = JSON.parse(localStorage.getItem("PRODUCTS_CACHE") || "[]");

  // Get complete product data (with fallback)
  function fullProduct(item) {
    const id = item.id || slugify(item.name);
    const found =
      PRODUCTS.find(
        (p) =>
          slugify(p.name) === id ||
          (p.name && item.name && p.name.trim() === item.name.trim())
      ) || {};

    return {
      id,
      name: found.name || item.name || "Unnamed Product",
      price: found.price || item.price || "₱0",
      desc: found.desc || item.desc || "",
      img: found.img || item.img || "",
      images: found.images || item.images || [item.img],
      rating: found.rating || 4.6,
      reviewsCount: found.reviewsCount || 3,
      bullets: found.bullets || [],
      category: found.category || "",
    };
  }

  // ---------- Wishlist utilities ----------
  function isInWishlist(name) {
    const list = read();
    return list.some((x) => slugify(x.name) === slugify(name));
  }

  function toggleWishlist(item) {
    let list = read();
    const id = slugify(item.name);
    const index = list.findIndex((x) => slugify(x.name) === id);
    if (index > -1) list.splice(index, 1);
    else list.push(item);
    write(list);
    updateBadge();
  }

  function updateBadge() {
    const el = $("#wishlistCount");
    if (!el) return;
    const n = read().length;
    el.textContent = n > 0 ? n : "";
    el.style.display = n > 0 ? "inline-block" : "none";
  }

  function syncHeartStates() {
    const list = read();
    $$(".wishlist-btn").forEach((btn) => {
      const name = btn.dataset.name || btn.dataset.id || "";
      const active = list.some((x) => slugify(x.name) === slugify(name));
      btn.classList.toggle("active", active);
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = active
          ? "fa-solid fa-heart"
          : "fa-regular fa-heart";
      }
    });
  }

  // ---------- Render Wishlist ----------
  function renderWishlist() {
    const grid = $("#favGrid");
    const empty = $("#wlEmpty");
    const favCount = $("#favCount");
    const list = read();

    if (!grid) return;

    if (empty) empty.style.display = list.length ? "none" : "block";
    if (favCount)
      favCount.textContent = `${list.length} item${list.length !== 1 ? "s" : ""}`;
    grid.innerHTML = "";

    list.forEach((item, i) => {
      const p = fullProduct(item);
      const card = document.createElement("article");
      card.className = "wish-card";
      card.dataset.id = slugify(p.name);
      card.innerHTML = `
        <div class="img-wrap">
          <a href="#" class="to-detail" data-index="${i}">
            <img src="${p.img}" alt="${p.name}">
          </a>
          <button type="button" class="like-btn" data-remove="${i}" title="Remove from favorites">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
        <div class="info">
          <a href="#" class="to-detail name" data-index="${i}">${p.name}</a>
          <p class="price">${p.price}</p>
          <button type="button" class="cta" data-cart="${i}">Add to Cart</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ---------- Open Product Detail ----------
  function openProductDetail(item) {
    const product = fullProduct(item);
    localStorage.setItem("productDetail", JSON.stringify(product));
    const id = slugify(product.name);
    location.href = `${PRODUCT_PAGE}?id=${encodeURIComponent(id)}`;
  }

  // ---------- Event Listeners ----------
  document.addEventListener("click", (e) => {
    const t = e.target;

    // Wishlist heart click (Shop All / Best Picks)
    const heart = t.closest(".wishlist-btn");
    if (heart) {
      e.preventDefault();
      const item = {
        id: heart.dataset.id,
        name: heart.dataset.name,
        price: heart.dataset.price,
        img: heart.dataset.img,
        desc: heart.dataset.desc,
      };
      toggleWishlist(item);
      heart.classList.add("pulse");
      syncHeartStates();
      setTimeout(() => heart.classList.remove("pulse"), 300);
      return;
    }

    // View product
    const detail = t.closest(".to-detail");
    if (detail) {
      e.preventDefault();
      const idx = Number(detail.dataset.index);
      const list = read();
      openProductDetail(list[idx]);
      return;
    }

    // Remove from favorites (inside wishlist)
    const rm = t.closest("[data-remove]");
    if (rm) {
      const idx = Number(rm.dataset.remove);
      const list = read();
      list.splice(idx, 1);
      write(list);
      renderWishlist();
      updateBadge();
      syncHeartStates();
      return;
    }

    // Add to cart (silent)
    const cartBtn = t.closest("[data-cart]");
    if (cartBtn) {
      const idx = Number(cartBtn.dataset.cart);
      const list = read();
      const p = fullProduct(list[idx]);
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const exist = cart.findIndex((x) => x.name === p.name);
      if (exist > -1) cart[exist].quantity += 1;
      else cart.push({ ...p, quantity: 1 });
      localStorage.setItem("cart", JSON.stringify(cart));
      list.splice(idx, 1);
      write(list);
      renderWishlist();
      updateBadge();
      syncHeartStates();
      return;
    }
  });

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    renderWishlist();
    updateBadge();
    syncHeartStates();
  });
})();
