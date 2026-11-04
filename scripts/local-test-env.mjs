import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const status = JSON.parse(
  execFileSync("node_modules/.bin/supabase", ["status", "-o", "json"], {
    encoding: "utf8",
  }),
);
if (
  !status.API_URL ||
  new URL(status.API_URL).hostname !== "127.0.0.1" ||
  !status.PUBLISHABLE_KEY
) {
  throw new Error(
    "Expected a running local Supabase stack with a publishable key.",
  );
}
writeFileSync(
  ".env.test.local",
  `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}\n`,
);
console.log(
  "Wrote local public test configuration to .env.test.local. No privileged keys were saved.",
);
