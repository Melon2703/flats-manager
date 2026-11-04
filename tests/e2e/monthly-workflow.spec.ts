import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.use({ timezoneId: "Asia/Tbilisi" });

async function signIn(page: Page) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || new URL(url).hostname !== "127.0.0.1") {
    throw new Error(
      "Run the workflow tests against local Supabase only; see README.",
    );
  }
  const email = `trial-${crypto.randomUUID()}@example.test`;
  const password = `Trial-${crypto.randomUUID()}`;
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add apartment", exact: true }),
  ).toBeVisible();
}

async function addApartment(
  page: Page,
  name: string,
  rent = "1200",
  dueDay = "1",
) {
  await page
    .getByRole("button", { name: "Add apartment", exact: true })
    .click();
  await page.getByLabel("Apartment name").fill(name);
  await page.getByLabel("Monthly rent, USD").fill(rent);
  await page.getByLabel("Rent due day").fill(dueDay);
  await page
    .getByRole("button", { name: "Save apartment", exact: true })
    .click();
  await expect(page.getByRole("article", { name, exact: true })).toBeVisible();
}

async function capture(page: Page, projectName: string, state: string) {
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: `/private/tmp/flats-review/${projectName}-${state}.png`, fullPage: true });
}

test("protects the rental ledger behind sign in", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add apartment", exact: true }),
  ).toHaveCount(0);
  await capture(page, testInfo.project.name, "sign-in");
});

test("uses the owner's local current month and date at a month boundary", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2030-12-31T21:00:00Z"));
  await signIn(page);
  await expect(page).toHaveURL(/month=2031-01/);
  await addApartment(page, "Local calendar");
  await page
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await expect(page.getByLabel("Receipt date", { exact: true })).toHaveValue(
    "2031-01-01",
  );
});

test("browser Back and sign-out require explicit discard of an unfinished receipt", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/?month=2026-11");
  await addApartment(page, "History trial");
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(page).toHaveURL(/month=2026-12/);
  await page
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await page.getByLabel("Amount received, USD").fill("321");
  const warning = page.waitForEvent("dialog");
  await page.evaluate(() => history.back());
  const dialog = await warning;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await expect(page).toHaveURL(/month=2026-12/);
  await expect(page.getByLabel("Amount received, USD")).toHaveValue("321");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/month=2026-11/);
  await expect(
    page.getByRole("button", { name: "Record receipt", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/month=2026-12/);
  await page
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await page.getByLabel("Amount received, USD").fill("321");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Amount received, USD")).toHaveValue("321");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
});

test("adds an apartment and retains its monthly obligation after reopening", async ({
  page,
}, testInfo) => {
  await signIn(page);
  await page
    .getByRole("button", { name: "Add apartment", exact: true })
    .click();
  await page.getByLabel("Apartment name").fill("Квартира у парка");
  await page.getByLabel("Monthly rent, USD").fill("1200");
  await page.getByLabel("Rent due day").fill("1");
  await capture(page, testInfo.project.name, "apartment-setup");
  await page
    .getByRole("button", { name: "Save apartment", exact: true })
    .click();
  const apartment = page.getByRole("article", { name: "Квартира у парка" });
  await expect(apartment).toBeVisible();
  await expect(apartment.getByText("$1,200.00", { exact: true })).toHaveCount(
    2,
  );
  await expect(apartment.getByText("$0.00", { exact: true })).toBeVisible();
  await page.reload();
  await expect(apartment).toBeVisible();
  await expect(
    apartment.getByRole("button", { name: "Record receipt", exact: true }),
  ).toBeVisible();
});

