/* ============================================
   BROADCAST API
   Mafia Gaming Shop - Fixed for Real-Time Sync
   ============================================ */

const { broadcastMessage, sendMessage, sendPhoto } = require('./telegram');

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

function ensureArray(data) {
    return Array.isArray(data) ? data : [];
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { message, image, usersBinId } = req.body;

            if (!message) {
                return res.status(400).json({ error: 'Message required' });
            }

            // Get all users
            let users = [];
            if (usersBinId) {
                const response = await fetch(`${JSONBIN_API}/b/${usersBinId}/latest`, {
                    headers: { 'X-Master-Key': MASTER_KEY }
                });
                
                if (!response.ok) {
                    return res.status(500).json({ error: 'Failed to fetch users' });
                }
                
                const data = await response.json();
                users = ensureArray(data.record);
            }

            if (users.length === 0) {
                return res.status(400).json({ error: 'No users found' });
            }

            const userIds = users.map(u => u.id);
            const results = await broadcastMessage(userIds, message, image);

            return res.status(200).json({
                success: true,
                sent: results.success,
                failed: results.failed,
                total: userIds.length
            });

        } catch (error) {
            console.error('Broadcast error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
