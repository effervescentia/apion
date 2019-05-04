import * as apion from '.';
import { Header } from './constants';

export const json = apion
  .config('json')
  .headers({ [Header.CONTENT_TYPE]: 'application/json' })
  .formatter((body: any) =>
    typeof body === 'string' ? body : JSON.stringify(body)
  )
  .parser((body: any) => {
    try {
      return body && JSON.parse(body);
    } catch (e) {
      throw new Error('unable to parse body as JSON');
    }
  });
