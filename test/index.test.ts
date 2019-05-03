import { expect } from 'chai';

import {
  createClient,
  mockAPI,
  AREA,
  CLIENT_KEY,
  EMAIL,
  FIELD,
  ID,
  MOCK_ARR,
  MOCK_OBJ,
  PASSWORD,
  TARGET_AREA,
  TOKEN,
  WINDOWED_REQUEST,
} from './fixtures';
import suite from './suite';

const CUSTOMER = 'mycustomer';
const CUSTOMER_ALT = 'othercustomer';

suite('Apion', () => {
  it('should create a complex client', async () => {
    const mock = mockAPI(CUSTOMER);
    mockAPI(CUSTOMER_ALT, mock);

    const client: any = createClient(mock);

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
        'models',
        'modelsByArea',
        'admin',
        'analytics',
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

      async function testNamespacedModel(modelsClient: any, key: string, area?: string) {
        const crudClient = modelsClient[key](area);
        expect(Object.keys(crudClient)).to.have.members(['get', 'find', 'create', 'update', 'remove', 'bulkUpdate']);

        await testCRUD(crudClient);

        const bulkUpdateRes = await crudClient.bulkUpdate(MOCK_ARR);
        expect(bulkUpdateRes.ok).to.be.true;
      }

      await testGlobalModel('area');
      await testGlobalModel('user');
      await testGlobalModel('area');

      const modelsClient = authClient.models;

      function testModelsClient(client: any) {
        expect(Object.keys(client)).to.have.members([
          'rule',
          'biasingProfile',
          'matchStrategy',
          'redirect',
          'relatedQuery',
          'navigation',
          'filter',
          'phrase',
          'zone',
          'spelling',
          'synonym',
          'stopWord',
          'template',
        ]);
      }

      async function testModels(client: any, area?: string) {
        await testNamespacedModel(client, 'rule', area);
        await testNamespacedModel(client, 'biasingProfile', area);
        await testNamespacedModel(client, 'matchStrategy', area);
        await testNamespacedModel(client, 'redirect', area);
        await testNamespacedModel(client, 'relatedQuery', area);
        await testNamespacedModel(client, 'navigation', area);
        await testNamespacedModel(client, 'filter', area);
        await testNamespacedModel(client, 'phrase', area);
        await testNamespacedModel(client, 'zone', area);
        await testNamespacedModel(client, 'spelling', area);
        await testNamespacedModel(client, 'synonym', area);
        await testNamespacedModel(client, 'stopWord', area);
        await testNamespacedModel(client, 'template', area);
      }

      testModelsClient(modelsClient);

      await testModels(modelsClient, AREA);

      const preconfModelsClient = authClient.modelsByArea(AREA);

      testModelsClient(preconfModelsClient);

      await testModels(preconfModelsClient);

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

      const adminClient = authClient.admin(CLIENT_KEY);

      expect(Object.keys(adminClient)).to.have.members(['collections']);

      const streamCollectionsRes = await adminClient.collections();
      expect(streamCollectionsRes.ok).to.be.true;

      const analyticsClient = authClient.analytics(CLIENT_KEY);

      expect(Object.keys(analyticsClient)).to.have.members([
        'recordCount',
        'qps',
        'topSearches',
        'topTrending',
        'topNullQueries',
        'topRefinements',
      ]);

      const recordCountRes = await analyticsClient.recordCount(WINDOWED_REQUEST);
      expect(recordCountRes.ok).to.be.true;

      const qpsRes = await analyticsClient.qps(WINDOWED_REQUEST);
      expect(qpsRes.ok).to.be.true;

      const topSearchesRes = await analyticsClient.topSearches(WINDOWED_REQUEST);
      expect(topSearchesRes.ok).to.be.true;

      const topTrendingRes = await analyticsClient.topTrending(WINDOWED_REQUEST);
      expect(topTrendingRes.ok).to.be.true;

      const topNullQueriesRes = await analyticsClient.topNullQueries(WINDOWED_REQUEST);
      expect(topNullQueriesRes.ok).to.be.true;

      const topRefinementsRes = await analyticsClient.topRefinements(WINDOWED_REQUEST);
      expect(topRefinementsRes.ok).to.be.true;
    }

    await testClient(CUSTOMER);
    await testClient(CUSTOMER_ALT);
  });
});
