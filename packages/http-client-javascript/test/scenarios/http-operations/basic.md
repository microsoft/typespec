# Should generate a basic http operation

This is a simple get operation with no request payload or parameters and a simple model return.

## TypeSpec

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

## TypeScript

### Client

It generates a class called TestClient with a single operation

```ts src/testClient.ts
import { foo } from "./api/testClientOperations.js";
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
  async foo() {
    return foo(this.#context);
  }
}
```

### Model

It generates a model for the Widget return type

```ts src/models/models.ts interface Widget
export interface Widget {
  id: string;
  totalWeight: number;
  color: "red" | "blue";
}
```

### Serializer

A serializer that transforms the Widget from its application form to the wire form is generated. The application form renames properties to align with TypeScript common conventions, and the serializer reverts these renames before sending out to the wire.

```ts src/models/serializers.ts function widgetToTransport
export function widgetToTransport(item: Widget): any {
  return {
    id: item.id,
    total_weight: item.totalWeight,
    color: item.color,
  };
}
```

### Context

The context stores the information required to reach the service. In this case a createTestContext function should be generated with a required endpoint parameter. This example has no auth or other client parameters so endpoint will be the only.

```ts src/api/testClientContext.ts function createTestClientContext
export function createTestClientContext(
  endpoint: string,
  options?: TestClientOptions,
): TestClientContext {
  return getClient(endpoint, { allowInsecureConnection: true, ...options });
}
```

It also generates an interface that defines the shape of the context

```ts src/api/testClientContext.ts interface TestClientContext
export interface TestClientContext extends Client {}
```

### Operation

Generates the operation function which prepares the request options. In this case it has not query, path or header parameters. No body either so headers is empty.

The response body is of type Widget so the right transform should be imported to transform the widget from its wire format to the application form.

It should throw an exception if an unexpected status code is received

```ts src/api/testClientOperations.ts
import { Widget } from "../models/models.js";
import { parse } from "uri-template";
import { widgetToApplication } from "../models/serializers.js";
import { TestClientContext } from "./testClientContext.js";

export async function foo(client: TestClientContext): Promise<Widget> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return widgetToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
```
