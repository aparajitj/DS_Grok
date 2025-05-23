let cart = JSON.parse(localStorage.getItem("cart")) || [];

document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = parseInt(btn.dataset.price);

    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ id, name, price, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartIcon();
    renderCart();
    showCart();
  });
});

function updateCartIcon() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-count").textContent = count;
}

function showCart() {
  document.getElementById("cart-modal").style.right = "0";
}

function hideCart() {
  document.getElementById("cart-modal").style.right = "-400px";
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = '<li class="text-gray-600">Your cart is empty</li>';
    cartTotal.textContent = 0;
    return;
  }

  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const li = document.createElement("li");
    li.style.marginBottom = "15px";
    li.innerHTML = `
      <strong>${item.name}</strong><br/>
      ₹${item.price} x 
      <button onclick="changeQty(${index}, -1)">➖</button>
      <span style="margin: 0 10px;">${item.quantity}</span>
      <button onclick="changeQty(${index}, 1)">➕</button>
      <button onclick="removeItem(${index})" style="float:right;">❌</button>
    `;
    cartItems.appendChild(li);
  });

  cartTotal.textContent = total;
}

function changeQty(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartIcon();
}

function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartIcon();
}

function checkout() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ You must be logged in to checkout.");
    window.location.href = "login.html";
    return;
  }

  if (cart.length === 0) {
    alert("⚠️ Your cart is empty!");
    return;
  }

  fetch("https://ds-grok.onrender.com/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ 
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.message) {
      alert("✅ Order placed successfully!");
      cart = [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
      updateCartIcon();
      hideCart();
    } else {
      alert("❌ Checkout failed: " + (data.message || "Unknown error"));
    }
  })
  .catch(err => {
    console.error("Checkout error:", err);
    alert("❌ Something went wrong!");
  });
}

function updateAuthLink() {
  const authLink = document.getElementById("auth-link");
  const token = localStorage.getItem("token");
  if (token) {
    authLink.textContent = "Logout";
    authLink.href = "#";
    authLink.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      updateAuthLink();
      alert("Logged out successfully!");
    };
  } else {
    authLink.textContent = "Login";
    authLink.href = "login.html";
  }
}

// Auth setup and event listeners
document.addEventListener("DOMContentLoaded", () => {
  updateCartIcon();
  renderCart();
  updateAuthLink();
  document.getElementById("cart-icon").addEventListener("click", showCart);
  document.getElementById("close-cart").addEventListener("click", hideCart);
  document.getElementById("continue-shopping").addEventListener("click", hideCart);
  document.getElementById("checkout-button").addEventListener("click", checkout);
});
