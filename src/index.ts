import ActionBuilder from './builders/client/action';
import ConfigBuilder from './builders/client/config';
import GroupBuilder, { Constructor } from './builders/client/group';
import RequestBuilder from './builders/request';
import { Transformer } from './types';

export * from './constants';

export function builder<T extends object>(formatter?: Transformer<T>) {
  return new RequestBuilder<T>(formatter);
}

export function config<T extends object, K extends string = string>(name?: K) {
  return new ConfigBuilder<T, K>(name);
}

export function group<K extends string, T extends any[], R extends object>(
  name: K,
  ctor?: Constructor<K, T, R>
): GroupBuilder<R, K, {}> {
  return new GroupBuilder(name, ctor);
}

export function action<K extends string, T extends any[], R extends object>(
  name: K,
  ctorOrBuilder?: Constructor<K, T, R> | RequestBuilder<R>
): ActionBuilder<R, K, {}> {
  return new ActionBuilder(name, ctorOrBuilder);
}
