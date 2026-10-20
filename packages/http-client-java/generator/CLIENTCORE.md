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

- One capability-specific `ClientCoreProtocolUtils` helper is emitted into the implementation package
  for libraries that call it. It centralizes typed JSON reader
  lifetime, empty-body handling, base64url token validation, response metadata
  wrapping and cleanup, and the XML error guard. Raw binary/streaming responses
  still transfer ownership to the caller.
- `ClientCoreProtocolUtilsTemplate` selects methods from actual helper calls and
  method references across the emitted library, then retains transitive helper
  dependencies and removes unused methods/imports from the resource catalog.
  Default-only clients emit no helper; XML-only operations do not bring in unused
  JSON readers or base64 decoders. This avoids a second set of model predicates
  that could drift from operation generation.
- Every method is independently optional through `OptionalUtilityTemplate`.
  Qualified calls, static imports, method references, and referenced constants
  determine the emitted members. Only required private methods, constants, and
  imports follow those roots; empty selections emit no utility class. The same
  mechanism also handles ClientCore-based Azure Core v2 `PollingUtils`, including
  its retry-delay parsing dependencies. Instance-based helpers and Azure Core v1
  utilities retain their existing generation paths.
- Request sending shares context/callback application, exactly once after headers
  and bodies have been assembled. Optional-body helpers lazily serialize non-null
  bodies, preserve explicit content types, and select JSON/XML serializers when
  necessary. Mixed-format response dispatch is also shared without losing typed
  wire-to-client conversions.
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

### Optional protocol methods

| Method                     | Generated when needed for                                    |
| -------------------------- | ------------------------------------------------------------ |
| `send`                     | Applying a request context and callback before pipeline send |
| `setBody`                  | Lazy optional-body serialization and default content type    |
| `setMixedBody`             | Choosing a request body serializer from JSON/XML formats     |
| `readMixed`                | Choosing a response decoder from JSON/XML formats            |
| `readJson`                 | Typed JSON decoding, including encoded scalar collections    |
| `readBase64Url`            | Base64url byte decoding                                      |
| `readResponse`             | Unwrapped typed response decoding with cleanup               |
| `mapResponse`              | Typed response wrapping with cleanup                         |
| `handleUnexpectedResponse` | HTTP error handling                                          |

Dependencies remain mandatory only when a selected method calls them; for
example, `setMixedBody` also retains `setBody`. `OptionalUtilityTemplateTests`
independently compiles every protocol and polling method selection using
`-proc:none`, and checks that its parameterized cases cover the entire catalogs.

### Measured generated source footprint

This iteration's targeted regeneration, counting all Java source in each scenario
including the helpers, changed the line counts as follows:

| Scenario           | Before dynamic helpers | After dynamic helpers | Difference |
| ------------------ | ---------------------: | --------------------: | ---------: |
| Byte encoding      |                  3,155 |                 3,064 |        -91 |
| Status-code ranges |                    997 |                   967 |        -30 |
| XML payloads       |                 12,075 |                11,478 |       -597 |
| **Total**          |             **16,227** |            **15,509** |   **-718** |

The previous fixed helper added 64 lines to the XML scenario. Capability trimming
and extraction of mixed-format/context/body logic now reduce that scenario by 597
lines instead. Static metadata also reduces repeated allocation independently of
source-line savings. A small library still pays for the helper methods it uses,
but not for unrelated capabilities.

### Additional generator-only extraction candidates

- `writeHeader`: share nullable header updates and prefixed header-map loops, while
  preserving the template's wire-value conversions and existing override order.
  Repeated `HttpHeaderName.fromString` values can also be cached per implementation.
- `jsonResponseValue`: deduplicate identical nested reader expressions by complete
  wire type, rather than client type alone, so base64/base64url and date encodings
  remain distinct. Emit named readers only when reused enough to offset their size.
- Instrumented convenience methods: investigate redundant nested instrumentation
  across public clients and implementation clients. This needs tracing/span
  ownership tests before changing behavior, rather than a mechanical extraction.

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
   Generated body helpers now centralize these guards and format selection; a
   runtime API would remove the remaining per-library helper implementation.
6. **Single request-context application operation** (`writeMethod`). Replace the
   repeated null check, `HttpRequest.setContext`, and request-callback invocation.
   Apply callbacks exactly once and before sending through the pipeline, without
   dropping instrumentation context. The generated `send` helper now provides
   this behavior using the existing runtime APIs.
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
