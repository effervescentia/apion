import ClientBuilder from './builder';
import Client from './client';
import Context from './context';
import { Constructor, Resolver } from './types';

export default class Builder<Params extends any[] = [], Ctx extends object = object> extends Context<Ctx> {
  context = new Context();
  actions: Record<string, Builder<any, any>> = {};
  routes: Record<string, Builder<any, any>> = {};

  constructor(public parent?: Builder<any>, public constructor?: Constructor<Params, Ctx>) {
    super();
  }

  action<T extends any[], C extends Ctx>(path: string, constructor: Constructor<T, C>) {
    const builder: Builder<T, C> = new ClientBuilder(this, constructor);
    this.registerAction(path, builder);

    return builder;
  }

  route<T extends any[], C extends Ctx>(path: string, constructor?: Constructor<T, C>) {
    const builder: Builder<T, C> = new ClientBuilder(this, constructor);
    this.registerRoute(path, builder);

    return builder;
  }

  build(resolver: Resolver) {
    return new Client<Params, Ctx>(this, resolver);
  }

  private registerAction<C extends Ctx>(path: string, builder: Builder<any, C>) {
    this.actions[path] = builder;
  }

  private registerRoute<C extends Ctx>(path: string, builder: Builder<any, C>) {
    this.routes[path] = builder;
  }
}
