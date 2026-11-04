"use client";

import { useEffect, useRef, useState } from "react";
import { recordReceipt } from "@/app/rent-actions";
import { money, monthLabel, parseCents, type ActionResult } from "@/lib/rent";
import type { Dictionary, Locale } from "@/i18n/dictionaries";

export function ReceiptForm({
  apartmentId,
  name,
  month,
  outstanding,
  today,
  text,
  locale,
  onSaved,
  onCancel,
  onSaving,
  onUncertain,
}: {
  apartmentId: string;
  name: string;
  month: string;
  outstanding: number;
  today: string;
  text: Dictionary;
  locale: Locale;
  onSaved: () => void;
  onCancel: () => void;
  onSaving: (saving: boolean) => void;
  onUncertain: (uncertain: boolean) => void;
}) {
  const [amount, setAmount] = useState((outstanding / 100).toFixed(2));
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<ActionResult["error"]>();
  const [saving, setSaving] = useState(false);
  const submissionId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const lastSubmission = useRef<FormData | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const cents = parseCents(amount);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <form
      className="entry-form receipt-form"
      aria-label={text.recordReceipt}
      onSubmit={async (event) => {
        event.preventDefault();
        if (inFlight.current) return;
        inFlight.current = true;
        setSaving(true);
        onSaving(true);
        setError(undefined);
        submissionId.current ??= crypto.randomUUID();
        // After a lost response, retry the exact submission with the same identity.
        const form =
          uncertain && lastSubmission.current
            ? lastSubmission.current
            : new FormData(event.currentTarget);
        form.set("id", submissionId.current);
        form.set("apartmentId", apartmentId);
        form.set("month", month);
        if (!form.has("note")) form.set("note", "");
        lastSubmission.current = form;
        try {
          const result = await recordReceipt(form);
          if (result.ok) onSaved();
          else {
            setError(result.error);
            setUncertain(result.error === "save");
            onUncertain(result.error === "save");
          }
        } catch {
          setError("save");
          setUncertain(true);
          onUncertain(true);
        } finally {
          inFlight.current = false;
          setSaving(false);
          onSaving(false);
        }
      }}
    >
      <div>
        <h4 ref={heading} tabIndex={-1}>
          {text.recordReceipt}
        </h4>
        <p className="muted receipt-context">
          {name} · {monthLabel(month, locale)}
        </p>
      </div>
      <fieldset disabled={saving || uncertain}>
        <div className="form-columns">
          <label>
            {text.amountReceived}
            <input
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              onFocus={(event) => event.target.select()}
              required
              aria-describedby={
                cents !== null && cents <= outstanding
                  ? `remaining-${apartmentId}`
                  : undefined
              }
            />
          </label>
          <label>
            {text.receivedOn}
            <input
              name="date"
              type="date"
              defaultValue={today}
              min="2000-01-01"
              max="2100-12-31"
              required
            />
          </label>
        </div>
        {cents !== null && cents <= outstanding && (
          <p id={`remaining-${apartmentId}`} className="remaining-preview">
            {text.remainingRent}: {money(outstanding - cents, locale)}
          </p>
        )}
        {showNote ? (
          <label>
            {text.note}
            <textarea name="note" maxLength={500} rows={2} />
          </label>
        ) : (
          <button
            type="button"
            className="text-button note-button"
            onClick={() => setShowNote(true)}
          >
            {text.addNote}
          </button>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="error">
          {error === "balance"
            ? text.balanceError
            : error === "invalid"
              ? text.receiptInvalid
              : text.retryReceipt}
        </p>
      )}
      <div className="form-actions">
        <button className="primary" disabled={saving}>
          {saving ? text.saving : uncertain ? text.retrySave : text.saveReceipt}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={saving || uncertain}
          onClick={onCancel}
        >
          {text.cancel}
        </button>
      </div>
    </form>
  );
}
