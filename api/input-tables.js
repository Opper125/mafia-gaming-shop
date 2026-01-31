/* ============================================
   INPUT TABLES API
   Mafia Gaming Shop
   ============================================ */

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { binId, categoryId } = req.query;

    try {
        if (req.method === 'GET') {
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });
            const response = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            const data = await response.json();
            let tables = data.record || [];
            if (categoryId) tables = tables.filter(t => t.categoryId === categoryId);
            return res.status(200).json(tables);
        }

        if (req.method === 'POST') {
            const { inputTable, inputTables } = req.body;
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });

            if (inputTables) {
                await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(inputTables)
                });
                return res.status(200).json({ success: true });
            }

            if (inputTable) {
                const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { headers: { 'X-Master-Key': MASTER_KEY } });
                const getData = await getRes.json();
                let tables = getData.record || [];
                const idx = tables.findIndex(t => t.id === inputTable.id);
                if (idx !== -1) tables[idx] = { ...tables[idx], ...inputTable, updatedAt: new Date().toISOString() };
                else tables.push({ ...inputTable, id: inputTable.id || `input_${Date.now().toString(36)}`, createdAt: new Date().toISOString() });
                await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(tables)
                });
                return res.status(200).json({ success: true });
            }
            return res.status(400).json({ error: 'Input table data required' });
        }

        if (req.method === 'DELETE') {
            const { tableId } = req.body;
            if (!binId || !tableId) return res.status(400).json({ error: 'Bin ID and table ID required' });
            const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { headers: { 'X-Master-Key': MASTER_KEY } });
            const getData = await getRes.json();
            const tables = (getData.record || []).filter(t => t.id !== tableId);
            await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify(tables)
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
