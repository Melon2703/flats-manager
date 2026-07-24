import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { ExpectedPayment, Tenancy, Flat } from '../lib/types';

describe('Monthly Expected Payment Generator & Payment Ledger Seam', () => {
  let flat1: Flat;
  let tenancy1: Tenancy;
  let tenancy2: Tenancy;

  beforeEach(async () => {
    await db.reset();

    flat1 = await db.createFlat({
      title: 'Flat 101 - City Center',
      address: 'Lenina St. 45',
      status: 'active',
    });

    const flat2 = await db.createFlat({
      title: 'Flat 202 - Riverside View',
      address: 'Naberezhnaya 10',
      status: 'active',
    });

    tenancy1 = await db.createTenancy({
      flat_id: flat1.id,
      tenant_name: 'Alice Smith',
      tenant_contact: '+123456789',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 50000,
      deposit_amount: 50000,
      due_day: 5,
      status: 'active',
    });

    tenancy2 = await db.createTenancy({
      flat_id: flat2.id,
      tenant_name: 'Bob Jones',
      tenant_contact: '+987654321',
      start_date: '2026-02-01',
      end_date: '2026-12-31',
      rent_amount: 35000,
      deposit_amount: 35000,
      due_day: 20,
      status: 'active',
    });
  });

  it('generates expected payment on tenancy creation', async () => {
    const payments = await db.getExpectedPayments(tenancy1.id);
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(50000);
    expect(payments[0].tenancy_id).toBe(tenancy1.id);
  });

  it('generates monthly expected payments for all active tenancies for a given month', async () => {
    // Generate payments for August 2026
    const targetDate = new Date(2026, 7, 1); // August 2026
    const generated = await db.generateMonthlyExpectedPayments(targetDate);

    expect(generated.length).toBe(2);

    const aliceAugPayment = generated.find((p) => p.tenancy_id === tenancy1.id);
    expect(aliceAugPayment).toBeDefined();
    expect(aliceAugPayment?.due_date).toBe('2026-08-05');
    expect(aliceAugPayment?.amount).toBe(50000);

    const bobAugPayment = generated.find((p) => p.tenancy_id === tenancy2.id);
    expect(bobAugPayment).toBeDefined();
    expect(bobAugPayment?.due_date).toBe('2026-08-20');
    expect(bobAugPayment?.amount).toBe(35000);
  });

  it('prevents duplicate expected payments for the same tenancy in the same month', async () => {
    const targetDate = new Date(2026, 7, 1);
    await db.generateMonthlyExpectedPayments(targetDate);
    const secondRun = await db.generateMonthlyExpectedPayments(targetDate);

    expect(secondRun.length).toBe(0);
  });

  it('updates payment status from Pending -> Partial -> Paid upon recording payments', async () => {
    const targetDate = new Date(2026, 7, 1); // August 2026
    const [expected] = await db.generateMonthlyExpectedPayments(targetDate);

    // Initial state for future due date
    expect(expected.status).toBe('Pending');

    // Partial payment
    await db.createPaymentRecord({
      expected_payment_id: expected.id,
      amount: 20000,
      payment_method: 'Bank Transfer',
    });

    let updated = await db.getExpectedPayment(expected.id);
    expect(updated?.status).toBe('Partial');

    // Second payment completing the rent
    await db.createPaymentRecord({
      expected_payment_id: expected.id,
      amount: 30000,
      payment_method: 'Cash',
      receipt_url: 'https://storage.example.com/receipt-123.jpg',
    });

    updated = await db.getExpectedPayment(expected.id);
    expect(updated?.status).toBe('Paid');
  });

  it('allows setting status to Waived', async () => {
    const payments = await db.getExpectedPayments(tenancy1.id);
    const expected = payments[0];

    const updated = await db.updateExpectedPayment(expected.id, { status: 'Waived' });
    expect(updated?.status).toBe('Waived');
  });

  it('filters expected payments by flat_id and month YYYY-MM', async () => {
    const targetDate = new Date('2026-08-01');
    await db.generateMonthlyExpectedPayments(targetDate);

    const augFlat1Payments = await db.getExpectedPayments(undefined, '2026-08', flat1.id);
    expect(augFlat1Payments.length).toBe(1);
    expect(augFlat1Payments[0].tenancy_id).toBe(tenancy1.id);
  });
});
