/**
 * LUXE STORE - FAQ Controller
 * Attaches to window.LuxeStore.FAQ
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.FAQ = (function () {
  'use strict';

  function init() {
    setupAccordion();
    setupCategoryFilter();
    setupSearch();
    if (typeof feather !== 'undefined') feather.replace();
  }

  function setupAccordion() {
    document.querySelectorAll('.faq-item__trigger').forEach(trigger => {
      trigger.addEventListener('click', function () {
        const item = this.closest('.faq-item');
        const content = item && item.querySelector('.faq-item__content');
        if (!item || !content) return;

        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!isExpanded));
        item.classList.toggle('faq-item--active', !isExpanded);
        content.toggleAttribute('hidden', isExpanded);
      });
    });
  }

  function setupCategoryFilter() {
    const buttons = document.querySelectorAll('.faq-filter-btn');
    const items = document.querySelectorAll('.faq-item');

    buttons.forEach(btn => {
      btn.addEventListener('click', function () {
        buttons.forEach(b => b.classList.remove('faq-filter-btn--active'));
        this.classList.add('faq-filter-btn--active');

        const category = this.dataset.filter;
        items.forEach(item => {
          if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  function setupSearch() {
    const searchInput = document.getElementById('faq-search-input');
    const items = document.querySelectorAll('.faq-item');
    const noResults = document.getElementById('faq-no-results');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();

        let visibleCount = 0;
        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          const matches = !query || text.includes(query);
          item.style.display = matches ? 'block' : 'none';
          if (matches) visibleCount++;
        });
        if (noResults) noResults.toggleAttribute('hidden', !(query && visibleCount === 0));
      });
    }
  }

  return { init };
})();
