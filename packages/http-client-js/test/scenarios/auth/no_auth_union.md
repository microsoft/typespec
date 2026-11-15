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

# Makes the credential optional when every operation overrides the service auth with NoAuth

This test validates that an operation-level `@useAuth` replaces the service default when deciding whether the credential is optional. The service requires a Bearer token, but its only operation also accepts anonymous requests.

## Typespec

```tsp
@service(#{ title: "Test Service" })
@useAuth(BearerAuth)
namespace Test;

@route("/valid")
@get
@useAuth(BearerAuth | NoAuth)
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

# Keeps the credential required when only some operations allow NoAuth

This test validates that the credential stays required when one operation inherits the service auth and another overrides it with a union that includes `NoAuth`.

## Typespec

```tsp
@service(#{ title: "Test Service" })
@useAuth(BearerAuth)
namespace Test;

@route("/valid")
@get
op valid(): NoContentResponse;

@route("/anonymous")
@get
@useAuth(BearerAuth | NoAuth)
op anonymous(): NoContentResponse;
```

## TypeScript

### Client

The client signature should include a required positional parameter for credential

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, credential: BearerTokenCredential, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, credential, options);
  }
  async valid(options?: ValidOptions) {
    return valid(this.#context, options);
  }
  async anonymous(options?: AnonymousOptions) {
    return anonymous(this.#context, options);
  }
}
```
