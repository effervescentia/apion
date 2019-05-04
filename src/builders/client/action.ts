// tslint:disable:variable-name
import _fetch from 'cross-fetch';

import RequestBuilder, { RequestBuilderInstance } from '@/builders/request';
import { Phase } from '@/types';
import { compose } from '@/utils';
import ConfigBuilder from './config';
import GroupBuilder, { ActionConstructor } from './group';

export default class ActionBuilder<
  C extends object,
  K extends string,
  X extends Record<string, GroupBuilder<any, string, any>>,
  A extends any[] = never
> extends GroupBuilder<C, K, X, A> {
  constructor(name?: K, _ctor?: ActionConstructor<K, A, any>, _parents: ConfigBuilder<any, string>[] = []) {
    super(name, _ctor as any, _parents);
  }

  build(fetch: typeof _fetch = _fetch) {
    const children = this.buildChildren(fetch);

    if (this._ctor) {
      if (this._ctor instanceof RequestBuilder) {
        return Object.assign(
          (
            handlerOrValue: ((builder: RequestBuilderInstance<any>) => RequestBuilderInstance<any> | object) | object
          ) => {
            const transient = this.clone('action_ctor::request_builder');

            if (typeof handlerOrValue === 'function') {
              const BuilderClazz = (this._ctor as RequestBuilder<any>).build();
              const builderInstance = new BuilderClazz();
              const body = handlerOrValue(builderInstance);

              transient.body(body instanceof RequestBuilderInstance ? body.build() : body);
            } else {
              transient.body(handlerOrValue);
            }

            return this.send(fetch, transient as any);
          },
          children
        );
      }

      return Object.assign((...args: A) => {
        const transient = this.clone('action_ctor');

        this.wrappedConstructor(transient as any)(...args);

        return this.send(fetch, transient as any);
      }, children);
    }

    return Object.assign(() => this.send(fetch), children);
  }

  protected newInstance(name: string) {
    return new ActionBuilder(`${this.name}::${name}`);
  }

  private async send(fetch: typeof _fetch, builder: ActionBuilder<C, string, X, A> = this) {
    debugger;
    const context = builder.resolveContext();
    const { url, headers, method, body, middleware = [] } = builder.resolveRequest(context);

    const formatters = middleware.filter(([phase]) => phase === Phase.FORMAT).map(([_, formatter]) => formatter);
    const parsers = middleware.filter(([phase]) => phase === Phase.PARSE).map(([_, parser]) => parser);

    const res = await fetch(url, {
      headers,
      method,
      body: formatters.length ? compose(...formatters)(body) : body,
    });

    let headersObj = {};
    res.headers.forEach((value, key) => (headersObj = { ...headersObj, [key]: value }));

    const bodyText = await res.text();

    return {
      headers: headersObj,
      status: res.status,
      body: bodyText && parsers.length ? compose(...parsers)(bodyText) : bodyText,
      ok: res.ok,
    };
  }
}
