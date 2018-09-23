import Headers from './headers';
import Transformer from './transformer';
import { Header, Method, Mode, Phase, PhasicMiddleware, Referrer, ReferrerPolicy, Request, Response } from './types';
import Validator from './validator';

export default class Context<Ctx extends object> {
  middleware: PhasicMiddleware<Ctx>[] = [];

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

  headers(headers: Header.Dict | Transformer<Headers, Ctx>) {
    return Context.transform<Ctx, this, 'headers'>(
      this,
      'headers',
      (originalHeaders, ctx: Ctx) =>
        typeof headers === 'object' ? originalHeaders.set(headers) : headers(originalHeaders, ctx)
    );
  }

  method(method: Method) {
    return Context.transform<Ctx, this, 'method'>(this, 'method', method);
  }

  mode(mode: Mode) {
    return Context.transform<Ctx, this, 'mode'>(this, 'mode', mode);
  }

  referrer(referrer: Referrer | string) {
    return Context.transform<Ctx, this, 'referrer'>(this, 'referrer', referrer);
  }

  referrerPolicy(referrerPolicy: ReferrerPolicy) {
    return Context.transform<Ctx, this, 'referrerPolicy'>(this, 'referrerPolicy', referrerPolicy);
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

  static transform<C extends object, T extends Context<C>, K extends keyof Request>(
    context: T,
    key: K,
    middleware: Transformer<Request[K], C>
  ): T;
  static transform<C extends object, T extends Context<C>, K extends keyof Request>(
    context: T,
    key: K,
    value: string
  ): T;
  static transform<C extends object, T extends Context<C>, K extends keyof Request>(
    context: T,
    key: K,
    middlewareOrValue: any
  ): T {
    return context.use((req, ctx) => ({
      ...req,
      [key]: typeof middlewareOrValue === 'function' ? middlewareOrValue(req[key], ctx) : middlewareOrValue,
    }));
  }
}
