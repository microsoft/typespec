This diagnostic is issued when a generated client has more than two alternative server endpoints.

## Impact

Java client generation stops because the emitter cannot select a supported client initialization shape for the server union.

## ❌ Incorrect Usage

```typespec
@service
@server(
  "https://{region}.example.com",
  "Regional",
  {
    region: string,
  }
)
@server("https://example.com", "Global")
@server("http://localhost:3000", "Local")
namespace Contoso {
  op read(): string;
}
```

## Diagnostic Message

```text
Multiple server on client is not supported.
```

## ✅ How to Fix

Expose one server endpoint, or reduce the alternatives to a supported endpoint configuration. Prefer a single templated server when the endpoints differ only by a parameter.

```typespec
@service
@server(
  "https://{region}.example.com",
  "Service endpoint",
  {
    region: string,
  }
)
namespace Contoso {
  op read(): string;
}
```
