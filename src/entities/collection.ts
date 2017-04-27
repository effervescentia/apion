import Resource from './resource';

export default class Collection extends Resource {

  collection(collection: string | Collection) {
    if (collection instanceof Collection) {
      collection.parent = this;
      return collection;
    } else {
      return new Collection(collection, this);
    }
  }

  resource(resource: string | Resource) {
    if (resource instanceof Resource) {
      resource.parent = this;
      return resource;
    } else {
      return new Resource(resource, this);
    }
  }
}
