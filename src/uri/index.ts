import { URL } from 'url';

import Hash from './hash';
import Path from './path';
import Protocol from './protocol';

export const AUTH_DELIMITER = ':';

class URI {
  value: URI.Parts;

  constructor(baseURI: string) {
    this.value = new URL(baseURI);
  }

  use(transformer: URI.Transformer) {
    const transformed = transformer(this.value);

    this.value = typeof transformed === 'string' ? new URL(transformed) : transformed;

    return this;
  }

  inherit(uri: URI) {
    this.value = uri.value;

    return this;
  }

  build() {
    return this.value;
  }

  static append(nextPath: string): URI.Transformer {
    return URI.transform('pathname', (pathname) => Path.join(pathname || '', nextPath));
  }

  static protocol(protocol: string): URI.Transformer {
    return URI.transform('protocol', () => Protocol.normalize(protocol.trim()));
  }

  static auth(username: string, password: string = '') {
    return URI.transform('auth', () => {
      const passwd = password.trim();

      return `${username.trim()}${passwd ? `${AUTH_DELIMITER}${passwd}` : ''}`;
    });
  }

  static hostname(hostname: string): URI.Transformer {
    return URI.transform('hostname', () => hostname.trim());
  }

  static port(port: number): URI.Transformer {
    return URI.transform('port', () => port);
  }

  static pathname(pathname: string): URI.Transformer {
    return URI.transform('pathname', () => Path.normalize(pathname.trim()));
  }

  static query(query: Record<string, string | string[] | undefined>): URI.Transformer;
  static query(transformer: (query: URI.Query) => URI.Query): URI.Transformer;
  static query(queryOrTransformer: any) {
    return URI.transform(
      'query',
      typeof queryOrTransformer === 'function' ? queryOrTransformer : () => queryOrTransformer
    );
  }

  static hash(hash: string): URI.Transformer {
    return URI.transform('hash', () => Hash.normalize(hash.trim()));
  }

  static set(uri: string): URI.Transformer {
    return () => new URL(uri);
  }

  static transform<K extends keyof URI.Parts>(
    key: K,
    transformer: (value: URI.Parts[K]) => URI.Parts[K]
  ): URI.Transformer {
    return (parts: URI.Parts) => ({
      ...parts,
      [key]: transformer(parts[key]),
    });
  }
}

namespace URI {
  export type Transformer = (value: Parts) => Parts | string;

  export type Query = Record<string, string | string[] | undefined>;

  export interface Parts {
    protocol?: string;
    auth?: string;
    hostname?: string;
    pathname?: string;
    port?: string | number;
    query?: Query;
    hash?: string;
  }
}

export default URI;
