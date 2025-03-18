# Should emit an operation that has a spread model with a nested model as parameter

```tsp
@service
namespace Test;

model Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  interiorNumber?: string;
}

model Widget {
  id: string;
  name: string;
  age?: string;
  address?: Address;
}

@post op create(...Widget): void;
```

## Operation

The operation has has no required parameters so options and client should be the only ones in the signature

```ts src/api/testClientOperations.ts function create
export async function create(
  client: TestClientContext,
  id: string,
  name: string,
  options?: CreateOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      id: id,
      name: name,
      age: options?.age,
      address: jsonAddressToTransportTransform(options?.address),
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

```ts src/api/testClientOperations.ts interface CreateOptions
export interface CreateOptions extends OperationOptions {
  age?: string;
  interiorNumber?: string;
  address?: Address;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async create(id: string, name: string, options?: CreateOptions) {
    return create(this.#context, id, name, options);
  }
}
```
