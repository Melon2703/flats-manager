"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function signIn(_previous: boolean, form: FormData) {
  const input = z
    .object({ email: z.email(), password: z.string().min(1).max(1024) })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return true;
  const client = await createClient();
  if (!client) return true;
  const { error } = await client.auth.signInWithPassword(input.data);
  if (error) return true;
  redirect("/");
}

export async function signOut() {
  const client = await createClient();
  if (client) await client.auth.signOut();
  redirect("/");
}
