# Handles dotted namespaces when only the last has content

## Spec

A dotted namespace where only the last part has content. The leading namespaces have no operations and a single sub namespace

```tsp
@service({
  title: "TestService",
})
namespace Foo.Bar.Baz;
@get op get(): string[];
```

## Expectations

The client should match the last namespace.

```ts src/bazClient.ts class BazClient
export class BazClient {
  #context: BazClientContext;

  constructor(endpoint: string, options?: BazClientOptions) {
    this.#context = createBazClientContext(endpoint, options);
  }
  async get(options?: GetOptions) {
    return get(this.#context, options);
  }
}
```
