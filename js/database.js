// js/database.js - JSONBin.io Database Handler (FIXED)

const Database = {
    isInitialized: false,
    
    // Initialize database
    async init() {
        console.log('🔄 Initializing database...');
        
        try {
            // Try to get existing bin registry from localStorage
            const registryId = localStorage.getItem('mafia_bin_registry');
            
            if (registryId) {
                console.log('📦 Found registry:', registryId);
                const registry = await this.readBin(registryId);
                
                if (registry && registry.binIds) {
                    // Copy bin IDs to global BIN_IDS object
                    Object.keys(registry.binIds).forEach(key => {
                        BIN_IDS[key] = registry.binIds[key];
                    });
                    this.isInitialized = true;
                    console.log('✅ Database loaded from registry');
                    return true;
                }
            }
            
            // Create new bins if not exists
            console.log('📦 Creating new database bins...');
            await this.createAllBins();
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Database init error:', error);
            // Still try to create bins
            try {
                await this.createAllBins();
                this.isInitialized = true;
                return true;
            } catch (e) {
                console.error('❌ Failed to create bins:', e);
                return false;
            }
        }
    },

    // Create all required bins
    async createAllBins() {
        console.log('📦 Creating database bins...');
        
        const collections = {
            users: { users: [] },
            categories: { categories: [] },
            products: { products: [] },
            orders: { orders: [] },
            banners: { type1: [], type2: [] },
            payments: { methods: [] },
            settings: { 
                logo: '', 
                siteName: 'MAFIA Gaming Shop', 
                theme: 'dark',
                initialized: true
            },
            inputTables: { tables: [] },
            bannedUsers: { banned: [] },
            announcements: { text: '🎮 MAFIA Gaming Shop မှ ကြိုဆိုပါတယ်! PUBG & MLBB UC/Diamond များကို အမြန်ဆုံး ဝယ်ယူလိုက်ပါ!' },
            deposits: { requests: [] }
        };

        const binIds = {};

        for (const [name, data] of Object.entries(collections)) {
            try {
                const response = await fetch(`${CONFIG.JSONBIN_API}/b`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY,
                        'X-Bin-Name': `mafia-${name}-${Date.now()}`
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    console.error(`Failed to create bin ${name}:`, response.status);
                    continue;
                }
                
                const result = await response.json();
                if (result.metadata && result.metadata.id) {
                    binIds[name] = result.metadata.id;
                    BIN_IDS[name] = result.metadata.id;
                    console.log(`✅ Created bin: ${name} = ${result.metadata.id}`);
                }
            } catch (error) {
                console.error(`❌ Error creating bin ${name}:`, error);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 200));
        }

        // Create registry bin to store all bin IDs
        try {
            const registryResponse = await fetch(`${CONFIG.JSONBIN_API}/b`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY,
                    'X-Bin-Name': `mafia-registry-${Date.now()}`
                },
                body: JSON.stringify({ 
                    binIds, 
                    createdAt: new Date().toISOString() 
                })
            });
            
            if (registryResponse.ok) {
                const registryResult = await registryResponse.json();
                if (registryResult.metadata && registryResult.metadata.id) {
                    localStorage.setItem('mafia_bin_registry', registryResult.metadata.id);
                    console.log('✅ Registry created:', registryResult.metadata.id);
                }
            }
        } catch (error) {
            console.error('❌ Error creating registry:', error);
        }

        return binIds;
    },

    // Read from bin
    async readBin(binId) {
        if (!binId) return null;
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN_API}/b/${binId}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
                }
            });
            
            if (!response.ok) {
                console.error('Failed to read bin:', response.status);
                return null;
            }
            
            const result = await response.json();
            return result.record;
        } catch (error) {
            console.error('Error reading bin:', error);
            return null;
        }
    },

    // Update bin
    async updateBin(binId, data) {
        if (!binId) return null;
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.error('Failed to update bin:', response.status);
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating bin:', error);
            return null;
        }
    },

    // Send notification to admin (safe - checks if TelegramAPI exists)
    async notifyAdmin(message) {
        try {
            if (typeof TelegramAPI !== 'undefined' && TelegramAPI.sendMessage) {
                await TelegramAPI.sendMessage(CONFIG.ADMIN_TELEGRAM_ID, message);
            }
        } catch (e) {
            console.log('Could not notify admin:', e);
        }
    },

    // ==================== USER OPERATIONS ====================
    
    async getUser(telegramId) {
        if (!BIN_IDS.users) return null;
        
        const data = await this.readBin(BIN_IDS.users);
        if (!data || !data.users) return null;
        return data.users.find(u => String(u.telegramId) === String(telegramId));
    },

    async createUser(userData) {
        if (!BIN_IDS.users) return null;
        
        const data = await this.readBin(BIN_IDS.users);
        if (!data) return null;
        
        // Check if user exists
        const existingUser = data.users.find(u => String(u.telegramId) === String(userData.telegramId));
        if (existingUser) {
            existingUser.lastActive = new Date().toISOString();
            await this.updateBin(BIN_IDS.users, data);
            return existingUser;
        }
        
        const newUser = {
            id: `user_${Date.now()}`,
            telegramId: String(userData.telegramId),
            username: userData.username || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            photoUrl: userData.photoUrl || '',
            languageCode: userData.languageCode || 'en',
            isPremium: userData.isPremium || false,
            balance: 0,
            totalDeposits: 0,
            totalSpent: 0,
            totalOrders: 0,
            approvedOrders: 0,
            rejectedOrders: 0,
            pendingOrders: 0,
            dailyFailedAttempts: 0,
            lastFailedDate: null,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        
        data.users.push(newUser);
        await this.updateBin(BIN_IDS.users, data);
        
        // Notify admin
        this.notifyAdmin(
            `👤 <b>အသုံးပြုသူအသစ်!</b>\n\n` +
            `🆔 ID: <code>${newUser.telegramId}</code>\n` +
            `👤 အမည်: ${newUser.firstName} ${newUser.lastName}\n` +
            `📛 Username: @${newUser.username || 'N/A'}\n` +
            `⭐ Premium: ${newUser.isPremium ? 'Yes' : 'No'}`
        );
        
        return newUser;
    },

    async updateUser(telegramId, updates) {
        if (!BIN_IDS.users) return null;
        
        const data = await this.readBin(BIN_IDS.users);
        if (!data) return null;
        
        const index = data.users.findIndex(u => String(u.telegramId) === String(telegramId));
        if (index === -1) return null;
        
        data.users[index] = { 
            ...data.users[index], 
            ...updates, 
            lastActive: new Date().toISOString() 
        };
        await this.updateBin(BIN_IDS.users, data);
        return data.users[index];
    },

    async getAllUsers() {
        if (!BIN_IDS.users) return [];
        const data = await this.readBin(BIN_IDS.users);
        return data ? data.users : [];
    },

    async updateUserBalance(telegramId, amount, operation = 'add') {
        if (!BIN_IDS.users) return null;
        
        const data = await this.readBin(BIN_IDS.users);
        if (!data) return null;
        
        const index = data.users.findIndex(u => String(u.telegramId) === String(telegramId));
        if (index === -1) return null;
        
        const user = data.users[index];
        
        if (operation === 'add') {
            user.balance = (user.balance || 0) + parseFloat(amount);
            user.totalDeposits = (user.totalDeposits || 0) + parseFloat(amount);
        } else if (operation === 'subtract') {
            user.balance = (user.balance || 0) - parseFloat(amount);
            user.totalSpent = (user.totalSpent || 0) + parseFloat(amount);
        } else if (operation === 'set') {
            user.balance = parseFloat(amount);
        }
        
        await this.updateBin(BIN_IDS.users, data);
        return user;
    },

    // ==================== CATEGORY OPERATIONS ====================

    async getCategories() {
        if (!BIN_IDS.categories) return [];
        const data = await this.readBin(BIN_IDS.categories);
        return data ? data.categories : [];
    },

    async getCategory(categoryId) {
        if (!BIN_IDS.categories) return null;
        const data = await this.readBin(BIN_IDS.categories);
        if (!data) return null;
        return data.categories.find(c => c.id === categoryId);
    },

    async createCategory(categoryData) {
        if (!BIN_IDS.categories) return null;
        
        const data = await this.readBin(BIN_IDS.categories);
        if (!data) return null;
        
        const newCategory = {
            id: `cat_${Date.now()}`,
            name: categoryData.name,
            icon: categoryData.icon || '',
            countryFlag: categoryData.countryFlag || '',
            hasDiscount: categoryData.hasDiscount || false,
            discountBadge: categoryData.discountBadge || '',
            totalSold: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.categories.push(newCategory);
        await this.updateBin(BIN_IDS.categories, data);
        
        this.notifyAdmin(`📁 <b>Category အသစ်!</b>\n📛 ${newCategory.name}`);
        
        return newCategory;
    },

    async updateCategory(categoryId, updates) {
        if (!BIN_IDS.categories) return null;
        
        const data = await this.readBin(BIN_IDS.categories);
        if (!data) return null;
        
        const index = data.categories.findIndex(c => c.id === categoryId);
        if (index === -1) return null;
        
        data.categories[index] = { 
            ...data.categories[index], 
            ...updates, 
            updatedAt: new Date().toISOString() 
        };
        await this.updateBin(BIN_IDS.categories, data);
        return data.categories[index];
    },

    async deleteCategory(categoryId) {
        if (!BIN_IDS.categories) return false;
        
        const data = await this.readBin(BIN_IDS.categories);
        if (!data) return false;
        
        data.categories = data.categories.filter(c => c.id !== categoryId);
        await this.updateBin(BIN_IDS.categories, data);
        return true;
    },

    // ==================== PRODUCT OPERATIONS ====================

    async getProducts(categoryId = null) {
        if (!BIN_IDS.products) return [];
        
        const data = await this.readBin(BIN_IDS.products);
        if (!data) return [];
        
        let products = data.products || [];
        if (categoryId) {
            products = products.filter(p => p.categoryId === categoryId && p.isActive !== false);
        }
        return products;
    },

    async getProduct(productId) {
        if (!BIN_IDS.products) return null;
        const data = await this.readBin(BIN_IDS.products);
        if (!data) return null;
        return data.products.find(p => p.id === productId);
    },

    async getAllProducts() {
        if (!BIN_IDS.products) return [];
        const data = await this.readBin(BIN_IDS.products);
        return data ? data.products : [];
    },

    async createProduct(productData) {
        if (!BIN_IDS.products) return null;
        
        const data = await this.readBin(BIN_IDS.products);
        if (!data) return null;
        
        const discountPercent = productData.discountPercent || 0;
        const originalPrice = parseFloat(productData.price);
        const discountedPrice = originalPrice - (originalPrice * discountPercent / 100);
        
        const newProduct = {
            id: `prod_${Date.now()}`,
            categoryId: productData.categoryId,
            categoryName: productData.categoryName || '',
            name: productData.name,
            amount: productData.amount,
            originalPrice: originalPrice,
            price: discountedPrice,
            currency: productData.currency || 'MMK',
            discountPercent: discountPercent,
            icon: productData.icon || '',
            deliveryType: productData.deliveryType || 'instant',
            deliveryTime: productData.deliveryTime || '',
            description: productData.description || '',
            totalSold: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.products.push(newProduct);
        await this.updateBin(BIN_IDS.products, data);
        
        this.notifyAdmin(`🛍️ <b>Product အသစ်!</b>\n📛 ${newProduct.name}\n💰 ${newProduct.price} ${newProduct.currency}`);
        
        return newProduct;
    },

    async updateProduct(productId, updates) {
        if (!BIN_IDS.products) return null;
        
        const data = await this.readBin(BIN_IDS.products);
        if (!data) return null;
        
        const index = data.products.findIndex(p => p.id === productId);
        if (index === -1) return null;
        
        // Recalculate price if needed
        if (updates.discountPercent !== undefined || updates.originalPrice !== undefined) {
            const originalPrice = updates.originalPrice || data.products[index].originalPrice;
            const discountPercent = updates.discountPercent !== undefined ? updates.discountPercent : data.products[index].discountPercent;
            updates.price = originalPrice - (originalPrice * discountPercent / 100);
        }
        
        data.products[index] = { 
            ...data.products[index], 
            ...updates, 
            updatedAt: new Date().toISOString() 
        };
        await this.updateBin(BIN_IDS.products, data);
        return data.products[index];
    },

    async deleteProduct(productId) {
        if (!BIN_IDS.products) return false;
        
        const data = await this.readBin(BIN_IDS.products);
        if (!data) return false;
        
        data.products = data.products.filter(p => p.id !== productId);
        await this.updateBin(BIN_IDS.products, data);
        return true;
    },

    // ==================== ORDER OPERATIONS ====================

    async getOrders(filter = {}) {
        if (!BIN_IDS.orders) return [];
        
        const data = await this.readBin(BIN_IDS.orders);
        if (!data) return [];
        
        let orders = data.orders || [];
        
        if (filter.telegramId) {
            orders = orders.filter(o => String(o.telegramId) === String(filter.telegramId));
        }
        if (filter.status) {
            orders = orders.filter(o => o.status === filter.status);
        }
        
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return orders;
    },

    async createOrder(orderData) {
        if (!BIN_IDS.orders) return null;
        
        const data = await this.readBin(BIN_IDS.orders);
        if (!data) return null;
        
        const newOrder = {
            id: `order_${Date.now()}`,
            orderId: `ORD${Date.now().toString().slice(-8)}`,
            type: 'purchase',
            userId: orderData.userId,
            telegramId: String(orderData.telegramId),
            username: orderData.username || '',
            firstName: orderData.firstName || '',
            productId: orderData.productId,
            productName: orderData.productName,
            productAmount: orderData.productAmount,
            categoryId: orderData.categoryId,
            categoryName: orderData.categoryName,
            price: orderData.price,
            currency: orderData.currency || 'MMK',
            inputData: orderData.inputData || {},
            status: 'pending',
            createdAt: new Date().toISOString(),
            processedAt: null,
            processedBy: null,
            note: ''
        };
        
        data.orders.push(newOrder);
        await this.updateBin(BIN_IDS.orders, data);
        
        this.notifyAdmin(
            `🛒 <b>Order အသစ်!</b>\n\n` +
            `📦 ${newOrder.orderId}\n` +
            `👤 ${newOrder.firstName}\n` +
            `🛍️ ${newOrder.productName}\n` +
            `💰 ${newOrder.price} ${newOrder.currency}`
        );
        
        return newOrder;
    },

    async updateOrder(orderId, updates) {
        if (!BIN_IDS.orders) return null;
        
        const data = await this.readBin(BIN_IDS.orders);
        if (!data) return null;
        
        const index = data.orders.findIndex(o => o.id === orderId);
        if (index === -1) return null;
        
        data.orders[index] = { ...data.orders[index], ...updates };
        await this.updateBin(BIN_IDS.orders, data);
        return data.orders[index];
    },

    async approveOrder(orderId) {
        const order = await this.updateOrder(orderId, {
            status: 'approved',
            processedAt: new Date().toISOString(),
            processedBy: CONFIG.ADMIN_TELEGRAM_ID
        });
        
        if (order && typeof TelegramAPI !== 'undefined') {
            TelegramAPI.sendMessage(
                order.telegramId,
                `✅ <b>Order အတည်ပြုပြီး!</b>\n\n` +
                `📦 ${order.orderId}\n` +
                `🛍️ ${order.productName}\n` +
                `🎮 Game ထဲတွင် စစ်ဆေးပါ!`
            );
        }
        
        return order;
    },

    async rejectOrder(orderId, reason = '') {
        if (!BIN_IDS.orders) return null;
        
        const data = await this.readBin(BIN_IDS.orders);
        if (!data) return null;
        
        const index = data.orders.findIndex(o => o.id === orderId);
        if (index === -1) return null;
        
        const order = data.orders[index];
        
        data.orders[index] = {
            ...order,
            status: 'rejected',
            processedAt: new Date().toISOString(),
            note: reason
        };
        await this.updateBin(BIN_IDS.orders, data);
        
        // Refund
        await this.updateUserBalance(order.telegramId, order.price, 'add');
        
        if (typeof TelegramAPI !== 'undefined') {
            TelegramAPI.sendMessage(
                order.telegramId,
                `❌ <b>Order ငြင်းပယ်ခံရသည်</b>\n\n` +
                `📦 ${order.orderId}\n` +
                `💸 ${order.price} ${order.currency} ပြန်အမ်းပြီး`
            );
        }
        
        return data.orders[index];
    },

    // ==================== DEPOSIT OPERATIONS ====================

    async getDeposits(filter = {}) {
        if (!BIN_IDS.deposits) return [];
        
        const data = await this.readBin(BIN_IDS.deposits);
        if (!data) return [];
        
        let requests = data.requests || [];
        
        if (filter.telegramId) {
            requests = requests.filter(r => String(r.telegramId) === String(filter.telegramId));
        }
        if (filter.status) {
            requests = requests.filter(r => r.status === filter.status);
        }
        
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return requests;
    },

    async createDeposit(depositData) {
        if (!BIN_IDS.deposits) return null;
        
        const data = await this.readBin(BIN_IDS.deposits);
        if (!data) return null;
        
        const newDeposit = {
            id: `dep_${Date.now()}`,
            depositId: `DEP${Date.now().toString().slice(-8)}`,
            userId: depositData.userId,
            telegramId: String(depositData.telegramId),
            username: depositData.username || '',
            firstName: depositData.firstName || '',
            amount: parseFloat(depositData.amount),
            currency: 'MMK',
            paymentMethodId: depositData.paymentMethodId,
            paymentMethodName: depositData.paymentMethodName,
            receiptImage: depositData.receiptImage,
            status: 'pending',
            createdAt: new Date().toISOString(),
            processedAt: null,
            note: ''
        };
        
        data.requests.push(newDeposit);
        await this.updateBin(BIN_IDS.deposits, data);
        
        this.notifyAdmin(
            `💰 <b>ငွေသွင်းတောင်းဆို!</b>\n\n` +
            `🆔 ${newDeposit.depositId}\n` +
            `👤 ${newDeposit.firstName}\n` +
            `💵 ${newDeposit.amount} MMK`
        );
        
        return newDeposit;
    },

    async approveDeposit(depositId) {
        if (!BIN_IDS.deposits) return null;
        
        const data = await this.readBin(BIN_IDS.deposits);
        if (!data) return null;
        
        const index = data.requests.findIndex(d => d.id === depositId);
        if (index === -1) return null;
        
        const deposit = data.requests[index];
        
        data.requests[index] = {
            ...deposit,
            status: 'approved',
            processedAt: new Date().toISOString()
        };
        await this.updateBin(BIN_IDS.deposits, data);
        
        // Add balance
        await this.updateUserBalance(deposit.telegramId, deposit.amount, 'add');
        
        if (typeof TelegramAPI !== 'undefined') {
            TelegramAPI.sendMessage(
                deposit.telegramId,
                `✅ <b>ငွေသွင်းအတည်ပြုပြီး!</b>\n\n` +
                `💵 ${deposit.amount} MMK ထည့်သွင်းပြီး!`
            );
        }
        
        return deposit;
    },

    async rejectDeposit(depositId, reason = '') {
        if (!BIN_IDS.deposits) return null;
        
        const data = await this.readBin(BIN_IDS.deposits);
        if (!data) return null;
        
        const index = data.requests.findIndex(d => d.id === depositId);
        if (index === -1) return null;
        
        const deposit = data.requests[index];
        
        data.requests[index] = {
            ...deposit,
            status: 'rejected',
            processedAt: new Date().toISOString(),
            note: reason
        };
        await this.updateBin(BIN_IDS.deposits, data);
        
        if (typeof TelegramAPI !== 'undefined') {
            TelegramAPI.sendMessage(
                deposit.telegramId,
                `❌ <b>ငွေသွင်းငြင်းပယ်ခံရသည်</b>\n\n` +
                `📝 ${reason || 'N/A'}`
            );
        }
        
        return deposit;
    },

    // ==================== BANNER OPERATIONS ====================

    async getBanners(type = 'type1') {
        if (!BIN_IDS.banners) return [];
        const data = await this.readBin(BIN_IDS.banners);
        return data ? (data[type] || []) : [];
    },

    async addBanner(type, bannerData) {
        if (!BIN_IDS.banners) return null;
        
        const data = await this.readBin(BIN_IDS.banners);
        if (!data) return null;
        
        const newBanner = {
            id: `banner_${Date.now()}`,
            image: bannerData.image,
            categoryId: bannerData.categoryId || null,
            categoryName: bannerData.categoryName || '',
            description: bannerData.description || '',
            createdAt: new Date().toISOString()
        };
        
        if (!data[type]) data[type] = [];
        data[type].push(newBanner);
        await this.updateBin(BIN_IDS.banners, data);
        
        return newBanner;
    },

    async deleteBanner(type, bannerId) {
        if (!BIN_IDS.banners) return false;
        
        const data = await this.readBin(BIN_IDS.banners);
        if (!data) return false;
        
        data[type] = (data[type] || []).filter(b => b.id !== bannerId);
        await this.updateBin(BIN_IDS.banners, data);
        return true;
    },

    // ==================== PAYMENT OPERATIONS ====================

    async getPaymentMethods() {
        if (!BIN_IDS.payments) return [];
        const data = await this.readBin(BIN_IDS.payments);
        return data ? (data.methods || []).filter(m => m.isActive !== false) : [];
    },

    async getAllPaymentMethods() {
        if (!BIN_IDS.payments) return [];
        const data = await this.readBin(BIN_IDS.payments);
        return data ? (data.methods || []) : [];
    },

    async addPaymentMethod(methodData) {
        if (!BIN_IDS.payments) return null;
        
        const data = await this.readBin(BIN_IDS.payments);
        if (!data) return null;
        
        const newMethod = {
            id: `pay_${Date.now()}`,
            name: methodData.name,
            address: methodData.address,
            accountName: methodData.accountName,
            note: methodData.note || '',
            icon: methodData.icon || '',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        if (!data.methods) data.methods = [];
        data.methods.push(newMethod);
        await this.updateBin(BIN_IDS.payments, data);
        
        return newMethod;
    },

    async updatePaymentMethod(methodId, updates) {
        if (!BIN_IDS.payments) return null;
        
        const data = await this.readBin(BIN_IDS.payments);
        if (!data) return null;
        
        const index = (data.methods || []).findIndex(m => m.id === methodId);
        if (index === -1) return null;
        
        data.methods[index] = { ...data.methods[index], ...updates };
        await this.updateBin(BIN_IDS.payments, data);
        return data.methods[index];
    },

    async deletePaymentMethod(methodId) {
        if (!BIN_IDS.payments) return false;
        
        const data = await this.readBin(BIN_IDS.payments);
        if (!data) return false;
        
        data.methods = (data.methods || []).filter(m => m.id !== methodId);
        await this.updateBin(BIN_IDS.payments, data);
        return true;
    },

    // ==================== INPUT TABLE OPERATIONS ====================

    async getInputTables(categoryId = null) {
        if (!BIN_IDS.inputTables) return [];
        
        const data = await this.readBin(BIN_IDS.inputTables);
        if (!data) return [];
        
        let tables = data.tables || [];
        if (categoryId) {
            tables = tables.filter(t => t.categoryId === categoryId);
        }
        return tables;
    },

    async createInputTable(tableData) {
        if (!BIN_IDS.inputTables) return null;
        
        const data = await this.readBin(BIN_IDS.inputTables);
        if (!data) return null;
        
        const newTable = {
            id: `input_${Date.now()}`,
            categoryId: tableData.categoryId,
            categoryName: tableData.categoryName || '',
            name: tableData.name,
            placeholder: tableData.placeholder,
            inputType: tableData.inputType || 'text',
            required: tableData.required !== false,
            createdAt: new Date().toISOString()
        };
        
        if (!data.tables) data.tables = [];
        data.tables.push(newTable);
        await this.updateBin(BIN_IDS.inputTables, data);
        
        return newTable;
    },

    async updateInputTable(tableId, updates) {
        if (!BIN_IDS.inputTables) return null;
        
        const data = await this.readBin(BIN_IDS.inputTables);
        if (!data) return null;
        
        const index = (data.tables || []).findIndex(t => t.id === tableId);
        if (index === -1) return null;
        
        data.tables[index] = { ...data.tables[index], ...updates };
        await this.updateBin(BIN_IDS.inputTables, data);
        return data.tables[index];
    },

    async deleteInputTable(tableId) {
        if (!BIN_IDS.inputTables) return false;
        
        const data = await this.readBin(BIN_IDS.inputTables);
        if (!data) return false;
        
        data.tables = (data.tables || []).filter(t => t.id !== tableId);
        await this.updateBin(BIN_IDS.inputTables, data);
        return true;
    },

    // ==================== SETTINGS OPERATIONS ====================

    async getSettings() {
        if (!BIN_IDS.settings) {
            return { 
                logo: '', 
                siteName: 'MAFIA Gaming Shop', 
                theme: 'dark' 
            };
        }
        const data = await this.readBin(BIN_IDS.settings);
        return data || { logo: '', siteName: 'MAFIA Gaming Shop', theme: 'dark' };
    },

    async updateSettings(updates) {
        if (!BIN_IDS.settings) return null;
        
        const data = await this.readBin(BIN_IDS.settings);
        if (!data) return null;
        
        const newSettings = { ...data, ...updates, updatedAt: new Date().toISOString() };
        await this.updateBin(BIN_IDS.settings, newSettings);
        return newSettings;
    },

    // ==================== BANNED USERS OPERATIONS ====================

    async getBannedUsers() {
        if (!BIN_IDS.bannedUsers) return [];
        const data = await this.readBin(BIN_IDS.bannedUsers);
        return data ? (data.banned || []) : [];
    },

    async banUser(telegramId, reason = 'Violation') {
        if (!BIN_IDS.bannedUsers) return false;
        
        const data = await this.readBin(BIN_IDS.bannedUsers);
        if (!data) return false;
        
        if (!data.banned) data.banned = [];
        
        const existing = data.banned.find(b => String(b.telegramId) === String(telegramId));
        if (existing) return false;
        
        const user = await this.getUser(telegramId);
        
        data.banned.push({
            telegramId: String(telegramId),
            username: user?.username || '',
            firstName: user?.firstName || '',
            reason,
            bannedAt: new Date().toISOString()
        });
        
        await this.updateBin(BIN_IDS.bannedUsers, data);
        return true;
    },

    async unbanUser(telegramId) {
        if (!BIN_IDS.bannedUsers) return false;
        
        const data = await this.readBin(BIN_IDS.bannedUsers);
        if (!data) return false;
        
        data.banned = (data.banned || []).filter(b => String(b.telegramId) !== String(telegramId));
        await this.updateBin(BIN_IDS.bannedUsers, data);
        return true;
    },

    async isUserBanned(telegramId) {
        if (!BIN_IDS.bannedUsers) return false;
        const data = await this.readBin(BIN_IDS.bannedUsers);
        if (!data || !data.banned) return false;
        return data.banned.some(b => String(b.telegramId) === String(telegramId));
    },

    // ==================== ANNOUNCEMENT OPERATIONS ====================

    async getAnnouncement() {
        if (!BIN_IDS.announcements) {
            return '🎮 Welcome to MAFIA Gaming Shop!';
        }
        const data = await this.readBin(BIN_IDS.announcements);
        return data ? data.text : '🎮 Welcome to MAFIA Gaming Shop!';
    },

    async updateAnnouncement(text) {
        if (!BIN_IDS.announcements) return false;
        await this.updateBin(BIN_IDS.announcements, { 
            text, 
            updatedAt: new Date().toISOString() 
        });
        return true;
    },

    // ==================== STATISTICS ====================

    async getStatistics() {
        const users = await this.getAllUsers();
        const orders = await this.getOrders();
        const deposits = await this.getDeposits();
        const products = await this.getAllProducts();
        const categories = await this.getCategories();
        
        return {
            totalUsers: users.length,
            premiumUsers: users.filter(u => u.isPremium).length,
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            approvedOrders: orders.filter(o => o.status === 'approved').length,
            totalDeposits: deposits.length,
            pendingDeposits: deposits.filter(d => d.status === 'pending').length,
            totalProducts: products.length,
            totalCategories: categories.length,
            totalRevenue: orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.price || 0), 0),
            totalDepositAmount: deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + (d.amount || 0), 0)
        };
    },

    // ==================== BROADCAST ====================

    async broadcastMessage(message, imageUrl = null) {
        if (typeof TelegramAPI === 'undefined') return { success: 0, failed: 0, total: 0 };
        
        const users = await this.getAllUsers();
        let successCount = 0;
        let failCount = 0;
        
        for (const user of users) {
            try {
                if (imageUrl) {
                    await TelegramAPI.sendPhoto(user.telegramId, imageUrl, message);
                } else {
                    await TelegramAPI.sendMessage(user.telegramId, message);
                }
                successCount++;
                await new Promise(r => setTimeout(r, 50));
            } catch (error) {
                failCount++;
            }
        }
        
        return { success: successCount, failed: failCount, total: users.length };
    }
};
