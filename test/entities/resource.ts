import { expect } from 'chai';
import Resource from '../../src/entities/resource';
import Entity from '../../src/entity';

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
