import { Entity } from '../core';

export default class Resource extends Entity {

  action(action: string | Entity) {
    if (action instanceof Entity) {
      return action.setParent(this);
    } else {
      return new Entity(action, this);
    }
  }
}
