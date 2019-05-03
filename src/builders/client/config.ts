// tslint:disable:variable-name
import { Resolvable } from '@/context';
import RequestContext from '@/context/request';
import { Named, Transformer, Update } from '@/types';
import { compose } from '@/utils';
import HTTPBuilder from './http';

export type ContextualBuilder<C extends object> = Update<C, ConfigBuilder<any, string>>;

export function wrapDynamicTransform<C extends object>(
  builder: ContextualBuilder<C>,
  extract: (builder: ConfigBuilder<any, string>) => Resolvable<any>
) {
  return builder instanceof ConfigBuilder
    ? extract(builder)
    : (prev: any, ctx: C) => extract(builder(ctx)).resolve(ctx, prev);
}

export default class ConfigBuilder<C extends object, K extends string> extends HTTPBuilder<C> implements Named<K> {
  constructor(public name?: K, protected _parents: ConfigBuilder<any, string>[] = []) {
    super();
  }

  ctx(obj: Partial<C>) {
    this._context.update(obj);

    return this;
  }

  use(contextualBuilder: ContextualBuilder<C>) {
    if (contextualBuilder instanceof ConfigBuilder) {
      this._parents = [...this._parents, contextualBuilder];
    } else {
      const eventual = new ConfigBuilder('anonymous::eventual');
      eventual._request = new RequestContext([
        (value, context) => contextualBuilder(context)._request.resolve(context, value),
      ]);

      this._parents = [...this._parents, eventual];
    }

    return this;
  }

  inherit(builder: ConfigBuilder<any, string>) {
    this._parents = [builder, ...this._parents];

    return this;
  }

  pipe<T extends ConfigBuilder<any, string>>(trfm: Transformer<this, T>): T {
    return trfm(this);
  }

  flatten(): ConfigBuilder<any, string> {
    const flattened = this._parents.reduce(
      (acc, parent) => acc.mergeContexts(parent.flatten()),
      this.newInstance('flattened')
    );

    return this.evolve(flattened.mergeContexts(this) as this);
  }

  protected newInstance(name: string) {
    return new ConfigBuilder(`${this.name}::${name}`);
  }

  protected clone(name: string): this {
    return this.evolve(this.newInstance(name) as this);
  }

  protected evolve(builder: this): this {
    builder._parents = this._parents;
    builder._context = this._context.clone();
    builder._request = this._request.clone();

    return builder;
  }

  protected mergeContexts<T extends object>(builder: ConfigBuilder<T, string>) {
    this._context.transforms = [...this._context.transforms, ...(builder._context.transforms as any[])];
    this._request.transforms = [...this._request.transforms, ...builder._request.transforms];

    return this;
  }

  protected resolveContext = (initialValue = {}): C => {
    const inheritedValue = this._parents.length
      ? compose(...this._parents.map((parent) => (value: any) => parent.resolveContext(value)))(initialValue)
      : initialValue;

    return this._context.resolve(null, inheritedValue);
  };

  protected resolveRequest(context: any, initialValue = {}) {
    const inheritedValue = this._parents.length
      ? compose(...this._parents.map((parent) => (value: any, ctx: any): any => parent.resolveRequest(ctx, value)))(
          initialValue,
          context
        )
      : initialValue;

    return this._request.resolve(context, inheritedValue);
  }

  protected replaceParent(prev: this, next: this) {
    const index = this._parents.indexOf(prev);
    if (index !== -1) {
      this._parents = [...this._parents];
      this._parents.splice(index, 1, next);
    }

    return this;
  }
}
