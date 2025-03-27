# only: Should emit a paging operation if it is nextLink paging pattern

```tsp
@service
namespace Test;
model Pet {
  id: string;
  name: string;
}

@route("/link")
@list
op link(): {
  @pageItems
  pets: Pet[];

   @continuationToken @header  nextToken?: string;
};
```

## Operation

```ts src/api/testClientOperations.ts function link
export function link(client: TestClientContext, options?: LinkOptions,): PagedAsyncIterableIterator<Pet, LinkPageResponse, LinkPageSettings> {
  // Implementation for paginated operation
  const path = parse("/link").expand({});
  // ... rest of implementation
}
```

## Options

The options bag should like all the optional parameters of the operation

```ts src/api/testClientOperations.ts interface LinkOptions
export interface LinkOptions extends OperationOptions {}
```

## PageSettings

Page settings and will be used as input for byPage function.

```ts src/api/testClientOperations.ts interface LinkPageSettings
export interface LinkPageSettings {}
```

## LinkPageResponse

Page responses and will be used as output for byPage function.

```ts src/api/testClientOperations.ts interface LinkPageResponse
export interface LinkPageResponse {
  pets: Array<Pet>;
  next?: string;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;
  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async link(options?: LinkOptions_2) {
    return link(this.#context, options);
  }
}
```
