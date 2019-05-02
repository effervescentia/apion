// tslint:disable:variable-name
import { Resolvable } from '@/context';
import { Named, Transformer } from '@/types';
import HTTPBuilder from './http';

export type ContextualBuilder<C extends object> = ((ctx: C) => ConfigBuilder<any, string>) | ConfigBuilder<any, string>;

export function wrapDynamicTransform<C>(
  builder: ((ctx: C) => ConfigBuilder<any, string>) | ConfigBuilder<any, string>,
  extract: (builer: ConfigBuilder<any, string>) => Resolvable<any>
) {
  return builder instanceof ConfigBuilder
    ? extract(builder)
    : (prev: any, ctx: C) => extract(builder(ctx)).resolve(ctx, prev);
}

export default class ConfigBuilder<C extends object, K extends string> extends HTTPBuilder<C> implements Named<K> {
  constructor(public name?: K) {
    super();
  }

  ctx(obj: Partial<C>) {
    this._context.update(obj);

    return this;
  }

  use(contextualBuilder: ContextualBuilder<C>) {
    if (typeof contextualBuilder !== 'function') {
      // context cannot be built up using this pattern
      this._context.inherit(contextualBuilder._context as Resolvable<C>);
    }
    this._request.inherit(wrapDynamicTransform<C>(contextualBuilder, (builder) => builder._request as any));

    return this;
  }

  pipe<T extends ConfigBuilder<any, string>>(trfm: Transformer<this, T>): T {
    return trfm(this);
  }
}
