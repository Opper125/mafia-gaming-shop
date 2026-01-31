/* ============================================
   TELEGRAM WEBAPP INITIALIZATION
   Mafia Gaming Shop
   ============================================ */

// Global Variables
let tg = null;
let user = null;
let isInTelegram = false;
let initData = null;
let initDataUnsafe = null;

// Admin Telegram ID
const ADMIN_TELEGRAM_ID = 1538232799;

// API Base URL
const API_BASE_URL = '/api';

// JSONBin Configuration
const JSONBIN_CONFIG = {
    masterKey: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
    accessKey: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS',
    bins: {
        users: null,
        categories: null,
        products: null,
        orders: null,
        payments: null,
        banners: null,
        inputTables: null,
        settings: null,
        topupRequests: null,
        bannedUsers: null
    }
};

// Initialize Telegram WebApp
function initTelegramWebApp() {
    return new Promise((resolve, reject) => {
        try {
            // Check if Telegram WebApp is available
            if (window.Telegram && window.Telegram.WebApp) {
                tg = window.Telegram.WebApp;
                
                // Initialize the WebApp
                tg.ready();
                tg.expand();
                
                // Get init data
                initData = tg.initData;
                initDataUnsafe = tg.initDataUnsafe;
                
                // Check if running inside Telegram
                if (initData && initDataUnsafe && initDataUnsafe.user) {
                    isInTelegram = true;
                    user = initDataUnsafe.user;
                    
                    // Set theme
                    setTelegramTheme();
                    
                    // Set header color
                    tg.setHeaderColor('#0F0F1A');
                    tg.setBackgroundColor('#0F0F1A');
                    
                    console.log('✅ Telegram WebApp initialized successfully');
                    console.log('👤 User:', user);
                    
                    resolve({
                        success: true,
                        user: user,
                        isAdmin: user.id === ADMIN_TELEGRAM_ID
                    });
                } else {
                    // Not running inside Telegram
                    isInTelegram = false;
                    console.warn('⚠️ Not running inside Telegram');
                    resolve({
                        success: false,
                        error: 'NOT_IN_TELEGRAM'
                    });
                }
            } else {
                // Telegram WebApp not available
                isInTelegram = false;
                console.warn('⚠️ Telegram WebApp not available');
                resolve({
                    success: false,
                    error: 'TELEGRAM_NOT_AVAILABLE'
                });
            }
        } catch (error) {
            console.error('❌ Error initializing Telegram WebApp:', error);
            reject(error);
        }
    });
}

