// tslint:disable:variable-name no-expression-statement
import RequestContext from '@/context/request';
import { Named, Request, Transformer, Update } from '@/types';
import { compose } from '@/utils';
import HTTPBuilder from './http';

export type ContextualBuilder<C extends object> = Update<
  C,
  ConfigBuilder<any, string>
>;

export function resolveDynamicBuilder<T>(
  dynamicBuilder: Transformer<T, ConfigBuilder<any, string>>,
  context: T
): ConfigBuilder<any, string> {
  try {
    return dynamicBuilder(context);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error('failed while executing dynamic builder');
    throw e;
  }
}

export default class ConfigBuilder<C extends object, K extends string>
  extends HTTPBuilder<C>
  implements Named<K> {
  private static wrapDynamicBuilder<T extends object>(
    contextualBuilder: ContextualBuilder<T>
  ): ConfigBuilder<any, string> {
    if (contextualBuilder instanceof ConfigBuilder) {
      return contextualBuilder;
    }

    const dynamic = new ConfigBuilder('::dynamic::');
    dynamic._request = new RequestContext([
      (value, context) => {
        const builder = resolveDynamicBuilder<T>(contextualBuilder, context);

        if (builder instanceof ConfigBuilder) {
          return contextualBuilder(context)._request.resolve(context, value);
        }

        throw new Error(
          'expected dynamic builder to return an instance of ConfigBuilder'
        );
      },
    ]);

    return dynamic;
  }

  constructor(
    public name?: K,
    protected _parents: Array<ConfigBuilder<any, string>> = []
  ) {
    super();
  }

  /**
   * merge an object with the context of this builder using the same logic as Object.assign
   * @param obj an object to merge with the current context
   */
  public ctx(obj: Partial<C>): this {
    this._context.update(obj);

    return this;
  }

  /**
   * add a builder to the end of the transform chain
   * @param contextualBuilder a builder to add as a parent or a dynamic builder contstruction callback
   */
  public use(contextualBuilder: ContextualBuilder<C>): this {
    const builder = ConfigBuilder.wrapDynamicBuilder(contextualBuilder);

    this._parents = [...this._parents, builder];

    return this;
  }

  /**
   * add a builder to the beginning of the transform chain instead of the end
   * @param contextualBuilder a builder to add as a parent or a dynamic builder contstruction callback
   */
  public inherit(contextualBuilder: ContextualBuilder<C>): this {
    const builder = ConfigBuilder.wrapDynamicBuilder(contextualBuilder);

    this._parents = [builder, ...this._parents];

    return this;
  }

  /**
   * apply a functional transformation to the builder and return the result of the transformation
   * @param trfm a transformation to apply to this
   */
  public pipe<T extends ConfigBuilder<any, string>>(
    trfm: Transformer<this, T>
  ): T {
    return trfm(this);
  }

  /**
   * create a new builder with the transformations all inherited builders flattened into it
   */
  public flatten(): ConfigBuilder<any, string> {
    const flattened = this._parents.reduce(
      (acc, parent) => acc.mergeContexts(parent.flatten()),
      this.newInstance('flattened')
    );

    return this.evolve(flattened.mergeContexts(this) as this);
  }

  /**
   * create a new instance of this builder type and set the properties from this builder
   * @param name the name of the cloned builder
   */
  public extend(name: string): this {
    return this.evolve(this.newInstance(name) as this);
  }

  /**
   * create a new instance of this builder type
   * @param name the name of the new builder
   */
  protected newInstance(name: string): ConfigBuilder<any, string> {
    return new ConfigBuilder(`${this.name}::${name}`);
  }

  /**
   * override the properties of a builder with the properties of this builder
   * @param builder the target of the property overrides
   */
  protected evolve(builder: this): this {
    builder._parents = this._parents;
    builder._context = this._context.clone();
    builder._request = this._request.clone();

    return builder;
  }

  /**
   * add request and context transformations from another config builder
   * @param builder a builder with request or context transformations
   */
  protected mergeContexts<T extends object>(
    builder: ConfigBuilder<T, string>
  ): this {
    this._context.merge(builder._context);
    this._request.merge(builder._request);

    return this;
  }

  /**
   * construct a context object by applying a series of transformations to an initialValue
   * @param initialValue a starting value to use for the context transformations
   */
  protected resolveContext(initialValue = {}): C {
    const inheritedValue = this._parents.length
      ? compose(
          ...this._parents.map(parent => (value: any) =>
            parent.resolveContext(value)
          )
        )(initialValue)
      : initialValue;

    return this._context.resolve(null, inheritedValue);
  }

  /**
   * construct a request object by applying a series of transformations to an initialValue
   * @param context a context object used to resolve request transformations
   * @param initialValue the starting value to use for the request transformations
   */
  protected resolveRequest(context: any, initialValue = {}): Request {
    const inheritedValue = this._parents.length
      ? compose(
          ...this._parents.map(parent => (value: any, ctx: any): any =>
            parent.resolveRequest(ctx, value)
          )
        )(initialValue, context)
      : initialValue;

    return this._request.resolve(context, inheritedValue);
  }

  /**
   * replace a builder in the _parents array with a different builder
   * @param prev the parent builder to be replaced
   * @param next the builder to replace it with
   */
  protected replaceParent(prev: this, next: this): this {
    const index = this._parents.indexOf(prev);
    if (index !== -1) {
      this._parents = [...this._parents];
      this._parents.splice(index, 1, next);
    }

    return this;
  }
}
