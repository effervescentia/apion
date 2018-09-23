import suite from './suite';

import * as ClientModule from '../src/client';
import Context from '../src/context';

import Builder, * as BuilderModule from '../src/builder';

suite('Builder', ({ expect, spy, stub }) => {
  describe('inheritance', () => {
    it('should extend Context', () => {
      expect(new Builder()).to.be.an.instanceof(Context);
    });
  });

  describe('$instance', () => {
    const clientInstance = { a: 'b' };
    let builder: Builder;
    let clientStub: sinon.SinonStub;

    beforeEach(() => {
      builder = new Builder();
      clientStub = stub(ClientModule, 'default').returns(clientInstance);
    });

    it('should have initial properties', () => {
      expect(builder.context).to.be.an.instanceof(Context);
      expect(builder.actions).to.eql({});
      expect(builder.routes).to.eql({});
    });

    describe('constructor()', () => {
      it('should store parent on instance', () => {
        const parent: any = { a: 'b' };

        builder = new Builder(parent);

        expect(builder.parent).to.eq(parent);
      });

      it('should store constructor on instance', () => {
        const constructor: any = () => null;

        builder = new Builder(undefined, constructor);

        expect(builder.constructor).to.eq(constructor);
      });
    });

    describe('action()', () => {
      const path = 'myPath';
      const constructor = () => ({ e: 'f' });
      const mockBuilder = { c: 'd' };

      it('should construct builder', () => {
        const builderStub = stub(BuilderModule, 'default').returns(mockBuilder);

        expect(builder.action(path, constructor)).to.eq(mockBuilder);
        expect(builderStub).to.be.calledWithExactly(builder, constructor);
      });

      it('should register builder', () => {
        const registerAction = (builder['registerAction'] = spy());
        stub(BuilderModule, 'default').returns(mockBuilder);

        builder.action(path, constructor);

        expect(registerAction).to.be.calledWithExactly(path, mockBuilder);
      });
    });

    describe('build()', () => {
      it('should return a Client instance', () => {
        const resolver = () => Promise.resolve({});

        expect(builder.build(resolver)).to.be.eq(clientInstance);
        expect(clientStub).to.be.calledWithExactly(builder, resolver);
      });
    });

    describe('registerRoute()', () => {
      it('should add builder to route dict', () => {
        const route = 'myRoute';
        const childBuilder: any = { a: 'b' };

        builder['registerRoute'](route, childBuilder);

        expect(builder.routes[route]).to.eq(childBuilder);
      });
    });

    describe('registerAction()', () => {
      it('should add path to actions', () => {
        const route = 'myRoute';
        const childBuilder: any = { a: 'b' };

        builder['registerAction'](route, childBuilder);

        expect(builder.actions[route]).to.eq(childBuilder);
      });
    });
  });
});
