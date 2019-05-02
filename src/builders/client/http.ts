// tslint:disable:variable-name
import { Method } from '@/constants';
import Context from '@/context';
import RequestContext from '@/context/request';
import { Phase, Transformer } from '@/types';

export type ContextualHandler<C, T, R = T> = ((prev: T, ctx: C) => R) | R;

export default class HTTPBuilder<C extends object> {
  protected _context: Context<C> = new Context();
  protected _request: RequestContext = new RequestContext();

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

  private resolver<T>(handler: ContextualHandler<C, T>, merge?: (prev: T, next: T) => T) {
    return (prev?: T) =>
      typeof handler === 'function'
        ? (handler as (prev: T, ctx: C) => any)(prev!, this._context.resolve())
        : merge
          ? merge(prev!, handler)
          : handler;
  }
}
