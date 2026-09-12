/**
 * LUXE STORE - Account & Authentication Controller
 * Attaches to window.LuxeStore.Account
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Account = (function () {
  'use strict';

  const Notifications = window.LuxeStore.Notifications;

  function init() {
    setupPasswordToggles();
    setupLoginForm();
    setupRegisterForm();
    setupAccountNav();
    if (typeof feather !== 'undefined') feather.replace();
  }

  function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const targetId = this.dataset.target;
        const wrapper = this.closest('.input-with-toggle') || this.parentElement;
        const input = targetId ? document.getElementById(targetId) : wrapper.querySelector('input');
        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          this.innerHTML = '<i data-feather="eye-off"></i>';
          this.setAttribute('aria-label', 'Hide password');
          this.setAttribute('aria-pressed', 'true');
        } else {
          input.type = 'password';
          this.innerHTML = '<i data-feather="eye"></i>';
          this.setAttribute('aria-label', 'Show password');
          this.setAttribute('aria-pressed', 'false');
        }
        if (typeof feather !== 'undefined') feather.replace();
      });
    });
  }

  function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value;
      const pass = document.getElementById('login-password')?.value;

      if (!email || !pass) {
        if (Notifications) Notifications.showToast('Please enter both email and password', 'error');
        return;
      }

      if (Notifications) Notifications.showToast('Signing in...', 'info');
      setTimeout(() => {
        window.location.href = 'account.html';
      }, 800);
    });
  }

  function setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = document.getElementById('reg-password')?.value || '';
      const confirmPass = document.getElementById('reg-confirm-password')?.value || '';

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (!pass || !confirmPass) {
        if (Notifications) Notifications.showToast('Please enter and confirm your password', 'error');
        return;
      }

      if (pass !== confirmPass) {
        if (Notifications) Notifications.showToast('Passwords do not match', 'error');
        return;
      }

      if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}/.test(pass)) {
        if (Notifications) Notifications.showToast('Use at least 8 characters with letters, numbers, and a symbol', 'error');
        return;
      }

      if (Notifications) Notifications.showToast('Account created successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'account.html';
      }, 800);
    });
  }

  function setupAccountNav() {
    document.querySelectorAll('.account-nav__item a').forEach(link => {
      link.addEventListener('click', function (e) {
        const text = this.textContent.trim().toLowerCase();
        if (text === 'logout' || text === 'sign out') {
          e.preventDefault();
          if (Notifications) Notifications.showToast('Logged out successfully', 'info');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 800);
          return;
        }

        if (this.hash && document.querySelector(this.hash)) {
          document.querySelectorAll('.account-nav__link').forEach(navLink => {
            navLink.classList.toggle('account-nav__link--active', navLink === this);
            if (navLink === this) navLink.setAttribute('aria-current', 'page');
            else navLink.removeAttribute('aria-current');
          });
        }
      });
    });
  }

  return { init };
})();
