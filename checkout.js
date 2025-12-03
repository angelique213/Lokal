// checkout.js

const CART_KEY = "lokalCartV1";

const SHIPPING_FLAT_RATE = 180;
const FREE_SHIPPING_THRESHOLD = 2500;

const SITE_BASE = (document.querySelector('meta[name="site-base"]')?.content || "/").replace(/\/+$/, "/");
const ORIGIN_BASE = location.origin + SITE_BASE;

// global checkout summary
window.lokalCheckout = {
  items: [],
  subtotal: 0,
  shipping: 0,
  discount: 0,
  total: 0,
};

window.lokalBuyerId = null; // filled from Supabase session if logged in

// Initialise EmailJS with your PUBLIC KEY
if (window.emailjs) {
  emailjs.init("PQkEaTYVhFkWrAo5g");
} else {
  console.warn("EmailJS SDK not loaded");
}

function parsePeso(p) {
  if (typeof p === "number") return p;
  const s = String(p || "").replace(/[^\d.]/g, "");
  return Number(s || 0);
}

function formatPeso(n) {
  return (
    "₱" +
    Number(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY) || "[]";
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items || []));
  window.dispatchEvent(new Event("cart:updated"));
}

function getItemName(item) {
  return item.baseName || item.name || "Item";
}

function getItemMeta(item) {
  const bits = [];
  if (item.size) bits.push(`Size: ${item.size}`);
  const qty = Math.max(1, Number(item.quantity) || 1);
  bits.push(`Qty: ${qty}`);
  return bits.join(" • ");
}

function lineTotal(item) {
  const price = parsePeso(item.price);
  const qty = Math.max(1, Number(item.quantity) || 1);
  return price * qty;
}

function resolveImg(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const cleaned = String(p).replace(/^\/+/, "");
  const hit = cleaned.match(/(?:^|\/)(images\/.+)$/i);
  const tail = hit ? hit[1] : cleaned;
  try {
    return new URL(tail, ORIGIN_BASE).href;
  } catch {
    return p;
  }
}

// ----- Christmas promo helpers -----

// keywords we consider "Christmas vibes"
const CHRISTMAS_KEYWORDS = [
  "christmas",
  "santa",
  "parol",
  "orn",
  "ornament",
  "wreath",
  "capiz",
];

function isChristmasItem(item) {
  const name = (item.name || item.baseName || "").toLowerCase();
  const cat = (item.category || item.cat || "").toLowerCase();
  const img = (item.img || item.image || "").toLowerCase();

  const haystack = `${name} ${cat} ${img}`;
  return CHRISTMAS_KEYWORDS.some((kw) => haystack.includes(kw));
}

// ---------- render (with qty / edit & Christmas discount) ----------

