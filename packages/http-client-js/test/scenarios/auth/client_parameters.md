# Handle multiple auth schemas

This test validates that the emitter can generate the correct client signature when more than one schema is used.

## Typespec

The spec contains 2 Schemas Bearer and ApiKey

```tsp
@service({
  title: "Test Service",
})
@useAuth(BearerAuth | ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">)
namespace Test;

@route("/valid")
@get
op valid(): NoContentResponse;
```

## TypeScript

### Client

The client signature should include a positional parameter for credential of type KeyCredential. Internally both translate to the same type KeyCredential.
TODO: Revisit if we need additional types since it will be difficult at runtime to differentiate

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, credential: KeyCredential, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, credential, options);
  }
  async valid(options?: ValidOptions) {
    return valid(this.#context, options);
  }
}
```

### ClientContext

The client context should setup the pipeline to use the credential in the Authorization header.

```ts src/api/testClientContext.ts function createTestClientContext
export function createTestClientContext(
  endpoint: string,
  credential: KeyCredential,
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
  return getClient(resolvedEndpoint, credential, {
    ...options,
    credentials: {
      apiKeyHeaderName: "Authorization",
    },
  });
}
```
