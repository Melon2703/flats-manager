'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Flat, TimelineEvent, Tenancy } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

export default function FlatDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const flatId = params.id as string;

  const [flat, setFlat] = useState<Flat | null>(null);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlatData() {
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const flatRes = await fetch(`/api/twa/flats/${flatId}`, {
          headers: { 'x-telegram-init-data': initData },
        });

        if (flatRes.ok) {
          const fetchedFlat: Flat = await flatRes.json();
          setFlat(fetchedFlat);
        }

        const tenancyRes = await fetch(`/api/twa/tenancies?flat_id=${flatId}`, {
          headers: { 'x-telegram-init-data': initData },
        });
        if (tenancyRes.ok) {
          const fetchedTenancies: Tenancy[] = await tenancyRes.json();
          setTenancies(fetchedTenancies);
        }
      } catch {
        setFlat({
          id: flatId,
          title: 'Flat 101 - City Center',
          address: 'Lenina St. 45, Flat 12',
          status: 'active',
          created_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }

    loadFlatData();
  }, [flatId]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 className="title-primary">{flat?.title || t('loading')}</h1>
          <p className="subtitle">{flat?.address}</p>
        </div>
        {flat && (
          <Link href={`/flats/${flat.id}/edit`}>
            <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              {t('editFlatBtn')}
            </button>
          </Link>
        )}
      </div>

      {tenancies.length > 0 && (
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 8, color: 'var(--accent-primary)' }}>
            {t('currentTenancy')}
          </h2>
          {tenancies.map((ten) => (
            <div key={ten.id} style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>{t('tenant')}:</strong> {ten.tenant_name} ({ten.tenant_contact})</p>
              <p><strong>{t('rent')}:</strong> {ten.rent_amount.toLocaleString()} RUB ({t('dueOnDay')} {ten.due_day} {t('day')})</p>
              <p><strong>{t('deposit')}:</strong> {ten.deposit_amount.toLocaleString()} RUB</p>
              <p><strong>{t('leasePeriod')}:</strong> {ten.start_date} — {ten.end_date}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>{t('timelineEvents')}</h2>

        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="timeline-item">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(event.created_at).toLocaleString()}
              </p>
              <p style={{ fontWeight: 600 }}>
                {event.event_type === 'voice_transcript' ? t('voiceNote') : event.event_type === 'receipt' ? t('receipt') : t('note')}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {event.content_text}
              </p>
            </div>
          ))
        ) : (
          <div>
            <div className="timeline-item">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Today at 10:15 AM</p>
              <p style={{ fontWeight: 600 }}>{t('voiceNote')}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                "Tenant reported faucet dripping in bathroom, requested plumber for Tuesday."
              </p>
            </div>

            <div className="timeline-item">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>July 20, 2026</p>
              <p style={{ fontWeight: 600 }}>{t('receipt')}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                45,000 RUB paid via Bank Transfer. Receipt attached.
              </p>
            </div>

            <div className="timeline-item">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>July 01, 2026</p>
              <p style={{ fontWeight: 600 }}>{t('moveInTag')}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Baseline photos & electric meter reading (14,520 kWh) documented.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
