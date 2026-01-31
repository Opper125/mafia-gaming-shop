/* ============================================
   MAFIA GAMING SHOP - ADMIN PANEL
   Version: 3.2.0 (Error Free)
   ============================================ */

// ============================================
// Configuration
// ============================================

const ADMIN_CONFIG = {
    ADMIN_ID: 1538232799,
    BOT_TOKEN: '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM',
    BOT_USERNAME: 'mafia_gamingshopbot',
    
    JSONBIN: {
        BASE_URL: 'https://api.jsonbin.io/v3',
        MASTER_KEY: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
        ACCESS_KEY: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS',
        
        // BIN IDs - Admin Panel create လုပ်ပြီးရင် ဒီမှာထည့်ပါ
        BIN_IDS: {
            master: '',
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
// Simple UI Helpers (No conflicts)
// ============================================

const AdminUI = {
    toastContainer: null,
    loadingOverlay: null,
    
    init() {
        // Toast container
        this.toastContainer = document.getElementById('admin-toast-container');
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'admin-toast-container';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loading-overlay');
    },
    
    toast(type, title, message) {
        if (!this.toastContainer) this.init();
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('toast-exit');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    },
    
    showLoading(text) {
        if (!this.loadingOverlay) this.init();
        if (this.loadingOverlay) {
            const textEl = this.loadingOverlay.querySelector('#loading-text');
            if (textEl) textEl.textContent = text || 'Loading...';
            this.loadingOverlay.classList.remove('hidden');
        }
    },
    
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    },
    
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(m => {
            m.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};

// ============================================
// Database Service
// ============================================

const AdminDB = {
    binIds: {},
    ready: false,
    
    defaultData: {
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
    },
    
    async init() {
        console.log('🗄️ Initializing Database...');
        
        try {
            // Check hardcoded IDs first
            if (ADMIN_CONFIG.JSONBIN.BIN_IDS.master && ADMIN_CONFIG.JSONBIN.BIN_IDS.master.length > 5) {
                this.binIds = { ...ADMIN_CONFIG.JSONBIN.BIN_IDS };
                console.log('✅ Using hardcoded BIN IDs');
                this.ready = true;
                return true;
            }
            
            // Check localStorage
            const saved = localStorage.getItem('mafia_jsonbin_ids');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.master) {
                        this.binIds = parsed;
                        
                        // Verify master bin exists
                        const exists = await this.checkBinExists(parsed.master);
                        if (exists) {
                            console.log('✅ Using localStorage BIN IDs');
                            this.ready = true;
                            return true;
                        }
                    }
                } catch (e) {
                    console.warn('Parse error:', e);
                }
            }
            
            // Create new bins
            console.log('📦 Creating new database...');
            const success = await this.createAllBins();
            
            if (success) {
                this.ready = true;
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Database init error:', error);
            return false;
        }
    },
    
    async checkBinExists(binId) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.JSONBIN.BASE_URL}/b/${binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': ADMIN_CONFIG.JSONBIN.MASTER_KEY
                }
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },
    
    async createAllBins() {
        const types = [
            'settings', 'users', 'categories', 'products', 'orders',
            'topupRequests', 'payments', 'bannersType1', 'bannersType2',
            'inputTables', 'bannedUsers', 'broadcasts'
        ];
        
        const created = {};
        let success = true;
        
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const progress = Math.round(((i + 1) / types.length) * 100);
            
            AdminUI.showLoading(`Creating ${type}... ${progress}%`);
            console.log(`Creating bin: ${type}`);
            
            try {
                const binId = await this.createSingleBin(type, this.defaultData[type] || []);
                
                if (binId) {
                    created[type] = binId;
                    console.log(`✅ Created ${type}: ${binId}`);
                } else {
                    console.error(`❌ Failed to create ${type}`);
                    success = false;
                    break;
                }
                
                // Delay between requests
                await new Promise(r => setTimeout(r, 600));
                
            } catch (error) {
                console.error(`❌ Error creating ${type}:`, error);
                success = false;
                break;
            }
        }
        
        if (!success) {
            AdminUI.toast('error', 'Error', 'Failed to create database');
            return false;
        }
        
        // Create master bin
        AdminUI.showLoading('Finalizing...');
        
        try {
            const masterData = {
                binIds: created,
                createdAt: new Date().toISOString(),
                version: '3.2.0'
            };
            
            const masterBinId = await this.createSingleBin('master', masterData);
            
            if (masterBinId) {
                this.binIds = { master: masterBinId, ...created };
                localStorage.setItem('mafia_jsonbin_ids', JSON.stringify(this.binIds));
                
                console.log('========================================');
                console.log('📋 DATABASE CREATED - COPY THESE IDS:');
                console.log('========================================');
                console.log(JSON.stringify(this.binIds, null, 2));
                console.log('========================================');
                
                AdminUI.toast('success', 'Success', 'Database created!');
                return true;
            }
        } catch (error) {
            console.error('Master bin error:', error);
        }
        
        return false;
    },
    
    async createSingleBin(name, data) {
        try {
            const response = await fetch(`${ADMIN_CONFIG.JSONBIN.BASE_URL}/b`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': ADMIN_CONFIG.JSONBIN.MASTER_KEY,
                    'X-Bin-Name': `mafia-${name}-${Date.now()}`,
                    'X-Bin-Private': 'false'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Create bin error (${name}):`, errorText);
                return null;
            }
            
            const result = await response.json();
            return result.metadata.id;
            
        } catch (error) {
            console.error(`Create bin exception (${name}):`, error);
            return null;
        }
    },
    
    async read(type) {
        const binId = this.binIds[type];
        
        if (!binId) {
            console.warn(`No bin ID for: ${type}`);
            return this.defaultData[type] || [];
        }
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.JSONBIN.BASE_URL}/b/${binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': ADMIN_CONFIG.JSONBIN.MASTER_KEY
                }
            });
            
            if (!response.ok) {
                console.error(`Read error (${type}): HTTP ${response.status}`);
                return this.defaultData[type] || [];
            }
            
            const result = await response.json();
            return result.record;
            
        } catch (error) {
            console.error(`Read exception (${type}):`, error);
            return this.defaultData[type] || [];
        }
    },
    
    async write(type, data) {
        const binId = this.binIds[type];
        
        if (!binId) {
            console.error(`No bin ID for: ${type}`);
            return false;
        }
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.JSONBIN.BASE_URL}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': ADMIN_CONFIG.JSONBIN.MASTER_KEY
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.error(`Write error (${type}): HTTP ${response.status}`);
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error(`Write exception (${type}):`, error);
            return false;
        }
    }
};

// ============================================
// Admin State
// ============================================

const AdminState = {
    user: null,
    isAdmin: false,
    currentPage: 'dashboard',
    
    users: [],
    orders: [],
    topupRequests: [],
    categories: [],
    products: [],
    payments: [],
    bannersType1: [],
    bannersType2: [],
    inputTables: [],
    bannedUsers: [],
    settings: {},
    
    stats: {
        totalUsers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        rejectedOrders: 0,
        totalRevenue: 0,
        pendingTopups: 0
    },
    
    selectedUser: null,
    selectedOrder: null,
    selectedTopup: null
};

// ============================================
// Telegram Helper
// ============================================

const TG = {
    webapp: null,
    
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.webapp = window.Telegram.WebApp;
            this.webapp.ready();
            this.webapp.expand();
            return true;
        }
        return false;
    },
    
    getUser() {
        if (this.webapp && this.webapp.initDataUnsafe && this.webapp.initDataUnsafe.user) {
            return this.webapp.initDataUnsafe.user;
        }
        return null;
    },
    
    isAdmin(userId) {
        return Number(userId) === ADMIN_CONFIG.ADMIN_ID || String(userId) === String(ADMIN_CONFIG.ADMIN_ID);
    },
    
    formatName(user) {
        if (!user) return 'Admin';
        const parts = [];
        if (user.first_name) parts.push(user.first_name);
        if (user.last_name) parts.push(user.last_name);
        return parts.join(' ') || 'Admin';
    },
    
    avatarUrl(id) {
        return `https://ui-avatars.com/api/?name=${id}&background=8B5CF6&color=fff&size=128`;
    }
};

// ============================================
// Utility Functions
// ============================================

function formatCurrency(amount, currency) {
    const num = Number(amount) || 0;
    const cur = currency || 'MMK';
    return num.toLocaleString() + ' ' + cur;
}

function formatDate(dateStr, type) {
    if (!dateStr) return '-';
    
    const d = new Date(dateStr);
    
    if (type === 'relative') {
        const now = new Date();
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + 'm ago';
        if (hours < 24) return hours + 'h ago';
        if (days < 7) return days + 'd ago';
    }
    
    if (type === 'datetime') {
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    
    return d.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}

async function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function(e) { reject(e); };
        reader.readAsDataURL(file);
    });
}

function generateId(prefix) {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return (prefix || '') + ts + rand;
}

