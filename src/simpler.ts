export function Opts(parent?: any): any {
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

export default class Simpler {

  name?: string;
  opts: any = Opts();
  entities: Simpler[] = [];
  private _parent?: Simpler;
  get parent() { return this._parent; }
  set parent(parent: Simpler) {
    this._parent = parent;
    this.opts.setParent(parent.opts);
  }

  chain(name: string) {
    const next = new Simpler();
    next.name = name;
    next.parent = this;
    this.entities.push(next);
    return next;
  }

  render() {
    return renderSubtree(this, renderAncestors(this));
  }
}

export function renderIsolated(entity: Simpler, parent?: Rendered) {
  const rendered = new Rendered();
  if (parent) {
    rendered.parent = parent;
  }
  return rendered;
}

export function renderAncestors(entity: Simpler) {
  if (entity.parent) {
    const parent = renderAncestors(entity.parent);
    return renderIsolated(entity, parent);
  }
}

export function renderSubtree(root: Simpler, parent?: Rendered) {
  return root.entities.reduce((rendered, entity) =>
    Object.defineProperty(rendered, entity.name, {
      enumerable: true,
      get: () => {
        function customize() { return renderSubtree(entity); }
        return Object.assign(customize, renderSubtree(entity));
      }
    }), renderIsolated(root, parent));
}

export class Rendered {

  parent?: Rendered;

}
