import { Ancestral, Entity } from '../src/render';
import { expect } from './_suite';

describe.only('render', () => {

  describe('Ancestral', () => {
    const PARENT: any = {};

    it('should exist', () => {
      expect(Ancestral).to.be.ok;
    });

    describe('constructor()', () => {
      it('should set the underlying parent', () => {
        const ancestor = new Ancestral(PARENT);

        expect(ancestor['_parent']).to.eq(PARENT);
      });
    });

    describe('get parent()', () => {
      it('should get _parent', () => {
        const ancestor = new Ancestral(PARENT);

        expect(ancestor.parent).to.eq(PARENT);
      });
    });

    describe('set parent()', () => {
      it('should set _parent', () => {
        const ancestor = new Ancestral();

        ancestor.parent = PARENT;

        expect(ancestor['_parent']).to.eq(PARENT);
      });
    });
  });

  describe('Entity', () => {
    describe('renderAbove()', () => {
      it('should render all parents', () => {
        const grandParent = new Entity();
        Object.assign(grandParent.thing, { a: 1, b: 1, c: 1 });
        const parent = new Entity(grandParent);
        Object.assign(parent.thing, { a: 2, d: 1 });
        const entity = new Entity(parent);
        Object.assign(entity.thing, { b: 2, e: 1 });

        expect(new Entity(entity).renderAbove()).to.eql({ a: 2, b: 2, c: 1, d: 1, e: 1 });
      });

      it('should render named entities', () => {
        const root = new Entity();
        const named = new Entity(root);
        Object.assign(named.thing, { a: 1, b: 1 });
        named.name = 'something';

        const rendered = new Entity(named).renderAbove();

        expect(rendered.something).to.be.a('function');
        expect(rendered.something.a).to.eq(1);
        expect(rendered.something().a).to.eq(1);
        expect(rendered.something().b).to.eq(1);
      });
    });

    describe('renderSelf()', () => {
      it('should return rendered entity', () => {
        const mixin = { a: 1, b: 1 };
        const entity = new Entity();
        Object.assign(entity.thing, mixin);

        expect(entity.renderSelf()).to.eql(mixin);
      });
    });

    describe('renderSubtree()', () => {
      it('should render the entity and all of its subtrees', () => {
        const root = new Entity();
        const branch1 = new Entity(root);
        branch1.name = 'branch1';
        const branch2 = new Entity(root);
        branch2.name = 'branch2';
        root.entities.push(branch1, branch2);

        const rendered = root.renderSubtree();


      });
    });
  });
});
