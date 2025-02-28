# Should build the server url based on the parametrized host

## Spec

This spec defines a server that has a host template and and endpoint to fill it out.

```tsp
@service({
  title: "Parametrized Endpoint",
})
@server(
  "{foo}/server/path/multiple",
  "Test server with path parameters.",
  {
    @doc("Pass in http://localhost:3000 for endpoint.")
    foo: url,
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
  foo: string,
  options?: TestClientOptions,
): TestClientContext {
  const params: Record<string, any> = {
    foo: foo,
  };
  const resolvedEndpoint = "{foo}/server/path/multiple".replace(/{([^}]+)}/g, (_, key) =>
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
