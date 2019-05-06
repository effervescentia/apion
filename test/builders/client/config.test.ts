import suite from '../../suite';

import fetchMock from 'fetch-mock';
import { equals } from 'ramda';

import apion from '@/.';
import ConfigBuilder from '@/builders/client/config';

suite('Config Builder', ({ expect }) => {
  describe('ctx()', () => {
    it('should set some context for use by later transformations or nested builders', async () => {
      const builder = new ConfigBuilder().ctx({ user: 'test_user' });
      const mock = fetchMock.sandbox().get(
        (url, opts) =>
          url === 'https://example.com/' &&
          equals(opts.headers, { user: 'test_user' }) &&
          equals(JSON.parse(opts.body as string), {
            initial: true,
            user: 'test_user',
          }),
        200
      );

      const client: any = apion
        .group<'root', any, { user: string; initial: boolean }>('root', () => ({
          initial: true,
        }))
        .use(builder)
        .url('https://example.com')
        .headers((_, { user }) => ({ User: user }))
        .nest(
          apion
            .action('login', () => api =>
              api.body((_, { initial, user }: any) => ({ initial, user }))
            )
            .formatter(JSON.stringify)
        )
        .build(mock);

      await client().login();
    });
  });

  describe('use()', () => {
    it('should inherit transforms from a builder', async () => {
      const mock = fetchMock.sandbox().get('https://example.com/setup', 200);

      const client: any = apion
        .group('root')
        .ctx({ initial: true })
        .url('https://example.com')
        .nest(
          apion
            .action('login')
            .use(({ initial }: any) =>
              initial
                ? apion.config().path('setup')
                : apion.config().path('login')
            )
        )
        .build(mock);

      await client.login();
    });

    it('should throw an error if a builder is not returned from the callback', async () => {
      const mock = fetchMock.sandbox().get('https://example.com/setup', 200);

      const client: any = apion
        .group('root')
        .url('https://example.com')
        .nest(apion.action('login').use(() => ({} as any)))
        .build(mock);

      try {
        await client.login();
        expect.fail();
      } catch (e) {
        expect(e.message).to.eq(
          'expected dynamic builder to return an instance of ConfigBuilder'
        );
      }
    });
  });
});
