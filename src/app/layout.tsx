import type { Metadata } from "next";
import { dictionaries } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/locale";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const text = dictionaries[await getLocale()];
  return { title: text.appName, description: text.description };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return <html lang={locale}><body>{children}</body></html>;
}
