/* ============================================
   MAFIA GAMING SHOP - ADMIN PANEL (FIXED)
   Version: 1.1.0
   ============================================ */

// ============================================
// Configuration
// ============================================

const ADMIN_CONFIG = {
    ADMIN_TELEGRAM_ID: '1538232799', // String for comparison
    ADMIN_TELEGRAM_ID_NUM: 1538232799, // Number for comparison
    DEBUG_MODE: true // Set to false in production
};

// ============================================
// Debug Logger
// ============================================

function debugLog(message, data = null) {
    if (!ADMIN_CONFIG.DEBUG_MODE) return;
    
    const debugEl = document.getElementById('debug-info');
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`[ADMIN ${timestamp}]`, message, data || '');
    
    if (debugEl) {
        debugEl.classList.add('show');
        debugEl.innerHTML += `<div>[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}</div>`;
        debugEl.scrollTop = debugEl.scrollHeight;
    }
}

function updateLoadingStatus(message) {
    const statusEl = document.getElementById('loading-status');
    if (statusEl) statusEl.textContent = message;
    debugLog(message);
}

// ============================================
// Admin State
// ============================================

const AdminState = {
    user: null,
    isAdmin: false,
    initialized: false,
    
    // Data
    users: [],
    orders: [],
    topupRequests: [],
    categories: [],
    products: [],
    payments: [],
    banners: [],
    inputTables: [],
    bannedUsers: [],
    settings: {
        siteName: 'Mafia Gaming Shop',
        announcement: ''
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
// Simple Data Storage (LocalStorage based)
// ============================================

const DataStore = {
    prefix: 'mafia_admin_',
    
    save(key, data) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
            return true;
        } catch (e) {
            debugLog('Save error:', e.message);
            return false;
        }
    },
    
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            debugLog('Load error:', e.message);
            return defaultValue;
        }
    },
    
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }
};

// ============================================
// Toast Notifications
// ============================================

