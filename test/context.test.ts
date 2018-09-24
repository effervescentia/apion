import * as sinon from 'sinon';

import { Header, Method, Mode, Phase, Referrer, ReferrerPolicy, Request } from '../src/types';
import suite from './suite';

import Context from '../src/context';

suite('Context', ({ expect, spy, stub }) => {
  const contextSelf = { a: 'b' };
  const middleware: any = () => null;

  describe('$instance', () => {
    let context: Context<any>;

    beforeEach(() => {
      context = new Context();
    });

    it('should have initial propertis', () => {
      expect(context.middleware).to.eql([]);
    });

    describe('use()', () => {
      it('should add REQUEST middleware', () => {
        context.use(middleware);

        expect(context.middleware).to.eql([[Phase.REQUEST, middleware]]);
      });

      it('should add middleware for provided phase', () => {
        const phase = Phase.PARSE;

        context.use(phase, middleware);

        expect(context.middleware).to.eql([[phase, middleware]]);
      });
    });

    describe('validation()', () => {
      itShouldAddMiddleware(() => context.validation(middleware), Phase.VALIDATE);
    });

    describe('formatter()', () => {
      itShouldAddMiddleware(() => context.formatter(middleware), Phase.FORMAT);
    });

    describe('parser()', () => {
      itShouldAddMiddleware(() => context.parser(middleware), Phase.PARSE);
    });

    describe('evaluation()', () => {
      itShouldAddMiddleware(() => context.evaluation(middleware), Phase.EVALUATE);
    });

    describe('handle()', () => {
      itShouldAddMiddleware(() => context.handle(middleware), Phase.RESPONSE);
    });

    describe('configure()', () => {
      it('should pass self to configurator', () => {
        const configurator = spy();

        expect(context.configure(configurator)).to.eq(context);
        expect(configurator).to.be.calledWithExactly(context);
      });
    });

    describe('headers()', () => {
      it('should add request transformer middleware with headers object', () => {
        const headers = { c: 'd' };
        const set = spy();

        expectRequestTransformerAdded(() => context.headers(headers), 'headers', { set }, () =>
          expect(set).to.be.calledWithExactly(headers)
        );
      });

      it('should add request transformer middleware with headers object', () => {
        const originalHeaders = { e: 'f' };
        const ctx = { g: 'h' };
        const headers = spy();

        expectRequestTransformerAdded(() => context.headers(headers), 'headers', originalHeaders, () =>
          expect(headers).to.be.calledWithExactly(originalHeaders, ctx)
        );
      });
    });

    describe('method()', () => {
      it('should override request method', () => {
        expectRequestOverrideAdded(() => context.method(Method.GET), 'method', Method.GET);
      });
    });

    describe('mode()', () => {
      it('should override request mode', () => {
        expectRequestOverrideAdded(() => context.mode(Mode.NO_CORS), 'mode', Mode.NO_CORS);
      });
    });

    describe('referrer()', () => {
      it('should override request referrer', () => {
        expectRequestOverrideAdded(() => context.referrer(Referrer.CLIENT), 'referrer', Referrer.CLIENT);
      });
    });

    describe('referrerPolicy()', () => {
      it('should override request referrerPolicy', () => {
        expectRequestOverrideAdded(
          () => context.referrerPolicy(ReferrerPolicy.ORIGIN),
          'referrerPolicy',
          ReferrerPolicy.ORIGIN
        );
      });
    });

    describe('get()', () => {
      it('should set request method to GET', () => {
        expectMethod(() => context.get(), Method.GET);
      });
    });

    describe('post()', () => {
      it('should set request method to POST', () => {
        expectMethod(() => context.post(), Method.POST);
      });
    });

    describe('put()', () => {
      it('should set request method to PUT', () => {
        expectMethod(() => context.put(), Method.PUT);
      });
    });

    describe('patch()', () => {
      it('should set request method to PATCH', () => {
        expectMethod(() => context.patch(), Method.PATCH);
      });
    });

    describe('head()', () => {
      it('should set request method to HEAD', () => {
        expectMethod(() => context.head(), Method.HEAD);
      });
    });

    describe('trace()', () => {
      it('should set request method to TRACE', () => {
        expectMethod(() => context.trace(), Method.TRACE);
      });
    });

    describe('options()', () => {
      it('should set request method to OPTIONS', () => {
        expectMethod(() => context.options(), Method.OPTIONS);
      });
    });

    describe('json()', () => {
      const headers = { z: 'y' };
      let use: sinon.SinonSpy;

      beforeEach(() => (use = context.use = spy(() => contextSelf)));

      it('should add header and format body', () => {
        const body = { a: 'B', c: 'D' };
        const add = spy(() => headers);

        expect(context.json()).to.eq(contextSelf);
        expect(use).to.be.calledWithExactly(
          sinon.match((cb) => {
            const transformed = cb({ body, w: 'x', headers: { add } });

            expect(add).to.be.calledWithExactly(Header.CONTENT_TYPE, 'application/json');
            return expect(transformed).to.eql({ headers, w: 'x', body: '{"a":"B","c":"D"}' });
          })
        );
      });

      it('should not format body if string', () => {
        const body = 'ok';

        context.json();

        expect(use).to.be.calledWithExactly(
          sinon.match((cb) => {
            const transformed = cb({ body, w: 'x', headers: { add: () => headers } });

            return expect(transformed).to.eql({ headers, body, w: 'x' });
          })
        );
      });
    });

    function expectMethod(fn: () => void, method: Method) {
      const methodStub = (context.method = spy(() => contextSelf));

      expect(fn()).to.eq(contextSelf);
      expect(methodStub).to.be.calledWithExactly(method);
    }

    function expectRequestTransformerAdded(
      fn: () => void,
      key: keyof Request,
      requestPart: any,
      test: (requestPart: any, ctx: any) => void
    ) {
      const ctx = { g: 'h' };
      const transform = stub(Context, 'transform').returns(contextSelf);

      expect(fn()).to.eq(contextSelf);
      expect(transform).to.be.calledWithExactly(
        context,
        key,
        sinon.match((cb) => {
          cb(requestPart, ctx);

          try {
            test(requestPart, ctx);

            return true;
          } catch {
            return false;
          }
        })
      );
    }

    function expectRequestOverrideAdded(fn: () => void, key: keyof Request, value: any) {
      const transform = stub(Context, 'transform').returns(contextSelf);

      expect(fn()).to.eq(contextSelf);
      expect(transform).to.be.calledWithExactly(context, key, value);
    }

    function itShouldAddMiddleware(fn: () => void, phase: Phase) {
      it(`should add ${phase} middleware`, () => {
        const use = (context.use = spy(() => contextSelf));

        expect(fn()).to.eq(contextSelf);
        expect(use).to.be.calledWithExactly(phase, middleware);
      });
    }
  });

  describe('$static', () => {
    describe('transform()', () => {
      const key = 'method';
      const value = 'abc';
      let use: sinon.SinonSpy;

      beforeEach(() => (use = spy(() => contextSelf)));

      it('should add request transformer middleware', () => {
        const ctx = { y: 'z' };
        const originalValue = 143;
        const transformer = spy(() => value);

        expect(Context.transform({ use } as any, key, transformer)).to.eq(contextSelf);
        expect(use).to.be.calledWithExactly(
          sinon.match((cb) => {
            const transformed = cb({ m: 'n', [key]: originalValue }, ctx);

            expect(transformed).to.eql({ m: 'n', [key]: value });
            return expect(transformer).to.be.calledWithExactly(originalValue, ctx);
          })
        );
      });

      it('should add request override middleware', () => {
        Context.transform({ use } as any, key, value);

        expect(use).to.be.calledWithExactly(
          sinon.match((cb) => expect(cb({ m: 'n' })).to.eql({ m: 'n', [key]: value }))
        );
      });
    });
  });
});
