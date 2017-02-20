import Context from './context';

export interface Middleware {
  (context: Context, response: any, next: Middleware.Callback): void;
}

export namespace Middleware {
  export interface Callback {
    (err?: Error, response?: any): void;
  }
}
