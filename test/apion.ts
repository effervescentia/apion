import { expect } from 'chai';
import Apion from '../src/apion';
import Client from '../src/entities/client';

describe('Apion', () => {
  it('should return a Client', () => {
    expect(Apion('')).to.be.an.instanceof(Client);
  });
});
