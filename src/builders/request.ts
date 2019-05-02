// tslint:disable:variable-name
import { compose, identity } from 'ramda';

import { Transformer } from '@/types';

export type Handler<K extends string, A extends any[]> = (...args: A) => Record<K, any>;

export abstract class RequestBuilderInstance<T> {
  protected _trfms: Transformer<T>[] = [];

  constructor(private formatter?: Transformer<T>) {}

  build() {
    return this._trfms.length
      ? (compose as any)(
          ...this._trfms.map((trfm) => (prev: any) => ({ ...prev, ...trfm(prev) })),
          this.formatter || identity
        )()
      : undefined;
  }
}

export default class RequestBuilder<T extends object> {
  public parents: RequestBuilder<any>[] = [];
  public handlers: Record<string, Handler<string, any>> = {};

  constructor(private formatter?: Transformer<T>) {}

  with<K extends string, A extends any[]>(name: K, handler?: Handler<K, A>): RequestBuilder<T & Record<K, A>> {
    this.handlers = { ...this.handlers, [name]: handler || ((value) => ({ [name]: value })) };

    return this as any;
  }

  use<P extends object>(parent: RequestBuilder<P>): RequestBuilder<P & T> {
    this.parents = [...this.parents, parent];

    return this as any;
  }

  build(): { new (): RequestBuilderInstance<T> } {
    // tslint:disable-next-line:no-this-assignment
    const self: RequestBuilder<T> = this;

    return class extends RequestBuilderInstance<T> {
      constructor() {
        super(self.formatter);

        [...self.parents, self].forEach(({ handlers }) =>
          Object.entries(handlers).forEach(([key, handler]) =>
            Object.defineProperty(this, key, {
              value: (...args: any[]) => {
                this._trfms = [...this._trfms, (prev) => ({ ...prev, ...handler(...args) })];

                return this;
              },
            })
          )
        );
      }
    };
  }
}
