import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Test for file upload and download scenarios.
 */
@scenarioService("/payload/file")
namespace Payload.File;

@route("/upload")
namespace Upload {
  @scenario
  @scenarioDoc("""
    Test uploading a file as request body.
    Expected request body is a file with content type "application/octet-stream".
    """)
  @post
  @route("/basic")
  op basic(@header contentType: "application/octet-stream", @body file: bytes): OkResponse;

  @scenario
  @scenarioDoc("""
    Test uploading a file with a specific content type.
    Expected request body is a file with content type "image/png".
    """)
  @post
  @route("/png")
  op png(@header contentType: "image/png", @body file: bytes): OkResponse;
}

@route("/download")
namespace Download {
  @scenario
  @scenarioDoc("""
    Test downloading a file as response body.
    Expected response body is a file with content type "application/octet-stream".
    """)
  @get
  @route("/basic")
  op basic(): {
    @header contentType: "application/octet-stream";
    @body file: bytes;
  };

  @scenario
  @scenarioDoc("""
    Test downloading a file with a specific content type.
    Expected response body is a file with content type "image/png".
    """)
  @get
  @route("/png")
  op png(): {
    @header contentType: "image/png";
    @body file: bytes;
  };
}
