# Should handle a model with bytes property

```tsp
@route("/bytes")
namespace Test;
// Test a model with a bytes property
@doc("Model with a bytes property")
model BytesProperty {
  property: bytes;
}

@get op get(): BytesProperty;
@put op put(@body body: BytesProperty): void;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(client: TestClientContext, options?: GetOptions): Promise<BytesProperty> {
  const path = parse("/bytes").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonBytesPropertyToApplicationTransform(response.body)!;
  }

  throw createRestError(response);
}
```

```ts src/models/serializers.ts function jsonBytesPropertyToApplicationTransform
export function jsonBytesPropertyToApplicationTransform(input_?: any): BytesProperty {
  if (!input_) {
    return input_ as any;
  }

  return {
    property: decodeBase64(input_.property)!,
  }!;
}
```
