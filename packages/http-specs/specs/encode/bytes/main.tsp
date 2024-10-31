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
    #suppress "deprecated" "Deprecated in next release"
    @query({
      format: "csv",
    })
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
    @header({
      format: "csv",
    })
    value: base64urlBytes[],
  ): NoContentResponse;
}

@route("/body/request")
namespace RequestBody {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode (base64) for bytes in a json body.
    Expected body:
    "dGVzdA==" (base64 encode of test, in JSON string)
    """)
  @post
  op default(
    @body
    value: bytes,
  ): NoContentResponse;

  @route("/octet-stream")
  @scenario
  @scenarioDoc("""
    When content type is application/octet-stream and body is `bytes` the payload is a binary file.
    File should match packages/cadl-ranch-specs/assets/image.png
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
    File should match packages/cadl-ranch-specs/assets/image.png
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
    Test default encode (base64) for bytes in a json body.
    Expected body:
    "dGVzdA==" (base64 encode of test, in JSON string)
    """)
  op default(): {
    @body
    value: bytes;
  };

  @route("/octet-stream")
  @scenario
  @scenarioDoc("""
    When content type is application/octet-stream and body is `bytes` the payload is a binary file.
    File should match packages/cadl-ranch-specs/assets/image.png
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
    File should match packages/cadl-ranch-specs/assets/image.png
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
  op base64url(): base64urlBytes;
}
