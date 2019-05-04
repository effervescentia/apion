// tslint:disable:variable-name
import { compose } from 'ramda';

import { Transformer } from '../types';

export type ContextualTransformer<C extends object, T, R = T> = (prev: T, ctx: C) => R;

export const TEMPORAL = Symbol();

export interface Resolvable<T extends object> {
  resolve(ctx?: any, initialValue?: any): T;
  clone<S extends this>(): S;
}

export default class Context<T extends object> implements Resolvable<T> {
  private temporal: boolean = false;

  constructor(private _trfms: ContextualTransformer<any, Partial<T>>[] = [], public parents: Resolvable<any>[] = []) {}

  set<K extends keyof T>(name: K, value: ContextualTransformer<any, T[K]> | T[K], temporal = this.temporal) {
    const trfm = (prev: Partial<T>) => ({
      ...prev,
      [name]: typeof value === 'function' ? (value as ContextualTransformer<any, T[K]>)(prev[name]!, null) : value,
    });

    this._trfms.push(this.decorate(trfm, temporal));

    return this;
  }

  update(value: ((prev: Partial<T>) => Partial<T>) | Partial<T>, temporal = this.temporal) {
    const trfm = (prev: Partial<T>) => (typeof value === 'function' ? value(prev) : { ...prev, ...value });

    this._trfms.push(this.decorate(trfm, temporal));

    return this;
  }

  inherit<P extends object>(
    ctx: ContextualTransformer<any, Partial<T>, Resolvable<P>> | Resolvable<P>,
    temporal = false
  ): Context<P & T> {
    const parent = typeof ctx === 'function' ? Context.from(ctx as any) : ctx;

    this.parents.push(this.decorate(parent, temporal));

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

  clone<S extends this>(): S {
    const clone = this.shallowClone<S>();
    clone._trfms = [...this._trfms];
    clone.parents = this.parents.map((parent) => parent.clone());

    return clone;
  }

  setTemporal(temporal: boolean) {
    this.temporal = temporal;

    if (!temporal) {
      console.log('temporal trfms', this._trfms.length);
      console.log('temporal parents', this.parents.length);
      // this._trfms.length = 0;
      // this._trfms.push(...this._trfms.filter((trfm) => !(TEMPORAL in trfm)));
      // this.parents.length = 0;
      // this.parents.push(...this.parents.filter((parent) => !(TEMPORAL in parent)));
    }
  }

  protected shallowClone<S extends this>(): S {
    return new Context<T>() as any;
  }

  private decorate<S>(target: S, temporal: boolean) {
    return temporal ? Object.assign(target, { [TEMPORAL]: true }) : target;
  }

  static from<T extends object>(trfm: ContextualTransformer<any, Partial<T>>): Resolvable<T> {
    return new Context<T>([trfm]) as any;
  }
}
