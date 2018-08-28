enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  TRACE = 'TRACE',
  OPTIONS = 'OPTIONS',
}

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
  headers: Record<string, string>;

  add(key: string, value: string) {
    if (value != null) {
      this.headers[key.toLowerCase()] = value;
    }

    return this;
  }

  remove(key: string) {
    this.headers[key.toLowerCase()] = null;

    return this;
  }

  set(headers: Record<string, string>, replace?: boolean) {
    if (replace) {
      this.headers = {};
    }

    Object.keys(headers).forEach((key) => this.add(key, headers[key]));

    return this;
  }

  get(key: string) {
    return this.headers[key];
  }

  build() {
    return Object.keys(this.headers)
      .filter((key) => this.headers[key] !== null)
      .reduce((headers, key) => Object.assign(headers, { [key]: this.headers[key] }), {});
  }
}

class Client<Parameters extends any[] = []> {
  routes: Record<string, Client<any>> = {};
  middleware: Middleware<Request>[] = [];

  constructor(private parent?: Client<any>, private constructor?: (...args: Parameters) => object) {}

  route<T extends any[]>(path: string, constructor?: (...args: T) => object) {
    const client = new Client<T>(this, constructor);
    this.register(path, client);

    return client;
  }

  use(middleware: Middleware<Request>) {
    this.middleware.push(middleware);

    return this;
  }

  configure(configurator: (client: Client<Parameters>) => void) {
    configurator(this);

    return this;
  }

  headers(headers: Record<string, string> | Middleware<Headers>) {
    return this.use((req, ctx) => ({
      ...req,
      headers: typeof headers === 'object' ? req.headers.set(headers) : headers(req.headers, ctx),
    }));
  }

  method(method: Method) {
    return this.use((req) => ({ ...req, method }));
  }

  mode(mode: Mode) {
    return this.use((req) => ({ ...req, mode }));
  }

  referrer(referrer: Referrer | string) {
    return this.use((req) => ({ ...req, referrer }));
  }

  referrerPolicy(referrerPolicy: ReferrerPolicy) {
    return this.use((req) => ({ ...req, referrerPolicy }));
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
      headers: headers.add('content-type', 'application/json'),
    }));
  }

  build() {
    return null;
  }

  private register(path: string, client: Client<any>) {
    this.routes[path] = client;
  }
}
