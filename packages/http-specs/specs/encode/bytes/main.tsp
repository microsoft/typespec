import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on bytes.")
@scenarioService("/encode/bytes")
namespace Encode.Bytes;

@encode(BytesKnownEncoding.base64url)
scalar base64urlBytes extends bytes;

@route("/query")
namespace Query {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode (base64) for bytes query parameter.
    Expected query parameter:
    value=dGVzdA== (base64 encode of test)
    """)
  op default(
    @query
    value: bytes,
  ): NoContentResponse;

  @route("/base64")
  @scenario
  @scenarioDoc("""
    Test base64 encode for bytes query parameter.
    Expected query parameter:
    value=dGVzdA== (base64 encode of test)
    """)
  op base64(
    @query
    @encode(BytesKnownEncoding.base64)
    value: bytes,
  ): NoContentResponse;

  @route("/base64url")
  @scenario
  @scenarioDoc("""
    Test base64url encode for bytes query parameter.
    Expected query parameter:
    value=dGVzdA (base64url encode of test)
    """)
  op base64url(
    @query
    @encode(BytesKnownEncoding.base64url)
    value: bytes,
  ): NoContentResponse;

  @route("/base64url-array")
  @scenario
  @scenarioDoc("""
    Test base64url encode for bytes array query parameter.
    Expected query parameter:
    value=dGVzdA, dGVzdA
    """)
  op base64urlArray(
    @query
    value: base64urlBytes[],
  ): NoContentResponse;
}

model DefaultBytesProperty {
  value: bytes;
}

model Base64BytesProperty {
  @encode(BytesKnownEncoding.base64)
  value: bytes;
}

model Base64urlBytesProperty {
  @encode(BytesKnownEncoding.base64url)
  value: bytes;
}

model Base64urlArrayBytesProperty {
  value: base64urlBytes[];
}

@route("/property")
namespace Property {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains bytes properties with default encode (base64).
    Expected request body:
    ```json
    {
      "value": "dGVzdA==" // base64 encode of test
    }
    ```
    Expected response body:
    ```json
    {
      "value": "dGVzdA=="
    }
    ```
    """)
  @post
  op default(@body body: DefaultBytesProperty): DefaultBytesProperty;

  @route("/base64")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains bytes properties with base64 encode.
    Expected request body:
    ```json
    {
      "value": "dGVzdA==" // base64 encode of test
    }
    ```
    Expected response body:
    ```json
    {
      "value": "dGVzdA=="
    }
    ```
    """)
  @post
  op base64(@body body: Base64BytesProperty): Base64BytesProperty;

  @route("/base64url")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains bytes properties with base64url encode.
    Expected request body:
    ```json
    {
      "value": "dGVzdA" // base64url encode of test
    }
    ```
    Expected response body:
    ```json
    {
      "value": "dGVzdA"
    }
    ```
    """)
  @post
  op base64url(@body body: Base64urlBytesProperty): Base64urlBytesProperty;

  @route("/base64url-array")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains bytes array properties with base64url encode.
    Expected request body:
    ```json
    {
      "value": ["dGVzdA", "dGVzdA"]
    }
    ```
    Expected response body:
    ```json
    {
      "value": ["dGVzdA", "dGVzdA"]
    }
    ```
    """)
  @post
  op base64urlArray(@body body: Base64urlArrayBytesProperty): Base64urlArrayBytesProperty;
}

@route("/header")
namespace Header {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode (base64) for bytes header.
    Expected header:
    value=dGVzdA== (base64 encode of test)
    """)
  op default(
    @header
    value: bytes,
  ): NoContentResponse;

  @route("/base64")
  @scenario
  @scenarioDoc("""
    Test base64 encode for bytes header.
    Expected header:
    value=dGVzdA== (base64 encode of test)
    """)
  op base64(
    @header
    @encode(BytesKnownEncoding.base64)
    value: bytes,
  ): NoContentResponse;

  @route("/base64url")
  @scenario
  @scenarioDoc("""
    Test base64url encode for bytes header.
    Expected header:
    value=dGVzdA (base64url encode of test)
    """)
  op base64url(
    @header
    @encode(BytesKnownEncoding.base64url)
    value: bytes,
  ): NoContentResponse;

  @route("/base64url-array")
  @scenario
  @scenarioDoc("""
    Test base64url encode for bytes array header.
    Expected header:
    value=dGVzdA,dGVzdA
    """)
  op base64urlArray(
    @header
    value: base64urlBytes[],
  ): NoContentResponse;
}

@route("/body/request")
namespace RequestBody {
  @route("/default")
  @scenario
  @scenarioDoc("""
    When content type is not defined and body is `bytes` the payload is a binary stream.
    Stream should match packages/http-specs/assets/image.png file.
    """)
  @post
  op default(
    @body
    value: bytes,
  ): NoContentResponse;

  @route("/octet-stream")
  @scenario
  @scenarioDoc("""
    When content type is application/octet-stream and body is `bytes` the payload is a binary stream.
    Stream should match packages/http-specs/assets/image.png file.
    """)
  @post
  op octetStream(
    @header
    contentType: "application/octet-stream",

    @body
    value: bytes,
  ): NoContentResponse;

  @route("/custom-content-type")
  @scenario
  @scenarioDoc("""
    When content type is a custom type(image/png here) and body is `bytes` the payload is a binary file.
    File should match packages/http-specs/assets/image.png.
    """)
  @post
  op customContentType(
    @header
    contentType: "image/png",

    @body
    value: bytes,
  ): NoContentResponse;

