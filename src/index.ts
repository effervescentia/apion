import ActionBuilder from './builders/client/action';
import ConfigBuilder from './builders/client/config';
import GroupBuilder, { Constructor } from './builders/client/group';
import RequestBuilder from './builders/request';
import { Transformer } from './types';

export * from './constants';

export function builder<C extends object>(formatter?: Transformer<C>) {
  return new RequestBuilder<C>(formatter);
}

export function config<T extends object, K extends string = string>(name?: K) {
  return new ConfigBuilder<T, K>(name);
}

export function group<K extends string, A extends any[], C extends object>(name: K, ctor?: Constructor<K, A, C>) {
  return new GroupBuilder<C, K, {}>(name, ctor);
}

export function action<K extends string, A extends any[], C extends object>(
  name: K,
  ctorOrBuilder?: Constructor<K, A, C> | RequestBuilder<C>
) {
  return new ActionBuilder<C, K, {}>(name, ctorOrBuilder);
}
