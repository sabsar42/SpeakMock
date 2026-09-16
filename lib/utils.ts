import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { fromZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSlotDateTime(isoString: string, timeZone = "Asia/Dhaka"): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
}

export function isGmailAddress(email: string): boolean {
  return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}

/**
 * Combines a "YYYY-MM-DD" date and "HH:MM" time as wall-clock time in the
 * given IANA timezone, returning the equivalent UTC ISO string. Used by the
 * bulk slot creator, where the admin picks dates/times in local time.
 */
export function localDateTimeToIso(
  dateStr: string,
  timeStr: string,
  timeZone = "Asia/Dhaka"
): string {
  return fromZonedTime(`${dateStr}T${timeStr}:00`, timeZone).toISOString();
}

export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "Expired";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds
    .toString()
    .padStart(2, "0")}s`;
}
