// ============================================
// MAIN APPLICATION - Gaming Top-Up
// ============================================

const App = {
    // State
    currentPage: 'home',
    currentCategory: null,
    selectedProduct: null,
    inputValues: {},
    otpCode: null,
    otpExpiry: null,
    purchaseAttempts: 0,
    
    // User data
    user: null,
    balance: 0,
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    async init() {
        console.log('Initializing Gaming Top-Up App...');
        
        try {
            // Check if running in Telegram
            if (!TelegramApp.isInTelegram()) {
                this.showAccessDenied();
                return;
            }
            
            // Initialize Telegram WebApp
            await TelegramApp.init();
            this.user = TelegramApp.getUser();
            
            if (!this.user) {
                this.showAccessDenied();
                return;
            }
            
            // Check if user is banned
            const isBanned = await Database.isUserBanned(this.user.id);
            if (isBanned) {
                this.showBannedScreen();
                return;
            }
            
            // Initialize database
            await Database.init();
            
            // Save/update user in database
            await this.saveUserData();
            
            // Load user balance
            this.balance = await Database.getBalance(this.user.id);
            
            // Load settings
            await this.loadSettings();
            
            // Play intro animation
            await Animations.playIntro(5000);
            
            // Setup UI
            this.setupUI();
            
            // Load initial data
            await this.loadHomeData();
            
            // Initialize animations
            Animations.init();
            
            // Setup pull to refresh
            Animations.pullToRefresh.init(() => {
                this.refreshCurrentPage();
            });
            
            // Show admin nav if admin
            if (TelegramApp.isAdmin()) {
                document.querySelector('.admin-nav').classList.remove('hidden');
            }
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('App initialization error:', error);
            Animations.showError('Failed to initialize app. Please try again.');
        }
    },
    
    // Show access denied screen
    showAccessDenied() {
        document.getElementById('access-denied').classList.remove('hidden');
        document.getElementById('intro-screen').classList.add('hidden');
        document.getElementById('main-app').classList.add('hidden');
    },
    
    // Show banned screen
    showBannedScreen() {
        document.getElementById('banned-screen').classList.remove('hidden');
        document.getElementById('intro-screen').classList.add('hidden');
        document.getElementById('main-app').classList.add('hidden');
    },
    
    // Save user data to database
    async saveUserData() {
        const userData = {
            telegramId: this.user.id,
            firstName: this.user.first_name,
            lastName: this.user.last_name || '',
            username: this.user.username || '',
            photoUrl: TelegramApp.getUserPhoto(),
            isPremium: TelegramApp.isPremium(),
            languageCode: this.user.language_code || 'en'
        };
        
        await Database.saveUser(userData);
    },
    
    // Load settings
    async loadSettings() {
        try {
            const settings = await Database.getSettings();
            
            // Set site name
            const siteNameElements = document.querySelectorAll('#site-name, #site-name-intro');
            siteNameElements.forEach(el => {
                if (el) el.textContent = settings.siteName || 'Gaming Shop';
            });
            
            // Set logo
            if (settings.siteLogo) {
                const logoElements = document.querySelectorAll('#intro-logo, #header-logo');
                logoElements.forEach(el => {
                    if (el) el.src = settings.siteLogo;
                });
            }
            
            // Set announcement
            if (settings.announcement) {
                Animations.marquee.updateText(settings.announcement);
            }
        } catch (error) {
            console.error('Load settings error:', error);
        }
    },
    
    // Setup UI elements
    setupUI() {
        // Set user info
        document.getElementById('user-photo').src = TelegramApp.getUserPhoto();
        document.getElementById('user-name').textContent = TelegramApp.getUserName();
        document.getElementById('user-username').textContent = TelegramApp.getUsername();
        
        // Set profile info
        document.getElementById('profile-photo').src = TelegramApp.getUserPhoto();
        document.getElementById('profile-name').textContent = TelegramApp.getUserName();
        document.getElementById('profile-username').textContent = TelegramApp.getUsername();
        
        // Premium badge
        const premiumBadge = document.getElementById('premium-badge');
        const profilePremiumBadge = document.getElementById('profile-premium-badge');
        
        if (TelegramApp.isPremium()) {
            if (premiumBadge) premiumBadge.classList.remove('hidden');
            if (profilePremiumBadge) profilePremiumBadge.classList.remove('hidden');
        } else {
            if (premiumBadge) premiumBadge.classList.add('hidden');
            if (profilePremiumBadge) profilePremiumBadge.classList.add('hidden');
        }
        
        // Update balance
        this.updateBalanceDisplay();
        
        // Set theme icon
        const theme = document.documentElement.getAttribute('data-theme');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    },
    
    // Update balance display
    updateBalanceDisplay() {
        const balanceElements = document.querySelectorAll('#user-balance, #modal-balance');
        balanceElements.forEach(el => {
            if (el) el.textContent = this.balance.toLocaleString() + ' MMK';
        });
    },
    
    // ============================================
    // PAGE NAVIGATION
    // ============================================
    
    showPage(pageName) {
        this.currentPage = pageName;
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });
        
        // Handle back button
        if (pageName === 'home') {
            TelegramApp.hideBackButton();
        } else {
            TelegramApp.showBackButton();
        }
        
        // Load page data
        this.loadPageData(pageName);
        
        // Haptic feedback
        TelegramApp.haptic('selection');
    },
    
    // Load page data
    async loadPageData(pageName) {
        switch (pageName) {
            case 'home':
                await this.loadHomeData();
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
            case 'admin':
                await this.initAdminPage();
                break;
        }
    },
    
    // Refresh current page
    async refreshCurrentPage() {
        Animations.showLoading('Refreshing...');
        await this.loadPageData(this.currentPage);
        this.balance = await Database.getBalance(this.user.id);
        this.updateBalanceDisplay();
        Animations.hideLoading();
        Animations.showSuccess('Refreshed!');
    },
    
    // ============================================
    // HOME PAGE
    // ============================================
    
    async loadHomeData() {
        await Promise.all([
            this.loadBanners(),
            this.loadCategories()
        ]);
    },
    
    // Load banners
    async loadBanners() {
        try {
            const banners = await Database.getBannersByType('type1');
            
            if (banners.length > 0) {
                Animations.bannerSlider.init(banners, 7000);
            } else {
                // Default banner
                const container = document.getElementById('banner-container');
                if (container) {
                    container.innerHTML = `
                        <div class="banner-slide">
                            <div class="default-banner">
                                <h2>Welcome to Gaming Shop</h2>
                                <p>Best prices for game top-ups!</p>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Load banners error:', error);
        }
    },
    
    // Load categories
    async loadCategories() {
        const container = document.getElementById('categories-grid');
        if (!container) return;
        
        try {
            const categories = await Database.getCategories();
            
            if (categories.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-gamepad"></i>
                        <p>No categories yet</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = categories.map(cat => `
                <div class="category-card" onclick="App.openCategory('${cat.id}')">
                    ${cat.hasDiscount ? '<span class="category-discount">SALE</span>' : ''}
                    <div class="category-icon">
                        <img src="${cat.icon}" alt="${cat.name}" loading="lazy">
                        ${cat.flag ? `<span class="category-flag">${cat.flag}</span>` : ''}
                    </div>
                    <span class="category-name">${cat.name}</span>
                    <span class="category-sold">
                        <i class="fas fa-shopping-bag"></i>
                        ${cat.soldCount || 0} sold
                    </span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load categories error:', error);
        }
    },
    
    // ============================================
    // CATEGORY PAGE
    // ============================================
    
    async openCategory(categoryId) {
        this.currentCategory = categoryId;
        this.selectedProduct = null;
        this.inputValues = {};
        
        // Show category page
        this.showPage('category');
        
        // Load category data
        Animations.showLoading('Loading...');
        
        try {
            const category = await Database.getCategory(categoryId);
            if (!category) {
                Animations.hideLoading();
                Animations.showError('Category not found');
                this.showPage('home');
                return;
            }
            
            // Set title
            document.getElementById('category-title').textContent = category.name;
            
            // Load input tables
            await this.loadInputTables(categoryId);
            
            // Load products
            await this.loadProducts(categoryId);
            
            // Load category banner (type2)
            await this.loadCategoryBanner(categoryId);
            
            Animations.hideLoading();
        } catch (error) {
            console.error('Open category error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to load category');
        }
    },
    
    // Load input tables
    async loadInputTables(categoryId) {
        const container = document.getElementById('input-tables');
        if (!container) return;
        
        try {
            const inputTables = await Database.getInputTablesByCategory(categoryId);
            
            if (inputTables.length === 0) {
                container.innerHTML = '';
                container.classList.add('hidden');
                return;
            }
            
            container.classList.remove('hidden');
            container.innerHTML = inputTables.map(input => `
                <div class="input-table-item">
                    <label>${input.name}</label>
                    <input type="text" 
                           id="input-${input.id}" 
                           placeholder="${input.placeholder}"
                           data-input-id="${input.id}"
                           data-input-name="${input.name}"
                           onchange="App.onInputChange('${input.id}', this.value)">
                </div>
            `).join('');
        } catch (error) {
            console.error('Load input tables error:', error);
        }
    },
    
    // Handle input change
    onInputChange(inputId, value) {
        this.inputValues[inputId] = value;
    },
    
    // Load products
    async loadProducts(categoryId) {
        const container = document.getElementById('products-grid');
        if (!container) return;
        
        try {
            const products = await Database.getProductsByCategory(categoryId);
            
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>No products available</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = products.map(product => {
                const discountedPrice = product.discount > 0 
                    ? Math.round(product.price * (1 - product.discount / 100))
                    : product.price;
                
                const deliveryText = this.getDeliveryText(product.deliveryTime);
                
                return `
                    <div class="product-card" 
                         id="product-${product.id}"
                         onclick="App.selectProduct('${product.id}')">
                        <div class="product-icon">
                            <img src="${product.icon}" alt="${product.name}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <h4 class="product-name">${product.name}</h4>
                            <div class="product-price">
                                ${product.discount > 0 ? `
                                    <span class="original-price">${product.price.toLocaleString()} ${product.currency}</span>
                                    <span class="current-price">${discountedPrice.toLocaleString()} ${product.currency}</span>
                                    <span class="discount-badge">-${product.discount}%</span>
                                ` : `
                                    <span class="current-price">${product.price.toLocaleString()} ${product.currency}</span>
                                `}
                            </div>
                            <div class="product-delivery">
                                <i class="fas fa-clock"></i>
                                <span>${deliveryText}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Load products error:', error);
        }
    },
    
    // Get delivery text
    getDeliveryText(deliveryTime) {
        const deliveryTexts = {
            'instant': 'Instant Delivery',
            '30min': '30 Minutes',
            '1hour': '1 Hour',
            '2hours': '2 Hours',
            '24hours': '24 Hours'
        };
        return deliveryTexts[deliveryTime] || 'Instant Delivery';
    },
    
    // Load category banner
    async loadCategoryBanner(categoryId) {
        const bannerContainer = document.getElementById('category-banner');
        const infoContainer = document.getElementById('category-info');
        
        try {
            const banners = await Database.getBannersByType('type2');
            const categoryBanner = banners.find(b => b.categoryId === categoryId);
            
            if (categoryBanner) {
                if (bannerContainer && categoryBanner.image) {
                    bannerContainer.innerHTML = `<img src="${categoryBanner.image}" alt="Banner" loading="lazy">`;
                    bannerContainer.classList.remove('hidden');
                }
                
                if (infoContainer && categoryBanner.description) {
                    infoContainer.innerHTML = `<p>${categoryBanner.description}</p>`;
                    infoContainer.classList.remove('hidden');
                }
            } else {
                if (bannerContainer) bannerContainer.classList.add('hidden');
                if (infoContainer) infoContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error('Load category banner error:', error);
        }
    },
    
    // Select product
    async selectProduct(productId) {
        // Deselect previous
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select new
        const productCard = document.getElementById(`product-${productId}`);
        if (productCard) {
            productCard.classList.add('selected');
        }
        
        // Get product details
        const product = await Database.getProduct(productId);
        if (!product) {
            Animations.showError('Product not found');
            return;
        }
        
        this.selectedProduct = product;
        
        // Haptic feedback
        TelegramApp.haptic('selection');
        
        // Show product modal
        this.showProductModal(product);
    },
    
    // Show product modal
    showProductModal(product) {
        const discountedPrice = product.discount > 0 
            ? Math.round(product.price * (1 - product.discount / 100))
            : product.price;
        
        // Set product details
        document.getElementById('product-modal-title').textContent = product.name;
        document.getElementById('product-detail-icon').src = product.icon;
        document.getElementById('product-detail-name').textContent = product.name;
        
        // Price display
        const originalPriceEl = document.getElementById('product-original-price');
        const currentPriceEl = document.getElementById('product-current-price');
        const discountBadgeEl = document.getElementById('product-discount-badge');
        
        if (product.discount > 0) {
            originalPriceEl.textContent = `${product.price.toLocaleString()} ${product.currency}`;
            originalPriceEl.classList.remove('hidden');
            discountBadgeEl.textContent = `-${product.discount}%`;
            discountBadgeEl.classList.remove('hidden');
        } else {
            originalPriceEl.classList.add('hidden');
            discountBadgeEl.classList.add('hidden');
        }
        currentPriceEl.textContent = `${discountedPrice.toLocaleString()} ${product.currency}`;
        
        // Delivery time
        const deliveryEl = document.getElementById('product-delivery');
        deliveryEl.innerHTML = `<i class="fas fa-clock"></i><span>${this.getDeliveryText(product.deliveryTime)}</span>`;
        
        // Input summary
        const inputSummary = document.getElementById('input-summary');
        const inputTables = document.querySelectorAll('#input-tables input');
        
        if (inputTables.length > 0) {
            let summaryHtml = '';
            inputTables.forEach(input => {
                const name = input.dataset.inputName;
                const value = input.value || 'Not entered';
                summaryHtml += `
                    <div class="input-summary-item">
                        <span>${name}:</span>
                        <span>${value}</span>
                    </div>
                `;
            });
            inputSummary.innerHTML = summaryHtml;
            inputSummary.classList.remove('hidden');
        } else {
            inputSummary.classList.add('hidden');
        }
        
        // Balance summary
        document.getElementById('modal-balance').textContent = `${this.balance.toLocaleString()} MMK`;
        document.getElementById('modal-price').textContent = `${discountedPrice.toLocaleString()} ${product.currency}`;
        
        const remaining = this.balance - discountedPrice;
        const remainingEl = document.getElementById('modal-remaining');
        remainingEl.textContent = `${remaining.toLocaleString()} MMK`;
        remainingEl.style.color = remaining >= 0 ? 'var(--success)' : 'var(--error)';
        
        // Enable/disable buy button
        const buyBtn = document.getElementById('buy-btn');
        buyBtn.disabled = remaining < 0;
        
        // Open modal
        Animations.openModal('product-modal');
    },
    
    // ============================================
    // PURCHASE FLOW
    // ============================================
    
    async confirmPurchase() {
        if (!this.selectedProduct) {
            Animations.showError('No product selected');
            return;
        }
        
        // Validate inputs
        const inputTables = document.querySelectorAll('#input-tables input');
        let allFilled = true;
        
        inputTables.forEach(input => {
            if (!input.value.trim()) {
                allFilled = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        if (!allFilled) {
            Animations.showError('Please fill all required fields');
            return;
        }
        
        // Check balance
        const discountedPrice = this.selectedProduct.discount > 0 
            ? Math.round(this.selectedProduct.price * (1 - this.selectedProduct.discount / 100))
            : this.selectedProduct.price;
        
        if (this.balance < discountedPrice) {
            // Track failed attempt
            const result = await Database.trackFailedAttempt(this.user.id);
            
            if (result.banned) {
                Animations.closeModal('product-modal');
                this.showBannedScreen();
                await BotAPI.sendUserNotification(this.user.id, 'account_banned', {
                    reason: 'Too many failed purchase attempts'
                });
                return;
            }
            
            Animations.showWarning(`Insufficient balance! Attempts: ${result.attempts}/5`);
            return;
        }
        
        // Close product modal
        Animations.closeModal('product-modal');
        
        // Generate and send OTP
        await this.sendPurchaseOTP();
        
        // Show confirm modal
        Animations.openModal('confirm-modal');
    },
    
    // Send purchase OTP
    async sendPurchaseOTP() {
        this.otpCode = BotAPI.generateOTP();
        this.otpExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
        
        await BotAPI.sendOTP(this.user.id, this.otpCode);
        
        Animations.showInfo('OTP sent to your Telegram');
    },
    
    // Process purchase
    async processPurchase() {
        const enteredOTP = document.getElementById('otp-code').value.trim();
        
        // Validate OTP
        if (!enteredOTP || enteredOTP.length !== 6) {
            Animations.showError('Please enter valid 6-digit OTP');
            return;
        }
        
        if (Date.now() > this.otpExpiry) {
            Animations.showError('OTP expired. Please try again.');
            Animations.closeModal('confirm-modal');
            return;
        }
        
        if (enteredOTP !== this.otpCode) {
            Animations.showError('Invalid OTP');
            return;
        }
        
        Animations.closeModal('confirm-modal');
        Animations.showLoading('Processing order...');
        
        try {
            const discountedPrice = this.selectedProduct.discount > 0 
                ? Math.round(this.selectedProduct.price * (1 - this.selectedProduct.discount / 100))
                : this.selectedProduct.price;
            
            // Collect input values
            const gameInputs = {};
            document.querySelectorAll('#input-tables input').forEach(input => {
                gameInputs[input.dataset.inputName] = input.value;
            });
            
            // Create order
            const orderData = {
                userId: this.user.id,
                userName: TelegramApp.getUserName(),
                username: this.user.username,
                userPhoto: TelegramApp.getUserPhoto(),
                productId: this.selectedProduct.id,
                productName: this.selectedProduct.name,
                categoryId: this.currentCategory,
                amount: discountedPrice,
                currency: this.selectedProduct.currency || 'MMK',
                gameId: Object.values(gameInputs).join(' | '),
                gameInputs: gameInputs,
                deliveryTime: this.selectedProduct.deliveryTime
            };
            
            const order = await Database.createOrder(orderData);
            
            // Deduct balance
            this.balance = await Database.updateBalance(this.user.id, discountedPrice, 'subtract');
            this.updateBalanceDisplay();
            
            // Update user stats
            const userData = await Database.getUser(this.user.id);
            await Database.saveUser({
                ...userData,
                totalOrders: (userData.totalOrders || 0) + 1,
                totalSpent: (userData.totalSpent || 0) + discountedPrice
            });
            
            // Notify admin
            await BotAPI.sendOrderNotification(order);
            
            Animations.hideLoading();
            
            // Show success
            document.getElementById('success-message').textContent = 
                'Your order has been placed successfully! Please wait for admin approval.';
            Animations.openModal('success-modal');
            
            // Show confetti
            Animations.showConfetti();
            
            // Haptic feedback
            TelegramApp.haptic('notification', 'success');
            
            // Reset
            this.selectedProduct = null;
            this.otpCode = null;
            this.otpExpiry = null;
            document.getElementById('otp-code').value = '';
            
            // Deselect products
            document.querySelectorAll('.product-card').forEach(card => {
                card.classList.remove('selected');
            });
            
        } catch (error) {
            console.error('Process purchase error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to process order. Please try again.');
        }
    },
    
    // ============================================
    // ORDERS PAGE
    // ============================================
    
    async loadOrders(filter = 'all') {
        const container = document.getElementById('orders-list');
        if (!container) return;
        
        try {
            let orders = await Database.getOrdersByUser(this.user.id);
            
            if (filter !== 'all') {
                orders = orders.filter(o => o.status === filter);
            }
            
            if (orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>No orders yet</h3>
                        <p>Your orders will appear here</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = orders.map(order => `
                <div class="order-card">
                    <img src="${order.productIcon || ''}" alt="${order.productName}" class="order-icon">
                    <div class="order-details">
                        <h4 class="order-product">${order.productName}</h4>
                        <p class="order-amount">${order.amount.toLocaleString()} ${order.currency}</p>
                        <p class="order-date">${new Date(order.timestamp).toLocaleString()}</p>
                        ${order.gameId ? `<p class="order-game-id">ID: ${order.gameId}</p>` : ''}
                    </div>
                    <div class="order-status">
                        <span class="status-badge ${order.status}">${order.status}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load orders error:', error);
        }
    },
    
    // Filter orders
    filterOrders(status) {
        // Update tab buttons
        document.querySelectorAll('.orders-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.loadOrders(status);
    },
    
    // ============================================
    // HISTORY PAGE
    // ============================================
    
    async loadHistory(filter = 'all') {
        const container = document.getElementById('history-list');
        if (!container) return;
        
        try {
            const [orders, topups] = await Promise.all([
                Database.getOrdersByUser(this.user.id),
                Database.getTopupsByUser(this.user.id)
            ]);
            
            let history = [];
            
            // Add orders
            orders.forEach(order => {
                history.push({
                    type: 'purchase',
                    title: order.productName,
                    amount: `-${order.amount.toLocaleString()} ${order.currency}`,
                    status: order.status,
                    timestamp: order.timestamp,
                    icon: 'fa-shopping-cart'
                });
            });
            
            // Add topups
            topups.forEach(topup => {
                history.push({
                    type: 'topup',
                    title: 'Balance Top-up',
                    amount: `+${topup.amount.toLocaleString()} MMK`,
                    status: topup.status,
                    timestamp: topup.timestamp,
                    icon: 'fa-wallet'
                });
            });
            
            // Sort by timestamp
            history.sort((a, b) => b.timestamp - a.timestamp);
            
            // Filter
            if (filter !== 'all') {
                history = history.filter(h => h.type === filter);
            }
            
            if (history.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <h3>No history</h3>
                        <p>Your transaction history will appear here</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = history.map(item => `
                <div class="history-card">
                    <div class="history-icon ${item.type}">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div class="history-details">
                        <h4 class="history-title">${item.title}</h4>
                        <p class="history-amount" style="color: ${item.type === 'topup' ? 'var(--success)' : 'var(--error)'}">
                            ${item.amount}
                        </p>
                        <p class="history-date">${new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <div class="history-status">
                        <span class="status-badge ${item.status}">${item.status}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load history error:', error);
        }
    },
    
    // Filter history
    filterHistory(type) {
        // Update tab buttons
        document.querySelectorAll('.history-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.loadHistory(type);
    },
    
    // ============================================
    // PROFILE PAGE
    // ============================================
    
    async loadProfile() {
        try {
            const userData = await Database.getUser(this.user.id);
            const orders = await Database.getOrdersByUser(this.user.id);
            
            // Update stats
            document.getElementById('total-orders').textContent = orders.length;
            document.getElementById('total-spent').textContent = 
                `${(userData?.totalSpent || 0).toLocaleString()} MMK`;
            
            const memberSince = userData?.createdAt 
                ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : '-';
            document.getElementById('member-since').textContent = memberSince;
        } catch (error) {
            console.error('Load profile error:', error);
        }
    },
    
    // ============================================
    // TOPUP
    // ============================================
    
    async openTopup() {
        // Load payment methods
        await this.loadPaymentMethods();
        
        // Reset form
        document.getElementById('topup-amount').value = '';
        document.getElementById('payment-details').classList.add('hidden');
        document.getElementById('receipt-preview').classList.add('hidden');
        document.getElementById('receipt-file').value = '';
        
        // Open modal
        Animations.openModal('topup-modal');
    },
    
    // Load payment methods
    async loadPaymentMethods() {
        const container = document.getElementById('payment-methods');
        if (!container) return;
        
        try {
            const payments = await Database.getPayments();
            
            if (payments.length === 0) {
                container.innerHTML = '<p class="text-center">No payment methods available</p>';
                return;
            }
            
            container.innerHTML = payments.map(payment => `
                <div class="payment-method" onclick="App.selectPayment('${payment.id}')">
                    <img src="${payment.icon}" alt="${payment.name}">
                    <span>${payment.name}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load payments error:', error);
        }
    },
    
    // Select payment method
    async selectPayment(paymentId) {
        const amount = parseFloat(document.getElementById('topup-amount').value);
        
        if (!amount || amount < 1000) {
            Animations.showError('Minimum top-up amount is 1,000 MMK');
            return;
        }
        
        // Deselect previous
        document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Select new
        event.currentTarget.classList.add('selected');
        
        // Get payment details
        const payments = await Database.getPayments();
        const payment = payments.find(p => p.id === paymentId);
        
        if (!payment) return;
        
        this.selectedPayment = payment;
        
        // Show payment details
        document.getElementById('payment-icon').src = payment.icon;
        document.getElementById('payment-name').textContent = payment.name;
        document.getElementById('payment-address').textContent = payment.address;
        document.getElementById('payment-receiver').textContent = payment.receiver;
        document.getElementById('payment-note').textContent = payment.note || '';
        
        document.getElementById('payment-details').classList.remove('hidden');
        
        // Haptic feedback
        TelegramApp.haptic('selection');
    },
    
    // Preview receipt
    previewReceipt(input) {
        const preview = document.getElementById('receipt-preview');
        const image = document.getElementById('receipt-image');
        
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                image.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(input.files[0]);
        }
    },
    
    // Remove receipt
    removeReceipt() {
        document.getElementById('receipt-file').value = '';
        document.getElementById('receipt-preview').classList.add('hidden');
    },
    
    // Submit topup
    async submitTopup() {
        const amount = parseFloat(document.getElementById('topup-amount').value);
        const receiptFile = document.getElementById('receipt-file').files[0];
        
        if (!amount || amount < 1000) {
            Animations.showError('Minimum top-up amount is 1,000 MMK');
            return;
        }
        
        if (!this.selectedPayment) {
            Animations.showError('Please select a payment method');
            return;
        }
        
        if (!receiptFile) {
            Animations.showError('Please upload receipt');
            return;
        }
        
        Animations.showLoading('Submitting top-up request...');
        
        try {
            // Validate image for NSFW content
            const validation = await ContentFilter.validateImage(receiptFile);
            if (!validation.valid) {
                Animations.hideLoading();
                
                if (validation.reason === 'Suspicious filename') {
                    // Ban user for suspicious content
                    await Database.banUser(this.user.id, 'Uploaded inappropriate content');
                    await BotAPI.sendUserNotification(this.user.id, 'account_banned', {
                        reason: 'Uploaded inappropriate content'
                    });
                    this.showBannedScreen();
                    return;
                }
                
                Animations.showError(validation.reason);
                return;
            }
            
            // Store receipt image
            const receiptImage = await ImageStorage.storeImage(receiptFile);
            
            // Create topup request
            const topupData = {
                userId: this.user.id,
                userName: TelegramApp.getUserName(),
                username: this.user.username,
                userPhoto: TelegramApp.getUserPhoto(),
                amount: amount,
                paymentMethod: this.selectedPayment.name,
                paymentId: this.selectedPayment.id,
                receiptImage: receiptImage
            };
            
            const topup = await Database.createTopup(topupData);
            
            // Notify admin
            await BotAPI.sendTopupNotification(topup);
            
            Animations.hideLoading();
            Animations.closeModal('topup-modal');
            
            document.getElementById('success-message').textContent = 
                'Top-up request submitted! Please wait for admin approval.';
            Animations.openModal('success-modal');
            
            TelegramApp.haptic('notification', 'success');
            
            // Reset
            this.selectedPayment = null;
            
        } catch (error) {
            console.error('Submit topup error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to submit top-up request');
        }
    },
    
    // ============================================
    // ADMIN PAGE
    // ============================================
    
    async initAdminPage() {
        if (!TelegramApp.isAdmin()) {
            this.showPage('home');
            return;
        }
        
        // Initialize admin panel
        await AdminPanel.init();
    },
    
    // ============================================
    // UTILITIES
    // ============================================
    
    // Toggle theme
    toggleTheme() {
        TelegramApp.toggleTheme();
    },
    
    // Open settings
    openSettings() {
        // Show settings options
        TelegramApp.showPopup({
            title: 'Settings',
            message: 'Choose an option:',
            buttons: [
                { id: 'theme', type: 'default', text: 'Change Theme' },
                { id: 'close', type: 'cancel', text: 'Close' }
            ]
        }).then(buttonId => {
            if (buttonId === 'theme') {
                this.toggleTheme();
            }
        });
    },
    
    // Share product
    async shareProduct(productId) {
        const product = await Database.getProduct(productId);
        if (!product) return;
        
        const shareText = `Check out ${product.name} on Gaming Shop! Only ${product.price} ${product.currency}`;
        
        TelegramApp.openTelegramLink(`https://t.me/share/url?url=https://t.me/mafia_gamingshopbot&text=${encodeURIComponent(shareText)}`);
    }
};

// ============================================
// GLOBAL FUNCTIONS FOR HTML HANDLERS
// ============================================

function showPage(page) {
    App.showPage(page);
}

function openTopup() {
    App.openTopup();
}

function toggleTheme() {
    App.toggleTheme();
}

function openSettings() {
    App.openSettings();
}

function filterOrders(status) {
    App.filterOrders(status);
}

function filterHistory(type) {
    App.filterHistory(type);
}

function previewReceipt(input) {
    App.previewReceipt(input);
}

function removeReceipt() {
    App.removeReceipt();
}

function submitTopup() {
    App.submitTopup();
}

function confirmPurchase() {
    App.confirmPurchase();
}

function processPurchase() {
    App.processPurchase();
}

function closeModal(modalId) {
    Animations.closeModal(modalId);
}

function openModal(modalId) {
    Animations.openModal(modalId);
}

// Handle back button
function handleBackButton() {
    if (App.currentPage === 'category') {
        App.showPage('home');
    } else if (App.currentPage !== 'home') {
        App.showPage('home');
    }
}

// ============================================
// INITIALIZE APP ON LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export
window.App = App;
