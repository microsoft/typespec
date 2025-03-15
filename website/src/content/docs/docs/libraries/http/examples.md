---
title: Examples
---

This document provides examples specific to the HTTP library in TypeSpec. For general information about how examples work in TypeSpec, see the [examples docs](../../standard-library/examples.md).

## Multiple responses

When defining HTTP operations, you often need to document different possible response types based on status codes. The `@opExample` decorator allows you to provide sample responses for each status code your operation might return.

In the example below, we define an operation that can return three different responses (200 OK, 404 Not Found, and 422 Unprocessable Entity), with examples for each:

```tsp title=main.tsp tryit="{"emit": ["@typespec/openapi3"]}"
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

Each `@opExample` decorator specifies:

- the status code for this example response.
- the expected values of the response properties.

This helps API consumers understand what to expect from different response scenarios and provides more comprehensive documentation for your API.
