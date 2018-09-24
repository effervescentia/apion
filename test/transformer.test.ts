import suite from './suite';

import { Phase } from '../src/types';

import Transformer from '../src/transformer';

suite('Transformer', ({ expect, spy }) => {
  describe('apply()', () => {
    it('should execute all targeted middleware', () => {
      const initialValue = { a: 'b' };
      const firstResult = { c: 'd' };
      const secondResult = { e: 'f' };
      const context = { y: 'z' };
      const firstMiddleware = spy(() => firstResult);
      const secondMiddleware = spy(() => secondResult);

      const transformedValue = Transformer.apply(
        initialValue,
        [
          [Phase.REQUEST, firstMiddleware],
          [Phase.EVALUATE, expect.fail as any],
          [Phase.REQUEST, secondMiddleware],
          [Phase.PARSE, expect.fail as any],
        ],
        Phase.REQUEST,
        context
      );

      expect(transformedValue).to.eq(secondResult);
      expect(firstMiddleware).to.be.calledWithExactly(initialValue, context);
      expect(secondMiddleware).to.be.calledWithExactly(firstResult, context);
    });
  });
});
