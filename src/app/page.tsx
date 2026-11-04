import { dictionaries } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/locale";
import { setLocale } from "@/i18n/actions";
import { createClient } from "@/lib/supabase/server";
import { SignIn } from "@/components/sign-in";
import { MonthlyLedger } from "@/components/monthly-ledger";
import { monthSchema, receiptsSchema } from "@/lib/rent";
import { CurrentMonth } from "@/components/current-month";
import { SignOut } from "@/components/sign-out";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const locale = await getLocale();
  const text = dictionaries[locale];
  const today = new Date().toISOString().slice(0, 10);
  const selected = monthSchema.safeParse((await searchParams).month);
  const month = selected.success ? selected.data : today.slice(0, 7);
  const client = await createClient();
  const user = client ? (await client.auth.getUser()).data.user : null;
  const result =
    client && user && selected.success
      ? await client.rpc("monthly_rent", { p_month: `${month}-01` })
      : null;
  const receipts =
    client && user && selected.success && !result?.error
      ? await client.rpc("monthly_receipts", { p_month: `${month}-01` })
      : null;
  const entries = receiptsSchema.safeParse(receipts?.data ?? []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>{text.appName}</h1>
        <div className="header-actions">
          <form
            action={setLocale}
            aria-label={text.languageLabel}
            className="language-switch"
          >
            {(["ru", "en"] as const).map((language) => (
              <button
                key={language}
                type="submit"
                name="locale"
                value={language}
                lang={language}
                aria-pressed={locale === language}
              >
                {text.languages[language]}
              </button>
            ))}
          </form>
          {user && <SignOut label={text.signOut} />}
        </div>
      </header>
      {!client ? (
        <section className="access-panel">
          <h2>{text.setupTitle}</h2>
          <p className="muted">{text.setupHelp}</p>
        </section>
      ) : !user ? (
        <SignIn text={text} />
      ) : !selected.success ? (
        <CurrentMonth loading={text.loading} />
      ) : result?.error || receipts?.error || !entries.success ? (
        <p role="alert" className="error">
          {text.loadError}
        </p>
      ) : (
        <MonthlyLedger
          key={month}
          month={month}
          rows={result?.data ?? []}
          receipts={entries.data}
          text={text}
          locale={locale}
          initialToday={today}
        />
      )}
    </main>
  );
}
