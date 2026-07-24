import { NextResponse } from 'next/server';
import { isAuthorizedUser } from '@/lib/security';
import { db } from '@/lib/db';
import { sendTelegramMessage, getTelegramFileBuffer } from '@/lib/telegram';
import { generateReminderDraft, sendDueRentAlerts } from '@/lib/reminders';
import { transcribeVoiceNote, parseReceiptImage } from '@/lib/ai';
import { uploadMediaToStorage } from '@/lib/supabase';
import { storePendingMedia, getPendingMedia, deletePendingMedia } from '@/lib/pending-media';

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
      chatId = payload.callback_query.message?.chat?.id || userId;
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
        const parts = data.split(':');
        const paymentId = parts[1];
        const lang = parts[2] === 'ru' ? 'ru' : 'en';

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
            lang,
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
        const mediaId = parts[3];

        const pendingItem = mediaId ? getPendingMedia(mediaId) : undefined;
        const mediaUrl = pendingItem?.mediaUrl || null;
        const contentText = pendingItem?.contentText || `Forward capture (${category})`;

        let eventType: 'receipt' | 'voice_transcript' | 'note' = 'note';
        if (category === 'receipt' || category === 'Rent Receipt') {
          eventType = 'receipt';
        } else if (pendingItem?.eventType === 'voice_transcript' || category === 'voice_note') {
          eventType = 'voice_transcript';
        }

        const event = await db.createTimelineEvent({
          flat_id: flatId,
          category,
          content_text: contentText,
          media_url: mediaUrl,
          event_type: eventType,
        });

        if (category === 'receipt' || category === 'Rent Receipt') {
          const tenancies = await db.getTenancies(flatId);
          if (tenancies.length > 0) {
            const payments = await db.getExpectedPayments(tenancies[0].id);
            const overdue = payments.find(
              (p) => p.status === 'Overdue' || p.status === 'Pending' || p.status === 'Due Today'
            );
            if (overdue) {
              await db.createPaymentRecord({
                expected_payment_id: overdue.id,
                amount: overdue.amount,
                payment_method: 'Bank Transfer',
                receipt_url: mediaUrl,
                paid_at: new Date().toISOString(),
              });
            }
          }
        }

        if (mediaId) {
          deletePendingMedia(mediaId);
        }

        const flat = await db.getFlat(flatId);
        const flatTitle = flat?.title || 'Flat';
        await sendTelegramMessage(chatId!, `✅ Media assigned to <b>${flatTitle}</b> as <b>${category}</b>.`);
        return NextResponse.json({ success: true, event });
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

      if (msg.text === '/reminders' || msg.text === '/due') {
        const alerts = await sendDueRentAlerts(chatId!);
        if (alerts.length === 0) {
          await sendTelegramMessage(chatId!, '🎉 All clear! No due or overdue rent payments right now.');
        }
        return NextResponse.json({ success: true, count: alerts.length });
      }

      const mediaId = 'm_' + Math.random().toString(36).slice(2, 10);
      const isForwarded = !!(msg.forward_from || msg.forward_from_chat || msg.forward_date || msg.forward_origin);

      // Handle Voice Notes
      if (msg.voice) {
        const rawBuffer = await getTelegramFileBuffer(msg.voice.file_id);
        const fileBuffer = rawBuffer || Buffer.from('fake voice buffer');

        const transcript = await transcribeVoiceNote(fileBuffer, 'audio/ogg');
        const fileName = `voice_${mediaId}.ogg`;
        const mediaUrl = await uploadMediaToStorage(fileBuffer, fileName, 'audio/ogg');

        storePendingMedia({
          mediaId,
          mediaUrl,
          contentText: transcript,
          eventType: 'voice_transcript',
          category: 'Note',
          isForwarded,
        });

        let flats = await db.getFlats();
        if (flats.length === 0) {
          const sampleFlat = await db.createFlat({ title: 'Flat 101', address: 'Default St 1', status: 'active' });
          flats = [sampleFlat];
        }

        const keyboard = flats.map((f) => [
          { text: `🏠 ${f.title}`, callback_data: `assign_flat:${f.id}:Note:${mediaId}` },
        ]);

        await sendTelegramMessage(
          chatId!,
          `🎙️ <b>Voice Note Transcribed</b>:\n"${transcript}"\n\nAssign to flat:`,
          keyboard
        );

        return NextResponse.json({ success: true, media_id: mediaId, transcript });
      }

      // Handle Photos (Receipts / Meter readings)
      if (msg.photo) {
        const photoObj = msg.photo[msg.photo.length - 1];
        const rawBuffer = photoObj?.file_id ? await getTelegramFileBuffer(photoObj.file_id) : null;
        const fileBuffer = rawBuffer || Buffer.from('fake receipt photo buffer');

        const parsed = await parseReceiptImage(fileBuffer, 'image/jpeg');
        const fileName = `photo_${mediaId}.jpg`;
        const mediaUrl = await uploadMediaToStorage(fileBuffer, fileName, 'image/jpeg');

        const contentText = msg.caption
          ? `${msg.caption} (Amount: ${parsed.amount || 'N/A'})`
          : `Receipt / Photo captured (Amount: ${parsed.amount || 'N/A'})`;

        storePendingMedia({
          mediaId,
          mediaUrl,
          contentText,
          eventType: 'receipt',
          category: 'Rent Receipt',
          parsedData: parsed,
          isForwarded,
        });

        let flats = await db.getFlats();
        if (flats.length === 0) {
          const sampleFlat = await db.createFlat({ title: 'Flat 101', address: 'Default St 1', status: 'active' });
          flats = [sampleFlat];
        }

        const keyboard = flats.map((f) => [
          { text: `🏠 ${f.title}`, callback_data: `assign_flat:${f.id}:Rent Receipt:${mediaId}` },
        ]);

        await sendTelegramMessage(
          chatId!,
          `📄 <b>Receipt / Media Captured</b>\nAmount: ${parsed.amount || 'N/A'}\nAssign to flat:`,
          keyboard
        );

        return NextResponse.json({ success: true, media_id: mediaId, parsed });
      }

      // Handle Documents
      if (msg.document) {
        const rawBuffer = msg.document.file_id ? await getTelegramFileBuffer(msg.document.file_id) : null;
        const fileBuffer = rawBuffer || Buffer.from('fake document buffer');

        const docName = msg.document.file_name || 'document.pdf';
        const mimeType = msg.document.mime_type || 'application/pdf';
        const fileName = `doc_${mediaId}_${docName}`;
        const mediaUrl = await uploadMediaToStorage(fileBuffer, fileName, mimeType);

        const contentText = msg.caption ? `${docName} - ${msg.caption}` : `Document: ${docName}`;

        storePendingMedia({
          mediaId,
          mediaUrl,
          contentText,
          eventType: 'note',
          category: 'Utility',
          isForwarded,
        });

        let flats = await db.getFlats();
        if (flats.length === 0) {
          const sampleFlat = await db.createFlat({ title: 'Flat 101', address: 'Default St 1', status: 'active' });
          flats = [sampleFlat];
        }

        const keyboard = flats.map((f) => [
          { text: `🏠 ${f.title}`, callback_data: `assign_flat:${f.id}:Utility:${mediaId}` },
        ]);

        await sendTelegramMessage(
          chatId!,
          `📑 <b>Document Captured</b>: ${docName}\nAssign to flat:`,
          keyboard
        );

        return NextResponse.json({ success: true, media_id: mediaId });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
