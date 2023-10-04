import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

/**
 * Define a resource action
 */
@autoRoute op ResourceList<T>(@query filter: string): T[];
@autoRoute op ResourceRead<T>(@path id: string): T;
@post @autoRoute op ResourceCreate<T>(...T): T;
@autoRoute @actionSeparator(":") op ResourceAction<T>(): T;

model Pet {
  name: string;
  age: int32;
}

@route("/pets")
interface Pets {
  list is ResourceList<Pet>;
  create is ResourceCreate<Pet>;
  read is ResourceRead<Pet>;
  @action("adopt") adopt is ResourceAction<Pet>;
}
