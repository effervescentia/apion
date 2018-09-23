import { Middleware, Phase, PhasicMiddleware } from './types';

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
      if (phase === targetPhase) {
        valid = validator(value, context);

        if (!valid || typeof valid === 'string') {
          break;
        }
      }
    }

    switch (true) {
      case !valid:
        return DEFAULT_ERROR;
      case typeof valid === 'string':
        return valid;
      default:
        return false;
    }
  }

  export function matchesPhase<C extends object>([phase]: PhasicMiddleware<C>, targetPhase: Phase) {
    return phase === targetPhase;
  }
}

export default Validator;
