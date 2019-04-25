import * as apion from '.';
import { Header } from './constants';

export const json = apion
  .config()
  .headers({ [Header.CONTENT_TYPE]: 'application/json' })
  .formatter((body) => (typeof body === 'string' ? body : JSON.stringify(body)))
  .parser((body) => {
    try {
      return typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      console.error(e);
      throw new Error('unable to parse body as JSON');
    }
  });