test("records partial receipts with no repeated apartment/month input and clears the debt", async ({
  page,
}, testInfo) => {
  await signIn(page);
  await page
    .getByRole("button", { name: "Add apartment", exact: true })
    .click();
  await page.getByLabel("Apartment name").fill("Квартира у парка");
  await page.getByLabel("Monthly rent, USD").fill("1200");
  await page.getByLabel("Rent due day").fill("1");
  await page
    .getByRole("button", { name: "Save apartment", exact: true })
    .click();
  const apartment = page.getByRole("article", { name: "Квартира у парка" });
  await apartment
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await expect(apartment.getByLabel("Amount received, USD")).toHaveValue(
    "1200.00",
  );
  await expect(apartment.getByLabel("Amount received, USD")).not.toBeFocused();
  await apartment.getByLabel("Amount received, USD").fill("600");
  await expect(
    apartment.getByText("Remaining rent: $600.00", { exact: true }),
  ).toBeVisible();
  await apartment
    .getByRole("button", { name: "Add note", exact: true })
    .click();
  await apartment.getByLabel("Note", { exact: true }).fill("Первая часть");
  await apartment
    .getByRole("button", { name: "Save receipt", exact: true })
    .click();
  await expect(
    apartment.getByText("Partially paid", { exact: true }),
  ).toBeVisible();
  await expect(
    apartment.locator("dd").filter({ hasText: "$600.00" }),
  ).toHaveCount(2);
  await apartment
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await expect(apartment.getByLabel("Amount received, USD")).toHaveValue(
    "600.00",
  );
  await apartment
    .getByRole("button", { name: "Save receipt", exact: true })
    .click();
  await expect(apartment.getByText("Paid", { exact: true })).toBeVisible();
  await expect(
    apartment.locator("dd").filter({ hasText: "$0.00" }),
  ).toHaveCount(1);
  await apartment
    .getByRole("button", { name: "Receipts (2)", exact: true })
    .click();
  await expect(apartment.getByRole("listitem")).toHaveCount(2);
  await expect(
    apartment.getByText("Первая часть", { exact: true }),
  ).toBeVisible();
  await capture(page, testInfo.project.name, "paid-history");
  await page.reload();
  await expect(
    apartment.getByRole("button", { name: "Receipts (2)", exact: true }),
  ).toBeVisible();
});

test("reconciles a lost save response and never duplicates the receipt on retry", async ({
  page,
}, testInfo) => {
  await signIn(page);
  await addApartment(page, "Retry trial");
  const apartment = page.getByRole("article", { name: "Retry trial" });
  await apartment
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await apartment
    .getByRole("button", { name: "Add note", exact: true })
    .click();
  await apartment.getByLabel("Note", { exact: true }).fill("lost-reply");
  let lost = false;
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (
      !lost &&
      request.method() === "POST" &&
      request.headers()["next-action"] &&
      request.postData()?.includes("lost-reply")
    ) {
      lost = true;
      await route.fetch(); // The actual server and database commit; only the reply is lost.
      await route.abort("failed");
    } else await route.continue();
  });
  await apartment
    .getByRole("button", { name: "Save receipt", exact: true })
    .click();
  await expect(apartment.getByRole("alert")).toContainText(
    "Saving has not been confirmed",
  );
  await expect(apartment.getByLabel("Amount received, USD")).toBeDisabled();
  await capture(page, testInfo.project.name, "receipt-retry");
  await apartment
    .getByRole("button", { name: "Check and retry", exact: true })
    .click();
  await expect(apartment.getByText("Paid", { exact: true })).toBeVisible();
  await apartment
    .getByRole("button", { name: "Receipts (1)", exact: true })
    .click();
  await expect(apartment.getByRole("listitem")).toHaveCount(1);
  await page.reload();
  await expect(
    apartment.getByRole("button", { name: "Receipts (1)", exact: true }),
  ).toBeVisible();
});

test("retries an uncertain apartment save without changing or duplicating it", async ({
  page,
}) => {
  await signIn(page);
  await page
    .getByRole("button", { name: "Add apartment", exact: true })
    .click();
  await page.getByLabel("Apartment name").fill("lost-apartment-reply");
  await page.getByLabel("Monthly rent, USD").fill("1200");
  await page.getByLabel("Rent due day").fill("1");
  let lost = false;
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (
      !lost &&
      request.method() === "POST" &&
      request.headers()["next-action"] &&
      request.postData()?.includes("lost-apartment-reply")
    ) {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Save apartment", exact: true })
    .click();
  await expect(page.getByRole("alert").filter({ hasText: "Saving the apartment" })).toContainText(
    "Saving the apartment has not been confirmed",
  );
  await expect(page.getByLabel("Apartment name")).toBeDisabled();
  await page
    .getByRole("button", { name: "Check and retry", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "lost-apartment-reply", exact: true }),
  ).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(1);
});

