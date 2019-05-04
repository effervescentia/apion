import { Instance } from '@/builders/request';
import suite from '../../suite';

suite('Request Builder Instance', ({ expect }) => {
  describe('build()', () => {
    it('should return undefined if no transforms registered', () => {
      class BuilderInstance extends Instance<any> {}

      expect(new BuilderInstance().build()).to.be.undefined;
    });
  });
});
