/* ============================================
   MAFIA GAMING SHOP - MAIN APPLICATION
   Version: 1.0.0
   ============================================ */

// ============================================
// Global State
// ============================================

const AppState = {
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    balance: 0,
    
    // Data
    categories: [],
    products: [],
    orders: [],
    payments: [],
    bannersType1: [],
    bannersType2: [],
    inputTables: [],
    settings: {
        siteName: 'Mafia Gaming Shop',
        logo: '',
        theme: 'dark',
        announcement: 'Welcome to Mafia Gaming Shop!'
    },
    
    // UI State
    currentTab: 'home',
    currentCategory: null,
    selectedProduct: null,
    inputValues: {},
    
    // Purchase tracking for ban system
    failedPurchaseAttempts: 0,
    lastFailedAttemptDate: null
};

// ============================================
// Application Initialization
// ============================================

class MafiaGamingApp {
    constructor() {
        this.initialized = false;
    }

    async init() {
        console.log('🎮 Initializing Mafia Gaming Shop...');
        
        try {
            // Initialize Telegram WebApp
            const telegramResult = await TelegramWebApp.init();
            
            if (!telegramResult.success) {
                // Not running in Telegram - show access denied
                this.showAccessDenied();
                return;
            }

            // Store user info
            AppState.user = telegramResult.user;
            AppState.isAdmin = telegramResult.isAdmin;
            AppState.isAuthenticated = true;

            // Check if user is banned
            const isBanned = await this.checkIfBanned();
            if (isBanned) {
                this.showBannedScreen();
                return;
            }

            // Initialize utilities
            Utils.Toast.init();
            Utils.Loading.init();

            // Play intro animation
            await this.playIntro();

            // Initialize JSONBin
            await this.initializeDatabase();

            // Load all data
            await this.loadAllData();

            // Setup UI
            this.setupUI();

            // Register/Update user
            await this.registerUser();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize animations
            this.initAnimations();

            this.initialized = true;
            console.log('✅ Mafia Gaming Shop initialized successfully!');

        } catch (error) {
            console.error('❌ Initialization error:', error);
            Utils.Toast.error('Error', 'Failed to initialize app. Please try again.');
        }
    }

    showAccessDenied() {
        const accessDenied = document.getElementById('access-denied');
        const introScreen = document.getElementById('intro-screen');
        const mainApp = document.getElementById('main-app');

        if (introScreen) introScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        if (accessDenied) accessDenied.classList.remove('hidden');
    }

    showBannedScreen() {
        const accessDenied = document.getElementById('access-denied');
        const introScreen = document.getElementById('intro-screen');
        const mainApp = document.getElementById('main-app');

        if (introScreen) introScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        
        if (accessDenied) {
            accessDenied.classList.remove('hidden');
            accessDenied.querySelector('h1').textContent = 'Account Banned';
            accessDenied.querySelector('p').textContent = 'Your account has been banned from using this service.';
            accessDenied.querySelector('.access-hint').textContent = 'Please contact support if you believe this is an error.';
        }
    }

    async checkIfBanned() {
        try {
            const bannedUsers = await Utils.JSONBin.read('bannedUsers') || [];
            return bannedUsers.some(u => u.id === AppState.user.id);
        } catch (error) {
            console.error('Error checking ban status:', error);
            return false;
        }
    }

    async playIntro() {
        return new Promise((resolve) => {
            const introScreen = document.getElementById('intro-screen');
            const mainApp = document.getElementById('main-app');
            const introLogo = document.getElementById('intro-logo');
            const introSiteName = document.getElementById('intro-site-name');

            // Set logo and site name if available
            if (AppState.settings.logo && introLogo) {
                introLogo.src = AppState.settings.logo;
            }
            if (AppState.settings.siteName && introSiteName) {
                introSiteName.textContent = AppState.settings.siteName;
            }

            // Wait for intro animation (5 seconds)
            setTimeout(() => {
                if (introScreen) {
                    introScreen.style.opacity = '0';
                    introScreen.style.transition = 'opacity 0.5s ease-out';
                }

                setTimeout(() => {
                    if (introScreen) introScreen.classList.add('hidden');
                    if (mainApp) mainApp.classList.remove('hidden');
                    resolve();
                }, 500);
            }, 5000);
        });
    }

