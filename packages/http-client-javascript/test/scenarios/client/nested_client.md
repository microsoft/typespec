# Should generate a basic http operation

This is a simple get operation with no request payload or parameters and a simple model return.

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

model Widget {
  @visibility("read", "update")
  @path
  id: string;

  weight: int32;
  color: "red" | "blue";
}

@error
model Error {
  code: int32;
  message: string;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @get list(): Widget[] | Error;
  @get read(@path id: string): Widget | Error;
  @post create(...Widget): Widget | Error;
  @patch update(...Widget): Widget | Error;
  @delete delete(@path id: string): void | Error;
  @route("{id}/analyze") @post analyze(@path id: string): string | Error;
}
```

## TypeScript

### Client

It generates a class called TestClient with a single operation

```ts src/demoServiceClient.ts
import {
  DemoServiceClientContext,
  DemoServiceClientOptions,
  createDemoServiceClientContext,
} from "./api/demoServiceClientContext.js";
import {
  list,
  read,
  create,
  update,
  delete_,
  analyze,
} from "./api/widgetsClient/widgetsClientOperations.js";
import {
  WidgetsClientContext,
  WidgetsClientOptions,
  createWidgetsClientContext,
} from "./api/widgetsClient/widgetsClientContext.js";

export class DemoServiceClient {
  #context: DemoServiceClientContext;
  widgetsClient: WidgetsClient;
  constructor(endpoint: string, options?: DemoServiceClientOptions) {
    this.#context = createDemoServiceClientContext(endpoint, options);
    this.widgetsClient = new WidgetsClient(endpoint, options);
  }
}

export class WidgetsClient {
  #context: WidgetsClientContext;

  constructor(endpoint: string, options?: WidgetsClientOptions) {
    this.#context = createWidgetsClientContext(endpoint, options);
  }
  async list() {
    return list(this.#context);
  }
  async read(id: string) {
    return read(this.#context, id);
  }
  async create(weight: number, color: "red" | "blue") {
    return create(this.#context, weight, color);
  }
  async update(id: string, weight: number, color: "red" | "blue") {
    return update(this.#context, id, weight, color);
  }
  async delete_(id: string) {
    return delete_(this.#context, id);
  }
  async analyze(id: string) {
    return analyze(this.#context, id);
  }
}
```
