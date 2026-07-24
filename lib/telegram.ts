export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  inlineKeyboard?: TelegramInlineButton[][]
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || botToken === 'test_token' || botToken === 'test_bot_token') {
    // Return mock response during test/dev
    return { ok: true, result: { message_id: Math.floor(Math.random() * 1000) } };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body: Record<string, any> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  if (inlineKeyboard && inlineKeyboard.length > 0) {
    body.reply_markup = {
      inline_keyboard: inlineKeyboard,
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return { ok: false, error };
  }
}
