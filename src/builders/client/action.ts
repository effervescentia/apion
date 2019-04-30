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
  private _transient: this | null = null;

  build(fetch: typeof _fetch = _fetch) {
    const children = this.buildChildren(fetch);

    if (this.ctor) {
      this.addTransient();

      if (this.ctor instanceof RequestBuilder) {
        return Object.assign(
          (
            handlerOrValue: ((builder: RequestBuilderInstance<any>) => RequestBuilderInstance<any> | object) | object
          ) => {
            if (typeof handlerOrValue === 'function') {
              const BuilderClazz = (this.ctor as RequestBuilder<any>).build();
              const builderInstance = new BuilderClazz();
              const body = handlerOrValue(builderInstance);

              this._transient!.body(body instanceof RequestBuilderInstance ? body.build() : body);
            } else {
              this._transient!.body(handlerOrValue);
            }

            return this.send(fetch);
          },
          children
        );
      }

      return Object.assign((...args: A) => {
        this.wrappedConstructor(this._transient! as any)(...args);

        return this.send(fetch);
      }, children);
    }

    return Object.assign(() => this.send(fetch), children);
  }

  private addTransient() {
    this._transient = new ActionBuilder(`${this.name}::transient`).use(this) as any;
  }

  private async send(fetch: typeof _fetch) {
    const builder: ActionBuilder<C, string, X, A> = this._transient ? this._transient : this;
    const { url, headers, method, body, middleware = [] } = builder._request.resolve(builder._ctx.resolve());

    if (this._transient) {
      this.addTransient();
    }

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
