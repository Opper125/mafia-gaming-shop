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

// ============================================
// PART 2 - Purchase & Order System
// ============================================

MafiaGamingApp.prototype.initiatePurchase = function() {
    if (!AppState.selectedProduct) {
        Utils.Toast.warning('Warning', 'Please select a product first');
        return;
    }

    // Validate input tables
    const categoryInputTables = AppState.inputTables.filter(
        t => t.categoryId === AppState.currentCategory?.id
    );

    for (const table of categoryInputTables) {
        if (table.required && !AppState.inputValues[table.id]) {
            // Show error on the input field
            const inputField = document.querySelector(`[data-table-id="${table.id}"]`);
            if (inputField) {
                inputField.classList.add('error');
                const errorEl = inputField.parentElement.querySelector('.input-error-message');
                if (errorEl) {
                    errorEl.textContent = `${table.name} is required`;
                    errorEl.style.display = 'block';
                }
            }
            
            Utils.Toast.warning('Required Field', `Please enter ${table.name}`);
            TelegramWebApp.haptic('notification', 'error');
            return;
        }
    }

    // Check balance
    const product = AppState.selectedProduct;
    const price = product.hasDiscount 
        ? product.price - (product.price * product.discount / 100)
        : product.price;

    if (AppState.balance < price) {
        // Track failed attempt
        this.trackFailedPurchaseAttempt();
        
        Utils.Toast.error('Insufficient Balance', 'Please topup your balance first');
        TelegramWebApp.haptic('notification', 'error');
        return;
    }

    // Open purchase confirmation modal
    this.openPurchaseModal(product, price);
};

MafiaGamingApp.prototype.trackFailedPurchaseAttempt = function() {
    const today = new Date().toDateString();
    
    if (AppState.lastFailedAttemptDate !== today) {
        AppState.failedPurchaseAttempts = 0;
        AppState.lastFailedAttemptDate = today;
    }
    
    AppState.failedPurchaseAttempts++;
    
    if (AppState.failedPurchaseAttempts >= 5) {
        this.banUser('Exceeded failed purchase attempts (insufficient balance)');
    } else {
        const remaining = 5 - AppState.failedPurchaseAttempts;
        Utils.Toast.warning('Warning', `${remaining} attempts remaining before account ban`);
    }
};

MafiaGamingApp.prototype.banUser = async function(reason) {
    try {
        let bannedUsers = await Utils.JSONBin.read('bannedUsers') || [];
        
        const banRecord = {
            id: AppState.user.id,
            username: AppState.user.username,
            firstName: AppState.user.first_name,
            lastName: AppState.user.last_name,
            reason: reason,
            bannedAt: new Date().toISOString()
        };
        
        bannedUsers.push(banRecord);
        await Utils.JSONBin.update('bannedUsers', bannedUsers);
        
        // Show banned message and close app
        await TelegramWebApp.showAlert('Your account has been banned due to: ' + reason);
        TelegramWebApp.close();
        
    } catch (error) {
        console.error('Error banning user:', error);
    }
};

MafiaGamingApp.prototype.openPurchaseModal = function(product, price) {
    const modal = document.getElementById('purchase-modal');
    if (!modal) return;

    // Update modal content
    document.getElementById('purchase-product-icon').src = product.icon;
    document.getElementById('purchase-product-name').textContent = product.name;
    document.getElementById('purchase-product-amount').textContent = product.name;
    document.getElementById('purchase-product-price').textContent = Utils.Format.currency(price, product.currency);
    
    document.getElementById('purchase-balance').textContent = Utils.Format.currency(AppState.balance, 'MMK');
    document.getElementById('purchase-price').textContent = Utils.Format.currency(price, product.currency);
    document.getElementById('purchase-remaining').textContent = Utils.Format.currency(AppState.balance - price, 'MMK');

    // Show input summary
    const inputSummary = document.getElementById('input-summary');
    if (inputSummary) {
        const categoryInputTables = AppState.inputTables.filter(
            t => t.categoryId === AppState.currentCategory?.id
        );

        if (categoryInputTables.length > 0) {
            inputSummary.innerHTML = `
                <div class="input-summary-title">Your Input:</div>
                ${categoryInputTables.map(table => `
                    <div class="input-summary-item">
                        <span>${table.name}:</span>
                        <span>${AppState.inputValues[table.id] || '-'}</span>
                    </div>
                `).join('')}
            `;
            inputSummary.style.display = 'block';
        } else {
            inputSummary.style.display = 'none';
        }
    }

    Utils.Modal.open('purchase-modal');
    TelegramWebApp.haptic('impact', 'medium');
};

