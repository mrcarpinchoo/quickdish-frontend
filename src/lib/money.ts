const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN"
});

/** Formats an integer amount in cents as pesos, e.g. 11000 → "$110.00". */
export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
}