function renderCheckoutSummary() {
  const itemsEl = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const shippingEl = document.getElementById("checkout-shipping");
  const totalEl = document.getElementById("checkout-total");
  const discountRowEl = document.getElementById("checkout-discount-row");
  const discountEl = document.getElementById("checkout-discount");

  if (!itemsEl || !subtotalEl || !shippingEl || !totalEl) return;

  const cartItems = loadCart();
  window.lokalCheckout.items = cartItems;

  itemsEl.innerHTML = "";

  if (!cartItems.length) {
    const empty = document.createElement("p");
    empty.className = "checkout-item-meta";
    empty.textContent =
      "Your cart is empty. Add items to your bag before checking out.";
    itemsEl.appendChild(empty);

    subtotalEl.textContent = formatPeso(0);
    shippingEl.textContent = formatPeso(0);
    totalEl.textContent = formatPeso(0);
    window.lokalCheckout.subtotal = 0;
    window.lokalCheckout.shipping = 0;
    window.lokalCheckout.discount = 0;
    window.lokalCheckout.total = 0;
    if (discountRowEl) discountRowEl.style.display = "none";
    return;
  }

  let subtotalBeforeDiscount = 0;
  let discountTotal = 0;

  cartItems.forEach((item, index) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const row = document.createElement("div");
    row.className = "checkout-item-row";
    row.dataset.index = index;

    const name = getItemName(item);
    const meta = getItemMeta(item);
    const imgUrl = resolveImg(item.img || item.image || "");

    const rawLine = lineTotal(item);
    const discountForItem = isChristmasItem(item) ? rawLine * 0.10 : 0;
    const finalLine = rawLine - discountForItem;

    subtotalBeforeDiscount += rawLine;
    discountTotal += discountForItem;

    const priceHtml =
      discountForItem > 0
        ? `<span class="price-original">${formatPeso(rawLine)}</span>
           <span class="price-discounted">${formatPeso(finalLine)}</span>`
        : formatPeso(finalLine);

    row.innerHTML = `
      <div class="checkout-item-thumb">
        <img src="${imgUrl}" alt="${name}">
      </div>

      <div class="checkout-item-main">
        <div class="checkout-item-main-top">
          <div>
            <div class="checkout-item-name">${name}</div>
            <div class="checkout-item-meta">${meta}</div>
          </div>
          <button type="button" class="checkout-item-remove" data-index="${index}" aria-label="Remove ${name}">×</button>
        </div>

        <div class="checkout-item-actions">
          <span>Qty</span>
          <div class="checkout-qty-control" data-index="${index}">
            <button type="button" class="chk-dec" aria-label="Decrease quantity">−</button>
            <input type="number" class="chk-qty-input" min="1" value="${qty}">
            <button type="button" class="chk-inc" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="checkout-item-edit chk-edit" data-index="${index}">Edit</button>
        </div>
      </div>

      <div class="checkout-item-price">
        ${priceHtml}
      </div>
    `;

    itemsEl.appendChild(row);
  });

  const subtotalAfterDiscount = subtotalBeforeDiscount - discountTotal;

  let shipping = 0;
  if (subtotalAfterDiscount > 0) {
    shipping =
      subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_FLAT_RATE;
  }
  const total = subtotalAfterDiscount + shipping;

  subtotalEl.textContent = formatPeso(subtotalAfterDiscount);
  if (discountRowEl && discountEl) {
    if (discountTotal > 0.01) {
      discountRowEl.style.display = "flex";
      discountEl.textContent = "-" + formatPeso(discountTotal);
    } else {
      discountRowEl.style.display = "none";
    }
  }

  shippingEl.textContent =
    shipping === 0 && subtotalAfterDiscount > 0 ? "FREE" : formatPeso(shipping);
  totalEl.textContent = formatPeso(total);

  window.lokalCheckout.subtotal = subtotalAfterDiscount;
  window.lokalCheckout.shipping = shipping;
  window.lokalCheckout.discount = discountTotal;
  window.lokalCheckout.total = total;
}

// ---------- quantity & remove handlers (inline) ----------

function wireInlineQtyControls() {
  const itemsEl = document.getElementById("checkout-items");
  if (!itemsEl) return;

  itemsEl.addEventListener("click", (e) => {
    const dec = e.target.closest(".chk-dec");
    const inc = e.target.closest(".chk-inc");
    const removeBtn = e.target.closest(".checkout-item-remove");
    const editBtn = e.target.closest(".chk-edit");

    if (dec || inc) {
      const control = e.target.closest(".checkout-qty-control");
      if (!control) return;
      const index = Number(control.dataset.index);
      const cart = loadCart();
      if (!cart[index]) return;

      let qty = Math.max(1, Number(cart[index].quantity) || 1);
      qty = dec ? Math.max(1, qty - 1) : qty + 1;
      cart[index].quantity = qty;
      saveCart(cart);
      renderCheckoutSummary();
      return;
    }

    if (removeBtn) {
      const index = Number(removeBtn.dataset.index);
      const cart = loadCart();
      if (!cart[index]) return;
      cart.splice(index, 1);
      saveCart(cart);
      renderCheckoutSummary();
      return;
    }

    if (editBtn) {
      const index = Number(editBtn.dataset.index);
      openEditModal(index);
      return;
    }
  });

  itemsEl.addEventListener("change", (e) => {
    if (!e.target.classList.contains("chk-qty-input")) return;
    const control = e.target.closest(".checkout-qty-control");
    const index = Number(control.dataset.index);
    const cart = loadCart();
    if (!cart[index]) return;
    let qty = Math.max(1, Number(e.target.value) || 1);
    cart[index].quantity = qty;
    saveCart(cart);
    renderCheckoutSummary();
  });
}

// ---------- Edit modal ----------

