import { expect } from 'chai';
import Simpler, { Opts, Rendered } from '../src/simpler';

describe.only('simpler', () => {
  describe('builder', () => {

    describe('chain()', () => {
      it('should be return a new instance', () => {
        const root = new Simpler();

        expect(root.chain('child')).to.be.an.instanceof(Simpler);
      });

      it('should register entity', () => {
        const root = new Simpler();
        const child = root.chain('child');

        expect(root.entities).to.eql([child]);
      });

      it('should set child properties', () => {
        const root = new Simpler();
        const child = root.chain('child');

        expect(child.name).to.eq('child');
        expect(child.parent).to.eq(root);
      });
    });

    describe('render()', () => {
      it('should safely render a root client', () => {
        const root = new Simpler().render();

        expect(root).to.be.ok;
        expect(root.parent).to.be.undefined;
      });

      it('should render a client with a child', () => {
        const root = new Simpler();
        root.chain('child');

        const rendered = root.render();

        expect(rendered).to.be.an.instanceof(Rendered);
        expect(rendered['child']).to.be.ok;
        expect(rendered.parent).to.be.undefined;
      });

      it('should render client subtree with inheritance', () => {
        const child = new Simpler().chain('child');

        const rendered = child.render();

        expect(rendered).to.be.an.instanceof(Rendered);
        expect(rendered.parent).to.be.an.instanceof(Rendered);
        expect(Object.keys(rendered)).to.eql(['parent']);
      });

      it('should create unique clients', () => {
        const root = new Simpler();
        root.chain('child');

        const rendered = root.render();

        expect(rendered['child']).not.to.eq(rendered['child']);
        expect(rendered['child']).not.to.eq(rendered['child']());
        expect(rendered['child']()).not.to.eq(rendered['child']());
      });

      it('should render client tree', () => {
        const root = new Simpler();
        const wideChild = root.chain('wide');
        wideChild.chain('a');
        wideChild.chain('b');
        root.chain('deep').chain('x').chain('y').chain('z');

        const rendered = root.render();

        expect(rendered['wide']['a']).to.be.ok;
        expect(rendered['wide']()['a']()).to.be.ok;
        expect(rendered['wide']['b']).to.be.ok;
        expect(rendered['wide']()['b']()).to.be.ok;
        expect(rendered['deep']['x']['y']['z']).to.be.ok;
        expect(rendered['deep']()['x']()['y']()['z']()).to.be.ok;
      });

      it('should inherit parent opts', () => {
        const root = new Simpler();
        Object.assign(root.opts, { a: 'b', c: 'd' });

        const child = root.chain('child');

        expect(child.opts.a).to.eq('b');
      });

      it('should be resilient to switching parent opts', () => {
        const root1 = new Simpler();
        const root2 = new Simpler();
        Object.assign(root1.opts, { a: 'b' });
        Object.assign(root2.opts, { c: 'd' });

        const child = root1.chain('child');
        Object.assign(child.opts, { e: 'f' });

        expect(child.opts.a).to.eq('b');
        expect(child.opts.e).to.eq('f');

        child.parent = root2;

        expect(child.opts.a).to.be.undefined;
        expect(child.opts.c).to.eq('d');
        expect(child.opts.e).to.eq('f');
      });
    });
  });

  describe('client', () => {

  });

  describe('Opts', () => {
    it('should return a mutable object', () => {
      const opts = Opts();

      expect(Object.getOwnPropertyNames(opts)).to.have.members(['getParent', 'setParent']);
      expect(JSON.stringify(opts)).to.eq('{}');

      opts.anything = 'something';

      expect(Object.getOwnPropertyNames(opts)).to.include('anything');
      expect('anything' in opts).to.be.true;
      expect(opts['anything']).to.eq('something');
    });

    it('should inherit from its parent', () => {
      const parent = Opts();
      Object.assign(parent, { a: 'b', c: 'd' });

      expect(Object.getOwnPropertyNames(parent)).to.include.members(['a', 'c']);
      expect(parent.a).to.eq('b');
      expect(parent.c).to.eq('d');

      const opts = Opts(parent);
      Object.assign(opts, { c: 'd1', e: 'f' });

      expect(Object.getOwnPropertyNames(opts)).to.include.members(['a', 'c', 'e']);
      expect(opts.a).to.eq('b');
      expect(opts.c).to.eq('d1');
      expect(opts.e).to.eq('f');
      expect(Object.getOwnPropertyNames(parent)).to.include.members(['a', 'c']);
    });

    it('should be able to switch parents', () => {
      const parent1 = Object.assign(Opts(), { a: 'b' });
      const parent2 = Object.assign(Opts(), { c: 'd' });

      const opts = Opts(parent1);

      expect(opts.a).to.eq('b');

      opts.setParent(parent2);

      expect(opts.a).to.be.undefined;
      expect(opts.c).to.eq('d');
    });

    it('should inherit from multiple parents', () => {
      const parent = Object.assign(Opts(), { a: 'b' });
      const opts = Object.assign(Opts(parent), { c: 'd' });

      const child = Opts(opts);

      expect(child.a).to.eq('b');
      expect(child.c).to.eq('d');
    });
  });
});
