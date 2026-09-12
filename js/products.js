/**
 * LUXE STORE - Products Catalog & Collection Page Controller
 * Attaches to window.LuxeStore.Products
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Products = (function () {
  'use strict';

  const getData = () => window.LuxeStore.Data;
  const getComponents = () => window.LuxeStore.Components;
  const getUtils = () => window.LuxeStore.Utils;

  const ITEMS_PER_PAGE = 9;
  let _allProducts = [];
  let _currentCollection = null;
  let _currentPage = 1;
  let _filters = {
    categories: [],
    minPrice: 0,
    maxPrice: 2000,
    colors: [],
    sizes: [],
    inStock: false
  };
  let _sortBy = 'featured';

  const CATEGORY_MAP = {
    'jackets': ['outerwear', 'jacket', 'coat'],
    'shirts': ['tops', 'shirt', 'blouse', 'knitwear'],
    'dresses': ['dresses', 'dress', 'gown'],
    'pants': ['bottoms', 'pant', 'trousers', 'jeans', 'denim'],
    'accessories': ['accessories', 'bag', 'leather goods', 'scarf', 'belt'],
    'shoes': ['footwear', 'shoes', 'boots', 'sneakers']
  };

  async function init() {
    try {
      const Data = getData();
      if (!Data) {
        console.error('[LuxeStore.Products] Data module not available');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const collectionId = urlParams.get('id') || urlParams.get('collection');
      const categoryParam = urlParams.get('type') || urlParams.get('category');
      const sortParam = urlParams.get('sort');

      // `collections.html` is the directory; a collection detail must always
      // identify its collection. This prevents an ambiguous singular URL.
      if (/collection\.html$/i.test(window.location.pathname) && !collectionId) {
        window.location.replace('collections.html');
        return;
      }

      if (sortParam) _sortBy = sortParam;

      if (collectionId) {
        _currentCollection = await Data.getCollectionById(collectionId);
        if (_currentCollection) {
          setupCollectionHero(_currentCollection);
          _allProducts = await Data.getProductsByCollection(collectionId);
        } else {
          _allProducts = await Data.getProductsByCollection(collectionId);
          if (!_allProducts || _allProducts.length === 0) {
            _allProducts = await Data.getProducts();
          }
        }
      } else {
        _allProducts = await Data.getProducts();
      }

      if (categoryParam) {
        const catVal = categoryParam.toLowerCase();
        _filters.categories.push(catVal);

        // Check matching checkbox if present
        document.querySelectorAll('input[name="category"], input[name="filter-category"]').forEach(cb => {
          if (cb.value.toLowerCase() === catVal) {
            cb.checked = true;
          }
        });
      }

      setupFilterListeners();
      setupFilterSections();
      setupSortListener();
      setupViewToggle();
      setupMobileFilterDrawer();
      updateFilterCounts();

      applyFiltersAndRender();

    } catch (err) {
      console.error('[LuxeStore.Products] Error initializing products page:', err);
    }
  }

  async function initCollectionsDirectory() {
    const Data = getData();
    if (!Data) return;

    try {
      const collections = await Data.getCollections();
      const byId = new Map(collections.map(collection => [collection.id, collection]));

      document.querySelectorAll('.collection-directory-card__link').forEach(link => {
        const id = new URL(link.href, window.location.href).searchParams.get('id');
        const collection = byId.get(id);
        if (!collection) return;

        const title = link.querySelector('.collection-directory-card__title');
        const count = link.querySelector('.collection-directory-card__count');
        const description = link.querySelector('.collection-directory-card__description');
        const image = link.querySelector('.collection-directory-card__img');
        const productCount = Array.isArray(collection.productIds) ? collection.productIds.length : 0;

        if (title) title.textContent = collection.title;
        if (count) count.textContent = `${productCount} ${productCount === 1 ? 'Product' : 'Products'}`;
        if (description) description.textContent = collection.description;
        if (image && collection.image) {
          image.src = collection.image;
          image.alt = `${collection.title} collection`;
        }
        link.setAttribute('aria-label', `Explore ${collection.title} collection`);
      });

      if (typeof feather !== 'undefined') feather.replace();
    } catch (err) {
      console.error('[LuxeStore.Products] Unable to render collection directory:', err);
    }
  }

  function setupCollectionHero(collection) {
    const Components = getComponents();
    const heroTitle = document.getElementById('collection-title') || document.getElementById('collection-hero-title');
    const heroDesc = document.getElementById('collection-description') || document.getElementById('collection-hero-desc');
    const heroBanner = document.getElementById('collection-hero-bg') || document.getElementById('collection-hero');

    if (heroTitle) heroTitle.textContent = collection.title;
    if (heroDesc) heroDesc.textContent = collection.description;
    if (heroBanner && collection.image) {
      heroBanner.style.backgroundImage = `url('${collection.image}')`;
    }

    const breadcrumbContainer = document.getElementById('collection-breadcrumb');
    if (breadcrumbContainer && Components && Components.renderBreadcrumb) {
      breadcrumbContainer.innerHTML = Components.renderBreadcrumb([
        { label: 'Collections', url: 'collections.html' },
        { label: collection.title }
      ]);
    }

    document.title = `${collection.title} | LUXE STORE`;
  }

  function setupFilterListeners() {
    const Utils = getUtils();

    // Category checkboxes
    document.querySelectorAll('input[name="category"], input[name="filter-category"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(document.querySelectorAll('input[name="category"]:checked, input[name="filter-category"]:checked'))
          .map(c => c.value.toLowerCase());
        _filters.categories = checked;
        _currentPage = 1;
        applyFiltersAndRender();
      });
    });

    // Price range inputs
    const minInput = document.getElementById('price-min') || document.getElementById('filter-price-min');
    const maxInput = document.getElementById('price-max') || document.getElementById('filter-price-max');
    const applyPriceBtn = document.getElementById('apply-price-btn');

    const updatePrice = () => {
      _filters.minPrice = minInput && minInput.value ? parseFloat(minInput.value) : 0;
      _filters.maxPrice = maxInput && maxInput.value ? parseFloat(maxInput.value) : 2000;
      _currentPage = 1;
      applyFiltersAndRender();
    };

    if (applyPriceBtn) {
      applyPriceBtn.addEventListener('click', updatePrice);
    }

    if (minInput && maxInput) {
      const debouncedPrice = Utils && Utils.debounce ? Utils.debounce(updatePrice, 400) : updatePrice;
      minInput.addEventListener('input', debouncedPrice);
      maxInput.addEventListener('input', debouncedPrice);
    }

    // Color swatches
    document.querySelectorAll('.color-swatches .color-swatch, .filter-swatch').forEach(swatch => {
      swatch.addEventListener('click', function () {
        this.classList.toggle('active');
        this.classList.toggle('filter-swatch--active');
        const activeColors = Array.from(document.querySelectorAll('.color-swatches .color-swatch.active, .filter-swatch--active'))
          .map(s => (s.dataset.color || '').toLowerCase())
          .filter(Boolean);
        _filters.colors = activeColors;
        _currentPage = 1;
        applyFiltersAndRender();
      });
    });

    // Size options (swatches or checkboxes)
    document.querySelectorAll('.size-swatches .size-swatch').forEach(swatch => {
      swatch.addEventListener('click', function () {
        this.classList.toggle('active');
        const activeSizes = Array.from(document.querySelectorAll('.size-swatches .size-swatch.active'))
          .map(s => (s.dataset.size || '').toUpperCase())
          .filter(Boolean);
        _filters.sizes = activeSizes;
        _currentPage = 1;
        applyFiltersAndRender();
      });
    });

    document.querySelectorAll('input[name="filter-size"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(document.querySelectorAll('input[name="filter-size"]:checked')).map(c => c.value.toUpperCase());
        _filters.sizes = checked;
        _currentPage = 1;
        applyFiltersAndRender();
      });
    });

    // Availability / In-stock
    const stockCb = document.getElementById('filter-in-stock') || document.getElementById('filter-available') || document.querySelector('input[name="availability"]');
    if (stockCb) {
      stockCb.addEventListener('change', () => {
        _filters.inStock = stockCb.checked;
        _currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Clear filters triggers
    document.addEventListener('click', (e) => {
      if (e.target.closest('#sidebar-clear-all') || e.target.closest('#clear-all-filters-btn') || e.target.closest('#clear-filters-btn') || e.target.closest('#empty-reset-btn')) {
        e.preventDefault();
        resetFilters();
      }
    });
  }

  function setupFilterSections() {
    document.querySelectorAll('.filter-section').forEach(section => {
      const trigger = section.querySelector('.filter-section__title');
      if (!trigger) return;

      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('aria-expanded', 'true');

      const toggle = () => {
        const collapsed = section.classList.toggle('is-collapsed');
        trigger.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      };

      trigger.addEventListener('click', toggle);
      trigger.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  function productMatchesCategory(product, category) {
    const prodType = (product.type || '').toLowerCase();
    const prodCollections = (product.collections || []).map(collection => collection.toLowerCase());
    const mapped = CATEGORY_MAP[category] || [category];
    return mapped.some(term => prodType.includes(term) || prodCollections.includes(term));
  }

  function updateFilterCounts() {
    document.querySelectorAll('input[name="category"], input[name="filter-category"]').forEach(input => {
      const count = _allProducts.filter(product => productMatchesCategory(product, input.value.toLowerCase())).length;
      const countLabel = input.closest('.filter-checkbox')?.querySelector('.filter-checkbox__count');
      if (countLabel) countLabel.textContent = `(${count})`;
    });

    const stockInput = document.getElementById('filter-in-stock') || document.querySelector('input[name="availability"]');
    const stockCount = stockInput?.closest('.filter-checkbox')?.querySelector('.filter-checkbox__count');
    if (stockCount) {
      stockCount.textContent = `(${_allProducts.filter(product => product.available !== false).length})`;
    }
  }

  function resetFilters() {
    _filters = {
      categories: [],
      minPrice: 0,
      maxPrice: 2000,
      colors: [],
      sizes: [],
      inStock: false
    };

    document.querySelectorAll('input[name="category"], input[name="filter-category"], input[name="filter-size"], input[name="availability"]').forEach(cb => cb.checked = false);
    const stockCb = document.getElementById('filter-in-stock') || document.getElementById('filter-available');
    if (stockCb) stockCb.checked = false;

    const minInput = document.getElementById('price-min') || document.getElementById('filter-price-min');
    const maxInput = document.getElementById('price-max') || document.getElementById('filter-price-max');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';

    document.querySelectorAll('.color-swatches .color-swatch, .filter-swatch, .size-swatches .size-swatch').forEach(s => {
      s.classList.remove('active', 'filter-swatch--active');
    });

    _currentPage = 1;
    applyFiltersAndRender();
  }

  function setupSortListener() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.value = _sortBy;
      sortSelect.addEventListener('change', (e) => {
        _sortBy = e.target.value;
        _currentPage = 1;
        applyFiltersAndRender();
      });
    }
  }

  function setupViewToggle() {
    const gridBtn = document.getElementById('grid-view-btn') || document.getElementById('view-grid');
    const listBtn = document.getElementById('list-view-btn') || document.getElementById('view-list');
    const grid = document.getElementById('product-grid');

    if (gridBtn && listBtn && grid) {
      gridBtn.addEventListener('click', () => {
        grid.classList.remove('product-grid--list');
        gridBtn.classList.add('active', 'sort-bar__view-btn--active');
        gridBtn.setAttribute('aria-pressed', 'true');
        listBtn.classList.remove('active', 'sort-bar__view-btn--active');
        listBtn.setAttribute('aria-pressed', 'false');
      });

      listBtn.addEventListener('click', () => {
        grid.classList.add('product-grid--list');
        listBtn.classList.add('active', 'sort-bar__view-btn--active');
        listBtn.setAttribute('aria-pressed', 'true');
        gridBtn.classList.remove('active', 'sort-bar__view-btn--active');
        gridBtn.setAttribute('aria-pressed', 'false');
      });
    }
  }

  function setupMobileFilterDrawer() {
    const toggleBtn = document.querySelector('.mobile-filter-toggle') || document.getElementById('mobile-filter-toggle');
    const sidebar = document.getElementById('shop-sidebar');

    if (toggleBtn && sidebar) {
      const overlay = document.getElementById('site-overlay');
      const setOpen = open => {
        sidebar.classList.toggle('shop-sidebar--open', open);
        sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
        toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (overlay) overlay.classList.toggle('site-overlay--visible', open);
        document.body.classList.toggle('body-lock', open);
      };

      toggleBtn.addEventListener('click', () => {
        setOpen(!sidebar.classList.contains('shop-sidebar--open'));
      });

      const closeBtn = document.getElementById('shop-sidebar-close') || sidebar.querySelector('.sidebar-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => setOpen(false));
      }

      if (overlay) overlay.addEventListener('click', () => setOpen(false));
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && sidebar.classList.contains('shop-sidebar--open')) setOpen(false);
      });
    }
  }

  function customFilter(products, filters) {
    if (!Array.isArray(products)) return [];

    return products.filter(product => {
      // Category / Type filter
      if (filters.categories && filters.categories.length > 0) {
        const matchesCategory = filters.categories.some(cat => productMatchesCategory(product, cat));

        if (!matchesCategory) return false;
      }

      // Price range
      if (typeof filters.minPrice === 'number' && product.price < filters.minPrice) {
        return false;
      }
      if (typeof filters.maxPrice === 'number' && product.price > filters.maxPrice) {
        return false;
      }

      // Color filter
      if (filters.colors && filters.colors.length > 0) {
        const colorOption = (product.options || []).find(o => o.name.toLowerCase() === 'color');
        if (!colorOption) return false;
        const matchesColor = colorOption.values.some(v =>
          filters.colors.some(c => v.toLowerCase().includes(c.toLowerCase()))
        );
        if (!matchesColor) return false;
      }

      // Size filter
      if (filters.sizes && filters.sizes.length > 0) {
        const sizeOption = (product.options || []).find(o => o.name.toLowerCase() === 'size');
        if (!sizeOption) return false;
        const matchesSize = sizeOption.values.some(v =>
          filters.sizes.some(s => v.toUpperCase() === s.toUpperCase())
        );
        if (!matchesSize) return false;
      }

      // In stock
      if (filters.inStock === true) {
        if (!product.available) return false;
      }

      return true;
    });
  }

  function applyFiltersAndRender() {
    const Data = getData();

    const filtered = customFilter(_allProducts, _filters);
    const sorted = Data && Data.sortProducts ? Data.sortProducts(filtered, _sortBy) : filtered;

    renderActiveFilterPills();
    renderProductGrid(sorted);
    renderPagination(sorted.length);
    updateCountDisplay(sorted.length, _allProducts.length);

    if (window.LuxeStore.Wishlist && typeof window.LuxeStore.Wishlist.updateWishlistUI === 'function') {
      window.LuxeStore.Wishlist.updateWishlistUI();
    }

    if (typeof feather !== 'undefined') feather.replace();
  }

  function renderActiveFilterPills() {
    const container = document.getElementById('active-filters');
    const pillsWrap = document.getElementById('active-filters-pills') || container;
    if (!container) return;

    let pills = [];

    _filters.categories.forEach(c => pills.push({
      label: `Category: ${c}`,
      action: () => {
        _filters.categories = _filters.categories.filter(item => item !== c);
        document.querySelectorAll(`input[name="category"][value="${c}"], input[name="filter-category"][value="${c}"]`).forEach(cb => cb.checked = false);
        applyFiltersAndRender();
      }
    }));

    _filters.colors.forEach(c => pills.push({
      label: `Color: ${c}`,
      action: () => {
        _filters.colors = _filters.colors.filter(item => item !== c);
        document.querySelectorAll(`.color-swatch[data-color="${c}"], .filter-swatch[data-color="${c}"]`).forEach(s => s.classList.remove('active', 'filter-swatch--active'));
        applyFiltersAndRender();
      }
    }));

    _filters.sizes.forEach(s => pills.push({
      label: `Size: ${s}`,
      action: () => {
        _filters.sizes = _filters.sizes.filter(item => item !== s);
        document.querySelectorAll(`.size-swatch[data-size="${s}"]`).forEach(s => s.classList.remove('active'));
        document.querySelectorAll(`input[name="filter-size"][value="${s}"]`).forEach(cb => cb.checked = false);
        applyFiltersAndRender();
      }
    }));

    if (_filters.inStock) {
      pills.push({
        label: 'In Stock Only',
        action: () => {
          _filters.inStock = false;
          const stockCb = document.getElementById('filter-in-stock') || document.getElementById('filter-available');
          if (stockCb) stockCb.checked = false;
          applyFiltersAndRender();
        }
      });
    }

    const mobileCountBadge = document.getElementById('mobile-filter-count');
    if (mobileCountBadge) {
      mobileCountBadge.textContent = pills.length;
      mobileCountBadge.style.display = pills.length > 0 ? 'inline-block' : 'none';
    }

    if (pills.length === 0) {
      container.setAttribute('hidden', '');
      container.style.display = 'none';
      if (pillsWrap && pillsWrap !== container) pillsWrap.innerHTML = '';
      return;
    }

    container.removeAttribute('hidden');
    container.style.display = 'flex';

    const pillsHtml = pills.map((pill, idx) => `
      <button type="button" class="tag tag--removable active-filter-pill" data-pill-index="${idx}" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin: 4px; padding: 4px 10px; background: var(--color-bg-secondary, #F4F4F4); border: 1px solid var(--color-border, #E5E5E5); border-radius: 9999px; font-size: 13px;">
        <span>${pill.label}</span>
        <span aria-hidden="true">&times;</span>
      </button>
    `).join('');

    if (pillsWrap && pillsWrap !== container) {
      pillsWrap.innerHTML = pillsHtml;
    } else {
      container.innerHTML = `
        <div class="active-filters-list" style="display: flex; flex-wrap: wrap; gap: 8px; align-items:center; margin-bottom: 1rem;">
          ${pillsHtml}
          <button type="button" class="btn btn--link btn--sm" id="clear-all-filters-btn">Clear all</button>
        </div>
      `;
    }

    container.querySelectorAll('.active-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.pillIndex, 10);
        if (pills[idx]) pills[idx].action();
      });
    });
  }

  function renderProductGrid(items) {
    const grid = document.getElementById('product-grid');
    const Components = getComponents();
    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <i data-feather="search" style="width: 48px; height: 48px; color: var(--color-text-muted); margin-bottom: 1rem;"></i>
          <h3>No products found</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">Try clearing some filters to see available merchandise.</p>
          <button type="button" class="btn btn--primary btn--sm" id="empty-reset-btn">Reset All Filters</button>
        </div>
      `;
      return;
    }

    const start = (_currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = items.slice(start, start + ITEMS_PER_PAGE);

    if (Components && Components.renderProductCard) {
      grid.innerHTML = paginated.map(p => Components.renderProductCard(p)).join('');
    }
  }

  function renderPagination(totalItems) {
    const container = document.getElementById('pagination-container') || document.querySelector('.pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '<ul class="pagination__list" style="display: flex; list-style: none; gap: 8px; align-items: center; justify-content: center; margin: 2rem 0;">';
    if (_currentPage > 1) {
      html += `<li><button type="button" class="pagination__link pagination__btn pagination__prev" data-page="${_currentPage - 1}"><i data-feather="chevron-left"></i></button></li>`;
    }

    for (let i = 1; i <= totalPages; i++) {
      html += `<li><button type="button" class="pagination__link pagination__btn ${i === _currentPage ? 'active pagination__btn--active' : ''}" data-page="${i}">${i}</button></li>`;
    }

    if (_currentPage < totalPages) {
      html += `<li><button type="button" class="pagination__link pagination__btn pagination__next" data-page="${_currentPage + 1}"><i data-feather="chevron-right"></i></button></li>`;
    }
    html += '</ul>';

    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        _currentPage = parseInt(btn.dataset.page, 10);
        applyFiltersAndRender();
        window.scrollTo({ top: 250, behavior: 'smooth' });
      });
    });
  }

  function updateCountDisplay(showingCount, totalCount) {
    const countSpan = document.getElementById('product-total-count');
    const sortCount = document.getElementById('sort-count');
    const collectionCount = document.getElementById('collection-product-count');

    const start = showingCount === 0 ? 0 : (_currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(_currentPage * ITEMS_PER_PAGE, showingCount);

    const noun = showingCount === 1 ? 'product' : 'products';
    if (countSpan) countSpan.textContent = `${showingCount} ${showingCount === 1 ? 'Product' : 'Products'}`;
    if (sortCount) sortCount.textContent = `Showing ${start}–${end} of ${showingCount} ${noun}`;
    if (collectionCount) collectionCount.textContent = `${showingCount} ${showingCount === 1 ? 'Product' : 'Products'} Available`;
  }

  return { init, initCollectionsDirectory };
})();
