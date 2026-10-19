# Annotation-processor-free ClientCore generation

ClientCore and Azure Core v2 clients use the inline implementations emitted by
`ClientCoreProtocolImplementationTemplate`. The generated service interface's factory
constructs its implementation directly; no annotation processor or reflective factory
lookup is needed. Ordinary SDK metadata annotations are still emitted. Azure Core v1
continues to use its existing REST proxy path.

The ClientCore test module explicitly disables annotation processing (`proc=none`). A
clean build therefore checks that the generated libraries do not depend on previously
processed sources. `encode.bytes.ByteResponseTests` exercises JSON byte decoding and
response ownership with an in-memory HTTP transport; `encode.bytes.EncodeBytesTests`
also covers the corresponding Spector scenarios.

## Generator-side cleanup without runtime changes

- One `ClientCoreProtocolUtils` helper is emitted into the implementation package
  for libraries with concrete protocol methods. It centralizes typed JSON reader
  lifetime, empty-body handling, base64url token validation, response metadata
  wrapping and cleanup, and the XML error guard. Raw binary/streaming responses
  still transfer ownership to the caller.
- Serializer singleton references are static rather than stored per service
  implementation instance. Error-only serializers remain lazily obtained.
- Identical response/error type tokens and status-to-error maps are shared within
  each service implementation. Error maps are immutable and initialized once,
  rather than rebuilt on every failed request. One-off type tokens remain inline
  to avoid unnecessary declarations, and contiguous error-map entries with the
  same body type use compact JDK range initialization.
- Consecutive expected status codes are emitted as range comparisons, preserving
  holes and explicitly accepted non-2xx codes.
- Unreachable annotation-processor/reflection branches have been removed from
  `ProxyTemplate`; Azure Core v1 annotation generation is retained.

Public service interfaces are preserved. These changes use existing ClientCore
APIs and require no runtime dependency upgrade. A future runtime implementation
could replace the generated helper and eliminate its duplication across libraries.

### Measured generated source footprint

Targeted regeneration, counting all Java source in each scenario and including the
new helper, changed the line counts as follows:

| Scenario           | Before cleanup | After cleanup | Difference |
| ------------------ | -------------: | ------------: | ---------: |
| Byte encoding      |          3,378 |         3,155 |       -223 |
| Status-code ranges |          1,024 |           997 |        -27 |
| XML payloads       |         12,011 |        12,075 |        +64 |
| **Total**          |     **16,413** |    **16,227** |   **-186** |

The per-library helper has a fixed source-size cost. It is amortized by repeated
operation boilerplate, but it can slightly increase an XML-heavy library whose
operations need little of the JSON helper functionality. Static metadata also
reduces repeated allocation independently of source-line savings.

## Runtime helper opportunities

These are **proposed runtime improvements**, not APIs the generator can use today.
The observations below are based on ClientCore `1.0.0-beta.11`. Helpers in ClientCore
would benefit both unbranded libraries and Azure Core v2 libraries. Azure-specific
error behavior should remain in Azure Core v2 rather than leaking into ClientCore.

### High priority

1. **Typed JSON response decoder** accepting an
   `IOExceptionCheckedFunction<JsonReader, T>` (`writeResponseDeserialization`,
   `jsonResponseValue`). Replace repeated body-byte extraction, empty-body checks,
   reader lifetime, and checked-exception wrapping with one call and a reader
   expression. Keep missing/empty bodies, JSON `null`, and an empty JSON string
   distinct. Support recursive lists/maps and wire-to-client conversions, including
   base64/base64url and date encodings. A reader callback also avoids reflective
   model discovery. Reject invalid token shapes rather than interpreting a
   non-string base64url value as JSON `null`. The generated helper now removes the
   roughly 20-25 lines of repeated decoding/wrapping/cleanup per byte-response
   operation; a runtime helper would avoid shipping the utility in every library.
2. **Response mapping with explicit ownership** (`writeReturn`, `writeMethod`).
   Replace repeated `try`/`finally`, metadata copying, and `new Response<>(...)`
   construction. Close the network response on typed decoding success or failure,
   but transfer ownership unchanged for `Response<BinaryData>` and streaming
   responses. Do not close lazy binary data before the caller consumes it.
3. **Null-safe optional serializers in
   `GeneratedCodeUtils.handleUnexpectedResponse`** (`writeError`). The helper
   currently dereferences `xmlSerializer` when JSON does not support the response
   format. Consequently, the generated protocol helper retains an XML guard and
   close block. Accepting a missing XML serializer and throwing a consistent
   `HttpResponseException`, while always closing the response, would remove that
   guard. Preserve malformed/unsupported error-body information rather than
   surfacing a null dereference.

### Medium priority

4. **Immutable error descriptors or a status-to-error-type resolver** with
   status-code groups/ranges (`writeError`, `errorBodyType`). Avoid constructing a
   `HashMap<Integer, ParameterizedType>` and repeated type tokens on every error
   (the generator now caches these as immutable static metadata).
   Range-capable descriptors could reduce source size for specs defining entire
   status-code ranges. Preserve precedence: status-specific model, default model,
   then untyped body. Azure Core v2 could extend this with Azure-specific exception
   factories.
5. **Content-type-aware request-body serialization** (`writeBody`). Replace
   content-type defaulting, serializer selection, and `BinaryData.fromObject`
   boilerplate. Preserve caller-provided content types, omit the default content
   type for an absent optional body, and distinguish raw strings/bytes/streams
   from JSON-encoded values. Support vendor media types and media-type parameters.
6. **Single request-context application operation** (`writeMethod`). Replace the
   repeated null check, `HttpRequest.setContext`, and request-callback invocation.
   Apply callbacks exactly once and before sending through the pipeline, without
   dropping instrumentation context.
7. **Target-`Type` overload of `CoreUtils.decodeNetworkResponse`** with complete
   typed serializer support (`typeToken`, `writeResponseDeserialization`). Avoid
   wrapping each body type in a synthetic `Response<T>` token just to unwrap it
   again. `JsonSerializer` would also need to honor numeric widths, enums, encoded
   scalars, and recursively typed maps/lists; changing only the signature is
   insufficient. Type tokens and stateless serializers can otherwise be shared
   per generated implementation instead of recreated.

### Existing helpers to retain

- `GeneratedCodeUtils.addQueryParameter` already handles null values, escaping,
  repeated list values, and date formatting. Do not duplicate that logic in emitted
  operation bodies. Any extension should preserve those behaviors.
- `GeneratedCodeUtils.handleUnexpectedResponse` already centralizes error logging,
  model selection, deserialization, and response cleanup. Extend it rather than
  introducing another generated error utility per library.
- `CoreUtils.decodeNetworkResponse` already wraps checked deserialization failures.
  The typed-reader proposal should build on that capability rather than add a
  second, inconsistent exception policy.

### Suggested order

1. Add the null-safe error helper and typed-reader decoder to ClientCore.
2. Add response mapping with documented resource ownership.
3. Add reusable error descriptors and request/context helpers.
4. Update the generator's minimum runtime version and replace the corresponding
   emitted blocks only after the new APIs are available.

Most of these savings multiply by the number of operations, not just the number of
clients. The typed-reader and response-mapping helpers should be validated against
empty/null bodies, malformed JSON, encoded scalar collections, and streaming
ownership before replacing the current generated implementations.
