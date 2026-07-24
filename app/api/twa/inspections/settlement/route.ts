import { NextResponse } from 'next/server';
import { validateTelegramInitData, isAuthorizedUser } from '@/lib/security';
import { calculateSettlement, generateSettlementSummarySheet } from '@/lib/settlement';

function authenticateTWA(req: Request): boolean {
  const initData = req.headers.get('x-telegram-init-data') || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!initData) return false;
  if (!validateTelegramInitData(initData, botToken)) return false;

  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (!isAuthorizedUser(user.id)) return false;
    }
  } catch {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const summary = calculateSettlement(body);

  const formattedSheet = generateSettlementSummarySheet(
    summary,
    body.tenant_name || 'Tenant',
    body.flat_title || 'Flat'
  );

  return NextResponse.json({
    ...summary,
    formatted_summary_sheet: formattedSheet,
  });
}
