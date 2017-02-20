import { Entity } from '../src/simple';

describe('simple', () => {
  it('should do', () => {
    const ent = new Entity()
      .chain('this')
      .chain('to')
      .chain('that');

    logPath(ent);
  });

  it('should make multiple paths', () => {
    const root = new Entity();
    const ent1 = root.chain('from')
      .chain('here')
      .chain('to')
      .chain('there');
    const ent2 = root.chain('other')
      .chain('entity')
      .chain('path');

    logPath(ent1);
    logPath(ent2);
  });
});

function logPath(ent: Entity) {
  console.log(['/', ...ent.path()].join(' -> '));
}
