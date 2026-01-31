/* ============================================
   MAFIA GAMING SHOP - MAIN APPLICATION
   Version: 3.0.0 (JSONBin Integration)
   ============================================ */

// ============================================
// Configuration - Same as Admin Panel
// ============================================

const CONFIG = {
    ADMIN_ID: 1538232799,
    ADMIN_ID_STR: '1538232799',
    BOT_TOKEN: '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM',
    BOT_USERNAME: 'mafia_gamingshopbot',
    
    // JSONBin.io Configuration - SAME AS ADMIN
    JSONBIN: {
        BASE_URL: 'https://api.jsonbin.io/v3',
        MASTER_KEY: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
        ACCESS_KEY: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS'
    }
};

// ============================================
// JSONBin Database Service - User Version
// ============================================

const JSONBinDB = {
    binIds: {},
    initialized: false,
    
    // Initialize - Load bin IDs from localStorage (created by admin)
    async init() {
        console.log('🗄️ Connecting to database...');
        
        try {
            // Try to load bin IDs from localStorage (shared with admin)
            const savedBinIds = localStorage.getItem('mafia_jsonbin_ids');
            
            if (savedBinIds) {
                this.binIds = JSON.parse(savedBinIds);
                console.log('✅ Database connected with existing bins:', Object.keys(this.binIds));
                this.initialized = true;
                return true;
            }
            
            // If no local bins, try to find master bin from Telegram CloudStorage
            console.log('⚠️ No local bins found. Waiting for admin setup...');
            
            // Return false - admin needs to set up first
            this.initialized = false;
            return false;
            
        } catch (error) {
            console.error('❌ Database init error:', error);
            return false;
        }
    },
    
    // Read data from bin
    async read(binType) {
        const binId = this.binIds[binType];
        
        if (!binId) {
            console.warn(`⚠️ Bin not found: ${binType}`);
            return this.getDefaultData(binType);
        }
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN.BASE_URL}/b/${binId}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN.MASTER_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Also cache in localStorage for faster access
            localStorage.setItem(`mafia_${binType}`, JSON.stringify(data.record));
            
            return data.record;
            
        } catch (error) {
            console.error(`❌ Read error for ${binType}:`, error);
            
            // Try localStorage fallback
            const cached = localStorage.getItem(`mafia_${binType}`);
            if (cached) {
                console.log(`📦 Using cached data for ${binType}`);
                return JSON.parse(cached);
            }
            
            return this.getDefaultData(binType);
        }
    },
    
    // Write data to bin
    async write(binType, data) {
        const binId = this.binIds[binType];
        
        if (!binId) {
            console.error(`❌ Bin not found: ${binType}`);
            localStorage.setItem(`mafia_${binType}`, JSON.stringify(data));
            return false;
        }
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN.BASE_URL}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.JSONBIN.MASTER_KEY
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            // Also update localStorage cache
            localStorage.setItem(`mafia_${binType}`, JSON.stringify(data));
            
            return true;
            
        } catch (error) {
            console.error(`❌ Write error for ${binType}:`, error);
            localStorage.setItem(`mafia_${binType}`, JSON.stringify(data));
            return false;
        }
    },
    
    // Get default data for each type
    getDefaultData(binType) {
        const defaults = {
            users: [],
            categories: [],
            products: [],
            orders: [],
            topupRequests: [],
            payments: [],
            bannersType1: [],
            bannersType2: [],
            inputTables: [],
            bannedUsers: [],
            broadcasts: [],
            settings: {
                siteName: 'Mafia Gaming Shop',
                logo: '',
                theme: 'dark',
                announcement: 'Welcome to Mafia Gaming Shop! 🎮',
                minTopup: 1000,
                maxTopup: 1000000
            }
        };
        return defaults[binType] || null;
    },
    
    // Check if database is ready
    isReady() {
        return this.initialized && Object.keys(this.binIds).length > 0;
    }
};

// ============================================
// Global State
// ============================================

const AppState = {
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    balance: 0,
    
    // Data (loaded from JSONBin)
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
    
    // Purchase tracking
    failedPurchaseAttempts: 0,
    lastFailedAttemptDate: null
};

// ============================================
// Telegram WebApp Helper
// ============================================