MafiaGamingApp.prototype.setupPurchaseModal = function() {
    // Close button
    document.getElementById('close-purchase-modal')?.addEventListener('click', () => {
        Utils.Modal.close('purchase-modal');
    });

    // Modal overlay click
    document.querySelector('#purchase-modal .modal-overlay')?.addEventListener('click', () => {
        Utils.Modal.close('purchase-modal');
    });

    // Send OTP button
    document.getElementById('send-otp')?.addEventListener('click', async () => {
        await this.sendVerificationOTP();
    });

    // Confirm purchase button
    document.getElementById('confirm-purchase')?.addEventListener('click', async () => {
        await this.confirmPurchase();
    });
};

MafiaGamingApp.prototype.sendVerificationOTP = async function() {
    Utils.Loading.show('Sending OTP...');
    
    try {
        // In production, this would send an actual OTP via Telegram
        // For demo, we'll simulate it
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP temporarily (in production, this should be on server)
        AppState.currentOTP = otp;
        AppState.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
        
        Utils.Toast.success('OTP Sent', 'Check your Telegram messages');
        TelegramWebApp.haptic('notification', 'success');
        
        // Simulate sending message via bot
        console.log('OTP for verification:', otp);
        
    } catch (error) {
        console.error('Error sending OTP:', error);
        Utils.Toast.error('Error', 'Failed to send OTP');
    }
    
    Utils.Loading.hide();
};

