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

    // Atomically claim this attendee's check-in.
    // NX means the value is only created if the key does not already exist.
    const claimResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        'SET',
        key,
        'PENDING',
        'NX'
      ])
    });

    const claimData = await claimResponse.json();

    // Someone already scanned this attendee.
    if (claimData.result !== 'OK') {
      const existingResponse = await fetch(redisUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', key])
      });

      const existingData = await existingResponse.json();

      return res.status(200).json({
        success: true,
        message: 'Duplicate scan - no second badge requested',
        attendeeId,
        status: existingData.result || 'PENDING',
        duplicate: true
      });
    }

    const requestId = `${attendeeId}-${Date.now()}`;

    // Publish the badge-print request to the asynchronous queue.
    const queueResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        'LPUSH',
        'print-queue',
        JSON.stringify({
          requestId,
          attendeeId,
          type: 'PRINT_BADGE',
          createdAt: new Date().toISOString()
        })
      ])
    });

    if (!queueResponse.ok) {
      // Remove PENDING if the queue operation failed.
      await fetch(redisUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['DEL', key])
      });

      throw new Error('Failed to publish print request');
    }

    return res.status(202).json({
      success: true,
      message: 'Badge print request queued',
      attendeeId,
      requestId,
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
