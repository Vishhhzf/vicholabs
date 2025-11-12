document.addEventListener('DOMContentLoaded', () => {

  // --- FORMATO DE MONEDA (Para CLP) ---
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  });

  // --- LÓGICA DEL MENÚ MÓVIL (MEJORA #7) ---
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const cartOverlay = document.getElementById('cart-overlay'); // Re-usamos el overlay

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      cartOverlay.classList.toggle('open'); // Activa el overlay
    });
  }

  // --- LÓGICA DEL CARRITO DE COMPRAS ---
  const cartIcon = document.getElementById('cart-icon');
  const cartSidebar = document.getElementById('cart-sidebar');
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartCounter = document.getElementById('cart-counter');
  const cartTotalPrice = document.getElementById('cart-total-price');

  // ¡MEJORA #1 IMPLEMENTADA! Cargar carrito desde localStorage
  let cart = JSON.parse(localStorage.getItem('vichoCart')) || [];

  const toggleCart = () => {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('open');
  };
  
  if (cartIcon) {
    cartIcon.addEventListener('click', toggleCart);
  }
  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => {
      // Cierra ambos, carrito y menú
      if (cartSidebar.classList.contains('open')) {
        cartSidebar.classList.remove('open');
      }
      if (mainNav && mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
      }
      cartOverlay.classList.remove('open');
    });
  }

  const renderCart = () => {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
    } else {
      cart.forEach(item => {
        const cartItemEl = document.createElement('div');
        cartItemEl.classList.add('cart-item');
        cartItemEl.innerHTML = `
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>${formatter.format(item.price * item.quantity)} (x${item.quantity})</p>
          </div>
          <div class="cart-item-controls">
            <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
          </div>
        `;
        cartItemsContainer.appendChild(cartItemEl);
      });
    }
    updateCartInfo();
    
    // ¡MEJORA #1 IMPLEMENTADA! Guardar carrito en localStorage
    localStorage.setItem('vichoCart', JSON.stringify(cart));
  };
  
  const updateCartInfo = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cartCounter) {
      cartCounter.textContent = totalItems;
    }
    if (cartTotalPrice) {
      cartTotalPrice.textContent = formatter.format(totalPrice);
    }
  };

  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const name = e.target.dataset.name;
      const price = parseFloat(e.target.dataset.price);
      const existingItem = cart.find(item => item.id === id);
      
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ id, name, price, quantity: 1 });
      }
      renderCart();
      
      // Abrir el carrito para mostrar que se añadió
      if (!cartSidebar.classList.contains('open')) {
        toggleCart();
      }
    });
  });

  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('quantity-btn')) {
        const id = e.target.dataset.id;
        const action = e.target.dataset.action;
        const item = cart.find(item => item.id === id);

        if (item) {
          if (action === 'increase') {
            item.quantity++;
          } else if (action === 'decrease') {
            item.quantity--;
            if (item.quantity === 0) {
              cart = cart.filter(cartItem => cartItem.id !== id);
            }
          }
          renderCart();
        }
      }
    });
  }

  // --- LÓGICA DE ANIMACIÓN DE SCROLL (MEJORA #8) ---
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1 // Activa cuando el 10% es visible
  });

  revealElements.forEach(el => observer.observe(el));


  // --- LÓGICA DE LA PÁGINA DE CHECKOUT (MEJORA #1 y #9) ---
  if (document.body.classList.contains('page-checkout')) {
    const summaryList = document.getElementById('order-summary-list');
    const summaryTotal = document.getElementById('order-total-price');
    const hiddenData = document.getElementById('order_data');
    const checkoutForm = document.getElementById('checkout-form');
    
    // 1. Pintar el resumen del pedido
    const renderCheckoutSummary = () => {
      summaryList.innerHTML = '';
      if (cart.length === 0) {
        summaryList.innerHTML = '<p>Tu carrito está vacío.</p>';
      } else {
        cart.forEach(item => {
          const itemEl = document.createElement('div');
          itemEl.classList.add('order-summary-item');
          itemEl.innerHTML = `
            <span class="item-name">${item.name} (x${item.quantity})</span>
            <span class="item-price">${formatter.format(item.price * item.quantity)}</span>
          `;
          summaryList.appendChild(itemEl);
        });
      }
      
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      summaryTotal.textContent = formatter.format(totalPrice);
    };

    // 2. Preparar el formulario para el envío
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', () => {
        // Crear un resumen de texto para Formspree
        let orderSummaryString = "Resumen del Pedido:\n";
        orderSummaryString += "======================\n";
        let totalPrice = 0;
        
        cart.forEach(item => {
          const itemTotal = item.price * item.quantity;
          orderSummaryString += `${item.name} (x${item.quantity}) - ${formatter.format(itemTotal)}\n`;
          totalPrice += itemTotal;
        });
        
        orderSummaryString += "======================\n";
        orderSummaryString += `TOTAL: ${formatter.format(totalPrice)}\n`;
        
        // Asignar al campo oculto
        hiddenData.value = orderSummaryString;
        
        // Limpiar el carrito después de enviar
        cart = [];
        localStorage.removeItem('vichoCart');
      });
    }

    // Cargar el resumen al cargar la página de checkout
    renderCheckoutSummary();
  }

  // --- RENDERIZADO INICIAL DEL CARRITO (EN TODAS LAS PÁGINAS) ---
  renderCart();

});