import "@typespec/http";
import "@typespec/rest";

@service(#{ title: "Widget Service" })
namespace DemoService;

using Http;
using Rest;

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
  @get @route("customGet") customGet(): Widget;
}
