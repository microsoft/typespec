# The presence of @useAuth decorator shouldn't impact the client hierarchy

## TypeSpec

```tsp
@service(#{ title: "My API" })
@useAuth(BearerAuth)
namespace MyApi;

@route("/foo")
namespace Foo {
  @get op getfoo(): string;
}

@route("/bar")
namespace Bar {
  @get op getBar(): string;
}
```

## TypeScript

The client structure should be MyApi class with no operations and 2 members, BarClient and FooClient.

```ts src/myApiClient.ts class MyApiClient
export class MyApiClient {
  #context: MyApiClientContext;
  fooClient: FooClient;
  barClient: BarClient;
  constructor(endpoint: string, credential: BasicCredential, options?: MyApiClientOptions) {
    this.#context = createMyApiClientContext(endpoint, credential, options);
    this.fooClient = new FooClient(endpoint, credential, options);
    this.barClient = new BarClient(endpoint, credential, options);
  }
}
```
