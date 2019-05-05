# apion ![CircleCI branch](https://img.shields.io/circleci/project/github/effervescentia/apion/master.svg?style=flat-square) ![npm](https://img.shields.io/npm/v/apion.svg?style=flat-square) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

> JavaScript API client generator

Inspired by [theon](https://github.com/theonjs/theon) but designed to be a simpler alternative.

## Usage

Install the package `apion` using `npm`, `yarn` or your preferred package manager. For example:

```sh
npm install apion
```

Import in your code:

```ts
import apion from 'apion';
// or import * as apion from 'apion'
import { json } from 'apion/helpers';
```

```js
const apion = require('apion');
const { json } = require('apion/helpers');
```

### Examples

```ts
import apion from 'apion';
import { json } from 'apion/helpers';

const apiConfg = apion
  .config()
  .use(json)
  .url('https://example.com/api');

const profile = apion.action('profile', id => api => api.query(`id=${id}`));

const auth = apion
  .group('auth', token => ({ token }))
  .path('auth')
  .headers((prev, { token }) => ({ ...prev, Authorization: token }))
  .nest(profile);

const login = apion
  .action('login', (user, password) => api => api.body({ user, password }))
  .post();

const root = apion
  .group('root')
  .use(apiConfig)
  .nest(auth)
  .nest(login);

const client = root.build();

// implementation

const {
  body: { token },
} = await client.login('test@example.com', '123456');
/*
method: 'POST'
url: 'https://example.com/api/login'
headers: { 'content-type': 'application/json' }
body: '{"email":"test@example.com","password":"123456"}'
*/

const { body: profile } = await cient.auth(token).profile('abc123');
/*
method: 'GET'
url: 'https://example.com/api/auth/profile?id=abc123'
headers: { 'content-type': 'application/json', authorization: <token> }
body: -
*/
```

## API

Methods exposed on `apion`.

### apion.config([name])

Create a `ConfigBuilder` with an optional `name`

- `name` _String_: Sets the name of the configuration for reference in debugging.

```ts
import apion from 'apion';

const myConfig = apion
  .config('my_config')
  .url('https://example.com/api')
  .headers({ 'my-header': 'some value' });

const isRunning = apion
  .action('isRunning')
  .use(myConfig)
  .path('_health')
  .build();

await isRunning();
/*
method: 'GET'
url: 'https://example.com/api/_health'
headers: { 'my-header': 'some value' }
body: -
*/
```

### apion.group(name, [constructor])

Create a `GroupBuilder` with a `name` and an optional `constructor` for dynamically setting context for nested builders

- `name` _String_: Sets the name of the group which by default is used as the name of the property added when nesting under another group or action.
- `constructor` _Function_: A callback used to dynamically set the context for nested builders.

```ts
import apion from 'apion';
import { json } from 'apion/helpers';

const login = apion
  .action('login', (email, password) => api => api.body({ email, password }))
  .post();

const publicClient = apion
  .group('public')
  .use(json)
  .url('https://example.com/api/public')
  .nest(login)
  .build();

await publicClient.login('test@example.com', '123456');
/*
method: 'POST'
url: 'https://example.com/api/public/login'
headers: { 'content-type': 'application/json' }
body: '{"email":"test@example.com","password":"123456"}'
*/
```

#### constructor

Used to dynamically set properties in the context for nested builders.

```ts
const profile = apion.action('profile').path('profile');

const authClient = apion
  .group('auth', token => ({ token }))
  .url('https://example.com/api/admin')
  .headers((prev, { token }) => ({ ...prev, Authorization: token }))
  .nest(profile)
  .build();

await authClient('XXX-000-AAA').profile();
/*
method: 'GET'
url: 'https://example.com/api/admin/profile'
headers: { authorization: 'XXX-000-AAA' }
body: -
*/
```

It can also be used to set more complex request properies by returning a callback which receives the containing `GroupBuilder`.

```ts
const profile = apion.action('profile').path('profile');

const userClient = apion
  .group('user', (user, password) => api =>
    api.path(user).headers({ Authorization: password })
  )
  .url('https://example.com/api/admin/user')
  .nest(profile)
  .build();

await userClient('greg123', '456789').profile();
/*
method: 'GET'
url: 'https://example.com/api/admin/user/greg123/profile'
headers: { authorization: '456789' }
body: -
*/
```

### apion.action(name, [constructor | requestBuilder])

- `name` _String_: Sets the name of the action which by default is used as the name of the property added when nesting under another group or action.
- `constructor` _Function_: A callback used to dynamically set the context for nested builders.
- `requestBuilder` _RequestBuilder_: An instance of a `RequestBuilder` used to inject a simple builder pattern when constructing complex request bodies.

#### requestBuilder

Automatically injects a builder to be used for creating requests.

```ts
import apion from 'apion';
import { json } from 'apion/helpers';

const requestBuilder = apion
  .builder()
  .with('range', (start, end) => ({ start, end }))
  .with('interval')
  .with('timezone');

const getTimeseries = apion
  .action('timeseries', requestBuilder)
  .use(json)
  .url('https://example.com/api/timeseries')
  .post();

await getTimeseries(req =>
  req
    .range(10, 200)
    .interval(25)
    .timezone('UTC')
);
/*
method: 'POST'
url: 'https://example.com/api/timeseries'
headers: { 'content-type': 'application/json' }
body: '{"start":10,"end":200,"interval":25,"timezone":"UTC"}'
*/
```

### apion.builder([formatter])

Create a `RequestBuilder` with an optional `formatter`

- `formatter` _Function_: Sets a formatting callback to construct the final request body.

```ts
import apion from 'apion';

const searchRequestBuilder = apion
  .builder()
  .with('query')
  .with('attributes', (...attributes) => ({ attributes }))
  .with('range', (start, end) => ({ range: { start, end } }));

/*
creates request bodies of the form:

{
  query: any,
  attibutes: any[],
  range: { start: any, end: any }
}
*/
```

#### formatter

Used to format the generated request body.

```ts
import apion from 'apion';

const searchRequestBuilder = apion
  .builder(payload => ({ type: 'search', payload }))
  .with('query')
  .with('pageSize')
  .with('sort', (attribute, order) => ({ sort: { attribute, order } }));

/*
creates request bodies of the form:

{
  type: 'search',
  payload: {
    query: any,
    pageSize: any,
    sort: { attribute: any, order: any }
  }
}
*/
```

### HTTPBuilder

The base `class` for `ConfigBuilder`, `GroupBuilder` and `ActionBuilder`. Contains utility methods for managing request properties.

#### url(url | transform)

- `url` _String_: An full URL to set for the request, overrides the existing url.
- `transform` _Function_: A callback to transform the previous value to the next value.

```ts
import apion from 'apion';

apion.config().url('https://example.com');
```

##### transform

A callback which is passed the previous value and the context object and should return the next value.

```ts
import apion from 'apion';

apion
  .config()
  .ctx({ path: 'some/path' })
  .url('https://example.com')
  .url((prev, ctx) => `${prev}/${ctx.path}`);
```

#### port(port | transform)

- `port` _Number_: A port to set for the request, overrides the existing port.
- `transform` _Function_: A callback to transform the previous value to the next value. (see [transform](#transform))

```ts
import apion from 'apion';

apion.config().port(8080);
```

#### query(query | transform)

- `query` _String_: A query to set for the request, overrides the existing query.
- `transform` _Function_: A callback to transform the previous value to the next value. (see [transform](#transform))

```ts
import apion from 'apion';

apion.config().query('x=y&a=10');
```

#### path(path | transform)

- `path` _String_: A path to set for the request, overrides the existing path. If the path starts with a forward slash (`/`) then the whole path will be replaced, otherwise it will be added to the existing path.
- `transform` _Function_: A callback to transform the previous value to the next value. (see [transform](#transform))

```ts
import apion from 'apion';

apion
  .config()
  .url('https://example.com/api')
  .path('my/path'); // 'https://example.com/api/my/path'

apion
  .config()
  .url('https://example.com/api')
  .path('/my/path'); // 'https://example.com/my/path'
```

#### method(method)

- `method` _String_: A method to set for the request, overrides the exting method.

```ts
apion
  .config()
  .url('https://example.com/api')
  .method('POST');
```

> `apion` also exports its own `Method` object for easy use

```ts
import { Method } from 'apion';

apion
  .config()
  .url('https://example.com/api')
  .method(Method.POST);
```

#### get()

Sets the request method to `GET`.

#### post()

Sets the request method to `POST`.

#### patch()

Sets the request method to `PATCH`.

#### put()

Sets the request method to `PUT`.

#### delete()

Sets the request method to `DELETE`.

#### headers(headers | transform)

- `headers` _Object_: A headers to set for the request, overrides the existing headers.
- `transform` _Function_: A callback to transform the previous value to the next value. (see [transform](#transform))

```ts
import apion from 'apion';

apion.config().headers({ 'content-type': 'application/json' });
```

#### body(body | transform)

- `body` _Object_: A body to set for the request, overrides the existing body.
- `transform` _Function_: A callback to transform the previous value to the next value. (see [transform](#transform))

```ts
import apion from 'apion';

apion.config().body('test@example.com:123456');
```

#### formatter(formatter)

Add a callback to transform the request body before sending it.

- `formatter` _Function_: A callback to transform the request body before sending it.

```ts
import apion from 'aption';

apion
  .config()
  .formatter(body => (typeof body === 'string' ? body : JSON.stringify(body)));
```

#### parser(parser)

Add a callback to transform the response body after receiving it.

- `parser` _Function_: A callback to transform the response body after receiving it.

```ts
import apion from 'aption';

apion
  .config()
  .parser(body => (typeof body === 'string' ? JSON.parse(body) : body));
```

### ConfigBuilder

Used to construct re-usable updates to context and request properties. Inherits all methods from `HTTPBuilder`.

#### ctx(obj)

Update the context by merging in a new object (uses the same logic as `Object.assign()`).

- `obj` _Object_: An object that will be merged with the existing context.

```ts
import apion from 'apion';

apion.config().ctx({ id: 123 });
```

#### use(builder | createBuilder)

Add the configuration from the provided `builder` or the result of the `createBuilder` function to the builder instance.

- `builder` _ConfigBuilder_: Configuration from this builder will be inherited by the builder instance.
- `createBuilder` _Function_: A function which accepts the context object and should return an instance of a `ConfigBuilder`

```ts
import apion from 'apion';

const config = apion.config().url('https://example.com');

apion.action('isRunning').use(config);
```

##### createBuilder

Used to have full control over dynamically setting request properties based on the context object.

```ts
import apion from 'apion';

apion
  .action('login', user => ({ user }))
  .use(({ user }) =>
    user === 'admin'
      ? apion
          .config()
          .path('admin')
          .headers({ Authorization: 'skip' })
      : apion.config().path(`user/${user}`)
  )
  .url('https://example.com/api');
```

#### inherit(builder)

Like `use()` except that configuration transformations are pushed to the top of the builder's inheritance chain.

```ts
import apion from 'apion';

const config = apion.config().url('https://example.com');

apion
  .action('isRunning')
  .use(apion.config().path('api'))
  .inherit(config);
```

#### pipe(transform)

A utility method to help apply re-usable chained methods to a builder instance.

```ts
import apion from 'apion';

const configure = api =>
  api.url('https://example.com/api').headers({ 'my-header': 'some value' });

// hard to chain
const test = configure(apion.action('test'));

// easy to chain
const test = apion.action('test').pipe(configure);
```

#### extend()

Clone a builder instance in order to create an extended version of it.

```ts
import apion from 'apion';

const config = apion.config().url('https://example.com');

const extended = config.extend().path('api');
```

### GroupBuilder

Used to construct groups of nested builders. Inherits all methods from `ConfigBuilder`.

#### ctor(constructor)

Override or set the builder's `constructor` to be used to provide dynamic context properties.

- `constructor` _Function_: A callback used to dynamically set the context for nested builders (see [constructor](#constructor)).

```ts
import apion from 'apion';

apion.group('auth').ctor(token => ({ token }));
```

#### nest([name], builder)

Add a nested builder to a `GroupBuilder` or `ActionBuilder`.

- `name` _String_: A name to override the name on the builder.
- `builder` _GroupBuilder | ActionBuilder_: A builder to be nested under this builder instance. If no name is provided, the name provided when constructing the builder will be used.

#### build([fetch])

Build an API client with this builder as the root node.

- `fetch` _Function_: A replacement for the `fetch` instance used under the hood when making requests (defaults to `cross-fetch`).

### ActionBuilder

Used to construct action builders for sending requests over the network. Inherits all methods from `GroupBuilder`.

#### ctor(constructor | requestBuilder)

Override or set the builder's `constructor` to be used to provide dynamic context properties.

- `constructor` _Function_: A callback used to dynamically set the context for nested builders (see [constructor](#constructor)).
- `requestBuilder` _RequestBuilder_: An instance of a `RequestBuilder` used to inject a simple builder pattern when constructing complex request bodies (see [requestBuilder](#requestBuilder)).

### RequestBuilder

Used to construct chainable request builders to simplify the construction of complex request bodies.

#### with(name, [handler])

Add a chainable method with the name `name` to the generated request builder.
A custom `handler` can be provided to control how the final value will be set in the request body.

- `name` _String_: The name of the method that will be generated. If no handler is provided then it will also be the name of the resulting property on the request body. The name `build` cannot be used as it is reserved for use by the library.

- `handler` _Function_: A callback to merge the parameters of the builder method into the request body object.

```ts
import apion from 'apion';

apion
  .builder()
  .with('query')
  // which is the same as
  .with('query', query => ({ query }));

// with multiple arguments
apion.builder().with('range', (start, end) => ({ range: { start, end } }));
```

#### use(builder)

Inherit the property handlers from another `RequestBuilder`, useful if you have multiple endpoints that share common request properties.

- `builder` _RequestBuilder_: The builder to inherit properties from.

```ts
import apion from 'apion';

const rootBuilder = apion
  .builder()
  .with('id')
  .with('parameters', (...parameters) => ({ parameters }));

const inheritingBuilder = apion
  .builder()
  .use(rootBuilder)
  .with('session', id => ({ session: { id } }));
```

#### build()

Generate the client-facing request builder class. The only pre-determined property on the builder is `build()` which will return the final request body.

```ts
import apion from 'apion';

const SpecialRequestBuilder = apion
  .builder()
  .with('name')
  .with('properties', (...properties) => ({ properties }));

const builder = new SpecialRequestBuilder();

builder
  .name('ben')
  .properties('lastUpdated', 'id', 'title')
  .build();
/*
{
  name: 'ben',
  properties: ['lastUpdated', 'id', 'title']
}
*/
```

## Helpers

### JSON

```ts
import apion from 'apion';
import { json } from 'apion/helpers';

// JSON.stringify() request body
// JSON.parse() response body
// set 'Content-Type: application/json' header
apion.config().use(json);
```

<!-- ## CORS

```ts
client.mode('cors' | 'no-cors' | 'same-origin'); // configure for CORS
```

## referrer

```ts
client.referrer('client' | 'no-referrer' | 'http://some.example/site');
client.referrerPolicy('no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'unsafe-url');
```
 -->
