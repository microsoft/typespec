# Handles a basic authentication scheme

This test validates that the emitter can handle a basic authentication scheme correctly, including the client signature and its initialization

## Typespec

The spec contains a simple service with a Bearer authentication scheme

```tsp
@service({
  title: "Test Service",
})
@useAuth(BasicAuth)
namespace Test;

@route("/valid")
@get
op valid(): NoContentResponse;
```

## TypeScript

### Client

The client signature should include a positional parameter for credential of type KeyCredential. A basic auth token is a key credential that gets put into the Authorization header

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, credential: KeyCredential, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, credential, options);
  }
  async valid() {
    return valid(this.#context);
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
  return getClient(endpoint, credential, {
    ...options,
    credentials: {
      apiKeyHeaderName: "Authorization",
    },
  });
}
```
