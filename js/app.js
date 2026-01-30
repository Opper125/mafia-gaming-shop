// js/app.js - Main Application Entry Point

const App = {
    // App state
    isInitialized: false,
    isLoading: true,

    // Initialize application
    async init() {
        console.log('🚀 Starting MAFIA Gaming Shop...');
        console.log('📱 Version: 1.0.0');
        console.log('🔗 URL:', window.location.href);
        
        try {
            // Step 1: Check Telegram environment
            console.log('📲 Checking Telegram environment...');
            if (!TelegramWebApp.isInTelegram()) {
                console.error('❌ Not in Telegram!');
                Auth.showAccessDenied();
                return;
            }
            
            // Step 2: Initialize Telegram WebApp
            console.log('🔧 Initializing Telegram WebApp...');
            await TelegramWebApp.init();
            
            // Step 3: Initialize Database
            console.log('💾 Initializing database...');
            await Database.init();
            
            // Step 4: Authenticate user
            console.log('🔐 Authenticating user...');
            const authSuccess = await Auth.init();
            
            if (!authSuccess) {
                console.error('❌ Authentication failed!');
                return;
            }
            
            // Step 5: Initialize UI
            console.log('🎨 Initializing UI...');
            await UI.init();
            
            // Mark as initialized
            this.isInitialized = true;
            this.isLoading = false;
            
            console.log('✅ App initialized successfully!');
            
            // Log user info
            const user = Auth.getUser();
            console.log('👤 Logged in as:', user?.firstName, `(@${user?.username})`);
            console.log('👑 Is Admin:', Auth.checkAdmin());
            
        } catch (error) {
            console.error('❌ App initialization error:', error);
            this.showError(error);
        }
    },

    // Show error screen
    showError(error) {
        document.body.innerHTML = `
            <div class="error-screen">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <h1>Oops! Something went wrong</h1>
                    <p>တစ်ခုခု မှားယွင်းနေပါသည်။ ပြန်လည်ကြိုးစားပါ။</p>
                    <p class="error-detail">${error.message || 'Unknown error'}</p>
                    <button class="retry-btn" onclick="location.reload()">
                        🔄 Retry
                    </button>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .error-screen {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%);
                padding: 20px;
            }
            .error-content {
                text-align: center;
                max-width: 400px;
            }
            .error-icon {
                font-size: 60px;
                margin-bottom: 20px;
            }
            .error-screen h1 {
                color: #EF4444;
                font-size: 24px;
                margin-bottom: 15px;
            }
            .error-screen p {
                color: #A0A0B0;
                margin-bottom: 10px;
            }
            .error-detail {
                font-size: 12px;
                color: #666;
                background: rgba(255,255,255,0.05);
                padding: 10px;
                border-radius: 8px;
                margin: 15px 0;
                word-break: break-all;
            }
            .retry-btn {
                background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 15px;
            }
        `;
        document.head.appendChild(style);
    },

    // Get app version
    getVersion() {
        return '1.0.0';
    },

    // Check if app is ready
    isReady() {
        return this.isInitialized && !this.isLoading;
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Telegram WebApp script is loaded
    setTimeout(() => {
        App.init();
    }, 100);
});

// Handle visibility change
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && App.isReady()) {
        // Refresh user data when app becomes visible
        await Auth.refreshUser();
        await UI.updateBalanceDisplay();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    UI.showToast('Connected', 'success');
});

window.addEventListener('offline', () => {
    UI.showToast('No internet connection', 'warning');
});

// Prevent context menu in production
if (window.location.hostname !== 'localhost') {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });
    return false;
};

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
});
