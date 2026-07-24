import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenancyId = searchParams.get('tenancy_id') || undefined;

  const payments = await db.getExpectedPayments(tenancyId);
  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const record = await db.createPaymentRecord(body);
  return NextResponse.json(record);
}
