import Client from './client';
import Context from './context';
import { Constructor, Resolver } from './types';
import URI from './uri';

export default class Builder<
  Ctx extends object = {},
  Routes extends Record<string, Builder<Ctx>> = {},
  Params extends any[] = []
> extends Context.Inheritable<Ctx, Routes> {
  actionHandler: Constructor<Params, Ctx> | null = null;

  add<
    K extends keyof Routes,
    C extends object = {},
    R extends Record<string, Builder<Ctx & C>> = {},
    P extends any[] = []
  >(
    name: K,
    pathOrTransformer: URI.Transformer | string | null = (name as string) || null,
    constructor?: Constructor<P, Ctx & C>
  ): Routes[K] {
    const builder = new Builder().extend(this) as any;

    if (pathOrTransformer) {
      if (typeof pathOrTransformer === 'function') {
        builder.uri(pathOrTransformer);
      } else {
        builder.path(pathOrTransformer);
      }
    }

    if (constructor) builder.action(constructor);

    this.attach(name as string, builder);

    return builder;
  }

  action(constructor: Constructor<Params, Ctx>) {
    this.actionHandler = constructor;

    return this;
  }

  build<R extends Record<string, Client>>(resolver: Resolver, parent?: Context.Inheritable<Ctx>): { new (): any } {
    // tslint:disable-next-line no-this-assignment
    const self = this;

    const clientConstructor = function() {
      return self.createClient();
    };

    return clientConstructor as any;
  }

  protected createClient(parent?: Context<Ctx>) {
    const actionHandler = this.actionHandler;
    const parentContext = parent ? parent.clone() : new Context();
    let client = {};
    let context = {};

    if (actionHandler) {
      const constructor = (...args: Params) => {
        context = { ...context, ...((actionHandler(...args) as any) || {}) };
      };

      if (this.uriTransform) {
        client = Object.assign(constructor, { exec: constructor });
      }
    }

    Object.assign(
      client,
      Object.keys(this.children).reduce(
        (childClients, key) => Object.assign(childClients, { [`$${key}`]: this.children[key].createClient(this.all) }),
        {}
      )
    );

    return client;
  }
}
