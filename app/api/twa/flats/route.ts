import { NextResponse } from 'next/server';
import { validateTelegramInitData, isAuthorizedUser } from '@/lib/security';
import { db } from '@/lib/db';

function authenticateTWA(req: Request): boolean {
  const initData = req.headers.get('x-telegram-init-data') || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!initData) return false;

  // Validate HMAC
  const isValid = validateTelegramInitData(initData, botToken);
  if (!isValid) return false;

  // Check user whitelist
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

  const flats = await db.getFlats();
  return NextResponse.json(flats);
}

export async function POST(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const flat = await db.createFlat(body);
  return NextResponse.json(flat);
}
