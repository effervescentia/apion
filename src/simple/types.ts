export type Transformer<T, R> = (value: T) => R;

export interface Named<T extends string> {
  name?: T;
}

export type NameOf<T> = T extends Named<infer R> ? R : never;

export enum ClientType {
  ACTION,
  GROUP,
  CONFIG,
}

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface Request {
  url: string;
  headers: Record<string, string>;
  method: Method;
  body: any;
}
