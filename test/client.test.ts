import suite from './suite';

import Context from '../src/context';

import Client from '../src/client';

suite('Client', ({ expect, stub }) => {
  const builder: any = { a: 'b', middleware: ['D', 'E', 'F'], context: { middleware: ['A', 'B', 'C'] } };
  const resolver: any = () => null;

  describe('inheritance', () => {
    it('should extend Context', () => {
      const client = new Client(builder, resolver);

      expect(client).to.be.an.instanceof(Context);
    });
  });

  describe('$instance', () => {
    let client: Client;

    beforeEach(() => {
      client = new Client(builder, resolver);
    });

    describe('constructor()', () => {
      it('should initialize middleware from builder', () => {
        expect(client.middleware).to.eql(['A', 'B', 'C', 'D', 'E', 'F']);
      });

      it('should inherit from builder parent', () => {
        const inheritableBuilder: any = { middleware: [], context: { middleware: [] }, parent: {} };
        const inherit = stub(Client.prototype, 'inherit');

        client = new Client(inheritableBuilder, resolver);

        expect(inherit).to.be.calledWithExactly(inheritableBuilder);
      });
    });

    describe('inherit()', () => {
      it('should prepend middleware', () => {
        client.middleware = [1, 2, 3, 4] as any[];

        expect(client.inherit(builder)).to.eq(client);
        expect(client.middleware).to.eql(['A', 'B', 'C', 1, 2, 3, 4]);
      });
    });
  });
});
