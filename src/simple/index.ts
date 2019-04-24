import ClientBuilder from './builders/client';
import RequestBuilder from './builders/request';
import { ClientType } from './types';

export function builder() {
  return new RequestBuilder();
}

export function config() {
  return new ClientBuilder(ClientType.CONFIG);
}

export function group<K extends string, T extends any[], R extends object>(name: K, ctor?: (...args: T) => R) {
  return new ClientBuilder<R, K, {}>(ClientType.GROUP, name, ctor);
}

export function action<K extends string, T extends any[], R extends object>(
  name: K,
  ctor?: ((...args: T) => R) | RequestBuilder<R>
) {
  return new ClientBuilder<R, K, {}>(ClientType.ACTION, name, ctor);
}
