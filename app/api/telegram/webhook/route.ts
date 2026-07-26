import { NextResponse } from 'next/server';
import { isAuthorizedUser } from '@/lib/security';
import { db } from '@/lib/db';
import { sendTelegramMessage, getTelegramFileBuffer, getAppUrl, setupTelegramBot, TelegramInlineButton } from '@/lib/telegram';
import { generateReminderDraft, sendDueRentAlerts } from '@/lib/reminders';
import { sendWeeklyDigest } from '@/lib/weekly-digest';
import { transcribeVoiceNote, parseReceiptImage } from '@/lib/ai';
import { uploadMediaToStorage } from '@/lib/supabase';
import { storePendingMedia, getPendingMedia, deletePendingMedia } from '@/lib/pending-media';
import { getTranslation, Language } from '@/lib/i18n';
import { Flat } from '@/lib/types';

function buildMainMenuKeyboard(lang: Language): TelegramInlineButton[][] {
  const appUrl = getAppUrl();
  const buttons: TelegramInlineButton[][] = [];

  buttons.push([
    { text: getTranslation(lang, 'botOpenWebApp'), web_app: { url: appUrl } },
  ]);

  buttons.push([
    { text: getTranslation(lang, 'botCheckDueRent'), callback_data: 'cmd_reminders' },
    { text: getTranslation(lang, 'botWeeklyDigest'), callback_data: 'cmd_digest' },
  ]);

  buttons.push([
    { text: getTranslation(lang, 'botChangeLanguage'), callback_data: 'cmd_lang' },
  ]);

  return buttons;
}

function buildWebAppKeyboard(lang: Language): TelegramInlineButton[][] {
  const appUrl = getAppUrl();
  return [
    [{ text: getTranslation(lang, 'botOpenWebApp'), web_app: { url: appUrl } }],
  ];
}

function buildMainMenuMessage(lang: Language): string {
  return `${getTranslation(lang, 'botMenuTitle')}\n\n${getTranslation(lang, 'botMenuDesc')}`;
}

function buildLanguageKeyboard(): TelegramInlineButton[][] {
  return [
    [
      { text: '🇷🇺 Русский', callback_data: 'set_lang:ru' },
      { text: '🇬🇧 English', callback_data: 'set_lang:en' },
    ],
  ];
}

