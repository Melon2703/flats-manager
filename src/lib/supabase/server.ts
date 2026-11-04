import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { Database } from "./database.types";
import { isLocalDemo } from "@/lib/data-mode";

export async function createClient() {
  if (isLocalDemo((await headers()).get("host"))) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. The proxy refreshes sessions.
        }
      },
    },
  });
}
