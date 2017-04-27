import { extend } from '../utils';
import Store from './store';
import { Middleware } from './types';

export const INHERITABLE: string[] = ['fields', 'params', 'query', 'headers', 'cookies'];

export default class Context {

  /**
   * body of the request
   */
  body: any = null;
  /**
   * method to make request using
   */
  method: string = null;
  /**
   * authentication credentials
   */
  auth: { user: string, password?: string };
  /**
   * map of fields for the body
   */
  fields: Store = new Store();
  /**
   * map of path parameters
   */
  params: Store = new Store();
  /**
   * map of query parameters
   */
  query: Store = new Store();
  /**
   * map of headers
   */
  headers: Store = new Store();
  /**
   * map of cookies
   */
  cookies: Store = new Store();
  /**
   * array of middleware
   */
  middleware: Middleware[] = [];

  constructor(private _parent?: Context) {
    this.inherit(_parent);
  }

  get parent() {
    return this._parent;
  }
  set parent(parent: Context) {
    this._parent = parent;
    this.inherit(parent);
  }

  private inherit(parent: Context) {
    extend(this, parent, INHERITABLE);
  }
}
