import type { VercelRequest, VercelResponse } from '@vercel/node';

const attendees: Record<string, {
  status: 'PENDING' | 'CHECKED_IN';
}> = {};

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { attendeeId } = req.body;

  if (!attendeeId) {
    return res.status(400).json({
      success: false,
      error: 'attendeeId is required'
    });
  }

  const existing = attendees[attendeeId];

  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Attendee already checked in or has a pending badge',
      attendeeId,
      status: existing.status,
      duplicate: true
    });
  }

  attendees[attendeeId] = {
    status: 'PENDING'
  };

  return res.status(202).json({
    success: true,
    message: 'Badge print request submitted',
    attendeeId,
    status: 'PENDING',
    duplicate: false
  });
}
