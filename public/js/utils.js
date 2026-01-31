/* ============================================
   UTILITY FUNCTIONS
   Mafia Gaming Shop
   ============================================ */

// ============================================
// JSONBin API Functions - DEPRECATED
// Use Vercel API Routes instead: /api/products, /api/categories, /api/orders, /api/users
// ============================================

const JSONBin = {
    // This object is deprecated - kept for backward compatibility only
    // All API calls now go through Vercel API routes for security
    
    baseUrl: '/api',
    
    async init() {
        console.warn('⚠️ JSONBin.init() is deprecated. Use Database service instead.');
        return true;
    },

    async read(binName) {
        console.warn('⚠️ JSONBin.read() is deprecated. Use Database service instead.');
        return null;
    },

    async update(binName, data) {
        console.warn('⚠️ JSONBin.update() is deprecated. Use Database service instead.');
        return false;
    }
};

// ============================================
// Toast Notifications
// ============================================

const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container') || 
                         document.getElementById('admin-toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(type, title, message, duration = 4000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // Add to container
        this.container.appendChild(toast);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    },

    remove(toast) {
        toast.classList.add('toast-exit');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    success(title, message, duration) {
        return this.show('success', title, message, duration);
    },

    error(title, message, duration) {
        return this.show('error', title, message, duration);
    },

    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    },

    info(title, message, duration) {
        return this.show('info', title, message, duration);
    }
};

// ============================================
// Loading Overlay
// ============================================

const Loading = {
    overlay: null,

    init() {
        this.overlay = document.getElementById('loading-overlay');
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay hidden';
            this.overlay.id = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p id="loading-text">Loading...</p>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
    },

    show(text = 'Loading...') {
        if (!this.overlay) this.init();
        
        const textEl = this.overlay.querySelector('#loading-text');
        if (textEl) textEl.textContent = text;
        
        this.overlay.classList.remove('hidden');
    },

    hide() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    },

    setText(text) {
        if (this.overlay) {
            const textEl = this.overlay.querySelector('#loading-text');
            if (textEl) textEl.textContent = text;
        }
    }
};

// ============================================
// Modal Functions
// ============================================

const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};

// ============================================
// Format Functions
// ============================================

const Format = {
    // Format currency
    currency(amount, currency = 'MMK') {
        const num = parseFloat(amount) || 0;
        return `${num.toLocaleString()} ${currency}`;
    },

    // Format date
    date(dateString, format = 'short') {
        const date = new Date(dateString);
        
        if (format === 'short') {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } else if (format === 'long') {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } else if (format === 'datetime') {
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (format === 'relative') {
            return this.relativeTime(date);
        }
        
        return date.toLocaleDateString();
    },

    // Relative time (e.g., "2 hours ago")
    relativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (days < 7) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return this.date(date, 'short');
        }
    },

    // Format number
    number(num, decimals = 0) {
        return parseFloat(num).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    // Truncate text
    truncate(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Generate order ID
    orderId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `#${timestamp}${random}`.toUpperCase();
    }
};

// ============================================
// Validation Functions
// ============================================

const Validate = {
    // Check if empty
    isEmpty(value) {
        return value === null || value === undefined || value === '' || 
               (Array.isArray(value) && value.length === 0) ||
               (typeof value === 'object' && Object.keys(value).length === 0);
    },

    // Validate required fields
    required(value, fieldName) {
        if (this.isEmpty(value)) {
            return { valid: false, message: `${fieldName} is required` };
        }
        return { valid: true };
    },

    // Validate number
    number(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            return { valid: false, message: 'Must be a valid number' };
        }
        if (min !== null && num < min) {
            return { valid: false, message: `Must be at least ${min}` };
        }
        if (max !== null && num > max) {
            return { valid: false, message: `Must be at most ${max}` };
        }
        return { valid: true, value: num };
    },

    // Validate file type
    fileType(file, allowedTypes) {
        if (!file) return { valid: false, message: 'No file selected' };
        
        const fileType = file.type;
        if (!allowedTypes.includes(fileType)) {
            return { valid: false, message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
        }
        return { valid: true };
    },

    // Validate file size (in MB)
    fileSize(file, maxSizeMB) {
        if (!file) return { valid: false, message: 'No file selected' };
        
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return { valid: false, message: `File too large. Maximum size: ${maxSizeMB}MB` };
        }
        return { valid: true };
    },

    // Check for inappropriate content (basic check)
    async checkImage(file) {
        // This is a placeholder - in production, you'd use a proper content moderation API
        // For now, we'll do basic file validation
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
            return { safe: false, reason: 'Invalid image type' };
        }
        
        return { safe: true };
    }
};

// ============================================
// File Upload Functions
// ============================================

const FileUpload = {
    // Convert file to base64
    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    // Compress image
    async compress(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.src = URL.createObjectURL(file);
        });
    },

    // Upload to Telegram (via bot)
    async uploadToTelegram(file, type = 'photo') {
        const base64 = await this.toBase64(file);
        
        // Send to our API which will forward to Telegram
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file: base64,
                type: type,
                initData: window.TelegramWebApp ? window.TelegramWebApp.initData() : null
            })
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return await response.json();
    }
};

// ============================================
// Debounce & Throttle
// ============================================

function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// Local Storage with Fallback
// ============================================

const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('localStorage not available');
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('localStorage not available');
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('localStorage not available');
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.warn('localStorage not available');
            return false;
        }
    }
};

// ============================================
// Generate Unique IDs
// ============================================

function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD${year}${month}${day}${random}`;
}

// ============================================
// Copy to Clipboard
// ============================================

async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        
        Toast.success('Copied!', 'Text copied to clipboard');
        return true;
    } catch (error) {
        console.error('Copy failed:', error);
        Toast.error('Error', 'Failed to copy text');
        return false;
    }
}

// ============================================
// Export all utilities
// ============================================

window.Utils = {
    JSONBin,
    Toast,
    Loading,
    Modal,
    Format,
    Validate,
    FileUpload,
    Storage,
    debounce,
    throttle,
    generateId,
    generateOrderId,
    copyToClipboard
};

console.log('🛠️ Utils module loaded');
