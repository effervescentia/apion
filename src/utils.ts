export function fromEntries<K extends string | number | symbol, V>(entries: [K, V][]): Record<K, V> {
  return entries.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Record<K, V>);
}

export function compose(...transforms: ((value: any, context?: any) => any)[]) {
  return (initialValue: any, context?: any) => transforms.reduce((prev, trfm) => trfm(prev, context), initialValue);
}

export function identity<T>(value: T) {
  return value;
}
