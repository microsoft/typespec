# Should create a constructor with a default endpoint and an optional endpoint parameter.

## Spec

This spec defines a service with a server that has a default endpoint

```tsp
@service
@server("https://example.org/api")
namespace Test;

op foo(): void;
```

## Client

The client uses the optional endpoint if available or the default endpoint

```ts src/api/testClientContext.ts function createTestClientContext
export function createTestClientContext(options?: TestClientOptions): TestClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "https://example.org/api",
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

## Client options

Since there is a default url, the endpoint parameter is not required, but optional in case customers want to point to another url.

```ts src/api/testClientContext.ts interface TestClientOptions
export interface TestClientOptions extends ClientOptions {
  endpoint?: string;
}
```
