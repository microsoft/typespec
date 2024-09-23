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

```ts src/client.ts
import {
  DemoServiceContext,
  DemoServiceOptions,
  createDemoServiceContext,
} from "./api/clientContext.js";
import { list, read, create, update, delete_, analyze } from "./api/widgets/operations.js";

export class DemoServiceClient {
  widgets: WidgetsClient;
  #context: DemoServiceContext;
  constructor(endpoint: string, options?: DemoServiceOptions) {
    this.#context = createDemoServiceContext(endpoint, options);
    this.widgets = new WidgetsClient(this.#context);
  }
}
export class WidgetsClient {
  #context: DemoServiceContext;
  constructor(context: DemoServiceContext) {
    this.#context = context;
  }
  list() {
    return list(this.#context);
  }

  read(id: string) {
    return read(this.#context, id);
  }

  create(weight: number, color: "red" | "blue") {
    return create(this.#context, weight, color);
  }

  update(id: string, weight: number, color: "red" | "blue") {
    return update(this.#context, id, weight, color);
  }

  delete(id: string) {
    return delete_(this.#context, id);
  }

  analyze(id: string) {
    return analyze(this.#context, id);
  }
}
```
