# Should emit an operation with an optional header that has a literal type without default

```tsp
@service
namespace Test;

@get op read(@header("Range-Unit") rangeUnit?: "items"): void;
```

## Operation

```ts src/api/testClientOperations.ts function read
export async function read(client: TestClientContext, options?: ReadOptions): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      ...(options?.rangeUnit && { "range-unit": options.rangeUnit }),
    },
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

## Options

```ts src/api/testClientOperations.ts interface ReadOptions
export interface ReadOptions extends OperationOptions {
  rangeUnit?: "items";
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async read(options?: ReadOptions) {
    return read(this.#context, options);
  }
}
```
