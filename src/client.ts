import Builder from './builder';
import Context from './context';
import Transformer from './transformer';
import { Phase, Request, Resolver } from './types';
import Validator from './validator';

export default class Client<Params extends any[] = [], Ctx extends object = object> extends Context<Ctx> {
  constructor(builder: Builder<Params, Ctx>, protected resolver: Resolver) {
    super();

    this.middleware = [...builder.context.middleware, ...builder.middleware];

    if (builder.parent) {
      this.inherit(builder);
    }
  }

  url() {}

  inherit(builder: Builder<any, Ctx>) {
    this.middleware = [...builder.context.middleware, ...this.middleware];

    return this;
  }
}

class ActionClient<Params extends any[] = [], Ctx extends object = object> extends Client<Params, Ctx> {
  send(...args: Params) {
    const context = this.constructor(...args);
    const request = Transformer.apply({} as Request, this.middleware, Phase.REQUEST, context);
    const error = Validator.apply<Request, Ctx>(request, this.middleware, Phase.VALIDATE, context);

    if (error) {
      throw new Error(`validation failed: ${error}`);
    }

    return this.resolver(request);
  }
}
