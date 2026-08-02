/* ==========================================================================
   VERDANT HARVEST & CO. - INTERACTIVE APPLICATION ENGINE
   ========================================================================== */

import { PRODUCTS, FARM_LOCATIONS } from './products.js';

class OrganicApp {
  constructor() {
    // Application State
    this.cart = JSON.parse(localStorage.getItem('verdant_cart')) || [];
    this.selectedCategory = 'all';
    this.selectedFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'featured';
    
    // Bundle Builder State
    this.bundleTier = 5; // Default 5 items (20% off)
    this.bundleItems = [];

    // Eco Calculator State
    this.ecoItemsPerMonth = 4;

    // Farm Location State
    this.activeFarmId = 'provence';

    // DOM Elements
    this.initElements();
    this.bindEvents();
    this.render();
  }

  initElements() {
    this.productGrid = document.getElementById('productGrid');
    this.cartBadge = document.getElementById('cartBadge');
    this.cartDrawer = document.getElementById('cartDrawer');
    this.cartOverlay = document.getElementById('cartOverlay');
    this.cartItemsBody = document.getElementById('cartItemsBody');
    this.cartSubtotal = document.getElementById('cartSubtotal');
    this.freeShippingInfo = document.getElementById('freeShippingInfo');
    
    this.searchInput = document.getElementById('searchInput');
    this.sortSelect = document.getElementById('sortSelect');

    this.productModal = document.getElementById('productModal');
    this.modalOverlay = document.getElementById('modalOverlay');
    this.modalContent = document.getElementById('modalContent');

    // Toast
    this.toast = document.getElementById('toastNotification');

    // Eco Slider
    this.ecoSlider = document.getElementById('ecoSlider');
    this.ecoValDisplay = document.getElementById('ecoValDisplay');
    this.ecoGramsAvoided = document.getElementById('ecoGramsAvoided');
    this.ecoTreesSaved = document.getElementById('ecoTreesSaved');
    this.ecoWaterSaved = document.getElementById('ecoWaterSaved');
    this.ecoPlasticSaved = document.getElementById('ecoPlasticSaved');
  }

