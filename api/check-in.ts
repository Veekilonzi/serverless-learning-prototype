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
    const { attendeeId } = req.body;

    if (!attendeeId) {
      return res.status(400).json({
        success: false,
        error: 'attendeeId is required'
      });
    }

    const key = `attendee:${attendeeId}`;

    // Check whether this attendee already has a pending or completed check-in.
    const existingResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', key])
    });

    const existingData = await existingResponse.json();

    if (existingData.result) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate scan - no second badge requested',
        attendeeId,
        status: existingData.result,
        duplicate: true
      });
    }

    // Store PENDING before publishing the print request.
    await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        'SET',
        key,
        'PENDING'
      ])
    });

    return res.status(202).json({
      success: true,
      message: 'Badge print request created',
      attendeeId,
      status: 'PENDING',
      duplicate: false
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process check-in'
    });
  }
}
