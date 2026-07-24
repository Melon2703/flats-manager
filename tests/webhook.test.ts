import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../app/api/telegram/webhook/route';
import { db } from '../lib/db';

describe('Telegram Webhook API Seam (/api/telegram/webhook)', () => {
  beforeEach(async () => {
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456, 789012';
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    await db.reset();
  });

  it('silently rejects updates from unauthorized Telegram users', async () => {
    const payload = {
      update_id: 1,
      message: {
        message_id: 100,
        from: { id: 999999, first_name: 'Attacker' },
        chat: { id: 999999 },
        text: '/start',
      },
    };

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ignored).toBe(true);
  });

  it('handles /start command from authorized user', async () => {
    const payload = {
      update_id: 2,
      message: {
        message_id: 101,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        text: '/start',
      },
    };

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('handles inline callback query [record_paid:<payment_id>] and updates payment status', async () => {
    const flat = await db.createFlat({ title: 'Flat 101', address: 'Lenina 1', status: 'active' });
    const tenancy = await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Ivan',
      tenant_contact: '+123456789',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 45000,
      deposit_amount: 45000,
      due_day: 5,
      status: 'active',
    });
    const payment = await db.createExpectedPayment({
      tenancy_id: tenancy.id,
      due_date: '2026-07-05',
      amount: 45000,
      status: 'Overdue',
    });

    const payload = {
      update_id: 3,
      callback_query: {
        id: 'cb_123',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 200, chat: { id: 123456 } },
        data: `record_paid:${payment.id}`,
      },
    };

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const updatedPayment = await db.getExpectedPayment(payment.id);
    expect(updatedPayment?.status).toBe('Paid');
  });

  it('handles inline callback query [copy_reminder:<payment_id>] and responds with English reminder draft', async () => {
    const flat = await db.createFlat({ title: 'Flat 102', address: 'Lenina 2', status: 'active' });
    const tenancy = await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Elena',
      tenant_contact: '+987654321',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 50000,
      deposit_amount: 50000,
      due_day: 10,
      status: 'active',
    });
    const payment = await db.createExpectedPayment({
      tenancy_id: tenancy.id,
      due_date: '2026-07-10',
      amount: 50000,
      status: 'Overdue',
    });

    const payload = {
      update_id: 4,
      callback_query: {
        id: 'cb_124',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 201, chat: { id: 123456 } },
        data: `copy_reminder:${payment.id}:en`,
      },
    };

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reminder_draft).toContain('Elena');
    expect(body.reminder_draft).toContain('Flat 102');
  });

  it('handles inline callback query [copy_reminder:<payment_id>:ru] and responds with Russian reminder draft', async () => {
    const flat = await db.createFlat({ title: 'Квартира 103', address: 'Ленина 3', status: 'active' });
    const tenancy = await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Павел',
      tenant_contact: '+79001234567',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 55000,
      deposit_amount: 55000,
      due_day: 10,
      status: 'active',
    });
    const payment = await db.createExpectedPayment({
      tenancy_id: tenancy.id,
      due_date: '2026-07-10',
      amount: 55000,
      status: 'Overdue',
    });

    const payload = {
      update_id: 6,
      callback_query: {
        id: 'cb_125',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 202, chat: { id: 123456 } },
        data: `copy_reminder:${payment.id}:ru`,
      },
    };

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reminder_draft).toContain('Павел');
    expect(body.reminder_draft).toContain('Здравствуйте');
    expect(body.reminder_draft).toContain('Квартира 103');
  });

  it('handles /reminders command from authorized user and sends due rent alerts', async () => {
    const flat = await db.createFlat({ title: 'Flat 303', address: 'Sadovaya 5', status: 'active' });
    await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Maxim',
      tenant_contact: '+79991112233',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 55000,
      deposit_amount: 55000,
      due_day: 15,
      status: 'active',
    });

    const payload = {
      update_id: 5,
      message: {
        message_id: 102,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        text: '/reminders',
      },
    };

    const req = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(1);
  });
});

describe('Reminders Cron API Seam (/api/cron/reminders)', () => {
  beforeEach(async () => {
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    await db.reset();
  });

  it('triggers sendDueRentAlerts via cron endpoint', async () => {
    const { GET } = await import('../app/api/cron/reminders/route');
    const flat = await db.createFlat({ title: 'Flat 404', address: 'Tverskaya 12', status: 'active' });
    await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Olga',
      tenant_contact: '+79998887766',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 70000,
      deposit_amount: 70000,
      due_day: 1,
      status: 'active',
    });

    const req = new Request('http://localhost:3000/api/cron/reminders', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.alerts_sent_count).toBe(1);
  });
});
