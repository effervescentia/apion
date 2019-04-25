import { expect } from 'chai';
import * as fetchMock from 'fetch-mock';
import { equals } from 'ramda';

import * as apion from '../src';
import ConfigBuilder from '../src/builders/client/config';
import { Header } from '../src/constants';
import { json } from '../src/helpers';
import suite from './suite';

const CUSTOMER = 'mycustomer';
const EMAIL = 'myEmail@test.com';
const PASSWORD = 'myPassword';
const TOKEN = 'abc123!@#';
const SOURCE_AREA = 'sourceArea';
const TARGET_AREA = 'targetArea';
const FIELD = 'myField';

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
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/admin/area/promote` &&
          equals(opts.headers, { [Header.CONTENT_TYPE]: 'application/json', authorization: TOKEN }) &&
          equals(JSON.parse(opts.body as string), { source: SOURCE_AREA, target: TARGET_AREA }),
        200
      )
      .get(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/admin/user/_validate` &&
          equals(opts.headers, { authorization: TOKEN }),
        200
      )
      .get(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/admin/v2/collections` &&
          equals(opts.headers, { authorization: TOKEN }),
        200
      )
      .get(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/autocomplete/fields` &&
          equals(opts.headers, { authorization: TOKEN }),
        200
      )
      .get(
        (url, opts) =>
          url === `https://${CUSTOMER}.groupbycloud.com/api/v2/autocomplete/values` &&
          equals(opts.headers, { [Header.CONTENT_TYPE]: 'application/json', authorization: TOKEN }) &&
          equals(JSON.parse(opts.body as string), { area: SOURCE_AREA, field: FIELD }),
        200
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
    const merchandisingPath = apion.config().path('api/v2');
    const merchandisingAdminPath = apion
      .config()
      .use(merchandisingPath)
      .path('admin');
    const tokenAuth: (ctx: any) => ConfigBuilder<any, string> = ({ token }: { token: string }) =>
      apion.config().headers({ Authorization: token });

    const adminConfig = apion
      .config()
      .use(adminPath)
      .use(tokenAuth);
    const merchandisingConfig = apion
      .config()
      .use(merchandisingPath)
      .use(tokenAuth);
    const merchandisingAdminConfig = apion
      .config()
      .use(merchandisingAdminPath)
      .use(tokenAuth);

    const login = apion
      .action('login', (email: string, password: string) => (api) => api.body({ email, password }))
      .use(json)
      .use(merchandisingPath)
      .path('login')
      .post();

    const validatePassword = apion
      .action('validatePassword', (password: string) => (api) => api.body(password))
      .use(merchandisingPath)
      .path('password/validate')
      .post();

    const grove = apion
      .action('grove')
      .use(json)
      .use(adminConfig)
      .path('grove');

    const promote = apion
      .action('promote', (source: string, target: string) => (api) => api.body({ source, target }))
      .use(json)
      .use(merchandisingAdminConfig)
      .path('area/promote')
      .post();

    const simpleSearchBuilder = apion.builder().with<'query', [string]>('query');

    const searchPreviewBuilder = apion
      .builder()
      .use(simpleSearchBuilder)
      .with<'collection', [string]>('collection')
      .with('fields', (...fields: string[]) => ({ fields }))
      .with<'pageSize', [number]>('pageSize');

    const searchPreview = apion
      .action('searchPreview', searchPreviewBuilder)
      .use(json)
      .use(merchandisingConfig)
      .path('proxy/search')
      .post();

    const validateToken = apion
      .action('validateToken')
      .use(merchandisingAdminConfig)
      .path('user/_validate');

    const adminCollections = apion
      .action('collections')
      .use(adminConfig)
      .path('collections');

    const productAttributes = apion
      .action('productAttributes')
      .use(merchandisingConfig)
      .path('autocomplete/fields');

    const productAttributeValues = apion
      .action('productAttributeValues', (area: string, field: string) => (api) => api.body({ area, field }))
      .use(json)
      .use(merchandisingConfig)
      .path('autocomplete/values');

    const auth = apion
      .group('auth', (token: string) => ({ token }))
      .nest(grove)
      .nest(promote)
      .nest('search', searchPreview)
      .nest('validate', validateToken)
      .nest(adminCollections)
      .nest(productAttributes)
      .nest(productAttributeValues);

    const root = apion
      .group('groupby', (customer: string) => ({ customer }))
      .url((_, { customer }) => `https://${customer}.groupbycloud.com`)
      .nest(login)
      .nest(validatePassword)
      .nest(auth);

    const client: any = root.build(mock);

    const configuredClient = client(CUSTOMER);

    expect(Object.keys(configuredClient)).to.have.members(['login', 'validatePassword', 'auth']);

    const loginRes = await configuredClient.login(EMAIL, PASSWORD);
    expect(loginRes).to.eql({ status: 200, body: '', headers: {}, ok: true });

    const validatePwdRes = await configuredClient.validatePassword(PASSWORD);
    expect(validatePwdRes.ok).to.be.true;

    const authClient = configuredClient.auth(TOKEN);

    expect(Object.keys(authClient)).to.have.members([
      'grove',
      'promote',
      'search',
      'validate',
      'collections',
      'productAttributes',
      'productAttributeValues',
    ]);

    const groveRes = await authClient.grove();
    expect(groveRes).to.eql({
      status: 200,
      body: { grove: 'some_grove' },
      headers: { 'content-length': '22' },
      ok: true,
    });

    const promoteRes = await authClient.promote(SOURCE_AREA, TARGET_AREA);
    expect(promoteRes.ok).to.be.true;

    const validateRes = await authClient.validate();
    expect(validateRes.ok).to.be.true;

    const collectionsRes = await authClient.collections();
    expect(collectionsRes.ok).to.be.true;

    const productAttributesRes = await authClient.productAttributes();
    expect(productAttributesRes.ok).to.be.true;

    const productAttributeValuesRes = await authClient.productAttributeValues(SOURCE_AREA, FIELD);
    expect(productAttributeValuesRes.ok).to.be.true;

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
