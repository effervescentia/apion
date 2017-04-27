import fetchMock from 'fetch-mock';

import apion from '@/.';
import { json } from '@/helpers';
import suite from './suite';

suite('Helpers', ({ expect }) => {
  describe('json', () => {
    let mock: fetchMock.FetchMockSandbox;

    beforeEach(() => (mock = fetchMock.sandbox()));

    it('should throw Error when parsing non-JSON', async () => {
      mock.get('https://example.com', { status: 200, body: 'abc' });

      const test: any = apion
        .action('test')
        .use(json)
        .url('https://example.com')
        .build(mock);

      try {
        await test();

        expect.fail();
      } catch (e) {
        expect(e.message).to.eq('unable to parse body as JSON');
      }
    });

    it('should pass-through non-string bodies', async () => {
      mock.get('https://example.com', { status: 200, body: null });

      const test: any = apion
        .action('test')
        .use(json)
        .url('https://example.com')
        .build(mock);

      const { body } = await test();
      expect(body).to.eq('');
    });
  });
});
