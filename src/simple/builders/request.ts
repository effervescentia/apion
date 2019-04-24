export default class RequestBuilder<T extends object> {
  with<K extends string, V>(name: string, handler?: (value: V) => Record<K, V>): RequestBuilder<T & Record<K, V>> {
    return this;
  }

  inherit<P extends object>(parent: RequestBuilder<P>): RequestBuilder<P & T> {
    return this;
  }
}
