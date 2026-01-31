/* ============================================
   ADMIN API
   Mafia Gaming Shop - Fixed for Real-Time Sync
   ============================================ */

const telegraphModule = require('./telegram');
const authModule = require('./auth');
const { notifyAdmin, broadcastMessage } = telegraphModule;
const { verifyToken } = authModule;

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '1538232799');
const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

function ensureArray(data) {
    return Array.isArray(data) ? data : [];
}

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

            try {
                const getRes = await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}/latest`, {
                    headers: { 'X-Master-Key': MASTER_KEY }
                });
                
                if (!getRes.ok) {
                    return res.status(500).json({ error: 'Failed to fetch banned users' });
                }
                
                const getData = await getRes.json();
                let bannedUsers = ensureArray(getData.record);

                bannedUsers.push({
                    id: userId,
                    reason: reason || 'Banned by admin',
                    bannedAt: new Date().toISOString()
                });

                const updateRes = await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(bannedUsers)
                });
                
                if (!updateRes.ok) {
                    return res.status(500).json({ error: 'Failed to ban user' });
                }

                return res.status(200).json({ success: true });
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        }

        // Unban user
        if (action === 'unbanUser' && req.method === 'POST') {
            const { userId, bannedUsersBinId } = req.body;
            
            if (!userId || !bannedUsersBinId) {
                return res.status(400).json({ error: 'User ID and bin ID required' });
            }

            try {
                const getRes = await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}/latest`, {
                    headers: { 'X-Master-Key': MASTER_KEY }
                });
                
                if (!getRes.ok) {
                    return res.status(500).json({ error: 'Failed to fetch banned users' });
                }
                
                const getData = await getRes.json();
                let bannedUsers = ensureArray(getData.record).filter(u => u.id != userId);

                const updateRes = await fetch(`${JSONBIN_API}/b/${bannedUsersBinId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(bannedUsers)
                });
                
                if (!updateRes.ok) {
                    return res.status(500).json({ error: 'Failed to unban user' });
                }

                return res.status(200).json({ success: true });
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
