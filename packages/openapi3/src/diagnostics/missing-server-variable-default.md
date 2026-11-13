This diagnostic is issued when a variable in the `@server` decorator has a fixed set of values (an enum, a union of string literals or a string literal) but no default, and the document is emitted for OpenAPI 3.1.0 or later.
Those versions require the `default` of a server variable to be one of its `enum` values. The emitter does not pick one for you, so the variable keeps an empty `default` and the document is not valid.

To fix this issue, set a default on the server parameter.

### Example

```typespec
@server("https://{region}.example.com", "Regional endpoint", {
  region: "westus" | "eastus", // No default
})
```

Set a default:

```typespec
@server("https://{region}.example.com", "Regional endpoint", {
  region?: "westus" | "eastus" = "eastus",
})
```
