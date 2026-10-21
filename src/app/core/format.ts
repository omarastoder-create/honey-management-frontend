const EURO = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/** 1234.5 -> "1.234,50 €" (for messages built in TypeScript; templates use the currency pipe) */
export function euro(amount: number): string {
  return EURO.format(amount);
}

/** "Max Mustermann" -> "MM" */
export function initials(...parts: (string | null | undefined)[]): string {
  return parts
    .flatMap(p => (p ?? '').trim().split(/\s+/))
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

const AVATAR_TONES = ['tone-honey', 'tone-green', 'tone-blue', 'tone-violet', 'tone-red'];

/** Same name -> always the same avatar colour. */
export function avatarTone(name: string | null | undefined): string {
  let hash = 0;
  for (const ch of name ?? '') {
    hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

/** 1536000 -> "1,5 MB" */
export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Today as yyyy-MM-dd for <input type="date">, in local time (not UTC). */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Case-insensitive "contains" over several fields, used by all search boxes. */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  return !q || fields.some(f => (f ?? '').toLowerCase().includes(q));
}
