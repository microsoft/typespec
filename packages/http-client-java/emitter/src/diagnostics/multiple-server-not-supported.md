This diagnostic is issued when a service declares multiple alternative ways to specify its endpoint.

## Impact

The service definition is valid, but the Java emitter currently supports only one server definition when constructing the client endpoint.

## Valid Usage

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

## How to Address

If the service supports multiple endpoint forms, no change to the service contract is required. Until the Java emitter supports this pattern, select one server definition for generation and customize the Java library to expose the additional endpoint forms.

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
