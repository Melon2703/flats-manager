import { NextResponse } from 'next/server';
import { validateTelegramInitData, isAuthorizedUser } from '@/lib/security';
import { db } from '@/lib/db';

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

export async function GET(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const flatId = searchParams.get('flat_id') || undefined;

  const tenancies = await db.getTenancies(flatId);
  return NextResponse.json(tenancies);
}

export async function POST(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const tenancy = await db.createTenancy(body);
  return NextResponse.json(tenancy);
}
