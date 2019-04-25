import { expect } from 'chai';
import * as fetchMock from 'fetch-mock';
import { equals } from 'ramda';

import * as apion from '../src';
import { Header } from '../src/constants';
import { json } from '../src/helpers';
import suite from './suite';

const CUSTOMER = 'mycustomer';
const EMAIL = 'myEmail@test.com';
const PASSWORD = 'myPassword';
const TOKEN = 'abc123!@#';

suite('Apion', () => {
  it('should create a complex client', async () => {
    const mock = fetchMock
      .sandbox()
      .post(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/login` &&
          equals(opts.headers, { [Header.CONTENT_TYPE]: 'application/json' }) &&
          equals(JSON.parse(opts.body as string), { email: EMAIL, password: PASSWORD }),
        200
      )
      .post(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/password/validate` && opts.body === PASSWORD,
        200
      )
      .get(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/admin/v2/grove` &&
          equals(opts.headers, { [Header.CONTENT_TYPE]: 'application/json', authorization: TOKEN }),
        { status: 200, body: JSON.stringify({ grove: 'some_grove' }) }
      )
      .post(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/proxy/search` &&
          equals(opts.headers, { [Header.CONTENT_TYPE]: 'application/json', authorization: TOKEN }) &&
          equals(JSON.parse(opts.body as string), {
            query: 'shoe',
            fields: ['title', 'price'],
            pageSize: 2,
          }),
        200
      );

    const adminPath = apion.config().path('admin/v2');
    // const merchandisingPath = apion.config().path('api/v2');
    const tokenAuth = ({ token }: { token: string } = { token: 'abc' }) =>
      apion.config<{ token: string }>().headers({ Authorization: token });

    // const login = apion
    //   .action('login', (email: string, password: string) => (api) => api.body({ email, password }))
    //   .use(json)
    //   .use(merchandisingPath)
    //   .path('login')
    //   .post();

    // const validatePassword = apion
    //   .action('validatePassword', (password: string) => (api) => api.body(password))
    //   .use(merchandisingPath)
    //   .path('password/validate')
    //   .post();

    const grove = apion
      .action('grove')
      .use(json)
      .use(adminPath)
      .use(tokenAuth)
      .path('grove');

    // const simpleSearchBuilder = apion.builder().with<'query', [string]>('query');

    // const searchPreviewBuilder = apion
    //   .builder()
    //   .use(simpleSearchBuilder)
    //   .with<'collection', [string]>('collection')
    //   .with('fields', (...fields: string[]) => ({ fields }))
    //   .with<'pageSize', [number]>('pageSize');

    // const searchPreview = apion
    //   .action('searchPreview', searchPreviewBuilder)
    //   // .use(json)
    //   // .use(merchandisingPath)
    //   .use(tokenAuth);
    // // .path('proxy/search')
    // // .post();

    const auth = apion.group('auth', (token: string) => ({ token })).nest(grove);
    // .nest('search', searchPreview);

    const root = apion
      .group('groupby', (customer: string) => ({ customer }))
      .url((_, { customer }) => `https://${customer}.groupbycloud.com`)
      // .nest(login)
      // .nest(validatePassword)
      .nest(auth);

    const client: any = root.build(mock);

    const configuredClient = client(CUSTOMER);

    // expect(Object.keys(configuredClient)).to.have.members(['login', 'validatePassword', 'auth']);

    // const loginRes = await configuredClient.login(EMAIL, PASSWORD);
    // expect(loginRes).to.eql({ status: 200, body: '', headers: {}, ok: true });

    // const validatePwdRes = await configuredClient.validatePassword(PASSWORD);
    // expect(validatePwdRes.ok).to.be.true;

    const authClient = configuredClient.auth(TOKEN);

    // expect(Object.keys(authClient)).to.have.members(['grove', 'search']);

    debugger;
    const groveRes = await authClient.grove();
    expect(groveRes).to.eql({
      status: 200,
      body: { grove: 'some_grove' },
      headers: { 'content-length': '22' },
      ok: true,
    });

    // const searchRes1 = await authClient.search((builder: any) =>
    //   builder
    //     .query('shoe')
    //     .fields('title', 'price')
    //     .pageSize(2)
    // );
    // const searchRes2 = await authClient.search((builder: any) =>
    //   builder
    //     .query('shoe')
    //     .fields('title', 'price')
    //     .pageSize(2)
    //     .build()
    // );
    // const searchRes3 = await authClient.search({ query: 'shoe', fields: ['title', 'price'], pageSize: 2 });

    // expect(searchRes1.ok).to.be.true;
    // expect(searchRes2.ok).to.be.true;
    // expect(searchRes3.ok).to.be.true;
  });
});
