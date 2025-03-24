import "@typespec/rest";
import "@typespec/openapi";

using Http;

@service(#{ title: "sample" })
namespace Sample;

@doc("Error")
@error
model Error {
  status: int32;
  message: string;
}

@doc("AutoRest Time Test Service")
@route("/time")
namespace Time {
  @doc("Get time value \"11:34:56\"")
  @get
  op get(): plainTime | Error;

  @doc("Put time value \"08:07:56\"")
  @put
  op put(@body value: plainTime): OkResponse | Error;
}
