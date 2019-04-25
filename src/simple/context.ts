// tslint:disable:variable-name
import { compose } from 'ramda';
import * as URL from 'url';

import { Method, Phase, Request, Transformer } from './types';

export type Updater<T> = Transformer<T | undefined, T> | T;

export default class Context<T extends object> {
  constructor(private _trfms: ((prev: Partial<T>) => Partial<T>)[] = [], public parent?: Context<any>) {}

  set<K extends keyof T>(name: K, value: ((value?: T[K]) => T[K]) | T[K]) {
    this._trfms = [
      ...this._trfms,
      (prev) => ({
        ...prev,
        [name]: typeof value === 'function' ? (value as (value?: T[K]) => T[K])(prev[name]) : value,
      }),
    ];

    return this;
  }

  update(value: ((prev: Partial<T>) => Partial<T>) | Partial<T>) {
    this._trfms = [...this._trfms, (prev) => (typeof value === 'function' ? value(prev) : { ...prev, ...value })];

    return this;
  }

  inherit<P extends object>(ctx: Context<P>, hoist = false): Context<P & T> {
    if (this.parent) {
      if (hoist) {
        this.parent.inherit(ctx, true);
      } else {
        this.parent = ctx.clone();
      }
    } else {
      this.parent = ctx.clone();
    }

    return this as any;
  }

  resolve(): T {
    const initialValue = this.parent ? this.parent.resolve() : {};

    return this._trfms.length ? (compose as any)(...this._trfms)(initialValue) : initialValue;
  }

  clone(): Context<T> {
    return new Context(this._trfms, this.parent && this.parent.clone());
  }
}

export class RequestContext extends Context<Request> {
  headers(headers: Updater<Record<string, string>>) {
    return this.set('headers', (prev) => (typeof headers === 'function' ? headers(prev!) : { ...prev, ...headers }));
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

  middleware(phase: Phase, middleware: Transformer<any, any>) {
    return this.set('middleware', (prev) => [...(prev || []), [phase, middleware] as [Phase, Transformer<any, any>]]);
  }
}
