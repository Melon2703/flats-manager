import { PaymentStatus } from './types';
import { db } from './db';
import { sendTelegramMessage, TelegramInlineButton } from './telegram';

export interface ReminderParams {
  tenantName: string;
  flatTitle: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  lang?: 'ru' | 'en';
}

export interface RentAlertResult {
  paymentId: string;
  text: string;
  buttons: TelegramInlineButton[][];
}

export function generateReminderDraft(params: ReminderParams): string {
  const formattedAmount = params.amount.toLocaleString('en-US');
  const isOverdue = params.status === 'Overdue';

  if (params.lang === 'ru') {
    if (isOverdue) {
      return `Здравствуйте, ${params.tenantName}! 😊 Напоминаю про оплату аренды за ${params.flatTitle} в размере ${formattedAmount} руб. Срок оплаты был ${params.dueDate}. Отправьте, пожалуйста, чек или подтверждение перевода. Спасибо!`;
    }
    return `Здравствуйте, ${params.tenantName}! 👋 Хорошего дня! Напоминаю, что оплата аренды за ${params.flatTitle} (${formattedAmount} руб.) зафиксирована на ${params.dueDate}. Спасибо!`;
  }

  if (isOverdue) {
    return `Hello ${params.tenantName}! 😊 Just a gentle reminder regarding the rent payment of ${formattedAmount} RUB for ${params.flatTitle}, which was due on ${params.dueDate}. Please let me know when you've transferred the funds or send over the receipt. Thank you!`;
  }

  return `Hello ${params.tenantName}! 👋 Hoping you're having a great day. This is a quick note that the monthly rent for ${params.flatTitle} (${formattedAmount} RUB) is due on ${params.dueDate}. Thank you!`;
}

export async function sendDueRentAlerts(targetChatId?: number | string): Promise<RentAlertResult[]> {
  const payments = await db.getExpectedPayments(undefined, undefined, undefined, false);
  const dueOrOverdue = payments.filter((p) => p.status === 'Due Today' || p.status === 'Overdue');
  const results: RentAlertResult[] = [];

  const recipientChatId =
    targetChatId ||
    (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)[0];

  if (!recipientChatId) {
    return results;
  }

  for (const payment of dueOrOverdue) {
    const tenancy = await db.getTenancy(payment.tenancy_id);
    const flat = tenancy ? await db.getFlat(tenancy.flat_id) : null;

    const tenantName = tenancy?.tenant_name || 'Tenant';
    const flatTitle = flat?.title || 'Flat';
    const amountStr = payment.amount.toLocaleString('en-US');
    const statusEmoji = payment.status === 'Overdue' ? '🔴' : '🟡';

    const text = `${statusEmoji} **Actionable Alert**\n\n` +
      `👤 Tenant: **${tenantName}**\n` +
      `🏠 Flat: **${flatTitle}**\n` +
      `💰 Rent Amount: **${amountStr} RUB**\n` +
      `📅 Due Date: **${payment.due_date}**\n` +
      `📊 Status: **${payment.status}**`;

    const buttons: TelegramInlineButton[][] = [
      [
        { text: '✅ Record as Paid', callback_data: `record_paid:${payment.id}` },
        { text: '📋 Copy Draft (RU)', callback_data: `copy_reminder:${payment.id}:ru` },
        { text: '📋 Copy Draft (EN)', callback_data: `copy_reminder:${payment.id}:en` },
      ],
    ];

    await sendTelegramMessage(recipientChatId, text, buttons);

    results.push({
      paymentId: payment.id,
      text,
      buttons,
    });
  }

  return results;
}
