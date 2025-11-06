import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Test the payload with different media types and different types of the payload itself.
 */
@scenarioService("/payload/media-type")
namespace Payload.MediaType;

@route("/string-body")
namespace StringBody {
  @scenario
  @scenarioDoc("""
    Expected request body is a string '{cat}'.
    """)
  @post
  @route("/sendAsText")
  op sendAsText(@header contentType: "text/plain", @body text: string): OkResponse;

  @scenario
  @scenarioDoc("""
    Expected response body is a string '{cat}'.
    """)
  @get
  @route("/getAsText")
  op getAsText(): {
    @header contentType: "text/plain";
    @body text: string;
  };

  @scenario
  @scenarioDoc("""
    Expected request body is "foo".
    """)
  @post
  @route("/sendAsJson")
  op sendAsJson(@header contentType: "application/json", @body text: string): OkResponse;

  @scenario
  @scenarioDoc("""
    Expected response body is "foo".
    """)
  @get
  @route("/getAsJson")
  op getAsJson(): {
    @header contentType: "application/json";
    @body text: string;
  };
}
