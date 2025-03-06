# Handles a simple bearer authentication scheme

This test validates that the emitter can handle a key auth scheme correctly with a header location

## Typespec

The spec contains a simple service with a ApiKey authentication scheme

```tsp
@service({
  title: "Test Service",
})
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-KEY">)
namespace Test;

@route("/valid")
@get
op valid(): NoContentResponse;
```

## TypeScript

### Client

The client signature should include a positional parameter for credential of type KeyCredential.

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

The client context should setup the pipeline to use the credential in the header with the name provided in the Scheme configuration. In this case "X-API-KEY"

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
      apiKeyHeaderName: "X-API-KEY",
    },
  });
}
```
