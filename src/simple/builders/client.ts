// tslint:disable:variable-name
import Context, { RequestContext } from '../context';
import { ClientType, Method, Named, Request, Transformer } from '../types';
import RequestBuilder from './request';

export type ContextualHandler<C, T, R = T> = ((prev: T, ctx: C) => R) | R;

export interface ClientMiddleware {
  formatters: Transformer<any, any>[];
  parsers: Transformer<any, any>[];
}

export default class ClientBuilder<
  C extends object,
  K extends string,
  X extends Record<string, ClientBuilder<any, string, any>>,
  A extends any[] = never
> implements Named<K> {
  private _ctx: Context<C> = new Context();
  private _request: RequestContext = new RequestContext();
  private _middleware: ClientMiddleware = { formatters: [], parsers: [] };
  private _children: X = {} as X;

  constructor(public type: ClientType, public name?: K, public ctor?: ((...args: A) => any) | RequestBuilder<any>) {}

  url(_url: ContextualHandler<C, string>) {
    const url = this.resolveHandler('url', _url);
    if (typeof url === 'string' && url.length !== 0) {
      if (url[0] === '/') {
      } else {
      }
    }

    return this;
  }

  method(_method: ContextualHandler<C, Method>) {
    this._request.method(this.resolveHandler('method', _method));

    return this;
  }
  get() {
    return this.method(Method.GET);
  }
  post() {
    return this.method(Method.POST);
  }
  patch() {
    return this.method(Method.PATCH);
  }
  put() {
    return this.method(Method.PUT);
  }
  delete() {
    return this.method(Method.DELETE);
  }

  headers(_headers: ContextualHandler<C, Record<string, string>>) {
    this._request.headers(this.resolveHandler('headers', _headers));

    return this;
  }

  request<T>(_body: ContextualHandler<C, unknown, T>) {
    this._request.body(this.resolveHandler('body', _body));

    return this;
  }

  parser<T, R>(parser: Transformer<T, R>) {
    this._middleware.parsers.push(parser);

    return this;
  }

  formatter<T, R>(formatter: Transformer<T, R>) {
    this._middleware.formatters.push(formatter);

    return this;
  }

  // local(builder: ClientBuilder<any, any>) {
  //   return this;
  // }

  inherit(builder: ClientBuilder<any, any, any>) {
    this._ctx.inherit(builder._ctx);
    this._request.inherit(builder._request);

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
      builder.inherit(this);
      this._children = { ...this._children, [builderOrName]: builder };
    } else {
      const namedBuilder = builderOrName as ClientBuilder<D, L, Y>;

      namedBuilder.inherit(this);
      this._children = { ...this._children, [namedBuilder.name!]: namedBuilder };
    }

    return this;
  }

  build() {
    const children = Object.entries(this._children).reduce(
      (acc, [key, value]) => ({ ...acc, [key]: value.build() }),
      {}
    );

    let client = null;

    switch (this.type) {
      case ClientType.ACTION:
        if (this.ctor) {
          if (this.ctor instanceof RequestBuilder) {
          } else {
            client = (...args: A) => ((this.ctor as (...args: A) => any)(...args), children);
          }
        }
        break;
      case ClientType.GROUP:
        if (this.ctor) {
          client = (...args: A) => ((this.ctor as (...args: A) => any)(...args), children);
        }
        break;
      case ClientType.CONFIG:
    }
    // const client =
    //   this.type === ClientType.GROUP && this.ctor && !(this.ctor instanceof RequestBuilder)
    //     ? (...args: any[]) => (this.ctor!(...args), children)
    //     : Object.assign(this.ctor || {}, this._children);

    return client;
  }

  private resolveHandler<T>(name: keyof Request, handler: ContextualHandler<C, T>) {
    if (typeof handler === 'function') {
      return (handler as (prev: T, ctx: C) => T)(this._request.resolve()[name], this._ctx.resolve());
    }

    return handler;
  }
}
