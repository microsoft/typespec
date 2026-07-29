This diagnostic is issued when a variable in the `@server` decorator is not defined as a string type.
Since server variables are substituted into the server URL which is a string, all variables must have string values.

To fix this issue, make sure all server variables are of a type that is assignable to `string`.

### Example

```typespec
@server("{protocol}://{host}/api/{version}", "Custom endpoint", {
  protocol: "http" | "https",
  host: string,
  version: 1, // Should be a string: "1"
})
```