  bindEvents() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderProducts();
      });
    }

    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderProducts();
      });
    }

    // Category buttons
    document.querySelectorAll('[data-category-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = btn.getAttribute('data-category-target');
        this.setCategory(category, btn);
      });
    });

    // Dietary filter pills
    document.querySelectorAll('[data-filter-pill]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-pill]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedFilter = btn.getAttribute('data-filter-pill');
        this.renderProducts();
      });
    });

    // Cart Drawer Triggers
    const cartBtn = document.getElementById('cartTriggerBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    if (cartBtn) cartBtn.addEventListener('click', () => this.toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => this.toggleCart(false));
    if (this.cartOverlay) this.cartOverlay.addEventListener('click', () => this.toggleCart(false));

    // Modal close
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.toggleModal(false));
    if (this.modalOverlay) this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.toggleModal(false);
    });

    // Eco slider
    if (this.ecoSlider) {
      this.ecoSlider.addEventListener('input', (e) => {
        this.ecoItemsPerMonth = parseInt(e.target.value, 10);
        this.updateEcoCalculator();
      });
    }

    // Farm tabs
    document.querySelectorAll('[data-farm-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-farm-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFarmId = btn.getAttribute('data-farm-tab');
        this.renderFarmCard();
      });
    });

    // Bundle Tiers
    document.querySelectorAll('[data-tier-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-tier-btn]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.bundleTier = parseInt(btn.getAttribute('data-tier-btn'), 10);
        this.updateBundleUI();
      });
    });

    // Checkout Button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.handleCheckout());
    }

    // Newsletter Form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showToast('🌱 Welcome to Verdant Club! Use code VERDANT15 for 15% off.');
        newsletterForm.reset();
      });
    }
  }

  setCategory(category, activeBtn) {
    this.selectedCategory = category;
    document.querySelectorAll('[data-category-target]').forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
    this.renderProducts();
  }

  getFilteredProducts() {
    let list = [...PRODUCTS];

    // Filter by Category
    if (this.selectedCategory !== 'all') {
      list = list.filter(p => p.category === this.selectedCategory);
    }

    // Filter by Dietary/Ethical Pill
    if (this.selectedFilter !== 'all') {
      list = list.filter(p => p.dietaryFlags.includes(this.selectedFilter));
    }

    // Search filter
    if (this.searchQuery) {
      list = list.filter(p => 
        p.title.toLowerCase().includes(this.searchQuery) ||
        p.shortDescription.toLowerCase().includes(this.searchQuery) ||
        p.origin.toLowerCase().includes(this.searchQuery)
      );
    }

    // Sort
    if (this.sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }

  render() {
    this.renderProducts();
    this.renderBundleItems();
    this.renderFarmCard();
    this.updateEcoCalculator();
    this.updateCartUI();
  }

  renderProducts() {
    if (!this.productGrid) return;
    const products = this.getFilteredProducts();

    if (products.length === 0) {
      this.productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🌿</div>
          <h3 style="margin-bottom: 0.5rem;">No Organic Products Found</h3>
          <p style="color: var(--color-text-muted);">Try adjusting your search query or filter tags.</p>
        </div>
      `;
      return;
    }

    this.productGrid.innerHTML = products.map(prod => `
      <div class="product-card" data-product-id="${prod.id}">
        <div class="product-thumb">
          <span class="product-badge-tag">${prod.badge}</span>
          <img src="${prod.image}" alt="${prod.title}" loading="lazy" />
          <button class="quick-view-overlay-btn" onclick="window.organicApp.openProductModal('${prod.id}')">
            <i class="fas fa-eye"></i> Quick View
          </button>
        </div>
        <div class="product-details">
          <div class="product-category-name">${prod.categoryLabel}</div>
          <h3 class="product-title">${prod.title}</h3>
          <div class="product-stars">
            ${'★'.repeat(Math.floor(prod.rating))}${'☆'.repeat(5 - Math.floor(prod.rating))}
            <span>(${prod.reviewsCount})</span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              <span class="price-current">$${prod.price.toFixed(2)}</span>
              ${prod.originalPrice ? `<span class="price-original">$${prod.originalPrice.toFixed(2)}</span>` : ''}
            </div>
            <button class="add-cart-btn" onclick="window.organicApp.addToCart('${prod.id}')" title="Add to Cart">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /* --------------------------------------------------------------------------
     BUNDLE BUILDER LOGIC
     -------------------------------------------------------------------------- */
  renderBundleItems() {
    const grid = document.getElementById('bundleSelectGrid');
    if (!grid) return;

    grid.innerHTML = PRODUCTS.map(prod => {
      const isSelected = this.bundleItems.includes(prod.id);
      return `
        <div class="bundle-item-card ${isSelected ? 'selected' : ''}" onclick="window.organicApp.toggleBundleItem('${prod.id}')">
          <img src="${prod.image}" class="bundle-item-img" alt="${prod.title}" />
          <div class="bundle-item-title">${prod.title}</div>
          <div class="bundle-item-price">$${prod.price.toFixed(2)}</div>
          <button class="add-to-bundle-btn">
            ${isSelected ? '✓ Added' : '+ Add to Box'}
          </button>
        </div>
      `;
    }).join('');

    this.updateBundleUI();
  }

  toggleBundleItem(id) {
    const idx = this.bundleItems.indexOf(id);
    if (idx > -1) {
      this.bundleItems.splice(idx, 1);
    } else {
      if (this.bundleItems.length < this.bundleTier) {
        this.bundleItems.push(id);
      } else {
        this.showToast(`✨ You've selected all ${this.bundleTier} items for this tier!`);
      }
    }
    this.renderBundleItems();
  }

  updateBundleUI() {
    const fill = document.getElementById('bundleProgressFill');
    const text = document.getElementById('bundleProgressText');
    const totalPrice = document.getElementById('bundleTotalPrice');
    const addBundleBtn = document.getElementById('addBundleToCartBtn');

    const count = this.bundleItems.length;
    const pct = Math.min(100, (count / this.bundleTier) * 100);

    if (fill) fill.style.width = `${pct}%`;
    if (text) text.innerText = `${count} of ${this.bundleTier} items chosen`;

    // Calculate bundle total with tier discount (3 items = 10%, 5 items = 20%, 7 items = 25%)
    let discountPct = this.bundleTier === 3 ? 0.10 : (this.bundleTier === 5 ? 0.20 : 0.25);
    let subtotal = this.bundleItems.reduce((acc, id) => {
      const p = PRODUCTS.find(x => x.id === id);
      return acc + (p ? p.price : 0);
    }, 0);

    let finalTotal = subtotal * (1 - discountPct);
    if (totalPrice) totalPrice.innerText = `$${finalTotal.toFixed(2)}`;

    if (addBundleBtn) {
      addBundleBtn.disabled = count !== this.bundleTier;
      addBundleBtn.innerHTML = count === this.bundleTier ? 
        `Add Custom Box to Cart ($${finalTotal.toFixed(2)})` : 
        `Select ${this.bundleTier - count} More Item(s)`;
    }
  }

  addBundleToCart() {
    if (this.bundleItems.length !== this.bundleTier) return;
    
    // Add all bundle items to cart
    this.bundleItems.forEach(id => {
      this.addToCart(id, false);
    });

    this.showToast(`📦 Custom ${this.bundleTier}-Item Harvest Box added to cart!`);
    this.bundleItems = [];
    this.renderBundleItems();
    this.toggleCart(true);
  }

  /* --------------------------------------------------------------------------
     FARM TRACEABILITY & ECO CALCULATOR
     -------------------------------------------------------------------------- */
  renderFarmCard() {
    const farm = FARM_LOCATIONS.find(f => f.id === this.activeFarmId);
    const container = document.getElementById('farmDisplayContainer');
    if (!farm || !container) return;

    container.innerHTML = `
      <div class="farm-display-card">
        <div class="farm-img-wrap">
          <img src="${farm.image}" alt="${farm.name}" />
        </div>
        <div class="farm-info">
          <div class="farm-location-tag"><i class="fas fa-map-marker-alt"></i> ${farm.location}</div>
          <h3 class="farm-name">${farm.name}</h3>
          <p class="farm-bio">${farm.bio}</p>
          <div class="farm-stats">
            <div class="farm-stat-item">
              <strong>${farm.crop}</strong>
              <span>Primary Cultivation</span>
            </div>
            <div class="farm-stat-item">
              <strong>${farm.elevation}</strong>
              <span>Altitude</span>
            </div>
            <div class="farm-stat-item">
              <strong>${farm.farmingType}</strong>
              <span>Certification</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  updateEcoCalculator() {
    if (!this.ecoValDisplay) return;
    this.ecoValDisplay.innerText = `${this.ecoItemsPerMonth} Products / month`;

    // Impact formulas
    const grams = this.ecoItemsPerMonth * 140; // 140g pesticides avoided
    const trees = (this.ecoItemsPerMonth * 0.8).toFixed(1);
    const water = this.ecoItemsPerMonth * 45; // 45L preserved
    const plastic = this.ecoItemsPerMonth * 3; // 3 plastic bottles saved

    if (this.ecoGramsAvoided) this.ecoGramsAvoided.innerText = `${grams}g`;
    if (this.ecoTreesSaved) this.ecoTreesSaved.innerText = `${trees}`;
    if (this.ecoWaterSaved) this.ecoWaterSaved.innerText = `${water} L`;
    if (this.ecoPlasticSaved) this.ecoPlasticSaved.innerText = `${plastic}`;
  }

  /* --------------------------------------------------------------------------
     CART & MODALS LOGIC
     -------------------------------------------------------------------------- */
  addToCart(productId, showToast = true) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }

    this.saveCart();
    this.updateCartUI();

    if (showToast) {
      this.showToast(`🌱 Added "${product.title}" to cart!`);
    }
  }

  updateQuantity(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(i => i.id !== productId);
    }

    this.saveCart();
    this.updateCartUI();
  }

  saveCart() {
    localStorage.setItem('verdant_cart', JSON.stringify(this.cart));
  }

  updateCartUI() {
    const totalCount = this.cart.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = this.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    if (this.cartBadge) {
      this.cartBadge.innerText = totalCount;
      this.cartBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    if (this.cartSubtotal) {
      this.cartSubtotal.innerText = `$${subtotal.toFixed(2)}`;
    }

    if (this.freeShippingInfo) {
      const freeThreshold = 75.00;
      if (subtotal >= freeThreshold) {
        this.freeShippingInfo.innerHTML = `🎉 <strong>Congratulations!</strong> You unlocked FREE express shipping!`;
      } else {
        const diff = freeThreshold - subtotal;
        this.freeShippingInfo.innerHTML = `Add <strong>$${diff.toFixed(2)}</strong> more to unlock FREE express shipping!`;
      }
    }

    if (this.cartItemsBody) {
      if (this.cart.length === 0) {
        this.cartItemsBody.innerHTML = `
          <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛍️</div>
            <p>Your harvest cart is empty.</p>
          </div>
        `;
      } else {
        this.cartItemsBody.innerHTML = this.cart.map(item => `
          <div class="cart-item">
            <img src="${item.image}" class="cart-item-img" alt="${item.title}" />
            <div class="cart-item-details">
              <div class="cart-item-title">${item.title}</div>
              <div class="cart-item-price">$${item.price.toFixed(2)}</div>
              <div class="cart-item-qty-controls">
                <button class="qty-btn" onclick="window.organicApp.updateQuantity('${item.id}', -1)">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="window.organicApp.updateQuantity('${item.id}', 1)">+</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  toggleCart(open) {
    if (this.cartDrawer && this.cartOverlay) {
      if (open) {
        this.cartDrawer.classList.add('active');
        this.cartOverlay.classList.add('active');
      } else {
        this.cartDrawer.classList.remove('active');
        this.cartOverlay.classList.remove('active');
      }
    }
  }

  openProductModal(productId) {
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod || !this.modalContent) return;

    this.modalContent.innerHTML = `
      <div class="modal-card">
        <div class="modal-img-col">
          <img src="${prod.image}" alt="${prod.title}" />
        </div>
        <div class="modal-info-col">
          <div class="product-category-name">${prod.categoryLabel}</div>
          <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">${prod.title}</h2>
          <div class="product-stars" style="margin-bottom: 1rem;">
            ${'★'.repeat(Math.floor(prod.rating))} <span>${prod.rating} / 5.0 (${prod.reviewsCount} reviews)</span>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-emerald-deep); margin-bottom: 1rem;">
            $${prod.price.toFixed(2)}
          </div>
          <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">${prod.shortDescription}</p>

          <div style="margin-bottom: 1.5rem; background: var(--color-cream); padding: 1rem; border-radius: var(--radius-sm);">
            <strong>📍 Origin:</strong> ${prod.origin}<br>
            <strong>🌿 Harvest:</strong> ${prod.harvestYear}
          </div>

          <div style="margin-bottom: 1.5rem;">
            <strong style="display: block; margin-bottom: 0.5rem;">Botanical Ingredients:</strong>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-text-body);">
              ${prod.ingredients.map(i => `<li style="margin-bottom: 4px;">${i}</li>`).join('')}
            </ul>
          </div>

          <button class="btn btn-primary" onclick="window.organicApp.addToCart('${prod.id}'); window.organicApp.toggleModal(false);" style="margin-top: auto; width: 100%;">
            Add to Cart - $${prod.price.toFixed(2)}
          </button>
        </div>
      </div>
    `;

    this.toggleModal(true);
  }

  toggleModal(open) {
    if (this.modalOverlay) {
      if (open) {
        this.modalOverlay.classList.add('active');
      } else {
        this.modalOverlay.classList.remove('active');
      }
    }
  }

  handleCheckout() {
    if (this.cart.length === 0) {
      this.showToast('🛒 Your cart is empty! Add items before checkout.');
      return;
    }

    const orderId = 'VERDANT-' + Math.floor(100000 + Math.random() * 900000);
    this.cart = [];
    this.saveCart();
    this.updateCartUI();
    this.toggleCart(false);

    alert(`🌿 Thank you for your organic order!\n\nOrder ID: ${orderId}\nWe are preparing your farm-fresh package with eco-friendly plastic-free packaging.`);
    this.showToast(`✨ Order #${orderId} confirmed! Check your email for tracking.`);
  }

  showToast(msg) {
    if (!this.toast) return;
    this.toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--color-gold);"></i> ${msg}`;
    this.toast.classList.add('active');
    setTimeout(() => {
      this.toast.classList.remove('active');
    }, 4000);
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.organicApp = new OrganicApp();
});
