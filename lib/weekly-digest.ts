import { db } from './db';
import { Flat, Tenancy, ExpectedPayment } from './types';
import { sendTelegramMessage, TelegramInlineButton } from './telegram';

export interface WeeklyDigestMetrics {
  totalFlatsCount: number;
  activeTenanciesCount: number;
  vacantFlatsCount: number;
  monthlyRevenue: number;
  overdueCount: number;
  upcomingPaymentsCount: number;
  upcomingTransitionsCount: number;
  missingDocsCount: number;
}

export interface WeeklyDigestResult {
  digestText: string;
  buttons: TelegramInlineButton[][];
  metrics: WeeklyDigestMetrics;
}

function resolvePaymentContext(
  payment: ExpectedPayment,
  tenancies: Tenancy[],
  flats: Flat[]
): { tenantName: string; flatTitle: string } {
  const tenancy = tenancies.find((item) => item.id === payment.tenancy_id);
  const flat = flats.find((item) => item.id === tenancy?.flat_id);
  return {
    tenantName: tenancy?.tenant_name || 'Tenant',
    flatTitle: flat?.title || 'Flat',
  };
}

function getPrimaryRecipientChatId(): string | undefined {
  const allowedIds = (process.env.TELEGRAM_ALLOWED_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return allowedIds[0];
}

export async function compileWeeklyDigest(referenceDate: Date = new Date()): Promise<WeeklyDigestResult> {
  const flats = await db.getFlats();
  const tenancies = await db.getTenancies();
  const expectedPayments = await db.getExpectedPayments(undefined, undefined, undefined, false);
  const paymentRecords = await db.getPaymentRecords();

  const todayStr = referenceDate.toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7);

  // Active tenancies & flats
  const activeTenancies = tenancies.filter((tenancy) => tenancy.status === 'active');
  const activeTenancyIds = new Set(activeTenancies.map((tenancy) => tenancy.id));
  const activeTenanciesCount = activeTenancies.length;
  const vacantFlatsCount = flats.filter((flat) => flat.status === 'vacant').length;

  // 1. Monthly Revenue Collection (payments actually collected in current month)
  const currentMonthRecords = paymentRecords.filter((record) =>
    record.paid_at.startsWith(currentMonthPrefix)
  );
  let monthlyRevenue = currentMonthRecords.reduce((acc, record) => acc + record.amount, 0);

  // Fallback to fully paid expected payments in current month if no payment records exist
  if (monthlyRevenue === 0) {
    const paidPayments = expectedPayments.filter(
      (payment) => payment.status === 'Paid' && payment.due_date.startsWith(currentMonthPrefix)
    );
    monthlyRevenue = paidPayments.reduce((acc, payment) => acc + payment.amount, 0);
  }

  // 2. Overdue Rent Payments (active tenancies, unpaid and due before reference date)
  const overduePayments = expectedPayments.filter((payment) => {
    if (!activeTenancyIds.has(payment.tenancy_id)) return false;
    if (payment.status === 'Paid' || payment.status === 'Waived') return false;
    return payment.due_date < todayStr;
  });

  // 3. Upcoming Payment Due Dates (active tenancies, next 7 days relative to reference date)
  const sevenDaysLater = new Date(referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

  const upcomingPayments = expectedPayments.filter((payment) => {
    if (!activeTenancyIds.has(payment.tenancy_id)) return false;
    if (payment.status === 'Paid' || payment.status === 'Waived') return false;
    return payment.due_date >= todayStr && payment.due_date <= sevenDaysLaterStr;
  });

  // 4. Upcoming Lease Move-ins & Move-outs (next 30 days relative to reference date)
  const thirtyDaysLater = new Date(referenceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

  const upcomingMoveIns = tenancies.filter(
    (tenancy) => tenancy.start_date >= todayStr && tenancy.start_date <= thirtyDaysLaterStr
  );

  const upcomingMoveOuts = tenancies.filter(
    (tenancy) => tenancy.end_date >= todayStr && tenancy.end_date <= thirtyDaysLaterStr
  );

  // 5. Missing Checklists / Docs (active tenancies lacking move-in inspection checklist)
  const missingDocItems: Array<{ flatTitle: string; tenantName: string; reason: string }> = [];

  for (const tenancy of activeTenancies) {
    const flat = flats.find((item) => item.id === tenancy.flat_id);
    const flatTitle = flat?.title || 'Flat';
    const checklists = await db.getInspectionChecklists(tenancy.id);
    const hasMoveIn = checklists.some((checklist) => checklist.inspection_type === 'move_in');
    if (!hasMoveIn) {
      missingDocItems.push({
        flatTitle,
        tenantName: tenancy.tenant_name,
        reason: 'Missing Move-In Checklist',
      });
    }
  }

  // Construct Weekly Digest Text
  let digestText = `📊 **WEEKLY SNAPSHOT DIGEST**\n\n`;
  digestText += `🏡 Managed Flats: ${flats.length} (${activeTenanciesCount} Active, ${vacantFlatsCount} Vacant)\n`;
  digestText += `💰 Monthly Revenue Collected: ${monthlyRevenue.toLocaleString('en-US')} RUB\n\n`;

  // Overdue Section & Inline Buttons
  digestText += `⚠️ **Overdue Rent Obligations** (${overduePayments.length}):\n`;
  const buttons: TelegramInlineButton[][] = [];

  if (overduePayments.length > 0) {
    for (const payment of overduePayments) {
      const { tenantName, flatTitle } = resolvePaymentContext(payment, tenancies, flats);
      digestText += `- ${tenantName} (${flatTitle}): ${payment.amount.toLocaleString('en-US')} RUB (Due ${payment.due_date})\n`;

      buttons.push([
        {
          text: `📋 Draft Reminder (${flatTitle})`,
          callback_data: `copy_reminder:${payment.id}:ru`,
        },
      ]);
    }
  } else {
    digestText += `None - All clear! 🎉\n`;
  }
  digestText += `\n`;

  // Upcoming Payments Section
  digestText += `📅 **Upcoming Rent Due (Next 7 Days)** (${upcomingPayments.length}):\n`;
  if (upcomingPayments.length > 0) {
    for (const payment of upcomingPayments) {
      const { tenantName, flatTitle } = resolvePaymentContext(payment, tenancies, flats);
      digestText += `- ${tenantName} (${flatTitle}): ${payment.amount.toLocaleString('en-US')} RUB (Due ${payment.due_date})\n`;
    }
  } else {
    digestText += `None\n`;
  }
  digestText += `\n`;

  // Upcoming Transitions Section
  const totalTransitions = upcomingMoveIns.length + upcomingMoveOuts.length;
  digestText += `🔑 **Upcoming Lease Transitions (Next 30 Days)** (${totalTransitions}):\n`;
  if (totalTransitions > 0) {
    for (const tenancy of upcomingMoveIns) {
      const flat = flats.find((item) => item.id === tenancy.flat_id);
      digestText += `- Move-in: ${tenancy.tenant_name} (${flat?.title || 'Flat'}) on ${tenancy.start_date}\n`;
    }
    for (const tenancy of upcomingMoveOuts) {
      const flat = flats.find((item) => item.id === tenancy.flat_id);
      digestText += `- Move-out: ${tenancy.tenant_name} (${flat?.title || 'Flat'}) on ${tenancy.end_date}\n`;
    }
  } else {
    digestText += `None\n`;
  }
  digestText += `\n`;

  // Missing Checklists / Docs Section
  digestText += `📋 **Missing Checklists & Docs** (${missingDocItems.length}):\n`;
  if (missingDocItems.length > 0) {
    for (const item of missingDocItems) {
      digestText += `- ${item.flatTitle} (${item.tenantName}): ${item.reason}\n`;
    }
  } else {
    digestText += `None - All documentation complete! ✨\n`;
  }
  digestText += `\n✨ Have a great week organizing your flats!`;

  return {
    digestText,
    buttons,
    metrics: {
      totalFlatsCount: flats.length,
      activeTenanciesCount,
      vacantFlatsCount,
      monthlyRevenue,
      overdueCount: overduePayments.length,
      upcomingPaymentsCount: upcomingPayments.length,
      upcomingTransitionsCount: totalTransitions,
      missingDocsCount: missingDocItems.length,
    },
  };
}

export async function sendWeeklyDigest(targetChatId?: string | number): Promise<WeeklyDigestResult> {
  const digest = await compileWeeklyDigest();
  const recipientChatId = targetChatId || getPrimaryRecipientChatId();

  if (recipientChatId) {
    await sendTelegramMessage(
      recipientChatId,
      digest.digestText,
      digest.buttons.length > 0 ? digest.buttons : undefined
    );
  }

  return digest;
}