let editingIndex = null;

function openEditModal(index) {
  const cart = loadCart();
  const item = cart[index];
  if (!item) return;

  editingIndex = index;

  const overlay = document.getElementById("chkEditOverlay");
  const imgEl = document.getElementById("chkEditImg");
  const nameEl = document.getElementById("chkEditName");
  const priceEl = document.getElementById("chkEditPrice");
  const sizeInput = document.getElementById("chkEditSize");
  const qtyInput = document.getElementById("chkEditQty");

  const name = getItemName(item);
  imgEl.src = resolveImg(item.img || item.image || "");
  imgEl.alt = name;
  nameEl.textContent = name;
  priceEl.textContent = item.price || formatPeso(parsePeso(item.price));
  sizeInput.value = item.size || "";
  qtyInput.value = Math.max(1, Number(item.quantity) || 1);

  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  const overlay = document.getElementById("chkEditOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  editingIndex = null;
}

function wireEditModal() {
  const overlay = document.getElementById("chkEditOverlay");
  if (!overlay) return;

  const btnClose = document.getElementById("chkEditClose");
  const btnDec = document.getElementById("chkEditDec");
  const btnInc = document.getElementById("chkEditInc");
  const btnSave = document.getElementById("chkEditSave");
  const qtyInput = document.getElementById("chkEditQty");

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeEditModal();
  });

  btnClose?.addEventListener("click", closeEditModal);

  btnDec?.addEventListener("click", () => {
    const v = Math.max(1, Number(qtyInput.value) || 1);
    qtyInput.value = Math.max(1, v - 1);
  });

  btnInc?.addEventListener("click", () => {
    const v = Math.max(1, Number(qtyInput.value) || 1);
    qtyInput.value = v + 1;
  });

  btnSave?.addEventListener("click", () => {
    if (editingIndex === null) return;
    const cart = loadCart();
    const item = cart[editingIndex];
    if (!item) return;

    const sizeVal = document.getElementById("chkEditSize").value.trim();
    const qtyVal = Math.max(1, Number(qtyInput.value) || 1);

    item.size = sizeVal;
    item.quantity = qtyVal;

    saveCart(cart);
    renderCheckoutSummary();
    closeEditModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditModal();
  });
}

// ---------- Supabase save (fixed to match your schema) ----------

async function saveOrderToSupabase(order) {
  if (!window.sb) {
    console.warn("Supabase client (sb) not found. Skipping DB save.");
    return null;
  }

  try {
    const shipping = order.shippingData || {};
    const shippingAddress = {
      fullName: shipping.fullName || "",
      phone: shipping.phone || "",
      address: shipping.address || "",
      city: shipping.city || "",
      state: shipping.state || "",
      zip: shipping.zip || "",
      country: shipping.country || "",
    };

    // Insert into orders table
    const { data: orderInsert, error: orderError } = await sb
      .from("orders")
      .insert({
        confirmation_number: order.confirmationNumber,
        email: shipping.email || null,
        status: "paid",
        subtotal: order.subtotal || 0,
        shipping: order.shipping || 0,
        discount: order.discount || 0,
        total: order.total || 0,
        currency: order.currency || "PHP",
        shipping_address: shippingAddress,
        buyer_id: order.supabaseBuyerId || null,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Supabase order insert error:", orderError);
      return null;
    }

    const orderId = orderInsert.id;

    // Insert items into order_items table
    if (Array.isArray(order.items) && order.items.length) {
      const itemRows = order.items.map((item) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        return {
          order_id: orderId,
          name: getItemName(item),
          size: item.size || null,
          quantity: qty,
          price: parsePeso(item.price),
          category: item.category || item.cat || null,
          image_url: item.img || item.image || null,
        };
      });

      const { error: itemsError } = await sb
        .from("order_items")
        .insert(itemRows);

      if (itemsError) {
        console.error("Supabase order_items insert error:", itemsError);
      }
    }

    return orderId;
  } catch (err) {
    console.error("saveOrderToSupabase exception:", err);
    return null;
  }
}

// ---------- EmailJS send ----------

