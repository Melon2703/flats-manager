import { expect, test } from "@playwright/test";

test("opens a seeded local ledger without credentials and retains receipt edits", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByText("Тестовые данные · только локально", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(10);
  await expect(
    page.getByLabel("Электронная почта", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: `/private/tmp/flats-demo-${testInfo.project.name}-ru.png`, fullPage: true });
  await page.getByRole("button", { name: "English", exact: true }).click();
  const apartment = page.getByRole("article", {
    name: "Квартира у парка",
    exact: true,
  });
  await apartment
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await apartment.getByLabel("Amount received, USD").fill("600");
  await apartment
    .getByRole("button", { name: "Save receipt", exact: true })
    .click();
  await expect(
    apartment.getByText("Partially paid", { exact: true }),
  ).toBeVisible();
  await expect(apartment.locator("dd").nth(2)).toHaveText("$600.00");
  await page.reload();
  await expect(apartment.locator("dd").nth(1)).toHaveText("$600.00");
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
  await apartment
    .getByRole("button", { name: "Receipts (2)", exact: true })
    .click();
  await expect(apartment.getByRole("listitem")).toHaveCount(2);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `/private/tmp/flats-demo-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("reconciles a lost demo save response and preserves exact cents", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  const apartment = page.getByRole("article", {
    name: "Квартира у парка",
    exact: true,
  });
  await apartment
    .getByRole("button", { name: "Record receipt", exact: true })
    .click();
  await apartment.getByLabel("Amount received, USD").fill("600.01");
  await apartment
    .getByRole("button", { name: "Add note", exact: true })
    .click();
  await apartment
    .getByLabel("Note", { exact: true })
    .fill("demo-lost-response");
  let lost = false;
  await page.route("**/*", async (route) => {
    if (
      !lost &&
      route.request().method() === "POST" &&
      route.request().postData()?.includes("demo-lost-response")
    ) {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await apartment
    .getByRole("button", { name: "Save receipt", exact: true })
    .click();
  await expect(apartment.getByRole("alert")).toContainText(
    "Saving has not been confirmed",
  );
  await apartment
    .getByRole("button", { name: "Check and retry", exact: true })
    .click();
  await expect(apartment.locator("dd").nth(1)).toHaveText("$600.01");
  await expect(apartment.locator("dd").nth(2)).toHaveText("$599.99");
  await apartment
    .getByRole("button", { name: "Receipts (1)", exact: true })
    .click();
  await expect(apartment.getByRole("listitem")).toHaveCount(1);
});

test("does not expose demo mode on a non-local host", async ({ page }) => {
  // Chromium forbids setting Host directly. Forward the real document request
  // through Playwright's HTTP client, then render the server's actual response.
  await page.route("**/?month=2026-11", async route => {
    const response = await route.fetch({ headers: { ...route.request().headers(), host: "prototype.example" } });
    await route.fulfill({ response });
  });
  await page.goto("/?month=2026-11");
  await expect(
    page.getByRole("heading", {
      name: "Подключение ещё не настроено",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Тестовые данные · только локально", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("adds demo apartments, resets samples, and isolates another browser", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page
    .getByRole("button", { name: "Add apartment", exact: true })
    .click();
  await page.getByLabel("Apartment name").fill("Local test apartment");
  await page.getByLabel("Monthly rent, USD").fill("1200.03");
  await page.getByLabel("Rent due day").fill("28");
  await page
    .getByRole("button", { name: "Save apartment", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(11);
  await page.reload();
  await expect(
    page.getByRole("article", { name: "Local test apartment", exact: true }),
  ).toBeVisible();
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto("http://localhost:3100/");
  await expect(otherPage.getByRole("article")).toHaveCount(10);
  await other.close();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(10);
  await expect(
    page.getByRole("article", { name: "Local test apartment", exact: true }),
  ).toHaveCount(0);
});
