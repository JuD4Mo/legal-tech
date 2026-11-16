export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
export function relativeDate(offset: number) {
  const d = new Date(`${today()}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
export function formatDate(value: string, full = false) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: full ? 'long' : 'short',
    ...(full ? { year: 'numeric' } : {}),
  }).format(new Date(value.length === 10 ? `${value}T12:00:00-05:00` : value));
}
export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
}
