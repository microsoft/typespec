import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace DemoService;

model Widget {
  @visibility(Lifecycle.Read)
  id: string;

  weight: int32;
  color: "red" | "blue";

  /** Dimensions defined as an inline named model */
  dimensions: model Dimensions {
    width: float32;
    height: float32;
    depth: float32;
  };
}

@error
model Error {
  code: int32;
  message: string;
}

/** A paginated list wrapper using an inline named model as template parameter */
model Page<T> {
  items: T[];
  nextLink?: url;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  /** List widgets (response uses inline named model as template parameter) */
  @get list(): Page<Widget> | Error;

  /** Read widgets */
  @get read(@path id: Widget.id): Widget | Error;

  /** Create a widget */
  @post create(@body widget: Widget): Widget | Error;

  /** Update a widget */
  @patch update(@path id: Widget.id, @body widget: MergePatchUpdate<Widget>): Widget | Error;

  /** Delete a widget */
  @delete delete(@path id: Widget.id): void | Error;

  /** Analyze a widget (response uses an inline named model) */
  @route("{id}/analyze") @post analyze(@path id: Widget.id): model AnalysisResult {
    summary: string;
    score: float32;
  } | Error;
}
