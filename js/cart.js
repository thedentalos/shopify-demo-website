/**
 * LUXE STORE - Cart Management Module
 * Attaches to window.LuxeStore.Cart
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Cart = (function () {
  'use strict';

  const STORAGE_KEY = 'luxe_cart';
  const COUPON_KEY = 'luxe_coupon';
  const NOTES_KEY = 'luxe_order_notes';
  const FREE_SHIPPING_THRESHOLD = 50.00;
  const STANDARD_SHIPPING_COST = 15.00;

  const getUtils = () => window.LuxeStore.Utils || {
    formatCurrency: v => '$' + Number(v || 0).toFixed(2),
    escapeHTML: s => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '')
  };

  const getNotifications = () => window.LuxeStore.Notifications;

  /**
   * Retrieve current cart array from localStorage
   * @returns {Array}
   */
  function getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[LuxeStore.Cart] Error reading localStorage', e);
      return [];
    }
  }

  /**
   * Persist cart array to localStorage and update UI
   * @param {Array} cart
   */
  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('[LuxeStore.Cart] Error writing to localStorage', e);
    }
    updateCartUI();
  }

  /**
   * Retrieve applied coupon if any
   * @returns {Object|null} e.g. { code: 'LUXE10', discountPercent: 10 }
   */
  function getCoupon() {
    try {
      const data = localStorage.getItem(COUPON_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Apply coupon code
   * @param {string} rawCode
   * @returns {boolean}
   */
  function applyCoupon(rawCode) {
    const code = (rawCode || '').trim().toUpperCase();
    const Notifications = getNotifications();

    if (code === 'LUXE10') {
      const couponData = { code: 'LUXE10', discountPercent: 10 };
      try {
        localStorage.setItem(COUPON_KEY, JSON.stringify(couponData));
      } catch (e) {}

      if (Notifications) {
        Notifications.showToast('Coupon LUXE10 applied! 10% discount added.', 'success');
      }
      updateCartUI();
      return true;
    } else {
      if (Notifications) {
        Notifications.showToast('Invalid promo code. Please try LUXE10.', 'error');
      }
      return false;
    }
  }

  /**
   * Remove active coupon
   */
  function removeCoupon() {
    try {
      localStorage.removeItem(COUPON_KEY);
    } catch (e) {}

    const Notifications = getNotifications();
    if (Notifications) {
      Notifications.showToast('Coupon removed.', 'info');
    }
    updateCartUI();
  }

  /**
   * Add a product variant to the cart
   * @param {Object} product
   * @param {Object|null} variant
   * @param {number} qty
   */
  function addToCart(product, variant = null, qty = 1) {
    if (!product) return;

    const cart = getCart();
    const quantity = Math.max(1, parseInt(qty, 10) || 1);

    const variantId = variant ? variant.id : (product.variants && product.variants[0] ? product.variants[0].id : 'default');
    const price = variant && typeof variant.price === 'number' ? variant.price : product.price;
    const compareAtPrice = variant && variant.compareAtPrice ? variant.compareAtPrice : product.compareAtPrice;
    const variantTitle = variant && variant.title ? variant.title : '';

    let image = 'https://picsum.photos/seed/placeholder/600/800';
    if (product.images && product.images.length > 0) {
      image = typeof product.images[0] === 'string' ? product.images[0] : (product.images[0].src || image);
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id && item.variantId === variantId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        variantId: variantId,
        title: product.title,
        handle: product.handle,
        variantTitle: variantTitle,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        image: image,
        quantity: quantity,
        vendor: product.vendor || 'LUXE Atelier'
      });
    }

    saveCart(cart);

    const Notifications = getNotifications();
    if (Notifications) {
      Notifications.showToast(`Added "${product.title}" to your shopping bag.`, 'success');
    }

    // Auto-open mini cart
    toggleMiniCart(true);
  }

  /**
   * Remove an item from the cart
   * @param {string} productId
   * @param {string} variantId
   */
  function removeFromCart(productId, variantId) {
    let cart = getCart();
    cart = cart.filter(item => !(item.productId === productId && item.variantId === variantId));
    saveCart(cart);

    const Notifications = getNotifications();
    if (Notifications) {
      Notifications.showToast('Item removed from your shopping bag.', 'info');
    }
  }

  /**
   * Update item quantity
   * @param {string} productId
   * @param {string} variantId
   * @param {number} qty
   */
  function updateQuantity(productId, variantId, qty) {
    const quantity = parseInt(qty, 10);
    let cart = getCart();

    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    const item = cart.find(i => i.productId === productId && i.variantId === variantId);
    if (item) {
      item.quantity = quantity;
      saveCart(cart);
    }
  }

  /**
   * Total count of items in the cart
   * @returns {number}
   */
  function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  /**
   * Subtotal price of items in the cart
   * @returns {number}
   */
  function getCartSubtotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * Clear all items from cart
   */
  function clearCart() {
    saveCart([]);
  }

  /**
   * Update all cart badges and active views
   */
  function updateCartUI() {
    const count = getCartCount();

    // Update all badges
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.setAttribute('aria-label', `${count} items in shopping bag`);
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });

    // Update Mini Cart Drawer
    renderMiniCartItems();

    // Update Cart Page if active
    if (document.getElementById('cart-content') || document.getElementById('cart-page-view')) {
      renderCartPage();
    }
  }

  /**
   * Render items in the Mini-Cart Drawer
   */
  function renderMiniCartItems() {
    const container = document.getElementById('mini-cart-items');
    const subtotalEl = document.getElementById('mini-cart-subtotal');
    const shippingMsg = document.getElementById('shipping-bar-message');
    const progressFill = document.getElementById('shipping-progress-fill');
    const footerEl = document.getElementById('mini-cart-footer');
    const Utils = getUtils();

    if (!container) return;

    const cart = getCart();
    const subtotal = getCartSubtotal();

    // Update Subtotal Display
    if (subtotalEl) {
      subtotalEl.textContent = Utils.formatCurrency(subtotal);
    }

    // Update Free Shipping Progress Bar
    if (shippingMsg && progressFill) {
      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        shippingMsg.innerHTML = '🎉 You have unlocked <strong>Complimentary Express Shipping!</strong>';
        progressFill.style.width = '100%';
        progressFill.classList.add('shipping-bar__progress-fill--unlocked');
      } else {
        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
        const percent = Math.min(100, Math.max(0, (subtotal / FREE_SHIPPING_THRESHOLD) * 100));
        shippingMsg.innerHTML = `Add <strong>${Utils.formatCurrency(remaining)}</strong> more to unlock <strong>Complimentary Shipping</strong>`;
        progressFill.style.width = `${percent}%`;
        progressFill.classList.remove('shipping-bar__progress-fill--unlocked');
      }
    }

    // If Cart is Empty
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="mini-cart__empty">
          <div class="mini-cart__empty-icon">
            <i data-feather="shopping-bag" aria-hidden="true"></i>
          </div>
          <h4 class="mini-cart__empty-title">Your shopping bag is empty</h4>
          <p class="mini-cart__empty-text">Explore our collection of timeless silhouettes and artisan essentials.</p>
          <a href="products.html" class="btn btn--primary btn--small" onclick="LuxeStore.Cart.toggleMiniCart(false)">
            Explore Collection
          </a>
        </div>
      `;
      if (footerEl) footerEl.style.display = 'none';
      if (typeof feather !== 'undefined') feather.replace();
      return;
    }

    if (footerEl) footerEl.style.display = 'block';

    let html = '<ul class="mini-cart__list">';
    cart.forEach(item => {
      html += `
        <li class="mini-cart__item" data-product-id="${item.productId}" data-variant-id="${item.variantId}">
          <a href="product.html?id=${item.productId}" class="mini-cart__item-img-link">
            <img src="${item.image}" alt="${Utils.escapeHTML(item.title)}" class="mini-cart__item-img">
          </a>
          <div class="mini-cart__item-details">
            <h4 class="mini-cart__item-title">
              <a href="product.html?id=${item.productId}">${Utils.escapeHTML(item.title)}</a>
            </h4>
            ${item.variantTitle ? `<p class="mini-cart__item-variant">${Utils.escapeHTML(item.variantTitle)}</p>` : ''}
            <div class="mini-cart__item-price-row">
              <span class="mini-cart__item-price">${Utils.formatCurrency(item.price)}</span>
            </div>
            <div class="mini-cart__item-bottom">
              <div class="quantity-stepper quantity-stepper--small">
                <button type="button" class="quantity-btn quantity-btn--minus" data-action="decrease" aria-label="Decrease quantity">&minus;</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" aria-label="Quantity">
                <button type="button" class="quantity-btn quantity-btn--plus" data-action="increase" aria-label="Increase quantity">&plus;</button>
              </div>
              <button type="button" class="mini-cart__item-remove" data-action="remove" aria-label="Remove ${Utils.escapeHTML(item.title)}">
                <i data-feather="trash-2" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </li>
      `;
    });
    html += '</ul>';

    container.innerHTML = html;
    if (typeof feather !== 'undefined') feather.replace();
  }

  /**
   * Render dedicated Cart Page view
   */
  function renderCartPage() {
    const Utils = getUtils();
    const cart = getCart();
    const subtotal = getCartSubtotal();
    const coupon = getCoupon();

    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingAmount = isFreeShipping || subtotal === 0 ? 0.00 : STANDARD_SHIPPING_COST;
    const discountAmount = coupon ? (subtotal * (coupon.discountPercent / 100)) : 0.00;
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const estimatedTax = taxableSubtotal * 0.08;
    const grandTotal = taxableSubtotal + shippingAmount + estimatedTax;

    // Handle cart.html layout
    const cartContent = document.getElementById('cart-content');
    const cartEmpty = document.getElementById('cart-empty');
    const cartItems = document.getElementById('cart-items');

    if (cartContent && cartEmpty) {
      if (cart.length === 0) {
        cartContent.style.display = 'none';
        cartEmpty.style.display = 'block';
        if (typeof feather !== 'undefined') feather.replace();
        return;
      }

      cartContent.style.display = 'grid';
      cartEmpty.style.display = 'none';

      if (cartItems) {
        let itemsHtml = `
          <div class="cart-table-wrap">
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
        `;

        cart.forEach(item => {
          const itemTotal = Utils.formatCurrency(item.price * item.quantity);
          itemsHtml += `
            <tr class="cart-table__row" data-product-id="${item.productId}" data-variant-id="${item.variantId}">
              <td>
                <div class="cart-item">
                  <a href="product.html?id=${item.productId}">
                    <img src="${item.image}" alt="${Utils.escapeHTML(item.title)}" class="cart-item__image">
                  </a>
                  <div class="cart-item__details">
                    <a href="product.html?id=${item.productId}" class="cart-item__title">${Utils.escapeHTML(item.title)}</a>
                    ${item.variantTitle ? `<span class="cart-item__variant">${Utils.escapeHTML(item.variantTitle)}</span>` : ''}
                    <button type="button" class="cart-item__remove-mobile" data-action="remove">Remove</button>
                  </div>
                </div>
              </td>
              <td class="cart-price-cell">${Utils.formatCurrency(item.price)}</td>
              <td>
                <div class="quantity-stepper quantity-stepper--small">
                  <button type="button" class="quantity-btn quantity-btn--minus" data-action="decrease" aria-label="Decrease quantity">&minus;</button>
                  <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" aria-label="Item quantity">
                  <button type="button" class="quantity-btn quantity-btn--plus" data-action="increase" aria-label="Increase quantity">&plus;</button>
                </div>
              </td>
              <td class="cart-total-cell">${itemTotal}</td>
              <td>
                <button type="button" class="cart-remove-btn" data-action="remove" aria-label="Remove item">
                  <i data-feather="trash-2" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          `;
        });

        itemsHtml += `
              </tbody>
            </table>
          </div>
          <div class="cart-actions">
            <a href="products.html" class="btn btn--outline btn--sm">
              <i data-feather="arrow-left" aria-hidden="true"></i> Continue Shopping
            </a>
            <button type="button" class="btn btn--secondary btn--sm" id="cart-clear-btn">Clear Bag</button>
          </div>
        `;

        cartItems.innerHTML = itemsHtml;
      }

      // Update Summary Fields
      const subtotalEl = document.getElementById('cart-subtotal');
      const shippingEl = document.getElementById('cart-shipping-est');
      const discountRow = document.getElementById('cart-discount-row');
      const discountVal = document.getElementById('cart-discount');
      const totalEl = document.getElementById('cart-total');
      const couponInput = document.getElementById('coupon-input');

      if (subtotalEl) subtotalEl.textContent = Utils.formatCurrency(subtotal);
      if (shippingEl) shippingEl.textContent = isFreeShipping ? 'Complimentary' : Utils.formatCurrency(shippingAmount);

      if (discountRow && discountVal) {
        if (coupon && discountAmount > 0) {
          discountRow.style.display = 'flex';
          discountVal.innerHTML = `-${Utils.formatCurrency(discountAmount)} <span style="font-size:12px;opacity:0.8;">(${coupon.code})</span> <button type="button" id="cart-coupon-remove-btn" style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;margin-left:4px;" title="Remove coupon">&times;</button>`;
        } else {
          discountRow.style.display = 'none';
        }
      }

      if (couponInput && coupon) {
        couponInput.value = coupon.code;
      }

      if (totalEl) totalEl.textContent = Utils.formatCurrency(grandTotal);

      // Restore notes if any
      const notesInput = document.getElementById('cart-notes-input');
      if (notesInput) {
        const savedNotes = sessionStorage.getItem(NOTES_KEY);
        if (savedNotes) notesInput.value = savedNotes;
      }
    }

    if (typeof feather !== 'undefined') feather.replace();
  }

  /**
   * Toggle Mini-Cart drawer open or closed
   * @param {boolean|null} forceOpen
   */
  function toggleMiniCart(forceOpen = null) {
    const drawer = document.getElementById('mini-cart-drawer');
    const overlay = document.getElementById('site-overlay');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('mini-cart-drawer--open');
    const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;

    if (shouldOpen) {
      drawer.classList.add('mini-cart-drawer--open');
      drawer.setAttribute('aria-hidden', 'false');
      if (overlay) overlay.classList.add('site-overlay--visible');
      document.body.classList.add('body-lock');
      renderMiniCartItems();
    } else {
      drawer.classList.remove('mini-cart-drawer--open');
      drawer.setAttribute('aria-hidden', 'true');
      if (overlay) overlay.classList.remove('site-overlay--visible');
      document.body.classList.remove('body-lock');
    }
  }

  /**
   * Attach event listeners
   */
  function init() {
    updateCartUI();

    // Toggle mini-cart button
    document.addEventListener('click', function (e) {
      const openTrigger = e.target.closest('#mini-cart-open-btn');
      if (openTrigger) {
        e.preventDefault();
        toggleMiniCart(true);
        return;
      }

      const closeTrigger = e.target.closest('#mini-cart-close-btn');
      if (closeTrigger) {
        e.preventDefault();
        toggleMiniCart(false);
        return;
      }

      // Quantity buttons (+ / -) in Mini Cart or Cart Page
      const stepperBtn = e.target.closest('.quantity-btn');
      if (stepperBtn) {
        const itemRow = stepperBtn.closest('[data-product-id]');
        if (!itemRow) return;
        const productId = itemRow.dataset.productId;
        const variantId = itemRow.dataset.variantId;
        const input = itemRow.querySelector('.quantity-input');
        if (!input) return;

        let val = parseInt(input.value, 10) || 1;
        const action = stepperBtn.dataset.action;

        if (action === 'increase') {
          val += 1;
        } else if (action === 'decrease') {
          val = Math.max(0, val - 1);
        }

        input.value = val;
        updateQuantity(productId, variantId, val);
        return;
      }

      // Remove button in Mini Cart or Cart Page
      const removeBtn = e.target.closest('[data-action="remove"]');
      if (removeBtn) {
        const itemRow = removeBtn.closest('[data-product-id]');
        if (itemRow) {
          const productId = itemRow.dataset.productId;
          const variantId = itemRow.dataset.variantId;
          removeFromCart(productId, variantId);
        }
        return;
      }

      // Clear cart button
      if (e.target.closest('#cart-clear-btn')) {
        if (confirm('Are you sure you want to clear your shopping bag?')) {
          clearCart();
        }
        return;
      }

      // Apply coupon in cart page
      if (e.target.closest('#apply-coupon') || e.target.closest('#cart-coupon-apply-btn')) {
        const couponInput = document.getElementById('coupon-input') || document.getElementById('cart-coupon-input');
        if (couponInput) {
          applyCoupon(couponInput.value);
        }
        return;
      }

      // Remove coupon button
      if (e.target.closest('#cart-coupon-remove-btn')) {
        removeCoupon();
        const couponInput = document.getElementById('coupon-input') || document.getElementById('cart-coupon-input');
        if (couponInput) couponInput.value = '';
        return;
      }
    });

    // Enter key inside coupon input
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.target.id === 'coupon-input' || e.target.id === 'cart-coupon-input')) {
        e.preventDefault();
        applyCoupon(e.target.value);
      }
    });

    // Direct quantity input change
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('quantity-input')) {
        const itemRow = e.target.closest('[data-product-id]');
        if (!itemRow) return;
        const productId = itemRow.dataset.productId;
        const variantId = itemRow.dataset.variantId;
        const val = parseInt(e.target.value, 10) || 1;
        updateQuantity(productId, variantId, Math.max(1, val));
      }

      // Order notes autosave
      if (e.target.id === 'cart-notes-input') {
        try {
          sessionStorage.setItem(NOTES_KEY, e.target.value);
        } catch (err) {}
      }
    });
  }

  return {
    getCart,
    saveCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartCount,
    getCartSubtotal,
    getCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    updateCartUI,
    renderMiniCartItems,
    renderCartPage,
    toggleMiniCart,
    init
  };
})();
