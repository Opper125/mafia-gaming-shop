/* ============================================
   USERS API
   Mafia Gaming Shop - Fixed for Real-Time Sync
   ============================================ */

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

// Helper to ensure data is array
function ensureArray(data) {
    return Array.isArray(data) ? data : [];
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action, binId } = req.query;

    try {
        // GET - Fetch users
        if (req.method === 'GET') {
            if (!binId) {
                return res.status(400).json({ error: 'Bin ID required' });
            }

            const response = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            
            if (!response.ok) {
                return res.status(response.status).json({ error: `JSONBin error: ${response.status}` });
            }
            
            const data = await response.json();
            return res.status(200).json(ensureArray(data.record));
        }

        // POST - Create/Update user
        if (req.method === 'POST') {
            const { user, users } = req.body;

            if (!binId) {
                return res.status(400).json({ error: 'Bin ID required' });
            }

            // Update entire users array
            if (users) {
                const validated = ensureArray(users);
                const response = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify(validated)
                });
                
                if (!response.ok) {
                    return res.status(500).json({ error: 'Failed to update users' });
                }
                
                return res.status(200).json({ success: true });
            }

            // Add/Update single user
            if (user) {
                // Fetch current users
                const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                    headers: { 'X-Master-Key': MASTER_KEY }
                });
                
                if (!getResponse.ok) {
                    return res.status(500).json({ error: 'Failed to fetch users' });
                }
                
                const getData = await getResponse.json();
                let currentUsers = ensureArray(getData.record);

                const existingIndex = currentUsers.findIndex(u => u.id === user.id);
                
                if (existingIndex !== -1) {
                    currentUsers[existingIndex] = { ...currentUsers[existingIndex], ...user };
                } else {
                    currentUsers.push(user);
                }

                const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify(currentUsers)
                });
                
                if (!updateResponse.ok) {
                    return res.status(500).json({ error: 'Failed to save user' });
                }
                
                return res.status(200).json({ success: true });
            }

            return res.status(400).json({ error: 'User data required' });
        }

        // PUT - Update user balance
        if (req.method === 'PUT') {
            const { userId, amount, operation } = req.body;

            if (!binId || !userId) {
                return res.status(400).json({ error: 'Bin ID and User ID required' });
            }

            // Fetch current users
            const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            
            if (!getResponse.ok) {
                return res.status(500).json({ error: 'Failed to fetch users' });
            }
            
            const getData = await getResponse.json();
            let users = ensureArray(getData.record);

            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex === -1) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Update balance
            if (operation === 'add') {
                users[userIndex].balance = (users[userIndex].balance || 0) + amount;
            } else if (operation === 'deduct') {
                users[userIndex].balance = Math.max(0, (users[userIndex].balance || 0) - amount);
            } else if (operation === 'set') {
                users[userIndex].balance = amount;
            }

            users[userIndex].updatedAt = new Date().toISOString();

            const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': MASTER_KEY
                },
                body: JSON.stringify(users)
            });
            
            if (!updateResponse.ok) {
                return res.status(500).json({ error: 'Failed to update user balance' });
            }
            
            return res.status(200).json({ 
                success: true, 
                balance: users[userIndex].balance 
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Users API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
