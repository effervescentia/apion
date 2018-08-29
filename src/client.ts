enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  TRACE = 'TRACE',
  OPTIONS = 'OPTIONS',
}

enum Header {
  CONTENT_TYPE = 'content-type',
}

namespace Header {
  export interface Dict extends Record<Header | string, string> {}
}

interface Middleware<T, C extends object> {
  (value: T, context: C): T;
}

namespace Middleware {
  export type Handler<C extends object> =
    | [Phase.REQUEST, Middleware<Request, C>]
    | [Phase.RESPONSE, Middleware<Response, C>]
    | [Phase.VALIDATE, Validator<Request, C>]
    | [Phase.CONFIRM, Validator<Response, C>]
    | [Phase.FORMAT | Phase.PARSE, Middleware<any, C>];

  export function apply<T, C extends object>(
    initial: T,
    middleware: Middleware.Handler<C>[],
    targetPhase: Phase.REQUEST | Phase.RESPONSE,
    context: C
  ) {
    return middleware.reduce(
      (value, [phase, mware]) => (phase === targetPhase ? mware(value, context) : value),
      initial
    );
  }
}

interface Validator<T, C extends object> {
  (value: T, context: C): boolean | string;
}

namespace Validator {
  export const DEFAULT_ERROR = 'validator returned a falsey value';

  export function apply<T, C extends object>(
    value: T,
    middleware: Middleware.Handler<C>[],
    targetPhase: Phase.VALIDATE | Phase.CONFIRM,
    context: C
  ) {
    let valid: string | boolean = true;

    for (const [phase, validator] of middleware) {
      if (phase === targetPhase) {
        valid = validator(value, context);

        if (!valid || typeof valid === 'string') {
          break;
        }
      }
    }

    switch (true) {
      case !valid:
        return DEFAULT_ERROR;
      case typeof valid === 'string':
        return valid;
      default:
        return false;
    }
  }
}

interface Request {
  url: string;
  method: Method;
  headers: Headers;
  body: any;

  mode: Mode;
  referrer: Referrer | string;
  referrerPolicy: ReferrerPolicy;
}

interface Response {}

interface Constructor<P extends any[], C> {
  (...params: P): C;
}

interface Resolver {
  (request: {}): Promise<{}>;
}

enum Mode {
  CORS = 'cors',
  NO_CORS = 'no-cors',
  SAME_ORIGIN = 'same-origin',
}

enum Referrer {
  CLIENT = 'client',
  NONE = 'no-referrer',
}

enum ReferrerPolicy {
  CLIENT = 'client',
  NONE = 'no-referrer',
  NONE_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
  ORIGIN = 'origin',
  ORIGIN_WHEN_XORIGIN = 'origin-when-cross-origin',
  UNSAFE_URL = 'unsafe-url',
}

enum Phase {
  REQUEST = 'request',
  VALIDATE = 'validate',
  FORMAT = 'format',
  PARSE = 'parse',
  CONFIRM = 'confirm',
  RESPONSE = 'response',
}

class Headers {
  headers: Header.Dict;

  add(key: Header | string, value: string) {
    if (value != null) {
      this.headers[key.toLowerCase()] = value;
    }

    return this;
  }

  remove(key: Header | string) {
    this.headers[key.toLowerCase()] = null;

    return this;
  }

  set(key: Header | string, value: string);
  set(headers: Header.Dict, replace?: boolean);
  set(headersOrKey: any, replaceOrValue?: any) {
    return typeof headersOrKey === 'object'
      ? this.setMany(headersOrKey, replaceOrValue)
      : this.setOne(headersOrKey, replaceOrValue);
  }

  setOne(key: Header | string, value: string) {
    if (value != null) {
      this.headers[key.toLowerCase()] = value as string;
    }

    return this;
  }

  setMany(headers: Header.Dict, replace?: boolean) {
    if (replace) {
      this.headers = {};
    }

    Object.keys(headers).forEach((key) => this.set(key, headers[key]));

    return this;
  }

  get(key: Header | string) {
    return this.headers[key];
  }

  build() {
    return Object.keys(this.headers)
      .filter((key) => this.headers[key] !== null)
      .reduce((headers, key) => Object.assign(headers, { [key]: this.headers[key] }), {});
  }
}

class Context<Ctx extends object> {
  middleware: Middleware.Handler<Ctx>[] = [];

