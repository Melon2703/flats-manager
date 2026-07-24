import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getFlats, POST as createFlat } from '../app/api/twa/flats/route';
import { GET as getTenancies, POST as createTenancy } from '../app/api/twa/tenancies/route';
import { GET as getPayments, POST as recordPayment } from '../app/api/twa/payments/route';
import { POST as calculateSettlementApi } from '../app/api/twa/inspections/settlement/route';
import { createTestInitData } from './helpers/auth-test-utils';
import { db } from '../lib/db';

const botToken = 'test_bot_token';

describe('TWA API Endpoints Seam (/api/twa/*)', () => {
  beforeEach(async () => {
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';
    await db.reset();
  });

  const getValidHeaders = () => {
    const initDataStr = createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    return {
      'x-telegram-init-data': initDataStr,
      'Content-Type': 'application/json',
    };
  };

  it('flats endpoint creates and lists flats for authorized user', async () => {
    // Create flat
    const createReq = new Request('http://localhost:3000/api/twa/flats', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({ title: 'Flat 301', address: 'Pushkina 12', status: 'active' }),
    });

    const createRes = await createFlat(createReq);
    expect(createRes.status).toBe(200);
    const createdFlat = await createRes.json();
    expect(createdFlat.title).toBe('Flat 301');

    // List flats
    const listReq = new Request('http://localhost:3000/api/twa/flats', {
      method: 'GET',
      headers: getValidHeaders(),
    });
    const listRes = await getFlats(listReq);
    expect(listRes.status).toBe(200);
    const flats = await listRes.json();
    expect(flats.length).toBe(1);
    expect(flats[0].title).toBe('Flat 301');
  });

  it('rejects TWA requests with invalid or missing initData', async () => {
    const req = new Request('http://localhost:3000/api/twa/flats', {
      method: 'GET',
      headers: { 'x-telegram-init-data': 'invalid_data' },
    });

    const res = await getFlats(req);
    expect(res.status).toBe(401);
  });

  it('creates tenancy and records payment', async () => {
    const flat = await db.createFlat({ title: 'Flat 105', address: 'Lenina 5', status: 'active' });
    
    // Create Tenancy
    const tenancyReq = new Request('http://localhost:3000/api/twa/tenancies', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({
        flat_id: flat.id,
        tenant_name: 'Alex',
        tenant_contact: '+111222333',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        rent_amount: 40000,
        deposit_amount: 40000,
        due_day: 1,
        status: 'active',
      }),
    });
    const tenancyRes = await createTenancy(tenancyReq);
    expect(tenancyRes.status).toBe(200);
    const tenancy = await tenancyRes.json();

    // Check auto-generated expected payment
    const paymentsReq = new Request(`http://localhost:3000/api/twa/payments?tenancy_id=${tenancy.id}`, {
      method: 'GET',
      headers: getValidHeaders(),
    });
    const paymentsRes = await getPayments(paymentsReq);
    const payments = await paymentsRes.json();
    expect(payments.length).toBeGreaterThan(0);

    // Record payment
    const paymentRecordReq = new Request('http://localhost:3000/api/twa/payments', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({
        expected_payment_id: payments[0].id,
        amount: 40000,
        payment_method: 'Bank Transfer',
        receipt_url: 'http://example.com/receipt.jpg',
      }),
    });

    const recordRes = await recordPayment(paymentRecordReq);
    expect(recordRes.status).toBe(200);
    
    const updatedPaymentsReq = new Request(`http://localhost:3000/api/twa/payments?tenancy_id=${tenancy.id}`, {
      method: 'GET',
      headers: getValidHeaders(),
    });
    const updatedPaymentsRes = await getPayments(updatedPaymentsReq);
    const updatedPayments = await updatedPaymentsRes.json();
    expect(updatedPayments[0].status).toBe('Paid');
  });

  it('calculates final settlement via TWA settlement API endpoint', async () => {
    const req = new Request('http://localhost:3000/api/twa/inspections/settlement', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({
        deposit_amount: 60000,
        deductions: {
          unpaid_rent: 15000,
          utilities: 4000,
          cleaning: 3000,
          damages: 8000,
        },
        itemized_breakdown: [
          { category: 'Unpaid Rent', description: 'Balance', amount: 15000 },
          { category: 'Utilities', description: 'Water/Electricity', amount: 4000 },
          { category: 'Cleaning', description: 'Deep clean', amount: 3000 },
          { category: 'Damages', description: 'Broken chair', amount: 8000 },
        ],
      }),
    });

    const res = await calculateSettlementApi(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.refund_amount).toBe(30000); // 60000 - 30000 = 30000
  });
});
