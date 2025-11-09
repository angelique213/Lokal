(function(){
  // hard stop if Supabase isn't available yet
  if (!window.sb || !window.sb.auth) {
    console.warn("[persist] Supabase not ready yet; will retry on DOMContentLoaded");
  }

  // ==== helpers: localStorage ====
  const getJSON = (k, f) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(f)); } catch { return f; } };
  const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v ?? []));
  const getCart = () => getJSON("cart", []);
  const setCart = (v) => setJSON("cart", v || []);
  const getWL   = () => getJSON("wishlist", []);
  const setWL   = (v) => setJSON("wishlist", v || []);

  // UI counters if your existing code exposes them
  const updateCounts = () => {
    try {
      window.updateCartCount?.();
      // wishlist badge (simple fallback if your code doesn't update)
      const n = getWL().length;
      document.querySelectorAll("#wishlistCount,.wishlist-count").forEach(el=>{
        el.textContent = n ? String(n) : "";
        el.style.display = n ? "inline-block" : "none";
      });
    } catch {}
  };

  // ==== PULL (server -> local) ====
  async function pullCart(userId){
    const { data, error } = await sb
      .from("cart_items")
      .select("base_name,name,size,price,img,quantity")
      .eq("user_id", userId);

    if (error) { console.warn("Cloud cart load skipped:", error.message); return; }

    const local = (data || []).map(r => ({
      baseName: r.base_name || r.name,
      name: r.name,
      size: r.size ?? null,
      price: (r.price != null) ? `₱${Number(r.price).toFixed(2)}` : "₱0",
      img: r.img || "",
      quantity: Number(r.quantity) || 1,
      desc: ""
    }));
    setCart(local);
  }

  async function pullWishlist(userId){
    const { data, error } = await sb
      .from("wishlist_items")
      .select("product_id,name,price,img,url")
      .eq("user_id", userId);

    if (error) { console.warn("Cloud wishlist load skipped:", error.message); return; }

    const local = (data || []).map(r => ({
      id: r.product_id,
      name: r.name || "",
      price: (r.price != null) ? `₱${Number(r.price).toFixed(2)}` : "",
      img: r.img || "",
      url: r.url || "",
      desc: ""
    }));
    setWL(local);
  }

  // ==== PUSH (local -> server) ====
  async function pushCart(userId){
    const cart = getCart();
    // clear then insert current snapshot
    await sb.from("cart_items").delete().eq("user_id", userId);
    if (!cart.length) return;

    const rows = cart.map(it => ({
      user_id: userId,
      base_name: it.baseName || it.name,
      name: it.name || "",
      size: it.size ?? null,
      price: parseFloat(String(it.price || "0").replace(/[₱,]/g, "")) || 0,
      img: it.img || "",
      quantity: Number(it.quantity) || 1
    }));
    await sb.from("cart_items").insert(rows);
  }

  async function pushWishlist(userId){
    const wl = getWL();
    await sb.from("wishlist_items").delete().eq("user_id", userId);
    if (!wl.length) return;

    const rows = wl.map(it => ({
      user_id: userId,
      product_id: it.id || it.name,   // stable key you use in your UI
      name: it.name || "",
      price: parseFloat(String(it.price || "0").replace(/[₱,]/g, "")) || null,
      img: it.img || "",
      url: it.url || ""
    }));
    await sb.from("wishlist_items").insert(rows);
  }

  // expose push functions so your existing cart/wishlist code can call them after changes
  window.syncCartIfAuthed = async function(){
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) return;
    await pushCart(session.user.id);
  };
  window.syncWishlistIfAuthed = async function(){
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) return;
    await pushWishlist(session.user.id);
  };

  // ==== on sign-in/out ====
  async function onSignIn(userId){
    await pullCart(userId);
    await pullWishlist(userId);
    updateCounts();
  }
  function onSignOut(){
    // keep local if you want items to show while logged out:
    // (the user asked to retain locally too)
    updateCounts();
  }

  // boot: hydrate if already signed in
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const { data:{ session } } = await sb.auth.getSession();
      if (session) await onSignIn(session.user.id);
      updateCounts();
    } catch (e) {
      console.warn("[persist] bootstrap skipped:", e?.message);
    }
  });

  // live auth changes
  sb?.auth?.onAuthStateChange?.((evt, session)=>{
    if (session) onSignIn(session.user.id);
    else onSignOut();
  });
})();

