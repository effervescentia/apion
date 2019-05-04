import _fetch from 'cross-fetch';

import RequestBuilder, {
  Instance as RequestBuilderInstance,
} from '@/builders/request';
import { Phase, Response } from '@/types';
import { compose } from '@/utils';
import ConfigBuilder from './config';
import GroupBuilder, { ActionConstructor, BuiltClient } from './group';

export default class ActionBuilder<
  C extends object,
  K extends string,
  X extends Record<string, GroupBuilder<any, string, any>>,
  A extends any[] = never
> extends GroupBuilder<C, K, X, A> {
  constructor(
    name?: K,
    _ctor?: ActionConstructor<K, A, any>,
    _parents: Array<ConfigBuilder<any, string>> = []
  ) {
    super(name, _ctor as any, _parents);
  }

  public build(fetch: typeof _fetch = _fetch): BuiltClient<A, X> {
    const children = this.buildChildren(fetch);

    if (this._ctor) {
      if (this._ctor instanceof RequestBuilder) {
        return Object.assign(
          (
            handlerOrValue:
              | ((
                  builder: RequestBuilderInstance<any>
                ) => RequestBuilderInstance<any> | object)
              | object
          ) => {
            const transient = this.clone('action_ctor::request_builder');

            if (typeof handlerOrValue === 'function') {
              const handler = handlerOrValue as (
                instance: RequestBuilderInstance<any>
              ) => object | RequestBuilderInstance<any>;
              const BuilderClazz = (this._ctor as RequestBuilder<any>).build();
              const builderInstance = new BuilderClazz();
              const body = handler(builderInstance);

              transient.body(
                body instanceof RequestBuilderInstance ? body.build() : body
              );
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

  protected newInstance(name: string): ActionBuilder<any, string, any> {
    return new ActionBuilder(`${this.name}::${name}`);
  }

  private async send(
    fetch: typeof _fetch,
    builder: ActionBuilder<C, string, X, A> = this
  ): Promise<Response> {
    const context = builder.resolveContext();
    const {
      url,
      headers,
      method,
      body,
      middleware = [],
    } = builder.resolveRequest(context);

    const formatters = middleware
      .filter(([phase]) => phase === Phase.FORMAT)
      .map(([, formatter]) => formatter);
    const parsers = middleware
      .filter(([phase]) => phase === Phase.PARSE)
      .map(([, parser]) => parser);

    const res = await fetch(url, {
      body: formatters.length ? compose(...formatters)(body) : body,
      headers,
      method,
    });

    let headersObj = {};
    // tslint:disable-next-line:no-expression-statement
    res.headers.forEach(
      (value, key) => (headersObj = { ...headersObj, [key]: value })
    );

    const bodyText = await res.text();

    return {
      body:
        bodyText && parsers.length ? compose(...parsers)(bodyText) : bodyText,
      headers: headersObj,
      ok: res.ok,
      status: res.status,
    };
  }
}
