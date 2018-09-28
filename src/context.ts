import Headers from './headers';
import Transformer from './transformer';
import { Header, Method, Mode, Phase, PhasicMiddleware, Referrer, ReferrerPolicy, Request, Response } from './types';
import URI from './uri';
import Validator from './validator';

class Context<Ctx extends object> {
  middleware: PhasicMiddleware<Ctx>[] = [];
  uriTransform: URI.Transformer | null = null;

  use(middleware: Transformer<Request, Ctx>): this;
  use(phase: Phase.REQUEST, middleware: Transformer<Request, Ctx>): this;
  use(phase: Phase.VALIDATE, middleware: Validator<Request, Ctx>): this;
  use(phase: Phase.FORMAT | Phase.PARSE, middleware: Transformer<any, Ctx>): this;
  use(phase: Phase.EVALUATE, middleware: Validator<Response, Ctx>): this;
  use(phase: Phase.RESPONSE, middleware: Transformer<Response, Ctx>): this;
  use(phaseOrMiddleware: any, middleware?: any) {
    this.middleware.push(
      typeof phaseOrMiddleware === 'function' ? [Phase.REQUEST, phaseOrMiddleware] : [phaseOrMiddleware, middleware]
    );

    return this;
  }

  validation(validator: Validator<Request, Ctx>) {
    return this.use(Phase.VALIDATE, validator);
  }

  formatter(middleware: Transformer<any, Ctx>) {
    return this.use(Phase.FORMAT, middleware);
  }

  parser(middleware: Transformer<any, Ctx>) {
    return this.use(Phase.PARSE, middleware);
  }

  evaluation(validator: Validator<Response, Ctx>) {
    return this.use(Phase.EVALUATE, validator);
  }

  handle(middleware: Transformer<Response, Ctx>) {
    return this.use(Phase.RESPONSE, middleware);
  }

  configure(configurator: (context: this) => void) {
    configurator(this);

    return this;
  }

  uri(uri: string): this;
  uri(transformer: URI.Transformer): this;
  uri(uriOrTransformer: any) {
    this.uriTransform = typeof uriOrTransformer === 'string' ? URI.set(uriOrTransformer) : uriOrTransformer;

    return this;
  }

  path(path: string) {
    this.uriTransform = URI.append(path);

    return this;
  }

  headers(headers: Header.Dict | Transformer<Headers, Ctx>) {
    return this.transform(
      'headers',
      (originalHeaders, ctx: Ctx) =>
        typeof headers === 'object' ? originalHeaders.set(headers) : headers(originalHeaders, ctx)
    );
  }

  method(method: Method) {
    return this.transform('method', method);
  }

  mode(mode: Mode) {
    return this.transform('mode', mode);
  }

  referrer(referrer: Referrer | string) {
    return this.transform('referrer', referrer);
  }

  referrerPolicy(referrerPolicy: ReferrerPolicy) {
    return this.transform('referrerPolicy', referrerPolicy);
  }

  body(body: string | object | ((ctx: Ctx) => string | object)) {
    return this.transform('body', typeof body === 'function' ? (_: Request, ctx: Ctx) => body(ctx) : body);
  }

  get() {
    return this.method(Method.GET);
  }

  post() {
    return this.method(Method.POST);
  }

  put() {
    return this.method(Method.PUT);
  }

  patch() {
    return this.method(Method.PATCH);
  }

  head() {
    return this.method(Method.HEAD);
  }

  trace() {
    return this.method(Method.TRACE);
  }

  options() {
    return this.method(Method.OPTIONS);
  }

  json() {
    return this.use(({ body, headers, ...req }) => ({
      ...req,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: headers.add(Header.CONTENT_TYPE, 'application/json'),
    }));
  }

  transform<K extends keyof Request>(key: K, middleware: Transformer<Request[K], Ctx>): this;
  transform<K extends keyof Request>(key: K, value: Request[K]): this;
  transform<K extends keyof Request>(key: K, middlewareOrValue: any) {
    return this.use((req, ctx) => ({
      ...req,
      [key]: typeof middlewareOrValue === 'function' ? middlewareOrValue(req[key], ctx) : middlewareOrValue,
    }));
  }
}

namespace Context {
  export class Inheritable<Ctx extends object, Children extends Record<string, Inheritable<Ctx>> = {}> extends Context<
    Ctx
  > {
    all = new Context<Ctx>();
    children: Children = {} as Children;

    constructor(public parent?: Inheritable<any>) {
      super();
    }

    extend<C extends object>(builder: Inheritable<C>) {
      this.parent = builder;

      return this;
    }

    inherit<C extends Ctx>(builder: Inheritable<C>) {
      builder.extend(this);

      return this;
    }

    attach<K extends string, B extends Inheritable<any>>(
      name: K,
      builder: B
    ): Inheritable<Ctx, Children & Record<K, B>> {
      this.children[name] = builder as any;

      return this as any;
    }

    collapse(context: Context<Ctx> = new Context()): Context<Ctx> {
      context.middleware.unshift(...this.all.middleware);

      if (!this.parent) return context;

      return this.parent.collapse(context);
    }
  }
}

export default Context;
