// tslint:disable:variable-name
import * as URL from 'url';

import { Method } from '@/constants';
import { Phase, Request, Transformer } from '@/types';
import { fromEntries } from '@/utils';
import Context from '.';

export type Updater<T> = Transformer<T | undefined, T> | T;

export function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  return fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

export default class RequestContext extends Context<Request> {
  headers(headers: Updater<Record<string, string>>) {
    return this.set(
      'headers',
      (prev) =>
        typeof headers === 'function' ? normalizeHeaders(headers(prev!)) : { ...prev, ...normalizeHeaders(headers) }
    );
  }

  body(body: Updater<any>) {
    return this.set('body', body);
  }

  method(method: Updater<Method>) {
    return this.set('method', method);
  }

  url(url: Updater<string>) {
    return this.set('url', (prev) => {
      const { href } = URL.parse(typeof url === 'function' ? url(prev) : url);

      return href!;
    });
  }

  port(port: Updater<number>) {
    return this.set('url', (prev) => {
      const { port: prevPort, ...prevURL } = URL.parse(prev || '');

      return URL.format({ ...prevURL, port: typeof port === 'function' ? port(Number(prevPort!)) : port });
    });
  }

  query(query: Updater<string>): this;
  query(name: string, value: string): this;
  query(nameOrQuery: any, value?: string) {
    if (value) {
      return this.set('url', (prev) => {
        const { search: _, query, ...prevURL } = URL.parse(prev || '', true);

        return URL.format({ ...prevURL, query: { ...query, [nameOrQuery]: value } });
      });
    }

    return this.set('url', (prev) => {
      const { search, ...prevURL } = URL.parse(prev || '');

      return URL.format({ ...prevURL, search: typeof nameOrQuery === 'function' ? nameOrQuery(search!) : nameOrQuery });
    });
  }

  path(pathname: Updater<string>) {
    return this.set('url', (prev) => {
      const { pathname: prevPathname, ...prevURL } = URL.parse(prev || '');
      const pathnameString = typeof pathname === 'function' ? pathname(prevPathname) : pathname;
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
}
