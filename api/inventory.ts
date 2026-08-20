import type { VercelRequest, VercelResponse } from '@vercel/node';

const inventory = [
  {
    sku: 'LAP-001',
    name: 'Laptop',
    category: 'Computers',
    stock: 12,
    price: 65000
  },
  {
    sku: 'MON-001',
    name: 'Monitor',
    category: 'Accessories',
    stock: 8,
    price: 25000
  },
  {
    sku: 'KEY-001',
    name: 'Keyboard',
    category: 'Accessories',
    stock: 20,
    price: 2500
  },
  {
    sku: 'MOU-001',
    name: 'Mouse',
    category: 'Accessories',
    stock: 15,
    price: 1500
  }
];

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const query = typeof req.query.q === 'string'
    ? req.query.q.toLowerCase()
    : '';

  const results = query
    ? inventory.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      )
    : inventory;

  return res.status(200).json({
    success: true,
    query,
    count: results.length,
    results
  });
}
