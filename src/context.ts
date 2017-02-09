import Store from './store';
import { inherit } from './utils';

export default class Context {

  static INHERITABLE: string[] = ['fields', 'params', 'query', 'headers', 'cookies'];

  /**
   * mody of the request
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

  constructor(private parent?: Context) {
    this.inherit();
  }

  setParent(parent: Context) {
    this.parent = parent;
    this.inherit();
  }

  private inherit() {
    inherit(this, this.parent, Context.INHERITABLE);
  }
}
