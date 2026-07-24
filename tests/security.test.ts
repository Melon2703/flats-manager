import { describe, it, expect } from 'vitest';
import { isAuthorizedUser, validateTelegramInitData, createTestInitData } from '../lib/security';

describe('Security & Authentication Seam', () => {
  it('correctly checks user authorization against whitelist', () => {
    const allowedIds = '123456, 789012';
    expect(isAuthorizedUser(123456, allowedIds)).toBe(true);
    expect(isAuthorizedUser(789012, allowedIds)).toBe(true);
    expect(isAuthorizedUser(999999, allowedIds)).toBe(false);
    expect(isAuthorizedUser(null, allowedIds)).toBe(false);
  });

  it('validates authentic Telegram initData HMAC signatures', () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    const initDataStr = createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    
    const isValid = validateTelegramInitData(initDataStr, botToken);
    expect(isValid).toBe(true);
  });

  it('rejects tampered or invalid Telegram initData', () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    const initDataStr = createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    const tampered = initDataStr + '&tampered=1';
    
    const isValid = validateTelegramInitData(tampered, botToken);
    expect(isValid).toBe(false);
  });
});
