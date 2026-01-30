// js/app.js - Main Application Entry Point (FIXED)

const App = {
    isInitialized: false,
    isLoading: true,

    // Initialize application
    async init() {
        console.log('🚀 Starting MAFIA Gaming Shop...');
        console.log('📱 Version: 1.0.0');
        
        try {
            // Show loading
            this.showLoading('Initializing...');
            
            // Step 1: Check Telegram environment
            console.log('📲 Step 1: Checking Telegram...');
            
            if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
                console.error('❌ Telegram WebApp not found!');
                this.showAccessDenied();
                return;
            }
            
            const tg = window.Telegram.WebApp;
            
            // Check if we have initData (running in Telegram)
            if (!tg.initData || tg.initData === '') {
                console.error('❌ No initData - not running in Telegram!');
                this.showAccessDenied();
                return;
            }
            
            console.log('✅ Telegram WebApp detected');
            
            // Expand and setup webapp
            tg.expand();
            tg.ready();
            
            // Step 2: Initialize TelegramWebApp wrapper
            console.log('📲 Step 2: Initializing TelegramWebApp...');
            await TelegramWebApp.init();
            
            // Step 3: Initialize Database
            console.log('💾 Step 3: Initializing Database...');
            this.showLoading('Setting up database...');
            
            const dbSuccess = await Database.init();
            if (!dbSuccess) {
                console.error('❌ Database initialization failed!');
                this.showError(new Error('Database initialization failed'));
                return;
            }
            console.log('✅ Database ready');
            
            // Step 4: Authenticate user
            console.log('🔐 Step 4: Authenticating user...');
            this.showLoading('Authenticating...');
            
            const authSuccess = await Auth.init();
            if (!authSuccess) {
                console.error('❌ Authentication failed!');
                return; // Auth will show appropriate screen
            }
            console.log('✅ User authenticated');
            
            // Step 5: Initialize UI
            console.log('🎨 Step 5: Initializing UI...');
            this.hideLoading();
            await UI.init();
            
            this.isInitialized = true;
            this.isLoading = false;
            
            console.log('✅ App initialized successfully!');
            console.log('👤 User:', Auth.getUser()?.firstName);
            console.log('👑 Is Admin:', Auth.checkAdmin());
            
        } catch (error) {
            console.error('❌ App initialization error:', error);
            this.showError(error);
        }
    },

    // Show loading screen
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const msgEl = overlay.querySelector('p');
            if (msgEl) msgEl.textContent = message;
            overlay.style.display = 'flex';
        }
    },

    // Hide loading screen
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    // Show access denied
    showAccessDenied() {
        this.hideLoading();
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%);
                padding: 20px;
                text-align: center;
            ">
                <div>
                    <div style="font-size: 80px; margin-bottom: 20px;">🚫</div>
                    <h1 style="color: #EF4444; font-size: 24px; margin-bottom: 15px;">Access Denied</h1>
                    <p style="color: #A0A0B0; margin-bottom: 10px;">ဤ Website ကို Telegram Bot မှသာ ဝင်ရောက်အသုံးပြုနိုင်ပါသည်။</p>
                    <p style="color: #6B7280; font-size: 14px; margin-bottom: 25px;">This website can only be accessed through Telegram Bot.</p>
                    <a href="https://t.me/${CONFIG.BOT_USERNAME}" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
                        color: white;
                        padding: 15px 30px;
                        border-radius: 50px;
                        text-decoration: none;
                        font-weight: 600;
                    ">
                        🤖 Open in Telegram
                    </a>
                </div>
            </div>
        `;
    },

    // Show error screen
    showError(error) {
        this.hideLoading();
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%);
                padding: 20px;
                text-align: center;
            ">
                <div style="max-width: 400px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
                    <h1 style="color: #EF4444; font-size: 24px; margin-bottom: 15px;">Something went wrong</h1>
                    <p style="color: #A0A0B0; margin-bottom: 10px;">တစ်ခုခု မှားယွင်းနေပါသည်။</p>
                    <p style="
                        font-size: 12px;
                        color: #666;
                        background: rgba(255,255,255,0.05);
                        padding: 10px;
                        border-radius: 8px;
                        margin: 15px 0;
                        word-break: break-all;
                    ">${error.message || 'Unknown error'}</p>
                    <button onclick="location.reload()" style="
                        background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 50px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        🔄 Retry
                    </button>
                </div>
            </div>
        `;
    },

    // Check if ready
    isReady() {
        return this.isInitialized && !this.isLoading;
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Ready');
    
    // Wait a moment for Telegram script to fully load
    setTimeout(() => {
        App.init();
    }, 300);
});

// Error handlers
window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', message, source, lineno);
    return false;
};

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
});
