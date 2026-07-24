import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');
  const targetDate = dateParam ? new Date(dateParam) : new Date();

  const generated = await db.generateMonthlyExpectedPayments(targetDate);

  return NextResponse.json({
    success: true,
    generated_count: generated.length,
    generated_payments: generated,
  });
}

export async function POST(req: Request) {
  return GET(req);
}
