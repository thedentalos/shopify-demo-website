/**
 * LUXE STORE - Data Management & API Query Module
 * Attaches to window.LuxeStore.Data
 */
window.LuxeStore = window.LuxeStore || {};

window.LuxeStore.Data = (function () {
  'use strict';

  // In-memory cache
  let _productsCache = null;
  let _collectionsCache = null;
  let _reviewsCache = null;
  let _bannersCache = null;
  let _siteConfigCache = null;

  /**
   * Determine relative path to data directory
   */
  function getDataPath(file) {
    return 'data/' + file;
  }

  /**
   * Generic fetch wrapper with caching
   * @param {string} endpoint
   * @returns {Promise<any>}
   */
  async function fetchData(endpoint) {
    try {
      const response = await fetch(getDataPath(endpoint));
      if (!response.ok) {
        throw new Error(`Failed to load ${endpoint}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[LuxeStore.Data] Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all products (cached)
   * @returns {Promise<Array>}
   */
  async function getProducts() {
    if (_productsCache) return _productsCache;
    try {
      _productsCache = await fetchData('products.json');
      return _productsCache;
    } catch (err) {
      console.error('[LuxeStore.Data] Could not load products', err);
      return [];
    }
  }

  /**
   * Get all collections (cached)
   * @returns {Promise<Array>}
   */
  async function getCollections() {
    if (_collectionsCache) return _collectionsCache;
    try {
      _collectionsCache = await fetchData('collections.json');
      return _collectionsCache;
    } catch (err) {
      console.error('[LuxeStore.Data] Could not load collections', err);
      return [];
    }
  }

  /**
   * Get all reviews (cached)
   * @returns {Promise<Array>}
   */
  async function getReviews() {
    if (_reviewsCache) return _reviewsCache;
    try {
      _reviewsCache = await fetchData('reviews.json');
      return _reviewsCache;
    } catch (err) {
      console.error('[LuxeStore.Data] Could not load reviews', err);
      return [];
    }
  }

  /**
   * Get all banner slides (cached)
   * @returns {Promise<Array>}
   */
  async function getBanners() {
    if (_bannersCache) return _bannersCache;
    try {
      _bannersCache = await fetchData('banners.json');
      return _bannersCache;
    } catch (err) {
      console.error('[LuxeStore.Data] Could not load banners', err);
      return [];
    }
  }

  /**
   * Get site configuration (cached)
   * @returns {Promise<Object>}
   */
  async function getSiteConfig() {
    if (_siteConfigCache) return _siteConfigCache;
    try {
      _siteConfigCache = await fetchData('site-config.json');
      return _siteConfigCache;
    } catch (err) {
      console.error('[LuxeStore.Data] Could not load site config', err);
      return {};
    }
  }

  /**
   * Find a single product by ID
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async function getProductById(id) {
    if (!id) return null;
    const products = await getProducts();
    const strId = String(id).trim();
    return products.find(p => String(p.id) === strId) || null;
  }

  /**
   * Find a product by handle / slug
   * @param {string} handle
   * @returns {Promise<Object|null>}
   */
  async function getProductByHandle(handle) {
    if (!handle) return null;
    const products = await getProducts();
    return products.find(p => p.handle === handle) || null;
  }

  /**
   * Get collection by ID or handle
   * @param {string} idOrHandle
   * @returns {Promise<Object|null>}
   */
  async function getCollectionById(idOrHandle) {
    if (!idOrHandle) return null;
    const collections = await getCollections();
    const target = String(idOrHandle).toLowerCase().trim();
    return collections.find(c => String(c.id).toLowerCase() === target || c.handle.toLowerCase() === target) || null;
  }

  /**
   * Get all products belonging to a collection
   * @param {string} colId
   * @returns {Promise<Array>}
   */
  async function getProductsByCollection(colId) {
    if (!colId) return [];
    const [products, collection] = await Promise.all([
      getProducts(),
      getCollectionById(colId)
    ]);

    const target = String(colId).toLowerCase().trim();

    return products.filter(p => {
      // Check collection productIds array if collection exists
      if (collection && collection.productIds && collection.productIds.includes(p.id)) {
        return true;
      }
      // Check product's own collections array
      if (Array.isArray(p.collections) && p.collections.some(c => c.toLowerCase() === target)) {
        return true;
      }
      // If collection id is sale, also include any product with compareAtPrice > price
      if (target === 'sale' && p.compareAtPrice && p.compareAtPrice > p.price) {
        return true;
      }
      return false;
    });
  }

  /**
   * Get reviews for a specific product
   * @param {string|number} productId
   * @returns {Promise<Array>}
   */
  async function getReviewsByProduct(productId) {
    if (!productId) return [];
    const reviews = await getReviews();
    const strId = String(productId);
    return reviews.filter(r => String(r.productId) === strId);
  }

  /**
   * Search products by keywords across title, description, tags, type, vendor
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async function searchProducts(query) {
    if (!query || !query.trim()) return [];
    const products = await getProducts();
    const terms = query.toLowerCase().trim().split(/\s+/);

    return products.filter(product => {
      const searchSpace = [
        product.title,
        product.description,
        product.vendor,
        product.type,
        ...(product.tags || [])
      ].join(' ').toLowerCase();

      return terms.every(term => searchSpace.includes(term));
    });
  }

  /**
   * Filter an array of products based on multi-criteria filter object
   * @param {Array} products
   * @param {Object} filters
   * @returns {Array}
   */
  function filterProducts(products, filters = {}) {
    if (!Array.isArray(products)) return [];

    const categories = filters.category || filters.types || filters.categories;
    const priceMin = typeof filters.priceMin === 'number' ? filters.priceMin : (typeof filters.minPrice === 'number' ? filters.minPrice : null);
    const priceMax = typeof filters.priceMax === 'number' ? filters.priceMax : (typeof filters.maxPrice === 'number' ? filters.maxPrice : null);
    const inStock = filters.inStock === true || filters.available === true;
    const colors = filters.colors || (filters.color ? [filters.color] : null);
    const sizes = filters.sizes || (filters.size ? [filters.size] : null);

    return products.filter(product => {
      // Category / Type filter
      if (categories && categories.length > 0) {
        const catList = Array.isArray(categories) ? categories : [categories];
        const catMatch = catList.some(cat =>
          product.type && product.type.toLowerCase() === String(cat).toLowerCase()
        );
        if (!catMatch) return false;
      }

      // Price range filter
      if (typeof priceMin === 'number' && product.price < priceMin) {
        return false;
      }
      if (typeof priceMax === 'number' && product.price > priceMax) {
        return false;
      }

      // Color filter
      if (colors && colors.length > 0) {
        const colorOption = (product.options || []).find(o => o.name.toLowerCase() === 'color');
        if (!colorOption) return false;
        const hasMatchingColor = colorOption.values.some(v =>
          colors.some(c => v.toLowerCase().includes(String(c).toLowerCase()))
        );
        if (!hasMatchingColor) return false;
      }

      // Size filter
      if (sizes && sizes.length > 0) {
        const sizeOption = (product.options || []).find(o => o.name.toLowerCase() === 'size');
        if (!sizeOption) return false;
        const hasMatchingSize = sizeOption.values.some(v =>
          sizes.some(s => v.toLowerCase() === String(s).toLowerCase())
        );
        if (!hasMatchingSize) return false;
      }

      // In Stock filter
      if (inStock === true) {
        if (!product.available) return false;
      }

      // On Sale filter
      if (filters.onSale === true) {
        if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort an array of products
   * @param {Array} products
   * @param {string} sortBy
   * @returns {Array}
   */
  function sortProducts(products, sortBy = 'featured') {
    if (!Array.isArray(products)) return [];
    const list = [...products];

    switch (sortBy) {
      case 'price-ascending':
      case 'price-low-high':
        return list.sort((a, b) => a.price - b.price);

      case 'price-descending':
      case 'price-high-low':
        return list.sort((a, b) => b.price - a.price);

      case 'title-ascending':
      case 'name-a-z':
        return list.sort((a, b) => a.title.localeCompare(b.title));

      case 'title-descending':
      case 'name-z-a':
        return list.sort((a, b) => b.title.localeCompare(a.title));

      case 'best-selling':
        return list.sort((a, b) => {
          if (a.bestSeller && !b.bestSeller) return -1;
          if (!a.bestSeller && b.bestSeller) return 1;
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        });

      case 'created-descending':
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      case 'rating':
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      case 'featured':
      default:
        return list.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
    }
  }

  return {
    getProducts,
    getCollections,
    getReviews,
    getBanners,
    getSiteConfig,
    getProductById,
    getProductByHandle,
    getCollectionById,
    getProductsByCollection,
    getReviewsByProduct,
    searchProducts,
    filterProducts,
    sortProducts
  };
})();
