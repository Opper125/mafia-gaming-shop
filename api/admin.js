/* ============================================
   ADMIN API
   Mafia Gaming Shop
   ============================================ */

const { notifyAdmin } = require('./telegram');
const { verifyToken } = require('./auth');

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '1538232799');
const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { action, binId } = req.query;

        // Get statistics
        if (action === 'stats') {
            const stats = {
                totalUsers: 0,
                totalOrders: 0,
                pendingOrders: 0,
                approvedOrders: 0,
                rejectedOrders: 0,
                totalRevenue: 0,
                pendingTopups: 0
            };

            // In production, fetch from actual bins
            return res.status(200).json(stats);
        }

        // Ban user
        if (action === 'banUser' && req.method === 'POST') {
            const { userId, reason, bannedUsersBinId } = req.body;
            
            if (!userId || !bannedUsersBinId) {
                return res.status(400).json({ error: 'User ID and bin ID required' });
            }

            const getRes = await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            const getData = await getRes.json();
            let bannedUsers = getData.record || [];

            bannedUsers.push({
                id: userId,
                reason: reason || 'Banned by admin',
                bannedAt: new Date().toISOString()
            });

            await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify(bannedUsers)
            });

            return res.status(200).json({ success: true });
        }

        // Unban user
        if (action === 'unbanUser' && req.method === 'POST') {
            const { userId, bannedUsersBinId } = req.body;
            
            if (!userId || !bannedUsersBinId) {
                return res.status(400).json({ error: 'User ID and bin ID required' });
            }

            const getRes = await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            const getData = await getRes.json();
            let bannedUsers = (getData.record || []).filter(u => u.id != userId);

            await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify(bannedUsers)
            });

            return res.status(200).json({ success: true });
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
