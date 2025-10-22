// Update cart counter
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElem = document.querySelector(".cart-count");
    if (cartCountElem) cartCountElem.textContent = totalQuantity;
}

// Call on page load
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
});

// Add to Cart function
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const index = cart.findIndex(item => item.name === product.name);
    if(index > -1){
        cart[index].quantity += product.quantity;
    } else {
        cart.push(product);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount(); // Update cart counter
    alert(`${product.name} added to cart!`);
}

// Add from product card
document.addEventListener("click", function(e){
    if(e.target.classList.contains("button") && e.target.closest(".best-product")){
        const p = e.target.closest(".best-product");
        addToCart({
            img: p.dataset.img,
            name: p.dataset.name,
            price: p.dataset.price,
            desc: p.dataset.desc,
            quantity: 1
        });
    }
});

// Quick View modal code (optional)
const modal = document.getElementById("quickViewModal");
if(modal){
    const modalImg = document.getElementById("modal-img");
    const modalName = document.getElementById("modal-name");
    const modalDesc = document.getElementById("modal-desc");
    const modalPrice = document.getElementById("modal-price");
    const modalRating = document.getElementById("modal-rating");
    const modalAddBtn = modal.querySelector("button");
    const closeModal = document.querySelector(".close-modal");

    document.addEventListener('click', function(e){
        if(e.target.classList.contains('quick-view-btn')){
            const product = e.target.closest(".best-product");
            modalImg.src = product.dataset.img;
            modalName.textContent = product.dataset.name;
            modalDesc.textContent = product.dataset.desc;
            modalPrice.textContent = product.dataset.price;
            modalRating.textContent = product.dataset.rating;
            modal.querySelector("input").value = 1;
            modal.style.display = "flex";
        }
    });

    closeModal.addEventListener("click", ()=> modal.style.display="none");
    window.addEventListener("click", (e)=> { if(e.target === modal) modal.style.display="none"; });

    modalAddBtn.addEventListener("click", ()=>{
        const qty = parseInt(modal.querySelector("input").value) || 1;
        addToCart({
            img: modalImg.src,
            name: modalName.textContent,
            price: modalPrice.textContent,
            desc: modalDesc.textContent,
            quantity: qty
        });
        modal.style.display = "none";
    });
}

// lokal.js - Automatic banner slider
document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".banner .slide");
    let current = 0;
    const interval = 5000; // time between slides in milliseconds (5s)
  
    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
      });
    }
  
    function nextSlide() {
      current = (current + 1) % slides.length;
      showSlide(current);
    }
  
    // Show the first slide immediately
    showSlide(current);
  
    // Auto-switch every 5 seconds
    setInterval(nextSlide, interval);
  });


  // --- Search Modal Controls ---
document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('openSearch');
    const modal = document.getElementById('searchModal');
    const closeBtn = document.getElementById('closeSearch');
    const input = document.getElementById('global-q');
    const form = document.getElementById('searchForm');
  
    if (!modal) return; // modal not on this page
  
    function openModal(e) {
      if (e) e.preventDefault();
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      setTimeout(() => input && input.focus(), 50);
    }
  
    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  
    // Open from header icon
    if (trigger) trigger.addEventListener('click', openModal);
  
    // Close with X
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  
    // Close when clicking backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  
    // Close on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
  
    // Optional: prevent empty queries
    if (form) {
      form.addEventListener('submit', (e) => {
        const q = (input?.value || '').trim();
        if (!q) {
          e.preventDefault();
          input?.focus();
        }
      });
    }
  });
  /* SHOP BY CATEGORY — hover (desktop) / tap (touch) */
(function(){
  const host = document.querySelector('.has-megamenu');
  const btn  = host ? host.querySelector('.catmenu-toggle') : null;
  if (!host || !btn) return;

  // Touch-only devices: tap to open/close
  const touchOnly = matchMedia('(hover: none)').matches && !matchMedia('(pointer: fine)').matches;
  if (touchOnly) {
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      host.classList.toggle('open');
      btn.setAttribute('aria-expanded', host.classList.contains('open') ? 'true' : 'false');
    });
    document.addEventListener('click', (e)=>{
      if (!host.contains(e.target)) {
        host.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  } else {
    // On hover devices, CSS :hover handles it
    host.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  }

  // Optional: if landing on shop-all.html?cat=xxx, preselect that category
  try{
    const params = new URLSearchParams(location.search);
    const cat = (params.get('cat')||"").toLowerCase();
    if (cat && document.getElementById('fCategory')) {
      const sel = document.getElementById('fCategory');
      sel.value = cat;
      if (typeof paint === 'function'){ window.currentPage = 1; paint(); }
      history.replaceState({}, '', location.pathname);
    }
  }catch(e){}
})();