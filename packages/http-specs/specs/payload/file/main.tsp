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
 * A text file type that extends the base File type.
 */
model TextFile extends Http.File<"text/plain", string> {
  /**
   * Custom filename header.
   */
  @header("x-filename")
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
    Test uploading a text file type that extends Http.File.

    Expected request body includes:
    header x-filename: "file.txt".
    header Content-Type: "text/plain".
    body content: "Text file value".
    """)
  @post
  @route("/text")
  op text(@bodyRoot file: TextFile): OkResponse;
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
    Test downloading a text file type that extends Http.File.
    Expected response body includes:
    header x-file-name: "file.txt".
    header Content-Type: "text/plain".
    body content: "Text file value".
    """)
  @get
  @route("/text")
  op text(): TextFile;
}
