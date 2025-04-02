# Should generate as bytes for custom streams

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
@streamOf(Thing)
model CustomStream {
  @header contentType: "custom/built-here";
  @body body: bytes;
}
@route("/")
op get(): CustomStream;
model Thing {
  id: string;
}
```

## TypeScript

### Response

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/clientOperations.ts function get
export async function get(client: ClientContext, options?: GetOptions): Promise<Uint8Array> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("custom/built-here")) {
    return response.body!;
  }
  throw createRestError(response);
}
```