    async initializeDatabase() {
        Utils.Loading.show('Connecting to database...');
        
        try {
            // Try to load existing bin IDs
            let binIds = await TelegramWebApp.CloudStorage.getItem('jsonbin_ids');
            
            if (binIds) {
                Utils.JSONBin.bins = { ...Utils.JSONBin.bins, ...binIds };
                console.log('✅ Database connected');
            } else {
                // First time setup - create all bins
                Utils.Loading.setText('Setting up database...');
                await Utils.JSONBin.init();
                console.log('✅ Database initialized');
            }
        } catch (error) {
            console.error('Database initialization error:', error);
            // Continue with empty data
        }
        
        Utils.Loading.hide();
    }

    async loadAllData() {
        Utils.Loading.show('Loading data...');

        try {
            // Load all data in parallel
            const [
                categories,
                products,
                orders,
                payments,
                bannersType1,
                bannersType2,
                inputTables,
                settings,
                announcements
            ] = await Promise.all([
                Utils.JSONBin.read('categories'),
                Utils.JSONBin.read('products'),
                Utils.JSONBin.read('orders'),
                Utils.JSONBin.read('payments'),
                Utils.JSONBin.read('bannersType1'),
                Utils.JSONBin.read('bannersType2'),
                Utils.JSONBin.read('inputTables'),
                Utils.JSONBin.read('settings'),
                Utils.JSONBin.read('announcements')
            ]);

            // Update state
            AppState.categories = categories || [];
            AppState.products = products || [];
            AppState.orders = (orders || []).filter(o => o.userId === AppState.user?.id);
            AppState.payments = payments || [];
            AppState.bannersType1 = bannersType1 || [];
            AppState.bannersType2 = bannersType2 || [];
            AppState.inputTables = inputTables || [];
            
            if (settings) {
                AppState.settings = { ...AppState.settings, ...settings };
            }
            
            if (announcements?.text) {
                AppState.settings.announcement = announcements.text;
            }

            console.log('✅ All data loaded');

        } catch (error) {
            console.error('Error loading data:', error);
        }

        Utils.Loading.hide();
    }

    async registerUser() {
        try {
            let users = await Utils.JSONBin.read('users') || [];
            const existingUser = users.find(u => u.id === AppState.user.id);

            if (existingUser) {
                // Update existing user
                existingUser.lastActive = new Date().toISOString();
                existingUser.username = AppState.user.username;
                existingUser.firstName = AppState.user.first_name;
                existingUser.lastName = AppState.user.last_name;
                existingUser.isPremium = AppState.user.is_premium || false;
                
                AppState.balance = existingUser.balance || 0;
            } else {
                // Register new user
                const newUser = {
                    id: AppState.user.id,
                    username: AppState.user.username,
                    firstName: AppState.user.first_name,
                    lastName: AppState.user.last_name,
                    isPremium: AppState.user.is_premium || false,
                    balance: 0,
                    totalOrders: 0,
                    completedOrders: 0,
                    rejectedOrders: 0,
                    totalTopup: 0,
                    joinedAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                };
                
                users.push(newUser);
                AppState.balance = 0;
            }

            await Utils.JSONBin.update('users', users);
            console.log('✅ User registered/updated');

        } catch (error) {
            console.error('Error registering user:', error);
        }
    }

    setupUI() {
        // Update header
        this.updateHeader();
        
        // Update user info bar
        this.updateUserInfo();
        
        // Show/hide admin tab
        this.updateAdminAccess();
        
        // Load home content
        this.loadHomeContent();
        
        // Update balance display
        this.updateBalanceDisplay();
    }

