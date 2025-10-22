/* ========= Cart (drawer + page) =========
   IMPORTANT: We DO NOT rewrite items when adding to cart.
   We only resolve image URLs at render-time so items added
   from any subfolder show correctly everywhere (incl. GH Pages).
*/
(function () {
  // ---------- helpers ----------
  const parsePeso = (p) => Number(String(p).replace(/[^\d.]/g, '') || 0);
  const fmtPeso   = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getCart  = () => JSON.parse(localStorage.getItem('cart') || '[]');
  const saveCart = (data) => localStorage.setItem('cart', JSON.stringify(data));

  // Make any stored img path displayable from ANY page.
  // We *never* force site-root ("/images/...") which breaks on GH Pages project sites.
  function resolveImg(p) {
    if (!p) return '';
    // already absolute
    if (/^https?:\/\//i.test(p)) return p;

    // strip leading slashes (root-relative can break on project sites)
    const cleaned = String(p).replace(/^\/+/, '');

    // if it contains images/... anywhere, use that portion
    const hit = cleaned.match(/(?:^|\/)(images\/.+)$/i);
    const finalPath = hit ? hit[1] : cleaned;

    try {
      // resolve relative to current document (respects <base> if present)
      return new URL(finalPath, document.baseURI).href;
    } catch {
      return finalPath; // last resort
    }
  }

  // One-time migration: upgrade any saved relative/root paths to absolute URLs.
  function migrateCartImagePaths() {
    const cart = getCart();
    let changed = false;
    for (const it of cart) {
      if (!it?.img) continue;
      if (!/^https?:\/\//i.test(it.img)) {
        const cleaned = String(it.img).replace(/^\/+/, ''); // drop leading slash
        try {
          it.img = new URL(cleaned, document.baseURI).href;
          changed = true;
        } catch {
          // keep as-is if URL fails
        }
      }
    }
    if (changed) saveCart(cart);
  }

  // ---------- Drawer refs ----------
  const drawer     = document.getElementById('cdDrawer');
  const overlay    = document.getElementById('cdOverlay');
  const btnOpen    = document.getElementById('openCart');
  const btnClose   = document.getElementById('cdClose');
  const itemsEl    = document.getElementById('cdItems');
  const subEl      = document.getElementById('cdSubtotal');
  const agreeEl    = document.getElementById('cdAgree');
  const checkoutEl = document.getElementById('cdCheckout');

  // ---------- Cart page refs ----------
  const pageItems    = document.querySelector('.cart-items');
  const pageTotal    = document.getElementById('cart-total');
  const pageCheckout = document.getElementById('checkoutBtn');

  const countBadges = document.querySelectorAll('.cart-count');

  function updateBadge() {
    const cart = getCart();
    const totalQty = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    countBadges.forEach(el => { el.textContent = totalQty; });
  }

  function itemTitleHTML(item) {
    const title = (item.baseName || item.name || '').replace(/\s+\(Size:.*\)$/, '');
    const size  = item.size ? `<div class="cart-item-size">Size: ${item.size}</div>` : '';
    return `<h3 class="cd-item-title">${title}</h3>${size}`;
  }

  // ===================== Drawer =====================
  function renderDrawer() {
    if (!itemsEl) return;

    const cart = getCart();
    itemsEl.innerHTML = '';

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
      const qty  = Math.max(1, Number(item.quantity) || 1);
      const line = unit * qty;
      subtotal += line;

      const row = document.createElement('div');
      row.className = 'cd-item';
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

  itemsEl && itemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('cd-remove')) {
      const i = Number(btn.dataset.index);
      const cart = getCart();
      cart.splice(i, 1);
      saveCart(cart);
      renderDrawer();
      renderPage();
      return;
    }

    const act = btn.dataset.act;
    if (!act) return;
    const wrap  = btn.closest('.cd-qty');
    const i     = Number(wrap.dataset.index);
    const input = wrap.querySelector('input');

    let val = Math.max(1, Number(input.value) || 1);
    val = (act === 'inc') ? val + 1 : Math.max(1, val - 1);
    input.value = val;

    const cart = getCart();
    cart[i].quantity = val;
    saveCart(cart);
    renderDrawer();
    renderPage();
  });

  itemsEl && itemsEl.addEventListener('change', (e) => {
    const input = e.target;
    if (input.tagName !== 'INPUT') return;
    const wrap = input.closest('.cd-qty');
    const i    = Number(wrap.dataset.index);
    const val  = Math.max(1, Number(input.value) || 1);
    input.value = val;

    const cart = getCart();
    cart[i].quantity = val;
    saveCart(cart);
    renderDrawer();
    renderPage();
  });

  agreeEl && agreeEl.addEventListener('change', () => {
    const cart = getCart();
    const subtotal = cart.reduce((s, i) => s + parsePeso(i.price) * (i.quantity||1), 0);
    if (checkoutEl) checkoutEl.disabled = !(agreeEl.checked && subtotal > 0);
  });

  function openDrawer() {
    if (!drawer || !overlay) return;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.classList.add('lock-scroll');
    if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
    drawer.classList.add('active');
    overlay.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    renderDrawer();
  }
  function closeDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock-scroll');
    document.body.style.paddingRight = '';
  }
  overlay  && overlay.addEventListener('click', closeDrawer);
  btnClose && btnClose.addEventListener('click', closeDrawer);
  btnOpen  && btnOpen.addEventListener('click', (e) => { e.preventDefault(); openDrawer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // expose for other pages
  window.openCartDrawer = openDrawer;

  // ===================== Cart Page =====================
  function renderPage() {
    if (!pageItems) return;

    const cart = getCart();
    pageItems.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
      pageItems.innerHTML = `<p style="color:#666;margin:8px 0;">Your cart is empty.</p>`;
      if (pageTotal) pageTotal.textContent = '0.00';
      if (pageCheckout) pageCheckout.disabled = true;
      return;
    }

    cart.forEach((item, idx) => {
      const unit = parsePeso(item.price);
      const qty  = Math.max(1, Number(item.quantity) || 1);
      const line = unit * qty;
      subtotal += line;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${resolveImg(item.img)}" alt="${item.baseName || item.name}">
        <div class="cart-item-details">
          <h3 class="cp-title">${(item.baseName || item.name).replace(/\s+\(Size:.*\)$/, '')}</h3>
          ${item.size ? `<div class="cp-size">Size: ${item.size}</div>` : ''}
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
      pageTotal.textContent = subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (pageCheckout) pageCheckout.disabled = false;
  }

  // page events
  pageItems && pageItems.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-btn');
    if (!btn) return;
    const i = Number(btn.dataset.index);
    const cart = getCart();
    cart.splice(i, 1);
    saveCart(cart);
    renderPage();
    renderDrawer();
    updateBadge();
  });

  pageItems && pageItems.addEventListener('change', (e) => {
    const input = e.target;
    if (input.tagName !== 'INPUT') return;
    const i = Number(input.dataset.index);
    const val = Math.max(1, Number(input.value) || 1);
    input.value = val;
    const cart = getCart();
    cart[i].quantity = val;
    saveCart(cart);
    renderPage();
    renderDrawer();
    updateBadge();
  });

  pageCheckout && pageCheckout.addEventListener('click', () => {
    if (pageCheckout.disabled) return;
    window.location.href = 'checkout.html';
  });

  // sync between tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'cart') { updateBadge(); renderDrawer(); renderPage(); }
  });

  // ========= initial paint =========
  migrateCartImagePaths();   // normalize any previously-saved relative/root paths
  updateBadge();
  renderPage();
})();
