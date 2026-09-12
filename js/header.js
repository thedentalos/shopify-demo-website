/**
 * LUXE STORE - Header, Navigation & Global Shell Controller
 * Attaches to window.LuxeStore.Header
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Header = (function () {
  'use strict';

  const ANNOUNCEMENT_SESSION_KEY = 'luxe_announcement_dismissed';
  let lastScrollY = window.scrollY || 0;

  /**
   * Sticky header scroll listener
   */
  function handleScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;

    const currentScrollY = window.scrollY || 0;

    if (currentScrollY > 60) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    // Scroll Direction Hide / Show effect (sticky reveal)
    if (currentScrollY > 200 && currentScrollY > lastScrollY) {
      // Scrolling down
      header.classList.add('header--hidden');
    } else {
      // Scrolling up
      header.classList.remove('header--hidden');
    }

    lastScrollY = currentScrollY;
  }

  /**
   * Mobile menu drawer toggle
   * @param {boolean|null} forceOpen
   */
  function toggleMobileMenu(forceOpen = null) {
    const drawer = document.getElementById('mobile-menu-drawer');
    const overlay = document.getElementById('site-overlay');
    const toggleBtn = document.getElementById('mobile-menu-open-btn');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('mobile-drawer--open');
    const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;

    if (shouldOpen) {
      drawer.classList.add('mobile-drawer--open');
      drawer.setAttribute('aria-hidden', 'false');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
      if (overlay) overlay.classList.add('site-overlay--visible');
      document.body.classList.add('body-lock');
    } else {
      drawer.classList.remove('mobile-drawer--open');
      drawer.setAttribute('aria-hidden', 'true');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.classList.remove('site-overlay--visible');
      document.body.classList.remove('body-lock');
    }
  }

  /**
   * Search overlay toggle
   * @param {boolean|null} forceOpen
   */
  function toggleSearchOverlay(forceOpen = null) {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;

    const isOpen = overlay.classList.contains('search-overlay--open');
    const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;

    if (shouldOpen) {
      overlay.classList.add('search-overlay--open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('body-lock');
      const input = document.getElementById('search-input');
      if (input) {
        setTimeout(() => input.focus(), 150);
      }
    } else {
      overlay.classList.remove('search-overlay--open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('body-lock');
    }
  }

  /**
   * Close all active slide-ins and modals
   */
  function closeAllDrawers() {
    toggleMobileMenu(false);
    toggleSearchOverlay(false);
    if (window.LuxeStore.Cart) {
      window.LuxeStore.Cart.toggleMiniCart(false);
    }
    if (window.LuxeStore.QuickView) {
      window.LuxeStore.QuickView.close();
    }
    const overlay = document.getElementById('site-overlay');
    if (overlay) {
      overlay.classList.remove('site-overlay--visible');
    }
    document.body.classList.remove('body-lock');
  }

  /**
   * Dismiss the top announcement bar
   */
  function dismissAnnouncement() {
    const bar = document.getElementById('announcement-bar');
    if (bar) {
      bar.style.display = 'none';
      try {
        sessionStorage.setItem(ANNOUNCEMENT_SESSION_KEY, 'true');
      } catch (e) {}
    }
  }

  /**
   * Check if announcement bar was dismissed previously in session
   */
  function checkAnnouncementState() {
    try {
      const isDismissed = sessionStorage.getItem(ANNOUNCEMENT_SESSION_KEY) === 'true';
      if (isDismissed) {
        const bar = document.getElementById('announcement-bar');
        if (bar) bar.style.display = 'none';
      }
    } catch (e) {}
  }

  /**
   * Initialize event handlers
   */
  function init() {
    checkAnnouncementState();

    // Scroll throttler
    if (window.LuxeStore.Utils && window.LuxeStore.Utils.throttle) {
      window.addEventListener('scroll', window.LuxeStore.Utils.throttle(handleScroll, 100));
    } else {
      window.addEventListener('scroll', handleScroll);
    }

    // Announcement bar close
    const announceClose = document.getElementById('announcement-close-btn');
    if (announceClose) {
      announceClose.addEventListener('click', dismissAnnouncement);
    }

    // Mobile menu open / close
    const mobileOpen = document.getElementById('mobile-menu-open-btn');
    if (mobileOpen) {
      mobileOpen.addEventListener('click', () => toggleMobileMenu(true));
    }

    const mobileClose = document.getElementById('mobile-menu-close-btn');
    if (mobileClose) {
      mobileClose.addEventListener('click', () => toggleMobileMenu(false));
    }

    // Mobile drawer accordion toggles
    document.addEventListener('click', function (e) {
      const accToggle = e.target.closest('.mobile-drawer__accordion-toggle');
      if (accToggle) {
        e.preventDefault();
        const parent = accToggle.closest('.mobile-drawer__item--accordion');
        if (parent) {
          const isExpanded = parent.classList.toggle('mobile-drawer__item--expanded');
          accToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        }
      }
    });

    // Search overlay open / close
    const searchOpen = document.getElementById('search-open-btn');
    if (searchOpen) {
      searchOpen.addEventListener('click', () => toggleSearchOverlay(true));
    }

    const searchClose = document.getElementById('search-overlay-close-btn');
    if (searchClose) {
      searchClose.addEventListener('click', () => toggleSearchOverlay(false));
    }

    // Backdrop overlay click closes all drawers
    const overlay = document.getElementById('site-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeAllDrawers);
    }

    // Escape key closes modals and drawers
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllDrawers();
      }
    });

    // Back to top button
    document.addEventListener('click', function (e) {
      const bttBtn = e.target.closest('#back-to-top-btn');
      if (bttBtn) {
        e.preventDefault();
        if (window.LuxeStore.Utils) {
          window.LuxeStore.Utils.scrollToTop(true);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }

  return {
    toggleMobileMenu,
    toggleSearchOverlay,
    closeAllDrawers,
    dismissAnnouncement,
    init
  };
})();
