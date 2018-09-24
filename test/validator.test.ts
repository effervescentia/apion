import suite from './suite';

import { Phase } from '../src/types';

import Validator from '../src/validator';

suite('Validator', ({ expect, spy }) => {
  describe('apply()', () => {
    const value = { a: 'b' };
    const context = { y: 'z' };

    it('should execute all targeted validators', () => {
      const firstValidator = spy(() => true);
      const secondValidator = spy(() => true);

      const isValid = Validator.apply(
        value,
        [
          [Phase.VALIDATE, firstValidator],
          [Phase.EVALUATE, expect.fail as any],
          [Phase.VALIDATE, secondValidator],
          [Phase.PARSE, expect.fail as any],
        ],
        Phase.VALIDATE,
        context
      );

      expect(isValid).to.be.true;
      expect(firstValidator).to.be.calledWithExactly(value, context);
      expect(secondValidator).to.be.calledWithExactly(value, context);
    });

    it('should stop executing on a failing validator', () => {
      const firstValidator = spy(() => false);

      const isValid = Validator.apply(
        value,
        [
          [Phase.VALIDATE, firstValidator],
          [Phase.EVALUATE, expect.fail as any],
          [Phase.VALIDATE, expect.fail as any],
          [Phase.PARSE, expect.fail as any],
        ],
        Phase.VALIDATE,
        context
      );

      expect(isValid).to.eq(Validator.DEFAULT_ERROR);
      expect(firstValidator).to.be.calledWithExactly(value, context);
    });

    it('should return custom error message from validator', () => {
      const error = 'some error message';

      const isValid = Validator.apply(
        value,
        [
          [Phase.VALIDATE, () => error],
          [Phase.EVALUATE, expect.fail as any],
          [Phase.VALIDATE, expect.fail as any],
          [Phase.PARSE, expect.fail as any],
        ],
        Phase.VALIDATE,
        context
      );

      expect(isValid).to.eq(error);
    });
  });
});
