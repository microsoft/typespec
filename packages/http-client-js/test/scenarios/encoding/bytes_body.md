# Should not encode a bytes data when the body is bytes

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op foo(@header contentType: "application/octet-stream", @body value: bytes): {
  @header contentType: "application/octet-stream";
  @body value: bytes;
};
```

## TypeScript

```ts src/api/testClientOperations.ts function foo
export async function foo(
  client: TestClientContext,
  value: Uint8Array,
  options?: FooOptions,
): Promise<Uint8Array> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "application/octet-stream",
    },
    body: value,
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (
    +response.status === 200 &&
    response.headers["content-type"]?.includes("application/octet-stream")
  ) {
    return response.body!;
  }
  throw createRestError(response);
}
```
