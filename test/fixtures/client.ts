import apion from '@/.';
import GroupBuilder from '@/builders/client/group';
import { json } from '@/helpers';

export default function createClient(mockFetch: any) {
  const adminPath = apion.config('admin_path').path('admin');
  const dbPath = apion.config('db_path').path('database');
  const ingestPath = apion.config('ingest_path').path('ingest');
  const analyticsPath = apion.config('analytics_path').path('analytics');
  const analyticsReportingPath = analyticsPath
    .extend('reporting')
    .path('reporting');
  const analyticsRecommendationsPath = analyticsPath
    .extend('recommendations')
    .path('recommendations');
  const analyticsUsageReportingPath = analyticsReportingPath
    .extend('usage')
    .path('usage');
  const analyticsSearchReportingPath = analyticsReportingPath
    .extend('usage')
    .path('searches');
  const merchandisingAdminPath = dbPath.extend('admin').path('admin');
  const tokenAuth = apion
    .config<{ token: string }>('token_auth')
    .headers((prev, { token }) => ({ ...prev, Authorization: token }));
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
    .use(dbPath)
    .use(tokenAuth);
  const merchandisingAdminConfig = apion
    .config('merchandising_admin_config')
    .use(merchandisingAdminPath)
    .use(tokenAuth);
  const streamConfig = apion
    .config('stream_config')
    .use(ingestPath)
    .use(clientKeyBodyAuth);
  const windowedConfig = (api: GroupBuilder<any, string, any, any>) =>
    api.ctor((body: any) => (_api: any) => _api.body(body)).post();

  const login = apion
    .action('login', (email: string, password: string) => api =>
      api.body({ email, password })
    )
    .use(json)
    .use(dbPath)
    .path('login')
    .post();

  const validatePassword = apion
    .action('validatePassword', (password: string) => api => api.body(password))
    .use(dbPath)
    .path('password/validate')
    .post();

  const group = apion
    .action('group')
    .use(json)
    .use(adminConfig)
    .path('group');

  const promote = apion
    .action('promote', (source: string, target: string) => api =>
      api.body({ source, target })
    )
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
    .action('productAttributeValues', (area: string, field: string) => api =>
      api.body({ area, field })
    )
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

  const get = apion.action('get', (id: string) => api => api.path(id));
  const find = apion.action('find');
  const create = apion
    .action('create', (obj: any) => api => api.body(obj))
    .post();
  const update = apion
    .action('update', (id: string, obj: any) => api => api.path(id).body(obj))
    .put();
  const remove = apion
    .action('remove', (id: string) => api => api.path(id))
    .delete();

  const CRUD = <T extends GroupBuilder<any, string, any, any>>(api: T) =>
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

  const bulkUpdate = apion
    .action('bulkUpdate', (models: any[]) => api => api.body({ models }))
    .put();

  const namespacedModule = (name: string, path = name) =>
    apion
      .group(name, (area: string) => api =>
        api.path(
          (_, { area: areaOverride }: any) => `${areaOverride || area}/${path}`
        )
      )
      .use(json)
      .use(merchandisingConfig)
      .pipe(CRUD)
      .nest(bulkUpdate);

  const areaModel = globalModel('area');
  const userModel = globalModel('user');

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

  const withModels = (api: GroupBuilder<any, string, any, any>) =>
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

  const allModels = apion.group('models').pipe(withModels);

  const modelsByArea = apion
    .group('modelsByArea', (area: string) => ({ area }))
    .pipe(withModels);

  const streamCollections = apion.action('collections').path('collections');

  const admin = apion
    .group('admin', (clientKey: string) => ({ clientKey }))
    .use(json)
    .use(streamConfig)
    .nest(streamCollections);

  const recordCount = apion
    .action('recordCount')
    .use(analyticsUsageReportingPath)
    .pipe(windowedConfig)
    .path('records');

  const qps = apion
    .action('qps')
    .use(analyticsUsageReportingPath)
    .pipe(windowedConfig)
    .path('queries/timeseries');

  const topSearches = apion
    .action('topSearches')
    .use(analyticsRecommendationsPath)
    .pipe(windowedConfig)
    .path('searches/_getPopular');

  const topTrending = apion
    .action('topTrending')
    .use(analyticsRecommendationsPath)
    .pipe(windowedConfig)
    .path('searches/_getTrending');

  const topNullQueries = apion
    .action('topNullQueries')
    .use(analyticsSearchReportingPath)
    .pipe(windowedConfig)
    .path('_getNull');

  const topRefinements = apion
    .action('topRefinements')
    .use(analyticsRecommendationsPath)
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
    .nest(group)
    .nest(promote)
    .nest('search', searchPreview)
    .nest('validate', validateToken)
    .nest(adminCollections)
    .nest(productAttributes)
    .nest(productAttributeValues)
    .nest(key)
    .nest(areaModel)
    .nest(userModel)
    .nest(allModels)
    .nest(modelsByArea)
    .nest(admin)
    .nest(analytics);

  return apion
    .group('groupby', (customer: string) => ({ customer }))
    .url((_, { customer }) => `https://${customer}.example.com`)
    .nest(login)
    .nest(validatePassword)
    .nest(auth)
    .build(mockFetch);
}
