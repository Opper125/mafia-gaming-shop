/* ============================================
   SETTINGS API
   Mafia Gaming Shop
   ============================================ */

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { binId } = req.query;

    try {
        if (req.method === 'GET') {
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });
            const response = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            const data = await response.json();
            return res.status(200).json(data.record || {});
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const { settings } = req.body;
            if (!binId || !settings) return res.status(400).json({ error: 'Bin ID and settings required' });

            await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify({ ...settings, updatedAt: new Date().toISOString() })
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
