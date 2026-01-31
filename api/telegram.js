/* ============================================
   TELEGRAM BOT API HANDLER
   Mafia Gaming Shop
   ============================================ */

const BOT_TOKEN = process.env.BOT_TOKEN || '8506121473:AAE6LXKDj6J8GR9HKYNzkq47EVa7tV8BBUM';
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '1538232799';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://mafia-gamin-shop.vercel.app';

// Telegram API Base URL
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Send message to user
async function sendMessage(chatId, text, options = {}) {
    try {
        const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: options.parseMode || 'HTML',
                reply_markup: options.replyMarkup || undefined,
                disable_notification: options.silent || false
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Send message error:', error);
        return { ok: false, error: error.message };
    }
}

// Send photo to user
async function sendPhoto(chatId, photo, caption = '', options = {}) {
    try {
        const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                photo: photo,
                caption: caption,
                parse_mode: options.parseMode || 'HTML',
                reply_markup: options.replyMarkup || undefined
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Send photo error:', error);
        return { ok: false, error: error.message };
    }
}

// Send notification to admin
async function notifyAdmin(message, type = 'info') {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        order: '🛒',
        topup: '💰',
        user: '👤'
    };
    
    const icon = icons[type] || icons.info;
    const text = `${icon} <b>Admin Notification</b>\n\n${message}`;
    
    return await sendMessage(ADMIN_TELEGRAM_ID, text);
}

// Broadcast message to all users
async function broadcastMessage(userIds, message, photo = null) {
    const results = { success: 0, failed: 0 };
    
    for (const userId of userIds) {
        try {
            let result;
            if (photo) {
                result = await sendPhoto(userId, photo, message);
            } else {
                result = await sendMessage(userId, message);
            }
            
            if (result.ok) {
                results.success++;
            } else {
                results.failed++;
            }
            
            // Rate limiting - wait 50ms between messages
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
            results.failed++;
        }
    }
    
    return results;
}

// Validate Telegram WebApp init data
function validateInitData(initData, botToken = BOT_TOKEN) {
    if (!initData) return false;
    
    try {
        const crypto = require('crypto');
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        const secretKey = crypto.createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();
        
        const calculatedHash = crypto.createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
        
        return calculatedHash === hash;
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
}

// Parse user from init data
function parseUserFromInitData(initData) {
    try {
        const urlParams = new URLSearchParams(initData);
        const userJson = urlParams.get('user');
        if (userJson) {
            return JSON.parse(decodeURIComponent(userJson));
        }
        return null;
    } catch (error) {
        console.error('Parse user error:', error);
        return null;
    }
}

// Webhook handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const update = req.body;
            
            // Handle incoming messages
            if (update.message) {
                const message = update.message;
                const chatId = message.chat.id;
                const text = message.text || '';
                
                // Handle /start command
                if (text === '/start' || text.startsWith('/start ')) {
                    const welcomeMessage = `
🎮 <b>Welcome to Mafia Gaming Shop!</b>

Your one-stop shop for:
• PUBG Mobile UC
• Mobile Legends Diamonds
• And more!

💰 Best prices guaranteed
⚡ Fast delivery
🔒 Secure transactions

Click the button below to open the shop:
                    `;
                    
                    await sendMessage(chatId, welcomeMessage, {
                        replyMarkup: {
                            inline_keyboard: [[
                                {
                                    text: '🛒 Open Shop',
                                    web_app: { url: WEBAPP_URL }
                                }
                            ], [
                                {
                                    text: '📞 Support',
                                    url: 'https://t.me/OPPER101'
                                }
                            ]]
                        }
                    });
                }
                
                // Handle /help command
                else if (text === '/help') {
                    const helpMessage = `
📚 <b>Help & Commands</b>

/start - Open the shop
/help - Show this help message
/balance - Check your balance
/orders - View your orders

Need help? Contact @OPPER101
                    `;
                    await sendMessage(chatId, helpMessage);
                }
                
                // Handle /balance command
                else if (text === '/balance') {
                    // This would fetch from database in production
                    await sendMessage(chatId, '💰 Your balance: 0 MMK\n\nUse the shop to topup your balance!', {
                        replyMarkup: {
                            inline_keyboard: [[
                                { text: '💳 Topup Now', web_app: { url: WEBAPP_URL } }
                            ]]
                        }
                    });
                }
                
                // Handle /orders command
                else if (text === '/orders') {
                    await sendMessage(chatId, '📦 View your orders in the shop!', {
                        replyMarkup: {
                            inline_keyboard: [[
                                { text: '📋 View Orders', web_app: { url: WEBAPP_URL } }
                            ]]
                        }
                    });
                }
            }
            
            // Handle callback queries
            if (update.callback_query) {
                const callbackQuery = update.callback_query;
                const data = callbackQuery.data;
                const chatId = callbackQuery.message.chat.id;
                
                // Handle different callbacks
                if (data === 'open_shop') {
                    await sendMessage(chatId, 'Opening shop...', {
                        replyMarkup: {
                            inline_keyboard: [[
                                { text: '🛒 Open Shop', web_app: { url: WEBAPP_URL } }
                            ]]
                        }
                    });
                }
            }
            
            return res.status(200).json({ ok: true });
            
        } catch (error) {
            console.error('Webhook error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
    
    // GET request - return bot info
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${TELEGRAM_API}/getMe`);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};

// Export functions for use in other modules
module.exports.sendMessage = sendMessage;
module.exports.sendPhoto = sendPhoto;
module.exports.notifyAdmin = notifyAdmin;
module.exports.broadcastMessage = broadcastMessage;
module.exports.validateInitData = validateInitData;
module.exports.parseUserFromInitData = parseUserFromInitData;
