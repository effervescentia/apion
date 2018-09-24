import suite from './suite';

import Builder from '../src/builder';

suite('Client Creation', ({ expect, spy }) => {
  it('should encode body and send request using resolver', () => {
    const resolver = spy();
    const builder = new Builder();

    builder
      .action('search', (clientKey: string, query: object) => ({ clientKey, query }))
      .headers({ 'content-type': 'application/json' })
      .use((req, ctx) => ({ ...req, body: { ...ctx.query, clientKey: ctx.clientKey } }));

    const client = builder.build(resolver);
    client.post().actions.search('clientKey', {});

    expect(spy).to.be.calledWithExactly();
  });
});