async function sendOrderEmail(order) {
  if (!window.emailjs) {
    console.warn("EmailJS not available, skipping email send.");
    return;
  }

  const shipping = order.shippingData || {};
  const toEmail =
    shipping.email ||
    (order.payer && order.payer.email_address) ||
    "";

  if (!toEmail) {
    console.warn("No email address on order; not sending email.");
    return;
  }

  const fullName =
    shipping.fullName ||
    (order.payer &&
      order.payer.name &&
      `${order.payer.name.given_name || ""} ${order.payer.name.surname || ""}`.trim()) ||
    "Customer";

  // Build items array for EmailJS template loop
  const items = (order.items || []).map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = parsePeso(item.price);
    const line = price * qty;
    return {
      name: getItemName(item),
      size: item.size || "",
      quantity: qty,
      price: price.toFixed(2),
      lineTotal: line.toFixed(2),
      img: resolveImg(item.img || item.image || ""),
    };
  });

  const params = {
    order_number: order.confirmationNumber || order.supabaseOrderId || "",
    full_name: fullName,
    email: toEmail,
    address: shipping.address || "",
    city: shipping.city || "",
    state: shipping.state || "",
    zip: shipping.zip || "",
    country: shipping.country || "",
    subtotal: (order.subtotal || 0).toFixed(2),
    shipping: (order.shipping || 0).toFixed(2),
    total: (order.total || 0).toFixed(2),
    items,
  };

  const TEMPLATE_ID = "template_rcaugcr";

  try {
    const result = await emailjs.send(
      "service_655ilxy",
      TEMPLATE_ID,
      params
    );
    console.log("EmailJS order email sent:", result.status, result.text);
  } catch (err) {
    console.error("EmailJS send error:", err);
  }
}

// ---------- Form handling (fallback order without PayPal) ----------

function handleCheckoutForm() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cartItems = loadCart();
    if (!cartItems.length) {
      alert("Your cart is empty. Please add items before checking out.");
      return;
    }

    const formData = new FormData(form);
    const shippingData = {
      fullName: formData.get("fullName")?.trim(),
      email: formData.get("email")?.trim(),
      phone: formData.get("phone")?.trim(),
      address: formData.get("address")?.trim(),
      city: formData.get("city")?.trim(),
      state: formData.get("state")?.trim(),
      zip: formData.get("zip")?.trim(),
      country: formData.get("country"),
    };

    const confirmationNumber = "LK-" + Date.now().toString().slice(-8);

    const order = {
      confirmationNumber,
      createdAt: new Date().toISOString(),
      items: window.lokalCheckout.items,
      subtotal: window.lokalCheckout.subtotal,
      shipping: window.lokalCheckout.shipping,
      discount: window.lokalCheckout.discount,
      total: window.lokalCheckout.total,
      currency: "PHP",
      shippingData,
      payer: null,
      paypalOrderId: null,
      supabaseBuyerId: window.lokalBuyerId || null,
    };

    try {
      const supabaseOrderId = await saveOrderToSupabase(order);
      if (supabaseOrderId) {
        order.supabaseOrderId = supabaseOrderId;
      }
    } catch (err) {
      console.warn("Supabase save failed:", err);
    }

    try {
      await sendOrderEmail(order);
    } catch (err) {
      console.warn("Email send failed:", err);
    }

    try {
      localStorage.setItem("lokalLastOrder", JSON.stringify(order));
    } catch (err) {
      console.warn("Could not store order locally:", err);
    }

    alert(
      "Order placed.\n\nYour confirmation # is " +
        confirmationNumber +
        "\nTotal: " +
        formatPeso(window.lokalCheckout.total)
    );

    saveCart([]); // clears + fires cart:updated
    window.location.href = "order-confirmation.html";
  });
}

// ---------- init ----------

async function initCheckout() {
  console.log("Checkout script loaded.");

  // Get Supabase user id if logged in
  if (window.sb && sb.auth) {
    try {
      const { data: { session } } = await sb.auth.getSession();
      window.lokalBuyerId = session?.user?.id || null;
    } catch (err) {
      console.warn("Supabase getSession failed:", err);
    }
  }

  renderCheckoutSummary();
  wireInlineQtyControls();
  wireEditModal();
  handleCheckoutForm();
}

window.addEventListener("cart:updated", renderCheckoutSummary);
window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) renderCheckoutSummary();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCheckout);
} else {
  initCheckout();
}
