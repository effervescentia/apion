# apron

> JavaScript API client generator

# composable extension

```ts
client.use(callback: (client: ClientBuilder) => void);
```

# routes

```ts
const authClient = client.route('auth', (token: string) => ({ token }));
const publicClient = client.route('public');
const nestedClient = client.route('nested');
const firstNestedClient = nestedClient.route('first');
const secondNestedClient = nestedClient.route('second');

authClient.headers((headers, ctx) => ({ ...headers, 'auth': ctx.token }));

const api = client.build();

api.auth('my token'); // authClient

api.public(/* no arguments required */); // publicClient
// or
api.public; // publicClient

api.nested.first; // firstNestedClient
api.nested.second; // secondNestedClient
```

# headers

```ts
client.headers({ 'content-type': 'application/json' }); // set headers
client.headers((headers) => ({ ...headers, 'content-type': 'application/json' })); // modify headers
```

# method sugar

```ts
client.post(); // set method to 'POST'
client.put(); // set method to 'PUT'
client.get(); // set method to 'GET'
// etc.
```

# convenience

## JSON payload

```ts
client.json(); // automatically stringify the payload and set Content-Type header
```

## CORS

```ts
client.mode('cors' | 'no-cors' | 'same-origin'); // configure for CORS
```

## referrer

```ts
client.referrer('client' | 'no-referrer' | 'http://some.example/site');
client.referrerPolicy('no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'unsafe-url');
```

# build client

```ts
client.build(): // return a constructed API client for the current level of nesting
```

# built client

```ts
client.send(); // send a request for the currently selected node
```
