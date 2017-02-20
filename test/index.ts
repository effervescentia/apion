import { expect } from 'chai';
import * as pkg from '../src';
import Apion from '../src/apion';
import { Context, Entity, Store } from '../src/core';

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
