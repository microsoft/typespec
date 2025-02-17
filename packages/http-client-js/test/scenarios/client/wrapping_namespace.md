# Handles a structure where there is a namespace with sub namespaces only

This scenario has a structure where the root namespace has no operations but has 2 sub namespaces.

In this scenario the emitter is expected to resolve the root namespace as a client

## Spec

A dotted namespace where only the last part has stuff

```tsp
@service({
  title: "TestService",
})
namespace Foo;

@route("/bar")
namespace Bar {
  @get op getBar(): string[];
}

@route("/baz")
namespace Baz {
  @get op getBaz(): string[];
}
```

## Expectations

The root client should be FooClient and should have 2 sub clients as members for bor and baz

```ts src/fooClient.ts class FooClient
export class FooClient {
  #context: FooClientContext;
  barClient: BarClient;
  bazClient: BazClient;
  constructor(endpoint: string, options?: FooClientOptions) {
    this.#context = createFooClientContext(endpoint, options);
    this.barClient = new BarClient(endpoint, options);
    this.bazClient = new BazClient(endpoint, options);
  }
}
```