MafiaGamingApp.prototype.confirmPurchase = async function() {
    const verifyCode = document.getElementById('verify-code')?.value;
    
    if (!verifyCode) {
        Utils.Toast.warning('Verification Required', 'Please enter your verification code or 2FA password');
        return;
    }

    // Verify OTP or 2FA (simplified for demo)
    // In production, this should be verified on server side
    if (AppState.currentOTP && verifyCode !== AppState.currentOTP) {
        if (Date.now() > AppState.otpExpiry) {
            Utils.Toast.error('OTP Expired', 'Please request a new OTP');
            return;
        }
        Utils.Toast.error('Invalid Code', 'The verification code is incorrect');
        TelegramWebApp.haptic('notification', 'error');
        return;
    }

    Utils.Loading.show('Processing purchase...');

    try {
        const product = AppState.selectedProduct;
        const price = product.hasDiscount 
            ? product.price - (product.price * product.discount / 100)
            : product.price;

        // Create order
        const order = {
            id: Utils.generateOrderId(),
            oderId: Utils.generateOrderId(),
            userId: AppState.user.id,
            userName: TelegramWebApp.formatName(AppState.user),
            userUsername: AppState.user.username,
            productId: product.id,
            productName: product.name,
            productIcon: product.icon,
            categoryId: AppState.currentCategory.id,
            categoryName: AppState.currentCategory.name,
            amount: product.name,
            price: price,
            currency: product.currency,
            inputValues: { ...AppState.inputValues },
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save order
        let orders = await Utils.JSONBin.read('orders') || [];
        orders.push(order);
        await Utils.JSONBin.update('orders', orders);

        // Deduct balance
        let users = await Utils.JSONBin.read('users') || [];
        const userIndex = users.findIndex(u => u.id === AppState.user.id);
        if (userIndex !== -1) {
            users[userIndex].balance -= price;
            users[userIndex].totalOrders = (users[userIndex].totalOrders || 0) + 1;
            AppState.balance = users[userIndex].balance;
            await Utils.JSONBin.update('users', users);
        }

        // Update local state
        AppState.orders.push(order);

        // Close modal
        Utils.Modal.close('purchase-modal');

        // Show success
        Utils.Toast.success('Order Placed!', 'Your order is pending approval');
        TelegramWebApp.haptic('notification', 'success');

        // Clear selection
        AppState.selectedProduct = null;
        AppState.inputValues = {};
        AppState.currentOTP = null;
        
        // Clear verify input
        document.getElementById('verify-code').value = '';
        
        // Update balance display
        this.updateBalanceDisplay();

        // Hide buy button
        this.hideBuyButton();

        // Deselect product
        document.querySelectorAll('.product-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        // Clear input fields
        document.querySelectorAll('.input-table-field').forEach(input => {
            input.value = '';
        });

    } catch (error) {
        console.error('Error processing purchase:', error);
        Utils.Toast.error('Error', 'Failed to process purchase. Please try again.');
    }

    Utils.Loading.hide();
};

// ============================================
// Topup System
// ============================================

MafiaGamingApp.prototype.setupTopupModal = function() {
    // Topup button click
    document.getElementById('topup-btn')?.addEventListener('click', () => {
        this.openTopupModal();
    });

    // Close button
    document.getElementById('close-topup-modal')?.addEventListener('click', () => {
        Utils.Modal.close('topup-modal');
        this.resetTopupModal();
    });

    // Modal overlay click
    document.querySelector('#topup-modal .modal-overlay')?.addEventListener('click', () => {
        Utils.Modal.close('topup-modal');
        this.resetTopupModal();
    });

    // Copy address button
    document.getElementById('copy-address')?.addEventListener('click', () => {
        const address = document.getElementById('selected-payment-address')?.textContent;
        if (address) {
            Utils.copyToClipboard(address);
        }
    });

    // File upload
    this.setupFileUpload();

    // Submit topup
    document.getElementById('submit-topup')?.addEventListener('click', async () => {
        await this.submitTopupRequest();
    });
};

MafiaGamingApp.prototype.openTopupModal = function() {
    const modal = document.getElementById('topup-modal');
    if (!modal) return;

    // Load payment methods
    this.loadPaymentMethods();

    Utils.Modal.open('topup-modal');
    TelegramWebApp.haptic('impact', 'light');
};

MafiaGamingApp.prototype.loadPaymentMethods = function() {
    const container = document.getElementById('payment-methods');
    const paymentForm = document.getElementById('payment-form');
    
    if (!container) return;

    // Show payment methods, hide form
    container.classList.remove('hidden');
    paymentForm?.classList.add('hidden');

    if (AppState.payments.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-credit-card"></i>
                <p>No payment methods available</p>
            </div>
        `;
        return;
    }

    const activePayments = AppState.payments.filter(p => p.active);

    container.innerHTML = activePayments.map(payment => `
        <div class="payment-method-card" data-payment-id="${payment.id}">
            <img src="${payment.icon}" alt="${payment.name}" class="payment-method-icon">
            <span class="payment-method-name">${payment.name}</span>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.payment-method-card').forEach(card => {
        card.addEventListener('click', () => {
            const paymentId = card.dataset.paymentId;
            this.selectPaymentMethod(paymentId);
        });
    });
};

MafiaGamingApp.prototype.selectPaymentMethod = function(paymentId) {
    const payment = AppState.payments.find(p => p.id === paymentId);
    if (!payment) return;

    AppState.selectedPayment = payment;

    // Hide payment methods, show form
    document.getElementById('payment-methods')?.classList.add('hidden');
    document.getElementById('payment-form')?.classList.remove('hidden');

    // Update payment details
    document.getElementById('selected-payment-icon').src = payment.icon;
    document.getElementById('selected-payment-name').textContent = payment.name;
    document.getElementById('selected-payment-address').textContent = payment.address;
    document.getElementById('selected-payment-holder').textContent = payment.holder;

    // Show note if exists
    const noteEl = document.getElementById('payment-note');
    if (noteEl) {
        if (payment.note) {
            noteEl.innerHTML = `<p>${payment.note}</p>`;
            noteEl.style.display = 'block';
        } else {
            noteEl.style.display = 'none';
        }
    }

    TelegramWebApp.haptic('selection');
};

MafiaGamingApp.prototype.setupFileUpload = function() {
    const fileInput = document.getElementById('payment-screenshot');
    const fileUpload = document.getElementById('file-upload');
    const filePreview = document.getElementById('file-preview');
    const previewImage = document.getElementById('preview-image');
    const removeFile = document.getElementById('remove-file');
    const uploadContent = fileUpload?.querySelector('.file-upload-content');

    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const typeValidation = Utils.Validate.fileType(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
        if (!typeValidation.valid) {
            Utils.Toast.error('Invalid File', typeValidation.message);
            return;
        }

        const sizeValidation = Utils.Validate.fileSize(file, 5); // 5MB max
        if (!sizeValidation.valid) {
            Utils.Toast.error('File Too Large', sizeValidation.message);
            return;
        }

        // Check for inappropriate content
        const contentCheck = await Utils.Validate.checkImage(file);
        if (!contentCheck.safe) {
            Utils.Toast.error('Invalid Image', 'This image is not allowed');
            this.banUser('Uploaded inappropriate content');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            if (previewImage) previewImage.src = event.target.result;
            if (uploadContent) uploadContent.classList.add('hidden');
            if (filePreview) filePreview.classList.remove('hidden');
            AppState.topupScreenshot = event.target.result;
        };
        reader.readAsDataURL(file);

        TelegramWebApp.haptic('selection');
    });

    removeFile?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        fileInput.value = '';
        if (previewImage) previewImage.src = '';
        if (uploadContent) uploadContent.classList.remove('hidden');
        if (filePreview) filePreview.classList.add('hidden');
        AppState.topupScreenshot = null;
    });
};

