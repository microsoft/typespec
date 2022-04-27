export const samples: Record<string, string> = {
  Http: `import "@cadl-lang/rest";

@serviceTitle("Widget Service")
namespace DemoService;
using Cadl.Http;

model Widget {
  @key id: string;
  weight: int32;
  color: "red" | "blue";
}

@error model Error {
  code: int32;
  message: string;
}

interface WidgetService {
  @get list(): Widget[] | Error;
  @route("widgets/{id}") @get read(@path id: string): Widget | Error;
  @post create(@body body: Widget): Widget | Error;
  @route("customGet") @get customGet(): Widget | Error;
}`,
  "Rest framework": `import "@cadl-lang/rest";

@serviceTitle("Widget Service")
namespace DemoService;

using Cadl.Http;
using Cadl.Rest;

model Widget {
  @key id: string;
  weight: int32;
  color: "red" | "blue";
}

@error model Error {
  code: int32;
  message: string;
}

interface WidgetService extends Resource.ResourceOperations<Widget, Error> {
  @get @route("customGet") customGet(): Widget;
}`,
  "Versioned Rest Framework": `import "@cadl-lang/rest";
import "@cadl-lang/versioning";

@serviceTitle("Widget Service")
@versioned(VERSIONS)
namespace DemoService;

alias VERSIONS = "v1" | "v2";

using Cadl.Http;
using Cadl.Rest;

model Widget {
  @key id: string;
  weight: int32;
  color: "red" | "blue";
  @added("v2") name: string;
}

@error model Error {
  code: int32;
  message: string;
}

interface WidgetService extends Resource.ResourceOperations<Widget, Error> {
  @added("v2")
  @get
  @route("customGet")
  customGet(): Widget;
}`,
};
