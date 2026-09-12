/**
 * LUXE STORE - Wishlist Module
 * Attaches to window.LuxeStore.Wishlist
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Wishlist = (function () {
  'use strict';

  const STORAGE_KEY = 'luxe_wishlist';

  /**
   * Retrieve wishlist product IDs from localStorage
   * @returns {Array<string>}
   */
  function getWishlist() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[LuxeStore.Wishlist] Error reading localStorage', e);
      return [];
    }
  }

  /**
   * Persist wishlist product IDs
   * @param {Array<string>} list
   */
  function saveWishlist(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('[LuxeStore.Wishlist] Error writing localStorage', e);
    }
    updateWishlistUI();
  }

  /**
   * Check if a product is in the wishlist
   * @param {string} productId
   * @returns {boolean}
   */
  function isInWishlist(productId) {
    const list = getWishlist();
    return list.includes(String(productId));
  }

  /**
   * Add a product to wishlist
   * @param {string} productId
   */
  async function addToWishlist(productId) {
    const list = getWishlist();
    const strId = String(productId);
    if (!list.includes(strId)) {
      list.push(strId);
      saveWishlist(list);

      // Show notification
      if (window.LuxeStore.Notifications) {
        let title = 'Product';
        if (window.LuxeStore.Data) {
          const prod = await window.LuxeStore.Data.getProductById(strId);
          if (prod) title = prod.title;
        }
        window.LuxeStore.Notifications.showToast(`Saved "${title}" to your wishlist.`, 'success');
      }
    }
  }

  /**
   * Remove a product from wishlist
   * @param {string} productId
   */
  function removeFromWishlist(productId) {
    let list = getWishlist();
    const strId = String(productId);
    list = list.filter(id => id !== strId);
    saveWishlist(list);

    if (window.LuxeStore.Notifications) {
      window.LuxeStore.Notifications.showToast('Removed item from your wishlist.', 'info');
    }

    // If on wishlist page, re-render
    if (document.getElementById('wishlist-grid')) {
      renderWishlistPage();
    }
  }

  /**
   * Toggle product in/out of wishlist
   * @param {string} productId
   */
  function toggleWishlist(productId) {
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  }

  /**
   * Return total count of wishlist items
   * @returns {number}
   */
  function getWishlistCount() {
    return getWishlist().length;
  }

  /**
   * Synchronize wishlist badges and button active states in DOM
   */
  function updateWishlistUI() {
    const list = getWishlist();
    const count = list.length;

    // Update count badges
    document.querySelectorAll('.wishlist-count').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
      badge.setAttribute('aria-label', `${count} items in wishlist`);
    });

    // Update wishlist buttons across all rendered cards
    document.querySelectorAll('[data-action="toggle-wishlist"]').forEach(btn => {
      const prodId = btn.dataset.productId;
      if (prodId && list.includes(String(prodId))) {
        btn.classList.add('product-card__wishlist-btn--active');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('title', 'Remove from wishlist');
      } else {
        btn.classList.remove('product-card__wishlist-btn--active');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('title', 'Add to wishlist');
      }
    });
  }

  /**
   * Render the dedicated Wishlist Page (#wishlist-grid)
   */
  async function renderWishlistPage() {
    const grid = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('wishlist-empty') || document.getElementById('wishlist-empty-state');
    const countHeader = document.getElementById('wishlist-page-count') || document.getElementById('wishlist-count-header');
    if (!grid) return;

    const list = getWishlist();

    if (countHeader) {
      countHeader.textContent = `(${list.length} ${list.length === 1 ? 'item' : 'items'})`;
    }

    if (list.length === 0) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'block';
      } else {
        grid.style.display = 'grid';
        grid.innerHTML = `
          <div class="wishlist-empty-state">
            <div class="wishlist-empty-state__icon">
              <i data-feather="heart" aria-hidden="true"></i>
            </div>
            <h2 class="wishlist-empty-state__title">Your Wishlist is Empty</h2>
            <p class="wishlist-empty-state__text">Curate your personal collection of favorite garments and accessories.</p>
            <a href="products.html" class="btn btn--primary">Discover Collection</a>
          </div>
        `;
      }
      if (typeof feather !== 'undefined') feather.replace();
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    // Fetch product details for all wishlisted IDs
    if (!window.LuxeStore.Data || !window.LuxeStore.Components) return;

    try {
      const products = await window.LuxeStore.Data.getProducts();
      const wishlistedProducts = products.filter(p => list.includes(String(p.id)));

      grid.innerHTML = wishlistedProducts.map(p => window.LuxeStore.Components.renderProductCard(p)).join('');

      updateWishlistUI();
      if (typeof feather !== 'undefined') feather.replace();
    } catch (err) {
      console.error('[LuxeStore.Wishlist] Error rendering wishlist page', err);
    }
  }

  /**
   * Initialize event listeners
   */
  function init() {
    updateWishlistUI();

    // Delegate click on wishlist toggle buttons
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action="toggle-wishlist"]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        if (productId) {
          toggleWishlist(productId);
        }
      }
    });

    // If currently on wishlist page, render items
    if (document.getElementById('wishlist-grid')) {
      renderWishlistPage();
    }
  }

  return {
    getWishlist,
    saveWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    getWishlistCount,
    updateWishlistUI,
    renderWishlistPage,
    init
  };
})();
