/**
 * LUXE STORE - Quick View Modal Controller
 * Attaches to window.LuxeStore.QuickView
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.QuickView = (function () {
  'use strict';

  const Utils = window.LuxeStore.Utils;
  let activeProduct = null;
  let selectedOptions = { option1: null, option2: null };

  /**
   * Open the Quick View modal for a given product ID
   * @param {string|number} productId
   */
  async function open(productId) {
    const modal = document.getElementById('quick-view-modal');
    const body = document.getElementById('quick-view-body');
    const overlay = document.getElementById('site-overlay');
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="quick-view-loading">
        <span class="loading-spinner"></span>
        <p>Loading details...</p>
      </div>
    `;

    modal.classList.add('modal--open');
    modal.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('site-overlay--visible');
    document.body.classList.add('body-lock');

    try {
      const product = await window.LuxeStore.Data.getProductById(productId);
      if (!product) {
        body.innerHTML = '<p class="text-danger p-4">Product details not found.</p>';
        return;
      }

      activeProduct = product;
      // Default selections to first variant
      const firstVariant = (product.variants && product.variants[0]) ? product.variants[0] : null;
      selectedOptions.option1 = firstVariant ? firstVariant.option1 : null;
      selectedOptions.option2 = firstVariant ? firstVariant.option2 : null;

      body.innerHTML = renderContent(product);
      attachModalEvents(body);

      if (typeof feather !== 'undefined') feather.replace();
    } catch (err) {
      console.error('[LuxeStore.QuickView] Error opening quick view', err);
      body.innerHTML = '<p class="text-danger p-4">Failed to load product preview.</p>';
    }
  }

  /**
   * Close the Quick View modal
   */
  function close() {
    const modal = document.getElementById('quick-view-modal');
    const overlay = document.getElementById('site-overlay');
    if (!modal) return;

    modal.classList.remove('modal--open');
    modal.setAttribute('aria-hidden', 'true');
    if (overlay && !document.getElementById('mini-cart-drawer')?.classList.contains('mini-cart-drawer--open') &&
        !document.getElementById('mobile-menu-drawer')?.classList.contains('mobile-drawer--open')) {
      overlay.classList.remove('site-overlay--visible');
      document.body.classList.remove('body-lock');
    }
    activeProduct = null;
  }

  /**
   * Find variant corresponding to current selected options
   */
  function getSelectedVariant() {
    if (!activeProduct || !activeProduct.variants) return null;
    return activeProduct.variants.find(v => {
      const opt1Match = !selectedOptions.option1 || v.option1 === selectedOptions.option1;
      const opt2Match = !selectedOptions.option2 || v.option2 === selectedOptions.option2;
      return opt1Match && opt2Match;
    }) || activeProduct.variants[0];
  }

  /**
   * Render HTML for the quick view inner content
   * @param {Object} product
   * @returns {string} HTML markup
   */
  function renderContent(product) {
    const currentVariant = getSelectedVariant();
    const price = currentVariant ? currentVariant.price : product.price;
    const compareAtPrice = currentVariant ? currentVariant.compareAtPrice : product.compareAtPrice;
    const isOnSale = compareAtPrice && compareAtPrice > price;

    const images = (product.images && product.images.length > 0) ? product.images : ['https://picsum.photos/seed/placeholder/600/800'];
    const mainImg = images[0];

    // Thumbnail navigation list
    let thumbsHtml = '';
    if (images.length > 1) {
      thumbsHtml = '<div class="quick-view__thumbs">';
      images.forEach((imgUrl, idx) => {
        const active = idx === 0 ? 'quick-view__thumb--active' : '';
        thumbsHtml += `
          <button type="button" class="quick-view__thumb ${active}" data-img-src="${imgUrl}">
            <img src="${imgUrl}" alt="Thumbnail ${idx + 1}">
          </button>
        `;
      });
      thumbsHtml += '</div>';
    }

    // Color options
    const colorOpt = (product.options || []).find(o => o.name.toLowerCase() === 'color');
    let colorSelectorHtml = '';
    if (colorOpt) {
      colorSelectorHtml = `
        <div class="variant-option-group">
          <label class="variant-option-group__label">
            Color: <span class="variant-option-group__val" id="qv-selected-color">${selectedOptions.option1 || colorOpt.values[0]}</span>
          </label>
          <div class="variant-swatches">
      `;
      colorOpt.values.forEach((val) => {
        const isSelected = (selectedOptions.option1 === val) || (!selectedOptions.option1 && val === colorOpt.values[0]);
        const colorHex = typeof Utils.colorNameToHex === 'function' ? Utils.colorNameToHex(val) : '#C9A96E';
        colorSelectorHtml += `
          <button 
            type="button" 
            class="swatch-btn ${isSelected ? 'swatch-btn--active' : ''}" 
            data-option-pos="1" 
            data-option-val="${Utils.escapeHTML(val)}" 
            aria-pressed="${isSelected}"
            style="--swatch-color: ${colorHex};"
            title="${Utils.escapeHTML(val)}"
          >
            ${Utils.escapeHTML(val)}
          </button>
        `;
      });
      colorSelectorHtml += `</div></div>`;
    }

    // Size options
    const sizeOpt = (product.options || []).find(o => o.name.toLowerCase() === 'size');
    let sizeSelectorHtml = '';
    if (sizeOpt) {
      sizeSelectorHtml = `
        <div class="variant-option-group">
          <label class="variant-option-group__label">
            Size: <span class="variant-option-group__val" id="qv-selected-size">${selectedOptions.option2 || sizeOpt.values[0]}</span>
          </label>
          <div class="size-pills">
      `;
      sizeOpt.values.forEach((val) => {
        const isSelected = (selectedOptions.option2 === val) || (!selectedOptions.option2 && val === sizeOpt.values[0]);
        sizeSelectorHtml += `
          <button 
            type="button" 
            class="size-pill ${isSelected ? 'size-pill--active' : ''}" 
            data-option-pos="2" 
            data-option-val="${Utils.escapeHTML(val)}"
            aria-pressed="${isSelected}"
          >
            ${Utils.escapeHTML(val)}
          </button>
        `;
      });
      sizeSelectorHtml += `</div></div>`;
    }

    return `
      <div class="quick-view__grid">
        <!-- Gallery Column -->
        <div class="quick-view__gallery">
          <div class="quick-view__main-img-wrap">
            <img src="${mainImg}" alt="${Utils.escapeHTML(product.title)}" id="qv-main-img" class="quick-view__main-img">
          </div>
          ${thumbsHtml}
        </div>

        <!-- Details Column -->
        <div class="quick-view__details">
          <span class="quick-view__vendor">${Utils.escapeHTML(product.vendor || 'LUXE')}</span>
          <h2 class="quick-view__title">${Utils.escapeHTML(product.title)}</h2>

          <div class="quick-view__rating">
            ${Utils.generateStarHTML(product.rating)}
            <span class="quick-view__review-count">(${product.reviewCount || 0} client reviews)</span>
          </div>

          <div class="quick-view__price-wrap" id="qv-price-wrap">
            <span class="quick-view__price ${isOnSale ? 'quick-view__price--sale' : ''}">
              ${Utils.formatCurrency(price)}
            </span>
            ${isOnSale ? `<span class="quick-view__compare-price">${Utils.formatCurrency(compareAtPrice)}</span>` : ''}
          </div>

          <p class="quick-view__description">
            ${Utils.truncateText(product.description, 180)}
          </p>

          <!-- Variant Selectors -->
          ${colorSelectorHtml}
          ${sizeSelectorHtml}

          <!-- Quantity Stepper & Add to Cart -->
          <div class="quick-view__actions">
            <div class="quantity-stepper">
              <button type="button" class="quantity-btn" id="qv-qty-minus">&minus;</button>
              <input type="number" id="qv-qty-input" class="quantity-input" value="1" min="1" max="99">
              <button type="button" class="quantity-btn" id="qv-qty-plus">&plus;</button>
            </div>
            <button type="button" class="btn btn--primary btn--full" id="qv-add-to-cart-btn">
              <i data-feather="shopping-bag" aria-hidden="true"></i>
              <span>Add to Bag</span>
            </button>
          </div>

          <div class="quick-view__footer-link">
            <a href="product.html?id=${product.id}">View full specifications and client reviews &rarr;</a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach interactive listeners inside Quick View modal
   * @param {HTMLElement} body
   */
  function attachModalEvents(body) {
    // Thumbnail switching
    body.querySelectorAll('.quick-view__thumb').forEach(btn => {
      btn.addEventListener('click', function () {
        const src = this.dataset.imgSrc;
        const mainImg = body.querySelector('#qv-main-img');
        if (mainImg && src) {
          mainImg.src = src;
        }
        body.querySelectorAll('.quick-view__thumb').forEach(b => b.classList.remove('quick-view__thumb--active'));
        this.classList.add('quick-view__thumb--active');
      });
    });

    // Swatch selection (Color)
    body.querySelectorAll('[data-option-pos="1"]').forEach(btn => {
      btn.addEventListener('click', function () {
        body.querySelectorAll('[data-option-pos="1"]').forEach(b => {
          b.classList.remove('swatch-btn--active');
          b.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('swatch-btn--active');
        this.setAttribute('aria-pressed', 'true');
        selectedOptions.option1 = this.dataset.optionVal;
        const colorLabel = body.querySelector('#qv-selected-color');
        if (colorLabel) colorLabel.textContent = selectedOptions.option1;
        updateVariantState(body);
      });
    });

    // Size selection (Size)
    body.querySelectorAll('[data-option-pos="2"]').forEach(btn => {
      btn.addEventListener('click', function () {
        body.querySelectorAll('[data-option-pos="2"]').forEach(b => {
          b.classList.remove('size-pill--active');
          b.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('size-pill--active');
        this.setAttribute('aria-pressed', 'true');
        selectedOptions.option2 = this.dataset.optionVal;
        const sizeLabel = body.querySelector('#qv-selected-size');
        if (sizeLabel) sizeLabel.textContent = selectedOptions.option2;
        updateVariantState(body);
      });
    });

    // Quantity buttons
    const qtyInput = body.querySelector('#qv-qty-input');
    const minusBtn = body.querySelector('#qv-qty-minus');
    const plusBtn = body.querySelector('#qv-qty-plus');

    if (minusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        let v = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = Math.max(1, v - 1);
      });
    }

    if (plusBtn && qtyInput) {
      plusBtn.addEventListener('click', () => {
        let v = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = v + 1;
      });
    }

    // Add to Bag Button
    const addBtn = body.querySelector('#qv-add-to-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const variant = getSelectedVariant();
        const qty = parseInt(qtyInput.value, 10) || 1;
        if (window.LuxeStore.Cart && activeProduct) {
          window.LuxeStore.Cart.addToCart(activeProduct, variant, qty);
          close();
        }
      });
    }
  }

  /**
   * Refresh price & stock state when options change
   * @param {HTMLElement} body
   */
  function updateVariantState(body) {
    const variant = getSelectedVariant();
    const priceWrap = body.querySelector('#qv-price-wrap');
    if (!variant || !priceWrap) return;

    const isOnSale = variant.compareAtPrice && variant.compareAtPrice > variant.price;
    priceWrap.innerHTML = `
      <span class="quick-view__price ${isOnSale ? 'quick-view__price--sale' : ''}">
        ${Utils.formatCurrency(variant.price)}
      </span>
      ${isOnSale ? `<span class="quick-view__compare-price">${Utils.formatCurrency(variant.compareAtPrice)}</span>` : ''}
    `;

    const addBtn = body.querySelector('#qv-add-to-cart-btn');
    if (addBtn) {
      if (!variant.available) {
        addBtn.disabled = true;
        addBtn.innerHTML = '<span>Sold Out</span>';
      } else {
        addBtn.disabled = false;
        addBtn.innerHTML = '<i data-feather="shopping-bag"></i> <span>Add to Bag</span>';
        if (typeof feather !== 'undefined') feather.replace();
      }
    }
  }

  /**
   * Initialize delegated clicks for quick view trigger
   */
  function init() {
    document.addEventListener('click', function (e) {
      const qvBtn = e.target.closest('[data-action="quick-view"]');
      if (qvBtn) {
        e.preventDefault();
        e.stopPropagation();
        const productId = qvBtn.dataset.productId;
        if (productId) {
          open(productId);
        }
        return;
      }

      // Close button inside modal
      if (e.target.closest('#quick-view-close-btn')) {
        e.preventDefault();
        close();
      }
    });
  }

  return {
    open,
    close,
    renderContent,
    init
  };
})();
