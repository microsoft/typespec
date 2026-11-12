This diagnostic is issued when the TypeSpec program does not contain a namespace marked with `@service`.

## Impact

No Java client is generated because the emitter cannot identify the service root. Models with explicit usage and access metadata can still be generated.

## Valid Model-Only Usage

```typespec
import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;

@access(Access.public)
@usage(Usage.input | Usage.output)
model Widget {
  name: string;
}
```

This generates the public `Widget` Java model without generating a service client. The warning is expected for this use case.

## Diagnostic Message

```text
No service found in this TypeSpec. Client will not be generated.
```

## ✅ How to Fix

If a Java client is intended, mark the service namespace with `@service` and define its operations.

```typespec
@service
namespace Contoso {
  op ping(): void;
}
```

## Suppression

It is safe to suppress this warning when the TypeSpec intentionally generates only model classes.
