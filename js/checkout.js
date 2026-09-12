/**
 * LUXE STORE - Multi-Step Checkout Controller
 * Attaches to window.LuxeStore.Checkout
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Checkout = (function () {
  'use strict';

  const getCart = () => window.LuxeStore.Cart;
  const getUtils = () => window.LuxeStore.Utils || {
    formatCurrency: v => '$' + Number(v || 0).toFixed(2),
    escapeHTML: s => s
  };
  const getNotifications = () => window.LuxeStore.Notifications;

  let _currentStep = 1;
  let _shippingCost = 0.00;
  const _taxRate = 0.08;

  function getAppliedCoupon() {
    try {
      const data = localStorage.getItem('luxe_coupon');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function init() {
    const Cart = getCart();
    if (!Cart) return;

    const cartItems = Cart.getCart();
    if (cartItems.length === 0) {
      renderEmptyCheckout();
      return;
    }

    renderOrderSummary();
    setupStepNavigation();
    setupShippingRadioListeners();
    setupFormValidation();
    setupCouponBox();

    if (typeof feather !== 'undefined') feather.replace();
  }

  function renderEmptyCheckout() {
    const layout = document.querySelector('.checkout-layout');
    if (layout) {
      layout.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <i data-feather="shopping-bag" style="width: 64px; height: 64px; color: var(--color-text-muted); margin-bottom: 1.5rem;"></i>
          <h2>Your Cart is Empty</h2>
          <p style="color: var(--color-text-secondary); margin: 1rem 0 2rem;">Please add items to your cart before proceeding to checkout.</p>
          <a href="products.html" class="btn btn--primary btn--lg">Return to Shop</a>
        </div>
      `;
      if (typeof feather !== 'undefined') feather.replace();
    }
  }

  function renderOrderSummary() {
    const Cart = getCart();
    const Utils = getUtils();
    const container = document.getElementById('checkout-items');
    const subtotalElem = document.getElementById('checkout-subtotal');
    const shippingElem = document.getElementById('checkout-shipping');
    const taxesElem = document.getElementById('checkout-taxes');
    const totalElem = document.getElementById('checkout-total');

    if (!container || !Cart) return;

    const items = Cart.getCart();
    const subtotal = Cart.getCartSubtotal();
    const coupon = getAppliedCoupon();
    const discount = coupon ? (subtotal * (coupon.discountPercent / 100)) : 0;
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const taxes = taxableSubtotal * _taxRate;
    const total = taxableSubtotal + _shippingCost + taxes;

    container.innerHTML = items.map(item => `
      <div class="order-summary__item">
        <div class="order-summary__item-image">
          <img src="${item.image}" alt="${Utils.escapeHTML(item.title)}">
          <span class="order-summary__item-qty">${item.quantity}</span>
        </div>
        <div class="order-summary__item-info">
          <h4 class="order-summary__item-title">${Utils.escapeHTML(item.title)}</h4>
          ${item.variantTitle ? `<p class="order-summary__item-variant">${Utils.escapeHTML(item.variantTitle)}</p>` : ''}
          <span class="order-summary__item-price">${Utils.formatCurrency(item.price * item.quantity)}</span>
        </div>
      </div>
    `).join('');

    if (subtotalElem) subtotalElem.textContent = Utils.formatCurrency(subtotal);

    // Dynamic Discount Row
    let discountRow = document.getElementById('checkout-discount-row');
    if (coupon && discount > 0) {
      if (!discountRow && subtotalElem) {
        discountRow = document.createElement('div');
        discountRow.id = 'checkout-discount-row';
        discountRow.className = 'order-summary__row';
        discountRow.style.color = 'var(--color-success, #28a745)';
        subtotalElem.parentElement.insertAdjacentElement('afterend', discountRow);
      }
      if (discountRow) {
        discountRow.style.display = 'flex';
        discountRow.innerHTML = `<span>Discount (${coupon.code})</span><span>-${Utils.formatCurrency(discount)}</span>`;
      }
    } else if (discountRow) {
      discountRow.style.display = 'none';
    }

    if (shippingElem) shippingElem.textContent = _shippingCost === 0 ? 'Free' : Utils.formatCurrency(_shippingCost);
    if (taxesElem) taxesElem.textContent = Utils.formatCurrency(taxes);
    if (totalElem) totalElem.textContent = Utils.formatCurrency(total);
  }

  function setupCouponBox() {
    const summaryCard = document.querySelector('.order-summary');
    if (!summaryCard || document.getElementById('checkout-coupon-form')) return;

    const divider = summaryCard.querySelector('.order-summary__divider');
    if (divider) {
      const formWrap = document.createElement('div');
      formWrap.id = 'checkout-coupon-form';
      formWrap.style.margin = '1rem 0';
      formWrap.innerHTML = `
        <div style="display: flex; gap: 8px;">
          <input type="text" id="checkout-coupon-input" class="form-input" placeholder="Promo code (LUXE10)" style="flex:1; padding: 8px 12px; font-size: 13px;">
          <button type="button" id="checkout-coupon-btn" class="btn btn--secondary btn--sm" style="padding: 8px 14px;">Apply</button>
        </div>
      `;
      divider.insertAdjacentElement('beforebegin', formWrap);

      const applyBtn = document.getElementById('checkout-coupon-btn');
      const input = document.getElementById('checkout-coupon-input');

      const handleApply = () => {
        const val = (input.value || '').trim().toUpperCase();
        const Notifications = getNotifications();
        if (val === 'LUXE10') {
          try {
            localStorage.setItem('luxe_coupon', JSON.stringify({ code: 'LUXE10', discountPercent: 10 }));
          } catch (e) {}
          if (Notifications) Notifications.showToast('Coupon LUXE10 applied! 10% discount added.', 'success');
          renderOrderSummary();
        } else {
          if (Notifications) Notifications.showToast('Invalid promo code. Try LUXE10.', 'error');
        }
      };

      if (applyBtn) applyBtn.addEventListener('click', handleApply);
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
          }
        });
      }
    }
  }

  function setupShippingRadioListeners() {
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
      radio.addEventListener('change', function () {
        document.querySelectorAll('.shipping-method').forEach(m => m.classList.remove('shipping-method--selected'));
        const parentMethod = this.closest('.shipping-method');
        if (parentMethod) parentMethod.classList.add('shipping-method--selected');

        _shippingCost = parseFloat(this.dataset.price) || 0.00;
        renderOrderSummary();
      });
    });
  }

  function setupStepNavigation() {
    const nextBtn = document.getElementById('checkout-next');
    const backBtn = document.getElementById('checkout-back');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (validateCurrentStep(_currentStep)) {
          if (_currentStep < 3) {
            goToStep(_currentStep + 1);
          } else {
            handlePlaceOrder();
          }
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (_currentStep > 1) {
          goToStep(_currentStep - 1);
        }
      });
    }
  }

  function goToStep(stepNumber) {
    _currentStep = stepNumber;

    const step1 = document.getElementById('checkout-step-1');
    const step2 = document.getElementById('checkout-step-2');
    const step3 = document.getElementById('checkout-step-3');

    if (step1) step1.style.display = _currentStep === 1 ? 'block' : 'none';
    if (step2) step2.style.display = _currentStep === 2 ? 'block' : 'none';
    if (step3) step3.style.display = _currentStep === 3 ? 'block' : 'none';

    document.querySelectorAll('.checkout-step').forEach(stepEl => {
      const stepIdx = parseInt(stepEl.dataset.step, 10);
      stepEl.classList.remove('checkout-step--active', 'checkout-step--completed');
      if (stepIdx === _currentStep) {
        stepEl.classList.add('checkout-step--active');
      } else if (stepIdx < _currentStep) {
        stepEl.classList.add('checkout-step--completed');
      }
    });

    const nextBtn = document.getElementById('checkout-next');
    const backBtn = document.getElementById('checkout-back');

    if (backBtn) backBtn.style.display = _currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) {
      if (_currentStep === 1) nextBtn.textContent = 'Continue to Shipping';
      else if (_currentStep === 2) nextBtn.textContent = 'Continue to Payment';
      else if (_currentStep === 3) nextBtn.textContent = 'Place Order';
    }

    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  function validateCurrentStep(step) {
    let isValid = true;

    if (step === 1) {
      const email = document.getElementById('checkout-email');
      const phone = document.getElementById('checkout-phone');

      if (!email || !email.value.trim() || !/\S+@\S+\.\S+/.test(email.value)) {
        showError('error-email', 'Please enter a valid email address');
        isValid = false;
      } else {
        clearError('error-email');
      }

      if (!phone || !phone.value.trim()) {
        showError('error-phone', 'Please enter a valid phone number');
        isValid = false;
      } else {
        clearError('error-phone');
      }
    } else if (step === 2) {
      const required = [
        { id: 'ship-first', errorId: 'error-first', msg: 'First name is required' },
        { id: 'ship-last', errorId: 'error-last', msg: 'Last name is required' },
        { id: 'ship-address', errorId: 'error-address', msg: 'Street address is required' },
        { id: 'ship-city', errorId: 'error-city', msg: 'City is required' },
        { id: 'ship-state', errorId: 'error-state', msg: 'State is required' },
        { id: 'ship-zip', errorId: 'error-zip', msg: 'ZIP code is required' }
      ];

      required.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input || !input.value.trim()) {
          showError(field.errorId, field.msg);
          isValid = false;
        } else {
          clearError(field.errorId);
        }
      });
    } else if (step === 3) {
      const cardNum = document.getElementById('card-number');
      const expiry = document.getElementById('card-expiry');
      const cvv = document.getElementById('card-cvv');
      const cardName = document.getElementById('card-name');

      if (!cardNum || cardNum.value.replace(/\s/g, '').length < 15) {
        showError('error-card', 'Please enter a valid 16-digit card number');
        isValid = false;
      } else {
        clearError('error-card');
      }

      if (!expiry || !/^\d{2}\s?\/\s?\d{2}$/.test(expiry.value.trim())) {
        showError('error-expiry', 'Use format MM / YY');
        isValid = false;
      } else {
        clearError('error-expiry');
      }

      if (!cvv || cvv.value.trim().length < 3) {
        showError('error-cvv', 'CVV required');
        isValid = false;
      } else {
        clearError('error-cvv');
      }

      if (!cardName || !cardName.value.trim()) {
        showError('error-cardname', 'Cardholder name is required');
        isValid = false;
      } else {
        clearError('error-cardname');
      }
    }

    return isValid;
  }

  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = message;
  }

  function clearError(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = '';
  }

  function setupFormValidation() {
    const cardInput = document.getElementById('card-number');
    if (cardInput) {
      cardInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        e.target.value = formatted;
      });
    }

    const expiryInput = document.getElementById('card-expiry');
    if (expiryInput) {
      expiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
          e.target.value = `${val.substring(0, 2)} / ${val.substring(2)}`;
        } else {
          e.target.value = val;
        }
      });
    }
  }

  function handlePlaceOrder() {
    const Cart = getCart();
    const orderNum = 'LUXE-' + Math.floor(10000 + Math.random() * 90000);
    const modal = document.getElementById('success-modal');
    const orderNumElem = document.getElementById('success-order-number');

    if (orderNumElem) orderNumElem.textContent = `Order #${orderNum}`;
    if (modal) modal.classList.add('modal--open');

    if (Cart) Cart.clearCart();
    try {
      localStorage.removeItem('luxe_coupon');
      sessionStorage.removeItem('luxe_order_notes');
    } catch (e) {}

    if (typeof feather !== 'undefined') feather.replace();
  }

  return { init };
})();
