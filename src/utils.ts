import { Context, Store } from './core';

export function extend(target: Context, parent: Context, stores: string[]) {
  if (parent) {
    Object.getOwnPropertyNames(parent)
      .filter((key) => stores.includes(key))
      .forEach((key) => {
        if (target[key] && target[key] instanceof Store) {
          target[key].setParent(parent[key]);
        }
      });
  }
}
