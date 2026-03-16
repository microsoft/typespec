---
slug: typespec-1-10-release
redirect_slug: 2026-03-16-typespec-1-10-release
title: "TypeSpec 1.10 Release Notes"
description: "TypeSpec 1.10.0 introduces major new extension points for library authors, improves the playground authoring experience, and increases OpenAPI import and export fidelity across several common real-world scenarios."
publishDate: 2026-03-16
authors:
  - name: TypeSpec Team
    title: TypeSpec Team @ Microsoft
tags:
  - release
  - announcement
---

# TypeSpec 1.10.0 Release Notes

TypeSpec 1.10.0 introduces major new extension points for library authors, improves the playground authoring experience, and increases OpenAPI import and export fidelity across several common real-world scenarios.

## Overview

- New `extern fn` functions let libraries compute and transform types or values.
- Experimental `internal` modifiers help library authors hide implementation-only declarations.
- The playground now supports quick fixes and direct `tspconfig.yaml` editing.
- OpenAPI tooling gained multi-format output, nested tags, and better import fidelity.
- `tsp info` and package installation flows are more helpful for day-to-day CLI use.

## Highlights

### Author libraries with `extern fn` functions

TypeSpec now supports functions as a new language feature. Library authors can declare host-backed transforms that accept types or values, execute JavaScript logic during checking, and return new types or computed values. This enables extension scenarios that previously required more complex decorator-based patterns.

To use this feature, declare an `extern fn` signature in TypeSpec, implement it through a `$functions` export in your JavaScript entrypoint, and call it anywhere a type or value result is allowed.

**Example**

Library TypeSpec:

```typespec
import "./lib.js";

namespace Contoso.Functions;

extern fn concat(l: valueof string, r: valueof string): valueof string;
```

Library JavaScript:

```ts
export const $functions = {
  "Contoso.Functions": {
    concat,
  },
};

function concat(_ctx, l, r) {
  return `${l}-${r}`;
}
```

Consumer TypeSpec:

```typespec
import "@contoso/functions";
using Contoso.Functions;

model Example {
  name: string = concat("hello", "world");
}
```

