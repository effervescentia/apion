import _fetch from 'cross-fetch';

import RequestBuilder, {
  Instance as RequestBuilderInstance,
} from '@/builders/request';
import { Phase, Request, Response } from '@/types';
import { compose } from '@/utils';
import ConfigBuilder from './config';
import GroupBuilder, {
  ActionConstructor,
  BuiltClient,
  GenericGroupBuilder,
} from './group';

export default class ActionBuilder<
  C extends object,
  K extends string,
  X extends Record<string, GenericGroupBuilder>,
  A extends any[] = never
> extends GroupBuilder<C, K, X, A> {
  private static async sendRequest(
    fetch: typeof _fetch,
    { url, headers, method, body, middleware = [] }: Request
  ): Promise<Response> {
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
        // tslint:disable-next-line:prefer-object-spread
        return Object.assign(this.wrappedRequestBuilder(fetch), children);
      }

      return Object.assign((...args: A) => {
        const transient: any = this.extend('action_ctor');

        this.wrappedConstructor(transient)(...args);

        return this.send(fetch, transient);
      }, children);
    }

    return Object.assign(() => this.send(fetch), children);
  }

  protected newInstance(name: string): ActionBuilder<any, string, any> {
    return new ActionBuilder(`${this.name}::${name}`);
  }

  /**
   * a callback for accepting a request builder callback or value and sending the resulting request
   */
  private wrappedRequestBuilder(
    fetch: typeof _fetch
  ): (
    handlerOrValue:
      | ((
          builder: RequestBuilderInstance<any>
        ) => RequestBuilderInstance<any> | object)
      | object
  ) => Promise<Response> {
    return handlerOrValue => {
      const transient = this.extend('action_ctor::request_builder');

      const body =
        typeof handlerOrValue === 'function'
          ? this.buildBody(handlerOrValue as any)
          : handlerOrValue;

      transient.body(body);

      return this.send(fetch, transient as any);
    };
  }

  /**
   * build the final request, send it and apply appropriate middleware
   * @param fetch an override for the fetch instance used by the resulting client
   * @param builder a builder to use to construct the final context and request objects
   */
  private send(
    fetch: typeof _fetch,
    builder: ActionBuilder<C, string, X, A> = this
  ): Promise<Response> {
    const context = builder.resolveContext();
    const request = builder.resolveRequest(context);

    return ActionBuilder.sendRequest(fetch, request);
  }

  /**
   * construct the request body from a request builder callback
   * @param handler a callback that should add properties using the request builder
   */
  private buildBody(
    handler: (
      builder: RequestBuilderInstance<any>
    ) => RequestBuilderInstance<any> | object
  ): any {
    const BuilderClazz = (this._ctor as RequestBuilder<any>).build();
    const builderInstance = new BuilderClazz();
    const body = handler(builderInstance);

    return body instanceof RequestBuilderInstance ? body.build() : body;
  }
}
