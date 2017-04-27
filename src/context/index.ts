// tslint:disable:variable-name no-expression-statement no-object-mutation
import { Applicator } from '@/types';
import { compose } from '@/utils';

export type ContextualTransform<C, T, R = T> = Applicator<T, C, R>;

export default class Context<T extends object> {
  constructor(
    public transforms: Array<ContextualTransform<any, Partial<T>>> = []
  ) {}

  public set<K extends keyof T>(
    name: K,
    value: ContextualTransform<any, T[K]> | T[K]
  ): this {
    const trfm = (prev: Partial<T>, ctx?: any): Partial<T> =>
      ({
        ...prev,
        [name]:
          typeof value === 'function'
            ? (value as ContextualTransform<any, T[K]>)(prev[name]!, ctx)
            : value,
      } as any);

    return this.transform(trfm);
  }

  public update(value: Applicator<Partial<T>, any> | Partial<T>): this {
    const trfm = (prev: Partial<T>, ctx: any) =>
      typeof value === 'function' ? value(prev, ctx) : { ...prev, ...value };

    return this.transform(trfm);
  }

  public resolve(context: any = null, initialValue = {}): T {
    return this.transforms.length
      ? compose(
          ...this.transforms.map(trfm => (value: any, ctx: any) =>
            trfm(value, ctx)
          )
        )(initialValue, context)
      : initialValue;
  }

  public clone(): Context<T> {
    return new Context(this.transforms);
  }

  private transform(trfm: ContextualTransform<any, Partial<T>>): this {
    this.transforms = [...this.transforms, trfm];

    return this;
  }
}
