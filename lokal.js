/* ===== lokal.js / main.js — Lokal storefront glue =====
   ✅ Updates .cart-count & #wishlistCount badges
   ✅ Safe add-to-cart (homepage + best-picks)
   ✅ Works from subfolders (absolute image URLs)
   ✅ Quick View modal (if present)
   ✅ Auto banner slider (if present)
   ✅ Search modal (if present)
   ✅ Category mega menu (desktop hover / touch tap)
   ✅ Inline greeting beside icons (auto, no prompt)
   ✅ Signed-out toast on home
   ✅ Cloud sync for cart & wishlist (Supabase) per account
========================================================= */

/* ------------------ Utilities ------------------ */
function toAbs(p){ try{ return p ? new URL(p, location.href).href : p; }catch{ return p; } }
function getCart(){ try{ return JSON.parse(localStorage.getItem("cart") || "[]"); }catch{ return []; } }
function setCart(cart){ localStorage.setItem("cart", JSON.stringify(cart || [])); }
function getWL(){ try{ return JSON.parse(localStorage.getItem("wishlist") || "[]"); }catch{ return []; } }
function setWL(arr){ localStorage.setItem("wishlist", JSON.stringify(arr || [])); }

function updateCartCount(){
  const totalQty = getCart().reduce((sum,i)=> sum + (Number(i.quantity)||0), 0);
  document.querySelectorAll(".cart-count").forEach(el => el.textContent = totalQty);
}
function updateWishlistCount(){
  const n = getWL().length;
  const el = document.getElementById("wishlistCount");
  if (el) el.textContent = n;
}

/* ------------------ Add to cart (exposed) ------------------ */
window.addToCart = function addToCart(product){
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
  const idx = cart.findIndex(x => (x.baseName || x.name) === item.baseName && (x.size ?? null) === (item.size ?? null));
  if (idx > -1) cart[idx].quantity += item.quantity; else cart.push(item);
  setCart(cart);
  updateCartCount();
  if (typeof window.openCartDrawer === "function") window.openCartDrawer();

  // notify cloud sync (if signed in)
  if (window.sb?.auth) {
    sb.auth.getSession().then(({data})=>{
      const uid = data?.session?.user?.id;
      if (uid && window.__pushCartDebounced) window.__pushCartDebounced(uid);
    });
  }
};

/* ------------------ On Load ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateWishlistCount();
});

/* ------------------ Add from product cards ------------------ */
/* Best Picks / Shop All cards (.best-product .button) */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".best-product .button");
  if (!btn) return;
  const card = btn.closest(".best-product"); if (!card) return;
  window.addToCart({
    img: card.dataset.img, name: card.dataset.name, price: card.dataset.price,
    desc: card.dataset.desc, quantity: 1
  });
});

/* Homepage sample cards (.product .overlay-image .button) */
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

