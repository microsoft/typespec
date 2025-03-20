import "@typespec/http";
import "@typespec/versioning";
import "@typespec/spector";

using Http;
using Spector;
using Versioning;

@doc("Illustrates conditional request headers")
@scenarioService("/special-headers/conditional-request")
namespace SpecialHeaders.ConditionalRequest;

@scenario
@doc("""
  Check when only If-Match in header is defined.
  """)
@scenarioDoc("""
  Check when only If-Match in header is defined.
  Expected header parameters:
  - if-match="valid"
  """)
@post
@route("/if-match")
op postIfMatch(
  @header("If-Match")
  @doc("The request should only proceed if an entity matches this string.")
  ifMatch?: string,
): NoContentResponse;

@scenario
@doc("""
  Check when only If-None-Match in header is defined.
  """)
@scenarioDoc("""
  Check when only If-None-Match in header is defined.
  Expected header parameters:
  - if-nonematch="invalid"
  """)
@post
@route("/if-none-match")
op postIfNoneMatch(
  @header("If-None-Match")
  @doc("The request should only proceed if no entity matches this string.")
  ifNoneMatch?: string,
): NoContentResponse;

@scenario
@doc("""
  Check when only If-Modified-Since in header is defined.
  """)
@scenarioDoc("""
  Check when only If-Modified-Since in header is defined.
  Expected header parameters:
  - if-modified-since=Fri, 26 Aug 2022 14:38:00 GMT
  """)
@head
@route("/if-modified-since")
op headIfModifiedSince(
  @doc("""
    A timestamp indicating the last modified time of the resource known to the
    client. The operation will be performed only if the resource on the service has
    been modified since the specified time.
    """)
  @header("If-Modified-Since")
  @encode(DateTimeKnownEncoding.rfc7231)
  ifModifiedSince?: utcDateTime,
): NoContentResponse;

@scenario
@doc("""
  Check when only If-Unmodified-Since in header is defined.
  """)
@scenarioDoc("""
  Check when only If-Unmodified-Since in header is defined.
  Expected header parameters:
  - if-unmodified-since=Fri, 26 Aug 2022 14:38:00 GMT
  """)
@post
@route("/if-unmodified-since")
op postIfUnmodifiedSince(
  @doc("""
    A timestamp indicating the last modified time of the resource known to the
    client. The operation will be performed only if the resource on the service has
    not been modified since the specified time.
    """)
  @header("If-Unmodified-Since")
  @encode(DateTimeKnownEncoding.rfc7231)
  ifUnmodifiedSince?: utcDateTime,
): NoContentResponse;
