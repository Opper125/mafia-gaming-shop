/* ============================================
   MAFIA GAMING SHOP - ADMIN PANEL
   Version: 2.0.1 (Fixed Duplicate Error)
   ============================================ */

// ============================================
// Configuration
// ============================================

const ADMIN_ID = 1538232799;
const ADMIN_ID_STR = '1538232799';

// ============================================
// Admin State
// ============================================

const AdminState = {
    user: null,
    isAdmin: false,
    initialized: false,
    currentPage: 'dashboard',
    
    // Data
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
// Admin Storage Helper (with prefix)
// Using different name to avoid conflict with utils.js
// ============================================

const AdminStorage = {
    prefix: 'mafia_',
    
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (e) {
            console.error('Storage remove error:', e);
        }
    }
};

// ============================================
// Use Toast, Loading, Modal, Format, FileUpload from utils.js
// They are already loaded before admin.js
// ============================================

// Initialize Toast if not already done
if (typeof Toast !== 'undefined' && Toast.init) {
    // Toast is available from utils.js
    console.log('✅ Using Toast from utils.js');
} else {
    console.warn('⚠️ Toast not found in utils.js');
}

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
            console.log('📱 initDataUnsafe:', tg.initDataUnsafe);
            
            // Step 3: Get user
            const user = tg.initDataUnsafe?.user;
            
            if (!user) {
                console.error('❌ No user data');
                this.showAccessDenied('Could not get user data from Telegram.');
                return;
            }
            
            AdminState.user = user;
            console.log('👤 User:', user);
            console.log('👤 User ID:', user.id, 'Type:', typeof user.id);
            
            // Step 4: Check if admin
            const userId = user.id;
            const isAdmin = (userId === ADMIN_ID) || (userId === ADMIN_ID_STR) || (String(userId) === ADMIN_ID_STR);
            
            console.log(`🔐 Admin check: userId=${userId}, ADMIN_ID=${ADMIN_ID}, isAdmin=${isAdmin}`);
            
            if (!isAdmin) {
                console.error('❌ Not admin');
                this.showAccessDenied(`Access Denied. Your ID (${userId}) is not authorized.`);
                return;
            }
            
            AdminState.isAdmin = true;
            console.log('✅ Admin verified!');
            
            // Step 5: Skip 2FA verification and show admin panel directly
            await this.showAdminPanel();
            
        } catch (error) {
            console.error('❌ Init error:', error);
            this.showAccessDenied('Initialization failed: ' + error.message);
        }
    }

    showAccessDenied(message = '') {
        console.log('🚫 Showing access denied:', message);
        
        // Hide all screens
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        document.getElementById('admin-panel')?.classList.add('hidden');
        
        // Show access denied
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
        
        // Hide other screens
        document.getElementById('admin-access-denied')?.classList.add('hidden');
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        
        // Show admin panel
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.classList.remove('hidden');
        }
        
        // Update admin info
        this.updateAdminInfo();
        
        // Load data
        await this.loadAllData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load dashboard
        this.loadDashboard();
        
        AdminState.initialized = true;
        console.log('✅ Admin panel ready!');
    }

    updateAdminInfo() {
        const user = AdminState.user;
        if (!user) return;
        
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Admin';
        
        // Update header
        const nameEl = document.getElementById('admin-name');
        if (nameEl) nameEl.textContent = fullName;
        
        const avatarEl = document.getElementById('admin-avatar');
        if (avatarEl) {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=8B5CF6&color=fff&size=128`;
        }
        
        // Update sidebar
        const sidebarLogo = document.getElementById('sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.src = AdminState.settings.logo || `https://ui-avatars.com/api/?name=MG&background=8B5CF6&color=fff&size=128`;
        }
        
        const sidebarName = document.getElementById('sidebar-site-name');
        if (sidebarName) sidebarName.textContent = AdminState.settings.siteName;
    }

    async loadAllData() {
        console.log('📦 Loading all data...');
        
        // Load from localStorage using AdminStorage (with prefix)
        AdminState.users = AdminStorage.get('users', []);
        AdminState.orders = AdminStorage.get('orders', []);
        AdminState.topupRequests = AdminStorage.get('topupRequests', []);
        AdminState.categories = AdminStorage.get('categories', []);
        AdminState.products = AdminStorage.get('products', []);
        AdminState.payments = AdminStorage.get('payments', []);
        AdminState.bannersType1 = AdminStorage.get('bannersType1', []);
        AdminState.bannersType2 = AdminStorage.get('bannersType2', []);
        AdminState.inputTables = AdminStorage.get('inputTables', []);
        AdminState.bannedUsers = AdminStorage.get('bannedUsers', []);
        AdminState.settings = AdminStorage.get('settings', AdminState.settings);
        
        // Calculate stats
        this.calculateStats();
        
        console.log('✅ Data loaded:', {
            users: AdminState.users.length,
            orders: AdminState.orders.length,
            categories: AdminState.categories.length,
            products: AdminState.products.length
        });
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
        
        // Update sidebar badges
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
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('admin-sidebar');
        
        menuToggle?.addEventListener('click', () => {
            sidebar?.classList.toggle('active');
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
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof Modal !== 'undefined') {
                    Modal.closeAll();
                }
            });
        });
        
        // Modal overlays
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                if (typeof Modal !== 'undefined') {
                    Modal.closeAll();
                }
            });
        });
        
        // Setup all forms
        this.setupForms();
        
        // Setup file uploads
        this.setupFileUploads();
        
        // Add buttons
        this.setupAddButtons();
        
        // Banner tabs
        this.setupBannerTabs();
        
        // User modal tabs
        this.setupUserModalTabs();
        
        // Order & Topup actions
        this.setupOrderActions();
        this.setupTopupActions();
        this.setupUserActions();
    }

    setupForms() {
        // Category form
        document.getElementById('category-form')?.addEventListener('submit', (e) => this.saveCategory(e));
        
        // Product form
        document.getElementById('product-form')?.addEventListener('submit', (e) => this.saveProduct(e));
        
        // Payment form
        document.getElementById('payment-form')?.addEventListener('submit', (e) => this.savePayment(e));
        
        // Banner form
        document.getElementById('banner-form')?.addEventListener('submit', (e) => this.saveBanner(e));
        
        // Input table form
        document.getElementById('input-table-form')?.addEventListener('submit', (e) => this.saveInputTable(e));
        
        // Announcement form
        document.getElementById('announcement-form')?.addEventListener('submit', (e) => this.saveAnnouncement(e));
        
        // Broadcast form
        document.getElementById('broadcast-form')?.addEventListener('submit', (e) => this.sendBroadcast(e));
        
        // Settings form
        document.getElementById('settings-form')?.addEventListener('submit', (e) => this.saveSettings(e));
        
        // Discount checkbox
        document.getElementById('product-has-discount')?.addEventListener('change', (e) => {
            const fields = document.getElementById('discount-fields');
            if (fields) fields.classList.toggle('hidden', !e.target.checked);
        });
        
        // Discount calculation
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
            const inputEl = document.getElementById(input);
            const previewEl = document.getElementById(preview);
            const imgEl = document.getElementById(img);
            const contentEl = document.querySelector(content);
            
            inputEl?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        // Use FileUpload from utils.js if available
                        let base64;
                        if (typeof FileUpload !== 'undefined' && FileUpload.toBase64) {
                            base64 = await FileUpload.toBase64(file);
                        } else {
                            // Fallback
                            base64 = await this.fileToBase64(file);
                        }
                        if (imgEl) imgEl.src = base64;
                        previewEl?.classList.remove('hidden');
                        contentEl?.classList.add('hidden');
                    } catch (err) {
                        console.error('File upload error:', err);
                    }
                }
            });
        });
        
        // Remove file buttons
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = btn.closest('.file-upload');
                if (container) {
                    const input = container.querySelector('input[type="file"]');
                    const preview = container.querySelector('.file-preview');
                    const content = container.querySelector('.file-upload-content');
                    if (input) input.value = '';
                    preview?.classList.add('hidden');
                    content?.classList.remove('hidden');
                }
            });
        });
    }

    // Fallback file to base64 converter
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
                const tabContent = document.getElementById(`${btn.dataset.tab}-tab`);
                tabContent?.classList.remove('hidden');
            });
        });
    }

    setupOrderActions() {
        document.getElementById('approve-order-btn')?.addEventListener('click', () => this.approveOrder());
        document.getElementById('reject-order-btn')?.addEventListener('click', () => this.rejectOrder());
        document.getElementById('close-order-modal')?.addEventListener('click', () => {
            if (typeof Modal !== 'undefined') Modal.close('order-details-modal');
        });
    }

    setupTopupActions() {
        document.getElementById('approve-topup-btn')?.addEventListener('click', () => this.approveTopup());
        document.getElementById('reject-topup-btn')?.addEventListener('click', () => this.rejectTopup());
        document.getElementById('close-topup-request-modal')?.addEventListener('click', () => {
            if (typeof Modal !== 'undefined') Modal.close('topup-request-modal');
        });
    }

    setupUserActions() {
        document.getElementById('add-balance-btn')?.addEventListener('click', () => this.adjustBalance('add'));
        document.getElementById('deduct-balance-btn')?.addEventListener('click', () => this.adjustBalance('deduct'));
        document.getElementById('ban-user-btn')?.addEventListener('click', () => this.banCurrentUser());
        document.getElementById('close-user-modal')?.addEventListener('click', () => {
            if (typeof Modal !== 'undefined') Modal.close('user-details-modal');
        });
    }

    // ============================================
    // Navigation
    // ============================================

    navigateTo(page) {
        console.log('📍 Navigate to:', page);
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        // Update pages
        document.querySelectorAll('.admin-page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });
        
        // Close sidebar on mobile
        document.getElementById('admin-sidebar')?.classList.remove('active');
        
        AdminState.currentPage = page;
        
        // Load page content
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
            case 'broadcast': this.loadBroadcast(); break;
            case 'banned-users': this.loadBannedUsers(); break;
            case 'settings': this.loadSettings(); break;
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add-category':
                this.navigateTo('categories');
                setTimeout(() => this.openCategoryModal(), 100);
                break;
            case 'add-product':
                this.navigateTo('products');
                setTimeout(() => this.openProductModal(), 100);
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
    // Helper method to format currency
    // Uses Format from utils.js if available
    // ============================================
    
    formatCurrency(amount, currency = 'MMK') {
        if (typeof Format !== 'undefined' && Format.currency) {
            return Format.currency(amount, currency);
        }
        return `${Number(amount || 0).toLocaleString()} ${currency}`;
    }

    formatDate(dateStr, type = 'short') {
        if (typeof Format !== 'undefined' && Format.date) {
            return Format.date(dateStr, type);
        }
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // ============================================
    // Dashboard
    // ============================================

    loadDashboard() {
        console.log('📊 Loading dashboard...');
        
        // Update stats
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
    // Users
    // ============================================

    loadUsers() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        
        const users = AdminState.users;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-lg">No users yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
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
                        <button class="btn-delete" onclick="adminPanel.banUser('${user.id}')"><i class="fas fa-ban"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Setup search
        this.setupUserSearch();
        this.setupUserFilters();
    }

    setupUserSearch() {
        const search = document.getElementById('search-users');
        search?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('#users-tbody tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    setupUserFilters() {
        document.querySelectorAll('#page-users .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#page-users .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('#users-tbody tr').forEach(row => {
                    const isPremium = row.querySelector('.status-badge.premium');
                    if (filter === 'all') row.style.display = '';
                    else if (filter === 'premium') row.style.display = isPremium ? '' : 'none';
                    else row.style.display = isPremium ? 'none' : '';
                });
            });
        });
    }

    viewUser(userId) {
        const user = AdminState.users.find(u => String(u.id) === String(userId));
        if (!user) return;
        
        AdminState.selectedUser = user;
        
        const orders = AdminState.orders.filter(o => String(o.userId) === String(userId));
        const topups = AdminState.topupRequests.filter(t => String(t.userId) === String(userId));
        
        document.getElementById('modal-user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'U')}&background=8B5CF6&color=fff&size=128`;
        document.getElementById('modal-user-name').textContent = `${user.firstName || ''} ${user.lastName || ''}`;
        document.getElementById('modal-user-username').textContent = `@${user.username || 'N/A'}`;
        document.getElementById('modal-premium-badge').style.display = user.isPremium ? 'inline-flex' : 'none';
        document.getElementById('modal-balance').textContent = this.formatCurrency(user.balance || 0);
        document.getElementById('modal-total-orders').textContent = orders.length;
        document.getElementById('modal-approved').textContent = orders.filter(o => o.status === 'approved').length;
        document.getElementById('modal-rejected').textContent = orders.filter(o => o.status === 'rejected').length;
        document.getElementById('modal-total-topup').textContent = this.formatCurrency(topups.filter(t => t.status === 'approved').reduce((s, t) => s + (t.amount || 0), 0));
        document.getElementById('modal-joined').textContent = this.formatDate(user.joinedAt);
        
        // Orders list
        document.getElementById('user-orders-list').innerHTML = orders.length ? orders.slice(0, 10).map(o => `
            <div class="mini-table-item">
                <span>${o.productName || 'Product'}</span>
                <span class="status-badge ${o.status}">${o.status}</span>
            </div>
        `).join('') : '<p class="text-muted">No orders</p>';
        
        // Topups list
        document.getElementById('user-topups-list').innerHTML = topups.length ? topups.slice(0, 10).map(t => `
            <div class="mini-table-item">
                <span>${this.formatCurrency(t.amount)}</span>
                <span class="status-badge ${t.status}">${t.status}</span>
            </div>
        `).join('') : '<p class="text-muted">No topups</p>';
        
        if (typeof Modal !== 'undefined') Modal.open('user-details-modal');
    }

    adjustBalance(operation) {
        if (!AdminState.selectedUser) return;
        
        const amountInput = document.getElementById('adjust-balance-amount');
        const amount = parseFloat(amountInput?.value || 0);
        
        if (!amount || amount <= 0) {
            if (typeof Toast !== 'undefined') Toast.warning('Invalid Amount', 'Please enter a valid amount');
            return;
        }
        
        const user = AdminState.users.find(u => u.id === AdminState.selectedUser.id);
        if (!user) return;
        
        if (operation === 'add') {
            user.balance = (user.balance || 0) + amount;
        } else {
            user.balance = Math.max(0, (user.balance || 0) - amount);
        }
        
        AdminStorage.set('users', AdminState.users);
        
        document.getElementById('modal-balance').textContent = this.formatCurrency(user.balance);
        if (amountInput) amountInput.value = '';
        
        if (typeof Toast !== 'undefined') Toast.success('Success', `Balance ${operation === 'add' ? 'added' : 'deducted'} successfully`);
    }

    banUser(userId) {
        if (!confirm('Are you sure you want to ban this user?')) return;
        
        const user = AdminState.users.find(u => String(u.id) === String(userId));
        if (!user) return;
        
        AdminState.bannedUsers.push({
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            reason: 'Banned by admin',
            bannedAt: new Date().toISOString()
        });
        
        AdminStorage.set('bannedUsers', AdminState.bannedUsers);
        if (typeof Toast !== 'undefined') Toast.success('User Banned', 'User has been banned successfully');
        this.loadUsers();
    }

    banCurrentUser() {
        if (AdminState.selectedUser) {
            this.banUser(AdminState.selectedUser.id);
            if (typeof Modal !== 'undefined') Modal.close('user-details-modal');
        }
    }

    // ============================================
    // Orders
    // ============================================

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
                    <div class="admin-order-user">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(order.userName || 'U')}&background=8B5CF6&color=fff" alt="">
                        <div class="info">
                            <span class="name">${order.userName || 'User'}</span>
                            <span class="id">ID: ${order.userId}</span>
                        </div>
                    </div>
                    <div class="admin-order-product">
                        <div class="info">
                            <span class="name">${order.productName || 'Product'}</span>
                            <span class="price">${this.formatCurrency(order.price, order.currency)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.setupOrderFilters();
    }

    setupOrderFilters() {
        document.querySelectorAll('#page-orders .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#page-orders .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('.admin-order-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
                });
            });
        });
    }

    viewOrder(orderId) {
        const order = AdminState.orders.find(o => o.id === orderId);
        if (!order) return;
        
        AdminState.selectedOrder = order;
        
        document.getElementById('order-id').textContent = order.id;
        document.getElementById('order-status').textContent = order.status;
        document.getElementById('order-status').className = `value status ${order.status}`;
        document.getElementById('order-date').textContent = this.formatDate(order.createdAt, 'datetime');
        document.getElementById('order-user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.userName || 'U')}&background=8B5CF6&color=fff`;
        document.getElementById('order-user-name').textContent = order.userName || 'User';
        document.getElementById('order-user-id').textContent = `ID: ${order.userId}`;
        document.getElementById('order-product-icon').src = order.productIcon || 'https://ui-avatars.com/api/?name=P&background=6366F1&color=fff';
        document.getElementById('order-product-name').textContent = order.productName || 'Product';
        document.getElementById('order-product-amount').textContent = order.amount || '';
        document.getElementById('order-product-price').textContent = this.formatCurrency(order.price, order.currency);
        
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
        
        // Show/hide actions based on status
        document.getElementById('order-actions').style.display = order.status === 'pending' ? 'flex' : 'none';
        
        if (typeof Modal !== 'undefined') Modal.open('order-details-modal');
    }

    async approveOrder() {
        if (!AdminState.selectedOrder) return;
        
        const order = AdminState.orders.find(o => o.id === AdminState.selectedOrder.id);
        if (!order) return;
        
        order.status = 'approved';
        order.updatedAt = new Date().toISOString();
        
        // Update user stats
        const user = AdminState.users.find(u => String(u.id) === String(order.userId));
        if (user) {
            user.completedOrders = (user.completedOrders || 0) + 1;
            AdminStorage.set('users', AdminState.users);
        }
        
        AdminStorage.set('orders', AdminState.orders);
        this.calculateStats();
        
        if (typeof Modal !== 'undefined') Modal.close('order-details-modal');
        if (typeof Toast !== 'undefined') Toast.success('Order Approved', 'Order has been approved successfully');
        this.loadOrders();
    }

    async rejectOrder() {
        if (!AdminState.selectedOrder) return;
        if (!confirm('Reject this order? The amount will be refunded.')) return;
        
        const order = AdminState.orders.find(o => o.id === AdminState.selectedOrder.id);
        if (!order) return;
        
        order.status = 'rejected';
        order.updatedAt = new Date().toISOString();
        
        // Refund user
        const user = AdminState.users.find(u => String(u.id) === String(order.userId));
        if (user) {
            user.balance = (user.balance || 0) + (order.price || 0);
            user.rejectedOrders = (user.rejectedOrders || 0) + 1;
            AdminStorage.set('users', AdminState.users);
        }
        
        AdminStorage.set('orders', AdminState.orders);
        this.calculateStats();
        
        if (typeof Modal !== 'undefined') Modal.close('order-details-modal');
        if (typeof Toast !== 'undefined') Toast.success('Order Rejected', 'Order rejected and amount refunded');
        this.loadOrders();
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
        
        container.innerHTML = topups.map(topup => `
            <div class="topup-request-card" data-topup-id="${topup.id}" data-status="${topup.status}" onclick="adminPanel.viewTopup('${topup.id}')">
                <div class="topup-request-header">
                    <span class="order-id">${topup.id}</span>
                    <span class="order-status ${topup.status}">${topup.status}</span>
                </div>
                <div class="topup-request-body">
                    <div class="topup-user-info">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(topup.userName || 'U')}&background=8B5CF6&color=fff" alt="">
                        <div class="info">
                            <span class="name">${topup.userName || 'User'}</span>
                            <span class="id">ID: ${topup.userId}</span>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px;font-weight:700;color:var(--success);">${this.formatCurrency(topup.amount)}</div>
                        <div style="font-size:12px;color:var(--text-tertiary);">${this.formatDate(topup.createdAt, 'relative')}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.setupTopupFilters();
    }

    setupTopupFilters() {
        document.querySelectorAll('#page-topup-requests .filter-btn, .topup-filter .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.closest('.topup-filter') || document.querySelector('#page-topup-requests');
                parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('.topup-request-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
                });
            });
        });
    }

    viewTopup(topupId) {
        const topup = AdminState.topupRequests.find(t => t.id === topupId);
        if (!topup) return;
        
        AdminState.selectedTopup = topup;
        
        document.getElementById('topup-user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topup.userName || 'U')}&background=8B5CF6&color=fff`;
        document.getElementById('topup-user-name').textContent = topup.userName || 'User';
        document.getElementById('topup-user-id').textContent = `ID: ${topup.userId}`;
        document.getElementById('topup-amount-value').textContent = this.formatCurrency(topup.amount);
        document.getElementById('topup-payment-method').textContent = topup.paymentMethod || '-';
        document.getElementById('topup-date').textContent = this.formatDate(topup.createdAt, 'datetime');
        document.getElementById('topup-status').textContent = topup.status;
        document.getElementById('topup-status').className = `value status ${topup.status}`;
        document.getElementById('topup-screenshot').src = topup.screenshot || '';
        
        document.getElementById('topup-actions').style.display = topup.status === 'pending' ? 'flex' : 'none';
        
        if (typeof Modal !== 'undefined') Modal.open('topup-request-modal');
    }

    async approveTopup() {
        if (!AdminState.selectedTopup) return;
        
        const topup = AdminState.topupRequests.find(t => t.id === AdminState.selectedTopup.id);
        if (!topup) return;
        
        topup.status = 'approved';
        topup.updatedAt = new Date().toISOString();
        
        // Add balance to user
        const user = AdminState.users.find(u => String(u.id) === String(topup.userId));
        if (user) {
            user.balance = (user.balance || 0) + (topup.amount || 0);
            user.totalTopup = (user.totalTopup || 0) + (topup.amount || 0);
            AdminStorage.set('users', AdminState.users);
        }
        
        AdminStorage.set('topupRequests', AdminState.topupRequests);
        this.calculateStats();
        
        if (typeof Modal !== 'undefined') Modal.close('topup-request-modal');
        if (typeof Toast !== 'undefined') Toast.success('Topup Approved', 'Balance added to user');
        this.loadTopupRequests();
    }

    async rejectTopup() {
        if (!AdminState.selectedTopup) return;
        if (!confirm('Reject this topup request?')) return;
        
        const topup = AdminState.topupRequests.find(t => t.id === AdminState.selectedTopup.id);
        if (!topup) return;
        
        topup.status = 'rejected';
        topup.updatedAt = new Date().toISOString();
        
        AdminStorage.set('topupRequests', AdminState.topupRequests);
        this.calculateStats();
        
        if (typeof Modal !== 'undefined') Modal.close('topup-request-modal');
        if (typeof Toast !== 'undefined') Toast.success('Topup Rejected', 'Request has been rejected');
        this.loadTopupRequests();
    }

    // ============================================
    // Categories
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
            const soldCount = AdminState.orders.filter(o => o.categoryId === cat.id && o.status === 'approved').length;
            
            return `
                <div class="admin-category-card" data-category-id="${cat.id}">
                    <div class="admin-category-icon">
                        ${cat.icon ? `<img src="${cat.icon}" alt="${cat.name}">` : '<i class="fas fa-gamepad" style="font-size:32px;color:var(--primary);"></i>'}
                        ${cat.flag ? `<span class="flag">${cat.flag}</span>` : ''}
                        ${cat.hasDiscount ? '<span class="discount-badge">SALE</span>' : ''}
                    </div>
                    <div class="admin-category-info">
                        <h4>${cat.name}</h4>
                        <span class="stats">${productCount} products • <span>${soldCount}</span> sold</span>
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
        const title = document.getElementById('category-modal-title');
        
        form?.reset();
        document.getElementById('category-id').value = categoryId || '';
        document.getElementById('category-icon-preview')?.classList.add('hidden');
        document.querySelector('#category-icon-upload .file-upload-content')?.classList.remove('hidden');
        
        title.textContent = categoryId ? 'Edit Category' : 'Add Category';
        
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
        
        if (typeof Modal !== 'undefined') Modal.open('category-modal');
    }

    editCategory(categoryId) {
        this.openCategoryModal(categoryId);
    }

    async saveCategory(e) {
        e.preventDefault();
        
        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value.trim();
        const flag = document.getElementById('category-flag').value;
        const hasDiscount = document.getElementById('category-has-discount').checked;
        const iconInput = document.getElementById('category-icon');
        const previewImg = document.getElementById('category-icon-img');
        
        if (!name) {
            if (typeof Toast !== 'undefined') Toast.warning('Required', 'Please enter category name');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            if (typeof FileUpload !== 'undefined' && FileUpload.toBase64) {
                icon = await FileUpload.toBase64(iconInput.files[0]);
            } else {
                icon = await this.fileToBase64(iconInput.files[0]);
            }
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
        
        AdminStorage.set('categories', AdminState.categories);
        if (typeof Modal !== 'undefined') Modal.close('category-modal');
        if (typeof Toast !== 'undefined') Toast.success('Success', 'Category saved successfully');
        this.loadCategories();
    }

    deleteCategory(categoryId) {
        const products = AdminState.products.filter(p => p.categoryId === categoryId);
        if (products.length > 0) {
            if (typeof Toast !== 'undefined') Toast.warning('Cannot Delete', `This category has ${products.length} products. Delete products first.`);
            return;
        }
        
        if (!confirm('Delete this category?')) return;
        
        AdminState.categories = AdminState.categories.filter(c => c.id !== categoryId);
        AdminStorage.set('categories', AdminState.categories);
        if (typeof Toast !== 'undefined') Toast.success('Deleted', 'Category deleted successfully');
        this.loadCategories();
    }

    // ============================================
    // Products
    // ============================================

    loadProducts() {
        const container = document.getElementById('admin-products');
        const filterSelect = document.getElementById('filter-product-category');
        
        // Load category filter
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
                        <div class="admin-product-badges">
                            ${product.hasDiscount ? `<span class="badge" style="background:var(--danger);color:white;">-${product.discount}%</span>` : ''}
                            ${!product.active ? '<span class="badge" style="background:var(--text-tertiary);color:white;">Inactive</span>' : ''}
                        </div>
                    </div>
                    <div class="admin-product-info">
                        <div class="category-tag">${category?.name || 'Unknown'}</div>
                        <h4>${product.name}</h4>
                        <div class="price-row">
                            <span class="price-current">${this.formatCurrency(discountedPrice, product.currency)}</span>
                            ${product.hasDiscount ? `<span class="price-original">${this.formatCurrency(product.price, product.currency)}</span>` : ''}
                        </div>
                        <div class="admin-product-actions">
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
        const title = document.getElementById('product-modal-title');
        const categorySelect = document.getElementById('product-category');
        const discountFields = document.getElementById('discount-fields');
        
        form?.reset();
        document.getElementById('product-id').value = productId || '';
        document.getElementById('product-icon-preview')?.classList.add('hidden');
        discountFields?.classList.add('hidden');
        
        title.textContent = productId ? 'Edit Product' : 'Add Product';
        
        // Load categories
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
                    discountFields?.classList.remove('hidden');
                    document.getElementById('product-discount').value = product.discount || 0;
                    this.calculateDiscountedPrice();
                }
                
                if (product.icon) {
                    document.getElementById('product-icon-img').src = product.icon;
                    document.getElementById('product-icon-preview')?.classList.remove('hidden');
                }
            }
        }
        
        if (typeof Modal !== 'undefined') Modal.open('product-modal');
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
            if (typeof Toast !== 'undefined') Toast.warning('Required', 'Please fill all required fields');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            if (typeof FileUpload !== 'undefined' && FileUpload.toBase64) {
                icon = await FileUpload.toBase64(iconInput.files[0]);
            } else {
                icon = await this.fileToBase64(iconInput.files[0]);
            }
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
        
        AdminStorage.set('products', AdminState.products);
        if (typeof Modal !== 'undefined') Modal.close('product-modal');
        if (typeof Toast !== 'undefined') Toast.success('Success', 'Product saved successfully');
        this.loadProducts();
    }

    deleteProduct(productId) {
        if (!confirm('Delete this product?')) return;
        
        AdminState.products = AdminState.products.filter(p => p.id !== productId);
        AdminStorage.set('products', AdminState.products);
        if (typeof Toast !== 'undefined') Toast.success('Deleted', 'Product deleted successfully');
        this.loadProducts();
    }

    // ============================================
    // Payment Methods
    // ============================================

    loadPayments() {
        const container = document.getElementById('admin-payments');
        if (!container) return;
        
        if (AdminState.payments.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-credit-card"></i><p>No payment methods yet. Click "Add Payment" to create one.</p></div>';
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
        const title = document.getElementById('payment-modal-title');
        
        form?.reset();
        document.getElementById('payment-id').value = paymentId || '';
        document.getElementById('payment-icon-preview')?.classList.add('hidden');
        document.querySelector('#payment-icon-upload .file-upload-content')?.classList.remove('hidden');
        
        title.textContent = paymentId ? 'Edit Payment Method' : 'Add Payment Method';
        
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
        
        if (typeof Modal !== 'undefined') Modal.open('payment-modal');
    }

    editPayment(paymentId) {
        this.openPaymentModal(paymentId);
    }

    async savePayment(e) {
        e.preventDefault();
        
        const id = document.getElementById('payment-id').value;
        const name = document.getElementById('payment-name').value.trim();
        const address = document.getElementById('payment-address').value.trim();
        const holder = document.getElementById('payment-holder').value.trim();
        const note = document.getElementById('payment-note').value.trim();
        const active = document.getElementById('payment-active').checked;
        const iconInput = document.getElementById('payment-icon');
        const previewImg = document.getElementById('payment-icon-img');
        
        if (!name || !address || !holder) {
            if (typeof Toast !== 'undefined') Toast.warning('Required', 'Please fill all required fields');
            return;
        }
        
        let icon = previewImg?.src || '';
        if (iconInput?.files[0]) {
            if (typeof FileUpload !== 'undefined' && FileUpload.toBase64) {
                icon = await FileUpload.toBase64(iconInput.files[0]);
            } else {
                icon = await this.fileToBase64(iconInput.files[0]);
            }
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
        
        AdminStorage.set('payments', AdminState.payments);
        if (typeof Modal !== 'undefined') Modal.close('payment-modal');
        if (typeof Toast !== 'undefined') Toast.success('Success', 'Payment method saved successfully');
        this.loadPayments();
    }

    deletePayment(paymentId) {
        if (!confirm('Delete this payment method?')) return;
        
        AdminState.payments = AdminState.payments.filter(p => p.id !== paymentId);
        AdminStorage.set('payments', AdminState.payments);
        if (typeof Toast !== 'undefined') Toast.success('Deleted', 'Payment method deleted successfully');
        this.loadPayments();
    }

    // ============================================
    // Banners
    // ============================================

    loadBanners() {
        // Type 1 banners
        const type1Container = document.getElementById('type1-banners');
        if (type1Container) {
            if (AdminState.bannersType1.length === 0) {
                type1Container.innerHTML = '<p class="text-muted">No home banners yet. Click "Add Banner" to create one.</p>';
            } else {
                type1Container.innerHTML = AdminState.bannersType1.map(b => `
                    <div class="banner-card" data-banner-id="${b.id}">
                        <img src="${b.image}" alt="Banner" class="banner-card-image">
                        <div class="banner-card-actions">
                            <button class="edit-btn" onclick="adminPanel.editBanner('${b.id}', 'type1')"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" onclick="adminPanel.deleteBanner('${b.id}', 'type1')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Type 2 banners
        const type2Container = document.getElementById('type2-banners');
        if (type2Container) {
            if (AdminState.bannersType2.length === 0) {
                type2Container.innerHTML = '<p class="text-muted">No category banners yet. Click "Add Banner" to create one.</p>';
            } else {
                type2Container.innerHTML = AdminState.bannersType2.map(b => {
                    const cat = AdminState.categories.find(c => c.id === b.categoryId);
                    return `
                        <div class="banner-list-item" data-banner-id="${b.id}">
                            <img src="${b.image}" alt="Banner" class="banner-list-item-image">
                            <div class="banner-list-item-content">
                                <span class="category-tag">${cat?.name || 'Unknown'}</span>
                                <p>${(b.instructions || '').substring(0, 100)}${(b.instructions || '').length > 100 ? '...' : ''}</p>
                            </div>
                            <div class="banner-list-item-actions">
                                <button class="btn-view" onclick="adminPanel.editBanner('${b.id}', 'type2')"><i class="fas fa-edit"></i></button>
                                <button class="btn-delete" onclick="adminPanel.deleteBanner('${b.id}', 'type2')"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    openBannerModal(type, bannerId = null) {
        const form = document.getElementById('banner-form');
        const title = document.getElementById('banner-modal-title');
        const categoryGroup = document.getElementById('banner-category-group');
        const instructionsGroup = document.getElementById('banner-instructions-group');
        const categorySelect = document.getElementById('banner-category');
        
        form?.reset();
        document.getElementById('banner-id').value = bannerId || '';
        document.getElementById('banner-type').value = type;
        document.getElementById('banner-preview')?.classList.add('hidden');
        document.querySelector('#banner-file-upload .file-upload-content')?.classList.remove('hidden');
        
        title.textContent = bannerId ? 'Edit Banner' : 'Add Banner';
        
        categoryGroup.style.display = type === 'type2' ? 'block' : 'none';
        instructionsGroup.style.display = type === 'type2' ? 'block' : 'none';
        
        if (type === 'type2' && categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>' +
                AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        if (bannerId) {
            const banners = type === 'type1' ? AdminState.bannersType1 : AdminState.bannersType2;
            const banner = banners.find(b => b.id === bannerId);
            if (banner) {
                if (banner.image) {
                    document.getElementById('banner-preview-img').src = banner.image;
                    document.getElementById('banner-preview')?.classList.remove('hidden');
                    document.querySelector('#banner-file-upload .file-upload-content')?.classList.add('hidden');
                }
                if (type === 'type2') {
                    if (categorySelect) categorySelect.value = banner.categoryId || '';
                    document.getElementById('banner-instructions').value = banner.instructions || '';
                }
            }
        }
        
        if (typeof Modal !== 'undefined') Modal.open('add-banner-modal');
    }

    editBanner(bannerId, type) {
        this.openBannerModal(type, bannerId);
    }

    async saveBanner(e) {
        e.preventDefault();
        
        const id = document.getElementById('banner-id').value;
        const type = document.getElementById('banner-type').value;
        const imageInput = document.getElementById('banner-image');
        const previewImg = document.getElementById('banner-preview-img');
        
        let image = previewImg?.src || '';
        if (imageInput?.files[0]) {
            if (typeof FileUpload !== 'undefined' && FileUpload.toBase64) {
                image = await FileUpload.toBase64(imageInput.files[0]);
            } else {
                image = await this.fileToBase64(imageInput.files[0]);
            }
        }
        
        if (!image) {
            if (typeof Toast !== 'undefined') Toast.warning('Required', 'Please upload a banner image');
            return;
        }
        
        const bannerData = {
            id: id || 'banner_' + Date.now(),
            image,
            updatedAt: new Date().toISOString()
        };
        
        if (type === 'type2') {
            bannerData.categoryId = document.getElementById('banner-category').value;
            bannerData.instructions = document.getElementById('banner-instructions').value;
            
            if (!bannerData.categoryId) {
                if (typeof Toast !== 'undefined') Toast.warning('Required', 'Please select a category');
                return;
            }
        }
        
        const banners = type === 'type1' ? AdminState.bannersType1 : AdminState.bannersType2;
        const storageKey = type === 'type1' ? 'bannersType1' : 'bannersType2';
        
        if (id) {
            const index = banners.findIndex(b => b.id === id);
            if (index !== -1) {
                banners[index] = { ...banners[index], ...bannerData };
            }
        } else {
            bannerData.createdAt = new Date().toISOString();
            banners.push(bannerData);
        }
        
        AdminStorage.set(storageKey, banners);
        if (typeof Modal !== 'undefined') Modal.close('add-banner-modal');
        if (typeof Toast !== 'undefined') Toast.success('Success', 'Banner saved successfully');
        this.loadBanners();
    }

    deleteBanner(bannerId, type) {
        if (!confirm('Delete this banner?')) return;
        
        if (type === 'type1') {
            AdminState.bannersType1 = AdminState.bannersType1.filter(b => b.id !== bannerId);
            AdminStorage.set('bannersType1', AdminState.bannersType1);
        } else {
            AdminState.bannersType2 = AdminState.bannersType2.filter(b => b.id !== bannerId);
            AdminStorage.set('bannersType2', AdminState.bannersType2);
        }
        
        if (typeof Toast !== 'undefined') Toast.success('Deleted', 'Banner deleted successfully');
        this.loadBanners();
    }

    // ============================================
    // Input Tables
    // ============================================

    loadInputTables() {
        const container = document.getElementById('admin-input-tables');
        if (!container) return;
        
        if (AdminState.inputTables.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-keyboard"></i><p>No input tables yet. Click "Add Input Table" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.inputTables.map(table => {
            const cat = AdminState.categories.find(c => c.id === table.categoryId);
            return `
                <div class="input-table-card" data-table-id="${table.id}">
                    <div class="input-table-icon"><i class="fas fa-keyboard"></i></div>
                    <div class="input-table-info">
                        <h4>${table.name}</h4>
                        <div class="meta">
                            <span><i class="fas fa-folder"></i> ${cat?.name || 'Unknown'}</span>
                            <span><i class="fas fa-asterisk"></i> ${table.required ? 'Required' : 'Optional'}</span>
                        </div>
                    </div>
                    <div class="input-table-actions">
                        <button class="btn-view" onclick="adminPanel.editInputTable('${table.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="adminPanel.deleteInputTable('${table.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openInputTableModal(tableId = null) {
        const form = document.getElementById('input-table-form');
        const title = document.getElementById('input-table-modal-title');
        const categorySelect = document.getElementById('input-table-category');
        
        form?.reset();
        document.getElementById('input-table-id').value = tableId || '';
        
        title.textContent = tableId ? 'Edit Input Table' : 'Add Input Table';
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Choose Category</option>' +
                AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        if (tableId) {
            const table = AdminState.inputTables.find(t => t.id === tableId);
            if (table) {
                document.getElementById('input-table-category').value = table.categoryId || '';
                document.getElementById('input-table-name').value = table.name || '';
                document.getElementById('input-table-placeholder').value = table.placeholder || '';
                document.getElementById('input-table-required').checked = table.required !== false;
            }
        }
        
        if (typeof Modal !== 'undefined') Modal.open('input-table-modal');
    }

    editInputTable(tableId) {
        this.openInputTableModal(tableId);
    }

    async saveInputTable(e) {
        e.preventDefault();
        
        const id = document.getElementById('input-table-id').value;
        const categoryId = document.getElementById('input-table-category').value;
        const name = document.getElementById('input-table-name').value.trim();
        const placeholder = document.getElementById('input-table-placeholder').value.trim();
        const required = document.getElementById('input-table-required').checked;
        
        if (!categoryId || !name) {
            if (typeof Toast !== 'undefined') Toast.warning('Required', 'Please fill all required fields');
            return;
        }
        
        const tableData = {
            id: id || 'input_' + Date.now(),
            categoryId,
            name,
            placeholder,
            required,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            const index = AdminState.inputTables.findIndex(t => t.id === id);
            if (index !== -1) {
                AdminState.inputTables[index] = { ...AdminState.inputTables[index], ...tableData };
            }
        } else {
            tableData.createdAt = new Date().toISOString();
            AdminState.inputTables.push(tableData);
        }
        
        AdminStorage.set('inputTables', AdminState.inputTables);
        if (typeof Modal !== 'undefined') Modal.close('input-table-modal');
        if (typeof Toast !== 'undefined') Toast.success('Success', 'Input table saved successfully');
        this.loadInputTables();
    }

    deleteInputTable(tableId) {
        if (!confirm('Delete this input table?')) return;
        
        AdminState.inputTables = AdminState.inputTables.filter(t => t.id !== tableId);
        AdminStorage.set('inputTables', AdminState.inputTables);
        if (typeof Toast !== 'undefined') Toast.success('Deleted', 'Input table deleted successfully');
        this.loadInputTables();
    }

    // ============================================
    // Announcements, Broadcast, Banned Users, Settings
    // ============================================

    loadAnnouncements() {
        document.getElementById('announcement-text').value = AdminState.settings.announcement || '';
        document.getElementById('announcement-preview').innerHTML = `<p>${AdminState.settings.announcement || 'No announcement set'}</p>`;
    }

    async saveAnnouncement(e) {
        e.preventDefault();
        const text = document.getElementById('announcement-text').value.trim();
        
        AdminState.settings.announcement = text;
        AdminStorage.set('settings', AdminState.settings);
        
        document.getElementById('announcement-preview').innerHTML = `<p>${text || 'No announcement set'}</p>`;
        if (typeof Toast !== 'undefined') Toast.success('Saved', 'Announcement updated successfully');
    }

    loadBroadcast() {
        document.getElementById('broadcast-count').textContent = AdminState.users.length;
    }

    async sendBroadcast(e) {
        e.preventDefault();
        const message = document.getElementById('broadcast-message').value.trim();
        
        if (!message) {
            if (typeof Toast !== 'undefined') Toast.warning('Required', 'Please enter a message');
            return;
        }
        
        if (!confirm(`Send this message to ${AdminState.users.length} users?`)) return;
        
        // In production, this would call the Telegram API
        if (typeof Loading !== 'undefined') Loading.show('Sending broadcast...');
        
        setTimeout(() => {
            if (typeof Loading !== 'undefined') Loading.hide();
            if (typeof Toast !== 'undefined') Toast.success('Sent', `Broadcast sent to ${AdminState.users.length} users`);
            document.getElementById('broadcast-form').reset();
        }, 2000);
    }

    loadBannedUsers() {
        const container = document.getElementById('banned-users-list');
        if (!container) return;
        
        if (AdminState.bannedUsers.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-user-check"></i><p>No banned users</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.bannedUsers.map(user => `
            <div class="banned-user-card" data-user-id="${user.id}">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'U')}&background=EF4444&color=fff" alt="" class="banned-user-avatar">
                <div class="banned-user-info">
                    <h4>${user.firstName || ''} ${user.lastName || ''} (@${user.username || 'N/A'})</h4>
                    <div class="reason">Reason: ${user.reason || 'No reason specified'}</div>
                    <div class="date">Banned: ${this.formatDate(user.bannedAt, 'datetime')}</div>
                </div>
                <button class="unban-btn" onclick="adminPanel.unbanUser('${user.id}')"><i class="fas fa-user-check"></i> Unban</button>
            </div>
        `).join('');
    }

    unbanUser(userId) {
        if (!confirm('Unban this user?')) return;
        
        AdminState.bannedUsers = AdminState.bannedUsers.filter(u => String(u.id) !== String(userId));
        AdminStorage.set('bannedUsers', AdminState.bannedUsers);
        if (typeof Toast !== 'undefined') Toast.success('Unbanned', 'User has been unbanned');
        this.loadBannedUsers();
    }

    loadSettings() {
        document.getElementById('site-name').value = AdminState.settings.siteName || 'Mafia Gaming Shop';
        
        if (AdminState.settings.logo) {
            document.getElementById('logo-preview-img').src = AdminState.settings.logo;
            document.getElementById('logo-preview')?.classList.remove('hidden');
        }
        
        const themeRadio = document.querySelector(`input[name="theme"][value="${AdminState.settings.theme || 'dark'}"]`);
        if (themeRadio) themeRadio.checked = true;
    }

    async saveSettings(e) {
        e.preventDefault();
        
        const siteName = document.getElementById('site-name').value.trim();
        const theme = document.querySelector('input[name="theme"]:checked')?.value || 'dark';
        const logoInput = document.getElementById('site-logo');
        const previewImg = document.getElementById('logo-preview-img');
        
        let logo = AdminState.settings.logo || '';
        if (logoInput?.files[0]) {
            if (typeof FileUpload !== 'undefined' && FileUpload.toBase64) {
                logo = await FileUpload.toBase64(logoInput.files[0]);
            } else {
                logo = await this.fileToBase64(logoInput.files[0]);
            }
        } else if (previewImg?.src && previewImg.src !== window.location.href) {
            logo = previewImg.src;
        }
        
        AdminState.settings = { ...AdminState.settings, siteName, theme, logo };
        AdminStorage.set('settings', AdminState.settings);
        
        this.updateAdminInfo();
        if (typeof Toast !== 'undefined') Toast.success('Saved', 'Settings saved successfully');
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

console.log('✅ Admin.js loaded (Fixed - No duplicate declarations)');
