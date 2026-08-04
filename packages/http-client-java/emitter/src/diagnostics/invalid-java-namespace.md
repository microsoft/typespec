This diagnostic is issued when a generated Java package segment is a reserved Java keyword.

## Impact

The emitter changes the package segment to a legal Java identifier, so the generated package differs from the requested namespace.

## ❌ Incorrect Usage

```typespec
@service
namespace Contoso.Public;
```

The derived Java namespace contains the reserved keyword `public`.

## Diagnostic Message

```text
Namespace 'contoso.public' contains reserved Java keywords, replaced it with 'contoso.public_'.
```

## ✅ How to Fix

Rename the TypeSpec namespace or configure a Java namespace that does not contain Java keywords.

```typespec
@service
namespace Contoso.PublicApi;
```

## Suppression

Suppress the warning only when the escaped package name is intentionally accepted.
