/* ============================================
   PRODUCTS API
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

    const { binId, categoryId } = req.query;

    try {
        // GET - Fetch products
        if (req.method === 'GET') {
            if (!binId) {
                return res.status(400).json({ error: 'Bin ID required' });
            }

            const response = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            
            const data = await response.json();
            let products = data.record || [];

            // Filter by category if provided
            if (categoryId) {
                products = products.filter(p => p.categoryId === categoryId);
            }

            return res.status(200).json(products);
        }

        // POST - Create/Update products
        if (req.method === 'POST') {
            const { product, products: allProducts } = req.body;

            if (!binId) {
                return res.status(400).json({ error: 'Bin ID required' });
            }

            // Bulk update
            if (allProducts) {
                const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify(allProducts)
                });
                
                return res.status(200).json({ success: true });
            }

            // Single product
            if (product) {
                const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                    headers: { 'X-Master-Key': MASTER_KEY }
                });
                
                const getData = await getResponse.json();
                let products = getData.record || [];

                const existingIndex = products.findIndex(p => p.id === product.id);
                
                if (existingIndex !== -1) {
                    products[existingIndex] = { 
                        ...products[existingIndex], 
                        ...product,
                        updatedAt: new Date().toISOString()
                    };
                } else {
                    products.push({
                        ...product,
                        id: product.id || `prod_${Date.now().toString(36)}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }

                const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify(products)
                });
                
                return res.status(200).json({ success: true });
            }

            return res.status(400).json({ error: 'Product data required' });
        }

        // DELETE - Delete product
        if (req.method === 'DELETE') {
            const { productId } = req.body;

            if (!binId || !productId) {
                return res.status(400).json({ error: 'Bin ID and product ID required' });
            }

            const getResponse = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
                headers: { 'X-Master-Key': MASTER_KEY }
            });
            
            const getData = await getResponse.json();
            let products = getData.record || [];

            products = products.filter(p => p.id !== productId);

            const updateResponse = await fetch(`${JSONBIN_API}/b/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': MASTER_KEY
                },
                body: JSON.stringify(products)
            });
            
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Products API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
