This diagnostic is issued when a variable in the `@server` decorator can take more than one value (an enum or a union of string literals) but has no default.
OpenAPI requires the `default` of a server variable to be one of its `enum` values, so the emitter uses the first value. That value might not be the one you intended.

To fix this issue, set a default on the server parameter.

### Example

```typespec
@server("https://{region}.example.com", "Regional endpoint", {
  region: "westus" | "eastus", // No default, so "westus" is used
})
```

Set a default to choose the value:

```typespec
@server("https://{region}.example.com", "Regional endpoint", {
  region?: "westus" | "eastus" = "eastus",
})
```
