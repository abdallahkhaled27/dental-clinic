import { test, expect } from "@playwright/test";

// There's no visible language switcher in the UI yet (see the note left
// for the user about this) — these visit /ar directly rather than
// clicking through one.
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
