import "@typespec/http";

using Http;

model Pet {
  name: string;
  age: int32;
}

model Store {
  name: string;
  address: Address;
}

model Address {
  street: string;
  city: string;
}

@route("/pets")
interface Pets {
  list(@query filter: string): Pet[];
  create(@body pet: Pet): Pet;
  read(@path id: string): Pet;
}

@route("/stores")
interface Stores {
  list(@query filter: string): Store[];
  read(@path id: string): Store;
}
