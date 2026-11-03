import "server-only";
import { cookies } from "next/headers";
import type { Locale } from "./dictionaries";

export const localeCookieName = "rental-manager-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "ru" || value === "en";
}

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookieName)?.value;
  return isLocale(value) ? value : "ru";
}
