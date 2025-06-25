# Emits multiple top level clients

Verifies that the emitter can handle correctly when there are 2 root namespaces, translating these into 2 separate clients

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
import {
  createFooClientContext,
  type FooClientContext,
  type FooClientOptions,
} from "./api/fooClientContext.js";
import { get, type GetOptions } from "./api/fooClientOperations.js";

export class FooClient {
  #context: FooClientContext;

  constructor(endpoint: string, options?: FooClientOptions) {
    this.#context = createFooClientContext(endpoint, options);
  }
  async get(options?: GetOptions) {
    return get(this.#context, options);
  }
}
```

It should generate a client for Bar with `create` and `get` operations as defined in the spec

```ts src/barClient.ts
import {
  type BarClientContext,
  type BarClientOptions,
  createBarClientContext,
} from "./api/barClientContext.js";
import { create, type CreateOptions, get, type GetOptions } from "./api/barClientOperations.js";
import type { BarItem } from "./models/models.js";

export class BarClient {
  #context: BarClientContext;

  constructor(endpoint: string, options?: BarClientOptions) {
    this.#context = createBarClientContext(endpoint, options);
  }
  async get(options?: GetOptions) {
    return get(this.#context, options);
  }
  async create(foo: BarItem, options?: CreateOptions) {
    return create(this.#context, foo, options);
  }
}
```
