import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const supabase = process.env.RENTAL_MANAGER_DATA_MODE === "supabase";
if (supabase && existsSync(".env.test.local"))
  process.loadEnvFile(".env.test.local");
process.env.RENTAL_MANAGER_DATA_MODE = supabase ? "supabase" : "demo";
if (!supabase) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
  process.env.RENTAL_MANAGER_DEMO_DIR = ".local-demo/playwright";
}

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: supabase
    ? "**/demo-workflow.spec.ts"
    : "**/monthly-workflow.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
