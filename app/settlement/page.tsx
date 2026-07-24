'use client';

import { useState } from 'react';
import { calculateSettlement, generateSettlementSummarySheet } from '@/lib/settlement';
import { SettlementDeductions } from '@/lib/types';

export default function SettlementPage() {
  const [flatTitle, setFlatTitle] = useState('Flat 101');
  const [tenantName, setTenantName] = useState('Ivan Petrov');
  const [depositAmount, setDepositAmount] = useState(50000);
  const [deductions, setDeductions] = useState<SettlementDeductions>({
    unpaid_rent: 10000,
    utilities: 4000,
    cleaning: 3000,
    damages: 5000,
  });

  const settlementSummary = calculateSettlement({
    deposit_amount: depositAmount,
    deductions,
  });

  const generatedSummarySheet = generateSettlementSummarySheet(
    settlementSummary,
    tenantName,
    flatTitle
  );

  function copySummarySheet() {
    navigator.clipboard.writeText(generatedSummarySheet);
    (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    alert('Summary sheet copied to clipboard!');
  }

  function handleDeductionChange(field: keyof SettlementDeductions, value: number) {
    setDeductions((prev) => ({
      ...prev,
      [field]: value,
    }));
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
              value={deductions.unpaid_rent}
              onChange={(e) => handleDeductionChange('unpaid_rent', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Utilities</label>
            <input
              type="number"
              className="form-input"
              value={deductions.utilities}
              onChange={(e) => handleDeductionChange('utilities', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cleaning Fee</label>
            <input
              type="number"
              className="form-input"
              value={deductions.cleaning}
              onChange={(e) => handleDeductionChange('cleaning', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Damages</label>
            <input
              type="number"
              className="form-input"
              value={deductions.damages}
              onChange={(e) => handleDeductionChange('damages', Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 16, borderRadius: 12, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
            <span>Final Settlement:</span>
            <span style={{ color: settlementSummary.refund_amount >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
              {settlementSummary.refund_amount >= 0
                ? `${settlementSummary.refund_amount.toLocaleString()} RUB Refund`
                : `${Math.abs(settlementSummary.refund_amount).toLocaleString()} RUB Owed`}
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
