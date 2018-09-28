import { Middleware, Phase, PhasicMiddleware } from './types';
import { cast } from './utils';

interface Validator<T, C extends object> extends Middleware<T, boolean | string, C> {}

namespace Validator {
  export const DEFAULT_ERROR = 'validator returned a falsey value';

  export function apply<T, C extends object>(
    value: T,
    middleware: PhasicMiddleware<C>[],
    targetPhase: Phase.VALIDATE | Phase.EVALUATE,
    context: C
  ) {
    let valid: string | boolean = true;

    for (const [phase, validator] of middleware) {
      if (cast<Validator<T, C>>(phase === targetPhase, validator)) {
        valid = validator(value, context);

        if (!valid || typeof valid === 'string') {
          break;
        }
      }
    }

    if (!valid) {
      return DEFAULT_ERROR;
    }

    return valid;
  }
}

export default Validator;
