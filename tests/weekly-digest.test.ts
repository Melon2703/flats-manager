import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { compileWeeklyDigest, sendWeeklyDigest } from '../lib/weekly-digest';
import { GET } from '../app/api/cron/weekly-digest/route';

describe('Weekly Snapshot Digest Engine Seam', () => {
  beforeEach(async () => {
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    process.env.CRON_SECRET = 'test_cron_secret';
    await db.reset();
  });

  it('compiles weekly snapshot digest report with overdue payments, upcoming rent due (7d), upcoming move-in/outs (30d), missing checklists, and revenue', async () => {
    const refDate = new Date();
    const todayStr = refDate.toISOString().split('T')[0];
    const yearMonth = todayStr.slice(0, 7);

    // Calculate dates relative to today
    const pastDueDate = 5; // e.g. July 5 (Overdue)
    const paidDueDate = 10; // e.g. July 10 (Paid)

    // Flat 1 - Active with Overdue payment (due 5th) & Missing move-in checklist
    const flat1 = await db.createFlat({ title: 'Flat 101', address: 'Main St 1', status: 'active' });
    const tenancy1 = await db.createTenancy({
      flat_id: flat1.id,
      tenant_name: 'Alex',
      tenant_contact: '+79991110011',
      start_date: `${yearMonth}-01`,
      end_date: '2026-12-31',
      rent_amount: 50000,
      deposit_amount: 50000,
      due_day: pastDueDate,
      status: 'active',
    });

    // Flat 2 - Active with Paid payment in current month & Move-in checklist completed
    const flat2 = await db.createFlat({ title: 'Flat 102', address: 'Main St 2', status: 'active' });
    const tenancy2 = await db.createTenancy({
      flat_id: flat2.id,
      tenant_name: 'Boris',
      tenant_contact: '+79992220022',
      start_date: `${yearMonth}-01`,
      end_date: '2026-11-30',
      rent_amount: 60000,
      deposit_amount: 60000,
      due_day: paidDueDate,
      status: 'active',
    });
    const payments2 = await db.getExpectedPayments(tenancy2.id, undefined, undefined, false);
    await db.createPaymentRecord({
      expected_payment_id: payments2[0].id,
      amount: 60000,
      payment_method: 'Bank Transfer',
      paid_at: `${yearMonth}-10T12:00:00Z`,
    });
    await db.createInspectionChecklist({
      tenancy_id: tenancy2.id,
      inspection_type: 'move_in',
      items_json: { keys: 'ok' },
    });

    // Flat 3 - Active with Rent Due in 3 days & Move-out in 15 days (within 30d window)
    const futureRentDate = new Date(refDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const moveOutDate = new Date(refDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    const moveOutDateStr = moveOutDate.toISOString().split('T')[0];

    const flat3 = await db.createFlat({ title: 'Flat 103', address: 'Main St 3', status: 'active' });
    const tenancy3 = await db.createTenancy({
      flat_id: flat3.id,
      tenant_name: 'Chloe',
      tenant_contact: '+79993330033',
      start_date: `${yearMonth}-01`,
      end_date: moveOutDateStr,
      rent_amount: 40000,
      deposit_amount: 40000,
      due_day: futureRentDate.getDate(),
      status: 'active',
    });
    await db.createInspectionChecklist({
      tenancy_id: tenancy3.id,
      inspection_type: 'move_in',
      items_json: { keys: 'ok' },
    });

    // Tenancy 4 - Upcoming move-in starting in 10 days (within 30d window)
    const moveInDate = new Date(refDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const moveInDateStr = moveInDate.toISOString().split('T')[0];

    const flat4 = await db.createFlat({ title: 'Flat 104', address: 'Main St 4', status: 'vacant' });
    const tenancy4 = await db.createTenancy({
      flat_id: flat4.id,
      tenant_name: 'Denis',
      tenant_contact: '+79994440044',
      start_date: moveInDateStr,
      end_date: '2027-07-31',
      rent_amount: 70000,
      deposit_amount: 70000,
      due_day: futureRentDate.getDate(),
      status: 'active',
    });
    const payments4 = await db.getExpectedPayments(tenancy4.id, undefined, undefined, false);
    if (payments4.length > 0) {
      await db.createPaymentRecord({
        expected_payment_id: payments4[0].id,
        amount: 70000,
        payment_method: 'Bank Transfer',
        paid_at: `${todayStr}T10:00:00Z`,
      });
    }

    const digest = await compileWeeklyDigest(refDate);

    expect(digest.metrics.totalFlatsCount).toBe(4);
    expect(digest.metrics.monthlyRevenue).toBeGreaterThanOrEqual(60000);
    expect(digest.metrics.overdueCount).toBe(1);
    expect(digest.metrics.upcomingPaymentsCount).toBe(1);
    expect(digest.metrics.upcomingTransitionsCount).toBe(2); // Chloe move-out + Denis move-in
    expect(digest.metrics.missingDocsCount).toBe(2); // tenancy1 & tenancy4 missing move_in checklist

    // Verify text compilation
    expect(digest.digestText).toContain('WEEKLY SNAPSHOT DIGEST');
    expect(digest.digestText).toContain('Alex (Flat 101)');
    expect(digest.digestText).toContain('Chloe (Flat 103)');
    expect(digest.digestText).toContain('Move-out: Chloe');
    expect(digest.digestText).toContain('Move-in: Denis');
    expect(digest.digestText).toContain('Missing Move-In Checklist');

    // Verify 1-tap [📋 Draft Reminder] inline buttons for overdue flat
    const overduePaymentId = (await db.getExpectedPayments(tenancy1.id, undefined, undefined, false))[0].id;
    expect(digest.buttons.length).toBe(1);
    expect(digest.buttons[0][0].text).toContain('Draft Reminder');
    expect(digest.buttons[0][0].callback_data).toBe(`copy_reminder:${overduePaymentId}:ru`);
  });

  it('executes silently without errors when no flats are overdue', async () => {
    const flat = await db.createFlat({ title: 'Flat 201', address: 'Park St 1', status: 'active' });
    const tenancy = await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Elena',
      tenant_contact: '+79995550055',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '2026-12-31',
      rent_amount: 45000,
      deposit_amount: 45000,
      due_day: new Date().getDate(),
      status: 'active',
    });
    const payments = await db.getExpectedPayments(tenancy.id, undefined, undefined, false);
    await db.createPaymentRecord({
      expected_payment_id: payments[0].id,
      amount: 45000,
      payment_method: 'Bank Transfer',
      paid_at: new Date().toISOString(),
    });

    const digest = await sendWeeklyDigest('123456');

    expect(digest.metrics.overdueCount).toBe(0);
    expect(digest.buttons.length).toBe(0);
    expect(digest.digestText).toContain('None - All clear!');
  });

  it('rejects unauthorized cron trigger requests to GET /api/cron/weekly-digest', async () => {
    const req = new Request('http://localhost:3000/api/cron/weekly-digest', {
      method: 'GET',
      headers: { authorization: 'Bearer wrong_token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('handles authorized GET /api/cron/weekly-digest requests successfully', async () => {
    const req = new Request('http://localhost:3000/api/cron/weekly-digest', {
      method: 'GET',
      headers: { authorization: 'Bearer test_cron_secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics).toBeDefined();
    expect(body.digestText).toContain('WEEKLY SNAPSHOT DIGEST');
  });
});
