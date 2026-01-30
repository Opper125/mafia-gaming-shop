// ============================================
// TELEGRAM WEB APP INTEGRATION
// ============================================

const TelegramApp = {
    // Telegram WebApp Instance
    webapp: null,
    user: null,
    isReady: false,
    
    // Admin Configuration
    ADMIN_ID: 1538232799,
    
    // Initialize Telegram WebApp
    init() {
        return new Promise((resolve, reject) => {
            try {
                // Check if running in Telegram
                if (window.Telegram && window.Telegram.WebApp) {
                    this.webapp = window.Telegram.WebApp;
                    this.webapp.ready();
                    this.webapp.expand();
                    
                    // Get user data
                    if (this.webapp.initDataUnsafe && this.webapp.initDataUnsafe.user) {
                        this.user = this.webapp.initDataUnsafe.user;
                        this.isReady = true;
                        
                        // Set theme
                        this.setTheme();
                        
                        // Setup back button
                        this.setupBackButton();
                        
                        resolve(this.user);
                    } else {
                        reject(new Error('No user data available'));
                    }
                } else {
                    reject(new Error('Not running in Telegram'));
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Check if running in Telegram
    isInTelegram() {
        return !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
    },
    
    // Get user info
    getUser() {
        return this.user;
    },
    
    // Check if user is admin
    isAdmin() {
        return this.user && this.user.id === this.ADMIN_ID;
    },
    
    // Check if user has premium
    isPremium() {
        return this.user && this.user.is_premium;
    },
    
    // Get user photo URL
    getUserPhoto() {
        if (this.user && this.user.photo_url) {
            return this.user.photo_url;
        }
        // Default avatar with first letter
        const firstLetter = this.user ? this.user.first_name.charAt(0).toUpperCase() : 'U';
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238b5cf6"/><text x="50" y="65" text-anchor="middle" fill="white" font-size="45" font-family="Arial">${firstLetter}</text></svg>`;
    },
    
    // Get user display name
    getUserName() {
        if (this.user) {
            let name = this.user.first_name || '';
            if (this.user.last_name) {
                name += ' ' + this.user.last_name;
            }
            return name || 'User';
        }
        return 'User';
    },
    
    // Get username
    getUsername() {
        if (this.user && this.user.username) {
            return '@' + this.user.username;
        }
        return '@user';
    },
    
    // Set theme based on Telegram
    setTheme() {
        if (this.webapp) {
            const colorScheme = this.webapp.colorScheme;
            document.documentElement.setAttribute('data-theme', colorScheme);
            
            // Set header color
            this.webapp.setHeaderColor(colorScheme === 'dark' ? '#141416' : '#ffffff');
            this.webapp.setBackgroundColor(colorScheme === 'dark' ? '#0a0a0b' : '#f5f5f7');
        }
    },
    
    // Toggle theme
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        if (this.webapp) {
            this.webapp.setHeaderColor(newTheme === 'dark' ? '#141416' : '#ffffff');
            this.webapp.setBackgroundColor(newTheme === 'dark' ? '#0a0a0b' : '#f5f5f7');
        }
        
        // Update theme icon
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        localStorage.setItem('theme', newTheme);
    },
    
    // Setup back button
    setupBackButton() {
        if (this.webapp && this.webapp.BackButton) {
            this.webapp.BackButton.onClick(() => {
                if (typeof handleBackButton === 'function') {
                    handleBackButton();
                }
            });
        }
    },
    
    // Show back button
    showBackButton() {
        if (this.webapp && this.webapp.BackButton) {
            this.webapp.BackButton.show();
        }
    },
    
    // Hide back button
    hideBackButton() {
        if (this.webapp && this.webapp.BackButton) {
            this.webapp.BackButton.hide();
        }
    },
    
    // Show main button
    showMainButton(text, callback) {
        if (this.webapp && this.webapp.MainButton) {
            this.webapp.MainButton.setText(text);
            this.webapp.MainButton.show();
            this.webapp.MainButton.onClick(callback);
        }
    },
    
    // Hide main button
    hideMainButton() {
        if (this.webapp && this.webapp.MainButton) {
            this.webapp.MainButton.hide();
        }
    },
    
    // Set main button loading
    setMainButtonLoading(loading) {
        if (this.webapp && this.webapp.MainButton) {
            if (loading) {
                this.webapp.MainButton.showProgress();
            } else {
                this.webapp.MainButton.hideProgress();
            }
        }
    },
    
    // Show alert
    showAlert(message) {
        if (this.webapp) {
            this.webapp.showAlert(message);
        } else {
            alert(message);
        }
    },
    
    // Show confirm
    showConfirm(message) {
        return new Promise((resolve) => {
            if (this.webapp) {
                this.webapp.showConfirm(message, resolve);
            } else {
                resolve(confirm(message));
            }
        });
    },
    
    // Show popup
    showPopup(params) {
        return new Promise((resolve) => {
            if (this.webapp) {
                this.webapp.showPopup(params, (buttonId) => {
                    resolve(buttonId);
                });
            } else {
                resolve(null);
            }
        });
    },
    
    // Haptic feedback
    haptic(type = 'impact', style = 'medium') {
        if (this.webapp && this.webapp.HapticFeedback) {
            switch (type) {
                case 'impact':
                    this.webapp.HapticFeedback.impactOccurred(style);
                    break;
                case 'notification':
                    this.webapp.HapticFeedback.notificationOccurred(style);
                    break;
                case 'selection':
                    this.webapp.HapticFeedback.selectionChanged();
                    break;
            }
        }
    },
    
    // Close webapp
    close() {
        if (this.webapp) {
            this.webapp.close();
        }
    },
    
    // Send data to bot
    sendData(data) {
        if (this.webapp) {
            this.webapp.sendData(JSON.stringify(data));
        }
    },
    
    // Open link
    openLink(url, options = {}) {
        if (this.webapp) {
            this.webapp.openLink(url, options);
        } else {
            window.open(url, '_blank');
        }
    },
    
    // Open Telegram link
    openTelegramLink(url) {
        if (this.webapp) {
            this.webapp.openTelegramLink(url);
        }
    },
    
    // Request write access
    requestWriteAccess() {
        return new Promise((resolve) => {
            if (this.webapp && this.webapp.requestWriteAccess) {
                this.webapp.requestWriteAccess((granted) => {
                    resolve(granted);
                });
            } else {
                resolve(false);
            }
        });
    },
    
    // Request contact
    requestContact() {
        return new Promise((resolve, reject) => {
            if (this.webapp && this.webapp.requestContact) {
                this.webapp.requestContact((success) => {
                    if (success) {
                        resolve(true);
                    } else {
                        reject(new Error('Contact request denied'));
                    }
                });
            } else {
                reject(new Error('Not supported'));
            }
        });
    },
    
    // Cloud Storage operations
    cloudStorage: {
        // Set item
        setItem(key, value) {
            return new Promise((resolve, reject) => {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                    window.Telegram.WebApp.CloudStorage.setItem(key, stringValue, (error, success) => {
                        if (error) {
                            console.error('CloudStorage setItem error:', error);
                            // Fallback to localStorage
                            try {
                                localStorage.setItem(key, stringValue);
                                resolve(true);
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            resolve(success);
                        }
                    });
                } else {
                    // Fallback to localStorage
                    try {
                        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                        localStorage.setItem(key, stringValue);
                        resolve(true);
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        },
        
        // Get item
        getItem(key) {
            return new Promise((resolve, reject) => {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                    window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
                        if (error) {
                            console.error('CloudStorage getItem error:', error);
                            // Fallback to localStorage
                            const localValue = localStorage.getItem(key);
                            resolve(this.parseValue(localValue));
                        } else {
                            resolve(this.parseValue(value));
                        }
                    });
                } else {
                    // Fallback to localStorage
                    const value = localStorage.getItem(key);
                    resolve(this.parseValue(value));
                }
            });
        },
        
        // Parse value helper
        parseValue(value) {
            if (!value) return null;
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        },
        
        // Remove item
        removeItem(key) {
            return new Promise((resolve, reject) => {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                    window.Telegram.WebApp.CloudStorage.removeItem(key, (error, success) => {
                        if (error) {
                            console.error('CloudStorage removeItem error:', error);
                            localStorage.removeItem(key);
                            resolve(true);
                        } else {
                            resolve(success);
                        }
                    });
                } else {
                    localStorage.removeItem(key);
                    resolve(true);
                }
            });
        },
        
        // Get all keys
        getKeys() {
            return new Promise((resolve, reject) => {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                    window.Telegram.WebApp.CloudStorage.getKeys((error, keys) => {
                        if (error) {
                            console.error('CloudStorage getKeys error:', error);
                            resolve(Object.keys(localStorage));
                        } else {
                            resolve(keys || []);
                        }
                    });
                } else {
                    resolve(Object.keys(localStorage));
                }
            });
        },
        
        // Get multiple items
        getItems(keys) {
            return new Promise((resolve, reject) => {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                    window.Telegram.WebApp.CloudStorage.getItems(keys, (error, values) => {
                        if (error) {
                            console.error('CloudStorage getItems error:', error);
                            const result = {};
                            keys.forEach(key => {
                                result[key] = this.parseValue(localStorage.getItem(key));
                            });
                            resolve(result);
                        } else {
                            const result = {};
                            for (const key in values) {
                                result[key] = this.parseValue(values[key]);
                            }
                            resolve(result);
                        }
                    });
                } else {
                    const result = {};
                    keys.forEach(key => {
                        result[key] = this.parseValue(localStorage.getItem(key));
                    });
                    resolve(result);
                }
            });
        },
        
        // Remove multiple items
        removeItems(keys) {
            return new Promise((resolve, reject) => {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                    window.Telegram.WebApp.CloudStorage.removeItems(keys, (error, success) => {
                        if (error) {
                            console.error('CloudStorage removeItems error:', error);
                            keys.forEach(key => localStorage.removeItem(key));
                            resolve(true);
                        } else {
                            resolve(success);
                        }
                    });
                } else {
                    keys.forEach(key => localStorage.removeItem(key));
                    resolve(true);
                }
            });
        }
    }
};

// ============================================
// TELEGRAM BOT API (Polling - No Webhook)
// ============================================

const BotAPI = {
    BOT_TOKEN: '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM',
    API_URL: 'https://api.telegram.org/bot',
    
    // Get full API URL
    getApiUrl(method) {
        return `${this.API_URL}${this.BOT_TOKEN}/${method}`;
    },
    
    // Make API request
    async request(method, params = {}) {
        try {
            const url = this.getApiUrl(method);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            const data = await response.json();
            
            if (!data.ok) {
                console.error(`Telegram API Error: ${data.description}`);
                return null;
            }
            
            return data.result;
        } catch (error) {
            console.error('Telegram API request error:', error);
            return null;
        }
    },
    
    // Send message
    async sendMessage(chatId, text, options = {}) {
        return await this.request('sendMessage', {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            ...options
        });
    },
    
    // Send photo
    async sendPhoto(chatId, photo, caption = '', options = {}) {
        return await this.request('sendPhoto', {
            chat_id: chatId,
            photo: photo,
            caption: caption,
            parse_mode: 'HTML',
            ...options
        });
    },
    
    // Send document
    async sendDocument(chatId, document, caption = '', options = {}) {
        return await this.request('sendDocument', {
            chat_id: chatId,
            document: document,
            caption: caption,
            parse_mode: 'HTML',
            ...options
        });
    },
    
    // Edit message
    async editMessage(chatId, messageId, text, options = {}) {
        return await this.request('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'HTML',
            ...options
        });
    },
    
    // Delete message
    async deleteMessage(chatId, messageId) {
        return await this.request('deleteMessage', {
            chat_id: chatId,
            message_id: messageId
        });
    },
    
    // Send notification to admin
    async notifyAdmin(message) {
        const adminId = TelegramApp.ADMIN_ID;
        return await this.sendMessage(adminId, message);
    },
    
    // Send order notification
    async sendOrderNotification(order) {
        const adminId = TelegramApp.ADMIN_ID;
        const message = `
🛒 <b>New Order Received!</b>

👤 User: ${order.userName} (@${order.username || 'N/A'})
🆔 User ID: <code>${order.userId}</code>
📦 Product: ${order.productName}
💰 Amount: ${order.amount} ${order.currency}
🎮 Game ID: <code>${order.gameId || 'N/A'}</code>
📅 Date: ${new Date(order.timestamp).toLocaleString()}

Order ID: <code>${order.orderId}</code>
        `;
        
        return await this.sendMessage(adminId, message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Approve', callback_data: `approve_${order.orderId}` },
                        { text: '❌ Reject', callback_data: `reject_${order.orderId}` }
                    ]
                ]
            }
        });
    },
    
    // Send topup notification
    async sendTopupNotification(topup) {
        const adminId = TelegramApp.ADMIN_ID;
        const message = `
💳 <b>New Top-up Request!</b>

👤 User: ${topup.userName} (@${topup.username || 'N/A'})
🆔 User ID: <code>${topup.userId}</code>
💰 Amount: ${topup.amount} MMK
💳 Payment: ${topup.paymentMethod}
📅 Date: ${new Date(topup.timestamp).toLocaleString()}

Request ID: <code>${topup.requestId}</code>
        `;
        
        // Send with receipt image if available
        if (topup.receiptImage) {
            return await this.sendPhoto(adminId, topup.receiptImage, message, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Approve', callback_data: `topup_approve_${topup.requestId}` },
                            { text: '❌ Reject', callback_data: `topup_reject_${topup.requestId}` }
                        ]
                    ]
                }
            });
        }
        
        return await this.sendMessage(adminId, message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Approve', callback_data: `topup_approve_${topup.requestId}` },
                        { text: '❌ Reject', callback_data: `topup_reject_${topup.requestId}` }
                    ]
                ]
            }
        });
    },
    
    // Send user notification
    async sendUserNotification(userId, type, data) {
        let message = '';
        
        switch (type) {
            case 'order_approved':
                message = `
✅ <b>Order Approved!</b>

Your order has been successfully processed.

📦 Product: ${data.productName}
💰 Amount: ${data.amount} ${data.currency}
🎮 Game ID: ${data.gameId || 'N/A'}

Please check your game account. Thank you for your purchase! 🎮
                `;
                break;
                
            case 'order_rejected':
                message = `
❌ <b>Order Rejected</b>

Your order has been rejected.

📦 Product: ${data.productName}
💰 Amount: ${data.amount} ${data.currency}
💵 Refund: Your balance has been refunded.

Reason: ${data.reason || 'Contact admin for details.'}
                `;
                break;
                
            case 'topup_approved':
                message = `
✅ <b>Top-up Successful!</b>

Your balance has been topped up.

💰 Amount: ${data.amount} MMK
💵 New Balance: ${data.newBalance} MMK

Thank you for topping up! 💳
                `;
                break;
                
            case 'topup_rejected':
                message = `
❌ <b>Top-up Rejected</b>

Your top-up request has been rejected.

💰 Amount: ${data.amount} MMK

Reason: ${data.reason || 'Invalid receipt or payment not received.'}
                `;
                break;
                
            case 'account_banned':
                message = `
🚫 <b>Account Suspended</b>

Your account has been suspended.

Reason: ${data.reason || 'Violation of terms of service.'}

Please contact admin for more information.
                `;
                break;
                
            case 'account_unbanned':
                message = `
✅ <b>Account Restored</b>

Your account has been restored.

You can now use the service again.
                `;
                break;
                
            default:
                message = data.message || 'Notification from Gaming Shop';
        }
        
        return await this.sendMessage(userId, message);
    },
    
    // Broadcast message to all users
    async broadcast(userIds, message, photo = null) {
        const results = {
            success: 0,
            failed: 0
        };
        
        for (const userId of userIds) {
            try {
                let result;
                if (photo) {
                    result = await this.sendPhoto(userId, photo, message);
                } else {
                    result = await this.sendMessage(userId, message);
                }
                
                if (result) {
                    results.success++;
                } else {
                    results.failed++;
                }
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                results.failed++;
            }
        }
        
        return results;
    },
    
    // Generate OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
    
    // Send OTP to user
    async sendOTP(userId, otp) {
        const message = `
🔐 <b>Verification Code</b>

Your OTP code is: <code>${otp}</code>

This code will expire in 5 minutes.
Do not share this code with anyone.
        `;
        
        return await this.sendMessage(userId, message);
    }
};

