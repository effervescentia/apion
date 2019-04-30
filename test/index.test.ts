import { expect } from 'chai';
import * as fetchMock from 'fetch-mock';
import { equals } from 'ramda';

import * as apion from '../src';
import ConfigBuilder from '../src/builders/client/config';
import GroupBuilder from '../src/builders/client/group';
import { Header, Method } from '../src/constants';
import { json } from '../src/helpers';
import suite from './suite';

const MOCK_OBJ = { a: 'b' };
const MOCK_ARR = ['a', 'b', 'c'];
const ID = 'someId';
const CUSTOMER = 'mycustomer';
const CUSTOMER_ALT = 'othercustomer';
const EMAIL = 'myEmail@test.com';
const PASSWORD = 'myPassword';
const TOKEN = 'abc123!@#';
const AREA = 'sourceArea';
const TARGET_AREA = 'targetArea';
const FIELD = 'myField';
const JSON_HEADERS = { [Header.CONTENT_TYPE]: 'application/json' };

suite('Apion', () => {
  it('should create a complex client', async () => {
    const mock = fetchMock.sandbox();

    function mockAPI(customer: string) {
      mock
        .post(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/login` &&
            equals(opts.headers, JSON_HEADERS) &&
            equals(JSON.parse(opts.body as string), { email: EMAIL, password: PASSWORD }),
          200
        )
        .post(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/password/validate` && opts.body === PASSWORD,
          200
        )
        .get(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/admin/v2/grove` &&
            equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }),
          { status: 200, body: JSON.stringify({ grove: 'some_grove' }) }
        )
        .post(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/admin/area/promote` &&
            equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
            equals(JSON.parse(opts.body as string), { source: AREA, target: TARGET_AREA }),
          200
        )
        .get(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/admin/user/_validate` &&
            equals(opts.headers, { authorization: TOKEN }),
          200
        )
        .get(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/admin/v2/collections` &&
            equals(opts.headers, { authorization: TOKEN }),
          200
        )
        .get(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/autocomplete/fields` &&
            equals(opts.headers, { authorization: TOKEN }),
          200
        )
        .get(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/autocomplete/values` &&
            equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
            equals(JSON.parse(opts.body as string), { area: AREA, field: FIELD }),
          200
        )
        .mock(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/key` &&
            equals(opts.headers, { authorization: TOKEN }) &&
            (!opts.method || [Method.GET, Method.POST, Method.DELETE].includes(opts.method as any)),
          200
        )
        .post(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/proxy/search` &&
            equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
            equals(JSON.parse(opts.body as string), {
              query: 'shoe',
              fields: ['title', 'price'],
              pageSize: 2,
            }),
          200
        );

      function mockGlobalModel(path: string) {
        return mock
          .get(
            (url, opts) =>
              url === `https://${customer}.groupbycloud.com/api/v2/${path}` &&
              equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }),
            200
          )
          .post(
            (url, opts) =>
              url === `https://${customer}.groupbycloud.com/api/v2/${path}` &&
              equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
              equals(JSON.parse(opts.body as string), MOCK_OBJ),
            200
          )
          .mock(
            (url, opts) =>
              url === `https://${customer}.groupbycloud.com/api/v2/${path}/${ID}` &&
              equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
              (!opts.method || [Method.GET, Method.DELETE].includes(opts.method as any)),
            200
          )
          .put(
            (url, opts) =>
              url === `https://${customer}.groupbycloud.com/api/v2/${path}/${ID}` &&
              equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
              equals(JSON.parse(opts.body as string), MOCK_OBJ),
            200
          );
      }

      function mockNamespacedModel(path: string) {
        return mockGlobalModel(`${AREA}/${path}`).put(
          (url, opts) =>
            url === `https://${customer}.groupbycloud.com/api/v2/${path}` &&
            equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
            equals(JSON.parse(opts.body as string), { models: MOCK_ARR }),
          200
        );
      }

      mockGlobalModel('area');
      mockGlobalModel('user');
      mockNamespacedModel(`${AREA}/rule`);
    }

    mockAPI(CUSTOMER);
    mockAPI(CUSTOMER_ALT);

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

    const addPrimary = apion.action('addPrimary').post();
    const removePrimary = apion.action('removePrimary').delete();
    const getKeys = apion.action('getKeys');

    const key = apion
      .group('key')
      .use(merchandisingConfig)
      .path('key')
      .nest(addPrimary)
      .nest(removePrimary)
      .nest('get', getKeys);

    const get = apion.action('get', (id: string) => (api) => api.path(id));
    const find = apion.action('find');
    const create = apion.action('create', (obj: any) => (api) => api.body(obj)).post();
    const update = apion.action('update', (id: string, obj: any) => (api) => api.path(id).body(obj)).put();
    const remove = apion.action('remove', (id: string) => (api) => api.path(id)).delete();

    const CRUD = <T extends GroupBuilder<any, string, any>>(api: T) =>
      api
        .nest(get)
        .nest(find)
        .nest(create)
        .nest(update)
        .nest(remove);

    const globalModel = (name: string, path = name) =>
      apion
        .group(name)
        .use(json)
        .use(merchandisingConfig)
        .path(path)
        .pipe(CRUD);

    const bulkUpdate = apion.action('bulkUpdate', (models: any[]) => (api) => api.body({ models })).put();

    const namespacedModule = (name: string, path = name) =>
      apion
        .group(name, (area: string) => (api) => api.path(`${area}/${path}`))
        .use(json)
        .use(merchandisingConfig)
        .pipe(CRUD)
        .nest(bulkUpdate);

    const area = globalModel('area');
    const user = globalModel('user');

    // const biasingProfileModel = namespacedModule('biasingProfile');
    // const filterModel = namespacedModule('filter');
    // const matchStrategyModel = namespacedModule('matchStrategy');
    // const navigationModel = namespacedModule('navigation');
    // const phraseModel = namespacedModule('phrase');
    // const redirectModel = namespacedModule('redirect');
    // const relatedQueryModel = namespacedModule('relatedQuery');
    const ruleModel = namespacedModule('rule');

    // const models = <T extends GroupBuilder<any, string, any>>(api: T) => api.nest(ruleModel).nest(navigationModel);

    const auth = apion
      .group('auth', (token: string) => ({ token }))
      .nest(grove)
      .nest(promote)
      .nest('search', searchPreview)
      .nest('validate', validateToken)
      .nest(adminCollections)
      .nest(productAttributes)
      .nest(productAttributeValues)
      .nest(key)
      .nest(area)
      .nest(user)
      .nest(ruleModel);

    const root = apion
      .group('groupby', (customer: string) => ({ customer }))
      .url((_, { customer }) => `https://${customer}.groupbycloud.com`)
      .nest(login)
      .nest(validatePassword)
      .nest(auth);

    const client: any = root.build(mock);

    await testClient(CUSTOMER);
    await testClient(CUSTOMER_ALT);

    async function testClient(customer: string) {
      const configuredClient = client(customer);

      expect(Object.keys(configuredClient)).to.have.members(['login', 'validatePassword', 'auth']);

      const loginRes = await configuredClient.login(EMAIL, PASSWORD);
      expect(loginRes).to.eql({ status: 200, body: '', headers: {}, ok: true });

      const validatePwdRes = await configuredClient.validatePassword(PASSWORD);
      expect(validatePwdRes.ok).to.be.true;

      const authClient = configuredClient.auth(TOKEN);
      configuredClient.auth('other token');

      expect(Object.keys(authClient)).to.have.members([
        'grove',
        'promote',
        'search',
        'validate',
        'collections',
        'productAttributes',
        'productAttributeValues',
        'key',
        'area',
        'user',
        'rule',
      ]);

      const groveRes = await authClient.grove();
      expect(groveRes).to.eql({
        status: 200,
        body: { grove: 'some_grove' },
        headers: { 'content-length': '22' },
        ok: true,
      });

      const promoteRes = await authClient.promote(AREA, TARGET_AREA);
      expect(promoteRes.ok).to.be.true;

      const validateRes = await authClient.validate();
      expect(validateRes.ok).to.be.true;

      const collectionsRes = await authClient.collections();
      expect(collectionsRes.ok).to.be.true;

      const productAttributesRes = await authClient.productAttributes();
      expect(productAttributesRes.ok).to.be.true;

      const productAttributeValuesRes = await authClient.productAttributeValues(AREA, FIELD);
      expect(productAttributeValuesRes.ok).to.be.true;

      const keyClient = authClient.key;

      expect(Object.keys(keyClient)).to.have.members(['addPrimary', 'removePrimary', 'get']);

      const addKeyRes = await keyClient.addPrimary();
      expect(addKeyRes.ok).to.be.true;

      const removeKeyRes = await keyClient.removePrimary();
      expect(removeKeyRes.ok).to.be.true;

      const getKeysRes = await keyClient.get();
      expect(getKeysRes.ok).to.be.true;

      async function testCRUD(crudClient: any) {
        const getRes = await crudClient.get(ID);
        expect(getRes.ok).to.be.true;

        const findRes = await crudClient.find(ID);
        expect(findRes.ok).to.be.true;

        const createRes = await crudClient.create(MOCK_OBJ);
        expect(createRes.ok).to.be.true;

        const updateRes = await crudClient.update(ID, MOCK_OBJ);
        expect(updateRes.ok).to.be.true;

        const removeRes = await crudClient.remove(ID);
        expect(removeRes.ok).to.be.true;
      }

      async function testGlobalModel(key: string) {
        const crudClient = authClient[key];
        expect(Object.keys(crudClient)).to.have.members(['get', 'find', 'create', 'update', 'remove']);

        await testCRUD(crudClient);
      }

      async function testNamespacedModel(key: string, area: string) {
        const crudClient = authClient[key](area);
        expect(Object.keys(crudClient)).to.have.members(['get', 'find', 'create', 'update', 'remove', 'bulkUpdate']);

        await testCRUD(crudClient);

        const bulkUpdateRes = await crudClient.bulkUpdate(MOCK_ARR);
        expect(bulkUpdateRes.ok).to.be.true;
      }

      await testGlobalModel('area');
      await testGlobalModel('user');
      await testGlobalModel('area');
      await testNamespacedModel('rule', AREA);

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
    }
  });
});
