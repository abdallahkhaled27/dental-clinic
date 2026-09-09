// Shared format checks, used anywhere user-supplied contact info gets
// validated (the booking form, lead capture, login) so the rules — and
// any future fix to them — live in exactly one place.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose on purpose: accepts "555-0123", "+1 (555) 012-3456", etc. without
// trying to fully validate international phone number formats.
const PHONE_PATTERN = /^[+\d][\d\s().-]{6,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}

export function isValidContact(value: string): boolean {
  const trimmed = value.trim();
  return isValidEmail(trimmed) || isValidPhone(trimmed);
}

// Length only, deliberately — composition rules ("must contain a symbol")
// push people toward predictable substitutions without adding real
// strength. Length is what actually makes a password hard to brute-force.
export function isValidPassword(value: string): boolean {
  return value.length >= 8;
}
