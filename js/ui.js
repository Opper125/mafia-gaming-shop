// js/ui.js - UI Components & Rendering (Fixed for CSS compatibility)

const UI = {
    currentPage: 'home',
    currentCategory: null,
    selectedProduct: null,
    bannerInterval: null,
    currentBannerIndex: 0,
    elements: {},

    async init() {
        console.log('🎨 Initializing UI...');
        
        this.cacheElements();
        this.applyTheme();
        
        // Show intro first
        await this.showIntro();
        
        // Then show main content
        await this.renderDashboard();
        
        this.startBannerRotation();
        this.startAnnouncementTicker();
        
        console.log('✅ UI initialized');
    },

    cacheElements() {
        this.elements = {
            app: document.getElementById('app'),
            intro: document.getElementById('intro'),
            main: document.getElementById('main-content'),
            header: document.getElementById('header'),
            bannerContainer: document.getElementById('banner-container'),
            announcementContainer: document.getElementById('announcement-container'),
            categories: document.getElementById('categories-container'),
            modal: document.getElementById('modal'),
            toast: document.getElementById('toast')
        };
    },

    applyTheme() {
        const theme = TelegramWebApp.getTheme ? TelegramWebApp.getTheme() : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    },

    // Show intro animation
    showIntro() {
        return new Promise(async (resolve) => {
            const introEl = this.elements.intro;
            const mainEl = this.elements.main;
            
            if (!introEl || !mainEl) {
                resolve();
                return;
            }
            
            // Get settings
            let settings = { logo: '', siteName: 'MAFIA Gaming Shop' };
            try {
                settings = await Database.getSettings() || settings;
            } catch(e) {}
            
            // Build intro HTML
            introEl.innerHTML = `
                <div class="intro-container">
                    <div class="intro-background">
                        <div class="intro-particles"></div>
                        <div class="intro-glow"></div>
                    </div>
                    <div class="intro-content">
                        <div class="intro-logo-wrapper">
                            <div class="intro-logo-ring"></div>
                            <div class="intro-logo-ring delay-1"></div>
                            <div class="intro-logo-ring delay-2"></div>
                            ${settings.logo ? 
                                `<img src="${settings.logo}" class="intro-logo" alt="Logo">` :
                                `<div class="intro-logo-placeholder">🎮</div>`
                            }
                        </div>
                        <h1 class="intro-title">${settings.siteName}</h1>
                        <p class="intro-subtitle">Premium Gaming Top-up</p>
                        <div class="intro-loader">
                            <div class="intro-loader-bar" style="animation: loadingBar ${CONFIG.INTRO_DURATION}ms ease-out forwards;"></div>
                        </div>
                        <p class="intro-loading-text">Loading...</p>
                    </div>
                </div>
            `;
            
            // Show intro (add active class)
            introEl.classList.add('active');
            
            // Wait for intro duration
            setTimeout(() => {
                // Fade out intro
                introEl.classList.add('fade-out');
                
                setTimeout(() => {
                    // Hide intro, show main
                    introEl.classList.remove('active', 'fade-out');
                    mainEl.classList.add('active');
                    resolve();
                }, 500);
            }, CONFIG.INTRO_DURATION);
        });
    },

    // Render dashboard
    async renderDashboard() {
        const user = Auth.getUser();
        const isAdmin = Auth.checkAdmin();
        
        await this.renderHeader(user, isAdmin);
        await this.renderBanners();
        await this.renderAnnouncement();
        await this.renderCategories();
    },

    // Render header
    async renderHeader(user, isAdmin) {
        let settings = { logo: '', siteName: 'MAFIA Gaming Shop' };
        try {
            settings = await Database.getSettings() || settings;
        } catch(e) {}
        
        const headerEl = this.elements.header;
        if (!headerEl) return;
        
        headerEl.innerHTML = `
            <div class="header-container">
                <div class="header-left">
                    <div class="header-logo">
                        ${settings.logo ? 
                            `<img src="${settings.logo}" alt="Logo">` :
                            `<span class="logo-emoji">🎮</span>`
                        }
                    </div>
                    <div class="header-info">
                        <h1 class="header-title">${settings.siteName}</h1>
                        <p class="header-subtitle">Welcome, ${user?.firstName || 'User'}!</p>
                    </div>
                </div>
                <div class="header-right">
                    <div class="balance-card" onclick="UI.showTopupModal()">
                        <div class="balance-info">
                            <span class="balance-label">Balance</span>
                            <span class="balance-amount" id="balance-amount">${this.formatCurrency(user?.balance || 0)}</span>
                        </div>
                        <button class="topup-btn">
                            <span class="topup-icon">+</span>
                            <span>Top Up</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="user-profile-bar">
                <div class="user-avatar">
                    ${user?.photoUrl ? 
                        `<img src="${user.photoUrl}" alt="Avatar">` :
                        `<span>${(user?.firstName || 'U').charAt(0)}</span>`
                    }
                    ${user?.isPremium ? '<span class="premium-badge">⭐</span>' : ''}
                </div>
                <div class="user-info">
                    <span class="user-name">${user?.firstName || ''} ${user?.lastName || ''}</span>
                    <span class="user-username">@${user?.username || 'user'}</span>
                </div>
                <div class="user-actions">
                    <button class="icon-btn" onclick="UI.showOrderHistory()" title="Orders">
                        <span>📦</span>
                    </button>
                    ${isAdmin ? `
                        <button class="icon-btn admin-btn" onclick="UI.openAdminPanel()" title="Admin">
                            <span>⚙️</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Render banners
    async renderBanners() {
        const container = this.elements.bannerContainer;
        if (!container) return;
        
        let banners = [];
        try {
            banners = await Database.getBanners('type1') || [];
        } catch(e) {}
        
        if (banners.length === 0) {
            container.innerHTML = `
                <div class="banner-slider">
                    <div class="banner-placeholder">
                        <div class="banner-placeholder-content">
                            <span>🎮</span>
                            <p>MAFIA Gaming Shop</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="banner-slider">
                <div class="banner-track" id="banner-track">
                    ${banners.map((banner, i) => `
                        <div class="banner-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                            <img src="${banner.image}" alt="Banner" loading="lazy">
                        </div>
                    `).join('')}
                </div>
                ${banners.length > 1 ? `
                    <div class="banner-dots">
                        ${banners.map((_, i) => `
                            <span class="banner-dot ${i === 0 ? 'active' : ''}" onclick="UI.goToBanner(${i})"></span>
                        `).join('')}
                    </div>
                    <button class="banner-nav banner-prev" onclick="UI.prevBanner()">‹</button>
                    <button class="banner-nav banner-next" onclick="UI.nextBanner()">›</button>
                ` : ''}
            </div>
        `;
    },

    // Banner navigation
    startBannerRotation() {
        if (this.bannerInterval) clearInterval(this.bannerInterval);
        this.bannerInterval = setInterval(() => this.nextBanner(), CONFIG.BANNER_INTERVAL);
    },

    nextBanner() {
        const slides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.banner-dot');
        if (slides.length <= 1) return;
        
        slides[this.currentBannerIndex]?.classList.remove('active');
        dots[this.currentBannerIndex]?.classList.remove('active');
        
        this.currentBannerIndex = (this.currentBannerIndex + 1) % slides.length;
        
        slides[this.currentBannerIndex]?.classList.add('active');
        dots[this.currentBannerIndex]?.classList.add('active');
        
        const track = document.getElementById('banner-track');
        if (track) {
            track.style.transform = `translateX(-${this.currentBannerIndex * 100}%)`;
        }
    },

    prevBanner() {
        const slides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.banner-dot');
        if (slides.length <= 1) return;
        
        slides[this.currentBannerIndex]?.classList.remove('active');
        dots[this.currentBannerIndex]?.classList.remove('active');
        
        this.currentBannerIndex = (this.currentBannerIndex - 1 + slides.length) % slides.length;
        
        slides[this.currentBannerIndex]?.classList.add('active');
        dots[this.currentBannerIndex]?.classList.add('active');
        
        const track = document.getElementById('banner-track');
        if (track) {
            track.style.transform = `translateX(-${this.currentBannerIndex * 100}%)`;
        }
    },

    goToBanner(index) {
        const slides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.banner-dot');
        
        slides[this.currentBannerIndex]?.classList.remove('active');
        dots[this.currentBannerIndex]?.classList.remove('active');
        
        this.currentBannerIndex = index;
        
        slides[this.currentBannerIndex]?.classList.add('active');
        dots[this.currentBannerIndex]?.classList.add('active');
        
        const track = document.getElementById('banner-track');
        if (track) {
            track.style.transform = `translateX(-${this.currentBannerIndex * 100}%)`;
        }
        
        this.startBannerRotation();
    },

    // Render announcement
    async renderAnnouncement() {
        const container = this.elements.announcementContainer;
        if (!container) return;
        
        let text = '🎮 Welcome to MAFIA Gaming Shop!';
        try {
            text = await Database.getAnnouncement() || text;
        } catch(e) {}
        
        container.innerHTML = `
            <div class="announcement-bar">
                <div class="announcement-icon">📢</div>
                <div class="announcement-content">
                    <div class="announcement-text" id="announcement-text">
                        <span>${text}</span>
                    </div>
                </div>
            </div>
        `;
    },

    startAnnouncementTicker() {
        const el = document.getElementById('announcement-text');
        if (el) el.classList.add('ticker-animate');
    },

    // Render categories
    async renderCategories() {
        const container = this.elements.categories;
        if (!container) return;
        
        let categories = [];
        try {
            categories = await Database.getCategories() || [];
        } catch(e) {}
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-icon">🎮</span>
                        Games & Services
                    </h2>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <p>No categories available yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <span class="section-icon">🎮</span>
                    Games & Services
                </h2>
            </div>
            <div class="categories-grid">
                ${categories.filter(c => c.isActive !== false).map(cat => `
                    <div class="category-card" onclick="UI.openCategory('${cat.id}')">
                        <div class="category-card-inner">
                            ${cat.hasDiscount ? `
                                <div class="category-discount-badge">
                                    <span>🔥 SALE</span>
                                </div>
                            ` : ''}
                            ${cat.countryFlag ? `
                                <div class="category-flag">
                                    <img src="${cat.countryFlag}" alt="Flag">
                                </div>
                            ` : ''}
                            <div class="category-icon">
                                ${cat.icon ? 
                                    `<img src="${cat.icon}" alt="${cat.name}">` :
                                    `<span>🎮</span>`
                                }
                            </div>
                            <div class="category-info">
                                <h3 class="category-name">${cat.name}</h3>
                                <div class="category-stats">
                                    <span class="sold-count">
                                        <span class="sold-icon">✅</span>
                                        ${cat.totalSold || 0} sold
                                    </span>
                                </div>
                            </div>
                            <div class="category-arrow">›</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Open category
    async openCategory(categoryId) {
        if (typeof TelegramWebApp !== 'undefined') {
            TelegramWebApp.haptic('impact', 'light');
        }
        
        this.currentCategory = categoryId;
        this.currentPage = 'category';
        
        this.showPageLoading();
        
        const category = await Database.getCategory(categoryId);
        const products = await Database.getProducts(categoryId);
        const inputTables = await Database.getInputTables(categoryId);
        
        let categoryBanners = [];
        try {
            const allBanners = await Database.getBanners('type2');
            categoryBanners = allBanners.filter(b => b.categoryId === categoryId);
        } catch(e) {}
        
        if (typeof TelegramWebApp !== 'undefined') {
            TelegramWebApp.showBackButton(() => this.goBack());
        }
        
        this.renderCategoryPage(category, products, inputTables, categoryBanners);
    },

    // Render category page
    renderCategoryPage(category, products, inputTables, banners) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="category-page">
                <div class="category-header">
                    <div class="category-header-bg"></div>
                    <div class="category-header-content">
                        <div class="category-header-icon">
                            ${category?.icon ? 
                                `<img src="${category.icon}" alt="${category?.name}">` :
                                `<span>🎮</span>`
                            }
                        </div>
                        <div class="category-header-info">
                            <h1>${category?.name || 'Category'}</h1>
                            <p>✅ ${category?.totalSold || 0} sold</p>
                        </div>
                    </div>
                </div>
                
                ${inputTables.length > 0 ? `
                    <div class="input-section">
                        <h3 class="input-section-title">📝 အချက်အလက်ဖြည့်ပါ</h3>
                        <div class="input-fields">
                            ${inputTables.map(table => `
                                <div class="input-group">
                                    <label class="input-label">${table.name}</label>
                                    <input 
                                        type="${table.inputType || 'text'}" 
                                        class="input-field" 
                                        id="input-${table.id}"
                                        placeholder="${table.placeholder}"
                                        data-name="${table.name}"
                                        ${table.required ? 'required' : ''}
                                    >
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="products-section">
                    <h3 class="section-title"><span>🛍️</span> Products</h3>
                    ${products.length > 0 ? `
                        <div class="products-grid">
                            ${products.map(product => `
                                <div class="product-card" onclick="UI.selectProduct('${product.id}')" data-product-id="${product.id}">
                                    <div class="product-card-inner">
                                        ${product.discountPercent > 0 ? `
                                            <div class="product-discount-badge">-${product.discountPercent}%</div>
                                        ` : ''}
                                        <div class="product-icon">
                                            ${product.icon ? 
                                                `<img src="${product.icon}" alt="${product.name}">` :
                                                `<span>💎</span>`
                                            }
                                        </div>
                                        <div class="product-info">
                                            <h4 class="product-name">${product.name}</h4>
                                            <p class="product-amount">${product.amount}</p>
                                        </div>
                                        <div class="product-price">
                                            ${product.discountPercent > 0 ? `
                                                <span class="original-price">${this.formatCurrency(product.originalPrice)}</span>
                                            ` : ''}
                                            <span class="current-price">${this.formatCurrency(product.price)}</span>
                                        </div>
                                        <div class="product-delivery">
                                            ${product.deliveryType === 'instant' ? 
                                                `<span class="instant-badge">⚡ အမြန်ရ</span>` :
                                                `<span class="time-badge">⏱️ ${product.deliveryTime}</span>`
                                            }
                                        </div>
                                        <div class="product-select-indicator">
                                            <span class="check-icon">✓</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <div class="empty-icon">📦</div>
                            <p>No products available</p>
                        </div>
                    `}
                </div>
                
                ${banners.length > 0 ? `
                    <div class="category-banner-section">
                        ${banners.map(banner => `
                            <div class="category-banner">
                                <img src="${banner.image}" alt="Banner">
                                ${banner.description ? `
                                    <div class="category-banner-desc">
                                        ${banner.description.split('\n').map(line => `<p>${line}</p>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="buy-section" id="buy-section">
                    <div class="buy-summary">
                        <div class="buy-product-info">
                            <span class="buy-product-name" id="buy-product-name">Select a product</span>
                            <span class="buy-product-price" id="buy-product-price">0 MMK</span>
                        </div>
                    </div>
                    <button class="buy-btn" onclick="UI.processPurchase()">
                        <span class="buy-btn-icon">🛒</span>
                        <span class="buy-btn-text">Buy Now</span>
                    </button>
                </div>
            </div>
        `;
    },

    // Select product
    async selectProduct(productId) {
        if (typeof TelegramWebApp !== 'undefined') {
            TelegramWebApp.haptic('selection');
        }
        
        const product = await Database.getProduct(productId);
        if (!product) return;
        
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        this.selectedProduct = product;
        
        const buySection = document.getElementById('buy-section');
        const productName = document.getElementById('buy-product-name');
        const productPrice = document.getElementById('buy-product-price');
        
        if (productName) productName.textContent = `${product.name} - ${product.amount}`;
        if (productPrice) productPrice.textContent = this.formatCurrency(product.price);
        if (buySection) buySection.classList.add('show');
        
        if (typeof TelegramWebApp !== 'undefined') {
            TelegramWebApp.showMainButton(`🛒 Buy Now - ${this.formatCurrency(product.price)}`, () => {
                this.processPurchase();
            });
        }
    },

    // Process purchase
    async processPurchase() {
        if (!this.selectedProduct) {
            this.showToast('Please select a product', 'error');
            return;
        }
        
        const inputFields = document.querySelectorAll('.input-field');
        const inputData = {};
        let hasEmptyRequired = false;
        
        inputFields.forEach(field => {
            const name = field.dataset.name;
            const value = field.value.trim();
            
            if (field.required && !value) {
                hasEmptyRequired = true;
                field.classList.add('error');
            } else {
                field.classList.remove('error');
                inputData[name] = value;
            }
        });
        
        if (hasEmptyRequired) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }
        
        await this.showPurchaseConfirmation(inputData);
    },

    // Show purchase confirmation
    async showPurchaseConfirmation(inputData) {
        const user = Auth.getUser();
        const product = this.selectedProduct;
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content purchase-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>🛒 Confirm Purchase</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="purchase-summary">
                            <div class="purchase-product">
                                <div class="purchase-icon">
                                    ${product.icon ? `<img src="${product.icon}">` : '💎'}
                                </div>
                                <div class="purchase-details">
                                    <h3>${product.name}</h3>
                                    <p>${product.amount}</p>
                                </div>
                            </div>
                            
                            ${Object.keys(inputData).length > 0 ? `
                                <div class="purchase-info-list">
                                    ${Object.entries(inputData).map(([key, value]) => `
                                        <div class="purchase-info-item">
                                            <span class="info-label">${key}:</span>
                                            <span class="info-value">${value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <div class="purchase-price-section">
                                <div class="balance-row">
                                    <span>Your Balance:</span>
                                    <span class="balance-value">${this.formatCurrency(user?.balance || 0)}</span>
                                </div>
                                <div class="price-row">
                                    <span>Price:</span>
                                    <span class="price-value">- ${this.formatCurrency(product.price)}</span>
                                </div>
                                <div class="remaining-row">
                                    <span>Remaining:</span>
                                    <span class="remaining-value ${(user?.balance || 0) < product.price ? 'insufficient' : ''}">
                                        ${this.formatCurrency((user?.balance || 0) - product.price)}
                                    </span>
                                </div>
                            </div>
                            
                            ${(user?.balance || 0) < product.price ? `
                                <div class="insufficient-warning">
                                    <span>⚠️</span>
                                    <span>Insufficient balance! Please top up first.</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        ${(user?.balance || 0) >= product.price ? `
                            <button class="btn btn-primary" onclick="UI.confirmPurchase()">
                                <span>✅</span>
                                <span>Confirm</span>
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="UI.closeModal(); UI.showTopupModal();">
                                <span>💰</span>
                                <span>Top Up</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
        this._pendingInputData = inputData;
    },

    // Confirm purchase
    async confirmPurchase() {
        const user = Auth.getUser();
        const product = this.selectedProduct;
        const inputData = this._pendingInputData || {};
        
        this.showModalLoading('Processing...');
        
        try {
            await Database.updateUserBalance(user.telegramId, product.price, 'subtract');
            
            const category = await Database.getCategory(product.categoryId);
            
            const order = await Database.createOrder({
                userId: user.id,
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
                productId: product.id,
                productName: product.name,
                productAmount: product.amount,
                categoryId: product.categoryId,
                categoryName: category?.name || '',
                price: product.price,
                currency: product.currency,
                inputData: inputData
            });
            
            this.closeModal();
            
            await Auth.refreshUser();
            await this.updateBalanceDisplay();
            
            this.showSuccessModal(order);
            
        } catch (error) {
            console.error('Purchase error:', error);
            this.closeModal();
            this.showToast('Purchase failed', 'error');
        }
    },

    // Show success modal
    showSuccessModal(order) {
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content success-modal" onclick="event.stopPropagation()">
                    <div class="success-animation">
                        <div class="success-icon">✅</div>
                    </div>
                    <h2>Order Submitted!</h2>
                    <p>Your order has been submitted successfully.</p>
                    <div class="order-id">
                        <span>Order ID:</span>
                        <code>${order?.orderId || 'N/A'}</code>
                    </div>
                    <p class="success-note">Admin will process your order shortly.</p>
                    <button class="btn btn-primary" onclick="UI.closeModal(); UI.goBack();">
                        <span>👍</span>
                        <span>OK</span>
                    </button>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
    },

    // Show topup modal
    async showTopupModal() {
        const paymentMethods = await Database.getPaymentMethods();
        const user = Auth.getUser();
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content topup-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>💰 Top Up Balance</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="current-balance-card">
                            <span class="label">Current Balance</span>
                            <span class="amount">${this.formatCurrency(user?.balance || 0)}</span>
                        </div>
                        
                        <div class="topup-form">
                            <div class="input-group">
                                <label class="input-label">Amount (MMK)</label>
                                <input type="number" class="input-field" id="topup-amount" placeholder="Enter amount" min="1000">
                                <div class="quick-amounts">
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value=5000">5,000</button>
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value=10000">10,000</button>
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value=20000">20,000</button>
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value=50000">50,000</button>
                                </div>
                            </div>
                            
                            ${paymentMethods.length > 0 ? `
                                <div class="input-group">
                                    <label class="input-label">Payment Method</label>
                                    <div class="payment-methods">
                                        ${paymentMethods.map((method, i) => `
                                            <label class="payment-option ${i === 0 ? 'selected' : ''}">
                                                <input type="radio" name="payment-method" value="${method.id}" ${i === 0 ? 'checked' : ''}>
                                                <div class="payment-option-content">
                                                    <div class="payment-icon">${method.icon ? `<img src="${method.icon}">` : '💳'}</div>
                                                    <div class="payment-info">
                                                        <span class="payment-name">${method.name}</span>
                                                        <span class="payment-address">${method.address}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="input-group">
                                    <label class="input-label">Upload Receipt</label>
                                    <div class="file-upload" onclick="document.getElementById('receipt-file').click()">
                                        <input type="file" id="receipt-file" accept="image/*" onchange="UI.handleReceiptUpload(event)" hidden>
                                        <div class="file-upload-content" id="file-upload-content">
                                            <span class="upload-icon">📤</span>
                                            <span class="upload-text">Click to upload</span>
                                        </div>
                                    </div>
                                </div>
                            ` : `
                                <div class="empty-state small">
                                    <span>💳</span>
                                    <p>No payment methods available</p>
                                </div>
                            `}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="UI.submitTopup()" ${paymentMethods.length === 0 ? 'disabled' : ''}>
                            <span>✅</span>
                            <span>Submit</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
        this.uploadedReceipt = null;
    },

    // Handle receipt upload
    async handleReceiptUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const content = document.getElementById('file-upload-content');
        content.innerHTML = '<div class="upload-loading"><div class="spinner small"></div><span>Uploading...</span></div>';
        
        try {
            const base64 = await ImageUploader.uploadImage(file);
            content.innerHTML = `<div class="upload-preview"><img src="${base64}"><span class="upload-success">✅ Uploaded</span></div>`;
            this.uploadedReceipt = base64;
        } catch (error) {
            content.innerHTML = `<div class="upload-error"><span>❌</span><span>${error.message}</span></div>`;
        }
    },

    // Submit topup
    async submitTopup() {
        const amount = document.getElementById('topup-amount')?.value;
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        
        if (!amount || amount < 1000) {
            this.showToast('Enter amount (min 1,000)', 'error');
            return;
        }
        
        if (!selectedMethod) {
            this.showToast('Select payment method', 'error');
            return;
        }
        
        if (!this.uploadedReceipt) {
            this.showToast('Upload receipt', 'error');
            return;
        }
        
        const user = Auth.getUser();
        const methods = await Database.getPaymentMethods();
        const method = methods.find(m => m.id === selectedMethod.value);
        
        this.showModalLoading('Submitting...');
        
        try {
            await Database.createDeposit({
                userId: user.id,
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
                amount: parseFloat(amount),
                paymentMethodId: method.id,
                paymentMethodName: method.name,
                receiptImage: this.uploadedReceipt
            });
            
            this.closeModal();
            this.uploadedReceipt = null;
            this.showToast('Deposit submitted!', 'success');
            
        } catch (error) {
            this.showToast('Failed to submit', 'error');
        }
    },

    // Show order history
    async showOrderHistory() {
        const user = Auth.getUser();
        const orders = await Database.getOrders({ telegramId: user.telegramId });
        const deposits = await Database.getDeposits({ telegramId: user.telegramId });
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content history-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>📦 History</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="history-tabs">
                            <button class="tab-btn active" onclick="UI.switchHistoryTab('orders', this)">Orders</button>
                            <button class="tab-btn" onclick="UI.switchHistoryTab('deposits', this)">Deposits</button>
                        </div>
                        <div class="history-content">
                            <div class="tab-content active" id="orders-tab">
                                ${orders.length > 0 ? `
                                    <div class="history-list">
                                        ${orders.map(o => `
                                            <div class="history-item ${o.status}">
                                                <div class="history-icon">${o.status === 'approved' ? '✅' : o.status === 'rejected' ? '❌' : '⏳'}</div>
                                                <div class="history-info">
                                                    <span class="history-title">${o.productName}</span>
                                                    <span class="history-subtitle">${o.orderId}</span>
                                                    <span class="history-date">${new Date(o.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div class="history-amount">
                                                    <span class="amount">-${this.formatCurrency(o.price)}</span>
                                                    <span class="status-badge ${o.status}">${o.status}</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="empty-state small"><span>📦</span><p>No orders</p></div>'}
                            </div>
                            <div class="tab-content" id="deposits-tab">
                                ${deposits.length > 0 ? `
                                    <div class="history-list">
                                        ${deposits.map(d => `
                                            <div class="history-item ${d.status}">
                                                <div class="history-icon">${d.status === 'approved' ? '✅' : d.status === 'rejected' ? '❌' : '⏳'}</div>
                                                <div class="history-info">
                                                    <span class="history-title">Deposit</span>
                                                    <span class="history-subtitle">${d.depositId}</span>
                                                    <span class="history-date">${new Date(d.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div class="history-amount">
                                                    <span class="amount positive">+${this.formatCurrency(d.amount)}</span>
                                                    <span class="status-badge ${d.status}">${d.status}</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="empty-state small"><span>💰</span><p>No deposits</p></div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
    },

    switchHistoryTab(tab, btn) {
        document.querySelectorAll('.history-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`)?.classList.add('active');
    },

    // Open admin panel
    async openAdminPanel() {
        if (!Auth.checkAdmin()) {
            this.showToast('Access denied', 'error');
            return;
        }
        
        this.currentPage = 'admin';
        Admin.init();
    },

    // Go back
    goBack() {
        if (typeof TelegramWebApp !== 'undefined') {
            TelegramWebApp.hideMainButton();
            TelegramWebApp.hideBackButton();
        }
        
        this.selectedProduct = null;
        this.currentCategory = null;
        this.currentPage = 'home';
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <header id="header" class="header"></header>
                <section id="banner-container" class="banner-container"></section>
                <section id="announcement-container" class="announcement-container"></section>
                <section id="categories-container" class="categories-container"></section>
            `;
        }
        
        this.cacheElements();
        this.renderDashboard();
    },

    // Update balance display
    async updateBalanceDisplay() {
        const user = await Auth.refreshUser();
        const el = document.getElementById('balance-amount');
        if (el && user) {
            el.textContent = this.formatCurrency(user.balance);
        }
    },

    // Modal functions
    showModal(html) {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.innerHTML = html;
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }
    },

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            setTimeout(() => { modal.innerHTML = ''; }, 300);
        }
    },

    showModalLoading(text = 'Loading...') {
        const body = document.querySelector('.modal-body');
        if (body) {
            body.innerHTML = `<div class="modal-loading"><div class="spinner"></div><p>${text}</p></div>`;
        }
    },

    showPageLoading() {
        const main = document.getElementById('main-content');
        if (main) {
            main.innerHTML = `<div class="page-loading"><div class="spinner"></div><p>Loading...</p></div>`;
        }
    },

    // Toast
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        
        toast.innerHTML = `
            <div class="toast-content ${type}">
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        toast.classList.add('active');
        
        setTimeout(() => toast.classList.remove('active'), 3000);
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('my-MM').format(amount || 0) + ' MMK';
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied!', 'success');
        } catch(e) {
            this.showToast('Failed to copy', 'error');
        }
    }
};
