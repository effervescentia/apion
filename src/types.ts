import Headers from './headers';
import Transformer from './transformer';
import Validator from './validator';

export interface Constructor<P extends any[], C> {
  (...params: P): C;
}

export enum Header {
  CONTENT_TYPE = 'content-type',
}

export namespace Header {
  export interface Dict extends Record<Header | string, string | null> {}
}

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  TRACE = 'TRACE',
  OPTIONS = 'OPTIONS',
}

export interface Middleware<T, R, C extends object> {
  (value: T, context: C): R;
}

export enum Mode {
  CORS = 'cors',
  NO_CORS = 'no-cors',
  SAME_ORIGIN = 'same-origin',
}

export enum Phase {
  REQUEST = 'request',
  VALIDATE = 'validate',
  FORMAT = 'format',
  PARSE = 'parse',
  EVALUATE = 'evaluate',
  RESPONSE = 'response',
}

export type PhasicMiddleware<C extends object> =
  | [Phase.REQUEST, Transformer<Request, C>]
  | [Phase.RESPONSE, Transformer<Response, C>]
  | [Phase.VALIDATE, Validator<Request, C>]
  | [Phase.EVALUATE, Validator<Response, C>]
  | [Phase.FORMAT | Phase.PARSE, Transformer<any, C>];

export enum Referrer {
  CLIENT = 'client',
  NONE = 'no-referrer',
}

export enum ReferrerPolicy {
  CLIENT = 'client',
  NONE = 'no-referrer',
  NONE_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
  ORIGIN = 'origin',
  ORIGIN_WHEN_XORIGIN = 'origin-when-cross-origin',
  UNSAFE_URL = 'unsafe-url',
}

export interface Request {
  url: string;
  method: Method;
  headers: Headers;
  body: any;

  mode: Mode;
  referrer: Referrer | string;
  referrerPolicy: ReferrerPolicy;
}

export type Resolver = (request: {}) => Promise<{}>;

export interface Response {}
