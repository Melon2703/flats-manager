import { PaymentStatus } from './types';

export interface ReminderParams {
  tenantName: string;
  flatTitle: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
}

export function generateReminderDraft(params: ReminderParams): string {
  const formattedAmount = params.amount.toLocaleString('en-US');
  const isOverdue = params.status === 'Overdue';

  if (isOverdue) {
    return `Hello ${params.tenantName}! 😊 Just a gentle reminder regarding the rent payment of ${formattedAmount} RUB for ${params.flatTitle}, which was due on ${params.dueDate}. Please let me know when you've transferred the funds or send over the receipt. Thank you!`;
  }

  return `Hello ${params.tenantName}! 👋 Hoping you're having a great day. This is a quick note that the monthly rent for ${params.flatTitle} (${formattedAmount} RUB) is due on ${params.dueDate}. Thank you!`;
}
