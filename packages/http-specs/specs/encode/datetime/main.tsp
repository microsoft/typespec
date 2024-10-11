import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on datetime.")
@scenarioService("/encode/datetime")
namespace Encode.Datetime;

@encode(DateTimeKnownEncoding.unixTimestamp, int64)
scalar unixTimestampDatetime extends utcDateTime;

@route("/query")
namespace Query {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode (rfc3339) for datetime query parameter.
    Expected query parameter:
    value=2022-08-26T18:38:00.000Z
    """)
  op default(
    @query
    value: utcDateTime,
  ): NoContentResponse;

  @route("/rfc3339")
  @scenario
  @scenarioDoc("""
    Test rfc3339 encode for datetime query parameter.
    Expected query parameter:
    value=2022-08-26T18:38:00.000Z
    """)
  op rfc3339(
    @query
    @encode(DateTimeKnownEncoding.rfc3339)
    value: utcDateTime,
  ): NoContentResponse;

  @route("/rfc7231")
  @scenario
  @scenarioDoc("""
    Test rfc7231 encode for datetime query parameter.
    Expected query parameter:
    value=Fri, 26 Aug 2022 14:38:00 GMT
    """)
  op rfc7231(
    @query
    @encode(DateTimeKnownEncoding.rfc7231)
    value: utcDateTime,
  ): NoContentResponse;

  @route("/unix-timestamp")
  @scenario
  @scenarioDoc("""
    Test unixTimestamp encode for datetime query parameter.
    Expected query parameter:
    value=1686566864
    """)
  op unixTimestamp(
    @query
    @encode(DateTimeKnownEncoding.unixTimestamp, int64)
    value: utcDateTime,
  ): NoContentResponse;

  @route("/unix-timestamp-array")
  @scenario
  @scenarioDoc("""
    Test unixTimestamp encode for datetime array query parameter.
    Expected query parameter:
    value=1686566864, 1686734256
    """)
  op unixTimestampArray(
    #suppress "deprecated" "Deprecated in next release"
    @query({
      format: "csv",
    })
    value: unixTimestampDatetime[],
  ): NoContentResponse;
}

model DefaultDatetimeProperty {
  value: utcDateTime;
}

model Rfc3339DatetimeProperty {
  @encode(DateTimeKnownEncoding.rfc3339)
  value: utcDateTime;
}

model Rfc7231DatetimeProperty {
  @encode(DateTimeKnownEncoding.rfc7231)
  value: utcDateTime;
}

model UnixTimestampDatetimeProperty {
  @encode(DateTimeKnownEncoding.unixTimestamp, int64)
  value: utcDateTime;
}

model UnixTimestampArrayDatetimeProperty {
  value: unixTimestampDatetime[];
}

@route("/property")
namespace Property {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains datetime property with default encode (rfc3339).
    Expected request body:
    ```json
    {
      "value": "2022-08-26T18:38:00.000Z"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "2022-08-26T18:38:00.000Z"
    }
    ```
    """)
  @post
  op default(@body body: DefaultDatetimeProperty): DefaultDatetimeProperty;

  @route("/rfc3339")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains datetime property with rfc3339 encode.
    Expected request body:
    ```json
    {
      "value": "2022-08-26T18:38:00.000Z"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "2022-08-26T18:38:00.000Z"
    }
    ```
    """)
  @post
  op rfc3339(@body body: Rfc3339DatetimeProperty): Rfc3339DatetimeProperty;

  @route("/rfc7231")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains datetime property with rfc7231 encode.
    Expected request body:
    ```json
    {
      "value": "Fri, 26 Aug 2022 14:38:00 GMT"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "Fri, 26 Aug 2022 14:38:00 GMT"
    }
    ```
    """)
  @post
  op rfc7231(@body body: Rfc7231DatetimeProperty): Rfc7231DatetimeProperty;

  @route("/unix-timestamp")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains datetime property with unixTimestamp encode.
    Expected request body:
    ```json
    {
      "value": 1686566864
    }
    ```
    Expected response body:
    ```json
    {
      "value": 1686566864
    }
    ```
    """)
  @post
  op unixTimestamp(@body body: UnixTimestampDatetimeProperty): UnixTimestampDatetimeProperty;

  @route("/unix-timestamp-array")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains datetime array property with unixTimestamp encode.
    Expected request body:f
    ```json
    {
      "value": [1686566864, 1686734256]
    }
    ```
    Expected response body:
    ```json
    {
      "value": [1686566864, 1686734256]
    }
    ```
    """)
  @post
  op unixTimestampArray(
    @body body: UnixTimestampArrayDatetimeProperty,
  ): UnixTimestampArrayDatetimeProperty;
}

