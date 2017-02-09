import { expect } from 'chai';
import { Context, Entity } from '../../src/core';

describe('Entity', () => {
  let entity: Entity;

  beforeEach(() => entity = new Entity(''));

  it('should inherit context from parent', () => {
    entity.ctx.params.set('paramKey', 'paramValue');

    const childEntity = new Entity('', entity);

    expect(childEntity.ctx.params.get('paramKey')).to.eq('paramValue');
  });

  describe('method()', () => {
    it('should set method in the context', () => {
      entity.method('GET');

      expect(entity.ctx.method).to.eq('GET');
    });

    itShouldBeChainable('method');
  });

  testUpdateStore('field');

  testOverrideStore('fields');

  testUpdateStore('param');

  testOverrideStore('params');

  testUpdateStore('queryParam', 'query');

  testOverrideStore('query');

  testUpdateStore('header');

  testOverrideStore('headers');

  function testUpdateStore(method: keyof Entity, store: keyof Context = <any>`${method}s`) {
    describe(`${method}()`, () => {
      it('should set a header in the context', () => {
        (<any>entity[method])('key', 'value');

        expect(entity.ctx[store].map).to.eql({ key: 'value' });
      });

      itShouldBeChainable(method);
    });
  }

  function testOverrideStore(method: keyof Entity, store: keyof Context = <any>method) {
    describe(`${method}()`, () => {
      it('should override in context', () => {
        const override = { key: 'value' };
        (<any>entity[method])(override);

        expect(entity.ctx[store].map).to.eq(override);
      });

      itShouldBeChainable(method);
    });
  }

  function itShouldBeChainable(method: keyof Entity) {
    it('should be chainable', () => {
      expect((<any>entity[method])()).to.eq(entity);
    });
  }
});
