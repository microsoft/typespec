# Client from the global namespace

This tests that the emitter can handle a spec that has no top-level namespace defined

## TypeSpec

```tsp
@service
namespace Test;
op foo(): void;
```

## TypeScript

It should generate an interface and factory for the client context.

```ts src/api/testClientContext.ts interface TestClientContext
export interface TestClientContext extends Client {}
```

```ts src/api/testClientContext.ts function createTestClientContext
export function createTestClientContext(
  endpoint: string,
  options?: TestClientOptions,
): TestClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint,
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params
      ? String(params[key])
      : (() => {
          throw new Error(`Missing parameter: ${key}`);
        })(),
  );
  return getClient(resolvedEndpoint, {
    ...options,
  });
}
```

It should generate a client for the Global Namespace with a single operation `foo` matching the spec and no sub-clients.

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async foo(options?: FooOptions) {
    return foo(this.#context, options);
  }
}
```

It should generate an operation for foo

```ts src/api/testClientOperations.ts function foo
export async function foo(client: TestClientContext, options?: FooOptions): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
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
