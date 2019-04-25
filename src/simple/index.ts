import ClientBuilder, { Constructor } from './builders/client';
import ConfigBuilder from './builders/config';
import RequestBuilder from './builders/request';
import { ClientType } from './types';

export function builder() {
  return new RequestBuilder();
}

export function config() {
  return new ConfigBuilder();
}

export function group<K extends string, T extends any[], R extends object>(
  name: K,
  ctor?: Constructor<K, T, R>
): ClientBuilder<R, K, {}> {
  return new ClientBuilder(ClientType.GROUP, name, ctor);
}

export function action<K extends string, T extends any[], R extends object>(
  name: K,
  ctorOrBuilder?: Constructor<K, T, R> | RequestBuilder<R>
): ClientBuilder<R, K, {}> {
  return new ClientBuilder(ClientType.ACTION, name, ctorOrBuilder);
}
