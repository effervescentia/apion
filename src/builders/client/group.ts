// tslint:disable:variable-name no-expression-statement
import _fetch from 'cross-fetch';

import RequestBuilder, {
  Instance as RequestBuilderInstance,
} from '@/builders/request';
import { Lambda } from '@/types';
import { fromEntries } from '@/utils';
import ConfigBuilder from './config';

export type GenericGroupBuilder = GroupBuilder<any, string, any, any>;

export type NameOf<T> = T extends ConfigBuilder<any, infer R> ? R : never;

export type Constructor<K extends string, T extends any[], R extends object> =
  | Lambda<T, R>
  | Lambda<
      T,
      <S extends Record<string, any>>(
        builder: GroupBuilder<R, K, {}>
      ) => GroupBuilder<any, K, S>
    >;

export type ActionConstructor<
  K extends string,
  T extends any[],
  R extends object
> = Constructor<K, T, R> | RequestBuilder<R>;

export type BuiltClient<
  A extends any[],
  X extends Record<string, GenericGroupBuilder>
> =
  | Lambda<A, Record<keyof X, any>>
  | ((Lambda<A, Promise<Response>> | Lambda<[], Promise<Response>>) &
      Record<keyof X, any>)
  | ((builder: RequestBuilderInstance<any>) => void)
  | Record<keyof X, any>;

export type BuiltClient2<
  A,
  X extends Record<string, GenericGroupBuilder>
> = A extends any[]
  ? (
      | Lambda<A, Record<keyof X, any>>
      | ((Lambda<A, Promise<Response>> | Lambda<[], Promise<Response>>) &
          Record<keyof X, any>))
  : Record<keyof X, any>;

export default class GroupBuilder<
  C extends object,
  K extends string,
  X extends Record<string, GenericGroupBuilder>,
  A extends any[] = never
> extends ConfigBuilder<C, K> {
  // tslint:disable-next-line:readonly-keyword
  protected _ctor?: ActionConstructor<K, A, any>;
  // tslint:disable-next-line:readonly-keyword no-object-literal-type-assertion
  protected _children: X = {} as X;

  constructor(
    name?: K,
    ctor?: Constructor<K, A, any>,
    _parents: Array<ConfigBuilder<any, string>> = []
  ) {
    super(name, _parents);

    this._ctor = ctor;
  }

  public nest<N extends string, T extends GenericGroupBuilder>(
    name: N,
    builder: T
  ): GroupBuilder<C, K, X & Record<N, T>, A>;
  public nest<T extends GenericGroupBuilder>(
    builder: T
  ): GroupBuilder<C, K, X & Record<NameOf<T>, T>, A>;
  public nest<N extends string, T extends GenericGroupBuilder>(
    builderOrName: N | T,
    builder?: T
  ): GroupBuilder<C, K, X & Record<N, T>, A> {
    if (typeof builderOrName === 'string' && builder) {
      this.addChild(builderOrName, builder);
    } else {
      const namedBuilder = builderOrName as GenericGroupBuilder;

      this.addChild(namedBuilder.name!, namedBuilder);
    }

    return this as any;
  }

  public ctor(ctor: Constructor<string, A, C>): this {
    this._ctor = ctor;

    return this;
  }

  /**
   * build a client with this builder as the root
   * @param fetch an override for the fetch instance used by the resulting client
   */
  public build(fetch: typeof _fetch = _fetch): BuiltClient<A, X> {
    if (this._ctor) {
      return (...args: A) => {
        const transient = this.extend('group_ctor');

        this.wrappedConstructor(transient as any)(...args);

        return this.buildChildren(fetch, transient as any);
      };
    }

    return this.buildChildren(fetch);
  }

  public extend(name: string): this {
    return this.evolve(this.newInstance(name) as any);
  }

  /**
   * wrap the constructor with context update handlers
   * @param self an override for the builder to accept new transformations
   */
  protected wrappedConstructor(self = this): (...args: A) => void {
    return (...args) => {
      const context = (this._ctor as Lambda<A, any>)(...args);

      if (typeof context === 'function') {
        context(self);
      } else {
        self._context.update(context);
      }
    };
  }

  /**
   * build the child clients of this builder
   * @param fetch an override for the fetch instance used by the resulting client
   * @param mixin a builder to inherit from before building the child clients
   */
  protected buildChildren(
    fetch: typeof _fetch,
    mixin?: this
  ): Record<keyof X, any> {
    return fromEntries<keyof X, any>(
      Object.entries(this._children).map(
        ([key, value]) =>
          [key, (mixin ? value.inherit(mixin) : value).build(fetch)] as [
            keyof X,
            any
          ]
      )
    );
  }

  protected newInstance(name: string): GroupBuilder<any, string, any> {
    return new GroupBuilder(`${this.name}::${name}`);
  }

  protected evolve(builder: this): this {
    super.evolve(builder);
    builder._ctor = this._ctor;
    builder._children = Object.keys(this._children).reduce(
      (acc, key) => ({
        ...acc,
        [key]: this._children[key].replaceParent(this as any, builder as any),
      }),
      {} as any
    );

    return builder;
  }

  /**
   * nest a child builder under this builder with a given name
   * @param name the name of the property on the constructed client
   * @param builder a builder to nest as a child of this builder, it must extend GroupBuilder
   */
  private addChild<T extends GenericGroupBuilder>(
    name: string,
    builder: T
  ): void {
    if (name in this._children) {
      throw new Error(
        `all children must have unique names, duplicate "${name}" not added`
      );
    }

    if (!(builder instanceof GroupBuilder)) {
      throw new Error('expected builder to be an instance of GroupBuilder');
    }

    const flattened = builder.flatten().inherit(this);

    this._children = { ...this._children, [name]: flattened };
  }
}
