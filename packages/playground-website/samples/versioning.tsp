import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using Versioning;

@versioned(Versions)
@service(#{ title: "Widget Service" })
namespace DemoService;

enum Versions {
  v1,
  v2,
}

using Http;
using Rest;

model Widget {
  @key id: string;
  weight: int32;
  color: "red" | "blue";
  @added(Versions.v2) name: string;
}

@error
model Error {
  code: int32;
  message: string;
}

interface WidgetService extends Resource.ResourceOperations<Widget, Error> {
  @added(Versions.v2)
  @get
  @route("customGet")
  customGet(): Widget;
}
