# @typespec/http-canonicalization

** WARNING: THIS PACKAGE IS EXPERIMENTAL AND WILL CHANGE **

Utilities for emitters and tooling that need to understand type shapes in the HTTP protocol. The canonicalizer produces a mutated type graph specifying shapes in the language and on the wire, as well as groups together relevant HTTP metadata from various compiler APIs in a convenient package.

## Why you might use it

- Get HTTP request and response shapes.
- Apply visibility transforms.
- Understand how types are serialized to HTTP.
- Get tests to determine how to discriminate non-discriminated unions.

## Installation

```bash
pnpm add @typespec/http-canonicalization
```

Peer dependencies `@typespec/compiler` and `@typespec/http` must be installed.

## Quick start

TypeSpec service definition:

```typespec
import "@typespec/http";

model Foo {
  @visibility(Lifecycle.Read)
  @encode(DateTimeKnownEncoding.rfc7231)
  createdAt: utcDateTime;

  @visibility(Lifecycle.Create)
  name: string;
}

@route("/foo")
@post
op createFoo(@body foo: Foo): Foo;
```

Emitter-side usage:

```ts
import { $ } from "@typespec/compiler/typekit";
import { HttpCanonicalizer } from "@typespec/http-canonicalization";

const tk = $(program);
const canonicalizer = new HttpCanonicalizer(tk);
const http = canonicalizer.canonicalize(op);
const body = http.requestParameters.body!.type;
// body.type.languageType.name === "FooCreate"
// body.type.visibleProperties => only "name"

const response = http.responses[0];
// response.type.languageType.properties has both "name" and "createdAt"
// response.responses[0].headers?.etag captures header metadata
```

## What the result tells you

- **Models and properties**: `languageType` reflects the shape visible to generated code, while `wireType` describes the payload sent over the network. Properties removed for the selected visibility remain in `properties` but carry an `intrinsic.never` language type so you can detect deletions.
- **Scalars**: Each scalar includes a `codec` (for example `rfc7231` for date headers) and may change its wire type (e.g., `int32` -> `float64`) to match HTTP expectations.
- **Operations**: Requests expose grouped `headers`, `query`, `path`, and `body` parameters. Responses list status codes, per-content-type payloads, and derived body information (single, multipart, or file payloads) along with metadata such as content type properties and filenames.
- **Unions**: Variant tests contain ordered type guards (primitive checks before object checks) and literal discriminants. If variants cannot be distinguished (for example, two object models with identical shapes), the canonicalizer throws so you can surface a clear error.

## API reference

### OperationHttpCanonicalization

- Canonicalizes operations by deriving HTTP-specific request and response shapes and tracks the language and wire projections for each operation.
- `requestParameters`: Canonicalized request parameters grouped by location.
- `requestHeaders`: Canonicalized header parameters for the request.
- `queryParameters`: Canonicalized query parameters for the request.
- `pathParameters`: Canonicalized path parameters for the request.
- `responses`: Canonicalized responses produced by the operation.
- `path`: Concrete path for the HTTP operation.
- `uriTemplate`: URI template used for path and query expansion.
- `parameterVisibility`: Visibility applied when canonicalizing request parameters.
- `returnTypeVisibility`: Visibility applied when canonicalizing response payloads.
- `method`: HTTP method verb for the operation.
- `name`: Name assigned to the canonicalized operation.
- `languageType`: Mutated language type for this operation.
- `wireType`: Mutated wire type for this operation.

### ModelHttpCanonicalization

- Canonicalizes models for HTTP and supplies language and wire variants along with visibility-aware metadata.
- `isDeclaration`: Indicates if the canonicalization wraps a named TypeSpec declaration.
- `codec`: Codec chosen to transform language and wire types for this model.
- `languageType`: Possibly mutated language type for the model.
- `wireType`: Possibly mutated wire type for the model.
- `visibleProperties`: Canonical properties visible under the current visibility options.

### ModelPropertyHttpCanonicalization

- Canonicalizes model properties, tracking HTTP metadata, visibility, and codecs while adjusting types per location.
- `isDeclaration`: Indicates if this property corresponds to a named declaration.
- `isVisible`: Whether the property is visible with the current visibility options.
- `codec`: Codec used to transform the property's type between language and wire views.
- `isQueryParameter`: True when the property is a query parameter.
- `queryParameterName`: Query parameter name when applicable.
- `isHeader`: True when the property is an HTTP header.
- `headerName`: Header name when the property is a header.
- `isPathParameter`: True when the property is a path parameter.
- `pathParameterName`: Path parameter name when applicable.
- `explode`: Whether structured values should use explode semantics.
- `languageType`: Possibly mutated language type for the property.
- `wireType`: Possibly mutated wire type for the property.

### ScalarHttpCanonicalization

- Canonicalizes scalar types by applying encoding-specific mutations driven by codecs.
- `options`: Canonicalization options in effect for the scalar.
- `codec`: Codec responsible for transforming the scalar into language and wire types.
- `isDeclaration`: Indicates whether the scalar is a named TypeSpec declaration.
- `languageType`: Possibly mutated language type for the scalar.
- `wireType`: Possibly mutated wire type for the scalar.

### UnionHttpCanonicalization

- Canonicalizes union types, tracking discriminators, envelope structures, and runtime variant tests for both language and wire projections.
- `options`: Canonicalization options guiding union transformation.
- `isDeclaration`: Indicates if the union corresponds to a named declaration.
- `isDiscriminated`: True when `@discriminator` is present on the union.
- `envelopeKind`: Envelope structure used for discriminated unions.
- `discriminatorProperty`: Canonicalized discriminator property for envelope unions.
- `variantDescriptors`: Descriptors describing each canonicalized variant.
- `languageVariantTests`: Runtime tests used to select a variant for language types.
- `wireVariantTests`: Runtime tests used to select a variant for wire types.
- `discriminatorPropertyName`: Name of the discriminator property when present.
- `envelopePropertyName`: Name of the envelope property when present.
- `visibleVariants`: Variants that remain visible under the current visibility rules.
- `languageType`: Potentially mutated language type for this union.
- `wireType`: Potentially mutated wire type for this union.

### UnionVariantHttpCanonicalization

- Canonicalizes individual union variants for HTTP, removing hidden variants and exposing mutated representations.
- `options`: Canonicalization options.
- `isDeclaration`: Indicates if the variant corresponds to a named declaration.
- `isVisible`: Whether the variant is visible under the current visibility options.
- `languageType`: Possibly mutated language type for this variant.
- `wireType`: Possibly mutated wire type for this variant.

### IntrinsicHttpCanonicalization

- Canonicalizes intrinsic types for HTTP, producing language and wire projections directed by the active options.
- `options`: Canonicalization options.
- `isDeclaration`: Indicates if this intrinsic represents a named declaration.
- `languageType`: Possibly mutated language type for this intrinsic.
- `wireType`: Possibly mutated wire type for this intrinsic.

### LiteralHttpCanonicalization

- Canonicalizes literal types for HTTP, yielding language and wire variants for string, number, and boolean literals.
- `options`: Canonicalization options.
- `isDeclaration`: Indicates if the literal is a named declaration (always false for literals).
- `languageType`: Possibly mutated language type for this literal.
- `wireType`: Possibly mutated wire type for this literal.
