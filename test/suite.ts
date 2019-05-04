import { expect } from 'chai';
import * as createSuite from 'mocha-suite';
import * as sinon from 'sinon';

export type TestUtils = {
  stub: typeof sinon['stub'];
  spy: typeof sinon['spy'];
  expect: typeof expect;
};

export const extend = <T extends TestUtils>(utilsGenerator: (utils: TestUtils) => Partial<T> = () => ({})) =>
  createSuite<T, {}>((tests) => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => (sandbox = sinon.createSandbox()));
    afterEach(() => sandbox.restore());

    const fullUtils = {
      expect,
      spy: sinon.spy,
      stub: (...args: any[]) => (sandbox.stub as any)(...args),
    };
    tests({ ...fullUtils, ...(utilsGenerator(fullUtils) as any) });
  });

export default extend();
