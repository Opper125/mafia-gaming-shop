// js/config.js - Configuration Settings (FIXED)

const CONFIG = {
    // Telegram Bot Settings
    BOT_TOKEN: '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM',
    BOT_USERNAME: 'mafia_gamingshopbot',
    ADMIN_TELEGRAM_ID: '1538232799',
    ADMIN_USERNAME: 'OPPER101',
    
    // JSONBin.io Settings
    JSONBIN_API: 'https://api.jsonbin.io/v3',
    JSONBIN_MASTER_KEY: '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu',
    JSONBIN_ACCESS_KEY: '$2a$10$tNEyDbr/ez8kUETcZBK.6OwFCcaAE4bjDV8EHQtjz3jbgjs8jqbrS',
    
    // Webapp Settings
    WEBAPP_URL: 'https://mafia-gamin-shop.vercel.app',
    
    // App Settings
    INTRO_DURATION: 5000,
    BANNER_INTERVAL: 7000,
    ANNOUNCEMENT_SPEED: 2000,
    MAX_FAILED_ATTEMPTS: 5,
    CURRENCY: 'MMK',
    
    // Theme Colors
    THEMES: {
        dark: {
            primary: '#8B5CF6',
            primaryGlow: 'rgba(139, 92, 246, 0.5)',
            secondary: '#A855F7',
            background: '#0F0F1A',
            surface: '#1A1A2E',
            surfaceLight: '#252542',
            text: '#FFFFFF',
            textSecondary: '#A0A0B0',
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B'
        },
        light: {
            primary: '#7C3AED',
            primaryGlow: 'rgba(124, 58, 237, 0.3)',
            secondary: '#9333EA',
            background: '#F8FAFC',
            surface: '#FFFFFF',
            surfaceLight: '#F1F5F9',
            text: '#1E293B',
            textSecondary: '#64748B',
            success: '#059669',
            error: '#DC2626',
            warning: '#D97706'
        }
    }
};

// Bin IDs - Separate object that can be modified
const BIN_IDS = {
    users: null,
    categories: null,
    products: null,
    orders: null,
    banners: null,
    payments: null,
    settings: null,
    inputTables: null,
    bannedUsers: null,
    announcements: null,
    deposits: null
};

// Freeze only CONFIG, not BIN_IDS
Object.freeze(CONFIG);
Object.freeze(CONFIG.THEMES);
