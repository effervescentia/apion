export class Base<T extends Base<T>> {
  constructor(protected parent?: T) { }

  setParent(parent: T) {
    this.parent = parent;
    return this;
  }
}

export class Context extends Base<Context> {

  setRootParent(ctx: Context) {
    if (this.parent) {
      this.parent.setRootParent(ctx);
    } else {
      this.parent = ctx;
    }
  }
}

export class Entity extends Base<Entity> {
  name?: string;
  middleware: [string, Middleware][] = [];
  ctx: Context = new Context(this.parent && this.parent.ctx);
  entities: Entity[] = [];

  chain(entity: string | Entity) {
    let child: Entity;
    if (entity instanceof Entity) {
      child = entity.setParent(this);
    } else {
      child = new Entity(this);
      child.name = entity;
    }
    this.entities.push(child);
    return child;
  }

  path(): string[] {
    const path = this.parent ? this.parent.path() : [];
    return this.name ? path.concat(this.name) : path;
  }

  render() {
    const parent = this.renderParent();
    const rendered = this.renderAbstract();
    if (parent) {
      rendered.parent = parent;
      rendered.ctx.setRootParent(parent.ctx);
    }
    return rendered;
  }

  renderParent() {
    if (this.parent) {
      return {
        parent: this.parent.renderParent(),
        // ctx: this.parent.ctx
      };
    }
  }

  renderAbstract() {
    const rendered = {
      parent: null,
      ctx: this.ctx,
      middleware: [...this.middleware]
    };
    this.entities.forEach((entity) => {
      if (entity.name) {
        const renderedEntity = entity.renderAbstract();
        renderedEntity.parent = rendered;
        renderedEntity.ctx.setRootParent(rendered.ctx);
        rendered[entity.name] = renderedEntity;
      } else {
        rendered.ctx = entity.ctx.setParent(rendered.ctx);
        rendered.middleware.push(...this.middleware);
      }
    });
    return rendered;
  }
}

export interface Middleware {
  (ctx: Context, res: any, next: Function): void;
}
