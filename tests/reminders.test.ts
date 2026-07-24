import { describe, it, expect } from 'vitest';
import { generateReminderDraft } from '../lib/reminders';

describe('Reminder Draft Generator Seam', () => {
  it('generates polite, customized reminder drafts for tenants', () => {
    const draft = generateReminderDraft({
      tenantName: 'Ivan',
      flatTitle: 'Flat 101',
      amount: 45000,
      dueDate: '2026-07-25',
      status: 'Due Today',
    });

    expect(draft).toContain('Ivan');
    expect(draft).toContain('Flat 101');
    expect(draft).toContain('45,000');
    expect(draft).toContain('2026-07-25');
  });

  it('generates overdue reminder draft with polite tone', () => {
    const draft = generateReminderDraft({
      tenantName: 'Elena',
      flatTitle: 'Lenina 45, apt 12',
      amount: 50000,
      dueDate: '2026-07-20',
      status: 'Overdue',
    });

    expect(draft).toContain('Elena');
    expect(draft).toContain('Lenina 45, apt 12');
    expect(draft).toContain('50,000');
  });
});