  @route("/base64")
  @scenario
  @scenarioDoc("""
    Test base64 encode for bytes body.
    Expected body:
    "dGVzdA==" (base64 encode of test, in JSON string)
    """)
  @post
  op base64(
    @header
    contentType: "application/json",

    @body
    @encode(BytesKnownEncoding.base64)
    value: bytes,
  ): NoContentResponse;

  @route("/base64url")
  @scenario
  @scenarioDoc("""
    Test base64url encode for bytes body.
    Expected body:
    "dGVzdA" (base64url encode of test, in JSON string)
    """)
  @post
  op base64url(
    @header
    contentType: "application/json",

    @body
    @encode(BytesKnownEncoding.base64url)
    value: bytes,
  ): NoContentResponse;
}

@route("/body/response")
namespace ResponseBody {
  @route("/default")
  @scenario
  @scenarioDoc("""
    When content type is not defined and body is `bytes` the payload is a binary stream.
    Stream should match packages/http-specs/assets/image.png file.
    """)
  op default(): {
    @body
    value: bytes;
  };

  @route("/octet-stream")
  @scenario
  @scenarioDoc("""
    When content type is application/octet-stream and body is `bytes` the payload is a binary stream.
    Stream should match packages/http-specs/assets/image.png file.
    """)
  op octetStream(): {
    @header
    contentType: "application/octet-stream";

    @body
    value: bytes;
  };

  @route("/custom-content-type")
  @scenario
  @scenarioDoc("""
    When content type is a custom type(image/png here) and body is `bytes` the payload is a binary file.
    File should match packages/http-specs/assets/image.png
    """)
  op customContentType(): {
    @header
    contentType: "image/png";

    @body
    value: bytes;
  };

  @route("/base64")
  @scenario
  @scenarioDoc("""
    Test base64 encode for bytes body.
    Expected body:
    "dGVzdA==" (base64 encode of test, in JSON string)
    """)
  op base64(): {
    @header
    contentType: "application/json";

    @body
    @encode(BytesKnownEncoding.base64)
    value: bytes;
  };

  @route("/base64url")
  @scenario
  @scenarioDoc("""
    Test base64url encode for bytes body.
    Expected body:
    "dGVzdA" (base64url encode of test, in JSON string)
    """)
  op base64url(): {
    @header
    contentType: "application/json";

    @body
    @encode(BytesKnownEncoding.base64url)
    body: base64urlBytes;
  };
}

@route("/body/request")
namespace RequestBodyContentType {
  @route("/cbor")
  @scenario
  @scenarioDoc("""
    Test sending bytes body with application/cbor content type.
    Expected request body is the bytes representing CBOR-encoded data: {"key": "value"}.
    Expected Content-Type header: application/cbor.
    """)
  @post
  op cbor(
    @header
    contentType: "application/cbor",

    @body
    value: bytes,
  ): NoContentResponse;

  @route("/cose")
  @scenario
  @scenarioDoc("""
    Test sending bytes body with application/cose content type (COSE Sign1 signature).
    Expected request body is the bytes representing a COSE Sign1 envelope.
    Expected Content-Type header: application/cose.
    """)
  @post
  op cose(
    @header
    contentType: "application/cose",

    @body
    value: bytes,
  ): NoContentResponse;
}

@route("/body/response")
namespace ResponseBodyContentType {
  @route("/cbor")
  @scenario
  @scenarioDoc("""
    Test receiving bytes body with application/cbor content type.
    Expected response body is the bytes representing CBOR-encoded data: {"status": "succeeded"}.
    Expected Content-Type header: application/cbor.
    """)
  op cbor(): {
    @header
    contentType: "application/cbor";

    @body
    value: bytes;
  };

  @route("/cose")
  @scenario
  @scenarioDoc("""
    Test receiving bytes body with application/cose content type.
    Expected response body is the bytes representing a COSE Sign1 envelope.
    Expected Content-Type header: application/cose.
    """)
  op cose(): {
    @header
    contentType: "application/cose";

    @body
    value: bytes;
  };

  @route("/cbor-with-location")
  @scenario
  @scenarioDoc("""
    Test receiving bytes body with application/cbor content type and Location header.
    Expected response body is the bytes representing CBOR-encoded operation status.
    Expected Content-Type header: application/cbor.
    Expected Location header: /operations/12345.
    """)
  op cborWithLocation(): {
    @statusCode
    statusCode: 200;

    @header
    contentType: "application/cbor";

    @header
    location?: string;

    @body
    value: bytes;
  };

  @route("/cbor-pending")
  @scenario
  @scenarioDoc("""
    Test receiving pending response with application/cbor content type, Location and Retry-After headers.
    Expected status code: 202.
    Expected Content-Type header: application/cbor.
    Expected Location header: /operations/67890.
    Expected Retry-After header: 10.
    """)
  op cborPending(): {
    @statusCode
    statusCode: 202;

    @header
    contentType: "application/cbor";

    @header
    location?: string;

    @header("Retry-After")
    retryAfter?: int32;

    @body
    value: bytes;
  };

  @route("/cbor-error")
  @scenario
  @scenarioDoc("""
    Test receiving error response with application/concise-problem-details+cbor content type.
    Expected status code: 400.
    Expected Content-Type header: application/concise-problem-details+cbor.
    Expected response body is the bytes representing CBOR-encoded problem details.
    """)
  op cborError(): {
    @statusCode
    statusCode: 400;

    @header
    contentType: "application/concise-problem-details+cbor";

    @body
    error: bytes;
  };
}
