// tslint:disable:variable-name
import _fetch from 'cross-fetch';

import RequestBuilder from '@/builders/request';
import { Lambda } from '@/types';
import { fromEntries } from '@/utils';
import ConfigBuilder from './config';

export type Constructor<K extends string, T extends any[], R extends object> =
  | Lambda<T, R>
  | Lambda<T, <S extends Record<string, any>>(builder: GroupBuilder<R, K, {}>) => GroupBuilder<any, K, S>>;

export type ActionConstructor<K extends string, T extends any[], R extends object> =
  | Constructor<K, T, R>
  | RequestBuilder<R>;

export default class GroupBuilder<
  C extends object,
  K extends string,
  X extends Record<string, GroupBuilder<any, any, any>>,
  A extends any[] = never
> extends ConfigBuilder<C, K> {
  protected _ctor?: ActionConstructor<K, A, any>;
  protected _children: X = {} as X;

  constructor(name?: K, ctor?: Constructor<K, A, any>, _parents: ConfigBuilder<any, string>[] = []) {
    super(name, _parents);

    this._ctor = ctor;
  }

  nest<N extends string, T extends GroupBuilder<any, string, any>>(
    name: N,
    builder: T
  ): GroupBuilder<C, K, X & Record<N, T>>;
  nest<N extends string, T extends GroupBuilder<any, N, any>>(builder: T): GroupBuilder<C, K, X & Record<N, T>>;
  nest<N extends string, T extends GroupBuilder<any, string, any>>(builderOrName: N | T, builder?: T) {
    if (typeof builderOrName === 'string' && builder) {
      this.addChild(builderOrName, builder);
    } else {
      const namedBuilder = builderOrName as GroupBuilder<any, string, any>;

      this.addChild(namedBuilder.name!, namedBuilder);
    }

    return this;
  }

  ctor(ctor: Constructor<K, A, C>) {
    this._ctor = ctor;

    return this;
  }

  build(fetch: typeof _fetch = _fetch) {
    if (this._ctor) {
      return (...args: A) => {
        const transient = this.clone('group_ctor');

        this.wrappedConstructor(transient as any)(...args);

        return this.buildChildren(fetch, transient as any);
      };
    }

    return this.buildChildren(fetch);
  }

  protected wrappedConstructor(self = this) {
    return (...args: A) => {
      const context = (this._ctor as Lambda<A, any>)(...args);

      if (typeof context === 'function') {
        context(self);
      } else {
        self._context.update(context);
      }
    };
  }

  protected buildChildren(fetch: typeof _fetch, mixin?: this): Record<keyof X, any> {
    return fromEntries<keyof X, any>(
      Object.entries(this._children).map(([key, value]) => [key, (mixin ? value.inherit(mixin) : value).build(fetch)])
    );
  }

  protected newInstance(name: string) {
    return new GroupBuilder(`${this.name}::${name}`);
  }

  protected clone(name: string): this {
    return this.evolve(this.newInstance(name) as this);
  }

  protected evolve(builder: this) {
    super.evolve(builder);
    builder._ctor = this._ctor;
    builder._children = Object.keys(this._children).reduce(
      (acc, key) => ({
        ...acc,
        [key]: this._children[key].replaceParent(this, builder),
      }),
      {} as any
    );

    return builder;
  }

  private addChild<T extends ConfigBuilder<any, string>>(name: string, builder: T) {
    if (name in this._children) {
      throw new Error(`all children must have unique names, duplicate "${name}" not added`);
    }

    const flattened = builder.flatten().inherit(this);

    this._children = { ...this._children, [name]: flattened };
  }
}
