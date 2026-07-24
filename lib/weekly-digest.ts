import { db } from './db';
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

export async function compileWeeklyDigest(referenceDate: Date = new Date()): Promise<WeeklyDigestResult> {
  const flats = await db.getFlats();
  const tenancies = await db.getTenancies();
  const expectedPayments = await db.getExpectedPayments(undefined, undefined, undefined, false);
  const paymentRecords = await db.getPaymentRecords();

  const todayStr = referenceDate.toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7);

  // 1. Monthly Revenue Collection (payments paid in current month)
  const currentMonthRecords = paymentRecords.filter((r) => r.paid_at.startsWith(currentMonthPrefix));
  let monthlyRevenue = currentMonthRecords.reduce((acc, curr) => acc + curr.amount, 0);

  if (monthlyRevenue === 0) {
    const paidPayments = expectedPayments.filter(
      (p) => (p.status === 'Paid' || p.status === 'Partial') && p.due_date.startsWith(currentMonthPrefix)
    );
    monthlyRevenue = paidPayments.reduce((acc, curr) => acc + curr.amount, 0);
  }

  // Active tenancies and vacant flats
  const activeTenancies = tenancies.filter((t) => t.status === 'active');
  const activeTenanciesCount = activeTenancies.length;
  const vacantFlatsCount = flats.filter((f) => f.status === 'vacant').length;

  // 2. Overdue Rent Payments (unpaid and due before reference date)
  const overduePayments = expectedPayments.filter((p) => {
    if (p.status === 'Paid' || p.status === 'Waived') return false;
    return p.due_date < todayStr;
  });

  // 3. Upcoming Payment Due Dates (next 7 days relative to reference date)
  const sevenDaysLater = new Date(referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

  const upcomingPayments = expectedPayments.filter((p) => {
    if (p.status === 'Paid' || p.status === 'Waived') return false;
    return p.due_date >= todayStr && p.due_date <= sevenDaysLaterStr;
  });

  // 4. Upcoming Lease Move-ins & Move-outs (next 30 days relative to reference date)
  const thirtyDaysLater = new Date(referenceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

  const upcomingMoveIns = tenancies.filter(
    (t) => t.start_date >= todayStr && t.start_date <= thirtyDaysLaterStr
  );

  const upcomingMoveOuts = tenancies.filter(
    (t) => t.end_date >= todayStr && t.end_date <= thirtyDaysLaterStr
  );

  // 5. Missing Checklists / Docs (active tenancies lacking move-in inspection checklist)
  const missingDocItems: Array<{ flatTitle: string; tenantName: string; reason: string }> = [];

  for (const tenancy of activeTenancies) {
    const flat = flats.find((f) => f.id === tenancy.flat_id);
    const flatTitle = flat?.title || 'Flat';
    const checklists = await db.getInspectionChecklists(tenancy.id);
    const hasMoveIn = checklists.some((c) => c.inspection_type === 'move_in');
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
    for (const p of overduePayments) {
      const t = tenancies.find((ten) => ten.id === p.tenancy_id);
      const f = flats.find((fl) => fl.id === t?.flat_id);
      const flatTitle = f?.title || 'Flat';
      const tenantName = t?.tenant_name || 'Tenant';

      digestText += `- ${tenantName} (${flatTitle}): ${p.amount.toLocaleString('en-US')} RUB (Due ${p.due_date})\n`;

      buttons.push([
        {
          text: `📋 Draft Reminder (${flatTitle})`,
          callback_data: `copy_reminder:${p.id}:ru`,
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
    for (const p of upcomingPayments) {
      const t = tenancies.find((ten) => ten.id === p.tenancy_id);
      const f = flats.find((fl) => fl.id === t?.flat_id);
      const flatTitle = f?.title || 'Flat';
      const tenantName = t?.tenant_name || 'Tenant';
      digestText += `- ${tenantName} (${flatTitle}): ${p.amount.toLocaleString('en-US')} RUB (Due ${p.due_date})\n`;
    }
  } else {
    digestText += `None\n`;
  }
  digestText += `\n`;

  // Upcoming Transitions Section
  const totalTransitions = upcomingMoveIns.length + upcomingMoveOuts.length;
  digestText += `🔑 **Upcoming Lease Transitions (Next 30 Days)** (${totalTransitions}):\n`;
  if (totalTransitions > 0) {
    for (const t of upcomingMoveIns) {
      const f = flats.find((fl) => fl.id === t.flat_id);
      digestText += `- Move-in: ${t.tenant_name} (${f?.title || 'Flat'}) on ${t.start_date}\n`;
    }
    for (const t of upcomingMoveOuts) {
      const f = flats.find((fl) => fl.id === t.flat_id);
      digestText += `- Move-out: ${t.tenant_name} (${f?.title || 'Flat'}) on ${t.end_date}\n`;
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
  const recipientChatId =
    targetChatId ||
    (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)[0];

  if (recipientChatId) {
    await sendTelegramMessage(
      recipientChatId,
      digest.digestText,
      digest.buttons.length > 0 ? digest.buttons : undefined
    );
  }

  return digest;
}
