import { SettlementDeductions, SettlementSummary } from './types';

export interface CalculateSettlementParams {
  deposit_amount: number;
  deductions: SettlementDeductions;
  itemized_breakdown?: Array<{
    category: string;
    description: string;
    amount: number;
    photo_urls?: string[];
  }>;
}

export function calculateSettlement(params: CalculateSettlementParams): SettlementSummary {
  const { deposit_amount, deductions } = params;
  const totalDeductions =
    (deductions.unpaid_rent || 0) +
    (deductions.utilities || 0) +
    (deductions.cleaning || 0) +
    (deductions.damages || 0);

  const refund_amount = deposit_amount - totalDeductions;

  const itemized_breakdown = params.itemized_breakdown || [
    { category: 'Unpaid Rent', description: 'Outstanding balance', amount: deductions.unpaid_rent || 0 },
    { category: 'Utilities', description: 'Final utility bills', amount: deductions.utilities || 0 },
    { category: 'Cleaning', description: 'End of lease cleaning', amount: deductions.cleaning || 0 },
    { category: 'Damages', description: 'Property damage repairs', amount: deductions.damages || 0 },
  ];

  return {
    deposit_amount,
    deductions,
    refund_amount,
    itemized_breakdown,
  };
}

export function generateSettlementSummarySheet(summary: SettlementSummary, tenantName: string, flatTitle: string): string {
  const formattedDeposit = summary.deposit_amount.toLocaleString('en-US');
  const formattedRefund = Math.max(0, summary.refund_amount).toLocaleString('en-US');
  const balanceOwed = summary.refund_amount < 0 ? Math.abs(summary.refund_amount).toLocaleString('en-US') : '0';

  let sheet = `📋 **MOVE-OUT SETTLEMENT SUMMARY**\n`;
  sheet += `Flat: ${flatTitle}\n`;
  sheet += `Tenant: ${tenantName}\n\n`;
  sheet += `Initial Deposit: ${formattedDeposit} RUB\n`;
  sheet += `--- DEDUCTIONS ---\n`;
  sheet += `- Unpaid Rent: ${summary.deductions.unpaid_rent.toLocaleString('en-US')} RUB\n`;
  sheet += `- Utilities: ${summary.deductions.utilities.toLocaleString('en-US')} RUB\n`;
  sheet += `- Cleaning Fee: ${summary.deductions.cleaning.toLocaleString('en-US')} RUB\n`;
  sheet += `- Damages: ${summary.deductions.damages.toLocaleString('en-US')} RUB\n\n`;

  if (summary.refund_amount >= 0) {
    sheet += `✅ **Final Deposit Refund Amount**: ${formattedRefund} RUB`;
  } else {
    sheet += `⚠️ **Tenant Balance Due**: ${balanceOwed} RUB`;
  }

  return sheet;
}
