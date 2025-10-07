document.addEventListener("DOMContentLoaded", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartContainer = document.querySelector(".cart-items");

    if(cart.length === 0){
        cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    } else {
        cart.forEach(item => {
            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <img src="${item.img}" alt="${item.name}" width="100">
                <h3>${item.name}</h3>
                <p>${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
            `;
            cartContainer.appendChild(div);
        });
    }
});
// Get cart items from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Elements
const cartItemsContainer = document.querySelector(".cart-items");
const cartTotalElem = document.getElementById("cart-total");

// Function to render cart items
function renderCart() {
    cartItemsContainer.innerHTML = "";

    if(cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        cartTotalElem.textContent = "0";
        updateCartCount();
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = parseFloat(item.price.replace("₱", "")) * item.quantity;
        total += itemTotal;

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <img src="${item.img}" alt="${item.name}" style="width:100px; height:100px; object-fit:cover;">
            <div class="cart-item-details">
                <p><strong>${item.name}</strong></p>
                <p>Price: ${item.price}</p>
                <label>Quantity: <input type="number" min="1" value="${item.quantity}" data-index="${index}"></label>
                <button class="remove-btn" data-index="${index}">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotalElem.textContent = total.toFixed(2);
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElem = document.querySelector(".cart-count");
    if (cartCountElem) cartCountElem.textContent = totalQuantity;
}

// Change quantity
cartItemsContainer.addEventListener("change", function(e){
    if(e.target.tagName === "INPUT") {
        const index = e.target.dataset.index;
        let newQty = parseInt(e.target.value);
        if(newQty < 1) newQty = 1;
        cart[index].quantity = newQty;
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
    }
});

// Remove item
cartItemsContainer.addEventListener("click", function(e){
    if(e.target.classList.contains("remove-btn")) {
        const index = e.target.dataset.index;
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
    }
});

// Initial render
renderCart();

// Example inside renderCart()
const div = document.createElement("div");
div.className = "cart-item"; // matches CSS
div.innerHTML = `
    <img src="${item.img}" alt="${item.name}">
    <div class="cart-item-details">
        <p><strong>${item.name}</strong></p>
        <p>Price: ${item.price}</p>
        <label>Quantity: <input type="number" min="1" value="${item.quantity}" data-index="${index}"></label>
        <button class="remove-btn" data-index="${index}">Remove</button>
    </div>
`;
cartItemsContainer.appendChild(div);
