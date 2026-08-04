This diagnostic is issued when the TypeSpec program does not contain a namespace marked with `@service`.

## Impact

No Java client is generated because the emitter cannot identify the service root.

## ❌ Incorrect Usage

```typespec
namespace Contoso;

op ping(): void;
```

## Diagnostic Message

```text
No service found in this TypeSpec. Client will not be generated.
```

## ✅ How to Fix

Mark the service namespace with `@service`.

```typespec
@service
namespace Contoso;

op ping(): void;
```

## Suppression

Suppress this warning only when the file intentionally defines reusable types and is not intended to generate a client.
