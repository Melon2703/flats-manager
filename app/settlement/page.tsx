'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { calculateSettlement, generateSettlementSummarySheet, calculateUtilityDifference } from '@/lib/settlement';
import { SettlementDeductions, Tenancy, Flat } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

function SettlementForm() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();

  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedTenancyId, setSelectedTenancyId] = useState<string>(searchParams.get('tenancy_id') || '');

  const [flatTitle, setFlatTitle] = useState('Flat 101');
  const [tenantName, setTenantName] = useState(searchParams.get('tenant_name') || 'Ivan Petrov');
  const [depositAmount, setDepositAmount] = useState<number>(50000);

  const [deductions, setDeductions] = useState<SettlementDeductions>({
    unpaid_rent: Number(searchParams.get('unpaid_rent')) || 0,
    utilities: Number(searchParams.get('utilities')) || 0,
    cleaning: Number(searchParams.get('cleaning')) || 0,
    damages: Number(searchParams.get('damages')) || 0,
  });

  // Utility calculator fields
  const [showUtilityCalc, setShowUtilityCalc] = useState(false);
  const [elecMoveIn, setElecMoveIn] = useState<number>(0);
  const [elecMoveOut, setElecMoveOut] = useState<number>(0);
  const [waterMoveIn, setWaterMoveIn] = useState<number>(0);
  const [waterMoveOut, setWaterMoveOut] = useState<number>(0);
  const [gasMoveIn, setGasMoveIn] = useState<number>(0);
  const [gasMoveOut, setGasMoveOut] = useState<number>(0);

  // Damage photo evidence urls
  const [damagePhotoUrl, setDamagePhotoUrl] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const [tenanciesRes, flatsRes] = await Promise.all([
          fetch('/api/twa/tenancies', { headers: { 'x-telegram-init-data': initData } }),
          fetch('/api/twa/flats', { headers: { 'x-telegram-init-data': initData } }),
        ]);

        if (tenanciesRes.ok && flatsRes.ok) {
          const tenanciesData: Tenancy[] = await tenanciesRes.json();
          const flatsData: Flat[] = await flatsRes.json();
          setTenancies(tenanciesData);
          setFlats(flatsData);

          if (selectedTenancyId) {
            const matched = tenanciesData.find((ten) => ten.id === selectedTenancyId);
            if (matched) {
              setTenantName(matched.tenant_name);
              setDepositAmount(matched.deposit_amount || 50000);
              const flat = flatsData.find((f) => f.id === matched.flat_id);
              if (flat) setFlatTitle(flat.title);
            }
          }
        }
      } catch {
        // Fallback
      }
    }
    loadData();
  }, [selectedTenancyId]);

  // Load Move-In & Move-Out readings if tenancy selected
  useEffect(() => {
    async function fetchChecklists() {
      if (!selectedTenancyId) return;
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const [inRes, outRes] = await Promise.all([
          fetch(`/api/twa/inspections?tenancy_id=${selectedTenancyId}&type=move_in`, {
            headers: { 'x-telegram-init-data': initData },
          }),
          fetch(`/api/twa/inspections?tenancy_id=${selectedTenancyId}&type=move_out`, {
            headers: { 'x-telegram-init-data': initData },
          }),
        ]);

        if (inRes.ok && outRes.ok) {
          const moveIn = await inRes.json();
          const moveOut = await outRes.json();

          if (moveIn?.meter_readings_json) {
            setElecMoveIn(moveIn.meter_readings_json.electricity || 0);
            setWaterMoveIn(moveIn.meter_readings_json.water || 0);
            setGasMoveIn(moveIn.meter_readings_json.gas || 0);
          }
          if (moveOut?.meter_readings_json) {
            setElecMoveOut(moveOut.meter_readings_json.electricity || 0);
            setWaterMoveOut(moveOut.meter_readings_json.water || 0);
            setGasMoveOut(moveOut.meter_readings_json.gas || 0);
          }

          if (moveIn?.meter_readings_json && moveOut?.meter_readings_json) {
            const util = calculateUtilityDifference(
              { electricity: moveIn.meter_readings_json.electricity, water: moveIn.meter_readings_json.water, gas: moveIn.meter_readings_json.gas },
              { electricity: moveOut.meter_readings_json.electricity, water: moveOut.meter_readings_json.water, gas: moveOut.meter_readings_json.gas }
            );
            setDeductions((prev) => ({ ...prev, utilities: Math.round(util.total_utility_cost) }));
          }
        }
      } catch {
        // Fallback
      }
    }
    fetchChecklists();
  }, [selectedTenancyId]);

  function handleTenancySelect(id: string) {
    setSelectedTenancyId(id);
    const tenancy = tenancies.find((ten) => ten.id === id);
    if (tenancy) {
      setTenantName(tenancy.tenant_name);
      setDepositAmount(tenancy.deposit_amount || 50000);
      const flat = flats.find((f) => f.id === tenancy.flat_id);
      if (flat) setFlatTitle(flat.title);
    }
  }

  function applyUtilityCalc() {
    const util = calculateUtilityDifference(
      { electricity: elecMoveIn, water: waterMoveIn, gas: gasMoveIn },
      { electricity: elecMoveOut, water: waterMoveOut, gas: gasMoveOut }
    );
    setDeductions((prev) => ({ ...prev, utilities: Math.round(util.total_utility_cost) }));
    setShowUtilityCalc(false);
  }

  function addDamagePhoto() {
    if (damagePhotoUrl.trim()) {
      setPhotoUrls((prev) => [...prev, damagePhotoUrl.trim()]);
      setDamagePhotoUrl('');
    }
  }

  const itemizedBreakdown = [
    { category: 'Unpaid Rent', description: 'Outstanding rent payments', amount: deductions.unpaid_rent || 0 },
    { category: 'Utilities', description: 'Electric & Water meter differences', amount: deductions.utilities || 0 },
    { category: 'Cleaning', description: 'End of tenancy deep clean', amount: deductions.cleaning || 0 },
    {
      category: 'Damages',
      description: 'Flat repairs & damages',
      amount: deductions.damages || 0,
      photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
    },
  ];

  const settlementSummary = calculateSettlement({
    deposit_amount: depositAmount,
    deductions,
    itemized_breakdown: itemizedBreakdown,
  });

  const generatedSummarySheet = generateSettlementSummarySheet(
    settlementSummary,
    tenantName,
    flatTitle,
    lang
  );

  function copySummarySheet() {
    navigator.clipboard.writeText(generatedSummarySheet);
    (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    alert(t('summaryCopied'));
  }

  function handleDeductionChange(field: keyof SettlementDeductions, value: number) {
    setDeductions((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US').replace(/\u00a0/g, ' ');
  };

  return (
    <div>
      <h1 className="title-primary" style={{ marginBottom: 4 }}>{t('settlementTitle')}</h1>
      <p className="subtitle">{t('settlementSubtitle')}</p>

      {tenancies.length > 0 && (
        <div className="glass-card" style={{ padding: 12, marginBottom: 16 }}>
          <label className="form-label" style={{ marginBottom: 6 }}>{t('selectTenancy')}</label>
          <select
            className="form-select"
            value={selectedTenancyId}
            onChange={(e) => handleTenancySelect(e.target.value)}
          >
            <option value="">{t('manualCalc')}</option>
            {tenancies.map((ten) => (
              <option key={ten.id} value={ten.id}>
                {ten.tenant_name} ({t('deposit')}: {formatCurrency(ten.deposit_amount)} ₽)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="glass-card">
        <div className="form-group">
          <label className="form-label">{t('flatTitleLabel')}</label>
          <input
            type="text"
            className="form-input"
            value={flatTitle}
            onChange={(e) => setFlatTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('tenantNameLabel')}</label>
          <input
            type="text"
            className="form-input"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('initialDeposit')}</label>
          <input
            type="number"
            className="form-input"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12, gap: 8 }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-amber)' }}>
            {t('deductionsBreakdown')}
          </h3>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setShowUtilityCalc(!showUtilityCalc)}
          >
            {showUtilityCalc ? t('hideMeterCalc') : t('utilityCalcBtn')}
          </button>
        </div>

        {/* Utility Meter Auto Calculator */}
        {showUtilityCalc && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 8 }}>
              {t('meterReadings')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem' }}>Elec In (кВт⋅ч)</label>
                <input
                  type="number"
                  className="form-input"
                  value={elecMoveIn}
                  onChange={(e) => setElecMoveIn(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem' }}>Elec Out (кВт⋅ч)</label>
                <input
                  type="number"
                  className="form-input"
                  value={elecMoveOut}
                  onChange={(e) => setElecMoveOut(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem' }}>Water In (м³)</label>
                <input
                  type="number"
                  className="form-input"
                  value={waterMoveIn}
                  onChange={(e) => setWaterMoveIn(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem' }}>Water Out (м³)</label>
                <input
                  type="number"
                  className="form-input"
                  value={waterMoveOut}
                  onChange={(e) => setWaterMoveOut(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem' }}>Gas In (м³)</label>
                <input
                  type="number"
                  className="form-input"
                  value={gasMoveIn}
                  onChange={(e) => setGasMoveIn(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem' }}>Gas Out (м³)</label>
                <input
                  type="number"
                  className="form-input"
                  value={gasMoveOut}
                  onChange={(e) => setGasMoveOut(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 10, padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={applyUtilityCalc}
            >
              {t('save')}
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">{t('unpaidRent')}</label>
            <input
              type="number"
              className="form-input"
              value={deductions.unpaid_rent}
              onChange={(e) => handleDeductionChange('unpaid_rent', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('utilities')}</label>
            <input
              type="number"
              className="form-input"
              value={deductions.utilities}
              onChange={(e) => handleDeductionChange('utilities', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('cleaningFee')}</label>
            <input
              type="number"
              className="form-input"
              value={deductions.cleaning}
              onChange={(e) => handleDeductionChange('cleaning', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('damages')}</label>
            <input
              type="number"
              className="form-input"
              value={deductions.damages}
              onChange={(e) => handleDeductionChange('damages', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Damage Evidence Links */}
        <div className="form-group" style={{ marginTop: 8 }}>
          <label className="form-label">{t('damagePhotoLink')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/damaged_sofa.jpg"
              value={damagePhotoUrl}
              onChange={(e) => setDamagePhotoUrl(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', whiteSpace: 'nowrap' }}
              onClick={addDamagePhoto}
            >
              {t('addLink')}
            </button>
          </div>
          {photoUrls.length > 0 && (
            <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
              <strong>{t('photoUrlLabel')}:</strong> {photoUrls.length}
            </div>
          )}
        </div>

        {/* Result Banner */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 16, borderRadius: 12, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.05rem', fontWeight: 700, flexWrap: 'wrap', gap: 8 }}>
            <span>{t('finalSettlement')}</span>
            <span style={{ color: settlementSummary.refund_amount >= 0 ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
              {settlementSummary.refund_amount >= 0
                ? `${formatCurrency(settlementSummary.refund_amount)} ${t('refundText')}`
                : `${formatCurrency(Math.abs(settlementSummary.refund_amount))} ${t('balanceDueText')}`}
            </span>
          </div>
        </div>

        {/* Formatted Sheet Preview */}
        <div style={{ marginTop: 16 }}>
          <label className="form-label">{t('summarySheetPreview')}</label>
          <pre
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              padding: 12,
              borderRadius: 8,
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)',
            }}
          >
            {generatedSummarySheet}
          </pre>
        </div>

        <button className="btn-primary" onClick={copySummarySheet} style={{ marginTop: 20 }}>
          {t('copySummarySheet')}
        </button>
      </div>
    </div>
  );
}

export default function SettlementPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-secondary)' }}>{t('loading')}</p>}>
      <SettlementForm />
    </Suspense>
  );
}
