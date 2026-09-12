/**
 * LUXE STORE - Product Detail Page Controller
 * Attaches to window.LuxeStore.ProductDetail
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.ProductDetail = (function () {
  'use strict';

  const getData = () => window.LuxeStore.Data;
  const getComponents = () => window.LuxeStore.Components;
  const getCart = () => window.LuxeStore.Cart;
  const getWishlist = () => window.LuxeStore.Wishlist;
  const getUtils = () => window.LuxeStore.Utils;
  const getNotifications = () => window.LuxeStore.Notifications;

  let _product = null;
  let _selectedOptions = {};
  let _selectedVariant = null;
  let _quantity = 1;

  function getImgSrc(img) {
    if (!img) return 'https://picsum.photos/seed/placeholder/600/800';
    if (typeof img === 'string') return img;
    if (img.src) return img.src;
    return 'https://picsum.photos/seed/placeholder/600/800';
  }

  async function init() {
    try {
      const Data = getData();
      if (!Data) {
        console.error('[LuxeStore.ProductDetail] Data module not available');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      let productId = urlParams.get('id');

      if (!productId) {
        const all = await Data.getProducts();
        if (all.length > 0) productId = all[0].id;
      }

      _product = await Data.getProductById(productId);
      if (!_product) {
        console.error('[LuxeStore.ProductDetail] Product not found:', productId);
        return;
      }

      document.title = `${_product.title} | LUXE STORE`;

      renderBreadcrumb();
      renderGallery();
      renderProductInfo();
      renderVariantSelectors();
      setupQuantityControls();
      setupActionButtons();
      setupStickyAddToCartObserver();
      setupSizeGuide();
      setupTabs();
      await renderReviews();
      await renderRelatedProducts();
      trackAndRenderRecentlyViewed(_product.id);

      if (typeof feather !== 'undefined') feather.replace();

    } catch (err) {
      console.error('[LuxeStore.ProductDetail] Initialization failed:', err);
    }
  }

  function renderBreadcrumb() {
    const container = document.getElementById('product-breadcrumb');
    const Components = getComponents();
    if (!container || !Components || !Components.renderBreadcrumb) return;

    container.innerHTML = Components.renderBreadcrumb([
      { label: 'Shop', url: 'products.html' },
      { label: _product.type || 'Clothing', url: `products.html?category=${encodeURIComponent(_product.type || '')}` },
      { label: _product.title }
    ]);
  }

  function renderGallery() {
    const mainImg = document.getElementById('product-main-image');
    const thumbs = document.getElementById('product-thumbs');
    if (!mainImg || !thumbs || !_product.images || _product.images.length === 0) return;

    const images = _product.images;
    const firstImgSrc = getImgSrc(images[0]);

    mainImg.src = firstImgSrc;
    mainImg.alt = _product.title;
    mainImg.setAttribute('data-zoom', firstImgSrc);

    thumbs.innerHTML = images.map((img, i) => {
      const src = getImgSrc(img);
      return `
        <button type="button" class="product-gallery__thumb ${i === 0 ? 'active' : ''}" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" data-thumb-index="${i}" aria-label="View image ${i + 1}">
          <img src="${src}" alt="${_product.title} image ${i + 1}" loading="lazy">
        </button>
      `;
    }).join('');

    thumbs.querySelectorAll('.product-gallery__thumb').forEach(thumb => {
      thumb.addEventListener('click', function () {
        thumbs.querySelectorAll('.product-gallery__thumb').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');

        const idx = parseInt(this.dataset.thumbIndex, 10);
        if (images[idx]) {
          const selectedSrc = getImgSrc(images[idx]);
          mainImg.src = selectedSrc;
          mainImg.setAttribute('data-zoom', selectedSrc);
        }
      });
    });

    // Lightbox triggers
    mainImg.addEventListener('click', () => {
      openLightbox(mainImg.src);
    });

    const zoomTrigger = document.getElementById('lightbox-open-btn');
    if (zoomTrigger) {
      zoomTrigger.addEventListener('click', () => {
        openLightbox(mainImg.src);
      });
    }

    setupLightboxModal(images);
  }

  function setupLightboxModal(images) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (!lightbox || !lightboxImg) return;

    let currentIdx = 0;

    function showImage(idx) {
      currentIdx = (idx + images.length) % images.length;
      lightboxImg.src = getImgSrc(images[currentIdx]);
    }

    function closeLightbox() {
      lightbox.setAttribute('hidden', '');
      lightbox.classList.remove('lightbox--active', 'is-open');
      document.body.classList.remove('body-lock');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIdx + 1); });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !lightbox.hasAttribute('hidden')) {
        closeLightbox();
      }
    });
  }

  function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightbox.removeAttribute('hidden');
      lightbox.classList.add('lightbox--active', 'is-open');
      document.body.classList.add('body-lock');
    }
  }

  function renderProductInfo() {
    const Utils = getUtils();
    const vendorElem = document.getElementById('product-vendor');
    const titleElem = document.getElementById('product-title');
    const priceContainer = document.getElementById('product-price');
    const currentPriceElem = document.getElementById('current-price');
    const comparePriceElem = document.getElementById('compare-price');
    const saveBadgeElem = document.getElementById('save-badge');
    const ratingElem = document.getElementById('product-rating');
    const descElem = document.getElementById('product-description');
    const stickyPrice = document.getElementById('sticky-bar-price');
    const stickyTitle = document.getElementById('sticky-bar-title');
    const stickyImage = document.getElementById('sticky-bar-img');
    const catElem = document.getElementById('product-category');
    const tagsElem = document.getElementById('product-tags');

    if (vendorElem) vendorElem.textContent = _product.vendor || 'LUXE Atelier';
    if (titleElem) titleElem.textContent = _product.title;
    if (stickyTitle) stickyTitle.textContent = _product.title;
    if (stickyImage) {
      stickyImage.src = getImgSrc(_product.images && _product.images[0]);
      stickyImage.alt = `${_product.title} thumbnail`;
    }

    const formattedPrice = Utils ? Utils.formatCurrency(_product.price) : `$${_product.price.toFixed(2)}`;

    if (currentPriceElem) {
      currentPriceElem.textContent = formattedPrice;
    } else if (priceContainer) {
      let priceHtml = `<span class="product-info__current-price" id="current-price">${formattedPrice}</span>`;
      if (_product.compareAtPrice && _product.compareAtPrice > _product.price) {
        const formattedCompare = Utils ? Utils.formatCurrency(_product.compareAtPrice) : `$${_product.compareAtPrice.toFixed(2)}`;
        const discount = Math.round(((_product.compareAtPrice - _product.price) / _product.compareAtPrice) * 100);
        priceHtml += ` <span class="product-info__compare-price" id="compare-price">${formattedCompare}</span>`;
        priceHtml += ` <span class="product-info__save-badge badge badge--sale" id="save-badge">Save ${discount}%</span>`;
      }
      priceContainer.innerHTML = priceHtml;
    }

    if (_product.compareAtPrice && _product.compareAtPrice > _product.price) {
      const formattedCompare = Utils ? Utils.formatCurrency(_product.compareAtPrice) : `$${_product.compareAtPrice.toFixed(2)}`;
      const discount = Math.round(((_product.compareAtPrice - _product.price) / _product.compareAtPrice) * 100);
      if (comparePriceElem) {
        comparePriceElem.textContent = formattedCompare;
        comparePriceElem.style.display = 'inline';
      }
      if (saveBadgeElem) {
        saveBadgeElem.textContent = `Save ${discount}%`;
        saveBadgeElem.style.display = 'inline-block';
      }
    } else {
      if (comparePriceElem) comparePriceElem.style.display = 'none';
      if (saveBadgeElem) saveBadgeElem.style.display = 'none';
    }

    if (stickyPrice) {
      stickyPrice.innerHTML = `<span class="price--current">${formattedPrice}</span>`;
    }

    if (ratingElem) {
      const starFn = Utils ? (Utils.generateStarHTML || Utils.generateStarRating) : null;
      const starsHtml = starFn ? starFn(_product.rating || 5) : '★★★★★';
      ratingElem.innerHTML = `
        <div class="stars" aria-hidden="true">${starsHtml}</div>
        <a href="#tab-reviews" class="product-info__rating-count" id="product-review-link">
          <span class="rating-score">${(_product.rating || 4.9).toFixed(1)}</span> (${_product.reviewCount || 0} reviews)
        </a>
        <span class="product-info__stock-status ${_product.available ? 'in-stock' : 'out-of-stock'}">
          <span class="stock-dot"></span> ${_product.available ? 'In Stock &amp; Ready to Ship' : 'Out of Stock'}
        </span>
      `;
    }

    if (descElem) {
      descElem.innerHTML = _product.descriptionHtml || `<p>${Utils ? Utils.escapeHTML(_product.description) : _product.description}</p>`;
    }

    if (catElem && _product.type) {
      catElem.innerHTML = `<a href="products.html?category=${encodeURIComponent(_product.type)}">${Utils ? Utils.escapeHTML(_product.type) : _product.type}</a>`;
    }

    if (tagsElem && Array.isArray(_product.tags)) {
      tagsElem.textContent = _product.tags.join(', ');
    }

    const wishlistBtn = document.getElementById('wishlist-toggle');
    const Wishlist = getWishlist();
    if (wishlistBtn && Wishlist && Wishlist.isInWishlist(_product.id)) {
      wishlistBtn.classList.add('wishlist-btn--active');
    }
  }

  function renderVariantSelectors() {
    const container = document.getElementById('variant-selectors');
    if (!container || !_product.options || _product.options.length === 0) return;

    let html = '';
    _product.options.forEach((opt) => {
      const optName = opt.name;
      const values = opt.values || [];
      const defaultVal = values[0];
      _selectedOptions[optName] = defaultVal;

      html += `<div class="variant-group" data-option-name="${optName}">`;
      html += `  <div class="variant-group__header">`;
      html += `    <span class="variant-group__label">${optName}: <strong id="selected-${optName.toLowerCase()}">${defaultVal}</strong></span>`;
      if (optName.toLowerCase() === 'size') {
        html += `    <button type="button" class="size-guide-link" id="size-guide-trigger"><i data-feather="compass" aria-hidden="true"></i> Size Guide</button>`;
      }
      html += `  </div>`;

      if (optName.toLowerCase() === 'color') {
        html += `  <div class="color-options" role="radiogroup" aria-label="Select ${optName}">`;
        values.forEach((color, i) => {
          const hex = getColorHex(color);
          html += `    <button type="button" class="color-option-btn ${i === 0 ? 'active' : ''}" data-value="${color}" role="radio" aria-checked="${i === 0 ? 'true' : 'false'}" style="--swatch-val: ${hex}; background-color: ${hex};" title="${color}" aria-label="${color}"></button>`;
        });
        html += `  </div>`;
      } else {
        html += `  <div class="size-options" role="radiogroup" aria-label="Select ${optName}">`;
        values.forEach((val, i) => {
          html += `    <button type="button" class="size-option-btn ${i === 0 ? 'active' : ''}" data-value="${val}" role="radio" aria-checked="${i === 0 ? 'true' : 'false'}">${val}</button>`;
        });
        html += `  </div>`;
      }
      html += `</div>`;
    });

    container.innerHTML = html;

    container.querySelectorAll('.color-option-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const parent = this.closest('.color-options');
        if (parent) {
          parent.querySelectorAll('.color-option-btn').forEach(s => {
            s.classList.remove('active');
            s.setAttribute('aria-checked', 'false');
          });
        }
        this.classList.add('active');
        this.setAttribute('aria-checked', 'true');

        const val = this.dataset.value;
        _selectedOptions['Color'] = val;
        const labelSpan = document.getElementById('selected-color');
        if (labelSpan) labelSpan.textContent = val;
        updateSelectedVariant();
      });
    });

    container.querySelectorAll('.size-option-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const parent = this.closest('.size-options');
        if (parent) {
          parent.querySelectorAll('.size-option-btn').forEach(s => {
            s.classList.remove('active');
            s.setAttribute('aria-checked', 'false');
          });
        }
        this.classList.add('active');
        this.setAttribute('aria-checked', 'true');

        const val = this.dataset.value;
        _selectedOptions['Size'] = val;
        const labelSpan = document.getElementById('selected-size');
        if (labelSpan) labelSpan.textContent = val;
        updateSelectedVariant();
      });
    });

    updateSelectedVariant();
  }

  function getColorHex(colorName) {
    const Utils = getUtils();
    return Utils && Utils.colorNameToHex ? Utils.colorNameToHex(colorName) : '#9b8060';
  }

  function updateSelectedVariant() {
    if (!_product.variants || _product.variants.length === 0) return;

    _selectedVariant = _product.variants.find(v => {
      const matchOpt1 = !_selectedOptions['Color'] || v.option1 === _selectedOptions['Color'] || v.option2 === _selectedOptions['Color'];
      const matchOpt2 = !_selectedOptions['Size'] || v.option1 === _selectedOptions['Size'] || v.option2 === _selectedOptions['Size'];
      return matchOpt1 && matchOpt2;
    }) || _product.variants[0];

    const Utils = getUtils();
    const skuElem = document.getElementById('product-sku');
    if (skuElem && _selectedVariant) {
      skuElem.textContent = _selectedVariant.sku || _product.id;
    }

    const currentPrice = _selectedVariant && typeof _selectedVariant.price === 'number' ? _selectedVariant.price : _product.price;
    const comparePrice = _selectedVariant && _selectedVariant.compareAtPrice ? _selectedVariant.compareAtPrice : _product.compareAtPrice;
    const formattedPrice = Utils ? Utils.formatCurrency(currentPrice) : `$${currentPrice.toFixed(2)}`;

    const currentPriceElem = document.getElementById('current-price');
    const comparePriceElem = document.getElementById('compare-price');
    const saveBadgeElem = document.getElementById('save-badge');
    const stickyPrice = document.getElementById('sticky-bar-price');

    if (currentPriceElem) currentPriceElem.textContent = formattedPrice;

    if (comparePrice && comparePrice > currentPrice) {
      const formattedCompare = Utils ? Utils.formatCurrency(comparePrice) : `$${comparePrice.toFixed(2)}`;
      const discount = Math.round(((comparePrice - currentPrice) / comparePrice) * 100);
      if (comparePriceElem) {
        comparePriceElem.textContent = formattedCompare;
        comparePriceElem.style.display = 'inline';
      }
      if (saveBadgeElem) {
        saveBadgeElem.textContent = `Save ${discount}%`;
        saveBadgeElem.style.display = 'inline-block';
      }
    } else {
      if (comparePriceElem) comparePriceElem.style.display = 'none';
      if (saveBadgeElem) saveBadgeElem.style.display = 'none';
    }

    if (stickyPrice) {
      stickyPrice.innerHTML = `<span class="price--current">${formattedPrice}</span>`;
    }

    // Availability handling
    const isAvailable = _selectedVariant ? _selectedVariant.available !== false : _product.available;
    const addBtn = document.getElementById('add-to-cart-btn');
    const mobileAdd = document.getElementById('sticky-add-to-cart-btn');
    const stockStatus = document.querySelector('.product-info__stock-status');

    if (!isAvailable) {
      if (addBtn) {
        addBtn.disabled = true;
        addBtn.innerHTML = '<span>Sold Out</span>';
      }
      if (mobileAdd) {
        mobileAdd.disabled = true;
        mobileAdd.textContent = 'Sold Out';
      }
      if (stockStatus) {
        stockStatus.className = 'product-info__stock-status out-of-stock';
        stockStatus.innerHTML = '<span class="stock-dot stock-dot--out"></span> Out of Stock';
      }
    } else {
      if (addBtn) {
        addBtn.disabled = false;
        addBtn.innerHTML = '<i data-feather="shopping-bag" aria-hidden="true"></i> <span>Add to Cart</span>';
        if (typeof feather !== 'undefined') feather.replace();
      }
      if (mobileAdd) {
        mobileAdd.disabled = false;
        mobileAdd.textContent = 'Add to Bag';
      }
      if (stockStatus) {
        stockStatus.className = 'product-info__stock-status in-stock';
        stockStatus.innerHTML = '<span class="stock-dot"></span> In Stock &amp; Ready to Ship';
      }
    }
  }

  function setupQuantityControls() {
    const minusBtn = document.getElementById('qty-decrement') || document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-increment') || document.getElementById('qty-plus');
    const input = document.getElementById('product-qty');

    if (minusBtn && input) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10) || 1;
        if (val > 1) {
          input.value = val - 1;
          _quantity = val - 1;
        }
      });
    }

    if (plusBtn && input) {
      plusBtn.addEventListener('click', () => {
        let val = parseInt(input.value, 10) || 1;
        input.value = val + 1;
        _quantity = val + 1;
      });
    }

    if (input) {
      input.addEventListener('change', () => {
        let val = parseInt(input.value, 10) || 1;
        _quantity = Math.max(1, val);
        input.value = _quantity;
      });
    }
  }

  function setupActionButtons() {
    const addBtn = document.getElementById('add-to-cart-btn');
    const buyBtn = document.getElementById('buy-now-btn');
    const mobileAdd = document.getElementById('sticky-add-to-cart-btn');
    const wishlistToggle = document.getElementById('wishlist-toggle');
    const copyLinkBtn = document.getElementById('copy-link-btn');

    function performAddToCart() {
      const Cart = getCart();
      if (Cart) {
        Cart.addToCart(_product, _selectedVariant, _quantity);
      }
    }

    if (addBtn) addBtn.addEventListener('click', performAddToCart);
    if (mobileAdd) mobileAdd.addEventListener('click', performAddToCart);

    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        const Cart = getCart();
        if (Cart) {
          Cart.addToCart(_product, _selectedVariant, _quantity);
          window.location.href = 'checkout.html';
        }
      });
    }

    if (wishlistToggle) {
      wishlistToggle.addEventListener('click', () => {
        const Wishlist = getWishlist();
        const Notifications = getNotifications();
        if (Wishlist) {
          Wishlist.toggleWishlist(_product.id);
          const inWish = Wishlist.isInWishlist(_product.id);
          wishlistToggle.classList.toggle('wishlist-btn--active', inWish);
          if (Notifications) {
            Notifications.showToast(inWish ? `Saved "${_product.title}" to wishlist.` : `Removed "${_product.title}" from wishlist.`, inWish ? 'success' : 'info');
          }
        }
      });
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href).then(() => {
            const Notifications = getNotifications();
            if (Notifications) Notifications.showToast('Product link copied to clipboard!', 'info');
          });
        }
      });
    }
  }

  function setupStickyAddToCartObserver() {
    const stickyBar = document.getElementById('mobile-sticky-bar');
    const mainAddBtn = document.getElementById('add-to-cart-btn');
    if (!stickyBar || !mainAddBtn || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      const shouldShow = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      stickyBar.classList.toggle('mobile-sticky-bar--visible', shouldShow);
      stickyBar.classList.toggle('is-visible', shouldShow);
    }, { threshold: 0 });
    observer.observe(mainAddBtn);
  }

  function setupSizeGuide() {
    const trigger = document.getElementById('size-guide-trigger');
    const modal = document.getElementById('size-guide-modal');
    if (!trigger || !modal) return;

    const close = () => {
      modal.classList.remove('modal--open');
      trigger.focus();
    };
    trigger.addEventListener('click', () => modal.classList.add('modal--open'));
    modal.querySelectorAll('[data-size-guide-close]').forEach(button => button.addEventListener('click', close));
    modal.addEventListener('click', event => {
      if (event.target === modal) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('modal--open')) close();
    });
  }

  function setupTabs() {
    const tabs = document.querySelectorAll('.tab-nav-btn, .product-tabs .tabs__tab');
    const panels = document.querySelectorAll('.tab-panel, .product-tabs .tabs__panel');

    function activateTab(targetId) {
      tabs.forEach(t => {
        const id = t.getAttribute('aria-controls') || t.dataset.tab;
        const matches = id === targetId;
        t.classList.toggle('active', matches);
        t.classList.toggle('tabs__tab--active', matches);
        t.setAttribute('aria-selected', matches ? 'true' : 'false');
      });

      panels.forEach(p => {
        const matches = p.id === targetId;
        p.classList.toggle('active', matches);
        p.classList.toggle('tabs__panel--active', matches);
        if (matches) {
          p.removeAttribute('hidden');
        } else {
          p.setAttribute('hidden', '');
        }
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        const targetId = this.getAttribute('aria-controls') || this.dataset.tab;
        if (targetId) activateTab(targetId);
      });
    });

    document.addEventListener('click', (e) => {
      const reviewTrigger = e.target.closest('#product-review-link');
      if (reviewTrigger) {
        e.preventDefault();
        activateTab('tab-reviews');
        const section = document.getElementById('product-tabs-section') || document.getElementById('tab-reviews');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  async function renderReviews() {
    const container = document.getElementById('tab-reviews');
    const Data = getData();
    const Utils = getUtils();
    if (!container || !Data) return;

    const reviews = await Data.getReviewsByProduct(_product.id);
    const avgRating = _product.rating || 4.8;
    const count = reviews.length || _product.reviewCount || 12;
    const tabBtn = document.getElementById('tab-nav-reviews');
    if (tabBtn) tabBtn.textContent = `Customer Reviews (${count})`;
    const starFn = Utils ? (Utils.generateStarHTML || Utils.generateStarRating) : null;

    container.innerHTML = `
      <div id="reviews-anchor" class="reviews-section">
        <div class="reviews-summary">
          <div class="reviews-summary__average">
            <span class="reviews-summary__number">${avgRating.toFixed(1)}</span>
            <div class="stars" style="justify-content: center; margin: 4px 0;">${starFn ? starFn(avgRating) : '★★★★★'}</div>
            <span class="reviews-summary__total">${count} Verified Client Reviews</span>
          </div>
          <div class="reviews-summary__bars">
            <div class="review-bar"><span class="review-bar__label">5★</span><div class="review-bar__track"><div class="review-bar__fill" style="width: 78%;"></div></div><span class="review-bar__count">78%</span></div>
            <div class="review-bar"><span class="review-bar__label">4★</span><div class="review-bar__track"><div class="review-bar__fill" style="width: 16%;"></div></div><span class="review-bar__count">16%</span></div>
            <div class="review-bar"><span class="review-bar__label">3★</span><div class="review-bar__track"><div class="review-bar__fill" style="width: 4%;"></div></div><span class="review-bar__count">4%</span></div>
            <div class="review-bar"><span class="review-bar__label">2★</span><div class="review-bar__track"><div class="review-bar__fill" style="width: 2%;"></div></div><span class="review-bar__count">2%</span></div>
            <div class="review-bar"><span class="review-bar__label">1★</span><div class="review-bar__track"><div class="review-bar__fill" style="width: 0%;"></div></div><span class="review-bar__count">0%</span></div>
          </div>
        </div>
        <div class="reviews-list">
          ${reviews.length > 0 ? reviews.map(r => `
            <div class="review-card">
              <div class="review-card__header">
                <div>
                  <div class="stars" style="margin-bottom: 4px;">${starFn ? starFn(r.rating) : '★★★★★'}</div>
                  <strong class="review-card__author">${Utils ? Utils.escapeHTML(r.author) : r.author}</strong>
                  ${r.verified ? '<span class="review-card__verified" style="color:var(--color-success, #28a745);font-size:12px;margin-left:6px;">✓ Verified Purchase</span>' : ''}
                </div>
                <span class="review-card__date">${r.date || 'August 2026'}</span>
              </div>
              <h4 class="review-card__title" style="margin: 6px 0;">${Utils ? Utils.escapeHTML(r.title || 'Exceptional Quality') : (r.title || 'Exceptional Quality')}</h4>
              <p class="review-card__body">${Utils ? Utils.escapeHTML(r.body) : r.body}</p>
            </div>
          `).join('') : '<p class="text-muted">Be the first to review this exceptional piece.</p>'}
        </div>
      </div>
    `;
  }

  async function renderRelatedProducts() {
    const container = document.getElementById('related-products');
    const Data = getData();
    const Components = getComponents();
    if (!container || !Data || !Components) return;

    const all = await Data.getProducts();
    const related = all.filter(p => p.id !== _product.id && p.type === _product.type).slice(0, 4);

    if (related.length > 0) {
      container.innerHTML = related.map(p => Components.renderProductCard(p)).join('');
    }
  }

  function trackAndRenderRecentlyViewed(currentId) {
    const KEY = 'luxe_recently_viewed';
    let list = [];
    try {
      const stored = localStorage.getItem(KEY);
      list = stored ? JSON.parse(stored) : [];
    } catch (e) {
      list = [];
    }

    list = [currentId, ...list.filter(id => id !== currentId)].slice(0, 5);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}

    const container = document.getElementById('recently-viewed');
    const Data = getData();
    const Components = getComponents();
    if (!container || !Data || !Components) return;

    const previousIds = list.filter(id => id !== currentId).slice(0, 4);
    if (previousIds.length === 0) {
      const section = container.closest('section');
      if (section) section.style.display = 'none';
      return;
    }

    Data.getProducts().then(products => {
      const items = previousIds.map(id => products.find(p => p.id === id)).filter(Boolean);
      container.innerHTML = items.map(p => Components.renderProductCard(p)).join('');
      if (typeof feather !== 'undefined') feather.replace();
    });
  }

  return { init };
})();
