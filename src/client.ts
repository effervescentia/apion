import Builder from './builder';
import Context from './context';
import Transformer from './transformer';
import { Phase, Request, Resolver } from './types';
import Validator from './validator';

export default class Client<
  Ctx extends object = {},
  Routes extends Record<string, Client> = {},
  Params extends any[] = []
> extends Context.Inheritable<Ctx> {
  routes: Routes = {} as Routes;

  constructor(protected resolver: Resolver, parent?: Context.Inheritable<Ctx>) {
    super();
  }

  route() {}

  inherit(builder: Builder<any, Ctx>) {
    const superContext = builder.collapse();

    this.all.middleware.push(...superContext.middleware);
    this.middleware.push(...builder.middleware);

    Object.keys(builder.actions).forEach(
      (key) => (this.actions[key] = builder.actions[key].build(this.resolver, superContext))
    );

    return this;
  }
}

export class ActionClient<Params extends any[] = [], Ctx extends object = object> extends Client<Params, Ctx> {
  exec(...args: Params) {
    const context = this.constructor(...args);
    const request = Transformer.apply({} as Request, this.middleware, Phase.REQUEST, context);
    const error = Validator.apply<Request, Ctx>(request, this.middleware, Phase.VALIDATE, context);

    if (error) {
      throw new Error(`validation failed: ${error}`);
    }

    return this.resolver(request);
  }
}
