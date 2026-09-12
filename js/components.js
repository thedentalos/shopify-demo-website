/**
 * LUXE STORE - Modular Component Renderer
 * Attaches to window.LuxeStore.Components
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Components = (function () {
  'use strict';

  const Utils = window.LuxeStore.Utils;
  let productCardSwatchesBound = false;

  /**
   * Initialize shared layout components into placeholder elements
   * @param {string} activePage - e.g. 'home', 'shop', 'collections', 'about', 'contact', 'faq'
   */
  function init(activePage = '') {
    // Header placeholder
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      headerPlaceholder.innerHTML = renderHeader(activePage);
    }

    // Footer placeholder
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      footerPlaceholder.innerHTML = renderFooter();
    }

    // Inject shared global overlays & drawers into body if missing
    injectGlobalElements();
    setupProductCardSwatches();

    // Trigger feather icons replacement
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  function setupProductCardSwatches() {
    if (productCardSwatchesBound) return;
    productCardSwatchesBound = true;

    document.addEventListener('click', (event) => {
      const swatch = event.target.closest('.product-card__swatch');
      if (!swatch) return;

      const group = swatch.closest('.product-card__swatches');
      if (!group) return;
      group.querySelectorAll('.product-card__swatch').forEach(item => {
        item.classList.remove('product-card__swatch--active', 'is-active');
        item.setAttribute('aria-pressed', 'false');
      });
      swatch.classList.add('product-card__swatch--active', 'is-active');
      swatch.setAttribute('aria-pressed', 'true');
    });
  }

  /**
   * Append global modals and drawers if not already in the DOM
   */
  function injectGlobalElements() {
    if (!document.getElementById('site-overlay')) {
      document.body.insertAdjacentHTML('beforeend', renderOverlay());
    }
    if (!document.getElementById('mobile-menu-drawer')) {
      document.body.insertAdjacentHTML('beforeend', renderMobileMenu());
    }
    if (!document.getElementById('mini-cart-drawer')) {
      document.body.insertAdjacentHTML('beforeend', renderMiniCart());
    }
    if (!document.getElementById('search-overlay')) {
      document.body.insertAdjacentHTML('beforeend', renderSearchOverlay());
    }
    if (!document.getElementById('quick-view-modal')) {
      document.body.insertAdjacentHTML('beforeend', renderQuickViewModal());
    }
    if (!document.getElementById('toast-container')) {
      document.body.insertAdjacentHTML('beforeend', renderToastContainer());
    }
  }

  /**
   * Render Main Header with Announcement Bar & Mega Menu
   * @param {string} activePage
   * @returns {string} HTML markup
   */
  function renderHeader(activePage = '') {
    const isHome = activePage === 'home' || activePage === 'index';
    const isShop = activePage === 'shop' || activePage === 'products' || activePage === 'product';
    const isCollections = activePage === 'collections' || activePage === 'collection';
    const isAbout = activePage === 'about';
    const isContact = activePage === 'contact';
    const isFAQ = activePage === 'faq';

    return `
      <!-- Skip to Content Accessibility Link -->
      <a href="#main-content" class="skip-to-content">Skip to content</a>

      <!-- Announcement Bar -->
      <div id="announcement-bar" class="announcement-bar" role="region" aria-label="Announcement">
        <div class="announcement-bar__container">
          <p class="announcement-bar__text">
            Complimentary Worldwide Express Shipping on Orders Over $50 | Use Code: <strong>LUXE10</strong> for 10% Off
          </p>
          <button type="button" class="announcement-bar__close" id="announcement-close-btn" aria-label="Close announcement">
            <i data-feather="x" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Main Sticky Navigation Header -->
      <header class="header" id="main-header">
        <div class="header__container container">
          <!-- Mobile Menu Trigger -->
          <button type="button" class="header__icon-btn header__mobile-toggle" id="mobile-menu-open-btn" aria-label="Open mobile menu" aria-controls="mobile-menu-drawer" aria-expanded="false">
            <i data-feather="menu" aria-hidden="true"></i>
          </button>

          <!-- Store Branding / Logo -->
          <div class="header__brand">
            <a href="index.html" class="header__logo" aria-label="LUXE STORE Home">
              <span class="header__logo-text">LUXE</span>
              <span class="header__logo-tagline">Curated Fashion</span>
            </a>
          </div>

          <!-- Desktop Navigation -->
          <nav class="header__nav" aria-label="Main Navigation">
            <ul class="header__nav-list">
              <li class="header__nav-item">
                <a href="index.html" class="header__nav-link ${isHome ? 'header__nav-link--active' : ''}">Home</a>
              </li>

              <!-- Shop with Mega Menu -->
              <li class="header__nav-item header__nav-item--has-mega">
                <a href="products.html" class="header__nav-link ${isShop ? 'header__nav-link--active' : ''}" aria-haspopup="true" aria-expanded="false">
                  Shop <i data-feather="chevron-down" class="nav-chevron" aria-hidden="true"></i>
                </a>
                
                <!-- Mega Menu Dropdown -->
                <div class="mega-menu" role="region" aria-label="Shop categories">
                  <div class="mega-menu__container container">
                    <div class="mega-menu__column">
                      <h4 class="mega-menu__title">Apparel</h4>
                      <ul class="mega-menu__list">
                        <li><a href="products.html?category=Outerwear" class="mega-menu__link">Outerwear & Coats</a></li>
                        <li><a href="products.html?category=Tops" class="mega-menu__link">Tops & Blouses</a></li>
                        <li><a href="products.html?category=Dresses" class="mega-menu__link">Dresses & Gowns</a></li>
                        <li><a href="products.html?category=Bottoms" class="mega-menu__link">Trousers & Jeans</a></li>
                        <li><a href="products.html" class="mega-menu__link mega-menu__link--all">View All Apparel &rarr;</a></li>
                      </ul>
                    </div>

                    <div class="mega-menu__column">
                      <h4 class="mega-menu__title">Accessories & Shoes</h4>
                      <ul class="mega-menu__list">
                        <li><a href="products.html?category=Accessories" class="mega-menu__link">Bags & Leather Goods</a></li>
                        <li><a href="products.html?category=Accessories" class="mega-menu__link">Silk Scarves & Belts</a></li>
                        <li><a href="products.html?category=Footwear" class="mega-menu__link">Chelsea Boots</a></li>
                        <li><a href="products.html?category=Footwear" class="mega-menu__link">Minimalist Sneakers</a></li>
                        <li><a href="products.html?collection=summer-collection" class="mega-menu__link">Resort & Summer</a></li>
                      </ul>
                    </div>

                    <div class="mega-menu__column">
                      <h4 class="mega-menu__title">Collections</h4>
                      <ul class="mega-menu__list">
                        <li><a href="products.html?collection=new-arrivals" class="mega-menu__link">New Arrivals</a></li>
                        <li><a href="products.html?collection=best-sellers" class="mega-menu__link">Best Sellers</a></li>
                        <li><a href="products.html?collection=outerwear" class="mega-menu__link">The Outerwear Edit</a></li>
                        <li><a href="products.html?collection=sale" class="mega-menu__link mega-menu__link--sale">Archive Sale (Up to 30% Off)</a></li>
                        <li><a href="collections.html" class="mega-menu__link">All Collections &rarr;</a></li>
                      </ul>
                    </div>

                    <div class="mega-menu__column mega-menu__column--promo">
                      <div class="mega-menu__promo-card">
                        <img src="https://picsum.photos/seed/luxe-megamenu/400/280" alt="Spring Atelier Preview" class="mega-menu__promo-img" loading="lazy">
                        <div class="mega-menu__promo-content">
                          <span class="mega-menu__promo-tag">New Season</span>
                          <h5 class="mega-menu__promo-heading">Atelier Collection</h5>
                          <a href="products.html?collection=new-arrivals" class="btn btn--secondary btn--small">Explore Now</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li class="header__nav-item">
                <a href="collections.html" class="header__nav-link ${isCollections ? 'header__nav-link--active' : ''}">Collections</a>
              </li>
              <li class="header__nav-item">
                <a href="about.html" class="header__nav-link ${isAbout ? 'header__nav-link--active' : ''}">About</a>
              </li>
              <li class="header__nav-item">
                <a href="contact.html" class="header__nav-link ${isContact ? 'header__nav-link--active' : ''}">Contact</a>
              </li>
              <li class="header__nav-item">
                <a href="faq.html" class="header__nav-link ${isFAQ ? 'header__nav-link--active' : ''}">FAQ</a>
              </li>
            </ul>
          </nav>

          <!-- Utility Icons (Search, Account, Wishlist, Cart) -->
          <div class="header__utilities">
            <!-- Search Trigger -->
            <button type="button" class="header__icon-btn" id="search-open-btn" aria-label="Search products" aria-controls="search-overlay">
              <i data-feather="search" aria-hidden="true"></i>
            </button>

            <!-- Account Link -->
            <a href="account.html" class="header__icon-btn" aria-label="My Account">
              <i data-feather="user" aria-hidden="true"></i>
            </a>

            <!-- Wishlist Link -->
            <a href="wishlist.html" class="header__icon-btn header__wishlist-btn" aria-label="Wishlist">
              <i data-feather="heart" aria-hidden="true"></i>
              <span class="header__badge wishlist-count" id="wishlist-badge">0</span>
            </a>

            <!-- Mini Cart Trigger -->
            <button type="button" class="header__icon-btn header__cart-btn" id="mini-cart-open-btn" aria-label="Open Shopping Bag" aria-controls="mini-cart-drawer" aria-expanded="false">
              <i data-feather="shopping-bag" aria-hidden="true"></i>
              <span class="header__badge cart-count" id="cart-badge">0</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  /**
   * Render Footer with Newsletter, Columns & Payment Badges
   * @returns {string} HTML markup
   */
  function renderFooter() {
    return `
      <footer class="footer" id="main-footer">
        <!-- Newsletter Signup Section -->
        <section class="footer__newsletter" aria-labelledby="footer-newsletter-heading">
          <div class="container footer__newsletter-container">
            <div class="footer__newsletter-header">
              <span class="footer__newsletter-subtitle">Join The Atelier</span>
              <h3 id="footer-newsletter-heading" class="footer__newsletter-title">Subscribe to the LUXE Gazette</h3>
              <p class="footer__newsletter-desc">
                Receive private invitations to seasonal trunk shows, private sales, and 10% off your first acquisition.
              </p>
            </div>
            <form class="footer__newsletter-form newsletter-form" id="footer-newsletter-form" novalidate>
              <div class="newsletter-form__input-group">
                <input 
                  type="email" 
                  name="email" 
                  class="newsletter-form__input input" 
                  placeholder="Enter your email address" 
                  required 
                  aria-label="Email address for newsletter"
                >
                <button type="submit" class="btn btn--primary newsletter-form__btn">
                  <span>Subscribe</span>
                  <i data-feather="arrow-right" aria-hidden="true"></i>
                </button>
              </div>
              <p class="newsletter-form__privacy">By subscribing, you agree to our Privacy Policy. You may unsubscribe anytime.</p>
            </form>
          </div>
        </section>

        <!-- Main 4-Column Footer -->
        <div class="footer__main">
          <div class="container footer__grid">
            <!-- Brand & Info Column -->
            <div class="footer__col footer__col--brand">
              <a href="index.html" class="footer__logo">LUXE</a>
              <p class="footer__brand-tagline">
                Curated fashion and timeless lifestyle silhouettes for the uncompromising modern wardrobe.
              </p>
              <div class="footer__contact-info">
                <p><i data-feather="map-pin" aria-hidden="true"></i> 742 Evergreen Terrace, Suite 400, New York, NY</p>
                <p><i data-feather="phone" aria-hidden="true"></i> +1 (800) 555-LUXE</p>
                <p><i data-feather="mail" aria-hidden="true"></i> concierge@luxestore.com</p>
              </div>
              <div class="footer__socials" aria-label="Social media channels">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="footer__social-link" aria-label="Instagram"><i data-feather="instagram" aria-hidden="true"></i></a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="footer__social-link" aria-label="Facebook"><i data-feather="facebook" aria-hidden="true"></i></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="footer__social-link" aria-label="Twitter"><i data-feather="twitter" aria-hidden="true"></i></a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="footer__social-link" aria-label="YouTube"><i data-feather="youtube" aria-hidden="true"></i></a>
              </div>
            </div>

            <!-- Shop Links Column -->
            <div class="footer__col">
              <h4 class="footer__col-title">Shop Collection</h4>
              <ul class="footer__col-list">
                <li><a href="products.html?collection=new-arrivals" class="footer__col-link">New Arrivals</a></li>
                <li><a href="products.html?collection=best-sellers" class="footer__col-link">Best Sellers</a></li>
                <li><a href="products.html?category=Outerwear" class="footer__col-link">Outerwear & Coats</a></li>
                <li><a href="products.html?category=Dresses" class="footer__col-link">Dresses & Eveningwear</a></li>
                <li><a href="products.html?category=Accessories" class="footer__col-link">Fine Accessories</a></li>
                <li><a href="products.html?collection=sale" class="footer__col-link footer__col-link--sale">Archive Sale</a></li>
              </ul>
            </div>

            <!-- Customer Care Column -->
            <div class="footer__col">
              <h4 class="footer__col-title">Customer Care</h4>
              <ul class="footer__col-list">
                <li><a href="contact.html" class="footer__col-link">Concierge Services</a></li>
                <li><a href="faq.html" class="footer__col-link">Shipping & Delivery</a></li>
                <li><a href="faq.html" class="footer__col-link">Returns & Exchanges</a></li>
                <li><a href="faq.html" class="footer__col-link">Order Tracking</a></li>
                <li><a href="faq.html" class="footer__col-link">Sartorial Size Guide</a></li>
                <li><a href="faq.html" class="footer__col-link">Frequently Asked Questions</a></li>
              </ul>
            </div>

            <!-- Company Column -->
            <div class="footer__col">
              <h4 class="footer__col-title">The Atelier</h4>
              <ul class="footer__col-list">
                <li><a href="about.html" class="footer__col-link">Our Heritage</a></li>
                <li><a href="about.html" class="footer__col-link">Artisanal Craftsmanship</a></li>
                <li><a href="about.html" class="footer__col-link">Sustainable Philosophy</a></li>
                <li><a href="contact.html" class="footer__col-link">Press & Media</a></li>
                <li><a href="account.html" class="footer__col-link">Client Portal</a></li>
                <li><a href="contact.html" class="footer__col-link">Store Locations</a></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Bottom Policy & Copyright Bar -->
        <div class="footer__bottom">
          <div class="container footer__bottom-container">
            <p class="footer__copyright">&copy; ${new Date().getFullYear()} LUXE STORE Inc. All rights reserved. Curated with intention.</p>
            <div class="footer__payment-methods" aria-label="Supported Payment Methods">
              <span class="payment-badge" title="Visa">VISA</span>
              <span class="payment-badge" title="Mastercard">MC</span>
              <span class="payment-badge" title="American Express">AMEX</span>
              <span class="payment-badge" title="Apple Pay">Apple Pay</span>
              <span class="payment-badge" title="PayPal">PayPal</span>
            </div>
            <button type="button" class="footer__back-to-top" id="back-to-top-btn" aria-label="Scroll back to top">
              <span>Back to Top</span>
              <i data-feather="chevron-up" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </footer>
    `;
  }

  /**
   * Render Mobile Drawer Navigation
   * @returns {string} HTML markup
   */
  function renderMobileMenu() {
    return `
      <aside id="mobile-menu-drawer" class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu" aria-hidden="true">
        <div class="mobile-drawer__header">
          <span class="mobile-drawer__logo">LUXE</span>
          <button type="button" class="mobile-drawer__close" id="mobile-menu-close-btn" aria-label="Close mobile menu">
            <i data-feather="x" aria-hidden="true"></i>
          </button>
        </div>

        <div class="mobile-drawer__body">
          <!-- Mobile Search Bar -->
          <form class="mobile-drawer__search" action="search.html" method="GET">
            <div class="input-with-icon">
              <i data-feather="search" class="input-icon" aria-hidden="true"></i>
              <input type="search" name="q" placeholder="Search fashion, bags, boots..." class="input mobile-drawer__search-input" required>
            </div>
          </form>

          <!-- Nav Links Accordion -->
          <nav class="mobile-drawer__nav">
            <ul class="mobile-drawer__list">
              <li class="mobile-drawer__item"><a href="index.html" class="mobile-drawer__link">Home</a></li>
              
              <!-- Shop Accordion Group -->
              <li class="mobile-drawer__item mobile-drawer__item--accordion">
                <button type="button" class="mobile-drawer__accordion-toggle" aria-expanded="false">
                  <span>Shop Apparel</span>
                  <i data-feather="chevron-down" class="accordion-icon" aria-hidden="true"></i>
                </button>
                <div class="mobile-drawer__accordion-content">
                  <a href="products.html" class="mobile-drawer__sublink">All Products</a>
                  <a href="products.html?category=Outerwear" class="mobile-drawer__sublink">Outerwear & Coats</a>
                  <a href="products.html?category=Tops" class="mobile-drawer__sublink">Tops & Blouses</a>
                  <a href="products.html?category=Dresses" class="mobile-drawer__sublink">Dresses</a>
                  <a href="products.html?category=Bottoms" class="mobile-drawer__sublink">Trousers & Denim</a>
                  <a href="products.html?category=Accessories" class="mobile-drawer__sublink">Accessories</a>
                  <a href="products.html?category=Footwear" class="mobile-drawer__sublink">Footwear</a>
                </div>
              </li>

              <!-- Collections Group -->
              <li class="mobile-drawer__item mobile-drawer__item--accordion">
                <button type="button" class="mobile-drawer__accordion-toggle" aria-expanded="false">
                  <span>Collections</span>
                  <i data-feather="chevron-down" class="accordion-icon" aria-hidden="true"></i>
                </button>
                <div class="mobile-drawer__accordion-content">
                  <a href="collections.html" class="mobile-drawer__sublink">All Collections</a>
                  <a href="products.html?collection=new-arrivals" class="mobile-drawer__sublink">New Arrivals</a>
                  <a href="products.html?collection=best-sellers" class="mobile-drawer__sublink">Best Sellers</a>
                  <a href="products.html?collection=outerwear" class="mobile-drawer__sublink">The Outerwear Edit</a>
                  <a href="products.html?collection=sale" class="mobile-drawer__sublink mobile-drawer__sublink--sale">Archive Sale</a>
                </div>
              </li>

              <li class="mobile-drawer__item"><a href="about.html" class="mobile-drawer__link">About The Atelier</a></li>
              <li class="mobile-drawer__item"><a href="contact.html" class="mobile-drawer__link">Contact Concierge</a></li>
              <li class="mobile-drawer__item"><a href="faq.html" class="mobile-drawer__link">FAQ & Support</a></li>
              <li class="mobile-drawer__item"><a href="wishlist.html" class="mobile-drawer__link">Saved Items (<span class="wishlist-count">0</span>)</a></li>
              <li class="mobile-drawer__item"><a href="account.html" class="mobile-drawer__link">Account & Orders</a></li>
            </ul>
          </nav>
        </div>

        <div class="mobile-drawer__footer">
          <div class="mobile-drawer__contact">
            <p><i data-feather="phone" aria-hidden="true"></i> +1 (800) 555-LUXE</p>
            <p><i data-feather="mail" aria-hidden="true"></i> concierge@luxestore.com</p>
          </div>
          <div class="mobile-drawer__currency">
            <span>Currency: USD ($)</span>
          </div>
        </div>
      </aside>
    `;
  }

  /**
   * Render Mini Cart Slide-In Drawer
   * @returns {string} HTML markup
   */
  function renderMiniCart() {
    return `
      <aside id="mini-cart-drawer" class="mini-cart-drawer" role="dialog" aria-modal="true" aria-label="Your Shopping Bag" aria-hidden="true">
        <div class="mini-cart__header">
          <h3 class="mini-cart__title">
            Your Shopping Bag (<span class="cart-count">0</span>)
          </h3>
          <button type="button" class="mini-cart__close" id="mini-cart-close-btn" aria-label="Close Shopping Bag">
            <i data-feather="x" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Free Shipping Threshold Indicator -->
        <div class="mini-cart__shipping-bar" id="mini-cart-shipping-bar">
          <div class="shipping-bar__message" id="shipping-bar-message">
            Add <strong>$50.00</strong> more to unlock <strong>Complimentary Shipping</strong>
          </div>
          <div class="shipping-bar__progress-track">
            <div class="shipping-bar__progress-fill" id="shipping-progress-fill" style="width: 0%"></div>
          </div>
        </div>

        <!-- Scrollable Cart Item List -->
        <div class="mini-cart__items-container" id="mini-cart-items">
          <!-- Populated by LuxeStore.Cart.renderMiniCartItems() -->
        </div>

        <!-- Cart Drawer Footer -->
        <div class="mini-cart__footer" id="mini-cart-footer">
          <div class="mini-cart__summary-row">
            <span class="mini-cart__subtotal-label">Subtotal</span>
            <span class="mini-cart__subtotal-val" id="mini-cart-subtotal">$0.00</span>
          </div>
          <p class="mini-cart__taxes-note">Shipping, taxes, and discounts calculated at checkout.</p>
          <div class="mini-cart__actions">
            <a href="checkout.html" class="btn btn--primary btn--full mini-cart__checkout-btn">Proceed to Checkout</a>
            <a href="cart.html" class="btn btn--secondary btn--full mini-cart__view-btn">View Full Bag</a>
          </div>
        </div>
      </aside>
    `;
  }

  /**
   * Render Search Overlay
   * @returns {string} HTML markup
   */
  function renderSearchOverlay() {
    return `
      <div id="search-overlay" class="search-overlay" role="dialog" aria-modal="true" aria-label="Search Products" aria-hidden="true">
        <div class="search-overlay__container container">
          <div class="search-overlay__header">
            <form class="search-overlay__form" id="search-overlay-form" action="search.html" method="GET">
              <i data-feather="search" class="search-overlay__icon" aria-hidden="true"></i>
              <input 
                type="search" 
                name="q" 
                id="search-input" 
                class="search-overlay__input" 
                placeholder="Search cashmere, leather jackets, dresses..." 
                autocomplete="off"
                aria-label="Search store products"
              >
              <button type="button" class="search-overlay__clear" id="search-clear-btn" aria-label="Clear search input">
                <i data-feather="x" aria-hidden="true"></i>
              </button>
            </form>
            <button type="button" class="search-overlay__close" id="search-overlay-close-btn" aria-label="Close search overlay">
              <span>Esc</span>
              <i data-feather="x" aria-hidden="true"></i>
            </button>
          </div>

          <!-- Live Instant Search Results Container -->
          <div class="search-overlay__content">
            <!-- Search Suggestions / Trending Searches -->
            <div class="search-overlay__suggestions" id="search-trending-tags">
              <h4 class="search-overlay__section-title">Trending Searches</h4>
              <div class="search-tags">
                <button type="button" class="search-tag" data-term="Leather Jacket">Leather Jacket</button>
                <button type="button" class="search-tag" data-term="Cashmere">Cashmere</button>
                <button type="button" class="search-tag" data-term="Trench Coat">Trench Coat</button>
                <button type="button" class="search-tag" data-term="Linen">Linen</button>
                <button type="button" class="search-tag" data-term="Silk Blouse">Silk Blouse</button>
                <button type="button" class="search-tag" data-term="Chelsea Boots">Chelsea Boots</button>
              </div>
            </div>

            <!-- Recent Searches -->
            <div class="search-overlay__history" id="search-history-container" style="display: none;">
              <div class="search-overlay__history-header">
                <h4 class="search-overlay__section-title">Recent Searches</h4>
                <button type="button" class="search-clear-history-btn" id="search-clear-history-btn">Clear</button>
              </div>
              <div class="search-tags" id="search-history-tags"></div>
            </div>

            <!-- Live Matched Products -->
            <div class="search-overlay__results" id="search-live-results">
              <!-- Rendered dynamically by LuxeStore.Search -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Quick View Modal
   * @returns {string} HTML markup
   */
  function renderQuickViewModal() {
    return `
      <div id="quick-view-modal" class="modal quick-view-modal" role="dialog" aria-modal="true" aria-label="Quick Product View" aria-hidden="true">
        <div class="modal__dialog quick-view-modal__dialog">
          <button type="button" class="modal__close" id="quick-view-close-btn" aria-label="Close product preview">
            <i data-feather="x" aria-hidden="true"></i>
          </button>
          <div class="quick-view-modal__body" id="quick-view-body">
            <!-- Populated dynamically by LuxeStore.QuickView -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Global Backdrop Overlay
   * @returns {string} HTML markup
   */
  function renderOverlay() {
    return `<div id="site-overlay" class="site-overlay" aria-hidden="true"></div>`;
  }

  /**
   * Render Toast Notifications Container
   * @returns {string} HTML markup
   */
  function renderToastContainer() {
    return `<div id="toast-container" class="toast-container" aria-live="polite" aria-atomic="true"></div>`;
  }

  function getSwatchColor(name) {
    return Utils && Utils.colorNameToHex ? Utils.colorNameToHex(name) : '#9b8060';
  }

  /**
   * Render Product Card Component (BEM)
   * @param {Object} product
   * @returns {string} HTML markup
   */
  function renderProductCard(product) {
    if (!product) return '';

    const priceFormatted = Utils.formatCurrency(product.price);
    const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
    const comparePriceFormatted = isOnSale ? Utils.formatCurrency(product.compareAtPrice) : '';
    const discountPercent = isOnSale ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

    const img1 = (product.images && product.images[0]) ? product.images[0] : 'https://picsum.photos/seed/placeholder/600/800';
    const img2 = (product.images && product.images[1]) ? product.images[1] : img1;

    // Badges
    let badgeHtml = '';
    if (isOnSale) {
      badgeHtml += `<span class="product-badge product-badge--sale">-${discountPercent}%</span>`;
    }
    if (product.newArrival) {
      badgeHtml += `<span class="product-badge product-badge--new">New</span>`;
    } else if (product.bestSeller) {
      badgeHtml += `<span class="product-badge product-badge--bestseller">Best Seller</span>`;
    }

    // Color Swatches
    const colorOption = (product.options || []).find(o => o.name.toLowerCase() === 'color');
    let swatchesHtml = '';
    if (colorOption && Array.isArray(colorOption.values) && colorOption.values.length > 0) {
      swatchesHtml = `<div class="product-card__swatches" aria-label="Available colors">`;
      colorOption.values.slice(0, 4).forEach((val, idx) => {
        const activeClass = idx === 0 ? 'product-card__swatch--active is-active' : '';
        const bg = getSwatchColor(val);
        swatchesHtml += `<button type="button" class="product-card__swatch ${activeClass}" data-color="${Utils.escapeHTML(val)}" style="background-color: ${bg};" title="${Utils.escapeHTML(val)}" aria-label="Select ${Utils.escapeHTML(val)}" aria-pressed="${idx === 0 ? 'true' : 'false'}"></button>`;
      });
      if (colorOption.values.length > 4) {
        swatchesHtml += `<span class="product-card__swatch-more">+${colorOption.values.length - 4}</span>`;
      }
      swatchesHtml += `</div>`;
    }

    const isWishlisted = window.LuxeStore.Wishlist && typeof window.LuxeStore.Wishlist.isInWishlist === 'function' && window.LuxeStore.Wishlist.isInWishlist(product.id);

    return `
      <article class="product-card" data-product-id="${product.id}">
        <!-- Media / Image Container -->
        <div class="product-card__media">
          <div class="product-card__badges">
            ${badgeHtml}
          </div>

          <a href="product.html?id=${product.id}" class="product-card__image-link" aria-label="${Utils.escapeHTML(product.title)}">
            <img 
              src="${img1}" 
              alt="${Utils.escapeHTML(product.title)}" 
              class="product-card__img product-card__img--primary" 
              loading="lazy"
            >
            <img 
              src="${img2}" 
              alt="${Utils.escapeHTML(product.title)} alternate angle" 
              class="product-card__img product-card__img--secondary" 
              loading="lazy"
            >
          </a>

          <!-- Wishlist Toggle Heart -->
          <button 
            type="button" 
            class="product-card__wishlist-btn ${isWishlisted ? 'product-card__wishlist-btn--active' : ''}" 
            data-action="toggle-wishlist" 
            data-product-id="${product.id}" 
            aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
            aria-pressed="${isWishlisted ? 'true' : 'false'}"
            title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
          >
            <i data-feather="heart" class="wishlist-icon" aria-hidden="true"></i>
          </button>

          <!-- Quick View Trigger -->
          <button 
            type="button" 
            class="product-card__quick-view-btn" 
            data-action="quick-view" 
            data-product-id="${product.id}" 
            aria-label="Quick preview ${Utils.escapeHTML(product.title)}"
          >
            <i data-feather="eye" aria-hidden="true"></i>
            <span>Quick View</span>
          </button>
        </div>

        <!-- Product Content -->
        <div class="product-card__info">
          <span class="product-card__vendor">${Utils.escapeHTML(product.vendor || 'LUXE')}</span>
          <h3 class="product-card__title">
            <a href="product.html?id=${product.id}">${Utils.escapeHTML(product.title)}</a>
          </h3>

          <!-- Star Rating -->
          <div class="product-card__rating">
            ${Utils.generateStarHTML(product.rating)}
            <span class="product-card__review-count">(${product.reviewCount || 0})</span>
          </div>

          <!-- Pricing -->
          <div class="product-card__price-row">
            <span class="product-card__price ${isOnSale ? 'product-card__price--sale' : ''}">
              ${priceFormatted}
            </span>
            ${isOnSale ? `<span class="product-card__compare-price">${comparePriceFormatted}</span>` : ''}
          </div>

          <!-- Swatches -->
          ${swatchesHtml}
        </div>
      </article>
    `;
  }

  /**
   * Render Breadcrumb Navigation
   * @param {Array<{label: string, url: string}>} items
   * @returns {string} HTML markup
   */
  function renderBreadcrumb(items = []) {
    if (!Array.isArray(items) || items.length === 0) return '';

    let breadcrumbsHtml = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <div class="container">
          <ol class="breadcrumb__list" itemscope itemtype="https://schema.org/BreadcrumbList">
            <li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
              <a href="index.html" class="breadcrumb__link" itemprop="item">
                <span itemprop="name">Home</span>
              </a>
              <meta itemprop="position" content="1" />
              <i data-feather="chevron-right" class="breadcrumb__separator" aria-hidden="true"></i>
            </li>
    `;

    items.forEach((item, index) => {
      const position = index + 2;
      const isLast = index === items.length - 1;

      if (isLast) {
        breadcrumbsHtml += `
          <li class="breadcrumb__item breadcrumb__item--current" aria-current="page" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span itemprop="name">${Utils.escapeHTML(item.label)}</span>
            <meta itemprop="position" content="${position}" />
          </li>
        `;
      } else {
        breadcrumbsHtml += `
          <li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a href="${item.url || '#'}" class="breadcrumb__link" itemprop="item">
              <span itemprop="name">${Utils.escapeHTML(item.label)}</span>
            </a>
            <meta itemprop="position" content="${position}" />
            <i data-feather="chevron-right" class="breadcrumb__separator" aria-hidden="true"></i>
          </li>
        `;
      }
    });

    breadcrumbsHtml += `
          </ol>
        </div>
      </nav>
    `;

    return breadcrumbsHtml;
  }

  return {
    init,
    renderHeader,
    renderFooter,
    renderMobileMenu,
    renderMiniCart,
    renderSearchOverlay,
    renderQuickViewModal,
    renderOverlay,
    renderToastContainer,
    renderProductCard,
    renderBreadcrumb
  };
})();
