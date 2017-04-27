import Context from '@/context';
import suite from '../suite';

suite('Context', ({ expect }) => {
  let context: Context<any>;

  describe('update()', () => {
    beforeEach(() => (context = new Context<any>().set('abc', 'def')));

    it('should merge with existing context', () => {
      const result = context.update({ ghi: 'jkl' }).resolve();

      expect(result).to.eql({ abc: 'def', ghi: 'jkl' });
    });

    it('should apply updater to existing context', () => {
      const result = context.update(() => ({ ghi: 'jkl' })).resolve();

      expect(result).to.eql({ ghi: 'jkl' });
    });
  });

  describe('resolve()', () => {
    beforeEach(() => (context = new Context<any>().set('abc', 'def')));

    it('should resolve without context or initial value', () => {
      const result = context.resolve();

      expect(result).to.eql({ abc: 'def' });
    });

    it('should resolve with context and without initial value', () => {
      const result = context.resolve({});

      expect(result).to.eql({ abc: 'def' });
    });

    it('should resolve with context and initial value', () => {
      const result = context.resolve({}, { ghi: 'jkl' });

      expect(result).to.eql({ abc: 'def', ghi: 'jkl' });
    });
  });
});
