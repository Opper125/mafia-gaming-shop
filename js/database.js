// js/database.js - JSONBin.io Database Handler (No Webhook)

const Database = {
    // Initialize database
    async init() {
        console.log('🔄 Initializing database...');
        
        // Try to get existing bin registry
        const registryId = localStorage.getItem('mafia_bin_registry');
        
        if (registryId) {
            try {
                const registry = await this.readBin(registryId);
                if (registry && registry.binIds) {
                    Object.assign(CONFIG.BIN_IDS, registry.binIds);
                    console.log('✅ Database loaded from registry');
                    return true;
                }
            } catch (e) {
                console.log('⚠️ Registry not found, creating new...');
            }
        }
        
        // Create new bins if not exists
        await this.createAllBins();
        return true;
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
                initialized: false
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
                        'X-Bin-Name': `mafia-gaming-${name}-${Date.now()}`
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                if (result.metadata && result.metadata.id) {
                    binIds[name] = result.metadata.id;
                    console.log(`✅ Created bin: ${name}`);
                }
            } catch (error) {
                console.error(`❌ Error creating bin ${name}:`, error);
            }
        }

        // Create registry bin to store all bin IDs
        try {
            const registryResponse = await fetch(`${CONFIG.JSONBIN_API}/b`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY,
                    'X-Bin-Name': `mafia-gaming-registry-${Date.now()}`
                },
                body: JSON.stringify({ binIds, createdAt: new Date().toISOString() })
            });
            
            const registryResult = await registryResponse.json();
            if (registryResult.metadata && registryResult.metadata.id) {
                localStorage.setItem('mafia_bin_registry', registryResult.metadata.id);
                Object.assign(CONFIG.BIN_IDS, binIds);
                console.log('✅ Registry created and saved');
            }
        } catch (error) {
            console.error('❌ Error creating registry:', error);
        }

        return binIds;
    },

    // Read from bin
    async readBin(binId) {
        try {
            const response = await fetch(`${CONFIG.JSONBIN_API}/b/${binId}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
                }
            });
            
            if (!response.ok) throw new Error('Failed to read bin');
            
            const result = await response.json();
            return result.record;
        } catch (error) {
            console.error('Error reading bin:', error);
            return null;
        }
    },

    // Update bin
    async updateBin(binId, data) {
        try {
            const response = await fetch(`${CONFIG.JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.JSONBIN_MASTER_KEY
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to update bin');
            
            return await response.json();
        } catch (error) {
            console.error('Error updating bin:', error);
            return null;
        }
    },

    // ==================== USER OPERATIONS ====================
    
    async getUser(telegramId) {
        const data = await this.readBin(CONFIG.BIN_IDS.users);
        if (!data || !data.users) return null;
        return data.users.find(u => String(u.telegramId) === String(telegramId));
    },

    async createUser(userData) {
        const data = await this.readBin(CONFIG.BIN_IDS.users);
        if (!data) return null;
        
        // Check if user exists
        const existingUser = data.users.find(u => String(u.telegramId) === String(userData.telegramId));
        if (existingUser) {
            // Update last active
            existingUser.lastActive = new Date().toISOString();
            await this.updateBin(CONFIG.BIN_IDS.users, data);
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
        await this.updateBin(CONFIG.BIN_IDS.users, data);
        
        // Send notification to admin
        await TelegramAPI.sendMessage(
            CONFIG.ADMIN_TELEGRAM_ID,
            `👤 <b>အသုံးပြုသူအသစ်!</b>\n\n` +
            `🆔 ID: <code>${newUser.telegramId}</code>\n` +
            `👤 အမည်: ${newUser.firstName} ${newUser.lastName}\n` +
            `📛 Username: @${newUser.username || 'N/A'}\n` +
            `⭐ Premium: ${newUser.isPremium ? 'Yes' : 'No'}\n` +
            `📅 အချိန်: ${new Date().toLocaleString('my-MM')}`
        );
        
        return newUser;
    },

    async updateUser(telegramId, updates) {
        const data = await this.readBin(CONFIG.BIN_IDS.users);
        if (!data) return null;
        
        const index = data.users.findIndex(u => String(u.telegramId) === String(telegramId));
        if (index === -1) return null;
        
        data.users[index] = { ...data.users[index], ...updates, lastActive: new Date().toISOString() };
        await this.updateBin(CONFIG.BIN_IDS.users, data);
        return data.users[index];
    },

    async getAllUsers() {
        const data = await this.readBin(CONFIG.BIN_IDS.users);
        return data ? data.users : [];
    },

    async updateUserBalance(telegramId, amount, operation = 'add') {
        const data = await this.readBin(CONFIG.BIN_IDS.users);
        if (!data) return null;
        
        const index = data.users.findIndex(u => String(u.telegramId) === String(telegramId));
        if (index === -1) return null;
        
        if (operation === 'add') {
            data.users[index].balance += parseFloat(amount);
            data.users[index].totalDeposits += parseFloat(amount);
        } else if (operation === 'subtract') {
            data.users[index].balance -= parseFloat(amount);
            data.users[index].totalSpent += parseFloat(amount);
        } else if (operation === 'set') {
            data.users[index].balance = parseFloat(amount);
        }
        
        await this.updateBin(CONFIG.BIN_IDS.users, data);
        return data.users[index];
    },

    // ==================== CATEGORY OPERATIONS ====================

    async getCategories() {
        const data = await this.readBin(CONFIG.BIN_IDS.categories);
        return data ? data.categories : [];
    },

    async getCategory(categoryId) {
        const data = await this.readBin(CONFIG.BIN_IDS.categories);
        if (!data) return null;
        return data.categories.find(c => c.id === categoryId);
    },

    async createCategory(categoryData) {
        const data = await this.readBin(CONFIG.BIN_IDS.categories);
        if (!data) return null;
        
        const newCategory = {
            id: `cat_${Date.now()}`,
            name: categoryData.name,
            icon: categoryData.icon,
            countryFlag: categoryData.countryFlag || '',
            hasDiscount: categoryData.hasDiscount || false,
            discountBadge: categoryData.discountBadge || '',
            totalSold: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.categories.push(newCategory);
        await this.updateBin(CONFIG.BIN_IDS.categories, data);
        
        // Notify admin
        await TelegramAPI.sendMessage(
            CONFIG.ADMIN_TELEGRAM_ID,
            `📁 <b>Category အသစ်ဖန်တီးပြီး!</b>\n\n` +
            `📛 အမည်: ${newCategory.name}\n` +
            `🆔 ID: <code>${newCategory.id}</code>`
        );
        
        return newCategory;
    },

    async updateCategory(categoryId, updates) {
        const data = await this.readBin(CONFIG.BIN_IDS.categories);
        if (!data) return null;
        
        const index = data.categories.findIndex(c => c.id === categoryId);
        if (index === -1) return null;
        
        data.categories[index] = { 
            ...data.categories[index], 
            ...updates, 
            updatedAt: new Date().toISOString() 
        };
        await this.updateBin(CONFIG.BIN_IDS.categories, data);
        return data.categories[index];
    },

    async deleteCategory(categoryId) {
        const data = await this.readBin(CONFIG.BIN_IDS.categories);
        if (!data) return false;
        
        data.categories = data.categories.filter(c => c.id !== categoryId);
        await this.updateBin(CONFIG.BIN_IDS.categories, data);
        
        // Also delete related products and input tables
        await this.deleteProductsByCategory(categoryId);
        await this.deleteInputTablesByCategory(categoryId);
        
        return true;
    },

    async incrementCategorySold(categoryId) {
        const data = await this.readBin(CONFIG.BIN_IDS.categories);
        if (!data) return null;
        
        const index = data.categories.findIndex(c => c.id === categoryId);
        if (index === -1) return null;
        
        data.categories[index].totalSold = (data.categories[index].totalSold || 0) + 1;
        await this.updateBin(CONFIG.BIN_IDS.categories, data);
        return data.categories[index];
    },

    // ==================== PRODUCT OPERATIONS ====================

    async getProducts(categoryId = null) {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        if (!data) return [];
        
        if (categoryId) {
            return data.products.filter(p => p.categoryId === categoryId && p.isActive);
        }
        return data.products.filter(p => p.isActive);
    },

    async getProduct(productId) {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        if (!data) return null;
        return data.products.find(p => p.id === productId);
    },

    async getAllProducts() {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        return data ? data.products : [];
    },

    async createProduct(productData) {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        if (!data) return null;
        
        const discountPrice = productData.discountPercent > 0 
            ? productData.price - (productData.price * productData.discountPercent / 100)
            : productData.price;
        
        const newProduct = {
            id: `prod_${Date.now()}`,
            categoryId: productData.categoryId,
            categoryName: productData.categoryName || '',
            name: productData.name,
            amount: productData.amount,
            originalPrice: productData.price,
            price: discountPrice,
            currency: productData.currency || 'MMK',
            discountPercent: productData.discountPercent || 0,
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
        await this.updateBin(CONFIG.BIN_IDS.products, data);
        
        // Update category discount status
        if (productData.discountPercent > 0) {
            await this.updateCategory(productData.categoryId, { hasDiscount: true });
        }
        
        // Notify admin
        await TelegramAPI.sendMessage(
            CONFIG.ADMIN_TELEGRAM_ID,
            `🛍️ <b>Product အသစ်ဖန်တီးပြီး!</b>\n\n` +
            `📛 အမည်: ${newProduct.name}\n` +
            `💰 စျေးနှုန်း: ${newProduct.price} ${newProduct.currency}\n` +
            `📁 Category: ${newProduct.categoryName}\n` +
            `🆔 ID: <code>${newProduct.id}</code>`
        );
        
        return newProduct;
    },

    async updateProduct(productId, updates) {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        if (!data) return null;
        
        const index = data.products.findIndex(p => p.id === productId);
        if (index === -1) return null;
        
        // Recalculate price if discount changed
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
        await this.updateBin(CONFIG.BIN_IDS.products, data);
        return data.products[index];
    },

    async deleteProduct(productId) {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        if (!data) return false;
        
        data.products = data.products.filter(p => p.id !== productId);
        await this.updateBin(CONFIG.BIN_IDS.products, data);
        return true;
    },

    async deleteProductsByCategory(categoryId) {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        if (!data) return false;
        
        data.products = data.products.filter(p => p.categoryId !== categoryId);
        await this.updateBin(CONFIG.BIN_IDS.products, data);
        return true;
    },

    async incrementProductSold(productId) {
        const data = await this.readBin(CONFIG.BIN_IDS.products);
        if (!data) return null;
        
        const index = data.products.findIndex(p => p.id === productId);
        if (index === -1) return null;
        
        data.products[index].totalSold = (data.products[index].totalSold || 0) + 1;
        await this.updateBin(CONFIG.BIN_IDS.products, data);
        return data.products[index];
    },

    // ==================== ORDER OPERATIONS ====================

    async getOrders(filter = {}) {
        const data = await this.readBin(CONFIG.BIN_IDS.orders);
        if (!data) return [];
        
        let orders = data.orders;
        
        if (filter.userId) {
            orders = orders.filter(o => o.userId === filter.userId);
        }
        if (filter.telegramId) {
            orders = orders.filter(o => String(o.telegramId) === String(filter.telegramId));
        }
        if (filter.status) {
            orders = orders.filter(o => o.status === filter.status);
        }
        if (filter.type) {
            orders = orders.filter(o => o.type === filter.type);
        }
        
        // Sort by date descending
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return orders;
    },

    async getOrder(orderId) {
        const data = await this.readBin(CONFIG.BIN_IDS.orders);
        if (!data) return null;
        return data.orders.find(o => o.id === orderId);
    },

    async createOrder(orderData) {
        const data = await this.readBin(CONFIG.BIN_IDS.orders);
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
        await this.updateBin(CONFIG.BIN_IDS.orders, data);
        
        // Update user stats
        await this.updateUser(orderData.telegramId, {
            totalOrders: (orderData.currentTotalOrders || 0) + 1,
            pendingOrders: (orderData.currentPendingOrders || 0) + 1
        });
        
        // Notify admin
        await TelegramAPI.sendMessage(
            CONFIG.ADMIN_TELEGRAM_ID,
            `🛒 <b>Order အသစ်ဝင်လာပါပြီ!</b>\n\n` +
            `📦 Order ID: <code>${newOrder.orderId}</code>\n` +
            `👤 User: ${newOrder.firstName} (@${newOrder.username || 'N/A'})\n` +
            `🆔 Telegram ID: <code>${newOrder.telegramId}</code>\n` +
            `🛍️ Product: ${newOrder.productName}\n` +
            `💎 Amount: ${newOrder.productAmount}\n` +
            `💰 Price: ${newOrder.price} ${newOrder.currency}\n` +
            `📝 Input Data: ${JSON.stringify(newOrder.inputData)}\n` +
            `⏰ Time: ${new Date().toLocaleString('my-MM')}\n\n` +
            `🔄 Status: <b>Pending</b>`
        );
        
        return newOrder;
    },

    async updateOrder(orderId, updates) {
        const data = await this.readBin(CONFIG.BIN_IDS.orders);
        if (!data) return null;
        
        const index = data.orders.findIndex(o => o.id === orderId);
        if (index === -1) return null;
        
        const order = data.orders[index];
        data.orders[index] = { ...order, ...updates };
        await this.updateBin(CONFIG.BIN_IDS.orders, data);
        
        return data.orders[index];
    },

    async approveOrder(orderId) {
        const order = await this.getOrder(orderId);
        if (!order) return null;
        
        // Update order
        await this.updateOrder(orderId, {
            status: 'approved',
            processedAt: new Date().toISOString(),
            processedBy: CONFIG.ADMIN_TELEGRAM_ID
        });
        
        // Update user stats
        const user = await this.getUser(order.telegramId);
        if (user) {
            await this.updateUser(order.telegramId, {
                approvedOrders: (user.approvedOrders || 0) + 1,
                pendingOrders: Math.max(0, (user.pendingOrders || 0) - 1)
            });
        }
        
        // Update product and category sold count
        if (order.productId) {
            await this.incrementProductSold(order.productId);
        }
        if (order.categoryId) {
            await this.incrementCategorySold(order.categoryId);
        }
        
        // Notify user
        await TelegramAPI.sendMessage(
            order.telegramId,
            `✅ <b>Order အတည်ပြုပြီးပါပြီ!</b>\n\n` +
            `📦 Order ID: <code>${order.orderId}</code>\n` +
            `🛍️ Product: ${order.productName}\n` +
            `💎 Amount: ${order.productAmount}\n` +
            `💰 Price: ${order.price} ${order.currency}\n\n` +
            `🎮 Game ထဲတွင် စစ်ဆေးနိုင်ပါပြီ!\n` +
            `📅 ${new Date().toLocaleString('my-MM')}`
        );
        
        return order;
    },

    async rejectOrder(orderId, reason = '') {
        const order = await this.getOrder(orderId);
        if (!order) return null;
        
        // Update order
        await this.updateOrder(orderId, {
            status: 'rejected',
            processedAt: new Date().toISOString(),
            processedBy: CONFIG.ADMIN_TELEGRAM_ID,
            note: reason
        });
        
        // Refund balance
        await this.updateUserBalance(order.telegramId, order.price, 'add');
        
        // Update user stats
        const user = await this.getUser(order.telegramId);
        if (user) {
            await this.updateUser(order.telegramId, {
                rejectedOrders: (user.rejectedOrders || 0) + 1,
                pendingOrders: Math.max(0, (user.pendingOrders || 0) - 1)
            });
        }
        
        // Notify user
        await TelegramAPI.sendMessage(
            order.telegramId,
            `❌ <b>Order ငြင်းပယ်ခံရပါသည်</b>\n\n` +
            `📦 Order ID: <code>${order.orderId}</code>\n` +
            `🛍️ Product: ${order.productName}\n` +
            `💰 Price: ${order.price} ${order.currency}\n\n` +
            `💸 သင့် Balance သို့ ${order.price} ${order.currency} ပြန်လည်ထည့်သွင်းပေးပြီးပါပြီ။\n` +
            `📝 အကြောင်းပြချက်: ${reason || 'N/A'}\n\n` +
            `📅 ${new Date().toLocaleString('my-MM')}`
        );
        
        return order;
    },

    // ==================== DEPOSIT OPERATIONS ====================

    async createDeposit(depositData) {
        const data = await this.readBin(CONFIG.BIN_IDS.deposits);
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
            processedBy: null,
            note: ''
        };
        
        data.requests.push(newDeposit);
        await this.updateBin(CONFIG.BIN_IDS.deposits, data);
        
        // Notify admin
        await TelegramAPI.sendMessage(
            CONFIG.ADMIN_TELEGRAM_ID,
            `💰 <b>ငွေသွင်းတောင်းဆိုမှုအသစ်!</b>\n\n` +
            `🆔 Deposit ID: <code>${newDeposit.depositId}</code>\n` +
            `👤 User: ${newDeposit.firstName} (@${newDeposit.username || 'N/A'})\n` +
            `🆔 Telegram ID: <code>${newDeposit.telegramId}</code>\n` +
            `💵 Amount: ${newDeposit.amount} MMK\n` +
            `💳 Payment: ${newDeposit.paymentMethodName}\n` +
            `⏰ Time: ${new Date().toLocaleString('my-MM')}\n\n` +
            `🔄 Status: <b>Pending</b>`
        );
        
        return newDeposit;
    },

    async getDeposits(filter = {}) {
        const data = await this.readBin(CONFIG.BIN_IDS.deposits);
        if (!data) return [];
        
        let requests = data.requests;
        
        if (filter.telegramId) {
            requests = requests.filter(r => String(r.telegramId) === String(filter.telegramId));
        }
        if (filter.status) {
            requests = requests.filter(r => r.status === filter.status);
        }
        
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return requests;
    },

    async approveDeposit(depositId) {
        const data = await this.readBin(CONFIG.BIN_IDS.deposits);
        if (!data) return null;
        
        const index = data.requests.findIndex(d => d.id === depositId);
        if (index === -1) return null;
        
        const deposit = data.requests[index];
        
        // Update deposit status
        data.requests[index] = {
            ...deposit,
            status: 'approved',
            processedAt: new Date().toISOString(),
            processedBy: CONFIG.ADMIN_TELEGRAM_ID
        };
        await this.updateBin(CONFIG.BIN_IDS.deposits, data);
        
        // Add balance to user
        await this.updateUserBalance(deposit.telegramId, deposit.amount, 'add');
        
        // Notify user
        await TelegramAPI.sendMessage(
            deposit.telegramId,
            `✅ <b>ငွေသွင်းခြင်း အတည်ပြုပြီးပါပြီ!</b>\n\n` +
            `🆔 Deposit ID: <code>${deposit.depositId}</code>\n` +
            `💵 Amount: ${deposit.amount} MMK\n\n` +
            `💰 သင့် Balance သို့ ${deposit.amount} MMK ထည့်သွင်းပေးပြီးပါပြီ!\n` +
            `📅 ${new Date().toLocaleString('my-MM')}`
        );
        
        return deposit;
    },

    async rejectDeposit(depositId, reason = '') {
        const data = await this.readBin(CONFIG.BIN_IDS.deposits);
        if (!data) return null;
        
        const index = data.requests.findIndex(d => d.id === depositId);
        if (index === -1) return null;
        
        const deposit = data.requests[index];
        
        // Update deposit status
        data.requests[index] = {
            ...deposit,
            status: 'rejected',
            processedAt: new Date().toISOString(),
            processedBy: CONFIG.ADMIN_TELEGRAM_ID,
            note: reason
        };
        await this.updateBin(CONFIG.BIN_IDS.deposits, data);
        
        // Notify user
        await TelegramAPI.sendMessage(
            deposit.telegramId,
            `❌ <b>ငွေသွင်းခြင်း ငြင်းပယ်ခံရပါသည်</b>\n\n` +
            `🆔 Deposit ID: <code>${deposit.depositId}</code>\n` +
            `💵 Amount: ${deposit.amount} MMK\n` +
            `📝 အကြောင်းပြချက်: ${reason || 'N/A'}\n\n` +
            `📅 ${new Date().toLocaleString('my-MM')}`
        );
        
        return deposit;
    },

    // ==================== BANNER OPERATIONS ====================

    async getBanners(type = 'type1') {
        const data = await this.readBin(CONFIG.BIN_IDS.banners);
        return data ? data[type] : [];
    },

    async addBanner(type, bannerData) {
        const data = await this.readBin(CONFIG.BIN_IDS.banners);
        if (!data) return null;
        
        const newBanner = {
            id: `banner_${Date.now()}`,
            image: bannerData.image,
            categoryId: bannerData.categoryId || null,
            categoryName: bannerData.categoryName || '',
            description: bannerData.description || '',
            link: bannerData.link || '',
            createdAt: new Date().toISOString()
        };
        
        data[type].push(newBanner);
        await this.updateBin(CONFIG.BIN_IDS.banners, data);
        
        await TelegramAPI.sendMessage(
            CONFIG.ADMIN_TELEGRAM_ID,
            `🖼️ <b>Banner အသစ်ထည့်ပြီး!</b>\n\n` +
            `📁 Type: ${type}\n` +
            `🆔 ID: <code>${newBanner.id}</code>`
        );
        
        return newBanner;
    },

    async deleteBanner(type, bannerId) {
        const data = await this.readBin(CONFIG.BIN_IDS.banners);
        if (!data) return false;
        
        data[type] = data[type].filter(b => b.id !== bannerId);
        await this.updateBin(CONFIG.BIN_IDS.banners, data);
        return true;
    },

    // ==================== PAYMENT METHOD OPERATIONS ====================

    async getPaymentMethods() {
        const data = await this.readBin(CONFIG.BIN_IDS.payments);
        return data ? data.methods.filter(m => m.isActive) : [];
    },

    async getAllPaymentMethods() {
        const data = await this.readBin(CONFIG.BIN_IDS.payments);
        return data ? data.methods : [];
    },

    async addPaymentMethod(methodData) {
        const data = await this.readBin(CONFIG.BIN_IDS.payments);
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
        
        data.methods.push(newMethod);
        await this.updateBin(CONFIG.BIN_IDS.payments, data);
        
        await TelegramAPI.sendMessage(
            CONFIG.ADMIN_TELEGRAM_ID,
            `💳 <b>Payment Method အသစ်ထည့်ပြီး!</b>\n\n` +
            `📛 အမည်: ${newMethod.name}\n` +
            `🆔 ID: <code>${newMethod.id}</code>`
        );
        
        return newMethod;
    },

    async updatePaymentMethod(methodId, updates) {
        const data = await this.readBin(CONFIG.BIN_IDS.payments);
        if (!data) return null;
        
        const index = data.methods.findIndex(m => m.id === methodId);
        if (index === -1) return null;
        
        data.methods[index] = { ...data.methods[index], ...updates };
        await this.updateBin(CONFIG.BIN_IDS.payments, data);
        return data.methods[index];
    },

    async deletePaymentMethod(methodId) {
        const data = await this.readBin(CONFIG.BIN_IDS.payments);
        if (!data) return false;
        
        data.methods = data.methods.filter(m => m.id !== methodId);
        await this.updateBin(CONFIG.BIN_IDS.payments, data);
        return true;
    },

    // ==================== INPUT TABLE OPERATIONS ====================

    async getInputTables(categoryId = null) {
        const data = await this.readBin(CONFIG.BIN_IDS.inputTables);
        if (!data) return [];
        
        if (categoryId) {
            return data.tables.filter(t => t.categoryId === categoryId);
        }
        return data.tables;
    },

    async createInputTable(tableData) {
        const data = await this.readBin(CONFIG.BIN_IDS.inputTables);
        if (!data) return null;
        
        const newTable = {
            id: `input_${Date.now()}`,
            categoryId: tableData.categoryId,
            categoryName: tableData.categoryName || '',
            name: tableData.name,
            placeholder: tableData.placeholder,
            inputType: tableData.inputType || 'text',
            required: tableData.required !== false,
            order: tableData.order || 0,
            createdAt: new Date().toISOString()
        };
        
        data.tables.push(newTable);
        await this.updateBin(CONFIG.BIN_IDS.inputTables, data);
        
        return newTable;
    },

    async updateInputTable(tableId, updates) {
        const data = await this.readBin(CONFIG.BIN_IDS.inputTables);
        if (!data) return null;
        
        const index = data.tables.findIndex(t => t.id === tableId);
        if (index === -1) return null;
        
        data.tables[index] = { ...data.tables[index], ...updates };
        await this.updateBin(CONFIG.BIN_IDS.inputTables, data);
        return data.tables[index];
    },

    async deleteInputTable(tableId) {
        const data = await this.readBin(CONFIG.BIN_IDS.inputTables);
        if (!data) return false;
        
        data.tables = data.tables.filter(t => t.id !== tableId);
        await this.updateBin(CONFIG.BIN_IDS.inputTables, data);
        return true;
    },

    async deleteInputTablesByCategory(categoryId) {
        const data = await this.readBin(CONFIG.BIN_IDS.inputTables);
        if (!data) return false;
        
        data.tables = data.tables.filter(t => t.categoryId !== categoryId);
        await this.updateBin(CONFIG.BIN_IDS.inputTables, data);
        return true;
    },

    // ==================== SETTINGS OPERATIONS ====================

    async getSettings() {
        return await this.readBin(CONFIG.BIN_IDS.settings);
    },

    async updateSettings(updates) {
        const data = await this.readBin(CONFIG.BIN_IDS.settings);
        if (!data) return null;
        
        const newSettings = { ...data, ...updates, updatedAt: new Date().toISOString() };
        await this.updateBin(CONFIG.BIN_IDS.settings, newSettings);
        return newSettings;
    },

    // ==================== BANNED USERS OPERATIONS ====================

    async getBannedUsers() {
        const data = await this.readBin(CONFIG.BIN_IDS.bannedUsers);
        return data ? data.banned : [];
    },

    async banUser(telegramId, reason = 'Violation of terms') {
        const data = await this.readBin(CONFIG.BIN_IDS.bannedUsers);
        if (!data) return false;
        
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
        
        await this.updateBin(CONFIG.BIN_IDS.bannedUsers, data);
        
        // Notify user
        await TelegramAPI.sendMessage(
            telegramId,
            `🚫 <b>သင့်အကောင့်ကို ပိတ်ပင်လိုက်ပါပြီ</b>\n\n` +
            `📝 အကြောင်းပြချက်: ${reason}\n\n` +
            `အကူအညီလိုအပ်ပါက Admin ထံ ဆက်သွယ်ပါ။`
        );
        
        return true;
    },

    async unbanUser(telegramId) {
        const data = await this.readBin(CONFIG.BIN_IDS.bannedUsers);
        if (!data) return false;
        
        data.banned = data.banned.filter(b => String(b.telegramId) !== String(telegramId));
        await this.updateBin(CONFIG.BIN_IDS.bannedUsers, data);
        
        // Notify user
        await TelegramAPI.sendMessage(
            telegramId,
            `✅ <b>သင့်အကောင့်ကို ပြန်လည်ဖွင့်ပေးလိုက်ပါပြီ</b>\n\n` +
            `🎮 MAFIA Gaming Shop ကို ပြန်လည်အသုံးပြုနိုင်ပါပြီ!`
        );
        
        return true;
    },

    async isUserBanned(telegramId) {
        const data = await this.readBin(CONFIG.BIN_IDS.bannedUsers);
        if (!data) return false;
        return data.banned.some(b => String(b.telegramId) === String(telegramId));
    },

    async incrementFailedAttempts(telegramId) {
        const user = await this.getUser(telegramId);
        if (!user) return null;
        
        const today = new Date().toDateString();
        const lastFailedDate = user.lastFailedDate ? new Date(user.lastFailedDate).toDateString() : null;
        
        let dailyFailedAttempts = user.dailyFailedAttempts || 0;
        
        if (lastFailedDate !== today) {
            dailyFailedAttempts = 0;
        }
        
        dailyFailedAttempts++;
        
        await this.updateUser(telegramId, {
            dailyFailedAttempts,
            lastFailedDate: new Date().toISOString()
        });
        
        // Auto ban if exceeded max attempts
        if (dailyFailedAttempts >= CONFIG.MAX_FAILED_ATTEMPTS) {
            await this.banUser(telegramId, 'လက်ကျန်ငွေမလုံလောက်ဘဲ ဝယ်ယူရန် ကြိုးစားမှု ပမာဏများစွာ');
            return { banned: true, attempts: dailyFailedAttempts };
        }
        
        return { banned: false, attempts: dailyFailedAttempts };
    },

    // ==================== ANNOUNCEMENT OPERATIONS ====================

    async getAnnouncement() {
        const data = await this.readBin(CONFIG.BIN_IDS.announcements);
        return data ? data.text : '';
    },

    async updateAnnouncement(text) {
        await this.updateBin(CONFIG.BIN_IDS.announcements, { 
            text, 
            updatedAt: new Date().toISOString() 
        });
        return true;
    },

    // ==================== BROADCAST MESSAGE ====================

    async broadcastMessage(message, imageUrl = null) {
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
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                failCount++;
            }
        }
        
        return { success: successCount, failed: failCount, total: users.length };
    },

    // ==================== STATISTICS ====================

    async getStatistics() {
        const users = await this.getAllUsers();
        const orders = await this.getOrders();
        const deposits = await this.getDeposits();
        const products = await this.getAllProducts();
        const categories = await this.getCategories();
        
        const pendingOrders = orders.filter(o => o.status === 'pending' && o.type !== 'deposit').length;
        const approvedOrders = orders.filter(o => o.status === 'approved' && o.type !== 'deposit').length;
        const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
        
        const totalRevenue = orders
            .filter(o => o.status === 'approved' && o.type !== 'deposit')
            .reduce((sum, o) => sum + (o.price || 0), 0);
        
        const totalDeposits = deposits
            .filter(d => d.status === 'approved')
            .reduce((sum, d) => sum + (d.amount || 0), 0);
        
        return {
            totalUsers: users.length,
            premiumUsers: users.filter(u => u.isPremium).length,
            totalOrders: orders.length,
            pendingOrders,
            approvedOrders,
            totalDeposits: deposits.length,
            pendingDeposits,
            totalProducts: products.length,
            totalCategories: categories.length,
            totalRevenue,
            totalDepositAmount: totalDeposits
        };
    }
};
