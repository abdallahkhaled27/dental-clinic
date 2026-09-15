import { test, expect } from "@playwright/test";
import { testEmail, createTestStaff, deleteStaffByEmail } from "./helpers/db";

test.describe("staff authentication", () => {
  const email = testEmail("staff");
  const password = "RealStaffPassword123";

  test.beforeAll(async () => {
    // No public staff sign-up (see prisma/create-admin.ts) — seeded
    // directly, the same way that script does.
    await createTestStaff(email, password);
  });

  test.afterAll(async () => {
    await deleteStaffByEmail(email);
  });

  test("redirects a signed-out visitor from /admin to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("rejects the wrong password", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("NotTheRealPassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("signs in and reaches the staff dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/admin");
    await expect(page.getByRole("heading", { name: "Staff Dashboard" })).toBeVisible();
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

    // A patient session must never satisfy this gate — the admin route
    // group's own layout has no patient chrome at all to leak into, but
    // the log-out button itself is the one real per-session bit of UI
    // this page needs to prove is here for the right account.
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
