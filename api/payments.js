/* ============================================
   PAYMENTS API
   Mafia Gaming Shop - Fixed for Real-Time Sync
   ============================================ */

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

    const { binId } = req.query;

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
            return res.status(200).json(ensureArray(data.record));
        }

        if (req.method === 'POST') {
            const { payment, payments } = req.body;
            if (!binId) return res.status(400).json({ error: 'Bin ID required' });

            if (payments) {
                const validated = ensureArray(payments);
                const response = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(validated)
                });
                
                if (!response.ok) {
                    return res.status(500).json({ error: 'Failed to update payments' });
                }
                
                return res.status(200).json({ success: true });
            }

            if (payment) {
                const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { 
                    headers: { 'X-Master-Key': MASTER_KEY } 
                });
                
                if (!getRes.ok) {
                    return res.status(500).json({ error: 'Failed to fetch payments' });
                }
                
                const getData = await getRes.json();
                let pays = ensureArray(getData.record);
                const idx = pays.findIndex(p => p.id === payment.id);
                
                if (idx !== -1) {
                    pays[idx] = { ...pays[idx], ...payment, updatedAt: new Date().toISOString() };
                } else {
                    pays.push({ 
                        ...payment, 
                        id: payment.id || `pay_${Date.now().toString(36)}`, 
                        createdAt: new Date().toISOString() 
                    });
                }
                
                const updateRes = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                    body: JSON.stringify(pays)
                });
                
                if (!updateRes.ok) {
                    return res.status(500).json({ error: 'Failed to save payment' });
                }
                
                return res.status(200).json({ success: true });
            }
            
            return res.status(400).json({ error: 'Payment data required' });
        }

        if (req.method === 'DELETE') {
            const { paymentId } = req.body;
            if (!binId || !paymentId) return res.status(400).json({ error: 'Bin ID and payment ID required' });
            
            const getRes = await fetch(`${JSONBIN_API}/b/${binId}/latest`, { 
                headers: { 'X-Master-Key': MASTER_KEY } 
            });
            
            if (!getRes.ok) {
                return res.status(500).json({ error: 'Failed to fetch payments' });
            }
            
            const getData = await getRes.json();
            const pays = ensureArray(getData.record).filter(p => p.id !== paymentId);
            
            const deleteRes = await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
                body: JSON.stringify(pays)
            });
            
            if (!deleteRes.ok) {
                return res.status(500).json({ error: 'Failed to delete payment' });
            }
            
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Payments API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
