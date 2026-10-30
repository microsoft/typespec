# Should use the declared optional server parameter name in client options

## Spec

This spec defines a server whose optional URL parameter is not named `endpoint`.

```tsp
@service(#{ title: "Custom server parameter" })
@server(
  "{baseUrl}",
  "Test server with a custom parameter name.",
  {
    baseUrl?: url = "http://localhost:3000",
  }
)
namespace Test;

op noOperationParams(): NoContentResponse;
```

## Client Context

The client options and endpoint resolver should both use the declared `baseUrl` name.

```ts src/api/testClientContext.ts
import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface TestClientContext extends Client {}
export interface TestClientOptions extends ClientOptions {
  baseUrl?: string;
}
export function createTestClientContext(options?: TestClientOptions): TestClientContext {
  const params: Record<string, any> = {
    baseUrl: options?.baseUrl ?? "http://localhost:3000",
  };
  const resolvedEndpoint = "{baseUrl}".replace(/{([^}]+)}/g, (_, key) =>
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
