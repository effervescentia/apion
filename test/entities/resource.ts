import { expect } from 'chai';
import { Entity } from '../../src/core';
import Resource from '../../src/entities/resource';

describe('Resource', () => {
  let resource: Resource;

  beforeEach(() => resource = new Resource(''));

  it('should extend Entity', () => {
    expect(resource).to.be.an.instanceof(Entity);
  });

  describe('action()', () => {
    it('should return an Entity', () => {
      expect(resource.action('')).to.be.an.instanceof(Entity);
    });
  });
});
