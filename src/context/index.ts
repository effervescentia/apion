// tslint:disable:variable-name
import { compose } from 'ramda';

export type ContextualTransformer<C extends object, T, R = T> = (prev: T, ctx: C) => R;

export interface Resolvable<T extends object> {
  resolve(ctx?: any, initialValue?: any): T;
}

export default class Context<T extends object> implements Resolvable<T> {
  constructor(private _trfms: ContextualTransformer<any, Partial<T>>[] = [], public _parents: Resolvable<any>[] = []) {}

  set<K extends keyof T>(name: K, value: ContextualTransformer<any, T[K]> | T[K]) {
    const trfm = (prev: Partial<T>) => ({
      ...prev,
      [name]: typeof value === 'function' ? (value as ContextualTransformer<any, T[K]>)(prev[name]!, null) : value,
    });

    this._trfms.push(trfm);

    return this;
  }

  update(value: ((prev: Partial<T>) => Partial<T>) | Partial<T>) {
    const trfm = (prev: Partial<T>) => (typeof value === 'function' ? value(prev) : { ...prev, ...value });

    this._trfms.push(trfm);

    return this;
  }

  inherit<P extends object>(
    ctx: ContextualTransformer<any, Partial<T>, Resolvable<P>> | Resolvable<P>
  ): Context<P & T> {
    const parent = typeof ctx === 'function' ? Context.from(ctx as any) : ctx;

    this._parents.push(parent);

    return this as any;
  }

  resolve(ctx: any = null, initialValue = {}): T {
    const inheritedValue = this._parents.length
      ? (compose as any)(...this._parents.map((parent) => (prev: any) => parent.resolve(ctx, prev)))(initialValue)
      : initialValue;

    return this._trfms.length
      ? (compose as any)(...this._trfms.map((trfm) => (prev: any) => trfm(prev, ctx)))(inheritedValue)
      : inheritedValue;
  }

  static from<T extends object>(trfm: ContextualTransformer<any, Partial<T>>): Resolvable<T> {
    return new Context<T>([trfm]) as any;
  }
}
