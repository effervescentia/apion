import ActionBuilder from './builders/client/action';
import ConfigBuilder from './builders/client/config';
import GroupBuilder, { Constructor } from './builders/client/group';
import RequestBuilder from './builders/request';
import { Transformer } from './types';

export * from './constants';

export function builder<C extends object>(
  formatter?: Transformer<C>
): RequestBuilder<C> {
  return new RequestBuilder(formatter);
}

export function config<T extends object, K extends string = string>(
  name?: K
): ConfigBuilder<T, K> {
  return new ConfigBuilder(name);
}

export function group<K extends string, A extends any[], C extends object>(
  name: K,
  ctor?: Constructor<K, A, C>
): GroupBuilder<C, K, {}> {
  return new GroupBuilder(name, ctor);
}

export function action<K extends string, A extends any[], C extends object>(
  name: K,
  ctorOrBuilder?: Constructor<K, A, C> | RequestBuilder<C>
): ActionBuilder<C, K, {}> {
  return new ActionBuilder(name, ctorOrBuilder);
}

export default {
  action,
  builder,
  config,
  group,
};
