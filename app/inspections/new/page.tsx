'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InspectionChecklistPage() {
  const router = useRouter();
  const [tenancyId, setTenancyId] = useState('');
  const [inspectionType, setInspectionType] = useState<'move_in' | 'move_out'>('move_in');
  const [tenantName, setTenantName] = useState('');
  const [electricMeter, setElectricMeter] = useState('');
  const [waterMeter, setWaterMeter] = useState('');
  const [inventoryNotes, setInventoryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      await fetch('/api/twa/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({
          tenancy_id: tenancyId || crypto.randomUUID(),
          inspection_type: inspectionType,
          items_json: { inventory_notes: inventoryNotes, tenant_name: tenantName },
          meter_readings_json: { electricity: electricMeter, water: waterMeter },
        }),
      });

      (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      alert(`Checklist recorded successfully for ${inspectionType === 'move_in' ? 'Move-In' : 'Move-Out'}`);
      router.push('/');
    } catch {
      alert('Failed to record inspection checklist');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 4 }}>Inspection Checklist</h1>
      <p className="subtitle">Record inventory state & utility meter readings</p>

      <form onSubmit={handleSubmit} className="glass-card">
        <div className="form-group">
          <label className="form-label">Inspection Type</label>
          <select
            className="form-select"
            value={inspectionType}
            onChange={(e: any) => setInspectionType(e.target.value)}
          >
            <option value="move_in">Move-In Inspection (Baseline)</option>
            <option value="move_out">Move-Out Inspection (Final)</option>
          </select>
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

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Electric Meter Reading</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 14520 kWh"
              value={electricMeter}
              onChange={(e) => setElectricMeter(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Water Meter Reading</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 342 m³"
              value={waterMeter}
              onChange={(e) => setWaterMeter(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Appliance & Inventory State Notes</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Clean kitchen, refrigerator working, slight scratch on hallway wall..."
            value={inventoryNotes}
            onChange={(e) => setInventoryNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving Checklist...' : 'Save Inspection Checklist'}
        </button>
      </form>
    </div>
  );
}
