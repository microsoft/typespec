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
op link(@query filter: string, @continuationToken @query nextToken?: string): {
  @pageItems
  pets: Pet[];

  @continuationToken @header nextToken?: string;
};
```

## Operation

```ts src/api/testClientOperations.ts function link
export function link(
  client: TestClientContext,
  filter: string,
  options?: LinkOptions,
): PagedAsyncIterableIterator<Pet, LinkPageResponse, LinkPageSettings> {
  function getElements(response: LinkPageResponse) {
    return response.pets;
  }
  async function getPagedResponse(nextToken?: string, settings?: LinkPageSettings) {
    const combinedOptions = { ...options, ...settings };

    if (nextToken) {
      combinedOptions.nextToken = nextToken;
    }
    const response = await linkSend(client, filter, combinedOptions);

    return {
      pagedResponse: await linkDeserialize(response, options),
      nextToken: response.headers["next-token"],
    };
  }
  return buildPagedAsyncIterator<Pet, LinkPageResponse, LinkPageSettings>({
    getElements,
    getPagedResponse,
  });
}
```

```ts src/api/testClientOperations.ts function linkSend
async function linkSend(client: TestClientContext, filter: string, options?: Record<string, any>) {
  const path = parse("/link{?filter,nextToken}").expand({
    filter: filter,
    ...(options?.nextToken && { nextToken: options.nextToken }),
  });
  const httpRequestOptions = {
    headers: {},
  };
  return await client.pathUnchecked(path).get(httpRequestOptions);
}
```

```ts src/api/testClientOperations.ts function linkDeserialize
function linkDeserialize(response: PathUncheckedResponse, options?: LinkOptions) {
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      pets: jsonArrayPetToApplicationTransform(response.body.pets),
    }!;
  }
  throw createRestError(response);
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
  link(filter: string, options?: LinkOptions) {
    return link(this.#context, filter, options);
  }
}
```

# Should emit a paging operation if it is nextLink paging pattern

```tsp
@service
namespace Test;
model Pet {
  id: string;
  name: string;
}

@route("/link")
@list
op link(@query filter: string, @pageSize @query maxPageSize?: int32): {
  @pageItems
  pets: Pet[];

  @nextLink link?: string;
};
```

## Operation

```ts src/api/testClientOperations.ts function link
export function link(
  client: TestClientContext,
  filter: string,
  options?: LinkOptions,
): PagedAsyncIterableIterator<Pet, LinkPageResponse, LinkPageSettings> {
  function getElements(response: LinkPageResponse) {
    return response.pets;
  }
  async function getPagedResponse(nextToken?: string, settings?: LinkPageSettings) {
    let response: PathUncheckedResponse;
    if (nextToken) {
      response = await client.pathUnchecked(nextToken).get();
    } else {
      const combinedOptions = { ...options, ...settings };
      response = await linkSend(client, filter, combinedOptions);
    }
    return {
      pagedResponse: await linkDeserialize(response, options),
      nextToken: response.body["link"],
    };
  }
  return buildPagedAsyncIterator<Pet, LinkPageResponse, LinkPageSettings>({
    getElements,
    getPagedResponse,
  });
}
```

```ts src/api/testClientOperations.ts function linkSend
async function linkSend(client: TestClientContext, filter: string, options?: Record<string, any>) {
  const path = parse("/link{?filter,maxPageSize}").expand({
    filter: filter,
    ...(options?.maxPageSize && { maxPageSize: options.maxPageSize }),
  });
  const httpRequestOptions = {
    headers: {},
  };
  return await client.pathUnchecked(path).get(httpRequestOptions);
}
```

```ts src/api/testClientOperations.ts function linkDeserialize
function linkDeserialize(response: PathUncheckedResponse, options?: LinkOptions) {
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      pets: jsonArrayPetToApplicationTransform(response.body.pets),
      link: response.body.link,
    }!;
  }
  throw createRestError(response);
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
  maxPageSize?: number;
}
```

## LinkPageResponse

Page responses and will be used as output for byPage function.

```ts src/api/testClientOperations.ts interface LinkPageResponse
export interface LinkPageResponse {
  pets: Array<Pet>;
  link?: string;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  link(filter: string, options?: LinkOptions) {
    return link(this.#context, filter, options);
  }
}
```