const TelegramHelper = {
    tg: null,
    
    init() {
        if (window.Telegram?.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.ready();
            this.tg.expand();
            return true;
        }
        return false;
    },
    
    getUser() {
        return this.tg?.initDataUnsafe?.user || null;
    },
    
    isAdmin(userId) {
        return userId === CONFIG.ADMIN_ID || 
               userId === CONFIG.ADMIN_ID_STR || 
               String(userId) === CONFIG.ADMIN_ID_STR;
    },
    
    haptic(type = 'impact', style = 'light') {
        try {
            if (type === 'impact') {
                this.tg?.HapticFeedback?.impactOccurred(style);
            } else if (type === 'notification') {
                this.tg?.HapticFeedback?.notificationOccurred(style);
            } else if (type === 'selection') {
                this.tg?.HapticFeedback?.selectionChanged();
            }
        } catch (e) {}
    },
    
    showAlert(message) {
        return new Promise(resolve => {
            if (this.tg?.showAlert) {
                this.tg.showAlert(message, resolve);
            } else {
                alert(message);
                resolve();
            }
        });
    },
    
    showConfirm(message) {
        return new Promise(resolve => {
            if (this.tg?.showConfirm) {
                this.tg.showConfirm(message, resolve);
            } else {
                resolve(confirm(message));
            }
        });
    },
    
    close() {
        this.tg?.close();
    },
    
    getAvatarUrl(userId, photoUrl) {
        if (photoUrl) return photoUrl;
        return `https://ui-avatars.com/api/?name=${userId}&background=8B5CF6&color=fff&size=128`;
    },
    
    formatName(user) {
        if (!user) return 'User';
        return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
    },
    
    openLink(url) {
        if (this.tg?.openTelegramLink) {
            this.tg.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }
    },
    
    share(url, text) {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        this.openLink(shareUrl);
    }
};

// ============================================
// Toast Notifications
// ============================================

const Toast = {
    container: null,
    
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(type, title, message, duration = 4000) {
        if (!this.container) this.init();
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="${icons[type]}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        toast.querySelector('.toast-close').onclick = () => this.remove(toast);
        this.container.appendChild(toast);
        
        TelegramHelper.haptic('notification', type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning');
        
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }
    },
    
    remove(toast) {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    },
    
    success(title, msg) { this.show('success', title, msg); },
    error(title, msg) { this.show('error', title, msg); },
    warning(title, msg) { this.show('warning', title, msg); },
    info(title, msg) { this.show('info', title, msg); }
};

// ============================================
// Loading Overlay
// ============================================

