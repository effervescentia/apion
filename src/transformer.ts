import { Middleware, Phase, PhasicMiddleware } from './types';

interface Transformer<T, C extends object> extends Middleware<T, T, C> {}

namespace Transformer {
  export function apply<T, C extends object>(
    initial: T,
    middleware: PhasicMiddleware<C>[],
    targetPhase: Phase.REQUEST | Phase.RESPONSE,
    context: C
  ) {
    return middleware.reduce(
      (value, [phase, mware]: [Phase, Transformer<T, C>]) => (phase === targetPhase ? mware(value, context) : value),
      initial
    );
  }
}

export default Transformer;
