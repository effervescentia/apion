import suite from './suite';

import Headers from '../src/headers';

suite('Headers', ({ expect, spy }) => {
  const headersSelf = { a: 'b' };

  describe('$instance', () => {
    let headers: Headers;

    beforeEach(() => {
      headers = new Headers();
    });

    it('should have initial propertis', () => {
      expect(headers['headers']).to.eql({});
    });

    describe('add()', () => {
      it('should alias setOne()', () => {
        expect(headers.add).to.eq(headers.setOne);
      });
    });

    describe('remove()', () => {
      it('should nullify header by key', () => {
        headers['headers'] = { a: 'b', c: 'd' };

        headers.remove('c');

        expect(headers['headers']).to.eql({ a: 'b', c: null });
      });

      it('should lowercase keys', () => {
        headers['headers'] = { a: 'b', c: 'd' };

        headers.remove('C');

        expect(headers['headers']).to.eql({ a: 'b', c: null });
      });
    });

    describe('set()', () => {
      const headerObject = { a: 'b' };
      const value = 'myValue';

      it('should call setMany()', () => {
        const setMany = (headers.setMany = spy(() => headersSelf));

        expect(headers.set(headerObject)).to.eq(headersSelf);
        expect(setMany).to.be.calledWithExactly(headerObject, undefined);
      });

      it('should call setMany() with replace', () => {
        const setMany = (headers.setMany = spy(() => headersSelf));

        expect(headers.set(headerObject, true)).to.eq(headersSelf);
        expect(setMany).to.be.calledWithExactly(headerObject, true);
      });

      it('should call setOne()', () => {
        const key = 'myKey';

        const setOne = (headers.setOne = spy(() => headersSelf));

        expect(headers.set(key, value)).to.eq(headersSelf);
        expect(setOne).to.be.calledWithExactly(key, value);
      });
    });

    describe('setOne()', () => {
      const value = 'myValue';

      it('should add header by key', () => {
        const key = 'my_key';

        expect(headers.setOne(key, value)).to.eq(headers);
        expect(headers['headers']).to.eql({ [key]: value });
      });

      it('should lowercase keys', () => {
        const key = 'myKey';

        headers.setOne(key, value);

        expect(headers['headers']).to.eql({ mykey: value });
      });

      it('should not add undefined or null values', () => {
        headers.setOne('a', null as any);
        headers.setOne('a', undefined as any);

        expect(headers['headers']).to.eql({});
      });
    });

    describe('setMany()', () => {
      it('should call setOne() for each header', () => {
        const setOne = (headers.setOne = spy());

        expect(headers.setMany({ a: 'b', C: 'd' })).to.eq(headers);
        expect(setOne)
          .to.be.calledTwice //
          .and.calledWithExactly('a', 'b')
          .and.calledWithExactly('C', 'd');
      });

      it('should replace all headers', () => {
        headers.setOne = () => null as any;
        headers['headers'] = { x: 'y' };

        headers.setMany({ a: 'b' }, true);

        expect(headers['headers']).to.eql({});
      });
    });

    describe('get()', () => {
      it('should return the header for the provided key', () => {
        const value = 'myValue';
        headers['headers'] = { a: value };

        expect(headers.get('a')).to.eq(value);
      });
    });

    describe('build()', () => {
      it('should remove null values from header map', () => {
        headers['headers'] = { a: 'b', c: null, e: 'f' };

        expect(headers.build()).to.eql({ a: 'b', e: 'f' });
      });
    });
  });
});
