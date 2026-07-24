'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function TenancyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flatIdParam = searchParams.get('flat_id') || '';

  const [flatId, setFlatId] = useState(flatIdParam);
  const [tenantName, setTenantName] = useState('');
  const [tenantContact, setTenantContact] = useState('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2027-07-31');
  const [rentAmount, setRentAmount] = useState(45000);
  const [depositAmount, setDepositAmount] = useState(45000);
  const [dueDay, setDueDay] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      await fetch('/api/twa/tenancies', {
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

      (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      router.push('/');
    } catch {
      alert('Failed to record tenancy');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      <div className="form-group">
        <label className="form-label">Tenant Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Ivan Petrov"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Tenant Phone / Telegram</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. +7 999 123-45-67 or @ivan_p"
          value={tenantContact}
          onChange={(e) => setTenantContact(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Monthly Rent (RUB)</label>
          <input
            type="number"
            className="form-input"
            value={rentAmount}
            onChange={(e) => setRentAmount(Number(e.target.value))}
            required
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Security Deposit (RUB)</label>
          <input
            type="number"
            className="form-input"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Monthly Payment Due Day (1 - 31)</label>
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

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Creating Tenancy...' : 'Create Tenancy'}
      </button>
    </form>
  );
}

export default function NewTenancyPage() {
  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 20 }}>Create New Tenancy</h1>
      <Suspense fallback={<p style={{ color: 'var(--text-secondary)' }}>Loading form...</p>}>
        <TenancyForm />
      </Suspense>
    </div>
  );
}
