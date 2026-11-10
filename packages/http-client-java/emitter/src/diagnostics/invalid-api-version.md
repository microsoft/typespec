This diagnostic is issued when the `api-version` emitter option is neither a declared service version nor `latest` or `all`.

## Impact

The requested API-version projection cannot be selected, so Java client generation fails.

## ❌ Incorrect Usage

```typespec
@service
@versioned(Versions)
namespace Contoso;

enum Versions {
  v1,
  v2,
}
```

```yaml
options:
  "@typespec/http-client-java":
    api-version: v3
```

## Diagnostic Message

```text
Invalid api-version option: 'v3'. The value should be an api-version, 'latest', or 'all'.
```

## ✅ How to Fix

Use a version declared by the service, or use `latest` or `all`.

```yaml
options:
  "@typespec/http-client-java":
    api-version: v2
```
