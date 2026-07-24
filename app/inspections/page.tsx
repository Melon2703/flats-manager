'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { InspectionChecklist, Tenancy } from '@/lib/types';

export default function InspectionsListPage() {
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [selectedTenancyId, setSelectedTenancyId] = useState<string>('');
  const [checklists, setChecklists] = useState<InspectionChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const tenanciesRes = await fetch('/api/twa/tenancies', {
          headers: { 'x-telegram-init-data': initData },
        });
        if (tenanciesRes.ok) {
          const data: Tenancy[] = await tenanciesRes.json();
          setTenancies(data);
          if (data.length > 0) {
            setSelectedTenancyId(data[0].id);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function fetchChecklists() {
      if (!selectedTenancyId) return;
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const res = await fetch(`/api/twa/inspections?tenancy_id=${selectedTenancyId}`, {
          headers: { 'x-telegram-init-data': initData },
        });
        if (res.ok) {
          const data = await res.json();
          setChecklists(data);
        }
      } catch {
        setChecklists([]);
      }
    }
    fetchChecklists();
  }, [selectedTenancyId]);

  const moveInChecklist = checklists.find((c) => c.inspection_type === 'move_in');
  const moveOutChecklist = checklists.find((c) => c.inspection_type === 'move_out');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 className="title-primary" style={{ marginBottom: 4 }}>Inspection Checklists</h1>
          <p className="subtitle">Move-In baseline & Move-Out state comparison</p>
        </div>
        <Link href="/inspections/new">
          <button className="btn-primary" style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}>
            + New Checklist
          </button>
        </Link>
      </div>

      {tenancies.length > 0 && (
        <div className="glass-card" style={{ padding: 12, marginBottom: 16 }}>
          <label className="form-label" style={{ marginBottom: 6 }}>Select Tenancy</label>
          <select
            className="form-select"
            value={selectedTenancyId}
            onChange={(e) => setSelectedTenancyId(e.target.value)}
          >
            {tenancies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tenant_name} — Flat ID: {t.flat_id.slice(0, 6)}... ({t.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading checklists...</p>
      ) : checklists.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            No inspection checklists recorded for this tenancy yet.
          </p>
          <Link href={`/inspections/new?tenancy_id=${selectedTenancyId}`}>
            <button className="btn-primary">+ Record Move-In Checklist</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Comparative Card */}
          {moveInChecklist && moveOutChecklist && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: 12, color: 'var(--accent-blue)' }}>
                ⚡ Move-In vs Move-Out Comparative Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: 12, borderRadius: 8 }}>
                  <strong style={{ color: 'var(--accent-green)' }}>Move-In Baseline</strong>
                  <div style={{ marginTop: 6 }}>⚡ Elec: {moveInChecklist.meter_readings_json?.electricity ?? '-'} kWh</div>
                  <div>💧 Water: {moveInChecklist.meter_readings_json?.water ?? '-'} m³</div>
                  <div>🔥 Gas: {moveInChecklist.meter_readings_json?.gas ?? '-'} m³</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: 12, borderRadius: 8 }}>
                  <strong style={{ color: 'var(--accent-amber)' }}>Move-Out Final</strong>
                  <div style={{ marginTop: 6 }}>⚡ Elec: {moveOutChecklist.meter_readings_json?.electricity ?? '-'} kWh</div>
                  <div>💧 Water: {moveOutChecklist.meter_readings_json?.water ?? '-'} m³</div>
                  <div>🔥 Gas: {moveOutChecklist.meter_readings_json?.gas ?? '-'} m³</div>
                </div>
              </div>

              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Link href={`/settlement?tenancy_id=${selectedTenancyId}`}>
                  <button className="btn-primary" style={{ width: 'auto', padding: '8px 14px' }}>
                    🧮 Compute Final Settlement
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Individual Checklist Cards */}
          {checklists.map((item) => (
            <div key={item.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className={`badge ${item.inspection_type === 'move_in' ? 'badge-active' : 'badge-overdue'}`}>
                  {item.inspection_type === 'move_in' ? 'Move-In Checklist (Baseline)' : 'Move-Out Checklist (Final)'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ margin: '12px 0', fontSize: '0.9rem' }}>
                <div><strong>Tenant:</strong> {item.items_json?.tenant_name || 'N/A'}</div>
                <div>
                  <strong>Meter Readings:</strong> Elec: {item.meter_readings_json?.electricity ?? 0} kWh | Water: {item.meter_readings_json?.water ?? 0} m³ | Gas: {item.meter_readings_json?.gas ?? 0} m³
                </div>
                {item.items_json?.inventory_notes && (
                  <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
                    <strong>Notes:</strong> {item.items_json.inventory_notes}
                  </div>
                )}
                {item.items_json?.photo_urls && item.items_json.photo_urls.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <strong>Photos:</strong>{' '}
                    {item.items_json.photo_urls.map((url: string, idx: number) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', marginRight: 8 }}>
                        [Photo {idx + 1}]
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
