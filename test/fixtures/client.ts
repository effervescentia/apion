import * as apion from '@/.';
import ConfigBuilder from '@/builders/client/config';
import GroupBuilder from '@/builders/client/group';
import { json } from '@/helpers';

export default function createClient(mockFetch: any) {
  const adminPath = apion.config('admin_path').path('admin/v2');
  const merchandisingPath = apion.config('merchandising_path').path('api/v2');
  const streamPath = apion.config('stream_path').path('api/v2');
  const wisdomPath = apion.config('wisdom_path').path('wisdom/v2');
  const analyticsPath = apion.config('analytics_path').path('analytics');
  const wisdomReportingPath = apion
    .config('wisdom_reporting_path')
    .use(wisdomPath)
    .path('reporting');
  const wisdomRecommendationsPath = apion
    .config('wisdom_recommendations_path')
    .use(wisdomPath)
    .path('recommendations');
  const wisdomUsageReportingPath = apion
    .config('wisdom_usage_reporting_path')
    .use(wisdomReportingPath)
    .path('usage');
  const wisdomSearchReportingPath = apion
    .config('wisdom_search_reporting_path')
    .use(wisdomReportingPath)
    .path('searches');
  const merchandisingAdminPath = apion
    .config('merchandising_admin_path')
    .use(merchandisingPath)
    .path('admin');
  const tokenAuth: (ctx: any) => ConfigBuilder<any, string> = ({ token }: { token: string }) =>
    apion.config('token_auth').headers({ Authorization: token });
  const clientKeyHeaderAuth = apion
    .config<{ clientKey: string }>('client_key_header_auth')
    .headers((prev, { clientKey }) => ({ ...prev, Authorization: clientKey }));
  const clientKeyBodyAuth = apion
    .config('client_key_body_auth')
    .body((prev, { clientKey }) => ({ ...prev, clientKey }));

  const adminConfig = apion
    .config('admin_config')
    .use(adminPath)
    .use(tokenAuth);
  const merchandisingConfig = apion
    .config('merchandising_config')
    .use(merchandisingPath)
    .use(tokenAuth);
  const merchandisingAdminConfig = apion
    .config('merchandising_admin_config')
    .use(merchandisingAdminPath)
    .use(tokenAuth);
  const streamConfig = apion
    .config('stream_config')
    .use(streamPath)
    .use(clientKeyBodyAuth);
  const windowedConfig = (api: GroupBuilder<any, string, any>) =>
    api.ctor((body: any) => (api: any) => api.body(body)).post();

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
      .group(name, (area: string) => (api) =>
        api.path((_, { area: areaOverride }: any) => `${areaOverride || area}/${path}`)
      )
      .use(json)
      .use(merchandisingConfig)
      .pipe(CRUD)
      .nest(bulkUpdate);

  const area = globalModel('area');
  const user = globalModel('user');

  const biasingProfileModel = namespacedModule('biasingProfile');
  const filterModel = namespacedModule('filter');
  const matchStrategyModel = namespacedModule('matchStrategy');
  const navigationModel = namespacedModule('navigation');
  const phraseModel = namespacedModule('phrase');
  const redirectModel = namespacedModule('redirect');
  const relatedQueryModel = namespacedModule('relatedQuery');
  const ruleModel = namespacedModule('rule');
  const zoneModel = namespacedModule('zone');
  const spellingModel = namespacedModule('spelling');
  const synonymModel = namespacedModule('synonym');
  const stopWordModel = namespacedModule('stopWord');
  const templateModel = namespacedModule('template');

  const withModels = (api: GroupBuilder<any, string, any>) =>
    api
      .nest(ruleModel)
      .nest(navigationModel)
      .nest(biasingProfileModel)
      .nest(filterModel)
      .nest(matchStrategyModel)
      .nest(phraseModel)
      .nest(redirectModel)
      .nest(relatedQueryModel)
      .nest(zoneModel)
      .nest(spellingModel)
      .nest(synonymModel)
      .nest(stopWordModel)
      .nest(templateModel);

  const models = apion.group('models').pipe(withModels);

  const modelsByArea = apion.group('modelsByArea', (area: string) => ({ area })).pipe(withModels);

  const streamCollections = apion.action('collections').path('collections');

  const admin = apion
    .group('admin', (clientKey: string) => ({ clientKey }))
    .use(json)
    .use(streamConfig)
    .nest(streamCollections);

  const recordCount = apion
    .action('recordCount')
    .use(wisdomUsageReportingPath)
    .pipe(windowedConfig)
    .path('records');

  const qps = apion
    .action('qps')
    .use(wisdomUsageReportingPath)
    .pipe(windowedConfig)
    .path('queries/timeseries');

  const topSearches = apion
    .action('topSearches')
    .use(wisdomRecommendationsPath)
    .pipe(windowedConfig)
    .path('searches/_getPopular');

  const topTrending = apion
    .action('topTrending')
    .use(wisdomRecommendationsPath)
    .pipe(windowedConfig)
    .path('searches/_getTrending');

  const topNullQueries = apion
    .action('topNullQueries')
    .use(wisdomSearchReportingPath)
    .pipe(windowedConfig)
    .path('_getNull');

  const topRefinements = apion
    .action('topRefinements')
    .use(wisdomRecommendationsPath)
    .pipe(windowedConfig)
    .path('refinements/_getPopular');

  const analytics = apion
    .group('analytics', (clientKey: string) => ({ clientKey }))
    .use(json)
    .use(clientKeyHeaderAuth)
    .nest(recordCount)
    .nest(qps)
    .nest(topSearches)
    .nest(topTrending)
    .nest(topNullQueries)
    .nest(topRefinements);

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
    .nest(models)
    .nest(modelsByArea)
    .nest(admin)
    .nest(analytics);

  return apion
    .group('groupby', (customer: string) => ({ customer }))
    .url((_, { customer }) => `https://${customer}.groupbycloud.com`)
    .nest(login)
    .nest(validatePassword)
    .nest(auth)
    .build(mockFetch);
}
