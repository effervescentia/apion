// tslint:disable:variable-name
import { Applicator } from '@/types';
import { compose } from '@/utils';

const TRFM_TYPE = Symbol('transform type');
const TRFM_VALUE = Symbol('transform value');

export type ContextualTransform<C, T, R = T> = Applicator<T, C, R>;

export interface Resolvable<T extends object> {
  resolve(ctx?: any, initialValue?: any): T;
}

export default class Context<T extends object> implements Resolvable<T> {
  constructor(public transforms: ContextualTransform<any, Partial<T>>[] = []) {}

  set<K extends keyof T>(name: K, value: ContextualTransform<any, T[K]> | T[K]) {
    const trfm = (prev: Partial<T>, ctx?: any) => ({
      ...prev,
      [name]: typeof value === 'function' ? (value as ContextualTransform<any, T[K]>)(prev[name]!, ctx) : value,
    });

    return this.transform(Object.assign(trfm, { [TRFM_TYPE]: `set(${name})`, [TRFM_VALUE]: value }));
  }

  update(value: Applicator<Partial<T>, any> | Partial<T>) {
    const trfm = (prev: Partial<T>, ctx: any) =>
      typeof value === 'function' ? value(prev, ctx) : { ...prev, ...value };

    return this.transform(Object.assign(trfm, { [TRFM_TYPE]: 'update', [TRFM_VALUE]: value }));
  }

  resolve(context: any = null, initialValue = {}): T {
    return this.transforms.length
      ? compose(...this.transforms.map((trfm) => (value: any, ctx: any) => trfm(value, ctx)))(initialValue, context)
      : initialValue;
  }

  clone() {
    return new Context(this.transforms);
  }

  private transform(trfm: ContextualTransform<any, Partial<T>>) {
    this.transforms = [...this.transforms, trfm];

    return this;
  }

  static from<T extends object>(trfm: ContextualTransform<any, Partial<T>>): Resolvable<T> {
    return new Context<T>([trfm]) as any;
  }
}
