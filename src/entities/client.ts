import Collection from './collection';

export default class Client extends Collection {

  client(client: string | Client) {
    if (client instanceof Client) {
      return client.setParent(this);
    } else {
      return new Client(client, this);
    }
  }
}
