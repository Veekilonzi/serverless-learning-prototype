import type { VercelRequest, VercelResponse } from '@vercel/node';

const warehouseStock = [
  {
    sku: 'LAP-001',
    name: 'Laptop',
    stock: 12
  },
  {
    sku: 'MON-001',
    name: 'Monitor',
    stock: 8
  },
  {
    sku: 'KEY-001',
    name: 'Keyboard',
    stock: 20
  },
  {
    sku: 'MOU-001',
    name: 'Mouse',
    stock: 15
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

  return res.status(200).json({
    success: true,
    source: 'warehouse',
    updatedAt: new Date().toISOString(),
    stock: warehouseStock
  });
}
