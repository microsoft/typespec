# Handles a bearer authentication scheme combined with NoAuth

This test validates that the emitter makes the credential optional when `NoAuth` is part of the `@useAuth` union.

## Typespec

The spec contains a service that accepts either a Bearer token or anonymous requests

```tsp
@service(#{ title: "Test Service" })
@useAuth(BearerAuth | NoAuth)
namespace Test;

@route("/valid")
@get
op valid(): NoContentResponse;
```

## TypeScript

### Client

The client signature should include an optional positional parameter for credential

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, credential?: BearerTokenCredential, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, credential, options);
  }
  async valid(options?: ValidOptions) {
    return valid(this.#context, options);
  }
}
```

### ClientContext

The client context should accept an optional credential. When none is provided the runtime does not install an authentication policy, so no Authorization header is sent

```ts src/api/testClientContext.ts function createTestClientContext
export function createTestClientContext(
  endpoint: string,
  credential?: BearerTokenCredential,
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
    credential,
    authSchemes: [
      {
        kind: "http",
        scheme: "bearer",
      },
    ],
  });
}
```
