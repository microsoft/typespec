# Should emit an operation that has a default value

```tsp
@service
namespace Test;

@get op get(@header contentType: string = "application/json"): int32;
```

## Operation

Even when there are no parameters defined in the spec, it will have an optional options bag which contains operation options.

```ts src/api/testClientOperations.ts function get
export async function get(client: TestClientContext, options?: GetOptions): Promise<number> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "application/json",
    },
  };

  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return response.body!;
  }

  throw createRestError(response);
}
```

## Options

```ts src/api/testClientOperations.ts interface GetOptions
export interface GetOptions extends OperationOptions {
  contentType?: string;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async get(options?: GetOptions) {
    return get(this.#context, options);
  }
}
```
