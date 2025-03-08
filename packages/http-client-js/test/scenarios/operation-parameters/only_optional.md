# Should emit an operation that has only optional parameters

```tsp
@service
namespace Test;

@get op getWithParams(name?: string, age?: int32): int32;
```

## Operation

The operation has has no required parameters so options and client should be the only ones in the signature

```ts src/api/testClientOperations.ts function getWithParams
export async function getWithParams(
  client: TestClientContext,
  options?: GetWithParamsOptions,
): Promise<number> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      name: options?.name,
      age: options?.age,
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

The options bag should like all the optional parameters of the operation

```ts src/api/testClientOperations.ts interface GetWithParamsOptions
export interface GetWithParamsOptions extends OperationOptions {
  name?: string;
  age?: number;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async getWithParams(options?: GetWithParamsOptions) {
    return getWithParams(this.#context, options);
  }
}
```
