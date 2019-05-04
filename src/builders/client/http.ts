// tslint:disable:variable-name no-expression-statement
import { Method } from '@/constants';
import Context from '@/context';
import RequestContext from '@/context/request';
import { ContextualUpdate, Merger, Phase, Transformer } from '@/types';

export default class HTTPBuilder<C extends object> {
  // tslint:disable-next-line:readonly-keyword
  protected _context: Context<C> = new Context();
  // tslint:disable-next-line:readonly-keyword
  protected _request: RequestContext = new RequestContext();

  public url(url: ContextualUpdate<C, string>): this {
    this._request.url(this.resolver(url));

    return this;
  }

  public port(port: ContextualUpdate<C, number>): this {
    this._request.port(this.resolver(port));

    return this;
  }

  public query(query: ContextualUpdate<C, string>): this {
    this._request.query(this.resolver(query));

    return this;
  }

  public path(path: ContextualUpdate<C, string>): this {
    this._request.path(this.resolver(path));

    return this;
  }

  public method(method: Method): this {
    this._request.method(method);

    return this;
  }
  public get(): this {
    return this.method(Method.GET);
  }
  public post(): this {
    return this.method(Method.POST);
  }
  public patch(): this {
    return this.method(Method.PATCH);
  }
  public put(): this {
    return this.method(Method.PUT);
  }
  public delete(): this {
    return this.method(Method.DELETE);
  }

  public headers(headers: ContextualUpdate<C, Record<string, string>>): this {
    this._request.headers(
      this.resolver(headers, (prev, next) => ({ ...prev, ...next }))
    );

    return this;
  }

  public body<T>(body: ContextualUpdate<C, unknown, T>): this {
    this._request.body(this.resolver(body));

    return this;
  }

  public parser<T, R>(parser: Transformer<T, R>): this {
    this._request.middleware(Phase.PARSE, parser);

    return this;
  }

  public formatter<T, R>(formatter: Transformer<T, R>): this {
    this._request.middleware(Phase.FORMAT, formatter);

    return this;
  }

  private resolver<T>(
    handler: ContextualUpdate<C, T>,
    merge?: Merger<T>
  ): (prev?: T, ctx?: any) => T {
    return (prev?: T, ctx?: any) =>
      typeof handler === 'function'
        ? (handler as (prev: T, ctx: C) => any)(prev!, ctx)
        : merge
        ? merge(prev!, handler)
        : handler;
  }
}
