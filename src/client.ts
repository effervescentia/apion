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

interface HeaderSet extends Record<Header | string, string> {}

interface Middleware<T> {
  (client: T, context: object): T;
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

class Headers {
  headers: HeaderSet;

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

  set(headers: HeaderSet, replace?: boolean) {
    if (replace) {
      this.headers = {};
    }

    Object.keys(headers).forEach((key) => this.add(key, headers[key]));

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

class Context {
  middleware: Middleware<Request>[] = [];

  use(middleware: Middleware<Request>): this;
  use<K extends keyof Request>(middleware: Middleware<Request[K]>, key: K): this;
  use(middleware: Middleware<any>, key?: string) {
    this.middleware.push(key ? (req, ctx) => ({ ...req, [key]: middleware(req[key], ctx) }) : middleware);

    return this;
  }

  configure(configurator: (context: this) => void) {
    configurator(this);

    return this;
  }

  headers(headers: HeaderSet | Middleware<Headers>) {
    return this.use(
      (originalHeaders, ctx) =>
        typeof headers === 'object' ? originalHeaders.set(headers) : headers(originalHeaders, ctx),
      'headers'
    );
  }

  method(method: Method) {
    return this.use(() => method, 'method');
  }

  mode(mode: Mode) {
    return this.use(() => mode, 'mode');
  }

  referrer(referrer: Referrer | string) {
    return this.use(() => referrer, 'referrer');
  }

  referrerPolicy(referrerPolicy: ReferrerPolicy) {
    return this.use(() => referrerPolicy, 'referrerPolicy');
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

  build() {
    return null;
  }
}

class ClientBuilder<Parameters extends any[] = []> extends Context {
  context = new Context();
  routes: Record<string, ClientBuilder<any>> = {};
  actions: Record<string, ClientBuilder<any>> = {};

  constructor(private parent?: ClientBuilder<any>, private constructor?: (...args: Parameters) => object) {
    super();
  }

  route<T extends any[], C extends object>(path: string, constructor?: (...args: T) => C) {
    const client = new ClientBuilder<T>(this, constructor);
    this.registerRoute(path, client);

    return client;
  }

  action<T extends any[], C extends object>(path: string, constructor: (...args: T) => C) {
    const client = new ClientBuilder<T>(this, constructor);
    this.registerAction(path, client);

    return client;
  }

  build() {
    return null;
  }

  private registerAction(path: string, client: ClientBuilder<any>) {
    this.actions[path] = client;
  }

  private registerRoute(path: string, client: ClientBuilder<any>) {
    this.routes[path] = client;
  }
}
