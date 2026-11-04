"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { addApartment } from "@/app/rent-actions";
import type { Dictionary, Locale } from "@/i18n/dictionaries";
import {
  dateLabel,
  money,
  monthLabel,
  monthSchema,
  type RentRow,
  type ActionResult,
  type Receipt,
} from "@/lib/rent";
import { ReceiptForm } from "./receipt-form";

function Chevron({ next = false }: { next?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d={next ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} />
    </svg>
  );
}

function shiftedMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function subscribeToDate(update: () => void) {
  const timer = window.setInterval(update, 60_000);
  window.addEventListener("focus", update);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", update);
  };
}

export function MonthlyLedger({
  month,
  rows,
  receipts,
  text,
  locale,
  initialToday,
}: {
  month: string;
  rows: RentRow[];
  receipts: Receipt[];
  text: Dictionary;
  locale: Locale;
  initialToday: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const today = useSyncExternalStore(
    subscribeToDate,
    localDate,
    () => initialToday,
  );
  const [error, setError] = useState<ActionResult["error"]>();
  const [saving, save] = useTransition();
  const submissionId = useRef<string | null>(null);
  const apartmentSubmission = useRef<FormData | null>(null);
  const [apartmentUncertain, setApartmentUncertain] = useState(false);
  const [openReceipt, setOpenReceipt] = useState<string | null>(null);
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [receiptUncertain, setReceiptUncertain] = useState(false);
  const [history, setHistory] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      leaving.current = false;
      setLoading(false);
      if (event.persisted) router.refresh();
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, [router]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(null), 5000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    if (!adding && !openReceipt) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!leaving.current) event.preventDefault();
    };
    const signOut = (event: Event) => {
      if (
        saving ||
        apartmentUncertain ||
        receiptSaving ||
        receiptUncertain ||
        !window.confirm(text.discardDraft)
      )
        event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("rental:before-sign-out", signOut);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("rental:before-sign-out", signOut);
    };
  }, [
    adding,
    openReceipt,
    saving,
    apartmentUncertain,
    receiptSaving,
    receiptUncertain,
    text.discardDraft,
  ]);

  function discardDraft() {
    if (receiptSaving || receiptUncertain || apartmentUncertain) return false;
    if ((adding || openReceipt) && !window.confirm(text.discardDraft))
      return false;
    setAdding(false);
    setOpenReceipt(null);
    setError(undefined);
    return true;
  }

  function goToMonth(value: string) {
    if (!monthSchema.safeParse(value).success) return;
    if (receiptSaving || !discardDraft()) return;
    const url = new URL(window.location.href);
    url.searchParams.set("month", value);
    leaving.current = true;
    setLoading(true);
    // A document navigation lets browser Back/Forward use the same native
    // unsaved-entry guard as reload/close; App Router history bypasses it.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Native beforeunload must guard browser Back/Forward while an entry is open.
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <section className="ledger" aria-labelledby="rental-month-heading">
      <div className="month-header">
        <div className="month-controls">
          <button
            className="icon-button"
            aria-label={text.previousMonth}
            disabled={
              loading ||
              saving ||
              receiptSaving ||
              receiptUncertain ||
              apartmentUncertain ||
              month === "2000-01"
            }
            onClick={() => goToMonth(shiftedMonth(month, -1))}
          >
            <Chevron />
          </button>
          <h2 id="rental-month-heading">
            <button
              className="month-title"
              aria-label={`${text.monthPicker}: ${monthLabel(month, locale)}`}
              aria-expanded={picker}
              onClick={() => setPicker(!picker)}
            >
              {monthLabel(month, locale)}
            </button>
          </h2>
          <button
            className="icon-button"
            aria-label={text.nextMonth}
            disabled={
              loading ||
              saving ||
              receiptSaving ||
              receiptUncertain ||
              apartmentUncertain ||
              month === "2100-12"
            }
            onClick={() => goToMonth(shiftedMonth(month, 1))}
          >
            <Chevron next />
          </button>
        </div>
        <p className="month-context">{text.monthContext}</p>
        {picker && (
          <form
            className="month-picker"
            onSubmit={(event) => {
              event.preventDefault();
              goToMonth(String(new FormData(event.currentTarget).get("month")));
            }}
          >
            <label>
              {text.chooseMonth}
              <input
                type="month"
                name="month"
                min="2000-01"
                max="2100-12"
                defaultValue={month}
                required
              />
            </label>
            <button
              className="primary"
              disabled={
                loading ||
                saving ||
                receiptSaving ||
                receiptUncertain ||
                apartmentUncertain
              }
            >
              {text.showMonth}
            </button>
          </form>
        )}
      </div>
      {loading ? (
        <div className="loading-rows" role="status">
          {text.loading}
          <div />
          <div />
          <div />
        </div>
      ) : (
        <>
          {rows.length === 0 && !adding && (
            <div className="empty-state">
              <h3>{text.emptyTitle}</h3>
              <p>{text.emptyHelp}</p>
            </div>
          )}
          <div className="apartment-list">
            {rows.map((row) => {
              const entries = receipts.filter(
                (receipt) => receipt.apartment_id === row.apartment_id,
              );
              const received = entries.reduce(
                (total, receipt) => total + receipt.amount_cents,
                0,
              );
              const outstanding = row.expected_cents - received;
              const overdue = outstanding > 0 && row.due_date < today;
              return (
                <article
                  className="apartment"
                  aria-labelledby={`name-${row.apartment_id}`}
                  key={row.apartment_id}
                >
                  <div className="apartment-identity">
                    <h3 id={`name-${row.apartment_id}`}>{row.name}</h3>
                    <p className={`status ${outstanding === 0 ? "paid" : ""}`}>
                      <span>
                        {outstanding === 0
                          ? text.paid
                          : received > 0
                            ? text.partial
                            : text.awaiting}
                      </span>
                      {overdue && (
                        <span className="overdue"> · {text.overdue}</span>
                      )}
                    </p>
                    <p className="muted due-date">
                      {text.due}:{" "}
                      <time dateTime={row.due_date}>
                        {dateLabel(row.due_date, locale)}
                      </time>
                    </p>
                  </div>
                  <dl
                    className={`amounts${row.expected_cents >= 100000000 ? " amounts-wide" : ""}`}
                  >
                    <div>
                      <dt>{text.expected}</dt>
                      <dd>{money(row.expected_cents, locale)}</dd>
                    </div>
                    <div>
                      <dt>{text.received}</dt>
                      <dd>{money(received, locale)}</dd>
                    </div>
                    <div className="outstanding">
                      <dt>{text.outstanding}</dt>
                      <dd>{money(outstanding, locale)}</dd>
                    </div>
                  </dl>
                  <div className="row-actions">
                    {outstanding > 0 && openReceipt !== row.apartment_id && (
                      <button
                        className="primary"
                        disabled={
                          receiptSaving ||
                          receiptUncertain ||
                          apartmentUncertain ||
                          saving
                        }
                        onClick={() => {
                          if (discardDraft()) {
                            setOpenReceipt(row.apartment_id);
                            setSaved(null);
                          }
                        }}
                      >
                        {text.recordReceipt}
                      </button>
                    )}
                    <button
                      id={`history-${row.apartment_id}`}
                      className="text-button"
                      aria-expanded={!!history[row.apartment_id]}
                      onClick={() =>
                        setHistory({
                          ...history,
                          [row.apartment_id]: !history[row.apartment_id],
                        })
                      }
                    >
                      {text.receipts} ({entries.length})
                    </button>
                  </div>
                  {saved === row.apartment_id && (
                    <p className="save-feedback" role="status">
                      {text.receiptSaved}
                    </p>
                  )}
                  {openReceipt === row.apartment_id && (
                    <ReceiptForm
                      key={row.apartment_id}
                      apartmentId={row.apartment_id}
                      name={row.name}
                      month={month}
                      outstanding={outstanding}
                      today={today}
                      text={text}
                      locale={locale}
                      onSaving={setReceiptSaving}
                      onUncertain={setReceiptUncertain}
                      onCancel={() => {
                        if (discardDraft())
                          document
                            .getElementById(`history-${row.apartment_id}`)
                            ?.focus({ preventScroll: true });
                      }}
                      onSaved={() => {
                        setReceiptUncertain(false);
                        setOpenReceipt(null);
                        setSaved(row.apartment_id);
                        document
                          .getElementById(`history-${row.apartment_id}`)
                          ?.focus({ preventScroll: true });
                        router.refresh();
                      }}
                    />
                  )}
                  {history[row.apartment_id] && (
                    <div className="receipt-history">
                      {entries.length === 0 ? (
                        <p className="muted">{text.noReceipts}</p>
                      ) : (
                        <ul aria-label={text.receipts}>
                          {entries.map((entry) => (
                            <li key={entry.id}>
                              <div>
                                <time dateTime={entry.received_on}>
                                  {dateLabel(entry.received_on, locale)}
                                </time>
                                {entry.note && <p>{entry.note}</p>}
                              </div>
                              <strong>
                                {money(entry.amount_cents, locale)}
                              </strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <div className="add-section">
            {!adding ? (
              <button
                className={
                  rows.length ? "secondary add-button" : "primary add-button"
                }
                disabled={
                  receiptSaving ||
                  receiptUncertain ||
                  apartmentUncertain ||
                  saving
                }
                onClick={() => {
                  if (discardDraft()) {
                    submissionId.current = crypto.randomUUID();
                    setAdding(true);
                  }
                }}
              >
                {text.addApartment}
              </button>
            ) : (
              <form
                className="entry-form apartment-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (saving) return;
                  const form =
                    apartmentUncertain && apartmentSubmission.current
                      ? apartmentSubmission.current
                      : new FormData(event.currentTarget);
                  form.set("id", submissionId.current!);
                  form.set("month", month);
                  apartmentSubmission.current = form;
                  setError(undefined);
                  save(async () => {
                    try {
                      const result = await addApartment(form);
                      if (result.error) {
                        setError(result.error);
                        setApartmentUncertain(result.error === "save");
                      } else {
                        setApartmentUncertain(false);
                        setAdding(false);
                        router.refresh();
                      }
                    } catch {
                      setError("save");
                      setApartmentUncertain(true);
                    }
                  });
                }}
              >
                <h3>{text.addApartment}</h3>
                <p className="muted">
                  {text.startsIn}: {monthLabel(month, locale)}
                </p>
                <fieldset disabled={saving || apartmentUncertain}>
                  <label>
                    {text.apartmentName}
                    <input
                      name="name"
                      maxLength={120}
                      required
                      autoComplete="off"
                    />
                  </label>
                  <div className="form-columns">
                    <label>
                      {text.monthlyRent}
                      <input name="rent" inputMode="decimal" required />
                    </label>
                    <label>
                      {text.dueDay}
                      <input
                        name="dueDay"
                        type="number"
                        min="1"
                        max="28"
                        required
                        aria-describedby="due-day-help"
                      />
                    </label>
                  </div>
                  <p id="due-day-help" className="muted help">
                    {text.dueDayHelp}
                  </p>
                </fieldset>
                {error && (
                  <p role="alert" className="error">
                    {error === "invalid" ? text.invalid : text.retryApartment}
                  </p>
                )}
                <div className="form-actions">
                  <button className="primary" disabled={saving}>
                    {saving
                      ? text.saving
                      : apartmentUncertain
                        ? text.retrySave
                        : text.saveApartment}
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    disabled={saving || apartmentUncertain}
                    onClick={() => {
                      if (window.confirm(text.discardDraft)) {
                        setAdding(false);
                        setError(undefined);
                      }
                    }}
                  >
                    {text.cancel}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </section>
  );
}
