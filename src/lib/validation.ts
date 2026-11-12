export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Returns the message to show, or null when the password is acceptable. */
export function passwordError(value: string): string | null {
  return value.length >= 8 ? null : "Password must be at least 8 characters.";
}
