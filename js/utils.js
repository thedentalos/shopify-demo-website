/**
 * LUXE STORE - Utility Functions Module
 * Attaches to window.LuxeStore.Utils
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Utils = (function () {
  'use strict';

  /**
   * Format number or string to standard USD currency display ($XX.XX)
   * @param {number|string} amount
   * @returns {string}
   */
  function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return '$0.00';
    }
    const num = Number(amount);
    return '$' + num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Debounce function execution
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(context, args);
      }, delay);
    };
  }

  /**
   * Throttle function execution
   * @param {Function} fn
   * @param {number} limit
   * @returns {Function}
   */
  function throttle(fn, limit = 200) {
    let inThrottle = false;
    return function (...args) {
      const context = this;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * Transform string into a URL-friendly slug
   * @param {string} text
   * @returns {string}
   */
  function slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Read query parameter value from current URL
   * @param {string} name
   * @returns {string|null}
   */
  function getQueryParam(name) {
    if (typeof window === 'undefined' || !window.location) return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  /**
   * Update or add a query parameter to the URL
   * @param {string} name
   * @param {string} value
   * @param {boolean} updateHistory
   */
  function setQueryParam(name, value, updateHistory = true) {
    if (typeof window === 'undefined' || !window.location) return;
    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
    if (updateHistory && window.history && window.history.replaceState) {
      window.history.replaceState({}, '', url.toString());
    }
  }

  /**
   * Truncate text to a maximum length with ellipsis
   * @param {string} text
   * @param {number} max
   * @returns {string}
   */
  function truncateText(text, max = 100) {
    if (!text) return '';
    if (text.length <= max) return text;
    return text.substring(0, max).trim() + '…';
  }

  /**
   * Generate HTML for star rating display
   * @param {number} rating (0 - 5)
   * @param {number} maxStars
   * @returns {string} HTML markup
   */
  function generateStarHTML(rating, maxStars = 5) {
    const score = Math.max(0, Math.min(maxStars, Number(rating) || 0));
    let starsHtml = '<span class="star-rating" aria-label="Rating: ' + score.toFixed(1) + ' out of ' + maxStars + ' stars">';

    for (let i = 1; i <= maxStars; i++) {
      if (score >= i) {
        // Full star
        starsHtml += '<i data-feather="star" class="star-icon star-icon--filled" aria-hidden="true"></i>';
      } else if (score >= i - 0.5) {
        // Half star / partial
        starsHtml += '<i data-feather="star" class="star-icon star-icon--half" aria-hidden="true"></i>';
      } else {
        // Empty star
        starsHtml += '<i data-feather="star" class="star-icon star-icon--empty" aria-hidden="true"></i>';
      }
    }

    starsHtml += '</span>';
    return starsHtml;
  }

  /**
   * Convert catalog color names into distinct, representative swatch colors.
   * Product data uses descriptive names rather than CSS color keywords.
   */
  function colorNameToHex(colorName) {
    const name = String(colorName || '').toLowerCase().trim();
    const exact = {
      'onyx black': '#171717', 'cognac brown': '#874b2f',
      'honey sand': '#c9a86a', 'midnight navy': '#18243b',
      'vintage indigo': '#3f5682', 'washed charcoal': '#55575b',
      'camel': '#c19a6b', 'charcoal gray': '#44484d',
      'matte black': '#242424', 'olive moss': '#66704a',
      'ivory white': '#f5f0e6', 'sky blue': '#79a9ca', 'earthy sage': '#879779',
      'champagne': '#d8bf91', 'noir black': '#181818',
      'oatmeal heather': '#c8b99f', 'heather charcoal': '#5a5a5c', 'forest green': '#264c38',
      'washed white': '#f2f0eb', 'vintage faded black': '#444344',
      'emerald jewel': '#116b50', 'blush rose': '#c98991',
      'midnight black': '#111318', 'rich copper': '#a95f3b',
      'tuscan meadow': '#6e7848', 'riviera blue': '#397aa8',
      'charcoal': '#36454f', 'cream bone': '#e7ddc9',
      'mid vintage wash': '#55789a', 'deep indigo': '#263e63',
      'natural sand': '#c8ad83', 'terracotta': '#b96649',
      'caramel tan': '#a96f42', 'obsidian black': '#151719',
      'navy & gold': '#26324c', 'crimson & ivory': '#8d2738',
      'deep chestnut': '#5e352b', 'pitch black': '#101010',
      'tuscan espresso': '#493128', 'off-white chalk': '#eeeae1',
      'monochrome slate': '#58616b'
    };

    if (exact[name]) return exact[name];
    if (name.includes('black') || name.includes('obsidian') || name.includes('noir')) return '#1a1a1a';
    if (name.includes('navy') || name.includes('indigo')) return '#24385d';
    if (name.includes('blue')) return '#4f87ad';
    if (name.includes('green') || name.includes('sage') || name.includes('olive') || name.includes('moss')) return '#607451';
    if (name.includes('charcoal') || name.includes('gray') || name.includes('grey') || name.includes('slate')) return '#565d63';
    if (name.includes('white') || name.includes('ivory') || name.includes('cream') || name.includes('bone')) return '#f2eee5';
    if (name.includes('brown') || name.includes('chestnut') || name.includes('espresso')) return '#674236';
    if (name.includes('red') || name.includes('crimson') || name.includes('burgundy')) return '#8b263e';
    return '#9b8060';
  }

  /**
   * Helper to create a DOM element with classes and inner HTML
   * @param {string} tag
   * @param {string} className
   * @param {string} innerHTML
   * @returns {HTMLElement}
   */
  function createElement(tag, className = '', innerHTML = '') {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (innerHTML) {
      el.innerHTML = innerHTML;
    }
    return el;
  }

  /**
   * Smoothly scroll window to top
   * @param {boolean} smooth
   */
  function scrollToTop(smooth = true) {
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }

  /**
   * Format ISO date string into readable format (e.g. "February 14, 2026")
   * @param {string} dateStr
   * @returns {string}
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * Sanitize text against XSS when injecting strings
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    formatCurrency,
    debounce,
    throttle,
    slugify,
    getQueryParam,
    setQueryParam,
    truncateText,
    generateStarHTML,
    generateStarRating: generateStarHTML,
    colorNameToHex,
    createElement,
    scrollToTop,
    formatDate,
    escapeHTML
  };
})();
