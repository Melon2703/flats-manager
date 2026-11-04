"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { monthSchema, parseCents, type ActionResult } from "@/lib/rent";
import { z } from "zod";
import { headers } from "next/headers";
import { isLocalDemo } from "@/lib/data-mode";
import { addDemoApartment, recordDemoReceipt } from "@/lib/demo-store";

export async function addApartment(form: FormData): Promise<ActionResult> {
  const input = z
    .object({
      id: z.uuid(),
      name: z.string().trim().min(1).max(120),
      month: monthSchema,
      rent: z.string(),
      dueDay: z.coerce.number().int().min(1).max(28),
    })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return { error: "invalid" };
  const cents = parseCents(input.data.rent);
  if (cents === null) return { error: "invalid" };
  if (isLocalDemo((await headers()).get("host"))) {
    const result = await addDemoApartment({
      id: input.data.id,
      name: input.data.name,
      rent: cents,
      day: input.data.dueDay,
      month: input.data.month,
    });
    revalidatePath("/");
    return result;
  }
  const client = await createClient();
  if (!client || !(await client.auth.getUser()).data.user)
    return { error: "save" };
  const { error } = await client.rpc("add_apartment", {
    p_id: input.data.id,
    p_name: input.data.name,
    p_rent_cents: cents,
    p_due_day: input.data.dueDay,
    p_month: `${input.data.month}-01`,
  });
  if (error) return { error: "save" };
  revalidatePath("/");
  return { ok: true };
}

export async function recordReceipt(form: FormData): Promise<ActionResult> {
  const input = z
    .object({
      id: z.uuid(),
      apartmentId: z.uuid(),
      month: monthSchema,
      amount: z.string(),
      date: z.iso
        .date()
        .min(10)
        .refine((value) => value >= "2000-01-01" && value <= "2100-12-31"),
      note: z.string().max(500),
    })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return { error: "invalid" };
  const cents = parseCents(input.data.amount);
  if (cents === null) return { error: "invalid" };
  if (isLocalDemo((await headers()).get("host"))) {
    const result = await recordDemoReceipt({
      id: input.data.id,
      apartmentId: input.data.apartmentId,
      month: input.data.month,
      amount: cents,
      date: input.data.date,
      note: input.data.note,
    });
    revalidatePath("/");
    return result;
  }
  const client = await createClient();
  if (!client || !(await client.auth.getUser()).data.user)
    return { error: "save" };
  const { error } = await client.rpc("record_receipt", {
    p_id: input.data.id,
    p_apartment_id: input.data.apartmentId,
    p_month: `${input.data.month}-01`,
    p_amount_cents: cents,
    p_received_on: input.data.date,
    p_note: input.data.note,
  });
  if (error) {
    if (error.message === "balance_changed") {
      revalidatePath("/");
      return { error: "balance" };
    }
    return { error: "save" };
  }
  revalidatePath("/");
  return { ok: true };
}
