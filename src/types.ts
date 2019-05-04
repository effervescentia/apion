import { Method } from './constants';

export type Transformer<T, R = T> = (value: T) => R;
export type Update<T, R = T> = Transformer<T, R> | R;
export type Merger<T> = (prev: T, next: T) => T;
export type Lambda<A extends any[], R> = (...args: A) => R;
export type Applicator<T, C, R = T> = (value: T, ctx: C) => R;
export type ContextualUpdate<C, T, R = T> = Applicator<T, C, R> | R;

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
