import Client from './client';
import Context from './context';
import { Constructor, Resolver } from './types';

export default class Builder<
  Ctx extends object = {},
  Routes extends Record<string, Builder> = {},
  Params extends any[] = []
> extends Context.Inheritable<Ctx> {
  actionHandler: Constructor<Params, Ctx> | null = null;

  add<K extends string, T extends any[], C extends Ctx, B extends Builder<C, any, T>>(
    name: K,
    path: string | null = (name as string) || null,
    constructor?: Constructor<T, C>
  ): Builder<Ctx, Routes & Record<K, B>, Params> {
    const builder: B = new Builder().extend(this) as any;

    if (path) builder.path(path);

    if (constructor) builder.action(constructor);

    this.attach(name, builder);

    return this as any;
  }

  action(constructor: Constructor<Params, Ctx>) {
    this.actionHandler = constructor;

    return this;
  }

  build<R extends Record<string, Client>>(resolver: Resolver, parent?: Context.Inheritable<Ctx>): Client<Params, Ctx> {
    return new Client<R>(resolver, parent).inherit(this);
  }
}
