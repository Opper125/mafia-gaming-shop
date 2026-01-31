import { Toast, Loading, Modal } from "@/components/ui/toast"
/* ============================================
   MAFIA GAMING SHOP - USER DASHBOARD
   Version: 3.1.0 (Fixed - No Duplicates)
   ============================================ */

// ============================================
// Configuration - HARDCODED BIN IDs
// Admin Panel ကဖန်တီးပြီးရင် ဒီမှာထည့်ပါ
// ============================================

const APP_CONFIG = {
    ADMIN_ID: 1538232799,
    ADMIN_ID_STR: '1538232799',
    BOT_TOKEN: '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM',
    BOT_USERNAME: 'mafia_gamingshopbot',
    
    // JSONBin.io Configuration
    JSONBIN: {
        BASE_URL: 'https://api.jsonbin.io/v3',
        MASTER_KEY: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
        ACCESS_KEY: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS',
        
        // ⚠️ IMPORTANT: Admin Panel ကဖန်တီးပြီးရင် ဒီ BIN_IDS တွေကို ထည့်ပါ
        // Admin Panel Console မှာ ပြပေးပါလိမ့်မယ်
        BIN_IDS: {
            master: '',           // Admin Panel ကပေးတဲ့ ID ထည့်ပါ
            users: '',
            categories: '',
            products: '',
            orders: '',
            topupRequests: '',
            payments: '',
            bannersType1: '',
            bannersType2: '',
            inputTables: '',
            bannedUsers: '',
            broadcasts: '',
            settings: ''
        }
    }
};

// ============================================
// Database Service - Uses Shared JSONBin
// ============================================

const Database = {
    binIds: {},
    initialized: false,
    
    async init() {
        console.log('🗄️ Initializing Database via Vercel API...');
        
        try {
            // Fetch configuration from Vercel API
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error(`Failed to fetch config: ${response.status}`);
            }
            
            const config = await response.json();
            this.binIds = config.binIds;
            console.log('✅ Loaded BIN IDs from Vercel API');
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.warn('⚠️ Could not load config from API:', error.message);
            
            // Fallback: Check hardcoded BIN_IDS
            if (APP_CONFIG.JSONBIN.BIN_IDS.master) {
                this.binIds = { ...APP_CONFIG.JSONBIN.BIN_IDS };
                console.log('✅ Using hardcoded BIN IDs');
                this.initialized = true;
                return true;
            }
            
            // Final fallback: Try localStorage
            const savedBinIds = localStorage.getItem('mafia_jsonbin_ids');
            if (savedBinIds) {
                try {
                    this.binIds = JSON.parse(savedBinIds);
                    console.log('✅ Loaded BIN IDs from localStorage');
                    this.initialized = true;
                    return true;
                } catch (e) {
                    console.error('Parse error:', e);
                }
            }
            
            console.error('❌ No database configuration found');
            return false;
        }
    },
    
    async read(binType) {
        if (!this.binIds || !this.binIds[binType]) {
            console.warn(`Bin not found: ${binType}`);
            return this.getDefault(binType);
        }
        
        const binId = this.binIds[binType];
        
        try {
            // Use Vercel API route
            const response = await fetch(`/api/products?binId=${binId}`);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            return data || this.getDefault(binType);
            
        } catch (error) {
            console.error(`Read error (${binType}):`, error);
            return this.getDefault(binType);
        }
    },
    
    async write(binType, data) {
        if (!this.binIds || !this.binIds[binType]) {
            console.error(`Bin not found: ${binType}`);
            return false;
        }
        
        const binId = this.binIds[binType];
        
        try {
            // Use Vercel API route
            let endpoint = '/api/products';
            if (binType === 'categories') endpoint = '/api/categories';
            else if (binType === 'orders') endpoint = '/api/orders';
            else if (binType === 'users') endpoint = '/api/users';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    binId: binId,
                    products: data
                })
            });
            
            return response.ok;
            
        } catch (error) {
            console.error(`Write error (${binType}):`, error);
            return false;
        }
    },
    
    getDefault(binType) {
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
                announcement: 'Welcome to Mafia Gaming Shop!'
            }
        };
        return defaults[binType] || null;
    },
    
    isReady() {
        return this.initialized && Object.keys(this.binIds).length > 0;
    }
};

