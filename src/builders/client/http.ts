// tslint:disable:variable-name
import { Method } from '@/constants';
import Context from '@/context';
import RequestContext from '@/context/request';
import { ContextualUpdate, Merger, Phase, Transformer } from '@/types';

export default class HTTPBuilder<C extends object> {
  protected _context: Context<C> = new Context();
  protected _request: RequestContext = new RequestContext();

  url(url: ContextualUpdate<C, string>) {
    this._request.url(this.resolver(url));

    return this;
  }

  port(port: ContextualUpdate<C, number>) {
    this._request.port(this.resolver(port));

    return this;
  }

  query(query: ContextualUpdate<C, string>) {
    this._request.query(this.resolver(query));

    return this;
  }

  path(path: ContextualUpdate<C, string>) {
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

  headers(headers: ContextualUpdate<C, Record<string, string>>) {
    this._request.headers(this.resolver(headers, (prev, next) => ({ ...prev, ...next })));

    return this;
  }

  body<T>(body: ContextualUpdate<C, unknown, T>) {
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

  private resolver<T>(handler: ContextualUpdate<C, T>, merge?: Merger<T>) {
    return (prev?: T, ctx?: any) =>
      typeof handler === 'function'
        ? (handler as (prev: T, ctx: C) => any)(prev!, ctx)
        : merge
          ? merge(prev!, handler)
          : handler;
  }
}
