const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short"
});

/** Formats an ISO 8601 timestamp from the API, e.g. "Nov 15, 2026, 10:30 AM". */
export function formatDateTime(iso: string): string {
  return formatter.format(new Date(iso));
}
