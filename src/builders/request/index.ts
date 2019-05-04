import { Lambda, Transformer } from '@/types';
import Instance from './instance';

export { Instance };

export type Handler<K extends string, A extends any[]> = Lambda<
  A,
  Record<K, any>
>;

export default class RequestBuilder<T extends object> {
  // tslint:disable-next-line:readonly-keyword
  public parents: Array<RequestBuilder<any>> = [];
  // tslint:disable-next-line:readonly-keyword
  public handlers: Record<string, Handler<string, any>> = {};

  constructor(private formatter?: Transformer<T>) {}

  public with<K extends string, A extends any[]>(
    name: K,
    handler?: Handler<K, A>
  ): RequestBuilder<T & Record<K, A>> {
    this.handlers = {
      ...this.handlers,
      [name]: handler || (value => ({ [name]: value })),
    };

    return this as any;
  }

  public use<P extends object>(
    parent: RequestBuilder<P>
  ): RequestBuilder<P & T> {
    this.parents = [...this.parents, parent];

    return this as any;
  }

  public build(): new () => Instance<T> {
    // tslint:disable-next-line:no-this-assignment
    const self: RequestBuilder<T> = this;

    // tslint:disable-next-line:max-classes-per-file
    return class extends Instance<T> {
      constructor() {
        super(self.formatter);

        [...self.parents, self].forEach(({ handlers }) =>
          Object.entries(handlers).forEach(([key, handler]) =>
            Object.defineProperty(this, key, {
              value: (...args: any[]) => {
                this._trfms = [
                  ...this._trfms,
                  prev => ({ ...prev, ...handler(...args) }),
                ];

                return this;
              },
            })
          )
        );
      }
    };
  }
}
