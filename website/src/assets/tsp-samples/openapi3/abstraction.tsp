import "@typespec/http";

using Http;

// Define abstraction for resource lifecyle
op ResourceList<T>(@query filter: string): T[];
op ResourceRead<T>(@path id: string): T;
@post op ResourceCreate<T>(...T): T;

model Pet {
  name: string;
  age: int32;
}

@route("/pets")
interface Pets {
  list is ResourceList<Pet>;
  create is ResourceCreate<Pet>;
  read is ResourceRead<Pet>;
}
