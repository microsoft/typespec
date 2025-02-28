# **Generating a Basic HTTP Operation**

This test verifies that a simple HTTP `GET` operation with no request payload or parameters correctly generates a **client class, model, serializer, context, and operation function**. The operation returns a `Widget` model, ensuring proper TypeScript type generation and serialization.

## **TypeSpec**

```tsp
@service
namespace Test;
model Widget {
  id: string;
  total_weight: int32;
  color: "red" | "blue";
}

op foo(): Widget;
```

## **TypeScript**

### **Client Generation**

A class named `TestClient` is generated, encapsulating API operations. It includes a single method, `foo`, which internally calls the corresponding operation function.

```ts src/testClient.ts
import { FooOptions, foo } from "./api/testClientOperations.js";
import {
  TestClientContext,
  TestClientOptions,
  createTestClientContext,
} from "./api/testClientContext.js";

export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async foo(options?: FooOptions) {
    return foo(this.#context, options);
  }
}
```

### **Model Definition**

A TypeScript interface for the `Widget` model is generated in `src/models/models.ts`. The field `total_weight` is renamed to `totalWeight` to align with TypeScript naming conventions.

```ts src/models/models.ts interface Widget
export interface Widget {
  id: string;
  totalWeight: number;
  color: "red" | "blue";
}
```

### **Serializer Generation**

A serializer function, `jsonWidgetToTransportTransform`, is generated to transform the `Widget` model into its transport format. It converts TypeScript-friendly property names (`totalWeight`) back to their wire format (`total_weight`).

```ts src/models/serializers.ts function jsonWidgetToTransportTransform
export function jsonWidgetToTransportTransform(input_?: Widget | null): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    id: input_.id,
    total_weight: input_.totalWeight,
    color: input_.color,
  }!;
}
```

### **Context Generation**

The generated `createTestClientContext` function initializes the API client context with the required endpoint. Since no authentication or additional parameters are used, only the endpoint is required.

```ts src/api/testClientContext.ts function createTestClientContext
export function createTestClientContext(
  endpoint: string,
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
  });
}
```

An interface, `TestClientContext`, is also generated to define the shape of the context.

```ts src/api/testClientContext.ts interface TestClientContext
export interface TestClientContext extends Client {}
```

### **Operation Function**

A function named `foo` is generated to handle the HTTP request. It prepares the request, sends it using the client context, and processes the response.

- The request has **no query, path, or header parameters**.
- The expected response body is a `Widget`, requiring transformation from wire format using `jsonWidgetToApplication`.
- If the response status code is unexpected, an exception is thrown.

```ts src/api/testClientOperations.ts function foo
export async function foo(client: TestClientContext, options?: FooOptions): Promise<Widget> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonWidgetToApplicationTransform(response.body)!;
  }

  throw createRestError(response);
}
```
