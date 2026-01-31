/* ============================================
   BANNERS API
   Mafia Gaming Shop
   ============================================ */

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { binId, type } = req.query; // type: 'type1' or 'type2'

    try {
        if (req.method === 'GET') {
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });
            const response = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            const data = await response.json();
            return res.status(200).json(data.record || []);
        }

        if (req.method === 'POST') {
            const { banner, banners } = req.body;
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });

            if (banners) {
                await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(banners)
                });
                return res.status(200).json({ success: true });
            }

            if (banner) {
                const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { headers: { 'X-Master-Key': MASTER_KEY } });
                const getData = await getRes.json();
                let bans = getData.record || [];
                const idx = bans.findIndex(b => b.id === banner.id);
                if (idx !== -1) bans[idx] = { ...bans[idx], ...banner, updatedAt: new Date().toISOString() };
                else bans.push({ ...banner, id: banner.id || `banner_${Date.now().toString(36)}`, createdAt: new Date().toISOString() });
                await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(bans)
                });
                return res.status(200).json({ success: true });
            }
            return res.status(400).json({ error: 'Banner data required' });
        }

        if (req.method === 'DELETE') {
            const { bannerId } = req.body;
            if (!binId || !bannerId) return res.status(400).json({ error: 'Bin ID and banner ID required' });
            const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { headers: { 'X-Master-Key': MASTER_KEY } });
            const getData = await getRes.json();
            const bans = (getData.record || []).filter(b => b.id !== bannerId);
            await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify(bans)
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
