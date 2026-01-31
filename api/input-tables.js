/* ============================================
   INPUT TABLES API
   Mafia Gaming Shop - Fixed for Real-Time Sync
   ============================================ */

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

function ensureArray(data) {
    return Array.isArray(data) ? data : [];
}

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
            
            if (!response.ok) {
                return res.status(response.status).json({ error: `JSONBin error: ${response.status}` });
            }
            
            const data = await response.json();
            let tables = ensureArray(data.record);
            
            if (categoryId) {
                tables = tables.filter(t => t.categoryId === categoryId);
            }
            
            return res.status(200).json(tables);
        }

        if (req.method === 'POST') {
            const { inputTable, inputTables } = req.body;
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });

            if (inputTables) {
                const validated = ensureArray(inputTables);
                const response = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(validated)
                });
                
                if (!response.ok) {
                    return res.status(500).json({ error: 'Failed to update input tables' });
                }
                
                return res.status(200).json({ success: true });
            }

            if (inputTable) {
                const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { 
                    headers: { 'X-Master-Key': MASTER_KEY } 
                });
                
                if (!getRes.ok) {
                    return res.status(500).json({ error: 'Failed to fetch input tables' });
                }
                
                const getData = await getRes.json();
                let tables = ensureArray(getData.record);
                const idx = tables.findIndex(t => t.id === inputTable.id);
                
                if (idx !== -1) {
                    tables[idx] = { ...tables[idx], ...inputTable, updatedAt: new Date().toISOString() };
                } else {
                    tables.push({ 
                        ...inputTable, 
                        id: inputTable.id || `input_${Date.now().toString(36)}`, 
                        createdAt: new Date().toISOString() 
                    });
                }
                
                const updateRes = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(tables)
                });
                
                if (!updateRes.ok) {
                    return res.status(500).json({ error: 'Failed to save input table' });
                }
                
                return res.status(200).json({ success: true });
            }
            
            return res.status(400).json({ error: 'Input table data required' });
        }

        if (req.method === 'DELETE') {
            const { tableId } = req.body;
            if (!binId || !tableId) return res.status(400).json({ error: 'Bin ID and table ID required' });
            
            const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { 
                headers: { 'X-Master-Key': MASTER_KEY } 
            });
            
            if (!getRes.ok) {
                return res.status(500).json({ error: 'Failed to fetch input tables' });
            }
            
            const getData = await getRes.json();
            const tables = ensureArray(getData.record).filter(t => t.id !== tableId);
            
            const deleteRes = await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify(tables)
            });
            
            if (!deleteRes.ok) {
                return res.status(500).json({ error: 'Failed to delete input table' });
            }
            
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Input tables API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
