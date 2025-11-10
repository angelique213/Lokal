/* ===== persist-sync.js (cart + wishlist cloud sync) =====
   - LocalStorage is the working cache
   - SIGNED_IN: merge local + remote, paint, then push merged to server
   - SIGNED_OUT: clear local (so pages show empty), paint
   - Emits: 'wishlist:updated' and 'cart:updated' on any change
   - Exposes: window.syncCartIfAuthed(), window.syncWishlistIfAuthed()
=========================================================== */
(function(){
  if (!window.sb?.auth) return;

  const getJSON = (k, f)=>{ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(f)); } catch { return f; } };
  const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v||[]));
  const paint = ()=>{
    try{ window.updateCartCount?.(); }catch{}
    // wishlist count (if you have a helper it’ll run too)
    try{
      const n = (getJSON('wishlist',[])).length;
      document.querySelectorAll('#wishlistCount,.wishlist-count').forEach(el=>{
        el.textContent = n ? String(n) : '';
        el.style.display = n ? 'inline-block' : 'none';
      });
    }catch{}
  };
  const emit = (name)=> { try{ window.dispatchEvent(new CustomEvent(name)); }catch{} };

  // -------- remote pulls --------
  async function pullCart(user){
    const { data, error } = await sb.from('cart_items')
      .select('base_name,name,size,price,img,quantity')
      .eq('user_id', user.id);
    if (error) return [];
    return (data||[]).map(r => ({
      baseName: r.base_name || r.name,
      name: r.name,
      size: r.size ?? null,
      price: r.price != null ? `₱${Number(r.price).toFixed(2)}` : '₱0',
      img: r.img || '',
      quantity: Number(r.quantity)||1,
      desc: ''
    }));
  }
  async function pullWL(user){
    const { data, error } = await sb.from('wishlist_items')
      .select('product_id,name,price,img,url')
      .eq('user_id', user.id);
    if (error) return [];
    return (data||[]).map(r => ({
      id: r.product_id,
      name: r.name || '',
      price: r.price != null ? `₱${Number(r.price).toFixed(2)}` : '',
      img: r.img || '',
      url: r.url || ''
    }));
  }

  // -------- remote pushes --------
  async function pushCart(user, cart){
    await sb.from('cart_items').delete().eq('user_id', user.id);
    if (!cart.length) return;
    const rows = cart.map(it => ({
      user_id: user.id,
      base_name: it.baseName || it.name,
      name: it.name,
      size: it.size ?? null,
      price: parseFloat(String(it.price||'0').replace(/[₱,]/g,'')) || 0,
      img: it.img || '',
      quantity: Number(it.quantity)||1
    }));
    await sb.from('cart_items').insert(rows);
  }
  async function pushWL(user, wl){
    await sb.from('wishlist_items').delete().eq('user_id', user.id);
    if (!wl.length) return;
    const rows = wl.map(it => ({
      user_id: user.id,
      product_id: it.id || it.name,
      name: it.name || '',
      price: parseFloat(String(it.price||'0').replace(/[₱,]/g,'')) || null,
      img: it.img || '',
      url: it.url || ''
    }));
    await sb.from('wishlist_items').insert(rows);
  }

  // -------- merge helpers --------
  function mergeCart(local, remote){
    const key = it => `${(it.baseName||it.name)||''}|${it.size??''}`;
    const map = new Map();
    [...remote, ...local].forEach(it=>{
      const k = key(it);
      if (!map.has(k)) map.set(k, {...it});
      else map.get(k).quantity = (Number(map.get(k).quantity)||0) + (Number(it.quantity)||0);
    });
    return [...map.values()];
  }
  function mergeWL(local, remote){
    const map = new Map();
    [...remote, ...local].forEach(it=>{
      const k = (it.id || it.name || '').trim().toLowerCase();
      if (!k) return;
      if (!map.has(k)) map.set(k, {...it, id:(it.id||it.name)});
    });
    return [...map.values()];
  }

  // -------- public sync functions (UI code calls after local change) --------
  window.syncCartIfAuthed = async function(){
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) return;
    await pushCart(session.user, getJSON('cart',[]));
  };
  window.syncWishlistIfAuthed = async function(){
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) return;
    await pushWL(session.user, getJSON('wishlist',[]));
  };

  // -------- hydrate on load + react to auth --------
  (async function hydrateOnLoad(){
    try{
      const { data:{ session } } = await sb.auth.getSession();
      if (!session) { paint(); return; }

      // signed in: merge remote+local then push back
      const user = session.user;
      const [remoteCart, remoteWL] = await Promise.all([pullCart(user), pullWL(user)]);
      const mergedCart = mergeCart(getJSON('cart',[]), remoteCart);
      const mergedWL   = mergeWL(getJSON('wishlist',[]), remoteWL);

      setJSON('cart', mergedCart);
      setJSON('wishlist', mergedWL);
      paint();
      emit('cart:updated'); emit('wishlist:updated');

      await Promise.all([pushCart(user, mergedCart), pushWL(user, mergedWL)]);
    } finally { /* keep UI painted */ }
  })();

  sb.auth.onAuthStateChange(async (evt, session)=>{
    if (!session){
      // SIGNED_OUT: clear locals so site appears empty while logged out
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      paint();
      emit('cart:updated'); emit('wishlist:updated');
      return;
    }
    // SIGNED_IN: merge again (in case changed while signed out)
    const user = session.user;
    const [remoteCart, remoteWL] = await Promise.all([pullCart(user), pullWL(user)]);
    const mergedCart = mergeCart(getJSON('cart',[]), remoteCart);
    const mergedWL   = mergeWL(getJSON('wishlist',[]), remoteWL);

    setJSON('cart', mergedCart);
    setJSON('wishlist', mergedWL);
    paint();
    emit('cart:updated'); emit('wishlist:updated');

    await Promise.all([pushCart(user, mergedCart), pushWL(user, mergedWL)]);
  });
})();

