import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const flatId = searchParams.get('flat_id') || undefined;

  const tenancies = await db.getTenancies(flatId);
  return NextResponse.json(tenancies);
}

export async function POST(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.flat_id || !body.tenant_name) {
      return NextResponse.json({ error: 'flat_id and tenant_name are required' }, { status: 400 });
    }

    const tenancy = await db.createTenancy(body);
    return NextResponse.json(tenancy, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}
