import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenancyId = searchParams.get('tenancy_id') || undefined;
  const flatId = searchParams.get('flat_id') || undefined;
  const month = searchParams.get('month') || undefined;

  const expectedPayments = await db.getExpectedPayments(tenancyId, month, flatId);

  // Enrich expected payments with tenancy info, flat info, payment records
  const enrichedPayments = await Promise.all(
    expectedPayments.map(async (payment) => {
      const tenancy = await db.getTenancy(payment.tenancy_id);
      const flat = tenancy ? await db.getFlat(tenancy.flat_id) : null;
      const records = await db.getPaymentRecords(payment.id);
      const paidAmount = records.reduce((sum, r) => sum + r.amount, 0);

      return {
        ...payment,
        tenant_name: tenancy?.tenant_name || 'Unknown',
        flat_title: flat?.title || 'Unknown Flat',
        flat_id: tenancy?.flat_id || null,
        paid_amount: paidAmount,
        records,
      };
    })
  );

  return NextResponse.json(enrichedPayments);
}

export async function POST(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.expected_payment_id || body.amount === undefined) {
      return NextResponse.json({ error: 'expected_payment_id and amount are required' }, { status: 400 });
    }

    const record = await db.createPaymentRecord(body);
    const updatedExpected = await db.getExpectedPayment(body.expected_payment_id);

    return NextResponse.json({ record, expected_payment: updatedExpected }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  if (!(await authenticateTWA(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const updated = await db.updateExpectedPayment(id, { status });
    if (!updated) {
      return NextResponse.json({ error: 'Expected payment not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
