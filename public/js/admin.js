/* ============================================
   MAFIA GAMING SHOP - ADMIN PANEL
   Version: 3.1.0 (Fixed - Auto Create Bins)
   ============================================ */

// ============================================
// Configuration
// ============================================

const ADMIN_CONFIG = {
    ADMIN_ID: 1538232799,
    ADMIN_ID_STR: '1538232799',
    BOT_TOKEN: '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM',
    BOT_USERNAME: 'mafia_gamingshopbot',
    
    JSONBIN: {
        BASE_URL: 'https://api.jsonbin.io/v3',
        MASTER_KEY: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
        ACCESS_KEY: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS',
        
        // ⚠️ Admin Panel ဖွင့်ပြီး bins create လုပ်ပြီးရင်
        // Console မှာပြတဲ့ IDs တွေကို ဒီမှာ ထည့်ပါ
        // ထည့်ပြီးရင် app.js မှာလည်း တူတူထည့်ပါ
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
// Database Service with Auto-Create
// ============================================

const AdminDB = {
    binIds: {},
    initialized: false,
    
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
            announcement: 'Welcome to Mafia Gaming Shop! 🎮',
            minTopup: 1000,
            maxTopup: 1000000
        }
    },
    
    async init() {
        console.log('🗄️ Initializing Admin Database...');
        
        // Check hardcoded BIN_IDS first
        if (ADMIN_CONFIG.JSONBIN.BIN_IDS.master) {
            this.binIds = { ...ADMIN_CONFIG.JSONBIN.BIN_IDS };
            console.log('✅ Using hardcoded BIN IDs');
            this.initialized = true;
            this.printBinIds();
            return true;
        }
        
        // Check localStorage
        const saved = localStorage.getItem('mafia_jsonbin_ids');
        if (saved) {
            try {
                this.binIds = JSON.parse(saved);
                
                // Verify bins still exist
                const verified = await this.verifyBins();
                if (verified) {
                    console.log('✅ Loaded existing BIN IDs from localStorage');
                    this.initialized = true;
                    this.printBinIds();
                    return true;
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
        }
        
        // Create new bins
        console.log('📦 Creating new database bins...');
        const created = await this.createAllBins();
        
        if (created) {
            this.initialized = true;
            this.printBinIds();
            return true;
        }
        
        return false;
    },
    
    async verifyBins() {
        if (!this.binIds.master) return false;
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.JSONBIN.BASE_URL}/b/${this.binIds.master}/latest`, {
                headers: { 'X-Master-Key': ADMIN_CONFIG.JSONBIN.MASTER_KEY }
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },
    
    async createAllBins() {
        const binTypes = [
            'users', 'categories', 'products', 'orders', 
            'topupRequests', 'payments', 'bannersType1', 
            'bannersType2', 'inputTables', 'bannedUsers', 
            'broadcasts', 'settings'
        ];
        
        const createdBins = {};
        
        for (let i = 0; i < binTypes.length; i++) {
            const type = binTypes[i];
            const progress = Math.round(((i + 1) / binTypes.length) * 100);
            
            showAdminLoading(`Creating ${type}... ${progress}%`);
            
            try {
                const binId = await this.createBin(type, this.defaultData[type]);
                createdBins[type] = binId;
                console.log(`✅ Created: ${type} = ${binId}`);
            } catch (error) {
                console.error(`❌ Failed: ${type}`, error);
                showAdminToast('error', 'Error', `Failed to create ${type}`);
                return false;
            }
            
            // Delay to avoid rate limiting
            await this.delay(500);
        }
        
        // Create master bin
        showAdminLoading('Finalizing database...');
        
        try {
            const masterBinId = await this.createBin('master', {
                binIds: createdBins,
                createdAt: new Date().toISOString(),
                version: '3.1.0'
            });
            
            this.binIds = { master: masterBinId, ...createdBins };
            this.saveBinIds();
            
            showAdminToast('success', 'Database Created!', 'All bins created successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to create master bin:', error);
            return false;
        }
    },
    
    async createBin(name, data) {
        const response = await fetch(`${ADMIN_CONFIG.JSONBIN.BASE_URL}/b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': ADMIN_CONFIG.JSONBIN.MASTER_KEY,
                'X-Bin-Name': `mafia-shop-${name}`,
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        const result = await response.json();
        return result.metadata.id;
    },
    
    async read(binType) {
        const binId = this.binIds[binType];
        
        if (!binId) {
            console.warn(`Bin not found: ${binType}`);
            return this.defaultData[binType] || null;
        }
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.JSONBIN.BASE_URL}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': ADMIN_CONFIG.JSONBIN.MASTER_KEY }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.record;
            
        } catch (error) {
            console.error(`Read error (${binType}):`, error);
            return this.defaultData[binType] || null;
        }
    },
    
    async write(binType, data) {
        const binId = this.binIds[binType];
        
        if (!binId) {
            console.error(`Bin not found: ${binType}`);
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
            
            return response.ok;
            
        } catch (error) {
            console.error(`Write error (${binType}):`, error);
            return false;
        }
    },
    
    saveBinIds() {
        localStorage.setItem('mafia_jsonbin_ids', JSON.stringify(this.binIds));
    },
    
    printBinIds() {
        console.log('\n========================================');
        console.log('📋 JSONBIN IDs - COPY THESE TO YOUR CODE');
        console.log('========================================');
        console.log('Paste these into admin.js AND app.js:');
        console.log('----------------------------------------');
        console.log('BIN_IDS: {');
        Object.entries(this.binIds).forEach(([key, value]) => {
            console.log(`    ${key}: '${value}',`);
        });
        console.log('}');
        console.log('========================================\n');
        
        // Also show in alert for easy copying
        const idsText = Object.entries(this.binIds)
            .map(([key, value]) => `${key}: '${value}'`)
            .join(',\n    ');
        
        console.log('📌 Full BIN_IDS object:\n', JSON.stringify(this.binIds, null, 2));
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    getBinIds() {
        return { ...this.binIds };
    }
};

// ============================================
// Admin State
// ============================================

const AdminState = {
    user: null,
    isAdmin: false,
    initialized: false,
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
    broadcasts: [],
    settings: {
        siteName: 'Mafia Gaming Shop',
        logo: '',
        announcement: 'Welcome!'
    },
    
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

const AdminTG = {
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
        return String(userId) === ADMIN_CONFIG.ADMIN_ID_STR;
    },
    
    haptic(type = 'impact', style = 'light') {
        try {
            if (type === 'impact') this.webapp?.HapticFeedback?.impactOccurred(style);
            else if (type === 'notification') this.webapp?.HapticFeedback?.notificationOccurred(style);
            else this.webapp?.HapticFeedback?.selectionChanged();
        } catch (e) {}
    },
    
    formatName(user) {
        if (!user) return 'Admin';
        return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Admin';
    },
    
    avatarUrl(userId) {
        return `https://ui-avatars.com/api/?name=${userId}&background=8B5CF6&color=fff&size=128`;
    }
};

// ============================================
// UI Helpers (Avoid conflicts with utils.js)
// ============================================