// Set theme based on Telegram theme
function setTelegramTheme() {
    if (!tg) return;
    
    const colorScheme = tg.colorScheme;
    const themeParams = tg.themeParams;
    
    if (colorScheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Apply Telegram theme colors if available
    if (themeParams) {
        const root = document.documentElement;
        
        if (themeParams.bg_color) {
            root.style.setProperty('--tg-bg-color', themeParams.bg_color);
        }
        if (themeParams.text_color) {
            root.style.setProperty('--tg-text-color', themeParams.text_color);
        }
        if (themeParams.hint_color) {
            root.style.setProperty('--tg-hint-color', themeParams.hint_color);
        }
        if (themeParams.link_color) {
            root.style.setProperty('--tg-link-color', themeParams.link_color);
        }
        if (themeParams.button_color) {
            root.style.setProperty('--tg-button-color', themeParams.button_color);
        }
        if (themeParams.button_text_color) {
            root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
        }
    }
}

// Get current user
function getCurrentUser() {
    return user;
}

// Check if user is admin
function isUserAdmin() {
    return user && user.id === ADMIN_TELEGRAM_ID;
}

// Check if running in Telegram
function isRunningInTelegram() {
    return isInTelegram;
}

// Get Telegram WebApp instance
function getTelegramWebApp() {
    return tg;
}

// Show Telegram popup
function showTelegramPopup(title, message, buttons = []) {
    return new Promise((resolve) => {
        if (tg && tg.showPopup) {
            tg.showPopup({
                title: title,
                message: message,
                buttons: buttons.length > 0 ? buttons : [{ type: 'ok' }]
            }, (buttonId) => {
                resolve(buttonId);
            });
        } else {
            alert(`${title}\n\n${message}`);
            resolve('ok');
        }
    });
}

// Show Telegram confirm
function showTelegramConfirm(message) {
    return new Promise((resolve) => {
        if (tg && tg.showConfirm) {
            tg.showConfirm(message, (confirmed) => {
                resolve(confirmed);
            });
        } else {
            resolve(confirm(message));
        }
    });
}

// Show Telegram alert
function showTelegramAlert(message) {
    return new Promise((resolve) => {
        if (tg && tg.showAlert) {
            tg.showAlert(message, () => {
                resolve();
            });
        } else {
            alert(message);
            resolve();
        }
    });
}

// Request phone number
function requestPhoneNumber() {
    return new Promise((resolve, reject) => {
        if (tg && tg.requestContact) {
            tg.requestContact((status, response) => {
                if (status) {
                    resolve(response);
                } else {
                    reject(new Error('User denied phone number request'));
                }
            });
        } else {
            reject(new Error('requestContact not available'));
        }
    });
}

// Haptic feedback
function hapticFeedback(type = 'impact', style = 'medium') {
    if (tg && tg.HapticFeedback) {
        switch (type) {
            case 'impact':
                tg.HapticFeedback.impactOccurred(style);
                break;
            case 'notification':
                tg.HapticFeedback.notificationOccurred(style);
                break;
            case 'selection':
                tg.HapticFeedback.selectionChanged();
                break;
        }
    }
}

// Close WebApp
function closeWebApp() {
    if (tg) {
        tg.close();
    }
}

// Enable closing confirmation
function enableClosingConfirmation() {
    if (tg) {
        tg.enableClosingConfirmation();
    }
}

// Disable closing confirmation
function disableClosingConfirmation() {
    if (tg) {
        tg.disableClosingConfirmation();
    }
}

// Main button functions
const MainButton = {
    show: (text, callback) => {
        if (tg && tg.MainButton) {
            tg.MainButton.text = text;
            tg.MainButton.show();
            if (callback) {
                tg.MainButton.onClick(callback);
            }
        }
    },
    hide: () => {
        if (tg && tg.MainButton) {
            tg.MainButton.hide();
        }
    },
    setText: (text) => {
        if (tg && tg.MainButton) {
            tg.MainButton.text = text;
        }
    },
    showProgress: (leaveActive = true) => {
        if (tg && tg.MainButton) {
            tg.MainButton.showProgress(leaveActive);
        }
    },
    hideProgress: () => {
        if (tg && tg.MainButton) {
            tg.MainButton.hideProgress();
        }
    },
    enable: () => {
        if (tg && tg.MainButton) {
            tg.MainButton.enable();
        }
    },
    disable: () => {
        if (tg && tg.MainButton) {
            tg.MainButton.disable();
        }
    },
    setColor: (color) => {
        if (tg && tg.MainButton) {
            tg.MainButton.color = color;
        }
    },
    setTextColor: (color) => {
        if (tg && tg.MainButton) {
            tg.MainButton.textColor = color;
        }
    }
};

// Back button functions
const BackButton = {
    show: (callback) => {
        if (tg && tg.BackButton) {
            tg.BackButton.show();
            if (callback) {
                tg.BackButton.onClick(callback);
            }
        }
    },
    hide: () => {
        if (tg && tg.BackButton) {
            tg.BackButton.hide();
        }
    },
    offClick: (callback) => {
        if (tg && tg.BackButton) {
            tg.BackButton.offClick(callback);
        }
    }
};

// Cloud Storage functions
const CloudStorage = {
    setItem: (key, value) => {
        return new Promise((resolve, reject) => {
            if (tg && tg.CloudStorage) {
                tg.CloudStorage.setItem(key, JSON.stringify(value), (error, success) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(success);
                    }
                });
            } else {
                // Fallback to localStorage
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            }
        });
    },
    getItem: (key) => {
        return new Promise((resolve, reject) => {
            if (tg && tg.CloudStorage) {
                tg.CloudStorage.getItem(key, (error, value) => {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            resolve(value ? JSON.parse(value) : null);
                        } catch {
                            resolve(value);
                        }
                    }
                });
            } else {
                // Fallback to localStorage
                try {
                    const value = localStorage.getItem(key);
                    resolve(value ? JSON.parse(value) : null);
                } catch (e) {
                    reject(e);
                }
            }
        });
    },
    getItems: (keys) => {
        return new Promise((resolve, reject) => {
            if (tg && tg.CloudStorage) {
                tg.CloudStorage.getItems(keys, (error, values) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(values);
                    }
                });
            } else {
                // Fallback to localStorage
                try {
                    const result = {};
                    keys.forEach(key => {
                        const value = localStorage.getItem(key);
                        result[key] = value ? JSON.parse(value) : null;
                    });
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            }
        });
    },
    removeItem: (key) => {
        return new Promise((resolve, reject) => {
            if (tg && tg.CloudStorage) {
                tg.CloudStorage.removeItem(key, (error, success) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(success);
                    }
                });
            } else {
                // Fallback to localStorage
                try {
                    localStorage.removeItem(key);
                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            }
        });
    },
    getKeys: () => {
        return new Promise((resolve, reject) => {
            if (tg && tg.CloudStorage) {
                tg.CloudStorage.getKeys((error, keys) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(keys);
                    }
                });
            } else {
                // Fallback to localStorage
                try {
                    const keys = Object.keys(localStorage);
                    resolve(keys);
                } catch (e) {
                    reject(e);
                }
            }
        });
    }
};

