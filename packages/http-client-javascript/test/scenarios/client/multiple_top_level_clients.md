# Emits multiple top level clients

## TypeSpec

```tsp
namespace Foo {
  model FooItem {
    name: string;
  }

  op get(): FooItem;
}

namespace Bar {
  model BarItem {
    title: string;
  }

  op get(): BarItem;
  @post op create(foo: BarItem): void;
}
```

## TypeScript

It should generate a client for Foo with a single operation as defined in the spec

```ts src/fooClient.ts
import { get } from "./api/fooClientOperations.js";
import {
  FooClientContext,
  FooClientOptions,
  createFooClientContext,
} from "./api/fooClientContext.js";

export class FooClient {
  #context: FooClientContext;

  constructor(endpoint: string, options?: FooClientOptions) {
    this.#context = createFooClientContext(endpoint, options);
  }
  async get() {
    return get(this.#context);
  }
}
```

It should generate a client for Bar with `create` and `get` operations as defined in the spec

```ts src/barClient.ts
import { BarItem } from "./models/models.js";
import { get, create } from "./api/barClientOperations.js";
import {
  BarClientContext,
  BarClientOptions,
  createBarClientContext,
} from "./api/barClientContext.js";

export class BarClient {
  #context: BarClientContext;

  constructor(endpoint: string, options?: BarClientOptions) {
    this.#context = createBarClientContext(endpoint, options);
  }
  async get() {
    return get(this.#context);
  }
  async create(foo: BarItem) {
    return create(this.#context, foo);
  }
}
```
