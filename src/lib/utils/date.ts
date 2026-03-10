export function formatPickupTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/**
 * Generate 15-minute pickup slots between opensAt and closesAt for today.
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
  const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const open = new Date(`${today}T${opensAt}:00`);
  const close = new Date(`${today}T${closesAt}:00`);
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
