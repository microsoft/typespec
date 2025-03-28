# Should emit a paging operation if it is continuationToken paging pattern

```tsp
@service
namespace Test;
model Pet {
  id: string;
  name: string;
}

@route("/link")
@list
op link(@continuationToken @query nextToken?: string): {
  @pageItems
  pets: Pet[];

  @continuationToken @header nextToken?: string;
};
```

## Operation

```ts src/api/testClientOperations.ts function link
export function link(
  client: TestClientContext,
  options?: LinkOptions,
): PagedAsyncIterableIterator<Pet, LinkPageResponse, LinkPageSettings> {
  return buildPagedAsyncIterator<Pet, LinkPageResponse, LinkPageSettings>({
    getPagedResponse: async (nextToken?: string, settings?: LinkPageSettings) => {
      const combinedOptions = { ...options, ...settings };
      if (nextToken) {
        combinedOptions.nextToken = nextToken;
      }
      return await linkSend(client, combinedOptions as any);
    },
    deserializeRawResponse: async (response) => {
      return await linkDeserialize(response);
    },
    getElements: (response) => {
      return response.pets;
    },
    getNextToken: (response) => {
      return response.headers["next-token"];
    },
  });
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
export interface LinkPageSettings {
  nextToken?: string;
}
```

## LinkPageResponse

Page responses and will be used as output for byPage function.

```ts src/api/testClientOperations.ts interface LinkPageResponse
export interface LinkPageResponse {
  pets: Array<Pet>;
  nextToken?: string;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  async link(options?: LinkOptions) {
    return link(this.#context, options);
  }
}
```
