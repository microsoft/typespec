# Should emit an operation that has body property parameter

```tsp
@service
namespace Test;

enum LR {
  left,
  right,
}
enum UD {
  up,
  down,
}

model EnumsOnlyCases {
  /** This should be receive/send the left variant */
  lr: LR | UD;

  /** This should be receive/send the up variant */
  ud: UD | UD;
}

@post op send(prop: EnumsOnlyCases): void;
```

## Operation

```ts src/api/testClientOperations.ts function send
export async function send(
  client: TestClientContext,
  prop: EnumsOnlyCases,
  options?: SendOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      prop: jsonEnumsOnlyCasesToTransportTransform(prop),
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

## Options

The options bag should like all the optional parameters of the operation

```ts src/api/testClientOperations.ts interface SendOptions
export interface SendOptions extends OperationOptions {}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async send(prop: EnumsOnlyCases, options?: SendOptions) {
    return send(this.#context, prop, options);
  }
}
```

```ts src/models/internal/serializers.ts function jsonEnumsOnlyCasesToTransportTransform
export function jsonEnumsOnlyCasesToTransportTransform(input_?: EnumsOnlyCases | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    lr: input_.lr,
    ud: input_.ud,
  }!;
}
```
