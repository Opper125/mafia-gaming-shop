/* ============================================
   MAFIA GAMING SHOP - ADMIN PANEL
   Version: 1.0.0
   ============================================ */

// ============================================
// Admin State
// ============================================

const AdminState = {
    user: null,
    isVerified: false,
    
    // Statistics
    stats: {
        totalUsers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        rejectedOrders: 0,
        totalRevenue: 0,
        pendingTopups: 0
    },
    
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
    settings: {},
    
    // UI State
    currentPage: 'dashboard',
    selectedUser: null,
    selectedOrder: null,
    selectedTopup: null,
    editingItem: null
};

const ADMIN_TELEGRAM_ID = 1538232799;

// ============================================
// Admin Panel Application
// ============================================

class AdminPanel {
    constructor() {
        this.initialized = false;
    }

    async init() {
        console.log('👑 Initializing Admin Panel...');
        
        try {
            // Initialize Telegram WebApp
            const telegramResult = await TelegramWebApp.init();
            
            if (!telegramResult.success) {
                this.showAccessDenied('Not running in Telegram');
                return;
            }

            AdminState.user = telegramResult.user;

            // Check if user is admin
            if (AdminState.user.id !== ADMIN_TELEGRAM_ID) {
                this.showAccessDenied('Not authorized');
                return;
            }

            // Initialize utilities
            Utils.Toast.init();
            Utils.Loading.init();

            // Show verification screen
            this.showVerificationScreen();

        } catch (error) {
            console.error('❌ Admin init error:', error);
            this.showAccessDenied('Initialization failed');
        }
    }

    showAccessDenied(reason = '') {
        document.getElementById('admin-access-denied')?.classList.remove('hidden');
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        document.getElementById('admin-panel')?.classList.add('hidden');
        console.log('Access denied:', reason);
    }

