import { Context, Store } from '../../src/core';
import { INHERITABLE } from '../../src/core/context';
import * as utils from '../../src/utils';
import { expect, sinon } from '../_suite';

describe('Context', () => {
  let context: Context;

  beforeEach(() => context = new Context());
  afterEach(() => sinon.restore());

  it('should have initial values', () => {
    expect(context.body).to.be.null;
    expect(context.method).to.be.null;
    expect(context.auth).to.be.undefined;
    expect(context.fields).to.be.an.instanceof(Store);
    expect(context.params).to.be.an.instanceof(Store);
    expect(context.query).to.be.an.instanceof(Store);
    expect(context.headers).to.be.an.instanceof(Store);
    expect(context.cookies).to.be.an.instanceof(Store);
    expect(context.middleware).to.eql([]);
  });

  it('should set parent', () => {
    const childContext = new Context(context);

    expect(childContext.parent).to.eq(context);
  });

  it('should extend inheritable stores', () => {
    const extend = sinon.stub(utils, 'extend');

    const childContext = new Context(context);

    expect(extend.calledWith(childContext, context, INHERITABLE)).to.be.true;
  });

  it('should extend inheritable stores on setting a new parent', () => {
    const childContext = new Context();
    const extend = sinon.stub(utils, 'extend');

    childContext.parent = context;

    expect(extend.calledWith(childContext, context, INHERITABLE)).to.be.true;
  });
});
