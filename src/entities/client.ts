import Collection from './collection';

export default class Client extends Collection {

  client(client: string | Client) {
    if (client instanceof Client) {
      client.parent = this;
      return client;
    } else {
      return new Client(client, this);
    }
  }
}
