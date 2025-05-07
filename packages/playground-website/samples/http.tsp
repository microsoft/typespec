import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace DemoService;

model Widget {
  @visibility(Lifecycle.Read)
  id: string;

  weight: int32;
  color: "red" | "blue";
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
  @get read(@path id: Widget.id): Widget | Error;

  /** Create a widget */
  @post create(@body widget: Widget): Widget | Error;

  /** Update a widget */
  @patch update(@path id: Widget.id, @body widget: MergePatchUpdate<Widget>): Widget | Error;

  /** Delete a widget */
  @delete delete(@path id: Widget.id): void | Error;
  /** Analyze a widget */
  @route("{id}/analyze") @post analyze(@path id: Widget.id): string | Error;
}