function showAdminToast(type, title, message) {
    if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show(type, title, message);
        return;
    }
    
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    toast.querySelector('.toast-close').onclick = () => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    };
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showAdminLoading(text = 'Loading...') {
    if (typeof Loading !== 'undefined' && Loading.show) {
        Loading.show(text);
        return;
    }
    
    let overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const textEl = overlay.querySelector('#loading-text');
        if (textEl) textEl.textContent = text;
        overlay.classList.remove('hidden');
    }
}

function hideAdminLoading() {
    if (typeof Loading !== 'undefined' && Loading.hide) {
        Loading.hide();
        return;
    }
    
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function openAdminModal(id) {
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

function closeAdminModal(id) {
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

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
}

// ============================================
// Format Helpers
// ============================================

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
    
    if (type === 'datetime') {
        return d.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
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
// Admin Panel Class
// ============================================

class AdminPanel {
    constructor() {
        console.log('🔧 AdminPanel created');
    }

    async init() {
        console.log('🚀 Initializing Admin Panel...');
        
        try {
            // Initialize Telegram
            if (!AdminTG.init()) {
                this.showAccessDenied('Please open from Telegram Bot');
                return;
            }
            
            // Get user
            const user = AdminTG.getUser();
            if (!user) {
                this.showAccessDenied('Could not get user data');
                return;
            }
            
            AdminState.user = user;
            console.log('👤 User:', user.first_name, '| ID:', user.id);
            
            // Check admin
            if (!AdminTG.isAdmin(user.id)) {
                this.showAccessDenied(`Access Denied. Your ID (${user.id}) is not authorized.`);
                return;
            }
            
            AdminState.isAdmin = true;
            console.log('✅ Admin verified!');
            
            // Initialize database
            showAdminLoading('Connecting to database...');
            const dbReady = await AdminDB.init();
            
            if (!dbReady) {
                hideAdminLoading();
                showAdminToast('error', 'Database Error', 'Failed to initialize database');
                return;
            }
            
            // Load data
            await this.loadAllData();
            
            // Show panel
            await this.showAdminPanel();
            
            hideAdminLoading();
            AdminState.initialized = true;
            
            console.log('✅ Admin Panel ready!');
            showAdminToast('success', 'Welcome!', `Hello, ${user.first_name}!`);
            
        } catch (error) {
            console.error('❌ Init error:', error);
            hideAdminLoading();
            this.showAccessDenied('Initialization failed: ' + error.message);
        }
    }

    showAccessDenied(message) {
        hideAdminLoading();
        
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        document.getElementById('admin-panel')?.classList.add('hidden');
        
        const denied = document.getElementById('admin-access-denied');
        if (denied) {
            denied.classList.remove('hidden');
            const msg = denied.querySelector('p');
            if (msg) msg.textContent = message;
        }
    }

    async showAdminPanel() {
        document.getElementById('admin-access-denied')?.classList.add('hidden');
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        
        const panel = document.getElementById('admin-panel');
        if (panel) panel.classList.remove('hidden');
        
        this.updateAdminInfo();
        this.setupEventListeners();
        this.loadDashboard();
    }

    updateAdminInfo() {
        const user = AdminState.user;
        if (!user) return;
        
        const name = AdminTG.formatName(user);
        
        const nameEl = document.getElementById('admin-name');
        if (nameEl) nameEl.textContent = name;
        
        const avatarEl = document.getElementById('admin-avatar');
        if (avatarEl) avatarEl.src = AdminTG.avatarUrl(user.id);
        
        const sidebarLogo = document.getElementById('sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.src = AdminState.settings.logo || AdminTG.avatarUrl('MG');
        }
        
        const sidebarName = document.getElementById('sidebar-site-name');
        if (sidebarName) sidebarName.textContent = AdminState.settings.siteName;
    }

    async loadAllData() {
        console.log('📦 Loading all data...');
        showAdminLoading('Loading data...');
        
        try {
            const [
                users, categories, products, orders, topupRequests,
                payments, bannersType1, bannersType2, inputTables,
                bannedUsers, broadcasts, settings
            ] = await Promise.all([
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
                AdminDB.read('broadcasts'),
                AdminDB.read('settings')
            ]);
            
            AdminState.users = users || [];
            AdminState.categories = categories || [];
            AdminState.products = products || [];
            AdminState.orders = orders || [];
            AdminState.topupRequests = topupRequests || [];
            AdminState.payments = payments || [];
            AdminState.bannersType1 = bannersType1 || [];
            AdminState.bannersType2 = bannersType2 || [];
            AdminState.inputTables = inputTables || [];
            AdminState.bannedUsers = bannedUsers || [];
            AdminState.broadcasts = broadcasts || [];
            AdminState.settings = settings || AdminDB.defaultData.settings;
            
            this.calculateStats();
            
            console.log('✅ Data loaded:', {
                users: AdminState.users.length,
                categories: AdminState.categories.length,
                products: AdminState.products.length,
                orders: AdminState.orders.length
            });
            
        } catch (error) {
            console.error('Load error:', error);
        }
        
        hideAdminLoading();
    }

    async saveData(dataType) {
        console.log(`💾 Saving ${dataType}...`);
        const success = await AdminDB.write(dataType, AdminState[dataType]);
        
        if (!success) {
            showAdminToast('error', 'Save Error', `Failed to save ${dataType}`);
        }
        
        return success;
    }

    calculateStats() {
        const orders = AdminState.orders;
        const topups = AdminState.topupRequests;
        
        AdminState.stats = {
            totalUsers: AdminState.users.length,
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            approvedOrders: orders.filter(o => o.status === 'approved').length,
            rejectedOrders: orders.filter(o => o.status === 'rejected').length,
            totalRevenue: orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.price || 0), 0),
            pendingTopups: topups.filter(t => t.status === 'pending').length
        };
        
        // Update badges
        const usersCount = document.getElementById('users-count');
        const pendingOrders = document.getElementById('pending-orders');
        const pendingTopups = document.getElementById('pending-topups');
        
        if (usersCount) usersCount.textContent = AdminState.stats.totalUsers;
        if (pendingOrders) pendingOrders.textContent = AdminState.stats.pendingOrders;
        if (pendingTopups) pendingTopups.textContent = AdminState.stats.pendingTopups;
    }

    // ============================================
    // Event Listeners
    // ============================================

    setupEventListeners() {
        // Menu toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('admin-sidebar')?.classList.toggle('active');
        });
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) this.navigateTo(page);
            });
        });
        
        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) this.navigateTo(page);
            });
        });
        
        // Back to shop
        document.getElementById('back-to-shop')?.addEventListener('click', () => {
            window.location.href = '/';
        });
        
        // Quick actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleQuickAction(btn.dataset.action);
            });
        });
        
        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => closeAllModals());
        });
        
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => closeAllModals());
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
        document.getElementById('category-form')?.addEventListener('submit', (e) => this.saveCategory(e));
        document.getElementById('product-form')?.addEventListener('submit', (e) => this.saveProduct(e));
        document.getElementById('payment-form')?.addEventListener('submit', (e) => this.savePayment(e));
        document.getElementById('banner-form')?.addEventListener('submit', (e) => this.saveBanner(e));
        document.getElementById('input-table-form')?.addEventListener('submit', (e) => this.saveInputTable(e));
        document.getElementById('announcement-form')?.addEventListener('submit', (e) => this.saveAnnouncement(e));
        document.getElementById('broadcast-form')?.addEventListener('submit', (e) => this.sendBroadcast(e));
        document.getElementById('settings-form')?.addEventListener('submit', (e) => this.saveSettings(e));
        
        document.getElementById('product-has-discount')?.addEventListener('change', (e) => {
            document.getElementById('discount-fields')?.classList.toggle('hidden', !e.target.checked);
        });
        
        ['product-price', 'product-discount'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.calculateDiscountedPrice());
        });
    }

    setupFileUploads() {
        const uploads = [
            { input: 'category-icon', preview: 'category-icon-preview', img: 'category-icon-img', content: '#category-icon-upload .file-upload-content' },
            { input: 'product-icon', preview: 'product-icon-preview', img: 'product-icon-img', content: '#product-icon-upload .file-upload-content' },
            { input: 'payment-icon', preview: 'payment-icon-preview', img: 'payment-icon-img', content: '#payment-icon-upload .file-upload-content' },
            { input: 'banner-image', preview: 'banner-preview', img: 'banner-preview-img', content: '#banner-file-upload .file-upload-content' },
            { input: 'site-logo', preview: 'logo-preview', img: 'logo-preview-img', content: '#logo-upload .file-upload-content' }
        ];
        
        uploads.forEach(({ input, preview, img, content }) => {
            document.getElementById(input)?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const base64 = await fileToBase64(file);
                    const imgEl = document.getElementById(img);
                    if (imgEl) imgEl.src = base64;
                    document.getElementById(preview)?.classList.remove('hidden');
                    document.querySelector(content)?.classList.add('hidden');
                }
            });
        });
        
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = btn.closest('.file-upload');
                if (container) {
                    const input = container.querySelector('input[type="file"]');
                    if (input) input.value = '';
                    container.querySelector('.file-preview')?.classList.add('hidden');
                    container.querySelector('.file-upload-content')?.classList.remove('hidden');
                }
            });
        });
    }

    setupAddButtons() {
        document.getElementById('add-category-btn')?.addEventListener('click', () => this.openCategoryModal());
        document.getElementById('add-product-btn')?.addEventListener('click', () => this.openProductModal());
        document.getElementById('add-payment-btn')?.addEventListener('click', () => this.openPaymentModal());
        document.getElementById('add-type1-banner')?.addEventListener('click', () => this.openBannerModal('type1'));
        document.getElementById('add-type2-banner')?.addEventListener('click', () => this.openBannerModal('type2'));
        document.getElementById('add-input-table-btn')?.addEventListener('click', () => this.openInputTableModal());
    }

    setupBannerTabs() {
        document.querySelectorAll('.banner-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.banner-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tab = btn.dataset.tab;
                document.getElementById('type1-section')?.classList.toggle('hidden', tab !== 'type1');
                document.getElementById('type2-section')?.classList.toggle('hidden', tab !== 'type2');
            });
        });
    }

    setupOrderActions() {
        document.getElementById('approve-order-btn')?.addEventListener('click', () => this.approveOrder());
        document.getElementById('reject-order-btn')?.addEventListener('click', () => this.rejectOrder());
        document.getElementById('close-order-modal')?.addEventListener('click', () => closeAdminModal('order-details-modal'));
    }

    setupTopupActions() {
        document.getElementById('approve-topup-btn')?.addEventListener('click', () => this.approveTopup());
        document.getElementById('reject-topup-btn')?.addEventListener('click', () => this.rejectTopup());
        document.getElementById('close-topup-request-modal')?.addEventListener('click', () => closeAdminModal('topup-request-modal'));
    }

    setupUserActions() {
        document.getElementById('add-balance-btn')?.addEventListener('click', () => this.adjustBalance('add'));
        document.getElementById('deduct-balance-btn')?.addEventListener('click', () => this.adjustBalance('deduct'));
        document.getElementById('ban-user-btn')?.addEventListener('click', () => this.banCurrentUser());
        document.getElementById('close-user-modal')?.addEventListener('click', () => closeAdminModal('user-details-modal'));
    }

    // ============================================
    // Navigation
    // ============================================

    navigateTo(page) {
        console.log('📍 Navigate to:', page);
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        document.querySelectorAll('.admin-page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });
        
        document.getElementById('admin-sidebar')?.classList.remove('active');
        AdminState.currentPage = page;
        
        this.loadPageContent(page);
    }

    loadPageContent(page) {
        const loaders = {
            'dashboard': () => this.loadDashboard(),
            'users': () => this.loadUsers(),
            'orders': () => this.loadOrders(),
            'topup-requests': () => this.loadTopupRequests(),
            'banners': () => this.loadBanners(),
            'categories': () => this.loadCategories(),
            'products': () => this.loadProducts(),
            'input-tables': () => this.loadInputTables(),
            'payments': () => this.loadPayments(),
            'announcements': () => this.loadAnnouncements(),
            'broadcast': () => this.loadBroadcast(),
            'banned-users': () => this.loadBannedUsers(),
            'settings': () => this.loadSettingsPage()
        };
        
        if (loaders[page]) loaders[page]();
    }

    handleQuickAction(action) {
        const actions = {
            'add-category': () => { this.navigateTo('categories'); setTimeout(() => this.openCategoryModal(), 100); },
            'add-product': () => { this.navigateTo('products'); setTimeout(() => this.openProductModal(), 100); },
            'add-banner': () => this.navigateTo('banners'),
            'broadcast': () => this.navigateTo('broadcast')
        };
        
        if (actions[action]) actions[action]();
    }

    // ============================================
    // Dashboard
    // ============================================

    loadDashboard() {
        document.getElementById('total-users').textContent = AdminState.stats.totalUsers;
        document.getElementById('total-orders').textContent = AdminState.stats.totalOrders;
        document.getElementById('approved-orders').textContent = AdminState.stats.approvedOrders;
        document.getElementById('pending-orders-count').textContent = AdminState.stats.pendingOrders;
        document.getElementById('rejected-orders').textContent = AdminState.stats.rejectedOrders;
        document.getElementById('total-revenue').textContent = formatCurrency(AdminState.stats.totalRevenue);
        
        // Recent orders
        const recentOrders = [...AdminState.orders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const ordersEl = document.getElementById('recent-orders');
        if (ordersEl) {
            ordersEl.innerHTML = recentOrders.length ? recentOrders.map(o => `
                <div class="recent-item">
                    <div class="recent-item-icon"><i class="fas fa-shopping-cart"></i></div>
                    <div class="recent-item-info">
                        <span class="recent-item-title">${o.productName || 'Product'}</span>
                        <span class="recent-item-subtitle">${o.userName || 'User'} • ${formatDate(o.createdAt, 'relative')}</span>
                    </div>
                    <span class="recent-item-status ${o.status}">${o.status}</span>
                </div>
            `).join('') : '<p class="text-muted text-center">No recent orders</p>';
        }
        
        // Recent topups
        const recentTopups = [...AdminState.topupRequests]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const topupsEl = document.getElementById('recent-topups');
        if (topupsEl) {
            topupsEl.innerHTML = recentTopups.length ? recentTopups.map(t => `
                <div class="recent-item">
                    <div class="recent-item-icon"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="recent-item-info">
                        <span class="recent-item-title">${formatCurrency(t.amount)}</span>
                        <span class="recent-item-subtitle">${t.userName || 'User'} • ${formatDate(t.createdAt, 'relative')}</span>
                    </div>
                    <span class="recent-item-status ${t.status}">${t.status}</span>
                </div>
            `).join('') : '<p class="text-muted text-center">No recent topups</p>';
        }
    }

    // ============================================
    // Categories
    // ============================================

    loadCategories() {
        const container = document.getElementById('admin-categories');
        if (!container) return;
        
        if (AdminState.categories.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-th-large"></i><p>No categories. Click "Add Category" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.categories.map(cat => {
            const productCount = AdminState.products.filter(p => p.categoryId === cat.id).length;
            return `
                <div class="admin-category-card" data-id="${cat.id}">
                    <div class="admin-category-icon">
                        ${cat.icon ? `<img src="${cat.icon}" alt="${cat.name}">` : '<i class="fas fa-gamepad" style="font-size:32px;color:var(--primary);"></i>'}
                        ${cat.flag ? `<span class="flag">${cat.flag}</span>` : ''}
                        ${cat.hasDiscount ? '<span class="discount-badge">SALE</span>' : ''}
                    </div>
                    <div class="admin-category-info">
                        <h4>${cat.name}</h4>
                        <span class="stats">${productCount} products</span>
                    </div>
                    <div class="admin-category-actions">
                        <button class="btn-view" onclick="adminPanel.editCategory('${cat.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="adminPanel.deleteCategory('${cat.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openCategoryModal(categoryId = null) {
        const form = document.getElementById('category-form');
        form?.reset();
        document.getElementById('category-id').value = categoryId || '';
        document.getElementById('category-icon-preview')?.classList.add('hidden');
        document.querySelector('#category-icon-upload .file-upload-content')?.classList.remove('hidden');
        document.getElementById('category-modal-title').textContent = categoryId ? 'Edit Category' : 'Add Category';
        
        if (categoryId) {
            const cat = AdminState.categories.find(c => c.id === categoryId);
            if (cat) {
                document.getElementById('category-name').value = cat.name || '';
                document.getElementById('category-flag').value = cat.flag || '';
                document.getElementById('category-has-discount').checked = cat.hasDiscount || false;
                if (cat.icon) {
                    document.getElementById('category-icon-img').src = cat.icon;
                    document.getElementById('category-icon-preview')?.classList.remove('hidden');
                    document.querySelector('#category-icon-upload .file-upload-content')?.classList.add('hidden');
                }
            }
        }
        
        openAdminModal('category-modal');
    }

    editCategory(id) { this.openCategoryModal(id); }

    async saveCategory(e) {
        e.preventDefault();
        showAdminLoading('Saving...');
        
        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value.trim();
        const flag = document.getElementById('category-flag').value;
        const hasDiscount = document.getElementById('category-has-discount').checked;
        const iconInput = document.getElementById('category-icon');
        const previewImg = document.getElementById('category-icon-img');
        
        if (!name) {
            hideAdminLoading();
            showAdminToast('warning', 'Required', 'Enter category name');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            icon = await fileToBase64(iconInput.files[0]);
        }
        
        const data = {
            id: id || 'cat_' + Date.now(),
            name, flag, hasDiscount, icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            const idx = AdminState.categories.findIndex(c => c.id === id);
            if (idx !== -1) AdminState.categories[idx] = { ...AdminState.categories[idx], ...data };
        } else {
            data.createdAt = new Date().toISOString();
            AdminState.categories.push(data);
        }
        
        await this.saveData('categories');
        
        hideAdminLoading();
        closeAdminModal('category-modal');
        showAdminToast('success', 'Saved', 'Category saved');
        this.loadCategories();
    }

    async deleteCategory(id) {
        const products = AdminState.products.filter(p => p.categoryId === id);
        if (products.length > 0) {
            showAdminToast('warning', 'Cannot Delete', `Has ${products.length} products`);
            return;
        }
        
        if (!confirm('Delete this category?')) return;
        
        showAdminLoading('Deleting...');
        AdminState.categories = AdminState.categories.filter(c => c.id !== id);
        await this.saveData('categories');
        hideAdminLoading();
        
        showAdminToast('success', 'Deleted', 'Category deleted');
        this.loadCategories();
    }

    // ============================================
    // Products
    // ============================================

    loadProducts() {
        const container = document.getElementById('admin-products');
        const filterSelect = document.getElementById('filter-product-category');
        
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Categories</option>' +
                AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            
            filterSelect.onchange = () => {
                const catId = filterSelect.value;
                document.querySelectorAll('.admin-product-card').forEach(card => {
                    card.style.display = (!catId || card.dataset.categoryId === catId) ? '' : 'none';
                });
            };
        }
        
        if (!container) return;
        
        if (AdminState.products.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-box"></i><p>No products. Click "Add Product" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.products.map(product => {
            const category = AdminState.categories.find(c => c.id === product.categoryId);
            const discountedPrice = product.hasDiscount ? product.price - (product.price * product.discount / 100) : product.price;
            
            return `
                <div class="admin-product-card" data-id="${product.id}" data-category-id="${product.categoryId}">
                    <div class="admin-product-image">
                        ${product.icon ? `<img src="${product.icon}">` : '<i class="fas fa-box" style="font-size:40px;color:var(--primary);"></i>'}
                        ${product.hasDiscount ? `<span class="badge" style="background:var(--danger);color:white;position:absolute;top:5px;right:5px;">-${product.discount}%</span>` : ''}
                    </div>
                    <div class="admin-product-info">
                        <div class="category-tag">${category?.name || 'Unknown'}</div>
                        <h4>${product.name}</h4>
                        <div class="price-row">
                            <span class="price-current">${formatCurrency(discountedPrice, product.currency)}</span>
                            ${product.hasDiscount ? `<span class="price-original" style="text-decoration:line-through;opacity:0.6;font-size:12px;margin-left:5px;">${formatCurrency(product.price, product.currency)}</span>` : ''}
                        </div>
                        <div style="margin-top:10px;">
                            <button class="btn-view" onclick="adminPanel.editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="adminPanel.deleteProduct('${product.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    openProductModal(productId = null) {
        const form = document.getElementById('product-form');
        form?.reset();
        document.getElementById('product-id').value = productId || '';
        document.getElementById('product-icon-preview')?.classList.add('hidden');
        document.getElementById('discount-fields')?.classList.add('hidden');
        document.getElementById('product-modal-title').textContent = productId ? 'Edit Product' : 'Add Product';
        
        const categorySelect = document.getElementById('product-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Choose Category</option>' +
                AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        if (productId) {
            const product = AdminState.products.find(p => p.id === productId);
            if (product) {
                document.getElementById('product-category').value = product.categoryId || '';
                document.getElementById('product-name').value = product.name || '';
                document.getElementById('product-price').value = product.price || '';
                document.getElementById('product-currency').value = product.currency || 'MMK';
                document.getElementById('product-delivery').value = product.delivery || 'instant';
                document.getElementById('product-has-discount').checked = product.hasDiscount || false;
                document.getElementById('product-active').checked = product.active !== false;
                
                if (product.hasDiscount) {
                    document.getElementById('discount-fields')?.classList.remove('hidden');
                    document.getElementById('product-discount').value = product.discount || 0;
                    this.calculateDiscountedPrice();
                }
                
                if (product.icon) {
                    document.getElementById('product-icon-img').src = product.icon;
                    document.getElementById('product-icon-preview')?.classList.remove('hidden');
                }
            }
        }
        
        openAdminModal('product-modal');
    }

    editProduct(id) { this.openProductModal(id); }

    calculateDiscountedPrice() {
        const price = parseFloat(document.getElementById('product-price')?.value) || 0;
        const discount = parseFloat(document.getElementById('product-discount')?.value) || 0;
        const el = document.getElementById('product-discounted-price');
        if (el) el.value = Math.round(price - (price * discount / 100));
    }

    async saveProduct(e) {
        e.preventDefault();
        showAdminLoading('Saving...');
        
        const id = document.getElementById('product-id').value;
        const categoryId = document.getElementById('product-category').value;
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value) || 0;
        const currency = document.getElementById('product-currency').value;
        const delivery = document.getElementById('product-delivery').value;
        const hasDiscount = document.getElementById('product-has-discount').checked;
        const discount = hasDiscount ? (parseFloat(document.getElementById('product-discount').value) || 0) : 0;
        const active = document.getElementById('product-active').checked;
        const iconInput = document.getElementById('product-icon');
        const previewImg = document.getElementById('product-icon-img');
        
        if (!categoryId || !name || !price) {
            hideAdminLoading();
            showAdminToast('warning', 'Required', 'Fill all required fields');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            icon = await fileToBase64(iconInput.files[0]);
        }
        
        const data = {
            id: id || 'prod_' + Date.now(),
            categoryId, name, price, currency, delivery, hasDiscount, discount, active, icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            const idx = AdminState.products.findIndex(p => p.id === id);
            if (idx !== -1) AdminState.products[idx] = { ...AdminState.products[idx], ...data };
        } else {
            data.createdAt = new Date().toISOString();
            AdminState.products.push(data);
        }
        
        await this.saveData('products');
        
        hideAdminLoading();
        closeAdminModal('product-modal');
        showAdminToast('success', 'Saved', 'Product saved');
        this.loadProducts();
    }

    async deleteProduct(id) {
        if (!confirm('Delete this product?')) return;
        
        showAdminLoading('Deleting...');
        AdminState.products = AdminState.products.filter(p => p.id !== id);
        await this.saveData('products');
        hideAdminLoading();
        
        showAdminToast('success', 'Deleted', 'Product deleted');
        this.loadProducts();
    }

    // ============================================
    // Payments
    // ============================================

    loadPayments() {
        const container = document.getElementById('admin-payments');
        if (!container) return;
        
        if (AdminState.payments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>No payment methods</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.payments.map(p => `
            <div class="payment-card" data-id="${p.id}">
                <div class="payment-card-icon">
                    ${p.icon ? `<img src="${p.icon}">` : '<i class="fas fa-credit-card" style="font-size:32px;color:var(--primary);"></i>'}
                </div>
                <div class="payment-card-info">
                    <h4>${p.name}</h4>
                    <div>${p.address}</div>
                    <div>${p.holder}</div>
                </div>
                <span class="payment-card-status ${p.active ? 'active' : 'inactive'}">${p.active ? 'Active' : 'Inactive'}</span>
                <div class="payment-card-actions">
                    <button class="btn-view" onclick="adminPanel.editPayment('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="adminPanel.deletePayment('${p.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    openPaymentModal(paymentId = null) {
        const form = document.getElementById('payment-form');
        form?.reset();
        document.getElementById('payment-id').value = paymentId || '';
        document.getElementById('payment-icon-preview')?.classList.add('hidden');
        document.querySelector('#payment-icon-upload .file-upload-content')?.classList.remove('hidden');
        document.getElementById('payment-modal-title').textContent = paymentId ? 'Edit Payment' : 'Add Payment';
        
        if (paymentId) {
            const p = AdminState.payments.find(x => x.id === paymentId);
            if (p) {
                document.getElementById('payment-name').value = p.name || '';
                document.getElementById('payment-address').value = p.address || '';
                document.getElementById('payment-holder').value = p.holder || '';
                document.getElementById('payment-note').value = p.note || '';
                document.getElementById('payment-active').checked = p.active !== false;
                if (p.icon) {
                    document.getElementById('payment-icon-img').src = p.icon;
                    document.getElementById('payment-icon-preview')?.classList.remove('hidden');
                    document.querySelector('#payment-icon-upload .file-upload-content')?.classList.add('hidden');
                }
            }
        }
        
        openAdminModal('payment-modal');
    }

    editPayment(id) { this.openPaymentModal(id); }

    async savePayment(e) {
        e.preventDefault();
        showAdminLoading('Saving...');
        
        const id = document.getElementById('payment-id').value;
        const name = document.getElementById('payment-name').value.trim();
        const address = document.getElementById('payment-address').value.trim();
        const holder = document.getElementById('payment-holder').value.trim();
        const note = document.getElementById('payment-note').value.trim();
        const active = document.getElementById('payment-active').checked;
        const iconInput = document.getElementById('payment-icon');
        const previewImg = document.getElementById('payment-icon-img');
        
        if (!name || !address || !holder) {
            hideAdminLoading();
            showAdminToast('warning', 'Required', 'Fill all required fields');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            icon = await fileToBase64(iconInput.files[0]);
        }
        
        const data = {
            id: id || 'pay_' + Date.now(),
            name, address, holder, note, active, icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            const idx = AdminState.payments.findIndex(p => p.id === id);
            if (idx !== -1) AdminState.payments[idx] = { ...AdminState.payments[idx], ...data };
        } else {
            data.createdAt = new Date().toISOString();
            AdminState.payments.push(data);
        }
        
        await this.saveData('payments');
        
        hideAdminLoading();
        closeAdminModal('payment-modal');
        showAdminToast('success', 'Saved', 'Payment saved');
        this.loadPayments();
    }

    async deletePayment(id) {
        if (!confirm('Delete this payment method?')) return;
        
        showAdminLoading('Deleting...');
        AdminState.payments = AdminState.payments.filter(p => p.id !== id);
        await this.saveData('payments');
        hideAdminLoading();
        
        showAdminToast('success', 'Deleted', 'Payment deleted');
        this.loadPayments();
    }

    // ============================================
    // Orders
    // ============================================

    loadOrders() {
        const container = document.getElementById('admin-orders-list');
        if (!container) return;
        
        const orders = [...AdminState.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No orders</p></div>';
            return;
        }
        
        container.innerHTML = orders.map(o => `
            <div class="admin-order-card" data-id="${o.id}" data-status="${o.status}" onclick="adminPanel.viewOrder('${o.id}')">
                <div class="admin-order-header">
                    <span class="order-id">${o.id}</span>
                    <span class="order-status ${o.status}">${o.status}</span>
                </div>
                <div class="admin-order-body">
                    <div class="admin-order-user">
                        <img src="${AdminTG.avatarUrl(o.userId)}" alt="">
                        <div class="info">
                            <span class="name">${o.userName || 'User'}</span>
                            <span class="id">ID: ${o.userId}</span>
                        </div>
                    </div>
                    <div class="admin-order-product">
                        <span class="name">${o.productName}</span>
                        <span class="price">${formatCurrency(o.price, o.currency)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Filter buttons
        document.querySelectorAll('#page-orders .filter-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#page-orders .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('.admin-order-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
                });
            };
        });
    }

    viewOrder(orderId) {
        const order = AdminState.orders.find(o => o.id === orderId);
        if (!order) return;
        
        AdminState.selectedOrder = order;
        
        document.getElementById('order-id').textContent = order.id;
        document.getElementById('order-status').textContent = order.status;
        document.getElementById('order-status').className = `value status ${order.status}`;
        document.getElementById('order-date').textContent = formatDate(order.createdAt, 'datetime');
        document.getElementById('order-user-avatar').src = AdminTG.avatarUrl(order.userId);
        document.getElementById('order-user-name').textContent = order.userName || 'User';
        document.getElementById('order-user-id').textContent = `ID: ${order.userId}`;
        document.getElementById('order-product-icon').src = order.productIcon || '';
        document.getElementById('order-product-name').textContent = order.productName;
        document.getElementById('order-product-amount').textContent = order.amount || '';
        document.getElementById('order-product-price').textContent = formatCurrency(order.price, order.currency);
        
        // Input values
        const inputInfo = document.getElementById('order-input-info');
        const inputValues = document.getElementById('order-input-values');
        
        if (order.inputValues && Object.keys(order.inputValues).length > 0) {
            inputInfo.style.display = 'block';
            inputValues.innerHTML = Object.entries(order.inputValues).map(([key, value]) => {
                const table = AdminState.inputTables.find(t => t.id === key);
                return `<div class="input-value-item"><span class="label">${table?.name || key}:</span><span class="value">${value}</span></div>`;
            }).join('');
        } else {
            inputInfo.style.display = 'none';
        }
        
        document.getElementById('order-actions').style.display = order.status === 'pending' ? 'flex' : 'none';
        
        openAdminModal('order-details-modal');
    }

    async approveOrder() {
        if (!AdminState.selectedOrder) return;
        
        showAdminLoading('Approving...');
        
        const order = AdminState.orders.find(o => o.id === AdminState.selectedOrder.id);
        if (order) {
            order.status = 'approved';
            order.updatedAt = new Date().toISOString();
            
            // Update user stats
            const user = AdminState.users.find(u => String(u.id) === String(order.userId));
            if (user) {
                user.completedOrders = (user.completedOrders || 0) + 1;
                await this.saveData('users');
            }
            
            await this.saveData('orders');
            this.calculateStats();
        }
        
        hideAdminLoading();
        closeAdminModal('order-details-modal');
        showAdminToast('success', 'Approved', 'Order approved');
        this.loadOrders();
        this.loadDashboard();
    }

    async rejectOrder() {
        if (!AdminState.selectedOrder) return;
        if (!confirm('Reject and refund?')) return;
        
        showAdminLoading('Rejecting...');
        
        const order = AdminState.orders.find(o => o.id === AdminState.selectedOrder.id);
        if (order) {
            order.status = 'rejected';
            order.updatedAt = new Date().toISOString();
            
            // Refund
            const user = AdminState.users.find(u => String(u.id) === String(order.userId));
            if (user) {
                user.balance = (user.balance || 0) + (order.price || 0);
                user.rejectedOrders = (user.rejectedOrders || 0) + 1;
                await this.saveData('users');
            }
            
            await this.saveData('orders');
            this.calculateStats();
        }
        
        hideAdminLoading();
        closeAdminModal('order-details-modal');
        showAdminToast('success', 'Rejected', 'Order rejected, refunded');
        this.loadOrders();
        this.loadDashboard();
    }

    // ============================================
    // Topup Requests
    // ============================================

    loadTopupRequests() {
        const container = document.getElementById('topup-requests-list');
        if (!container) return;
        
        const topups = [...AdminState.topupRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (topups.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No topup requests</p></div>';
            return;
        }
        
        container.innerHTML = topups.map(t => `
            <div class="topup-request-card" data-id="${t.id}" data-status="${t.status}" onclick="adminPanel.viewTopup('${t.id}')">
                <div class="topup-request-header">
                    <span class="order-id">${t.id}</span>
                    <span class="order-status ${t.status}">${t.status}</span>
                </div>
                <div class="topup-request-body">
                    <div class="topup-user-info">
                        <img src="${AdminTG.avatarUrl(t.userId)}" alt="">
                        <div class="info">
                            <span class="name">${t.userName || 'User'}</span>
                            <span class="id">ID: ${t.userId}</span>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px;font-weight:700;color:var(--success);">${formatCurrency(t.amount)}</div>
                        <div style="font-size:12px;color:var(--text-tertiary);">${formatDate(t.createdAt, 'relative')}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Filter buttons
        document.querySelectorAll('.topup-filter .filter-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.topup-filter .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('.topup-request-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
                });
            };
        });
    }

    viewTopup(topupId) {
        const topup = AdminState.topupRequests.find(t => t.id === topupId);
        if (!topup) return;
        
        AdminState.selectedTopup = topup;
        
        document.getElementById('topup-user-avatar').src = AdminTG.avatarUrl(topup.userId);
        document.getElementById('topup-user-name').textContent = topup.userName || 'User';
        document.getElementById('topup-user-id').textContent = `ID: ${topup.userId}`;
        document.getElementById('topup-amount-value').textContent = formatCurrency(topup.amount);
        document.getElementById('topup-payment-method').textContent = topup.paymentMethod || '-';
        document.getElementById('topup-date').textContent = formatDate(topup.createdAt, 'datetime');
        document.getElementById('topup-status').textContent = topup.status;
        document.getElementById('topup-status').className = `value status ${topup.status}`;
        document.getElementById('topup-screenshot').src = topup.screenshot || '';
        
        document.getElementById('topup-actions').style.display = topup.status === 'pending' ? 'flex' : 'none';
        
        openAdminModal('topup-request-modal');
    }

    async approveTopup() {
        if (!AdminState.selectedTopup) return;
        
        showAdminLoading('Approving...');
        
        const topup = AdminState.topupRequests.find(t => t.id === AdminState.selectedTopup.id);
        if (topup) {
            topup.status = 'approved';
            topup.updatedAt = new Date().toISOString();
            
            // Add balance
            const user = AdminState.users.find(u => String(u.id) === String(topup.userId));
            if (user) {
                user.balance = (user.balance || 0) + (topup.amount || 0);
                user.totalTopup = (user.totalTopup || 0) + (topup.amount || 0);
                await this.saveData('users');
            }
            
            await this.saveData('topupRequests');
            this.calculateStats();
        }
        
        hideAdminLoading();
        closeAdminModal('topup-request-modal');
        showAdminToast('success', 'Approved', 'Topup approved, balance added');
        this.loadTopupRequests();
        this.loadDashboard();
    }

    async rejectTopup() {
        if (!AdminState.selectedTopup) return;
        if (!confirm('Reject this topup?')) return;
        
        showAdminLoading('Rejecting...');
        
        const topup = AdminState.topupRequests.find(t => t.id === AdminState.selectedTopup.id);
        if (topup) {
            topup.status = 'rejected';
            topup.updatedAt = new Date().toISOString();
            await this.saveData('topupRequests');
            this.calculateStats();
        }
        
        hideAdminLoading();
        closeAdminModal('topup-request-modal');
        showAdminToast('success', 'Rejected', 'Topup rejected');
        this.loadTopupRequests();
        this.loadDashboard();
    }

    // ============================================
    // Users
    // ============================================

    loadUsers() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        
        if (AdminState.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users</td></tr>';
            return;
        }
        
        tbody.innerHTML = AdminState.users.map(user => `
            <tr data-id="${user.id}">
                <td>
                    <div class="user-cell">
                        <img src="${AdminTG.avatarUrl(user.id)}" alt="">
                        <div class="user-info">
                            <span class="name">${user.firstName || ''} ${user.lastName || ''}</span>
                            <span class="username">@${user.username || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td>${user.id}</td>
                <td>${formatCurrency(user.balance || 0)}</td>
                <td>${user.totalOrders || 0}</td>
                <td><span class="status-badge ${user.isPremium ? 'premium' : 'regular'}">${user.isPremium ? '⭐ Premium' : 'Regular'}</span></td>
                <td>${formatDate(user.joinedAt)}</td>
                <td>
                    <button class="btn-view" onclick="adminPanel.viewUser('${user.id}')"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');
    }

    viewUser(userId) {
        const user = AdminState.users.find(u => String(u.id) === String(userId));
        if (!user) return;
        
        AdminState.selectedUser = user;
        
        document.getElementById('modal-user-avatar').src = AdminTG.avatarUrl(user.id);
        document.getElementById('modal-user-name').textContent = `${user.firstName || ''} ${user.lastName || ''}`;
        document.getElementById('modal-user-username').textContent = `@${user.username || 'N/A'}`;
        document.getElementById('modal-premium-badge').style.display = user.isPremium ? 'inline-flex' : 'none';
        document.getElementById('modal-balance').textContent = formatCurrency(user.balance || 0);
        
        const orders = AdminState.orders.filter(o => String(o.userId) === String(userId));
        const topups = AdminState.topupRequests.filter(t => String(t.userId) === String(userId));
        
        document.getElementById('modal-total-orders').textContent = orders.length;
        document.getElementById('modal-approved').textContent = orders.filter(o => o.status === 'approved').length;
        document.getElementById('modal-rejected').textContent = orders.filter(o => o.status === 'rejected').length;
        document.getElementById('modal-total-topup').textContent = formatCurrency(topups.filter(t => t.status === 'approved').reduce((s, t) => s + (t.amount || 0), 0));
        document.getElementById('modal-joined').textContent = formatDate(user.joinedAt);
        
        openAdminModal('user-details-modal');
    }

    async adjustBalance(operation) {
        if (!AdminState.selectedUser) return;
        
        const amount = parseFloat(document.getElementById('adjust-balance-amount')?.value || 0);
        if (!amount || amount <= 0) {
            showAdminToast('warning', 'Invalid', 'Enter valid amount');
            return;
        }
        
        showAdminLoading('Updating...');
        
        const user = AdminState.users.find(u => u.id === AdminState.selectedUser.id);
        if (user) {
            if (operation === 'add') {
                user.balance = (user.balance || 0) + amount;
            } else {
                user.balance = Math.max(0, (user.balance || 0) - amount);
            }
            
            await this.saveData('users');
            document.getElementById('modal-balance').textContent = formatCurrency(user.balance);
            document.getElementById('adjust-balance-amount').value = '';
        }
        
        hideAdminLoading();
        showAdminToast('success', 'Updated', `Balance ${operation === 'add' ? 'added' : 'deducted'}`);
    }

    banCurrentUser() {
        if (AdminState.selectedUser) {
            this.banUser(AdminState.selectedUser.id);
            closeAdminModal('user-details-modal');
        }
    }

    async banUser(userId) {
        if (!confirm('Ban this user?')) return;
        
        showAdminLoading('Banning...');
        
        const user = AdminState.users.find(u => String(u.id) === String(userId));
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
        
        hideAdminLoading();
        showAdminToast('success', 'Banned', 'User banned');
        this.loadUsers();
    }

    // ============================================
    // Banners
    // ============================================

    loadBanners() {
        const type1 = document.getElementById('type1-banners');
        if (type1) {
            type1.innerHTML = AdminState.bannersType1.length ?
                AdminState.bannersType1.map(b => `
                    <div class="banner-card">
                        <img src="${b.image}" alt="Banner">
                        <div class="banner-card-actions">
                            <button onclick="adminPanel.deleteBanner('${b.id}', 'type1')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('') : '<p class="text-muted">No home banners</p>';
        }
        
        const type2 = document.getElementById('type2-banners');
        if (type2) {
            type2.innerHTML = AdminState.bannersType2.length ?
                AdminState.bannersType2.map(b => {
                    const cat = AdminState.categories.find(c => c.id === b.categoryId);
                    return `
                        <div class="banner-list-item">
                            <img src="${b.image}" style="width:100px;height:60px;object-fit:cover;border-radius:8px;">
                            <span>${cat?.name || 'Unknown'}</span>
                            <button onclick="adminPanel.deleteBanner('${b.id}', 'type2')"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                }).join('') : '<p class="text-muted">No category banners</p>';
        }
    }

    openBannerModal(type) {
        document.getElementById('banner-form')?.reset();
        document.getElementById('banner-id').value = '';
        document.getElementById('banner-type').value = type;
        document.getElementById('banner-preview')?.classList.add('hidden');
        document.querySelector('#banner-file-upload .file-upload-content')?.classList.remove('hidden');
        
        document.getElementById('banner-category-group').style.display = type === 'type2' ? 'block' : 'none';
        document.getElementById('banner-instructions-group').style.display = type === 'type2' ? 'block' : 'none';
        
        if (type === 'type2') {
            document.getElementById('banner-category').innerHTML = '<option value="">Select Category</option>' +
                AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        openAdminModal('add-banner-modal');
    }

    async saveBanner(e) {
        e.preventDefault();
        showAdminLoading('Saving...');
        
        const type = document.getElementById('banner-type').value;
        const imageInput = document.getElementById('banner-image');
        const previewImg = document.getElementById('banner-preview-img');
        
        let image = previewImg?.src || '';
        if (imageInput?.files[0]) {
            image = await fileToBase64(imageInput.files[0]);
        }
        
        if (!image) {
            hideAdminLoading();
            showAdminToast('warning', 'Required', 'Upload banner image');
            return;
        }
        
        const data = {
            id: 'banner_' + Date.now(),
            image,
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
        
        hideAdminLoading();
        closeAdminModal('add-banner-modal');
        showAdminToast('success', 'Saved', 'Banner saved');
        this.loadBanners();
    }

    async deleteBanner(id, type) {
        if (!confirm('Delete banner?')) return;
        
        showAdminLoading('Deleting...');
        
        if (type === 'type1') {
            AdminState.bannersType1 = AdminState.bannersType1.filter(b => b.id !== id);
            await this.saveData('bannersType1');
        } else {
            AdminState.bannersType2 = AdminState.bannersType2.filter(b => b.id !== id);
            await this.saveData('bannersType2');
        }
        
        hideAdminLoading();
        showAdminToast('success', 'Deleted', 'Banner deleted');
        this.loadBanners();
    }

    // ============================================
    // Input Tables
    // ============================================

    loadInputTables() {
        const container = document.getElementById('admin-input-tables');
        if (!container) return;
        
        if (AdminState.inputTables.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-keyboard"></i><p>No input tables</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.inputTables.map(t => {
            const cat = AdminState.categories.find(c => c.id === t.categoryId);
            return `
                <div class="input-table-card">
                    <div class="input-table-info">
                        <h4>${t.name}</h4>
                        <span>${cat?.name || 'Unknown'} • ${t.required ? 'Required' : 'Optional'}</span>
                    </div>
                    <button onclick="adminPanel.deleteInputTable('${t.id}')"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }).join('');
    }

    openInputTableModal() {
        document.getElementById('input-table-form')?.reset();
        document.getElementById('input-table-id').value = '';
        
        document.getElementById('input-table-category').innerHTML = '<option value="">Choose Category</option>' +
            AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        openAdminModal('input-table-modal');
    }

    async saveInputTable(e) {
        e.preventDefault();
        showAdminLoading('Saving...');
        
        const categoryId = document.getElementById('input-table-category').value;
        const name = document.getElementById('input-table-name').value.trim();
        const placeholder = document.getElementById('input-table-placeholder').value.trim();
        const required = document.getElementById('input-table-required').checked;
        
        if (!categoryId || !name) {
            hideAdminLoading();
            showAdminToast('warning', 'Required', 'Fill all fields');
            return;
        }
        
        AdminState.inputTables.push({
            id: 'input_' + Date.now(),
            categoryId, name, placeholder, required,
            createdAt: new Date().toISOString()
        });
        
        await this.saveData('inputTables');
        
        hideAdminLoading();
        closeAdminModal('input-table-modal');
        showAdminToast('success', 'Saved', 'Input table saved');
        this.loadInputTables();
    }

    async deleteInputTable(id) {
        if (!confirm('Delete?')) return;
        
        showAdminLoading('Deleting...');
        AdminState.inputTables = AdminState.inputTables.filter(t => t.id !== id);
        await this.saveData('inputTables');
        hideAdminLoading();
        
        showAdminToast('success', 'Deleted', 'Input table deleted');
        this.loadInputTables();
    }

    // ============================================
    // Announcements & Settings
    // ============================================

    loadAnnouncements() {
        document.getElementById('announcement-text').value = AdminState.settings.announcement || '';
        document.getElementById('announcement-preview').innerHTML = `<p>${AdminState.settings.announcement || 'No announcement'}</p>`;
    }

    async saveAnnouncement(e) {
        e.preventDefault();
        showAdminLoading('Saving...');
        
        AdminState.settings.announcement = document.getElementById('announcement-text').value.trim();
        await this.saveData('settings');
        
        hideAdminLoading();
        document.getElementById('announcement-preview').innerHTML = `<p>${AdminState.settings.announcement || 'No announcement'}</p>`;
        showAdminToast('success', 'Saved', 'Announcement updated');
    }

    loadBroadcast() {
        document.getElementById('broadcast-count').textContent = AdminState.users.length;
    }

    async sendBroadcast(e) {
        e.preventDefault();
        const message = document.getElementById('broadcast-message').value.trim();
        if (!message) {
            showAdminToast('warning', 'Required', 'Enter message');
            return;
        }
        
        if (!confirm(`Send to ${AdminState.users.length} users?`)) return;
        
        showAdminLoading('Sending...');
        
        AdminState.broadcasts.push({
            id: 'bc_' + Date.now(),
            message,
            sentAt: new Date().toISOString(),
            count: AdminState.users.length
        });
        await this.saveData('broadcasts');
        
        hideAdminLoading();
        showAdminToast('success', 'Sent', `Broadcast sent to ${AdminState.users.length} users`);
        document.getElementById('broadcast-form').reset();
    }

    loadBannedUsers() {
        const container = document.getElementById('banned-users-list');
        if (!container) return;
        
        if (AdminState.bannedUsers.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-user-check"></i><p>No banned users</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.bannedUsers.map(u => `
            <div class="banned-user-card">
                <span>${u.firstName || ''} ${u.lastName || ''} (@${u.username || 'N/A'})</span>
                <button onclick="adminPanel.unbanUser('${u.id}')"><i class="fas fa-user-check"></i> Unban</button>
            </div>
        `).join('');
    }

    async unbanUser(userId) {
        if (!confirm('Unban?')) return;
        
        showAdminLoading('Unbanning...');
        AdminState.bannedUsers = AdminState.bannedUsers.filter(u => String(u.id) !== String(userId));
        await this.saveData('bannedUsers');
        hideAdminLoading();
        
        showAdminToast('success', 'Unbanned', 'User unbanned');
        this.loadBannedUsers();
    }

    loadSettingsPage() {
        document.getElementById('site-name').value = AdminState.settings.siteName || 'Mafia Gaming Shop';
        
        if (AdminState.settings.logo) {
            document.getElementById('logo-preview-img').src = AdminState.settings.logo;
            document.getElementById('logo-preview')?.classList.remove('hidden');
        }
    }

    async saveSettings(e) {
        e.preventDefault();
        showAdminLoading('Saving...');
        
        const siteName = document.getElementById('site-name').value.trim();
        const theme = document.querySelector('input[name="theme"]:checked')?.value || 'dark';
        const logoInput = document.getElementById('site-logo');
        const previewImg = document.getElementById('logo-preview-img');
        
        let logo = AdminState.settings.logo || '';
        if (logoInput?.files[0]) {
            logo = await fileToBase64(logoInput.files[0]);
        } else if (previewImg?.src) {
            logo = previewImg.src;
        }
        
        AdminState.settings = { ...AdminState.settings, siteName, theme, logo };
        await this.saveData('settings');
        
        this.updateAdminInfo();
        hideAdminLoading();
        showAdminToast('success', 'Saved', 'Settings saved');
    }
}

// ============================================
// Initialize
// ============================================

let adminPanel = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Admin Panel DOM ready');
    
    adminPanel = new AdminPanel();
    await adminPanel.init();
    
    window.adminPanel = adminPanel;
    window.AdminState = AdminState;
    window.AdminDB = AdminDB;
});

console.log('🔧 Admin.js v3.1.0 loaded');
