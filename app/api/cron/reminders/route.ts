import { NextResponse } from 'next/server';
import { sendDueRentAlerts } from '@/lib/reminders';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Cron Trigger' }, { status: 401 });
    }

    const alerts = await sendDueRentAlerts();

    return NextResponse.json({
      success: true,
      alerts_sent_count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error('Error sending due rent alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
