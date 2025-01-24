import "@typespec/http";

using TypeSpec.Http;
@service({
  title: "Widget Service",
})
namespace DemoService;

model Widget {
  @path
  @key
  id: string;

  color: "red" | "blue";
  weight?: int32;
}

@error
model Error {
  code: int32;
  message: string;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  /** List widgets */
  @get list(): Widget[] | Error;
  /** Read widgets */
  @get read(@path id: string): Widget | Error;
  /** Create a widget */
  @post create(...Widget): Widget | Error;
  /** Update a widget */
  @patch update(...Widget): Widget | Error;
  /** Delete a widget */
  @delete delete(@path id: string): void | Error;
}
