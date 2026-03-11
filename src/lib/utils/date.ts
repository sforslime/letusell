export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatPickupTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/**
 * Generate 15-minute pickup slots between opensAt and closesAt for today.
 * Times are interpreted as Africa/Lagos (WAT = UTC+1, no DST).
 * @param opensAt  "HH:MM" e.g. "08:00"
 * @param closesAt "HH:MM" e.g. "20:00"
 * @param bufferMins minutes from now before first available slot
 */
export function generatePickupSlots(
  opensAt: string,
  closesAt: string,
  bufferMins = 20
): string[] {
  const now = new Date();

  // Get today's date in Nigeria (WAT = UTC+1). "en-CA" gives YYYY-MM-DD format.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);

  // Parse open/close as WAT times by appending the +01:00 offset
  const open = new Date(`${today}T${opensAt}:00+01:00`);
  const close = new Date(`${today}T${closesAt}:00+01:00`);
  const earliest = new Date(now.getTime() + bufferMins * 60_000);

  const slots: string[] = [];
  let cursor = new Date(open);

  // Round up to next 15-minute mark
  const mins = cursor.getMinutes();
  const rounded = Math.ceil(mins / 15) * 15;
  cursor.setMinutes(rounded, 0, 0);

  while (cursor < close) {
    if (cursor >= earliest) {
      slots.push(cursor.toISOString());
    }
    cursor = new Date(cursor.getTime() + 15 * 60_000);
  }

  return slots;
}
