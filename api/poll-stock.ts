import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;

console.log({
  hasRedisUrl: !!redisUrl,
  hasRedisToken: !!redisToken
});

if (!redisUrl || !redisToken) {
  return res.status(500).json({
    success: false,
    error: 'Redis environment variables are not configured'
  });
}
}
const redisToken = process.env.KV_REST_API_TOKEN;

console.log({
  hasRedisUrl: !!redisUrl,
  hasRedisToken: !!redisToken
});

if (!redisUrl || !redisToken) {
  return res.status(500).json({
    success: false,
    error: 'Redis environment variables are not configured'
  });
}
  }

  try {
    const host = process.env.VERCEL_URL || req.headers.host;

    if (!host) {
      throw new Error('Unable to determine application URL');
    }

    const warehouseUrl = `https://${host}/api/warehouse`;

    const warehouseResponse = await fetch(warehouseUrl);

    if (!warehouseResponse.ok) {
      throw new Error(
        `Warehouse API returned ${warehouseResponse.status}`
      );
    }

    const warehouseData = await warehouseResponse.json();

    const redisResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        'SET',
        'inventory:stock',
        JSON.stringify(warehouseData.stock),
        'EX',
        '600'
      ])
    });

    if (!redisResponse.ok) {
      throw new Error('Failed to update Redis cache');
    }

    return res.status(200).json({
      success: true,
      message: 'Stock successfully polled and cached',
      cachedItems: warehouseData.stock.length,
      polledAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to poll warehouse and update cache'
    });
  }
}
