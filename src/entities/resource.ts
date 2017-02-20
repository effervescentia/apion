import { Entity } from '../core';

export default class Resource extends Entity {

  constructor(public name: string, parent?: Resource) {
    super(parent);
  }

  action(action: string | Entity) {
    if (action instanceof Entity) {
      return action.setParent(this);
    } else {
      const actionEntity = new Entity(this);
      actionEntity.name = action;
      return actionEntity;
    }
  }
}
