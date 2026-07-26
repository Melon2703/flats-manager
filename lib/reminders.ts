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

export async function sendDueRentAlerts(
  targetChatId?: number | string,
  userLang?: 'ru' | 'en'
): Promise<RentAlertResult[]> {
  const recipientChatId =
    targetChatId ||
    (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)[0];

  if (!recipientChatId) {
    return [];
  }

  const lang = userLang || (await db.getUserLanguage(recipientChatId));
  const payments = await db.getExpectedPayments(undefined, undefined, undefined, true);
  const dueOrOverdue = payments.filter((p) => p.status === 'Due Today' || p.status === 'Overdue');
  const results: RentAlertResult[] = [];

  for (const payment of dueOrOverdue) {
    const tenancy = await db.getTenancy(payment.tenancy_id);
    const flat = tenancy ? await db.getFlat(tenancy.flat_id) : null;

    const tenantName = tenancy?.tenant_name || (lang === 'ru' ? 'Арендатор' : 'Tenant');
    const flatTitle = flat?.title || (lang === 'ru' ? 'Квартира' : 'Flat');
    const amountStr = payment.amount.toLocaleString('en-US');
    const statusEmoji = payment.status === 'Overdue' ? '🔴' : '🟡';

    let text = '';
    let statusText: string = payment.status;
    if (lang === 'ru') {
      statusText = payment.status === 'Overdue' ? 'Просрочено' : 'Оплата сегодня';
      text =
        `${statusEmoji} <b>Уведомление об оплате</b>\n\n` +
        `👤 Арендатор: <b>${tenantName}</b>\n` +
        `🏠 Квартира: <b>${flatTitle}</b>\n` +
        `💰 Сумма аренды: <b>${amountStr} руб.</b>\n` +
        `📅 Срок оплаты: <b>${payment.due_date}</b>\n` +
        `📊 Статус: <b>${statusText}</b>`;
    } else {
      text =
        `${statusEmoji} <b>Actionable Alert</b>\n\n` +
        `👤 Tenant: <b>${tenantName}</b>\n` +
        `🏠 Flat: <b>${flatTitle}</b>\n` +
        `💰 Rent Amount: <b>${amountStr} RUB</b>\n` +
        `📅 Due Date: <b>${payment.due_date}</b>\n` +
        `📊 Status: <b>${payment.status}</b>`;
    }

    const recordPaidLabel = lang === 'ru' ? '✅ Отметить как оплачено' : '✅ Record as Paid';
    const copyRuLabel = lang === 'ru' ? '📋 Шаблон (RU)' : '📋 Copy Draft (RU)';
    const copyEnLabel = lang === 'ru' ? '📋 Шаблон (EN)' : '📋 Copy Draft (EN)';

    const buttons: TelegramInlineButton[][] = [
      [
        { text: recordPaidLabel, callback_data: `record_paid:${payment.id}` },
        { text: copyRuLabel, callback_data: `copy_reminder:${payment.id}:ru` },
        { text: copyEnLabel, callback_data: `copy_reminder:${payment.id}:en` },
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
