import { describe, it, expect } from 'vitest';
import { translations, getTranslation, Language } from '../lib/i18n';
import { generateSettlementSummarySheet } from '../lib/settlement';

describe('i18n Internationalization Seam (lib/i18n.ts)', () => {
  it('provides Russian (ru) as default language dictionary with complete translations', () => {
    expect(translations.ru).toBeDefined();
    expect(translations.en).toBeDefined();
    expect(translations.ru.appTitle).toBe('Flats Manager');
    expect(translations.ru.flats).toBe('Квартиры');
    expect(translations.ru.ledger).toBe('Выписки');
    expect(translations.ru.settlement).toBe('Расчет');
    expect(translations.ru.checklist).toBe('Чек-лист');
  });

  it('guarantees key parity between Russian and English translation dictionaries', () => {
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(ruKeys).toEqual(enKeys);
  });

  it('getTranslation safely resolves strings and fallbacks', () => {
    expect(getTranslation('ru', 'addFlat')).toBe('+ Добавить квартиру');
    expect(getTranslation('en', 'addFlat')).toBe('+ Add Flat');
    expect(getTranslation('ru', 'nonExistentKey' as any)).toBe('nonExistentKey');
  });

  it('generateSettlementSummarySheet produces localized Russian summary sheet when lang=ru', () => {
    const summary = {
      deposit_amount: 50000,
      deductions: {
        unpaid_rent: 10000,
        utilities: 5000,
        cleaning: 3000,
        damages: 2000,
      },
      refund_amount: 30000,
      itemized_breakdown: [
        { category: 'Damages', description: 'Broken chair', amount: 2000, photo_urls: ['https://example.com/chair.jpg'] },
      ],
    };

    const sheetRu = generateSettlementSummarySheet(summary, 'Иван Петров', 'Квартира 101', 'ru');
    expect(sheetRu).toContain('РАСЧЕТ ПРИ ВЫЕЗДЕ');
    expect(sheetRu).toContain('Квартира: Квартира 101');
    expect(sheetRu).toContain('Арендатор: Иван Петров');
    expect(sheetRu).toContain('Депозит (залог): 50 000 руб.');
    expect(sheetRu).toContain('Долг по аренде: 10 000 руб.');
    expect(sheetRu).toContain('Возврат залога арендатору**: 30 000 руб.');

    const sheetEn = generateSettlementSummarySheet(summary, 'Ivan Petrov', 'Flat 101', 'en');
    expect(sheetEn).toContain('MOVE-OUT SETTLEMENT SUMMARY');
    expect(sheetEn).toContain('Initial Deposit: 50,000 RUB');
  });
});
