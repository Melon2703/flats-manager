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

export async function getTelegramFileBuffer(fileId: string): Promise<Buffer | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || botToken.startsWith('test')) return null;

  try {
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    const fileRes = await fetch(getFileUrl);
    const fileJson = await fileRes.json();

    if (!fileJson.ok || !fileJson.result?.file_path) return null;

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileJson.result.file_path}`;
    const downloadRes = await fetch(downloadUrl);
    const arrayBuffer = await downloadRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('Error downloading file from Telegram:', err);
    return null;
  }
}
