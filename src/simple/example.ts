import * as apion from '.';

// store middleware as a single composed function to retain type pairing with class generics

// const local = apion.config().headers({ 'Special-Header': 'my header' });

// const specialEndpoint = apion.action('special').local(local);

// const root = apion.group('root').nest('otherName', specialEndpoint);

const json = apion
  .config()
  .headers({
    'Content-Type': 'application/json',
  })
  .formatter((body) => (typeof body === 'string' ? body : JSON.stringify(body)))
  .parser((body) => {
    try {
      return typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      console.error(e);
      throw new Error('unable to parse body as JSON');
    }
  });

const admin = apion.config().url('admin/v2');
const merchandising = apion.config().url('api/v2');

const login = apion
  .action('login', (email: string, password: string) => ({ email, password }))
  .inherit(json)
  .inherit(merchandising)
  .url('login')
  .post()
  .request((_, { email, password }) => ({ email, password }));

const grove = apion
  .action('grove')
  .inherit(json)
  .inherit(admin)
  .url('grove');

const simpleSearchBuilder = apion.builder().with('query', (query: string) => ({ query }));

const searchPreviewBuilder = apion
  .builder()
  .inherit(simpleSearchBuilder)
  .with('collection', (collection: string) => ({ collection }))
  .with('fields', (fields: string[]) => ({ fields }))
  .with<'pageSize', number>('pageSize');

const searchPreview = apion
  .action('searchPreview', searchPreviewBuilder)
  .inherit(json)
  .inherit(merchandising)
  .url('proxy/search')
  .post();

const auth = apion
  .group('auth', (token: string) => ({ token }))
  .nest(grove)
  .nest(searchPreview);

const groupby = apion
  .group('groupby', (customer: string) => ({ customer }))
  .url((_, { customer }) => `https://${customer}.groupbycloud.com`)
  .nest(login)
  .nest(auth);

/*

1. action -> can be called
2. resource -> has CRUD endpoints
3. api -> contains actions / resources / apis
4. action & api -> is an action and also acts as a collection

// note: *cannot* have an api which accepts parameters if it is also an action
// to avoid confusion over how to support both while keeping the resulting client simple

// pass `true` as the last parameter to any client builder method
// to replace all inherited values with the values provided

// local configuration

const local = apion.config()
  .headers({ 'Special-Header': 'my header' });

const specialEndpoint = api.action('special')
  .local(local)

// rename when nesting

const endpoint = apion.action('endpoint');

const root = apion.group('root')
  .nest('otherName', endpoint)

// inherited configuration

const json = apion.config()
  .headers({
    'Content-Type': 'application/json'
  })
  .formatter(body => typeof body === 'string' ? body : JSON.stringify(body))
  .parser(body => typeof body === 'string' ? JSON.parse(body) : body)

const admin = apion.config()
  .url('admin/v2')

const merchandising = apion.config()
  .url('api/v2')

const login = apion.action('login', (email, password) => ({ email, password }))
  .inherit(json, merchandising)
  .url('login') // added to existing url
  .post()
  .request((req, { email, password }) => ({ email, password }))

const grove = apion.action('grove')
  .inherit(json, admin)
  .url('grove')

const simpleSearchBuilder = apion.builder()
  .with('query', (query: string) => ({ query }))

const searchPreviewBuilder = apion.builder()
  .inherit(simpleSearchBuilder)
  .with('collection', (collection: string) => ({ collection }))
  .with('fields', (fields: string[]) => ({ fields }))
  .with('pageSize', (pageSize: number) => ({ pageSize }))
  //.with<number>('pageSize') for a simple setter like these

/ using a builder automatically passes through the result as the request body
const searchPreview = apion.action('searchPreview', searchPreviewBuilder)
  .inherit(json, merchandising)
  .url('proxy/search')
  .post()

const auth = apion.group('auth', (token) => ({ token }))
  .nest(grove, searchPreview)

apion.group('groupby', (customer) => ({ customer }))
  .url((url, { customer }) => `https://${customer}.groupbycloud.com`)
  .nest(login, auth)

*/
