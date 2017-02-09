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
