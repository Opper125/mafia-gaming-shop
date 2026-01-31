/* ============================================
   AUTHENTICATION API
   Mafia Gaming Shop
   ============================================ */

const { validateInitData, parseUserFromInitData } = require('./telegram');

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '1538232799');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const { initData, action } = req.body;
            
            // Validate init data
            if (action === 'validate') {
                const isValid = validateInitData(initData);
                const user = parseUserFromInitData(initData);
                
                if (!isValid) {
                    return res.status(401).json({
                        valid: false,
                        error: 'Invalid init data'
                    });
                }
                
                return res.status(200).json({
                    valid: true,
                    user: user,
                    isAdmin: user?.id === ADMIN_TELEGRAM_ID
                });
            }
            
            // Check admin status
            if (action === 'checkAdmin') {
                const user = parseUserFromInitData(initData);
                
                if (!user) {
                    return res.status(401).json({
                        isAdmin: false,
                        error: 'No user data'
                    });
                }
                
                return res.status(200).json({
                    isAdmin: user.id === ADMIN_TELEGRAM_ID,
                    userId: user.id
                });
            }
            
            // Verify 2FA (simplified - in production use proper verification)
            if (action === 'verify2FA') {
                const { userId, password } = req.body;
                
                // In production, this would verify against Telegram's 2FA
                // For demo, we accept if user is admin
                if (parseInt(userId) === ADMIN_TELEGRAM_ID) {
                    return res.status(200).json({
                        verified: true,
                        token: generateToken(userId)
                    });
                }
                
                return res.status(401).json({
                    verified: false,
                    error: 'Verification failed'
                });
            }
            
            return res.status(400).json({ error: 'Invalid action' });
            
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};

// Simple token generation (use JWT in production)
function generateToken(userId) {
    const timestamp = Date.now();
    const data = `${userId}:${timestamp}`;
    return Buffer.from(data).toString('base64');
}

// Verify token
function verifyToken(token) {
    try {
        const data = Buffer.from(token, 'base64').toString();
        const [userId, timestamp] = data.split(':');
        
        // Token expires after 24 hours
        const expires = parseInt(timestamp) + (24 * 60 * 60 * 1000);
        if (Date.now() > expires) {
            return { valid: false, error: 'Token expired' };
        }
        
        return { valid: true, userId: parseInt(userId) };
    } catch (error) {
        return { valid: false, error: 'Invalid token' };
    }
}

module.exports.generateToken = generateToken;
module.exports.verifyToken = verifyToken;