// ============================================
// Admin Panel Class
// ============================================

class AdminPanel {
    constructor() {
        console.log('🔧 AdminPanel created');
    }
    
    async init() {
        console.log('🚀 Initializing Admin Panel...');
        
        AdminUI.init();
        
        try {
            // Telegram
            if (!TG.init()) {
                this.showAccessDenied('Please open from Telegram Bot');
                return;
            }
            
            // User
            const user = TG.getUser();
            if (!user) {
                this.showAccessDenied('Could not get user data');
                return;
            }
            
            AdminState.user = user;
            console.log('👤 User:', user.first_name, 'ID:', user.id);
            
            // Admin check
            if (!TG.isAdmin(user.id)) {
                this.showAccessDenied('Access Denied. ID: ' + user.id + ' is not authorized.');
                return;
            }
            
            AdminState.isAdmin = true;
            console.log('✅ Admin verified');
            
            // Database
            AdminUI.showLoading('Connecting to database...');
            const dbOk = await AdminDB.init();
            
            if (!dbOk) {
                AdminUI.hideLoading();
                AdminUI.toast('error', 'Database Error', 'Failed to connect');
                return;
            }
            
            // Load data
            await this.loadAllData();
            
            // Show panel
            this.showPanel();
            
            AdminUI.hideLoading();
            AdminUI.toast('success', 'Welcome!', 'Admin Panel ready');
            
            console.log('✅ Admin Panel initialized');
            
        } catch (error) {
            console.error('❌ Init error:', error);
            AdminUI.hideLoading();
            AdminUI.toast('error', 'Error', error.message);
        }
    }
    
    showAccessDenied(message) {
        AdminUI.hideLoading();
        
        const screens = ['admin-verify-screen', 'admin-panel'];
        screens.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        
        const denied = document.getElementById('admin-access-denied');
        if (denied) {
            denied.classList.remove('hidden');
            const msg = denied.querySelector('p');
            if (msg) msg.textContent = message;
        }
    }
    
    showPanel() {
        const screens = ['admin-access-denied', 'admin-verify-screen'];
        screens.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        
        const panel = document.getElementById('admin-panel');
        if (panel) panel.classList.remove('hidden');
        
        this.updateAdminInfo();
        this.setupEventListeners();
        this.loadDashboard();
    }
    
    updateAdminInfo() {
        const user = AdminState.user;
        if (!user) return;
        
        const name = TG.formatName(user);
        
        const nameEl = document.getElementById('admin-name');
        if (nameEl) nameEl.textContent = name;
        
        const avatarEl = document.getElementById('admin-avatar');
        if (avatarEl) avatarEl.src = TG.avatarUrl(user.id);
        
        const sidebarLogo = document.getElementById('sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.src = AdminState.settings.logo || TG.avatarUrl('MG');
        }
        
        const sidebarName = document.getElementById('sidebar-site-name');
        if (sidebarName) {
            sidebarName.textContent = AdminState.settings.siteName || 'Mafia Gaming Shop';
        }
    }
    
    async loadAllData() {
        console.log('📦 Loading data...');
        AdminUI.showLoading('Loading data...');
        
        try {
            const results = await Promise.all([
                AdminDB.read('users'),
                AdminDB.read('categories'),
                AdminDB.read('products'),
                AdminDB.read('orders'),
                AdminDB.read('topupRequests'),
                AdminDB.read('payments'),
                AdminDB.read('bannersType1'),
                AdminDB.read('bannersType2'),
                AdminDB.read('inputTables'),
                AdminDB.read('bannedUsers'),
                AdminDB.read('settings')
            ]);
            
            AdminState.users = results[0] || [];
            AdminState.categories = results[1] || [];
            AdminState.products = results[2] || [];
            AdminState.orders = results[3] || [];
            AdminState.topupRequests = results[4] || [];
            AdminState.payments = results[5] || [];
            AdminState.bannersType1 = results[6] || [];
            AdminState.bannersType2 = results[7] || [];
            AdminState.inputTables = results[8] || [];
            AdminState.bannedUsers = results[9] || [];
            AdminState.settings = results[10] || AdminDB.defaultData.settings;
            
            this.calculateStats();
            
            console.log('✅ Data loaded');
            
        } catch (error) {
            console.error('Load error:', error);
        }
        
        AdminUI.hideLoading();
    }
    
    async saveData(type) {
        const data = AdminState[type];
        const ok = await AdminDB.write(type, data);
        if (!ok) {
            AdminUI.toast('error', 'Error', 'Failed to save ' + type);
        }
        return ok;
    }
    
    calculateStats() {
        const orders = AdminState.orders || [];
        const topups = AdminState.topupRequests || [];
        
        AdminState.stats.totalUsers = (AdminState.users || []).length;
        AdminState.stats.totalOrders = orders.length;
        AdminState.stats.pendingOrders = orders.filter(function(o) { return o.status === 'pending'; }).length;
        AdminState.stats.approvedOrders = orders.filter(function(o) { return o.status === 'approved'; }).length;
        AdminState.stats.rejectedOrders = orders.filter(function(o) { return o.status === 'rejected'; }).length;
        AdminState.stats.pendingTopups = topups.filter(function(t) { return t.status === 'pending'; }).length;
        
        var revenue = 0;
        orders.forEach(function(o) {
            if (o.status === 'approved') {
                revenue += (o.price || 0);
            }
        });
        AdminState.stats.totalRevenue = revenue;
        
        // Update badges
        var usersCount = document.getElementById('users-count');
        var pendingOrders = document.getElementById('pending-orders');
        var pendingTopups = document.getElementById('pending-topups');
        
        if (usersCount) usersCount.textContent = AdminState.stats.totalUsers;
        if (pendingOrders) pendingOrders.textContent = AdminState.stats.pendingOrders;
        if (pendingTopups) pendingTopups.textContent = AdminState.stats.pendingTopups;
    }
    
    // ============================================
    // Event Listeners
    // ============================================
    
