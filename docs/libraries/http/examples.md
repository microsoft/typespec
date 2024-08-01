---
title: Examples
---

# Http Examples

See [examples docs](../../standard-library/examples.md) for general information about examples.

## Multiple responses

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using Http;

@opExample(#{ returnType: #{ statusCode: 200, name: "Max", age: 3 } })
@opExample(#{ returnType: #{ statusCode: 404, error: "Not found" } })
@opExample(#{ returnType: #{ statusCode: 422, error: "Invalid payload" } })
op read(): {
  @statusCode statusCode: 200;
  name: string;
  age: int32;
} | {
  @statusCode statusCode: 404;
  error: string;
} | {
  @statusCode statusCode: 422;
  error: string;
};
```
