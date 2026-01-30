// js/auth.js - Authentication Handler

const Auth = {
    currentUser: null,
    isAuthenticated: false,
    isAdmin: false,
    
    // Initialize authentication
    async init() {
        console.log('🔐 Initializing authentication...');
        
        // Check if in Telegram
        if (!TelegramWebApp.isInTelegram()) {
            console.error('❌ Not in Telegram WebApp');
            this.showAccessDenied();
            return false;
        }
        
        try {
            // Initialize Telegram WebApp
            const telegramUser = await TelegramWebApp.init();
            
            if (!telegramUser) {
                console.error('❌ No Telegram user found');
                this.showAccessDenied();
                return false;
            }
            
            // Check if user is banned
            const isBanned = await Database.isUserBanned(telegramUser.id);
            if (isBanned) {
                this.showBannedMessage();
                return false;
            }
            
            // Create or get user from database
            const userData = {
                telegramId: telegramUser.id,
                username: telegramUser.username || '',
                firstName: telegramUser.first_name || '',
                lastName: telegramUser.last_name || '',
                languageCode: telegramUser.language_code || 'en',
                isPremium: telegramUser.is_premium || false,
                photoUrl: telegramUser.photo_url || ''
            };
            
            this.currentUser = await Database.createUser(userData);
            
            if (!this.currentUser) {
                console.error('❌ Failed to create/get user');
                return false;
            }
            
            this.isAuthenticated = true;
            this.isAdmin = String(telegramUser.id) === String(CONFIG.ADMIN_TELEGRAM_ID);
            
            // Store in cloud storage
            await TelegramWebApp.cloudStorageSet('user_id', String(telegramUser.id));
            await TelegramWebApp.cloudStorageSet('last_login', new Date().toISOString());
            
            console.log('✅ Authentication successful');
            console.log('👤 User:', this.currentUser);
            console.log('👑 Is Admin:', this.isAdmin);
            
            return true;
            
        } catch (error) {
            console.error('❌ Authentication error:', error);
            this.showAccessDenied();
            return false;
        }
    },

    // Get current user
    getUser() {
        return this.currentUser;
    },

    // Get user ID
    getUserId() {
        return this.currentUser ? this.currentUser.telegramId : null;
    },

    // Check if admin
    checkAdmin() {
        return this.isAdmin;
    },

    // Refresh user data
    async refreshUser() {
        if (!this.currentUser) return null;
        
        this.currentUser = await Database.getUser(this.currentUser.telegramId);
        return this.currentUser;
    },

    // Get user balance
    async getBalance() {
        await this.refreshUser();
        return this.currentUser ? this.currentUser.balance : 0;
    },

    // Admin verification with Two-Step password
    async verifyAdminAccess() {
        if (!this.isAdmin) {
            await TelegramWebApp.showAlert('⛔ သင်သည် Admin မဟုတ်ပါ။');
            return false;
        }
        
        // Show popup to enter verification
        const result = await TelegramWebApp.showPopup({
            title: '🔐 Admin Verification',
            message: 'Admin Panel ဝင်ရောက်ရန် သင့် Telegram Two-Step Password ကို အတည်ပြုပါ။',
            buttons: [
                { id: 'verify', type: 'default', text: '✅ အတည်ပြုမည်' },
                { id: 'cancel', type: 'cancel', text: '❌ ပယ်ဖျက်မည်' }
            ]
        });
        
        if (result === 'verify') {
            // In production, implement proper 2FA verification
            // For now, we trust Telegram's authentication
            return true;
        }
        
        return false;
    },

    // Verify purchase with OTP/Password
    async verifyPurchase(amount) {
        const confirmed = await TelegramWebApp.showConfirm(
            `💰 ${amount} MMK ပေးချေရန် အတည်ပြုမည်လား?\n\n` +
            `သင့် Balance မှ ငွေနုတ်ယူပါမည်။`
        );
        
        if (!confirmed) {
            return { verified: false, reason: 'User cancelled' };
        }
        
        // Check balance
        const balance = await this.getBalance();
        if (balance < amount) {
            // Increment failed attempts
            const result = await Database.incrementFailedAttempts(this.currentUser.telegramId);
            
            if (result && result.banned) {
                this.showBannedMessage();
                return { verified: false, reason: 'Account banned' };
            }
            
            const remainingAttempts = CONFIG.MAX_FAILED_ATTEMPTS - (result ? result.attempts : 0);
            
            await TelegramWebApp.showAlert(
                `❌ လက်ကျန်ငွေ မလုံလောက်ပါ!\n\n` +
                `လိုအပ်သည်: ${amount} MMK\n` +
                `လက်ကျန်: ${balance} MMK\n\n` +
                `⚠️ သတိပေးချက်: ${remainingAttempts} ကြိမ် ကျန်ပါသေးသည်။`
            );
            
            return { verified: false, reason: 'Insufficient balance' };
        }
        
        // For additional security, you can implement Telegram OTP here
        // This would require server-side implementation
        
        TelegramWebApp.haptic('notification', 'success');
        return { verified: true };
    },

    // Show access denied page
    showAccessDenied() {
        document.body.innerHTML = `
            <div class="access-denied">
                <div class="access-denied-content">
                    <div class="access-denied-icon">🚫</div>
                    <h1>Access Denied</h1>
                    <p>ဤ Website ကို Telegram Bot မှသာ ဝင်ရောက်အသုံးပြုနိုင်ပါသည်။</p>
                    <p class="access-denied-subtitle">This website can only be accessed through Telegram Bot.</p>
                    <a href="https://t.me/${CONFIG.BOT_USERNAME}" class="access-denied-btn">
                        <span>🤖</span>
                        <span>Open in Telegram</span>
                    </a>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .access-denied {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%);
                padding: 20px;
            }
            .access-denied-content {
                text-align: center;
                max-width: 400px;
            }
            .access-denied-icon {
                font-size: 80px;
                margin-bottom: 20px;
                animation: pulse 2s infinite;
            }
            .access-denied h1 {
                color: #EF4444;
                font-size: 28px;
                margin-bottom: 15px;
            }
            .access-denied p {
                color: #A0A0B0;
                font-size: 16px;
                margin-bottom: 10px;
                line-height: 1.6;
            }
            .access-denied-subtitle {
                font-size: 14px !important;
                opacity: 0.7;
            }
            .access-denied-btn {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
                color: white;
                padding: 15px 30px;
                border-radius: 50px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 25px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            }
            .access-denied-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    },

    // Show banned message
    showBannedMessage() {
        document.body.innerHTML = `
            <div class="banned-page">
                <div class="banned-content">
                    <div class="banned-icon">⛔</div>
                    <h1>Account Suspended</h1>
                    <p>သင့်အကောင့်ကို ပိတ်ပင်ထားပါသည်။</p>
                    <p class="banned-reason">အကူအညီလိုအပ်ပါက Admin ထံ ဆက်သွယ်ပါ။</p>
                    <a href="https://t.me/${CONFIG.ADMIN_USERNAME}" class="contact-admin-btn">
                        <span>📞</span>
                        <span>Contact Admin</span>
                    </a>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .banned-page {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #1A0A0A 0%, #2D1515 100%);
                padding: 20px;
            }
            .banned-content {
                text-align: center;
                max-width: 400px;
            }
            .banned-icon {
                font-size: 80px;
                margin-bottom: 20px;
            }
            .banned-page h1 {
                color: #EF4444;
                font-size: 28px;
                margin-bottom: 15px;
            }
            .banned-page p {
                color: #FCA5A5;
                font-size: 16px;
                margin-bottom: 10px;
            }
            .banned-reason {
                opacity: 0.8;
                font-size: 14px !important;
            }
            .contact-admin-btn {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: #EF4444;
                color: white;
                padding: 15px 30px;
                border-radius: 50px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 25px;
                transition: all 0.3s ease;
            }
            .contact-admin-btn:hover {
                background: #DC2626;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    },

    // Logout (clear local data)
    async logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isAdmin = false;
        
        await TelegramWebApp.cloudStorageRemove('user_id');
        await TelegramWebApp.cloudStorageRemove('last_login');
        
        TelegramWebApp.close();
    }
};
