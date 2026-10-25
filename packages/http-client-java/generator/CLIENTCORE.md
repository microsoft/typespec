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
  its retry-delay parsing dependencies, and the ClientCore-based instance
  `MultipartFormDataHelper`. Polymorphic instance helpers and Azure Core v1
  utilities retain their existing generation paths.
- Request sending shares context/callback application, exactly once after headers
  and bodies have been assembled. Optional-body helpers lazily serialize non-null
  bodies, preserve explicit content types, and select JSON/XML serializers when
  necessary. Mixed-format response dispatch is also shared without losing typed
  wire-to-client conversions.
- Serializer singleton references are static rather than stored per service
  implementation instance. Error-only serializers remain lazily obtained.
- Custom literal `HttpHeaderName.fromString` values and statically known
  `CoreUtils.createParameterizedType` expressions are collected into one separately
  generated constants class per library, shared by clients, method groups, and
  helpers. Its name uses the full root Java package in PascalCase followed by
  `Constants`: for example, `encode.bytes` generates `EncodeBytesConstants` in the
  implementation package. Parameterized types use descriptive fields such as
  `LIST_OF_INTEGER_TYPE`, `MAP_OF_STRING_AND_LIST_OF_INTEGER_TYPE`, and
  `ERROR_IN_RANGE_TYPE` instead of positional `TYPE_0` names. Arrays include an
  `_ARRAY` segment per dimension; colliding normalized names receive a numeric
  suffix without merging distinct types. Unrelated new types do not renumber
  existing fields. Nested type tokens are initialized before their dependents.
  Model imports are resolved before deduplication so different classes with the
  same simple name are not conflated. Dynamic header names, runtime types, and
  inaccessible local/private classes remain at the call site.
- Known ClientCore headers reuse its public `HttpHeaderName` constants instead of
  emitting duplicate package fields. The generator shares the reflection-backed
  model-header lookup and matches case-insensitively, so `content-type` uses
  `HttpHeaderName.CONTENT_TYPE` with ClientCore's canonical spelling. Custom header
  spelling is preserved. Rewritten references handle imports and shadowed names;
  libraries with only known headers and no shared type tokens emit no constants
  class. Generated libraries need neither reflection nor annotation processing for
  this reuse.
- Status-to-error maps remain immutable and shared within each service
  implementation, referencing the library-wide type constants rather than
  creating their own tokens. Contiguous entries with the same body type use
  compact JDK range initialization.
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

### Optional multipart methods and instance dependencies

ClientCore and Azure Core v2 libraries select `MultipartFormDataHelper` methods
from their generated convenience methods. Text-only requests do not include JSON
or file serialization; single-file requests do not include the file-array serializer.
Selections are combined across all clients and method groups in a library.
Multipart models alone no longer trigger helper emission. Typed clients with no
helper calls omit the class entirely; the text/file-array smoke clients in both
flavors and the standard ClientCore multipart scenario exercise this case.

- Construction, constructor references, fluent chains, typed/inferred local
  variables, parameters, and `this`-qualified helper fields are recognized.
  Bound and unbound method references also select methods. Receiver lookup
  respects local scopes so similarly named methods on unrelated objects do not
  pull in helper capabilities.
- Constructors and initializer blocks are preserved, along with methods and fields
  they need. Dependencies include `this.method()`, `this.field`, and
  `this::method`, as well as field initializers and unqualified calls. This avoids
  removing initialization-only dependencies when trimming instance methods.
- A constructor-only or type-only reference retains the class without unused
  methods. Unused imports and helper names in strings/comments do not select it.
- Instance catalogs must be final and have no superclass or implemented interface;
  the selector rejects inherited contracts rather than removing required overrides.
  All overloads of a selected method name and all constructors are conservatively
  retained. This is a selector for emitted template expressions, not a general
  Java symbol resolver or a reflection-based API trimmer.

`OptionalInstanceUtilityTemplateTests` independently compiles every multipart
method using `-proc:none`. It verifies constructor/initializer dependencies and
receiver scopes, and compares trimmed text, JSON, single-file, and file-array
serialization against the full catalog, including null values and escaped names.
`OptionalMultipartHelperTests` verifies that the plugin uses this selector, omits
unused helpers, and preserves Azure Core v1's existing multipart catalog.

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
  Literal header names already use the library-wide constants collector.
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
8. **Streaming multipart writer** accepting text, JSON, and `BinaryData` parts,
   including repeated file fields. Libraries that actually use the generated
   multipart helper still ship boundary management,
   disposition-name/filename escaping, stream concatenation, and content-length
   accounting after unused part serializers are trimmed. A runtime writer could
   eliminate that remaining helper. Return the
   body and its content headers together so callers can apply them to an immutable
   `RequestContext` without losing boundary metadata. Preserve lazy file streams,
   null optional parts, filename escaping, per-part content types, and ownership.

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
