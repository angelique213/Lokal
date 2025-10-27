/* ===== lokal.js / main.js — Lokal storefront glue =====
   ✅ Updates all .cart-count badges
   ✅ Safe, silent add-to-cart (opens drawer if available)
   ✅ Works from subfolders (absolute image URLs)
   ✅ Product-card add support
   ✅ Quick View modal (if present)
   ✅ Auto banner slider (if present)
   ✅ Search modal (if present)
   ✅ Category mega menu (desktop hover / touch tap)
========================================================= */

/* ------------------ Utilities ------------------ */
function toAbs(p) {
  try { return p ? new URL(p, location.href).href : p; } catch { return p; }
}

function getCart() {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
}

function setCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart || []));
}

function updateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  document.querySelectorAll(".cart-count").forEach(el => { el.textContent = totalQty; });
}

/* Expose addToCart so other scripts (e.g., Best Picks / Shop All) can call it */
window.addToCart = function addToCart(product) {
  // Normalize & harden
  const item = {
    baseName: product.baseName || product.name,
    name: product.name,                 // can include size suffix if any
    img: toAbs(product.img || ""),
    price: product.price || "₱0",
    desc: product.desc || "",
    size: product.size ?? null,
    quantity: Math.max(1, parseInt(product.quantity) || 1),
  };

  let cart = getCart();

  // Merge by (baseName + size) so clothing variants are distinct
  const idx = cart.findIndex(x => (x.baseName || x.name) === item.baseName && (x.size ?? null) === (item.size ?? null));
  if (idx > -1) cart[idx].quantity += item.quantity;
  else cart.push(item);

  setCart(cart);
  updateCartCount();

  // Optional: open cart drawer if your page has it wired
  if (typeof window.openCartDrawer === "function") window.openCartDrawer();
  // If you still want an alert, uncomment:
  // alert(`${item.name} added to cart!`);
};

/* ------------------ On Load ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});

/* ------------------ Add from product card ------------------ */
/* Assumes a button inside .best-product (like your current markup).
   If you prefer a specific selector, add a data attribute and swap the matches() check. */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".best-product .button");
  if (!btn) return;

  const card = btn.closest(".best-product");
  if (!card) return;

  const data = {
    img: card.dataset.img,
    name: card.dataset.name,
    price: card.dataset.price,
    desc: card.dataset.desc,
    quantity: 1
  };
  window.addToCart(data);
});

/* ------------------ Quick View Modal (optional) ------------------ */
/* Requires:
   #quickViewModal
   #modal-img, #modal-name, #modal-desc, #modal-price, #modal-rating
   a numeric <input> inside the modal for quantity
   .close-modal for the close button
   a single <button> in the modal to add-to-cart
*/
(function quickViewInit(){
  const modal = document.getElementById("quickViewModal");
  if (!modal) return;

  const modalImg    = document.getElementById("modal-img");
  const modalName   = document.getElementById("modal-name");
  const modalDesc   = document.getElementById("modal-desc");
  const modalPrice  = document.getElementById("modal-price");
  const modalRating = document.getElementById("modal-rating");
  const qtyInput    = modal.querySelector('input[type="number"], input[type="text"]');
  const modalAddBtn = modal.querySelector("button");
  const closeBtn    = modal.querySelector(".close-modal");

  function openModalFromCard(card) {
    if (!card) return;
    if (modalImg)    modalImg.src = card.dataset.img || "";
    if (modalName)   modalName.textContent = card.dataset.name || "";
    if (modalDesc)   modalDesc.textContent = card.dataset.desc || "";
    if (modalPrice)  modalPrice.textContent = card.dataset.price || "";
    if (modalRating) modalRating.textContent = card.dataset.rating || "";
    if (qtyInput)    qtyInput.value = 1;
    modal.style.display = "flex";
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".quick-view-btn");
    if (!trigger) return;
    const card = trigger.closest(".best-product");
    e.preventDefault();
    openModalFromCard(card);
  });

  closeBtn?.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  modalAddBtn?.addEventListener("click", () => {
    const qty = Math.max(1, parseInt(qtyInput?.value) || 1);
    window.addToCart({
      img: modalImg?.src,
      name: modalName?.textContent || "Product",
      price: modalPrice?.textContent || "₱0",
      desc: modalDesc?.textContent || "",
      quantity: qty
    });
    modal.style.display = "none";
  });
})();

