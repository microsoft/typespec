The `Content-Type` header's optionality should match the optionality of the request body it describes.

When a request body is optional, the `Content-Type` header should also be optional, because there is no content to describe when the body is omitted. Conversely, when the body is required, the `Content-Type` header should be required to properly describe the content being sent.

#### ❌ Incorrect

```tsp
op foo(
  @header("content-type")
  contentType: "application/json",

  @body
  body?: MyModel,
): void;
```

```tsp
op bar(
  @header("content-type")
  contentType?: "application/json",

  @body
  body: MyModel,
): void;
```

#### ✅ Correct

```tsp
op foo(
  @header("content-type")
  contentType: "application/json",

  @body
  body: MyModel,
): void;
```

```tsp
op bar(
  @header("content-type")
  contentType?: "application/json",

  @body
  body?: MyModel,
): void;
```
