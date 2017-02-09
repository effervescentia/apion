import { expect } from 'chai';
import Context from '../src/context';

describe('Context', () => {
  let context: Context;

  beforeEach(() => context = new Context());

  it('should inherit fields from parent', () => {
    context.fields.set('fieldKey', 'fieldValue');

    const childContext = new Context(context);

    expect(childContext.fields.get('fieldKey')).to.eq('fieldValue');
  });

  it('should inherit params from parent', () => {
    context.params.set('paramKey', 'paramValue');

    const childContext = new Context(context);

    expect(childContext.params.get('paramKey')).to.eq('paramValue');
  });

  it('should inherit query from parent', () => {
    context.query.set('queryKey', 'queryValue');

    const childContext = new Context(context);

    expect(childContext.query.get('queryKey')).to.eq('queryValue');
  });

  it('should inherit headers from parent', () => {
    context.headers.set('headerKey', 'headerValue');

    const childContext = new Context(context);

    expect(childContext.headers.get('headerKey')).to.eq('headerValue');
  });

  it('should inherit cookies from parent', () => {
    context.cookies.set('cookieKey', 'cookieValue');

    const childContext = new Context(context);

    expect(childContext.cookies.get('cookieKey')).to.eq('cookieValue');
  });
});