    setupEventListeners() {
        var self = this;
        
        // Menu toggle
        var menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                var sidebar = document.getElementById('admin-sidebar');
                if (sidebar) sidebar.classList.toggle('active');
            });
        }
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var page = link.dataset.page;
                if (page) self.navigateTo(page);
            });
        });
        
        document.querySelectorAll('.view-all').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var page = link.dataset.page;
                if (page) self.navigateTo(page);
            });
        });
        
        // Back to shop
        var backBtn = document.getElementById('back-to-shop');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                window.location.href = '/';
            });
        }
        
        // Quick actions
        document.querySelectorAll('.action-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.handleQuickAction(btn.dataset.action);
            });
        });
        
        // Modal close
        document.querySelectorAll('.modal-close').forEach(function(btn) {
            btn.addEventListener('click', function() {
                AdminUI.closeAllModals();
            });
        });
        
        document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
            overlay.addEventListener('click', function() {
                AdminUI.closeAllModals();
            });
        });
        
        // Forms
        this.setupForms();
        this.setupFileUploads();
        this.setupAddButtons();
        this.setupBannerTabs();
        this.setupOrderActions();
        this.setupTopupActions();
        this.setupUserActions();
    }
    
    setupForms() {
        var self = this;
        
        var categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', function(e) { self.saveCategory(e); });
        }
        
        var productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', function(e) { self.saveProduct(e); });
        }
        
        var paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', function(e) { self.savePayment(e); });
        }
        
        var bannerForm = document.getElementById('banner-form');
        if (bannerForm) {
            bannerForm.addEventListener('submit', function(e) { self.saveBanner(e); });
        }
        
        var inputTableForm = document.getElementById('input-table-form');
        if (inputTableForm) {
            inputTableForm.addEventListener('submit', function(e) { self.saveInputTable(e); });
        }
        
        var announcementForm = document.getElementById('announcement-form');
        if (announcementForm) {
            announcementForm.addEventListener('submit', function(e) { self.saveAnnouncement(e); });
        }
        
        var settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', function(e) { self.saveSettings(e); });
        }
        
        var discountCheckbox = document.getElementById('product-has-discount');
        if (discountCheckbox) {
            discountCheckbox.addEventListener('change', function(e) {
                var fields = document.getElementById('discount-fields');
                if (fields) {
                    if (e.target.checked) {
                        fields.classList.remove('hidden');
                    } else {
                        fields.classList.add('hidden');
                    }
                }
            });
        }
        
        var priceInput = document.getElementById('product-price');
        var discountInput = document.getElementById('product-discount');
        
        if (priceInput) {
            priceInput.addEventListener('input', function() { self.calculateDiscountedPrice(); });
        }
        if (discountInput) {
            discountInput.addEventListener('input', function() { self.calculateDiscountedPrice(); });
        }
    }
    
    setupFileUploads() {
        var uploads = [
            { input: 'category-icon', preview: 'category-icon-preview', img: 'category-icon-img', content: '#category-icon-upload .file-upload-content' },
            { input: 'product-icon', preview: 'product-icon-preview', img: 'product-icon-img', content: '#product-icon-upload .file-upload-content' },
            { input: 'payment-icon', preview: 'payment-icon-preview', img: 'payment-icon-img', content: '#payment-icon-upload .file-upload-content' },
            { input: 'banner-image', preview: 'banner-preview', img: 'banner-preview-img', content: '#banner-file-upload .file-upload-content' },
            { input: 'site-logo', preview: 'logo-preview', img: 'logo-preview-img', content: '#logo-upload .file-upload-content' }
        ];
        
        uploads.forEach(function(cfg) {
            var input = document.getElementById(cfg.input);
            if (input) {
                input.addEventListener('change', async function(e) {
                    var file = e.target.files[0];
                    if (file) {
                        try {
                            var base64 = await fileToBase64(file);
                            var imgEl = document.getElementById(cfg.img);
                            if (imgEl) imgEl.src = base64;
                            
                            var preview = document.getElementById(cfg.preview);
                            if (preview) preview.classList.remove('hidden');
                            
                            var content = document.querySelector(cfg.content);
                            if (content) content.classList.add('hidden');
                        } catch (err) {
                            console.error('File upload error:', err);
                        }
                    }
                });
            }
        });
        
        document.querySelectorAll('.remove-file').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var container = btn.closest('.file-upload');
                if (container) {
                    var input = container.querySelector('input[type="file"]');
                    if (input) input.value = '';
                    
                    var preview = container.querySelector('.file-preview');
                    if (preview) preview.classList.add('hidden');
                    
                    var content = container.querySelector('.file-upload-content');
                    if (content) content.classList.remove('hidden');
                }
            });
        });
    }
    
    setupAddButtons() {
        var self = this;
        
        var addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', function() { self.openCategoryModal(); });
        }
        
        var addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', function() { self.openProductModal(); });
        }
        
        var addPaymentBtn = document.getElementById('add-payment-btn');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', function() { self.openPaymentModal(); });
        }
        
        var addType1Banner = document.getElementById('add-type1-banner');
        if (addType1Banner) {
            addType1Banner.addEventListener('click', function() { self.openBannerModal('type1'); });
        }
        
        var addType2Banner = document.getElementById('add-type2-banner');
        if (addType2Banner) {
            addType2Banner.addEventListener('click', function() { self.openBannerModal('type2'); });
        }
        
        var addInputTableBtn = document.getElementById('add-input-table-btn');
        if (addInputTableBtn) {
            addInputTableBtn.addEventListener('click', function() { self.openInputTableModal(); });
        }
    }
    
    setupBannerTabs() {
        document.querySelectorAll('.banner-tabs .tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.banner-tabs .tab-btn').forEach(function(b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                
                var tab = btn.dataset.tab;
                
                var type1Section = document.getElementById('type1-section');
                var type2Section = document.getElementById('type2-section');
                
                if (type1Section) {
                    if (tab === 'type1') {
                        type1Section.classList.remove('hidden');
                    } else {
                        type1Section.classList.add('hidden');
                    }
                }
                
                if (type2Section) {
                    if (tab === 'type2') {
                        type2Section.classList.remove('hidden');
                    } else {
                        type2Section.classList.add('hidden');
                    }
                }
            });
        });
    }
    
    setupOrderActions() {
        var self = this;
        
        var approveBtn = document.getElementById('approve-order-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', function() { self.approveOrder(); });
        }
        
        var rejectBtn = document.getElementById('reject-order-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function() { self.rejectOrder(); });
        }
        
        var closeBtn = document.getElementById('close-order-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() { AdminUI.closeModal('order-details-modal'); });
        }
    }
    
    setupTopupActions() {
        var self = this;
        
        var approveBtn = document.getElementById('approve-topup-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', function() { self.approveTopup(); });
        }
        
        var rejectBtn = document.getElementById('reject-topup-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function() { self.rejectTopup(); });
        }
        
        var closeBtn = document.getElementById('close-topup-request-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() { AdminUI.closeModal('topup-request-modal'); });
        }
    }
    
    setupUserActions() {
        var self = this;
        
        var addBalanceBtn = document.getElementById('add-balance-btn');
        if (addBalanceBtn) {
            addBalanceBtn.addEventListener('click', function() { self.adjustBalance('add'); });
        }
        
        var deductBalanceBtn = document.getElementById('deduct-balance-btn');
        if (deductBalanceBtn) {
            deductBalanceBtn.addEventListener('click', function() { self.adjustBalance('deduct'); });
        }
        
        var banBtn = document.getElementById('ban-user-btn');
        if (banBtn) {
            banBtn.addEventListener('click', function() { self.banCurrentUser(); });
        }
        
        var closeBtn = document.getElementById('close-user-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() { AdminUI.closeModal('user-details-modal'); });
        }
    }
    
    // ============================================
    // Navigation
    // ============================================
    
    navigateTo(page) {
        var self = this;
        console.log('Navigate to:', page);
        
        document.querySelectorAll('.nav-link').forEach(function(link) {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        document.querySelectorAll('.admin-page').forEach(function(p) {
            if (p.id === 'page-' + page) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        
        var sidebar = document.getElementById('admin-sidebar');
        if (sidebar) sidebar.classList.remove('active');
        
        AdminState.currentPage = page;
        this.loadPageContent(page);
    }
    
    loadPageContent(page) {
        switch (page) {
            case 'dashboard': this.loadDashboard(); break;
            case 'users': this.loadUsers(); break;
            case 'orders': this.loadOrders(); break;
            case 'topup-requests': this.loadTopupRequests(); break;
            case 'banners': this.loadBanners(); break;
            case 'categories': this.loadCategories(); break;
            case 'products': this.loadProducts(); break;
            case 'input-tables': this.loadInputTables(); break;
            case 'payments': this.loadPayments(); break;
            case 'announcements': this.loadAnnouncements(); break;
            case 'banned-users': this.loadBannedUsers(); break;
            case 'settings': this.loadSettingsPage(); break;
        }
    }
    
    handleQuickAction(action) {
        var self = this;
        
        switch (action) {
            case 'add-category':
                this.navigateTo('categories');
                setTimeout(function() { self.openCategoryModal(); }, 100);
                break;
            case 'add-product':
                this.navigateTo('products');
                setTimeout(function() { self.openProductModal(); }, 100);
                break;
            case 'add-banner':
                this.navigateTo('banners');
                break;
            case 'broadcast':
                this.navigateTo('broadcast');
                break;
        }
    }
    
    // ============================================
    // Dashboard
    // ============================================
    
    loadDashboard() {
        var stats = AdminState.stats;
        
        var el1 = document.getElementById('total-users');
        if (el1) el1.textContent = stats.totalUsers;
        
        var el2 = document.getElementById('total-orders');
        if (el2) el2.textContent = stats.totalOrders;
        
        var el3 = document.getElementById('approved-orders');
        if (el3) el3.textContent = stats.approvedOrders;
        
        var el4 = document.getElementById('pending-orders-count');
        if (el4) el4.textContent = stats.pendingOrders;
        
        var el5 = document.getElementById('rejected-orders');
        if (el5) el5.textContent = stats.rejectedOrders;
        
        var el6 = document.getElementById('total-revenue');
        if (el6) el6.textContent = formatCurrency(stats.totalRevenue);
        
        // Recent orders
        var orders = AdminState.orders.slice().sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }).slice(0, 5);
        
        var ordersEl = document.getElementById('recent-orders');
        if (ordersEl) {
            if (orders.length === 0) {
                ordersEl.innerHTML = '<p class="text-muted text-center">No orders</p>';
            } else {
                ordersEl.innerHTML = orders.map(function(o) {
                    return '<div class="recent-item">' +
                        '<div class="recent-item-icon"><i class="fas fa-shopping-cart"></i></div>' +
                        '<div class="recent-item-info">' +
                            '<span class="recent-item-title">' + (o.productName || 'Product') + '</span>' +
                            '<span class="recent-item-subtitle">' + (o.userName || 'User') + ' • ' + formatDate(o.createdAt, 'relative') + '</span>' +
                        '</div>' +
                        '<span class="recent-item-status ' + o.status + '">' + o.status + '</span>' +
                    '</div>';
                }).join('');
            }
        }
        
        // Recent topups
        var topups = AdminState.topupRequests.slice().sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }).slice(0, 5);
        
        var topupsEl = document.getElementById('recent-topups');
        if (topupsEl) {
            if (topups.length === 0) {
                topupsEl.innerHTML = '<p class="text-muted text-center">No topups</p>';
            } else {
                topupsEl.innerHTML = topups.map(function(t) {
                    return '<div class="recent-item">' +
                        '<div class="recent-item-icon"><i class="fas fa-money-bill-wave"></i></div>' +
                        '<div class="recent-item-info">' +
                            '<span class="recent-item-title">' + formatCurrency(t.amount) + '</span>' +
                            '<span class="recent-item-subtitle">' + (t.userName || 'User') + ' • ' + formatDate(t.createdAt, 'relative') + '</span>' +
                        '</div>' +
                        '<span class="recent-item-status ' + t.status + '">' + t.status + '</span>' +
                    '</div>';
                }).join('');
            }
        }
    }
    
    // ============================================
    // Categories
    // ============================================
    
    loadCategories() {
        var self = this;
        var container = document.getElementById('admin-categories');
        if (!container) return;
        
        if (AdminState.categories.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-th-large"></i><p>No categories</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.categories.map(function(cat) {
            var productCount = AdminState.products.filter(function(p) { return p.categoryId === cat.id; }).length;
            
            return '<div class="admin-category-card" data-id="' + cat.id + '">' +
                '<div class="admin-category-icon">' +
                    (cat.icon ? '<img src="' + cat.icon + '">' : '<i class="fas fa-gamepad" style="font-size:32px;color:var(--primary);"></i>') +
                    (cat.flag ? '<span class="flag">' + cat.flag + '</span>' : '') +
                    (cat.hasDiscount ? '<span class="discount-badge">SALE</span>' : '') +
                '</div>' +
                '<div class="admin-category-info">' +
                    '<h4>' + cat.name + '</h4>' +
                    '<span class="stats">' + productCount + ' products</span>' +
                '</div>' +
                '<div class="admin-category-actions">' +
                    '<button class="btn-view" onclick="adminPanel.editCategory(\'' + cat.id + '\')"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn-delete" onclick="adminPanel.deleteCategory(\'' + cat.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    openCategoryModal(categoryId) {
        var form = document.getElementById('category-form');
        if (form) form.reset();
        
        var idField = document.getElementById('category-id');
        if (idField) idField.value = categoryId || '';
        
        var preview = document.getElementById('category-icon-preview');
        if (preview) preview.classList.add('hidden');
        
        var content = document.querySelector('#category-icon-upload .file-upload-content');
        if (content) content.classList.remove('hidden');
        
        var title = document.getElementById('category-modal-title');
        if (title) title.textContent = categoryId ? 'Edit Category' : 'Add Category';
        
        if (categoryId) {
            var cat = AdminState.categories.find(function(c) { return c.id === categoryId; });
            if (cat) {
                var nameField = document.getElementById('category-name');
                if (nameField) nameField.value = cat.name || '';
                
                var flagField = document.getElementById('category-flag');
                if (flagField) flagField.value = cat.flag || '';
                
                var discountField = document.getElementById('category-has-discount');
                if (discountField) discountField.checked = cat.hasDiscount || false;
                
                if (cat.icon) {
                    var imgEl = document.getElementById('category-icon-img');
                    if (imgEl) imgEl.src = cat.icon;
                    if (preview) preview.classList.remove('hidden');
                    if (content) content.classList.add('hidden');
                }
            }
        }
        
        AdminUI.openModal('category-modal');
    }
    
    editCategory(id) {
        this.openCategoryModal(id);
    }
    
    async saveCategory(e) {
        e.preventDefault();
        AdminUI.showLoading('Saving...');
        
        var id = document.getElementById('category-id').value;
        var name = (document.getElementById('category-name').value || '').trim();
        var flag = document.getElementById('category-flag').value || '';
        var hasDiscount = document.getElementById('category-has-discount').checked;
        var iconInput = document.getElementById('category-icon');
        var previewImg = document.getElementById('category-icon-img');
        
        if (!name) {
            AdminUI.hideLoading();
            AdminUI.toast('warning', 'Required', 'Enter category name');
            return;
        }
        
        var icon = (previewImg && previewImg.src && previewImg.src.indexOf('data:') === 0) ? previewImg.src : '';
        
        if (iconInput && iconInput.files && iconInput.files[0]) {
            try {
                icon = await fileToBase64(iconInput.files[0]);
            } catch (err) {
                console.error('File error:', err);
            }
        }
        
        var data = {
            id: id || generateId('cat_'),
            name: name,
            flag: flag,
            hasDiscount: hasDiscount,
            icon: icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            var idx = AdminState.categories.findIndex(function(c) { return c.id === id; });
            if (idx !== -1) {
                AdminState.categories[idx] = Object.assign({}, AdminState.categories[idx], data);
            }
        } else {
            data.createdAt = new Date().toISOString();
            AdminState.categories.push(data);
        }
        
        await this.saveData('categories');
        
        AdminUI.hideLoading();
        AdminUI.closeModal('category-modal');
        AdminUI.toast('success', 'Saved', 'Category saved');
        this.loadCategories();
    }
    
    async deleteCategory(id) {
        var products = AdminState.products.filter(function(p) { return p.categoryId === id; });
        
        if (products.length > 0) {
            AdminUI.toast('warning', 'Cannot Delete', 'Has ' + products.length + ' products');
            return;
        }
        
        if (!confirm('Delete this category?')) return;
        
        AdminUI.showLoading('Deleting...');
        AdminState.categories = AdminState.categories.filter(function(c) { return c.id !== id; });
        await this.saveData('categories');
        AdminUI.hideLoading();
        
        AdminUI.toast('success', 'Deleted', 'Category deleted');
        this.loadCategories();
    }
    
    // ============================================
    // Products
    // ============================================
    
    loadProducts() {
        var self = this;
        var container = document.getElementById('admin-products');
        var filterSelect = document.getElementById('filter-product-category');
        
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Categories</option>' +
                AdminState.categories.map(function(c) {
                    return '<option value="' + c.id + '">' + c.name + '</option>';
                }).join('');
            
            filterSelect.onchange = function() {
                var catId = filterSelect.value;
                document.querySelectorAll('.admin-product-card').forEach(function(card) {
                    if (!catId || card.dataset.categoryId === catId) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            };
        }
        
        if (!container) return;
        
        if (AdminState.products.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-box"></i><p>No products</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.products.map(function(product) {
            var category = AdminState.categories.find(function(c) { return c.id === product.categoryId; });
            var discountedPrice = product.hasDiscount ? product.price - (product.price * product.discount / 100) : product.price;
            
            return '<div class="admin-product-card" data-id="' + product.id + '" data-category-id="' + product.categoryId + '">' +
                '<div class="admin-product-image">' +
                    (product.icon ? '<img src="' + product.icon + '">' : '<i class="fas fa-box" style="font-size:40px;color:var(--primary);"></i>') +
                    (product.hasDiscount ? '<span class="badge" style="background:var(--danger);color:white;position:absolute;top:5px;right:5px;">-' + product.discount + '%</span>' : '') +
                '</div>' +
                '<div class="admin-product-info">' +
                    '<div class="category-tag">' + (category ? category.name : 'Unknown') + '</div>' +
                    '<h4>' + product.name + '</h4>' +
                    '<div class="price-row">' +
                        '<span class="price-current">' + formatCurrency(discountedPrice, product.currency) + '</span>' +
                        (product.hasDiscount ? '<span class="price-original" style="text-decoration:line-through;opacity:0.6;font-size:12px;margin-left:5px;">' + formatCurrency(product.price, product.currency) + '</span>' : '') +
                    '</div>' +
                    '<div style="margin-top:10px;">' +
                        '<button class="btn-view" onclick="adminPanel.editProduct(\'' + product.id + '\')"><i class="fas fa-edit"></i></button>' +
                        '<button class="btn-delete" onclick="adminPanel.deleteProduct(\'' + product.id + '\')"><i class="fas fa-trash"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    openProductModal(productId) {
        var form = document.getElementById('product-form');
        if (form) form.reset();
        
        var idField = document.getElementById('product-id');
        if (idField) idField.value = productId || '';
        
        var preview = document.getElementById('product-icon-preview');
        if (preview) preview.classList.add('hidden');
        
        var discountFields = document.getElementById('discount-fields');
        if (discountFields) discountFields.classList.add('hidden');
        
        var title = document.getElementById('product-modal-title');
        if (title) title.textContent = productId ? 'Edit Product' : 'Add Product';
        
        var categorySelect = document.getElementById('product-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Choose Category</option>' +
                AdminState.categories.map(function(c) {
                    return '<option value="' + c.id + '">' + c.name + '</option>';
                }).join('');
        }
        
        if (productId) {
            var product = AdminState.products.find(function(p) { return p.id === productId; });
            if (product) {
                if (categorySelect) categorySelect.value = product.categoryId || '';
                
                var nameField = document.getElementById('product-name');
                if (nameField) nameField.value = product.name || '';
                
                var priceField = document.getElementById('product-price');
                if (priceField) priceField.value = product.price || '';
                
                var currencyField = document.getElementById('product-currency');
                if (currencyField) currencyField.value = product.currency || 'MMK';
                
                var deliveryField = document.getElementById('product-delivery');
                if (deliveryField) deliveryField.value = product.delivery || 'instant';
                
                var discountCheck = document.getElementById('product-has-discount');
                if (discountCheck) discountCheck.checked = product.hasDiscount || false;
                
                var activeCheck = document.getElementById('product-active');
                if (activeCheck) activeCheck.checked = product.active !== false;
                
                if (product.hasDiscount && discountFields) {
                    discountFields.classList.remove('hidden');
                    var discountField = document.getElementById('product-discount');
                    if (discountField) discountField.value = product.discount || 0;
                    this.calculateDiscountedPrice();
                }
                
                if (product.icon) {
                    var imgEl = document.getElementById('product-icon-img');
                    if (imgEl) imgEl.src = product.icon;
                    if (preview) preview.classList.remove('hidden');
                }
            }
        }
        
        AdminUI.openModal('product-modal');
    }
    
    editProduct(id) {
        this.openProductModal(id);
    }
    
    calculateDiscountedPrice() {
        var priceEl = document.getElementById('product-price');
        var discountEl = document.getElementById('product-discount');
        var resultEl = document.getElementById('product-discounted-price');
        
        var price = parseFloat(priceEl ? priceEl.value : 0) || 0;
        var discount = parseFloat(discountEl ? discountEl.value : 0) || 0;
        var result = Math.round(price - (price * discount / 100));
        
        if (resultEl) resultEl.value = result;
    }
    
    async saveProduct(e) {
        e.preventDefault();
        AdminUI.showLoading('Saving...');
        
        var id = document.getElementById('product-id').value;
        var categoryId = document.getElementById('product-category').value;
        var name = (document.getElementById('product-name').value || '').trim();
        var price = parseFloat(document.getElementById('product-price').value) || 0;
        var currency = document.getElementById('product-currency').value || 'MMK';
        var delivery = document.getElementById('product-delivery').value || 'instant';
        var hasDiscount = document.getElementById('product-has-discount').checked;
        var discount = hasDiscount ? (parseFloat(document.getElementById('product-discount').value) || 0) : 0;
        var active = document.getElementById('product-active').checked;
        var iconInput = document.getElementById('product-icon');
        var previewImg = document.getElementById('product-icon-img');
        
        if (!categoryId || !name || !price) {
            AdminUI.hideLoading();
            AdminUI.toast('warning', 'Required', 'Fill all required fields');
            return;
        }
        
        var icon = (previewImg && previewImg.src && previewImg.src.indexOf('data:') === 0) ? previewImg.src : '';
        
        if (iconInput && iconInput.files && iconInput.files[0]) {
            try {
                icon = await fileToBase64(iconInput.files[0]);
            } catch (err) {
                console.error('File error:', err);
            }
        }
        
        var data = {
            id: id || generateId('prod_'),
            categoryId: categoryId,
            name: name,
            price: price,
            currency: currency,
            delivery: delivery,
            hasDiscount: hasDiscount,
            discount: discount,
            active: active,
            icon: icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            var idx = AdminState.products.findIndex(function(p) { return p.id === id; });
            if (idx !== -1) {
                AdminState.products[idx] = Object.assign({}, AdminState.products[idx], data);
            }
        } else {
            data.createdAt = new Date().toISOString();
            AdminState.products.push(data);
        }
        
        await this.saveData('products');
        
        AdminUI.hideLoading();
        AdminUI.closeModal('product-modal');
        AdminUI.toast('success', 'Saved', 'Product saved');
        this.loadProducts();
    }
    
    async deleteProduct(id) {
        if (!confirm('Delete this product?')) return;
        
        AdminUI.showLoading('Deleting...');
        AdminState.products = AdminState.products.filter(function(p) { return p.id !== id; });
        await this.saveData('products');
        AdminUI.hideLoading();
        
        AdminUI.toast('success', 'Deleted', 'Product deleted');
        this.loadProducts();
    }
    
    // ============================================
    // Users
    // ============================================
    
    loadUsers() {
        var self = this;
        var tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        
        if (AdminState.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users</td></tr>';
            return;
        }
        
        tbody.innerHTML = AdminState.users.map(function(user) {
            return '<tr data-id="' + user.id + '">' +
                '<td>' +
                    '<div class="user-cell">' +
                        '<img src="' + TG.avatarUrl(user.id) + '">' +
                        '<div class="user-info">' +
                            '<span class="name">' + (user.firstName || '') + ' ' + (user.lastName || '') + '</span>' +
                            '<span class="username">@' + (user.username || 'N/A') + '</span>' +
                        '</div>' +
                    '</div>' +
                '</td>' +
                '<td>' + user.id + '</td>' +
                '<td>' + formatCurrency(user.balance || 0) + '</td>' +
                '<td>' + (user.totalOrders || 0) + '</td>' +
                '<td><span class="status-badge ' + (user.isPremium ? 'premium' : 'regular') + '">' + (user.isPremium ? '⭐ Premium' : 'Regular') + '</span></td>' +
                '<td>' + formatDate(user.joinedAt) + '</td>' +
                '<td><button class="btn-view" onclick="adminPanel.viewUser(\'' + user.id + '\')"><i class="fas fa-eye"></i></button></td>' +
            '</tr>';
        }).join('');
    }
    
    viewUser(userId) {
        var user = AdminState.users.find(function(u) { return String(u.id) === String(userId); });
        if (!user) return;
        
        AdminState.selectedUser = user;
        
        var avatarEl = document.getElementById('modal-user-avatar');
        if (avatarEl) avatarEl.src = TG.avatarUrl(user.id);
        
        var nameEl = document.getElementById('modal-user-name');
        if (nameEl) nameEl.textContent = (user.firstName || '') + ' ' + (user.lastName || '');
        
        var usernameEl = document.getElementById('modal-user-username');
        if (usernameEl) usernameEl.textContent = '@' + (user.username || 'N/A');
        
        var premiumEl = document.getElementById('modal-premium-badge');
        if (premiumEl) premiumEl.style.display = user.isPremium ? 'inline-flex' : 'none';
        
        var balanceEl = document.getElementById('modal-balance');
        if (balanceEl) balanceEl.textContent = formatCurrency(user.balance || 0);
        
        var orders = AdminState.orders.filter(function(o) { return String(o.userId) === String(userId); });
        var topups = AdminState.topupRequests.filter(function(t) { return String(t.userId) === String(userId); });
        
        var totalOrdersEl = document.getElementById('modal-total-orders');
        if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
        
        var approvedEl = document.getElementById('modal-approved');
        if (approvedEl) approvedEl.textContent = orders.filter(function(o) { return o.status === 'approved'; }).length;
        
        var rejectedEl = document.getElementById('modal-rejected');
        if (rejectedEl) rejectedEl.textContent = orders.filter(function(o) { return o.status === 'rejected'; }).length;
        
        var topupTotal = 0;
        topups.forEach(function(t) {
            if (t.status === 'approved') topupTotal += (t.amount || 0);
        });
        
        var totalTopupEl = document.getElementById('modal-total-topup');
        if (totalTopupEl) totalTopupEl.textContent = formatCurrency(topupTotal);
        
        var joinedEl = document.getElementById('modal-joined');
        if (joinedEl) joinedEl.textContent = formatDate(user.joinedAt);
        
        AdminUI.openModal('user-details-modal');
    }
    
    async adjustBalance(operation) {
        if (!AdminState.selectedUser) return;
        
        var amountInput = document.getElementById('adjust-balance-amount');
        var amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
        
        if (amount <= 0) {
            AdminUI.toast('warning', 'Invalid', 'Enter valid amount');
            return;
        }
        
        AdminUI.showLoading('Updating...');
        
        var user = AdminState.users.find(function(u) { return u.id === AdminState.selectedUser.id; });
        if (user) {
            if (operation === 'add') {
                user.balance = (user.balance || 0) + amount;
            } else {
                user.balance = Math.max(0, (user.balance || 0) - amount);
            }
            
            await this.saveData('users');
            
            var balanceEl = document.getElementById('modal-balance');
            if (balanceEl) balanceEl.textContent = formatCurrency(user.balance);
            
            if (amountInput) amountInput.value = '';
        }
        
        AdminUI.hideLoading();
        AdminUI.toast('success', 'Updated', 'Balance ' + (operation === 'add' ? 'added' : 'deducted'));
    }
    
    banCurrentUser() {
        if (AdminState.selectedUser) {
            this.banUser(AdminState.selectedUser.id);
            AdminUI.closeModal('user-details-modal');
        }
    }
    
    async banUser(userId) {
        if (!confirm('Ban this user?')) return;
        
        AdminUI.showLoading('Banning...');
        
        var user = AdminState.users.find(function(u) { return String(u.id) === String(userId); });
        if (user) {
            AdminState.bannedUsers.push({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                bannedAt: new Date().toISOString()
            });
            await this.saveData('bannedUsers');
        }
        
        AdminUI.hideLoading();
        AdminUI.toast('success', 'Banned', 'User banned');
        this.loadUsers();
    }
    
    // ============================================
    // Orders
    // ============================================
    
    loadOrders() {
        var self = this;
        var container = document.getElementById('admin-orders-list');
        if (!container) return;
        
        var orders = AdminState.orders.slice().sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No orders</p></div>';
            return;
        }
        
        container.innerHTML = orders.map(function(o) {
            return '<div class="admin-order-card" data-id="' + o.id + '" data-status="' + o.status + '" onclick="adminPanel.viewOrder(\'' + o.id + '\')">' +
                '<div class="admin-order-header">' +
                    '<span class="order-id">' + o.id + '</span>' +
                    '<span class="order-status ' + o.status + '">' + o.status + '</span>' +
                '</div>' +
                '<div class="admin-order-body">' +
                    '<div class="admin-order-user">' +
                        '<img src="' + TG.avatarUrl(o.userId) + '">' +
                        '<div class="info">' +
                            '<span class="name">' + (o.userName || 'User') + '</span>' +
                            '<span class="id">ID: ' + o.userId + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="admin-order-product">' +
                        '<span class="name">' + (o.productName || 'Product') + '</span>' +
                        '<span class="price">' + formatCurrency(o.price, o.currency) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
        
        // Filter buttons
        document.querySelectorAll('#page-orders .filter-btn').forEach(function(btn) {
            btn.onclick = function() {
                document.querySelectorAll('#page-orders .filter-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                
                var filter = btn.dataset.filter;
                document.querySelectorAll('.admin-order-card').forEach(function(card) {
                    if (filter === 'all' || card.dataset.status === filter) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            };
        });
    }
    
    viewOrder(orderId) {
        var order = AdminState.orders.find(function(o) { return o.id === orderId; });
        if (!order) return;
        
        AdminState.selectedOrder = order;
        
        var idEl = document.getElementById('order-id');
        if (idEl) idEl.textContent = order.id;
        
        var statusEl = document.getElementById('order-status');
        if (statusEl) {
            statusEl.textContent = order.status;
            statusEl.className = 'value status ' + order.status;
        }
        
        var dateEl = document.getElementById('order-date');
        if (dateEl) dateEl.textContent = formatDate(order.createdAt, 'datetime');
        
        var avatarEl = document.getElementById('order-user-avatar');
        if (avatarEl) avatarEl.src = TG.avatarUrl(order.userId);
        
        var userNameEl = document.getElementById('order-user-name');
        if (userNameEl) userNameEl.textContent = order.userName || 'User';
        
        var userIdEl = document.getElementById('order-user-id');
        if (userIdEl) userIdEl.textContent = 'ID: ' + order.userId;
        
        var productIconEl = document.getElementById('order-product-icon');
        if (productIconEl) productIconEl.src = order.productIcon || '';
        
        var productNameEl = document.getElementById('order-product-name');
        if (productNameEl) productNameEl.textContent = order.productName || 'Product';
        
        var productAmountEl = document.getElementById('order-product-amount');
        if (productAmountEl) productAmountEl.textContent = order.amount || '';
        
        var productPriceEl = document.getElementById('order-product-price');
        if (productPriceEl) productPriceEl.textContent = formatCurrency(order.price, order.currency);
        
        // Input values
        var inputInfo = document.getElementById('order-input-info');
        var inputValues = document.getElementById('order-input-values');
        
        if (order.inputValues && Object.keys(order.inputValues).length > 0) {
            if (inputInfo) inputInfo.style.display = 'block';
            if (inputValues) {
                inputValues.innerHTML = Object.keys(order.inputValues).map(function(key) {
                    var table = AdminState.inputTables.find(function(t) { return t.id === key; });
                    return '<div class="input-value-item"><span class="label">' + (table ? table.name : key) + ':</span><span class="value">' + order.inputValues[key] + '</span></div>';
                }).join('');
            }
        } else {
            if (inputInfo) inputInfo.style.display = 'none';
        }
        
        var actionsEl = document.getElementById('order-actions');
        if (actionsEl) {
            actionsEl.style.display = order.status === 'pending' ? 'flex' : 'none';
        }
        
        AdminUI.openModal('order-details-modal');
    }
    
    async approveOrder() {
        if (!AdminState.selectedOrder) return;
        
        AdminUI.showLoading('Approving...');
        
        var order = AdminState.orders.find(function(o) { return o.id === AdminState.selectedOrder.id; });
        if (order) {
            order.status = 'approved';
            order.updatedAt = new Date().toISOString();
            
            var user = AdminState.users.find(function(u) { return String(u.id) === String(order.userId); });
            if (user) {
                user.completedOrders = (user.completedOrders || 0) + 1;
                await this.saveData('users');
            }
            
            await this.saveData('orders');
            this.calculateStats();
        }
        
        AdminUI.hideLoading();
        AdminUI.closeModal('order-details-modal');
        AdminUI.toast('success', 'Approved', 'Order approved');
        this.loadOrders();
        this.loadDashboard();
    }
    
    async rejectOrder() {
        if (!AdminState.selectedOrder) return;
        if (!confirm('Reject and refund?')) return;
        
        AdminUI.showLoading('Rejecting...');
        
        var order = AdminState.orders.find(function(o) { return o.id === AdminState.selectedOrder.id; });
        if (order) {
            order.status = 'rejected';
            order.updatedAt = new Date().toISOString();
            
            var user = AdminState.users.find(function(u) { return String(u.id) === String(order.userId); });
            if (user) {
                user.balance = (user.balance || 0) + (order.price || 0);
                user.rejectedOrders = (user.rejectedOrders || 0) + 1;
                await this.saveData('users');
            }
            
            await this.saveData('orders');
            this.calculateStats();
        }
        
        AdminUI.hideLoading();
        AdminUI.closeModal('order-details-modal');
        AdminUI.toast('success', 'Rejected', 'Order rejected, refunded');
        this.loadOrders();
        this.loadDashboard();
    }
    
    // ============================================
    // Topup Requests
    // ============================================
    
    loadTopupRequests() {
        var self = this;
        var container = document.getElementById('topup-requests-list');
        if (!container) return;
        
        var topups = AdminState.topupRequests.slice().sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        if (topups.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No topup requests</p></div>';
            return;
        }
        
        container.innerHTML = topups.map(function(t) {
            return '<div class="topup-request-card" data-id="' + t.id + '" data-status="' + t.status + '" onclick="adminPanel.viewTopup(\'' + t.id + '\')">' +
                '<div class="topup-request-header">' +
                    '<span class="order-id">' + t.id + '</span>' +
                    '<span class="order-status ' + t.status + '">' + t.status + '</span>' +
                '</div>' +
                '<div class="topup-request-body">' +
                    '<div class="topup-user-info">' +
                        '<img src="' + TG.avatarUrl(t.userId) + '">' +
                        '<div class="info">' +
                            '<span class="name">' + (t.userName || 'User') + '</span>' +
                            '<span class="id">ID: ' + t.userId + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="text-align:right;">' +
                        '<div style="font-size:18px;font-weight:700;color:var(--success);">' + formatCurrency(t.amount) + '</div>' +
                        '<div style="font-size:12px;color:var(--text-tertiary);">' + formatDate(t.createdAt, 'relative') + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
        
        // Filter buttons
        document.querySelectorAll('.topup-filter .filter-btn').forEach(function(btn) {
            btn.onclick = function() {
                document.querySelectorAll('.topup-filter .filter-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                
                var filter = btn.dataset.filter;
                document.querySelectorAll('.topup-request-card').forEach(function(card) {
                    if (filter === 'all' || card.dataset.status === filter) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            };
        });
    }
    
    viewTopup(topupId) {
        var topup = AdminState.topupRequests.find(function(t) { return t.id === topupId; });
        if (!topup) return;
        
        AdminState.selectedTopup = topup;
        
        var avatarEl = document.getElementById('topup-user-avatar');
        if (avatarEl) avatarEl.src = TG.avatarUrl(topup.userId);
        
        var nameEl = document.getElementById('topup-user-name');
        if (nameEl) nameEl.textContent = topup.userName || 'User';
        
        var userIdEl = document.getElementById('topup-user-id');
        if (userIdEl) userIdEl.textContent = 'ID: ' + topup.userId;
        
        var amountEl = document.getElementById('topup-amount-value');
        if (amountEl) amountEl.textContent = formatCurrency(topup.amount);
        
        var methodEl = document.getElementById('topup-payment-method');
        if (methodEl) methodEl.textContent = topup.paymentMethod || '-';
        
        var dateEl = document.getElementById('topup-date');
        if (dateEl) dateEl.textContent = formatDate(topup.createdAt, 'datetime');
        
        var statusEl = document.getElementById('topup-status');
        if (statusEl) {
            statusEl.textContent = topup.status;
            statusEl.className = 'value status ' + topup.status;
        }
        
        var screenshotEl = document.getElementById('topup-screenshot');
        if (screenshotEl) screenshotEl.src = topup.screenshot || '';
        
        var actionsEl = document.getElementById('topup-actions');
        if (actionsEl) {
            actionsEl.style.display = topup.status === 'pending' ? 'flex' : 'none';
        }
        
        AdminUI.openModal('topup-request-modal');
    }
    
    async approveTopup() {
        if (!AdminState.selectedTopup) return;
        
        AdminUI.showLoading('Approving...');
        
        var topup = AdminState.topupRequests.find(function(t) { return t.id === AdminState.selectedTopup.id; });
        if (topup) {
            topup.status = 'approved';
            topup.updatedAt = new Date().toISOString();
            
            var user = AdminState.users.find(function(u) { return String(u.id) === String(topup.userId); });
            if (user) {
                user.balance = (user.balance || 0) + (topup.amount || 0);
                user.totalTopup = (user.totalTopup || 0) + (topup.amount || 0);
                await this.saveData('users');
            }
            
            await this.saveData('topupRequests');
            this.calculateStats();
        }
        
        AdminUI.hideLoading();
        AdminUI.closeModal('topup-request-modal');
        AdminUI.toast('success', 'Approved', 'Topup approved, balance added');
        this.loadTopupRequests();
        this.loadDashboard();
    }
    
    async rejectTopup() {
        if (!AdminState.selectedTopup) return;
        if (!confirm('Reject this topup?')) return;
        
        AdminUI.showLoading('Rejecting...');
        
        var topup = AdminState.topupRequests.find(function(t) { return t.id === AdminState.selectedTopup.id; });
        if (topup) {
            topup.status = 'rejected';
            topup.updatedAt = new Date().toISOString();
            await this.saveData('topupRequests');
            this.calculateStats();
        }
        
        AdminUI.hideLoading();
        AdminUI.closeModal('topup-request-modal');
        AdminUI.toast('success', 'Rejected', 'Topup rejected');
        this.loadTopupRequests();
        this.loadDashboard();
    }
    
    // ============================================
    // Payments, Banners, Input Tables, etc.
    // ============================================
    
    loadPayments() {
        var self = this;
        var container = document.getElementById('admin-payments');
        if (!container) return;
        
        if (AdminState.payments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>No payments</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.payments.map(function(p) {
            return '<div class="payment-card">' +
                '<div class="payment-card-icon">' +
                    (p.icon ? '<img src="' + p.icon + '">' : '<i class="fas fa-credit-card" style="font-size:32px;color:var(--primary);"></i>') +
                '</div>' +
                '<div class="payment-card-info">' +
                    '<h4>' + p.name + '</h4>' +
                    '<div>' + p.address + '</div>' +
                    '<div>' + p.holder + '</div>' +
                '</div>' +
                '<span class="payment-card-status ' + (p.active ? 'active' : 'inactive') + '">' + (p.active ? 'Active' : 'Inactive') + '</span>' +
                '<div class="payment-card-actions">' +
                    '<button class="btn-view" onclick="adminPanel.editPayment(\'' + p.id + '\')"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn-delete" onclick="adminPanel.deletePayment(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    openPaymentModal(paymentId) {
        var form = document.getElementById('payment-form');
        if (form) form.reset();
        
        var idField = document.getElementById('payment-id');
        if (idField) idField.value = paymentId || '';
        
        var preview = document.getElementById('payment-icon-preview');
        if (preview) preview.classList.add('hidden');
        
        var content = document.querySelector('#payment-icon-upload .file-upload-content');
        if (content) content.classList.remove('hidden');
        
        var title = document.getElementById('payment-modal-title');
        if (title) title.textContent = paymentId ? 'Edit Payment' : 'Add Payment';
        
        if (paymentId) {
            var p = AdminState.payments.find(function(x) { return x.id === paymentId; });
            if (p) {
                var nameField = document.getElementById('payment-name');
                if (nameField) nameField.value = p.name || '';
                
                var addressField = document.getElementById('payment-address');
                if (addressField) addressField.value = p.address || '';
                
                var holderField = document.getElementById('payment-holder');
                if (holderField) holderField.value = p.holder || '';
                
                var noteField = document.getElementById('payment-note');
                if (noteField) noteField.value = p.note || '';
                
                var activeField = document.getElementById('payment-active');
                if (activeField) activeField.checked = p.active !== false;
                
                if (p.icon) {
                    var imgEl = document.getElementById('payment-icon-img');
                    if (imgEl) imgEl.src = p.icon;
                    if (preview) preview.classList.remove('hidden');
                    if (content) content.classList.add('hidden');
                }
            }
        }
        
        AdminUI.openModal('payment-modal');
    }
    
    editPayment(id) { this.openPaymentModal(id); }
    
    async savePayment(e) {
        e.preventDefault();
        AdminUI.showLoading('Saving...');
        
        var id = document.getElementById('payment-id').value;
        var name = (document.getElementById('payment-name').value || '').trim();
        var address = (document.getElementById('payment-address').value || '').trim();
        var holder = (document.getElementById('payment-holder').value || '').trim();
        var note = (document.getElementById('payment-note').value || '').trim();
        var active = document.getElementById('payment-active').checked;
        var iconInput = document.getElementById('payment-icon');
        var previewImg = document.getElementById('payment-icon-img');
        
        if (!name || !address || !holder) {
            AdminUI.hideLoading();
            AdminUI.toast('warning', 'Required', 'Fill all fields');
            return;
        }
        
        var icon = (previewImg && previewImg.src && previewImg.src.indexOf('data:') === 0) ? previewImg.src : '';
        
        if (iconInput && iconInput.files && iconInput.files[0]) {
            try {
                icon = await fileToBase64(iconInput.files[0]);
            } catch (err) {
                console.error('File error:', err);
            }
        }
        
        var data = {
            id: id || generateId('pay_'),
            name: name,
            address: address,
            holder: holder,
            note: note,
            active: active,
            icon: icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            var idx = AdminState.payments.findIndex(function(p) { return p.id === id; });
            if (idx !== -1) {
                AdminState.payments[idx] = Object.assign({}, AdminState.payments[idx], data);
            }
        } else {
            data.createdAt = new Date().toISOString();
            AdminState.payments.push(data);
        }
        
        await this.saveData('payments');
        
        AdminUI.hideLoading();
        AdminUI.closeModal('payment-modal');
        AdminUI.toast('success', 'Saved', 'Payment saved');
        this.loadPayments();
    }
    
    async deletePayment(id) {
        if (!confirm('Delete?')) return;
        
        AdminUI.showLoading('Deleting...');
        AdminState.payments = AdminState.payments.filter(function(p) { return p.id !== id; });
        await this.saveData('payments');
        AdminUI.hideLoading();
        
        AdminUI.toast('success', 'Deleted', 'Payment deleted');
        this.loadPayments();
    }
    
    loadBanners() {
        var self = this;
        
        var type1 = document.getElementById('type1-banners');
        if (type1) {
            if (AdminState.bannersType1.length === 0) {
                type1.innerHTML = '<p class="text-muted">No banners</p>';
            } else {
                type1.innerHTML = AdminState.bannersType1.map(function(b) {
                    return '<div class="banner-card"><img src="' + b.image + '"><div class="banner-card-actions"><button onclick="adminPanel.deleteBanner(\'' + b.id + '\', \'type1\')"><i class="fas fa-trash"></i></button></div></div>';
                }).join('');
            }
        }
        
        var type2 = document.getElementById('type2-banners');
        if (type2) {
            if (AdminState.bannersType2.length === 0) {
                type2.innerHTML = '<p class="text-muted">No banners</p>';
            } else {
                type2.innerHTML = AdminState.bannersType2.map(function(b) {
                    var cat = AdminState.categories.find(function(c) { return c.id === b.categoryId; });
                    return '<div class="banner-list-item"><img src="' + b.image + '" style="width:100px;height:60px;object-fit:cover;border-radius:8px;"><span>' + (cat ? cat.name : 'Unknown') + '</span><button onclick="adminPanel.deleteBanner(\'' + b.id + '\', \'type2\')"><i class="fas fa-trash"></i></button></div>';
                }).join('');
            }
        }
    }
    
    openBannerModal(type) {
        var form = document.getElementById('banner-form');
        if (form) form.reset();
        
        var idField = document.getElementById('banner-id');
        if (idField) idField.value = '';
        
        var typeField = document.getElementById('banner-type');
        if (typeField) typeField.value = type;
        
        var preview = document.getElementById('banner-preview');
        if (preview) preview.classList.add('hidden');
        
        var content = document.querySelector('#banner-file-upload .file-upload-content');
        if (content) content.classList.remove('hidden');
        
        var catGroup = document.getElementById('banner-category-group');
        var instrGroup = document.getElementById('banner-instructions-group');
        
        if (catGroup) catGroup.style.display = type === 'type2' ? 'block' : 'none';
        if (instrGroup) instrGroup.style.display = type === 'type2' ? 'block' : 'none';
        
        if (type === 'type2') {
            var catSelect = document.getElementById('banner-category');
            if (catSelect) {
                catSelect.innerHTML = '<option value="">Select Category</option>' +
                    AdminState.categories.map(function(c) {
                        return '<option value="' + c.id + '">' + c.name + '</option>';
                    }).join('');
            }
        }
        
        AdminUI.openModal('add-banner-modal');
    }
    
    async saveBanner(e) {
        e.preventDefault();
        AdminUI.showLoading('Saving...');
        
        var type = document.getElementById('banner-type').value;
        var imageInput = document.getElementById('banner-image');
        var previewImg = document.getElementById('banner-preview-img');
        
        var image = (previewImg && previewImg.src && previewImg.src.indexOf('data:') === 0) ? previewImg.src : '';
        
        if (imageInput && imageInput.files && imageInput.files[0]) {
            try {
                image = await fileToBase64(imageInput.files[0]);
            } catch (err) {
                console.error('File error:', err);
            }
        }
        
        if (!image) {
            AdminUI.hideLoading();
            AdminUI.toast('warning', 'Required', 'Upload image');
            return;
        }
        
        var data = {
            id: generateId('banner_'),
            image: image,
            createdAt: new Date().toISOString()
        };
        
        if (type === 'type2') {
            data.categoryId = document.getElementById('banner-category').value;
            data.instructions = document.getElementById('banner-instructions').value;
        }
        
        if (type === 'type1') {
            AdminState.bannersType1.push(data);
            await this.saveData('bannersType1');
        } else {
            AdminState.bannersType2.push(data);
            await this.saveData('bannersType2');
        }
        
        AdminUI.hideLoading();
        AdminUI.closeModal('add-banner-modal');
        AdminUI.toast('success', 'Saved', 'Banner saved');
        this.loadBanners();
    }
    
    async deleteBanner(id, type) {
        if (!confirm('Delete?')) return;
        
        AdminUI.showLoading('Deleting...');
        
        if (type === 'type1') {
            AdminState.bannersType1 = AdminState.bannersType1.filter(function(b) { return b.id !== id; });
            await this.saveData('bannersType1');
        } else {
            AdminState.bannersType2 = AdminState.bannersType2.filter(function(b) { return b.id !== id; });
            await this.saveData('bannersType2');
        }
        
        AdminUI.hideLoading();
        AdminUI.toast('success', 'Deleted', 'Banner deleted');
        this.loadBanners();
    }
    
    loadInputTables() {
        var self = this;
        var container = document.getElementById('admin-input-tables');
        if (!container) return;
        
        if (AdminState.inputTables.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-keyboard"></i><p>No input tables</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.inputTables.map(function(t) {
            var cat = AdminState.categories.find(function(c) { return c.id === t.categoryId; });
            return '<div class="input-table-card"><div class="input-table-info"><h4>' + t.name + '</h4><span>' + (cat ? cat.name : 'Unknown') + ' • ' + (t.required ? 'Required' : 'Optional') + '</span></div><button onclick="adminPanel.deleteInputTable(\'' + t.id + '\')"><i class="fas fa-trash"></i></button></div>';
        }).join('');
    }
    
    openInputTableModal() {
        var form = document.getElementById('input-table-form');
        if (form) form.reset();
        
        var idField = document.getElementById('input-table-id');
        if (idField) idField.value = '';
        
        var catSelect = document.getElementById('input-table-category');
        if (catSelect) {
            catSelect.innerHTML = '<option value="">Choose Category</option>' +
                AdminState.categories.map(function(c) {
                    return '<option value="' + c.id + '">' + c.name + '</option>';
                }).join('');
        }
        
        AdminUI.openModal('input-table-modal');
    }
    
    async saveInputTable(e) {
        e.preventDefault();
        AdminUI.showLoading('Saving...');
        
        var categoryId = document.getElementById('input-table-category').value;
        var name = (document.getElementById('input-table-name').value || '').trim();
        var placeholder = (document.getElementById('input-table-placeholder').value || '').trim();
        var required = document.getElementById('input-table-required').checked;
        
        if (!categoryId || !name) {
            AdminUI.hideLoading();
            AdminUI.toast('warning', 'Required', 'Fill all fields');
            return;
        }
        
        AdminState.inputTables.push({
            id: generateId('input_'),
            categoryId: categoryId,
            name: name,
            placeholder: placeholder,
            required: required,
            createdAt: new Date().toISOString()
        });
        
        await this.saveData('inputTables');
        
        AdminUI.hideLoading();
        AdminUI.closeModal('input-table-modal');
        AdminUI.toast('success', 'Saved', 'Input table saved');
        this.loadInputTables();
    }
    
    async deleteInputTable(id) {
        if (!confirm('Delete?')) return;
        
        AdminUI.showLoading('Deleting...');
        AdminState.inputTables = AdminState.inputTables.filter(function(t) { return t.id !== id; });
        await this.saveData('inputTables');
        AdminUI.hideLoading();
        
        AdminUI.toast('success', 'Deleted', 'Input table deleted');
        this.loadInputTables();
    }
    
    loadAnnouncements() {
        var textField = document.getElementById('announcement-text');
        if (textField) textField.value = AdminState.settings.announcement || '';
        
        var preview = document.getElementById('announcement-preview');
        if (preview) preview.innerHTML = '<p>' + (AdminState.settings.announcement || 'No announcement') + '</p>';
    }
    
    async saveAnnouncement(e) {
        e.preventDefault();
        AdminUI.showLoading('Saving...');
        
        AdminState.settings.announcement = (document.getElementById('announcement-text').value || '').trim();
        await this.saveData('settings');
        
        var preview = document.getElementById('announcement-preview');
        if (preview) preview.innerHTML = '<p>' + (AdminState.settings.announcement || 'No announcement') + '</p>';
        
        AdminUI.hideLoading();
        AdminUI.toast('success', 'Saved', 'Announcement updated');
    }
    
    loadBannedUsers() {
        var self = this;
        var container = document.getElementById('banned-users-list');
        if (!container) return;
        
        if (AdminState.bannedUsers.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-user-check"></i><p>No banned users</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.bannedUsers.map(function(u) {
            return '<div class="banned-user-card"><span>' + (u.firstName || '') + ' ' + (u.lastName || '') + ' (@' + (u.username || 'N/A') + ')</span><button onclick="adminPanel.unbanUser(\'' + u.id + '\')"><i class="fas fa-user-check"></i> Unban</button></div>';
        }).join('');
    }
    
    async unbanUser(userId) {
        if (!confirm('Unban?')) return;
        
        AdminUI.showLoading('Unbanning...');
        AdminState.bannedUsers = AdminState.bannedUsers.filter(function(u) { return String(u.id) !== String(userId); });
        await this.saveData('bannedUsers');
        AdminUI.hideLoading();
        
        AdminUI.toast('success', 'Unbanned', 'User unbanned');
        this.loadBannedUsers();
    }
    
    loadSettingsPage() {
        var nameField = document.getElementById('site-name');
        if (nameField) nameField.value = AdminState.settings.siteName || 'Mafia Gaming Shop';
        
        if (AdminState.settings.logo) {
            var previewImg = document.getElementById('logo-preview-img');
            if (previewImg) previewImg.src = AdminState.settings.logo;
            
            var preview = document.getElementById('logo-preview');
            if (preview) preview.classList.remove('hidden');
        }
    }
    
    async saveSettings(e) {
        e.preventDefault();
        AdminUI.showLoading('Saving...');
        
        var siteName = (document.getElementById('site-name').value || '').trim();
        var theme = 'dark';
        var themeInput = document.querySelector('input[name="theme"]:checked');
        if (themeInput) theme = themeInput.value;
        
        var logoInput = document.getElementById('site-logo');
        var previewImg = document.getElementById('logo-preview-img');
        
        var logo = AdminState.settings.logo || '';
        
        if (logoInput && logoInput.files && logoInput.files[0]) {
            try {
                logo = await fileToBase64(logoInput.files[0]);
            } catch (err) {
                console.error('File error:', err);
            }
        } else if (previewImg && previewImg.src && previewImg.src.indexOf('data:') === 0) {
            logo = previewImg.src;
        }
        
        AdminState.settings.siteName = siteName;
        AdminState.settings.theme = theme;
        AdminState.settings.logo = logo;
        
        await this.saveData('settings');
        
        this.updateAdminInfo();
        AdminUI.hideLoading();
        AdminUI.toast('success', 'Saved', 'Settings saved');
    }
}

// ============================================
// Initialize
// ============================================

var adminPanel = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Admin Panel DOM ready');
    
    adminPanel = new AdminPanel();
    adminPanel.init();
    
    window.adminPanel = adminPanel;
    window.AdminState = AdminState;
    window.AdminDB = AdminDB;
});

console.log('🔧 Admin.js v3.2.0 loaded');