MafiaGamingApp.prototype.submitTopupRequest = async function() {
    const amount = document.getElementById('topup-amount')?.value;
    
    if (!amount || parseFloat(amount) < 1000) {
        Utils.Toast.warning('Invalid Amount', 'Minimum topup amount is 1,000 MMK');
        return;
    }

    if (!AppState.topupScreenshot) {
        Utils.Toast.warning('Screenshot Required', 'Please upload payment screenshot');
        return;
    }

    if (!AppState.selectedPayment) {
        Utils.Toast.warning('Payment Required', 'Please select a payment method');
        return;
    }

    Utils.Loading.show('Submitting topup request...');

    try {
        const topupRequest = {
            id: Utils.generateId('topup'),
            oderId: Utils.generateOrderId(),
            userId: AppState.user.id,
            userName: TelegramWebApp.formatName(AppState.user),
            userUsername: AppState.user.username,
            amount: parseFloat(amount),
            paymentMethod: AppState.selectedPayment.name,
            paymentId: AppState.selectedPayment.id,
            screenshot: AppState.topupScreenshot,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save topup request
        let topupRequests = await Utils.JSONBin.read('topupRequests') || [];
        topupRequests.push(topupRequest);
        await Utils.JSONBin.update('topupRequests', topupRequests);

        // Close modal
        Utils.Modal.close('topup-modal');
        this.resetTopupModal();

        Utils.Toast.success('Request Submitted', 'Your topup request is pending approval');
        TelegramWebApp.haptic('notification', 'success');

    } catch (error) {
        console.error('Error submitting topup:', error);
        Utils.Toast.error('Error', 'Failed to submit topup request');
    }

    Utils.Loading.hide();
};

MafiaGamingApp.prototype.resetTopupModal = function() {
    // Reset form
    document.getElementById('topup-amount').value = '';
    document.getElementById('payment-screenshot').value = '';
    
    // Reset preview
    const uploadContent = document.querySelector('#file-upload .file-upload-content');
    const filePreview = document.getElementById('file-preview');
    if (uploadContent) uploadContent.classList.remove('hidden');
    if (filePreview) filePreview.classList.add('hidden');
    
    // Show payment methods, hide form
    document.getElementById('payment-methods')?.classList.remove('hidden');
    document.getElementById('payment-form')?.classList.add('hidden');
    
    // Reset state
    AppState.selectedPayment = null;
    AppState.topupScreenshot = null;
};

// ============================================
// PART 3 - Orders, History & Profile
// ============================================

MafiaGamingApp.prototype.loadOrders = async function() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    Utils.Loading.show('Loading orders...');

    try {
        // Refresh orders from database
        const allOrders = await Utils.JSONBin.read('orders') || [];
        AppState.orders = allOrders.filter(o => o.userId === AppState.user.id);

        if (AppState.orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>No orders yet</p>
                </div>
            `;
            Utils.Loading.hide();
            return;
        }

        // Sort by date (newest first)
        const sortedOrders = [...AppState.orders].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        ordersList.innerHTML = sortedOrders.map(order => this.createOrderCard(order)).join('');

        // Setup order filter buttons
        this.setupOrderFilters();

    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading orders</p>
            </div>
        `;
    }

    Utils.Loading.hide();
};

MafiaGamingApp.prototype.createOrderCard = function(order) {
    const statusClass = order.status.toLowerCase();
    const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);

    // Get input values display
    const inputValuesHtml = order.inputValues ? Object.entries(order.inputValues).map(([key, value]) => {
        const table = AppState.inputTables.find(t => t.id === key);
        return `<span class="order-input-item">${table?.name || key}: <span>${value}</span></span>`;
    }).join('') : '';

    return `
        <div class="order-card" data-order-id="${order.id}" data-status="${order.status}">
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            <div class="order-body">
                <img src="${order.productIcon}" alt="${order.productName}" class="order-product-icon">
                <div class="order-details">
                    <span class="order-product-name">${order.productName}</span>
                    <span class="order-product-amount">${order.categoryName}</span>
                </div>
                <div class="order-price">
                    <span class="order-price-value">${Utils.Format.currency(order.price, order.currency)}</span>
                    <span class="order-date">${Utils.Format.date(order.createdAt, 'relative')}</span>
                </div>
            </div>
            ${inputValuesHtml ? `
                <div class="order-footer">
                    <div class="order-input-values">${inputValuesHtml}</div>
                </div>
            ` : ''}
        </div>
    `;
};

MafiaGamingApp.prototype.setupOrderFilters = function() {
    const filterBtns = document.querySelectorAll('.orders-filter .filter-btn');
    const orderCards = document.querySelectorAll('.order-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            // Filter orders
            orderCards.forEach(card => {
                if (filter === 'all' || card.dataset.status === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

            TelegramWebApp.haptic('selection');
        });
    });
};

