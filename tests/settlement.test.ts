import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../lib/settlement';

describe('Settlement Calculator Seam', () => {
  it('correctly calculates deposit refund with formula Refund = Deposit - (Unpaid Rent + Utilities + Cleaning + Damages)', () => {
    const result = calculateSettlement({
      deposit_amount: 50000,
      deductions: {
        unpaid_rent: 10000,
        utilities: 5000,
        cleaning: 3000,
        damages: 7000,
      },
      itemized_breakdown: [
        { category: 'Unpaid Rent', description: 'Partial balance for July', amount: 10000 },
        { category: 'Utilities', description: 'Electric & Water meters', amount: 5000 },
        { category: 'Cleaning', description: 'Deep cleaning fee', amount: 3000 },
        { category: 'Damages', description: 'Scratch on door', amount: 7000, photo_urls: ['http://example.com/door.jpg'] },
      ],
    });

    expect(result.refund_amount).toBe(25000); // 50000 - (10000 + 5000 + 3000 + 7000) = 25000
    expect(result.itemized_breakdown.length).toBe(4);
  });

  it('handles zero refund or negative refund (tenant owes balance)', () => {
    const result = calculateSettlement({
      deposit_amount: 30000,
      deductions: {
        unpaid_rent: 30000,
        utilities: 5000,
        cleaning: 2000,
        damages: 0,
      },
    });

    expect(result.refund_amount).toBe(-7000); // 30000 - 37000 = -7000
  });
});
