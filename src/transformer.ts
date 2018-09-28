import { Middleware, Phase, PhasicMiddleware } from './types';
import { cast } from './utils';

interface Transformer<T, C extends object> extends Middleware<T, T, C> {}

namespace Transformer {
  export function apply<T, C extends object>(
    initial: T,
    middleware: PhasicMiddleware<C>[],
    targetPhase: Phase.REQUEST | Phase.RESPONSE,
    context: C
  ) {
    return middleware.reduce((value, [phase, transformer]) => {
      if (cast<Transformer<T, C>>(phase === targetPhase, transformer)) {
        return transformer(value, context);
      }

      return value;
    }, initial);
  }
}

export default Transformer;
