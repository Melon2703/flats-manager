'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flat } from '@/lib/types';

export default function HomePage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
    }

    async function fetchFlats() {
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const res = await fetch('/api/twa/flats', {
          headers: { 'x-telegram-init-data': initData },
        });

        if (res.ok) {
          const data = await res.json();
          setFlats(data);
        } else {
          setFlats([
            { id: '1', title: 'Flat 101 - City Center', address: 'Lenina St. 45, Flat 12', status: 'active', created_at: new Date().toISOString() },
            { id: '2', title: 'Flat 202 - Riverside View', address: 'Naberezhnaya 10, Flat 5', status: 'vacant', created_at: new Date().toISOString() },
          ]);
        }
      } catch {
        setFlats([
          { id: '1', title: 'Flat 101 - City Center', address: 'Lenina St. 45, Flat 12', status: 'active', created_at: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchFlats();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="title-primary">Digital Back Office</h1>
          <p className="subtitle">Anya's Mom Rental Dashboard</p>
        </div>
        <Link href="/flats/new">
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>+ Add Flat</button>
        </Link>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading flats...</p>
      ) : flats.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No flats added yet.</p>
          <Link href="/flats/new">
            <button className="btn-primary">+ Add Your First Flat</button>
          </Link>
        </div>
      ) : (
        flats.map((flat) => (
          <div key={flat.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{flat.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{flat.address}</p>
              </div>
              <span className={`badge ${flat.status === 'active' ? 'badge-active' : 'badge-vacant'}`}>
                {flat.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link href={`/flats/${flat.id}`} style={{ flex: 1 }}>
                <button className="btn-secondary">📜 View Timeline</button>
              </Link>
              <Link href={`/tenancies/new?flat_id=${flat.id}`} style={{ flex: 1 }}>
                <button className="btn-primary">+ Tenancy</button>
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
