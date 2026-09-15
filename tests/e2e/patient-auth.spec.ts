import { test, expect } from "@playwright/test";
import { testEmail, deletePatientByEmail } from "./helpers/db";

test.describe("patient registration and login", () => {
  const email = testEmail("auth");
  const password = "RealPassword123";

  test.afterAll(async () => {
    await deletePatientByEmail(email);
  });

  test("rejects a weak password on registration", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full Name").fill("Playwright Patient");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    // Still on /register — a rejected submission must not navigate away.
    await expect(page).toHaveURL(/\/register/);
  });

  test("registers, then can log out and log back in", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full Name").fill("Playwright Patient");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Registration signs the patient in immediately (see registerPatient
    // in patient-auth.ts) and redirects to the dashboard.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "My Appointments" })).toBeVisible();

    // /api/patient/logout redirects straight to /login itself.
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Wrong password first — the login route must reject it, not the
    // account that doesn't exist yet.
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("TotallyWrongPassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();

    // Then the real password.
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  });
});

test.describe("protected routes", () => {
  test("redirects a signed-out visitor from /book to /login with a return path", async ({
    page,
  }) => {
    await page.goto("/book");
    await expect(page).toHaveURL(/\/login\?next=%2Fbook/);
  });

  test("redirects a signed-out visitor from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("forgot password", () => {
  test("shows the same message whether or not the email has an account", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("no-such-account-at-all@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/we've sent a link to reset your password/i)).toBeVisible();
  });
});
