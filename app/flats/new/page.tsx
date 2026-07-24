'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlatStatus } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

export default function NewFlatPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<FlatStatus>('vacant');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      await fetch('/api/twa/flats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ title, address, status }),
      });

      (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      router.push('/');
    } catch {
      alert('Failed to add flat');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 20 }}>{t('newFlatTitle')}</h1>

      <form onSubmit={handleSubmit} className="glass-card">
        <div className="form-group">
          <label className="form-label">{t('flatTitleLabel')}</label>
          <input
            type="text"
            className="form-input"
            placeholder={t('flatTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('flatAddressLabel')}</label>
          <input
            type="text"
            className="form-input"
            placeholder={t('flatAddressPlaceholder')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('flatStatusLabel')}</label>
          <select
            className="form-select"
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as FlatStatus)}
          >
            <option value="active">{t('statusActive')}</option>
            <option value="vacant">{t('statusVacant')}</option>
            <option value="maintenance">{t('statusMaintenance')}</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? t('saving') : t('saveFlat')}
        </button>
      </form>
    </div>
  );
}
