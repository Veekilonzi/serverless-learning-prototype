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
      error: 'Queue environment variables are not configured'
    });
  }

  try {
    // Remove the oldest print request from the queue.
    const queueResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        'RPOP',
        'print-queue'
      ])
    });

    const queueData = await queueResponse.json();

    if (!queueData.result) {
      return res.status(200).json({
        success: true,
        message: 'No print requests in queue'
      });
    }

    const printRequest = JSON.parse(queueData.result);

    // Simulate the vendor completing the print job,
    // then call our webhook asynchronously.
    const host = process.env.VERCEL_URL || req.headers.host;

    if (!host) {
      throw new Error('Unable to determine application URL');
    }

    const webhookUrl = `https://${host}/api/print-webhook`;

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        attendeeId: printRequest.attendeeId,
        requestId: printRequest.requestId,
        status: 'PRINTED'
      })
    });

    if (!webhookResponse.ok) {
      throw new Error('Printer webhook failed');
    }

    return res.status(200).json({
      success: true,
      message: 'Print request processed',
      attendeeId: printRequest.attendeeId,
      requestId: printRequest.requestId,
      printerStatus: 'PRINTED'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process print queue'
    });
  }
}