const Loading = {
    el: null,
    
    init() {
        this.el = document.getElementById('loading-overlay');
        if (!this.el) {
            this.el = document.createElement('div');
            this.el.className = 'loading-overlay hidden';
            this.el.id = 'loading-overlay';
            this.el.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p id="loading-text">Loading...</p>
                </div>
            `;
            document.body.appendChild(this.el);
        }
    },
    
    show(text = 'Loading...') {
        if (!this.el) this.init();
        const textEl = this.el.querySelector('#loading-text');
        if (textEl) textEl.textContent = text;
        this.el.classList.remove('hidden');
    },
    
    hide() {
        if (this.el) this.el.classList.add('hidden');
    },
    
    setText(text) {
        const textEl = this.el?.querySelector('#loading-text');
        if (textEl) textEl.textContent = text;
    }
};

// ============================================
// Modal Helper
// ============================================

const Modal = {
    open(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            TelegramHelper.haptic('impact', 'light');
        }
    },
    
    close(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    closeAll() {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
    }
};

// ============================================
// Format Helpers
// ============================================

const Format = {
    currency(amount, currency = 'MMK') {
        return `${Number(amount || 0).toLocaleString()} ${currency}`;
    },
    
    date(dateStr, type = 'short') {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        
        if (type === 'relative') {
            const now = new Date();
            const diff = now - d;
            const mins = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (mins < 1) return 'Just now';
            if (mins < 60) return `${mins}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
        }
        
        if (type === 'datetime') {
            return d.toLocaleString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
        
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};

// ============================================
// Utility Functions
// ============================================

function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD${year}${month}${day}${random}`;
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// Main Application Class
// ============================================

class MafiaGamingApp {
    constructor() {
        this.initialized = false;
        console.log('🎮 MafiaGamingApp created');
    }

    async init() {
        console.log('🚀 Initializing Mafia Gaming Shop...');
        
        try {
            // Initialize helpers
            Toast.init();
            Loading.init();
            
            // Initialize Telegram
            if (!TelegramHelper.init()) {
                console.error('❌ Telegram WebApp not available');
                this.showAccessDenied('Please open from Telegram Bot');
                return;
            }
            
            console.log('✅ Telegram WebApp ready');
            
            // Get user
            const user = TelegramHelper.getUser();
            if (!user) {
                console.error('❌ No user data');
                this.showAccessDenied('Could not get user data');
                return;
            }
            
            AppState.user = user;
            AppState.isAdmin = TelegramHelper.isAdmin(user.id);
            AppState.isAuthenticated = true;
            
            console.log('👤 User:', user.first_name, '| Admin:', AppState.isAdmin);
            
            // Check if banned
            Loading.show('Checking access...');
            const isBanned = await this.checkIfBanned();
            if (isBanned) {
                Loading.hide();
                this.showBannedScreen();
                return;
            }
            
            // Play intro animation
            await this.playIntro();
            
            // Initialize database
            Loading.show('Connecting to database...');
            const dbReady = await JSONBinDB.init();
            
            if (!dbReady) {
                Loading.hide();
                this.showSetupRequired();
                return;
            }
            
            // Load all data
            await this.loadAllData();
            
            // Register/update user
            await this.registerUser();
            
            // Setup UI
            this.setupUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start real-time sync
            this.startRealTimeSync();
            
            Loading.hide();
            this.initialized = true;
            
            console.log('✅ Mafia Gaming Shop initialized!');
            Toast.success('Welcome!', `Hello, ${user.first_name}!`);
            
        } catch (error) {
            console.error('❌ Init error:', error);
            Loading.hide();
            Toast.error('Error', 'Failed to initialize app');
        }
    }

    showAccessDenied(message = 'Access Denied') {
        const introScreen = document.getElementById('intro-screen');
        const mainApp = document.getElementById('main-app');
        const accessDenied = document.getElementById('access-denied');
        
        if (introScreen) introScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        
        if (accessDenied) {
            accessDenied.classList.remove('hidden');
            const msgEl = accessDenied.querySelector('p');
            if (msgEl) msgEl.textContent = message;
        }
    }

    showBannedScreen() {
        this.showAccessDenied('Your account has been banned');
    }

    showSetupRequired() {
        const introScreen = document.getElementById('intro-screen');
        const mainApp = document.getElementById('main-app');
        
        if (introScreen) introScreen.classList.add('hidden');
        
        if (mainApp) {
            mainApp.classList.remove('hidden');
            mainApp.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px;">
                    <i class="fas fa-database" style="font-size:60px;color:var(--primary);margin-bottom:20px;"></i>
                    <h2 style="margin-bottom:10px;">Database Setup Required</h2>
                    <p style="color:var(--text-secondary);margin-bottom:20px;">
                        Admin needs to set up the database first.<br>
                        Please contact the administrator.
                    </p>
                    <button onclick="location.reload()" style="
                        padding:12px 30px;
                        background:var(--primary);
                        color:white;
                        border:none;
                        border-radius:25px;
                        font-size:16px;
                        cursor:pointer;
                    ">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    async checkIfBanned() {
        try {
            const bannedUsers = await JSONBinDB.read('bannedUsers') || [];
            return bannedUsers.some(u => String(u.id) === String(AppState.user.id));
        } catch (error) {
            return false;
        }
    }

    async playIntro() {
        return new Promise(resolve => {
            const introScreen = document.getElementById('intro-screen');
            const mainApp = document.getElementById('main-app');
            
            // Update intro with settings
            const introLogo = document.getElementById('intro-logo');
            const introSiteName = document.getElementById('intro-site-name');
            
            if (AppState.settings.logo && introLogo) {
                introLogo.src = AppState.settings.logo;
            }
            if (AppState.settings.siteName && introSiteName) {
                introSiteName.textContent = AppState.settings.siteName;
            }
            
            // Wait for intro
            setTimeout(() => {
                if (introScreen) {
                    introScreen.style.opacity = '0';
                    introScreen.style.transition = 'opacity 0.5s';
                }
                
                setTimeout(() => {
                    if (introScreen) introScreen.classList.add('hidden');
                    if (mainApp) mainApp.classList.remove('hidden');
                    resolve();
                }, 500);
            }, 3000);
        });
    }

    async loadAllData() {
        console.log('📦 Loading all data from JSONBin...');
        Loading.show('Loading shop data...');
        
        try {
            const [
                categories, products, orders, payments,
                bannersType1, bannersType2, inputTables, settings
            ] = await Promise.all([
                JSONBinDB.read('categories'),
                JSONBinDB.read('products'),
                JSONBinDB.read('orders'),
                JSONBinDB.read('payments'),
                JSONBinDB.read('bannersType1'),
                JSONBinDB.read('bannersType2'),
                JSONBinDB.read('inputTables'),
                JSONBinDB.read('settings')
            ]);
            
            AppState.categories = categories || [];
            AppState.products = (products || []).filter(p => p.active !== false);
            AppState.orders = (orders || []).filter(o => String(o.userId) === String(AppState.user.id));
            AppState.payments = (payments || []).filter(p => p.active !== false);
            AppState.bannersType1 = bannersType1 || [];
            AppState.bannersType2 = bannersType2 || [];
            AppState.inputTables = inputTables || [];
            
            if (settings) {
                AppState.settings = { ...AppState.settings, ...settings };
            }
            
            console.log('✅ Data loaded:', {
                categories: AppState.categories.length,
                products: AppState.products.length,
                orders: AppState.orders.length
            });
            
        } catch (error) {
            console.error('❌ Load data error:', error);
        }
        
        Loading.hide();
    }

    async registerUser() {
        try {
            let users = await JSONBinDB.read('users') || [];
            const existingIndex = users.findIndex(u => String(u.id) === String(AppState.user.id));
            
            if (existingIndex !== -1) {
                // Update existing user
                users[existingIndex].lastActive = new Date().toISOString();
                users[existingIndex].username = AppState.user.username;
                users[existingIndex].firstName = AppState.user.first_name;
                users[existingIndex].lastName = AppState.user.last_name;
                users[existingIndex].isPremium = AppState.user.is_premium || false;
                
                AppState.balance = users[existingIndex].balance || 0;
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
            
            await JSONBinDB.write('users', users);
            console.log('✅ User registered/updated');
            
        } catch (error) {
            console.error('❌ Register user error:', error);
        }
    }

    setupUI() {
        // Update header
        this.updateHeader();
        
        // Update user info
        this.updateUserInfo();
        
        // Update admin access
        this.updateAdminAccess();
        
        // Load home content
        this.loadHomeContent();
        
        // Update balance
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
            userAvatar.src = TelegramHelper.getAvatarUrl(AppState.user.id, AppState.user.photo_url);
        }
        if (userName) {
            userName.textContent = TelegramHelper.formatName(AppState.user);
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
        const balanceEl = document.getElementById('user-balance');
        if (balanceEl) {
            balanceEl.textContent = Format.currency(AppState.balance);
        }
        
        const statBalance = document.getElementById('stat-balance');
        if (statBalance) {
            statBalance.textContent = Format.currency(AppState.balance);
        }
    }

    loadHomeContent() {
        this.loadBanners();
        this.loadAnnouncement();
        this.loadCategories();
        this.loadFeaturedProducts();
    }

    loadBanners() {
        const container = document.getElementById('banner-slides');
        if (!container) return;
        
        if (AppState.bannersType1.length === 0) {
            container.innerHTML = `
                <div class="banner-placeholder">
                    <i class="fas fa-image"></i>
                    <span>No Banners</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = AppState.bannersType1.map(banner => `
            <div class="banner-slide">
                <img src="${banner.image}" alt="Banner" loading="lazy">
            </div>
        `).join('');
        
        // Simple carousel
        this.initBannerCarousel();
    }

    initBannerCarousel() {
        const slides = document.querySelectorAll('.banner-slide');
        if (slides.length <= 1) return;
        
        let current = 0;
        
        setInterval(() => {
            slides[current].classList.remove('active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('active');
        }, 5000);
        
        if (slides[0]) slides[0].classList.add('active');
    }

    loadAnnouncement() {
        const ticker = document.getElementById('ticker-content');
        if (ticker && AppState.settings.announcement) {
            ticker.innerHTML = `<span>${AppState.settings.announcement}</span>`;
        }
    }

    loadCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;
        
        if (AppState.categories.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-gamepad"></i>
                    <p>No categories available</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = AppState.categories.map(cat => {
            const productCount = AppState.products.filter(p => p.categoryId === cat.id).length;
            
            return `
                <div class="category-card" data-category-id="${cat.id}">
                    <div class="category-icon-wrapper">
                        ${cat.icon ? `<img src="${cat.icon}" alt="${cat.name}" class="category-icon">` : 
                          '<i class="fas fa-gamepad" style="font-size:40px;color:var(--primary);"></i>'}
                        ${cat.flag ? `<span class="category-flag">${cat.flag}</span>` : ''}
                        ${cat.hasDiscount ? '<span class="category-discount-badge">SALE</span>' : ''}
                    </div>
                    <span class="category-name">${cat.name}</span>
                    <span class="category-sold">${productCount} products</span>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openCategory(card.dataset.categoryId);
            });
        });
    }

    loadFeaturedProducts() {
        const grid = document.getElementById('featured-products');
        if (!grid) return;
        
        const featured = AppState.products.filter(p => p.hasDiscount).slice(0, 4);
        
        if (featured.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-fire"></i>
                    <p>No featured products</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = featured.map(p => this.createProductCard(p)).join('');
    }

    createProductCard(product) {
        const price = product.hasDiscount 
            ? product.price - (product.price * product.discount / 100)
            : product.price;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    ${product.icon ? `<img src="${product.icon}" alt="${product.name}">` :
                      '<i class="fas fa-box" style="font-size:40px;color:var(--primary);"></i>'}
                    ${product.hasDiscount ? `<span class="product-discount-badge">-${product.discount}%</span>` : ''}
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-price">
                        <span class="price-current">${Format.currency(price, product.currency)}</span>
                        ${product.hasDiscount ? `<span class="price-original">${Format.currency(product.price, product.currency)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    openCategory(categoryId) {
        const category = AppState.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        AppState.currentCategory = category;
        
        // Hide home, show category page
        document.getElementById('home-tab')?.classList.remove('active');
        const categoryPage = document.getElementById('category-page');
        if (categoryPage) {
            categoryPage.classList.remove('hidden');
            categoryPage.classList.add('active');
        }
        
        // Update header
        const catIcon = document.getElementById('category-icon');
        const catName = document.getElementById('category-name');
        if (catIcon) catIcon.src = category.icon || '';
        if (catName) catName.textContent = category.name;
        
        // Load content
        this.loadInputTables(categoryId);
        this.loadCategoryProducts(categoryId);
        this.loadCategoryBanner(categoryId);
        
        TelegramHelper.haptic('impact', 'light');
    }

    closeCategory() {
        AppState.currentCategory = null;
        AppState.selectedProduct = null;
        AppState.inputValues = {};
        
        const categoryPage = document.getElementById('category-page');
        if (categoryPage) {
            categoryPage.classList.add('hidden');
            categoryPage.classList.remove('active');
        }
        
        document.getElementById('home-tab')?.classList.add('active');
        this.hideBuyButton();
    }

    loadInputTables(categoryId) {
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
            <div class="input-table-group">
                <label>${table.name} ${table.required ? '<span style="color:var(--danger);">*</span>' : ''}</label>
                <input type="text" 
                       class="input-table-field" 
                       placeholder="${table.placeholder || ''}"
                       data-table-id="${table.id}"
                       ${table.required ? 'required' : ''}>
            </div>
        `).join('');
        
        // Input handlers
        container.querySelectorAll('.input-table-field').forEach(input => {
            input.addEventListener('input', (e) => {
                AppState.inputValues[e.target.dataset.tableId] = e.target.value;
            });
        });
    }

    loadCategoryProducts(categoryId) {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        const products = AppState.products.filter(p => p.categoryId === categoryId);
        
        if (products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-box-open"></i>
                    <p>No products available</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = products.map(p => this.createProductCard(p)).join('');
        
        // Click handlers
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectProduct(card.dataset.productId);
            });
        });
    }

    loadCategoryBanner(categoryId) {
        const section = document.getElementById('category-banner');
        if (!section) return;
        
        const banner = AppState.bannersType2.find(b => b.categoryId === categoryId);
        
        if (!banner) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        section.innerHTML = `
            <img src="${banner.image}" alt="Banner" style="width:100%;border-radius:12px;">
            ${banner.instructions ? `<div class="banner-instructions"><p>${banner.instructions}</p></div>` : ''}
        `;
    }

    selectProduct(productId) {
        const product = AppState.products.find(p => p.id === productId);
        if (!product) return;
        
        // Deselect previous
        document.querySelectorAll('.product-card.selected').forEach(c => c.classList.remove('selected'));
        
        // Select new
        const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (card) card.classList.add('selected');
        
        AppState.selectedProduct = product;
        this.showBuyButton(product);
        
        TelegramHelper.haptic('selection');
    }

    showBuyButton(product) {
        let section = document.querySelector('.buy-now-section');
        
        if (!section) {
            section = document.createElement('div');
            section.className = 'buy-now-section';
            document.body.appendChild(section);
        }
        
        const price = product.hasDiscount 
            ? product.price - (product.price * product.discount / 100)
            : product.price;
        
        section.innerHTML = `
            <div class="selected-product-preview">
                ${product.icon ? `<img src="${product.icon}" alt="${product.name}">` : ''}
                <div class="info">
                    <span class="name">${product.name}</span>
                    <span class="price">${Format.currency(price, product.currency)}</span>
                </div>
            </div>
            <button class="buy-now-btn" id="buy-now-btn">
                <i class="fas fa-shopping-cart"></i> Buy Now
            </button>
        `;
        
        section.style.display = 'flex';
        
        document.getElementById('buy-now-btn').addEventListener('click', () => {
            this.initiatePurchase();
        });
    }

    hideBuyButton() {
        const section = document.querySelector('.buy-now-section');
        if (section) section.style.display = 'none';
    }

    // ============================================
    // Purchase System
    // ============================================

    initiatePurchase() {
        if (!AppState.selectedProduct) {
            Toast.warning('Warning', 'Please select a product');
            return;
        }
        
        // Validate inputs
        const tables = AppState.inputTables.filter(t => t.categoryId === AppState.currentCategory?.id);
        
        for (const table of tables) {
            if (table.required && !AppState.inputValues[table.id]) {
                Toast.warning('Required', `Please enter ${table.name}`);
                TelegramHelper.haptic('notification', 'error');
                return;
            }
        }
        
        // Check balance
        const product = AppState.selectedProduct;
        const price = product.hasDiscount 
            ? product.price - (product.price * product.discount / 100)
            : product.price;
        
        if (AppState.balance < price) {
            Toast.error('Insufficient Balance', 'Please topup first');
            TelegramHelper.haptic('notification', 'error');
            return;
        }
        
        // Open confirmation modal
        this.openPurchaseModal(product, price);
    }

    openPurchaseModal(product, price) {
        const modal = document.getElementById('purchase-modal');
        if (!modal) return;
        
        // Update modal content
        const iconEl = document.getElementById('purchase-product-icon');
        const nameEl = document.getElementById('purchase-product-name');
        const priceEl = document.getElementById('purchase-product-price');
        const balanceEl = document.getElementById('purchase-balance');
        const remainingEl = document.getElementById('purchase-remaining');
        
        if (iconEl) iconEl.src = product.icon || '';
        if (nameEl) nameEl.textContent = product.name;
        if (priceEl) priceEl.textContent = Format.currency(price, product.currency);
        if (balanceEl) balanceEl.textContent = Format.currency(AppState.balance);
        if (remainingEl) remainingEl.textContent = Format.currency(AppState.balance - price);
        
        Modal.open('purchase-modal');
    }

    async confirmPurchase() {
        Loading.show('Processing purchase...');
        
        try {
            const product = AppState.selectedProduct;
            const price = product.hasDiscount 
                ? product.price - (product.price * product.discount / 100)
                : product.price;
            
            // Create order
            const order = {
                id: generateOrderId(),
                oderId: generateOrderId(),
                userId: AppState.user.id,
                userName: TelegramHelper.formatName(AppState.user),
                userUsername: AppState.user.username,
                productId: product.id,
                productName: product.name,
                productIcon: product.icon,
                categoryId: AppState.currentCategory.id,
                categoryName: AppState.currentCategory.name,
                price: price,
                currency: product.currency || 'MMK',
                inputValues: { ...AppState.inputValues },
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Save order
            let orders = await JSONBinDB.read('orders') || [];
            orders.push(order);
            await JSONBinDB.write('orders', orders);
            
            // Deduct balance
            let users = await JSONBinDB.read('users') || [];
            const userIndex = users.findIndex(u => String(u.id) === String(AppState.user.id));
            if (userIndex !== -1) {
                users[userIndex].balance -= price;
                users[userIndex].totalOrders = (users[userIndex].totalOrders || 0) + 1;
                AppState.balance = users[userIndex].balance;
                await JSONBinDB.write('users', users);
            }
            
            // Update local state
            AppState.orders.push(order);
            
            Modal.close('purchase-modal');
            Loading.hide();
            
            Toast.success('Order Placed!', 'Your order is pending approval');
            TelegramHelper.haptic('notification', 'success');
            
            // Reset
            AppState.selectedProduct = null;
            AppState.inputValues = {};
            this.hideBuyButton();
            this.updateBalanceDisplay();
            
            document.querySelectorAll('.product-card.selected').forEach(c => c.classList.remove('selected'));
            document.querySelectorAll('.input-table-field').forEach(i => i.value = '');
            
        } catch (error) {
            console.error('Purchase error:', error);
            Loading.hide();
            Toast.error('Error', 'Failed to process purchase');
        }
    }

    // ============================================
    // Topup System
    // ============================================

    openTopupModal() {
        this.loadPaymentMethods();
        Modal.open('topup-modal');
    }

    loadPaymentMethods() {
        const container = document.getElementById('payment-methods');
        const form = document.getElementById('payment-form');
        
        if (!container) return;
        
        container.classList.remove('hidden');
        form?.classList.add('hidden');
        
        if (AppState.payments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <p>No payment methods available</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = AppState.payments.map(p => `
            <div class="payment-method-card" data-payment-id="${p.id}">
                ${p.icon ? `<img src="${p.icon}" alt="${p.name}">` : '<i class="fas fa-credit-card"></i>'}
                <span>${p.name}</span>
            </div>
        `).join('');
        
        container.querySelectorAll('.payment-method-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectPaymentMethod(card.dataset.paymentId);
            });
        });
    }

    selectPaymentMethod(paymentId) {
        const payment = AppState.payments.find(p => p.id === paymentId);
        if (!payment) return;
        
        AppState.selectedPayment = payment;
        
        document.getElementById('payment-methods')?.classList.add('hidden');
        document.getElementById('payment-form')?.classList.remove('hidden');
        
        const iconEl = document.getElementById('selected-payment-icon');
        const nameEl = document.getElementById('selected-payment-name');
        const addressEl = document.getElementById('selected-payment-address');
        const holderEl = document.getElementById('selected-payment-holder');
        
        if (iconEl) iconEl.src = payment.icon || '';
        if (nameEl) nameEl.textContent = payment.name;
        if (addressEl) addressEl.textContent = payment.address;
        if (holderEl) holderEl.textContent = payment.holder;
        
        TelegramHelper.haptic('selection');
    }

    async submitTopupRequest() {
        const amount = parseFloat(document.getElementById('topup-amount')?.value || 0);
        
        if (amount < 1000) {
            Toast.warning('Invalid', 'Minimum topup is 1,000 MMK');
            return;
        }
        
        if (!AppState.topupScreenshot) {
            Toast.warning('Required', 'Please upload payment screenshot');
            return;
        }
        
        Loading.show('Submitting...');
        
        try {
            const request = {
                id: generateId('topup'),
                oderId: generateOrderId(),
                userId: AppState.user.id,
                userName: TelegramHelper.formatName(AppState.user),
                amount: amount,
                paymentMethod: AppState.selectedPayment?.name,
                screenshot: AppState.topupScreenshot,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            let topups = await JSONBinDB.read('topupRequests') || [];
            topups.push(request);
            await JSONBinDB.write('topupRequests', topups);
            
            Modal.close('topup-modal');
            this.resetTopupModal();
            
            Toast.success('Submitted', 'Topup request pending approval');
            TelegramHelper.haptic('notification', 'success');
            
        } catch (error) {
            console.error('Topup error:', error);
            Toast.error('Error', 'Failed to submit request');
        }
        
        Loading.hide();
    }

    resetTopupModal() {
        document.getElementById('topup-amount').value = '';
        document.getElementById('payment-screenshot').value = '';
        document.getElementById('payment-methods')?.classList.remove('hidden');
        document.getElementById('payment-form')?.classList.add('hidden');
        
        const preview = document.getElementById('file-preview');
        const content = document.querySelector('#file-upload .file-upload-content');
        if (preview) preview.classList.add('hidden');
        if (content) content.classList.remove('hidden');
        
        AppState.selectedPayment = null;
        AppState.topupScreenshot = null;
    }

    // ============================================
    // Orders & History
    // ============================================

    async loadOrders() {
        const list = document.getElementById('orders-list');
        if (!list) return;
        
        Loading.show('Loading orders...');
        
        try {
            const allOrders = await JSONBinDB.read('orders') || [];
            AppState.orders = allOrders.filter(o => String(o.userId) === String(AppState.user.id));
            
            if (AppState.orders.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>No orders yet</p>
                    </div>
                `;
                Loading.hide();
                return;
            }
            
            const sorted = [...AppState.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            list.innerHTML = sorted.map(order => `
                <div class="order-card" data-status="${order.status}">
                    <div class="order-header">
                        <span class="order-id">${order.id}</span>
                        <span class="order-status ${order.status}">${order.status}</span>
                    </div>
                    <div class="order-body">
                        ${order.productIcon ? `<img src="${order.productIcon}" class="order-product-icon">` : ''}
                        <div class="order-details">
                            <span class="order-product-name">${order.productName}</span>
                            <span class="order-product-amount">${order.categoryName}</span>
                        </div>
                        <div class="order-price">
                            <span>${Format.currency(order.price, order.currency)}</span>
                            <span class="order-date">${Format.date(order.createdAt, 'relative')}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Load orders error:', error);
            list.innerHTML = `<div class="empty-state"><p>Error loading orders</p></div>`;
        }
        
        Loading.hide();
    }

    async loadHistory() {
        const list = document.getElementById('history-list');
        if (!list) return;
        
        Loading.show('Loading history...');
        
        try {
            const allOrders = await JSONBinDB.read('orders') || [];
            const userOrders = allOrders.filter(o => String(o.userId) === String(AppState.user.id));
            
            const allTopups = await JSONBinDB.read('topupRequests') || [];
            const userTopups = allTopups.filter(t => String(t.userId) === String(AppState.user.id));
            
            const history = [
                ...userOrders.map(o => ({ ...o, type: 'order' })),
                ...userTopups.map(t => ({ ...t, type: 'topup' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            if (history.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>No transactions yet</p>
                    </div>
                `;
                Loading.hide();
                return;
            }
            
            list.innerHTML = history.map(item => {
                const isTopup = item.type === 'topup';
                const icon = isTopup ? 'fas fa-arrow-down' : 'fas fa-shopping-cart';
                const title = isTopup ? 'Balance Topup' : item.productName;
                
                return `
                    <div class="history-card" data-type="${item.type}">
                        <div class="history-icon ${item.type}"><i class="${icon}"></i></div>
                        <div class="history-details">
                            <span class="history-title">${title}</span>
                            <span class="history-subtitle">${item.status} • ${Format.date(item.createdAt, 'relative')}</span>
                        </div>
                        <span class="history-amount">${Format.currency(item.amount || item.price)}</span>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Load history error:', error);
        }
        
        Loading.hide();
    }

    async loadProfile() {
        try {
            const users = await JSONBinDB.read('users') || [];
            const userData = users.find(u => String(u.id) === String(AppState.user.id));
            
            if (userData) {
                AppState.balance = userData.balance || 0;
            }
            
            // Update UI
            const avatar = document.getElementById('profile-avatar');
            const name = document.getElementById('profile-name');
            const username = document.getElementById('profile-username');
            
            if (avatar) avatar.src = TelegramHelper.getAvatarUrl(AppState.user.id);
            if (name) name.textContent = TelegramHelper.formatName(AppState.user);
            if (username) username.textContent = `@${AppState.user.username || 'N/A'}`;
            
            // Stats
            const statBalance = document.getElementById('stat-balance');
            const statOrders = document.getElementById('stat-orders');
            const statCompleted = document.getElementById('stat-completed');
            
            if (statBalance) statBalance.textContent = Format.currency(AppState.balance);
            if (statOrders) statOrders.textContent = userData?.totalOrders || 0;
            if (statCompleted) statCompleted.textContent = userData?.completedOrders || 0;
            
            this.updateBalanceDisplay();
            
        } catch (error) {
            console.error('Load profile error:', error);
        }
    }

    // ============================================
    // Event Listeners
    // ============================================

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
                TelegramHelper.haptic('selection');
            });
        });
        
        // Topup button
        document.getElementById('topup-btn')?.addEventListener('click', () => {
            this.openTopupModal();
        });
        
        // Back button
        document.getElementById('back-to-home')?.addEventListener('click', () => {
            this.closeCategory();
        });
        
        // Purchase modal
        document.getElementById('close-purchase-modal')?.addEventListener('click', () => {
            Modal.close('purchase-modal');
        });
        document.getElementById('confirm-purchase')?.addEventListener('click', () => {
            this.confirmPurchase();
        });
        
        // Topup modal
        document.getElementById('close-topup-modal')?.addEventListener('click', () => {
            Modal.close('topup-modal');
            this.resetTopupModal();
        });
        document.getElementById('submit-topup')?.addEventListener('click', () => {
            this.submitTopupRequest();
        });
        
        // Copy address
        document.getElementById('copy-address')?.addEventListener('click', () => {
            const address = document.getElementById('selected-payment-address')?.textContent;
            if (address) {
                navigator.clipboard.writeText(address);
                Toast.success('Copied!', 'Address copied to clipboard');
            }
        });
        
        // File upload
        this.setupFileUpload();
        
        // Profile menu
        document.getElementById('menu-topup')?.addEventListener('click', () => this.openTopupModal());
        document.getElementById('menu-orders')?.addEventListener('click', () => this.switchTab('orders'));
        document.getElementById('menu-history')?.addEventListener('click', () => this.switchTab('history'));
        document.getElementById('menu-support')?.addEventListener('click', () => {
            TelegramHelper.openLink('https://t.me/OPPER101');
        });
    }

    setupFileUpload() {
        const input = document.getElementById('payment-screenshot');
        const preview = document.getElementById('file-preview');
        const previewImg = document.getElementById('preview-image');
        const content = document.querySelector('#file-upload .file-upload-content');
        const removeBtn = document.getElementById('remove-file');
        
        input?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const base64 = await fileToBase64(file);
            if (previewImg) previewImg.src = base64;
            if (preview) preview.classList.remove('hidden');
            if (content) content.classList.add('hidden');
            AppState.topupScreenshot = base64;
        });
        
        removeBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            if (input) input.value = '';
            if (preview) preview.classList.add('hidden');
            if (content) content.classList.remove('hidden');
            AppState.topupScreenshot = null;
        });
    }

    switchTab(tabName) {
        // Update nav
        document.querySelectorAll('.nav-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
        
        // Hide category page
        document.getElementById('category-page')?.classList.add('hidden');
        
        // Load content
        switch (tabName) {
            case 'home': this.loadHomeContent(); break;
            case 'orders': this.loadOrders(); break;
            case 'history': this.loadHistory(); break;
            case 'profile': this.loadProfile(); break;
            case 'admin': this.openAdminPanel(); break;
        }
        
        AppState.currentTab = tabName;
    }

    openAdminPanel() {
        if (!AppState.isAdmin) {
            Toast.error('Access Denied', 'You are not authorized');
            this.switchTab('home');
            return;
        }
        window.location.href = '/admin.html';
    }

    // ============================================
    // Real-time Sync
    // ============================================

    startRealTimeSync() {
        // Sync every 30 seconds
        this.syncInterval = setInterval(() => this.syncData(), 30000);
        
        // Sync on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.syncData();
            }
        });
    }

    async syncData() {
        try {
            // Sync balance
            const users = await JSONBinDB.read('users') || [];
            const userData = users.find(u => String(u.id) === String(AppState.user.id));
            
            if (userData) {
                const oldBalance = AppState.balance;
                AppState.balance = userData.balance || 0;
                
                if (oldBalance !== AppState.balance) {
                    this.updateBalanceDisplay();
                    
                    if (AppState.balance > oldBalance) {
                        Toast.success('Balance Updated', `+${Format.currency(AppState.balance - oldBalance)}`);
                        TelegramHelper.haptic('notification', 'success');
                    }
                }
            }
            
            // Sync orders
            const allOrders = await JSONBinDB.read('orders') || [];
            const userOrders = allOrders.filter(o => String(o.userId) === String(AppState.user.id));
            
            userOrders.forEach(newOrder => {
                const oldOrder = AppState.orders.find(o => o.id === newOrder.id);
                if (oldOrder && oldOrder.status !== newOrder.status) {
                    if (newOrder.status === 'approved') {
                        Toast.success('Order Approved!', `Order ${newOrder.id} approved`);
                    } else if (newOrder.status === 'rejected') {
                        Toast.error('Order Rejected', `Order ${newOrder.id} rejected`);
                    }
                    TelegramHelper.haptic('notification', newOrder.status === 'approved' ? 'success' : 'error');
                }
            });
            
            AppState.orders = userOrders;
            
            // Sync settings
            const settings = await JSONBinDB.read('settings');
            if (settings) {
                AppState.settings = { ...AppState.settings, ...settings };
                this.updateHeader();
            }
            
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    stopRealTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
}

// ============================================
// Initialize App
// ============================================

let app = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Document ready');
    
    app = new MafiaGamingApp();
    await app.init();
    
    window.MafiaApp = app;
    window.AppState = AppState;
});

window.addEventListener('beforeunload', () => {
    if (app) app.stopRealTimeSync();
});

console.log('📱 App.js v3.0.0 loaded (JSONBin Connected)');
