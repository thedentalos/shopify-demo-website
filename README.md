# LUXE STORE ? Modular Shopify-Style E-Commerce Template

A modern, production-grade Shopify store front-end template designed for displaying and selling products with high-fashion luxury aesthetics. Built with pure HTML5, CSS3 Custom Properties, and Vanilla JavaScript (ES6).

---

## ?? Key Highlights

- **Zero Build Tools Required**: Open any `.html` file with VS Code Live Server or any static HTTP server. No Node.js, Webpack, or npm dependencies needed for running the site.
- **Component-Based Modularity**: Shared UI elements (announcement bar, header, mega-menu, mobile drawer, mini-cart drawer, search modal, quick view, toast alerts, footer) are rendered dynamically via `components.js` into placeholders (`#header-placeholder`, `#footer-placeholder`). Update once, changes reflect everywhere.
- **Multi-Device Responsive Matrix**: Pixel-perfect support across all viewport sizes:
  - Small Mobile (320px ? 479px)
  - Mobile & Phablet (480px ? 767px)
  - Tablet Portrait & Landscape (768px ? 1023px)
  - Laptop & Desktop (1024px ? 1439px)
  - Ultra-Wide & 4K (1440px ? 1920px+)
- **Production-Ready Features**:
  - Client-Side Cart (localStorage persistence, real-time item badge counter, interactive slide-out drawer, dedicated cart page, promo code simulator).
  - Wishlist Management (localStorage persistence, toggle hearts, badge count, dedicated wishlist page).
  - Live Search Overlay (debounced keystroke search, real-time thumbnail suggestions, dedicated full search results page).
  - Advanced Product Catalog (multi-facet sidebar filtering by category, price slider, visual color swatches, size pills, stock status; sorting by featured, price asc/desc, name, newest; grid/list view toggle; pagination).
  - Complete Product Detail Experience (multi-image zoom gallery, thumbnail switcher, full-screen lightbox, variant selector with dynamic SKU and price updates, quantity stepper, Add to Cart, instant Buy Now, product tabs, customer review breakdowns, related items, recently viewed items, sticky mobile add-to-cart bar).
  - Multi-Step Checkout Experience (Contact Info ? Shipping Address & Method Selection ? Credit Card validation ? Order Confirmation modal with order ID generation).
  - Informational Pages (About Us brand story & timeline, Contact form & store info, 15+ accordion FAQ with live keyword search & category pills, 4 legal policy pages, Auth login & registration forms, Account dashboard, custom 404 page).

---

## ?? Directory Structure

