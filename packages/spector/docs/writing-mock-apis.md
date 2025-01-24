# Writing mock apis

1. Create a `mockapi.ts` file next to the `main.tsp` of the scenario
2. Create and export a variable called `Scenarios` with a `Record<string, ScenarioMockApi>` type
3. For each of the scenario assign a new property to the `Scenarios` variable. The value use one of the following:
   - `passOnSuccess`: This will take one or multiple routes and will only pass teh scenario if all the routes gets called with a 2xx success code.

## Example

```ts
import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Hello_world = passOnSuccess(
  mockapi.get("/hello/world", () => {
    return {
      status: 200,
      body: {
        contentType: "application/json",
        rawContent: `"Hello World!"`,
      },
    };
  }),
);
```

## How to build response

Return the response object. [See type](../../spec-api/src/types.ts)

```ts
// Minimum requirement is the status code.
return {
  status: 200,
};
```

### Return a body

```ts
// Return json
return {
  status: 200,
  body: json({ foo: 123 }),
};

// Return raw content
return {
  status: 200,
  body: {
    contentType: "application/text",
    rawContent: "foobar",
  },
};
```

### Return headers

```ts
// Return json
return {
  status: 200,
  headers: {
      MyHeader: "value-1"
      MyHeaderOther: req.headers.MyRequestHeader
  }
};

```

## How to validate the request:

All built-in validation tools can be accessed using `req.expect.`

### Validate the body

- With `req.expect.bodyEquals`

This will do a deep equals of the body to make sure it match.

```ts
app.post("/example", "Example", (req) => {
  req.bodyEquals({ foo: "123", bar: "456" });
});
```

- With `req.expect.rawBodyEquals`

This will compare the raw body sent.

```ts
app.post("/example", "Example", (req) => {
  req.rawBodyEquals('"foo"');
});
```

### Custom validation

You can do any kind of validation accessing the `req: MockRequest` object and deciding to return a different response in some cases.
You can also always `throw` a `ValidationError`

Example:

```ts
app.post("/example", "Example", (req) => {
  if (req.headers.MyCustomHeader.startsWith("x-foo")) {
    throw new ValidationError(
      "MyCustomHeader shouldn't start with x-foo",
      null,
      req.headers.MyCustomHeader,
    );
  }
});
```
