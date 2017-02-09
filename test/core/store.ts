import { expect } from 'chai';
import { Store } from '../../src/core';

describe('Store', () => {
  let store: Store;

  beforeEach(() => store = new Store());

  describe('set()', () => {
    it('should be able to set value', () => {
      store.set('someValue', 'thing');

      expect(store.map).to.eql({ someValue: 'thing' });
    });
  });

  describe('get()', () => {
    it('should be able to get value', () => {
      store.map.otherValue = 'this';

      expect(store.get('otherValue')).to.eq('this');
    });

    it('should be able to get undefined value', () => {
      expect(store.get('nonexistent')).to.be.undefined;
    });

    it('should be able to get value from parent', () => {
      store.map.parentValue = 'other';

      const childStore = new Store(store);

      expect(childStore.get('parentValue')).to.eq('other');
    });

    it('should be able to get undefined value from parent', () => {
      const childStore = new Store(store);

      expect(childStore.get('nonexistent')).to.be.undefined;
    });
  });

  describe('setParent()', () => {
    it('should be able to set the parent', () => {
      store.map.init = 'late';

      const childStore = new Store();
      childStore.setParent(store);

      expect(childStore.get('init')).to.eq('late');
    });
  });
});
