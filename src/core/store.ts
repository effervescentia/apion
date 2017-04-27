export default class Store {

  map: any = {};

  constructor(private parent?: Store) { }

  setParent(parent: Store) {
    this.parent = parent;
    return this;
  }

  get(key: string): any {
    return key in this.map ? this.map[key] : this.parent && this.parent.get(key);
  }

  set(key: string, value: any) {
    this.map[key] = value;
    return this;
  }
}

export function Store2(parent?: any): any {
  return new Proxy({
    setParent: (parentOpts) => parent = parentOpts,
    getParent: () => parent
  }, {
      has: (target, prop) => Reflect.has(target, prop) || Reflect.has(parent, prop),
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        if (parent) {
          return parent[prop];
        }

        return undefined;
      },
      set: (target, prop, value) => (target[prop] = value) && true,
      ownKeys: (target) => {
        const keys: any[] = Reflect.ownKeys(target);

        if (parent) {
          return keys.concat(Reflect.ownKeys(parent)
            .filter((key) => !keys.includes(key)));
        }

        return keys;
      }
    });
}
