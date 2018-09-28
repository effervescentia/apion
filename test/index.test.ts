import suite from './suite';

import Builder from '../src/builder';
import { ActionClient } from '../src/client';

suite('Client Creation', ({ expect, spy }) => {
  it('should encode body and send request using resolver', () => {
    const resolver = spy();
    const builder = new Builder();

    builder
      .add('search', 'api/v1/search', (clientKey: string, query: object) => ({ clientKey, query }))
      .json()
      .use((req, ctx) => ({ ...req, body: { ...ctx.query, clientKey: ctx.clientKey } }));

    const client = builder.build(resolver);
    client.all.post();
    // client.interface
    (client.actions as { search: ActionClient<[string, { pageSize: number }], {}> }).search.exec('clientKey', {
      pageSize: 10,
    });

    expect(spy).to.be.calledWithExactly();
  });

  it('should create search client', () => {
    const resolver = spy();
    const builder = new Builder();

    builder.all.json();

    builder
      .add('search', 'api/v1/search', (clientKey: string, query: object) => ({ clientKey, query }))
      .post()
      .validation(({ body }) => body !== null || 'query was not of a recognized type')
      .body(({ query, clientKey }) => ({ ...query, clientKey }));

    builder
      .add('refinements', 'api/v1/refinements', (clientKey: string, query: object, navigationName: string) => ({
        clientKey,
        query,
        navigationName,
      }))
      .post()
      .body(({ query: originalQuery, clientKey, navigationName }) => ({ originalQuery, navigationName, clientKey }));

    const MyClient = builder.build(resolver);
    const client = new MyClient('XXX' /* clientKey */);

    client.$search();
    client.$search.exec();
  });
});
