/* ===== Wishlist — Lokal (enhanced + Supabase sync) =====
   - Keeps your existing HTML/CSS classes and behaviors
   - LocalStorage for offline + Supabase cloud sync when signed in
   - Hearts toggle, badge count, clear all, continue shopping, add-to-cart
   - Safe absolute image URLs
   - Works even if user is signed out (local only), then merges on sign-in
================================================================ */
(function () {
  const PRODUCT_PAGE = "best-pick/product.html";
  const KEY = "wishlist";

  /* ---------------- Helpers ---------------- */
  const $  = (s, sc) => (sc || document).querySelector(s);
  const $$ = (s, sc) => (sc || document).querySelectorAll(s);

  const read  = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
  const write = (a) => localStorage.setItem(KEY, JSON.stringify(a || []));

  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function toAbs(p) {
    try { return p ? new URL(p, location.href).href : p; }
    catch { return p; }
  }

  function wlKey(it){ return (it?.name||"").trim().toLowerCase() + "||" + (it?.size?String(it.size).trim().toLowerCase():""); }

  // Optional cache your site may set elsewhere
  const PRODUCTS = (() => { try { return JSON.parse(localStorage.getItem("PRODUCTS_CACHE") || "[]"); } catch { return []; } })();

  // Build a full product object; prefer cache match by slug(name)
  function fullProduct(item) {
    const id = item.id || slugify(item.name || "");
    const found = PRODUCTS.find(
      (p) => slugify(p.name || "") === id || (item.name && p.name && p.name.trim() === item.name.trim())
    ) || {};

    const primaryImg = toAbs(found.img || item.img || "");
    const imgsRaw = found.images || item.images || [found.img || item.img || ""];
    const images = (Array.isArray(imgsRaw) ? imgsRaw : [imgsRaw]).filter(Boolean).map(toAbs);

    return {
      id,
      name: found.name || item.name || "Unnamed Product",
      price: found.price || item.price || "₱0",
      desc: found.desc || item.desc || "",
      img: primaryImg,
      images: images.length ? images : (primaryImg ? [primaryImg] : []),
      rating: found.rating || item.rating || 4.6,
      reviewsCount: found.reviews || item.reviewsCount || 3,
      bullets: found.bullets || item.bullets || [],
      category: found.category || item.category || "",
      url: item.url || location.href,
      size: item.size || ""
    };
  }

  /* ---------------- Local wishlist core ---------------- */
  function idFrom(data) {
    return (data && data.id) ? String(data.id).trim() : slugify(data?.name || "");
  }

  function isInWishlist(id) {
    return read().some((x) => x.id === id);
  }

  function toggleWishlist(rawItem) {
    const id = idFrom(rawItem);
    if (!id) return;

    const list = read();
    const idx = list.findIndex((x) => x.id === id);

    if (idx > -1) {
      const removed = list.splice(idx, 1)[0];
      write(list);
      renderWishlist(); updateBadge(); syncHeartStates();
      // Cloud: delete
      removed && wlDeleteRemote(removed).catch(()=>{});
    } else {
      const item = {
        id,
        name: rawItem.name || "",
        price: rawItem.price || "",
        img: toAbs(rawItem.img || ""),
        desc: rawItem.desc || "",
        size: rawItem.size || "",
        url: rawItem.url || location.href
      };
      list.push(item);
      write(list);
      renderWishlist(); updateBadge(); syncHeartStates();
      // Cloud: upsert
      wlUpsertRemote(item).catch(()=>{});
    }
  }

  /* ---------------- Header badge + hearts ---------------- */
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
      const id = idFrom({ id: btn.dataset.id, name: btn.dataset.name });
      const active = id && ids.has(id);
      btn.classList.toggle("active", !!active);
      const icon = btn.querySelector("i");
      if (icon) icon.className = active ? "fa-solid fa-heart" : "fa-regular fa-heart";
    });
  }

  /* ---------------- Wishlist page rendering ---------------- */
  function renderWishlist() {
    const grid = $("#favGrid");
    if (!grid) return; // not on wishlist.html

    const list = read();
    const empty = $("#wlEmpty");
    const favCount = $("#favCount");

    if (empty) empty.hidden = list.length !== 0;
    if (favCount) favCount.textContent = `${list.length} ITEM${list.length === 1 ? "" : "S"}`;

    grid.innerHTML = "";

    list.forEach((item, i) => {
      const p = fullProduct(item);
      const card = document.createElement("article");
      card.className = "wish-card";
      card.dataset.id = p.id;
      card.innerHTML = `
        <div class="img-wrap">
          <a href="#" class="to-detail" data-index="${i}">
            <img src="${p.img}" alt="${p.name}">
          </a>
          <button type="button" class="like-btn" data-remove="${i}" title="Remove from favorites" aria-label="Remove ${p.name}">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
        <div class="info">
          <a href="#" class="to-detail name" data-index="${i}">${p.name}</a>
          ${p.size ? `<div class="mini" style="color:#7a6f68;margin:.2rem 0 .4rem">Size: <strong>${p.size}</strong></div>` : ""}
          <p class="price">${p.price}</p>
          <button type="button" class="cta" data-cart="${i}">Add to Cart</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /* ---------------- Navigation to product detail ---------------- */
  function openProductDetail(item) {
    const product = fullProduct(item);
    localStorage.setItem("productDetail", JSON.stringify(product));
    const id = slugify(product.name);
    location.href = `${PRODUCT_PAGE}?id=${encodeURIComponent(id)}`;
  }

  /* ---------------- Clear & Continue ---------------- */
  function smartContinue() {
    try {
      const ref = document.referrer || "";
      if (ref && new URL(ref).origin === location.origin) { history.back(); return; }
    } catch {}
    location.href = "shop-all.html";
  }

  async function clearAllWishlist() {
    const list = read();
    if (!list.length) return;
    const ok = confirm("Remove all favorites?");
    if (!ok) return;

    write([]);
    renderWishlist(); updateBadge(); syncHeartStates();
    // Cloud delete all for this user
    try { await wlClearRemote(); } catch {}
  }

  /* ---------------- Supabase sync (requires window.sb from supabase.js) ---------------- */
  async function wlSession() {
    try { const { data:{ session } } = await sb.auth.getSession(); return session || null; }
    catch { return null; }
  }

  async function wlPull(user_id) {
    const { data, error } = await sb
      .from("wishlist_items")
      .select("name,size,img,price,created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending:false });
    if (error) throw error;
    return (data||[]).map(r => ({ name:r.name, size:r.size||"", img:r.img||"", price:r.price||"" }));
  }

  async function wlUpsertRemote(item) {
    const sess = await wlSession(); if (!sess) return;
    const user_id = sess.user.id;
    const row = { user_id, name:item.name, size:item.size||"", img:item.img||"", price:item.price||"" };
    const { error } = await sb.from("wishlist_items").upsert(row, { onConflict: "user_id,name,size" });
    if (error) throw error;
  }

  async function wlDeleteRemote(item) {
    const sess = await wlSession(); if (!sess) return;
    const user_id = sess.user.id;
    const { error } = await sb
      .from("wishlist_items")
      .delete()
      .eq("user_id", user_id)
      .eq("name", item.name)
      .eq("size", item.size || "");
    if (error) throw error;
  }

  async function wlClearRemote() {
    const sess = await wlSession(); if (!sess) return;
    const user_id = sess.user.id;
    const { error } = await sb.from("wishlist_items").delete().eq("user_id", user_id);
    if (error) throw error;
  }

  function mergeLists(local, remote){
    const map = new Map();
    [...local, ...remote].forEach(it => map.set(wlKey(it), it));
    return [...map.values()];
  }

  // Call this anytime (exposed) to sync cloud ⇆ local
  async function syncWishlistIfAuthed() {
    const session = await wlSession();
    if (!session) return;

    // 1) pull remote
    let remote = [];
    try { remote = await wlPull(session.user.id); } catch {}

    // 2) merge
    const local = read();
    const merged = mergeLists(local, remote);

    // 3) push new local items up
    const remoteKeys = new Set(remote.map(wlKey));
    for (const it of merged) {
      if (!remoteKeys.has(wlKey(it))) {
        try { await wlUpsertRemote(it); } catch {}
      }
    }

    // 4) save + repaint
    write(merged);
    renderWishlist(); updateBadge(); syncHeartStates();
  }

  // Expose so other scripts/pages can trigger a sync after they modify localStorage
  window.syncWishlistIfAuthed = syncWishlistIfAuthed;

  /* ---------------- Events ---------------- */
  document.addEventListener("click", (e) => {
    const t = e.target;

    // Hearts on grids (Shop All / Best Picks / anywhere)
    const heart = t.closest(".wishlist-btn");
    if (heart) {
      e.preventDefault();
      toggleWishlist({
        id: heart.dataset.id,
        name: heart.dataset.name,
        price: heart.dataset.price,
        img: heart.dataset.img,
        desc: heart.dataset.desc,
        size: heart.dataset.size || "",
        url: heart.dataset.url || location.href
      });
      heart.classList.add("pulse");
      setTimeout(() => heart.classList.remove("pulse"), 300);
      return;
    }

    // View product (wishlist page)
    const detail = t.closest(".to-detail");
    if (detail) {
      e.preventDefault();
      const idx = Number(detail.dataset.index);
      const list = read();
      openProductDetail(list[idx]);
      return;
    }

    // Remove single favorite (wishlist page)
    const rm = t.closest("[data-remove]");
    if (rm) {
      e.preventDefault();
      const idx = Number(rm.dataset.remove);
      const list = read();
      const removed = list.splice(idx, 1)[0];
      write(list);
      renderWishlist(); updateBadge(); syncHeartStates();
      removed && wlDeleteRemote(removed).catch(()=>{});
      return;
    }

    // Add to cart (from wishlist)
    const addBtn = t.closest("[data-cart]");
    if (addBtn) {
      e.preventDefault();
      const idx = Number(addBtn.dataset.cart);
      const list = read();
      const p = fullProduct(list[idx]);
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const exist = cart.findIndex((x) => (x.baseName||x.name) === p.name && (x.size||"") === (p.size||""));
      if (exist > -1) cart[exist].quantity += 1;
      else cart.push({
        baseName: p.name,
        name: p.name + (p.size ? ` (Size: ${p.size})` : ""),
        img: toAbs(p.img),
        price: p.price,
        desc: p.desc || "",
        size: p.size || "",
        quantity: 1
      });
      localStorage.setItem("cart", JSON.stringify(cart));

      // Optional: keep item in wishlist. If you prefer to remove, uncomment:
      // list.splice(idx, 1); write(list);

      renderWishlist(); updateBadge(); syncHeartStates();
      window._refreshCartCount?.();
      window.openCartDrawer?.();
      return;
    }
  });

  // Header buttons
  document.addEventListener("DOMContentLoaded", () => {
    $("#btnContinue")?.addEventListener("click", smartContinue);
    $("#btnClear")?.addEventListener("click", clearAllWishlist);
  });

  // Broken-image fallback
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img && img.tagName === "IMG" && !img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = "images/placeholder.png";
      img.alt = "Image not available";
    }
  }, true);

  /* ---------------- Init + Auth reactions ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderWishlist();   // paints only on wishlist.html
    updateBadge();      // header count
    syncHeartStates();  // hearts on any page
    // Try cloud sync if signed in
    window.syncWishlistIfAuthed && window.syncWishlistIfAuthed();
  });

  // Keep in sync with auth changes
  sb?.auth?.onAuthStateChange?.((_evt, session) => {
    if (session) window.syncWishlistIfAuthed && window.syncWishlistIfAuthed();
    else { /* signed out → keep local list; just refresh UI */ renderWishlist(); updateBadge(); syncHeartStates(); }
  });
})();
