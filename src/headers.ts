import { Header } from './types';

export default class Headers {
  headers: Header.Dict = {};

  add(key: Header | string, value: string) {
    if (value != null) {
      this.headers[key.toLowerCase()] = value;
    }

    return this;
  }

  remove(key: Header | string) {
    this.headers[key.toLowerCase()] = null;

    return this;
  }

  set(key: Header | string, value: string | null): this;
  set(headers: Header.Dict, replace?: boolean): this;
  set(headersOrKey: any, replaceOrValue?: any) {
    return typeof headersOrKey === 'object'
      ? this.setMany(headersOrKey, replaceOrValue)
      : this.setOne(headersOrKey, replaceOrValue);
  }

  setOne(key: Header | string, value: string) {
    if (value != null) {
      this.headers[key.toLowerCase()] = value as string;
    }

    return this;
  }

  setMany(headers: Header.Dict, replace?: boolean) {
    if (replace) {
      this.headers = {};
    }

    Object.keys(headers).forEach((key: Header | string) => this.set(key, headers[key]));

    return this;
  }

  get(key: Header | string) {
    return this.headers[key];
  }

  build() {
    return Object.keys(this.headers)
      .filter((key) => this.headers[key] !== null)
      .reduce((headers, key) => Object.assign(headers, { [key]: this.headers[key] }), {});
  }
}
