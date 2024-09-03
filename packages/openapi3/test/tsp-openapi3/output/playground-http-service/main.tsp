import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "Widget Service",
})
@info({
  version: "0.0.0",
})
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

/**
 * The request has succeeded.
 */
model Widgets_list200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Widget[];
}

/**
 * An unexpected error response.
 */
@defaultResponse
model Widgets_listDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

/**
 * The request has succeeded.
 */
model Widgets_create200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Widget;
}

/**
 * An unexpected error response.
 */
@defaultResponse
model Widgets_createDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

/**
 * There is no content to send for this request, but the headers may be useful.
 */
model Widgets_delete204Response {
  @statusCode statusCode: 204;
}

/**
 * An unexpected error response.
 */
@defaultResponse
model Widgets_deleteDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

/**
 * The request has succeeded.
 */
model Widgets_read200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Widget;
}

/**
 * An unexpected error response.
 */
@defaultResponse
model Widgets_readDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

/**
 * The request has succeeded.
 */
model Widgets_update200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Widget;
}

/**
 * An unexpected error response.
 */
@defaultResponse
model Widgets_updateDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

/**
 * The request has succeeded.
 */
model Widgets_analyze200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: string;
}

/**
 * An unexpected error response.
 */
@defaultResponse
model Widgets_analyzeDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

@tag("Widgets")
@route("/widgets")
@get
op Widgets_list(
): Widgets_list200ApplicationJsonResponse | Widgets_listDefaultApplicationJsonResponse;

@tag("Widgets")
@route("/widgets")
@post
op Widgets_create(
  @bodyRoot body: WidgetCreate,
): Widgets_create200ApplicationJsonResponse | Widgets_createDefaultApplicationJsonResponse;

@tag("Widgets")
@route("/widgets/{id}")
@delete
op Widgets_delete(
  @path id: string,
): Widgets_delete204Response | Widgets_deleteDefaultApplicationJsonResponse;

@tag("Widgets")
@route("/widgets/{id}")
@get
op Widgets_read(
  @path id: string,
): Widgets_read200ApplicationJsonResponse | Widgets_readDefaultApplicationJsonResponse;

@tag("Widgets")
@route("/widgets/{id}")
@patch
op Widgets_update(
  ...Parameters.Widget.id,
  @bodyRoot body: WidgetUpdate,
): Widgets_update200ApplicationJsonResponse | Widgets_updateDefaultApplicationJsonResponse;

@tag("Widgets")
@route("/widgets/{id}/analyze")
@post
op Widgets_analyze(
  @path id: string,
): Widgets_analyze200ApplicationJsonResponse | Widgets_analyzeDefaultApplicationJsonResponse;

namespace Parameters {
  namespace Widget {
    model id {
      @path id: string;
    }
  }
}
