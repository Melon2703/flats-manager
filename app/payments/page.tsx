'use client';

import { useEffect, useState } from 'react';
import { Flat, PaymentMethod, PaymentStatus } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

interface EnrichedExpectedPayment {
  id: string;
  tenancy_id: string;
  due_date: string;
  amount: number;
  status: PaymentStatus;
  created_at: string;
  tenant_name: string;
  flat_title: string;
  flat_id: string | null;
  paid_amount: number;
  records: Array<{
    id: string;
    expected_payment_id: string;
    amount: number;
    payment_method: PaymentMethod;
    paid_at: string;
    receipt_url?: string | null;
  }>;
}

export default function PaymentsLedgerPage() {
  const { t, lang } = useLanguage();
  const [payments, setPayments] = useState<EnrichedExpectedPayment[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [selectedFlatId, setSelectedFlatId] = useState<string>('');

  // Modal State
  const [activePayment, setActivePayment] = useState<EnrichedExpectedPayment | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
    fetchFlats();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth, selectedFlatId]);

  async function fetchFlats() {
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/twa/flats', {
        headers: { 'x-telegram-init-data': initData },
      });
      if (res.ok) {
        const data = await res.json();
        setFlats(data);
      }
    } catch (err) {
      console.error('Failed to load flats:', err);
    }
  }

  async function fetchPayments() {
    setLoading(true);
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const queryParams = new URLSearchParams();
      if (selectedMonth) queryParams.set('month', selectedMonth);
      if (selectedFlatId) queryParams.set('flat_id', selectedFlatId);

      const res = await fetch(`/api/twa/payments?${queryParams.toString()}`, {
        headers: { 'x-telegram-init-data': initData },
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncPayments() {
    try {
      const targetDate = `${selectedMonth}-01`;
      await fetch(`/api/cron/generate-payments?date=${targetDate}`);
      await fetchPayments();
    } catch (err) {
      console.error('Failed to sync payments:', err);
    }
  }

  function openRecordModal(payment: EnrichedExpectedPayment) {
    setActivePayment(payment);
    const remaining = Math.max(0, payment.amount - payment.paid_amount);
    setPayAmount(remaining.toString());
    setPayMethod('Bank Transfer');
    setReceiptFile(null);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!activePayment) return;

    setSubmitting(true);
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      let receiptUrl: string | undefined = undefined;

      if (receiptFile) {
        const formData = new FormData();
        formData.append('file', receiptFile);

        const uploadRes = await fetch('/api/twa/upload', {
          method: 'POST',
          headers: { 'x-telegram-init-data': initData },
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          receiptUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/twa/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({
          expected_payment_id: activePayment.id,
          amount: parseFloat(payAmount) || 0,
          payment_method: payMethod,
          receipt_url: receiptUrl,
        }),
      });

      if (res.ok) {
        setActivePayment(null);
        await fetchPayments();
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkWaived(paymentId: string) {
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/twa/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ id: paymentId, status: 'Waived' }),
      });

      if (res.ok) {
        await fetchPayments();
      }
    } catch (err) {
      console.error('Failed to mark waived:', err);
    }
  }

  const getBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return 'badge-paid';
      case 'Partial':
        return 'badge-partial';
      case 'Due Today':
        return 'badge-due-today';
      case 'Overdue':
        return 'badge-overdue';
      case 'Waived':
        return 'badge-waived';
      case 'Pending':
      default:
        return 'badge-pending';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid': return t('statusPaid');
      case 'Partial': return t('statusPartial');
      case 'Due Today': return t('statusDueToday');
      case 'Overdue': return t('statusOverdue');
      case 'Waived': return t('statusWaived');
      case 'Pending': return t('statusPending');
      default: return status;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    if (method === 'Bank Transfer') return t('bankTransfer');
    if (method === 'Cash') return t('cash');
    return method;
  };

  const totalExpected = payments.reduce((acc, p) => acc + (p.status === 'Waived' ? 0 : p.amount), 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.paid_amount, 0);
  const totalOutstanding = Math.max(0, totalExpected - totalCollected);

  const formatCurrency = (val: number) => {
    return val.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US').replace(/\u00a0/g, ' ');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
        <div>
          <h1 className="title-primary">{t('ledgerTitle')}</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>{t('ledgerSubtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={handleSyncPayments} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem', flexShrink: 0 }}>
          {t('syncMonth')}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 10, marginBottom: 0, textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('expected')}</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>₽{formatCurrency(totalExpected)}</p>
        </div>
        <div className="glass-card" style={{ padding: 10, marginBottom: 0, textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('collected')}</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-green)' }}>₽{formatCurrency(totalCollected)}</p>
        </div>
        <div className="glass-card" style={{ padding: 10, marginBottom: 0, textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('outstanding')}</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: totalOutstanding > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            ₽{formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 130px' }}>
            <label className="form-label">{t('month')}</label>
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 130px' }}>
            <label className="form-label">{t('associatedFlat')}</label>
            <select
              className="form-select"
              value={selectedFlatId}
              onChange={(e) => setSelectedFlatId(e.target.value)}
            >
              <option value="">{t('allFlats')}</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Items */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>{t('loading')}</p>
      ) : payments.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 30 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{t('noPayments')}</p>
          <button className="btn-primary" onClick={handleSyncPayments} style={{ width: 'auto' }}>
            {t('generatePayments')}
          </button>
        </div>
      ) : (
        payments.map((p) => {
          return (
            <div key={p.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{p.flat_title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t('tenant')}: <strong>{p.tenant_name}</strong>
                  </p>
                </div>
                <span className={`badge ${getBadgeClass(p.status)}`}>{getStatusLabel(p.status)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>{t('dueDate')}</span>
                  <strong>{p.due_date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>{t('rentAmount')}</span>
                  <strong>₽{formatCurrency(p.amount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>{t('paid')}</span>
                  <strong style={{ color: 'var(--accent-green)' }}>₽{formatCurrency(p.paid_amount)}</strong>
                </div>
              </div>

              {/* Transactions List */}
              {p.records && p.records.length > 0 && (
                <div style={{ marginTop: 10, marginBottom: 12, borderTop: '1px solid var(--card-border)', paddingTop: 10 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t('paymentTransactions')}
                  </p>
                  {p.records.map((rec) => (
                    <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                      <span>
                        💳 ₽{formatCurrency(rec.amount)} ({getMethodLabel(rec.payment_method)}) - {new Date(rec.paid_at).toLocaleDateString()}
                      </span>
                      {rec.receipt_url && (
                        <a href={rec.receipt_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}>
                          📄 {t('receipt')}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {p.status !== 'Paid' && p.status !== 'Waived' && (
                  <button className="btn-primary" onClick={() => openRecordModal(p)} style={{ flex: '1 1 140px', padding: '8px 12px', fontSize: '0.85rem' }}>
                    {t('recordPayment')}
                  </button>
                )}
                {p.status !== 'Waived' && p.status !== 'Paid' && (
                  <button className="btn-secondary" onClick={() => handleMarkWaived(p.id)} style={{ flex: '1 1 120px', padding: '8px 12px', fontSize: '0.85rem' }}>
                    {t('markWaived')}
                  </button>
                )}
                {p.status === 'Paid' && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 600 }}>{t('paymentComplete')}</span>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Record Payment Action Modal */}
      {activePayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 450, background: '#1e293b', marginBottom: 0 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{t('recordPaymentModalTitle')}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              {activePayment.flat_title} - {activePayment.tenant_name}
            </p>

            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">{t('amountReceived')}</label>
                <input
                  type="number"
                  className="form-input"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('paymentMethod')}</label>
                <select
                  className="form-select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                >
                  <option value="Bank Transfer">{t('bankTransfer')}</option>
                  <option value="Cash">{t('cash')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('receiptPhoto')}</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActivePayment(null)}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? t('saving') : t('savePayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