/* ------------------ Quick View Modal (optional) ------------------ */
(function quickViewInit(){
  const modal = document.getElementById("quickViewModal"); if (!modal) return;
  const modalImg = document.getElementById("modal-img");
  const modalName= document.getElementById("modal-name");
  const modalDesc= document.getElementById("modal-desc");
  const modalPrice=document.getElementById("modal-price");
  const modalRating=document.getElementById("modal-rating");
  const qtyInput = modal.querySelector('input[type="number"], input[type="text"]');
  const modalAddBtn = modal.querySelector("button");
  const closeBtn = modal.querySelector(".close-modal");

  function openModalFromCard(card){
    if (!card) return;
    if (modalImg) modalImg.src = card.dataset.img || "";
    if (modalName) modalName.textContent = card.dataset.name || "";
    if (modalDesc) modalDesc.textContent = card.dataset.desc || "";
    if (modalPrice) modalPrice.textContent = card.dataset.price || "";
    if (modalRating) modalRating.textContent = card.dataset.rating || "";
    if (qtyInput) qtyInput.value = 1;
    modal.style.display = "flex";
  }

  document.addEventListener("click", (e)=>{
    const trigger = e.target.closest(".quick-view-btn");
    if (!trigger) return;
    const card = trigger.closest(".best-product");
    e.preventDefault(); openModalFromCard(card);
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

/* ------------------ Automatic banner slider (optional) ------------------ */
(function bannerSlider(){
  const slides = document.querySelectorAll(".banner .slide"); if (!slides.length) return;
  let current = 0; const interval = 5000;
  const show = i => slides.forEach((s,idx)=> s.classList.toggle("active", idx===i));
  const next = ()=>{ current = (current+1) % slides.length; show(current); };
  show(current); setInterval(next, interval);
})();

/* ------------------ Search Modal Controls (optional) ------------------ */
(function searchModal(){
  const modal = document.getElementById("searchModal"); if (!modal) return;
  const trigger = document.getElementById("openSearch");
  const closeBtn= document.getElementById("closeSearch");
  const input   = document.getElementById("global-q");
  const form    = document.getElementById("searchForm");

  function open(e){ e?.preventDefault(); modal.classList.add("active"); modal.setAttribute("aria-hidden","false"); setTimeout(()=>input?.focus(),50); }
  function close(){ modal.classList.remove("active"); modal.setAttribute("aria-hidden","true"); }

  trigger?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e)=>{ if (e.target===modal) close(); });
  window.addEventListener("keydown", (e)=>{ if (e.key === "Escape" && modal.classList.contains("active")) close(); });

  form?.addEventListener("submit", (e)=>{
    const q = (input?.value || "").trim();
    if (!q){ e.preventDefault(); input?.focus(); }
  });
})();

/* ------------------ Shop by Category (mega) ------------------ */
(function categoryMega(){
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

  // Optional: pre-select category with ?cat=xxx
  try{
    const params = new URLSearchParams(location.search);
    const cat = (params.get("cat") || "").toLowerCase();
    const sel = document.getElementById("fCategory");
    if (cat && sel){ sel.value = cat; if (typeof window.paint === "function"){ window.currentPage = 1; window.paint(); } history.replaceState({}, "", location.pathname); }
  }catch{}
})();

/* ------------------ Body lock with cart drawer (optional) ------------------ */
(function cartDrawerLock(){
  const drawer = document.getElementById("cdDrawer"); if (!drawer) return;
  const toggleLock = () => document.body.classList.toggle("lock-scroll", drawer.classList.contains("active"));
  new MutationObserver(toggleLock).observe(drawer, { attributes:true, attributeFilter:["class"] });
})();

/* ------------------ Inline Greeting beside icons ------------------ */
(function(){
  const MAX_TRIES = 40, DELAY_MS = 250;
  const firstToken = s => (String(s||"").trim().split(/\s+/)[0] || "");
  const cap = s => { s = String(s||"").trim(); return s ? s.charAt(0).toUpperCase()+s.slice(1) : ""; };
  const nameFromMeta = u => {
    const md = (u && u.user_metadata) || {};
    return md.first_name || md.given_name || firstToken(md.full_name || md.name) || null;
  };

  function ensureAnchor(){
    const utils = document.querySelector(".utils"); if (!utils) return null;
    let a = document.getElementById("inlineGreetingAnchor");
    if (!a){ a = document.createElement("div"); a.id = "inlineGreetingAnchor"; a.className = "inline-greeting anchored"; utils.appendChild(a); }
    return a;
  }
  function hideGreeting(){ document.getElementById("inlineGreetingAnchor")?.remove(); document.getElementById("homeGreeting")?.setAttribute("hidden",""); }

  async function getSession(){ try{ const { data } = await sb.auth.getSession(); return data?.session || null; }catch{ return null; } }
  async function getUser(){ try{ const { data } = await sb.auth.getUser(); return data?.user || null; }catch{ return null; } }
  async function waitForSession(){ for (let i=0;i<MAX_TRIES;i++){ const s = await getSession(); if (s) return s; await new Promise(r=>setTimeout(r, DELAY_MS)); } return null; }

  async function render(){
    if (!window.sb?.auth){ hideGreeting(); return; }
    const session = await getSession() || await waitForSession();
    if (!session){ hideGreeting(); return; }
    const user = await getUser();
    const first = cap(nameFromMeta(user) || ""); if (!first){ hideGreeting(); return; }
    const anchor = ensureAnchor(); if (!anchor){ hideGreeting(); return; }
    anchor.textContent = `Welcome back, ${first}`;
    const home = document.getElementById("homeGreeting"); if (home) home.hidden = true;
  }

  document.addEventListener("DOMContentLoaded", render);

  function wire(){
    if (window.sb?.auth?.onAuthStateChange){
      sb.auth.onAuthStateChange((_evt, session)=>{ if (session) render(); else hideGreeting(); });
    }
  }
  wire();
  let tries = 0;
  const t = setInterval(()=>{ if (window.sb?.auth){ clearInterval(t); wire(); render(); } else if (++tries > 20) clearInterval(t); }, 300);
})();

/* ------------------ Signed-out toast on home ------------------ */
(function signedOutToast(){
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

/* ================== CART/WISHLIST CLOUD SYNC (Supabase) ==================
   - SIGNED_IN  -> pull cloud → local (badges update)
   - Local changes -> debounced push to cloud (while signed in)
   - SIGNED_OUT -> clear local (badges to 0)
   Requires tables:
     cart_items(user_id uuid, base_name text, name text, size text, price numeric, img text, quantity int)
     wishlist_items(user_id uuid, product_id text, name text, price numeric, img text, url text)
============================================================================ */
(function cloudSync(){
  if (!window.sb?.auth) return;

  const getLocalCart = getCart;
  const setLocalCart = (a)=>{ setCart(a); updateCartCount(); };
  const getLocalWL   = getWL;
  const setLocalWL   = (a)=>{ setWL(a); updateWishlistCount(); };

  async function pullCart(userId){
    try{
      const { data, error } = await sb
        .from('cart_items')
        .select('base_name,name,size,price,img,quantity')
        .eq('user_id', userId);
      if (error) throw error;
      const local = (data||[]).map(r=>({
        baseName: r.base_name || r.name,
        name: r.name,
        size: r.size ?? null,
        price: String(r.price ?? '₱0'),
        img: r.img || '',
        desc: '',
        quantity: Number(r.quantity || 1)
      }));
      setLocalCart(local);
    }catch(err){ console.warn('pullCart:', err); }
  }

  async function pushCart(userId){
    const local = getLocalCart();
    try{
      await sb.from('cart_items').delete().eq('user_id', userId);
      const rows = (local||[]).map(it=>({
        user_id:userId,
        base_name: it.baseName || it.name,
        name: it.name,
        size: it.size ?? null,
        price: Number(String(it.price).replace(/[^\d.]/g,'')) || 0,
        img: it.img || '',
        quantity: Number(it.quantity || 1)
      }));
      if (rows.length) await sb.from('cart_items').insert(rows);
    }catch(err){ console.warn('pushCart:', err); }
  }

  async function pullWL(userId){
    try{
      const { data, error } = await sb
        .from('wishlist_items')
        .select('product_id,name,price,img,url')
        .eq('user_id', userId);
      if (error) throw error;
      const local = (data||[]).map(r=>({
        id: r.product_id || r.name,
        name: r.name,
        price: String(r.price ?? ''),
        img: r.img || '',
        url: r.url || ''
      }));
      setLocalWL(local);
    }catch(err){ console.warn('pullWL:', err); }
  }

  async function pushWL(userId){
    const local = getLocalWL();
    try{
      await sb.from('wishlist_items').delete().eq('user_id', userId);
      const rows = (local||[]).map(w=>({
        user_id:userId,
        product_id: w.id || w.name,
        name: w.name,
        price: Number(String(w.price).replace(/[^\d.]/g,'')) || null,
        img: w.img || '',
        url: w.url || ''
      }));
      if (rows.length) await sb.from('wishlist_items').insert(rows);
    }catch(err){ console.warn('pushWL:', err); }
  }

  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
  window.__pushCartDebounced = debounce(pushCart, 600);
  const pushWLDebounced = debounce(pushWL, 600);

  // Listen for wishlist changes from wishlist.js
  window.addEventListener('wishlist:changed', ()=>{
    sb.auth.getSession().then(({data})=>{
      const uid = data?.session?.user?.id;
      if (uid) pushWLDebounced(uid);
      updateWishlistCount();
    });
  });

  async function onSignedIn(user){
    await pullCart(user.id);
    await pullWL(user.id);
  }
  function onSignedOut(){
    setLocalCart([]); setLocalWL([]);
  }

  (async ()=>{
    const { data:{ session } } = await sb.auth.getSession();
    if (session?.user) await onSignedIn(session.user);
  })();

  sb.auth.onAuthStateChange((_evt, session)=>{
    if (session?.user) onSignedIn(session.user);
    else onSignedOut();
  });
})();
/* =======================
   CART & WISHLIST SYNC
   ======================= */
   (function persistSync(){
    // --- Helpers (local) ---
    function getLS(key){ try{ return JSON.parse(localStorage.getItem(key) || "[]"); }catch{ return []; } }
    function setLS(key, val){ localStorage.setItem(key, JSON.stringify(val||[])); }
  
    function cartCount(){ return getLS("cart").reduce((s,i)=> s + (Number(i.quantity)||0), 0); }
    function wlCount(){ return getLS("wishlist").length; }
  
    function paintBadges(){
      document.querySelectorAll(".cart-count").forEach(el => el.textContent = cartCount());
      const wl = document.getElementById("wishlistCount");
      if (wl) wl.textContent = wlCount();
    }
  
    // --- PULL remote → local (overwrite local with server copy) ---
    async function pullCart(user){
      const { data, error } = await sb
        .from("cart_items")
        .select("name,size,price,img,quantity,base_name")
        .eq("user_id", user.id);
      if (!error && Array.isArray(data)){
        const local = data.map(r => ({
          baseName: r.base_name || r.name,
          name: r.name,
          size: r.size ?? null,
          price: r.price != null ? `₱${Number(r.price).toFixed(2)}` : "₱0",
          img: r.img || "",
          quantity: Number(r.quantity)||1,
          desc: "" // optional
        }));
        setLS("cart", local);
      }
    }
  
    async function pullWishlist(user){
      const { data, error } = await sb
        .from("wishlist_items")
        .select("product_id,name,price,img,url")
        .eq("user_id", user.id);
      if (!error && Array.isArray(data)){
        const local = data.map(r => ({
          id: r.product_id,
          name: r.name,
          price: r.price != null ? `₱${Number(r.price).toFixed(2)}` : "",
          img: r.img || "",
          url: r.url || ""
        }));
        setLS("wishlist", local);
      }
    }
  
    // --- MERGE local guest → server (one-time on login) ---
    async function mergeCartToServer(user){
      const cart = getLS("cart");
      if (!cart.length) return;
      for (const it of cart){
        const name = it.name;
        const size = it.size ?? null;
        const priceNum = parseFloat(String(it.price||"0").replace(/[₱,]/g,"")) || 0;
        const payload = {
          user_id: user.id,
          base_name: it.baseName || name,
          name,
          size,
          price: priceNum,
          img: it.img || "",
          quantity: Number(it.quantity)||1
        };
        // upsert by (user_id, name, size) unique index → increment quantity if exists
        const { data, error } = await sb
          .from("cart_items")
          .upsert(payload, { onConflict: "user_id,name,size" })
          .select("quantity")
          .eq("user_id", user.id)
          .eq("name", name)
          .eq("size", size)
          .maybeSingle();
        if (!error && data && it.quantity > (Number(data.quantity)||0)){
          // if your upsert doesn’t add quantities, you can update explicitly here
        }
      }
    }
  
    async function mergeWishlistToServer(user){
      const wl = getLS("wishlist");
      if (!wl.length) return;
      for (const it of wl){
        const priceNum = parseFloat(String(it.price||"0").replace(/[₱,]/g,"")) || null;
        await sb.from("wishlist_items").upsert({
          user_id: user.id,
          product_id: it.id || it.name, // fallback if you don’t have a product id
          name: it.name || "",
          price: priceNum,
          img: it.img || "",
          url: it.url || ""
        }, { onConflict: "user_id,product_id" });
      }
    }
  
    // --- PUSH local → server after *any* local change (for logged-in users) ---
    // Call these from your add/remove code if you want instant server sync.
    window.syncCartIfAuthed = async function(){
      const { data:{ session } } = await sb.auth.getSession();
      if (!session) return;
      const user = session.user;
      const cart = getLS("cart");
  
      // Clear server copy, then insert all (simple strategy)
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
  
    // --- Wire into auth lifecycle ---
    async function onSignIn(){
      const { data:{ session } } = await sb.auth.getSession();
      if (!session) return;
      const user = session.user;
  
      // 1) Merge any guest state up to server (you had items before logging in)
      await mergeCartToServer(user);
      await mergeWishlistToServer(user);
  
      // 2) Pull fresh server copy down (single source of truth)
      await pullCart(user);
      await pullWishlist(user);
  
      paintBadges();
    }
  
    async function onSignOut(){
      // Guest experience: empty cart & wishlist on sign-out
      setLS("cart", []);
      setLS("wishlist", []);
      paintBadges();
    }
  
    // Initial boot
    document.addEventListener("DOMContentLoaded", async ()=>{
      try{
        if (window.sb && sb.auth){
          const { data:{ session } } = await sb.auth.getSession();
          if (session) await onSignIn();
        }
      } finally {
        paintBadges();
      }
    });
  
    // Live auth events
    if (window.sb && sb.auth && sb.auth.onAuthStateChange){
      sb.auth.onAuthStateChange((evt, session)=>{
        if (session) onSignIn();
        else onSignOut();
      });
    }
  
    // OPTIONAL: hook your existing add/remove to push to server when logged in.
    // Example: after your window.addToCart(...) finishes, call:
    const _origAddToCart = window.addToCart;
    window.addToCart = function(p){
      _origAddToCart(p);
      // push local→server if logged in
      window.syncCartIfAuthed?.();
    };
  
    // If you have wishlist.js that writes localStorage('wishlist'), call window.syncWishlistIfAuthed()
    // at the end of its add/remove functions in the same way.
  })();
  