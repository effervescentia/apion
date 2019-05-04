// tslint:disable:variable-name
import _fetch from 'cross-fetch';
import { compose } from 'ramda';

import { Phase } from '../../types';
import RequestBuilder, { RequestBuilderInstance } from '../request';
import GroupBuilder from './group';

export default class ActionBuilder<
  C extends object,
  K extends string,
  X extends Record<string, GroupBuilder<any, string, any>>,
  A extends any[] = never
> extends GroupBuilder<C, K, X, A> {
  build(fetch: typeof _fetch = _fetch) {
    const children = this.buildChildren(fetch);

    if (this.ctor) {
      if (this.ctor instanceof RequestBuilder) {
        return Object.assign(
          (
            handlerOrValue: ((builder: RequestBuilderInstance<any>) => RequestBuilderInstance<any> | object) | object
          ) => {
            if (typeof handlerOrValue === 'function') {
              const BuilderClazz = (this.ctor as RequestBuilder<any>).build();
              const builderInstance = new BuilderClazz();
              const body = handlerOrValue(builderInstance);

              this.body(body instanceof RequestBuilderInstance ? body.build() : body);
            } else {
              this.body(handlerOrValue);
            }

            return this.send(fetch);
          },
          children
        );
      }

      return Object.assign((...args: A) => {
        this.wrappedConstructor(...args);

        return this.send(fetch);
      }, children);
    }

    return Object.assign(() => this.send(fetch), children);
  }

  protected shallowClone<T extends this>(): T {
    console.log('cloning action', this);
    return new ActionBuilder(this.name, this.ctor) as any;
  }

  private async send(fetch: typeof _fetch) {
    const { url, headers, method, body, middleware = [] } = this._request.resolve(this._ctx.resolve());

    const formatters = middleware.filter(([phase]) => phase === Phase.FORMAT).map(([_, formatter]) => formatter);
    const parsers = middleware.filter(([phase]) => phase === Phase.PARSE).map(([_, parser]) => parser);

    const res = await fetch(url, {
      headers,
      method,
      body: formatters.length ? (compose as any)(...formatters)(body) : body,
    });

    let headersObj = {};
    res.headers.forEach((value, key) => (headersObj = { ...headersObj, [key]: value }));

    const bodyText = await res.text();

    return {
      headers: headersObj,
      status: res.status,
      body: bodyText && parsers.length ? (compose as any)(...parsers)(bodyText) : bodyText,
      ok: res.ok,
    };
  }
}
