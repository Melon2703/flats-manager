"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isLocalDemo } from "@/lib/data-mode";
import { resetDemoMonth } from "@/lib/demo-store";
import { monthSchema, type ActionResult } from "@/lib/rent";

export async function resetDemo(month: string): Promise<ActionResult> {
  if (
    !monthSchema.safeParse(month).success ||
    !isLocalDemo((await headers()).get("host"))
  )
    return { error: "invalid" };
  try {
    await resetDemoMonth(month);
  } catch {
    return { error: "save" };
  }
  revalidatePath("/");
  return { ok: true };
}
