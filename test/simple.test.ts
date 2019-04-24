import * as apion from '../src/simple';
import suite from './suite';

suite.only('Simple', () => {
  it('should create a client', () => {
    const root = apion.group('groupby');
  });
});
