This diagnostic is issued when a generated Java package segment is a reserved Java keyword.

## Impact

The emitter appends `namespace` to the reserved package segment, so the generated package differs from the requested namespace.

## ❌ Incorrect Usage

```typespec
@service
namespace Contoso.Public;
```

The derived Java namespace contains the reserved keyword `public`.

## Diagnostic Message

```text
Namespace 'contoso.public' contains reserved Java keywords, replaced it with 'contoso.publicnamespace'.
```

## ✅ How to Fix

Rename the TypeSpec namespace or configure a Java namespace that does not contain Java keywords.

```typespec
@service
namespace Contoso.PublicApi;
```

## Suppression

Suppress the warning only when the adjusted package name is intentionally accepted.
