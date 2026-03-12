import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for File type usage in request and response bodies")
@scenarioService("/type/file")
namespace Type.File;

/**
 * Test File as request and response body with specific content type
 */
@route("/body")
namespace Body {
  @scenario
  @scenarioDoc("""
    Test File type as request body with specific content type.
    Expected request:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @post
  @route("/request/specific-content-type")
  op uploadFileSpecificContentType(@bodyRoot file: Http.File<"image/png">): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type as request body with JSON content type.
    Expected request:
    - Content-Type header: application/json
    - Body: JSON content with file data
    """)
  @post
  @route("/request/json-content-type")
  op uploadFileJsonContentType(@bodyRoot file: Http.File<"application/json">): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type as response body with JSON content type.
    Expected response:
    - Content-Type header: application/json
    - Body: JSON content with file data
    """)
  @get
  @route("/response/json-content-type")
  op downloadFileJsonContentType(): Http.File<"application/json">;

  @scenario
  @scenarioDoc("""
    Test File type as response body with specific content type.
    Expected response:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @get
  @route("/response/specific-content-type")
  op downloadFileSpecificContentType(): Http.File<"image/png">;

  @scenario
  @scenarioDoc("""
    Test File type as request body with multiple allowed content types (image/png or image/jpeg).
    Client should send image/png.
    Expected request:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @post
  @route("/request/multiple-content-types")
  op uploadFileMultipleContentTypes(
    @bodyRoot file: Http.File<"image/png" | "image/jpeg">,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type as response body with multiple allowed content types.
    Service will return image/png.
    Expected response:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @get
  @route("/response/multiple-content-types")
  op downloadFileMultipleContentTypes(): Http.File<"image/png" | "image/jpeg">;

  @scenario
  @scenarioDoc("""
    Test File type as request body with unspecified content type.
    The File type accepts any content type. For testing, sender will use image/png.
    Expected request:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @post
  @route("/request/default-content-type")
  op uploadFileDefaultContentType(@bodyRoot file: Http.File): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type as response body with unspecified content type.
    The File type accepts any content type. For testing, server will return image/png.
    Expected response:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @get
  @route("/response/default-content-type")
  op downloadFileDefaultContentType(): Http.File;
}
