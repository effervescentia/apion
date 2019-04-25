export function fromEntries<K extends string | number | symbol, V>(entries: [K, V][]): Record<K, V> {
  return entries.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Record<K, V>);
}
