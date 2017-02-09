import { expect } from 'chai';
import 'mocha';
import * as pkg from '../src';
import Apion from '../src/apion';
import Context from '../src/context';
import Entity from '../src/entity';
import Store from '../src/store';

import './apion';
import './context';
import './entities';
import './entity';
import './store';

describe('package', () => {
  it('should expose Apion as the default export', () => {
    expect(pkg.default).to.eq(Apion);
  });

  it('should expose Context', () => {
    expect(pkg.Context).to.eq(Context);
  });

  it('should expose Entity', () => {
    expect(pkg.Entity).to.eq(Entity);
  });

  it('should expose Store', () => {
    expect(pkg.Store).to.eq(Store);
  });
});
