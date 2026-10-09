/** Format a Date as ISO-8601 with numeric timezone offset (matches backend Zod datetime). */
export function toOffsetIso(date: Date): string {
  const offset = date.getTimezoneOffset();
  const absolute = Math.abs(offset);
  const offsetHours = Math.floor(absolute / 60);
  const offsetMinutes = absolute % 60;
  const offsetSign = offset <= 0 ? '+' : '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
}

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function datetimeLocalFromIso(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
