// ============================================
// DATABASE MANAGEMENT - JSONBin.io Integration
// ============================================

const Database = {
        // JSONBin.io Configuration
        API_URL: 'https://api.jsonbin.io/v3',
        MASTER_KEY: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
        ACCESS_KEY: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS',
        
        // Bin IDs - ဒီနေရာမှာ ထည့်ပါ
        BINS: {
            users: 'YOUR_USERS_BIN_ID',
            categories: 'YOUR_CATEGORIES_BIN_ID',
            products: 'YOUR_PRODUCTS_BIN_ID',
            orders: 'YOUR_ORDERS_BIN_ID',
            topups: 'YOUR_TOPUPS_BIN_ID',
            banners: 'YOUR_BANNERS_BIN_ID',
            payments: 'YOUR_PAYMENTS_BIN_ID',
            inputTables: 'YOUR_INPUT_TABLES_BIN_ID',
            settings: 'YOUR_SETTINGS_BIN_ID',
            bannedUsers: 'YOUR_BANNED_USERS_BIN_ID',
        },
    
    // Local cache
    cache: {},
    cacheExpiry: 30000, // 30 seconds
    lastFetch: {},
    
    // Initialize database
    async init() {
        console.log('Initializing database...');
        
        // Try to load bin IDs from storage
        const savedBins = await TelegramApp.cloudStorage.getItem('db_bins');
        if (savedBins) {
            this.BINS = { ...this.BINS, ...savedBins };
            console.log('Loaded saved bin IDs');
        }
        
        // Check if bins exist, create if not
        await this.ensureBinsExist();
        
        console.log('Database initialized');
        return true;
    },
    
    // Ensure all bins exist
    async ensureBinsExist() {
        const binNames = Object.keys(this.BINS);
        
        for (const binName of binNames) {
            if (!this.BINS[binName]) {
                console.log(`Creating bin: ${binName}`);
                const binId = await this.createBin(binName, this.getDefaultData(binName));
                if (binId) {
                    this.BINS[binName] = binId;
                }
            }
        }
        
        // Save bin IDs
        await TelegramApp.cloudStorage.setItem('db_bins', this.BINS);
    },
    
    // Get default data for each bin
    getDefaultData(binName) {
        const defaults = {
            users: { users: [] },
            categories: { categories: [] },
            products: { products: [] },
            orders: { orders: [] },
            topups: { topups: [] },
            banners: { type1: [], type2: [] },
            payments: { payments: [] },
            inputTables: { inputTables: [] },
            settings: {
                siteName: 'Gaming Shop',
                siteLogo: '',
                announcement: 'Welcome to Gaming Shop! Best prices for game top-ups!'
            },
            bannedUsers: { bannedUsers: [] }
        };
        
        return defaults[binName] || {};
    },
    
    // Create a new bin
    async createBin(name, data) {
        try {
            const response = await fetch(`${this.API_URL}/b`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.MASTER_KEY,
                    'X-Bin-Name': name,
                    'X-Bin-Private': 'true'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.metadata && result.metadata.id) {
                console.log(`Bin created: ${name} -> ${result.metadata.id}`);
                return result.metadata.id;
            }
            
            console.error('Failed to create bin:', result);
            return null;
        } catch (error) {
            console.error('Create bin error:', error);
            return null;
        }
    },
    
    // Read bin data
    async readBin(binName) {
        const binId = this.BINS[binName];
        if (!binId) {
            console.error(`Bin not found: ${binName}`);
            return this.getDefaultData(binName);
        }
        
        // Check cache
        const now = Date.now();
        if (this.cache[binName] && this.lastFetch[binName] && 
            (now - this.lastFetch[binName]) < this.cacheExpiry) {
            return this.cache[binName];
        }
        
        try {
            const response = await fetch(`${this.API_URL}/b/${binId}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.MASTER_KEY
                }
            });
            
            const result = await response.json();
            
            if (result.record) {
                this.cache[binName] = result.record;
                this.lastFetch[binName] = now;
                return result.record;
            }
            
            return this.getDefaultData(binName);
        } catch (error) {
            console.error('Read bin error:', error);
            return this.cache[binName] || this.getDefaultData(binName);
        }
    },
    
    // Update bin data
    async updateBin(binName, data) {
        const binId = this.BINS[binName];
        if (!binId) {
            console.error(`Bin not found: ${binName}`);
            return false;
        }
        
        try {
            const response = await fetch(`${this.API_URL}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.MASTER_KEY
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.record) {
                this.cache[binName] = data;
                this.lastFetch[binName] = Date.now();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Update bin error:', error);
            return false;
        }
    },
    
    // Clear cache
    clearCache(binName = null) {
        if (binName) {
            delete this.cache[binName];
            delete this.lastFetch[binName];
        } else {
            this.cache = {};
            this.lastFetch = {};
        }
    },
    
    // ============================================
    // USER OPERATIONS
    // ============================================
    
    // Get all users
    async getUsers() {
        const data = await this.readBin('users');
        return data.users || [];
    },
    
    // Get user by Telegram ID
    async getUser(telegramId) {
        const users = await this.getUsers();
        return users.find(u => u.telegramId === telegramId) || null;
    },
    
    // Create or update user
    async saveUser(userData) {
        const data = await this.readBin('users');
        const users = data.users || [];
        
        const existingIndex = users.findIndex(u => u.telegramId === userData.telegramId);
        
        if (existingIndex >= 0) {
            // Update existing user
            users[existingIndex] = { ...users[existingIndex], ...userData, updatedAt: Date.now() };
        } else {
            // Create new user
            users.push({
                ...userData,
                balance: 0,
                totalSpent: 0,
                totalOrders: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }
        
        data.users = users;
        await this.updateBin('users', data);
        
        return userData;
    },
    
    // Update user balance
    async updateBalance(telegramId, amount, operation = 'add') {
        const data = await this.readBin('users');
        const users = data.users || [];
        
        const userIndex = users.findIndex(u => u.telegramId === telegramId);
        
        if (userIndex >= 0) {
            if (operation === 'add') {
                users[userIndex].balance = (users[userIndex].balance || 0) + amount;
            } else if (operation === 'subtract') {
                users[userIndex].balance = (users[userIndex].balance || 0) - amount;
            } else if (operation === 'set') {
                users[userIndex].balance = amount;
            }
            
            users[userIndex].updatedAt = Date.now();
            data.users = users;
            await this.updateBin('users', data);
            
            return users[userIndex].balance;
        }
        
        return null;
    },
    
    // Get user balance
    async getBalance(telegramId) {
        const user = await this.getUser(telegramId);
        return user ? user.balance || 0 : 0;
    },
    
    // ============================================
    // CATEGORY OPERATIONS
    // ============================================
    
    // Get all categories
    async getCategories() {
        const data = await this.readBin('categories');
        return data.categories || [];
    },
    
    // Get category by ID
    async getCategory(categoryId) {
        const categories = await this.getCategories();
        return categories.find(c => c.id === categoryId) || null;
    },
    
    // Save category
    async saveCategory(categoryData) {
        const data = await this.readBin('categories');
        const categories = data.categories || [];
        
        if (categoryData.id) {
            // Update existing
            const index = categories.findIndex(c => c.id === categoryData.id);
            if (index >= 0) {
                categories[index] = { ...categories[index], ...categoryData, updatedAt: Date.now() };
            }
        } else {
            // Create new
            categoryData.id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            categoryData.createdAt = Date.now();
            categoryData.soldCount = 0;
            categories.push(categoryData);
        }
        
        data.categories = categories;
        await this.updateBin('categories', data);
        this.clearCache('categories');
        
        return categoryData;
    },
    
    // Delete category
    async deleteCategory(categoryId) {
        const data = await this.readBin('categories');
        data.categories = (data.categories || []).filter(c => c.id !== categoryId);
        await this.updateBin('categories', data);
        this.clearCache('categories');
        return true;
    },
    
    // Update category sold count
    async updateCategorySoldCount(categoryId, increment = 1) {
        const data = await this.readBin('categories');
        const categories = data.categories || [];
        
        const index = categories.findIndex(c => c.id === categoryId);
        if (index >= 0) {
            categories[index].soldCount = (categories[index].soldCount || 0) + increment;
            data.categories = categories;
            await this.updateBin('categories', data);
        }
        
        return true;
    },
    
    // ============================================
    // PRODUCT OPERATIONS
    // ============================================
    
    // Get all products
    async getProducts() {
        const data = await this.readBin('products');
        return data.products || [];
    },
    
    // Get products by category
    async getProductsByCategory(categoryId) {
        const products = await this.getProducts();
        return products.filter(p => p.categoryId === categoryId);
    },
    
    // Get product by ID
    async getProduct(productId) {
        const products = await this.getProducts();
        return products.find(p => p.id === productId) || null;
    },
    
    // Save product
    async saveProduct(productData) {
        const data = await this.readBin('products');
        const products = data.products || [];
        
        if (productData.id) {
            // Update existing
            const index = products.findIndex(p => p.id === productData.id);
            if (index >= 0) {
                products[index] = { ...products[index], ...productData, updatedAt: Date.now() };
            }
        } else {
            // Create new
            productData.id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            productData.createdAt = Date.now();
            productData.soldCount = 0;
            products.push(productData);
        }
        
        data.products = products;
        await this.updateBin('products', data);
        this.clearCache('products');
        
        return productData;
    },
    
    // Delete product
    async deleteProduct(productId) {
        const data = await this.readBin('products');
        data.products = (data.products || []).filter(p => p.id !== productId);
        await this.updateBin('products', data);
        this.clearCache('products');
        return true;
    },
    
    // ============================================
    // ORDER OPERATIONS
    // ============================================
    
    // Get all orders
    async getOrders() {
        const data = await this.readBin('orders');
        return data.orders || [];
    },
    
    // Get orders by user
    async getOrdersByUser(telegramId) {
        const orders = await this.getOrders();
        return orders.filter(o => o.userId === telegramId).sort((a, b) => b.timestamp - a.timestamp);
    },
    
    // Get order by ID
    async getOrder(orderId) {
        const orders = await this.getOrders();
        return orders.find(o => o.orderId === orderId) || null;
    },
    
    // Create order
    async createOrder(orderData) {
        const data = await this.readBin('orders');
        const orders = data.orders || [];
        
        orderData.orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
        orderData.status = 'pending';
        orderData.timestamp = Date.now();
        
        orders.push(orderData);
        data.orders = orders;
        
        await this.updateBin('orders', data);
        this.clearCache('orders');
        
        return orderData;
    },
    
    // Update order status
    async updateOrderStatus(orderId, status, additionalData = {}) {
        const data = await this.readBin('orders');
        const orders = data.orders || [];
        
        const index = orders.findIndex(o => o.orderId === orderId);
        if (index >= 0) {
            orders[index].status = status;
            orders[index].updatedAt = Date.now();
            orders[index] = { ...orders[index], ...additionalData };
            
            data.orders = orders;
            await this.updateBin('orders', data);
            this.clearCache('orders');
            
            return orders[index];
        }
        
        return null;
    },
    
    // Get pending orders
    async getPendingOrders() {
        const orders = await this.getOrders();
        return orders.filter(o => o.status === 'pending').sort((a, b) => b.timestamp - a.timestamp);
    },
    
    // ============================================
    // TOPUP OPERATIONS
    // ============================================
    
    // Get all topups
    async getTopups() {
        const data = await this.readBin('topups');
        return data.topups || [];
    },
    
    // Get topups by user
    async getTopupsByUser(telegramId) {
        const topups = await this.getTopups();
        return topups.filter(t => t.userId === telegramId).sort((a, b) => b.timestamp - a.timestamp);
    },
    
    // Create topup request
    async createTopup(topupData) {
        const data = await this.readBin('topups');
        const topups = data.topups || [];
        
        topupData.requestId = 'TOP' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
        topupData.status = 'pending';
        topupData.timestamp = Date.now();
        
        topups.push(topupData);
        data.topups = topups;
        
        await this.updateBin('topups', data);
        this.clearCache('topups');
        
        return topupData;
    },
    
    // Update topup status
    async updateTopupStatus(requestId, status, additionalData = {}) {
        const data = await this.readBin('topups');
        const topups = data.topups || [];
        
        const index = topups.findIndex(t => t.requestId === requestId);
        if (index >= 0) {
            topups[index].status = status;
            topups[index].updatedAt = Date.now();
            topups[index] = { ...topups[index], ...additionalData };
            
            data.topups = topups;
            await this.updateBin('topups', data);
            this.clearCache('topups');
            
            return topups[index];
        }
        
        return null;
    },
    
    // Get pending topups
    async getPendingTopups() {
        const topups = await this.getTopups();
        return topups.filter(t => t.status === 'pending').sort((a, b) => b.timestamp - a.timestamp);
    },
    
    // ============================================
    // BANNER OPERATIONS
    // ============================================
    
    // Get all banners
    async getBanners() {
        const data = await this.readBin('banners');
        return data;
    },
    
    // Get banners by type
    async getBannersByType(type) {
        const data = await this.readBin('banners');
        return data[type] || [];
    },
    
    // Save banner
    async saveBanner(type, bannerData) {
        const data = await this.readBin('banners');
        
        if (!data[type]) {
            data[type] = [];
        }
        
        if (bannerData.id) {
            // Update existing
            const index = data[type].findIndex(b => b.id === bannerData.id);
            if (index >= 0) {
                data[type][index] = { ...data[type][index], ...bannerData, updatedAt: Date.now() };
            }
        } else {
            // Create new
            bannerData.id = 'banner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            bannerData.createdAt = Date.now();
            data[type].push(bannerData);
        }
        
        await this.updateBin('banners', data);
        this.clearCache('banners');
        
        return bannerData;
    },
    
    // Delete banner
    async deleteBanner(type, bannerId) {
        const data = await this.readBin('banners');
        if (data[type]) {
            data[type] = data[type].filter(b => b.id !== bannerId);
            await this.updateBin('banners', data);
            this.clearCache('banners');
        }
        return true;
    },
    
    // ============================================
    // PAYMENT OPERATIONS
    // ============================================
    
    // Get all payment methods
    async getPayments() {
        const data = await this.readBin('payments');
        return data.payments || [];
    },
    
    // Save payment method
    async savePayment(paymentData) {
        const data = await this.readBin('payments');
        const payments = data.payments || [];
        
        if (paymentData.id) {
            // Update existing
            const index = payments.findIndex(p => p.id === paymentData.id);
            if (index >= 0) {
                payments[index] = { ...payments[index], ...paymentData, updatedAt: Date.now() };
            }
        } else {
            // Create new
            paymentData.id = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            paymentData.createdAt = Date.now();
            payments.push(paymentData);
        }
        
        data.payments = payments;
        await this.updateBin('payments', data);
        this.clearCache('payments');
        
        return paymentData;
    },
    
    // Delete payment method
    async deletePayment(paymentId) {
        const data = await this.readBin('payments');
        data.payments = (data.payments || []).filter(p => p.id !== paymentId);
        await this.updateBin('payments', data);
        this.clearCache('payments');
        return true;
    },
    
    // ============================================
    // INPUT TABLE OPERATIONS
    // ============================================
    
    // Get all input tables
    async getInputTables() {
        const data = await this.readBin('inputTables');
        return data.inputTables || [];
    },
    
    // Get input tables by category
    async getInputTablesByCategory(categoryId) {
        const inputTables = await this.getInputTables();
        return inputTables.filter(i => i.categoryId === categoryId);
    },
    
    // Save input table
    async saveInputTable(inputTableData) {
        const data = await this.readBin('inputTables');
        const inputTables = data.inputTables || [];
        
        if (inputTableData.id) {
            // Update existing
            const index = inputTables.findIndex(i => i.id === inputTableData.id);
            if (index >= 0) {
                inputTables[index] = { ...inputTables[index], ...inputTableData, updatedAt: Date.now() };
            }
        } else {
            // Create new
            inputTableData.id = 'input_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            inputTableData.createdAt = Date.now();
            inputTables.push(inputTableData);
        }
        
        data.inputTables = inputTables;
        await this.updateBin('inputTables', data);
        this.clearCache('inputTables');
        
        return inputTableData;
    },
    
    // Delete input table
    async deleteInputTable(inputTableId) {
        const data = await this.readBin('inputTables');
        data.inputTables = (data.inputTables || []).filter(i => i.id !== inputTableId);
        await this.updateBin('inputTables', data);
        this.clearCache('inputTables');
        return true;
    },
    
    // ============================================
    // SETTINGS OPERATIONS
    // ============================================
    
    // Get settings
    async getSettings() {
        const data = await this.readBin('settings');
        return data;
    },
    
    // Save settings
    async saveSettings(settingsData) {
        const currentSettings = await this.getSettings();
        const newSettings = { ...currentSettings, ...settingsData, updatedAt: Date.now() };
        await this.updateBin('settings', newSettings);
        this.clearCache('settings');
        return newSettings;
    },
    
    // ============================================
    // BANNED USERS OPERATIONS
    // ============================================
    
    // Get banned users
    async getBannedUsers() {
        const data = await this.readBin('bannedUsers');
        return data.bannedUsers || [];
    },
    
    // Check if user is banned
    async isUserBanned(telegramId) {
        const bannedUsers = await this.getBannedUsers();
        return bannedUsers.some(b => b.telegramId === telegramId);
    },
    
    // Ban user
    async banUser(telegramId, reason = '') {
        const data = await this.readBin('bannedUsers');
        const bannedUsers = data.bannedUsers || [];
        
        if (!bannedUsers.some(b => b.telegramId === telegramId)) {
            bannedUsers.push({
                telegramId: telegramId,
                reason: reason,
                bannedAt: Date.now()
            });
            
            data.bannedUsers = bannedUsers;
            await this.updateBin('bannedUsers', data);
            this.clearCache('bannedUsers');
        }
        
        return true;
    },
    
    // Unban user
    async unbanUser(telegramId) {
        const data = await this.readBin('bannedUsers');
        data.bannedUsers = (data.bannedUsers || []).filter(b => b.telegramId !== telegramId);
        await this.updateBin('bannedUsers', data);
        this.clearCache('bannedUsers');
        return true;
    },
    
    // ============================================
    // FAILED PURCHASE ATTEMPTS TRACKING
    // ============================================
    
    // Track failed purchase attempt
    async trackFailedAttempt(telegramId) {
        const key = `failed_attempts_${telegramId}`;
        const today = new Date().toDateString();
        
        let attempts = await TelegramApp.cloudStorage.getItem(key) || { date: today, count: 0 };
        
        // Reset if different day
        if (attempts.date !== today) {
            attempts = { date: today, count: 0 };
        }
        
        attempts.count++;
        await TelegramApp.cloudStorage.setItem(key, attempts);
        
        // Auto ban if 5 or more attempts
        if (attempts.count >= 5) {
            await this.banUser(telegramId, 'Too many failed purchase attempts');
            return { banned: true, attempts: attempts.count };
        }
        
        return { banned: false, attempts: attempts.count };
    },
    
    // Get failed attempts count
    async getFailedAttempts(telegramId) {
        const key = `failed_attempts_${telegramId}`;
        const today = new Date().toDateString();
        
        const attempts = await TelegramApp.cloudStorage.getItem(key) || { date: today, count: 0 };
        
        if (attempts.date !== today) {
            return 0;
        }
        
        return attempts.count;
    },
    
    // ============================================
    // STATISTICS
    // ============================================
    
    // Get dashboard statistics
    async getStats() {
        const [users, orders, topups] = await Promise.all([
            this.getUsers(),
            this.getOrders(),
            this.getTopups()
        ]);
        
        const approvedOrders = orders.filter(o => o.status === 'approved');
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const pendingTopups = topups.filter(t => t.status === 'pending');
        
        const totalRevenue = approvedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        
        return {
            totalUsers: users.length,
            totalOrders: orders.length,
            pendingOrders: pendingOrders.length,
            pendingTopups: pendingTopups.length,
            totalRevenue: totalRevenue,
            premiumUsers: users.filter(u => u.isPremium).length
        };
    }
};

// ============================================
// IMAGE STORAGE (Base64 in JSONBin)
// ============================================

const ImageStorage = {
    // Compress image before storing
    async compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },
    
    // Store image and return base64
    async storeImage(file, options = {}) {
        const maxWidth = options.maxWidth || 800;
        const quality = options.quality || 0.7;
        
        // Validate image
        const validation = await ContentFilter.validateImage(file);
        if (!validation.valid) {
            throw new Error(validation.reason);
        }
        
        // Compress and return base64
        const base64 = await this.compressImage(file, maxWidth, quality);
        return base64;
    },
    
    // Store banner image (larger)
    async storeBannerImage(file) {
        return await this.storeImage(file, { maxWidth: 1280, quality: 0.8 });
    },
    
    // Store icon image (smaller)
    async storeIconImage(file) {
        return await this.storeImage(file, { maxWidth: 200, quality: 0.8 });
    }
};

// Export
window.Database = Database;
window.ImageStorage = ImageStorage;
