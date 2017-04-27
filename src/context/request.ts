// tslint:disable:variable-name
import * as URL from 'url';

import { Method } from '@/constants';
import { Applicator, Phase, Request, Transformer } from '@/types';
import { fromEntries } from '@/utils';
import Context from '.';

export type Apply<T, C> = Applicator<T, C> | T;

export function normalizeHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return fromEntries(
    Object.entries(headers).map(
      ([key, value]) => [key.toLowerCase(), value] as [string, string]
    )
  );
}

export default class RequestContext extends Context<Request> {
  public headers(headers: Apply<Record<string, string>, any>): this {
    return this.set('headers', (prev, ctx) =>
      typeof headers === 'function'
        ? normalizeHeaders(headers(prev!, ctx))
        : { ...prev, ...normalizeHeaders(headers) }
    );
  }

  public body(body: Apply<any, any>): this {
    return this.set('body', body);
  }

  public method(method: Apply<Method, any>): this {
    return this.set('method', method);
  }

  public url(url: Apply<string, any>): this {
    return this.set('url', (prev, ctx) => {
      const { href } = URL.parse(
        typeof url === 'function' ? url(prev, ctx) : url
      );

      return href!;
    });
  }

  public port(port: Apply<number, any>): this {
    return this.set('url', (prev, ctx) => {
      const { host: _host, port: prevPort, ...prevURL } = URL.parse(prev || '');

      return URL.format({
        ...prevURL,
        port: typeof port === 'function' ? port(Number(prevPort!), ctx) : port,
      });
    });
  }

  public query(query: Apply<string, any>): this;
  public query(name: string, value: string): this;
  public query(nameOrQuery: any, value?: string): this {
    if (value) {
      return this.set('url', prev => {
        const { search: _, query, ...prevURL } = URL.parse(prev || '', true);

        return URL.format({
          ...prevURL,
          query: { ...query, [nameOrQuery]: value },
        });
      });
    }

    return this.set('url', (prev, ctx) => {
      const { search, ...prevURL } = URL.parse(prev || '');

      return URL.format({
        ...prevURL,
        search:
          typeof nameOrQuery === 'function'
            ? nameOrQuery(search!, ctx)
            : nameOrQuery,
      });
    });
  }

  public path(pathname: Apply<string, any>): this {
    return this.set('url', (prev, ctx) => {
      const { pathname: prevPathname, ...prevURL } = URL.parse(prev || '');
      const pathnameString =
        typeof pathname === 'function'
          ? pathname(prevPathname!, ctx)
          : pathname;
      const newPathname =
        pathnameString[0] === '/'
          ? pathnameString
          : prevPathname && prevPathname !== '/'
          ? `${prevPathname}/${pathnameString}`
          : `/${pathnameString}`;

      return URL.format({ ...prevURL, pathname: newPathname });
    });
  }

  public middleware(phase: Phase, middleware: Transformer<any>): this {
    return this.set('middleware', prev => [
      ...(prev || []),
      [phase, middleware] as [Phase, Transformer<any>],
    ]);
  }

  public clone(): RequestContext {
    return new RequestContext(this.transforms);
  }
}
