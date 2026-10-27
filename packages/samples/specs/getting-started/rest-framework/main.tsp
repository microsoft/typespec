import "@typespec/http";
import "@typespec/rest";

using Http;
using Rest;

@service(#{ title: "Widget Service" })
namespace DemoService;

model Widget {
  @key id: string;
  weight: int32;
  color: "red" | "blue";
}

@error
model Error {
  code: int32;
  message: string;
}

interface WidgetService extends Resource.ResourceOperations<Widget, Error> {
  @get
  @route("customGet")
  customGet(): Widget;
}