    showVerificationScreen() {
        document.getElementById('admin-access-denied')?.classList.add('hidden');
        document.getElementById('admin-verify-screen')?.classList.remove('hidden');
        document.getElementById('admin-panel')?.classList.add('hidden');

        // Setup verification form
        document.getElementById('verify-admin-btn')?.addEventListener('click', () => {
            this.verifyAdmin();
        });

        document.getElementById('admin-2fa-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyAdmin();
        });
    }

    async verifyAdmin() {
        const password = document.getElementById('admin-2fa-password')?.value;
        const statusEl = document.getElementById('verify-status');

        if (!password) {
            if (statusEl) {
                statusEl.textContent = 'Please enter your 2FA password';
                statusEl.className = 'verify-status error';
            }
            return;
        }

        Utils.Loading.show('Verifying...');

        try {
            // In production, verify with Telegram's 2FA
            // For demo, we accept any password for the admin ID
            if (AdminState.user.id === ADMIN_TELEGRAM_ID) {
                AdminState.isVerified = true;
                
                if (statusEl) {
                    statusEl.textContent = 'Verification successful!';
                    statusEl.className = 'verify-status success';
                }

                setTimeout(() => {
                    this.showAdminPanel();
                }, 500);
            } else {
                throw new Error('Invalid admin');
            }
        } catch (error) {
            if (statusEl) {
                statusEl.textContent = 'Verification failed. Please try again.';
                statusEl.className = 'verify-status error';
            }
            TelegramWebApp.haptic('notification', 'error');
        }

        Utils.Loading.hide();
    }

    async showAdminPanel() {
        document.getElementById('admin-access-denied')?.classList.add('hidden');
        document.getElementById('admin-verify-screen')?.classList.add('hidden');
        document.getElementById('admin-panel')?.classList.remove('hidden');

        // Update admin info
        this.updateAdminInfo();

        // Load all data
        await this.loadAllData();

        // Setup UI
        this.setupNavigation();
        this.setupEventListeners();
        
        // Load dashboard
        this.loadDashboard();

        // Start real-time sync
        this.startSync();

        this.initialized = true;
        console.log('✅ Admin Panel ready!');
    }

    updateAdminInfo() {
        const adminName = document.getElementById('admin-name');
        const adminAvatar = document.getElementById('admin-avatar');
        const sidebarLogo = document.getElementById('sidebar-logo');
        const sidebarSiteName = document.getElementById('sidebar-site-name');

        if (adminName) adminName.textContent = TelegramWebApp.formatName(AdminState.user);
        if (adminAvatar) adminAvatar.src = TelegramWebApp.getAvatarUrl(AdminState.user.id);
        if (sidebarLogo && AdminState.settings.logo) sidebarLogo.src = AdminState.settings.logo;
        if (sidebarSiteName) sidebarSiteName.textContent = AdminState.settings.siteName || 'Mafia Gaming Shop';
    }

    async loadAllData() {
        Utils.Loading.show('Loading data...');

        try {
            const [users, orders, topupRequests, categories, products, payments, 
                   bannersType1, bannersType2, inputTables, bannedUsers, settings, announcements] = await Promise.all([
                Utils.JSONBin.read('users'),
                Utils.JSONBin.read('orders'),
                Utils.JSONBin.read('topupRequests'),
                Utils.JSONBin.read('categories'),
                Utils.JSONBin.read('products'),
                Utils.JSONBin.read('payments'),
                Utils.JSONBin.read('bannersType1'),
                Utils.JSONBin.read('bannersType2'),
                Utils.JSONBin.read('inputTables'),
                Utils.JSONBin.read('bannedUsers'),
                Utils.JSONBin.read('settings'),
                Utils.JSONBin.read('announcements')
            ]);

            AdminState.users = users || [];
            AdminState.orders = orders || [];
            AdminState.topupRequests = topupRequests || [];
            AdminState.categories = categories || [];
            AdminState.products = products || [];
            AdminState.payments = payments || [];
            AdminState.bannersType1 = bannersType1 || [];
            AdminState.bannersType2 = bannersType2 || [];
            AdminState.inputTables = inputTables || [];
            AdminState.bannedUsers = bannedUsers || [];
            AdminState.settings = settings || { siteName: 'Mafia Gaming Shop', logo: '', theme: 'dark' };
            
            if (announcements?.text) {
                AdminState.settings.announcement = announcements.text;
            }

            this.calculateStats();
            console.log('✅ Admin data loaded');
        } catch (error) {
            console.error('Error loading data:', error);
            Utils.Toast.error('Error', 'Failed to load data');
        }

        Utils.Loading.hide();
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
        document.getElementById('users-count').textContent = AdminState.stats.totalUsers;
        document.getElementById('pending-orders').textContent = AdminState.stats.pendingOrders;
        document.getElementById('pending-topups').textContent = AdminState.stats.pendingTopups;
    }

    startSync() {
        this.syncInterval = setInterval(() => this.loadAllData(), 30000);
    }

    setupNavigation() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('admin-sidebar');
        const navLinks = document.querySelectorAll('.nav-link');

        menuToggle?.addEventListener('click', () => {
            sidebar?.classList.toggle('active');
            TelegramWebApp.haptic('impact', 'light');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
                sidebar?.classList.remove('active');
            });
        });

        document.getElementById('back-to-shop')?.addEventListener('click', () => {
            window.location.href = '/';
        });

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // View all links
        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add('active');
        
        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`)?.classList.add('active');

        AdminState.currentPage = page;
        this.loadPageContent(page);
        TelegramWebApp.haptic('selection');
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
            case 'add-category': this.navigateTo('categories'); setTimeout(() => this.openCategoryModal(), 100); break;
            case 'add-product': this.navigateTo('products'); setTimeout(() => this.openProductModal(), 100); break;
            case 'add-banner': this.navigateTo('banners'); break;
            case 'broadcast': this.navigateTo('broadcast'); break;
        }
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
        document.getElementById('total-revenue').textContent = Utils.Format.currency(AdminState.stats.totalRevenue, 'MMK');

        // Recent orders
        const recentOrders = [...AdminState.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        const recentOrdersEl = document.getElementById('recent-orders');
        
        if (recentOrdersEl) {
            recentOrdersEl.innerHTML = recentOrders.length ? recentOrders.map(order => `
                <div class="recent-item" data-order-id="${order.id}">
                    <div class="recent-item-icon"><img src="${order.productIcon}" alt=""></div>
                    <div class="recent-item-info">
                        <span class="recent-item-title">${order.productName}</span>
                        <span class="recent-item-subtitle">${order.userName} • ${Utils.Format.date(order.createdAt, 'relative')}</span>
                    </div>
                    <span class="recent-item-status ${order.status}">${order.status}</span>
                </div>
            `).join('') : '<p class="text-muted text-center">No recent orders</p>';
        }

        // Recent topups
        const recentTopups = [...AdminState.topupRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        const recentTopupsEl = document.getElementById('recent-topups');
        
        if (recentTopupsEl) {
            recentTopupsEl.innerHTML = recentTopups.length ? recentTopups.map(topup => `
                <div class="recent-item" data-topup-id="${topup.id}">
                    <div class="recent-item-icon"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="recent-item-info">
                        <span class="recent-item-title">${Utils.Format.currency(topup.amount, 'MMK')}</span>
                        <span class="recent-item-subtitle">${topup.userName} • ${Utils.Format.date(topup.createdAt, 'relative')}</span>
                    </div>
                    <span class="recent-item-status ${topup.status}">${topup.status}</span>
                </div>
            `).join('') : '<p class="text-muted text-center">No recent topups</p>';
        }
    }

    // ============================================
    // Users Management
    // ============================================

    loadUsers() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        tbody.innerHTML = AdminState.users.map(user => `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="user-cell">
                        <img src="${TelegramWebApp.getAvatarUrl(user.id)}" alt="">
                        <div class="user-info">
                            <span class="name">${user.firstName || ''} ${user.lastName || ''}</span>
                            <span class="username">@${user.username || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td>${user.id}</td>
                <td>${Utils.Format.currency(user.balance || 0, 'MMK')}</td>
                <td>${user.totalOrders || 0}</td>
                <td><span class="status-badge ${user.isPremium ? 'premium' : 'regular'}">${user.isPremium ? '⭐ Premium' : 'Regular'}</span></td>
                <td>${Utils.Format.date(user.joinedAt, 'short')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-view" onclick="adminPanel.viewUser('${user.id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn-delete" onclick="adminPanel.banUserById('${user.id}')"><i class="fas fa-ban"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Setup search
        document.getElementById('search-users')?.addEventListener('input', Utils.debounce((e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('#users-tbody tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        }, 300));

        // Setup filters
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

    async viewUser(userId) {
        const user = AdminState.users.find(u => u.id == userId);
        if (!user) return;

        AdminState.selectedUser = user;
        const userOrders = AdminState.orders.filter(o => o.userId == userId);
        const userTopups = AdminState.topupRequests.filter(t => t.userId == userId);

        document.getElementById('modal-user-avatar').src = TelegramWebApp.getAvatarUrl(user.id);
        document.getElementById('modal-user-name').textContent = `${user.firstName || ''} ${user.lastName || ''}`;
        document.getElementById('modal-user-username').textContent = `@${user.username || 'N/A'}`;
        document.getElementById('modal-premium-badge').style.display = user.isPremium ? 'inline-flex' : 'none';
        document.getElementById('modal-balance').textContent = Utils.Format.currency(user.balance || 0, 'MMK');
        document.getElementById('modal-total-orders').textContent = userOrders.length;
        document.getElementById('modal-approved').textContent = userOrders.filter(o => o.status === 'approved').length;
        document.getElementById('modal-rejected').textContent = userOrders.filter(o => o.status === 'rejected').length;
        document.getElementById('modal-total-topup').textContent = Utils.Format.currency(userTopups.filter(t => t.status === 'approved').reduce((s, t) => s + t.amount, 0), 'MMK');
        document.getElementById('modal-joined').textContent = Utils.Format.date(user.joinedAt, 'short');

        document.getElementById('user-orders-list').innerHTML = userOrders.slice(0, 10).map(o => `
            <div class="mini-table-item"><span>${o.productName}</span><span class="status-badge ${o.status}">${o.status}</span></div>
        `).join('') || '<p class="text-muted">No orders</p>';

        document.getElementById('user-topups-list').innerHTML = userTopups.slice(0, 10).map(t => `
            <div class="mini-table-item"><span>${Utils.Format.currency(t.amount, 'MMK')}</span><span class="status-badge ${t.status}">${t.status}</span></div>
        `).join('') || '<p class="text-muted">No topups</p>';

        Utils.Modal.open('user-details-modal');
    }

    async banUserById(userId) {
        const confirmed = await TelegramWebApp.showConfirm('Are you sure you want to ban this user?');
        if (!confirmed) return;

        Utils.Loading.show('Banning user...');
        try {
            const user = AdminState.users.find(u => u.id == userId);
            if (user) {
                AdminState.bannedUsers.push({
                    id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName,
                    reason: 'Banned by admin', bannedAt: new Date().toISOString()
                });
                await Utils.JSONBin.update('bannedUsers', AdminState.bannedUsers);
                Utils.Toast.success('User Banned', 'User has been banned successfully');
                this.loadUsers();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to ban user');
        }
        Utils.Loading.hide();
    }

    // ============================================
    // Orders Management
    // ============================================

    loadOrders() {
        const container = document.getElementById('admin-orders-list');
        if (!container) return;

        const sortedOrders = [...AdminState.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = sortedOrders.length ? sortedOrders.map(order => `
            <div class="admin-order-card" data-order-id="${order.id}" data-status="${order.status}">
                <div class="admin-order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="admin-order-body">
                    <div class="admin-order-user">
                        <img src="${TelegramWebApp.getAvatarUrl(order.userId)}" alt="">
                        <div class="info"><span class="name">${order.userName}</span><span class="id">ID: ${order.userId}</span></div>
                    </div>
                    <div class="admin-order-product">
                        <img src="${order.productIcon}" alt="">
                        <div class="info"><span class="name">${order.productName}</span><span class="price">${Utils.Format.currency(order.price, order.currency)}</span></div>
                    </div>
                    <div class="admin-order-actions">
                        <button class="btn-view" onclick="adminPanel.viewOrder('${order.id}')"><i class="fas fa-eye"></i></button>
                    </div>
                </div>
            </div>
        `).join('') : '<div class="empty-state"><i class="fas fa-box-open"></i><p>No orders</p></div>';

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

    async viewOrder(orderId) {
        const order = AdminState.orders.find(o => o.id === orderId);
        if (!order) return;

        AdminState.selectedOrder = order;

        document.getElementById('order-id').textContent = order.id;
        document.getElementById('order-status').textContent = order.status;
        document.getElementById('order-status').className = `value status ${order.status}`;
        document.getElementById('order-date').textContent = Utils.Format.date(order.createdAt, 'datetime');
        document.getElementById('order-user-avatar').src = TelegramWebApp.getAvatarUrl(order.userId);
        document.getElementById('order-user-name').textContent = order.userName;
        document.getElementById('order-user-id').textContent = `ID: ${order.userId}`;
        document.getElementById('order-product-icon').src = order.productIcon;
        document.getElementById('order-product-name').textContent = order.productName;
        document.getElementById('order-product-amount').textContent = order.amount;
        document.getElementById('order-product-price').textContent = Utils.Format.currency(order.price, order.currency);

        const inputValuesEl = document.getElementById('order-input-values');
        if (order.inputValues && Object.keys(order.inputValues).length > 0) {
            document.getElementById('order-input-info').style.display = 'block';
            inputValuesEl.innerHTML = Object.entries(order.inputValues).map(([key, value]) => {
                const table = AdminState.inputTables.find(t => t.id === key);
                return `<div class="input-value-item"><span class="label">${table?.name || key}:</span><span class="value">${value}</span></div>`;
            }).join('');
        } else {
            document.getElementById('order-input-info').style.display = 'none';
        }

        document.getElementById('order-actions').style.display = order.status === 'pending' ? 'flex' : 'none';
        Utils.Modal.open('order-details-modal');
    }

    async approveOrder() {
        if (!AdminState.selectedOrder) return;
        Utils.Loading.show('Approving order...');
        try {
            const orderIndex = AdminState.orders.findIndex(o => o.id === AdminState.selectedOrder.id);
            if (orderIndex !== -1) {
                AdminState.orders[orderIndex].status = 'approved';
                AdminState.orders[orderIndex].updatedAt = new Date().toISOString();
                await Utils.JSONBin.update('orders', AdminState.orders);

                // Update user stats
                const userIndex = AdminState.users.findIndex(u => u.id == AdminState.selectedOrder.userId);
                if (userIndex !== -1) {
                    AdminState.users[userIndex].completedOrders = (AdminState.users[userIndex].completedOrders || 0) + 1;
                    await Utils.JSONBin.update('users', AdminState.users);
                }

                Utils.Modal.close('order-details-modal');
                Utils.Toast.success('Order Approved', 'Order has been approved successfully');
                this.calculateStats();
                this.loadOrders();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to approve order');
        }
        Utils.Loading.hide();
    }

    async rejectOrder() {
        if (!AdminState.selectedOrder) return;
        const confirmed = await TelegramWebApp.showConfirm('Reject this order? The amount will be refunded.');
        if (!confirmed) return;

        Utils.Loading.show('Rejecting order...');
        try {
            const orderIndex = AdminState.orders.findIndex(o => o.id === AdminState.selectedOrder.id);
            if (orderIndex !== -1) {
                AdminState.orders[orderIndex].status = 'rejected';
                AdminState.orders[orderIndex].updatedAt = new Date().toISOString();
                await Utils.JSONBin.update('orders', AdminState.orders);

                // Refund balance
                const userIndex = AdminState.users.findIndex(u => u.id == AdminState.selectedOrder.userId);
                if (userIndex !== -1) {
                    AdminState.users[userIndex].balance = (AdminState.users[userIndex].balance || 0) + AdminState.selectedOrder.price;
                    AdminState.users[userIndex].rejectedOrders = (AdminState.users[userIndex].rejectedOrders || 0) + 1;
                    await Utils.JSONBin.update('users', AdminState.users);
                }

                Utils.Modal.close('order-details-modal');
                Utils.Toast.success('Order Rejected', 'Order rejected and amount refunded');
                this.calculateStats();
                this.loadOrders();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to reject order');
        }
        Utils.Loading.hide();
    }

    // ============================================
    // Topup Requests Management
    // ============================================

    loadTopupRequests() {
        const container = document.getElementById('topup-requests-list');
        if (!container) return;

        const sortedTopups = [...AdminState.topupRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = sortedTopups.length ? sortedTopups.map(topup => `
            <div class="topup-request-card" data-topup-id="${topup.id}" data-status="${topup.status}" onclick="adminPanel.viewTopup('${topup.id}')">
                <div class="topup-request-header">
                    <span class="order-id">${topup.id}</span>
                    <span class="order-status ${topup.status}">${topup.status}</span>
                </div>
                <div class="topup-request-body">
                    <div class="topup-user-info">
                        <img src="${TelegramWebApp.getAvatarUrl(topup.userId)}" alt="">
                        <div class="info"><span class="name">${topup.userName}</span><span class="id">ID: ${topup.userId}</span></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px;font-weight:700;color:var(--success);">${Utils.Format.currency(topup.amount, 'MMK')}</div>
                        <div style="font-size:12px;color:var(--text-tertiary);">${Utils.Format.date(topup.createdAt, 'relative')}</div>
                    </div>
                </div>
            </div>
        `).join('') : '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No topup requests</p></div>';

        document.querySelectorAll('#page-topup-requests .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#page-topup-requests .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                document.querySelectorAll('.topup-request-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
                });
            });
        });
    }

    async viewTopup(topupId) {
        const topup = AdminState.topupRequests.find(t => t.id === topupId);
        if (!topup) return;

        AdminState.selectedTopup = topup;

        document.getElementById('topup-user-avatar').src = TelegramWebApp.getAvatarUrl(topup.userId);
        document.getElementById('topup-user-name').textContent = topup.userName;
        document.getElementById('topup-user-id').textContent = `ID: ${topup.userId}`;
        document.getElementById('topup-amount-value').textContent = Utils.Format.currency(topup.amount, 'MMK');
        document.getElementById('topup-payment-method').textContent = topup.paymentMethod;
        document.getElementById('topup-date').textContent = Utils.Format.date(topup.createdAt, 'datetime');
        document.getElementById('topup-status').textContent = topup.status;
        document.getElementById('topup-status').className = `value status ${topup.status}`;
        document.getElementById('topup-screenshot').src = topup.screenshot;
        document.getElementById('topup-actions').style.display = topup.status === 'pending' ? 'flex' : 'none';

        Utils.Modal.open('topup-request-modal');
    }

    async approveTopup() {
        if (!AdminState.selectedTopup) return;
        Utils.Loading.show('Approving topup...');
        try {
            const topupIndex = AdminState.topupRequests.findIndex(t => t.id === AdminState.selectedTopup.id);
            if (topupIndex !== -1) {
                AdminState.topupRequests[topupIndex].status = 'approved';
                AdminState.topupRequests[topupIndex].updatedAt = new Date().toISOString();
                await Utils.JSONBin.update('topupRequests', AdminState.topupRequests);

                // Add balance to user
                const userIndex = AdminState.users.findIndex(u => u.id == AdminState.selectedTopup.userId);
                if (userIndex !== -1) {
                    AdminState.users[userIndex].balance = (AdminState.users[userIndex].balance || 0) + AdminState.selectedTopup.amount;
                    AdminState.users[userIndex].totalTopup = (AdminState.users[userIndex].totalTopup || 0) + AdminState.selectedTopup.amount;
                    await Utils.JSONBin.update('users', AdminState.users);
                }

                Utils.Modal.close('topup-request-modal');
                Utils.Toast.success('Topup Approved', 'Balance has been added to user');
                this.calculateStats();
                this.loadTopupRequests();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to approve topup');
        }
        Utils.Loading.hide();
    }

    async rejectTopup() {
        if (!AdminState.selectedTopup) return;
        const confirmed = await TelegramWebApp.showConfirm('Reject this topup request?');
        if (!confirmed) return;

        Utils.Loading.show('Rejecting topup...');
        try {
            const topupIndex = AdminState.topupRequests.findIndex(t => t.id === AdminState.selectedTopup.id);
            if (topupIndex !== -1) {
                AdminState.topupRequests[topupIndex].status = 'rejected';
                AdminState.topupRequests[topupIndex].updatedAt = new Date().toISOString();
                await Utils.JSONBin.update('topupRequests', AdminState.topupRequests);

                Utils.Modal.close('topup-request-modal');
                Utils.Toast.success('Topup Rejected', 'Request has been rejected');
                this.calculateStats();
                this.loadTopupRequests();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to reject topup');
        }
        Utils.Loading.hide();
    }

    // ============================================
    // Banners Management
    // ============================================

    loadBanners() {
        // Setup banner tabs
        document.querySelectorAll('.banner-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.banner-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                document.getElementById('type1-section').classList.toggle('hidden', tab !== 'type1');
                document.getElementById('type2-section').classList.toggle('hidden', tab !== 'type2');
            });
        });

        // Load Type 1 banners
        const type1Container = document.getElementById('type1-banners');
        if (type1Container) {
            type1Container.innerHTML = AdminState.bannersType1.length ? AdminState.bannersType1.map(banner => `
                <div class="banner-card" data-banner-id="${banner.id}">
                    <img src="${banner.image}" alt="Banner" class="banner-card-image">
                    <div class="banner-card-actions">
                        <button class="edit-btn" onclick="adminPanel.editBanner('${banner.id}', 'type1')"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" onclick="adminPanel.deleteBanner('${banner.id}', 'type1')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('') : '<p class="text-muted">No banners yet. Click "Add Banner" to create one.</p>';
        }

        // Load Type 2 banners
        const type2Container = document.getElementById('type2-banners');
        if (type2Container) {
            type2Container.innerHTML = AdminState.bannersType2.length ? AdminState.bannersType2.map(banner => {
                const category = AdminState.categories.find(c => c.id === banner.categoryId);
                return `
                    <div class="banner-list-item" data-banner-id="${banner.id}">
                        <img src="${banner.image}" alt="Banner" class="banner-list-item-image">
                        <div class="banner-list-item-content">
                            <span class="category-tag">${category?.name || 'Unknown Category'}</span>
                            <p>${Utils.Format.truncate(banner.instructions || '', 100)}</p>
                        </div>
                        <div class="banner-list-item-actions">
                            <button class="btn-view" onclick="adminPanel.editBanner('${banner.id}', 'type2')"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="adminPanel.deleteBanner('${banner.id}', 'type2')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join('') : '<p class="text-muted">No category banners yet.</p>';
        }

        // Add banner buttons
        document.getElementById('add-type1-banner')?.addEventListener('click', () => this.openBannerModal('type1'));
        document.getElementById('add-type2-banner')?.addEventListener('click', () => this.openBannerModal('type2'));
    }

    openBannerModal(type, bannerId = null) {
        const modal = document.getElementById('add-banner-modal');
        const form = document.getElementById('banner-form');
        const title = document.getElementById('banner-modal-title');
        const categoryGroup = document.getElementById('banner-category-group');
        const instructionsGroup = document.getElementById('banner-instructions-group');
        const categorySelect = document.getElementById('banner-category');

        form.reset();
        document.getElementById('banner-id').value = bannerId || '';
        document.getElementById('banner-type').value = type;
        document.getElementById('banner-preview').classList.add('hidden');
        document.querySelector('#banner-file-upload .file-upload-content').classList.remove('hidden');

        title.textContent = bannerId ? 'Edit Banner' : 'Add Banner';
        categoryGroup.style.display = type === 'type2' ? 'block' : 'none';
        instructionsGroup.style.display = type === 'type2' ? 'block' : 'none';

        // Load categories for Type 2
        if (type === 'type2') {
            categorySelect.innerHTML = '<option value="">Select Category</option>' + 
                AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        // Load existing data if editing
        if (bannerId) {
            const banners = type === 'type1' ? AdminState.bannersType1 : AdminState.bannersType2;
            const banner = banners.find(b => b.id === bannerId);
            if (banner) {
                if (banner.image) {
                    document.getElementById('banner-preview-img').src = banner.image;
                    document.getElementById('banner-preview').classList.remove('hidden');
                    document.querySelector('#banner-file-upload .file-upload-content').classList.add('hidden');
                }
                if (type === 'type2') {
                    categorySelect.value = banner.categoryId || '';
                    document.getElementById('banner-instructions').value = banner.instructions || '';
                }
            }
        }

        Utils.Modal.open('add-banner-modal');
    }

    async saveBanner(e) {
        e.preventDefault();
        
        const id = document.getElementById('banner-id').value;
        const type = document.getElementById('banner-type').value;
        const imageInput = document.getElementById('banner-image');
        const previewImg = document.getElementById('banner-preview-img');
        
        let image = previewImg.src;
        if (imageInput.files[0]) {
            image = await Utils.FileUpload.toBase64(imageInput.files[0]);
        }

        if (!image || image === '') {
            Utils.Toast.warning('Image Required', 'Please upload a banner image');
            return;
        }

        Utils.Loading.show('Saving banner...');

        try {
            const bannerData = {
                id: id || Utils.generateId('banner'),
                image: image,
                createdAt: id ? undefined : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (type === 'type2') {
                bannerData.categoryId = document.getElementById('banner-category').value;
                bannerData.instructions = document.getElementById('banner-instructions').value;
                
                if (!bannerData.categoryId) {
                    Utils.Toast.warning('Category Required', 'Please select a category');
                    Utils.Loading.hide();
                    return;
                }
            }

            const banners = type === 'type1' ? AdminState.bannersType1 : AdminState.bannersType2;
            const binName = type === 'type1' ? 'bannersType1' : 'bannersType2';

            if (id) {
                const index = banners.findIndex(b => b.id === id);
                if (index !== -1) {
                    banners[index] = { ...banners[index], ...bannerData };
                }
            } else {
                banners.push(bannerData);
            }

            await Utils.JSONBin.update(binName, banners);
            
            Utils.Modal.close('add-banner-modal');
            Utils.Toast.success('Success', 'Banner saved successfully');
            this.loadBanners();
        } catch (error) {
            console.error('Error saving banner:', error);
            Utils.Toast.error('Error', 'Failed to save banner');
        }

        Utils.Loading.hide();
    }

    async deleteBanner(bannerId, type) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this banner?');
        if (!confirmed) return;

        Utils.Loading.show('Deleting...');
        try {
            const banners = type === 'type1' ? AdminState.bannersType1 : AdminState.bannersType2;
            const binName = type === 'type1' ? 'bannersType1' : 'bannersType2';
            const index = banners.findIndex(b => b.id === bannerId);
            
            if (index !== -1) {
                banners.splice(index, 1);
                await Utils.JSONBin.update(binName, banners);
                Utils.Toast.success('Deleted', 'Banner deleted successfully');
                this.loadBanners();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to delete banner');
        }
        Utils.Loading.hide();
    }

    editBanner(bannerId, type) {
        this.openBannerModal(type, bannerId);
    }

    // ============================================
    // Categories Management
    // ============================================

    loadCategories() {
        const container = document.getElementById('admin-categories');
        if (!container) return;

        container.innerHTML = AdminState.categories.length ? AdminState.categories.map(category => {
            const productCount = AdminState.products.filter(p => p.categoryId === category.id).length;
            const soldCount = AdminState.orders.filter(o => o.categoryId === category.id && o.status === 'approved').length;
            
            return `
                <div class="admin-category-card" data-category-id="${category.id}">
                    <div class="admin-category-icon">
                        <img src="${category.icon}" alt="${category.name}">
                        ${category.flag ? `<span class="flag">${category.flag}</span>` : ''}
                        ${category.hasDiscount ? '<span class="discount-badge">SALE</span>' : ''}
                    </div>
                    <div class="admin-category-info">
                        <h4>${category.name}</h4>
                        <span class="stats">${productCount} products • <span>${soldCount}</span> sold</span>
                    </div>
                    <div class="admin-category-actions">
                        <button class="btn-view" onclick="adminPanel.editCategory('${category.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="adminPanel.deleteCategory('${category.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('') : '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-th-large"></i><p>No categories yet</p></div>';

        document.getElementById('add-category-btn')?.addEventListener('click', () => this.openCategoryModal());
    }

    openCategoryModal(categoryId = null) {
        const form = document.getElementById('category-form');
        const title = document.getElementById('category-modal-title');

        form.reset();
        document.getElementById('category-id').value = categoryId || '';
        document.getElementById('category-icon-preview').classList.add('hidden');
        document.querySelector('#category-icon-upload .file-upload-content').classList.remove('hidden');

        title.textContent = categoryId ? 'Edit Category' : 'Add Category';

        if (categoryId) {
            const category = AdminState.categories.find(c => c.id === categoryId);
            if (category) {
                document.getElementById('category-name').value = category.name;
                document.getElementById('category-flag').value = category.flag || '';
                document.getElementById('category-has-discount').checked = category.hasDiscount || false;
                if (category.icon) {
                    document.getElementById('category-icon-img').src = category.icon;
                    document.getElementById('category-icon-preview').classList.remove('hidden');
                    document.querySelector('#category-icon-upload .file-upload-content').classList.add('hidden');
                }
            }
        }

        Utils.Modal.open('category-modal');
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
            Utils.Toast.warning('Name Required', 'Please enter category name');
            return;
        }

        let icon = previewImg.src;
        if (iconInput.files[0]) {
            icon = await Utils.FileUpload.toBase64(iconInput.files[0]);
        }

        if (!icon || icon === '' || icon === window.location.href) {
            Utils.Toast.warning('Icon Required', 'Please upload category icon');
            return;
        }

        Utils.Loading.show('Saving category...');

        try {
            const categoryData = {
                id: id || Utils.generateId('cat'),
                name, flag, hasDiscount, icon,
                createdAt: id ? undefined : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (id) {
                const index = AdminState.categories.findIndex(c => c.id === id);
                if (index !== -1) {
                    AdminState.categories[index] = { ...AdminState.categories[index], ...categoryData };
                }
            } else {
                AdminState.categories.push(categoryData);
            }

            await Utils.JSONBin.update('categories', AdminState.categories);
            Utils.Modal.close('category-modal');
            Utils.Toast.success('Success', 'Category saved successfully');
            this.loadCategories();
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to save category');
        }

        Utils.Loading.hide();
    }

    editCategory(categoryId) {
        this.openCategoryModal(categoryId);
    }

    async deleteCategory(categoryId) {
        const products = AdminState.products.filter(p => p.categoryId === categoryId);
        if (products.length > 0) {
            Utils.Toast.warning('Cannot Delete', `This category has ${products.length} products. Delete products first.`);
            return;
        }

        const confirmed = await TelegramWebApp.showConfirm('Delete this category?');
        if (!confirmed) return;

        Utils.Loading.show('Deleting...');
        try {
            const index = AdminState.categories.findIndex(c => c.id === categoryId);
            if (index !== -1) {
                AdminState.categories.splice(index, 1);
                await Utils.JSONBin.update('categories', AdminState.categories);
                Utils.Toast.success('Deleted', 'Category deleted successfully');
                this.loadCategories();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to delete category');
        }
        Utils.Loading.hide();
    }

    // ============================================
    // Products Management
    // ============================================

    loadProducts() {
        const container = document.getElementById('admin-products');
        const filterSelect = document.getElementById('filter-product-category');

        // Load category filter
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Categories</option>' + 
                AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            
            filterSelect.addEventListener('change', () => {
                const categoryId = filterSelect.value;
                document.querySelectorAll('.admin-product-card').forEach(card => {
                    card.style.display = (!categoryId || card.dataset.categoryId === categoryId) ? '' : 'none';
                });
            });
        }

        if (!container) return;

        container.innerHTML = AdminState.products.length ? AdminState.products.map(product => {
            const category = AdminState.categories.find(c => c.id === product.categoryId);
            const discountedPrice = product.hasDiscount ? product.price - (product.price * product.discount / 100) : product.price;

            return `
                <div class="admin-product-card" data-product-id="${product.id}" data-category-id="${product.categoryId}">
                    <div class="admin-product-image">
                        <img src="${product.icon}" alt="${product.name}">
                        <div class="admin-product-badges">
                            ${product.hasDiscount ? `<span class="badge" style="background:var(--danger);color:white;">-${product.discount}%</span>` : ''}
                            ${!product.active ? '<span class="badge" style="background:var(--text-tertiary);color:white;">Inactive</span>' : ''}
                        </div>
                    </div>
                    <div class="admin-product-info">
                        <div class="category-tag">${category?.name || 'Unknown'}</div>
                        <h4>${product.name}</h4>
                        <div class="price-row">
                            <span class="price-current">${Utils.Format.currency(discountedPrice, product.currency)}</span>
                            ${product.hasDiscount ? `<span class="price-original">${Utils.Format.currency(product.price, product.currency)}</span>` : ''}
                        </div>
                        <div class="admin-product-actions">
                            <button class="btn-view" onclick="adminPanel.editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="adminPanel.deleteProduct('${product.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-box"></i><p>No products yet</p></div>';

        document.getElementById('add-product-btn')?.addEventListener('click', () => this.openProductModal());
    }

    openProductModal(productId = null) {
        const form = document.getElementById('product-form');
        const title = document.getElementById('product-modal-title');
        const categorySelect = document.getElementById('product-category');
        const discountFields = document.getElementById('discount-fields');

        form.reset();
        document.getElementById('product-id').value = productId || '';
        document.getElementById('product-icon-preview').classList.add('hidden');
        discountFields.classList.add('hidden');

        title.textContent = productId ? 'Edit Product' : 'Add Product';

        // Load categories
        categorySelect.innerHTML = '<option value="">Choose Category</option>' + 
            AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        // Discount checkbox handler
        document.getElementById('product-has-discount').addEventListener('change', (e) => {
            discountFields.classList.toggle('hidden', !e.target.checked);
        });

        // Calculate discounted price
        document.getElementById('product-discount')?.addEventListener('input', () => {
            const price = parseFloat(document.getElementById('product-price').value) || 0;
            const discount = parseFloat(document.getElementById('product-discount').value) || 0;
            document.getElementById('product-discounted-price').value = Math.round(price - (price * discount / 100));
        });

        document.getElementById('product-price')?.addEventListener('input', () => {
            const price = parseFloat(document.getElementById('product-price').value) || 0;
            const discount = parseFloat(document.getElementById('product-discount').value) || 0;
            document.getElementById('product-discounted-price').value = Math.round(price - (price * discount / 100));
        });

        if (productId) {
            const product = AdminState.products.find(p => p.id === productId);
            if (product) {
                document.getElementById('product-category').value = product.categoryId;
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-price').value = product.price;
                document.getElementById('product-currency').value = product.currency || 'MMK';
                document.getElementById('product-delivery').value = product.delivery || 'instant';
                document.getElementById('product-has-discount').checked = product.hasDiscount || false;
                document.getElementById('product-active').checked = product.active !== false;
                
                if (product.hasDiscount) {
                    discountFields.classList.remove('hidden');
                    document.getElementById('product-discount').value = product.discount || 0;
                    document.getElementById('product-discounted-price').value = product.price - (product.price * product.discount / 100);
                }
                
                if (product.icon) {
                    document.getElementById('product-icon-img').src = product.icon;
                    document.getElementById('product-icon-preview').classList.remove('hidden');
                }
            }
        }

        Utils.Modal.open('product-modal');
    }

    async saveProduct(e) {
        e.preventDefault();

        const id = document.getElementById('product-id').value;
        const categoryId = document.getElementById('product-category').value;
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const currency = document.getElementById('product-currency').value;
        const delivery = document.getElementById('product-delivery').value;
        const hasDiscount = document.getElementById('product-has-discount').checked;
        const discount = hasDiscount ? parseFloat(document.getElementById('product-discount').value) || 0 : 0;
        const active = document.getElementById('product-active').checked;
        const iconInput = document.getElementById('product-icon');
        const previewImg = document.getElementById('product-icon-img');

        if (!categoryId || !name || !price) {
            Utils.Toast.warning('Required Fields', 'Please fill all required fields');
            return;
        }

        let icon = previewImg.src;
        if (iconInput.files[0]) {
            icon = await Utils.FileUpload.toBase64(iconInput.files[0]);
        }

        if (!icon || icon === '' || icon === window.location.href) {
            Utils.Toast.warning('Icon Required', 'Please upload product icon');
            return;
        }

        Utils.Loading.show('Saving product...');

        try {
            const productData = {
                id: id || Utils.generateId('prod'),
                categoryId, name, price, currency, delivery, hasDiscount, discount, active, icon,
                createdAt: id ? undefined : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (id) {
                const index = AdminState.products.findIndex(p => p.id === id);
                if (index !== -1) {
                    AdminState.products[index] = { ...AdminState.products[index], ...productData };
                }
            } else {
                AdminState.products.push(productData);
            }

            await Utils.JSONBin.update('products', AdminState.products);
            Utils.Modal.close('product-modal');
            Utils.Toast.success('Success', 'Product saved successfully');
            this.loadProducts();
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to save product');
        }

        Utils.Loading.hide();
    }

    editProduct(productId) {
        this.openProductModal(productId);
    }

    async deleteProduct(productId) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this product?');
        if (!confirmed) return;

        Utils.Loading.show('Deleting...');
        try {
            const index = AdminState.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                AdminState.products.splice(index, 1);
                await Utils.JSONBin.update('products', AdminState.products);
                Utils.Toast.success('Deleted', 'Product deleted successfully');
                this.loadProducts();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to delete product');
        }
        Utils.Loading.hide();
    }

    // ============================================
    // Input Tables Management
    // ============================================

    loadInputTables() {
        const container = document.getElementById('admin-input-tables');
        if (!container) return;

        container.innerHTML = AdminState.inputTables.length ? AdminState.inputTables.map(table => {
            const category = AdminState.categories.find(c => c.id === table.categoryId);
            return `
                <div class="input-table-card" data-table-id="${table.id}">
                    <div class="input-table-icon"><i class="fas fa-keyboard"></i></div>
                    <div class="input-table-info">
                        <h4>${table.name}</h4>
                        <div class="meta">
                            <span><i class="fas fa-folder"></i> ${category?.name || 'Unknown'}</span>
                            <span><i class="fas fa-asterisk"></i> ${table.required ? 'Required' : 'Optional'}</span>
                        </div>
                    </div>
                    <div class="input-table-actions">
                        <button class="btn-view" onclick="adminPanel.editInputTable('${table.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="adminPanel.deleteInputTable('${table.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('') : '<div class="empty-state"><i class="fas fa-keyboard"></i><p>No input tables yet</p></div>';

        document.getElementById('add-input-table-btn')?.addEventListener('click', () => this.openInputTableModal());
    }

    openInputTableModal(tableId = null) {
        const form = document.getElementById('input-table-form');
        const title = document.getElementById('input-table-modal-title');
        const categorySelect = document.getElementById('input-table-category');

        form.reset();
        document.getElementById('input-table-id').value = tableId || '';
        title.textContent = tableId ? 'Edit Input Table' : 'Add Input Table';

        categorySelect.innerHTML = '<option value="">Choose Category</option>' + 
            AdminState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        if (tableId) {
            const table = AdminState.inputTables.find(t => t.id === tableId);
            if (table) {
                document.getElementById('input-table-category').value = table.categoryId;
                document.getElementById('input-table-name').value = table.name;
                document.getElementById('input-table-placeholder').value = table.placeholder || '';
                document.getElementById('input-table-required').checked = table.required !== false;
            }
        }

        Utils.Modal.open('input-table-modal');
    }

    async saveInputTable(e) {
        e.preventDefault();

        const id = document.getElementById('input-table-id').value;
        const categoryId = document.getElementById('input-table-category').value;
        const name = document.getElementById('input-table-name').value.trim();
        const placeholder = document.getElementById('input-table-placeholder').value.trim();
        const required = document.getElementById('input-table-required').checked;

        if (!categoryId || !name) {
            Utils.Toast.warning('Required Fields', 'Please fill all required fields');
            return;
        }

        Utils.Loading.show('Saving...');

        try {
            const tableData = {
                id: id || Utils.generateId('input'),
                categoryId, name, placeholder, required,
                createdAt: id ? undefined : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (id) {
                const index = AdminState.inputTables.findIndex(t => t.id === id);
                if (index !== -1) {
                    AdminState.inputTables[index] = { ...AdminState.inputTables[index], ...tableData };
                }
            } else {
                AdminState.inputTables.push(tableData);
            }

            await Utils.JSONBin.update('inputTables', AdminState.inputTables);
            Utils.Modal.close('input-table-modal');
            Utils.Toast.success('Success', 'Input table saved successfully');
            this.loadInputTables();
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to save input table');
        }

        Utils.Loading.hide();
    }

    editInputTable(tableId) {
        this.openInputTableModal(tableId);
    }

    async deleteInputTable(tableId) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this input table?');
        if (!confirmed) return;

        Utils.Loading.show('Deleting...');
        try {
            const index = AdminState.inputTables.findIndex(t => t.id === tableId);
            if (index !== -1) {
                AdminState.inputTables.splice(index, 1);
                await Utils.JSONBin.update('inputTables', AdminState.inputTables);
                Utils.Toast.success('Deleted', 'Input table deleted successfully');
                this.loadInputTables();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to delete input table');
        }
        Utils.Loading.hide();
    }

    // ============================================
    // Payments Management
    // ============================================

    loadPayments() {
        const container = document.getElementById('admin-payments');
        if (!container) return;

        container.innerHTML = AdminState.payments.length ? AdminState.payments.map(payment => `
            <div class="payment-card" data-payment-id="${payment.id}">
                <div class="payment-card-icon"><img src="${payment.icon}" alt="${payment.name}"></div>
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
        `).join('') : '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-credit-card"></i><p>No payment methods yet</p></div>';

        document.getElementById('add-payment-btn')?.addEventListener('click', () => this.openPaymentModal());
    }

    openPaymentModal(paymentId = null) {
        const form = document.getElementById('payment-form');
        const title = document.getElementById('payment-modal-title');

        form.reset();
        document.getElementById('payment-id').value = paymentId || '';
        document.getElementById('payment-icon-preview').classList.add('hidden');
        document.querySelector('#payment-icon-upload .file-upload-content').classList.remove('hidden');

        title.textContent = paymentId ? 'Edit Payment Method' : 'Add Payment Method';

        if (paymentId) {
            const payment = AdminState.payments.find(p => p.id === paymentId);
            if (payment) {
                document.getElementById('payment-name').value = payment.name;
                document.getElementById('payment-address').value = payment.address;
                document.getElementById('payment-holder').value = payment.holder;
                document.getElementById('payment-note').value = payment.note || '';
                document.getElementById('payment-active').checked = payment.active !== false;
                if (payment.icon) {
                    document.getElementById('payment-icon-img').src = payment.icon;
                    document.getElementById('payment-icon-preview').classList.remove('hidden');
                    document.querySelector('#payment-icon-upload .file-upload-content').classList.add('hidden');
                }
            }
        }

        Utils.Modal.open('payment-modal');
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
            Utils.Toast.warning('Required Fields', 'Please fill all required fields');
            return;
        }

        let icon = previewImg.src;
        if (iconInput.files[0]) {
            icon = await Utils.FileUpload.toBase64(iconInput.files[0]);
        }

        Utils.Loading.show('Saving...');

        try {
            const paymentData = {
                id: id || Utils.generateId('pay'),
                name, address, holder, note, active, icon: icon || '',
                createdAt: id ? undefined : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (id) {
                const index = AdminState.payments.findIndex(p => p.id === id);
                if (index !== -1) {
                    AdminState.payments[index] = { ...AdminState.payments[index], ...paymentData };
                }
            } else {
                AdminState.payments.push(paymentData);
            }

            await Utils.JSONBin.update('payments', AdminState.payments);
            Utils.Modal.close('payment-modal');
            Utils.Toast.success('Success', 'Payment method saved successfully');
            this.loadPayments();
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to save payment method');
        }

        Utils.Loading.hide();
    }

    editPayment(paymentId) {
        this.openPaymentModal(paymentId);
    }

    async deletePayment(paymentId) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this payment method?');
        if (!confirmed) return;

        Utils.Loading.show('Deleting...');
        try {
            const index = AdminState.payments.findIndex(p => p.id === paymentId);
            if (index !== -1) {
                AdminState.payments.splice(index, 1);
                await Utils.JSONBin.update('payments', AdminState.payments);
                Utils.Toast.success('Deleted', 'Payment method deleted');
                this.loadPayments();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to delete payment method');
        }
        Utils.Loading.hide();
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

        Utils.Loading.show('Saving...');
        try {
            await Utils.JSONBin.update('announcements', { text });
            AdminState.settings.announcement = text;
            document.getElementById('announcement-preview').innerHTML = `<p>${text || 'No announcement set'}</p>`;
            Utils.Toast.success('Saved', 'Announcement updated successfully');
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to save announcement');
        }
        Utils.Loading.hide();
    }

    loadBroadcast() {
        document.getElementById('broadcast-count').textContent = AdminState.users.length;
    }

    async sendBroadcast(e) {
        e.preventDefault();
        const message = document.getElementById('broadcast-message').value.trim();
        if (!message) {
            Utils.Toast.warning('Message Required', 'Please enter a message');
            return;
        }

        const confirmed = await TelegramWebApp.showConfirm(`Send this message to ${AdminState.users.length} users?`);
        if (!confirmed) return;

        Utils.Loading.show('Sending broadcast...');
        // In production, this would call your bot API to send messages
        setTimeout(() => {
            Utils.Loading.hide();
            Utils.Toast.success('Broadcast Sent', `Message sent to ${AdminState.users.length} users`);
            document.getElementById('broadcast-form').reset();
        }, 2000);
    }

    loadBannedUsers() {
        const container = document.getElementById('banned-users-list');
        if (!container) return;

        container.innerHTML = AdminState.bannedUsers.length ? AdminState.bannedUsers.map(user => `
            <div class="banned-user-card" data-user-id="${user.id}">
                <img src="${TelegramWebApp.getAvatarUrl(user.id)}" alt="" class="banned-user-avatar">
                <div class="banned-user-info">
                    <h4>${user.firstName || ''} ${user.lastName || ''} (@${user.username || 'N/A'})</h4>
                    <div class="reason">Reason: ${user.reason}</div>
                    <div class="date">Banned: ${Utils.Format.date(user.bannedAt, 'datetime')}</div>
                </div>
                <button class="unban-btn" onclick="adminPanel.unbanUser('${user.id}')"><i class="fas fa-user-check"></i> Unban</button>
            </div>
        `).join('') : '<div class="empty-state"><i class="fas fa-user-check"></i><p>No banned users</p></div>';
    }

    async unbanUser(userId) {
        const confirmed = await TelegramWebApp.showConfirm('Unban this user?');
        if (!confirmed) return;

        Utils.Loading.show('Unbanning...');
        try {
            const index = AdminState.bannedUsers.findIndex(u => u.id == userId);
            if (index !== -1) {
                AdminState.bannedUsers.splice(index, 1);
                await Utils.JSONBin.update('bannedUsers', AdminState.bannedUsers);
                Utils.Toast.success('Unbanned', 'User has been unbanned');
                this.loadBannedUsers();
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to unban user');
        }
        Utils.Loading.hide();
    }

    loadSettings() {
        document.getElementById('site-name').value = AdminState.settings.siteName || 'Mafia Gaming Shop';
        if (AdminState.settings.logo) {
            document.getElementById('logo-preview-img').src = AdminState.settings.logo;
            document.getElementById('logo-preview').classList.remove('hidden');
        }
        document.querySelector(`input[name="theme"][value="${AdminState.settings.theme || 'dark'}"]`).checked = true;
    }

    async saveSettings(e) {
        e.preventDefault();

        const siteName = document.getElementById('site-name').value.trim();
        const theme = document.querySelector('input[name="theme"]:checked').value;
        const logoInput = document.getElementById('site-logo');
        const previewImg = document.getElementById('logo-preview-img');

        let logo = previewImg.src;
        if (logoInput.files[0]) {
            logo = await Utils.FileUpload.toBase64(logoInput.files[0]);
        }

        Utils.Loading.show('Saving settings...');
        try {
            AdminState.settings = { ...AdminState.settings, siteName, theme, logo };
            await Utils.JSONBin.update('settings', AdminState.settings);
            this.updateAdminInfo();
            Utils.Toast.success('Saved', 'Settings saved successfully');
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to save settings');
        }
        Utils.Loading.hide();
    }

    // ============================================
    // Event Listeners Setup
    // ============================================

    setupEventListeners() {
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => Utils.Modal.closeAll());
        });
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => Utils.Modal.closeAll());
        });

        // Forms
        document.getElementById('banner-form')?.addEventListener('submit', (e) => this.saveBanner(e));
        document.getElementById('category-form')?.addEventListener('submit', (e) => this.saveCategory(e));
        document.getElementById('product-form')?.addEventListener('submit', (e) => this.saveProduct(e));
        document.getElementById('input-table-form')?.addEventListener('submit', (e) => this.saveInputTable(e));
        document.getElementById('payment-form')?.addEventListener('submit', (e) => this.savePayment(e));
        document.getElementById('announcement-form')?.addEventListener('submit', (e) => this.saveAnnouncement(e));
        document.getElementById('broadcast-form')?.addEventListener('submit', (e) => this.sendBroadcast(e));
        document.getElementById('settings-form')?.addEventListener('submit', (e) => this.saveSettings(e));

        // Order actions
        document.getElementById('approve-order-btn')?.addEventListener('click', () => this.approveOrder());
        document.getElementById('reject-order-btn')?.addEventListener('click', () => this.rejectOrder());
        document.getElementById('approve-topup-btn')?.addEventListener('click', () => this.approveTopup());
        document.getElementById('reject-topup-btn')?.addEventListener('click', () => this.rejectTopup());

        // User modal
        document.getElementById('close-user-modal')?.addEventListener('click', () => Utils.Modal.close('user-details-modal'));
        document.getElementById('close-order-modal')?.addEventListener('click', () => Utils.Modal.close('order-details-modal'));
        document.getElementById('close-topup-request-modal')?.addEventListener('click', () => Utils.Modal.close('topup-request-modal'));

        // User modal tabs
        document.querySelectorAll('#user-details-modal .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#user-details-modal .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('#user-details-modal .user-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`${btn.dataset.tab}-tab`)?.classList.remove('hidden');
            });
        });

        // Balance adjustment
        document.getElementById('add-balance-btn')?.addEventListener('click', () => this.adjustUserBalance('add'));
        document.getElementById('deduct-balance-btn')?.addEventListener('click', () => this.adjustUserBalance('deduct'));
        document.getElementById('ban-user-btn')?.addEventListener('click', () => {
            if (AdminState.selectedUser) this.banUserById(AdminState.selectedUser.id);
        });

        // File upload previews
        this.setupFileUploads();
    }

    async adjustUserBalance(operation) {
        const amount = parseFloat(document.getElementById('adjust-balance-amount').value);
        if (!amount || amount <= 0) {
            Utils.Toast.warning('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        Utils.Loading.show('Updating balance...');
        try {
            const userIndex = AdminState.users.findIndex(u => u.id == AdminState.selectedUser.id);
            if (userIndex !== -1) {
                if (operation === 'add') {
                    AdminState.users[userIndex].balance = (AdminState.users[userIndex].balance || 0) + amount;
                } else {
                    AdminState.users[userIndex].balance = Math.max(0, (AdminState.users[userIndex].balance || 0) - amount);
                }
                await Utils.JSONBin.update('users', AdminState.users);
                document.getElementById('modal-balance').textContent = Utils.Format.currency(AdminState.users[userIndex].balance, 'MMK');
                document.getElementById('adjust-balance-amount').value = '';
                Utils.Toast.success('Updated', 'Balance updated successfully');
            }
        } catch (error) {
            Utils.Toast.error('Error', 'Failed to update balance');
        }
        Utils.Loading.hide();
    }

    setupFileUploads() {
        const fileUploads = [
            { input: 'banner-image', preview: 'banner-preview', img: 'banner-preview-img', content: '#banner-file-upload .file-upload-content' },
            { input: 'category-icon', preview: 'category-icon-preview', img: 'category-icon-img', content: '#category-icon-upload .file-upload-content' },
            { input: 'product-icon', preview: 'product-icon-preview', img: 'product-icon-img', content: '#product-icon-upload .file-upload-content' },
            { input: 'payment-icon', preview: 'payment-icon-preview', img: 'payment-icon-img', content: '#payment-icon-upload .file-upload-content' },
            { input: 'site-logo', preview: 'logo-preview', img: 'logo-preview-img', content: '#logo-upload .file-upload-content' },
            { input: 'broadcast-image', preview: 'broadcast-image-preview', img: 'broadcast-image-img', content: '#broadcast-image-upload .file-upload-content' }
        ];

        fileUploads.forEach(({ input, preview, img, content }) => {
            document.getElementById(input)?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const base64 = await Utils.FileUpload.toBase64(file);
                    document.getElementById(img).src = base64;
                    document.getElementById(preview)?.classList.remove('hidden');
                    document.querySelector(content)?.classList.add('hidden');
                }
            });
        });

        // Remove file buttons
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = btn.closest('.file-upload');
                container.querySelector('input[type="file"]').value = '';
                container.querySelector('.file-preview')?.classList.add('hidden');
                container.querySelector('.file-upload-content')?.classList.remove('hidden');
            });
        });
    }
}

// ============================================
// Initialize Admin Panel
// ============================================

let adminPanel = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('👑 Loading Admin Panel...');
    adminPanel = new AdminPanel();
    await adminPanel.init();
    window.adminPanel = adminPanel;
});

console.log('👑 Admin.js loaded');
