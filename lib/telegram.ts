export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.WEBAPP_URL || process.env.APP_URL;
  if (envUrl) return envUrl;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`;
  }
  return 'https://flats-manager.vercel.app';
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

export async function setTelegramBotCommands(botToken?: string) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.startsWith('test')) {
    return { ok: true, result: true };
  }

  const commands = [
    { command: 'start', description: 'Main Menu & TWA / Главное меню' },
    { command: 'app', description: 'Open Telegram Web App / Открыть TWA' },
    { command: 'reminders', description: 'Check due rent / Проверить задолженности' },
    { command: 'digest', description: 'Weekly snapshot digest / Недельный отчет' },
    { command: 'lang', description: 'Change language / Сменить язык' },
    { command: 'help', description: 'Help & commands / Справка' },
  ];

  try {
    const url = `https://api.telegram.org/bot${token}/setMyCommands`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    });
    return await res.json();
  } catch (error) {
    console.error('Error setting Telegram bot commands:', error);
    return { ok: false, error };
  }
}

export async function setTelegramChatMenuButton(botToken?: string, appUrl?: string) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.startsWith('test')) {
    return { ok: true, result: true };
  }

  const targetUrl = appUrl || getAppUrl();

  try {
    const url = `https://api.telegram.org/bot${token}/setChatMenuButton`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'Open App',
          web_app: { url: targetUrl },
        },
      }),
    });
    return await res.json();
  } catch (error) {
    console.error('Error setting Telegram chat menu button:', error);
    return { ok: false, error };
  }
}

export async function setupTelegramBot(botToken?: string, appUrl?: string) {
  const commandsRes = await setTelegramBotCommands(botToken);
  const menuRes = await setTelegramChatMenuButton(botToken, appUrl);
  return {
    ok: Boolean(commandsRes?.ok && menuRes?.ok),
    commands: commandsRes,
    menuButton: menuRes,
  };
}
