/* ===== Lokal storefront glue (UI only) =====
   - Works across ALL pages
   - For cart: delegates to global window.addToCart from cart.js
   - For wishlist: handled by wishlist.js
   - Handles:
       • Home/best-pick add-to-cart buttons
       • Quick View modal (home)
       • Search modal
       • Category megamenu
       • Body lock with cart drawer
       • Account link behavior (only on pages WITHOUT auth overlay)
       • Home banner slider
============================================================================== */

/* ------------------ Utilities ------------------ */
function toAbs(p) {
  try {
    return p ? new URL(p, location.href).href : p;
  } catch {
    return p;
  }
}

/* ------------------ Add from product cards ------------------ */
/* Uses global window.addToCart defined in cart.js */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".product .button, .best-product .button");
  if (!btn) return;

  const card = btn.closest(".product, .best-product");
  if (!card) return;

  const name =
    card.dataset.name ||
    card.querySelector(".product-name")?.textContent?.trim() ||
    "Product";

  const price =
    card.dataset.price ||
    card
      .querySelector(".product-details p:last-child")
      ?.textContent?.trim() ||
    "₱0";

  const imgRel =
    card.dataset.img ||
    card.querySelector(".main-image img")?.getAttribute("src") ||
    "";

  const desc = card.dataset.desc || "";

  if (typeof window.addToCart === "function") {
    window.addToCart({
      name,
      baseName: name,
      img: toAbs(imgRel),
      price,
      desc,
      quantity: 1
    });
  } else {
    console.warn("addToCart (from cart.js) is not available yet.");
  }

  if (btn.tagName === "A") e.preventDefault();
});

/* ------------------ Quick View (optional, home) ------------------ */
(function () {
  const modal = document.getElementById("quickViewModal");
  if (!modal) return;

  const modalImg = document.getElementById("modal-img");
  const modalName = document.getElementById("modal-name");
  const modalDesc = document.getElementById("modal-desc");
  const modalPrice = document.getElementById("modal-price");
  const qtyInput = modal.querySelector('input[type="number"], input[type="text"]');
  const modalAddBtn = modal.querySelector("button");
  const closeBtn = modal.querySelector(".close-modal");

  function openFrom(card) {
    if (modalImg) modalImg.src = card.dataset.img || "";
    if (modalName) modalName.textContent = card.dataset.name || "";
    if (modalDesc) modalDesc.textContent = card.dataset.desc || "";
    if (modalPrice) modalPrice.textContent = card.dataset.price || "";
    if (qtyInput) qtyInput.value = 1;
    modal.style.display = "flex";
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".quick-view-btn");
    if (!trigger) return;
    const card = trigger.closest(".best-product, .product");
    if (!card) return;
    e.preventDefault();
    openFrom(card);
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  modalAddBtn?.addEventListener("click", () => {
    const qty = Math.max(1, parseInt(qtyInput?.value) || 1);
    const name = modalName?.textContent || "Product";
    const price = modalPrice?.textContent || "₱0";
    const img = modalImg?.src || "";
    const desc = modalDesc?.textContent || "";

    if (typeof window.addToCart === "function") {
      window.addToCart({
        img,
        name,
        baseName: name,
        price,
        desc,
        quantity: qty
      });
    } else {
      console.warn("addToCart (from cart.js) is not available yet.");
    }

    modal.style.display = "none";
  });
})();

/* ------------------ Search modal (optional) ------------------ */
(function () {
  const modal = document.getElementById("searchModal");
  if (!modal) return;

  const trigger = document.getElementById("openSearch");
  const closeBtn = document.getElementById("closeSearch");
  const input = document.getElementById("global-q");
  const form = document.getElementById("searchForm");

  const open = (e) => {
    e?.preventDefault();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => input?.focus(), 50);
  };

  const close = () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  };

  trigger?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) close();
  });

  form?.addEventListener("submit", (e) => {
    const q = (input?.value || "").trim();
    if (!q) {
      e.preventDefault();
      input?.focus();
    }
  });
})();

/* ------------------ Category mega ------------------ */
(function () {
  const host = document.querySelector(".has-megamenu");
  const btn = host?.querySelector(".catmenu-toggle");
  if (!host || !btn) return;

  const touchOnly =
    matchMedia("(hover: none)").matches &&
    !matchMedia("(pointer: fine)").matches;

  if (touchOnly) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      host.classList.toggle("open");
      btn.setAttribute(
        "aria-expanded",
        host.classList.contains("open") ? "true" : "false"
      );
    });

    document.addEventListener("click", (e) => {
      if (!host.contains(e.target)) {
        host.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  } else {
    host.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }
})();

/* ------------------ Body lock with cart drawer ------------------ */
(function () {
  const drawer = document.getElementById("cdDrawer");
  if (!drawer) return;

  const toggleLock = () => {
    document.body.classList.toggle(
      "lock-scroll",
      drawer.classList.contains("active")
    );
  };

  new MutationObserver(toggleLock).observe(drawer, {
    attributes: true,
    attributeFilter: ["class"],
  });
})();

/* ------------------ Account link (fallback, pages WITHOUT overlay) ------------------ */
(function accountLinkHandler() {
  const overlay = document.getElementById("lokalAuthOverlay");
  if (overlay) return; // index.html and other overlay pages handle account themselves

  const link = document.getElementById("accountLink");
  if (!link) return;

  async function hasSession() {
    try {
      if (!window.sb?.auth) return false;
      const { data: { session } } = await sb.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }

  (async () => {
    const signedIn = await hasSession();
    if (signedIn) {
      link.setAttribute("href", "user.html");
    } else {
      link.setAttribute(
        "href",
        `login.html?return=${encodeURIComponent(location.href)}`
      );
    }
  })();

  link.addEventListener("click", async (e) => {
    const signedIn = await hasSession();
    if (signedIn) {
      link.setAttribute("href", "user.html");
      return;
    }
    // no overlay here, just go to login.html
  });

  if (window.sb?.auth) {
    sb.auth.onAuthStateChange((_evt, session) => {
      if (session) {
        link.setAttribute("href", "user.html");
      } else {
        link.setAttribute(
          "href",
          `login.html?return=${encodeURIComponent(location.href)}`
        );
      }
    });
  }
})();

/* ------------------ Home banner slider ------------------ */
(function () {
  const slider = document.querySelector(".banner-slider");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll(".slide"));
  if (slides.length <= 1) return;

  let current = slides.findIndex((s) => s.classList.contains("active"));
  if (current < 0) {
    current = 0;
    slides[0].classList.add("active");
  }

  function show(index) {
    slides.forEach((s, i) => {
      s.classList.toggle("active", i === index);
    });
  }

  const INTERVAL = 3500; // a little faster

  setInterval(() => {
    current = (current + 1) % slides.length;
    show(current);
  }, INTERVAL);
})();
