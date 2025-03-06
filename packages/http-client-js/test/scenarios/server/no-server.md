# Should create a constructor with a default endpoint and an optional endpoint parameter.

## Spec

This spec defines a service with a server that has a default endpoint

```tsp
@service
namespace Test;

op foo(): void;
```

## Client

The client has a required positional parameter for endpoint.

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
