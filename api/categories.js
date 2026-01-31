/* ============================================
   CATEGORIES API
   Mafia Gaming Shop
   ============================================ */

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { binId } = req.query;

    try {
        // GET
        if (req.method === 'GET') {
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });

            const response = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            const data = await response.json();
            return res.status(200).json(data.record || []);
        }

        // POST
        if (req.method === 'POST') {
            const { category, categories } = req.body;
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });

            if (categories) {
                await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(categories)
                });
                return res.status(200).json({ success: true });
            }

            if (category) {
                const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                    headers: { 'X-Master-Key': MASTER_KEY }
                });
                const getData = await getResponse.json();
                let cats = getData.record || [];

                const idx = cats.findIndex(c => c.id === category.id);
                if (idx !== -1) {
                    cats[idx] = { ...cats[idx], ...category, updatedAt: new Date().toISOString() };
                } else {
                    cats.push({ ...category, id: category.id || `cat_${Date.now().toString(36)}`, createdAt: new Date().toISOString() });
                }

                await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(cats)
                });
                return res.status(200).json({ success: true });
            }

            return res.status(400).json({ error: 'Category data required' });
        }

        // DELETE
        if (req.method === 'DELETE') {
            const { categoryId } = req.body;
            if (!binId || !categoryId) return res.status(400).json({ error: 'Bin ID and category ID required' });

            const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            const getData = await getResponse.json();
            let cats = (getData.record || []).filter(c => c.id !== categoryId);

            await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify(cats)
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
