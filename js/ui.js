// js/ui.js - UI Components & Rendering

const UI = {
    // Current state
    currentPage: 'home',
    currentCategory: null,
    selectedProduct: null,
    bannerInterval: null,
    currentBannerIndex: 0,
    
    // DOM Elements cache
    elements: {},

    // Initialize UI
    async init() {
        console.log('🎨 Initializing UI...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Apply theme
        this.applyTheme();
        
        // Show intro
        await this.showIntro();
        
        // Render main content
        await this.renderDashboard();
        
        // Start banner rotation
        this.startBannerRotation();
        
        // Start announcement ticker
        this.startAnnouncementTicker();
        
        console.log('✅ UI initialized');
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            app: document.getElementById('app'),
            intro: document.getElementById('intro'),
            main: document.getElementById('main-content'),
            header: document.getElementById('header'),
            balance: document.getElementById('balance-amount'),
            bannerContainer: document.getElementById('banner-container'),
            announcement: document.getElementById('announcement-text'),
            categories: document.getElementById('categories-container'),
            modal: document.getElementById('modal'),
            toast: document.getElementById('toast')
        };
    },

    // Apply theme
    applyTheme() {
        const theme = TelegramWebApp.getTheme() || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        
        const colors = CONFIG.THEMES[theme];
        Object.entries(colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
        });
    },

    // Show intro animation
    showIntro() {
        return new Promise(async (resolve) => {
            const settings = await Database.getSettings();
            const logoUrl = settings?.logo || '';
            const siteName = settings?.siteName || 'MAFIA Gaming Shop';
            
            const introHTML = `
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
                            ${logoUrl ? 
                                `<img src="${logoUrl}" alt="Logo" class="intro-logo">` :
                                `<div class="intro-logo-placeholder">🎮</div>`
                            }
                        </div>
                        <h1 class="intro-title">${siteName}</h1>
                        <p class="intro-subtitle">Premium Gaming Top-up</p>
                        <div class="intro-loader">
                            <div class="intro-loader-bar"></div>
                        </div>
                        <p class="intro-loading-text">Loading...</p>
                    </div>
                </div>
            `;
            
            this.elements.intro.innerHTML = introHTML;
            this.elements.intro.classList.add('active');
            
            // Animate loading bar
            const loaderBar = document.querySelector('.intro-loader-bar');
            if (loaderBar) {
                loaderBar.style.animation = `loadingBar ${CONFIG.INTRO_DURATION}ms ease-out forwards`;
            }
            
            // Hide intro after duration
            setTimeout(() => {
                this.elements.intro.classList.add('fade-out');
                setTimeout(() => {
                    this.elements.intro.classList.remove('active', 'fade-out');
                    this.elements.main.classList.add('active');
                    resolve();
                }, 500);
            }, CONFIG.INTRO_DURATION);
        });
    },

    // Render main dashboard
    async renderDashboard() {
        const user = Auth.getUser();
        const isAdmin = Auth.checkAdmin();
        
        // Render header
        await this.renderHeader(user, isAdmin);
        
        // Render banners
        await this.renderBanners();
        
        // Render announcement
        await this.renderAnnouncement();
        
        // Render categories
        await this.renderCategories();
        
        // Setup navigation
        this.setupNavigation();
    },

    // Render header
    async renderHeader(user, isAdmin) {
        const settings = await Database.getSettings();
        const logoUrl = settings?.logo || '';
        const siteName = settings?.siteName || 'MAFIA Gaming Shop';
        
        const headerHTML = `
            <div class="header-container">
                <div class="header-left">
                    <div class="header-logo">
                        ${logoUrl ? 
                            `<img src="${logoUrl}" alt="Logo">` :
                            `<span class="logo-emoji">🎮</span>`
                        }
                    </div>
                    <div class="header-info">
                        <h1 class="header-title">${siteName}</h1>
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
                    <button class="icon-btn" onclick="UI.showOrderHistory()">
                        <span>📦</span>
                    </button>
                    ${isAdmin ? `
                        <button class="icon-btn admin-btn" onclick="UI.openAdminPanel()">
                            <span>⚙️</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        this.elements.header.innerHTML = headerHTML;
    },

    // Render banners (Type 1 - Home)
    async renderBanners() {
        const banners = await Database.getBanners('type1');
        
        if (!banners || banners.length === 0) {
            this.elements.bannerContainer.innerHTML = `
                <div class="banner-placeholder">
                    <div class="banner-placeholder-content">
                        <span>🎮</span>
                        <p>MAFIA Gaming Shop</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const bannersHTML = `
            <div class="banner-slider">
                <div class="banner-track" id="banner-track">
                    ${banners.map((banner, index) => `
                        <div class="banner-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <img src="${banner.image}" alt="Banner ${index + 1}" loading="lazy">
                        </div>
                    `).join('')}
                </div>
                ${banners.length > 1 ? `
                    <div class="banner-dots">
                        ${banners.map((_, index) => `
                            <span class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="UI.goToBanner(${index})"></span>
                        `).join('')}
                    </div>
                    <button class="banner-nav banner-prev" onclick="UI.prevBanner()">‹</button>
                    <button class="banner-nav banner-next" onclick="UI.nextBanner()">›</button>
                ` : ''}
            </div>
        `;
        
        this.elements.bannerContainer.innerHTML = bannersHTML;
    },

    // Banner navigation
    startBannerRotation() {
        if (this.bannerInterval) clearInterval(this.bannerInterval);
        
        this.bannerInterval = setInterval(() => {
            this.nextBanner();
        }, CONFIG.BANNER_INTERVAL);
    },

    nextBanner() {
        const slides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.banner-dot');
        
        if (slides.length <= 1) return;
        
        slides[this.currentBannerIndex].classList.remove('active');
        dots[this.currentBannerIndex]?.classList.remove('active');
        
        this.currentBannerIndex = (this.currentBannerIndex + 1) % slides.length;
        
        slides[this.currentBannerIndex].classList.add('active');
        dots[this.currentBannerIndex]?.classList.add('active');
        
        // Animate slide
        const track = document.getElementById('banner-track');
        if (track) {
            track.style.transform = `translateX(-${this.currentBannerIndex * 100}%)`;
        }
    },

    prevBanner() {
        const slides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.banner-dot');
        
        if (slides.length <= 1) return;
        
        slides[this.currentBannerIndex].classList.remove('active');
        dots[this.currentBannerIndex]?.classList.remove('active');
        
        this.currentBannerIndex = (this.currentBannerIndex - 1 + slides.length) % slides.length;
        
        slides[this.currentBannerIndex].classList.add('active');
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
        
        // Reset interval
        this.startBannerRotation();
    },

    // Render announcement ticker
    async renderAnnouncement() {
        const text = await Database.getAnnouncement();
        
        const announcementHTML = `
            <div class="announcement-bar">
                <div class="announcement-icon">📢</div>
                <div class="announcement-content">
                    <div class="announcement-text" id="announcement-text">
                        <span>${text || 'Welcome to MAFIA Gaming Shop!'}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('announcement-container').innerHTML = announcementHTML;
    },

    // Start announcement ticker animation
    startAnnouncementTicker() {
        const textElement = document.getElementById('announcement-text');
        if (textElement) {
            textElement.classList.add('ticker-animate');
        }
    },

    // Render categories
    async renderCategories() {
        const categories = await Database.getCategories();
        
        if (!categories || categories.length === 0) {
            this.elements.categories.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <p>No categories available yet</p>
                </div>
            `;
            return;
        }
        
        const categoriesHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <span class="section-icon">🎮</span>
                    Games & Services
                </h2>
            </div>
            <div class="categories-grid">
                ${categories.filter(c => c.isActive).map(category => `
                    <div class="category-card" onclick="UI.openCategory('${category.id}')">
                        <div class="category-card-inner">
                            ${category.hasDiscount ? `
                                <div class="category-discount-badge">
                                    <span>🔥 SALE</span>
                                </div>
                            ` : ''}
                            ${category.countryFlag ? `
                                <div class="category-flag">
                                    <img src="${category.countryFlag}" alt="Flag">
                                </div>
                            ` : ''}
                            <div class="category-icon">
                                ${category.icon ? 
                                    `<img src="${category.icon}" alt="${category.name}">` :
                                    `<span>🎮</span>`
                                }
                            </div>
                            <div class="category-info">
                                <h3 class="category-name">${category.name}</h3>
                                <div class="category-stats">
                                    <span class="sold-count">
                                        <span class="sold-icon">✅</span>
                                        ${category.totalSold || 0} sold
                                    </span>
                                </div>
                            </div>
                            <div class="category-arrow">›</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        this.elements.categories.innerHTML = categoriesHTML;
    },

    // Open category page
    async openCategory(categoryId) {
        TelegramWebApp.haptic('impact', 'light');
        
        this.currentCategory = categoryId;
        this.currentPage = 'category';
        
        // Show loading
        this.showPageLoading();
        
        // Get data
        const category = await Database.getCategory(categoryId);
        const products = await Database.getProducts(categoryId);
        const inputTables = await Database.getInputTables(categoryId);
        const banners = await Database.getBanners('type2');
        const categoryBanners = banners.filter(b => b.categoryId === categoryId);
        
        // Show back button
        TelegramWebApp.showBackButton(() => {
            this.goBack();
        });
        
        // Render category page
        this.renderCategoryPage(category, products, inputTables, categoryBanners);
    },

    // Render category page
    renderCategoryPage(category, products, inputTables, banners) {
        const mainContent = document.getElementById('main-content');
        
        const pageHTML = `
            <div class="category-page">
                <div class="category-header">
                    <div class="category-header-bg"></div>
                    <div class="category-header-content">
                        <div class="category-header-icon">
                            ${category.icon ? 
                                `<img src="${category.icon}" alt="${category.name}">` :
                                `<span>🎮</span>`
                            }
                        </div>
                        <div class="category-header-info">
                            <h1>${category.name}</h1>
                            <p>✅ ${category.totalSold || 0} sold</p>
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
                    <h3 class="section-title">
                        <span>🛍️</span>
                        Products
                    </h3>
                    
                    ${products.length > 0 ? `
                        <div class="products-grid">
                            ${products.map(product => `
                                <div class="product-card ${this.selectedProduct?.id === product.id ? 'selected' : ''}" 
                                     onclick="UI.selectProduct('${product.id}')"
                                     data-product-id="${product.id}">
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
                
                <div class="buy-section" id="buy-section" style="display: none;">
                    <div class="buy-summary">
                        <div class="buy-product-info">
                            <span class="buy-product-name" id="buy-product-name"></span>
                            <span class="buy-product-price" id="buy-product-price"></span>
                        </div>
                    </div>
                    <button class="buy-btn" onclick="UI.processPurchase()">
                        <span class="buy-btn-icon">🛒</span>
                        <span class="buy-btn-text">Buy Now</span>
                    </button>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = pageHTML;
    },

    // Select product
    async selectProduct(productId) {
        TelegramWebApp.haptic('selection');
        
        const product = await Database.getProduct(productId);
        if (!product) return;
        
        // Update selection UI
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        this.selectedProduct = product;
        
        // Show buy section
        const buySection = document.getElementById('buy-section');
        const productName = document.getElementById('buy-product-name');
        const productPrice = document.getElementById('buy-product-price');
        
        if (buySection && productName && productPrice) {
            productName.textContent = `${product.name} - ${product.amount}`;
            productPrice.textContent = this.formatCurrency(product.price);
            buySection.style.display = 'flex';
            buySection.classList.add('show');
        }
        
        // Show main button
        TelegramWebApp.showMainButton(`🛒 Buy Now - ${this.formatCurrency(product.price)}`, () => {
            this.processPurchase();
        });
    },

    // Process purchase
    async processPurchase() {
        if (!this.selectedProduct) {
            this.showToast('Please select a product', 'error');
            return;
        }
        
        TelegramWebApp.haptic('impact', 'medium');
        
        // Get input data
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
            TelegramWebApp.haptic('notification', 'error');
            return;
        }
        
        // Show confirmation
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
                            
                            <div class="purchase-info-list">
                                ${Object.entries(inputData).map(([key, value]) => `
                                    <div class="purchase-info-item">
                                        <span class="info-label">${key}:</span>
                                        <span class="info-value">${value}</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="purchase-price-section">
                                <div class="balance-row">
                                    <span>Your Balance:</span>
                                    <span class="balance-value">${this.formatCurrency(user.balance)}</span>
                                </div>
                                <div class="price-row">
                                    <span>Price:</span>
                                    <span class="price-value">- ${this.formatCurrency(product.price)}</span>
                                </div>
                                <div class="remaining-row">
                                    <span>Remaining:</span>
                                    <span class="remaining-value ${user.balance < product.price ? 'insufficient' : ''}">
                                        ${this.formatCurrency(user.balance - product.price)}
                                    </span>
                                </div>
                            </div>
                            
                            ${user.balance < product.price ? `
                                <div class="insufficient-warning">
                                    <span>⚠️</span>
                                    <span>Insufficient balance! Please top up first.</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        ${user.balance >= product.price ? `
                            <button class="btn btn-primary" onclick="UI.confirmPurchase(${JSON.stringify(inputData).replace(/"/g, '&quot;')})">
                                <span>✅</span>
                                <span>Confirm Purchase</span>
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="UI.closeModal(); UI.showTopupModal();">
                                <span>💰</span>
                                <span>Top Up Now</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
    },

    // Confirm purchase
    async confirmPurchase(inputData) {
        const user = Auth.getUser();
        const product = this.selectedProduct;
        const category = await Database.getCategory(product.categoryId);
        
        // Verify purchase
        const verification = await Auth.verifyPurchase(product.price);
        if (!verification.verified) {
            this.closeModal();
            return;
        }
        
        // Show loading
        this.showModalLoading('Processing order...');
        
        try {
            // Deduct balance
            await Database.updateUserBalance(user.telegramId, product.price, 'subtract');
            
            // Create order
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
                inputData: inputData,
                currentTotalOrders: user.totalOrders,
                currentPendingOrders: user.pendingOrders
            });
            
            this.closeModal();
            
            // Refresh balance
            await Auth.refreshUser();
            await this.updateBalanceDisplay();
            
            // Show success
            TelegramWebApp.haptic('notification', 'success');
            this.showSuccessModal(order);
            
        } catch (error) {
            console.error('Purchase error:', error);
            this.closeModal();
            this.showToast('Purchase failed. Please try again.', 'error');
        }
    },

    // Show success modal
    showSuccessModal(order) {
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content success-modal" onclick="event.stopPropagation()">
                    <div class="success-animation">
                        <div class="success-icon">✅</div>
                        <div class="success-particles"></div>
                    </div>
                    <h2>Order Submitted!</h2>
                    <p>Your order has been submitted successfully.</p>
                    <div class="order-id">
                        <span>Order ID:</span>
                        <code>${order.orderId}</code>
                    </div>
                    <p class="success-note">
                        Admin will process your order shortly. 
                        You will receive a notification when it's completed.
                    </p>
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
        TelegramWebApp.haptic('impact', 'light');
        
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
                                <input type="number" class="input-field" id="topup-amount" 
                                       placeholder="Enter amount" min="1000" step="1000">
                                <div class="quick-amounts">
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value = 5000">5,000</button>
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value = 10000">10,000</button>
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value = 20000">20,000</button>
                                    <button class="quick-btn" onclick="document.getElementById('topup-amount').value = 50000">50,000</button>
                                </div>
                            </div>
                            
                            <div class="input-group">
                                <label class="input-label">Payment Method</label>
                                <div class="payment-methods">
                                    ${paymentMethods.length > 0 ? paymentMethods.map((method, index) => `
                                        <label class="payment-option ${index === 0 ? 'selected' : ''}" data-method-id="${method.id}">
                                            <input type="radio" name="payment-method" value="${method.id}" ${index === 0 ? 'checked' : ''}>
                                            <div class="payment-option-content">
                                                <div class="payment-icon">
                                                    ${method.icon ? `<img src="${method.icon}">` : '💳'}
                                                </div>
                                                <div class="payment-info">
                                                    <span class="payment-name">${method.name}</span>
                                                    <span class="payment-address">${method.address}</span>
                                                </div>
                                            </div>
                                        </label>
                                    `).join('') : `
                                        <div class="empty-state small">
                                            <span>No payment methods available</span>
                                        </div>
                                    `}
                                </div>
                            </div>
                            
                            ${paymentMethods.length > 0 ? `
                                <div class="payment-details" id="payment-details">
                                    <h4>Payment Details</h4>
                                    <div class="detail-item">
                                        <span class="label">Account Name:</span>
                                        <span class="value" id="account-name">${paymentMethods[0]?.accountName || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">Account Number:</span>
                                        <span class="value copyable" id="account-number" onclick="UI.copyToClipboard('${paymentMethods[0]?.address}')">${paymentMethods[0]?.address || '-'}</span>
                                    </div>
                                    ${paymentMethods[0]?.note ? `
                                        <div class="detail-note">
                                            <span>📝 ${paymentMethods[0].note}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <div class="input-group">
                                    <label class="input-label">Upload Receipt (ငွေလွှဲပြေစာ)</label>
                                    <div class="file-upload" onclick="document.getElementById('receipt-file').click()">
                                        <input type="file" id="receipt-file" accept="image/*" onchange="UI.handleReceiptUpload(event)" hidden>
                                        <div class="file-upload-content" id="file-upload-content">
                                            <span class="upload-icon">📤</span>
                                            <span class="upload-text">Click to upload receipt</span>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
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
        
        // Setup payment method selection
        setTimeout(() => {
            document.querySelectorAll('.payment-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    
                    const methodId = option.dataset.methodId;
                    const method = paymentMethods.find(m => m.id === methodId);
                    if (method) {
                        document.getElementById('account-name').textContent = method.accountName;
                        document.getElementById('account-number').textContent = method.address;
                        document.getElementById('account-number').onclick = () => UI.copyToClipboard(method.address);
                    }
                });
            });
        }, 100);
    },

    // Handle receipt upload
    async handleReceiptUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const uploadContent = document.getElementById('file-upload-content');
        uploadContent.innerHTML = `
            <div class="upload-loading">
                <div class="spinner"></div>
                <span>Uploading...</span>
            </div>
        `;
        
        try {
            // Validate and upload image
            const base64 = await ImageUploader.uploadImage(file);
            
            uploadContent.innerHTML = `
                <div class="upload-preview">
                    <img src="${base64}" alt="Receipt">
                    <span class="upload-success">✅ Uploaded</span>
                </div>
            `;
            
            // Store for later use
            this.uploadedReceipt = base64;
            
        } catch (error) {
            uploadContent.innerHTML = `
                <div class="upload-error">
                    <span>❌</span>
                    <span>${error.message}</span>
                </div>
            `;
            
            // Check for 18+ content ban
            if (error.message.includes('inappropriate')) {
                await Database.banUser(Auth.getUserId(), '18+ content upload attempt');
                Auth.showBannedMessage();
            }
        }
    },

    // Submit topup
    async submitTopup() {
        const amount = document.getElementById('topup-amount')?.value;
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
        
        if (!amount || amount < 1000) {
            this.showToast('Please enter amount (minimum 1,000 MMK)', 'error');
            return;
        }
        
        if (!selectedMethod) {
            this.showToast('Please select payment method', 'error');
            return;
        }
        
        if (!this.uploadedReceipt) {
            this.showToast('Please upload payment receipt', 'error');
            return;
        }
        
        const user = Auth.getUser();
        const paymentMethods = await Database.getPaymentMethods();
        const method = paymentMethods.find(m => m.id === selectedMethod.value);
        
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
            
            TelegramWebApp.haptic('notification', 'success');
            this.showToast('Deposit request submitted! Admin will review shortly.', 'success');
            
        } catch (error) {
            console.error('Topup error:', error);
            this.showToast('Failed to submit. Please try again.', 'error');
        }
    },

    // Show order history
    async showOrderHistory() {
        TelegramWebApp.haptic('impact', 'light');
        
        const user = Auth.getUser();
        const orders = await Database.getOrders({ telegramId: user.telegramId });
        const deposits = await Database.getDeposits({ telegramId: user.telegramId });
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content history-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>📦 My History</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="history-tabs">
                            <button class="tab-btn active" onclick="UI.switchHistoryTab('orders')">Orders</button>
                            <button class="tab-btn" onclick="UI.switchHistoryTab('deposits')">Deposits</button>
                        </div>
                        
                        <div class="history-content">
                            <div class="tab-content active" id="orders-tab">
                                ${orders.length > 0 ? `
                                    <div class="history-list">
                                        ${orders.map(order => `
                                            <div class="history-item ${order.status}">
                                                <div class="history-icon">
                                                    ${order.status === 'approved' ? '✅' : 
                                                      order.status === 'rejected' ? '❌' : '⏳'}
                                                </div>
                                                <div class="history-info">
                                                    <span class="history-title">${order.productName}</span>
                                                    <span class="history-subtitle">${order.orderId}</span>
                                                    <span class="history-date">${new Date(order.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div class="history-amount">
                                                    <span class="amount">-${this.formatCurrency(order.price)}</span>
                                                    <span class="status-badge ${order.status}">${order.status}</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="empty-state">
                                        <span>📦</span>
                                        <p>No orders yet</p>
                                    </div>
                                `}
                            </div>
                            
                            <div class="tab-content" id="deposits-tab">
                                ${deposits.length > 0 ? `
                                    <div class="history-list">
                                        ${deposits.map(deposit => `
                                            <div class="history-item ${deposit.status}">
                                                <div class="history-icon">
                                                    ${deposit.status === 'approved' ? '✅' : 
                                                      deposit.status === 'rejected' ? '❌' : '⏳'}
                                                </div>
                                                <div class="history-info">
                                                    <span class="history-title">Deposit</span>
                                                    <span class="history-subtitle">${deposit.depositId}</span>
                                                    <span class="history-date">${new Date(deposit.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div class="history-amount">
                                                    <span class="amount positive">+${this.formatCurrency(deposit.amount)}</span>
                                                    <span class="status-badge ${deposit.status}">${deposit.status}</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="empty-state">
                                        <span>💰</span>
                                        <p>No deposits yet</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
    },

    // Switch history tab
    switchHistoryTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        event.target.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    },

    // Open admin panel
    async openAdminPanel() {
        if (!Auth.checkAdmin()) {
            this.showToast('Access denied', 'error');
            return;
        }
        
        const verified = await Auth.verifyAdminAccess();
        if (!verified) return;
        
        TelegramWebApp.haptic('impact', 'medium');
        
        // Load admin panel
        this.currentPage = 'admin';
        Admin.init();
    },

    // Go back
    goBack() {
        TelegramWebApp.haptic('impact', 'light');
        TelegramWebApp.hideMainButton();
        TelegramWebApp.hideBackButton();
        
        this.selectedProduct = null;
        this.currentCategory = null;
        this.currentPage = 'home';
        
        // Re-render dashboard
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <header id="header" class="header"></header>
            <div id="banner-container" class="banner-container"></div>
            <div id="announcement-container" class="announcement-container"></div>
            <div id="categories-container" class="categories-container"></div>
        `;
        
        this.cacheElements();
        this.renderDashboard();
    },

    // Update balance display
    async updateBalanceDisplay() {
        const user = await Auth.refreshUser();
        const balanceElement = document.getElementById('balance-amount');
        if (balanceElement && user) {
            balanceElement.textContent = this.formatCurrency(user.balance);
        }
    },

    // Show modal
    showModal(html) {
        const modalContainer = document.getElementById('modal');
        modalContainer.innerHTML = html;
        modalContainer.classList.add('active');
        document.body.classList.add('modal-open');
    },

    // Close modal
    closeModal() {
        const modalContainer = document.getElementById('modal');
        modalContainer.classList.remove('active');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
            modalContainer.innerHTML = '';
        }, 300);
    },

    // Show modal loading
    showModalLoading(text = 'Loading...') {
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="modal-loading">
                    <div class="spinner"></div>
                    <p>${text}</p>
                </div>
            `;
        }
    },

    // Show page loading
    showPageLoading() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="page-loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    },

    // Show toast
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-content ${type}">
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied!', 'success');
            TelegramWebApp.haptic('notification', 'success');
        } catch (error) {
            this.showToast('Failed to copy', 'error');
        }
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('my-MM', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0) + ' MMK';
    },

    // Setup navigation
    setupNavigation() {
        // Handle start param for deep linking
        const startParam = TelegramWebApp.getStartParam();
        if (startParam) {
            if (startParam.startsWith('cat_')) {
                this.openCategory(startParam);
            } else if (startParam.startsWith('prod_')) {
                // Handle product deep link
            }
        }
    }
};