Related PR: [microsoft/typespec#9060 - [compiler] Functions, reborn](https://github.com/microsoft/typespec/pull/9060)

### Hide package-private declarations with `internal`

Library and project authors can now mark supported non-namespace declarations as `internal`. These declarations remain usable within the same package without becoming part of the public API surface. This makes it easier to keep helpers and implementation details private while still exposing public aliases or wrapper types.

Apply the experimental `internal` modifier to supported declarations that should not be referenced outside the current package.

**Example**

Library package:

```typespec
namespace Contoso;

internal model SecretHelper {
  key: string;
}

model PublicApi {
  data: SecretHelper;
}

alias ExposedHelper = SecretHelper;
```

Consumer package:

```typespec
import "@contoso/library";

model Consumer {
  helper: Contoso.SecretHelper; // Error: SecretHelper is internal
  data: Contoso.PublicApi;
  exposed: Contoso.ExposedHelper;
}
```

Related PR: [microsoft/typespec#9762 - [compiler]`internal` symbols](https://github.com/microsoft/typespec/pull/9762)

### Edit raw `tspconfig.yaml` directly in the playground

The playground settings experience has been redesigned around a config panel, so advanced scenarios no longer depend on a fixed-form UI. This makes it easier to experiment with project-style configuration, especially when you need emitter options that are too complex or too new for specialized forms.

Open the playground config panel and edit the generated `tspconfig.yaml` directly to control emitters, options, and other compiler settings.

**Example**

In the playground config panel, you can edit the same `tspconfig.yaml` you would keep in a real project.

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    file-type: json
    output-file: openapi.json
```

Related PR: [microsoft/typespec#9843 - Playground config as yaml](https://github.com/microsoft/typespec/pull/9843)

### Apply compiler quick fixes from playground diagnostics

Quick fixes are now available as Monaco code actions in the playground when your cursor is on a diagnostic. This makes the playground a more effective teaching and troubleshooting environment by letting you discover and apply suggested fixes without leaving the browser.

Place the cursor on a diagnostic in the playground editor and use the available code action to apply the suggested fix.

Related PR: [microsoft/typespec#9819 - Add codefix support in the TypeSpec playground](https://github.com/microsoft/typespec/pull/9819)

### Emit OpenAPI JSON and YAML in one run

The OpenAPI 3 emitter can now generate multiple file formats from a single compilation by accepting an array for `file-type`. This is especially useful when teams want machine-friendly JSON and human-friendly YAML artifacts without maintaining separate build steps.

Set the OpenAPI 3 emitter `file-type` option to an array of formats, such as both JSON and YAML. If you want distinct filenames, use the output file template.

**Example**

A single compile can now write both formats. Including `{file-type}` in `output-file` keeps the filenames distinct.

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    file-type:
      - json
      - yaml
    output-file: "{service-name-if-multiple}.{version}.openapi.{file-type}"
```

Related PR: [microsoft/typespec#9890 - Allow @typespec/openapi3 to receive more than one `file-type`.](https://github.com/microsoft/typespec/pull/9890)

### Model OpenAPI 3.2 tag hierarchies with `parent`

You can now express nested tags for OpenAPI 3.2 by setting `parent` inside `@tagMetadata`. This makes it possible to preserve tag hierarchies in generated OpenAPI 3.2 documents while safely omitting the field for older OpenAPI targets that do not support it.

Add `parent` to the metadata for a child tag when targeting OpenAPI 3.2.

**Example**

```typespec
import "@typespec/openapi";
using TypeSpec.OpenAPI;

@service
@tagMetadata("Tag Name", #{ description: "Tag description" })
@tagMetadata("Child Tag", #{ description: "Child tag description", parent: "Tag Name" })
namespace PetStore;
```

Related PR: [microsoft/typespec#9577 - Add support for OAS 3.2 nested tags via parent field in @tagMetadata](https://github.com/microsoft/typespec/pull/9577)

### Inspect emitter and library options with `tsp info`

The CLI can now display detailed information for a specific library or emitter, including available options. This reduces guesswork during configuration and makes it faster to discover supported settings from the command line.

Run `tsp info <package-name>` to inspect a specific package instead of only viewing compiler-wide information.

**Example**

```bash
tsp info @typespec/openapi3
```

Related PR: [microsoft/typespec#9829 - Emitter options cli info](https://github.com/microsoft/typespec/pull/9829)

## Bug fixes

### Preserve sibling keywords next to `$ref` when importing OpenAPI 3.1+

The OpenAPI import tool now preserves supported JSON Schema 2020-12 sibling keywords alongside `$ref`, including defaults, constraints, descriptions, and deprecation flags. This closes an important fidelity gap where imported TypeSpec definitions could silently lose metadata present in the source OpenAPI document.

Import OpenAPI 3.1 or 3.2 documents as usual; supported sibling keywords next to `$ref` now flow into the generated TypeSpec.

**Example of the fix**

```yaml
parameters:
  - name: order
    in: query
    schema:
      $ref: "#/components/schemas/OrderEnum"
      default: "desc"
```

```typespec
@query order?: OrderEnum = OrderEnum.desc
```

### Keep nullable array constraints during OpenAPI import

When an OpenAPI schema represents a nullable array with `anyOf` plus `null`, outer `minItems` and `maxItems` constraints are now preserved. Imported TypeSpec no longer drops these validators on common nullable-array shapes.

Import OpenAPI documents as usual; nullable arrays expressed with `anyOf` and `null` now carry over their array size constraints.

**Example of the fix**

```yaml
bar:
  anyOf:
    - type: array
      items:
        type: string
    - type: "null"
  minItems: 2
  maxItems: 10
```

```tsp
@minItems(2)
@maxItems(10)
bar: string[] | null;
```

### Use a custom npm registry for `tsp init` and `tsp install`

TypeSpec can now use a custom npm registry through the `TYPESPEC_NPM_REGISTRY` environment variable when fetching manifests and packages. This helps teams working in corporate environments where the public registry is inaccessible or mirrored behind internal infrastructure.

Set `TYPESPEC_NPM_REGISTRY` before running `tsp init` or `tsp install` so the CLI resolves and downloads packages from your approved registry.

**Example of the fix**

```bash
export TYPESPEC_NPM_REGISTRY=https://registry.example.com/npm/
tsp init
```

```bash
export TYPESPEC_NPM_REGISTRY=https://registry.example.com/npm/
tsp install
```

### Fix `@overload` validation inside versioned namespaces

The compiler no longer incorrectly rejects overloads when versioning mutators clone the containing namespace or interface. Projects that combine `@versioned` with overload-based APIs should now compile without false `overload-same-parent` errors.

### Avoid crashes on unrecognized custom scalar initializers

Compiler and emitter flows that serialize examples or default values no longer fail with an internal compiler error when they encounter custom scalar initializers that have no recognized JSON representation. Values that cannot be serialized are now skipped safely so the rest of the flow can continue.

### Generate correct ASP.NET Core result methods for non-200 responses

The C# HTTP server emitter now preserves declared status codes instead of defaulting generated controllers to `Ok(...)` or `NoContent()`. Generated controllers use `Accepted(...)` for 202 responses and `StatusCode(...)` for other non-200 cases, keeping service behavior aligned with the TypeSpec contract.

Define non-200 or non-204 response status codes in your TypeSpec service and regenerate with `@typespec/http-server-csharp`.

**Example of the fix**

For a declared `202` response, the generated controller now preserves that status instead of always returning `Ok(...)`.

```tsp
model AcceptedResponse {
  @statusCode statusCode: 202;
  jobId: string;
}

@post
op startJob(): AcceptedResponse;
```

```csharp
return Ok(result);
```

```csharp
return Accepted(result);
```

### Run multiple versioning mutators together reliably

The versioning library now handles multiple mutators in the same flow correctly. This fixes a class of failures where combining versioning transformations could produce incorrect results or unstable processing.

### Stop inserting `/` before `?` and `:` route fragments

Route joining now preserves fragments that start with `?` or `:` instead of rewriting them as path segments. This fixes routes that previously picked up an unwanted leading slash when query-style or colon-prefixed fragments were composed.

You can use route fragments that begin with `?` or `:` without them being rewritten to include an extra slash.

**Example of the fix**

Query-style and colon-prefixed route fragments now stay attached to the existing route instead of becoming a new path segment.

```tsp
@route("/pets")
namespace PetRoutes {
  @get
  @route("?type=cat")
  op list(): void;
}
```

Before:

```text
/pets/?type=cat
```

After:

```text
/pets?type=cat
```

## Additional improvements

### Import `readOnly` and `writeOnly` as visibility decorators

OpenAPI import now preserves `readOnly` and `writeOnly` intent by converting them to `@visibility(Lifecycle.Read)` and `@visibility(Lifecycle.Create)`. This improves round-tripping and reduces manual cleanup after importing OpenAPI descriptions into TypeSpec.

Run the OpenAPI import flow as usual; imported models now include visibility decorators when those schema flags are present, and conflicting `readOnly` plus `writeOnly` inputs are ignored with a warning.

**Example**

OpenAPI input:

```yaml
components:
  schemas:
    Widget:
      type: object
      properties:
        id:
          type: string
          readOnly: true
        secret:
          type: string
          writeOnly: true
```

Imported TypeSpec:

```typespec
model Widget {
  @visibility(Lifecycle.Read)
  id: string;

  @visibility(Lifecycle.Create)
  secret: string;
}
```

### Programmatically set OpenAPI operation IDs

The OpenAPI library now exposes `setOperationId`, giving library authors and tooling code a supported API for assigning operation IDs instead of relying on indirect workarounds.

Use the exported `setOperationId` helper from `@typespec/openapi` when your library or tooling needs to assign or override an operation ID.

### Generate Java `Duration` support for millisecond encodings

The Java HTTP client emitter now understands `DurationKnownEncoding.milliseconds`. Duration properties and parameters encoded as integer or floating-point milliseconds continue to surface as `Duration` in generated clients while being converted correctly on the wire.

Use `DurationKnownEncoding.milliseconds` in your TypeSpec definitions when targeting the Java HTTP client emitter.

**Example**

The generated Java surface stays on `Duration`, while the wire value remains numeric milliseconds.

```tsp
@route("/int32-milliseconds")
@scenario
@scenarioDoc("""
  Expected query parameter `input=36000`
  """)
op int32Milliseconds(
  @query
  @encode(DurationKnownEncoding.milliseconds, int32)
  input: duration,
): NoContentResponse;
```

```java
import java.time.Duration;

private static final Duration MILLIS36000 = Duration.ofMillis(36000);

queryClient.int32Milliseconds(MILLIS36000);
```

### Write per-package API version maps into Java metadata

The Java HTTP client emitter can now emit `apiVersions` in `metadata.json`, helping downstream tooling and packaging scenarios preserve the correct version mapping for multi-service or mixed-version outputs.

### Build C# extensible enums with `ExtensibleEnumDeclaration`

Emitter framework authors targeting C# now have a dedicated extensible enum component that produces unbound enum-like structs. This makes it easier to model open-ended service values without hand-rolling the generated shape.

Use `ExtensibleEnumDeclaration` from the emitter framework C# components when you need extensible enum output instead of a closed enum.

### Retire the transitional `patch-implicit-optional` warning

The temporary migration warning for PATCH implicit optionality has been removed, reducing noise in current HTTP workflows.

### Start the playground faster by loading libraries in parallel

Playground startup is now more responsive because library loading happens in parallel instead of serially.

### Inspect Symbol-keyed decorator state in the HTML program viewer

The HTML program viewer can now display decorator state stored under JavaScript `Symbol` keys, making advanced library debugging more complete.

## Conclusion

If you build TypeSpec libraries, rely on OpenAPI round-tripping, or use the playground for everyday experimentation, 1.10.0 closes several long-standing workflow gaps while adding meaningful new extension capabilities.

Thank you to everyone who contributed feedback and fixes for version 1.10.0.
