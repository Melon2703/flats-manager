import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAppUrl, setTelegramBotCommands, setTelegramChatMenuButton, setupTelegramBot } from '../lib/telegram';

describe('Telegram Bot Setup & TWA helpers (lib/telegram.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('getAppUrl returns NEXT_PUBLIC_APP_URL if defined', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://my-app.vercel.app';
    expect(getAppUrl()).toBe('https://my-app.vercel.app');
  });

  it('getAppUrl falls back to VERCEL_URL with https prefix if NEXT_PUBLIC_APP_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.WEBAPP_URL;
    delete process.env.APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_URL = 'flats-manager-preview.vercel.app';

    expect(getAppUrl()).toBe('https://flats-manager-preview.vercel.app');
  });

  it('getAppUrl returns default fallback URL if no environment variables are set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.WEBAPP_URL;
    delete process.env.APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;

    expect(getAppUrl()).toBe('https://flats-manager.vercel.app');
  });

  it('setTelegramBotCommands succeeds with mock test token', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    const res = await setTelegramBotCommands();
    expect(res.ok).toBe(true);
  });

  it('setTelegramChatMenuButton succeeds with mock test token', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    const res = await setTelegramChatMenuButton();
    expect(res.ok).toBe(true);
  });

  it('setupTelegramBot executes setMyCommands and setChatMenuButton', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    const res = await setupTelegramBot();
    expect(res.ok).toBe(true);
    expect(res.commands.ok).toBe(true);
    expect(res.menuButton.ok).toBe(true);
  });
});
