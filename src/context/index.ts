// tslint:disable:variable-name
import { compose } from 'ramda';

import { Transformer } from '../types';

export type ContextualTransformer<C extends object, T, R = T> = (prev: T, ctx: C) => R;

export default class Context<T extends object> {
  constructor(
    private _trfms: ContextualTransformer<any, Partial<T>>[] = [],
    public parents: ContextualTransformer<any, any>[][] = []
  ) {}

  set<K extends keyof T>(name: K, value: ContextualTransformer<any, T[K]> | T[K]) {
    // console.log('setting', name, value);
    this._trfms.push((prev) => ({
      ...prev,
      [name]: typeof value === 'function' ? (value as ContextualTransformer<any, T[K]>)(prev[name]!, null) : value,
    }));

    return this;
  }

  update(value: ((prev: Partial<T>) => Partial<T>) | Partial<T>) {
    // console.log('updating', value, this._trfms);
    this._trfms.push((prev) => (typeof value === 'function' ? value(prev) : { ...prev, ...value }));
    // console.log('updated', this._trfms);

    return this;
  }

  inherit<P extends object>(ctx: ContextualTransformer<any, T, Context<P>> | Context<P>): Context<P & T> {
    this.parents.push(...(typeof ctx === 'function' ? [[ctx]] : [...ctx.parents, ctx._trfms]));

    return this as any;
  }

  resolve(ctx: any = null, initialValue = {}): T {
    const allTrfms = [...this.parents, this._trfms];
    debugger;
    const tag = this['__proto__'].constructor === Context ? 'CONTEXT' : 'REQUEST';
    console.log(`resolving ${tag}`, {
      allTrfms,
      initialValue,
      ctx,
    });
    const res = (compose as any)(...allTrfms.map(this.composeTransforms(ctx)))(initialValue);
    console.log(`resolved ${tag}!`, res);
    return res;
  }

  private composeTransforms(ctx: any) {
    return (trfms: ContextualTransformer<any, any>[]) => (initialValue: any) => (
      console.log({ from: initialValue }),
      ((x) => (console.log({ to: x }), x))(
        trfms.length
          ? (compose as any)(
              ...trfms.map((trfm) => (x: any) => {
                console.log('before', x);
                const y = trfm(x, ctx);
                console.log('after', y);
                return y;
              })
            )(initialValue)
          : initialValue
      )
    );
  }
}