```
Shopify demo website/
??? 404.html                     # Custom 404 Error Page
??? about.html                   # Brand Story, Values, Team & Timeline
??? account.html                 # Customer Account Dashboard
??? cart.html                    # Dedicated Shopping Cart Page
??? checkout.html                # Multi-Step Checkout Flow
??? collection.html              # Dynamic Single Collection Page
??? collections.html             # All Collections Directory
??? contact.html                 # Contact Form & Store Location Info
??? faq.html                     # Categorized Accordion FAQ with Search
??? index.html                   # Homepage Showcase
??? login.html                   # Customer Login
??? privacy-policy.html          # Privacy Policy
??? product.html                 # Product Detail (Query Parameter Driven)
??? products.html                # Catalog with Multi-Facet Filters & Sorting
??? refund-policy.html           # Return & Refund Policy
??? register.html                # Customer Registration
??? search.html                  # Search Results Page
??? shipping-policy.html         # Shipping Rates & Delivery Policy
??? terms.html                   # Terms of Service
??? wishlist.html                # Customer Saved Items
?
??? assets/
?   ??? images/
?       ??? favicon.svg          # Store Favicon
?       ??? logo.svg             # LUXE Vector Logo
?
??? css/
?   ??? account.css              # Auth & Account Dashboard Styles
?   ??? base.css                 # Typography Scale, Base Elements & Utilities
?   ??? cart.css                 # Cart Page Layout & Table Styles
?   ??? checkout.css             # Checkout Steps, Form & Order Summary
?   ??? components.css           # 20+ Reusable UI Components
?   ??? footer.css               # Newsletter & 4-Column Footer
?   ??? header.css               # Sticky Nav, Mega Menu & Overlays
?   ??? home.css                 # Hero Slider, Carousels & Grid Sections
?   ??? layout.css               # Grid System & Container Constraints
?   ??? pages.css                # About, Contact, FAQ, Policies & 404
?   ??? product-detail.css       # Gallery, Variants, Tabs & Sticky Bar
?   ??? products.css             # Shop Sidebar, Filters & Catalog Grid
?   ??? reset.css                # CSS Normalize & Modern Reset
?   ??? responsive.css           # Consolidated Media Queries (320px - 4K)
?   ??? variables.css            # Design Tokens (Colors, Fonts, Spacing)
?
??? data/
?   ??? banners.json             # Hero Slider Slides & CTA Links
?   ??? collections.json         # 6 Collections & Associated Products
?   ??? products.json            # 20 Fashion Products with Full Variant Trees
?   ??? reviews.json             # 35+ Verified Customer Reviews
?   ??? site-config.json         # Store Metadata, Currency & Social Links
?
??? js/
    ??? account.js               # Auth Validation & Dashboard Navigation
    ??? app.js                   # Application Bootstrap & Route Dispatcher
    ??? cart.js                  # Cart Storage & Mini-Cart Drawer Logic
    ??? checkout.js              # Checkout Step Validation & Order Generation
    ??? components.js            # Modular Component Renderer (Header, Footer, etc.)
    ??? data.js                  # Data Provider & Query/Filter Engine
    ??? faq.js                   # Accordion & Live FAQ Search
    ??? header.js                # Sticky Nav, Mobile Menu & Dropdowns
    ??? home.js                  # Hero Auto-Slider & Homepage Carousels
    ??? newsletter.js            # Newsletter Subscription Handler
    ??? notifications.js         # Animated Toast Notification System
    ??? product-detail.js        # Gallery, Lightbox, Variants & Reviews
    ??? products.js              # Catalog Filtering, Sorting & Pagination
    ??? quickview.js             # Modal Quick-View for Product Cards
    ??? search.js                # Debounced Live Search & Results Page
    ??? utils.js                 # Currency Formatting & DOM Helpers
    ??? wishlist.js              # Wishlist Persistence & State Sync
```

---

## ?? How to Run

1. Open the project folder `d:\Extra Projects\Shopify demo website` in **VS Code** (or any code editor).
2. Right-click `index.html` and click **Open with Live Server** (or use any local static server like `npx serve .` or `python -m http.server 8000`).
3. Navigate between pages in your browser. All cart, wishlist, and recently viewed states persist in your browser's `localStorage`.

---

## ?? Theme Customization

All visual tokens are defined in `css/variables.css`:

```css
:root {
  --color-primary: #2D2D2D;       /* Charcoal Dark */
  --color-accent: #C9A96E;        /* Luxury Gold Accent */
  --font-body: 'Inter', sans-serif;
  --font-heading: 'Playfair Display', serif;
  /* Adjust any values to immediately re-theme the entire website */
}
```

---

## ?? Device Testing Checklist

- [x] **Mobile (320px - 479px)**: Full-width stacked cards, hamburger drawer, sticky mobile add-to-cart bar.
- [x] **Large Mobile (480px - 767px)**: 2-column catalog grid, responsive filter drawer.
- [x] **Tablet (768px - 1023px)**: 2-3 column layouts, visible navigation, responsive sidebars.
- [x] **Desktop (1024px+)**: Full interactive mega-menu, fixed sticky filters, 3-4 column grids, product zoom lightbox.
- [x] **4K / Ultra-wide (1920px+)**: Centered container with max-width bounding to prevent horizontal stretching.\n