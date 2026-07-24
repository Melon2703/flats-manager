import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { calculateSettlement, generateSettlementSummarySheet } from '@/lib/settlement';

export async function POST(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const summary = calculateSettlement(body);

  const formattedSheet = generateSettlementSummarySheet(
    summary,
    body.tenant_name || 'Tenant',
    body.flat_title || 'Flat'
  );

  return NextResponse.json({
    ...summary,
    formatted_summary_sheet: formattedSheet,
  });
}
