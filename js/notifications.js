/**
 * LUXE STORE - Toast Notifications Module
 * Attaches to window.LuxeStore.Notifications
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Notifications = (function () {
  'use strict';

  const DEFAULT_DURATION = 3500;

  /**
   * Display a floating toast notification
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration (in ms)
   */
  function showToast(message, type = 'success', duration = DEFAULT_DURATION) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    // Icon based on type
    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    else if (type === 'warning') iconName = 'alert-triangle';
    else if (type === 'info') iconName = 'info';

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
      <div class="toast__icon">
        <i data-feather="${iconName}" aria-hidden="true"></i>
      </div>
      <div class="toast__message">${message}</div>
      <button type="button" class="toast__close" aria-label="Dismiss notification">
        <i data-feather="x" aria-hidden="true"></i>
      </button>
      <div class="toast__progress" style="animation-duration: ${duration}ms"></div>
    `;

    container.appendChild(toast);

    if (typeof feather !== 'undefined') {
      feather.replace();
    }

    // Request animation frame for slide-in transition
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });

    // Auto remove timer
    const autoDismissTimer = setTimeout(() => {
      removeToast(toast);
    }, duration);

    // Manual close button
    const closeBtn = toast.querySelector('.toast__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        clearTimeout(autoDismissTimer);
        removeToast(toast);
      });
    }
  }

  /**
   * Smoothly dismiss and remove toast element from DOM
   * @param {HTMLElement} toastEl
   */
  function removeToast(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;
    toastEl.classList.remove('toast--visible');
    toastEl.classList.add('toast--leaving');

    toastEl.addEventListener('transitionend', () => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, { once: true });

    // Fallback if transitionend fails to fire
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 400);
  }

  /**
   * Initialize notification system
   */
  function init() {
    // Global delegated close for any dynamically added toasts
    document.addEventListener('click', function (e) {
      const closeBtn = e.target.closest('.toast__close');
      if (closeBtn) {
        const toast = closeBtn.closest('.toast');
        if (toast) removeToast(toast);
      }
    });
  }

  return {
    showToast,
    removeToast,
    init
  };
})();
