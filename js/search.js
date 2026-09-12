/**
 * LUXE STORE - Search & Discovery Module
 * Attaches to window.LuxeStore.Search
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Search = (function () {
  'use strict';

  const HISTORY_KEY = 'luxe_search_history';
  const MAX_HISTORY = 6;
  const Utils = window.LuxeStore.Utils;

  /**
   * Read recent search queries from localStorage
   * @returns {Array<string>}
   */
  function getSearchHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Add a search query to search history
   * @param {string} query
   */
  function addToSearchHistory(query) {
    if (!query || !query.trim()) return;
    const clean = query.trim();
    let history = getSearchHistory().filter(item => item.toLowerCase() !== clean.toLowerCase());
    history.unshift(clean);
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
    renderSearchHistoryTags();
  }

  /**
   * Clear all search history
   */
  function clearSearchHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {}
    renderSearchHistoryTags();
  }

  /**
   * Render recent search pills in the search overlay
   */
  function renderSearchHistoryTags() {
    const container = document.getElementById('search-history-container');
    const tagsContainer = document.getElementById('search-history-tags');
    if (!container || !tagsContainer) return;

    const history = getSearchHistory();
    if (history.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    tagsContainer.innerHTML = history.map(term => `
      <button type="button" class="search-tag search-tag--history" data-term="${Utils.escapeHTML(term)}">
        <i data-feather="clock" aria-hidden="true"></i>
        <span>${Utils.escapeHTML(term)}</span>
      </button>
    `).join('');

    if (typeof feather !== 'undefined') feather.replace();
  }

  /**
   * Live Instant Search query runner for the search overlay
   * @param {string} query
   */
  async function handleLiveSearch(query) {
    const resultsContainer = document.getElementById('search-live-results');
    const suggestionsSection = document.getElementById('search-trending-tags');
    const historySection = document.getElementById('search-history-container');
    if (!resultsContainer) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      resultsContainer.innerHTML = '';
      if (suggestionsSection) suggestionsSection.style.display = 'block';
      if (historySection && getSearchHistory().length > 0) historySection.style.display = 'block';
      return;
    }

    if (suggestionsSection) suggestionsSection.style.display = 'none';
    if (historySection) historySection.style.display = 'none';

    resultsContainer.innerHTML = `
      <div class="search-overlay__loading">
        <span class="loading-spinner"></span>
        <p>Searching collections...</p>
      </div>
    `;

    try {
      const matches = await window.LuxeStore.Data.searchProducts(trimmed);

      if (matches.length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-overlay__no-results">
            <p>No silhouettes found matching "<strong>${Utils.escapeHTML(trimmed)}</strong>".</p>
            <p class="text-muted">Try searching with broader terms such as "jacket", "dress", "cashmere", or "boots".</p>
          </div>
        `;
        return;
      }

      let html = `
        <div class="search-overlay__results-header">
          <span>Found <strong>${matches.length}</strong> matching ${matches.length === 1 ? 'item' : 'items'}</span>
          <a href="search.html?q=${encodeURIComponent(trimmed)}" class="search-overlay__view-all-link">
            View All Results &rarr;
          </a>
        </div>
        <div class="search-overlay__results-grid">
      `;

      matches.slice(0, 6).forEach(product => {
        const img = (product.images && product.images[0]) ? product.images[0] : '';
        const price = Utils.formatCurrency(product.price);
        html += `
          <a href="product.html?id=${product.id}" class="search-result-item">
            <img src="${img}" alt="${Utils.escapeHTML(product.title)}" class="search-result-item__img" loading="lazy">
            <div class="search-result-item__info">
              <span class="search-result-item__type">${Utils.escapeHTML(product.type)}</span>
              <h5 class="search-result-item__title">${Utils.escapeHTML(product.title)}</h5>
              <span class="search-result-item__price">${price}</span>
            </div>
          </a>
        `;
      });

      html += '</div>';
      resultsContainer.innerHTML = html;
    } catch (err) {
      console.error('[LuxeStore.Search] Error performing live search', err);
      resultsContainer.innerHTML = '<p class="text-danger">An error occurred while searching.</p>';
    }
  }

  /**
   * Render dedicated Search Results Page (search.html)
   */
  async function renderSearchPage() {
    const grid = document.getElementById('search-results-grid');
    const queryHeading = document.getElementById('search-query-heading');
    const countBadge = document.getElementById('search-results-count') || document.getElementById('search-count-badge');
    const emptyView = document.getElementById('search-no-results') || document.getElementById('search-empty-view');
    const searchFormInput = document.getElementById('search-page-input');

    const query = Utils.getQueryParam('q') || (searchFormInput ? searchFormInput.value : '') || '';

    if (searchFormInput && searchFormInput.value !== query) {
      searchFormInput.value = query;
    }

    if (queryHeading) {
      queryHeading.textContent = query ? `Results for "${query}"` : 'All Products';
    }

    if (!grid) return;

    if (!query.trim()) {
      // If no query, show all products
      try {
        const allProducts = await window.LuxeStore.Data.getProducts();
        if (countBadge) countBadge.textContent = `${allProducts.length} items found`;
        if (emptyView) emptyView.style.display = 'none';
        grid.style.display = 'grid';
        grid.innerHTML = allProducts.map(p => window.LuxeStore.Components.renderProductCard(p)).join('');
        if (typeof feather !== 'undefined') feather.replace();
        if (window.LuxeStore.Wishlist) window.LuxeStore.Wishlist.updateWishlistUI();
      } catch (e) {}
      return;
    }

    // Record in search history
    addToSearchHistory(query);

    grid.innerHTML = '<div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;"><span class="loading-spinner"></span> Searching...</div>';

    try {
      const results = await window.LuxeStore.Data.searchProducts(query);

      if (countBadge) {
        countBadge.textContent = `${results.length} ${results.length === 1 ? 'item' : 'items'} found for "${query}"`;
      }

      if (results.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        if (emptyView) {
          emptyView.style.display = 'block';
        } else {
          grid.style.display = 'grid';
          grid.innerHTML = `
            <div class="search-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
              <div class="search-empty-state__icon"><i data-feather="search"></i></div>
              <h2>No Results Found</h2>
              <p>We could not find any products matching "${Utils.escapeHTML(query)}".</p>
              <div class="search-empty-state__tags" style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 8px;">
                <a href="search.html?q=Outerwear" class="btn btn--secondary btn--small">Outerwear</a>
                <a href="search.html?q=Dresses" class="btn btn--secondary btn--small">Dresses</a>
                <a href="search.html?q=Accessories" class="btn btn--secondary btn--small">Accessories</a>
              </div>
            </div>
          `;
        }
        if (typeof feather !== 'undefined') feather.replace();
        return;
      }

      if (emptyView) emptyView.style.display = 'none';
      grid.style.display = 'grid';

      grid.innerHTML = results.map(p => window.LuxeStore.Components.renderProductCard(p)).join('');

      if (typeof feather !== 'undefined') feather.replace();
      if (window.LuxeStore.Wishlist) window.LuxeStore.Wishlist.updateWishlistUI();
    } catch (err) {
      console.error('[LuxeStore.Search] Error rendering search page', err);
      grid.innerHTML = '<p class="error-msg" style="grid-column: 1 / -1; text-align: center;">Failed to load search results.</p>';
    }
  }

  /**
   * Initialize search handlers
   */
  function init() {
    renderSearchHistoryTags();

    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const searchForm = document.getElementById('search-overlay-form');

    if (searchInput) {
      // Debounced live input search
      const debouncedSearch = Utils.debounce((val) => {
        handleLiveSearch(val);
      }, 250);

      searchInput.addEventListener('input', function () {
        if (searchClearBtn) {
          searchClearBtn.style.display = this.value.length > 0 ? 'block' : 'none';
        }
        debouncedSearch(this.value);
      });

      if (searchClearBtn) {
        searchClearBtn.addEventListener('click', function () {
          searchInput.value = '';
          searchInput.focus();
          searchClearBtn.style.display = 'none';
          handleLiveSearch('');
        });
      }

      if (searchForm) {
        searchForm.addEventListener('submit', function () {
          addToSearchHistory(searchInput.value);
        });
      }
    }

    // Search tag clicks (Trending and History tags)
    document.addEventListener('click', function (e) {
      const tag = e.target.closest('.search-tag');
      if (tag) {
        const term = tag.dataset.term;
        if (term) {
          if (searchInput) {
            searchInput.value = term;
            if (searchClearBtn) searchClearBtn.style.display = 'block';
            handleLiveSearch(term);
          } else {
            window.location.href = `search.html?q=${encodeURIComponent(term)}`;
          }
        }
        return;
      }

      // Clear history button
      if (e.target.closest('#search-clear-history-btn')) {
        clearSearchHistory();
      }
    });

    // If on search.html page
    const pageSearchInput = document.getElementById('search-page-input');
    if (pageSearchInput) {
      const debouncedPageSearch = Utils && Utils.debounce ? Utils.debounce((val) => {
        if (Utils.setQueryParam) Utils.setQueryParam('q', val);
        renderSearchPage();
      }, 300) : (val) => {
        if (Utils.setQueryParam) Utils.setQueryParam('q', val);
        renderSearchPage();
      };

      pageSearchInput.addEventListener('input', function () {
        debouncedPageSearch(this.value);
      });

      pageSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (Utils.setQueryParam) Utils.setQueryParam('q', this.value);
          renderSearchPage();
        }
      });
    }

  }

  return {
    handleLiveSearch,
    renderSearchPage,
    getSearchHistory,
    addToSearchHistory,
    clearSearchHistory,
    init
  };
})();
