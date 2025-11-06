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

@route("/binary-body")
namespace BinaryBody {
  @scenario
  @scenarioDoc("""
    Send binary body with application/cbor content type.
    Expected request body is the bytes representing CBOR-encoded data: {\"key\": \"value\"}.
    """)
  @post
  @route("/sendAsCbor")
  op sendAsCbor(@header contentType: "application/cbor", @body data: bytes): OkResponse;

  @scenario
  @scenarioDoc("""
    Get binary body with application/cbor content type.
    Expected response body is the bytes representing CBOR-encoded data: {\"status\": \"succeeded\"}.
    Expected Content-Type header: application/cbor.
    """)
  @get
  @route("/getAsCbor")
  op getAsCbor(): {
    @header contentType: "application/cbor";
    @body data: bytes;
  };

  @scenario
  @scenarioDoc("""
    Send binary body with application/cose content type (COSE Sign1 signature).
    Expected request body is the bytes representing a COSE Sign1 envelope.
    """)
  @post
  @route("/sendAsCose")
  op sendAsCose(@header contentType: "application/cose", @body data: bytes): OkResponse;

  @scenario
  @scenarioDoc("""
    Get binary body with application/cose content type.
    Expected response body is the bytes representing a COSE Sign1 envelope.
    Expected Content-Type header: application/cose.
    """)
  @get
  @route("/getAsCose")
  op getAsCose(): {
    @header contentType: "application/cose";
    @body data: bytes;
  };

  @scenario
  @scenarioDoc("""
    Get binary body with application/cbor content type and Location header.
    Expected response body is the bytes representing CBOR-encoded operation status.
    Expected Content-Type header: application/cbor.
    Expected Location header: /operations/12345.
    """)
  @get
  @route("/getWithLocationHeader")
  op getWithLocationHeader(): {
    @statusCode statusCode: 200;
    @header contentType: "application/cbor";
    @header location?: string;
    @body data: bytes;
  };

  @scenario
  @scenarioDoc("""
    Get pending response with application/cbor content type, Location and Retry-After headers.
    Expected status code: 202.
    Expected Content-Type header: application/cbor.
    Expected Location header: /operations/67890.
    Expected Retry-After header: 10.
    """)
  @get
  @route("/getPendingWithHeaders")
  op getPendingWithHeaders(): {
    @statusCode statusCode: 202;
    @header contentType: "application/cbor";
    @header location?: string;
    @header("Retry-After") retryAfter?: int32;
    @body data: bytes;
  };

  @scenario
  @scenarioDoc("""
    Get response with application/concise-problem-details+cbor content type for errors.
    Expected status code: 400.
    Expected Content-Type header: application/concise-problem-details+cbor.
    Expected response body is the bytes representing CBOR-encoded problem details.
    """)
  @get
  @route("/getErrorAsCbor")
  op getErrorAsCbor(): {
    @statusCode statusCode: 400;
    @header contentType: "application/concise-problem-details+cbor";
    @body error: bytes;
  };
}
