// tslint:disable:variable-name
import _fetch from 'cross-fetch';

import RequestBuilder from '@/builders/request';
import { fromEntries } from '@/utils';
import ConfigBuilder, { ContextualBuilder } from './config';

export type Constructor<K extends string, T extends any[], R extends object> =
  | ((...args: T) => R)
  | ((...args: T) => <S extends Record<string, any>>(builder: GroupBuilder<R, K, {}>) => GroupBuilder<any, K, S>);

export interface NestingBuilder<C extends object, K extends string, T extends Record<string, any>, A extends any[]> {
  build(fetch?: typeof _fetch): ((...args: A) => Record<keyof T, any>) | Record<keyof T, any>;

  use(builder: ContextualBuilder<C>): this;
}

export default class GroupBuilder<
  C extends object,
  K extends string,
  X extends Record<string, NestingBuilder<any, string, any, any>>,
  A extends any[] = never
> extends ConfigBuilder<C, K> implements NestingBuilder<C, K, X, A> {
  private _children: X = {} as X;

  constructor(name?: K, public ctor?: Constructor<K, A, any> | RequestBuilder<any>) {
    super(name);
  }

  use(builder: ContextualBuilder<C>) {
    super.use(builder);

    Object.values(this._children).forEach((child) => child.use(builder));

    return this;
  }

  nest<D extends object, L extends string, Y extends Record<string, NestingBuilder<any, string, any, any>>>(
    name: L,
    builder: NestingBuilder<D, string, Y, any>
  ): GroupBuilder<C, K, X & Record<L, NestingBuilder<D, string, Y, any>>>;
  nest<D extends object, L extends string, Y extends Record<string, NestingBuilder<any, string, any, any>>>(
    builder: NestingBuilder<D, L, Y, any>
  ): GroupBuilder<C, K, X & Record<L, NestingBuilder<D, L, Y, any>>>;
  nest<D extends object, L extends string, Y extends Record<string, NestingBuilder<any, string, any, any>>>(
    builderOrName: L | GroupBuilder<D, L, Y>,
    builder?: NestingBuilder<D, L, Y, any>
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
    if (this.ctor) {
      return (...args: A) => {
        const children = this.buildChildren(fetch);

        this.wrappedConstructor()(...args);

        return children;
      };
    }

    return this.buildChildren(fetch);
  }

  protected wrappedConstructor(self = this) {
    return (...args: A) => {
      const context = (this.ctor as (...args: A) => any)(...args);

      if (typeof context === 'function') {
        context(self);
      } else {
        self._context.update(context);
      }
    };
  }

  protected buildChildren(fetch: typeof _fetch, mixin?: this): Record<keyof X, any> {
    return fromEntries<keyof X, any>(
      Object.entries(this._children).map(([key, value]) => [key, (mixin ? value.use(mixin) : value).build(fetch)])
    );
  }
}