MafiaGamingApp.prototype.loadHistory = async function() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    Utils.Loading.show('Loading history...');

    try {
        // Get orders and topup requests
        const allOrders = await Utils.JSONBin.read('orders') || [];
        const userOrders = allOrders.filter(o => o.userId === AppState.user.id);

        const allTopups = await Utils.JSONBin.read('topupRequests') || [];
        const userTopups = allTopups.filter(t => t.userId === AppState.user.id);

        // Combine and sort by date
        const history = [
            ...userOrders.map(o => ({ ...o, type: 'order' })),
            ...userTopups.map(t => ({ ...t, type: 'topup' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions yet</p>
                </div>
            `;
            Utils.Loading.hide();
            return;
        }

        historyList.innerHTML = history.map(item => this.createHistoryCard(item)).join('');

        // Setup history filters
        this.setupHistoryFilters();

    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading history</p>
            </div>
        `;
    }

    Utils.Loading.hide();
};

MafiaGamingApp.prototype.createHistoryCard = function(item) {
    const isTopup = item.type === 'topup';
    const isApproved = item.status === 'approved';
    const isRejected = item.status === 'rejected';

    let iconClass, title, subtitle, amountClass;

    if (isTopup) {
        iconClass = isRejected ? 'rejected' : 'topup';
        title = 'Balance Topup';
        subtitle = item.paymentMethod;
        amountClass = isApproved ? 'positive' : (isRejected ? 'negative' : '');
    } else {
        iconClass = isRejected ? 'rejected' : 'purchase';
        title = item.productName;
        subtitle = item.categoryName;
        amountClass = 'negative';
    }

    const icon = isTopup 
        ? (isRejected ? 'fas fa-times-circle' : 'fas fa-arrow-down')
        : (isRejected ? 'fas fa-times-circle' : 'fas fa-shopping-cart');

    return `
        <div class="history-card" data-type="${item.type}" data-status="${item.status}">
            <div class="history-icon ${iconClass}">
                <i class="${icon}"></i>
            </div>
            <div class="history-details">
                <span class="history-title">${title}</span>
                <span class="history-subtitle">${subtitle} • ${item.status}</span>
            </div>
            <div class="history-amount">
                <span class="history-amount-value ${amountClass}">${Utils.Format.currency(item.amount || item.price, item.currency || 'MMK')}</span>
                <span class="history-date">${Utils.Format.date(item.createdAt, 'relative')}</span>
            </div>
        </div>
    `;
};

MafiaGamingApp.prototype.setupHistoryFilters = function() {
    const filterBtns = document.querySelectorAll('.history-filter .filter-btn');
    const historyCards = document.querySelectorAll('.history-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            historyCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'flex';
                } else if (filter === 'topup' && card.dataset.type === 'topup') {
                    card.style.display = 'flex';
                } else if (filter === 'purchase' && card.dataset.type === 'order') {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });

            TelegramWebApp.haptic('selection');
        });
    });
};

MafiaGamingApp.prototype.loadProfile = async function() {
    try {
        // Get user data
        const users = await Utils.JSONBin.read('users') || [];
        const userData = users.find(u => u.id === AppState.user.id);

        if (userData) {
            AppState.balance = userData.balance || 0;
        }

        // Update profile UI
        const profileAvatar = document.getElementById('profile-avatar');
        const profileName = document.getElementById('profile-name');
        const profileUsername = document.getElementById('profile-username');
        const profilePremium = document.getElementById('profile-premium');
        const profileTgId = document.getElementById('profile-tg-id');
        const profileJoined = document.getElementById('profile-joined');

        if (profileAvatar) {
            profileAvatar.src = TelegramWebApp.getAvatarUrl(AppState.user.id, AppState.user.photo_url);
        }
        if (profileName) {
            profileName.textContent = TelegramWebApp.formatName(AppState.user);
        }
        if (profileUsername) {
            profileUsername.textContent = AppState.user.username ? `@${AppState.user.username}` : '';
        }
        if (profilePremium && AppState.user.is_premium) {
            profilePremium.style.display = 'flex';
        }
        if (profileTgId) {
            profileTgId.textContent = AppState.user.id;
        }
        if (profileJoined && userData?.joinedAt) {
            profileJoined.textContent = Utils.Format.date(userData.joinedAt, 'short');
        }

        // Update stats
        document.getElementById('stat-balance').textContent = Utils.Format.currency(AppState.balance, 'MMK');
        document.getElementById('stat-orders').textContent = userData?.totalOrders || 0;
        document.getElementById('stat-completed').textContent = userData?.completedOrders || 0;

        // Update balance display in header too
        this.updateBalanceDisplay();

    } catch (error) {
        console.error('Error loading profile:', error);
    }
};

MafiaGamingApp.prototype.setupProfileMenu = function() {
    // Topup menu item
    document.getElementById('menu-topup')?.addEventListener('click', () => {
        this.openTopupModal();
    });

    // Orders menu item
    document.getElementById('menu-orders')?.addEventListener('click', () => {
        this.switchTab('orders');
    });

    // History menu item
    document.getElementById('menu-history')?.addEventListener('click', () => {
        this.switchTab('history');
    });

    // Support menu item
    document.getElementById('menu-support')?.addEventListener('click', () => {
        TelegramWebApp.openTelegramLink('https://t.me/OPPER101');
    });
};