    updateHeader() {
        const headerLogo = document.getElementById('header-logo');
        const headerSiteName = document.getElementById('header-site-name');

        if (AppState.settings.logo && headerLogo) {
            headerLogo.src = AppState.settings.logo;
        }
        if (AppState.settings.siteName && headerSiteName) {
            headerSiteName.textContent = AppState.settings.siteName;
        }
    }

    updateUserInfo() {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const premiumBadge = document.getElementById('premium-badge');

        if (userAvatar) {
            userAvatar.src = TelegramWebApp.getAvatarUrl(AppState.user.id, AppState.user.photo_url);
        }

        if (userName) {
            userName.textContent = TelegramWebApp.formatName(AppState.user);
        }

        if (premiumBadge && AppState.user.is_premium) {
            premiumBadge.style.display = 'flex';
        }
    }

    updateAdminAccess() {
        const adminTab = document.getElementById('admin-tab');
        
        if (adminTab) {
            adminTab.style.display = AppState.isAdmin ? 'flex' : 'none';
        }
    }

    updateBalanceDisplay() {
        const balanceAmount = document.getElementById('user-balance');
        
        if (balanceAmount) {
            balanceAmount.textContent = Utils.Format.currency(AppState.balance, 'MMK');
        }
    }

    loadHomeContent() {
        // Load banners
        this.loadBanners();
        
        // Load announcement ticker
        this.loadAnnouncement();
        
        // Load categories
        this.loadCategories();
        
        // Load featured products
        this.loadFeaturedProducts();
    }

    loadBanners() {
        const bannersContainer = document.getElementById('banner-slides');
        const indicatorsContainer = document.getElementById('banner-indicators');
        
        if (!bannersContainer) return;

        if (AppState.bannersType1.length === 0) {
            bannersContainer.innerHTML = `
                <div class="banner-placeholder">
                    <i class="fas fa-image"></i>
                    <span>No Banners Available</span>
                </div>
            `;
            return;
        }

        bannersContainer.innerHTML = AppState.bannersType1.map(banner => `
            <div class="banner-slide">
                <img src="${banner.image}" alt="Banner" loading="lazy">
            </div>
        `).join('');

        // Initialize carousel
        Animations.Banner.init('banner-carousel');
    }

    loadAnnouncement() {
        const tickerContent = document.getElementById('ticker-content');
        
        if (tickerContent && AppState.settings.announcement) {
            tickerContent.innerHTML = `<span>${AppState.settings.announcement}</span>`;
            Animations.Ticker.init('ticker-content');
            Animations.Ticker.update(AppState.settings.announcement);
        }
    }

    loadCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        
        if (!categoriesGrid) return;

        if (AppState.categories.length === 0) {
            categoriesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-gamepad"></i>
                    <p>No categories available</p>
                </div>
            `;
            return;
        }

        categoriesGrid.innerHTML = AppState.categories.map(category => {
            // Count sold products in this category
            const soldCount = AppState.orders.filter(o => 
                o.categoryId === category.id && o.status === 'approved'
            ).length;

            return `
                <div class="category-card" data-category-id="${category.id}">
                    <div class="category-icon-wrapper">
                        <img src="${category.icon}" alt="${category.name}" class="category-icon">
                        ${category.flag ? `<span class="category-flag">${category.flag}</span>` : ''}
                        ${category.hasDiscount ? '<span class="category-discount-badge">SALE</span>' : ''}
                    </div>
                    <span class="category-name">${category.name}</span>
                    <span class="category-sold">Sold: <span>${soldCount}</span></span>
                </div>
            `;
        }).join('');

        // Add click handlers
        categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.categoryId;
                this.openCategory(categoryId);
            });
        });
    }

    loadFeaturedProducts() {
        const featuredGrid = document.getElementById('featured-products');
        
        if (!featuredGrid) return;

        // Get products with discounts or recent products
        const featuredProducts = AppState.products
            .filter(p => p.hasDiscount || p.active)
            .slice(0, 4);

        if (featuredProducts.length === 0) {
            featuredGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-fire"></i>
                    <p>No featured products</p>
                </div>
            `;
            return;
        }

