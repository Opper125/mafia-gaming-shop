// js/admin.js - Admin Panel Functions

const Admin = {
    currentTab: 'dashboard',
    
    // Initialize admin panel
    async init() {
        console.log('⚙️ Initializing Admin Panel...');
        
        // Check admin access
        if (!Auth.checkAdmin()) {
            UI.showToast('Access denied', 'error');
            return;
        }
        
        // Show back button
        TelegramWebApp.showBackButton(() => {
            this.exitAdmin();
        });
        
        // Render admin panel
        await this.render();
    },

    // Render admin panel
    async render() {
        const mainContent = document.getElementById('main-content');
        
        mainContent.innerHTML = `
            <div class="admin-panel">
                <div class="admin-header">
                    <div class="admin-title">
                        <span class="admin-icon">⚙️</span>
                        <h1>Admin Panel</h1>
                    </div>
                    <div class="admin-user">
                        <span>👑 ${Auth.getUser()?.firstName || 'Admin'}</span>
                    </div>
                </div>
                
                <div class="admin-nav">
                    <button class="admin-nav-btn active" data-tab="dashboard" onclick="Admin.switchTab('dashboard')">
                        <span>📊</span>
                        <span>Dashboard</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="users" onclick="Admin.switchTab('users')">
                        <span>👥</span>
                        <span>Users</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="orders" onclick="Admin.switchTab('orders')">
                        <span>📦</span>
                        <span>Orders</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="deposits" onclick="Admin.switchTab('deposits')">
                        <span>💰</span>
                        <span>Deposits</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="categories" onclick="Admin.switchTab('categories')">
                        <span>📁</span>
                        <span>Categories</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="products" onclick="Admin.switchTab('products')">
                        <span>🛍️</span>
                        <span>Products</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="banners" onclick="Admin.switchTab('banners')">
                        <span>🖼️</span>
                        <span>Banners</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="payments" onclick="Admin.switchTab('payments')">
                        <span>💳</span>
                        <span>Payments</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="inputs" onclick="Admin.switchTab('inputs')">
                        <span>📝</span>
                        <span>Input Tables</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="settings" onclick="Admin.switchTab('settings')">
                        <span>⚙️</span>
                        <span>Settings</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="broadcast" onclick="Admin.switchTab('broadcast')">
                        <span>📢</span>
                        <span>Broadcast</span>
                    </button>
                    <button class="admin-nav-btn" data-tab="banned" onclick="Admin.switchTab('banned')">
                        <span>🚫</span>
                        <span>Banned</span>
                    </button>
                </div>
                
                <div class="admin-content" id="admin-content">
                    <!-- Tab content will be loaded here -->
                </div>
            </div>
        `;
        
        // Load default tab
        await this.switchTab('dashboard');
    },

    // Switch tab
    async switchTab(tab) {
        this.currentTab = tab;
        
        // Update nav buttons
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Load tab content
        const content = document.getElementById('admin-content');
        content.innerHTML = `
            <div class="admin-loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        
        switch (tab) {
            case 'dashboard':
                await this.renderDashboard();
                break;
            case 'users':
                await this.renderUsers();
                break;
            case 'orders':
                await this.renderOrders();
                break;
            case 'deposits':
                await this.renderDeposits();
                break;
            case 'categories':
                await this.renderCategories();
                break;
            case 'products':
                await this.renderProducts();
                break;
            case 'banners':
                await this.renderBanners();
                break;
            case 'payments':
                await this.renderPayments();
                break;
            case 'inputs':
                await this.renderInputTables();
                break;
            case 'settings':
                await this.renderSettings();
                break;
            case 'broadcast':
                await this.renderBroadcast();
                break;
            case 'banned':
                await this.renderBanned();
                break;
        }
    },

    // ==================== DASHBOARD ====================
    
    async renderDashboard() {
        const stats = await Database.getStatistics();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-dashboard">
                <h2 class="admin-section-title">📊 Dashboard Overview</h2>
                
                <div class="stats-grid">
                    <div class="stat-card purple">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.totalUsers}</span>
                            <span class="stat-label">Total Users</span>
                        </div>
                    </div>
                    <div class="stat-card gold">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.premiumUsers}</span>
                            <span class="stat-label">Premium Users</span>
                        </div>
                    </div>
                    <div class="stat-card blue">
                        <div class="stat-icon">📦</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.totalOrders}</span>
                            <span class="stat-label">Total Orders</span>
                        </div>
                    </div>
                    <div class="stat-card orange">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.pendingOrders}</span>
                            <span class="stat-label">Pending Orders</span>
                        </div>
                    </div>
                    <div class="stat-card green">
                        <div class="stat-icon">✅</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.approvedOrders}</span>
                            <span class="stat-label">Approved Orders</span>
                        </div>
                    </div>
                    <div class="stat-card yellow">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.pendingDeposits}</span>
                            <span class="stat-label">Pending Deposits</span>
                        </div>
                    </div>
                    <div class="stat-card pink">
                        <div class="stat-icon">🛍️</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.totalProducts}</span>
                            <span class="stat-label">Products</span>
                        </div>
                    </div>
                    <div class="stat-card cyan">
                        <div class="stat-icon">📁</div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.totalCategories}</span>
                            <span class="stat-label">Categories</span>
                        </div>
                    </div>
                </div>
                
                <div class="revenue-section">
                    <div class="revenue-card">
                        <h3>💵 Total Revenue</h3>
                        <span class="revenue-amount">${UI.formatCurrency(stats.totalRevenue)}</span>
                    </div>
                    <div class="revenue-card">
                        <h3>💰 Total Deposits</h3>
                        <span class="revenue-amount">${UI.formatCurrency(stats.totalDepositAmount)}</span>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h3>⚡ Quick Actions</h3>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="Admin.switchTab('orders')">
                            <span>📦</span>
                            <span>View Orders</span>
                            ${stats.pendingOrders > 0 ? `<span class="badge">${stats.pendingOrders}</span>` : ''}
                        </button>
                        <button class="action-btn" onclick="Admin.switchTab('deposits')">
                            <span>💰</span>
                            <span>View Deposits</span>
                            ${stats.pendingDeposits > 0 ? `<span class="badge">${stats.pendingDeposits}</span>` : ''}
                        </button>
                        <button class="action-btn" onclick="Admin.showAddCategoryModal()">
                            <span>➕</span>
                            <span>Add Category</span>
                        </button>
                        <button class="action-btn" onclick="Admin.showAddProductModal()">
                            <span>🛍️</span>
                            <span>Add Product</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ==================== USERS ====================
    
    async renderUsers() {
        const users = await Database.getAllUsers();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-users">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">👥 Users Management</h2>
                    <span class="count-badge">${users.length} users</span>
                </div>
                
                <div class="search-bar">
                    <input type="text" class="search-input" placeholder="Search users..." 
                           onkeyup="Admin.filterUsers(this.value)">
                    <span class="search-icon">🔍</span>
                </div>
                
                <div class="users-list" id="users-list">
                    ${users.length > 0 ? users.map(user => `
                        <div class="user-card" data-user-id="${user.telegramId}">
                            <div class="user-avatar">
                                ${user.photoUrl ? 
                                    `<img src="${user.photoUrl}" alt="Avatar">` :
                                    `<span>${(user.firstName || 'U').charAt(0)}</span>`
                                }
                                ${user.isPremium ? '<span class="premium-badge">⭐</span>' : ''}
                            </div>
                            <div class="user-info">
                                <div class="user-name">${user.firstName || ''} ${user.lastName || ''}</div>
                                <div class="user-username">@${user.username || 'N/A'}</div>
                                <div class="user-id">ID: ${user.telegramId}</div>
                            </div>
                            <div class="user-stats">
                                <div class="stat">
                                    <span class="label">Balance:</span>
                                    <span class="value">${UI.formatCurrency(user.balance)}</span>
                                </div>
                                <div class="stat">
                                    <span class="label">Orders:</span>
                                    <span class="value">${user.totalOrders || 0}</span>
                                </div>
                            </div>
                            <div class="user-actions">
                                <button class="icon-btn" onclick="Admin.viewUserDetails('${user.telegramId}')" title="View Details">
                                    👁️
                                </button>
                                <button class="icon-btn" onclick="Admin.editUserBalance('${user.telegramId}')" title="Edit Balance">
                                    💰
                                </button>
                                <button class="icon-btn danger" onclick="Admin.banUserPrompt('${user.telegramId}')" title="Ban User">
                                    🚫
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <span>👥</span>
                            <p>No users yet</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Filter users
    filterUsers(query) {
        const cards = document.querySelectorAll('.user-card');
        query = query.toLowerCase();
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'flex' : 'none';
        });
    },

    // View user details
    async viewUserDetails(telegramId) {
        const user = await Database.getUser(telegramId);
        const orders = await Database.getOrders({ telegramId });
        const deposits = await Database.getDeposits({ telegramId });
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content user-detail-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>👤 User Details</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="user-detail-header">
                            <div class="user-avatar large">
                                ${user.photoUrl ? 
                                    `<img src="${user.photoUrl}" alt="Avatar">` :
                                    `<span>${(user.firstName || 'U').charAt(0)}</span>`
                                }
                                ${user.isPremium ? '<span class="premium-badge">⭐</span>' : ''}
                            </div>
                            <div class="user-detail-info">
                                <h3>${user.firstName || ''} ${user.lastName || ''}</h3>
                                <p>@${user.username || 'N/A'}</p>
                                <p class="telegram-id">Telegram ID: <code>${user.telegramId}</code></p>
                            </div>
                        </div>
                        
                        <div class="user-stats-grid">
                            <div class="stat-item">
                                <span class="label">Balance</span>
                                <span class="value">${UI.formatCurrency(user.balance)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Total Deposits</span>
                                <span class="value">${UI.formatCurrency(user.totalDeposits)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Total Spent</span>
                                <span class="value">${UI.formatCurrency(user.totalSpent)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Total Orders</span>
                                <span class="value">${user.totalOrders || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Approved</span>
                                <span class="value success">${user.approvedOrders || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Rejected</span>
                                <span class="value danger">${user.rejectedOrders || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Pending</span>
                                <span class="value warning">${user.pendingOrders || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">Premium</span>
                                <span class="value">${user.isPremium ? 'Yes ⭐' : 'No'}</span>
                            </div>
                        </div>
                        
                        <div class="user-dates">
                            <p>📅 Joined: ${new Date(user.createdAt).toLocaleString()}</p>
                            <p>🕐 Last Active: ${new Date(user.lastActive).toLocaleString()}</p>
                        </div>
                        
                        <div class="user-history-section">
                            <h4>Recent Orders (${orders.length})</h4>
                            <div class="mini-list">
                                ${orders.slice(0, 5).map(order => `
                                    <div class="mini-item ${order.status}">
                                        <span>${order.productName}</span>
                                        <span>${UI.formatCurrency(order.price)}</span>
                                        <span class="status">${order.status}</span>
                                    </div>
                                `).join('') || '<p class="no-data">No orders</p>'}
                            </div>
                            
                            <h4>Recent Deposits (${deposits.length})</h4>
                            <div class="mini-list">
                                ${deposits.slice(0, 5).map(dep => `
                                    <div class="mini-item ${dep.status}">
                                        <span>${dep.paymentMethodName}</span>
                                        <span>${UI.formatCurrency(dep.amount)}</span>
                                        <span class="status">${dep.status}</span>
                                    </div>
                                `).join('') || '<p class="no-data">No deposits</p>'}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Close</button>
                        <button class="btn btn-primary" onclick="Admin.editUserBalance('${user.telegramId}')">
                            💰 Edit Balance
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Edit user balance
    async editUserBalance(telegramId) {
        const user = await Database.getUser(telegramId);
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>💰 Edit Balance</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <p>User: <strong>${user.firstName} (@${user.username || 'N/A'})</strong></p>
                        <p>Current Balance: <strong>${UI.formatCurrency(user.balance)}</strong></p>
                        
                        <div class="input-group">
                            <label class="input-label">Operation</label>
                            <select class="input-field" id="balance-operation">
                                <option value="add">➕ Add Balance</option>
                                <option value="subtract">➖ Subtract Balance</option>
                                <option value="set">🔄 Set Balance</option>
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Amount (MMK)</label>
                            <input type="number" class="input-field" id="balance-amount" placeholder="Enter amount" min="0">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Reason (Optional)</label>
                            <input type="text" class="input-field" id="balance-reason" placeholder="e.g., Bonus, Refund, etc.">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.updateUserBalance('${telegramId}')">
                            ✅ Update
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Update user balance
    async updateUserBalance(telegramId) {
        const operation = document.getElementById('balance-operation').value;
        const amount = parseFloat(document.getElementById('balance-amount').value);
        const reason = document.getElementById('balance-reason').value;
        
        if (!amount || amount <= 0) {
            UI.showToast('Please enter valid amount', 'error');
            return;
        }
        
        UI.showModalLoading('Updating...');
        
        try {
            await Database.updateUserBalance(telegramId, amount, operation);
            
            // Notify user
            const opText = operation === 'add' ? 'added to' : operation === 'subtract' ? 'deducted from' : 'set to';
            await TelegramAPI.sendMessage(
                telegramId,
                `💰 <b>Balance Update</b>\n\n` +
                `Your balance has been ${opText} ${UI.formatCurrency(amount)}.\n` +
                `${reason ? `Reason: ${reason}` : ''}\n\n` +
                `📅 ${new Date().toLocaleString('my-MM')}`
            );
            
            UI.closeModal();
            UI.showToast('Balance updated successfully!', 'success');
            
            // Refresh users list
            await this.renderUsers();
            
        } catch (error) {
            console.error('Error updating balance:', error);
            UI.showToast('Failed to update balance', 'error');
        }
    },

    // Ban user prompt
    async banUserPrompt(telegramId) {
        const confirmed = await TelegramWebApp.showConfirm(
            'Are you sure you want to ban this user?'
        );
        
        if (!confirmed) return;
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>🚫 Ban User</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Reason for ban</label>
                            <textarea class="input-field" id="ban-reason" rows="3" 
                                      placeholder="Enter reason..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-danger" onclick="Admin.confirmBan('${telegramId}')">
                            🚫 Ban User
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Confirm ban
    async confirmBan(telegramId) {
        const reason = document.getElementById('ban-reason').value || 'Violation of terms';
        
        await Database.banUser(telegramId, reason);
        
        UI.closeModal();
        UI.showToast('User banned successfully', 'success');
        
        await this.renderUsers();
    },

    // ==================== ORDERS ====================
    
    async renderOrders() {
        const orders = await Database.getOrders({ type: 'purchase' });
        const content = document.getElementById('admin-content');
        
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const otherOrders = orders.filter(o => o.status !== 'pending');
        
        content.innerHTML = `
            <div class="admin-orders">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">📦 Orders Management</h2>
                    <div class="filter-tabs">
                        <button class="filter-btn active" onclick="Admin.filterOrders('all')">All (${orders.length})</button>
                        <button class="filter-btn" onclick="Admin.filterOrders('pending')">Pending (${pendingOrders.length})</button>
                        <button class="filter-btn" onclick="Admin.filterOrders('approved')">Approved</button>
                        <button class="filter-btn" onclick="Admin.filterOrders('rejected')">Rejected</button>
                    </div>
                </div>
                
                ${pendingOrders.length > 0 ? `
                    <div class="pending-section">
                        <h3 class="subsection-title">⏳ Pending Orders (${pendingOrders.length})</h3>
                        <div class="orders-list">
                            ${pendingOrders.map(order => this.renderOrderCard(order)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="all-orders-section">
                    <h3 class="subsection-title">📋 All Orders</h3>
                    <div class="orders-list" id="orders-list">
                        ${orders.length > 0 ? orders.map(order => this.renderOrderCard(order)).join('') : `
                            <div class="empty-state">
                                <span>📦</span>
                                <p>No orders yet</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    // Render order card
    renderOrderCard(order) {
        return `
            <div class="order-card ${order.status}" data-order-id="${order.id}" data-status="${order.status}">
                <div class="order-header">
                    <div class="order-id">
                        <span class="label">Order ID:</span>
                        <code>${order.orderId}</code>
                    </div>
                    <span class="status-badge ${order.status}">${order.status}</span>
                </div>
                <div class="order-body">
                    <div class="order-user">
                        <span>👤</span>
                        <span>${order.firstName} (@${order.username || 'N/A'})</span>
                        <code class="user-id">${order.telegramId}</code>
                    </div>
                    <div class="order-product">
                        <span>🛍️</span>
                        <span>${order.productName} - ${order.productAmount}</span>
                    </div>
                    <div class="order-category">
                        <span>📁</span>
                        <span>${order.categoryName || 'N/A'}</span>
                    </div>
                    <div class="order-price">
                        <span>💰</span>
                        <span>${UI.formatCurrency(order.price)}</span>
                    </div>
                    ${Object.keys(order.inputData || {}).length > 0 ? `
                        <div class="order-inputs">
                            <span>📝 Input Data:</span>
                            <div class="input-data">
                                ${Object.entries(order.inputData).map(([key, value]) => `
                                    <div class="input-item">
                                        <span class="key">${key}:</span>
                                        <span class="value">${value}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="order-date">
                        <span>📅</span>
                        <span>${new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                ${order.status === 'pending' ? `
                    <div class="order-actions">
                        <button class="btn btn-success" onclick="Admin.approveOrder('${order.id}')">
                            ✅ Approve
                        </button>
                        <button class="btn btn-danger" onclick="Admin.rejectOrderPrompt('${order.id}')">
                            ❌ Reject
                        </button>
                    </div>
                ` : `
                    <div class="order-processed">
                        <span>Processed: ${order.processedAt ? new Date(order.processedAt).toLocaleString() : 'N/A'}</span>
                        ${order.note ? `<span>Note: ${order.note}</span>` : ''}
                    </div>
                `}
            </div>
        `;
    },

    // Filter orders
    filterOrders(status) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(status));
        });
        
        document.querySelectorAll('.order-card').forEach(card => {
            if (status === 'all') {
                card.style.display = 'block';
            } else {
                card.style.display = card.dataset.status === status ? 'block' : 'none';
            }
        });
    },

    // Approve order
    async approveOrder(orderId) {
        const confirmed = await TelegramWebApp.showConfirm('Approve this order?');
        if (!confirmed) return;
        
        UI.showToast('Processing...', 'info');
        
        try {
            await Database.approveOrder(orderId);
            UI.showToast('Order approved!', 'success');
            TelegramWebApp.haptic('notification', 'success');
            await this.renderOrders();
        } catch (error) {
            console.error('Error approving order:', error);
            UI.showToast('Failed to approve order', 'error');
        }
    },

    // Reject order prompt
    async rejectOrderPrompt(orderId) {
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>❌ Reject Order</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Reason for rejection</label>
                            <textarea class="input-field" id="reject-reason" rows="3" 
                                      placeholder="Enter reason..."></textarea>
                        </div>
                        <p class="note">⚠️ The user's balance will be refunded.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-danger" onclick="Admin.confirmRejectOrder('${orderId}')">
                            ❌ Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Confirm reject order
    async confirmRejectOrder(orderId) {
        const reason = document.getElementById('reject-reason').value || '';
        
        UI.showModalLoading('Processing...');
        
        try {
            await Database.rejectOrder(orderId, reason);
            UI.closeModal();
            UI.showToast('Order rejected and refunded!', 'success');
            await this.renderOrders();
        } catch (error) {
            console.error('Error rejecting order:', error);
            UI.showToast('Failed to reject order', 'error');
        }
    },

    // ==================== DEPOSITS ====================
    
    async renderDeposits() {
        const deposits = await Database.getDeposits();
        const content = document.getElementById('admin-content');
        
        const pendingDeposits = deposits.filter(d => d.status === 'pending');
        
        content.innerHTML = `
            <div class="admin-deposits">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">💰 Deposits Management</h2>
                    <div class="filter-tabs">
                        <button class="filter-btn active" onclick="Admin.filterDeposits('all')">All (${deposits.length})</button>
                        <button class="filter-btn" onclick="Admin.filterDeposits('pending')">Pending (${pendingDeposits.length})</button>
                        <button class="filter-btn" onclick="Admin.filterDeposits('approved')">Approved</button>
                        <button class="filter-btn" onclick="Admin.filterDeposits('rejected')">Rejected</button>
                    </div>
                </div>
                
                <div class="deposits-list" id="deposits-list">
                    ${deposits.length > 0 ? deposits.map(deposit => `
                        <div class="deposit-card ${deposit.status}" data-deposit-id="${deposit.id}" data-status="${deposit.status}">
                            <div class="deposit-header">
                                <div class="deposit-id">
                                    <span class="label">Deposit ID:</span>
                                    <code>${deposit.depositId}</code>
                                </div>
                                <span class="status-badge ${deposit.status}">${deposit.status}</span>
                            </div>
                            <div class="deposit-body">
                                <div class="deposit-user">
                                    <span>👤</span>
                                    <span>${deposit.firstName} (@${deposit.username || 'N/A'})</span>
                                    <code class="user-id">${deposit.telegramId}</code>
                                </div>
                                <div class="deposit-amount">
                                    <span>💵</span>
                                    <span class="amount">${UI.formatCurrency(deposit.amount)}</span>
                                </div>
                                <div class="deposit-method">
                                    <span>💳</span>
                                    <span>${deposit.paymentMethodName}</span>
                                </div>
                                <div class="deposit-receipt">
                                    <span>📄 Receipt:</span>
                                    <img src="${deposit.receiptImage}" alt="Receipt" 
                                         onclick="Admin.viewReceipt('${deposit.receiptImage}')" 
                                         class="receipt-thumb">
                                </div>
                                <div class="deposit-date">
                                    <span>📅</span>
                                    <span>${new Date(deposit.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            ${deposit.status === 'pending' ? `
                                <div class="deposit-actions">
                                    <button class="btn btn-success" onclick="Admin.approveDeposit('${deposit.id}')">
                                        ✅ Approve
                                    </button>
                                    <button class="btn btn-danger" onclick="Admin.rejectDepositPrompt('${deposit.id}')">
                                        ❌ Reject
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <span>💰</span>
                            <p>No deposits yet</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Filter deposits
    filterDeposits(status) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(status));
        });
        
        document.querySelectorAll('.deposit-card').forEach(card => {
            if (status === 'all') {
                card.style.display = 'block';
            } else {
                card.style.display = card.dataset.status === status ? 'block' : 'none';
            }
        });
    },

    // View receipt
    viewReceipt(imageUrl) {
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content receipt-modal" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="UI.closeModal()">×</button>
                    <img src="${imageUrl}" alt="Receipt" class="receipt-full">
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Approve deposit
    async approveDeposit(depositId) {
        const confirmed = await TelegramWebApp.showConfirm('Approve this deposit?');
        if (!confirmed) return;
        
        UI.showToast('Processing...', 'info');
        
        try {
            await Database.approveDeposit(depositId);
            UI.showToast('Deposit approved!', 'success');
            TelegramWebApp.haptic('notification', 'success');
            await this.renderDeposits();
        } catch (error) {
            console.error('Error approving deposit:', error);
            UI.showToast('Failed to approve deposit', 'error');
        }
    },

    // Reject deposit prompt
    async rejectDepositPrompt(depositId) {
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>❌ Reject Deposit</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Reason for rejection</label>
                            <textarea class="input-field" id="deposit-reject-reason" rows="3" 
                                      placeholder="Enter reason..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-danger" onclick="Admin.confirmRejectDeposit('${depositId}')">
                            ❌ Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Confirm reject deposit
    async confirmRejectDeposit(depositId) {
        const reason = document.getElementById('deposit-reject-reason').value || '';
        
        UI.showModalLoading('Processing...');
        
        try {
            await Database.rejectDeposit(depositId, reason);
            UI.closeModal();
            UI.showToast('Deposit rejected!', 'success');
            await this.renderDeposits();
        } catch (error) {
            console.error('Error rejecting deposit:', error);
            UI.showToast('Failed to reject deposit', 'error');
        }
    },

    // ==================== CATEGORIES ====================
    
    async renderCategories() {
        const categories = await Database.getCategories();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-categories">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">📁 Categories Management</h2>
                    <button class="btn btn-primary" onclick="Admin.showAddCategoryModal()">
                        <span>➕</span>
                        <span>Add Category</span>
                    </button>
                </div>
                
                <div class="categories-list">
                    ${categories.length > 0 ? categories.map(cat => `
                        <div class="admin-category-card">
                            <div class="category-icon">
                                ${cat.icon ? `<img src="${cat.icon}" alt="${cat.name}">` : '📁'}
                                ${cat.countryFlag ? `<img src="${cat.countryFlag}" alt="Flag" class="flag-overlay">` : ''}
                            </div>
                            <div class="category-info">
                                <h3>${cat.name}</h3>
                                <p>✅ ${cat.totalSold || 0} sold</p>
                                ${cat.hasDiscount ? '<span class="discount-tag">🔥 Has Discount</span>' : ''}
                            </div>
                            <div class="category-actions">
                                <button class="icon-btn" onclick="Admin.editCategory('${cat.id}')" title="Edit">
                                    ✏️
                                </button>
                                <button class="icon-btn danger" onclick="Admin.deleteCategory('${cat.id}')" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <span>📁</span>
                            <p>No categories yet</p>
                            <button class="btn btn-primary" onclick="Admin.showAddCategoryModal()">
                                Add First Category
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Show add category modal
    showAddCategoryModal() {
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>➕ Add Category</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Category Name *</label>
                            <input type="text" class="input-field" id="cat-name" placeholder="e.g., PUBG Mobile">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Category Icon</label>
                            <div class="file-upload-small" onclick="document.getElementById('cat-icon-file').click()">
                                <input type="file" id="cat-icon-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'cat-icon-preview')" hidden>
                                <div id="cat-icon-preview" class="icon-preview">
                                    <span>📤 Upload Icon</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Country Flag (Optional)</label>
                            <div class="file-upload-small" onclick="document.getElementById('cat-flag-file').click()">
                                <input type="file" id="cat-flag-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'cat-flag-preview')" hidden>
                                <div id="cat-flag-preview" class="icon-preview">
                                    <span>🏳️ Upload Flag</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="input-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="cat-has-discount">
                                <span>🔥 Has Discount Products</span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.saveCategory()">
                            ✅ Save Category
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
        this.uploadedCatIcon = null;
        this.uploadedCatFlag = null;
    },

    // Handle icon upload
    async handleIconUpload(event, previewId) {
        const file = event.target.files[0];
        if (!file) return;
        
        const preview = document.getElementById(previewId);
        preview.innerHTML = '<div class="spinner small"></div>';
        
        try {
            const base64 = await ImageUploader.uploadImage(file);
            preview.innerHTML = `<img src="${base64}" alt="Preview">`;
            
            if (previewId === 'cat-icon-preview') {
                this.uploadedCatIcon = base64;
            } else if (previewId === 'cat-flag-preview') {
                this.uploadedCatFlag = base64;
            } else if (previewId === 'prod-icon-preview') {
                this.uploadedProdIcon = base64;
            } else if (previewId === 'pay-icon-preview') {
                this.uploadedPayIcon = base64;
            } else if (previewId === 'banner-preview') {
                this.uploadedBanner = base64;
            } else if (previewId === 'logo-preview') {
                this.uploadedLogo = base64;
            }
            
        } catch (error) {
            preview.innerHTML = `<span class="error">❌ ${error.message}</span>`;
        }
    },

    // Save category
    async saveCategory() {
        const name = document.getElementById('cat-name').value.trim();
        const hasDiscount = document.getElementById('cat-has-discount').checked;
        
        if (!name) {
            UI.showToast('Please enter category name', 'error');
            return;
        }
        
        UI.showModalLoading('Creating category...');
        
        try {
            await Database.createCategory({
                name,
                icon: this.uploadedCatIcon || '',
                countryFlag: this.uploadedCatFlag || '',
                hasDiscount
            });
            
            UI.closeModal();
            UI.showToast('Category created!', 'success');
            TelegramWebApp.haptic('notification', 'success');
            await this.renderCategories();
            
        } catch (error) {
            console.error('Error creating category:', error);
            UI.showToast('Failed to create category', 'error');
        }
    },

    // Edit category
    async editCategory(categoryId) {
        const category = await Database.getCategory(categoryId);
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>✏️ Edit Category</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Category Name *</label>
                            <input type="text" class="input-field" id="edit-cat-name" 
                                   value="${category.name}" placeholder="e.g., PUBG Mobile">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Category Icon</label>
                            <div class="file-upload-small" onclick="document.getElementById('edit-cat-icon-file').click()">
                                <input type="file" id="edit-cat-icon-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'edit-cat-icon-preview')" hidden>
                                <div id="edit-cat-icon-preview" class="icon-preview">
                                    ${category.icon ? `<img src="${category.icon}">` : '<span>📤 Upload Icon</span>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Country Flag</label>
                            <div class="file-upload-small" onclick="document.getElementById('edit-cat-flag-file').click()">
                                <input type="file" id="edit-cat-flag-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'edit-cat-flag-preview')" hidden>
                                <div id="edit-cat-flag-preview" class="icon-preview">
                                    ${category.countryFlag ? `<img src="${category.countryFlag}">` : '<span>🏳️ Upload Flag</span>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="input-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="edit-cat-has-discount" ${category.hasDiscount ? 'checked' : ''}>
                                <span>🔥 Has Discount Products</span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.updateCategory('${categoryId}')">
                            ✅ Update
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
        this.uploadedCatIcon = category.icon;
        this.uploadedCatFlag = category.countryFlag;
    },

    // Update category
    async updateCategory(categoryId) {
        const name = document.getElementById('edit-cat-name').value.trim();
        const hasDiscount = document.getElementById('edit-cat-has-discount').checked;
        
        if (!name) {
            UI.showToast('Please enter category name', 'error');
            return;
        }
        
        UI.showModalLoading('Updating...');
        
        try {
            await Database.updateCategory(categoryId, {
                name,
                icon: this.uploadedCatIcon || '',
                countryFlag: this.uploadedCatFlag || '',
                hasDiscount
            });
            
            UI.closeModal();
            UI.showToast('Category updated!', 'success');
            await this.renderCategories();
            
        } catch (error) {
            console.error('Error updating category:', error);
            UI.showToast('Failed to update category', 'error');
        }
    },

    // Delete category
    async deleteCategory(categoryId) {
        const confirmed = await TelegramWebApp.showConfirm(
            'Delete this category? All products in this category will also be deleted!'
        );
        
        if (!confirmed) return;
        
        try {
            await Database.deleteCategory(categoryId);
            UI.showToast('Category deleted!', 'success');
            await this.renderCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            UI.showToast('Failed to delete category', 'error');
        }
    },

    // ==================== PRODUCTS ====================
    
    async renderProducts() {
        const products = await Database.getAllProducts();
        const categories = await Database.getCategories();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-products">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">🛍️ Products Management</h2>
                    <button class="btn btn-primary" onclick="Admin.showAddProductModal()">
                        <span>➕</span>
                        <span>Add Product</span>
                    </button>
                </div>
                
                <div class="filter-section">
                    <select class="filter-select" id="product-category-filter" onchange="Admin.filterProductsByCategory()">
                        <option value="">All Categories</option>
                        ${categories.map(cat => `
                            <option value="${cat.id}">${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="products-list" id="admin-products-list">
                    ${products.length > 0 ? products.map(product => `
                        <div class="admin-product-card" data-category="${product.categoryId}">
                            <div class="product-icon">
                                ${product.icon ? `<img src="${product.icon}">` : '💎'}
                                ${product.discountPercent > 0 ? `<span class="discount-badge">-${product.discountPercent}%</span>` : ''}
                            </div>
                            <div class="product-info">
                                <h4>${product.name}</h4>
                                <p class="product-amount">${product.amount}</p>
                                <p class="product-category">📁 ${product.categoryName || 'N/A'}</p>
                            </div>
                            <div class="product-price-info">
                                ${product.discountPercent > 0 ? `
                                    <span class="original">${UI.formatCurrency(product.originalPrice)}</span>
                                ` : ''}
                                <span class="current">${UI.formatCurrency(product.price)}</span>
                            </div>
                            <div class="product-stats">
                                <span>✅ ${product.totalSold || 0} sold</span>
                                <span>${product.deliveryType === 'instant' ? '⚡ Instant' : `⏱️ ${product.deliveryTime}`}</span>
                            </div>
                            <div class="product-actions">
                                <button class="icon-btn" onclick="Admin.editProduct('${product.id}')" title="Edit">
                                    ✏️
                                </button>
                                <button class="icon-btn danger" onclick="Admin.deleteProduct('${product.id}')" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <span>🛍️</span>
                            <p>No products yet</p>
                            <button class="btn btn-primary" onclick="Admin.showAddProductModal()">
                                Add First Product
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Filter products by category
    filterProductsByCategory() {
        const categoryId = document.getElementById('product-category-filter').value;
        
        document.querySelectorAll('.admin-product-card').forEach(card => {
            if (!categoryId || card.dataset.category === categoryId) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    },

    // Show add product modal
    async showAddProductModal() {
        const categories = await Database.getCategories();
        
        if (categories.length === 0) {
            UI.showToast('Please create a category first', 'warning');
            return;
        }
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content large" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>➕ Add Product</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Category *</label>
                                <select class="input-field" id="prod-category">
                                    ${categories.map(cat => `
                                        <option value="${cat.id}" data-name="${cat.name}">${cat.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Product Name *</label>
                                <input type="text" class="input-field" id="prod-name" placeholder="e.g., UC Pack">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Amount *</label>
                                <input type="text" class="input-field" id="prod-amount" placeholder="e.g., 60 UC">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Price *</label>
                                <input type="number" class="input-field" id="prod-price" placeholder="e.g., 4000" min="0">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Currency</label>
                                <select class="input-field" id="prod-currency">
                                    <option value="MMK">MMK</option>
                                    <option value="¥">¥ (Yuan)</option>
                                    <option value="$">$ (USD)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Discount %</label>
                                <input type="number" class="input-field" id="prod-discount" placeholder="e.g., 10" min="0" max="100" value="0">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Delivery Type</label>
                                <select class="input-field" id="prod-delivery" onchange="Admin.toggleDeliveryTime()">
                                    <option value="instant">⚡ Instant</option>
                                    <option value="timed">⏱️ Timed</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="input-group" id="delivery-time-group" style="display: none;">
                            <label class="input-label">Delivery Time</label>
                            <input type="text" class="input-field" id="prod-delivery-time" placeholder="e.g., 30 minutes, 1 hour">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Product Icon</label>
                            <div class="file-upload-small" onclick="document.getElementById('prod-icon-file').click()">
                                <input type="file" id="prod-icon-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'prod-icon-preview')" hidden>
                                <div id="prod-icon-preview" class="icon-preview">
                                    <span>📤 Upload Icon</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.saveProduct()">
                            ✅ Save Product
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
        this.uploadedProdIcon = null;
    },

    // Toggle delivery time input
    toggleDeliveryTime() {
        const deliveryType = document.getElementById('prod-delivery').value;
        const timeGroup = document.getElementById('delivery-time-group');
        timeGroup.style.display = deliveryType === 'timed' ? 'block' : 'none';
    },

    // Save product
    async saveProduct() {
        const categorySelect = document.getElementById('prod-category');
        const categoryId = categorySelect.value;
        const categoryName = categorySelect.options[categorySelect.selectedIndex].dataset.name;
        const name = document.getElementById('prod-name').value.trim();
        const amount = document.getElementById('prod-amount').value.trim();
        const price = parseFloat(document.getElementById('prod-price').value);
        const currency = document.getElementById('prod-currency').value;
        const discountPercent = parseInt(document.getElementById('prod-discount').value) || 0;
        const deliveryType = document.getElementById('prod-delivery').value;
        const deliveryTime = document.getElementById('prod-delivery-time')?.value || '';
        
        if (!name || !amount || !price) {
            UI.showToast('Please fill all required fields', 'error');
            return;
        }
        
        UI.showModalLoading('Creating product...');
        
        try {
            await Database.createProduct({
                categoryId,
                categoryName,
                name,
                amount,
                price,
                currency,
                discountPercent,
                icon: this.uploadedProdIcon || '',
                deliveryType,
                deliveryTime
            });
            
            UI.closeModal();
            UI.showToast('Product created!', 'success');
            TelegramWebApp.haptic('notification', 'success');
            await this.renderProducts();
            
        } catch (error) {
            console.error('Error creating product:', error);
            UI.showToast('Failed to create product', 'error');
        }
    },

    // Edit product
    async editProduct(productId) {
        const product = await Database.getProduct(productId);
        const categories = await Database.getCategories();
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content large" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>✏️ Edit Product</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Category *</label>
                                <select class="input-field" id="edit-prod-category">
                                    ${categories.map(cat => `
                                        <option value="${cat.id}" data-name="${cat.name}" 
                                                ${cat.id === product.categoryId ? 'selected' : ''}>
                                            ${cat.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Product Name *</label>
                                <input type="text" class="input-field" id="edit-prod-name" value="${product.name}">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Amount *</label>
                                <input type="text" class="input-field" id="edit-prod-amount" value="${product.amount}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Price *</label>
                                <input type="number" class="input-field" id="edit-prod-price" value="${product.originalPrice}" min="0">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Currency</label>
                                <select class="input-field" id="edit-prod-currency">
                                    <option value="MMK" ${product.currency === 'MMK' ? 'selected' : ''}>MMK</option>
                                    <option value="¥" ${product.currency === '¥' ? 'selected' : ''}>¥ (Yuan)</option>
                                    <option value="$" ${product.currency === '$' ? 'selected' : ''}>$ (USD)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Discount %</label>
                                <input type="number" class="input-field" id="edit-prod-discount" 
                                       value="${product.discountPercent || 0}" min="0" max="100">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Delivery Type</label>
                                <select class="input-field" id="edit-prod-delivery" onchange="Admin.toggleEditDeliveryTime()">
                                    <option value="instant" ${product.deliveryType === 'instant' ? 'selected' : ''}>⚡ Instant</option>
                                    <option value="timed" ${product.deliveryType === 'timed' ? 'selected' : ''}>⏱️ Timed</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="input-group" id="edit-delivery-time-group" 
                             style="display: ${product.deliveryType === 'timed' ? 'block' : 'none'};">
                            <label class="input-label">Delivery Time</label>
                            <input type="text" class="input-field" id="edit-prod-delivery-time" 
                                   value="${product.deliveryTime || ''}" placeholder="e.g., 30 minutes">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Product Icon</label>
                            <div class="file-upload-small" onclick="document.getElementById('edit-prod-icon-file').click()">
                                <input type="file" id="edit-prod-icon-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'edit-prod-icon-preview')" hidden>
                                <div id="edit-prod-icon-preview" class="icon-preview">
                                    ${product.icon ? `<img src="${product.icon}">` : '<span>📤 Upload Icon</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.updateProduct('${productId}')">
                            ✅ Update
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
        this.uploadedProdIcon = product.icon;
    },

    // Toggle edit delivery time
    toggleEditDeliveryTime() {
        const deliveryType = document.getElementById('edit-prod-delivery').value;
        const timeGroup = document.getElementById('edit-delivery-time-group');
        timeGroup.style.display = deliveryType === 'timed' ? 'block' : 'none';
    },

    // Update product
    async updateProduct(productId) {
        const categorySelect = document.getElementById('edit-prod-category');
        const categoryId = categorySelect.value;
        const categoryName = categorySelect.options[categorySelect.selectedIndex].dataset.name;
        const name = document.getElementById('edit-prod-name').value.trim();
        const amount = document.getElementById('edit-prod-amount').value.trim();
        const price = parseFloat(document.getElementById('edit-prod-price').value);
        const currency = document.getElementById('edit-prod-currency').value;
        const discountPercent = parseInt(document.getElementById('edit-prod-discount').value) || 0;
        const deliveryType = document.getElementById('edit-prod-delivery').value;
        const deliveryTime = document.getElementById('edit-prod-delivery-time')?.value || '';
        
        if (!name || !amount || !price) {
            UI.showToast('Please fill all required fields', 'error');
            return;
        }
        
        UI.showModalLoading('Updating...');
        
        try {
            await Database.updateProduct(productId, {
                categoryId,
                categoryName,
                name,
                amount,
                originalPrice: price,
                discountPercent,
                currency,
                icon: this.uploadedProdIcon || '',
                deliveryType,
                deliveryTime
            });
            
            UI.closeModal();
            UI.showToast('Product updated!', 'success');
            await this.renderProducts();
            
        } catch (error) {
            console.error('Error updating product:', error);
            UI.showToast('Failed to update product', 'error');
        }
    },

    // Delete product
    async deleteProduct(productId) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this product?');
        if (!confirmed) return;
        
        try {
            await Database.deleteProduct(productId);
            UI.showToast('Product deleted!', 'success');
            await this.renderProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            UI.showToast('Failed to delete product', 'error');
        }
    },

    // Exit admin panel
    exitAdmin() {
        TelegramWebApp.hideBackButton();
        UI.currentPage = 'home';
        UI.goBack();
    }
};

    // ==================== BANNERS ====================
    
    async renderBanners() {
        const type1Banners = await Database.getBanners('type1');
        const type2Banners = await Database.getBanners('type2');
        const categories = await Database.getCategories();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-banners">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">🖼️ Banners Management</h2>
                </div>
                
                <div class="banner-tabs">
                    <button class="tab-btn active" onclick="Admin.switchBannerTab('type1')">
                        Type 1 - Home Banners
                    </button>
                    <button class="tab-btn" onclick="Admin.switchBannerTab('type2')">
                        Type 2 - Category Banners
                    </button>
                </div>
                
                <div class="banner-tab-content" id="banner-type1-tab">
                    <div class="banner-section">
                        <div class="section-header-small">
                            <h3>🏠 Home Page Banners</h3>
                            <button class="btn btn-primary btn-sm" onclick="Admin.showAddBannerModal('type1')">
                                ➕ Add Banner
                            </button>
                        </div>
                        <p class="section-desc">Size: 2560 x 1440 pixels recommended</p>
                        
                        <div class="banners-grid">
                            ${type1Banners.length > 0 ? type1Banners.map(banner => `
                                <div class="banner-card">
                                    <div class="banner-preview">
                                        <img src="${banner.image}" alt="Banner">
                                    </div>
                                    <div class="banner-info">
                                        <span class="banner-date">📅 ${new Date(banner.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div class="banner-actions">
                                        <button class="icon-btn danger" onclick="Admin.deleteBanner('type1', '${banner.id}')">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="empty-state small">
                                    <span>🖼️</span>
                                    <p>No banners yet</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                <div class="banner-tab-content" id="banner-type2-tab" style="display: none;">
                    <div class="banner-section">
                        <div class="section-header-small">
                            <h3>📁 Category Page Banners</h3>
                            <button class="btn btn-primary btn-sm" onclick="Admin.showAddBannerModal('type2')">
                                ➕ Add Banner
                            </button>
                        </div>
                        <p class="section-desc">Banners shown at bottom of category pages with descriptions</p>
                        
                        <div class="banners-list">
                            ${type2Banners.length > 0 ? type2Banners.map(banner => `
                                <div class="banner-card-large">
                                    <div class="banner-preview">
                                        <img src="${banner.image}" alt="Banner">
                                    </div>
                                    <div class="banner-details">
                                        <div class="banner-category">
                                            📁 ${banner.categoryName || 'All Categories'}
                                        </div>
                                        ${banner.description ? `
                                            <div class="banner-desc">
                                                ${banner.description}
                                            </div>
                                        ` : ''}
                                        <span class="banner-date">📅 ${new Date(banner.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div class="banner-actions">
                                        <button class="icon-btn" onclick="Admin.editType2Banner('${banner.id}')">
                                            ✏️
                                        </button>
                                        <button class="icon-btn danger" onclick="Admin.deleteBanner('type2', '${banner.id}')">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="empty-state small">
                                    <span>🖼️</span>
                                    <p>No category banners yet</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Switch banner tab
    switchBannerTab(type) {
        document.querySelectorAll('.banner-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        document.getElementById('banner-type1-tab').style.display = type === 'type1' ? 'block' : 'none';
        document.getElementById('banner-type2-tab').style.display = type === 'type2' ? 'block' : 'none';
    },

    // Show add banner modal
    async showAddBannerModal(type) {
        const categories = await Database.getCategories();
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>➕ Add ${type === 'type1' ? 'Home' : 'Category'} Banner</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Banner Image *</label>
                            <div class="file-upload" onclick="document.getElementById('banner-file').click()">
                                <input type="file" id="banner-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'banner-preview')" hidden>
                                <div id="banner-preview" class="banner-upload-preview">
                                    <span>📤 Click to upload banner image</span>
                                    <small>Recommended: 2560 x 1440 pixels</small>
                                </div>
                            </div>
                        </div>
                        
                        ${type === 'type2' ? `
                            <div class="input-group">
                                <label class="input-label">Category</label>
                                <select class="input-field" id="banner-category">
                                    <option value="">All Categories</option>
                                    ${categories.map(cat => `
                                        <option value="${cat.id}" data-name="${cat.name}">${cat.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="input-group">
                                <label class="input-label">Description / Instructions</label>
                                <textarea class="input-field" id="banner-desc" rows="5" 
                                          placeholder="Enter description or instructions...&#10;Each line will be displayed separately."></textarea>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.saveBanner('${type}')">
                            ✅ Save Banner
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
        this.uploadedBanner = null;
    },

    // Save banner
    async saveBanner(type) {
        if (!this.uploadedBanner) {
            UI.showToast('Please upload a banner image', 'error');
            return;
        }
        
        let bannerData = {
            image: this.uploadedBanner
        };
        
        if (type === 'type2') {
            const categorySelect = document.getElementById('banner-category');
            bannerData.categoryId = categorySelect.value || null;
            bannerData.categoryName = categorySelect.value ? 
                categorySelect.options[categorySelect.selectedIndex].dataset.name : '';
            bannerData.description = document.getElementById('banner-desc').value;
        }
        
        UI.showModalLoading('Uploading banner...');
        
        try {
            await Database.addBanner(type, bannerData);
            
            UI.closeModal();
            UI.showToast('Banner added!', 'success');
            TelegramWebApp.haptic('notification', 'success');
            await this.renderBanners();
            
        } catch (error) {
            console.error('Error adding banner:', error);
            UI.showToast('Failed to add banner', 'error');
        }
    },

    // Delete banner
    async deleteBanner(type, bannerId) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this banner?');
        if (!confirmed) return;
        
        try {
            await Database.deleteBanner(type, bannerId);
            UI.showToast('Banner deleted!', 'success');
            await this.renderBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            UI.showToast('Failed to delete banner', 'error');
        }
    },

    // ==================== PAYMENTS ====================
    
    async renderPayments() {
        const payments = await Database.getAllPaymentMethods();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-payments">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">💳 Payment Methods</h2>
                    <button class="btn btn-primary" onclick="Admin.showAddPaymentModal()">
                        <span>➕</span>
                        <span>Add Payment</span>
                    </button>
                </div>
                
                <div class="payments-list">
                    ${payments.length > 0 ? payments.map(payment => `
                        <div class="payment-card ${payment.isActive ? '' : 'inactive'}">
                            <div class="payment-icon">
                                ${payment.icon ? `<img src="${payment.icon}">` : '💳'}
                            </div>
                            <div class="payment-info">
                                <h4>${payment.name}</h4>
                                <p class="payment-address">${payment.address}</p>
                                <p class="payment-account">👤 ${payment.accountName}</p>
                                ${payment.note ? `<p class="payment-note">📝 ${payment.note}</p>` : ''}
                            </div>
                            <div class="payment-status">
                                <span class="status-badge ${payment.isActive ? 'active' : 'inactive'}">
                                    ${payment.isActive ? '✅ Active' : '❌ Inactive'}
                                </span>
                            </div>
                            <div class="payment-actions">
                                <button class="icon-btn" onclick="Admin.togglePaymentStatus('${payment.id}', ${!payment.isActive})" 
                                        title="${payment.isActive ? 'Deactivate' : 'Activate'}">
                                    ${payment.isActive ? '🔴' : '🟢'}
                                </button>
                                <button class="icon-btn" onclick="Admin.editPayment('${payment.id}')" title="Edit">
                                    ✏️
                                </button>
                                <button class="icon-btn danger" onclick="Admin.deletePayment('${payment.id}')" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <span>💳</span>
                            <p>No payment methods yet</p>
                            <button class="btn btn-primary" onclick="Admin.showAddPaymentModal()">
                                Add First Payment Method
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Show add payment modal
    showAddPaymentModal() {
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>➕ Add Payment Method</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Payment Name *</label>
                            <input type="text" class="input-field" id="pay-name" 
                                   placeholder="e.g., KBZ Pay, Wave Pay">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Account Number / Address *</label>
                            <input type="text" class="input-field" id="pay-address" 
                                   placeholder="e.g., 09123456789">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Account Name *</label>
                            <input type="text" class="input-field" id="pay-account-name" 
                                   placeholder="e.g., Mg Mg">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Note / Instructions</label>
                            <textarea class="input-field" id="pay-note" rows="3" 
                                      placeholder="Any additional instructions..."></textarea>
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Payment Icon</label>
                            <div class="file-upload-small" onclick="document.getElementById('pay-icon-file').click()">
                                <input type="file" id="pay-icon-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'pay-icon-preview')" hidden>
                                <div id="pay-icon-preview" class="icon-preview">
                                    <span>📤 Upload Icon</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.savePayment()">
                            ✅ Save
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
        this.uploadedPayIcon = null;
    },

    // Save payment
    async savePayment() {
        const name = document.getElementById('pay-name').value.trim();
        const address = document.getElementById('pay-address').value.trim();
        const accountName = document.getElementById('pay-account-name').value.trim();
        const note = document.getElementById('pay-note').value.trim();
        
        if (!name || !address || !accountName) {
            UI.showToast('Please fill all required fields', 'error');
            return;
        }
        
        UI.showModalLoading('Saving...');
        
        try {
            await Database.addPaymentMethod({
                name,
                address,
                accountName,
                note,
                icon: this.uploadedPayIcon || ''
            });
            
            UI.closeModal();
            UI.showToast('Payment method added!', 'success');
            await this.renderPayments();
            
        } catch (error) {
            console.error('Error adding payment:', error);
            UI.showToast('Failed to add payment method', 'error');
        }
    },

    // Toggle payment status
    async togglePaymentStatus(paymentId, isActive) {
        try {
            await Database.updatePaymentMethod(paymentId, { isActive });
            UI.showToast(`Payment ${isActive ? 'activated' : 'deactivated'}!`, 'success');
            await this.renderPayments();
        } catch (error) {
            console.error('Error toggling payment:', error);
            UI.showToast('Failed to update', 'error');
        }
    },

    // Edit payment
    async editPayment(paymentId) {
        const payments = await Database.getAllPaymentMethods();
        const payment = payments.find(p => p.id === paymentId);
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>✏️ Edit Payment Method</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Payment Name *</label>
                            <input type="text" class="input-field" id="edit-pay-name" value="${payment.name}">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Account Number / Address *</label>
                            <input type="text" class="input-field" id="edit-pay-address" value="${payment.address}">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Account Name *</label>
                            <input type="text" class="input-field" id="edit-pay-account-name" value="${payment.accountName}">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Note / Instructions</label>
                            <textarea class="input-field" id="edit-pay-note" rows="3">${payment.note || ''}</textarea>
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Payment Icon</label>
                            <div class="file-upload-small" onclick="document.getElementById('edit-pay-icon-file').click()">
                                <input type="file" id="edit-pay-icon-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'edit-pay-icon-preview')" hidden>
                                <div id="edit-pay-icon-preview" class="icon-preview">
                                    ${payment.icon ? `<img src="${payment.icon}">` : '<span>📤 Upload Icon</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.updatePayment('${paymentId}')">
                            ✅ Update
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
        this.uploadedPayIcon = payment.icon;
    },

    // Update payment
    async updatePayment(paymentId) {
        const name = document.getElementById('edit-pay-name').value.trim();
        const address = document.getElementById('edit-pay-address').value.trim();
        const accountName = document.getElementById('edit-pay-account-name').value.trim();
        const note = document.getElementById('edit-pay-note').value.trim();
        
        if (!name || !address || !accountName) {
            UI.showToast('Please fill all required fields', 'error');
            return;
        }
        
        UI.showModalLoading('Updating...');
        
        try {
            await Database.updatePaymentMethod(paymentId, {
                name,
                address,
                accountName,
                note,
                icon: this.uploadedPayIcon || ''
            });
            
            UI.closeModal();
            UI.showToast('Payment method updated!', 'success');
            await this.renderPayments();
            
        } catch (error) {
            console.error('Error updating payment:', error);
            UI.showToast('Failed to update', 'error');
        }
    },

    // Delete payment
    async deletePayment(paymentId) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this payment method?');
        if (!confirmed) return;
        
        try {
            await Database.deletePaymentMethod(paymentId);
            UI.showToast('Payment method deleted!', 'success');
            await this.renderPayments();
        } catch (error) {
            console.error('Error deleting payment:', error);
            UI.showToast('Failed to delete', 'error');
        }
    },

    // ==================== INPUT TABLES ====================
    
    async renderInputTables() {
        const inputTables = await Database.getInputTables();
        const categories = await Database.getCategories();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-inputs">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">📝 Input Tables</h2>
                    <button class="btn btn-primary" onclick="Admin.showAddInputTableModal()">
                        <span>➕</span>
                        <span>Add Input Field</span>
                    </button>
                </div>
                
                <p class="section-desc">
                    Input fields are shown on category pages. Users must fill these before purchasing.
                </p>
                
                <div class="inputs-list">
                    ${categories.map(category => {
                        const categoryInputs = inputTables.filter(t => t.categoryId === category.id);
                        return `
                            <div class="category-inputs-section">
                                <div class="category-inputs-header">
                                    <h3>📁 ${category.name}</h3>
                                    <span class="input-count">${categoryInputs.length} fields</span>
                                </div>
                                <div class="inputs-grid">
                                    ${categoryInputs.length > 0 ? categoryInputs.map(input => `
                                        <div class="input-table-card">
                                            <div class="input-table-info">
                                                <h4>${input.name}</h4>
                                                <p class="placeholder">"${input.placeholder}"</p>
                                                <span class="input-type">${input.inputType || 'text'}</span>
                                                ${input.required ? '<span class="required-badge">Required</span>' : ''}
                                            </div>
                                            <div class="input-table-actions">
                                                <button class="icon-btn" onclick="Admin.editInputTable('${input.id}')" title="Edit">
                                                    ✏️
                                                </button>
                                                <button class="icon-btn danger" onclick="Admin.deleteInputTable('${input.id}')" title="Delete">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') : `
                                        <p class="no-inputs">No input fields for this category</p>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                    
                    ${categories.length === 0 ? `
                        <div class="empty-state">
                            <span>📁</span>
                            <p>Create categories first</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Show add input table modal
    async showAddInputTableModal() {
        const categories = await Database.getCategories();
        
        if (categories.length === 0) {
            UI.showToast('Please create a category first', 'warning');
            return;
        }
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>➕ Add Input Field</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Category *</label>
                            <select class="input-field" id="input-category">
                                ${categories.map(cat => `
                                    <option value="${cat.id}" data-name="${cat.name}">${cat.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Field Name *</label>
                            <input type="text" class="input-field" id="input-name" 
                                   placeholder="e.g., Player ID, UID">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Placeholder Text *</label>
                            <input type="text" class="input-field" id="input-placeholder" 
                                   placeholder="e.g., Enter your Player ID">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Input Type</label>
                            <select class="input-field" id="input-type">
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                            </select>
                        </div>
                        
                        <div class="input-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="input-required" checked>
                                <span>Required field</span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.saveInputTable()">
                            ✅ Save
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Save input table
    async saveInputTable() {
        const categorySelect = document.getElementById('input-category');
        const categoryId = categorySelect.value;
        const categoryName = categorySelect.options[categorySelect.selectedIndex].dataset.name;
        const name = document.getElementById('input-name').value.trim();
        const placeholder = document.getElementById('input-placeholder').value.trim();
        const inputType = document.getElementById('input-type').value;
        const required = document.getElementById('input-required').checked;
        
        if (!name || !placeholder) {
            UI.showToast('Please fill all required fields', 'error');
            return;
        }
        
        UI.showModalLoading('Saving...');
        
        try {
            await Database.createInputTable({
                categoryId,
                categoryName,
                name,
                placeholder,
                inputType,
                required
            });
            
            UI.closeModal();
            UI.showToast('Input field added!', 'success');
            await this.renderInputTables();
            
        } catch (error) {
            console.error('Error adding input table:', error);
            UI.showToast('Failed to add', 'error');
        }
    },

    // Edit input table
    async editInputTable(tableId) {
        const tables = await Database.getInputTables();
        const table = tables.find(t => t.id === tableId);
        const categories = await Database.getCategories();
        
        const modalHTML = `
            <div class="modal-overlay" onclick="UI.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>✏️ Edit Input Field</h2>
                        <button class="modal-close" onclick="UI.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label class="input-label">Category *</label>
                            <select class="input-field" id="edit-input-category">
                                ${categories.map(cat => `
                                    <option value="${cat.id}" data-name="${cat.name}" 
                                            ${cat.id === table.categoryId ? 'selected' : ''}>
                                        ${cat.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Field Name *</label>
                            <input type="text" class="input-field" id="edit-input-name" value="${table.name}">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Placeholder Text *</label>
                            <input type="text" class="input-field" id="edit-input-placeholder" value="${table.placeholder}">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Input Type</label>
                            <select class="input-field" id="edit-input-type">
                                <option value="text" ${table.inputType === 'text' ? 'selected' : ''}>Text</option>
                                <option value="number" ${table.inputType === 'number' ? 'selected' : ''}>Number</option>
                                <option value="email" ${table.inputType === 'email' ? 'selected' : ''}>Email</option>
                                <option value="tel" ${table.inputType === 'tel' ? 'selected' : ''}>Phone</option>
                            </select>
                        </div>
                        
                        <div class="input-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="edit-input-required" ${table.required ? 'checked' : ''}>
                                <span>Required field</span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.updateInputTable('${tableId}')">
                            ✅ Update
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        UI.showModal(modalHTML);
    },

    // Update input table
    async updateInputTable(tableId) {
        const categorySelect = document.getElementById('edit-input-category');
        const categoryId = categorySelect.value;
        const categoryName = categorySelect.options[categorySelect.selectedIndex].dataset.name;
        const name = document.getElementById('edit-input-name').value.trim();
        const placeholder = document.getElementById('edit-input-placeholder').value.trim();
        const inputType = document.getElementById('edit-input-type').value;
        const required = document.getElementById('edit-input-required').checked;
        
        if (!name || !placeholder) {
            UI.showToast('Please fill all required fields', 'error');
            return;
        }
        
        UI.showModalLoading('Updating...');
        
        try {
            await Database.updateInputTable(tableId, {
                categoryId,
                categoryName,
                name,
                placeholder,
                inputType,
                required
            });
            
            UI.closeModal();
            UI.showToast('Input field updated!', 'success');
            await this.renderInputTables();
            
        } catch (error) {
            console.error('Error updating input table:', error);
            UI.showToast('Failed to update', 'error');
        }
    },

    // Delete input table
    async deleteInputTable(tableId) {
        const confirmed = await TelegramWebApp.showConfirm('Delete this input field?');
        if (!confirmed) return;
        
        try {
            await Database.deleteInputTable(tableId);
            UI.showToast('Input field deleted!', 'success');
            await this.renderInputTables();
        } catch (error) {
            console.error('Error deleting input table:', error);
            UI.showToast('Failed to delete', 'error');
        }
    },

    // ==================== SETTINGS ====================
    
    async renderSettings() {
        const settings = await Database.getSettings();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-settings">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">⚙️ Site Settings</h2>
                </div>
                
                <div class="settings-form">
                    <div class="setting-section">
                        <h3>🏷️ Branding</h3>
                        
                        <div class="input-group">
                            <label class="input-label">Site Name</label>
                            <input type="text" class="input-field" id="setting-site-name" 
                                   value="${settings?.siteName || 'MAFIA Gaming Shop'}" 
                                   placeholder="Enter site name">
                        </div>
                        
                        <div class="input-group">
                            <label class="input-label">Site Logo</label>
                            <div class="file-upload-small" onclick="document.getElementById('logo-file').click()">
                                <input type="file" id="logo-file" accept="image/*" 
                                       onchange="Admin.handleIconUpload(event, 'logo-preview')" hidden>
                                <div id="logo-preview" class="icon-preview large">
                                    ${settings?.logo ? `<img src="${settings.logo}">` : '<span>📤 Upload Logo</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-section">
                        <h3>📢 Announcement</h3>
                        
                        <div class="input-group">
                            <label class="input-label">Announcement Text (Live Ticker)</label>
                            <textarea class="input-field" id="setting-announcement" rows="3" 
                                      placeholder="Enter announcement text...">${settings?.announcementText || ''}</textarea>
                        </div>
                        <button class="btn btn-secondary" onclick="Admin.updateAnnouncement()">
                            💾 Save Announcement
                        </button>
                    </div>
                    
                    <div class="setting-section">
                        <h3>🎨 Theme</h3>
                        
                        <div class="theme-options">
                            <label class="theme-option ${settings?.theme === 'dark' ? 'selected' : ''}">
                                <input type="radio" name="theme" value="dark" 
                                       ${settings?.theme === 'dark' ? 'checked' : ''} 
                                       onchange="Admin.changeTheme('dark')">
                                <div class="theme-preview dark">
                                    <span>🌙</span>
                                    <span>Dark</span>
                                </div>
                            </label>
                            <label class="theme-option ${settings?.theme === 'light' ? 'selected' : ''}">
                                <input type="radio" name="theme" value="light" 
                                       ${settings?.theme === 'light' ? 'checked' : ''} 
                                       onchange="Admin.changeTheme('light')">
                                <div class="theme-preview light">
                                    <span>☀️</span>
                                    <span>Light</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting-section">
                        <h3>ℹ️ System Info</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">Bot Username:</span>
                                <span class="value">@${CONFIG.BOT_USERNAME}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Admin ID:</span>
                                <span class="value">${CONFIG.ADMIN_TELEGRAM_ID}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Webapp URL:</span>
                                <span class="value">${CONFIG.WEBAPP_URL}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="btn btn-primary btn-lg" onclick="Admin.saveSettings()">
                        💾 Save All Settings
                    </button>
                </div>
            </div>
        `;
        
        this.uploadedLogo = settings?.logo || null;
    },

    // Change theme
    async changeTheme(theme) {
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('selected', opt.querySelector('input').value === theme);
        });
        
        document.documentElement.setAttribute('data-theme', theme);
        
        await Database.updateSettings({ theme });
        UI.applyTheme();
    },

    // Update announcement
    async updateAnnouncement() {
        const text = document.getElementById('setting-announcement').value;
        
        try {
            await Database.updateAnnouncement(text);
            UI.showToast('Announcement updated!', 'success');
        } catch (error) {
            console.error('Error updating announcement:', error);
            UI.showToast('Failed to update', 'error');
        }
    },

    // Save settings
    async saveSettings() {
        const siteName = document.getElementById('setting-site-name').value.trim();
        const announcement = document.getElementById('setting-announcement').value;
        
        UI.showToast('Saving...', 'info');
        
        try {
            await Database.updateSettings({
                siteName,
                logo: this.uploadedLogo || '',
                announcementText: announcement
            });
            
            await Database.updateAnnouncement(announcement);
            
            UI.showToast('Settings saved!', 'success');
            TelegramWebApp.haptic('notification', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            UI.showToast('Failed to save settings', 'error');
        }
    },

    // ==================== BROADCAST ====================
    
    async renderBroadcast() {
        const users = await Database.getAllUsers();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-broadcast">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">📢 Broadcast Message</h2>
                </div>
                
                <div class="broadcast-info">
                    <div class="info-card">
                        <span class="info-icon">👥</span>
                        <span class="info-text">${users.length} users will receive this message</span>
                    </div>
                </div>
                
                <div class="broadcast-form">
                    <div class="input-group">
                        <label class="input-label">Message *</label>
                        <textarea class="input-field" id="broadcast-message" rows="6" 
                                  placeholder="Enter your message...&#10;&#10;You can use HTML formatting:&#10;<b>bold</b>, <i>italic</i>, <code>code</code>"></textarea>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Attach Image (Optional)</label>
                        <div class="file-upload" onclick="document.getElementById('broadcast-image-file').click()">
                            <input type="file" id="broadcast-image-file" accept="image/*" 
                                   onchange="Admin.handleBroadcastImage(event)" hidden>
                            <div id="broadcast-image-preview" class="broadcast-image-preview">
                                <span>📷 Click to attach image</span>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-secondary mt-2" onclick="Admin.clearBroadcastImage()" 
                                id="clear-broadcast-image" style="display: none;">
                            ❌ Remove Image
                        </button>
                    </div>
                    
                    <div class="broadcast-preview">
                        <h4>Preview:</h4>
                        <div class="preview-content" id="broadcast-preview-content">
                            <p class="placeholder">Your message will appear here...</p>
                        </div>
                    </div>
                </div>
                
                <div class="broadcast-actions">
                    <button class="btn btn-secondary" onclick="Admin.previewBroadcast()">
                        👁️ Preview
                    </button>
                    <button class="btn btn-primary btn-lg" onclick="Admin.sendBroadcast()">
                        📤 Send to All Users
                    </button>
                </div>
            </div>
        `;
        
        this.broadcastImage = null;
    },

    // Handle broadcast image
    async handleBroadcastImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const preview = document.getElementById('broadcast-image-preview');
        preview.innerHTML = '<div class="spinner small"></div>';
        
        try {
            const base64 = await ImageUploader.uploadImage(file);
            preview.innerHTML = `<img src="${base64}" alt="Broadcast Image">`;
            document.getElementById('clear-broadcast-image').style.display = 'inline-block';
            this.broadcastImage = base64;
        } catch (error) {
            preview.innerHTML = `<span class="error">❌ ${error.message}</span>`;
        }
    },

    // Clear broadcast image
    clearBroadcastImage() {
        document.getElementById('broadcast-image-preview').innerHTML = '<span>📷 Click to attach image</span>';
        document.getElementById('clear-broadcast-image').style.display = 'none';
        document.getElementById('broadcast-image-file').value = '';
        this.broadcastImage = null;
    },

    // Preview broadcast
    previewBroadcast() {
        const message = document.getElementById('broadcast-message').value;
        const previewContent = document.getElementById('broadcast-preview-content');
        
        if (!message.trim()) {
            previewContent.innerHTML = '<p class="placeholder">Your message will appear here...</p>';
            return;
        }
        
        previewContent.innerHTML = `
            ${this.broadcastImage ? `<img src="${this.broadcastImage}" alt="Image" class="preview-image">` : ''}
            <div class="preview-text">${message}</div>
        `;
    },

    // Send broadcast
    async sendBroadcast() {
        const message = document.getElementById('broadcast-message').value.trim();
        
        if (!message) {
            UI.showToast('Please enter a message', 'error');
            return;
        }
        
        const confirmed = await TelegramWebApp.showConfirm(
            'Send this message to all users?'
        );
        
        if (!confirmed) return;
        
        UI.showToast('Sending broadcast...', 'info');
        
        try {
            const result = await Database.broadcastMessage(message, this.broadcastImage);
            
            UI.showToast(
                `✅ Broadcast sent! Success: ${result.success}, Failed: ${result.failed}`, 
                'success'
            );
            
            // Clear form
            document.getElementById('broadcast-message').value = '';
            this.clearBroadcastImage();
            this.previewBroadcast();
            
        } catch (error) {
            console.error('Error sending broadcast:', error);
            UI.showToast('Failed to send broadcast', 'error');
        }
    },

    // ==================== BANNED USERS ====================
    
    async renderBanned() {
        const banned = await Database.getBannedUsers();
        const content = document.getElementById('admin-content');
        
        content.innerHTML = `
            <div class="admin-banned">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">🚫 Banned Users</h2>
                    <span class="count-badge">${banned.length} banned</span>
                </div>
                
                <div class="banned-list">
                    ${banned.length > 0 ? banned.map(user => `
                        <div class="banned-card">
                            <div class="banned-info">
                                <div class="banned-user">
                                    <span class="name">${user.firstName || 'Unknown'}</span>
                                    <span class="username">@${user.username || 'N/A'}</span>
                                </div>
                                <div class="banned-id">
                                    ID: <code>${user.telegramId}</code>
                                </div>
                                <div class="banned-reason">
                                    📝 ${user.reason}
                                </div>
                                <div class="banned-date">
                                    📅 ${new Date(user.bannedAt).toLocaleString()}
                                </div>
                            </div>
                            <div class="banned-actions">
                                <button class="btn btn-success btn-sm" onclick="Admin.unbanUser('${user.telegramId}')">
                                    ✅ Unban
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <span>✅</span>
                            <p>No banned users</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    // Unban user
    async unbanUser(telegramId) {
        const confirmed = await TelegramWebApp.showConfirm('Unban this user?');
        if (!confirmed) return;
        
        try {
            await Database.unbanUser(telegramId);
            UI.showToast('User unbanned!', 'success');
            await this.renderBanned();
        } catch (error) {
            console.error('Error unbanning user:', error);
            UI.showToast('Failed to unban', 'error');
        }
    }
};
