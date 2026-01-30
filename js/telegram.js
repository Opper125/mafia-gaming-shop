// js/telegram.js - Telegram WebApp Integration & Bot API

const TelegramAPI = {
    // Telegram Bot API Base URL
    API_URL: `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}`,
    
    // Send text message
    async sendMessage(chatId, text, options = {}) {
        try {
            const response = await fetch(`${this.API_URL}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML',
                    disable_web_page_preview: options.disablePreview || false,
                    reply_markup: options.replyMarkup || undefined
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    },

    // Send photo with caption
    async sendPhoto(chatId, photoUrl, caption = '', options = {}) {
        try {
            const response = await fetch(`${this.API_URL}/sendPhoto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    photo: photoUrl,
                    caption: caption,
                    parse_mode: 'HTML',
                    reply_markup: options.replyMarkup || undefined
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error sending photo:', error);
            return null;
        }
    },

    // Send document
    async sendDocument(chatId, documentUrl, caption = '') {
        try {
            const response = await fetch(`${this.API_URL}/sendDocument`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    document: documentUrl,
                    caption: caption,
                    parse_mode: 'HTML'
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error sending document:', error);
            return null;
        }
    },

    // Edit message
    async editMessage(chatId, messageId, text, options = {}) {
        try {
            const response = await fetch(`${this.API_URL}/editMessageText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: text,
                    parse_mode: 'HTML',
                    reply_markup: options.replyMarkup || undefined
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error editing message:', error);
            return null;
        }
    },

    // Delete message
    async deleteMessage(chatId, messageId) {
        try {
            const response = await fetch(`${this.API_URL}/deleteMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error deleting message:', error);
            return null;
        }
    },

    // Answer callback query (for inline buttons)
    async answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
        try {
            const response = await fetch(`${this.API_URL}/answerCallbackQuery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    callback_query_id: callbackQueryId,
                    text: text,
                    show_alert: showAlert
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error answering callback:', error);
            return null;
        }
    },

    // Get user profile photos
    async getUserProfilePhotos(userId, limit = 1) {
        try {
            const response = await fetch(`${this.API_URL}/getUserProfilePhotos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    limit: limit
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error getting profile photos:', error);
            return null;
        }
    },

    // Get file URL
    async getFileUrl(fileId) {
        try {
            const response = await fetch(`${this.API_URL}/getFile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: fileId
                })
            });
            
            const result = await response.json();
            if (result.ok && result.result.file_path) {
                return `https://api.telegram.org/file/bot${CONFIG.BOT_TOKEN}/${result.result.file_path}`;
            }
            return null;
        } catch (error) {
            console.error('Error getting file:', error);
            return null;
        }
    },

    // Create inline keyboard
    createInlineKeyboard(buttons) {
        return {
            inline_keyboard: buttons
        };
    },

    // Create button row
    createButtonRow(...buttons) {
        return buttons;
    },

    // Create URL button
    urlButton(text, url) {
        return { text, url };
    },

    // Create callback button
    callbackButton(text, callbackData) {
        return { text, callback_data: callbackData };
    },

    // Create webapp button
    webappButton(text, url) {
        return { text, web_app: { url } };
    }
};

// Telegram WebApp Handler
const TelegramWebApp = {
    // WebApp instance
    webapp: null,
    user: null,
    initData: null,
    initDataUnsafe: null,
    isReady: false,
    
    // Initialize WebApp
    init() {
        return new Promise((resolve, reject) => {
            // Check if running in Telegram
            if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
                console.error('❌ Not running in Telegram WebApp');
                reject(new Error('Not running in Telegram WebApp'));
                return;
            }
            
            this.webapp = window.Telegram.WebApp;
            this.initData = this.webapp.initData;
            this.initDataUnsafe = this.webapp.initDataUnsafe;
            
            // Get user data
            if (this.initDataUnsafe && this.initDataUnsafe.user) {
                this.user = this.initDataUnsafe.user;
            }
            
            // Expand webapp
            this.webapp.expand();
            
            // Set header color
            this.webapp.setHeaderColor('#0F0F1A');
            this.webapp.setBackgroundColor('#0F0F1A');
            
            // Enable closing confirmation
            this.webapp.enableClosingConfirmation();
            
            // Ready callback
            this.webapp.ready();
            this.isReady = true;
            
            console.log('✅ Telegram WebApp initialized');
            console.log('👤 User:', this.user);
            
            resolve(this.user);
        });
    },

    // Check if running in Telegram
    isInTelegram() {
        return typeof window.Telegram !== 'undefined' && 
               window.Telegram.WebApp && 
               window.Telegram.WebApp.initData !== '';
    },

    // Get current user
    getUser() {
        return this.user;
    },

    // Get user ID
    getUserId() {
        return this.user ? this.user.id : null;
    },

    // Check if user is admin
    isAdmin() {
        return this.user && String(this.user.id) === String(CONFIG.ADMIN_TELEGRAM_ID);
    },

    // Check if user is premium
    isPremium() {
        return this.user && this.user.is_premium === true;
    },

    // Get theme
    getTheme() {
        return this.webapp ? this.webapp.colorScheme : 'dark';
    },

    // Get theme params
    getThemeParams() {
        return this.webapp ? this.webapp.themeParams : {};
    },

    // Show popup
    showPopup(params) {
        return new Promise((resolve) => {
            if (this.webapp) {
                this.webapp.showPopup(params, (buttonId) => {
                    resolve(buttonId);
                });
            } else {
                alert(params.message || params.title);
                resolve(null);
            }
        });
    },

    // Show alert
    showAlert(message) {
        return new Promise((resolve) => {
            if (this.webapp) {
                this.webapp.showAlert(message, () => {
                    resolve();
                });
            } else {
                alert(message);
                resolve();
            }
        });
    },

    // Show confirm
    showConfirm(message) {
        return new Promise((resolve) => {
            if (this.webapp) {
                this.webapp.showConfirm(message, (confirmed) => {
                    resolve(confirmed);
                });
            } else {
                resolve(confirm(message));
            }
        });
    },

    // Request contact
    requestContact() {
        return new Promise((resolve, reject) => {
            if (this.webapp && this.webapp.requestContact) {
                this.webapp.requestContact((sent, contact) => {
                    if (sent) {
                        resolve(contact);
                    } else {
                        reject(new Error('Contact request denied'));
                    }
                });
            } else {
                reject(new Error('Contact request not supported'));
            }
        });
    },

    // Show main button
    showMainButton(text, callback) {
        if (this.webapp) {
            const mainButton = this.webapp.MainButton;
            mainButton.setText(text);
            mainButton.show();
            mainButton.onClick(callback);
        }
    },

    // Hide main button
    hideMainButton() {
        if (this.webapp) {
            this.webapp.MainButton.hide();
        }
    },

    // Set main button loading
    setMainButtonLoading(loading) {
        if (this.webapp) {
            if (loading) {
                this.webapp.MainButton.showProgress();
            } else {
                this.webapp.MainButton.hideProgress();
            }
        }
    },

    // Show back button
    showBackButton(callback) {
        if (this.webapp) {
            this.webapp.BackButton.show();
            this.webapp.BackButton.onClick(callback);
        }
    },

    // Hide back button
    hideBackButton() {
        if (this.webapp) {
            this.webapp.BackButton.hide();
        }
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
        } else {
            window.open(url, '_blank');
        }
    },

    // Switch inline query
    switchInlineQuery(query, chatTypes) {
        if (this.webapp && this.webapp.switchInlineQuery) {
            this.webapp.switchInlineQuery(query, chatTypes);
        }
    },

    // Request write access
    requestWriteAccess() {
        return new Promise((resolve, reject) => {
            if (this.webapp && this.webapp.requestWriteAccess) {
                this.webapp.requestWriteAccess((granted) => {
                    if (granted) {
                        resolve(true);
                    } else {
                        reject(new Error('Write access denied'));
                    }
                });
            } else {
                resolve(true);
            }
        });
    },

    // Cloud Storage - Get item
    async cloudStorageGet(key) {
        return new Promise((resolve, reject) => {
            if (this.webapp && this.webapp.CloudStorage) {
                this.webapp.CloudStorage.getItem(key, (error, value) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(value);
                    }
                });
            } else {
                resolve(localStorage.getItem(key));
            }
        });
    },

    // Cloud Storage - Set item
    async cloudStorageSet(key, value) {
        return new Promise((resolve, reject) => {
            if (this.webapp && this.webapp.CloudStorage) {
                this.webapp.CloudStorage.setItem(key, value, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(true);
                    }
                });
            } else {
                localStorage.setItem(key, value);
                resolve(true);
            }
        });
    },

    // Cloud Storage - Remove item
    async cloudStorageRemove(key) {
        return new Promise((resolve, reject) => {
            if (this.webapp && this.webapp.CloudStorage) {
                this.webapp.CloudStorage.removeItem(key, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(true);
                    }
                });
            } else {
                localStorage.removeItem(key);
                resolve(true);
            }
        });
    },

    // Cloud Storage - Get all keys
    async cloudStorageGetKeys() {
        return new Promise((resolve, reject) => {
            if (this.webapp && this.webapp.CloudStorage) {
                this.webapp.CloudStorage.getKeys((error, keys) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(keys);
                    }
                });
            } else {
                resolve(Object.keys(localStorage));
            }
        });
    },

    // Validate init data (client-side)
    validateInitData() {
        if (!this.initData) return false;
        
        // Parse init data
        const params = new URLSearchParams(this.initData);
        const hash = params.get('hash');
        
        if (!hash) return false;
        
        // In production, this should be validated on server side
        // For client-side, we just check if hash exists
        return true;
    },

    // Get start parameter
    getStartParam() {
        if (this.initDataUnsafe && this.initDataUnsafe.start_param) {
            return this.initDataUnsafe.start_param;
        }
        return null;
    },

    // Share to story
    shareToStory(mediaUrl, options = {}) {
        if (this.webapp && this.webapp.shareToStory) {
            this.webapp.shareToStory(mediaUrl, options);
        }
    },

    // Set header color
    setHeaderColor(color) {
        if (this.webapp) {
            this.webapp.setHeaderColor(color);
        }
    },

    // Set background color
    setBackgroundColor(color) {
        if (this.webapp) {
            this.webapp.setBackgroundColor(color);
        }
    }
};

// Image upload helper using Telegram
const ImageUploader = {
    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    // Validate image (check for 18+ content - basic check)
    async validateImage(file) {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, reason: 'Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.' };
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return { valid: false, reason: 'File too large. Max 10MB allowed.' };
        }
        
        // For 18+ content detection, you would need a proper API
        // This is a placeholder - in production use services like Google Vision API
        return { valid: true };
    },

    // Upload image and get URL (using base64 for JSONBin storage)
    async uploadImage(file) {
        const validation = await this.validateImage(file);
        if (!validation.valid) {
            throw new Error(validation.reason);
        }
        
        const base64 = await this.fileToBase64(file);
        return base64;
    },

    // Compress image
    async compressImage(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
};
