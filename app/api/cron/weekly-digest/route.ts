import { NextResponse } from 'next/server';
import { sendWeeklyDigest } from '@/lib/weekly-digest';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Cron Trigger' }, { status: 401 });
    }

    const digest = await sendWeeklyDigest();

    return NextResponse.json({
      success: true,
      digestText: digest.digestText,
      buttons: digest.buttons,
      metrics: digest.metrics,
    });
  } catch (error) {
    console.error('Error generating Weekly Digest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
