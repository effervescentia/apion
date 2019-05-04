import RequestContext from '@/context/request';
import suite from '../suite';

suite('Request Context', ({ expect }) => {
  let context: RequestContext;

  beforeEach(
    () =>
      (context = new RequestContext()
        .headers({ authorization: 'abc-def' })
        .url('https://example.com:1234/my/path?and=query'))
  );

  describe('headers()', () => {
    it('should merge headers with existing', () => {
      const request = context
        .headers({ 'content-type': 'application/json' })
        .resolve();

      expect(request.headers).to.eql({
        authorization: 'abc-def',
        'content-type': 'application/json',
      });
    });

    it('should set the headers with updater', () => {
      const request = context
        .headers(() => ({ 'content-type': 'application/json' }))
        .resolve();

      expect(request.headers).to.eql({ 'content-type': 'application/json' });
    });
  });

  describe('port()', () => {
    it('should set the port from value', () => {
      const request = context.port(8080).resolve();

      expect(request.url).to.eq('https://example.com:8080/my/path?and=query');
    });

    it('should set the port with updater', () => {
      const request = context.port(() => 8080).resolve();

      expect(request.url).to.eq('https://example.com:8080/my/path?and=query');
    });
  });

  describe('path()', () => {
    it('should add to the path', () => {
      const request = context.path('more/path').resolve();

      expect(request.url).to.eq(
        'https://example.com:1234/my/path/more/path?and=query'
      );
    });

    it('should override the path', () => {
      const request = context.path('/more/path').resolve();

      expect(request.url).to.eq('https://example.com:1234/more/path?and=query');
    });

    it('should add to the path with updater', () => {
      const request = context.path(() => 'more/path').resolve();

      expect(request.url).to.eq(
        'https://example.com:1234/my/path/more/path?and=query'
      );
    });

    it('should override the path with updater', () => {
      const request = context.path(() => '/more/path').resolve();

      expect(request.url).to.eq('https://example.com:1234/more/path?and=query');
    });
  });

  describe('query()', () => {
    it('should set the query from value', () => {
      const request = context.query('new=arguments').resolve();

      expect(request.url).to.eq(
        'https://example.com:1234/my/path?new=arguments'
      );
    });

    it('should set the port with updater', () => {
      const request = context.query(() => 'new=arguments').resolve();

      expect(request.url).to.eq(
        'https://example.com:1234/my/path?new=arguments'
      );
    });

    it('should add query parameters by key and value', () => {
      const request = context
        .query('new', 'arguments')
        .query('added', 'too')
        .resolve();

      expect(request.url).to.eq(
        'https://example.com:1234/my/path?and=query&new=arguments&added=too'
      );
    });
  });
});