// ============================================
// Telegram WebApp Helper
// ============================================

const TG = {
    webapp: null,
    
    init() {
        if (window.Telegram?.WebApp) {
            this.webapp = window.Telegram.WebApp;
            this.webapp.ready();
            this.webapp.expand();
            return true;
        }
        return false;
    },
    
    getUser() {
        return this.webapp?.initDataUnsafe?.user || null;
    },
    
    isAdmin(userId) {
        return String(userId) === APP_CONFIG.ADMIN_ID_STR;
    },
    
    haptic(type = 'impact', style = 'light') {
        try {
            if (type === 'impact') {
                this.webapp?.HapticFeedback?.impactOccurred(style);
            } else if (type === 'notification') {
                this.webapp?.HapticFeedback?.notificationOccurred(style);
            } else {
                this.webapp?.HapticFeedback?.selectionChanged();
            }
        } catch (e) {}
    },
    
    alert(msg) {
        return new Promise(resolve => {
            if (this.webapp?.showAlert) {
                this.webapp.showAlert(msg, resolve);
            } else {
                alert(msg);
                resolve();
            }
        });
    },
    
    avatarUrl(userId) {
        return `https://ui-avatars.com/api/?name=${userId}&background=8B5CF6&color=fff&size=128`;
    },
    
    formatName(user) {
        if (!user) return 'User';
        return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
    },
    
    openLink(url) {
        if (this.webapp?.openTelegramLink) {
            this.webapp.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }
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
        announcement: 'Welcome!'
    },
    
    currentTab: 'home',
    currentCategory: null,
    selectedProduct: null,
    selectedPayment: null,
    inputValues: {},
    topupScreenshot: null
};

// ============================================
// Utility Functions
// ============================================

function generateId(prefix = '') {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`;
}

function generateOrderId() {
    const d = new Date();
    const y = d.getFullYear().toString().slice(-2);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const r = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD${y}${m}${day}${r}`;
}

function formatCurrency(amount, currency = 'MMK') {
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
}

