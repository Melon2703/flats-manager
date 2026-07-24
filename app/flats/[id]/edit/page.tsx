'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FlatStatus } from '@/lib/types';

export default function EditFlatPage() {
  const router = useRouter();
  const params = useParams();
  const flatId = params.id as string;

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<FlatStatus>('vacant');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFlat() {
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const res = await fetch(`/api/twa/flats/${flatId}`, {
          headers: { 'x-telegram-init-data': initData },
        });

        if (res.ok) {
          const flat = await res.json();
          setTitle(flat.title || '');
          setAddress(flat.address || '');
          setStatus(flat.status || 'vacant');
        } else {
          setError('Failed to fetch flat details');
        }
      } catch {
        setError('Network error fetching flat');
      } finally {
        setLoading(false);
      }
    }

    if (flatId) {
      loadFlat();
    }
  }, [flatId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch(`/api/twa/flats/${flatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ title, address, status }),
      });

      if (res.ok) {
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update flat');
      }
    } catch {
      setError('Error updating flat');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading flat details...</p>;
  }

  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 20 }}>Edit Flat Record</h1>

      {error && (
        <div style={{ color: 'var(--accent-rose)', marginBottom: 16, fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

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
          <label className="form-label">Status</label>
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

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ flex: 1 }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
            {submitting ? 'Saving...' : 'Update Flat'}
          </button>
        </div>
      </form>
    </div>
  );
}
