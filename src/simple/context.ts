// tslint:disable:variable-name
import { compose } from 'ramda';
import * as URL from 'url';
import { Method, Request } from './types';

export default class Context<T extends object> {
  public parent?: Context<any>;
  private _trfms: ((prev: Partial<T>) => Partial<T>)[] = [];

  set<K extends keyof T>(name: K, value: ((value?: T[K]) => T[K]) | T[K]) {
    this._trfms = [
      ...this._trfms,
      (prev) => (typeof value === 'function' ? (value as (value?: T[K]) => T[K])(prev[name]) : value),
    ];

    return this;
  }

  inherit<P extends object>(parent: Context<P>): Context<P & T> {
    this.parent = parent;

    return this as any;
  }

  resolve(): T {
    const initialValue = this.parent ? this.parent.resolve() : {};

    return (compose as any)(...this._trfms)(initialValue);
  }
}

export class RequestContext extends Context<Request> {
  headers(headers: Record<string, string>) {
    return this.set('headers', (prev) => ({ ...prev, ...headers }));
  }

  body(body: any) {
    return this.set('body', body);
  }

  method(method: Method) {
    return this.set('method', method);
  }

  url(url: string) {
    const { href } = URL.parse(url);

    return this.set('url', href!);
  }

  port(port: number) {
    return this.set('url', (prev) => URL.format({ ...URL.parse(prev!), port }));
  }

  query(query: string): this;
  query(name: string, value: string): this;
  query(nameOrQuery: string, value?: string) {
    if (value) {
      return this.set('url', (prev) => {
        const { search: _, query, ...prevURL } = URL.parse(prev!, true);

        return URL.format({ ...prevURL, query: { ...query, [nameOrQuery]: value } });
      });
    }

    return this.set('url', (prev) => {
      const { search, ...prevURL } = URL.parse(prev!);

      return URL.format({ ...prevURL, search: nameOrQuery });
    });
  }

  path(pathname: string) {
    return this.set('url', (prev) => {
      const { pathname: prevPathname, ...prevURL } = URL.parse(prev!);
      const newPathname =
        pathname[0] === '/' ? pathname : prevPathname ? `${prevPathname}/${pathname}` : `/${pathname}`;

      return URL.format({ ...prevURL, pathname: newPathname });
    });
  }
}