        featuredGrid.innerHTML = featuredProducts.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const discountedPrice = product.hasDiscount 
            ? product.price - (product.price * product.discount / 100)
            : product.price;

        const deliveryText = product.delivery === 'instant' 
            ? '<i class="fas fa-bolt"></i> Instant' 
            : `<i class="fas fa-clock"></i> ${product.delivery}`;

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.icon}" alt="${product.name}" loading="lazy">
                    ${product.hasDiscount ? `<span class="product-discount-badge">-${product.discount}%</span>` : ''}
                    <span class="product-delivery-badge">${deliveryText}</span>
                    <button class="product-share-btn" data-product-id="${product.id}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-price">
                        <span class="price-current">${Utils.Format.currency(discountedPrice, product.currency)}</span>
                        ${product.hasDiscount ? `<span class="price-original">${Utils.Format.currency(product.price, product.currency)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    initAnimations() {
        // Initialize scroll animations
        Animations.Scroll.init();
        Animations.Scroll.observe('.category-card, .product-card');
    }

    setupEventListeners() {
        // Navigation tabs
        this.setupNavigation();
        
        // Topup button
        this.setupTopupModal();
        
        // Purchase modal
        this.setupPurchaseModal();
        
        // Theme toggle
        this.setupThemeToggle();
        
        // Back button handling
        this.setupBackButton();
        
        // Product share buttons
        this.setupShareButtons();
        
        // Profile menu items
        this.setupProfileMenu();
    }
}

// ============================================
// Navigation & Tab Switching
// ============================================

MafiaGamingApp.prototype.setupNavigation = function() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            this.switchTab(tabName);
            
            // Haptic feedback
            TelegramWebApp.haptic('selection');
        });
    });
};

MafiaGamingApp.prototype.switchTab = function(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Show selected tab content
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Handle category page visibility
    const categoryPage = document.getElementById('category-page');
    if (categoryPage) {
        categoryPage.classList.add('hidden');
    }

    // Load tab-specific content
    switch (tabName) {
        case 'home':
            this.loadHomeContent();
            break;
        case 'orders':
            this.loadOrders();
            break;
        case 'history':
            this.loadHistory();
            break;
        case 'profile':
            this.loadProfile();
            break;
        case 'admin':
            this.openAdminPanel();
            break;
    }

    AppState.currentTab = tabName;
    
    // Update back button
    TelegramWebApp.BackButton.hide();
};

MafiaGamingApp.prototype.openCategory = function(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return;

    AppState.currentCategory = category;

    // Hide home tab and show category page
    document.getElementById('home-tab')?.classList.remove('active');
    
    const categoryPage = document.getElementById('category-page');
    if (categoryPage) {
        categoryPage.classList.remove('hidden');
        categoryPage.classList.add('active');
    }

    // Update category header
    document.getElementById('category-icon').src = category.icon;
    document.getElementById('category-name').textContent = category.name;

    // Load input tables for this category
    this.loadInputTables(categoryId);

    // Load products for this category
    this.loadCategoryProducts(categoryId);

    // Load category banner (Type 2)
    this.loadCategoryBanner(categoryId);

    // Show back button
    TelegramWebApp.BackButton.show(() => {
        this.closeCategory();
    });

    // Haptic feedback
    TelegramWebApp.haptic('impact', 'light');
};

MafiaGamingApp.prototype.closeCategory = function() {
    AppState.currentCategory = null;
    AppState.selectedProduct = null;
    AppState.inputValues = {};

    // Hide category page and show home tab
    const categoryPage = document.getElementById('category-page');
    if (categoryPage) {
        categoryPage.classList.add('hidden');
        categoryPage.classList.remove('active');
    }

    document.getElementById('home-tab')?.classList.add('active');

    // Hide back button
    TelegramWebApp.BackButton.hide();

    // Hide buy button section if exists
    this.hideBuyButton();
};

MafiaGamingApp.prototype.loadInputTables = function(categoryId) {
    const container = document.getElementById('input-tables-container');
    if (!container) return;

    const tables = AppState.inputTables.filter(t => t.categoryId === categoryId);

    if (tables.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = tables.map(table => `
        <div class="input-table-group" data-table-id="${table.id}">
            <label class="input-table-label">${table.name} ${table.required ? '<span style="color: var(--danger);">*</span>' : ''}</label>
            <input type="text" 
                   class="input-table-field" 
                   placeholder="${table.placeholder || ''}"
                   data-table-id="${table.id}"
                   data-required="${table.required}"
                   ${table.required ? 'required' : ''}>
            <div class="input-error-message" style="display: none;"></div>
        </div>
    `).join('');

    // Add input change handlers
    container.querySelectorAll('.input-table-field').forEach(input => {
        input.addEventListener('input', (e) => {
            const tableId = e.target.dataset.tableId;
            AppState.inputValues[tableId] = e.target.value;
            
            // Clear error
            const errorEl = e.target.parentElement.querySelector('.input-error-message');
            if (errorEl) {
                errorEl.style.display = 'none';
                e.target.classList.remove('error');
            }
        });
    });
};

MafiaGamingApp.prototype.loadCategoryProducts = function(categoryId) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    const products = AppState.products.filter(p => p.categoryId === categoryId && p.active);

    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-box-open"></i>
                <p>No products available</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');

    // Add click handlers for product selection
    productsGrid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking share button
            if (e.target.closest('.product-share-btn')) return;
            
            const productId = card.dataset.productId;
            this.selectProduct(productId);
        });
    });

    // Add share button handlers
    this.setupShareButtons();
};

MafiaGamingApp.prototype.loadCategoryBanner = function(categoryId) {
    const bannerSection = document.getElementById('category-banner');
    if (!bannerSection) return;

    const banner = AppState.bannersType2.find(b => b.categoryId === categoryId);

    if (!banner) {
        bannerSection.innerHTML = '';
        bannerSection.style.display = 'none';
        return;
    }

    bannerSection.style.display = 'block';
    bannerSection.innerHTML = `
        <img src="${banner.image}" alt="Category Banner" class="category-banner-image">
        <div class="category-banner-instructions">
            <h3><i class="fas fa-info-circle"></i> Instructions</h3>
            <p>${banner.instructions || ''}</p>
        </div>
    `;
};

MafiaGamingApp.prototype.selectProduct = function(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (!product) return;

    // Deselect previous
    document.querySelectorAll('.product-card.selected').forEach(card => {
        card.classList.remove('selected');
    });

    // Select new
    const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
    if (productCard) {
        productCard.classList.add('selected');
    }

    AppState.selectedProduct = product;

    // Show buy button
    this.showBuyButton(product);

    // Haptic feedback
    TelegramWebApp.haptic('selection');
};

MafiaGamingApp.prototype.showBuyButton = function(product) {
    let buySection = document.querySelector('.buy-now-section');
    
    if (!buySection) {
        buySection = document.createElement('div');
        buySection.className = 'buy-now-section';
        document.body.appendChild(buySection);
    }

    const discountedPrice = product.hasDiscount 
        ? product.price - (product.price * product.discount / 100)
        : product.price;

    buySection.innerHTML = `
        <div class="selected-product-preview">
            <img src="${product.icon}" alt="${product.name}">
            <div class="info">
                <span class="name">${product.name}</span>
                <span class="price">${Utils.Format.currency(discountedPrice, product.currency)}</span>
            </div>
        </div>
        <button class="buy-now-btn" id="buy-now-btn">
            <i class="fas fa-shopping-cart"></i>
            Buy Now
        </button>
    `;

    buySection.style.display = 'flex';

    // Add buy button handler
    document.getElementById('buy-now-btn').addEventListener('click', () => {
        this.initiatePurchase();
    });
};

MafiaGamingApp.prototype.hideBuyButton = function() {
    const buySection = document.querySelector('.buy-now-section');
    if (buySection) {
        buySection.style.display = 'none';
    }
};
