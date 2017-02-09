import Context from './context';

export default class Entity {

  ctx: Context = new Context(this.parent && this.parent.ctx);

  constructor(public name: string, private parent?: Entity) { }

  setParent(parent: Entity) {
    this.parent = parent;
    this.ctx.setParent(parent.ctx);
    return this;
  }

  method(method: string) {
    this.ctx.method = method;
    return this;
  }

  field(key: string, value: any) {
    this.ctx.fields.set(key, value);
    return this;
  }

  fields(fields: any) {
    this.ctx.fields.map = fields;
    return this;
  }

  param(key: string, value: any) {
    this.ctx.params.set(key, value);
    return this;
  }

  params(params: any) {
    this.ctx.params.map = params;
    return this;
  }

  queryParam(key: string, value: any) {
    this.ctx.query.set(key, value);
    return this;
  }

  query(query: any) {
    this.ctx.query.map = query;
    return this;
  }

  header(key: string, value: any) {
    this.ctx.headers.set(key, value);
    return this;
  }

  headers(headers: any) {
    this.ctx.headers.map = headers;
    return this;
  }

  cookie(key: string, value: any) {
    this.ctx.cookies.set(key, value);
    return this;
  }

  cookies(cookies: any) {
    this.ctx.cookies.map = cookies;
    return this;
  }
}
