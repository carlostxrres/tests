import { format, formatDistanceToNow, isSameYear } from "date-fns";
import { es } from "date-fns/locale";

export function formatDateTime(value: string | Date): string {
  const date = new Date(value);
  const pattern = isSameYear(date, new Date()) ? "d MMM, HH:mm" : "d MMM yyyy, HH:mm";
  return format(date, pattern, { locale: es });
}

export function formatDate(value: string | Date): string {
  return format(new Date(value), "d MMM yyyy", { locale: es });
}

export function formatRelative(value: string | Date): string {
  return formatDistanceToNow(new Date(value), { locale: es, addSuffix: true });
}
