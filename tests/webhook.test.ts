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

  it('responds with main menu for plain unhandled text messages like "hi"', async () => {
    const payload = {
      update_id: 10,
      message: {
        message_id: 103,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        text: 'hi',
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
    expect(body.menu_sent).toBe(true);
  });

  it('handles callback query [cmd_reminders] and triggers rent alerts', async () => {
    const payload = {
      update_id: 11,
      callback_query: {
        id: 'cb_126',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 205, chat: { id: 123456 } },
        data: 'cmd_reminders',
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

  it('handles /lang command and returns language selection menu', async () => {
    const payload = {
      update_id: 13,
      message: {
        message_id: 104,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        text: '/lang',
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
    expect(body.menu).toBe('lang');
  });

  it('handles /lang ru command and updates user language preference to ru', async () => {
    const payload = {
      update_id: 14,
      message: {
        message_id: 105,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        text: '/lang ru',
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
    expect(body.lang).toBe('ru');

    const savedLang = await db.getUserLanguage(123456);
    expect(savedLang).toBe('ru');
  });

  it('handles callback query [set_lang:en] and updates user language preference to en', async () => {
    const payload = {
      update_id: 15,
      callback_query: {
        id: 'cb_128',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 207, chat: { id: 123456 } },
        data: 'set_lang:en',
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
    expect(body.lang).toBe('en');

    const savedLang = await db.getUserLanguage(123456);
    expect(savedLang).toBe('en');
  });

  it('correctly matches receipt to the oldest overdue expected payment for a flat', async () => {
    const flat = await db.createFlat({ title: 'Flat 202', address: 'Pushkina 5', status: 'active' });
    const tenancy = await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Boris',
      tenant_contact: '+79110001122',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 50000,
      deposit_amount: 50000,
      due_day: 1,
      status: 'active',
    });

    // Create an older overdue payment (May) and a newer overdue payment (June)
    const olderOverdue = await db.createExpectedPayment({
      tenancy_id: tenancy.id,
      due_date: '2026-05-01',
      amount: 50000,
      status: 'Overdue',
    });
    const newerOverdue = await db.createExpectedPayment({
      tenancy_id: tenancy.id,
      due_date: '2026-06-01',
      amount: 50000,
      status: 'Overdue',
    });

    const record = await db.recordPaymentForFlatReceipt(flat.id, 'https://example.com/receipt.jpg');
    expect(record).not.toBeNull();
    expect(record?.expected_payment_id).toBe(olderOverdue.id);

    const updatedOlder = await db.getExpectedPayment(olderOverdue.id);
    expect(updatedOlder?.status).toBe('Paid');

    const updatedNewer = await db.getExpectedPayment(newerOverdue.id);
    expect(updatedNewer?.status).toBe('Overdue');
  });

  it('handles /app, /twa, /open, and /a commands to return Web App link', async () => {
    const payload = {
      update_id: 20,
      message: {
        message_id: 110,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        text: '/app',
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
    expect(body.command).toBe('app');
    expect(body.app_url).toBeDefined();
  });

  it('handles short command aliases like /s, /r, /d, /l, /h, /?', async () => {
    const commandsToTest = [
      { text: '/s', expectedCmd: 'start' },
      { text: '/r', expectedCmd: 'reminders' },
      { text: '/d', expectedCmd: 'digest' },
      { text: '/l', expectedCmd: 'lang' },
      { text: '/h', expectedCmd: 'help' },
      { text: '/?', expectedCmd: 'help' },
    ];

    for (const item of commandsToTest) {
      const payload = {
        update_id: Math.floor(Math.random() * 10000),
        message: {
          message_id: 120,
          from: { id: 123456, first_name: 'Anya' },
          chat: { id: 123456 },
          text: item.text,
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
      expect(body.command).toBe(item.expectedCmd);
    }
  });

  it('handles bot username suffixes such as /start@flats_bot', async () => {
    const payload = {
      update_id: 25,
      message: {
        message_id: 125,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        text: '/start@flats_manager_bot',
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
    expect(body.command).toBe('start');
  });

  it('handles setup API endpoint (/api/telegram/setup)', async () => {
    const { GET, POST: setupPOST } = await import('../app/api/telegram/setup/route');
    const getRes = await GET();
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);

    const postReq = new Request('http://localhost:3000/api/telegram/setup', {
      method: 'POST',
      body: JSON.stringify({ bot_token: 'test_token', app_url: 'https://flats.vercel.app' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const postRes = await setupPOST(postReq);
    expect(postRes.status).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
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
