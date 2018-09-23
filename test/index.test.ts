// import Builder from '../src/builder';
//
// const builder = new Builder();
// builder
//   .action('search', (clientKey: string, query: object) => ({ clientKey, query }))
//   .headers({ 'content-type': 'application/json' })
//   .use((req, ctx) => ({ ...req, body: { ...ctx.query, clientKey: ctx.clientKey } }));
//
// const client = builder.build(null);
// // client.post().actions.search('clientKey', {});
