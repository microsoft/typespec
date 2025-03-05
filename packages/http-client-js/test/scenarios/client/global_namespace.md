# Client from the global namespace

This tests that the emitter can handle a spec that has no top-level namespace defined

## TypeSpec

```tsp
op foo(): void;
```

## TypeScript

It should generate an interface and factory for the client context.

```ts src/api/clientContext.ts interface ClientContext
export interface ClientContext extends Client {}
```

```ts src/api/clientContext.ts function createClientContext
export function createClientContext(endpoint: string, options?: ClientOptions): ClientContext {
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

```ts src/client.ts class Client
export class Client {
  #context: ClientContext;

  constructor(endpoint: string, options?: ClientOptions) {
    this.#context = createClientContext(endpoint, options);
  }
  async foo(options?: FooOptions) {
    return foo(this.#context, options);
  }
}
```

It should generate an operation for foo

```ts src/api/clientOperations.ts function foo
export async function foo(client: ClientContext, options?: FooOptions): Promise<void> {
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
