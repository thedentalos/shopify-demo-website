/**
 * LUXE STORE - Newsletter Subscription Controller
 * Attaches to window.LuxeStore.Newsletter
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Newsletter = (function () {
  'use strict';

  const STORAGE_KEY = 'luxe_subscribed_emails';

  /**
   * Validate standard email regex
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase().trim());
  }

  /**
   * Get subscribed emails from localStorage
   * @returns {Array<string>}
   */
  function getSubscribers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Handle newsletter form submission
   * @param {Event} e
   */
  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input[type="email"]');
    if (!input) return;

    const email = input.value.trim();

    if (!isValidEmail(email)) {
      if (window.LuxeStore.Notifications) {
        window.LuxeStore.Notifications.showToast('Please enter a valid email address.', 'warning');
      }
      input.focus();
      return;
    }

    const subscribers = getSubscribers();
    if (subscribers.includes(email.toLowerCase())) {
      if (window.LuxeStore.Notifications) {
        window.LuxeStore.Notifications.showToast('You are already subscribed to the LUXE Gazette!', 'info');
      }
      form.reset();
      return;
    }

    // Save subscriber
    subscribers.push(email.toLowerCase());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers));
    } catch (err) {}

    // Show promotional welcome notification
    if (window.LuxeStore.Notifications) {
      window.LuxeStore.Notifications.showToast('Welcome to the Atelier! Use code LUXE10 for 10% off your order.', 'success', 5000);
    }

    form.reset();
  }

  /**
   * Initialize all newsletter forms on the page
   */
  function init() {
    document.querySelectorAll('.newsletter-form').forEach(form => {
      form.removeEventListener('submit', handleSubmit);
      form.addEventListener('submit', handleSubmit);
    });
  }

  return {
    isValidEmail,
    handleSubmit,
    init
  };
})();
