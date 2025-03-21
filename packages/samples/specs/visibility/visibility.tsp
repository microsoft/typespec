import "@typespec/http";
import "@typespec/rest";

using Http;
using Rest;

@service(#{ title: "Visibility sample" })
namespace VisibilitySample;

model Person {
  @visibility(Lifecycle.Read) id: string;
  @visibility(Lifecycle.Create) secret: string;
  name: string;

  @visibility(Lifecycle.Read, Lifecycle.Create)
  test: string;

  @visibility(Lifecycle.Read, Lifecycle.Update)
  other: string;

  @visibility(Lifecycle.Read, Lifecycle.Create, Lifecycle.Update)
  relatives: PersonRelative[];
}

model PersonRelative {
  person: Person;
  relationship: string;
}

@withVisibility(Lifecycle.Read)
model Readable<Data> {
  ...Data;
}

@withVisibility(Lifecycle.Create)
model Writable<Data> {
  ...Data;
}

model ReadablePerson {
  ...Readable<Person>;
}

model WritablePerson {
  ...Writable<Person>;
}

model OptionalPerson {
  ...OptionalProperties<Person>;
}

model WriteableOptionalPerson {
  ...OptionalProperties<WritablePerson>;
}

model ListResult<Item> {
  items: Item[];
}

@route("/hello")
namespace Hello {
  @get op read(
    @path id: string,

    @query(#{ explode: true })
    fieldMask: string[],
  ): ReadablePerson;
  @post op create(@body person: WritablePerson): ReadablePerson;
  @put op update(@body person: WriteableOptionalPerson): ReadablePerson;

  @TypeSpec.Rest.listsResource(Person)
  op list(): ListResult<Person>;

  @TypeSpec.Rest.updatesResource(Person)
  op updateRest(@body person: Person): ReadablePerson;
}
