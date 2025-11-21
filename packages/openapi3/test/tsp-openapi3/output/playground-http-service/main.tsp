import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "Widget Service" })
@info(#{ version: "0.0.0" })
@tagMetadata("Widgets")
namespace WidgetService;

model Error {
  code: int32;
  message: string;
}

model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}

model WidgetCreate {
  weight: int32;
  color: "red" | "blue";
}

model WidgetUpdate {
  weight?: int32;
  color?: "red" | "blue";
}

@tag("Widgets")
@route("/widgets")
@get
op Widgets_list(): Body<Widget[]> | GeneratedHelpers.DefaultResponse<
  Description = "An unexpected error response.",
  Body = Error
>;

@tag("Widgets")
@route("/widgets")
@post
op Widgets_create(@body body: WidgetCreate): Widget | GeneratedHelpers.DefaultResponse<
  Description = "An unexpected error response.",
  Body = Error
>;

@tag("Widgets")
@route("/widgets/{id}")
@delete
op Widgets_delete(@path id: string): NoContentResponse | GeneratedHelpers.DefaultResponse<
  Description = "An unexpected error response.",
  Body = Error
>;

@tag("Widgets")
@route("/widgets/{id}")
@get
op Widgets_read(@path id: string): Widget | GeneratedHelpers.DefaultResponse<
  Description = "An unexpected error response.",
  Body = Error
>;

@tag("Widgets")
@route("/widgets/{id}")
@patch
op Widgets_update(
  ...Parameters.Widget.id,
  @body body: WidgetUpdate,
): Widget | GeneratedHelpers.DefaultResponse<
  Description = "An unexpected error response.",
  Body = Error
>;

@tag("Widgets")
@route("/widgets/{id}/analyze")
@post
op Widgets_analyze(@path id: string): Body<string> | GeneratedHelpers.DefaultResponse<
  Description = "An unexpected error response.",
  Body = Error
>;

namespace Parameters {
  namespace Widget {
    model id {
      @path id: string;
    }
  }
}
namespace GeneratedHelpers {
  @doc(Description)
  @error
  model DefaultResponse<
    Description extends valueof string = "",
    Body = void,
    Headers extends {} = {}
  > {
    @body body: Body;
    ...Headers;
  }
}
