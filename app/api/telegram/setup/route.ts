import { NextResponse } from 'next/server';
import { setupTelegramBot } from '@/lib/telegram';

export async function GET() {
  const result = await setupTelegramBot();
  return NextResponse.json({ success: true, setup: result });
}

export async function POST(req: Request) {
  let botToken: string | undefined;
  let appUrl: string | undefined;
  try {
    const body = await req.json();
    botToken = body.bot_token;
    appUrl = body.app_url;
  } catch {}

  const result = await setupTelegramBot(botToken, appUrl);
  return NextResponse.json({ success: true, setup: result });
}
