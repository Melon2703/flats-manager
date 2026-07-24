import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const flats = await db.getFlats();
  return NextResponse.json(flats);
}

export async function POST(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const flat = await db.createFlat(body);
    return NextResponse.json(flat, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}
