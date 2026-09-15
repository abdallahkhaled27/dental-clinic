import { test, expect } from "@playwright/test";

test.describe("Arabic locale", () => {
  test("renders RTL with Arabic content at /ar", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByText("احجز موعد").first()).toBeVisible();
  });

  test("English stays the unprefixed default at /", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("link", { name: "Book Appointment" }).first()).toBeVisible();
  });

  test("protected routes keep the /ar prefix through the login redirect", async ({ page }) => {
    await page.goto("/ar/book");
    await expect(page).toHaveURL(/\/ar\/login\?next=%2Fbook/);
    await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
  });
});

test.describe("language switcher", () => {
  test("switches from English to Arabic and back, staying on the same page", async ({
    page,
  }) => {
    await page.goto("/login");
    // A real <a> (see LanguageSwitcher.tsx for why: a client-side nav
    // wouldn't re-run the root layout's dir/lang logic) means a real
    // full-page navigation — waited for explicitly rather than relying on
    // click()'s auto-wait, which raced this in practice.
    await Promise.all([
      page.waitForURL("/ar/login"),
      page.getByRole("link", { name: "العربية" }).click(),
    ]);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await Promise.all([
      page.waitForURL("/login"),
      page.getByRole("link", { name: "English" }).click(),
    ]);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});
