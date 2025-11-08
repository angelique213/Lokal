/* ===== Lokal storefront glue (cleaned) =====
   - Works across ALL pages
   - Account link: modal if present, else go to login.html?return=...
   - ⛔️ No greeting injection here (index.html owns the greeting chip)
========================================================= */

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
  window.openCartDrawer?.();
  window.syncCartIfAuthed?.(); // push to cloud if logged in
};

/* ------------------ Boot counts ------------------ */
document.addEventListener("DOMContentLoaded", ()=>{ updateCartCount(); updateWishlistCount(); });

/* ------------------ Add from cards ------------------ */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".best-product .button");
  if (!btn) return;
  const card = btn.closest(".best-product"); if (!card) return;
  window.addToCart({
    img: card.dataset.img, name: card.dataset.name, price: card.dataset.price,
    desc: card.dataset.desc, quantity: 1
  });
});
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".product .overlay-image .button");
  if (!btn) return;
  const card = btn.closest(".product"); if (!card) return;
  const name  = card.dataset.name || card.querySelector(".product-name")?.textContent?.trim() || "Product";
  const price = card.dataset.price || card.querySelector(".product-details p:last-child")?.textContent?.trim() || "₱0";
  const imgRel= card.dataset.img || card.querySelector(".main-image img")?.getAttribute("src") || "";
  const desc  = card.dataset.desc || "";
  window.addToCart({ name, baseName:name, img: toAbs(imgRel), price, desc, quantity:1 });
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

/* ------------------ Banner slider (optional) ------------------ */
(function(){
  const slides = document.querySelectorAll(".banner .slide"); if (!slides.length) return;
  let current = 0; const interval = 5000;
  const show = i => slides.forEach((s,idx)=> s.classList.toggle("active", idx===i));
  const next = ()=>{ current = (current+1) % slides.length; show(current); };
  show(current); setInterval(next, interval);
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

/* ------------------ ACCOUNT LINK (modal if present, else login.html) ------------------ */
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

  // Keep a real href so it’s clickable even if JS is late
  (async () => {
    const signedIn = await hasSession();
    if (signedIn) {
      link.setAttribute("href", "user.html");
    } else {
      const ret = encodeURIComponent(location.href);
      link.setAttribute("href", `login.html?return=${ret}`);
    }
  })();

  link.addEventListener("click", async (e)=>{
    const overlay = document.getElementById("lokalAuthOverlay");
    const signedIn = await hasSession();

    if (signedIn) {
      link.setAttribute("href", "user.html");
      return; // allow natural navigation
    }

    if (overlay) {
      e.preventDefault();
      overlay.setAttribute("aria-hidden","false");
      document.getElementById("laEmailForm")?.removeAttribute("hidden");
      document.getElementById("laPassForm")?.setAttribute("hidden","");
      document.getElementById("laEmail")?.focus();
    } else {
      const ret = encodeURIComponent(location.href);
      link.setAttribute("href", `login.html?return=${ret}`);
    }
  });
})();

/* ------------------ Signed-out toast (optional) ------------------ */
(function(){
  function showToast(msg){
    if (document.getElementById('signedOutToast')) return;
    const box = document.createElement('div');
    box.id = 'signedOutToast';
    box.className = 'toast-signout';
    box.setAttribute('role','status');
    box.setAttribute('aria-live','polite');
    box.innerHTML = `<span>${msg}</span><button aria-label="Dismiss">×</button>`;
    document.body.appendChild(box);
    const close = () => box.remove();
    box.querySelector('button')?.addEventListener('click', close);
    setTimeout(close, 5000);
  }
  function clearMarkers(){
    sessionStorage.removeItem('lokalJustSignedOut');
    const url = new URL(location.href);
    if (url.searchParams.has('signedout')){
      url.searchParams.delete('signedout');
      history.replaceState({}, '', url.pathname + (url.hash || ''));
    }
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const url = new URL(location.href);
    const fromParam = url.searchParams.get('signedout') === '1';
    const fromStorage = sessionStorage.getItem('lokalJustSignedOut') === '1';
    if (fromParam || fromStorage){ showToast("You’re signed out."); clearMarkers(); }
  });
})();

/* ------------------ Cloud sync (Supabase) ------------------ */
(function persistSync(){
  if (!window.sb?.auth) return;

  const getLS = (k)=>getJSON(k,[]);
  const setLS = (k,v)=>setJSON(k,v||[]);
  const paint = ()=>{ updateCartCount(); updateWishlistCount(); };

  async function pullCart(user){
    const { data, error } = await sb.from("cart_items")
      .select("name,size,price,img,quantity,base_name")
      .eq("user_id", user.id);
    if (!error && Array.isArray(data)){
      const local = data.map(r => ({
        baseName: r.base_name || r.name, name: r.name, size: r.size ?? null,
        price: r.price != null ? `₱${Number(r.price).toFixed(2)}` : "₱0",
        img: r.img || "", quantity: Number(r.quantity)||1, desc:""
      }));
      setLS("cart", local);
    }
  }
  async function pullWL(user){
    const { data, error } = await sb.from("wishlist_items")
      .select("product_id,name,price,img,url")
      .eq("user_id", user.id);
    if (!error && Array.isArray(data)){
      const local = data.map(r => ({
        id: r.product_id, name: r.name,
        price: r.price != null ? `₱${Number(r.price).toFixed(2)}` : "",
        img: r.img || "", url: r.url || ""
      }));
      setLS("wishlist", local);
    }
  }

  window.syncCartIfAuthed = async function(){
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) return;
    const user = session.user;
    const cart = getLS("cart");
    await sb.from("cart_items").delete().eq("user_id", user.id);
    if (cart.length){
      const rows = cart.map(it => ({
        user_id: user.id,
        base_name: it.baseName || it.name,
        name: it.name,
        size: it.size ?? null,
        price: parseFloat(String(it.price||"0").replace(/[₱,]/g,"")) || 0,
        img: it.img || "",
        quantity: Number(it.quantity)||1
      }));
      await sb.from("cart_items").insert(rows);
    }
  };
  window.syncWishlistIfAuthed = async function(){
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) return;
    const user = session.user;
    const wl = getLS("wishlist");
    await sb.from("wishlist_items").delete().eq("user_id", user.id);
    if (wl.length){
      const rows = wl.map(it => ({
        user_id: user.id,
        product_id: it.id || it.name,
        name: it.name || "",
        price: parseFloat(String(it.price||"0").replace(/[₱,]/g,"")) || null,
        img: it.img || "",
        url: it.url || ""
      }));
      await sb.from("wishlist_items").insert(rows);
    }
  };

  async function onSignIn(){
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) return;
    await pullCart(session.user);
    await pullWL(session.user);
    paint();
  }
  function onSignOut(){ setLS("cart",[]); setLS("wishlist",[]); paint(); }

  document.addEventListener("DOMContentLoaded", async ()=>{
    try{
      const { data:{ session } } = await sb.auth.getSession();
      if (session) await onSignIn();
    } finally { paint(); }
  });

  sb.auth.onAuthStateChange((_evt, session)=>{ session ? onSignIn() : onSignOut(); });
})();
window.updateCartCount = updateCartCount;
/* ------------------ Account Link fallback for GitHub Pages ------------------ */
(function(){
  const link = document.getElementById('accountLink');
  if (!link) return;

  // Make sure it's always clickable even if JS loads late or Supabase fails
  const ret = encodeURIComponent(location.href);
  if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
    link.setAttribute('href', `login.html?return=${ret}`);
  }
})();
