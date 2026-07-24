import { describe, it, expect } from 'vitest';
import { generateReminderDraft } from '../lib/reminders';

describe('Reminder Draft Generator Seam', () => {
  it('generates polite, customized reminder drafts for tenants', () => {
    const draft = generateReminderDraft({
      tenantName: 'Ivan',
      flatTitle: 'Flat 101',
      amount: 45000,
      dueDate: '2026-07-25',
      status: 'Due Today',
    });

    expect(draft).toContain('Ivan');
    expect(draft).toContain('Flat 101');
    expect(draft).toContain('45,000');
    expect(draft).toContain('2026-07-25');
  });

  it('generates Russian reminder draft when lang is set to ru', () => {
    const draft = generateReminderDraft({
      tenantName: 'Иван',
      flatTitle: 'Квартира 101',
      amount: 45000,
      dueDate: '2026-07-25',
      status: 'Overdue',
      lang: 'ru',
    });

    expect(draft).toContain('Иван');
    expect(draft).toContain('Квартира 101');
    expect(draft).toContain('45,000');
    expect(draft).toContain('2026-07-25');
  });
});

describe('Notification Engine Seam (sendDueRentAlerts)', () => {
  it('sends Telegram alert when rent is due or overdue with inline keyboard buttons', async () => {
    const { db } = await import('../lib/db');
    const { sendDueRentAlerts } = await import('../lib/reminders');

    await db.reset();
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';

    const flat = await db.createFlat({ title: 'Flat 202', address: 'Pushkina 10', status: 'active' });
    const tenancy = await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Dmitry',
      tenant_contact: '+79990001122',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 60000,
      deposit_amount: 60000,
      due_day: 5,
      status: 'active',
    });
    const payment = await db.createExpectedPayment({
      tenancy_id: tenancy.id,
      due_date: '2026-07-05',
      amount: 60000,
      status: 'Overdue',
    });

    const alerts = await sendDueRentAlerts('123456');
    expect(alerts.length).toBeGreaterThan(0);

    const alert = alerts.find((a) => a.paymentId === payment.id);
    expect(alert).toBeDefined();
    expect(alert?.text).toContain('Dmitry');
    expect(alert?.text).toContain('Flat 202');
    expect(alert?.text).toContain('60,000');
    expect(alert?.buttons).toEqual([
      [
        { text: '✅ Record as Paid', callback_data: `record_paid:${payment.id}` },
        { text: '📋 Copy Draft (RU)', callback_data: `copy_reminder:${payment.id}:ru` },
        { text: '📋 Copy Draft (EN)', callback_data: `copy_reminder:${payment.id}:en` },
      ],
    ]);
  });
});


