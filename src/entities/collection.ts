import Resource from './resource';

export default class Collection extends Resource {

  collection(collection: string | Collection) {
    if (collection instanceof Collection) {
      return collection.setParent(this);
    } else {
      return new Collection(collection, this);
    }
  }

  resource(resource: string | Resource) {
    if (resource instanceof Resource) {
      return resource.setParent(this);
    } else {
      return new Resource(resource, this);
    }
  }
}
