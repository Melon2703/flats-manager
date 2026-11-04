// Shared with the proxy: keep filesystem/demo implementation out of this module.
import { z } from "zod";

export const demoCookie = "rental-manager-demo";
export const demoSessionSchema = z.uuid();

export function isLocalDemo(host: string | null): boolean {
  const mode = process.env.RENTAL_MANAGER_DATA_MODE;
  const enabled =
    mode === "demo" || (!mode && process.env.NODE_ENV === "development");
  if (!enabled || process.env.VERCEL || !host) return false;
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
}
