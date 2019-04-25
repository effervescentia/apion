// tslint:disable:variable-name
import { Method } from '../../constants';
import Context from '../../context';
import RequestContext from '../../context/request';
import { Named, Phase, Transformer } from '../../types';

export type ContextualHandler<C, T, R = T> = ((prev: T, ctx: C) => R) | R;

export type ContextualBuilder<C extends object> = ((ctx: C) => ConfigBuilder<any, string>) | ConfigBuilder<any, string>;

export function wrapDynamicTransform<C>(
  builder: ((ctx: C) => ConfigBuilder<any, string>) | ConfigBuilder<any, string>,
  extract: (builer: ConfigBuilder<any, string>) => Context<any>
) {
  return builder instanceof ConfigBuilder
    ? extract(builder)
    : (prev: any, ctx: C) => extract(builder(ctx)).resolve(ctx, prev);
}

export default class ConfigBuilder<C extends object, K extends string> implements Named<K> {
  protected _ctx: Context<C> = new Context();
  protected _request: RequestContext = new RequestContext();

  constructor(public name?: K) {}

  url(url: ContextualHandler<C, string>) {
    this._request.url(this.resolver(url));

    return this;
  }

  port(port: ContextualHandler<C, number>) {
    this._request.port(this.resolver(port));

    return this;
  }

  query(query: ContextualHandler<C, string>) {
    this._request.query(this.resolver(query));

    return this;
  }

  path(path: ContextualHandler<C, string>) {
    this._request.path(this.resolver(path));

    return this;
  }

  method(method: Method) {
    this._request.method(method);

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

  headers(headers: ContextualHandler<C, Record<string, string>>) {
    this._request.headers(this.resolver(headers, (prev, next) => ({ ...prev, ...next })));

    return this;
  }

  body<T>(body: ContextualHandler<C, unknown, T>) {
    this._request.body(this.resolver(body));

    return this;
  }

  parser<T, R>(parser: Transformer<T, R>) {
    this._request.middleware(Phase.PARSE, parser);

    return this;
  }

  formatter<T, R>(formatter: Transformer<T, R>) {
    this._request.middleware(Phase.FORMAT, formatter);

    return this;
  }

  // local(builder: ConfigBuilder<any, any>) {
  //   return this;
  // }

  use(contextualBuilder: ContextualBuilder<C>) {
    if (typeof contextualBuilder !== 'function') {
      // context cannot be built up using this pattern
      this._ctx.inherit(contextualBuilder._ctx);
    }
    this._request.inherit(wrapDynamicTransform<C>(contextualBuilder, (builder) => builder._request));

    return this;
  }

  private resolver<T>(handler: ContextualHandler<C, T>, merge?: (prev: T, next: T) => T) {
    return (prev?: T) =>
      typeof handler === 'function'
        ? (handler as (prev: T, ctx: C) => any)(prev!, this._ctx.resolve())
        : merge
          ? merge(prev!, handler)
          : handler;
  }
}
