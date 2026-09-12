/**
 * LUXE STORE - Home Page Controller
 * Attaches to window.LuxeStore.Home
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Home = (function () {
  'use strict';

  const Data = window.LuxeStore.Data;
  const Components = window.LuxeStore.Components;
  const Utils = window.LuxeStore.Utils;

  let _sliderInterval = null;
  let _currentSlideIndex = 0;
  let _banners = [];

  async function init() {
    try {
      await Promise.all([
        initHeroSlider(),
        renderFeaturedCollections(),
        renderNewArrivals(),
        renderBestSellers()
      ]);
      initCarouselNavigation();
      if (typeof feather !== 'undefined') feather.replace();
    } catch (err) {
      console.error('[LuxeStore.Home] Error initializing home page:', err);
    }
  }

  async function initHeroSlider() {
    const track = document.getElementById('hero-slider-track');
    const dotsContainer = document.getElementById('hero-dots');
    if (!track) return;

    try {
      _banners = await Data.getBanners();
    } catch (e) {
      _banners = [];
    }

    if (!_banners || _banners.length === 0) return;

    track.innerHTML = _banners.map((banner, i) => `
      <div class="hero-slide" style="background-image: url('${banner.image}');" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${_banners.length}">
        <div class="hero-slide__overlay"></div>
        <div class="hero-slide__content ${banner.textPosition === 'left' ? 'text-left' : 'text-center'}">
          <h1 class="hero-slide__title">${Utils ? Utils.escapeHTML(banner.title) : banner.title}</h1>
          <p class="hero-slide__subtitle">${Utils ? Utils.escapeHTML(banner.subtitle) : banner.subtitle}</p>
          <a href="${banner.ctaLink || 'products.html'}" class="btn btn--accent btn--lg">${Utils ? Utils.escapeHTML(banner.cta) : banner.cta}</a>
        </div>
      </div>
    `).join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = _banners.map((_, i) => `
        <button class="hero-slider__dot ${i === 0 ? 'hero-slider__dot--active' : ''}" data-slide-index="${i}" aria-label="Go to slide ${i + 1}"></button>
      `).join('');

      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.hero-slider__dot');
        if (!dot) return;
        goToSlide(parseInt(dot.dataset.slideIndex, 10));
        resetSliderTimer();
      });
    }

    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetSliderTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetSliderTimer();
      });
    }

    startSliderTimer();

    const sliderContainer = document.getElementById('hero-slider');
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', () => clearInterval(_sliderInterval));
      sliderContainer.addEventListener('mouseleave', () => startSliderTimer());
    }
  }

  function goToSlide(index) {
    if (!_banners || _banners.length === 0) return;
    const track = document.getElementById('hero-slider-track');
    if (!track) return;

    _currentSlideIndex = (index + _banners.length) % _banners.length;
    track.style.transform = `translateX(-${_currentSlideIndex * 100}%)`;

    const dots = document.querySelectorAll('.hero-slider__dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('hero-slider__dot--active', idx === _currentSlideIndex);
    });
  }

  function nextSlide() {
    goToSlide(_currentSlideIndex + 1);
  }

  function prevSlide() {
    goToSlide(_currentSlideIndex - 1);
  }

  function startSliderTimer() {
    clearInterval(_sliderInterval);
    _sliderInterval = setInterval(nextSlide, 5500);
  }

  function resetSliderTimer() {
    clearInterval(_sliderInterval);
    startSliderTimer();
  }

  async function renderFeaturedCollections() {
    const container = document.getElementById('featured-collections');
    if (!container) return;

    const collections = await Data.getCollections();
    const featured = collections.slice(0, 4);

    container.innerHTML = featured.map(col => `
      <a href="collection.html?id=${col.id}" class="collection-card" aria-label="Explore ${Utils.escapeHTML(col.title)} collection">
        <img src="${col.image}" alt="${col.title}" class="collection-card__image" loading="lazy">
        <div class="collection-card__overlay" aria-hidden="true"></div>
        <div class="collection-card__content">
          <p class="collection-card__count">${col.productIds ? col.productIds.length : 0} Products</p>
          <h3 class="collection-card__title">${col.title}</h3>
          <span class="collection-card__link">Shop Collection <i data-feather="arrow-right" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i></span>
        </div>
      </a>
    `).join('');
  }

  async function renderNewArrivals() {
    const track = document.getElementById('new-arrivals-track');
    if (!track) return;

    const products = await Data.getProducts();
    const newItems = products.filter(p => p.newArrival || p.featured).slice(0, 8);

    track.innerHTML = newItems.map(prod => Components.renderProductCard(prod)).join('');
  }

  async function renderBestSellers() {
    const grid = document.getElementById('best-sellers-grid');
    if (!grid) return;

    const products = await Data.getProducts();
    const bestSellers = products.filter(p => p.bestSeller).slice(0, 4);

    grid.innerHTML = bestSellers.map(prod => Components.renderProductCard(prod)).join('');
  }

  function initCarouselNavigation() {
    const controls = [
      { button: document.getElementById('new-arrivals-prev'), target: 'new-arrivals-track', direction: -1 },
      { button: document.getElementById('new-arrivals-next'), target: 'new-arrivals-track', direction: 1 }
    ];

    document.querySelectorAll('.product-carousel__arrow[data-carousel]').forEach(btn => {
      controls.push({
        button: btn,
        target: btn.dataset.carousel,
        direction: btn.classList.contains('product-carousel__arrow--prev') ? -1 : 1
      });
    });

    controls.forEach(({ button, target, direction }) => {
      const btn = button;
      if (!btn) return;
      btn.addEventListener('click', function () {
        const track = document.getElementById(target);
        if (!track) return;

        const scrollAmount = track.clientWidth * 0.75;
        track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
      });
    });
  }

  return { init };
})();