function formatDate(dateStr, type = 'short') {
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
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
// Simple Toast (if Utils.Toast not available)
// ============================================

function showToast(type, title, message) {
    // Use Utils.Toast if available (from utils.js)
    if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show(type, title, message);
        return;
    }
    
    // Fallback simple toast
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <strong>${title}</strong>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// Simple Loading
// ============================================

function showLoading(text = 'Loading...') {
    // Use Utils.Loading if available
    if (typeof Loading !== 'undefined' && Loading.show) {
        Loading.show(text);
        return;
    }
    
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p id="loading-text">${text}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    const textEl = overlay.querySelector('#loading-text');
    if (textEl) textEl.textContent = text;
    overlay.classList.remove('hidden');
}

function hideLoading() {
    if (typeof Loading !== 'undefined' && Loading.hide) {
        Loading.hide();
        return;
    }
    
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}

// ============================================
// Simple Modal
// ============================================

function openModal(id) {
    if (typeof Modal !== 'undefined' && Modal.open) {
        Modal.open(id);
        return;
    }
    
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    if (typeof Modal !== 'undefined' && Modal.close) {
        Modal.close(id);
        return;
    }
    
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// Main Application
// ============================================

class MafiaGamingApp {
    constructor() {
        this.initialized = false;
        this.syncInterval = null;
        console.log('🎮 MafiaGamingApp created');
    }

    async init() {
        console.log('🚀 Initializing...');
        
        try {
            // Initialize Telegram
            if (!TG.init()) {
                this.showAccessDenied('Please open from Telegram Bot');
                return;
            }
            
            // Get user
            const user = TG.getUser();
            if (!user) {
                this.showAccessDenied('Could not get user data');
                return;
            }
            
            AppState.user = user;
            AppState.isAdmin = TG.isAdmin(user.id);
            AppState.isAuthenticated = true;
            
            console.log('👤 User:', user.first_name, '| ID:', user.id, '| Admin:', AppState.isAdmin);
            
            // Play intro
            await this.playIntro();
            
            // Initialize database
            showLoading('Connecting to database...');
            const dbReady = await Database.init();
            
            if (!dbReady) {
                hideLoading();
                this.showDatabaseRequired();
                return;
            }
            
            // Check if banned
            const isBanned = await this.checkIfBanned();
            if (isBanned) {
                hideLoading();
                this.showBannedScreen();
                return;
            }
            
            // Load data
            await this.loadAllData();
            
            // Register user
            await this.registerUser();
            
            // Setup UI
            this.setupUI();
            this.setupEventListeners();
            
            // Start sync
            this.startRealTimeSync();
            
            hideLoading();
            this.initialized = true;
            
            console.log('✅ App initialized!');
            showToast('success', 'Welcome!', `Hello, ${user.first_name}!`);
            
        } catch (error) {
            console.error('❌ Init error:', error);
            hideLoading();
            showToast('error', 'Error', 'Failed to initialize');
        }
    }

    showAccessDenied(message) {
        document.getElementById('intro-screen')?.classList.add('hidden');
        document.getElementById('main-app')?.classList.add('hidden');
        
        const denied = document.getElementById('access-denied');
        if (denied) {
            denied.classList.remove('hidden');
            const msg = denied.querySelector('p');
            if (msg) msg.textContent = message;
        }
    }

    showBannedScreen() {
        this.showAccessDenied('Your account has been banned');
    }

    showDatabaseRequired() {
        document.getElementById('intro-screen')?.classList.add('hidden');
        
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.classList.remove('hidden');
            mainApp.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px;">
                    <i class="fas fa-database" style="font-size:60px;color:var(--primary);margin-bottom:20px;"></i>
                    <h2>Database Setup Required</h2>
                    <p style="color:var(--text-secondary);margin:15px 0;">
                        Admin needs to setup database first.<br>
                        Please contact administrator.
                    </p>
                    <button onclick="location.reload()" style="padding:12px 30px;background:var(--primary);color:white;border:none;border-radius:25px;cursor:pointer;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    async checkIfBanned() {
        try {
            const banned = await Database.read('bannedUsers') || [];
            return banned.some(u => String(u.id) === String(AppState.user.id));
        } catch (e) {
            return false;
        }
    }

    async playIntro() {
        return new Promise(resolve => {
            const intro = document.getElementById('intro-screen');
            const main = document.getElementById('main-app');
            
            setTimeout(() => {
                if (intro) {
                    intro.style.opacity = '0';
                    intro.style.transition = 'opacity 0.5s';
                }
                
                setTimeout(() => {
                    if (intro) intro.classList.add('hidden');
                    if (main) main.classList.remove('hidden');
                    resolve();
                }, 500);
            }, 3000);
        });
    }

    async loadAllData() {
        console.log('📦 Loading data...');
        showLoading('Loading shop data...');
        
        try {
            const [categories, products, orders, payments, bannersType1, bannersType2, inputTables, settings] = await Promise.all([
                Database.read('categories'),
                Database.read('products'),
                Database.read('orders'),
                Database.read('payments'),
                Database.read('bannersType1'),
                Database.read('bannersType2'),
                Database.read('inputTables'),
                Database.read('settings')
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
                products: AppState.products.length
            });
            
        } catch (error) {
            console.error('Load error:', error);
        }
        
        hideLoading();
    }

    async registerUser() {
        try {
            let users = await Database.read('users') || [];
            const idx = users.findIndex(u => String(u.id) === String(AppState.user.id));
            
            if (idx !== -1) {
                users[idx].lastActive = new Date().toISOString();
                users[idx].username = AppState.user.username;
                users[idx].firstName = AppState.user.first_name;
                users[idx].lastName = AppState.user.last_name;
                AppState.balance = users[idx].balance || 0;
            } else {
                users.push({
                    id: AppState.user.id,
                    username: AppState.user.username,
                    firstName: AppState.user.first_name,
                    lastName: AppState.user.last_name,
                    isPremium: AppState.user.is_premium || false,
                    balance: 0,
                    totalOrders: 0,
                    completedOrders: 0,
                    joinedAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                });
                AppState.balance = 0;
            }
            
            await Database.write('users', users);
            
        } catch (error) {
            console.error('Register error:', error);
        }
    }

    setupUI() {
        this.updateHeader();
        this.updateUserInfo();
        this.updateAdminAccess();
        this.loadHomeContent();
        this.updateBalanceDisplay();
    }

    updateHeader() {
        const logo = document.getElementById('header-logo');
        const name = document.getElementById('header-site-name');
        
        if (AppState.settings.logo && logo) logo.src = AppState.settings.logo;
        if (AppState.settings.siteName && name) name.textContent = AppState.settings.siteName;
    }

    updateUserInfo() {
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        const premium = document.getElementById('premium-badge');
        
        if (avatar) avatar.src = TG.avatarUrl(AppState.user.id);
        if (name) name.textContent = TG.formatName(AppState.user);
        if (premium && AppState.user.is_premium) premium.style.display = 'flex';
    }

    updateAdminAccess() {
        const tab = document.getElementById('admin-tab');
        if (tab) tab.style.display = AppState.isAdmin ? 'flex' : 'none';
    }

    updateBalanceDisplay() {
        const el = document.getElementById('user-balance');
        if (el) el.textContent = formatCurrency(AppState.balance);
        
        const stat = document.getElementById('stat-balance');
        if (stat) stat.textContent = formatCurrency(AppState.balance);
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
            container.innerHTML = '<div class="banner-placeholder"><i class="fas fa-image"></i></div>';
            return;
        }
        
        container.innerHTML = AppState.bannersType1.map((b, i) => `
            <div class="banner-slide ${i === 0 ? 'active' : ''}">
                <img src="${b.image}" alt="Banner">
            </div>
        `).join('');
        
        if (AppState.bannersType1.length > 1) {
            let current = 0;
            const slides = container.querySelectorAll('.banner-slide');
            setInterval(() => {
                slides[current].classList.remove('active');
                current = (current + 1) % slides.length;
                slides[current].classList.add('active');
            }, 5000);
        }
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
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-gamepad"></i><p>No categories</p></div>';
            return;
        }
        
        grid.innerHTML = AppState.categories.map(cat => {
            const count = AppState.products.filter(p => p.categoryId === cat.id).length;
            return `
                <div class="category-card" data-id="${cat.id}">
                    <div class="category-icon-wrapper">
                        ${cat.icon ? `<img src="${cat.icon}" class="category-icon">` : '<i class="fas fa-gamepad" style="font-size:40px;color:var(--primary);"></i>'}
                        ${cat.flag ? `<span class="category-flag">${cat.flag}</span>` : ''}
                        ${cat.hasDiscount ? '<span class="category-discount-badge">SALE</span>' : ''}
                    </div>
                    <span class="category-name">${cat.name}</span>
                    <span class="category-sold">${count} products</span>
                </div>
            `;
        }).join('');
        
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => this.openCategory(card.dataset.id));
        });
    }

    loadFeaturedProducts() {
        const grid = document.getElementById('featured-products');
        if (!grid) return;
        
        const featured = AppState.products.filter(p => p.hasDiscount).slice(0, 4);
        
        if (featured.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-fire"></i><p>No featured</p></div>';
            return;
        }
        
        grid.innerHTML = featured.map(p => this.createProductCard(p)).join('');
    }

    createProductCard(product) {
        const price = product.hasDiscount 
            ? product.price - (product.price * product.discount / 100)
            : product.price;
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    ${product.icon ? `<img src="${product.icon}">` : '<i class="fas fa-box" style="font-size:40px;color:var(--primary);"></i>'}
                    ${product.hasDiscount ? `<span class="product-discount-badge">-${product.discount}%</span>` : ''}
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-price">
                        <span class="price-current">${formatCurrency(price, product.currency)}</span>
                        ${product.hasDiscount ? `<span class="price-original">${formatCurrency(product.price, product.currency)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    openCategory(categoryId) {
        const category = AppState.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        AppState.currentCategory = category;
        
        document.getElementById('home-tab')?.classList.remove('active');
        const page = document.getElementById('category-page');
        if (page) {
            page.classList.remove('hidden');
            page.classList.add('active');
        }
        
        const icon = document.getElementById('category-icon');
        const name = document.getElementById('category-name');
        if (icon) icon.src = category.icon || '';
        if (name) name.textContent = category.name;
        
        this.loadInputTables(categoryId);
        this.loadCategoryProducts(categoryId);
        this.loadCategoryBanner(categoryId);
        
        TG.haptic('impact');
    }

    closeCategory() {
        AppState.currentCategory = null;
        AppState.selectedProduct = null;
        AppState.inputValues = {};
        
        document.getElementById('category-page')?.classList.add('hidden');
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
        container.innerHTML = tables.map(t => `
            <div class="input-table-group">
                <label>${t.name} ${t.required ? '<span style="color:red;">*</span>' : ''}</label>
                <input type="text" class="input-table-field" placeholder="${t.placeholder || ''}" data-id="${t.id}" ${t.required ? 'required' : ''}>
            </div>
        `).join('');
        
        container.querySelectorAll('.input-table-field').forEach(input => {
            input.addEventListener('input', e => {
                AppState.inputValues[e.target.dataset.id] = e.target.value;
            });
        });
    }

    loadCategoryProducts(categoryId) {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        const products = AppState.products.filter(p => p.categoryId === categoryId);
        
        if (products.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-box-open"></i><p>No products</p></div>';
            return;
        }
        
        grid.innerHTML = products.map(p => this.createProductCard(p)).join('');
        
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => this.selectProduct(card.dataset.id));
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
            <img src="${banner.image}" style="width:100%;border-radius:12px;">
            ${banner.instructions ? `<p style="margin-top:10px;color:var(--text-secondary);">${banner.instructions}</p>` : ''}
        `;
    }

    selectProduct(productId) {
        const product = AppState.products.find(p => p.id === productId);
        if (!product) return;
        
        document.querySelectorAll('.product-card.selected').forEach(c => c.classList.remove('selected'));
        document.querySelector(`.product-card[data-id="${productId}"]`)?.classList.add('selected');
        
        AppState.selectedProduct = product;
        this.showBuyButton(product);
        TG.haptic('selection');
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
                ${product.icon ? `<img src="${product.icon}">` : ''}
                <div class="info">
                    <span class="name">${product.name}</span>
                    <span class="price">${formatCurrency(price, product.currency)}</span>
                </div>
            </div>
            <button class="buy-now-btn" id="buy-now-btn">
                <i class="fas fa-shopping-cart"></i> Buy Now
            </button>
        `;
        
        section.style.display = 'flex';
        
        document.getElementById('buy-now-btn').addEventListener('click', () => this.initiatePurchase());
    }

    hideBuyButton() {
        const section = document.querySelector('.buy-now-section');
        if (section) section.style.display = 'none';
    }

    initiatePurchase() {
        if (!AppState.selectedProduct) {
            showToast('warning', 'Warning', 'Please select a product');
            return;
        }
        
        // Validate inputs
        const tables = AppState.inputTables.filter(t => t.categoryId === AppState.currentCategory?.id);
        for (const t of tables) {
            if (t.required && !AppState.inputValues[t.id]) {
                showToast('warning', 'Required', `Please enter ${t.name}`);
                TG.haptic('notification', 'error');
                return;
            }
        }
        
        // Check balance
        const product = AppState.selectedProduct;
        const price = product.hasDiscount 
            ? product.price - (product.price * product.discount / 100)
            : product.price;
        
        if (AppState.balance < price) {
            showToast('error', 'Insufficient Balance', 'Please topup first');
            TG.haptic('notification', 'error');
            return;
        }
        
        this.openPurchaseModal(product, price);
    }

    openPurchaseModal(product, price) {
        const modal = document.getElementById('purchase-modal');
        if (!modal) return;
        
        const iconEl = document.getElementById('purchase-product-icon');
        const nameEl = document.getElementById('purchase-product-name');
        const priceEl = document.getElementById('purchase-product-price');
        const balanceEl = document.getElementById('purchase-balance');
        const remainingEl = document.getElementById('purchase-remaining');
        
        if (iconEl) iconEl.src = product.icon || '';
        if (nameEl) nameEl.textContent = product.name;
        if (priceEl) priceEl.textContent = formatCurrency(price, product.currency);
        if (balanceEl) balanceEl.textContent = formatCurrency(AppState.balance);
        if (remainingEl) remainingEl.textContent = formatCurrency(AppState.balance - price);
        
        openModal('purchase-modal');
    }

    async confirmPurchase() {
        showLoading('Processing...');
        
        try {
            const product = AppState.selectedProduct;
            const price = product.hasDiscount 
                ? product.price - (product.price * product.discount / 100)
                : product.price;
            
            const order = {
                id: generateOrderId(),
                oderId: generateOrderId(),
                userId: AppState.user.id,
                userName: TG.formatName(AppState.user),
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
            let orders = await Database.read('orders') || [];
            orders.push(order);
            await Database.write('orders', orders);
            
            // Deduct balance
            let users = await Database.read('users') || [];
            const idx = users.findIndex(u => String(u.id) === String(AppState.user.id));
            if (idx !== -1) {
                users[idx].balance -= price;
                users[idx].totalOrders = (users[idx].totalOrders || 0) + 1;
                AppState.balance = users[idx].balance;
                await Database.write('users', users);
            }
            
            AppState.orders.push(order);
            
            closeModal('purchase-modal');
            hideLoading();
            
            showToast('success', 'Order Placed!', 'Pending approval');
            TG.haptic('notification', 'success');
            
            AppState.selectedProduct = null;
            AppState.inputValues = {};
            this.hideBuyButton();
            this.updateBalanceDisplay();
            
            document.querySelectorAll('.product-card.selected').forEach(c => c.classList.remove('selected'));
            document.querySelectorAll('.input-table-field').forEach(i => i.value = '');
            
        } catch (error) {
            console.error('Purchase error:', error);
            hideLoading();
            showToast('error', 'Error', 'Failed to process');
        }
    }

    openTopupModal() {
        this.loadPaymentMethods();
        openModal('topup-modal');
    }

    loadPaymentMethods() {
        const container = document.getElementById('payment-methods');
        const form = document.getElementById('payment-form');
        
        if (!container) return;
        
        container.classList.remove('hidden');
        form?.classList.add('hidden');
        
        if (AppState.payments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>No payment methods</p></div>';
            return;
        }
        
        container.innerHTML = AppState.payments.map(p => `
            <div class="payment-method-card" data-id="${p.id}">
                ${p.icon ? `<img src="${p.icon}">` : '<i class="fas fa-credit-card"></i>'}
                <span>${p.name}</span>
            </div>
        `).join('');
        
        container.querySelectorAll('.payment-method-card').forEach(card => {
            card.addEventListener('click', () => this.selectPaymentMethod(card.dataset.id));
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
        
        TG.haptic('selection');
    }

    async submitTopupRequest() {
        const amount = parseFloat(document.getElementById('topup-amount')?.value || 0);
        
        if (amount < 1000) {
            showToast('warning', 'Invalid', 'Minimum 1,000 MMK');
            return;
        }
        
        if (!AppState.topupScreenshot) {
            showToast('warning', 'Required', 'Upload screenshot');
            return;
        }
        
        showLoading('Submitting...');
        
        try {
            const request = {
                id: generateId('topup'),
                oderId: generateOrderId(),
                userId: AppState.user.id,
                userName: TG.formatName(AppState.user),
                amount: amount,
                paymentMethod: AppState.selectedPayment?.name,
                screenshot: AppState.topupScreenshot,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            let topups = await Database.read('topupRequests') || [];
            topups.push(request);
            await Database.write('topupRequests', topups);
            
            closeModal('topup-modal');
            this.resetTopupModal();
            
            showToast('success', 'Submitted', 'Pending approval');
            TG.haptic('notification', 'success');
            
        } catch (error) {
            console.error('Topup error:', error);
            showToast('error', 'Error', 'Failed to submit');
        }
        
        hideLoading();
    }

    resetTopupModal() {
        const amountEl = document.getElementById('topup-amount');
        const fileEl = document.getElementById('payment-screenshot');
        
        if (amountEl) amountEl.value = '';
        if (fileEl) fileEl.value = '';
        
        document.getElementById('payment-methods')?.classList.remove('hidden');
        document.getElementById('payment-form')?.classList.add('hidden');
        
        const preview = document.getElementById('file-preview');
        const content = document.querySelector('#file-upload .file-upload-content');
        if (preview) preview.classList.add('hidden');
        if (content) content.classList.remove('hidden');
        
        AppState.selectedPayment = null;
        AppState.topupScreenshot = null;
    }

    async loadOrders() {
        const list = document.getElementById('orders-list');
        if (!list) return;
        
        showLoading('Loading orders...');
        
        try {
            const allOrders = await Database.read('orders') || [];
            AppState.orders = allOrders.filter(o => String(o.userId) === String(AppState.user.id));
            
            if (AppState.orders.length === 0) {
                list.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No orders</p></div>';
                hideLoading();
                return;
            }
            
            const sorted = [...AppState.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            list.innerHTML = sorted.map(o => `
                <div class="order-card" data-status="${o.status}">
                    <div class="order-header">
                        <span class="order-id">${o.id}</span>
                        <span class="order-status ${o.status}">${o.status}</span>
                    </div>
                    <div class="order-body">
                        ${o.productIcon ? `<img src="${o.productIcon}" class="order-product-icon">` : ''}
                        <div class="order-details">
                            <span class="order-product-name">${o.productName}</span>
                            <span>${o.categoryName}</span>
                        </div>
                        <div class="order-price">
                            <span>${formatCurrency(o.price, o.currency)}</span>
                            <span class="order-date">${formatDate(o.createdAt, 'relative')}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Load orders error:', error);
            list.innerHTML = '<div class="empty-state"><p>Error loading</p></div>';
        }
        
        hideLoading();
    }

    async loadHistory() {
        const list = document.getElementById('history-list');
        if (!list) return;
        
        showLoading('Loading history...');
        
        try {
            const [allOrders, allTopups] = await Promise.all([
                Database.read('orders'),
                Database.read('topupRequests')
            ]);
            
            const userOrders = (allOrders || []).filter(o => String(o.userId) === String(AppState.user.id));
            const userTopups = (allTopups || []).filter(t => String(t.userId) === String(AppState.user.id));
            
            const history = [
                ...userOrders.map(o => ({ ...o, type: 'order' })),
                ...userTopups.map(t => ({ ...t, type: 'topup' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            if (history.length === 0) {
                list.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No history</p></div>';
                hideLoading();
                return;
            }
            
            list.innerHTML = history.map(item => `
                <div class="history-card" data-type="${item.type}">
                    <div class="history-icon ${item.type}">
                        <i class="fas ${item.type === 'topup' ? 'fa-arrow-down' : 'fa-shopping-cart'}"></i>
                    </div>
                    <div class="history-details">
                        <span class="history-title">${item.type === 'topup' ? 'Topup' : item.productName}</span>
                        <span class="history-subtitle">${item.status} • ${formatDate(item.createdAt, 'relative')}</span>
                    </div>
                    <span class="history-amount">${formatCurrency(item.amount || item.price)}</span>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Load history error:', error);
        }
        
        hideLoading();
    }

    async loadProfile() {
        try {
            const users = await Database.read('users') || [];
            const userData = users.find(u => String(u.id) === String(AppState.user.id));
            
            if (userData) {
                AppState.balance = userData.balance || 0;
            }
            
            const avatar = document.getElementById('profile-avatar');
            const name = document.getElementById('profile-name');
            const username = document.getElementById('profile-username');
            
            if (avatar) avatar.src = TG.avatarUrl(AppState.user.id);
            if (name) name.textContent = TG.formatName(AppState.user);
            if (username) username.textContent = `@${AppState.user.username || 'N/A'}`;
            
            const statBalance = document.getElementById('stat-balance');
            const statOrders = document.getElementById('stat-orders');
            const statCompleted = document.getElementById('stat-completed');
            
            if (statBalance) statBalance.textContent = formatCurrency(AppState.balance);
            if (statOrders) statOrders.textContent = userData?.totalOrders || 0;
            if (statCompleted) statCompleted.textContent = userData?.completedOrders || 0;
            
            this.updateBalanceDisplay();
            
        } catch (error) {
            console.error('Load profile error:', error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
                TG.haptic('selection');
            });
        });
        
        // Topup
        document.getElementById('topup-btn')?.addEventListener('click', () => this.openTopupModal());
        
        // Back
        document.getElementById('back-to-home')?.addEventListener('click', () => this.closeCategory());
        
        // Purchase modal
        document.getElementById('close-purchase-modal')?.addEventListener('click', () => closeModal('purchase-modal'));
        document.getElementById('confirm-purchase')?.addEventListener('click', () => this.confirmPurchase());
        
        // Topup modal
        document.getElementById('close-topup-modal')?.addEventListener('click', () => {
            closeModal('topup-modal');
            this.resetTopupModal();
        });
        document.getElementById('submit-topup')?.addEventListener('click', () => this.submitTopupRequest());
        
        // Copy address
        document.getElementById('copy-address')?.addEventListener('click', () => {
            const address = document.getElementById('selected-payment-address')?.textContent;
            if (address) {
                navigator.clipboard.writeText(address);
                showToast('success', 'Copied!', 'Address copied');
            }
        });
        
        // File upload
        this.setupFileUpload();
        
        // Profile menu
        document.getElementById('menu-topup')?.addEventListener('click', () => this.openTopupModal());
        document.getElementById('menu-orders')?.addEventListener('click', () => this.switchTab('orders'));
        document.getElementById('menu-history')?.addEventListener('click', () => this.switchTab('history'));
        document.getElementById('menu-support')?.addEventListener('click', () => TG.openLink('https://t.me/OPPER101'));
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
        document.querySelectorAll('.nav-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
        document.getElementById('category-page')?.classList.add('hidden');
        
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
            showToast('error', 'Denied', 'Not authorized');
            this.switchTab('home');
            return;
        }
        window.location.href = '/admin.html';
    }

    startRealTimeSync() {
        this.syncInterval = setInterval(() => this.syncData(), 30000);
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.syncData();
        });
    }

    async syncData() {
        try {
            const users = await Database.read('users') || [];
            const userData = users.find(u => String(u.id) === String(AppState.user.id));
            
            if (userData) {
                const oldBalance = AppState.balance;
                AppState.balance = userData.balance || 0;
                
                if (AppState.balance !== oldBalance) {
                    this.updateBalanceDisplay();
                    if (AppState.balance > oldBalance) {
                        showToast('success', 'Balance Updated', `+${formatCurrency(AppState.balance - oldBalance)}`);
                        TG.haptic('notification', 'success');
                    }
                }
            }
            
            const allOrders = await Database.read('orders') || [];
            const userOrders = allOrders.filter(o => String(o.userId) === String(AppState.user.id));
            
            userOrders.forEach(newOrder => {
                const oldOrder = AppState.orders.find(o => o.id === newOrder.id);
                if (oldOrder && oldOrder.status !== newOrder.status) {
                    if (newOrder.status === 'approved') {
                        showToast('success', 'Approved!', `Order ${newOrder.id}`);
                    } else if (newOrder.status === 'rejected') {
                        showToast('error', 'Rejected', `Order ${newOrder.id}`);
                    }
                    TG.haptic('notification', newOrder.status === 'approved' ? 'success' : 'error');
                }
            });
            
            AppState.orders = userOrders;
            
            // Sync settings
            const settings = await Database.read('settings');
            if (settings) {
                AppState.settings = { ...AppState.settings, ...settings };
                this.updateHeader();
            }
            
            // Sync categories & products
            AppState.categories = await Database.read('categories') || [];
            AppState.products = (await Database.read('products') || []).filter(p => p.active !== false);
            AppState.payments = (await Database.read('payments') || []).filter(p => p.active !== false);
            
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    stopRealTimeSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);
    }
}

// ============================================
// Initialize
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

console.log('📱 App.js v3.1.0 loaded');
