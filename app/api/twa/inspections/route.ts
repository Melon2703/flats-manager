import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenancyId = searchParams.get('tenancy_id') || '';

  const checklists = await db.getInspectionChecklists(tenancyId);
  return NextResponse.json(checklists);
}

export async function POST(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const checklist = await db.createInspectionChecklist(body);
  return NextResponse.json(checklist);
}
