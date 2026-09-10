import { describe, it, expect, afterEach, vi } from "vitest";
import { getClinicToday, getClinicTomorrow, getClinicNowMinutes, closedWeekdays } from "@/lib/clinic-data";

afterEach(() => {
  vi.useRealTimers();
});

describe("getClinicToday", () => {
  it("reflects Cairo's date, not the process's own timezone", () => {
    // 2026-01-04T22:30:00Z is already 2026-01-05 00:30 in Cairo (UTC+2) —
    // exactly the kind of near-midnight instant that broke the old
    // toISOString()-based implementation (a real bug found and fixed
    // earlier in this project).
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-04T22:30:00Z"));
    expect(getClinicToday()).toBe("2026-01-05");
  });
});

describe("getClinicTomorrow", () => {
  it("is exactly one day after getClinicToday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-04T10:00:00Z"));
    expect(getClinicToday()).toBe("2026-01-04");
    expect(getClinicTomorrow()).toBe("2026-01-05");
  });

  it("rolls over correctly at a month boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-31T10:00:00Z"));
    expect(getClinicTomorrow()).toBe("2026-02-01");
  });
});

describe("getClinicNowMinutes", () => {
  it("matches Cairo's clock, not UTC", () => {
    vi.useFakeTimers();
    // 13:31 UTC = 15:31 Cairo (UTC+2 in January) = 15*60+31 minutes.
    vi.setSystemTime(new Date("2026-01-04T13:31:00Z"));
    expect(getClinicNowMinutes()).toBe(931);
  });
});

describe("closedWeekdays", () => {
  it("marks Friday and Saturday closed, matching the site's displayed hours", () => {
    expect(closedWeekdays).toEqual([5, 6]);
  });
});
