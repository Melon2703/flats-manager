import { z } from "zod";

export const monthSchema = z.string().regex(/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/);

export function parseCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents > 0 && cents <= 99999999999 ? cents : null;
}

export function money(cents: number, locale: "ru" | "en") {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function monthLabel(month: string, locale: "ru" | "en") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
}

export function dateLabel(date: string, locale: "ru" | "en") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export type RentRow = {
  apartment_id: string;
  name: string;
  expected_cents: number;
  due_date: string;
};
export type ActionResult = {
  error?: "invalid" | "save" | "balance";
  ok?: boolean;
};
export const receiptsSchema = z.array(
  z.object({
    id: z.uuid(),
    apartment_id: z.uuid(),
    rental_month: z.iso.date(),
    amount_cents: z.number().int().positive().max(99999999999),
    received_on: z.iso.date(),
    note: z.string().max(500),
  }),
);
export type Receipt = z.infer<typeof receiptsSchema>[number];
