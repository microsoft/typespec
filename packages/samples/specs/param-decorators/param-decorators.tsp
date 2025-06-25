import "@typespec/rest";

@service(#{ title: "Parameter Decorators" })
namespace TypeSpec.Samples;

using Http;

@route("/thing")
namespace Operations {
  @route("{name}")
  op getThing(
    @pattern("^[a-zA-Z0-9-]{3,24}$")
    @format("UUID")
    name: string,

    @minValue(0)
    @maxValue(10)
    @query
    count: int32,
  ): OkResponse & Thing;

  @route("{name}")
  @put
  op putThing(...NameParameter, @body body: Thing): OkResponse & Thing;
}

model Thing {
  name: string;

  @format("UUID")
  id: string;
}

model NameParameter {
  @doc("Name parameter")
  @pattern("^[a-zA-Z0-9-]{3,24}$")
  @format("UUID")
  name: string;
}
