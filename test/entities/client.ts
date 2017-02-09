import { expect } from 'chai';
import Client from '../../src/entities/client';
import Collection from '../../src/entities/collection';

describe('Client', () => {
  let client: Client;

  beforeEach(() => client = new Client(''));

  it('should extend Collection', () => {
    expect(client).to.be.an.instanceof(Collection);
  });

  describe('client()', () => {
    it('should return a Client', () => {
      expect(client.client('')).to.be.an.instanceof(Client);
    });
  });
});
