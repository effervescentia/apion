import { Transformer } from '@/types';
import { compose, identity } from '@/utils';

export default abstract class RequestBuilderInstance<T> {
  // tslint:disable-next-line:readonly-keyword
  protected _trfms: Array<Transformer<T>> = [];

  constructor(private formatter?: Transformer<T>) {}

  public build(): T {
    return this._trfms.length
      ? (compose as any)(
          ...this._trfms.map(trfm => (prev: any) => ({
            ...prev,
            ...trfm(prev),
          })),
          this.formatter || identity
        )()
      : undefined;
  }
}
