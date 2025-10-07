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
