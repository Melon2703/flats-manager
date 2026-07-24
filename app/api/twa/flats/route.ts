import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { db } from '@/lib/db';

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
