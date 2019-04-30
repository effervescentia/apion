// tslint:disable:variable-name
import * as URL from 'url';

import { Method } from '@/constants';
import { Applicator, Phase, Request, Transformer } from '@/types';
import { fromEntries } from '@/utils';
import Context from '.';

export type Apply<T, C> = Applicator<T, C> | T;

export function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  return fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

export default class RequestContext extends Context<Request> {
  headers(headers: Apply<Record<string, string>, any>) {
    return this.set(
      'headers',
      (prev, ctx) =>
        typeof headers === 'function'
          ? normalizeHeaders(headers(prev!, ctx))
          : { ...prev, ...normalizeHeaders(headers) }
    );
  }

  body(body: Apply<any, any>) {
    return this.set('body', body);
  }

  method(method: Apply<Method, any>) {
    return this.set('method', method);
  }

  url(url: Apply<string, any>) {
    return this.set('url', (prev, ctx) => {
      const { href } = URL.parse(typeof url === 'function' ? url(prev, ctx) : url);

      return href!;
    });
  }

  port(port: Apply<number, any>) {
    return this.set('url', (prev, ctx) => {
      const { port: prevPort, ...prevURL } = URL.parse(prev || '');

      return URL.format({ ...prevURL, port: typeof port === 'function' ? port(Number(prevPort!), ctx) : port });
    });
  }

  query(query: Apply<string, any>): this;
  query(name: string, value: string): this;
  query(nameOrQuery: any, value?: string) {
    if (value) {
      return this.set('url', (prev) => {
        const { search: _, query, ...prevURL } = URL.parse(prev || '', true);

        return URL.format({ ...prevURL, query: { ...query, [nameOrQuery]: value } });
      });
    }

    return this.set('url', (prev, ctx) => {
      const { search, ...prevURL } = URL.parse(prev || '');

      return URL.format({
        ...prevURL,
        search: typeof nameOrQuery === 'function' ? nameOrQuery(search!, ctx) : nameOrQuery,
      });
    });
  }

  path(pathname: Apply<string, any>) {
    return this.set('url', (prev, ctx) => {
      const { pathname: prevPathname, ...prevURL } = URL.parse(prev || '');
      const pathnameString = typeof pathname === 'function' ? pathname(prevPathname!, ctx) : pathname;
      const newPathname =
        pathnameString[0] === '/'
          ? pathnameString
          : prevPathname && prevPathname !== '/'
            ? `${prevPathname}/${pathnameString}`
            : `/${pathnameString}`;

      return URL.format({ ...prevURL, pathname: newPathname });
    });
  }

  middleware(phase: Phase, middleware: Transformer<any>) {
    return this.set('middleware', (prev) => [...(prev || []), [phase, middleware] as [Phase, Transformer<any>]]);
  }

  clone() {
    return new RequestContext(this.transforms);
  }
}
