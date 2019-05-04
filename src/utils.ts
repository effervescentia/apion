export function fromEntries<K extends string | number | symbol, V>(
  entries: Array<[K, V]>
): Record<K, V> {
  return entries.reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value } as any),
    // tslint:disable-next-line:no-object-literal-type-assertion
    {} as Record<K, V>
  );
}

export function compose(
  ...transforms: Array<(value: any, context?: any) => any>
): any {
  return (initialValue: any, context?: any) =>
    transforms.reduce((prev, trfm) => trfm(prev, context), initialValue);
}

export function identity<T>(value: T): T {
  return value;
}
