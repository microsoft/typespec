import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

@service(#{ title: "Widget Service" })
namespace DemoService;
using Rest;
using Http;
using OpenAPI;

model WidgetBase {
  @key id: string;
  weight: int32;
  color: "red" | "blue";
}

enum WidgetKind {
  Heavy,
  Light,
}

model HeavyWidget extends WidgetBase {
  kind: WidgetKind.Heavy;
}

model LightWidget extends WidgetBase {
  kind: WidgetKind.Light;
}

@discriminated
union Widget {
  heavy: HeavyWidget,
  light: LightWidget,
}

@error
model Error {
  code: int32;
  message: string;
}

@get op read(@path id: string): Widget | Error;
