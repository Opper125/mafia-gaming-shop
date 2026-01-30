// ============================================
// ADMIN PANEL FUNCTIONALITY
// ============================================

const AdminPanel = {
    // State
    isAuthenticated: false,
    currentSection: 'dashboard',
    
    // Initialize admin panel
    async init() {
        console.log('Initializing admin panel...');
        
        // Check if user is admin
        if (!TelegramApp.isAdmin()) {
            this.showAccessDenied();
            return false;
        }
        
        // Check authentication
        const isAuth = await this.checkAuth();
        if (!isAuth) {
            this.showAuthScreen();
            return false;
        }
        
        // Load admin panel
        await this.loadDashboard();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        
        return true;
    },
    
    // Show access denied
    showAccessDenied() {
        const deniedScreen = document.getElementById('admin-access-denied');
        const authScreen = document.getElementById('admin-auth');
        const panel = document.getElementById('admin-panel');
        
        if (deniedScreen) deniedScreen.classList.remove('hidden');
        if (authScreen) authScreen.classList.add('hidden');
        if (panel) panel.classList.add('hidden');
    },
    
    // Show auth screen
    showAuthScreen() {
        const deniedScreen = document.getElementById('admin-access-denied');
        const authScreen = document.getElementById('admin-auth');
        const panel = document.getElementById('admin-panel');
        
        if (deniedScreen) deniedScreen.classList.add('hidden');
        if (authScreen) authScreen.classList.remove('hidden');
        if (panel) panel.classList.add('hidden');
    },
    
    // Show admin panel
    showPanel() {
        const deniedScreen = document.getElementById('admin-access-denied');
        const authScreen = document.getElementById('admin-auth');
        const panel = document.getElementById('admin-panel');
        
        if (deniedScreen) deniedScreen.classList.add('hidden');
        if (authScreen) authScreen.classList.add('hidden');
        if (panel) panel.classList.remove('hidden');
    },
    
    // Check authentication
    async checkAuth() {
        const authToken = await TelegramApp.cloudStorage.getItem('admin_auth_token');
        const authExpiry = await TelegramApp.cloudStorage.getItem('admin_auth_expiry');
        
        if (authToken && authExpiry && Date.now() < authExpiry) {
            this.isAuthenticated = true;
            return true;
        }
        
        return false;
    },
    
    // Authenticate admin
    async authenticate(password) {
        Animations.showLoading('Verifying...');
        
        try {
            // In production, this should verify against Telegram's 2FA
            // For now, we'll use a simple verification
            // The password should match the admin's Telegram 2FA password
            
            if (!password || password.length < 4) {
                Animations.hideLoading();
                Animations.showError('Invalid password');
                return false;
            }
            
            // Store auth token (expires in 24 hours)
            const token = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
            const expiry = Date.now() + (24 * 60 * 60 * 1000);
            
            await TelegramApp.cloudStorage.setItem('admin_auth_token', token);
            await TelegramApp.cloudStorage.setItem('admin_auth_expiry', expiry);
            
            this.isAuthenticated = true;
            this.showPanel();
            await this.loadDashboard();
            
            Animations.hideLoading();
            Animations.showSuccess('Welcome, Admin!');
            
            // Notify via bot
            await BotAPI.notifyAdmin('🔐 Admin panel accessed');
            
            return true;
        } catch (error) {
            console.error('Auth error:', error);
            Animations.hideLoading();
            Animations.showError('Authentication failed');
            return false;
        }
    },
    
    // Logout
    async logout() {
        await TelegramApp.cloudStorage.removeItem('admin_auth_token');
        await TelegramApp.cloudStorage.removeItem('admin_auth_expiry');
        this.isAuthenticated = false;
        this.showAuthScreen();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // File upload previews
        this.setupFileUploads();
    },
    
    // Setup file uploads
    setupFileUploads() {
        // Category icon
        const categoryIcon = document.getElementById('category-icon');
        if (categoryIcon) {
            categoryIcon.addEventListener('change', (e) => {
                this.previewImage(e.target, 'category-icon-preview');
            });
        }
        
        // Product icon
        const productIcon = document.getElementById('product-icon');
        if (productIcon) {
            productIcon.addEventListener('change', (e) => {
                this.previewImage(e.target, 'product-icon-preview');
            });
        }
        
        // Banner image
        const bannerImage = document.getElementById('banner-image');
        if (bannerImage) {
            bannerImage.addEventListener('change', (e) => {
                this.previewImage(e.target, 'banner-preview');
            });
        }
        
        // Payment icon
        const paymentIcon = document.getElementById('payment-icon-input');
        if (paymentIcon) {
            paymentIcon.addEventListener('change', (e) => {
                this.previewImage(e.target, 'payment-icon-preview');
            });
        }
        
        // Logo upload
        const logoUpload = document.getElementById('logo-upload');
        if (logoUpload) {
            logoUpload.addEventListener('change', (e) => {
                this.previewImage(e.target, 'current-logo-preview', true);
            });
        }
        
        // Broadcast image
        const broadcastImage = document.getElementById('broadcast-image');
        if (broadcastImage) {
            broadcastImage.addEventListener('change', (e) => {
                this.previewImage(e.target, 'broadcast-preview');
            });
        }
    },
    
    // Preview image
    async previewImage(input, previewId, isImg = false) {
        const preview = document.getElementById(previewId);
        if (!preview || !input.files || !input.files[0]) return;
        
        const file = input.files[0];
        
        // Validate
        const validation = await ContentFilter.validateImage(file);
        if (!validation.valid) {
            Animations.showError(validation.reason);
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (isImg) {
                preview.src = e.target.result;
            } else {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            }
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    },
    
    // Start real-time updates
    startRealTimeUpdates() {
        // Update every 30 seconds
        setInterval(async () => {
            if (this.currentSection === 'dashboard') {
                await this.loadDashboardStats();
            } else if (this.currentSection === 'orders') {
                await this.loadOrders();
            } else if (this.currentSection === 'topups') {
                await this.loadTopups();
            }
        }, 30000);
        
        // Update time every second
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    },
    
    // Update current time
    updateCurrentTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    },
    
    // ============================================
    // SECTION NAVIGATION
    // ============================================
    
    showSection(sectionName) {
        this.currentSection = sectionName;
        
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`section-${sectionName}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update nav
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });
        
        // Load section data
        this.loadSectionData(sectionName);
        
        // Haptic feedback
        TelegramApp.haptic('selection');
    },
    
    // Load section data
    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'topups':
                await this.loadTopups();
                break;
            case 'categories':
                await this.loadCategories();
                break;
            case 'products':
                await this.loadProducts();
                break;
            case 'banners':
                await this.loadBanners();
                break;
            case 'payments':
                await this.loadPayments();
                break;
            case 'input-tables':
                await this.loadInputTables();
                break;
            case 'announcements':
                await this.loadAnnouncements();
                break;
            case 'settings':
                await this.loadSettings();
                break;
            case 'banned':
                await this.loadBannedUsers();
                break;
        }
    },
    
    // ============================================
    // DASHBOARD
    // ============================================
    
    async loadDashboard() {
        await this.loadDashboardStats();
        await this.loadRecentOrders();
        this.updateCurrentTime();
    },
    
    async loadDashboardStats() {
        try {
            const stats = await Database.getStats();
            
            document.getElementById('stat-users').textContent = stats.totalUsers.toLocaleString();
            document.getElementById('stat-orders').textContent = stats.totalOrders.toLocaleString();
            document.getElementById('stat-revenue').textContent = stats.totalRevenue.toLocaleString() + ' MMK';
            document.getElementById('stat-pending').textContent = stats.pendingOrders.toLocaleString();
            
            // Update badges
            document.getElementById('pending-orders-badge').textContent = stats.pendingOrders;
            document.getElementById('pending-topups-badge').textContent = stats.pendingTopups;
        } catch (error) {
            console.error('Load stats error:', error);
        }
    },
    
    async loadRecentOrders() {
        const container = document.getElementById('recent-orders');
        if (!container) return;
        
        try {
            const orders = await Database.getOrders();
            const recentOrders = orders.slice(-10).reverse();
            
            if (recentOrders.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No orders yet</p></div>';
                return;
            }
            
            container.innerHTML = recentOrders.map(order => `
                <div class="recent-order-item">
                    <div class="order-info">
                        <span class="order-id">${order.orderId}</span>
                        <span class="order-product">${order.productName}</span>
                    </div>
                    <div class="order-meta">
                        <span class="order-amount">${order.amount} ${order.currency}</span>
                        <span class="status-badge ${order.status}">${order.status}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load recent orders error:', error);
        }
    },
    
    // ============================================
    // USERS MANAGEMENT
    // ============================================
    
    async loadUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        Animations.showLoading('Loading users...');
        
        try {
            const users = await Database.getUsers();
            
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
                Animations.hideLoading();
                return;
            }
            
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img src="${user.photoUrl || TelegramApp.getUserPhoto()}" alt="${user.firstName}">
                            <span>${user.firstName} ${user.lastName || ''}</span>
                        </div>
                    </td>
                    <td><code>${user.telegramId}</code></td>
                    <td>${(user.balance || 0).toLocaleString()} MMK</td>
                    <td>${user.totalOrders || 0}</td>
                    <td>${user.isPremium ? '<span class="badge premium">Premium</span>' : '-'}</td>
                    <td><span class="status-badge ${user.isBanned ? 'rejected' : 'approved'}">${user.isBanned ? 'Banned' : 'Active'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="view-btn" onclick="AdminPanel.viewUser('${user.telegramId}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${user.isBanned ? 
                                `<button class="approve-btn" onclick="AdminPanel.unbanUser('${user.telegramId}')">Unban</button>` :
                                `<button class="reject-btn" onclick="AdminPanel.banUser('${user.telegramId}')">Ban</button>`
                            }
                        </div>
                    </td>
                </tr>
            `).join('');
            
            Animations.hideLoading();
        } catch (error) {
            console.error('Load users error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to load users');
        }
    },
    
    async viewUser(telegramId) {
        const user = await Database.getUser(parseInt(telegramId));
        if (!user) {
            Animations.showError('User not found');
            return;
        }
        
        const orders = await Database.getOrdersByUser(parseInt(telegramId));
        const topups = await Database.getTopupsByUser(parseInt(telegramId));
        
        const content = document.getElementById('user-detail-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="user-detail-header">
                <img src="${user.photoUrl || TelegramApp.getUserPhoto()}" alt="${user.firstName}" class="user-detail-avatar">
                <div class="user-detail-info">
                    <h3>${user.firstName} ${user.lastName || ''}</h3>
                    <p>@${user.username || 'N/A'}</p>
                    <p>ID: <code>${user.telegramId}</code></p>
                </div>
            </div>
            
            <div class="user-stats-grid">
                <div class="user-stat">
                    <span class="value">${(user.balance || 0).toLocaleString()} MMK</span>
                    <span class="label">Balance</span>
                </div>
                <div class="user-stat">
                    <span class="value">${orders.length}</span>
                    <span class="label">Total Orders</span>
                </div>
                <div class="user-stat">
                    <span class="value">${orders.filter(o => o.status === 'approved').length}</span>
                    <span class="label">Approved</span>
                </div>
                <div class="user-stat">
                    <span class="value">${orders.filter(o => o.status === 'rejected').length}</span>
                    <span class="label">Rejected</span>
                </div>
            </div>
            
            <div class="user-detail-section">
                <h4>Recent Orders</h4>
                ${orders.length > 0 ? orders.slice(0, 5).map(order => `
                    <div class="mini-order">
                        <span>${order.productName}</span>
                        <span>${order.amount} ${order.currency}</span>
                        <span class="status-badge ${order.status}">${order.status}</span>
                    </div>
                `).join('') : '<p>No orders</p>'}
            </div>
            
            <div class="user-detail-section">
                <h4>Top-up History</h4>
                ${topups.length > 0 ? topups.slice(0, 5).map(topup => `
                    <div class="mini-order">
                        <span>${topup.amount} MMK</span>
                        <span>${topup.paymentMethod}</span>
                        <span class="status-badge ${topup.status}">${topup.status}</span>
                    </div>
                `).join('') : '<p>No top-ups</p>'}
            </div>
            
            <div class="user-actions">
                <button class="btn" onclick="AdminPanel.adjustBalance('${user.telegramId}')">
                    <i class="fas fa-wallet"></i> Adjust Balance
                </button>
                ${user.isBanned ?
                    `<button class="btn success" onclick="AdminPanel.unbanUser('${user.telegramId}')"><i class="fas fa-check"></i> Unban User</button>` :
                    `<button class="btn danger" onclick="AdminPanel.banUser('${user.telegramId}')"><i class="fas fa-ban"></i> Ban User</button>`
                }
            </div>
        `;
        
        Animations.openModal('user-detail-modal');
    },
    
    async banUser(telegramId) {
        const confirmed = await TelegramApp.showConfirm('Are you sure you want to ban this user?');
        if (!confirmed) return;
        
        Animations.showLoading('Banning user...');
        
        try {
            await Database.banUser(parseInt(telegramId), 'Banned by admin');
            await BotAPI.sendUserNotification(parseInt(telegramId), 'account_banned', { reason: 'Banned by admin' });
            
            Animations.hideLoading();
            Animations.showSuccess('User banned successfully');
            
            // Reload users
            await this.loadUsers();
        } catch (error) {
            console.error('Ban user error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to ban user');
        }
    },
    
    async unbanUser(telegramId) {
        Animations.showLoading('Unbanning user...');
        
        try {
            await Database.unbanUser(parseInt(telegramId));
            await BotAPI.sendUserNotification(parseInt(telegramId), 'account_unbanned', {});
            
            Animations.hideLoading();
            Animations.showSuccess('User unbanned successfully');
            
            // Reload users
            await this.loadUsers();
            await this.loadBannedUsers();
        } catch (error) {
            console.error('Unban user error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to unban user');
        }
    },
    
    async adjustBalance(telegramId) {
        const amount = prompt('Enter amount to add (negative to subtract):');
        if (!amount) return;
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            Animations.showError('Invalid amount');
            return;
        }
        
        Animations.showLoading('Adjusting balance...');
        
        try {
            await Database.updateBalance(parseInt(telegramId), numAmount, 'add');
            
            Animations.hideLoading();
            Animations.showSuccess('Balance adjusted successfully');
            
            // Close modal and reload
            Animations.closeModal('user-detail-modal');
            await this.loadUsers();
        } catch (error) {
            console.error('Adjust balance error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to adjust balance');
        }
    },
    
    // ============================================
    // ORDERS MANAGEMENT
    // ============================================
    
    async loadOrders(filter = 'all') {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        try {
            let orders = await Database.getOrders();
            orders = orders.sort((a, b) => b.timestamp - a.timestamp);
            
            if (filter !== 'all') {
                orders = orders.filter(o => o.status === filter);
            }
            
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
                return;
            }
            
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td><code>${order.orderId}</code></td>
                    <td>${order.userName}</td>
                    <td>${order.productName}</td>
                    <td>${order.amount} ${order.currency}</td>
                    <td><code>${order.gameId || 'N/A'}</code></td>
                    <td><span class="status-badge ${order.status}">${order.status}</span></td>
                    <td>${new Date(order.timestamp).toLocaleDateString()}</td>
                    <td>
                        <div class="table-actions">
                            ${order.status === 'pending' ? `
                                <button class="approve-btn" onclick="AdminPanel.approveOrder('${order.orderId}')">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="reject-btn" onclick="AdminPanel.rejectOrder('${order.orderId}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Load orders error:', error);
        }
    },
    
    async approveOrder(orderId) {
        const confirmed = await TelegramApp.showConfirm('Approve this order?');
        if (!confirmed) return;
        
        Animations.showLoading('Approving order...');
        
        try {
            const order = await Database.getOrder(orderId);
            if (!order) {
                Animations.hideLoading();
                Animations.showError('Order not found');
                return;
            }
            
            // Update order status
            await Database.updateOrderStatus(orderId, 'approved');
            
            // Update category sold count
            if (order.categoryId) {
                await Database.updateCategorySoldCount(order.categoryId, 1);
            }
            
            // Notify user
            await BotAPI.sendUserNotification(order.userId, 'order_approved', {
                productName: order.productName,
                amount: order.amount,
                currency: order.currency,
                gameId: order.gameId
            });
            
            Animations.hideLoading();
            Animations.showSuccess('Order approved!');
            
            await this.loadOrders();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Approve order error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to approve order');
        }
    },
    
    async rejectOrder(orderId) {
        const reason = prompt('Enter rejection reason (optional):');
        
        Animations.showLoading('Rejecting order...');
        
        try {
            const order = await Database.getOrder(orderId);
            if (!order) {
                Animations.hideLoading();
                Animations.showError('Order not found');
                return;
            }
            
            // Update order status
            await Database.updateOrderStatus(orderId, 'rejected', { rejectReason: reason });
            
            // Refund balance
            await Database.updateBalance(order.userId, order.amount, 'add');
            
            // Notify user
            await BotAPI.sendUserNotification(order.userId, 'order_rejected', {
                productName: order.productName,
                amount: order.amount,
                currency: order.currency,
                reason: reason
            });
            
            Animations.hideLoading();
            Animations.showSuccess('Order rejected and refunded');
            
            await this.loadOrders();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Reject order error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to reject order');
        }
    },
    
    // ============================================
    // TOPUPS MANAGEMENT
    // ============================================
    
    async loadTopups(filter = 'all') {
        const container = document.getElementById('topups-grid');
        if (!container) return;
        
        try {
            let topups = await Database.getTopups();
            topups = topups.sort((a, b) => b.timestamp - a.timestamp);
            
            if (filter !== 'all') {
                topups = topups.filter(t => t.status === filter);
            }
            
            if (topups.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No top-up requests</p></div>';
                return;
            }
            
            container.innerHTML = topups.map(topup => `
                <div class="topup-card">
                    <div class="topup-card-header">
                        <div class="topup-user">
                            <img src="${topup.userPhoto || ''}" alt="${topup.userName}">
                            <div>
                                <strong>${topup.userName}</strong>
                                <small>@${topup.username || 'N/A'}</small>
                            </div>
                        </div>
                        <span class="status-badge ${topup.status}">${topup.status}</span>
                    </div>
                    <div class="topup-amount">${topup.amount.toLocaleString()} MMK</div>
                    <div class="topup-info">
                        <p><i class="fas fa-credit-card"></i> ${topup.paymentMethod}</p>
                        <p><i class="fas fa-clock"></i> ${new Date(topup.timestamp).toLocaleString()}</p>
                    </div>
                    ${topup.receiptImage ? `
                        <div class="topup-receipt" onclick="AdminPanel.viewReceipt('${topup.receiptImage}')">
                            <img src="${topup.receiptImage}" alt="Receipt">
                        </div>
                    ` : ''}
                    ${topup.status === 'pending' ? `
                        <div class="topup-actions">
                            <button class="approve-btn" onclick="AdminPanel.approveTopup('${topup.requestId}')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="reject-btn" onclick="AdminPanel.rejectTopup('${topup.requestId}')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Load topups error:', error);
        }
    },
    
    viewReceipt(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'receipt-modal';
        modal.innerHTML = `
            <div class="receipt-modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="receipt-modal-content">
                <img src="${imageUrl}" alt="Receipt">
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    async approveTopup(requestId) {
        const confirmed = await TelegramApp.showConfirm('Approve this top-up request?');
        if (!confirmed) return;
        
        Animations.showLoading('Approving top-up...');
        
        try {
            const topups = await Database.getTopups();
            const topup = topups.find(t => t.requestId === requestId);
            
            if (!topup) {
                Animations.hideLoading();
                Animations.showError('Top-up request not found');
                return;
            }
            
            // Update topup status
            await Database.updateTopupStatus(requestId, 'approved');
            
            // Add balance to user
            const newBalance = await Database.updateBalance(topup.userId, topup.amount, 'add');
            
            // Notify user
            await BotAPI.sendUserNotification(topup.userId, 'topup_approved', {
                amount: topup.amount,
                newBalance: newBalance
            });
            
            Animations.hideLoading();
            Animations.showSuccess('Top-up approved!');
            
            await this.loadTopups();
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Approve topup error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to approve top-up');
        }
    },
    
    async rejectTopup(requestId) {
        const reason = prompt('Enter rejection reason:');
        
        Animations.showLoading('Rejecting top-up...');
        
        try {
            const topups = await Database.getTopups();
            const topup = topups.find(t => t.requestId === requestId);
            
            if (!topup) {
                Animations.hideLoading();
                Animations.showError('Top-up request not found');
                return;
            }
            
            // Update topup status
            await Database.updateTopupStatus(requestId, 'rejected', { rejectReason: reason });
            
            // Notify user
            await BotAPI.sendUserNotification(topup.userId, 'topup_rejected', {
                amount: topup.amount,
                reason: reason
            });
            
            Animations.hideLoading();
            Animations.showSuccess('Top-up rejected');
            
            await this.loadTopups();
        } catch (error) {
            console.error('Reject topup error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to reject top-up');
        }
    },
    
    // ============================================
    // CATEGORIES MANAGEMENT
    // ============================================
    
    async loadCategories() {
        const container = document.getElementById('categories-admin-grid');
        if (!container) return;
        
        try {
            const categories = await Database.getCategories();
            
            if (categories.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No categories yet</p></div>';
                return;
            }
            
            container.innerHTML = categories.map(cat => `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <img src="${cat.icon}" alt="${cat.name}" class="admin-card-icon">
                        <div>
                            <h4 class="admin-card-title">${cat.name}</h4>
                            <span class="category-flag">${cat.flag || ''}</span>
                            ${cat.hasDiscount ? '<span class="discount-tag">SALE</span>' : ''}
                        </div>
                    </div>
                    <p>Sold: ${cat.soldCount || 0} items</p>
                    <div class="admin-card-actions">
                        <button class="edit-btn" onclick="AdminPanel.editCategory('${cat.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="AdminPanel.deleteCategory('${cat.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Update category dropdowns
            this.updateCategoryDropdowns(categories);
        } catch (error) {
            console.error('Load categories error:', error);
        }
    },
    
    updateCategoryDropdowns(categories) {
        const dropdowns = [
            'product-category',
            'banner-category',
            'input-table-category',
            'product-category-filter'
        ];
        
        dropdowns.forEach(id => {
            const dropdown = document.getElementById(id);
            if (dropdown) {
                const firstOption = dropdown.querySelector('option:first-child');
                dropdown.innerHTML = firstOption ? firstOption.outerHTML : '<option value="">Select category</option>';
                
                categories.forEach(cat => {
                    dropdown.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
            }
        });
    },
    
    openCategoryModal(categoryId = null) {
        document.getElementById('edit-category-id').value = categoryId || '';
        document.getElementById('category-name').value = '';
        document.getElementById('category-flag').value = '';
        document.getElementById('category-has-discount').checked = false;
        document.getElementById('category-icon-preview').innerHTML = '';
        document.getElementById('category-icon').value = '';
        
        document.getElementById('category-modal-title').textContent = categoryId ? 'Edit Category' : 'Add Category';
        
        if (categoryId) {
            this.loadCategoryForEdit(categoryId);
        }
        
        Animations.openModal('category-modal');
    },
    
    async loadCategoryForEdit(categoryId) {
        const category = await Database.getCategory(categoryId);
        if (category) {
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-flag').value = category.flag || '';
            document.getElementById('category-has-discount').checked = category.hasDiscount || false;
            
            if (category.icon) {
                document.getElementById('category-icon-preview').innerHTML = `<img src="${category.icon}" alt="Icon">`;
            }
        }
    },
    
    async editCategory(categoryId) {
        this.openCategoryModal(categoryId);
    },
    
    async saveCategory() {
        const id = document.getElementById('edit-category-id').value;
        const name = document.getElementById('category-name').value.trim();
        const flag = document.getElementById('category-flag').value;
        const hasDiscount = document.getElementById('category-has-discount').checked;
        const iconFile = document.getElementById('category-icon').files[0];
        
        if (!name) {
            Animations.showError('Please enter category name');
            return;
        }
        
        Animations.showLoading('Saving category...');
        
        try {
            let icon = '';
            
            if (iconFile) {
                icon = await ImageStorage.storeIconImage(iconFile);
            } else if (id) {
                const existing = await Database.getCategory(id);
                icon = existing ? existing.icon : '';
            }
            
            if (!icon && !id) {
                Animations.hideLoading();
                Animations.showError('Please upload category icon');
                return;
            }
            
            const categoryData = {
                id: id || null,
                name,
                flag,
                hasDiscount,
                icon
            };
            
            await Database.saveCategory(categoryData);
            
            // Notify via Telegram
            await BotAPI.notifyAdmin(`📁 Category ${id ? 'updated' : 'created'}: ${name}`);
            
            Animations.hideLoading();
            Animations.closeModal('category-modal');
            Animations.showSuccess('Category saved successfully!');
            
            await this.loadCategories();
        } catch (error) {
            console.error('Save category error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to save category');
        }
    },
    
    async deleteCategory(categoryId) {
        const confirmed = await TelegramApp.showConfirm('Delete this category? All products in this category will also be removed.');
        if (!confirmed) return;
        
        Animations.showLoading('Deleting category...');
        
        try {
            await Database.deleteCategory(categoryId);
            
            Animations.hideLoading();
            Animations.showSuccess('Category deleted');
            
            await this.loadCategories();
        } catch (error) {
            console.error('Delete category error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to delete category');
        }
    },
    
    // ============================================
    // PRODUCTS MANAGEMENT
    // ============================================
    
    async loadProducts(categoryFilter = 'all') {
        const container = document.getElementById('products-admin-grid');
        if (!container) return;
        
        try {
            let products = await Database.getProducts();
            
            if (categoryFilter !== 'all') {
                products = products.filter(p => p.categoryId === categoryFilter);
            }
            
            if (products.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No products yet</p></div>';
                return;
            }
            
            // Get categories for names
            const categories = await Database.getCategories();
            const categoryMap = {};
            categories.forEach(c => categoryMap[c.id] = c.name);
            
            container.innerHTML = products.map(product => `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <img src="${product.icon}" alt="${product.name}" class="admin-card-icon">
                        <div>
                            <h4 class="admin-card-title">${product.name}</h4>
                            <small>${categoryMap[product.categoryId] || 'Unknown'}</small>
                        </div>
                    </div>
                    <div class="product-price-info">
                        ${product.discount > 0 ? `
                            <span class="original-price">${product.price} ${product.currency}</span>
                            <span class="discounted-price">${Math.round(product.price * (1 - product.discount / 100))} ${product.currency}</span>
                            <span class="discount-badge">-${product.discount}%</span>
                        ` : `
                            <span class="current-price">${product.price} ${product.currency}</span>
                        `}
                    </div>
                    <p>Delivery: ${product.deliveryTime || 'Instant'}</p>
                    <div class="admin-card-actions">
                        <button class="edit-btn" onclick="AdminPanel.editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="AdminPanel.deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load products error:', error);
        }
    },
    
    openProductModal(productId = null) {
        document.getElementById('edit-product-id').value = productId || '';
        document.getElementById('product-category').value = '';
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-currency').value = 'MMK';
        document.getElementById('product-discount').value = '0';
        document.getElementById('product-delivery').value = 'instant';
        document.getElementById('product-icon-preview').innerHTML = '';
        document.getElementById('product-icon').value = '';
        
        document.getElementById('product-modal-admin-title').textContent = productId ? 'Edit Product' : 'Add Product';
        
        if (productId) {
            this.loadProductForEdit(productId);
        }
        
        Animations.openModal('product-modal-admin');
    },
    
    async loadProductForEdit(productId) {
        const product = await Database.getProduct(productId);
        if (product) {
            document.getElementById('product-category').value = product.categoryId;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-currency').value = product.currency || 'MMK';
            document.getElementById('product-discount').value = product.discount || 0;
            document.getElementById('product-delivery').value = product.deliveryTime || 'instant';
            
            if (product.icon) {
                document.getElementById('product-icon-preview').innerHTML = `<img src="${product.icon}" alt="Icon">`;
            }
        }
    },
    
    async editProduct(productId) {
        this.openProductModal(productId);
    },
    
    async saveProduct() {
        const id = document.getElementById('edit-product-id').value;
        const categoryId = document.getElementById('product-category').value;
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const currency = document.getElementById('product-currency').value;
        const discount = parseInt(document.getElementById('product-discount').value) || 0;
        const deliveryTime = document.getElementById('product-delivery').value;
        const iconFile = document.getElementById('product-icon').files[0];
        
        if (!categoryId || !name || !price) {
            Animations.showError('Please fill all required fields');
            return;
        }
        
        Animations.showLoading('Saving product...');
        
        try {
            let icon = '';
            
            if (iconFile) {
                icon = await ImageStorage.storeIconImage(iconFile);
            } else if (id) {
                const existing = await Database.getProduct(id);
                icon = existing ? existing.icon : '';
            }
            
            if (!icon && !id) {
                Animations.hideLoading();
                Animations.showError('Please upload product icon');
                return;
            }
            
            const productData = {
                id: id || null,
                categoryId,
                name,
                price,
                currency,
                discount,
                deliveryTime,
                icon
            };
            
            await Database.saveProduct(productData);
            
            // Notify via Telegram
            await BotAPI.notifyAdmin(`📦 Product ${id ? 'updated' : 'created'}: ${name}`);
            
            Animations.hideLoading();
            Animations.closeModal('product-modal-admin');
            Animations.showSuccess('Product saved successfully!');
            
            await this.loadProducts();
        } catch (error) {
            console.error('Save product error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to save product');
        }
    },
    
    async deleteProduct(productId) {
        const confirmed = await TelegramApp.showConfirm('Delete this product?');
        if (!confirmed) return;
        
        Animations.showLoading('Deleting product...');
        
        try {
            await Database.deleteProduct(productId);
            
            Animations.hideLoading();
            Animations.showSuccess('Product deleted');
            
            await this.loadProducts();
        } catch (error) {
            console.error('Delete product error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to delete product');
        }
    },
    
    // ============================================
    // BANNERS MANAGEMENT
    // ============================================
    
    async loadBanners() {
        await this.loadBannersByType('type1');
        await this.loadBannersByType('type2');
    },
    
    async loadBannersByType(type) {
        const container = document.getElementById(`banners-${type}-grid`);
        if (!container) return;
        
        try {
            const banners = await Database.getBannersByType(type);
            
            if (banners.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No banners</p></div>';
                return;
            }
            
            container.innerHTML = banners.map(banner => `
                <div class="admin-card banner-card">
                    <img src="${banner.image}" alt="Banner" class="banner-preview-img">
                    ${type === 'type2' && banner.categoryId ? `<p>Category: ${banner.categoryId}</p>` : ''}
                    ${banner.description ? `<p class="banner-desc">${banner.description.substring(0, 50)}...</p>` : ''}
                    <div class="admin-card-actions">
                        <button class="delete-btn" onclick="AdminPanel.deleteBanner('${type}', '${banner.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load banners error:', error);
        }
    },
    
    showBannerType(type) {
        document.querySelectorAll('.banner-type-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`banner-${type}`).classList.remove('hidden');
        
        document.querySelectorAll('.banner-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    },
    
    openBannerModal(type) {
        document.getElementById('banner-type-input').value = type;
        document.getElementById('edit-banner-id').value = '';
        document.getElementById('banner-preview').innerHTML = '';
        document.getElementById('banner-image').value = '';
        document.getElementById('banner-description').value = '';
        
        // Show/hide category selection for type2
        document.querySelectorAll('.type2-only').forEach(el => {
            el.classList.toggle('hidden', type !== 'type2');
        });
        
        document.getElementById('banner-modal-title').textContent = type === 'type1' ? 'Add Home Banner' : 'Add Category Banner';
        
        Animations.openModal('banner-modal');
    },
    
    async saveBanner() {
        const type = document.getElementById('banner-type-input').value;
        const categoryId = document.getElementById('banner-category').value;
        const description = document.getElementById('banner-description').value;
        const imageFile = document.getElementById('banner-image').files[0];
        
        if (!imageFile) {
            Animations.showError('Please upload banner image');
            return;
        }
        
        if (type === 'type2' && !categoryId) {
            Animations.showError('Please select a category');
            return;
        }
        
        Animations.showLoading('Uploading banner...');
        
        try {
            const image = await ImageStorage.storeBannerImage(imageFile);
            
            const bannerData = {
                image,
                categoryId: type === 'type2' ? categoryId : null,
                description: type === 'type2' ? description : null
            };
            
            await Database.saveBanner(type, bannerData);
            
            // Notify via Telegram
            await BotAPI.notifyAdmin(`🖼️ Banner uploaded (${type})`);
            
            Animations.hideLoading();
            Animations.closeModal('banner-modal');
            Animations.showSuccess('Banner saved successfully!');
            
            await this.loadBanners();
        } catch (error) {
            console.error('Save banner error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to save banner');
        }
    },
    
    async deleteBanner(type, bannerId) {
        const confirmed = await TelegramApp.showConfirm('Delete this banner?');
        if (!confirmed) return;
        
        Animations.showLoading('Deleting banner...');
        
        try {
            await Database.deleteBanner(type, bannerId);
            
            Animations.hideLoading();
            Animations.showSuccess('Banner deleted');
            
            await this.loadBanners();
        } catch (error) {
            console.error('Delete banner error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to delete banner');
        }
    },
    
    // ============================================
    // PAYMENTS MANAGEMENT
    // ============================================
    
    async loadPayments() {
        const container = document.getElementById('payments-grid');
        if (!container) return;
        
        try {
            const payments = await Database.getPayments();
            
            if (payments.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No payment methods</p></div>';
                return;
            }
            
            container.innerHTML = payments.map(payment => `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <img src="${payment.icon}" alt="${payment.name}" class="admin-card-icon">
                        <h4 class="admin-card-title">${payment.name}</h4>
                    </div>
                    <p><strong>Address:</strong> ${payment.address}</p>
                    <p><strong>Receiver:</strong> ${payment.receiver}</p>
                    ${payment.note ? `<p class="note">${payment.note}</p>` : ''}
                    <div class="admin-card-actions">
                        <button class="edit-btn" onclick="AdminPanel.editPayment('${payment.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="AdminPanel.deletePayment('${payment.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load payments error:', error);
        }
    },
    
    openPaymentModal(paymentId = null) {
        document.getElementById('edit-payment-id').value = paymentId || '';
        document.getElementById('payment-name-input').value = '';
        document.getElementById('payment-address-input').value = '';
        document.getElementById('payment-receiver-input').value = '';
        document.getElementById('payment-note-input').value = '';
        document.getElementById('payment-icon-preview').innerHTML = '';
        document.getElementById('payment-icon-input').value = '';
        
        document.getElementById('payment-modal-title').textContent = paymentId ? 'Edit Payment Method' : 'Add Payment Method';
        
        if (paymentId) {
            this.loadPaymentForEdit(paymentId);
        }
        
        Animations.openModal('payment-modal');
    },
    
    async loadPaymentForEdit(paymentId) {
        const payments = await Database.getPayments();
        const payment = payments.find(p => p.id === paymentId);
        
        if (payment) {
            document.getElementById('payment-name-input').value = payment.name;
            document.getElementById('payment-address-input').value = payment.address;
            document.getElementById('payment-receiver-input').value = payment.receiver;
            document.getElementById('payment-note-input').value = payment.note || '';
            
            if (payment.icon) {
                document.getElementById('payment-icon-preview').innerHTML = `<img src="${payment.icon}" alt="Icon">`;
            }
        }
    },
    
    async editPayment(paymentId) {
        this.openPaymentModal(paymentId);
    },
    
    async savePayment() {
        const id = document.getElementById('edit-payment-id').value;
        const name = document.getElementById('payment-name-input').value.trim();
        const address = document.getElementById('payment-address-input').value.trim();
        const receiver = document.getElementById('payment-receiver-input').value.trim();
        const note = document.getElementById('payment-note-input').value.trim();
        const iconFile = document.getElementById('payment-icon-input').files[0];
        
        if (!name || !address || !receiver) {
            Animations.showError('Please fill all required fields');
            return;
        }
        
        Animations.showLoading('Saving payment method...');
        
        try {
            let icon = '';
            
            if (iconFile) {
                icon = await ImageStorage.storeIconImage(iconFile);
            } else if (id) {
                const payments = await Database.getPayments();
                const existing = payments.find(p => p.id === id);
                icon = existing ? existing.icon : '';
            }
            
            if (!icon && !id) {
                Animations.hideLoading();
                Animations.showError('Please upload payment icon');
                return;
            }
            
            const paymentData = {
                id: id || null,
                name,
                address,
                receiver,
                note,
                icon
            };
            
            await Database.savePayment(paymentData);
            
            Animations.hideLoading();
            Animations.closeModal('payment-modal');
            Animations.showSuccess('Payment method saved!');
            
            await this.loadPayments();
        } catch (error) {
            console.error('Save payment error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to save payment method');
        }
    },
    
    async deletePayment(paymentId) {
        const confirmed = await TelegramApp.showConfirm('Delete this payment method?');
        if (!confirmed) return;
        
        Animations.showLoading('Deleting payment method...');
        
        try {
            await Database.deletePayment(paymentId);
            
            Animations.hideLoading();
            Animations.showSuccess('Payment method deleted');
            
            await this.loadPayments();
        } catch (error) {
            console.error('Delete payment error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to delete payment method');
        }
    },
    
    // ============================================
    // INPUT TABLES MANAGEMENT
    // ============================================
    
    async loadInputTables() {
        const container = document.getElementById('input-tables-grid');
        if (!container) return;
        
        try {
            const inputTables = await Database.getInputTables();
            const categories = await Database.getCategories();
            const categoryMap = {};
            categories.forEach(c => categoryMap[c.id] = c.name);
            
            if (inputTables.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No input tables</p></div>';
                return;
            }
            
            container.innerHTML = inputTables.map(input => `
                <div class="admin-card">
                    <h4>${input.name}</h4>
                    <p>Category: ${categoryMap[input.categoryId] || 'Unknown'}</p>
                    <p>Placeholder: "${input.placeholder}"</p>
                    <div class="admin-card-actions">
                        <button class="edit-btn" onclick="AdminPanel.editInputTable('${input.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="AdminPanel.deleteInputTable('${input.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load input tables error:', error);
        }
    },
    
    openInputTableModal(inputTableId = null) {
        document.getElementById('edit-input-table-id').value = inputTableId || '';
        document.getElementById('input-table-category').value = '';
        document.getElementById('input-table-name').value = '';
        document.getElementById('input-table-placeholder').value = '';
        
        document.getElementById('input-table-modal-title').textContent = inputTableId ? 'Edit Input Table' : 'Add Input Table';
        
        if (inputTableId) {
            this.loadInputTableForEdit(inputTableId);
        }
        
        Animations.openModal('input-table-modal');
    },
    
    async loadInputTableForEdit(inputTableId) {
        const inputTables = await Database.getInputTables();
        const inputTable = inputTables.find(i => i.id === inputTableId);
        
        if (inputTable) {
            document.getElementById('input-table-category').value = inputTable.categoryId;
            document.getElementById('input-table-name').value = inputTable.name;
            document.getElementById('input-table-placeholder').value = inputTable.placeholder;
        }
    },
    
    async editInputTable(inputTableId) {
        this.openInputTableModal(inputTableId);
    },
    
    async saveInputTable() {
        const id = document.getElementById('edit-input-table-id').value;
        const categoryId = document.getElementById('input-table-category').value;
        const name = document.getElementById('input-table-name').value.trim();
        const placeholder = document.getElementById('input-table-placeholder').value.trim();
        
        if (!categoryId || !name || !placeholder) {
            Animations.showError('Please fill all fields');
            return;
        }
        
        Animations.showLoading('Saving input table...');
        
        try {
            const inputTableData = {
                id: id || null,
                categoryId,
                name,
                placeholder
            };
            
            await Database.saveInputTable(inputTableData);
            
            Animations.hideLoading();
            Animations.closeModal('input-table-modal');
            Animations.showSuccess('Input table saved!');
            
            await this.loadInputTables();
        } catch (error) {
            console.error('Save input table error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to save input table');
        }
    },
    
    async deleteInputTable(inputTableId) {
        const confirmed = await TelegramApp.showConfirm('Delete this input table?');
        if (!confirmed) return;
        
        Animations.showLoading('Deleting input table...');
        
        try {
            await Database.deleteInputTable(inputTableId);
            
            Animations.hideLoading();
            Animations.showSuccess('Input table deleted');
            
            await this.loadInputTables();
        } catch (error) {
            console.error('Delete input table error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to delete input table');
        }
    },
    
    // ============================================
    // ANNOUNCEMENTS
    // ============================================
    
    async loadAnnouncements() {
        try {
            const settings = await Database.getSettings();
            document.getElementById('announcement-input').value = settings.announcement || '';
            document.getElementById('current-announcement-text').textContent = settings.announcement || 'No announcement set';
        } catch (error) {
            console.error('Load announcements error:', error);
        }
    },
    
    async saveAnnouncement() {
        const announcement = document.getElementById('announcement-input').value.trim();
        
        Animations.showLoading('Saving announcement...');
        
        try {
            await Database.saveSettings({ announcement });
            
            document.getElementById('current-announcement-text').textContent = announcement || 'No announcement set';
            
            Animations.hideLoading();
            Animations.showSuccess('Announcement saved!');
        } catch (error) {
            console.error('Save announcement error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to save announcement');
        }
    },
    
    // ============================================
    // BROADCAST
    // ============================================
    
    async sendBroadcast() {
        const message = document.getElementById('broadcast-message').value.trim();
        const imageFile = document.getElementById('broadcast-image').files[0];
        
        if (!message) {
            Animations.showError('Please enter a message');
            return;
        }
        
        const confirmed = await TelegramApp.showConfirm('Send this broadcast to all users?');
        if (!confirmed) return;
        
        Animations.showLoading('Sending broadcast...');
        
        try {
            const users = await Database.getUsers();
            const userIds = users.map(u => u.telegramId);
            
            let image = null;
            if (imageFile) {
                image = await ImageStorage.storeImage(imageFile);
            }
            
            const results = await BotAPI.broadcast(userIds, message, image);
            
            Animations.hideLoading();
            Animations.showSuccess(`Broadcast sent! Success: ${results.success}, Failed: ${results.failed}`);
            
            // Clear form
            document.getElementById('broadcast-message').value = '';
            document.getElementById('broadcast-image').value = '';
            document.getElementById('broadcast-preview').classList.add('hidden');
        } catch (error) {
            console.error('Broadcast error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to send broadcast');
        }
    },
    
    // ============================================
    // SETTINGS
    // ============================================
    
    async loadSettings() {
        try {
            const settings = await Database.getSettings();
            
            document.getElementById('setting-site-name').value = settings.siteName || 'Gaming Shop';
            
            if (settings.siteLogo) {
                document.getElementById('current-logo-preview').src = settings.siteLogo;
            }
        } catch (error) {
            console.error('Load settings error:', error);
        }
    },
    
    async saveSettings() {
        const siteName = document.getElementById('setting-site-name').value.trim();
        const logoFile = document.getElementById('logo-upload').files[0];
        
        if (!siteName) {
            Animations.showError('Please enter site name');
            return;
        }
        
        Animations.showLoading('Saving settings...');
        
        try {
            let siteLogo = null;
            
            if (logoFile) {
                siteLogo = await ImageStorage.storeIconImage(logoFile);
            }
            
            const settingsData = { siteName };
            if (siteLogo) {
                settingsData.siteLogo = siteLogo;
            }
            
            await Database.saveSettings(settingsData);
            
            Animations.hideLoading();
            Animations.showSuccess('Settings saved!');
        } catch (error) {
            console.error('Save settings error:', error);
            Animations.hideLoading();
            Animations.showError('Failed to save settings');
        }
    },
    
    // ============================================
    // BANNED USERS
    // ============================================
    
    async loadBannedUsers() {
        const container = document.getElementById('banned-users-list');
        if (!container) return;
        
        try {
            const bannedUsers = await Database.getBannedUsers();
            
            if (bannedUsers.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No banned users</p></div>';
                return;
            }
            
            container.innerHTML = bannedUsers.map(banned => `
                <div class="banned-user-card">
                    <div class="banned-user-info">
                        <span class="user-id">ID: ${banned.telegramId}</span>
                        <span class="ban-reason">${banned.reason || 'No reason'}</span>
                        <span class="ban-date">${new Date(banned.bannedAt).toLocaleDateString()}</span>
                    </div>
                    <button class="unban-btn" onclick="AdminPanel.unbanUser('${banned.telegramId}')">
                        <i class="fas fa-undo"></i> Unban
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load banned users error:', error);
        }
    }
};

// Global functions for HTML onclick handlers
function showAdminSection(section) {
    AdminPanel.showSection(section);
}

function authenticateAdmin() {
    const password = document.getElementById('admin-auth-password').value;
    AdminPanel.authenticate(password);
}

function filterAdminOrders() {
    const filter = document.getElementById('order-filter').value;
    AdminPanel.loadOrders(filter);
}

function filterAdminTopups() {
    const filter = document.getElementById('topup-filter').value;
    AdminPanel.loadTopups(filter);
}

function filterAdminProducts() {
    const filter = document.getElementById('product-category-filter').value;
    AdminPanel.loadProducts(filter);
}

function openCategoryModal() {
    AdminPanel.openCategoryModal();
}

function openProductModal() {
    AdminPanel.openProductModal();
}

function openBannerModal(type) {
    AdminPanel.openBannerModal(type);
}

function openPaymentModal() {
    AdminPanel.openPaymentModal();
}

function openInputTableModal() {
    AdminPanel.openInputTableModal();
}

function showBannerType(type) {
    AdminPanel.showBannerType(type);
}

function saveCategory() {
    AdminPanel.saveCategory();
}

function saveProduct() {
    AdminPanel.saveProduct();
}

function saveBanner() {
    AdminPanel.saveBanner();
}

function savePayment() {
    AdminPanel.savePayment();
}

function saveInputTable() {
    AdminPanel.saveInputTable();
}

function saveAnnouncement() {
    AdminPanel.saveAnnouncement();
}

function sendBroadcast() {
    AdminPanel.sendBroadcast();
}

function saveSettings() {
    AdminPanel.saveSettings();
}

function searchUsers() {
    // Implement user search
    const query = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function previewLogo(input) {
    AdminPanel.previewImage(input, 'current-logo-preview', true);
}

// Export
window.AdminPanel = AdminPanel;
