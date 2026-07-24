import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const flat = await db.getFlat(id);

  if (!flat) {
    return NextResponse.json({ error: 'Flat not found' }, { status: 404 });
  }

  return NextResponse.json(flat);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await db.getFlat(id);
  if (!existing) {
    return NextResponse.json({ error: 'Flat not found' }, { status: 404 });
  }

  const updated = await db.updateFlat(id, body);
  return NextResponse.json(updated);
}
