import { NextResponse } from 'next/server';
import { isAuthorizedUser } from '@/lib/security';
import { db } from '@/lib/db';
import { sendTelegramMessage, getTelegramFileBuffer } from '@/lib/telegram';
import { generateReminderDraft } from '@/lib/reminders';
import { transcribeVoiceNote, parseReceiptImage } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 1. Determine User ID from update
    let userId: number | undefined;
    let chatId: number | string | undefined;

    if (payload.message) {
      userId = payload.message.from?.id;
      chatId = payload.message.chat?.id;
    } else if (payload.callback_query) {
      userId = payload.callback_query.from?.id;
      chatId = payload.callback_query.message?.chat?.id;
    }

    // 2. Authorization Whitelist check
    if (!userId || !isAuthorizedUser(userId)) {
      return NextResponse.json({ ignored: true }, { status: 200 });
    }

    // 3. Handle Callback Queries
    if (payload.callback_query) {
      const cb = payload.callback_query;
      const data: string = cb.data || '';

      if (data.startsWith('record_paid:')) {
        const paymentId = data.replace('record_paid:', '');
        const payment = await db.getExpectedPayment(paymentId);

        if (payment) {
          await db.createPaymentRecord({
            expected_payment_id: payment.id,
            amount: payment.amount,
            payment_method: 'Bank Transfer',
            paid_at: new Date().toISOString(),
          });

          const msg = `✅ Payment of ${payment.amount.toLocaleString()} RUB recorded as PAID.`;
          await sendTelegramMessage(chatId!, msg);
          return NextResponse.json({ success: true, message: msg });
        }
      }

      if (data.startsWith('copy_reminder:')) {
        const paymentId = data.replace('copy_reminder:', '');
        const payment = await db.getExpectedPayment(paymentId);

        if (payment) {
          const tenancy = await db.getTenancy(payment.tenancy_id);
          const flat = tenancy ? await db.getFlat(tenancy.flat_id) : null;

          const reminderDraft = generateReminderDraft({
            tenantName: tenancy?.tenant_name || 'Tenant',
            flatTitle: flat?.title || 'Flat',
            amount: payment.amount,
            dueDate: payment.due_date,
            status: payment.status,
          });

          const responseText = `📋 **Reminder Draft (Tap to copy)**:\n\n<code>${reminderDraft}</code>`;
          await sendTelegramMessage(chatId!, responseText);
          return NextResponse.json({ success: true, reminder_draft: reminderDraft });
        }
      }

      if (data.startsWith('assign_flat:')) {
        const parts = data.split(':');
        const flatId = parts[1];
        const category = parts[2] || 'general';

        await db.createTimelineEvent({
          flat_id: flatId,
          category,
          content_text: `Forward capture attached (${category})`,
          event_type: category === 'receipt' ? 'receipt' : 'note',
        });

        if (category === 'receipt') {
          const tenancies = await db.getTenancies(flatId);
          if (tenancies.length > 0) {
            const payments = await db.getExpectedPayments(tenancies[0].id);
            const overdue = payments.find((p) => p.status === 'Overdue' || p.status === 'Pending' || p.status === 'Due Today');
            if (overdue) {
              await db.createPaymentRecord({
                expected_payment_id: overdue.id,
                amount: overdue.amount,
                payment_method: 'Bank Transfer',
                paid_at: new Date().toISOString(),
              });
            }
          }
        }

        await sendTelegramMessage(chatId!, `✅ Media assigned to Flat successfully.`);
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ success: true });
    }

    // 4. Handle Text & Voice / Media Messages
    if (payload.message) {
      const msg = payload.message;

      // Handle Commands
      if (msg.text === '/start') {
        const welcomeText = `🏡 **Anya's Mom Rental Back Office**\n\nManage flats, tenancies, expected payments, payment receipts, and inspection settlements right here in Telegram!`;
        await sendTelegramMessage(chatId!, welcomeText);
        return NextResponse.json({ success: true });
      }

      // Handle Voice Notes (User Story 8)
      if (msg.voice) {
        const fileBuffer = await getTelegramFileBuffer(msg.voice.file_id);
        const transcript = await transcribeVoiceNote(fileBuffer, 'audio/ogg');
        const flats = await db.getFlats();
        const targetFlat = flats[0];

        if (targetFlat) {
          await db.createTimelineEvent({
            flat_id: targetFlat.id,
            category: 'voice_note',
            content_text: transcript,
            event_type: 'voice_transcript',
          });
        }

        const keyboard = flats.slice(0, 5).map((f) => [
          { text: `🏠 ${f.title}`, callback_data: `assign_flat:${f.id}:voice_note` },
        ]);

        await sendTelegramMessage(
          chatId!,
          `🎙️ **Voice Note Transcribed**:\n"${transcript}"\n\nAssign to flat:`,
          keyboard
        );

        return NextResponse.json({ success: true, transcript });
      }

      // Handle Photo / Forwarded Receipts (User Story 7)
      if (msg.photo || msg.document) {
        const photoObj = msg.photo ? msg.photo[msg.photo.length - 1] : null;
        const fileId = photoObj?.file_id || msg.document?.file_id;
        const fileBuffer = fileId ? await getTelegramFileBuffer(fileId) : null;

        const parsed = await parseReceiptImage(fileBuffer);
        const flats = await db.getFlats();

        const keyboard = flats.slice(0, 5).map((f) => [
          { text: `🏠 ${f.title}`, callback_data: `assign_flat:${f.id}:receipt` },
        ]);

        await sendTelegramMessage(
          chatId!,
          `📄 **Receipt / Media Captured**\nAmount: ${parsed.amount || 'N/A'}\nAssign to flat:`,
          keyboard
        );

        return NextResponse.json({ success: true, parsed });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
