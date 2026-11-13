# Should normalize an optional server parameter name without a default

## Spec

This spec defines an explicitly optional server URL parameter without a default value whose name
requires normalization for TypeScript.

```tsp
@service(#{ title: "Optional custom server parameter" })
@server(
  "{base_url}",
  "Test server with an optional custom parameter name.",
  {
    base_url?: url,
  }
)
namespace Test;

op noOperationParams(): NoContentResponse;
```

## Client Context

The client options should use the normalized application name while the endpoint resolver preserves
the transport name.

```ts src/api/testClientContext.ts
import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface TestClientContext extends Client {}
export interface TestClientOptions extends ClientOptions {
  baseUrl?: string;
}
export function createTestClientContext(options?: TestClientOptions): TestClientContext {
  const params: Record<string, any> = {
    base_url: options?.baseUrl,
  };
  const resolvedEndpoint = "{base_url}".replace(/{([^}]+)}/g, (_, key) =>
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
