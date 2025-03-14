# Should build the server url based on the parametrized host

## Spec

This spec defines a server that has a host template and and endpoint to fill it out.

```tsp
@service({
  title: "Parametrized Endpoint",
})
@server(
  "{endpoint}/server/path/multiple/{apiVersion}",
  "Test server with path parameters.",
  {
    endpoint: url,
    apiVersion: string,
  }
)
namespace Test;

op noOperationParams(): NoContentResponse;
```

## Client Context

The client context should use the parameters to build the baseUrl using the template.

```ts src/api/testClientContext.ts
import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface TestClientContext extends Client {}
export interface TestClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createTestClientContext(
  endpoint: string,
  apiVersion: string,
  options?: TestClientOptions,
): TestClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint,
    apiVersion: apiVersion,
  };
  const resolvedEndpoint = "{endpoint}/server/path/multiple/{apiVersion}".replace(
    /{([^}]+)}/g,
    (_, key) =>
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
