import { expect } from 'chai';
import Collection from '../../src/entities/collection';
import Resource from '../../src/entities/resource';

describe('Collection', () => {
  let collection: Collection;

  beforeEach(() => collection = new Collection(''));

  it('should extend Resource', () => {
    expect(collection).to.be.an.instanceof(Resource);
  });

  describe('collection()', () => {
    it('should return an Entity', () => {
      expect(collection.collection('')).to.be.an.instanceof(Collection);
    });
  });

  describe('resource()', () => {
    it('should return an Entity', () => {
      expect(collection.resource('thing')).to.be.an.instanceof(Resource);
    });
  });
});
