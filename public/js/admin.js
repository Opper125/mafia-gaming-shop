import { Toast } from "@/components/ui/toast"
import { Loading } from "@/components/ui/loading"
import { Modal } from "@/components/ui/modal"
/* ============================================
   MAFIA GAMING SHOP - ADMIN PANEL
   Version: 3.0.0 (JSONBin Integration)
   ============================================ */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    ADMIN_ID: 1538232799,
    ADMIN_ID_STR: '1538232799',
    BOT_TOKEN: '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM',
    BOT_USERNAME: 'mafia_gamingshopbot',
    
    // JSONBin.io Configuration
    JSONBIN: {
        BASE_URL: 'https://api.jsonbin.io/v3',
        MASTER_KEY: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
        ACCESS_KEY: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS'
    }
};

// ============================================
// JSONBin Database Service
// ============================================

const JSONBinDB = {
    binIds: {},
    initialized: false,
    
    // Default data structures
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
            announcement: 'Welcome to Mafia Gaming Shop! 🎮 Best prices for UC & Diamonds!',
            minTopup: 1000,
            maxTopup: 1000000
        }
    },
    
    // Initialize database
    async init() {
        console.log('🗄️ Initializing JSONBin Database...');
        
        try {
            // Try to load existing bin IDs from localStorage
            const savedBinIds = localStorage.getItem('mafia_jsonbin_ids');
            
            if (savedBinIds) {
                this.binIds = JSON.parse(savedBinIds);
                console.log('✅ Loaded existing bin IDs:', this.binIds);
                
                // Verify master bin still exists
                const verified = await this.verifyMasterBin();
                if (verified) {
                    this.initialized = true;
                    return true;
                }
            }
            
            // Create new bins if not exists
            console.log('📦 Creating new database bins...');
            await this.createAllBins();
            
            this.initialized = true;
            console.log('✅ JSONBin Database initialized successfully!');
            return true;
            
        } catch (error) {
            console.error('❌ JSONBin init error:', error);
            Toast.error('Database Error', 'Failed to initialize database. Using local storage.');
            return false;
        }
    },
    
    // Verify master bin exists
    async verifyMasterBin() {
        if (!this.binIds.master) return false;
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN.BASE_URL}/b/${this.binIds.master}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN.MASTER_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.record && data.record.binIds) {
                    this.binIds = { master: this.binIds.master, ...data.record.binIds };
                    this.saveBinIdsToLocal();
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Verify master bin error:', error);
            return false;
        }
    },
    
    // Create all necessary bins
    async createAllBins() {
        const binTypes = [
            'users', 'categories', 'products', 'orders', 
            'topupRequests', 'payments', 'bannersType1', 
            'bannersType2', 'inputTables', 'bannedUsers', 
            'broadcasts', 'settings'
        ];
        
        Loading.show('Creating database... 0%');
        
        const createdBins = {};
        
        for (let i = 0; i < binTypes.length; i++) {
            const type = binTypes[i];
            const progress = Math.round(((i + 1) / binTypes.length) * 100);
            Loading.show(`Creating ${type}... ${progress}%`);
            
            try {
                const binId = await this.createBin(type, this.defaultData[type]);
                createdBins[type] = binId;
                console.log(`✅ Created bin: ${type} = ${binId}`);
            } catch (error) {
                console.error(`❌ Failed to create bin: ${type}`, error);
            }
            
            // Small delay to avoid rate limiting
            await this.delay(300);
        }
        
        // Create master bin to store all bin IDs
        Loading.show('Finalizing database...');
        
        const masterBinId = await this.createBin('master', {
            binIds: createdBins,
            createdAt: new Date().toISOString(),
            version: '3.0.0'
        });
        
        this.binIds = { master: masterBinId, ...createdBins };
        this.saveBinIdsToLocal();
        
        Loading.hide();
        Toast.success('Database Created', 'All database bins created successfully!');
        
        return true;
    },
    
    // Create a single bin
    async createBin(name, data) {
        const response = await fetch(`${CONFIG.JSONBIN.BASE_URL}/b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.JSONBIN.MASTER_KEY,
                'X-Bin-Name': `mafia-gaming-${name}`,
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create bin ${name}: ${error}`);
        }
        
        const result = await response.json();
        return result.metadata.id;
    },
    
    // Read data from bin via Vercel API
    async read(binType) {
        const binId = this.binIds[binType];
        
        if (!binId) {
            console.warn(`Bin ID not found for: ${binType}`);
            return this.defaultData[binType] || null;
        }
        
        try {
            // Use Vercel API route based on binType
            let endpoint = '/api/products';
            if (binType === 'categories') endpoint = '/api/categories';
            else if (binType === 'orders') endpoint = '/api/orders';
            else if (binType === 'users') endpoint = '/api/users';
            
            const response = await fetch(`${endpoint}?binId=${binId}`);
            
            if (!response.ok) {
                throw new Error(`API HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : (data.record || this.defaultData[binType]);
            
        } catch (error) {
            console.error(`Read error for ${binType}:`, error);
            
            // Fallback to localStorage
            const localData = localStorage.getItem(`mafia_${binType}`);
            return localData ? JSON.parse(localData) : this.defaultData[binType];
        }
    },
    
    // Write data to bin via Vercel API
    async write(binType, data) {
        const binId = this.binIds[binType];
        
        if (!binId) {
            console.error(`Bin ID not found for: ${binType}`);
            // Save to localStorage as fallback
            localStorage.setItem(`mafia_${binType}`, JSON.stringify(data));
            return false;
        }
        
        try {
            // Use Vercel API route based on binType
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
                    products: data  // Generic key used by API
                })
            });
            
            if (!response.ok) {
                throw new Error(`API HTTP ${response.status}`);
            }
            
            // Also save to localStorage for faster access
            localStorage.setItem(`mafia_${binType}`, JSON.stringify(data));
            
            return true;
            
        } catch (error) {
            console.error(`Write error for ${binType}:`, error);
            
            // Save to localStorage as fallback
            localStorage.setItem(`mafia_${binType}`, JSON.stringify(data));
            return false;
        }
    },
    
    // Save bin IDs to localStorage
    saveBinIdsToLocal() {
        localStorage.setItem('mafia_jsonbin_ids', JSON.stringify(this.binIds));
    },
    
    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Get all bin IDs (for sharing with user dashboard)
    getBinIds() {
        return this.binIds;
    },
    
    // Export database config for user dashboard
    exportConfig() {
        return {
            JSONBIN_BASE_URL: CONFIG.JSONBIN.BASE_URL,
            JSONBIN_ACCESS_KEY: CONFIG.JSONBIN.ACCESS_KEY,
            BIN_IDS: this.binIds
        };
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
    
    // Data (will be loaded from JSONBin)
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
        announcement: 'Welcome to Mafia Gaming Shop!'
    },
    
    // Stats
    stats: {
        totalUsers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        rejectedOrders: 0,
        totalRevenue: 0,
        pendingTopups: 0
    }
};

// ============================================
// Admin Panel Class
// ============================================

class AdminPanel {
    constructor() {
        console.log('🔧 AdminPanel constructor');
    }

    async init() {
        console.log('🚀 Starting Admin Panel initialization...');
        
        try {
            // Step 1: Initialize Toast
            if (typeof Toast !== 'undefined' && Toast.init) {
                Toast.init();
            }
            
            // Step 2: Check Telegram WebApp
            if (!window.Telegram?.WebApp) {
                console.error('❌ Telegram WebApp not available');
                this.showAccessDenied('Telegram WebApp not available. Please open from Telegram Bot.');
                return;
            }
            
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            console.log('✅ Telegram WebApp ready');
            
            // Step 3: Get user
            const user = tg.initDataUnsafe?.user;
            
            if (!user) {
                console.error('❌ No user data');
                this.showAccessDenied('Could not get user data from Telegram.');
                return;
            }
            
            AdminState.user = user;
            console.log('👤 User ID:', user.id);
            
            // Step 4: Check if admin
            const userId = user.id;
            const isAdmin = (userId === CONFIG.ADMIN_ID) || 
                           (userId === CONFIG.ADMIN_ID_STR) || 
                           (String(userId) === CONFIG.ADMIN_ID_STR);
            
            if (!isAdmin) {
                console.error('❌ Not admin');
                this.showAccessDenied(`Access Denied. Your ID (${userId}) is not authorized.`);
                return;
            }
            
            AdminState.isAdmin = true;
            console.log('✅ Admin verified!');
            
            // Step 5: Initialize JSONBin Database
            Loading.show('Connecting to database...');
            await JSONBinDB.init();
            
            // Step 6: Show admin panel
            await this.showAdminPanel();
            
        } catch (error) {
            console.error('❌ Init error:', error);
            Loading.hide();
            this.showAccessDenied('Initialization failed: ' + error.message);
        }
    }

    showAccessDenied(message = '') {
        console.log('🚫 Showing access denied:', message);
        Loading.hide();
        
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        document.getElementById('admin-panel')?.classList.add('hidden');
        
        const screen = document.getElementById('admin-access-denied');
        if (screen) {
            screen.classList.remove('hidden');
            if (message) {
                const msgEl = screen.querySelector('p');
                if (msgEl) msgEl.textContent = message;
            }
        }
    }

    async showAdminPanel() {
        console.log('📊 Showing admin panel...');
        
        document.getElementById('admin-access-denied')?.classList.add('hidden');
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.classList.remove('hidden');
        }
        
        // Update admin info
        this.updateAdminInfo();
        
        // Load data from JSONBin
        await this.loadAllData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load dashboard
        this.loadDashboard();
        
        // Show database info
        this.showDatabaseInfo();
        
        AdminState.initialized = true;
        Loading.hide();
        
        console.log('✅ Admin panel ready!');
        Toast.success('Welcome!', 'Admin Panel loaded successfully');
    }

    updateAdminInfo() {
        const user = AdminState.user;
        if (!user) return;
        
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Admin';
        
        const nameEl = document.getElementById('admin-name');
        if (nameEl) nameEl.textContent = fullName;
        
        const avatarEl = document.getElementById('admin-avatar');
        if (avatarEl) {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=8B5CF6&color=fff&size=128`;
        }
        
        const sidebarLogo = document.getElementById('sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.src = AdminState.settings.logo || `https://ui-avatars.com/api/?name=MG&background=8B5CF6&color=fff&size=128`;
        }
        
        const sidebarName = document.getElementById('sidebar-site-name');
        if (sidebarName) sidebarName.textContent = AdminState.settings.siteName;
    }

    async loadAllData() {
        console.log('📦 Loading all data from JSONBin...');
        Loading.show('Loading data...');
        
        try {
            // Load all data from JSONBin
            const [
                users, categories, products, orders, topupRequests,
                payments, bannersType1, bannersType2, inputTables,
                bannedUsers, broadcasts, settings
            ] = await Promise.all([
                JSONBinDB.read('users'),
                JSONBinDB.read('categories'),
                JSONBinDB.read('products'),
                JSONBinDB.read('orders'),
                JSONBinDB.read('topupRequests'),
                JSONBinDB.read('payments'),
                JSONBinDB.read('bannersType1'),
                JSONBinDB.read('bannersType2'),
                JSONBinDB.read('inputTables'),
                JSONBinDB.read('bannedUsers'),
                JSONBinDB.read('broadcasts'),
                JSONBinDB.read('settings')
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
            AdminState.settings = settings || JSONBinDB.defaultData.settings;
            
            this.calculateStats();
            
            console.log('✅ Data loaded:', {
                users: AdminState.users.length,
                categories: AdminState.categories.length,
                products: AdminState.products.length,
                orders: AdminState.orders.length
            });
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            Toast.error('Load Error', 'Some data could not be loaded');
        }
        
        Loading.hide();
    }

    // Save specific data type to JSONBin
    async saveData(dataType) {
        console.log(`💾 Saving ${dataType} to JSONBin...`);
        
        const success = await JSONBinDB.write(dataType, AdminState[dataType]);
        
        if (success) {
            console.log(`✅ ${dataType} saved successfully`);
        } else {
            console.warn(`⚠️ ${dataType} saved to localStorage (JSONBin failed)`);
        }
        
        return success;
    }

    showDatabaseInfo() {
        // Show database connection info in console
        console.log('📊 Database Info:');
        console.log('Bin IDs:', JSONBinDB.getBinIds());
        console.log('Export Config for User Dashboard:', JSONBinDB.exportConfig());
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
        
        this.updateBadge('users-count', AdminState.stats.totalUsers);
        this.updateBadge('pending-orders', AdminState.stats.pendingOrders);
        this.updateBadge('pending-topups', AdminState.stats.pendingTopups);
    }

    updateBadge(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ============================================
    // Event Listeners
    // ============================================

    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // Menu toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('admin-sidebar')?.classList.toggle('active');
        });
        
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) this.navigateTo(page);
            });
        });
        
        // View all links
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
            btn.addEventListener('click', () => Modal.closeAll());
        });
        
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => Modal.closeAll());
        });
        
        // Setup forms
        this.setupForms();
        this.setupFileUploads();
        this.setupAddButtons();
        this.setupBannerTabs();
        this.setupUserModalTabs();
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
            { input: 'site-logo', preview: 'logo-preview', img: 'logo-preview-img', content: '#logo-upload .file-upload-content' },
            { input: 'broadcast-image', preview: 'broadcast-image-preview', img: 'broadcast-image-img', content: '#broadcast-image-upload .file-upload-content' }
        ];
        
        uploads.forEach(({ input, preview, img, content }) => {
            document.getElementById(input)?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const base64 = await this.fileToBase64(file);
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

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
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

    setupUserModalTabs() {
        document.querySelectorAll('#user-details-modal .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#user-details-modal .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('#user-details-modal .user-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`${btn.dataset.tab}-tab`)?.classList.remove('hidden');
            });
        });
    }

    setupOrderActions() {
        document.getElementById('approve-order-btn')?.addEventListener('click', () => this.approveOrder());
        document.getElementById('reject-order-btn')?.addEventListener('click', () => this.rejectOrder());
        document.getElementById('close-order-modal')?.addEventListener('click', () => Modal.close('order-details-modal'));
    }

    setupTopupActions() {
        document.getElementById('approve-topup-btn')?.addEventListener('click', () => this.approveTopup());
        document.getElementById('reject-topup-btn')?.addEventListener('click', () => this.rejectTopup());
        document.getElementById('close-topup-request-modal')?.addEventListener('click', () => Modal.close('topup-request-modal'));
    }

    setupUserActions() {
        document.getElementById('add-balance-btn')?.addEventListener('click', () => this.adjustBalance('add'));
        document.getElementById('deduct-balance-btn')?.addEventListener('click', () => this.adjustBalance('deduct'));
        document.getElementById('ban-user-btn')?.addEventListener('click', () => this.banCurrentUser());
        document.getElementById('close-user-modal')?.addEventListener('click', () => Modal.close('user-details-modal'));
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
    // Format Helpers
    // ============================================

    formatCurrency(amount, currency = 'MMK') {
        return `${Number(amount || 0).toLocaleString()} ${currency}`;
    }

    formatDate(dateStr, type = 'short') {
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
            return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // ============================================
    // Dashboard
    // ============================================

    loadDashboard() {
        console.log('📊 Loading dashboard...');
        
        document.getElementById('total-users').textContent = AdminState.stats.totalUsers;
        document.getElementById('total-orders').textContent = AdminState.stats.totalOrders;
        document.getElementById('approved-orders').textContent = AdminState.stats.approvedOrders;
        document.getElementById('pending-orders-count').textContent = AdminState.stats.pendingOrders;
        document.getElementById('rejected-orders').textContent = AdminState.stats.rejectedOrders;
        document.getElementById('total-revenue').textContent = this.formatCurrency(AdminState.stats.totalRevenue);
        
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
                        <span class="recent-item-subtitle">${o.userName || 'User'} • ${this.formatDate(o.createdAt, 'relative')}</span>
                    </div>
                    <span class="recent-item-status ${o.status}">${o.status}</span>
                </div>
            `).join('') : '<p class="text-muted text-center p-md">No recent orders</p>';
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
                        <span class="recent-item-title">${this.formatCurrency(t.amount)}</span>
                        <span class="recent-item-subtitle">${t.userName || 'User'} • ${this.formatDate(t.createdAt, 'relative')}</span>
                    </div>
                    <span class="recent-item-status ${t.status}">${t.status}</span>
                </div>
            `).join('') : '<p class="text-muted text-center p-md">No recent topups</p>';
        }
    }

    // ============================================
    // Categories - with JSONBin save
    // ============================================

    loadCategories() {
        const container = document.getElementById('admin-categories');
        if (!container) return;
        
        if (AdminState.categories.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-th-large"></i><p>No categories yet. Click "Add Category" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.categories.map(cat => {
            const productCount = AdminState.products.filter(p => p.categoryId === cat.id).length;
            return `
                <div class="admin-category-card" data-category-id="${cat.id}">
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
        
        Modal.open('category-modal');
    }

    editCategory(categoryId) {
        this.openCategoryModal(categoryId);
    }

    async saveCategory(e) {
        e.preventDefault();
        Loading.show('Saving category...');
        
        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value.trim();
        const flag = document.getElementById('category-flag').value;
        const hasDiscount = document.getElementById('category-has-discount').checked;
        const iconInput = document.getElementById('category-icon');
        const previewImg = document.getElementById('category-icon-img');
        
        if (!name) {
            Loading.hide();
            Toast.warning('Required', 'Please enter category name');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            icon = await this.fileToBase64(iconInput.files[0]);
        }
        
        const categoryData = {
            id: id || 'cat_' + Date.now(),
            name,
            flag,
            hasDiscount,
            icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            const index = AdminState.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                AdminState.categories[index] = { ...AdminState.categories[index], ...categoryData };
            }
        } else {
            categoryData.createdAt = new Date().toISOString();
            AdminState.categories.push(categoryData);
        }
        
        // Save to JSONBin
        await this.saveData('categories');
        
        Loading.hide();
        Modal.close('category-modal');
        Toast.success('Success', 'Category saved successfully');
        this.loadCategories();
    }

    async deleteCategory(categoryId) {
        const products = AdminState.products.filter(p => p.categoryId === categoryId);
        if (products.length > 0) {
            Toast.warning('Cannot Delete', `This category has ${products.length} products. Delete products first.`);
            return;
        }
        
        if (!confirm('Delete this category?')) return;
        
        Loading.show('Deleting...');
        AdminState.categories = AdminState.categories.filter(c => c.id !== categoryId);
        await this.saveData('categories');
        Loading.hide();
        
        Toast.success('Deleted', 'Category deleted successfully');
        this.loadCategories();
    }

    // ============================================
    // Products - with JSONBin save
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
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-box"></i><p>No products yet. Click "Add Product" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.products.map(product => {
            const category = AdminState.categories.find(c => c.id === product.categoryId);
            const discountedPrice = product.hasDiscount ? product.price - (product.price * product.discount / 100) : product.price;
            
            return `
                <div class="admin-product-card" data-product-id="${product.id}" data-category-id="${product.categoryId}">
                    <div class="admin-product-image">
                        ${product.icon ? `<img src="${product.icon}" alt="${product.name}">` : '<i class="fas fa-box" style="font-size:48px;color:var(--primary);"></i>'}
                        ${product.hasDiscount ? `<span class="badge" style="background:var(--danger);color:white;position:absolute;top:5px;right:5px;">-${product.discount}%</span>` : ''}
                    </div>
                    <div class="admin-product-info">
                        <div class="category-tag">${category?.name || 'Unknown'}</div>
                        <h4>${product.name}</h4>
                        <div class="price-row">
                            <span class="price-current">${this.formatCurrency(discountedPrice, product.currency)}</span>
                            ${product.hasDiscount ? `<span class="price-original" style="text-decoration:line-through;opacity:0.6;font-size:12px;margin-left:5px;">${this.formatCurrency(product.price, product.currency)}</span>` : ''}
                        </div>
                        <div class="admin-product-actions" style="margin-top:10px;">
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
        
        Modal.open('product-modal');
    }

    editProduct(productId) {
        this.openProductModal(productId);
    }

    calculateDiscountedPrice() {
        const price = parseFloat(document.getElementById('product-price')?.value) || 0;
        const discount = parseFloat(document.getElementById('product-discount')?.value) || 0;
        const discounted = Math.round(price - (price * discount / 100));
        const el = document.getElementById('product-discounted-price');
        if (el) el.value = discounted;
    }

    async saveProduct(e) {
        e.preventDefault();
        Loading.show('Saving product...');
        
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
            Loading.hide();
            Toast.warning('Required', 'Please fill all required fields');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            icon = await this.fileToBase64(iconInput.files[0]);
        }
        
        const productData = {
            id: id || 'prod_' + Date.now(),
            categoryId,
            name,
            price,
            currency,
            delivery,
            hasDiscount,
            discount,
            active,
            icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            const index = AdminState.products.findIndex(p => p.id === id);
            if (index !== -1) {
                AdminState.products[index] = { ...AdminState.products[index], ...productData };
            }
        } else {
            productData.createdAt = new Date().toISOString();
            AdminState.products.push(productData);
        }
        
        await this.saveData('products');
        
        Loading.hide();
        Modal.close('product-modal');
        Toast.success('Success', 'Product saved successfully');
        this.loadProducts();
    }

    async deleteProduct(productId) {
        if (!confirm('Delete this product?')) return;
        
        Loading.show('Deleting...');
        AdminState.products = AdminState.products.filter(p => p.id !== productId);
        await this.saveData('products');
        Loading.hide();
        
        Toast.success('Deleted', 'Product deleted successfully');
        this.loadProducts();
    }

    // ============================================
    // Payments - with JSONBin save
    // ============================================

    loadPayments() {
        const container = document.getElementById('admin-payments');
        if (!container) return;
        
        if (AdminState.payments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>No payment methods yet.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.payments.map(payment => `
            <div class="payment-card" data-payment-id="${payment.id}">
                <div class="payment-card-icon">
                    ${payment.icon ? `<img src="${payment.icon}" alt="${payment.name}">` : '<i class="fas fa-credit-card" style="font-size:32px;color:var(--primary);"></i>'}
                </div>
                <div class="payment-card-info">
                    <h4>${payment.name}</h4>
                    <div class="address">${payment.address}</div>
                    <div class="holder">${payment.holder}</div>
                </div>
                <span class="payment-card-status ${payment.active ? 'active' : 'inactive'}">${payment.active ? 'Active' : 'Inactive'}</span>
                <div class="payment-card-actions">
                    <button class="btn-view" onclick="adminPanel.editPayment('${payment.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="adminPanel.deletePayment('${payment.id}')"><i class="fas fa-trash"></i></button>
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
        document.getElementById('payment-modal-title').textContent = paymentId ? 'Edit Payment Method' : 'Add Payment Method';
        
        if (paymentId) {
            const payment = AdminState.payments.find(p => p.id === paymentId);
            if (payment) {
                document.getElementById('payment-name').value = payment.name || '';
                document.getElementById('payment-address').value = payment.address || '';
                document.getElementById('payment-holder').value = payment.holder || '';
                document.getElementById('payment-note').value = payment.note || '';
                document.getElementById('payment-active').checked = payment.active !== false;
                if (payment.icon) {
                    document.getElementById('payment-icon-img').src = payment.icon;
                    document.getElementById('payment-icon-preview')?.classList.remove('hidden');
                    document.querySelector('#payment-icon-upload .file-upload-content')?.classList.add('hidden');
                }
            }
        }
        
        Modal.open('payment-modal');
    }

    editPayment(paymentId) {
        this.openPaymentModal(paymentId);
    }

    async savePayment(e) {
        e.preventDefault();
        Loading.show('Saving payment method...');
        
        const id = document.getElementById('payment-id').value;
        const name = document.getElementById('payment-name').value.trim();
        const address = document.getElementById('payment-address').value.trim();
        const holder = document.getElementById('payment-holder').value.trim();
        const note = document.getElementById('payment-note').value.trim();
        const active = document.getElementById('payment-active').checked;
        const iconInput = document.getElementById('payment-icon');
        const previewImg = document.getElementById('payment-icon-img');
        
        if (!name || !address || !holder) {
            Loading.hide();
            Toast.warning('Required', 'Please fill all required fields');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            icon = await this.fileToBase64(iconInput.files[0]);
        }
        
        const paymentData = {
            id: id || 'pay_' + Date.now(),
            name,
            address,
            holder,
            note,
            active,
            icon,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            const index = AdminState.payments.findIndex(p => p.id === id);
            if (index !== -1) {
                AdminState.payments[index] = { ...AdminState.payments[index], ...paymentData };
            }
        } else {
            paymentData.createdAt = new Date().toISOString();
            AdminState.payments.push(paymentData);
        }
        
        await this.saveData('payments');
        
        Loading.hide();
        Modal.close('payment-modal');
        Toast.success('Success', 'Payment method saved successfully');
        this.loadPayments();
    }

    async deletePayment(paymentId) {
        if (!confirm('Delete this payment method?')) return;
        
        Loading.show('Deleting...');
        AdminState.payments = AdminState.payments.filter(p => p.id !== paymentId);
        await this.saveData('payments');
        Loading.hide();
        
        Toast.success('Deleted', 'Payment method deleted successfully');
        this.loadPayments();
    }

    // ============================================
    // Users, Orders, Topups (Read & Action)
    // ============================================

    loadUsers() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        
        if (AdminState.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-lg">No users yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = AdminState.users.map(user => `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="user-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'U')}&background=8B5CF6&color=fff" alt="">
                        <div class="user-info">
                            <span class="name">${user.firstName || ''} ${user.lastName || ''}</span>
                            <span class="username">@${user.username || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td>${user.id}</td>
                <td>${this.formatCurrency(user.balance || 0)}</td>
                <td>${user.totalOrders || 0}</td>
                <td><span class="status-badge ${user.isPremium ? 'premium' : 'regular'}">${user.isPremium ? '⭐ Premium' : 'Regular'}</span></td>
                <td>${this.formatDate(user.joinedAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-view" onclick="adminPanel.viewUser('${user.id}')"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    viewUser(userId) {
        const user = AdminState.users.find(u => String(u.id) === String(userId));
        if (!user) return;
        
        AdminState.selectedUser = user;
        
        document.getElementById('modal-user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'U')}&background=8B5CF6&color=fff&size=128`;
        document.getElementById('modal-user-name').textContent = `${user.firstName || ''} ${user.lastName || ''}`;
        document.getElementById('modal-user-username').textContent = `@${user.username || 'N/A'}`;
        document.getElementById('modal-balance').textContent = this.formatCurrency(user.balance || 0);
        
        Modal.open('user-details-modal');
    }

    async adjustBalance(operation) {
        if (!AdminState.selectedUser) return;
        
        const amount = parseFloat(document.getElementById('adjust-balance-amount')?.value || 0);
        if (!amount || amount <= 0) {
            Toast.warning('Invalid Amount', 'Please enter a valid amount');
            return;
        }
        
        Loading.show('Updating balance...');
        
        const user = AdminState.users.find(u => u.id === AdminState.selectedUser.id);
        if (user) {
            if (operation === 'add') {
                user.balance = (user.balance || 0) + amount;
            } else {
                user.balance = Math.max(0, (user.balance || 0) - amount);
            }
            
            await this.saveData('users');
            document.getElementById('modal-balance').textContent = this.formatCurrency(user.balance);
            document.getElementById('adjust-balance-amount').value = '';
        }
        
        Loading.hide();
        Toast.success('Success', `Balance ${operation === 'add' ? 'added' : 'deducted'} successfully`);
    }

    loadOrders() {
        const container = document.getElementById('admin-orders-list');
        if (!container) return;
        
        const orders = [...AdminState.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No orders yet</p></div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="admin-order-card" data-order-id="${order.id}" data-status="${order.status}" onclick="adminPanel.viewOrder('${order.id}')">
                <div class="admin-order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="admin-order-body">
                    <div class="admin-order-product">
                        <span class="name">${order.productName || 'Product'}</span>
                        <span class="price">${this.formatCurrency(order.price)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    viewOrder(orderId) {
        const order = AdminState.orders.find(o => o.id === orderId);
        if (!order) return;
        
        AdminState.selectedOrder = order;
        
        document.getElementById('order-id').textContent = order.id;
        document.getElementById('order-status').textContent = order.status;
        document.getElementById('order-product-name').textContent = order.productName || 'Product';
        document.getElementById('order-product-price').textContent = this.formatCurrency(order.price);
        document.getElementById('order-actions').style.display = order.status === 'pending' ? 'flex' : 'none';
        
        Modal.open('order-details-modal');
    }

    async approveOrder() {
        if (!AdminState.selectedOrder) return;
        
        Loading.show('Approving order...');
        
        const order = AdminState.orders.find(o => o.id === AdminState.selectedOrder.id);
        if (order) {
            order.status = 'approved';
            order.updatedAt = new Date().toISOString();
            await this.saveData('orders');
            this.calculateStats();
        }
        
        Loading.hide();
        Modal.close('order-details-modal');
        Toast.success('Order Approved', 'Order has been approved successfully');
        this.loadOrders();
    }

    async rejectOrder() {
        if (!AdminState.selectedOrder) return;
        if (!confirm('Reject this order?')) return;
        
        Loading.show('Rejecting order...');
        
        const order = AdminState.orders.find(o => o.id === AdminState.selectedOrder.id);
        if (order) {
            order.status = 'rejected';
            order.updatedAt = new Date().toISOString();
            
            // Refund user
            const user = AdminState.users.find(u => String(u.id) === String(order.userId));
            if (user) {
                user.balance = (user.balance || 0) + (order.price || 0);
                await this.saveData('users');
            }
            
            await this.saveData('orders');
            this.calculateStats();
        }
        
        Loading.hide();
        Modal.close('order-details-modal');
        Toast.success('Order Rejected', 'Order rejected and amount refunded');
        this.loadOrders();
    }

    loadTopupRequests() {
        const container = document.getElementById('topup-requests-list');
        if (!container) return;
        
        const topups = [...AdminState.topupRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (topups.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No topup requests</p></div>';
            return;
        }
        
        container.innerHTML = topups.map(topup => `
            <div class="topup-request-card" data-topup-id="${topup.id}" onclick="adminPanel.viewTopup('${topup.id}')">
                <div class="topup-request-header">
                    <span class="order-id">${topup.id}</span>
                    <span class="order-status ${topup.status}">${topup.status}</span>
                </div>
                <div style="font-size:18px;font-weight:700;color:var(--success);">${this.formatCurrency(topup.amount)}</div>
            </div>
        `).join('');
    }

    viewTopup(topupId) {
        const topup = AdminState.topupRequests.find(t => t.id === topupId);
        if (!topup) return;
        
        AdminState.selectedTopup = topup;
        
        document.getElementById('topup-amount-value').textContent = this.formatCurrency(topup.amount);
        document.getElementById('topup-status').textContent = topup.status;
        document.getElementById('topup-screenshot').src = topup.screenshot || '';
        document.getElementById('topup-actions').style.display = topup.status === 'pending' ? 'flex' : 'none';
        
        Modal.open('topup-request-modal');
    }

    async approveTopup() {
        if (!AdminState.selectedTopup) return;
        
        Loading.show('Approving topup...');
        
        const topup = AdminState.topupRequests.find(t => t.id === AdminState.selectedTopup.id);
        if (topup) {
            topup.status = 'approved';
            topup.updatedAt = new Date().toISOString();
            
            // Add balance to user
            const user = AdminState.users.find(u => String(u.id) === String(topup.userId));
            if (user) {
                user.balance = (user.balance || 0) + (topup.amount || 0);
                await this.saveData('users');
            }
            
            await this.saveData('topupRequests');
            this.calculateStats();
        }
        
        Loading.hide();
        Modal.close('topup-request-modal');
        Toast.success('Topup Approved', 'Balance added to user');
        this.loadTopupRequests();
    }

    async rejectTopup() {
        if (!AdminState.selectedTopup) return;
        if (!confirm('Reject this topup request?')) return;
        
        Loading.show('Rejecting topup...');
        
        const topup = AdminState.topupRequests.find(t => t.id === AdminState.selectedTopup.id);
        if (topup) {
            topup.status = 'rejected';
            topup.updatedAt = new Date().toISOString();
            await this.saveData('topupRequests');
            this.calculateStats();
        }
        
        Loading.hide();
        Modal.close('topup-request-modal');
        Toast.success('Topup Rejected', 'Request has been rejected');
        this.loadTopupRequests();
    }

    // ============================================
    // Banners
    // ============================================

    loadBanners() {
        const type1Container = document.getElementById('type1-banners');
        if (type1Container) {
            type1Container.innerHTML = AdminState.bannersType1.length ? 
                AdminState.bannersType1.map(b => `
                    <div class="banner-card">
                        <img src="${b.image}" alt="Banner">
                        <div class="banner-card-actions">
                            <button onclick="adminPanel.deleteBanner('${b.id}', 'type1')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('') : '<p class="text-muted">No home banners yet.</p>';
        }
        
        const type2Container = document.getElementById('type2-banners');
        if (type2Container) {
            type2Container.innerHTML = AdminState.bannersType2.length ?
                AdminState.bannersType2.map(b => {
                    const cat = AdminState.categories.find(c => c.id === b.categoryId);
                    return `
                        <div class="banner-list-item">
                            <img src="${b.image}" alt="Banner" style="width:100px;height:60px;object-fit:cover;border-radius:8px;">
                            <span>${cat?.name || 'Unknown'}</span>
                            <button onclick="adminPanel.deleteBanner('${b.id}', 'type2')"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                }).join('') : '<p class="text-muted">No category banners yet.</p>';
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
        
        Modal.open('add-banner-modal');
    }

    async saveBanner(e) {
        e.preventDefault();
        Loading.show('Saving banner...');
        
        const type = document.getElementById('banner-type').value;
        const imageInput = document.getElementById('banner-image');
        const previewImg = document.getElementById('banner-preview-img');
        
        let image = previewImg?.src || '';
        if (imageInput?.files[0]) {
            image = await this.fileToBase64(imageInput.files[0]);
        }
        
        if (!image) {
            Loading.hide();
            Toast.warning('Required', 'Please upload a banner image');
            return;
        }
        
        const bannerData = {
            id: 'banner_' + Date.now(),
            image,
            createdAt: new Date().toISOString()
        };
        
        if (type === 'type2') {
            bannerData.categoryId = document.getElementById('banner-category').value;
            bannerData.instructions = document.getElementById('banner-instructions').value;
        }
        
        if (type === 'type1') {
            AdminState.bannersType1.push(bannerData);
            await this.saveData('bannersType1');
        } else {
            AdminState.bannersType2.push(bannerData);
            await this.saveData('bannersType2');
        }
        
        Loading.hide();
        Modal.close('add-banner-modal');
        Toast.success('Success', 'Banner saved successfully');
        this.loadBanners();
    }

    async deleteBanner(bannerId, type) {
        if (!confirm('Delete this banner?')) return;
        
        Loading.show('Deleting...');
        
        if (type === 'type1') {
            AdminState.bannersType1 = AdminState.bannersType1.filter(b => b.id !== bannerId);
            await this.saveData('bannersType1');
        } else {
            AdminState.bannersType2 = AdminState.bannersType2.filter(b => b.id !== bannerId);
            await this.saveData('bannersType2');
        }
        
        Loading.hide();
        Toast.success('Deleted', 'Banner deleted');
        this.loadBanners();
    }

    // ============================================
    // Input Tables
    // ============================================

    loadInputTables() {
        const container = document.getElementById('admin-input-tables');
        if (!container) return;
        
        if (AdminState.inputTables.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-keyboard"></i><p>No input tables yet.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.inputTables.map(table => {
            const cat = AdminState.categories.find(c => c.id === table.categoryId);
            return `
                <div class="input-table-card">
                    <div class="input-table-info">
                        <h4>${table.name}</h4>
                        <span>${cat?.name || 'Unknown'} • ${table.required ? 'Required' : 'Optional'}</span>
                    </div>
                    <div class="input-table-actions">
                        <button onclick="adminPanel.deleteInputTable('${table.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openInputTableModal() {
        document.getElementById('input-table-form')?.reset();
        document.getElementById('input-table-id').value = '';
        
        document.getElementById('input-table-category').innerHTML = '<option value="">Choose Category</option>' +
            AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        Modal.open('input-table-modal');
    }

    async saveInputTable(e) {
        e.preventDefault();
        Loading.show('Saving input table...');
        
        const categoryId = document.getElementById('input-table-category').value;
        const name = document.getElementById('input-table-name').value.trim();
        const placeholder = document.getElementById('input-table-placeholder').value.trim();
        const required = document.getElementById('input-table-required').checked;
        
        if (!categoryId || !name) {
            Loading.hide();
            Toast.warning('Required', 'Please fill all required fields');
            return;
        }
        
        AdminState.inputTables.push({
            id: 'input_' + Date.now(),
            categoryId,
            name,
            placeholder,
            required,
            createdAt: new Date().toISOString()
        });
        
        await this.saveData('inputTables');
        
        Loading.hide();
        Modal.close('input-table-modal');
        Toast.success('Success', 'Input table saved');
        this.loadInputTables();
    }

    async deleteInputTable(tableId) {
        if (!confirm('Delete this input table?')) return;
        
        Loading.show('Deleting...');
        AdminState.inputTables = AdminState.inputTables.filter(t => t.id !== tableId);
        await this.saveData('inputTables');
        Loading.hide();
        
        Toast.success('Deleted', 'Input table deleted');
        this.loadInputTables();
    }

    // ============================================
    // Announcements & Settings
    // ============================================

    loadAnnouncements() {
        document.getElementById('announcement-text').value = AdminState.settings.announcement || '';
        document.getElementById('announcement-preview').innerHTML = `<p>${AdminState.settings.announcement || 'No announcement set'}</p>`;
    }

    async saveAnnouncement(e) {
        e.preventDefault();
        Loading.show('Saving announcement...');
        
        AdminState.settings.announcement = document.getElementById('announcement-text').value.trim();
        await this.saveData('settings');
        
        Loading.hide();
        document.getElementById('announcement-preview').innerHTML = `<p>${AdminState.settings.announcement || 'No announcement set'}</p>`;
        Toast.success('Saved', 'Announcement updated');
    }

    loadBroadcast() {
        document.getElementById('broadcast-count').textContent = AdminState.users.length;
    }

    async sendBroadcast(e) {
        e.preventDefault();
        const message = document.getElementById('broadcast-message').value.trim();
        if (!message) {
            Toast.warning('Required', 'Please enter a message');
            return;
        }
        
        if (!confirm(`Send to ${AdminState.users.length} users?`)) return;
        
        Loading.show('Sending broadcast...');
        
        // Save to broadcasts history
        AdminState.broadcasts.push({
            id: 'bc_' + Date.now(),
            message,
            sentAt: new Date().toISOString(),
            recipientCount: AdminState.users.length
        });
        await this.saveData('broadcasts');
        
        Loading.hide();
        Toast.success('Sent', `Broadcast sent to ${AdminState.users.length} users`);
        document.getElementById('broadcast-form').reset();
    }

    loadBannedUsers() {
        const container = document.getElementById('banned-users-list');
        if (!container) return;
        
        if (AdminState.bannedUsers.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-user-check"></i><p>No banned users</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.bannedUsers.map(user => `
            <div class="banned-user-card">
                <span>${user.firstName || ''} ${user.lastName || ''}</span>
                <button onclick="adminPanel.unbanUser('${user.id}')"><i class="fas fa-user-check"></i> Unban</button>
            </div>
        `).join('');
    }

    async unbanUser(userId) {
        if (!confirm('Unban this user?')) return;
        
        Loading.show('Unbanning...');
        AdminState.bannedUsers = AdminState.bannedUsers.filter(u => String(u.id) !== String(userId));
        await this.saveData('bannedUsers');
        Loading.hide();
        
        Toast.success('Unbanned', 'User has been unbanned');
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
        Loading.show('Saving settings...');
        
        const siteName = document.getElementById('site-name').value.trim();
        const theme = document.querySelector('input[name="theme"]:checked')?.value || 'dark';
        const logoInput = document.getElementById('site-logo');
        const previewImg = document.getElementById('logo-preview-img');
        
        let logo = AdminState.settings.logo || '';
        if (logoInput?.files[0]) {
            logo = await this.fileToBase64(logoInput.files[0]);
        } else if (previewImg?.src) {
            logo = previewImg.src;
        }
        
        AdminState.settings = { ...AdminState.settings, siteName, theme, logo };
        await this.saveData('settings');
        
        this.updateAdminInfo();
        Loading.hide();
        Toast.success('Saved', 'Settings saved successfully');
    }

    banCurrentUser() {
        if (AdminState.selectedUser) {
            this.banUser(AdminState.selectedUser.id);
            Modal.close('user-details-modal');
        }
    }

    async banUser(userId) {
        if (!confirm('Ban this user?')) return;
        
        Loading.show('Banning user...');
        
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
        
        Loading.hide();
        Toast.success('Banned', 'User has been banned');
    }
}

// ============================================
// Initialize
// ============================================

let adminPanel = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, starting admin panel...');
    adminPanel = new AdminPanel();
    adminPanel.init();
    window.adminPanel = adminPanel;
});

// Export for user dashboard
window.JSONBinDB = JSONBinDB;
window.CONFIG = CONFIG;

console.log('✅ Admin.js v3.0.0 loaded (JSONBin Integration)');
