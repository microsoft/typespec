# Should emit an operation that has parameters with reserved words

```tsp
@service
namespace Test;

@get op get(await: string, break?: boolean): void;
```

## Operation

Even when there are no parameters defined in the spec, it will have an optional options bag which contains operation options.

```ts src/api/testClientOperations.ts function get
export async function get(
  client: TestClientContext,
  await_: string,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      await: await_,
      break: options?.break_,
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

```ts src/api/testClientOperations.ts interface GetOptions
export interface GetOptions extends OperationOptions {
  break_?: boolean;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async get(await_: string, options?: GetOptions) {
    return get(this.#context, await_, options);
  }
}
```
