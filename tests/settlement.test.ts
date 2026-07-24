import { describe, it, expect } from 'vitest';
import { calculateSettlement, calculateUtilityDifference, generateSettlementSummarySheet } from '../lib/settlement';


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

  it('calculates utility differences between move-in and move-out readings', () => {
    const moveIn = { electricity: 1000, water: 50, gas: 10 };
    const moveOut = { electricity: 1200, water: 70, gas: 15 };
    const rates = { electricity_rate: 6.5, water_rate: 50, gas_rate: 7 };

    const utilityResult = calculateUtilityDifference(moveIn, moveOut, rates);

    // Electricity: 200 * 6.5 = 1300
    // Water: 20 * 50 = 1000
    // Gas: 5 * 7 = 35
    // Total: 2335
    expect(utilityResult.electricity_cost).toBe(1300);
    expect(utilityResult.water_cost).toBe(1000);
    expect(utilityResult.gas_cost).toBe(35);
    expect(utilityResult.total_utility_cost).toBe(2335);
  });

  it('formats itemized move-out settlement summary sheet with evidence photo links', () => {
    const summary = calculateSettlement({
      deposit_amount: 50000,
      deductions: {
        unpaid_rent: 5000,
        utilities: 2335,
        cleaning: 2000,
        damages: 4500,
      },
      itemized_breakdown: [
        { category: 'Damages', description: 'Broken tile', amount: 4500, photo_urls: ['https://example.com/tile.jpg'] },
      ],
    });

    const sheet = generateSettlementSummarySheet(summary, 'Ivan Petrov', 'Flat 101');
    expect(sheet).toContain('MOVE-OUT SETTLEMENT SUMMARY');
    expect(sheet).toContain('Flat: Flat 101');
    expect(sheet).toContain('Tenant: Ivan Petrov');
    expect(sheet).toContain('Initial Deposit: 50,000 RUB');
    expect(sheet).toContain('Damages: 4,500 RUB');
    expect(sheet).toContain('https://example.com/tile.jpg');
    expect(sheet).toContain('Final Deposit Refund Amount**: 36,165 RUB');
  });
});


