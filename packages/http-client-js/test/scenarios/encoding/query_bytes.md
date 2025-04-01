# Should populate a Date query parameter

This scenario tests that a Bytes query parameter is sent correctly to the wire. Encoding as base64Url

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op defaultEncoding(
  @query
  value: bytes,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function defaultEncoding
export async function defaultEncoding(
  client: TestClientContext,
  value: Uint8Array,
  options?: DefaultEncodingOptions,
): Promise<void> {
  const path = parse("/default{?value}").expand({
    value: encodeUint8Array(value, "base64url")!,
  });
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```