MafiaGamingApp.prototype.setupThemeToggle = function() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        // Load saved theme
        const savedTheme = Utils.Storage.get('theme', 'dark');
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';

        themeToggle.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            Utils.Storage.set('theme', theme);
            TelegramWebApp.haptic('selection');
        });
    }
};

MafiaGamingApp.prototype.setupBackButton = function() {
    // Back button in category page
    document.getElementById('back-to-home')?.addEventListener('click', () => {
        this.closeCategory();
    });
};

MafiaGamingApp.prototype.setupShareButtons = function() {
    document.querySelectorAll('.product-share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            this.shareProduct(productId);
        });
    });
};

MafiaGamingApp.prototype.shareProduct = function(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (!product) return;

    const price = product.hasDiscount 
        ? product.price - (product.price * product.discount / 100)
        : product.price;

    const text = `🎮 ${product.name}\n💰 Price: ${Utils.Format.currency(price, product.currency)}\n\n🛒 Buy now at Mafia Gaming Shop!`;
    const url = `https://t.me/mafia_gamingshopbot`;

    TelegramWebApp.share(url, text);
    TelegramWebApp.haptic('impact', 'light');
};

MafiaGamingApp.prototype.openAdminPanel = function() {
    if (!AppState.isAdmin) {
        Utils.Toast.error('Access Denied', 'You are not authorized to access admin panel');
        this.switchTab('home');
        return;
    }

    // Redirect to admin page
    window.location.href = '/admin.html';
};

// ============================================
// PART 4 - Real-time Updates, Error Handling & Initialization
// ============================================

// ============================================
// Real-time Data Sync
// ============================================

MafiaGamingApp.prototype.startRealTimeSync = function() {
    // Sync data every 30 seconds
    this.syncInterval = setInterval(async () => {
        await this.syncData();
    }, 30000);

    // Also sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            this.syncData();
        }
    });
};

MafiaGamingApp.prototype.syncData = async function() {
    try {
        // Sync user balance
        const users = await Utils.JSONBin.read('users') || [];
        const userData = users.find(u => u.id === AppState.user.id);
        
        if (userData) {
            const oldBalance = AppState.balance;
            AppState.balance = userData.balance || 0;
            
            // Notify if balance changed
            if (oldBalance !== AppState.balance) {
                this.updateBalanceDisplay();
                
                if (AppState.balance > oldBalance) {
                    Utils.Toast.success('Balance Updated', `+${Utils.Format.currency(AppState.balance - oldBalance, 'MMK')}`);
                    TelegramWebApp.haptic('notification', 'success');
                }
            }
        }

        // Sync orders status
        const allOrders = await Utils.JSONBin.read('orders') || [];
        const userOrders = allOrders.filter(o => o.userId === AppState.user.id);
        
        // Check for status changes
        userOrders.forEach(newOrder => {
            const oldOrder = AppState.orders.find(o => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
                // Order status changed
                if (newOrder.status === 'approved') {
                    Utils.Toast.success('Order Approved!', `Your order ${newOrder.id} has been approved`);
                    TelegramWebApp.haptic('notification', 'success');
                } else if (newOrder.status === 'rejected') {
                    Utils.Toast.error('Order Rejected', `Your order ${newOrder.id} has been rejected`);
                    TelegramWebApp.haptic('notification', 'error');
                }
            }
        });
        
        AppState.orders = userOrders;

        // Sync settings
        const settings = await Utils.JSONBin.read('settings');
        if (settings) {
            AppState.settings = { ...AppState.settings, ...settings };
            this.updateHeader();
        }

        // Sync announcements
        const announcements = await Utils.JSONBin.read('announcements');
        if (announcements?.text && announcements.text !== AppState.settings.announcement) {
            AppState.settings.announcement = announcements.text;
            Animations.Ticker.update(announcements.text);
        }

        console.log('✅ Data synced');
    } catch (error) {
        console.error('Sync error:', error);
    }
};

MafiaGamingApp.prototype.stopRealTimeSync = function() {
    if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
    }
};

// ============================================
// Push Notifications Handler
// ============================================

MafiaGamingApp.prototype.setupNotifications = function() {
    // Listen for Telegram WebApp events
    if (window.Telegram?.WebApp) {
        // Handle incoming messages/updates
        window.Telegram.WebApp.onEvent('viewportChanged', (data) => {
            console.log('Viewport changed:', data);
        });

        window.Telegram.WebApp.onEvent('themeChanged', () => {
            this.handleThemeChange();
        });

        window.Telegram.WebApp.onEvent('mainButtonClicked', () => {
            console.log('Main button clicked');
        });
    }
};

