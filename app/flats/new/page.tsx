'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlatStatus } from '@/lib/types';

export default function NewFlatPage() {
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
      <h1 className="title-primary" style={{ marginBottom: 20 }}>Add New Flat</h1>

      <form onSubmit={handleSubmit} className="glass-card">
        <div className="form-group">
          <label className="form-label">Flat Title / Number</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Flat 101 - City Center"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Full Physical Address</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Lenina St 45, Flat 12"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Initial Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as FlatStatus)}
          >
            <option value="active">Occupied</option>
            <option value="vacant">Vacant</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Flat'}
        </button>
      </form>
    </div>
  );
}
