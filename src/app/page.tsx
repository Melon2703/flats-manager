import { dictionaries } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/locale";
import { setLocale } from "@/i18n/actions";

export default async function Home() {
  const locale = await getLocale();
  const text = dictionaries[locale];

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-12 px-5 py-8 sm:px-10 sm:py-12">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{text.appName}</h1>
        <form action={setLocale} aria-label={text.languageLabel} className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm text-slate-600">{text.languageLabel}</span>
          {(["ru", "en"] as const).map((language) => (
            <button
              key={language}
              type="submit"
              name="locale"
              value={language}
              lang={language}
              aria-pressed={locale === language}
              className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 aria-pressed:border-teal-800 aria-pressed:bg-teal-800 aria-pressed:text-white"
            >
              {text.languages[language]}
            </button>
          ))}
        </form>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <div aria-hidden="true" className="mb-6 h-2 w-10 rounded-full bg-teal-700" />
        <h2 className="text-2xl font-semibold leading-tight tracking-tight">{text.welcome}</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-slate-600">{text.introduction}</p>
      </section>
    </main>
  );
}
