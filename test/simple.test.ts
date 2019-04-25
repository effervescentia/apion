import { expect } from 'chai';
import * as fetchMock from 'fetch-mock';
import { equals } from 'ramda';

import { build } from 'mocha-suite';
import * as apion from '../src/simple';
import suite from './suite';

const CUSTOMER = 'mycustomer';
const EMAIL = 'myEmail@test.com';
const PASSWORD = 'myPassword';
const TOKEN = 'abc123!@#';

suite.only('Simple', () => {
  it('should create a complex client', async () => {
    const mock = fetchMock
      .sandbox()
      .post(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/login` &&
          equals(opts.headers, { 'Content-Type': 'application/json' }) &&
          equals(JSON.parse(opts.body as string), { email: EMAIL, password: PASSWORD }),
        200
      )
      .get(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/admin/v2/grove` &&
          equals(opts.headers, { 'Content-Type': 'application/json', Authorization: TOKEN }),
        200
      )
      .post(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/proxy/search` &&
          equals(opts.headers, { 'Content-Type': 'application/json', Authorization: TOKEN }) &&
          equals(JSON.parse(opts.body as string), {
            query: 'shoe',
            fields: ['title', 'price'],
            pageSize: 2,
          }),
        200
      );

    const jsonConfig = apion
      .config()
      .headers({ 'Content-Type': 'application/json' })
      .formatter((body) => (typeof body === 'string' ? body : JSON.stringify(body)))
      .parser((body) => {
        try {
          return typeof body === 'string' ? JSON.parse(body) : body;
        } catch (e) {
          console.error(e);
          throw new Error('unable to parse body as JSON');
        }
      });

    const adminConfig = apion.config().path('admin/v2');
    const merchandisingConfig = apion.config().path('api/v2');

    const login = apion
      .action('login', (email: string, password: string) => (api) => api.body({ email, password }))
      .use(jsonConfig)
      .use(merchandisingConfig)
      .path('login')
      .post();

    const grove = apion
      .action('grove')
      .use(jsonConfig)
      .use(adminConfig)
      .path('grove');

    const simpleSearchBuilder = apion.builder().with<'query', [string]>('query');

    const searchPreviewBuilder = apion
      .builder()
      .use(simpleSearchBuilder)
      .with<'collection', [string]>('collection')
      .with('fields', (...fields: string[]) => ({ fields }))
      .with<'pageSize', [number]>('pageSize');

    const searchPreview = apion
      .action('searchPreview', searchPreviewBuilder)
      .use(jsonConfig)
      .use(merchandisingConfig)
      .path('proxy/search')
      .post();

    const auth = apion
      .group('auth', (token: string) => ({ token }))
      .headers((headers, { token }) => ({ ...headers, Authorization: token }))
      .nest(grove)
      .nest('search', searchPreview);

    const root = apion
      .group('groupby', (customer: string) => ({ customer }))
      .url((_, { customer }) => `https://${customer}.groupbycloud.com`)
      .nest(login)
      .nest(auth);

    const client: any = root.build(mock);
    const configuredClient = client(CUSTOMER);

    const loginRes = await configuredClient.login(EMAIL, PASSWORD);
    expect(loginRes.ok).to.be.true;

    const authClient = configuredClient.auth(TOKEN);

    const groveRes = await authClient.grove();
    expect(groveRes.ok).to.be.true;

    const searchRes1 = await authClient.search((builder: any) =>
      builder
        .query('shoe')
        .fields('title', 'price')
        .pageSize(2)
    );
    const searchRes2 = await authClient.search((builder: any) =>
      builder
        .query('shoe')
        .fields('title', 'price')
        .pageSize(2)
        .build()
    );
    const searchRes3 = await authClient.search({ query: 'shoe', fields: ['title', 'price'], pageSize: 2 });

    expect(searchRes1.ok).to.be.true;
    expect(searchRes2.ok).to.be.true;
    expect(searchRes3.ok).to.be.true;
  });
});