MafiaGamingApp.prototype.handleThemeChange = function() {
    const colorScheme = window.Telegram?.WebApp?.colorScheme;
    if (colorScheme) {
        document.documentElement.setAttribute('data-theme', colorScheme);
        Utils.Storage.set('theme', colorScheme);
    }
};

// ============================================
// Error Handling
// ============================================

MafiaGamingApp.prototype.setupErrorHandling = function() {
    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
        console.error('Global error:', { message, source, lineno, colno, error });
        this.handleError(error || new Error(message));
        return true;
    };

    // Unhandled promise rejection handler
    window.onunhandledrejection = (event) => {
        console.error('Unhandled rejection:', event.reason);
        this.handleError(event.reason);
    };

    // Network error handler
    window.addEventListener('offline', () => {
        Utils.Toast.warning('Offline', 'You are now offline. Some features may not work.');
    });

    window.addEventListener('online', () => {
        Utils.Toast.success('Online', 'Connection restored');
        this.syncData();
    });
};

MafiaGamingApp.prototype.handleError = function(error) {
    console.error('App error:', error);
    
    // Don't show toast for every error to avoid spam
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
        Utils.Toast.error('Network Error', 'Please check your connection');
    }
};

// ============================================
// Cleanup & Destroy
// ============================================

MafiaGamingApp.prototype.destroy = function() {
    // Stop real-time sync
    this.stopRealTimeSync();

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.syncData);

    // Clear state
    AppState.user = null;
    AppState.isAdmin = false;
    AppState.isAuthenticated = false;

    console.log('🛑 App destroyed');
};

// ============================================
// Utility Methods
// ============================================

MafiaGamingApp.prototype.refreshCurrentView = async function() {
    switch (AppState.currentTab) {
        case 'home':
            await this.loadAllData();
            this.loadHomeContent();
            break;
        case 'orders':
            await this.loadOrders();
            break;
        case 'history':
            await this.loadHistory();
            break;
        case 'profile':
            await this.loadProfile();
            break;
    }
};

MafiaGamingApp.prototype.showLoading = function(message = 'Loading...') {
    Utils.Loading.show(message);
};

MafiaGamingApp.prototype.hideLoading = function() {
    Utils.Loading.hide();
};

MafiaGamingApp.prototype.showToast = function(type, title, message) {
    Utils.Toast[type](title, message);
};

// ============================================
// Data Refresh Methods
// ============================================

MafiaGamingApp.prototype.refreshCategories = async function() {
    try {
        AppState.categories = await Utils.JSONBin.read('categories') || [];
        this.loadCategories();
    } catch (error) {
        console.error('Error refreshing categories:', error);
    }
};

MafiaGamingApp.prototype.refreshProducts = async function() {
    try {
        AppState.products = await Utils.JSONBin.read('products') || [];
        if (AppState.currentCategory) {
            this.loadCategoryProducts(AppState.currentCategory.id);
        }
        this.loadFeaturedProducts();
    } catch (error) {
        console.error('Error refreshing products:', error);
    }
};

MafiaGamingApp.prototype.refreshBanners = async function() {
    try {
        AppState.bannersType1 = await Utils.JSONBin.read('bannersType1') || [];
        AppState.bannersType2 = await Utils.JSONBin.read('bannersType2') || [];
        this.loadBanners();
        if (AppState.currentCategory) {
            this.loadCategoryBanner(AppState.currentCategory.id);
        }
    } catch (error) {
        console.error('Error refreshing banners:', error);
    }
};

MafiaGamingApp.prototype.refreshPayments = async function() {
    try {
        AppState.payments = await Utils.JSONBin.read('payments') || [];
    } catch (error) {
        console.error('Error refreshing payments:', error);
    }
};

MafiaGamingApp.prototype.refreshInputTables = async function() {
    try {
        AppState.inputTables = await Utils.JSONBin.read('inputTables') || [];
        if (AppState.currentCategory) {
            this.loadInputTables(AppState.currentCategory.id);
        }
    } catch (error) {
        console.error('Error refreshing input tables:', error);
    }
};

// ============================================
// User Actions
// ============================================

MafiaGamingApp.prototype.updateUserBalance = async function(amount, operation = 'add') {
    try {
        const users = await Utils.JSONBin.read('users') || [];
        const userIndex = users.findIndex(u => u.id === AppState.user.id);
        
        if (userIndex === -1) return false;

        if (operation === 'add') {
            users[userIndex].balance = (users[userIndex].balance || 0) + amount;
        } else if (operation === 'deduct') {
            users[userIndex].balance = Math.max(0, (users[userIndex].balance || 0) - amount);
        } else if (operation === 'set') {
            users[userIndex].balance = amount;
        }

        await Utils.JSONBin.update('users', users);
        AppState.balance = users[userIndex].balance;
        this.updateBalanceDisplay();

        return true;
    } catch (error) {
        console.error('Error updating balance:', error);
        return false;
    }
};