/* ------------------ Automatic banner slider (optional) ------------------ */
/* Markup: .banner .slide + .banner .slide.active for the visible one */
(function bannerSlider(){
  const slides = document.querySelectorAll(".banner .slide");
  if (!slides.length) return;

  let current = 0;
  const interval = 5000;

  function showSlide(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
  }
  function next() {
    current = (current + 1) % slides.length;
    showSlide(current);
  }

  showSlide(current);
  setInterval(next, interval);
})();

/* ------------------ Search Modal Controls (optional) ------------------ */
/* Requires: #openSearch, #searchModal, #closeSearch, #global-q, #searchForm */
(function searchModal(){
  const trigger = document.getElementById("openSearch");
  const modal   = document.getElementById("searchModal");
  if (!modal) return;

  const closeBtn = document.getElementById("closeSearch");
  const input    = document.getElementById("global-q");
  const form     = document.getElementById("searchForm");

  function open(e){ e?.preventDefault(); modal.classList.add("active"); modal.setAttribute("aria-hidden","false"); setTimeout(()=>input?.focus(), 50); }
  function close(){ modal.classList.remove("active"); modal.setAttribute("aria-hidden","true"); }

  trigger?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e)=>{ if (e.target === modal) close(); });
  window.addEventListener("keydown", (e)=>{ if (e.key === "Escape" && modal.classList.contains("active")) close(); });

  form?.addEventListener("submit", (e)=>{
    const q = (input?.value || "").trim();
    if (!q) { e.preventDefault(); input?.focus(); }
  });
})();

/* ------------------ Shop by Category (mega) ------------------ */
/* Desktop: hover via CSS; Touch: tap to toggle.
   Markup: .has-megamenu > .catmenu-toggle + .mega
*/
(function categoryMega(){
  const host = document.querySelector(".has-megamenu");
  const btn  = host ? host.querySelector(".catmenu-toggle") : null;
  if (!host || !btn) return;

  const touchOnly = matchMedia("(hover: none)").matches && !matchMedia("(pointer: fine)").matches;

  if (touchOnly) {
    btn.addEventListener("click", (e)=>{
      e.preventDefault();
      host.classList.toggle("open");
      btn.setAttribute("aria-expanded", host.classList.contains("open") ? "true" : "false");
    });
    document.addEventListener("click", (e)=>{
      if (!host.contains(e.target)) {
        host.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  } else {
    host.classList.remove("open");
    btn.setAttribute("aria-expanded","false");
  }

  // Optional: pre-select category when landing with ?cat=xxx
  try {
    const params = new URLSearchParams(location.search);
    const cat = (params.get("cat") || "").toLowerCase();
    const sel = document.getElementById("fCategory");
    if (cat && sel) {
      sel.value = cat;
      if (typeof window.paint === "function") { window.currentPage = 1; window.paint(); }
      history.replaceState({}, "", location.pathname);
    }
  } catch {}
})();

/* ------------------ Body lock with cart drawer (optional) ------------------ */
/* If your page has the cart drawer, keep scroll lock in sync */
(function cartDrawerLock(){
  const drawer = document.getElementById("cdDrawer");
  if (!drawer) return;
  const toggleLock = () => document.body.classList.toggle("lock-scroll", drawer.classList.contains("active"));
  new MutationObserver(toggleLock).observe(drawer, { attributes: true, attributeFilter: ["class"] });
})();
