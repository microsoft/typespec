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
export function widgetToTransport(item: Widget) {
  return {
    id: item.id,
    total_weight: item.totalWeight,
    color: item.color,
  };
}
```

### Context

The context stores the information required to reach the service. In this case a createTestContext function should be generated with a required endpoint parameter. This example has no auth or other client parameters so endpoint will be the only.

```ts src/api/clientContext.ts function createTestContext
export function createTestContext(endpoint: string, options: TestOptions): TestContext {
  return {
    endpoint,
  };
}
```

It also generates an interface that defines the shape of the context

```ts src/api/clientContext.ts interface TestContext
export interface TestContext {
  endpoint: string;
}
```

### Operation

Generates the operation function which prepares the request options. In this case it has not query, path or header parameters. No body either so headers is empty.

The response body is of type Widget so the right transform should be imported to transform the widget from its wire format to the application form.

It should throw an exception if an unexpected status code is received

```ts src/api/operations.ts
import { TestContext } from "./clientContext.js";
import { Widget } from "../models/models.js";
import { parse } from "uri-template";
import { widgetToApplication } from "../models/serializers.js";
import { httpFetch } from "../utilities/http-fetch.js";

export async function foo(client: TestContext): Promise<Widget> {
  const path = parse("/").expand({});

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/\/+$/, "")}`;

  const httpRequestOptions = {
    method: "get",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200 && response.headers.get("content-type") === "application/json") {
    return widgetToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
```
