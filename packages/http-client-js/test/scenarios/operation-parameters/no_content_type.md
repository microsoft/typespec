# Should emit an operation that has a no content type explicitly defined.

```tsp
@service
namespace Test;
model Foo {
  id: string;
  name: string;
}
@post op get(...Foo): void;
```

## Operation

Even when there are no parameters defined in the spec, it will have an optional options bag which contains operation options.

```ts src/api/testClientOperations.ts function get
export async function get(
  client: TestClientContext,
  id: string,
  name: string,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      id: id,
      name: name,
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

## Options

```ts src/api/testClientOperations.ts interface GetOptions
export interface GetOptions extends OperationOptions {}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async get(id: string, name: string, options?: GetOptions) {
    return get(this.#context, id, name, options);
  }
}
```
