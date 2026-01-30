// js/app.js - Main Application Entry Point (Fixed for CSS compatibility)

const App = {
    isInitialized: false,
    isLoading: true,

    async init() {
        console.log('🚀 Starting MAFIA Gaming Shop...');
        
        try {
            // Show loading
            this.showLoading('Initializing...');
            
            // Step 1: Check Telegram
            console.log('📲 Checking Telegram...');
            
            if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
                console.error('❌ Telegram not found');
                this.showAccessDenied();
                return;
            }
            
            const tg = window.Telegram.WebApp;
            
            if (!tg.initData || tg.initData === '') {
                console.error('❌ Not in Telegram');
                this.showAccessDenied();
                return;
            }
            
            console.log('✅ Telegram detected');
            tg.expand();
            tg.ready();
            
            try {
                tg.setHeaderColor('#0F0F1A');
                tg.setBackgroundColor('#0F0F1A');
            } catch(e) {}
            
            // Step 2: Initialize TelegramWebApp
            console.log('📲 Initializing TelegramWebApp...');
            await TelegramWebApp.init();
            
            // Step 3: Initialize Database
            console.log('💾 Initializing Database...');
            this.showLoading('Setting up...');
            await Database.init();
            console.log('✅ Database ready');
            
            // Step 4: Authenticate
            console.log('🔐 Authenticating...');
            this.showLoading('Authenticating...');
            const authSuccess = await Auth.init();
            
            if (!authSuccess) {
                console.error('❌ Auth failed');
                return;
            }
            console.log('✅ Authenticated');
            
            // Step 5: Initialize UI
            console.log('🎨 Initializing UI...');
            this.hideLoading();
            await UI.init();
            
            this.isInitialized = true;
            this.isLoading = false;
            
            console.log('✅ App ready!');
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.showError(error);
        }
    },

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('active');
            const p = overlay.querySelector('p');
            if (p) p.textContent = message;
        }
    },

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    showAccessDenied() {
        this.hideLoading();
        
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <div style="font-size: 80px; margin-bottom: 20px;">🚫</div>
                        <h1 style="color: #EF4444; font-size: 24px; margin-bottom: 15px;">Access Denied</h1>
                        <p style="color: #A0A0B0; margin-bottom: 10px;">ဤ Website ကို Telegram Bot မှသာ ဝင်ရောက်နိုင်ပါသည်။</p>
                        <p style="color: #6B7280; font-size: 14px; margin-bottom: 25px;">Open this in Telegram Bot</p>
                        <a href="https://t.me/${CONFIG.BOT_USERNAME}" style="
                            display: inline-flex;
                            align-items: center;
                            gap: 10px;
                            background: linear-gradient(135deg, #8B5CF6, #A855F7);
                            color: white;
                            padding: 15px 30px;
                            border-radius: 50px;
                            text-decoration: none;
                            font-weight: 600;
                        ">🤖 Open in Telegram</a>
                    </div>
                </div>
            `;
        }
    },

    showError(error) {
        this.hideLoading();
        
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
                        <h1 style="color: #EF4444; font-size: 24px; margin-bottom: 15px;">Error</h1>
                        <p style="color: #A0A0B0; margin-bottom: 20px;">${error.message || 'Something went wrong'}</p>
                        <button onclick="location.reload()" style="
                            background: linear-gradient(135deg, #8B5CF6, #A855F7);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 50px;
                            font-size: 16px;
                            cursor: pointer;
                        ">🔄 Retry</button>
                    </div>
                </div>
            `;
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => App.init(), 200);
});

window.onerror = (msg, src, line) => {
    console.error('Error:', msg, src, line);
};