  use(middleware: Middleware<Request, Ctx>): this;
  use(phase: Phase.REQUEST, middleware: Middleware<Request, Ctx>): this;
  use(phase: Phase.VALIDATE, middleware: Validator<Request, Ctx>): this;
  use(phase: Phase.FORMAT | Phase.PARSE, middleware: Middleware<any, Ctx>): this;
  use(phase: Phase.CONFIRM, middleware: Validator<Response, Ctx>): this;
  use(phase: Phase.RESPONSE, middleware: Middleware<Response, Ctx>): this;
  use(phaseOrMiddleware: any, middleware?: Middleware<any, Ctx>) {
    this.middleware.push(
      typeof phaseOrMiddleware === 'function' ? [Phase.REQUEST, phaseOrMiddleware] : [phaseOrMiddleware, middleware]
    );

    return this;
  }

  validation(validator: Validator<Request, Ctx>) {
    return this.use(Phase.VALIDATE, validator);
  }

  formatter(middleware: Middleware<any, Ctx>) {
    return this.use(Phase.FORMAT, middleware);
  }

  parser(middleware: Middleware<any, Ctx>) {
    return this.use(Phase.PARSE, middleware);
  }

  confirmation(validator: Validator<Response, Ctx>) {
    return this.use(Phase.CONFIRM, validator);
  }

  handle(middleware: Middleware<Response, Ctx>) {
    return this.use(Phase.RESPONSE, middleware);
  }

  configure(configurator: (context: this) => void) {
    configurator(this);

    return this;
  }

  headers(headers: Header.Dict | Middleware<Headers, Ctx>) {
    return Context.transform(
      this,
      'headers',
      (originalHeaders, ctx) =>
        typeof headers === 'object' ? originalHeaders.set(headers) : headers(originalHeaders, ctx)
    );
  }

  method(method: Method) {
    return Context.transform(this, 'method', () => method);
  }

  mode(mode: Mode) {
    return Context.transform(this, 'mode', () => mode);
  }

  referrer(referrer: Referrer | string) {
    return Context.transform(this, 'referrer', () => referrer);
  }

  referrerPolicy(referrerPolicy: ReferrerPolicy) {
    return Context.transform(this, 'referrerPolicy', () => referrerPolicy);
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

  static transform<T extends Context<C>, C extends object, K extends keyof Request>(
    context: T,
    key: K,
    middleware: Middleware<Request[K], C>
  ): T {
    return context.use((req, ctx) => ({ ...req, [key]: middleware(req[key], ctx) }));
  }
}

class Client<Params extends any[] = [], Ctx extends object = object> extends Context<Ctx> {
  // middleware: Middleware.Handler<Ctx>[];

  constructor(builder: ClientBuilder<Params>, protected resolver: Resolver) {
    super();

    this.middleware = [...builder.context.middleware, ...builder.middleware];

    if (builder.parent) {
      this.inherit(builder);
    }
  }

  url() {}

  inherit(client: ClientBuilder<any>) {
    if (client) {
      this.middleware = [...client.context.middleware, ...this.middleware];
    }

    return this;
  }
}

class ActionClient<Params extends any[] = [], Ctx extends object = object> extends Client<Params, Ctx> {
  send(...args: Params) {
    const context = this.constructor(...args);
    const request = Middleware.apply({} as Request, this.middleware, Phase.REQUEST, context);
    const error = Validator.apply<Request, Ctx>(request, this.middleware, Phase.VALIDATE, context);

    if (error) {
      throw new Error(`validation failed: ${error}`);
    }

    return this.resolver(request);
  }
}

class ClientBuilder<Params extends any[] = [], Ctx extends object = object> extends Context<Ctx> {
  context = new Context();
  routes: Record<string, ClientBuilder<any>> = {};
  actions: Record<string, ClientBuilder<any>> = {};

  constructor(public parent?: ClientBuilder<any>, public constructor?: Constructor<Params, Ctx>) {
    super();
  }

  route<T extends any[], C extends object>(path: string, constructor?: Constructor<T, C>) {
    const client = new ClientBuilder<T, C>(this, constructor);
    this.registerRoute(path, client);

    return client;
  }

  action<T extends any[], C extends object>(path: string, constructor: Constructor<T, C>) {
    const client = new ClientBuilder<T, C>(this, constructor);
    this.registerAction(path, client);

    return client;
  }

  build(resolver: Resolver): Client {
    return new Client<Params, Ctx>(this, resolver);
  }

  private registerAction(path: string, client: ClientBuilder<any>) {
    this.actions[path] = client;
  }

  private registerRoute(path: string, client: ClientBuilder<any>) {
    this.routes[path] = client;
  }
}

const builder = new ClientBuilder();
builder
  .action('search', (clientKey: string, query: object) => ({ clientKey, query }))
  .headers({ 'content-type': 'application/json' })
  .use((req, ctx) => ({ ...req, body: { ...ctx.query, clientKey: ctx.clientKey } }));

const client = builder.build(null);

// client.post().actions.search('clientKey', {});
