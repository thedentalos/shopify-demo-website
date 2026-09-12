/**
 * LUXE STORE - Main Application Bootstrap
 * Initializes components and routes to page controllers
 */
document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const Luxe = window.LuxeStore;
  if (!Luxe) {
    console.error('LuxeStore namespace not loaded');
    return;
  }

  const path = window.location.pathname;
  let pageName = path.split('/').pop().replace('.html', '').toLowerCase();
  if (!pageName || pageName === '') pageName = 'index';

  const navMap = {
    'index': 'home',
    'products': 'shop',
    'product': 'shop',
    'collections': 'collections',
    'collection': 'collections',
    'about': 'about',
    'contact': 'contact',
    'faq': 'faq'
  };

  const activeNav = navMap[pageName] || '';

  if (pageName !== 'checkout' && Luxe.Components && typeof Luxe.Components.init === 'function') {
    Luxe.Components.init(activeNav);
  }

  if (Luxe.Header && typeof Luxe.Header.init === 'function') Luxe.Header.init();
  if (Luxe.Cart && typeof Luxe.Cart.init === 'function') Luxe.Cart.init();
  if (Luxe.Wishlist && typeof Luxe.Wishlist.init === 'function') Luxe.Wishlist.init();
  if (Luxe.Notifications && typeof Luxe.Notifications.init === 'function') Luxe.Notifications.init();
  if (Luxe.Newsletter && typeof Luxe.Newsletter.init === 'function') Luxe.Newsletter.init();
  if (Luxe.Search && typeof Luxe.Search.init === 'function') Luxe.Search.init();
  if (Luxe.QuickView && typeof Luxe.QuickView.init === 'function') Luxe.QuickView.init();

  switch (pageName) {
    case 'index':
      if (Luxe.Home) Luxe.Home.init();
      break;

    case 'products':
    case 'collection':
      if (Luxe.Products) Luxe.Products.init();
      break;

    case 'collections':
      if (Luxe.Products && typeof Luxe.Products.initCollectionsDirectory === 'function') {
        Luxe.Products.initCollectionsDirectory();
      }
      break;

    case 'product':
      if (Luxe.ProductDetail) Luxe.ProductDetail.init();
      break;

    case 'cart':
      if (Luxe.Cart && typeof Luxe.Cart.renderCartPage === 'function') {
        Luxe.Cart.renderCartPage();
      }
      break;

    case 'checkout':
      if (Luxe.Checkout) Luxe.Checkout.init();
      break;

    case 'search':
      if (Luxe.Search && typeof Luxe.Search.renderSearchPage === 'function') {
        Luxe.Search.renderSearchPage();
      }
      break;

    case 'wishlist':
      if (Luxe.Wishlist && typeof Luxe.Wishlist.renderWishlistPage === 'function') {
        Luxe.Wishlist.renderWishlistPage();
      }
      break;

    case 'faq':
      if (Luxe.FAQ) Luxe.FAQ.init();
      break;

    case 'contact':
      setupContactForm(Luxe);
      break;

    case 'login':
    case 'register':
    case 'account':
      if (Luxe.Account) Luxe.Account.init();
      break;
  }

  if (typeof feather !== 'undefined') {
    feather.replace();
  }
});

function setupContactForm(Luxe) {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (Luxe.Notifications) {
      Luxe.Notifications.showToast('Thank you — your message has been sent. An advisor will respond within 24 business hours.', 'success');
    }
    form.reset();
  });
}
