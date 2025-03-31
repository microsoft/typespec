# only: Should generate as bytes for custom streams

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
@streamOf(Thing)
model CustomStream {
  @header contentType: "custom/built-here";
  @body body: bytes;
}
@route("/")
op get(stream: CustomStream): void;
model Thing {
  id: string;
}
```

## TypeScript

### Request

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/clientOperations.ts function get
export async function get(
  client: ClientContext,
  stream: Uint8Array,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      stream: encodeUint8Array(stream, "base64")!,
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```
