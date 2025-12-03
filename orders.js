// orders.js

(function () {
    if (typeof sb === "undefined") {
      console.warn("Supabase client (sb) is not available. Check supabase.js.");
      return;
    }
  
    const tbody = document.getElementById("ordersTableBody");
    const searchInput = document.getElementById("ordersSearch");
    const searchBtn = document.getElementById("ordersSearchBtn");
    const refreshBtn = document.getElementById("ordersRefreshBtn");
  
    const detailPanel = document.getElementById("orderDetailPanel");
    const detailTitle = document.getElementById("orderDetailTitle");
    const detailSubtitle = document.getElementById("orderDetailSubtitle");
    const detailMeta = document.getElementById("orderDetailMeta");
    const detailItemsList = document.getElementById("orderItemsList");
    const detailTotals = document.getElementById("orderDetailTotals");
    const detailCloseBtn = document.getElementById("orderDetailCloseBtn");
  
    let allOrders = [];
  
    function formatCurrencyPHP(n) {
      return "₱" + Number(n || 0).toFixed(2);
    }
  
    function formatDateTime(iso) {
      if (!iso) return "";
      const dt = new Date(iso);
      return dt.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  
    function statusClass(status) {
      const s = (status || "").toLowerCase();
      if (s === "shipped" || s === "completed") return "orders-status-pill shipped";
      if (s === "cancelled") return "orders-status-pill cancelled";
      return "orders-status-pill";
    }
  
    async function loadOrders() {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="orders-empty">Loading orders…</td>
        </tr>
      `;
  
      try {
        const { data, error } = await sb
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
  
        if (error) {
          console.error("Supabase orders error:", error);
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="orders-empty">
                Could not load orders. Check Supabase configuration.
              </td>
            </tr>
          `;
          return;
        }
  
        allOrders = data || [];
        renderOrders(allOrders);
      } catch (err) {
        console.error("loadOrders failed:", err);
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="orders-empty">
              Something went wrong while loading orders.
            </td>
          </tr>
        `;
      }
    }
  
    function renderOrders(list) {
      if (!list.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="orders-empty">
              No orders found yet.
            </td>
          </tr>
        `;
        return;
      }
  
      tbody.innerHTML = "";
  
      list.forEach((order) => {
        const tr = document.createElement("tr");
        tr.dataset.orderId = order.id;
  
        const placed = formatDateTime(order.created_at);
        const totalStr = formatCurrencyPHP(order.total);
        const email = order.email || "—";
        const status = order.status || "pending";
  
        tr.innerHTML = `
          <td>${order.confirmation_number || "N/A"}</td>
          <td>${email}</td>
          <td>${totalStr}</td>
          <td>
            <span class="${statusClass(status)}">${status}</span>
          </td>
          <td>${placed}</td>
          <td class="orders-actions">
            <button type="button" data-order-id="${order.id}">
              <i class="fa-solid fa-eye"></i>
              Details
            </button>
          </td>
        `;
  
        tbody.appendChild(tr);
      });
    }
  
    function filterOrdersByQuery(q) {
      const query = q.trim().toLowerCase();
      if (!query) {
        renderOrders(allOrders);
        return;
      }
  
      const filtered = allOrders.filter((o) => {
        const conf = (o.confirmation_number || "").toLowerCase();
        const email = (o.email || "").toLowerCase();
        return conf.includes(query) || email.includes(query);
      });
  
      renderOrders(filtered);
    }
  
    async function openOrderDetails(orderId) {
      const order = allOrders.find((o) => o.id === orderId);
      if (!order) return;
  
      detailPanel.classList.add("active");
  
      detailTitle.textContent =
        "Order " + (order.confirmation_number || "N/A");
      detailSubtitle.textContent = formatDateTime(order.created_at);
  
      const addr = order.shipping_address || {};
      const parts = [];
      if (addr.fullName) parts.push(addr.fullName);
      if (addr.address) parts.push(addr.address);
      const cityStateZip = [addr.city, addr.state, addr.zip]
        .filter(Boolean)
        .join(", ");
      if (cityStateZip) parts.push(cityStateZip);
      if (addr.country) parts.push(addr.country);
  
      const addressLine = parts.join(" • ");
  
      detailMeta.innerHTML = `
        <span><strong>Email:</strong> ${order.email || "—"}</span>
        <span><strong>Phone:</strong> ${addr.phone || "—"}</span>
        <span><strong>Status:</strong> ${order.status || "pending"}</span>
        <span><strong>Ship to:</strong> ${addressLine || "—"}</span>
      `;
  
      detailItemsList.innerHTML = `
        <li class="order-item-row">
          <div>Loading items…</div>
        </li>
      `;
  
      try {
        const { data: items, error } = await sb
          .from("order_items")
          .select("*")
          .eq("order_id", order.id)
          .order("id");
  
        if (error) {
          console.error("Supabase order_items error:", error);
          detailItemsList.innerHTML = `
            <li class="order-item-row">
              <div>Could not load order items.</div>
            </li>
          `;
          return;
        }
  
        const SITE_BASE = (document
          .querySelector('meta[name="site-base"]')
          ?.content || "/").replace(/\/+$/, "/");
        const ORIGIN_BASE = location.origin + SITE_BASE;
  
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
  
        if (!items.length) {
          detailItemsList.innerHTML = `
            <li class="order-item-row">
              <div>No items stored for this order.</div>
            </li>
          `;
        } else {
          detailItemsList.innerHTML = "";
          items.forEach((it) => {
            const li = document.createElement("li");
            li.className = "order-item-row";
  
            const imgUrl = resolveImg(it.image_url);
            const qty = Math.max(1, Number(it.quantity) || 1);
            const lineTotal = Number(it.price || 0) * qty;
  
            li.innerHTML = `
              <div class="order-item-thumb">
                ${imgUrl ? `<img src="${imgUrl}" alt="${it.name || "Item"}">` : ""}
              </div>
              <div>
                <div class="order-item-name">${it.name || "Item"}</div>
                <div class="order-item-meta">
                  ${it.size ? `Size: ${it.size} • ` : ""}
                  Qty: ${qty}
                  ${
                    it.category
                      ? ` • Category: ${it.category}`
                      : ""
                  }
                </div>
              </div>
              <div class="order-item-line-total">
                ${formatCurrencyPHP(lineTotal)}
              </div>
            `;
  
            detailItemsList.appendChild(li);
          });
        }
  
        const subtotal = Number(order.subtotal || 0);
        const shipping = Number(order.shipping || 0);
        const discount = Number(order.discount || 0);
        const total = Number(order.total || subtotal + shipping - discount);
  
        let discountRowHTML = "";
        if (discount > 0) {
          discountRowHTML = `
            <div class="order-detail-total-row">
              <span>Christmas Promo (10% off)</span>
              <span>- ${formatCurrencyPHP(discount)}</span>
            </div>
          `;
        }
  
        detailTotals.innerHTML = `
          <div class="order-detail-total-row">
            <span>Subtotal</span>
            <span>${formatCurrencyPHP(subtotal)}</span>
          </div>
          ${discountRowHTML}
          <div class="order-detail-total-row">
            <span>Shipping</span>
            <span>${
              shipping === 0
                ? "FREE"
                : formatCurrencyPHP(shipping)
            }</span>
          </div>
          <div class="order-detail-total-row grand">
            <span>Total</span>
            <span>${formatCurrencyPHP(total)}</span>
          </div>
        `;
      } catch (err) {
        console.error("openOrderDetails failed:", err);
        detailItemsList.innerHTML = `
          <li class="order-item-row">
            <div>Something went wrong while loading items.</div>
          </li>
        `;
      }
    }
  
    function closeOrderDetails() {
      detailPanel.classList.remove("active");
    }
  
    // Events
    searchBtn?.addEventListener("click", () => {
      filterOrdersByQuery(searchInput.value || "");
    });
  
    searchInput?.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        filterOrdersByQuery(searchInput.value || "");
      } else if (!searchInput.value) {
        // empty -> reset
        renderOrders(allOrders);
      }
    });
  
    refreshBtn?.addEventListener("click", () => {
      searchInput.value = "";
      loadOrders();
      closeOrderDetails();
    });
  
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-order-id]");
      if (!btn) return;
      const id = Number(btn.dataset.orderId);
      if (!id) return;
      openOrderDetails(id);
    });
  
    detailCloseBtn?.addEventListener("click", closeOrderDetails);
  
    // Init
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", loadOrders);
    } else {
      loadOrders();
    }
  })();
  