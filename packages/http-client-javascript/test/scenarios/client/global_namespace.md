# Client from the global namespace

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
  return getClient(endpoint, {
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
  async foo() {
    return foo(this.#context);
  }
}
```

It should generate an operation for foo

```ts src/api/clientOperations.ts function foo
export async function foo(client: ClientContext): Promise<void> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```