function buildMediaInlineKeyboard(
  flats: Flat[],
  selectedCategory: string,
  mediaId: string,
  lang: Language = 'ru'
): TelegramInlineButton[][] {
  const categories = [
    { label: getTranslation(lang, 'catRentReceipt'), tag: 'Rent Receipt' },
    { label: getTranslation(lang, 'catExpense'), tag: 'Expense' },
    { label: getTranslation(lang, 'catUtility'), tag: 'Utility' },
    { label: getTranslation(lang, 'catNote'), tag: 'Note' },
  ];

  const categoryRow: TelegramInlineButton[] = categories.map((cat) => ({
    text: cat.tag === selectedCategory ? `✅ ${cat.tag}` : cat.label,
    callback_data: `set_cat:${cat.tag}:${mediaId}`,
  }));

  const flatRows: TelegramInlineButton[][] = flats.map((f) => [
    {
      text: `🏠 ${f.title}`,
      callback_data: `assign_flat:${f.id}:${selectedCategory}:${mediaId}`,
    },
  ]);

  return [categoryRow, ...flatRows];
}

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

    const userLang: Language = await db.getUserLanguage(userId);

    // 3. Handle Callback Queries
    if (payload.callback_query) {
      const cb = payload.callback_query;
      const data: string = cb.data || '';

      if (data === 'cmd_lang') {
        await sendTelegramMessage(
          chatId!,
          getTranslation(userLang, 'botSelectLanguagePrompt'),
          buildLanguageKeyboard()
        );
        return NextResponse.json({ success: true, menu: 'lang' });
      }

      if (data.startsWith('set_lang:')) {
        const targetLang = data.replace('set_lang:', '') === 'en' ? 'en' : 'ru';
        await db.setUserLanguage(userId, targetLang);

        const confirmMsg =
          targetLang === 'ru'
            ? getTranslation('ru', 'botLangChangedRu')
            : getTranslation('en', 'botLangChangedEn');

        await sendTelegramMessage(
          chatId!,
          `${confirmMsg}\n\n${buildMainMenuMessage(targetLang)}`,
          buildMainMenuKeyboard(targetLang)
        );

        return NextResponse.json({ success: true, lang: targetLang });
      }

      if (data === 'cmd_reminders') {
        const alerts = await sendDueRentAlerts(chatId!, userLang);
        if (alerts.length === 0) {
          await sendTelegramMessage(chatId!, getTranslation(userLang, 'botNoDuePayments'));
        }
        return NextResponse.json({ success: true, count: alerts.length });
      }

      if (data === 'cmd_digest') {
        await sendWeeklyDigest(chatId!, userLang);
        return NextResponse.json({ success: true });
      }

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

          const msg =
            userLang === 'ru'
              ? `✅ Платеж на сумму ${payment.amount.toLocaleString('en-US')} руб. отмечен как ОПЛАЧЕН.`
              : `✅ Payment of ${payment.amount.toLocaleString('en-US')} RUB recorded as PAID.`;

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
            tenantName: tenancy?.tenant_name || (lang === 'ru' ? 'Арендатор' : 'Tenant'),
            flatTitle: flat?.title || (lang === 'ru' ? 'Квартира' : 'Flat'),
            amount: payment.amount,
            dueDate: payment.due_date,
            status: payment.status,
            lang,
          });

          const responseText = `📋 <b>Reminder Draft (Tap to copy)</b>:\n\n<code>${reminderDraft}</code>`;
          await sendTelegramMessage(chatId!, responseText);
          return NextResponse.json({ success: true, reminder_draft: reminderDraft });
        }
      }

      if (data.startsWith('set_cat:')) {
        const parts = data.split(':');
        const newCategory = parts[1];
        const mediaId = parts[2];

        const pendingItem = getPendingMedia(mediaId);
        if (pendingItem) {
          pendingItem.category = newCategory;
          storePendingMedia(pendingItem);
        }

        let flats = await db.getFlats();
        if (flats.length === 0) {
          const sampleFlat = await db.createFlat({ title: 'Flat 101', address: 'Default St 1', status: 'active' });
          flats = [sampleFlat];
        }

        const keyboard = buildMediaInlineKeyboard(flats, newCategory, mediaId, userLang);
        const categoryPrompt =
          userLang === 'ru'
            ? `Выбранная категория: <b>${newCategory}</b>. Теперь выберите квартиру:`
            : `Selected Category: <b>${newCategory}</b>. Now tap a flat to assign:`;

        await sendTelegramMessage(chatId!, categoryPrompt, keyboard);
        return NextResponse.json({ success: true, category: newCategory });
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
          await db.recordPaymentForFlatReceipt(flatId, mediaUrl);
        }

        if (mediaId) {
          deletePendingMedia(mediaId);
        }

        const flat = await db.getFlat(flatId);
        const flatTitle = flat?.title || (userLang === 'ru' ? 'Квартира' : 'Flat');
        const confirmationMsg =
          userLang === 'ru'
            ? getTranslation('ru', 'botMediaAssigned').replace('{flat}', flatTitle).replace('{category}', category)
            : getTranslation('en', 'botMediaAssigned').replace('{flat}', flatTitle).replace('{category}', category);

        await sendTelegramMessage(chatId!, confirmationMsg);
        return NextResponse.json({ success: true, event });
      }

      return NextResponse.json({ success: true });
    }

    // 4. Handle Text & Voice / Media Messages
    if (payload.message) {
      const msg = payload.message;

      // Handle Commands & Shortcuts
      const rawText = msg.text?.trim() || '';

      if (rawText.startsWith('/')) {
        setupTelegramBot().catch(() => {});

        const parts = rawText.split(/\s+/);
        const rawCmd = parts[0].slice(1).split('@')[0].toLowerCase();
        const cmdArgs = parts.slice(1);

        if (rawCmd === 'start' || rawCmd === 's' || rawCmd === 'menu') {
          await sendTelegramMessage(chatId!, buildMainMenuMessage(userLang), buildMainMenuKeyboard(userLang));
          return NextResponse.json({ success: true, command: 'start' });
        }

        if (rawCmd === 'app' || rawCmd === 'twa' || rawCmd === 'open' || rawCmd === 'a') {
          const promptMsg = getTranslation(userLang, 'botOpenWebAppPrompt');
          await sendTelegramMessage(chatId!, promptMsg, buildWebAppKeyboard(userLang));
          return NextResponse.json({ success: true, command: 'app', app_url: getAppUrl() });
        }

        if (rawCmd === 'reminders' || rawCmd === 'due' || rawCmd === 'r') {
          const alerts = await sendDueRentAlerts(chatId!, userLang);
          if (alerts.length === 0) {
            await sendTelegramMessage(chatId!, getTranslation(userLang, 'botNoDuePayments'));
          }
          return NextResponse.json({ success: true, command: 'reminders', count: alerts.length });
        }

        if (rawCmd === 'digest' || rawCmd === 'weekly' || rawCmd === 'snapshot' || rawCmd === 'd') {
          await sendWeeklyDigest(chatId!, userLang);
          return NextResponse.json({ success: true, command: 'digest' });
        }

        if (rawCmd === 'lang' || rawCmd === 'language' || rawCmd === 'l') {
          if (cmdArgs.length > 0) {
            const requestedLang = cmdArgs[0].toLowerCase();
            if (requestedLang === 'ru' || requestedLang === 'en') {
              await db.setUserLanguage(userId, requestedLang as Language);
              const confirmMsg =
                requestedLang === 'ru'
                  ? getTranslation('ru', 'botLangChangedRu')
                  : getTranslation('en', 'botLangChangedEn');

              await sendTelegramMessage(
                chatId!,
                `${confirmMsg}\n\n${buildMainMenuMessage(requestedLang as Language)}`,
                buildMainMenuKeyboard(requestedLang as Language)
              );
              return NextResponse.json({ success: true, command: 'lang', lang: requestedLang });
            }
          }

          await sendTelegramMessage(
            chatId!,
            getTranslation(userLang, 'botSelectLanguagePrompt'),
            buildLanguageKeyboard()
          );
          return NextResponse.json({ success: true, command: 'lang', menu: 'lang' });
        }

        if (rawCmd === 'help' || rawCmd === 'h' || rawCmd === '?') {
          const helpTitle = getTranslation(userLang, 'botHelpTitle');
          const helpDesc = getTranslation(userLang, 'botHelpDesc');
          const helpMsg = `${helpTitle}\n\n${helpDesc}`;
          await sendTelegramMessage(chatId!, helpMsg, buildMainMenuKeyboard(userLang));
          return NextResponse.json({ success: true, command: 'help' });
        }
      }

      const mediaId = 'm_' + Math.random().toString(36).slice(2, 10);
      const isForwarded = !!(msg.forward_from || msg.forward_from_chat || msg.forward_date || msg.forward_origin);

      let flats = await db.getFlats();
      if (flats.length === 0) {
        const sampleFlat = await db.createFlat({ title: 'Flat 101', address: 'Default St 1', status: 'active' });
        flats = [sampleFlat];
      }

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

        const keyboard = buildMediaInlineKeyboard(flats, 'Note', mediaId, userLang);
        const promptMsg =
          userLang === 'ru'
            ? `🎙️ <b>Голосовая заметка расшифрована</b>:\n"${transcript}"\n\nВыберите категорию и привяжите к квартире:`
            : `🎙️ <b>Voice Note Transcribed</b>:\n"${transcript}"\n\nSelect Category & Assign to flat:`;

        await sendTelegramMessage(chatId!, promptMsg, keyboard);
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

        const keyboard = buildMediaInlineKeyboard(flats, 'Rent Receipt', mediaId, userLang);
        const promptMsg =
          userLang === 'ru'
            ? `📄 <b>Чек / Медиа получено</b>\nСумма: ${parsed.amount || 'Н/Д'}\nВыберите категорию и привяжите к квартире:`
            : `📄 <b>Receipt / Media Captured</b>\nAmount: ${parsed.amount || 'N/A'}\nSelect Category & Assign to flat:`;

        await sendTelegramMessage(chatId!, promptMsg, keyboard);
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

        const keyboard = buildMediaInlineKeyboard(flats, 'Utility', mediaId, userLang);
        const promptMsg =
          userLang === 'ru'
            ? `📑 <b>Документ получен</b>: ${docName}\nВыберите категорию и привяжите к квартире:`
            : `📑 <b>Document Captured</b>: ${docName}\nSelect Category & Assign to flat:`;

        await sendTelegramMessage(chatId!, promptMsg, keyboard);
        return NextResponse.json({ success: true, media_id: mediaId });
      }

      // Handle Plain Forwarded Text Messages
      if (isForwarded && msg.text) {
        const contentText = `Forwarded message: "${msg.text}"`;

        storePendingMedia({
          mediaId,
          mediaUrl: '',
          contentText,
          eventType: 'note',
          category: 'Note',
          isForwarded: true,
        });

        const keyboard = buildMediaInlineKeyboard(flats, 'Note', mediaId, userLang);
        const promptMsg =
          userLang === 'ru'
            ? `📥 <b>Пересланное сообщение перехвачено</b>:\n"${msg.text}"\n\nВыберите категорию и привяжите к квартире:`
            : `📥 <b>Forwarded Text Message Intercepted</b>:\n"${msg.text}"\n\nSelect Category & Assign to flat:`;

        await sendTelegramMessage(chatId!, promptMsg, keyboard);
        return NextResponse.json({ success: true, media_id: mediaId, text: msg.text });
      }

      // Handle Unhandled Regular Text Messages (e.g. "hi", "app", "twa")
      if (msg.text && !isForwarded) {
        const lower = msg.text.trim().toLowerCase();
        if (lower === 'app' || lower === 'twa') {
          const promptMsg = getTranslation(userLang, 'botOpenWebAppPrompt');
          await sendTelegramMessage(chatId!, promptMsg, buildWebAppKeyboard(userLang));
          return NextResponse.json({ success: true, command: 'app', app_url: getAppUrl() });
        }

        await sendTelegramMessage(chatId!, buildMainMenuMessage(userLang), buildMainMenuKeyboard(userLang));
        return NextResponse.json({ success: true, menu_sent: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
