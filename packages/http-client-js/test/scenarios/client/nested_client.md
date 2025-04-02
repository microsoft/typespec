# Should generate a client structure that has a root client with a nested client

This specs nests namespace > namespace > interface

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

model Widget {
  @visibility(Lifecycle.Read, Lifecycle.Update)
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
  ListOptions,
  list,
  ReadOptions,
  read,
  CreateOptions,
  create,
  UpdateOptions,
  update,
  DeleteOptions,
  delete_,
  AnalyzeOptions,
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
  async list(options?: ListOptions) {
    return list(this.#context, options);
  }
  async read(id: string, options?: ReadOptions) {
    return read(this.#context, id, options);
  }
  async create(weight: number, color: "red" | "blue", options?: CreateOptions) {
    return create(this.#context, weight, color, options);
  }
  async update(id: string, weight: number, color: "red" | "blue", options?: UpdateOptions) {
    return update(this.#context, id, weight, color, options);
  }
  async delete_(id: string, options?: DeleteOptions) {
    return delete_(this.#context, id, options);
  }
  async analyze(id: string, options?: AnalyzeOptions) {
    return analyze(this.#context, id, options);
  }
}
```
