import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Test for file upload and download scenarios.
 */
@scenarioService("/payload/file")
namespace Payload.File;

/**
 * A custom file type that extends the base File type.
 */
model CustomFile extends Http.File {
  /**
   * Custom filename header.
   */
  @header("x-file-name")
  filename: string;
}

@route("/upload")
namespace Upload {
  @scenario
  @scenarioDoc("""
    Test uploading a file using Http.File as request body.
    Expected request body is a file with content "Test file content".
    """)
  @post
  @route("/basic")
  op basic(@body file: Http.File): OkResponse;

  @scenario
  @scenarioDoc("""
    Test uploading a file with a specific content type using Http.File.
    Expected request body is a file with content type "image/png".
    """)
  @post
  @route("/png")
  op png(@body file: Http.File<"image/png">): OkResponse;

  @scenario
  @scenarioDoc("""
    Test uploading a custom file type that extends Http.File.
    Expected request body includes custom filename header.
    """)
  @post
  @route("/custom")
  op custom(@bodyRoot file: CustomFile): OkResponse;
}

@route("/download")
namespace Download {
  @scenario
  @scenarioDoc("""
    Test downloading a file using Http.File as response body.
    Expected response body is a file with content "Test file content".
    """)
  @get
  @route("/basic")
  op basic(): Http.File;

  @scenario
  @scenarioDoc("""
    Test downloading a file with a specific content type using Http.File.
    Expected response body is a file with content type "image/png".
    """)
  @get
  @route("/png")
  op png(): Http.File<"image/png">;

  @scenario
  @scenarioDoc("""
    Test downloading a custom file type that extends Http.File.
    Expected response body includes custom filename header.
    """)
  @get
  @route("/custom")
  op custom(): CustomFile;
}
