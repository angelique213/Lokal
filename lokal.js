/* ===== Lokal storefront glue (UI only, cloud handled by persist-sync.js) =====
   - Works across ALL pages
   - Add-to-cart updates localStorage + badges
   - If signed in, persist-sync.js mirrors to Supabase
   - No greeting injection here
============================================================================== */

/* ------------------ Utilities ------------------ */
function toAbs(p){ try{ return p ? new URL(p, location.href).href : p; }catch{ return p; } }
function getJSON(k, f){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(f)); }catch{ return f; } }
function setJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function getCart(){ return getJSON("cart", []); }
function setCart(v){ setJSON("cart", v||[]); }
function getWL(){ return getJSON("wishlist", []); }
function setWL(v){ setJSON("wishlist", v||[]); }

function updateCartCount(){
  const n = getCart().reduce((s,i)=> s + (Number(i.quantity)||0), 0);
  document.querySelectorAll(".cart-count").forEach(el => el.textContent = n);
}
function updateWishlistCount(){
  const n = getWL().length;
  document.querySelectorAll("#wishlistCount,.wishlist-count").forEach(el=>{
    el.textContent = n ? String(n) : "";
    el.style.display = n ? "inline-block" : "none";
  });
}
window.updateCartCount = updateCartCount; // used by persist-sync

/* ------------------ Add to cart (exposed) ------------------ */
window.addToCart = function(product){
  const item = {
    baseName: product.baseName || product.name,
    name: product.name,
    img: toAbs(product.img || ""),
    price: product.price || "₱0",
    desc: product.desc || "",
    size: product.size ?? null,
    quantity: Math.max(1, parseInt(product.quantity) || 1),
  };
  const cart = getCart();
  const i = cart.findIndex(x => (x.baseName||x.name)===item.baseName && (x.size??null)===(item.size??null));
  if (i>-1) cart[i].quantity += item.quantity; else cart.push(item);
  setCart(cart);
  updateCartCount();

  // Optional UI: open drawer if you have one
  window.openCartDrawer?.();

  // Mirror to cloud if logged in (persist-sync.js exposes these)
  window.syncCartIfAuthed?.();
};

/* ------------------ Boot badges ------------------ */
document.addEventListener("DOMContentLoaded", ()=>{ updateCartCount(); updateWishlistCount(); });

/* ------------------ Add from product cards (robust) ------------------ */
document.addEventListener("click", (e) => {
  // catch any .button inside a .product OR .best-product card
  const btn = e.target.closest(".product .button, .best-product .button");
  if (!btn) return;

  const card = btn.closest(".product, .best-product");
  if (!card) return;

  const name  = card.dataset.name || card.querySelector(".product-name")?.textContent?.trim() || "Product";
  const price = card.dataset.price || card.querySelector(".product-details p:last-child")?.textContent?.trim() || "₱0";
  const imgRel= card.dataset.img || card.querySelector(".main-image img")?.getAttribute("src") || "";
  const desc  = card.dataset.desc || "";

  window.addToCart({ name, baseName: name, img: imgRel, price, desc, quantity: 1 });

  // prevent accidental <a> navigation if the button is an anchor
  if (btn.tagName === "A") e.preventDefault();
});

/* ------------------ Quick View (optional) ------------------ */
(function(){
  const modal = document.getElementById("quickViewModal"); if (!modal) return;
  const modalImg = document.getElementById("modal-img");
  const modalName= document.getElementById("modal-name");
  const modalDesc= document.getElementById("modal-desc");
  const modalPrice=document.getElementById("modal-price");
  const qtyInput = modal.querySelector('input[type="number"], input[type="text"]');
  const modalAddBtn = modal.querySelector("button");
  const closeBtn = modal.querySelector(".close-modal");

  function openFrom(card){
    if (modalImg) modalImg.src = card.dataset.img || "";
    if (modalName) modalName.textContent = card.dataset.name || "";
    if (modalDesc) modalDesc.textContent = card.dataset.desc || "";
    if (modalPrice) modalPrice.textContent = card.dataset.price || "";
    if (qtyInput) qtyInput.value = 1;
    modal.style.display = "flex";
  }
  document.addEventListener("click", (e)=>{
    const trigger = e.target.closest(".quick-view-btn");
    if (!trigger) return;
    const card = trigger.closest(".best-product");
    e.preventDefault(); openFrom(card);
  });
  closeBtn?.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e)=>{ if (e.target === modal) modal.style.display = "none"; });
  modalAddBtn?.addEventListener("click", ()=>{
    const qty = Math.max(1, parseInt(qtyInput?.value) || 1);
    window.addToCart({
      img: modalImg?.src, name: modalName?.textContent || "Product",
      price: modalPrice?.textContent || "₱0", desc: modalDesc?.textContent || "",
      quantity: qty
    });
    modal.style.display = "none";
  });
})();

