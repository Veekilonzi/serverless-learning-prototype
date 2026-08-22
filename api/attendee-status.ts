import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;

  if (!redisUrl || !redisToken) {
    return res.status(500).json({
      success: false,
      error: 'Storage environment variables are not configured'
    });
  }

  try {
    const attendeeId = req.query.attendeeId;

    if (!attendeeId || Array.isArray(attendeeId)) {
      return res.status(400).json({
        success: false,
        error: 'attendeeId is required'
      });
    }

    const response = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        'GET',
        `attendee:${attendeeId}`
      ])
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      attendeeId,
      status: data.result || 'NOT_FOUND'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendee status'
    });
  }
}
