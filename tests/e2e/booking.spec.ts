import { test, expect, type Page } from "@playwright/test";
import { testEmail, deletePatientByEmail, futureOpenDateString } from "./helpers/db";

// A successful booking POST always saves the appointment; whether the
// browser then shows the plain success screen or gets redirected to pay a
// deposit depends only on whether STRIPE_SECRET_KEY is configured in this
// process (see BookingForm.tsx and createDepositCheckoutSession) — true
// when run locally with real keys, false in CI where no Stripe secret is
// set. Branching on the same env var here keeps this test honest about
// actual app behavior instead of hardcoding one path. The Stripe-hosted
// Checkout page itself isn't exercised here — that's real payment UI on
// Stripe's own domain, already verified manually end-to-end separately.
async function expectBookingSucceeded(page: Page) {
  if (process.env.STRIPE_SECRET_KEY) {
    await page.waitForURL(/^https:\/\/checkout\.stripe\.com\//, { timeout: 15_000 });
    await page.goto("/dashboard");
  } else {
    await expect(page.getByText("Appointment requested!")).toBeVisible();
    await page.getByRole("link", { name: "My Appointments" }).click();
  }
}

// Covers the same booking path BookingForm.tsx -> /api/appointments ->
// createAppointment goes through for a real patient — registration,
// filling out every field, and the actual database write, exercised
// through a real browser rather than a direct API call (see
// appointments.test.ts for the unit-level validation rules this doesn't
// re-check).
test.describe("booking an appointment", () => {
  const email = testEmail("booking");
  const password = "RealPassword123";

  test.afterAll(async () => {
    await deletePatientByEmail(email);
  });

  test("registers, books an appointment, and sees it on the dashboard", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full Name").fill("Playwright Booker");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("You don't have any appointments yet.")).toBeVisible();

    // Both the header nav and the empty-dashboard state have a "Book
    // Appointment" link — scoped to <main> for the latter specifically.
    await page.locator("main").getByRole("link", { name: "Book Appointment" }).click();
    await expect(page).toHaveURL(/\/book/);

    await page.getByLabel("Phone").fill("+201000000000");
    await page.getByLabel("Service").selectOption({ label: "Teeth Whitening" });

    // The seeded dentist's name isn't known ahead of time — pick whichever
    // real option comes after the "Select a dentist" placeholder rather
    // than hardcoding one.
    const dentistSelect = page.getByLabel("Dentist");
    const dentistValue = await dentistSelect.locator("option").nth(1).getAttribute("value");
    await dentistSelect.selectOption(dentistValue!);

    await page.getByLabel("Date").fill(futureOpenDateString());
    await page.getByLabel("Time").selectOption({ label: "10:00 AM" });
    await page.getByLabel("Notes (optional)").fill("Booked by the Playwright suite.");

    await page.getByRole("button", { name: "Request Appointment" }).click();
    await expectBookingSucceeded(page);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Teeth Whitening")).toBeVisible();
    await expect(page.getByText("Booked by the Playwright suite.")).toBeVisible();
  });

  test("rejects booking the same slot twice for the same dentist", async ({ page }) => {
    const date = futureOpenDateString();

    async function book() {
      await page.goto("/book");
      await page.getByLabel("Phone").fill("+201000000000");
      await page.getByLabel("Service").selectOption({ label: "Orthodontics" });
      const dentistSelect = page.getByLabel("Dentist");
      const dentistValue = await dentistSelect.locator("option").nth(1).getAttribute("value");
      await dentistSelect.selectOption(dentistValue!);
      await page.getByLabel("Date").fill(date);
      await page.getByLabel("Time").selectOption({ label: "11:00 AM" });
      await page.getByRole("button", { name: "Request Appointment" }).click();
    }

    // Already signed in from the previous test in this file (same page
    // context isn't shared across tests, so sign in again).
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await book();
    await expectBookingSucceeded(page);

    await book();
    // Exact same patient, dentist, date, and time as the booking above —
    // deliberately violates both DB-level unique constraints at once (see
    // schema.prisma): whichever one Postgres reports first, the booking
    // must be rejected outright, not silently duplicated.
    await expect(
      page.getByText(/already booked|already have an appointment/i),
    ).toBeVisible();
  });
});
