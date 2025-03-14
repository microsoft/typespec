# A sub client can override the partent credential scheme

The sub client sets NoAuth to override the auth scheme of the parent

## Typespec

The spec contains a client with BasicAuth and a sub client with no auth

```tsp
@service({
  title: "Test Service",
})
@useAuth(BasicAuth)
namespace Test;

@route("/")
@get
op valid(): NoContentResponse;

@useAuth(NoAuth)
@route("/sub")
namespace Sub {
  @get
  op put(): NoContentResponse;
}
```

## TypeScript

### Client

The client signature should include a positional parameter for credential of type KeyCredential. A basic auth token is a key credential that gets put into the Authorization header/

The subclient is not a child of the TestClient because they have different parameter.

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

The sub client shouldn't take a credential

```ts src/testClient.ts class SubClient
export class SubClient {
  #context: SubClientContext;
  constructor(endpoint: string, options?: SubClientOptions) {
    this.#context = createSubClientContext(endpoint, options);
  }
  async put(options?: PutOptions) {
    return put(this.#context, options);
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

The suv client context should setup the pipeline to use the credential in the Authorization header.

```ts src/api/subClient/subClientContext.ts function createSubClientContext
export function createSubClientContext(
  endpoint: string,
  options?: SubClientOptions,
): SubClientContext {
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
  });
}
```