// ============================================
// NSFW CONTENT DETECTION (Basic)
// ============================================

const ContentFilter = {
    // List of blocked keywords/patterns
    blockedPatterns: [
        /nude/i,
        /naked/i,
        /porn/i,
        /xxx/i,
        /adult/i,
        /sex/i,
        /nsfw/i
    ],
    
    // Check if image filename is suspicious
    isFilenameSuspicious(filename) {
        if (!filename) return false;
        
        const lowerFilename = filename.toLowerCase();
        return this.blockedPatterns.some(pattern => pattern.test(lowerFilename));
    },
    
    // Basic image validation (check dimensions and size)
    async validateImage(file) {
        return new Promise((resolve) => {
            // Check file type
            if (!file.type.startsWith('image/')) {
                resolve({ valid: false, reason: 'Not an image file' });
                return;
            }
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                resolve({ valid: false, reason: 'File too large' });
                return;
            }
            
            // Check filename
            if (this.isFilenameSuspicious(file.name)) {
                resolve({ valid: false, reason: 'Suspicious filename' });
                return;
            }
            
            // Load and validate image
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                
                // Check minimum dimensions
                if (img.width < 100 || img.height < 100) {
                    resolve({ valid: false, reason: 'Image too small' });
                    return;
                }
                
                resolve({ valid: true });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ valid: false, reason: 'Invalid image' });
            };
            
            img.src = url;
        });
    },
    
    // Convert file to base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};

// Export for use in other modules
window.TelegramApp = TelegramApp;
window.BotAPI = BotAPI;
window.ContentFilter = ContentFilter;