MafiaGamingApp.prototype.getUserStats = async function() {
    try {
        const users = await Utils.JSONBin.read('users') || [];
        const userData = users.find(u => u.id === AppState.user.id);
        
        if (!userData) return null;

        const allOrders = await Utils.JSONBin.read('orders') || [];
        const userOrders = allOrders.filter(o => o.userId === AppState.user.id);

        const allTopups = await Utils.JSONBin.read('topupRequests') || [];
        const userTopups = allTopups.filter(t => t.userId === AppState.user.id);

        return {
            balance: userData.balance || 0,
            totalOrders: userOrders.length,
            pendingOrders: userOrders.filter(o => o.status === 'pending').length,
            completedOrders: userOrders.filter(o => o.status === 'approved').length,
            rejectedOrders: userOrders.filter(o => o.status === 'rejected').length,
            totalTopups: userTopups.length,
            pendingTopups: userTopups.filter(t => t.status === 'pending').length,
            approvedTopups: userTopups.filter(t => t.status === 'approved').length,
            totalSpent: userOrders.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.price, 0),
            totalTopupAmount: userTopups.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.amount, 0),
            joinedAt: userData.joinedAt,
            lastActive: userData.lastActive,
            isPremium: userData.isPremium
        };
    } catch (error) {
        console.error('Error getting user stats:', error);
        return null;
    }
};

// ============================================
// Search Functionality
// ============================================

MafiaGamingApp.prototype.searchProducts = function(query) {
    if (!query || query.length < 2) {
        return AppState.products;
    }

    const lowerQuery = query.toLowerCase();
    
    return AppState.products.filter(product => {
        const category = AppState.categories.find(c => c.id === product.categoryId);
        return (
            product.name.toLowerCase().includes(lowerQuery) ||
            category?.name.toLowerCase().includes(lowerQuery)
        );
    });
};

MafiaGamingApp.prototype.searchCategories = function(query) {
    if (!query || query.length < 2) {
        return AppState.categories;
    }

    const lowerQuery = query.toLowerCase();
    
    return AppState.categories.filter(category => 
        category.name.toLowerCase().includes(lowerQuery)
    );
};

// ============================================
// Export Functions for External Access
// ============================================

MafiaGamingApp.prototype.getState = function() {
    return { ...AppState };
};

MafiaGamingApp.prototype.getUser = function() {
    return AppState.user;
};

MafiaGamingApp.prototype.getBalance = function() {
    return AppState.balance;
};

MafiaGamingApp.prototype.isAdmin = function() {
    return AppState.isAdmin;
};

MafiaGamingApp.prototype.getCategories = function() {
    return [...AppState.categories];
};

MafiaGamingApp.prototype.getProducts = function(categoryId = null) {
    if (categoryId) {
        return AppState.products.filter(p => p.categoryId === categoryId);
    }
    return [...AppState.products];
};

MafiaGamingApp.prototype.getOrders = function(status = null) {
    if (status) {
        return AppState.orders.filter(o => o.status === status);
    }
    return [...AppState.orders];
};

// ============================================
// Initialize App
// ============================================

// Create global app instance
let app = null;

// Document Ready Handler
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Document ready, initializing app...');
    
    try {
        // Create app instance
        app = new MafiaGamingApp();
        
        // Initialize app
        await app.init();
        
        // Start real-time sync
        app.startRealTimeSync();
        
        // Setup notifications
        app.setupNotifications();
        
        // Setup error handling
        app.setupErrorHandling();
        
        // Export to window for debugging
        window.MafiaApp = app;
        window.AppState = AppState;
        
        console.log('🎮 Mafia Gaming Shop is ready!');
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        
        // Show error state
        const introScreen = document.getElementById('intro-screen');
        if (introScreen) {
            introScreen.innerHTML = `
                <div class="intro-container">
                    <div class="access-denied-icon danger">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h1 style="color: var(--danger); margin-bottom: 16px;">Error</h1>
                    <p style="color: var(--text-secondary);">Failed to load the application</p>
                    <button onclick="location.reload()" style="
                        margin-top: 24px;
                        padding: 12px 32px;
                        background: var(--primary-gradient);
                        color: white;
                        border: none;
                        border-radius: 24px;
                        font-size: 16px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
});

// Handle app visibility
document.addEventListener('visibilitychange', () => {
    if (app) {
        if (document.visibilityState === 'visible') {
            console.log('📱 App visible, syncing...');
            app.syncData();
        } else {
            console.log('📱 App hidden');
        }
    }
});

// Handle before unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.stopRealTimeSync();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MafiaGamingApp, AppState };
}

console.log('📱 App.js loaded successfully');
