import { expect, test } from "@playwright/test";

test("opens a readable Russian shell on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Управление арендой" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page).toHaveTitle("Управление арендой");
  await expect(
    page.getByRole("button", { name: "Русский", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "English", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("switches all shell text and remembers the language across reloads and visits", async ({
  page,
  context,
}) => {
  await page.goto("/?view=home#top");
  const demo = process.env.RENTAL_MANAGER_DATA_MODE !== "supabase";
  if (demo)
    await expect(
      page.getByText("Аренда за выбранный месяц · USD"),
    ).toBeVisible();
  const originalUrl = page.url();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Rental Manager", exact: true }),
  ).toBeVisible();
  if (demo)
    await expect(
      page.getByText("Demo data · local only", { exact: true }),
    ).toBeVisible();
  else {
    await expect(
      page.getByRole("heading", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Sign in to open your rental records."),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("form", { name: "Interface language" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "English", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Rental Manager");
  await expect(page).toHaveURL(originalUrl);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Rental Manager", exact: true }),
  ).toBeVisible();

  const returnVisit = await context.newPage();
  await page.close();
  await returnVisit.goto("/");
  await expect(
    returnVisit.getByRole("heading", { name: "Rental Manager", exact: true }),
  ).toBeVisible();
  await returnVisit
    .getByRole("button", { name: "Русский", exact: true })
    .click();
  await expect(
    returnVisit.getByRole("heading", { name: "Управление арендой" }),
  ).toBeVisible();
  if (demo)
    await expect(
      returnVisit.getByText("Тестовые данные · только локально", {
        exact: true,
      }),
    ).toBeVisible();
  else {
    await expect(
      returnVisit.getByRole("heading", { name: "Войти", exact: true }),
    ).toBeVisible();
    await expect(
      returnVisit.getByText("Войдите, чтобы открыть свои записи об аренде."),
    ).toBeVisible();
  }
  await expect(
    returnVisit.getByRole("form", { name: "Язык интерфейса" }),
  ).toBeVisible();
  await expect(returnVisit.locator("html")).toHaveAttribute("lang", "ru");
  await expect(returnVisit).toHaveTitle("Управление арендой");
  await returnVisit.reload();
  await expect(
    returnVisit.getByRole("button", { name: "Русский", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
