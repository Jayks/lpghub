import { format, formatDistanceToNow, parseISO } from "date-fns";

/**
 * Format a date string or Date as "15 Jan 2025".
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy");
}

/**
 * Format a timestamp as "15 Jan 2025, 3:42 PM".
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy, h:mm a");
}

/**
 * Format a timestamp relative to now, e.g. "2 hours ago".
 */
export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format just the time portion, e.g. "3:42 PM".
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}
