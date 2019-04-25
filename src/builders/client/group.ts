// tslint:disable:variable-name
import _fetch from 'cross-fetch';

import Context from '../../context';
import { Named } from '../../types';
import { fromEntries } from '../../utils';
import RequestBuilder from '../request';
import ConfigBuilder, { ContextualBuilder } from './config';

export type Constructor<K extends string, T extends any[], R extends object> =
  | ((...args: T) => R)
  | ((...args: T) => <S extends Record<string, any>>(builder: GroupBuilder<R, K, {}>) => GroupBuilder<R, K, S>);

export default class GroupBuilder<
  C extends object,
  K extends string,
  X extends Record<string, GroupBuilder<any, string, any>>,
  A extends any[] = never
> extends ConfigBuilder<C> implements Named<K> {
  private _children: X = {} as X;

  protected get wrappedConstructor() {
    return (...args: A) => {
      const context = (this.ctor as (...args: A) => any)(...args);
      // console.log('ctor', { context });

      if (typeof context === 'function') {
        // console.log('abc', this._ctx);
        context(this);
      } else {
        // console.log('def', this._ctx);
        this._ctx.update(context);
      }
    };
  }

  constructor(public name?: K, public ctor?: Constructor<K, A, any> | RequestBuilder<any>) {
    super();
  }

  use(builder: ContextualBuilder<C>) {
    super.use(builder);

    Object.values(this._children).forEach((child) => child.use(builder));

    return this;
  }

  nest<D extends object, L extends string, Y extends Record<string, GroupBuilder<any, string, any>>>(
    name: L,
    builder: GroupBuilder<D, string, Y>
  ): GroupBuilder<C, K, X & Record<L, GroupBuilder<D, string, Y>>>;
  nest<D extends object, L extends string, Y extends Record<string, GroupBuilder<any, string, any>>>(
    builder: GroupBuilder<D, L, Y>
  ): GroupBuilder<C, K, X & Record<L, GroupBuilder<D, string, Y>>>;
  nest<D extends object, L extends string, Y extends Record<string, GroupBuilder<any, string, any>>>(
    builderOrName: L | GroupBuilder<D, L, Y>,
    builder?: GroupBuilder<D, string, Y>
  ) {
    if (typeof builderOrName === 'string' && builder) {
      builder.use(this);
      this._children = { ...this._children, [builderOrName]: builder };
    } else {
      const namedBuilder = builderOrName as GroupBuilder<D, L, Y>;

      namedBuilder.use(this);
      this._children = { ...this._children, [namedBuilder.name!]: namedBuilder };
    }

    return this;
  }

  build(fetch: typeof _fetch = _fetch) {
    const children = this.buildChildren(fetch);

    // console.log({ children });

    if (this.ctor) {
      return (...args: A) => {
        this.wrappedConstructor(...args);

        return children;
      };
    }

    return children;
  }

  protected buildChildren(fetch: typeof _fetch): Record<keyof X, any> {
    return fromEntries<keyof X, any>(Object.entries(this._children).map(([key, value]) => [key, value.build(fetch)]));
  }
}
