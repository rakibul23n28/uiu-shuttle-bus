// ====================================================================
// ---- TIME UTILITIES ----
// ====================================================================

export interface ParsedTime {
  hour: number;
  minute: number;
}

/**
 * Parses a time string in "HH:MM AM/PM" format.
 */
function parseTime(timeStr: string): ParsedTime | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

/**
 * Checks if a given time (hour, minute) is after the current time.
 */
function isAfterCurrent(hour: number, minute: number): boolean {
  const now = new Date();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();

  return hour > nowHour || (hour === nowHour && minute > nowMinute);
}

/**
 * Checks if the current time is within a range [start, end].
 */
function isWithinRange(start: ParsedTime, end: ParsedTime): boolean {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  const afterStart = h > start.hour || (h === start.hour && m >= start.minute);
  const beforeEnd = h < end.hour || (h === end.hour && m <= end.minute);

  return afterStart && beforeEnd;
}

/**
 * Finds the next scheduled trip time string based on the current time.
 */
export function findNextTrip(times: string[]): string | null {
  for (const timeStr of times) {
    if (timeStr.includes("-")) {
      const [startTime, endTime] = timeStr.split("-").map((s) => s.trim());
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      if (!start || !end) continue;

      // Check if current time is within the range, or if the range start is in the future
      if (
        isWithinRange(start, end) ||
        isAfterCurrent(start.hour, start.minute)
      ) {
        return timeStr;
      }
    } else {
      const time = parseTime(timeStr);
      if (!time) continue;
      if (isAfterCurrent(time.hour, time.minute)) return timeStr;
    }
  }
  return null;
}
