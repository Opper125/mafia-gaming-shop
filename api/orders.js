/* ============================================
   ORDERS API
   Mafia Gaming Shop
   ============================================ */

const { notifyAdmin } = require('./telegram');

const JSONBIN_API = 'https://api.jsonbin.io/v3';
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY || '$2a$10$nweVi.eOGDsyC7uEsN/OxeLcIr8uhyN8x86AiIo8koJ.B7MX1I5Bu';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { binId, userId } = req.query;

    try {
        // GET - Fetch orders
        if (req.method === 'GET') {
            if (!binId) {
                return res.status(400).json({ error: 'Bin ID required' });
            }

            const response = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            
            const data = await response.json();
            let orders = data.record || [];

            // Filter by user if userId provided
            if (userId) {
                orders = orders.filter(o => o.userId == userId);
            }

            return res.status(200).json(orders);
        }

        // POST - Create order
        if (req.method === 'POST') {
            const { order } = req.body;

            if (!binId || !order) {
                return res.status(400).json({ error: 'Bin ID and order data required' });
            }

            // Fetch current orders
            const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            
            const getData = await getResponse.json();
            let orders = getData.record || [];

            // Add new order
            const newOrder = {
                ...order,
                id: order.id || `ORD${Date.now().toString(36).toUpperCase()}`,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            orders.push(newOrder);

            const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': MASTER_KEY
                },
                body: JSON.stringify(orders)
            });

            // Notify admin
            await notifyAdmin(
                `<b>New Order!</b>\n\n` +
                `Order ID: ${newOrder.id}\n` +
                `User: ${newOrder.userName}\n` +
                `Product: ${newOrder.productName}\n` +
                `Amount: ${newOrder.price} ${newOrder.currency}`,
                'order'
            );

            return res.status(200).json({ success: true, order: newOrder });
        }

        // PUT - Update order status
        if (req.method === 'PUT') {
            const { orderId, status, orders: allOrders } = req.body;

            if (!binId) {
                return res.status(400).json({ error: 'Bin ID required' });
            }

            // Bulk update
            if (allOrders) {
                const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify(allOrders)
                });
                
                return res.status(200).json({ success: true });
            }

            // Single order update
            if (!orderId || !status) {
                return res.status(400).json({ error: 'Order ID and status required' });
            }

            // Fetch current orders
            const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            
            const getData = await getResponse.json();
            let orders = getData.record || [];

            const orderIndex = orders.findIndex(o => o.id === orderId);
            
            if (orderIndex === -1) {
                return res.status(404).json({ error: 'Order not found' });
            }

            orders[orderIndex].status = status;
            orders[orderIndex].updatedAt = new Date().toISOString();

            const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': MASTER_KEY
                },
                body: JSON.stringify(orders)
            });

            return res.status(200).json({ success: true, order: orders[orderIndex] });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Orders API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
