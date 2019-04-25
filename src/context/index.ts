// tslint:disable:variable-name
import { compose } from 'ramda';

export type ContextualTransformer<C extends object, T, R = T> = (prev: T, ctx: C) => R;

export default class Context<T extends object> {
  constructor(private _trfms: ContextualTransformer<any, Partial<T>>[] = [], public parents: Context<any>[] = []) {}

  set<K extends keyof T>(name: K, value: ContextualTransformer<any, T[K]> | T[K]) {
    this._trfms.push((prev) => ({
      ...prev,
      [name]: typeof value === 'function' ? (value as ContextualTransformer<any, T[K]>)(prev[name]!, null) : value,
    }));

    return this;
  }

  update(value: ((prev: Partial<T>) => Partial<T>) | Partial<T>) {
    this._trfms.push((prev) => (typeof value === 'function' ? value(prev) : { ...prev, ...value }));

    return this;
  }

  inherit<P extends object>(ctx: ContextualTransformer<any, Partial<T>, Context<P>> | Context<P>): Context<P & T> {
    this.parents.push(typeof ctx === 'function' ? Context.from(ctx as any) : ctx);

    return this as any;
  }

  resolve(ctx: any = null, initialValue = {}): T {
    const inheritedValue = this.parents.length
      ? (compose as any)(...this.parents.map((parent) => (prev: any) => parent.resolve(ctx, prev)))(initialValue)
      : initialValue;

    return this._trfms.length
      ? (compose as any)(...this._trfms.map((trfm) => (prev: any) => trfm(prev, ctx)))(inheritedValue)
      : inheritedValue;
  }

  static from<T extends object>(trfm: ContextualTransformer<any, Partial<T>>) {
    return new Context<T>([trfm]);
  }
}
