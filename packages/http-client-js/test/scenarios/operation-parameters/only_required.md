# Should emit an operation that has required parameters

```tsp
@service
namespace Test;

@get op getWithParams(@query name: string, @query age: int32): int32;
```

## Operation

The operation has required parameters defined in the spec, which will be included in the options bag.

```ts src/api/testClientOperations.ts function getWithParams
export async function getWithParams(
  client: TestClientContext,
  name: string,
  age: number,
  options?: GetWithParamsOptions,
): Promise<number> {
  const path = parse("/{?name,age}").expand({
    name: name,
    age: age,
  });
  const httpRequestOptions = {
    headers: {},
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

```ts src/api/testClientOperations.ts interface GetWithParamsOptions
export interface GetWithParamsOptions extends OperationOptions {}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async getWithParams(name: string, age: number, options?: GetWithParamsOptions) {
    return getWithParams(this.#context, name, age, options);
  }
}
```
