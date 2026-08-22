import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
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
    const { attendeeId, requestId, status } = req.body;

    if (!attendeeId || !requestId || !status) {
      return res.status(400).json({
        success: false,
        error: 'attendeeId, requestId and status are required'
      });
    }

    const key = `attendee:${attendeeId}`;

    const currentResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', key])
    });

    const currentData = await currentResponse.json();

    if (currentData.result !== 'PENDING') {
      return res.status(200).json({
        success: true,
        message: 'Callback ignored - attendee is not pending',
        attendeeId,
        status: currentData.result || 'UNKNOWN'
      });
    }

    if (status === 'PRINTED') {
      await fetch(redisUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', key, 'CHECKED_IN'])
      });

      return res.status(200).json({
        success: true,
        message: 'Badge printing confirmed',
        attendeeId,
        requestId,
        status: 'CHECKED_IN'
      });
    }

    if (status === 'FAILED') {
      await fetch(redisUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', key, 'PRINT_FAILED'])
      });

      return res.status(200).json({
        success: true,
        message: 'Badge printing failed',
        attendeeId,
        requestId,
        status: 'PRINT_FAILED'
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Unknown print status'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process printer callback'
    });
  }
}
