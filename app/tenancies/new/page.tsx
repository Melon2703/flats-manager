'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flat } from '@/lib/types';

function TenancyForm() {
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
        // Fallback flat list
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
      setError('Please select a flat');
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
        <label className="form-label">Associated Flat</label>
        {flats.length > 0 ? (
          <select
            className="form-select"
            value={flatId}
            onChange={(e) => setFlatId(e.target.value)}
            required
          >
            <option value="" disabled>Select a Flat</option>
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
        <label className="form-label">Tenant Phone / Telegram Contact</label>
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
          <label className="form-label">Tenancy Start Date</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Tenancy End Date</label>
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
            min="0"
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
            min="0"
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

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ flex: 1 }}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
          {submitting ? 'Creating...' : 'Create Tenancy'}
        </button>
      </div>
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
