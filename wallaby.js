const _path = require('path');

module.exports = (w) => ({
  files: ['tsconfig.json', 'src/**/*.ts', { pattern: 'test/**/*.ts', instrument: false }, '!**/*.test.ts'],
  tests: ['test/**/*.test.ts'],

  compilers: {
    '**/*.ts': w.compilers.typeScript(require(_path.join(w.localProjectDir, 'tsconfig.json')).compilerOptions),
  },

  env: {
    type: 'node',
  },

  testFramework: 'mocha',

  setup(wallaby) {
    require('ts-node/register');
    const path = require('path');
    require(path.join(wallaby.localProjectDir, 'test/setup'));
  },
});
