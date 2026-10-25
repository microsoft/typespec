# Handle auth union containing NoAuth

This test validates that the emitter treats credential as optional when an authentication union includes NoAuth.

## Typespec

The spec contains a service with a Bearer authentication scheme and NoAuth

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

The client signature should include an optional positional parameter for credential when NoAuth is in the union.

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(
    endpoint: string,
    credential?: BearerTokenCredential,
    options?: TestClientOptions,
  ) {
    this.#context = createTestClientContext(endpoint, credential, options);
  }
  async valid(options?: ValidOptions) {
    return valid(this.#context, options);
  }
}
```

### ClientContext

The client context should have an optional credential parameter and configure the auth schemes with noAuth filtered out.

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
