# Should not emit a private context for clients without operations

Clients that have no operations never read their context. Emitting an initialized `#context` field for them breaks consumers compiling with `noUnusedLocals` (`TS6133`). Clients with operations must still get their context.

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

namespace Shared {
  model Widget {
    id: string;
  }
}

@route("/widgets")
interface Widgets {
  @get list(): Shared.Widget[];
}
```

## TypeScript

### Client

The root client and the `Shared` sub client have no operations, so they don't declare or initialize a context. The root client still initializes its sub clients. The `Widgets` client keeps its context because its operation uses it.

```ts src/demoServiceClient.ts
import type { DemoServiceClientOptions } from "./api/demoServiceClientContext.js";
import type { SharedClientOptions } from "./api/sharedClient/sharedClientContext.js";
import {
  createWidgetsClientContext,
  type WidgetsClientContext,
  type WidgetsClientOptions,
} from "./api/widgetsClient/widgetsClientContext.js";
import { list, type ListOptions } from "./api/widgetsClient/widgetsClientOperations.js";

export class DemoServiceClient {
  sharedClient: SharedClient;
  widgetsClient: WidgetsClient;
  constructor(endpoint: string, options?: DemoServiceClientOptions) {
    this.sharedClient = new SharedClient(endpoint, options);
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
}
export class SharedClient {
  constructor(endpoint: string, options?: SharedClientOptions) {}
}
```
