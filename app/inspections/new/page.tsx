'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function InspectionChecklistForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTenancyId = searchParams.get('tenancy_id') || '';

  const [tenancies, setTenancies] = useState<any[]>([]);
  const [tenancyId, setTenancyId] = useState(initialTenancyId);
  const [inspectionType, setInspectionType] = useState<'move_in' | 'move_out'>('move_in');
  const [tenantName, setTenantName] = useState('');
  
  // Meter readings
  const [electricMeter, setElectricMeter] = useState('');
  const [waterMeter, setWaterMeter] = useState('');
  const [gasMeter, setGasMeter] = useState('');

  // Appliance & condition state
  const [fridgeStatus, setFridgeStatus] = useState('good');
  const [acStatus, setAcStatus] = useState('good');
  const [washerStatus, setWasherStatus] = useState('good');
  const [inventoryNotes, setInventoryNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Move-in baseline data when completing move-out
  const [baselineChecklist, setBaselineChecklist] = useState<any | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  useEffect(() => {
    async function loadTenancies() {
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const res = await fetch('/api/twa/tenancies', {
          headers: { 'x-telegram-init-data': initData },
        });
        if (res.ok) {
          const data = await res.json();
          setTenancies(data);
          if (!tenancyId && data.length > 0) {
            setTenancyId(data[0].id);
            setTenantName(data[0].tenant_name || '');
          }
        }
      } catch {
        // Fallback
      }
    }
    loadTenancies();
  }, [tenancyId]);

  // Fetch baseline checklist if Move-Out selected
  useEffect(() => {
    async function fetchBaseline() {
      if (inspectionType === 'move_out' && tenancyId) {
        try {
          const initData = (window as any).Telegram?.WebApp?.initData || '';
          const res = await fetch(`/api/twa/inspections?tenancy_id=${tenancyId}&type=move_in`, {
            headers: { 'x-telegram-init-data': initData },
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.meter_readings_json) {
              setBaselineChecklist(data);
            } else {
              setBaselineChecklist(null);
            }
          }
        } catch {
          setBaselineChecklist(null);
        }
      } else {
        setBaselineChecklist(null);
      }
    }
    fetchBaseline();
  }, [inspectionType, tenancyId]);

  function handleTenancyChange(id: string) {
    setTenancyId(id);
    const sel = tenancies.find((t) => t.id === id);
    if (sel) {
      setTenantName(sel.tenant_name || '');
    }
  }

  function addPhotoUrl() {
    if (photoUrl.trim()) {
      setPhotoUrls((prev) => [...prev, photoUrl.trim()]);
      setPhotoUrl('');
    }
  }

  function removePhotoUrl(index: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const payload = {
        tenancy_id: tenancyId || crypto.randomUUID(),
        inspection_type: inspectionType,
        items_json: {
          tenant_name: tenantName,
          inventory_notes: inventoryNotes,
          photo_urls: photoUrls,
          appliances: {
            refrigerator: fridgeStatus,
            air_conditioner: acStatus,
            washing_machine: washerStatus,
          },
        },
        meter_readings_json: {
          electricity: Number(electricMeter) || 0,
          water: Number(waterMeter) || 0,
          gas: Number(gasMeter) || 0,
        },
      };

      const res = await fetch('/api/twa/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        setSuccessSaved(true);
      } else {
        alert('Failed to save checklist');
      }
    } catch {
      alert('Failed to record inspection checklist');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 4 }}>Inspection Checklist</h1>
      <p className="subtitle">Record inventory state, photos & utility meter readings</p>

      {successSaved ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 24 }}>
          <span style={{ fontSize: '3rem' }}>✅</span>
          <h2 style={{ fontSize: '1.2rem', margin: '12px 0' }}>
            {inspectionType === 'move_in' ? 'Move-In Checklist Recorded' : 'Move-Out Inspection Completed'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
            {inspectionType === 'move_in'
              ? 'Baseline condition & meter readings are stored safely.'
              : 'Move-Out comparative readings captured. Ready to compute deposit settlement.'}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => router.push('/inspections')}>
              📋 View All Checklists
            </button>
            {inspectionType === 'move_out' && (
              <button
                className="btn-primary"
                onClick={() => {
                  const moveInElec = baselineChecklist?.meter_readings_json?.electricity || 0;
                  const moveInWater = baselineChecklist?.meter_readings_json?.water || 0;
                  const moveInGas = baselineChecklist?.meter_readings_json?.gas || 0;

                  const elecCost = Math.max(0, (Number(electricMeter) || 0) - moveInElec) * 6.5;
                  const waterCost = Math.max(0, (Number(waterMeter) || 0) - moveInWater) * 50;
                  const gasCost = Math.max(0, (Number(gasMeter) || 0) - moveInGas) * 7;
                  const totalUtil = Math.round(elecCost + waterCost + gasCost);

                  router.push(`/settlement?tenancy_id=${tenancyId}&tenant_name=${encodeURIComponent(tenantName)}&utilities=${totalUtil}`);
                }}
              >
                🧮 Calculate Final Settlement
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card">
          <div className="form-group">
            <label className="form-label">Inspection Type</label>
            <select
              className="form-select"
              value={inspectionType}
              onChange={(e: any) => setInspectionType(e.target.value)}
            >
              <option value="move_in">Move-In Inspection (Baseline)</option>
              <option value="move_out">Move-Out Inspection (Final Comparative)</option>
            </select>
          </div>

          {tenancies.length > 0 && (
            <div className="form-group">
              <label className="form-label">Select Tenancy</label>
              <select
                className="form-select"
                value={tenancyId}
                onChange={(e) => handleTenancyChange(e.target.value)}
              >
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenant_name} (Flat ID: {t.flat_id.slice(0, 6)}...)
                  </option>
                ))}
              </select>
            </div>
          )}

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

          {/* Comparative Move-In Baseline Alert Box */}
          {inspectionType === 'move_out' && baselineChecklist && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 4 }}>
                📌 Move-In Baseline Found ({new Date(baselineChecklist.created_at).toLocaleDateString()}):
              </div>
              <div>⚡ Elec Baseline: {baselineChecklist.meter_readings_json?.electricity || 0} kWh</div>
              <div>💧 Water Baseline: {baselineChecklist.meter_readings_json?.water || 0} m³</div>
              <div>🔥 Gas Baseline: {baselineChecklist.meter_readings_json?.gas || 0} m³</div>
            </div>
          )}

          {/* Meter Readings */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
            Utility Meter Readings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">Electricity (kWh)</label>
              <input
                type="number"
                className="form-input"
                placeholder="1000"
                value={electricMeter}
                onChange={(e) => setElectricMeter(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Water (m³)</label>
              <input
                type="number"
                className="form-input"
                placeholder="50"
                value={waterMeter}
                onChange={(e) => setWaterMeter(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gas (m³)</label>
              <input
                type="number"
                className="form-input"
                placeholder="10"
                value={gasMeter}
                onChange={(e) => setGasMeter(e.target.value)}
              />
            </div>
          </div>

          {/* Appliance States */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
            Appliance & Inventory Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">Refrigerator</label>
              <select
                className="form-select"
                value={fridgeStatus}
                onChange={(e) => setFridgeStatus(e.target.value)}
              >
                <option value="good">Good / Working</option>
                <option value="dirty">Needs Cleaning</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Air Conditioner</label>
              <select
                className="form-select"
                value={acStatus}
                onChange={(e) => setAcStatus(e.target.value)}
              >
                <option value="good">Good / Working</option>
                <option value="noisy">Noisy / Service needed</option>
                <option value="damaged">Broken / Damaged</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Washing Machine</label>
              <select
                className="form-select"
                value={washerStatus}
                onChange={(e) => setWasherStatus(e.target.value)}
              >
                <option value="good">Good / Working</option>
                <option value="leaking">Minor Leak</option>
                <option value="damaged">Broken</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">Condition & Inventory Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="All keys handed over, walls clean, scratch on living room floor..."
              value={inventoryNotes}
              onChange={(e) => setInventoryNotes(e.target.value)}
            />
          </div>

          {/* Photo Links */}
          <div className="form-group">
            <label className="form-label">Condition Evidence Photo URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/meter_photo.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ width: 'auto', whiteSpace: 'nowrap' }}
                onClick={addPhotoUrl}
              >
                + Add Link
              </button>
            </div>
            {photoUrls.length > 0 && (
              <ul style={{ marginTop: 8, fontSize: '0.85rem', paddingLeft: 16 }}>
                {photoUrls.map((url, idx) => (
                  <li key={idx} style={{ margin: '4px 0', wordBreak: 'break-all' }}>
                    <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>
                      {url}
                    </a>{' '}
                    <button
                      type="button"
                      onClick={() => removePhotoUrl(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        cursor: 'pointer',
                        marginLeft: 6,
                      }}
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 12 }}>
            {submitting ? 'Saving Checklist...' : 'Save Inspection Checklist'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function InspectionChecklistPage() {
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-secondary)' }}>Loading form...</p>}>
      <InspectionChecklistForm />
    </Suspense>
  );
}
