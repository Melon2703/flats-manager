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

export interface MeterReadings {
  electricity?: number;
  water?: number;
  gas?: number;
}

export interface MeterRates {
  electricity_rate?: number;
  water_rate?: number;
  gas_rate?: number;
}

export const DEFAULT_METER_RATES: Required<MeterRates> = {
  electricity_rate: 6.5,
  water_rate: 50,
  gas_rate: 7,
};

export function calculateUtilityDifference(
  moveIn: MeterReadings,
  moveOut: MeterReadings,
  rates: MeterRates = DEFAULT_METER_RATES
): { electricity_cost: number; water_cost: number; gas_cost: number; total_utility_cost: number } {
  const elecDiff = Math.max(0, (moveOut.electricity || 0) - (moveIn.electricity || 0));
  const waterDiff = Math.max(0, (moveOut.water || 0) - (moveIn.water || 0));
  const gasDiff = Math.max(0, (moveOut.gas || 0) - (moveIn.gas || 0));

  const electricity_cost = elecDiff * (rates.electricity_rate ?? DEFAULT_METER_RATES.electricity_rate);
  const water_cost = waterDiff * (rates.water_rate ?? DEFAULT_METER_RATES.water_rate);
  const gas_cost = gasDiff * (rates.gas_rate ?? DEFAULT_METER_RATES.gas_rate);

  const total_utility_cost = electricity_cost + water_cost + gas_cost;


  return {
    electricity_cost,
    water_cost,
    gas_cost,
    total_utility_cost,
  };
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
    { category: 'Utilities', description: 'Final utility balances', amount: deductions.utilities || 0 },
    { category: 'Cleaning', description: 'End of tenancy cleaning', amount: deductions.cleaning || 0 },
    { category: 'Damages', description: 'Flat damage repairs', amount: deductions.damages || 0 },
  ];

  return {
    deposit_amount,
    deductions,
    refund_amount,
    itemized_breakdown,
  };
}

function formatNumber(val: number, isRu: boolean): string {
  return val.toLocaleString(isRu ? 'ru-RU' : 'en-US').replace(/\u00a0/g, ' ');
}

export function generateSettlementSummarySheet(
  summary: SettlementSummary,
  tenantName: string,
  flatTitle: string,
  lang: 'ru' | 'en' = 'en'
): string {
  const isRu = lang === 'ru';
  const formattedDeposit = formatNumber(summary.deposit_amount, isRu);
  const formattedRefund = formatNumber(Math.max(0, summary.refund_amount), isRu);
  const balanceOwed = summary.refund_amount < 0 ? formatNumber(Math.abs(summary.refund_amount), isRu) : '0';

  if (isRu) {
    let sheet = `📋 **ИТОГОВЫЙ РАСЧЕТ АРЕНДЫ (FINAL SETTLEMENT)**\n`;
    sheet += `Квартира: ${flatTitle}\n`;
    sheet += `Арендатор: ${tenantName}\n\n`;
    sheet += `Депозит (залог): ${formattedDeposit} руб.\n`;
    sheet += `--- УДЕРЖАНИЯ ---\n`;
    sheet += `- Долг по аренде: ${formatNumber(summary.deductions.unpaid_rent, true)} руб.\n`;
    sheet += `- Коммунальные услуги: ${formatNumber(summary.deductions.utilities, true)} руб.\n`;
    sheet += `- Уборка: ${formatNumber(summary.deductions.cleaning, true)} руб.\n`;
    sheet += `- Ущерб / Ремонт: ${formatNumber(summary.deductions.damages, true)} руб.\n`;

    if (summary.itemized_breakdown && summary.itemized_breakdown.length > 0) {
      const photosWithLinks = summary.itemized_breakdown.filter((item) => item.photo_urls && item.photo_urls.length > 0);
      if (photosWithLinks.length > 0) {
        sheet += `\n--- ССЫЛКИ НА ФОТО И ПОДТВЕРЖДЕНИЯ ---\n`;
        for (const item of photosWithLinks) {
          sheet += `- ${item.category}: ${item.photo_urls?.join(', ')}\n`;
        }
      }
    }

    sheet += `\n`;
    if (summary.refund_amount >= 0) {
      sheet += `✅ **Возврат залога арендатору**: ${formattedRefund} руб.`;
    } else {
      sheet += `⚠️ **Доплата с арендатора**: ${balanceOwed} руб.`;
    }

    return sheet;
  }

  let sheet = `📋 **FINAL SETTLEMENT SUMMARY**\n`;
  sheet += `Flat: ${flatTitle}\n`;
  sheet += `Tenant: ${tenantName}\n\n`;
  sheet += `Initial Deposit: ${formattedDeposit} RUB\n`;
  sheet += `--- DEDUCTIONS ---\n`;
  sheet += `- Unpaid Rent: ${formatNumber(summary.deductions.unpaid_rent, false)} RUB\n`;
  sheet += `- Utilities: ${formatNumber(summary.deductions.utilities, false)} RUB\n`;
  sheet += `- Cleaning Fee: ${formatNumber(summary.deductions.cleaning, false)} RUB\n`;
  sheet += `- Damages: ${formatNumber(summary.deductions.damages, false)} RUB\n`;

  if (summary.itemized_breakdown && summary.itemized_breakdown.length > 0) {
    const photosWithLinks = summary.itemized_breakdown.filter((item) => item.photo_urls && item.photo_urls.length > 0);
    if (photosWithLinks.length > 0) {
      sheet += `\n--- EVIDENCE & PHOTO LINKS ---\n`;
      for (const item of photosWithLinks) {
        sheet += `- ${item.category}: ${item.photo_urls?.join(', ')}\n`;
      }
    }
  }

  sheet += `\n`;
  if (summary.refund_amount >= 0) {
    sheet += `✅ **Final Deposit Refund Amount**: ${formattedRefund} RUB`;
  } else {
    sheet += `⚠️ **Tenant Balance Due**: ${balanceOwed} RUB`;
  }

  return sheet;
}
