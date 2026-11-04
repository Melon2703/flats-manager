import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { demoCookie, demoSessionSchema, isLocalDemo } from "@/lib/data-mode";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (isLocalDemo(request.headers.get("host"))) {
    const existing = request.cookies.get(demoCookie)?.value;
    if (!demoSessionSchema.safeParse(existing).success) {
      const session = crypto.randomUUID();
      request.cookies.set(demoCookie, session);
      response = NextResponse.next({ request });
      response.cookies.set(demoCookie, session, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
