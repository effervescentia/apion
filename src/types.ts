import { Method } from './constants';

export type Transformer<T, R = T> = (value: T) => R;

export interface Named<T extends string> {
  name?: T;
}

export enum Phase {
  PARSE,
  FORMAT,
}

export interface Request {
  url: string;
  headers: Record<string, string>;
  method: Method;
  body: any;
  middleware: [Phase, Transformer<any>][];
}