@route("/header")
namespace Header {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode (rfc7231) for datetime header.
    Expected header:
    value=Fri, 26 Aug 2022 14:38:00 GMT
    """)
  op default(
    @header
    value: utcDateTime,
  ): NoContentResponse;

  @route("/rfc3339")
  @scenario
  @scenarioDoc("""
    Test rfc3339 encode for datetime header.
    Expected header:
    value=2022-08-26T18:38:00.000Z
    """)
  op rfc3339(
    @header
    @encode(DateTimeKnownEncoding.rfc3339)
    value: utcDateTime,
  ): NoContentResponse;

  @route("/rfc7231")
  @scenario
  @scenarioDoc("""
    Test rfc7231 encode for datetime header.
    Expected header:
    value=Fri, 26 Aug 2022 14:38:00 GMT
    """)
  op rfc7231(
    @header
    @encode(DateTimeKnownEncoding.rfc7231)
    value: utcDateTime,
  ): NoContentResponse;

  @route("/unix-timestamp")
  @scenario
  @scenarioDoc("""
    Test unixTimestamp encode for datetime header.
    Expected header:
    value=1686566864
    """)
  op unixTimestamp(
    @header
    @encode(DateTimeKnownEncoding.unixTimestamp, int64)
    value: utcDateTime,
  ): NoContentResponse;

  @route("/unix-timestamp-array")
  @scenario
  @scenarioDoc("""
    Test unixTimestamp encode for datetime array header.
    Expected header:
    value=1686566864,1686734256
    """)
  op unixTimestampArray(
    @header({
      format: "csv",
    })
    value: unixTimestampDatetime[],
  ): NoContentResponse;
}

model DefaultDatetimeHeader {
  @header
  value: utcDateTime;
}

model Rfc3339DatetimeHeader {
  @encode(DateTimeKnownEncoding.rfc3339)
  @header
  value: utcDateTime;
}

model Rfc7231DatetimeHeader {
  @encode(DateTimeKnownEncoding.rfc7231)
  @header
  value: utcDateTime;
}

model UnixTimestampDatetimeHeader {
  @encode(DateTimeKnownEncoding.unixTimestamp, int64)
  @header
  value: utcDateTime;
}

@route("/responseheader")
namespace ResponseHeader {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode (rfc7231) for datetime header.
    Expected response header:
    value=Fri, 26 Aug 2022 14:38:00 GMT
    """)
  op default(): NoContentResponse & DefaultDatetimeHeader;

  @route("/rfc3339")
  @scenario
  @scenarioDoc("""
    Test rfc3339 encode for datetime header.
    Expected response header:
    value=2022-08-26T18:38:00.000Z
    """)
  op rfc3339(): NoContentResponse & Rfc3339DatetimeHeader;

  @route("/rfc7231")
  @scenario
  @scenarioDoc("""
    Test rfc7231 encode for datetime header.
    Expected response header:
    value=Fri, 26 Aug 2022 14:38:00 GMT
    """)
  op rfc7231(): NoContentResponse & Rfc7231DatetimeHeader;

  @route("/unix-timestamp")
  @scenario
  @scenarioDoc("""
    Test unixTimestamp encode for datetime header.
    Expected response header:
    value=1686566864
    """)
  op unixTimestamp(): NoContentResponse & UnixTimestampDatetimeHeader;
}
