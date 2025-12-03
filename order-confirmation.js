// order-confirmation.js

// Helper to turn "₱295.00" or "PHP 295.00" into 295
function parsePeso(p) {
  if (typeof p === "number") return p;
  const s = String(p || "").replace(/[^\d.]/g, "");
  return Number(s || 0);
}

(function () {
  const raw = localStorage.getItem("lokalLastOrder");

  if (!raw) {
    document.body.innerHTML = `
      <main class="confirmation-container">
        <section class="confirmation-card">
          <h1>No recent order found</h1>
          <p>Your confirmation link may have expired or you opened this page directly.</p>
          <p>Please return to the shop and place an order again.</p>
          <a href="index.html" class="button">Back to Home</a>
        </section>
      </main>
    `;
    return;
  }

  const order = JSON.parse(raw);

  const confNumberEl = document.getElementById("confNumber");
  const confEmailEl  = document.getElementById("confEmail");
  const confDateEl   = document.getElementById("confDate");
  const confTotalEl  = document.getElementById("confTotal");
  const summaryEl    = document.getElementById("confOrderSummary");

  const currency = order.currency || "PHP";
  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping || 0);
  const discount = Number(order.discount || 0);
  const total    = Number(order.total || subtotal + shipping - discount);

  confNumberEl.textContent =
    order.confirmationNumber || order.paypalOrderId || "N/A";

  const shippingData = order.shippingData || {};
  const email =
    shippingData.email ||
    (order.payer && order.payer.email_address) ||
    "";

  confEmailEl.textContent = email || "Not provided";

  if (order.createdAt) {
    const dt = new Date(order.createdAt);
    confDateEl.textContent =
      "Placed on " + dt.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  }

  confTotalEl.textContent = `${currency} ${total.toFixed(2)}`;

  // ---------- Build the order summary ----------
  summaryEl.innerHTML = "";

  const items = Array.isArray(order.items) ? order.items : [];

  if (!items.length) {
    summaryEl.innerHTML = "<p>No items found for this order.</p>";
    return;
  }

  const list = document.createElement("ul");
  list.className = "summary-items-list";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "summary-item";

    const qty = Math.max(1, Number(item.quantity) || 1);
    const priceNum = parsePeso(item.price);
    const lineTotal = priceNum * qty;

    const imgWrap = document.createElement("div");
    imgWrap.className = "summary-thumb";
    const img = document.createElement("img");
    img.src = item.img || item.image || "";
    img.alt = item.baseName || item.name || "Item";
    imgWrap.appendChild(img);

    const left = document.createElement("div");
    const right = document.createElement("div");

    const nameEl = document.createElement("div");
    nameEl.className = "summary-name";
    nameEl.textContent = item.baseName || item.name || "Item";

    const metaEl = document.createElement("div");
    metaEl.className = "summary-meta";

    const bits = [];
    if (item.size) bits.push(`Size: ${item.size}`);
    bits.push(`Qty: ${qty}`);
    metaEl.textContent = bits.join(" • ");

    left.appendChild(nameEl);
    left.appendChild(metaEl);

    right.className = "summary-line-total";
    right.textContent = `${currency} ${lineTotal.toFixed(2)}`;

    li.appendChild(imgWrap);
    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });

  summaryEl.appendChild(list);

  // Totals block
  const totalsDiv = document.createElement("div");
  totalsDiv.className = "summary-totals";

  let discountRowHtml = "";
  if (discount > 0.01) {
    discountRowHtml = `
      <div class="summary-total-row discount">
        <span>Promo (Christmas -10%)</span>
        <span>- ${currency} ${discount.toFixed(2)}</span>
      </div>
    `;
  }

  totalsDiv.innerHTML = `
    <div class="summary-total-row">
      <span>Subtotal</span>
      <span>${currency} ${subtotal.toFixed(2)}</span>
    </div>
    ${discountRowHtml}
    <div class="summary-total-row">
      <span>Shipping</span>
      <span>${shipping === 0 ? "FREE" : currency + " " + shipping.toFixed(2)}</span>
    </div>
    <div class="summary-total-row grand">
      <span>Total</span>
      <span>${currency} ${total.toFixed(2)}</span>
    </div>
  `;

  summaryEl.appendChild(totalsDiv);
})();
