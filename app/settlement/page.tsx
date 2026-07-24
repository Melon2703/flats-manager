'use client';

import { useState } from 'react';

export default function SettlementPage() {
  const [flatTitle, setFlatTitle] = useState('Flat 101');
  const [tenantName, setTenantName] = useState('Ivan Petrov');
  const [depositAmount, setDepositAmount] = useState(50000);
  const [unpaidRent, setUnpaidRent] = useState(10000);
  const [utilities, setUtilities] = useState(4000);
  const [cleaning, setCleaning] = useState(3000);
  const [damages, setDamages] = useState(5000);

  const totalDeductions = unpaidRent + utilities + cleaning + damages;
  const refundAmount = depositAmount - totalDeductions;

  const generatedSummarySheet = `📋 **MOVE-OUT SETTLEMENT SUMMARY**
Flat: ${flatTitle}
Tenant: ${tenantName}

Initial Deposit: ${depositAmount.toLocaleString()} RUB
--- DEDUCTIONS ---
- Unpaid Rent: ${unpaidRent.toLocaleString()} RUB
- Utilities: ${utilities.toLocaleString()} RUB
- Cleaning Fee: ${cleaning.toLocaleString()} RUB
- Damages: ${damages.toLocaleString()} RUB

${refundAmount >= 0 ? `✅ Final Deposit Refund: ${refundAmount.toLocaleString()} RUB` : `⚠️ Tenant Balance Due: ${Math.abs(refundAmount).toLocaleString()} RUB`}`;

  function copySummarySheet() {
    navigator.clipboard.writeText(generatedSummarySheet);
    (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    alert('Summary sheet copied to clipboard!');
  }

  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 4 }}>Settlement Calculator</h1>
      <p className="subtitle">Deposit refund formula: Deposit - (Rent + Utilities + Cleaning + Damages)</p>

      <div className="glass-card">
        <div className="form-group">
          <label className="form-label">Flat Title</label>
          <input
            type="text"
            className="form-input"
            value={flatTitle}
            onChange={(e) => setFlatTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tenant Name</label>
          <input
            type="text"
            className="form-input"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Security Deposit (RUB)</label>
          <input
            type="number"
            className="form-input"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
          />
        </div>

        <h3 style={{ fontSize: '1rem', marginTop: 16, marginBottom: 12, color: 'var(--accent-amber)' }}>
          Deductions Breakdown
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Unpaid Rent</label>
            <input
              type="number"
              className="form-input"
              value={unpaidRent}
              onChange={(e) => setUnpaidRent(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Utilities</label>
            <input
              type="number"
              className="form-input"
              value={utilities}
              onChange={(e) => setUtilities(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cleaning Fee</label>
            <input
              type="number"
              className="form-input"
              value={cleaning}
              onChange={(e) => setCleaning(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Damages</label>
            <input
              type="number"
              className="form-input"
              value={damages}
              onChange={(e) => setDamages(Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 16, borderRadius: 12, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Total Deductions:</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>-{totalDeductions.toLocaleString()} RUB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
            <span>Final Settlement:</span>
            <span style={{ color: refundAmount >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
              {refundAmount >= 0 ? `${refundAmount.toLocaleString()} RUB Refund` : `${Math.abs(refundAmount).toLocaleString()} RUB Owed`}
            </span>
          </div>
        </div>

        <button className="btn-primary" onClick={copySummarySheet} style={{ marginTop: 20 }}>
          📋 Copy Summary Sheet for Tenant
        </button>
      </div>
    </div>
  );
}
