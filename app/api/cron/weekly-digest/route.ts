import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    // Verify Vercel Cron Secret if set
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Cron Trigger' }, { status: 401 });
    }

    const flats = await db.getFlats();
    const tenancies = await db.getTenancies();
    const expectedPayments = await db.getExpectedPayments();

    const overduePayments = expectedPayments.filter((p) => p.status === 'Overdue');
    const paidPayments = expectedPayments.filter((p) => p.status === 'Paid');

    const totalCollected = paidPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const activeTenanciesCount = tenancies.filter((t) => t.status === 'active').length;
    const vacantFlatsCount = flats.filter((f) => f.status === 'vacant').length;

    let digestText = `📊 **WEEKLY SNAPSHOT DIGEST**\n\n`;
    digestText += `🏡 Total Managed Flats: ${flats.length}\n`;
    digestText += `🔑 Active Tenancies: ${activeTenanciesCount}\n`;
    digestText += `🚪 Vacant Flats: ${vacantFlatsCount}\n\n`;
    digestText += `💰 Total Income Collected: ${totalCollected.toLocaleString()} RUB\n`;
    digestText += `⚠️ Overdue Rent Obligations: ${overduePayments.length}\n\n`;

    if (overduePayments.length > 0) {
      digestText += `**Overdue Rent Action Items**:\n`;
      for (const p of overduePayments) {
        const t = tenancies.find((ten) => ten.id === p.tenancy_id);
        digestText += `- ${t?.tenant_name || 'Tenant'}: ${p.amount.toLocaleString()} RUB (Due ${p.due_date})\n`;
      }
    } else {
      digestText += `✨ All rent payments are fully up-to-date!\n`;
    }

    // Send to allowed admin Telegram user
    const allowedUserIds = (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
    if (allowedUserIds.length > 0) {
      await sendTelegramMessage(allowedUserIds[0], digestText);
    }

    return NextResponse.json({ success: true, digestText });
  } catch (error) {
    console.error('Error generating Weekly Digest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
