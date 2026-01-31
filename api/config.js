/* ============================================
   CONFIGURATION API
   Mafia Gaming Shop - BIN ID Management
   ============================================ */

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Retrieve stored bin IDs
        if (req.method === 'GET') {
            const binIds = {
                users: process.env.JSONBIN_USERS_ID || '',
                categories: process.env.JSONBIN_CATEGORIES_ID || '',
                products: process.env.JSONBIN_PRODUCTS_ID || '',
                orders: process.env.JSONBIN_ORDERS_ID || '',
                topupRequests: process.env.JSONBIN_TOPUP_ID || '',
                payments: process.env.JSONBIN_PAYMENTS_ID || '',
                bannersType1: process.env.JSONBIN_BANNERS1_ID || '',
                bannersType2: process.env.JSONBIN_BANNERS2_ID || '',
                inputTables: process.env.JSONBIN_INPUT_ID || '',
                bannedUsers: process.env.JSONBIN_BANNED_ID || '',
                broadcasts: process.env.JSONBIN_BROADCASTS_ID || '',
                settings: process.env.JSONBIN_SETTINGS_ID || ''
            };
            
            return res.status(200).json(binIds);
        }

        // POST - Validate bin IDs are accessible (admin only)
        if (req.method === 'POST') {
            const { binIds } = req.body;
            
            if (!binIds || typeof binIds !== 'object') {
                return res.status(400).json({ error: 'Invalid bin IDs' });
            }

            // Just return success - actual validation happens when accessing JSONBin
            return res.status(200).json({ success: true, received: Object.keys(binIds).length });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Config API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