// Send data to bot
function sendDataToBot(data) {
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify(data));
    }
}

// Open link
function openLink(url, options = {}) {
    if (tg) {
        tg.openLink(url, options);
    } else {
        window.open(url, '_blank');
    }
}

// Open Telegram link
function openTelegramLink(url) {
    if (tg) {
        tg.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
}

// Share to Telegram
function shareToTelegram(url, text = '') {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    openTelegramLink(shareUrl);
}

// Validate init data (should be done on server side for security)
async function validateInitData() {
    if (!initData) {
        return { valid: false, error: 'No init data' };
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ initData: initData })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error validating init data:', error);
        return { valid: false, error: error.message };
    }
}

// Get user avatar URL
function getUserAvatarUrl(userId, photoUrl = null) {
    if (photoUrl) {
        return photoUrl;
    }
    // Default avatar with user initials
    return `https://ui-avatars.com/api/?name=${userId}&background=8B5CF6&color=fff&size=128`;
}

// Format user display name
function formatUserDisplayName(user) {
    if (!user) return 'Unknown User';
    
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
        return user.first_name;
    } else if (user.username) {
        return `@${user.username}`;
    }
    return 'Unknown User';
}

// Export functions
window.TelegramWebApp = {
    init: initTelegramWebApp,
    getUser: getCurrentUser,
    isAdmin: isUserAdmin,
    isInTelegram: isRunningInTelegram,
    getTg: getTelegramWebApp,
    showPopup: showTelegramPopup,
    showConfirm: showTelegramConfirm,
    showAlert: showTelegramAlert,
    requestPhone: requestPhoneNumber,
    haptic: hapticFeedback,
    close: closeWebApp,
    enableClosingConfirmation: enableClosingConfirmation,
    disableClosingConfirmation: disableClosingConfirmation,
    MainButton: MainButton,
    BackButton: BackButton,
    CloudStorage: CloudStorage,
    sendData: sendDataToBot,
    openLink: openLink,
    openTelegramLink: openTelegramLink,
    share: shareToTelegram,
    validate: validateInitData,
    getAvatarUrl: getUserAvatarUrl,
    formatName: formatUserDisplayName,
    ADMIN_ID: ADMIN_TELEGRAM_ID,
    initData: () => initData,
    initDataUnsafe: () => initDataUnsafe
};

console.log('📱 Telegram WebApp module loaded');
