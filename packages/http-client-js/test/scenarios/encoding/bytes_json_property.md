# Should not encode a bytes data when the body is bytes

## TypeSpec

```tsp
@service
namespace Test;

model BytesBody {
  value: bytes;
}

@route("/default")
op foo(...BytesBody): BytesBody;
```

## Operation

```ts src/api/testClientOperations.ts function foo
export async function foo(
  client: TestClientContext,
  value: Uint8Array,
  options?: FooOptions,
): Promise<BytesBody> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      value: encodeUint8Array(value, "base64")!,
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonBytesBodyToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```

## Deserializer

```ts src/models/internal/serializers.ts function jsonBytesBodyToApplicationTransform
export function jsonBytesBodyToApplicationTransform(input_?: any): BytesBody {
  if (!input_) {
    return input_ as any;
  }
  return {
    value: decodeBase64(input_.value)!,
  }!;
}
```
