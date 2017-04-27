export class Ancestral<T extends Ancestral<T>> {

  protected inheritable: string[];

  constructor(protected _parent?: T) {
    this.inherit(_parent);
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: T) {
    this._parent = parent;
    this.inherit(parent);
  }

  protected inherit(parent: T) {
    this.inheritable
  }
}

export class Store extends Ancestral<Store> {

}

export class Context extends Ancestral<Context> {

  thing: Store = new Store();

  protected inherit(parent: Context) {

  }
}

export class Entity extends Ancestral<Entity> {

  name?: string;
  entities: Entity[] = [];
  thing: object = {};

  renderAbove() {
    const rendered = this.renderSelf();
    return combine(this._parent ? this._parent.renderAbove() : {},
      this.name ? { [this.name]: functionize(this.name, rendered) } : rendered);
  }

  renderSelf() {
    return this.thing;
  }

  renderSubtree() {
    return this.entities.reduce((rendered, entity) => {
      const renderedEntity = entity.renderSubtree();
      return Object.assign(rendered, entity.name
        ? { [entity.name]: functionize(entity.name, renderedEntity) }
        : renderedEntity);
    }, this.renderSelf());
  }
}

function combine(target: any, mixin: any): any {
  return Object.assign(target, mixin);
}

function functionize<T>(name: string, obj: T): T & (() => T) {
  return Object.assign(() => obj, obj);
}