/* ------------------ Search modal (optional) ------------------ */
(function(){
  const modal = document.getElementById("searchModal"); if (!modal) return;
  const trigger = document.getElementById("openSearch");
  const closeBtn= document.getElementById("closeSearch");
  const input   = document.getElementById("global-q");
  const form    = document.getElementById("searchForm");
  const open = (e)=>{ e?.preventDefault(); modal.classList.add("active"); modal.setAttribute("aria-hidden","false"); setTimeout(()=>input?.focus(),50); };
  const close= ()=>{ modal.classList.remove("active"); modal.setAttribute("aria-hidden","true"); };
  trigger?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", e=>{ if (e.target===modal) close(); });
  window.addEventListener("keydown", e=>{ if (e.key==="Escape" && modal.classList.contains("active")) close(); });
  form?.addEventListener("submit", (e)=>{ const q=(input?.value||"").trim(); if(!q){ e.preventDefault(); input?.focus(); } });
})();

/* ------------------ Category mega ------------------ */
(function(){
  const host = document.querySelector(".has-megamenu"); const btn = host?.querySelector(".catmenu-toggle");
  if (!host || !btn) return;
  const touchOnly = matchMedia("(hover: none)").matches && !matchMedia("(pointer: fine)").matches;
  if (touchOnly){
    btn.addEventListener("click", (e)=>{
      e.preventDefault(); host.classList.toggle("open");
      btn.setAttribute("aria-expanded", host.classList.contains("open") ? "true" : "false");
    });
    document.addEventListener("click", (e)=>{
      if (!host.contains(e.target)){ host.classList.remove("open"); btn.setAttribute("aria-expanded","false"); }
    });
  } else {
    host.classList.remove("open"); btn.setAttribute("aria-expanded","false");
  }
})();

/* ------------------ Body lock with cart drawer ------------------ */
(function(){
  const drawer = document.getElementById("cdDrawer"); if (!drawer) return;
  const toggleLock = () => document.body.classList.toggle("lock-scroll", drawer.classList.contains("active"));
  new MutationObserver(toggleLock).observe(drawer, { attributes:true, attributeFilter:["class"] });
})();

/* ------------------ Account link (modal if present, else login.html) ------------------ */
(function accountLinkHandler(){
  const link = document.getElementById("accountLink");
  if (!link) return;

  async function hasSession(){
    try {
      if (!window.sb?.auth) return false;
      const { data:{ session } } = await sb.auth.getSession();
      return !!session;
    } catch { return false; }
  }

  (async () => {
    const signedIn = await hasSession();
    if (signedIn) link.setAttribute("href", "user.html");
    else link.setAttribute("href", `login.html?return=${encodeURIComponent(location.href)}`);
  })();

  link.addEventListener("click", async (e)=>{
    const overlay = document.getElementById("lokalAuthOverlay");
    const signedIn = await hasSession();
    if (signedIn) { link.setAttribute("href","user.html"); return; }
    if (overlay) {
      e.preventDefault();
      overlay.setAttribute("aria-hidden","false");
      document.getElementById("laEmailForm")?.removeAttribute("hidden");
      document.getElementById("laPassForm")?.setAttribute("hidden","");
      document.getElementById("laEmail")?.focus();
    }
  });

  if (window.sb?.auth) {
    sb.auth.onAuthStateChange((_evt, session)=>{
      if (session) link.setAttribute("href","user.html");
      else link.setAttribute("href", `login.html?return=${encodeURIComponent(location.href)}`);
    });
  }
})();