const Toast = {
    show(type, title, message) {
        const container = document.getElementById('admin-toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },
    
    success(title, message) { this.show('success', title, message); },
    error(title, message) { this.show('error', title, message); },
    warning(title, message) { this.show('warning', title, message); },
    info(title, message) { this.show('info', title, message); }
};

// ============================================
// Admin Panel Class
// ============================================

class AdminPanel {
    constructor() {
        debugLog('AdminPanel constructor called');
    }

    async init() {
        debugLog('Starting admin initialization...');
        updateLoadingStatus('Checking Telegram WebApp...');
        
        try {
            // Step 1: Check Telegram WebApp
            if (!window.Telegram || !window.Telegram.WebApp) {
                throw new Error('Telegram WebApp not available');
            }
            
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            debugLog('Telegram WebApp ready');
            updateLoadingStatus('Getting user info...');
            
            // Step 2: Get user info
            const initDataUnsafe = tg.initDataUnsafe;
            debugLog('initDataUnsafe:', initDataUnsafe);
            
            if (!initDataUnsafe || !initDataUnsafe.user) {
                throw new Error('No user data from Telegram');
            }
            
            AdminState.user = initDataUnsafe.user;
            debugLog('User:', AdminState.user);
            
            // Step 3: Check if user is admin
            updateLoadingStatus('Verifying admin access...');
            
            const userId = String(AdminState.user.id);
            const adminId = ADMIN_CONFIG.ADMIN_TELEGRAM_ID;
            
            debugLog(`Comparing User ID: "${userId}" with Admin ID: "${adminId}"`);
            debugLog(`User ID type: ${typeof AdminState.user.id}, Admin ID type: ${typeof adminId}`);
            
            // Compare as strings
            AdminState.isAdmin = (userId === adminId) || 
                                 (AdminState.user.id === ADMIN_CONFIG.ADMIN_TELEGRAM_ID_NUM);
            
            debugLog('Is Admin:', AdminState.isAdmin);
            
            if (!AdminState.isAdmin) {
                this.showAccessDenied(`User ID ${userId} is not authorized. Admin ID is ${adminId}`);
                return;
            }
            
            // Step 4: Load data
            updateLoadingStatus('Loading data...');
            await this.loadData();
            
            // Step 5: Show admin panel
            updateLoadingStatus('Preparing dashboard...');
            this.showAdminPanel();
            
            // Step 6: Setup event listeners
            this.setupEventListeners();
            
            AdminState.initialized = true;
            debugLog('Admin panel initialized successfully!');
            
        } catch (error) {
            debugLog('Initialization error:', error.message);
            this.showAccessDenied(error.message);
        }
    }

    showAccessDenied(reason = '') {
        debugLog('Showing access denied:', reason);
        
        document.getElementById('admin-loading-screen')?.classList.add('hidden');
        document.getElementById('admin-panel')?.classList.add('hidden');
        
        const accessDenied = document.getElementById('admin-access-denied');
        if (accessDenied) {
            accessDenied.classList.remove('hidden');
            const messageEl = document.getElementById('access-denied-message');
            if (messageEl && reason) {
                messageEl.textContent = reason;
            }
        }
    }

    showAdminPanel() {
        debugLog('Showing admin panel');
        
        document.getElementById('admin-loading-screen')?.classList.add('hidden');
        document.getElementById('admin-access-denied')?.classList.add('hidden');
        
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('hidden');
        }
        
        // Update admin info in header
        this.updateAdminInfo();
        
        // Load dashboard
        this.loadDashboard();
        
        // Hide debug after 5 seconds
        setTimeout(() => {
            const debugEl = document.getElementById('debug-info');
            if (debugEl) debugEl.classList.remove('show');
        }, 5000);
    }

    updateAdminInfo() {
        const user = AdminState.user;
        if (!user) return;
        
        const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Admin';
        
        const adminName = document.getElementById('admin-name');
        if (adminName) adminName.textContent = name;
        
        const adminAvatar = document.getElementById('admin-avatar');
        if (adminAvatar) {
            adminAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff`;
        }
    }

    async loadData() {
        debugLog('Loading data from storage...');
        
        // Load from localStorage (or you can integrate JSONBin here)
        AdminState.users = DataStore.load('users', []);
        AdminState.orders = DataStore.load('orders', []);
        AdminState.topupRequests = DataStore.load('topupRequests', []);
        AdminState.categories = DataStore.load('categories', []);
        AdminState.products = DataStore.load('products', []);
        AdminState.payments = DataStore.load('payments', []);
        AdminState.banners = DataStore.load('banners', []);
        AdminState.inputTables = DataStore.load('inputTables', []);
        AdminState.bannedUsers = DataStore.load('bannedUsers', []);
        AdminState.settings = DataStore.load('settings', { siteName: 'Mafia Gaming Shop', announcement: '' });
        
        this.calculateStats();
        debugLog('Data loaded:', AdminState.stats);
    }

    calculateStats() {
        AdminState.stats = {
            totalUsers: AdminState.users.length,
            totalOrders: AdminState.orders.length,
            pendingOrders: AdminState.orders.filter(o => o.status === 'pending').length,
            approvedOrders: AdminState.orders.filter(o => o.status === 'approved').length,
            rejectedOrders: AdminState.orders.filter(o => o.status === 'rejected').length,
            totalRevenue: AdminState.orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.price || 0), 0),
            pendingTopups: AdminState.topupRequests.filter(t => t.status === 'pending').length
        };
        
        // Update badges
        const usersCount = document.getElementById('users-count');
        const pendingOrders = document.getElementById('pending-orders');
        const pendingTopups = document.getElementById('pending-topups');
        
        if (usersCount) usersCount.textContent = AdminState.stats.totalUsers;
        if (pendingOrders) pendingOrders.textContent = AdminState.stats.pendingOrders;
        if (pendingTopups) pendingTopups.textContent = AdminState.stats.pendingTopups;
    }

    loadDashboard() {
        debugLog('Loading dashboard');
        
        // Update stats
        document.getElementById('total-users').textContent = AdminState.stats.totalUsers;
        document.getElementById('total-orders').textContent = AdminState.stats.totalOrders;
        document.getElementById('approved-orders').textContent = AdminState.stats.approvedOrders;
        document.getElementById('pending-orders-count').textContent = AdminState.stats.pendingOrders;
        document.getElementById('rejected-orders').textContent = AdminState.stats.rejectedOrders;
        document.getElementById('total-revenue').textContent = AdminState.stats.totalRevenue.toLocaleString() + ' MMK';
    }

    setupEventListeners() {
        debugLog('Setting up event listeners');
        
        // Menu toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('admin-sidebar')?.classList.toggle('active');
        });
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
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
        
        // Add buttons
        document.getElementById('add-category-btn')?.addEventListener('click', () => this.showAddCategoryModal());
        document.getElementById('add-product-btn')?.addEventListener('click', () => this.showAddProductModal());
        document.getElementById('add-payment-btn')?.addEventListener('click', () => this.showAddPaymentModal());
        document.getElementById('add-banner-btn')?.addEventListener('click', () => this.showAddBannerModal());
        document.getElementById('add-input-table-btn')?.addEventListener('click', () => this.showAddInputTableModal());
        
        // Forms
        document.getElementById('announcement-form')?.addEventListener('submit', (e) => this.saveAnnouncement(e));
        document.getElementById('broadcast-form')?.addEventListener('submit', (e) => this.sendBroadcast(e));
        document.getElementById('settings-form')?.addEventListener('submit', (e) => this.saveSettings(e));
    }

    navigateTo(page) {
        debugLog('Navigating to:', page);
        
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
        
        // Load page content
        this.loadPageContent(page);
    }

    loadPageContent(page) {
        switch (page) {
            case 'dashboard': this.loadDashboard(); break;
            case 'users': this.loadUsers(); break;
            case 'orders': this.loadOrders(); break;
            case 'topup-requests': this.loadTopupRequests(); break;
            case 'categories': this.loadCategories(); break;
            case 'products': this.loadProducts(); break;
            case 'payments': this.loadPayments(); break;
            case 'banners': this.loadBanners(); break;
            case 'input-tables': this.loadInputTables(); break;
            case 'announcements': this.loadAnnouncements(); break;
            case 'broadcast': this.loadBroadcast(); break;
            case 'banned-users': this.loadBannedUsers(); break;
            case 'settings': this.loadSettings(); break;
        }
    }

    handleQuickAction(action) {
        debugLog('Quick action:', action);
        switch (action) {
            case 'add-category': this.navigateTo('categories'); setTimeout(() => this.showAddCategoryModal(), 100); break;
            case 'add-product': this.navigateTo('products'); setTimeout(() => this.showAddProductModal(), 100); break;
            case 'add-banner': this.navigateTo('banners'); setTimeout(() => this.showAddBannerModal(), 100); break;
            case 'add-payment': this.navigateTo('payments'); setTimeout(() => this.showAddPaymentModal(), 100); break;
        }
    }

    // ============================================
    // Page Loaders
    // ============================================

    loadUsers() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        
        if (AdminState.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = AdminState.users.map(user => `
            <tr>
                <td>${user.firstName || ''} ${user.lastName || ''}</td>
                <td>${user.id}</td>
                <td>${(user.balance || 0).toLocaleString()} MMK</td>
                <td>${user.totalOrders || 0}</td>
                <td><span class="status-badge ${user.isPremium ? 'premium' : 'regular'}">${user.isPremium ? 'Premium' : 'Regular'}</span></td>
                <td><button class="btn-view" onclick="adminPanel.viewUser('${user.id}')"><i class="fas fa-eye"></i></button></td>
            </tr>
        `).join('');
    }

    loadOrders() {
        const container = document.getElementById('admin-orders-list');
        if (!container) return;
        
        if (AdminState.orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No orders yet</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.orders.map(order => `
            <div class="admin-order-card" data-status="${order.status}">
                <div class="admin-order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="admin-order-body">
                    <div><strong>${order.userName}</strong> - ${order.productName}</div>
                    <div>${(order.price || 0).toLocaleString()} ${order.currency || 'MMK'}</div>
                </div>
            </div>
        `).join('');
    }

    loadTopupRequests() {
        const container = document.getElementById('topup-requests-list');
        if (!container) return;
        
        if (AdminState.topupRequests.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No topup requests</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.topupRequests.map(topup => `
            <div class="topup-request-card" data-status="${topup.status}">
                <div class="topup-request-header">
                    <span>${topup.id}</span>
                    <span class="order-status ${topup.status}">${topup.status}</span>
                </div>
                <div class="topup-request-body">
                    <div>${topup.userName} - ${(topup.amount || 0).toLocaleString()} MMK</div>
                </div>
            </div>
        `).join('');
    }

    loadCategories() {
        const container = document.getElementById('admin-categories');
        if (!container) return;
        
        if (AdminState.categories.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-th-large"></i><p>No categories yet. Click "Add Category" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.categories.map(cat => `
            <div class="admin-category-card">
                <div class="admin-category-icon">
                    ${cat.icon ? `<img src="${cat.icon}" alt="${cat.name}">` : `<i class="fas fa-gamepad"></i>`}
                    ${cat.flag ? `<span class="flag">${cat.flag}</span>` : ''}
                </div>
                <div class="admin-category-info">
                    <h4>${cat.name}</h4>
                </div>
                <div class="admin-category-actions">
                    <button class="btn-view" onclick="adminPanel.editCategory('${cat.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="adminPanel.deleteCategory('${cat.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    loadProducts() {
        const container = document.getElementById('admin-products');
        if (!container) return;
        
        if (AdminState.products.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-box"></i><p>No products yet. Click "Add Product" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.products.map(product => {
            const category = AdminState.categories.find(c => c.id === product.categoryId);
            return `
                <div class="admin-product-card">
                    <div class="admin-product-image">
                        ${product.icon ? `<img src="${product.icon}" alt="${product.name}">` : `<i class="fas fa-box"></i>`}
                    </div>
                    <div class="admin-product-info">
                        <div class="category-tag">${category?.name || 'Unknown'}</div>
                        <h4>${product.name}</h4>
                        <div class="price-row">
                            <span class="price-current">${(product.price || 0).toLocaleString()} ${product.currency || 'MMK'}</span>
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

    loadPayments() {
        const container = document.getElementById('admin-payments');
        if (!container) return;
        
        if (AdminState.payments.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-credit-card"></i><p>No payment methods yet. Click "Add Payment" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.payments.map(payment => `
            <div class="payment-card">
                <div class="payment-card-icon">
                    ${payment.icon ? `<img src="${payment.icon}" alt="${payment.name}">` : `<i class="fas fa-credit-card"></i>`}
                </div>
                <div class="payment-card-info">
                    <h4>${payment.name}</h4>
                    <div class="address">${payment.address}</div>
                    <div class="holder">${payment.holder}</div>
                </div>
                <div class="payment-card-actions">
                    <button class="btn-view" onclick="adminPanel.editPayment('${payment.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="adminPanel.deletePayment('${payment.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    loadBanners() {
        const container = document.getElementById('banners-list');
        if (!container) return;
        
        if (AdminState.banners.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-image"></i><p>No banners yet. Click "Add Banner" to create one.</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.banners.map(banner => `
            <div class="banner-card">
                <img src="${banner.image}" alt="Banner" class="banner-card-image">
                <div class="banner-card-actions">
                    <button class="delete-btn" onclick="adminPanel.deleteBanner('${banner.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    loadInputTables() {
        const container = document.getElementById('admin-input-tables');
        if (!container) return;
        
        if (AdminState.inputTables.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-keyboard"></i><p>No input tables yet</p></div>';
            return;
        }
        
        container.innerHTML = AdminState.inputTables.map(table => {
            const category = AdminState.categories.find(c => c.id === table.categoryId);
            return `
                <div class="input-table-card">
                    <div class="input-table-icon"><i class="fas fa-keyboard"></i></div>
                    <div class="input-table-info">
                        <h4>${table.name}</h4>
                        <div class="meta"><span>Category: ${category?.name || 'Unknown'}</span></div>
                    </div>
                    <div class="input-table-actions">
                        <button class="btn-delete" onclick="adminPanel.deleteInputTable('${table.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadAnnouncements() {
        document.getElementById('announcement-text').value = AdminState.settings.announcement || '';
    }

    loadBroadcast() {
        document.getElementById('broadcast-count').textContent = AdminState.users.length;
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
                <div class="banned-user-info">
                    <h4>${user.firstName || ''} ${user.lastName || ''}</h4>
                    <div class="reason">Reason: ${user.reason}</div>
                </div>
                <button class="unban-btn" onclick="adminPanel.unbanUser('${user.id}')"><i class="fas fa-user-check"></i> Unban</button>
            </div>
        `).join('');
    }

    loadSettings() {
        document.getElementById('site-name').value = AdminState.settings.siteName || 'Mafia Gaming Shop';
    }

    // ============================================
    // Modals & Forms
    // ============================================

    showAddCategoryModal() {
        const name = prompt('Enter category name:');
        if (!name) return;
        
        const flag = prompt('Enter country flag emoji (optional):') || '';
        
        const newCategory = {
            id: 'cat_' + Date.now(),
            name: name,
            flag: flag,
            icon: '',
            hasDiscount: false,
            createdAt: new Date().toISOString()
        };
        
        AdminState.categories.push(newCategory);
        DataStore.save('categories', AdminState.categories);
        this.loadCategories();
        Toast.success('Success', 'Category created successfully!');
    }

    showAddProductModal() {
        if (AdminState.categories.length === 0) {
            Toast.warning('Warning', 'Please create a category first');
            return;
        }
        
        const categoryOptions = AdminState.categories.map(c => c.name).join(', ');
        const categoryName = prompt(`Select category (${categoryOptions}):`);
        const category = AdminState.categories.find(c => c.name.toLowerCase() === categoryName?.toLowerCase());
        
        if (!category) {
            Toast.error('Error', 'Category not found');
            return;
        }
        
        const name = prompt('Enter product name (e.g., 60 UC):');
        if (!name) return;
        
        const price = parseFloat(prompt('Enter price (MMK):') || '0');
        
        const newProduct = {
            id: 'prod_' + Date.now(),
            categoryId: category.id,
            name: name,
            price: price,
            currency: 'MMK',
            icon: '',
            hasDiscount: false,
            discount: 0,
            delivery: 'instant',
            active: true,
            createdAt: new Date().toISOString()
        };
        
        AdminState.products.push(newProduct);
        DataStore.save('products', AdminState.products);
        this.loadProducts();
        Toast.success('Success', 'Product created successfully!');
    }

    showAddPaymentModal() {
        const name = prompt('Enter payment name (e.g., KBZ Pay):');
        if (!name) return;
        
        const address = prompt('Enter payment address/number:');
        if (!address) return;
        
        const holder = prompt('Enter account holder name:');
        if (!holder) return;
        
        const newPayment = {
            id: 'pay_' + Date.now(),
            name: name,
            address: address,
            holder: holder,
            icon: '',
            note: '',
            active: true,
            createdAt: new Date().toISOString()
        };
        
        AdminState.payments.push(newPayment);
        DataStore.save('payments', AdminState.payments);
        this.loadPayments();
        Toast.success('Success', 'Payment method created successfully!');
    }

    showAddBannerModal() {
        const imageUrl = prompt('Enter banner image URL:');
        if (!imageUrl) return;
        
        const newBanner = {
            id: 'banner_' + Date.now(),
            image: imageUrl,
            createdAt: new Date().toISOString()
        };
        
        AdminState.banners.push(newBanner);
        DataStore.save('banners', AdminState.banners);
        this.loadBanners();
        Toast.success('Success', 'Banner created successfully!');
    }

    showAddInputTableModal() {
        if (AdminState.categories.length === 0) {
            Toast.warning('Warning', 'Please create a category first');
            return;
        }
        
        const categoryOptions = AdminState.categories.map(c => c.name).join(', ');
        const categoryName = prompt(`Select category (${categoryOptions}):`);
        const category = AdminState.categories.find(c => c.name.toLowerCase() === categoryName?.toLowerCase());
        
        if (!category) {
            Toast.error('Error', 'Category not found');
            return;
        }
        
        const name = prompt('Enter input field name (e.g., Player ID):');
        if (!name) return;
        
        const placeholder = prompt('Enter placeholder text:') || '';
        
        const newInputTable = {
            id: 'input_' + Date.now(),
            categoryId: category.id,
            name: name,
            placeholder: placeholder,
            required: true,
            createdAt: new Date().toISOString()
        };
        
        AdminState.inputTables.push(newInputTable);
        DataStore.save('inputTables', AdminState.inputTables);
        this.loadInputTables();
        Toast.success('Success', 'Input table created successfully!');
    }

    // ============================================
    // Delete Actions
    // ============================================

    deleteCategory(id) {
        if (!confirm('Delete this category?')) return;
        AdminState.categories = AdminState.categories.filter(c => c.id !== id);
        DataStore.save('categories', AdminState.categories);
        this.loadCategories();
        Toast.success('Deleted', 'Category deleted successfully');
    }

    deleteProduct(id) {
        if (!confirm('Delete this product?')) return;
        AdminState.products = AdminState.products.filter(p => p.id !== id);
        DataStore.save('products', AdminState.products);
        this.loadProducts();
        Toast.success('Deleted', 'Product deleted successfully');
    }

    deletePayment(id) {
        if (!confirm('Delete this payment method?')) return;
        AdminState.payments = AdminState.payments.filter(p => p.id !== id);
        DataStore.save('payments', AdminState.payments);
        this.loadPayments();
        Toast.success('Deleted', 'Payment method deleted successfully');
    }

    deleteBanner(id) {
        if (!confirm('Delete this banner?')) return;
        AdminState.banners = AdminState.banners.filter(b => b.id !== id);
        DataStore.save('banners', AdminState.banners);
        this.loadBanners();
        Toast.success('Deleted', 'Banner deleted successfully');
    }

    deleteInputTable(id) {
        if (!confirm('Delete this input table?')) return;
        AdminState.inputTables = AdminState.inputTables.filter(t => t.id !== id);
        DataStore.save('inputTables', AdminState.inputTables);
        this.loadInputTables();
        Toast.success('Deleted', 'Input table deleted successfully');
    }

    unbanUser(id) {
        if (!confirm('Unban this user?')) return;
        AdminState.bannedUsers = AdminState.bannedUsers.filter(u => u.id !== id);
        DataStore.save('bannedUsers', AdminState.bannedUsers);
        this.loadBannedUsers();
        Toast.success('Success', 'User unbanned successfully');
    }

    // ============================================
    // Form Handlers
    // ============================================

    saveAnnouncement(e) {
        e.preventDefault();
        const text = document.getElementById('announcement-text').value;
        AdminState.settings.announcement = text;
        DataStore.save('settings', AdminState.settings);
        Toast.success('Saved', 'Announcement updated successfully');
    }

    sendBroadcast(e) {
        e.preventDefault();
        const message = document.getElementById('broadcast-message').value;
        if (!message) {
            Toast.warning('Warning', 'Please enter a message');
            return;
        }
        // In production, this would send to Telegram
        Toast.success('Sent', `Broadcast sent to ${AdminState.users.length} users`);
        document.getElementById('broadcast-message').value = '';
    }

    saveSettings(e) {
        e.preventDefault();
        AdminState.settings.siteName = document.getElementById('site-name').value;
        DataStore.save('settings', AdminState.settings);
        Toast.success('Saved', 'Settings saved successfully');
    }

    // ============================================
    // View/Edit Actions (Placeholder)
    // ============================================

    viewUser(id) {
        const user = AdminState.users.find(u => u.id == id);
        if (user) {
            alert(`User: ${user.firstName} ${user.lastName}\nID: ${user.id}\nBalance: ${user.balance} MMK`);
        }
    }

    editCategory(id) {
        const cat = AdminState.categories.find(c => c.id === id);
        if (!cat) return;
        
        const name = prompt('Edit category name:', cat.name);
        if (name) {
            cat.name = name;
            DataStore.save('categories', AdminState.categories);
            this.loadCategories();
            Toast.success('Updated', 'Category updated successfully');
        }
    }

    editProduct(id) {
        const product = AdminState.products.find(p => p.id === id);
        if (!product) return;
        
        const name = prompt('Edit product name:', product.name);
        if (name) {
            product.name = name;
            const price = parseFloat(prompt('Edit price:', product.price) || product.price);
            product.price = price;
            DataStore.save('products', AdminState.products);
            this.loadProducts();
            Toast.success('Updated', 'Product updated successfully');
        }
    }

    editPayment(id) {
        const payment = AdminState.payments.find(p => p.id === id);
        if (!payment) return;
        
        const name = prompt('Edit payment name:', payment.name);
        if (name) {
            payment.name = name;
            payment.address = prompt('Edit address:', payment.address) || payment.address;
            payment.holder = prompt('Edit holder:', payment.holder) || payment.holder;
            DataStore.save('payments', AdminState.payments);
            this.loadPayments();
            Toast.success('Updated', 'Payment method updated successfully');
        }
    }
}

// ============================================
// Initialize Admin Panel
// ============================================

let adminPanel = null;

document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM loaded, creating AdminPanel...');
    adminPanel = new AdminPanel();
    adminPanel.init();
    window.adminPanel = adminPanel;
});

console.log('✅ Admin.js loaded');
