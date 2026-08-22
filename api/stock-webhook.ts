import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { stock } = req.body;

    if (!Array.isArray(stock)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stock payload'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stock webhook received',
      receivedItems: stock.length,
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process stock webhook'
    });
  }
}
