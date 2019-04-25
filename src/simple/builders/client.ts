// tslint:disable:variable-name
import _fetch from 'cross-fetch';
import { compose } from 'ramda';

import { ClientType, Named, Phase, Transformer } from '../types';
import { fromEntries } from '../utils';
import ConfigBuilder from './config';
import RequestBuilder, { RequestBuilderInstance } from './request';

export type ContextualHandler<C, T, R = T> = ((prev: T, ctx: C) => R) | R;

export type Constructor<K extends string, T extends any[], R extends object> =
  | ((...args: T) => R)
  | ((...args: T) => <S extends Record<string, any>>(builder: ClientBuilder<R, K, {}>) => ClientBuilder<R, K, S>);

export interface ClientMiddleware {
  formatters: Transformer<any, any>[];
  parsers: Transformer<any, any>[];
}

export default class ClientBuilder<
  C extends object,
  K extends string,
  X extends Record<string, ClientBuilder<any, string, any>>,
  A extends any[] = never
> extends ConfigBuilder<C> implements Named<K> {
  private _children: X = {} as X;

  private get wrappedConstructor() {
    return (...args: A) => {
      const context = (this.ctor as (...args: A) => any)(...args);

      if (typeof context === 'function') {
        context(this);
      } else {
        this._ctx.update(context);
      }
    };
  }

  constructor(type: ClientType, public name?: K, public ctor?: Constructor<K, A, any> | RequestBuilder<any>) {
    super(type);
  }

  use(builder: ConfigBuilder<any>) {
    super.use(builder);

    Object.values(this._children).forEach((child) => child.use(builder));

    return this;
  }

  nest<D extends object, L extends string, Y extends Record<string, ClientBuilder<any, string, any>>>(
    name: L,
    builder: ClientBuilder<D, string, Y>
  ): ClientBuilder<C, K, X & Record<L, ClientBuilder<D, string, Y>>>;
  nest<D extends object, L extends string, Y extends Record<string, ClientBuilder<any, string, any>>>(
    builder: ClientBuilder<D, L, Y>
  ): ClientBuilder<C, K, X & Record<L, ClientBuilder<D, string, Y>>>;
  nest<D extends object, L extends string, Y extends Record<string, ClientBuilder<any, string, any>>>(
    builderOrName: L | ClientBuilder<D, L, Y>,
    builder?: ClientBuilder<D, string, Y>
  ) {
    if (typeof builderOrName === 'string' && builder) {
      builder.use(this);
      this._children = { ...this._children, [builderOrName]: builder };
    } else {
      const namedBuilder = builderOrName as ClientBuilder<D, L, Y>;

      namedBuilder.use(this);
      this._children = { ...this._children, [namedBuilder.name!]: namedBuilder };
    }

    return this;
  }

  build(fetch: typeof _fetch = _fetch) {
    const children: Record<keyof X, any> = fromEntries<keyof X, any>(
      Object.entries(this._children).map(([key, value]) => [key, value.build(fetch)])
    );

    let client = null;

    switch (this.type) {
      case ClientType.ACTION:
        if (this.ctor) {
          if (this.ctor instanceof RequestBuilder) {
            client = Object.assign(
              (
                handlerOrValue:
                  | ((builder: RequestBuilderInstance<any>) => RequestBuilderInstance<any> | object)
                  | object
              ) => {
                if (typeof handlerOrValue === 'function') {
                  const BuilderClazz = (this.ctor as RequestBuilder<any>).build();
                  const builderInstance = new BuilderClazz();
                  const body = handlerOrValue(builderInstance);

                  this.body(body instanceof RequestBuilderInstance ? body.build() : body);
                } else {
                  this.body(handlerOrValue);
                }

                const { url, headers, method, body, middleware } = this._request.resolve();

                const formatters = middleware
                  .filter(([phase]) => phase === Phase.FORMAT)
                  .map(([_, formatter]) => formatter);

                return fetch(url, { headers, method, body: (compose as any)(...formatters)(body) });
              },
              children
            );
          } else {
            client = Object.assign((...args: A) => {
              this.wrappedConstructor(...args);

              const { url, headers, method, body, middleware } = this._request.resolve();

              const formatters = middleware
                .filter(([phase]) => phase === Phase.FORMAT)
                .map(([_, formatter]) => formatter);

              return fetch(url, { headers, method, body: (compose as any)(...formatters)(body) });
            }, children);
          }
        } else {
          client = Object.assign(() => {
            const { url, headers, method, body, middleware } = this._request.resolve();

            const formatters = middleware
              .filter(([phase]) => phase === Phase.FORMAT)
              .map(([_, formatter]) => formatter);

            return fetch(url, { headers, method, body: (compose as any)(...formatters)(body) });
          }, children);
        }
        break;
      case ClientType.GROUP:
        if (this.ctor) {
          client = (...args: A) => {
            this.wrappedConstructor(...args);

            return children;
          };
        } else {
          client = children;
        }
        break;
      case ClientType.CONFIG:
        throw new Error('cannot call build() on configuration builders');
    }

    return client;
  }
}
