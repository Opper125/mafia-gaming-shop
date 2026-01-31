/* ============================================
   UNIFIED DATABASE SERVICE
   Mafia Gaming Shop - Real-Time Sync with Vercel API
   ============================================ */

const DatabaseService = {
    binIds: {},
    initialized: false,
    syncInterval: null,
    refreshCallbacks: [],

    // Initialize with bin IDs
    async init(binIds) {
        console.log('🗄️ Initializing Database Service...');
        
        if (!binIds || Object.keys(binIds).length === 0) {
            console.warn('⚠️ No bin IDs provided');
            return false;
        }
        
        this.binIds = binIds;
        this.initialized = true;
        console.log('✅ Database Service initialized with bin IDs');
        return true;
    },

    // Subscribe to data refresh events
    onRefresh(callback) {
        this.refreshCallbacks.push(callback);
    },

    // Trigger refresh for all subscribers
    triggerRefresh(type) {
        this.refreshCallbacks.forEach(cb => cb(type));
    },

    // ==================== PRODUCTS ====================
    
    async getProducts(categoryId = null) {
        if (!this.binIds.products) return [];
        
        try {
            const url = new URL('/api/products', window.location.origin);
            url.searchParams.append('binId', this.binIds.products);
            if (categoryId) url.searchParams.append('categoryId', categoryId);
            
            const response = await fetch(url.toString());
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to fetch products:', error);
            return [];
        }
    },

    async createProduct(product) {
        if (!this.binIds.products) return { success: false };
        
        try {
            const response = await fetch('/api/products?binId=' + this.binIds.products, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('products');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to create product:', error);
            return { success: false, error: error.message };
        }
    },

    async updateProduct(product) {
        if (!this.binIds.products) return { success: false };
        
        try {
            const response = await fetch('/api/products?binId=' + this.binIds.products, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('products');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update product:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAllProducts(products) {
        if (!this.binIds.products) return { success: false };
        
        try {
            const response = await fetch('/api/products?binId=' + this.binIds.products, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('products');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update products:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteProduct(productId) {
        if (!this.binIds.products) return { success: false };
        
        try {
            const response = await fetch('/api/products?binId=' + this.binIds.products, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('products');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to delete product:', error);
            return { success: false, error: error.message };
        }
    },

    // ==================== CATEGORIES ====================
    
    async getCategories() {
        if (!this.binIds.categories) return [];
        
        try {
            const response = await fetch('/api/categories?binId=' + this.binIds.categories);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to fetch categories:', error);
            return [];
        }
    },

    async createCategory(category) {
        if (!this.binIds.categories) return { success: false };
        
        try {
            const response = await fetch('/api/categories?binId=' + this.binIds.categories, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('categories');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to create category:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAllCategories(categories) {
        if (!this.binIds.categories) return { success: false };
        
        try {
            const response = await fetch('/api/categories?binId=' + this.binIds.categories, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('categories');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update categories:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteCategory(categoryId) {
        if (!this.binIds.categories) return { success: false };
        
        try {
            const response = await fetch('/api/categories?binId=' + this.binIds.categories, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('categories');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to delete category:', error);
            return { success: false, error: error.message };
        }
    },

    // ==================== USERS ====================
    
    async getUsers() {
        if (!this.binIds.users) return [];
        
        try {
            const response = await fetch('/api/users?binId=' + this.binIds.users);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to fetch users:', error);
            return [];
        }
    },

    async updateUser(user) {
        if (!this.binIds.users) return { success: false };
        
        try {
            const response = await fetch('/api/users?binId=' + this.binIds.users, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('users');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update user:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAllUsers(users) {
        if (!this.binIds.users) return { success: false };
        
        try {
            const response = await fetch('/api/users?binId=' + this.binIds.users, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('users');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update users:', error);
            return { success: false, error: error.message };
        }
    },

    async updateUserBalance(userId, amount, operation = 'set') {
        if (!this.binIds.users) return { success: false };
        
        try {
            const response = await fetch('/api/users?binId=' + this.binIds.users, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, amount, operation })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('users');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update user balance:', error);
            return { success: false, error: error.message };
        }
    },

    // ==================== ORDERS ====================
    
    async getOrders(userId = null) {
        if (!this.binIds.orders) return [];
        
        try {
            let url = '/api/orders?binId=' + this.binIds.orders;
            if (userId) url += '&userId=' + userId;
            
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to fetch orders:', error);
            return [];
        }
    },

    async createOrder(order) {
        if (!this.binIds.orders) return { success: false };
        
        try {
            const response = await fetch('/api/orders?binId=' + this.binIds.orders, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('orders');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to create order:', error);
            return { success: false, error: error.message };
        }
    },

    async updateOrderStatus(orderId, status) {
        if (!this.binIds.orders) return { success: false };
        
        try {
            const response = await fetch('/api/orders?binId=' + this.binIds.orders, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('orders');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update order:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAllOrders(orders) {
        if (!this.binIds.orders) return { success: false };
        
        try {
            const response = await fetch('/api/orders?binId=' + this.binIds.orders, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.triggerRefresh('orders');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to update orders:', error);
            return { success: false, error: error.message };
        }
    },

    // ==================== UTILITY ====================
    
    isReady() {
        return this.initialized && Object.keys(this.binIds).length > 0;
    }
};
