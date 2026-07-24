'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flat } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

function TenancyForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const flatIdParam = searchParams.get('flat_id') || '';

  const [flats, setFlats] = useState<Flat[]>([]);
  const [flatId, setFlatId] = useState(flatIdParam);
  const [tenantName, setTenantName] = useState('');
  const [tenantContact, setTenantContact] = useState('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2027-07-31');
  const [rentAmount, setRentAmount] = useState(45000);
  const [depositAmount, setDepositAmount] = useState(45000);
  const [dueDay, setDueDay] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFlats() {
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const res = await fetch('/api/twa/flats', {
          headers: { 'x-telegram-init-data': initData },
        });
        if (res.ok) {
          const data: Flat[] = await res.json();
          setFlats(data);
          if (!flatId && data.length > 0) {
            setFlatId(data[0].id);
          }
        }
      } catch {
        setFlats([
          { id: '1', title: 'Flat 101 - City Center', address: 'Lenina St. 45, Flat 12', status: 'vacant', created_at: new Date().toISOString() }
        ]);
        if (!flatId) setFlatId('1');
      }
    }

    loadFlats();
  }, [flatId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flatId) {
      setError(t('selectFlat'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/twa/tenancies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({
          flat_id: flatId,
          tenant_name: tenantName,
          tenant_contact: tenantContact,
          start_date: startDate,
          end_date: endDate,
          rent_amount: Number(rentAmount),
          deposit_amount: Number(depositAmount),
          due_day: Number(dueDay),
          status: 'active',
        }),
      });

      if (res.ok) {
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to record tenancy');
      }
    } catch {
      setError('Network error recording tenancy');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      {error && (
        <div style={{ color: 'var(--accent-rose)', marginBottom: 16, fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">{t('associatedFlat')}</label>
        {flats.length > 0 ? (
          <select
            className="form-select"
            value={flatId}
            onChange={(e) => setFlatId(e.target.value)}
            required
          >
            <option value="" disabled>{t('selectFlat')}</option>
            {flats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title} ({f.address})
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="form-input"
            value={flatId}
            onChange={(e) => setFlatId(e.target.value)}
            placeholder="Flat ID"
            required
          />
        )}
      </div>

      <div className="form-group">
        <label className="form-label">{t('tenantNameLabel')}</label>
        <input
          type="text"
          className="form-input"
          placeholder={t('tenantNamePlaceholder')}
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">{t('tenantContactLabel')}</label>
        <input
          type="text"
          className="form-input"
          placeholder={t('tenantContactPlaceholder')}
          value={tenantContact}
          onChange={(e) => setTenantContact(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 140px' }}>
          <label className="form-label">{t('startDateLabel')}</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ flex: '1 1 140px' }}>
          <label className="form-label">{t('endDateLabel')}</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 140px' }}>
          <label className="form-label">{t('monthlyRentLabel')}</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={rentAmount}
            onChange={(e) => setRentAmount(Number(e.target.value))}
            required
          />
        </div>
        <div className="form-group" style={{ flex: '1 1 140px' }}>
          <label className="form-label">{t('securityDepositLabel')}</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('dueDayLabel')}</label>
        <input
          type="number"
          min="1"
          max="31"
          className="form-input"
          value={dueDay}
          onChange={(e) => setDueDay(Number(e.target.value))}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ flex: 1 }}>
          {t('cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
          {submitting ? t('creating') : t('createTenancy')}
        </button>
      </div>
    </form>
  );
}

export default function NewTenancyPage() {
  const { t } = useLanguage();
  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 20 }}>{t('createTenancyTitle')}</h1>
      <Suspense fallback={<p style={{ color: 'var(--text-secondary)' }}>{t('loading')}</p>}>
        <TenancyForm />
      </Suspense>
    </div>
  );
}