test("shows due states, preserves localized drafts, and keeps rental months separate", async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00Z"));
  await signIn(page);
  await page.goto("/?month=2026-11");
  await addApartment(page, "Квартира у парка", "1200.03", "1");
  await addApartment(
    page,
    "Набережная — квартира с длинным названием",
    "900",
    "28",
  );
  const apartment = page.getByRole("article", { name: "Квартира у парка" });
  const upcoming = page.getByRole("article", {
    name: "Набережная — квартира с длинным названием",
  });
  await expect(apartment.getByText(/Overdue/)).toBeVisible();
  await expect(upcoming.getByText(/Overdue/)).toHaveCount(0);
  await apartment
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await apartment.getByLabel("Amount received, USD").fill("600,01");
  await apartment
    .getByRole("button", { name: "Add note", exact: true })
    .click();
  await apartment.getByLabel("Note", { exact: true }).fill("Часть аренды");
  await page.getByRole("button", { name: "Русский", exact: true }).click();
  await expect(apartment.getByLabel("Полученная сумма, USD")).toHaveValue(
    "600,01",
  );
  await expect(apartment.getByLabel("Примечание", { exact: true })).toHaveValue(
    "Часть аренды",
  );
  await expect(page).toHaveURL(/month=2026-11/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await capture(page, testInfo.project.name, "ru-entry");
  await apartment
    .getByRole("button", { name: "Сохранить получение", exact: true })
    .click();
  await expect(apartment.locator("dd").nth(1)).toContainText("600,01");
  await expect(apartment.locator("dd").nth(2)).toContainText("600,02");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    apartment.getByText("Partially paid", { exact: true }),
  ).toBeVisible();
  await expect(apartment.getByText(/Overdue/)).toBeVisible();
  await apartment
    .getByRole("button", { name: "Receipts (1)", exact: true })
    .click();
  await expect(
    apartment.getByText("Часть аренды", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await capture(page, testInfo.project.name, "en-overview");
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(page).toHaveURL(/month=2026-12/);
  await expect(apartment.locator("dd").nth(1)).toHaveText("$0.00");
  await expect(apartment.locator("dd").nth(2)).toHaveText("$1,200.03");
  await page
    .getByRole("button", { name: "Choose month:", exact: false })
    .click();
  await page.getByLabel("Rental month", { exact: true }).fill("2026-11");
  await page.getByRole("button", { name: "Show month", exact: true }).click();
  await expect(apartment.locator("dd").nth(1)).toHaveText("$600.01");
  await expect(apartment.locator("dd").nth(2)).toHaveText("$600.02");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await signIn(page);
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("keeps invalid entries editable and supports narrow screens and enlarged text", async ({
  page,
}, testInfo) => {
  await signIn(page);
  await capture(page, testInfo.project.name, "empty");
  await addApartment(
    page,
    "Квартира с длинным названием ".repeat(4).trim(),
    "999999999.99",
    "28",
  );
  const apartment = page.getByRole("article");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await capture(page, testInfo.project.name, "narrow-large-text");
  await apartment
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await apartment.getByLabel("Amount received, USD").fill("0.001");
  await apartment
    .getByRole("button", { name: "Save receipt", exact: true })
    .click();
  await expect(apartment.getByRole("alert")).toContainText(
    "Enter a positive amount",
  );
  await expect(apartment.getByLabel("Amount received, USD")).toBeEnabled();
  await capture(page, testInfo.project.name, "validation");
  await expect(
    apartment.getByRole("button", { name: "Receipts (0)", exact: true }),
  ).toBeVisible();
});
