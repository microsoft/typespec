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

# Should emit a paging operation if it is simple pagination without nextlink or continuationToken

```tsp
@service
namespace Test;
model Pet {
  id: string;
  name: string;
}

@route("/simple")
@list
op simple(@query filter: string): {
  @pageItems
  pets: Pet[];
};
```

## Operation

```ts src/api/testClientOperations.ts function simple
export function simple(
  client: TestClientContext,
  filter: string,
  options?: SimpleOptions,
): PagedAsyncIterableIterator<Pet, SimplePageResponse, SimplePageSettings> {
  function getElements(response: SimplePageResponse) {
    return response.pets;
  }
  async function getPagedResponse(nextToken?: string, settings?: SimplePageSettings) {
    let response: PathUncheckedResponse;
    if (nextToken) {
      response = await client.pathUnchecked(nextToken).get();
    } else {
      const combinedOptions = { ...options, ...settings };
      response = await simpleSend(client, filter, combinedOptions);
    }
    return {
      pagedResponse: await simpleDeserialize(response, options),
      nextToken: undefined,
    };
  }
  return buildPagedAsyncIterator<Pet, SimplePageResponse, SimplePageSettings>({
    getElements,
    getPagedResponse,
  });
}
```

```ts src/api/testClientOperations.ts function simpleSend
async function simpleSend(
  client: TestClientContext,
  filter: string,
  options?: Record<string, any>,
) {
  const path = parse("/simple{?filter}").expand({
    filter: filter,
  });
  const httpRequestOptions = {
    headers: {},
  };
  return await client.pathUnchecked(path).get(httpRequestOptions);
}
```

```ts src/api/testClientOperations.ts function simpleDeserialize
function simpleDeserialize(response: PathUncheckedResponse, options?: SimpleOptions) {
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

```ts src/api/testClientOperations.ts interface SimpleOptions
export interface SimpleOptions extends OperationOptions {}
```

## PageSettings

Page settings and will be used as input for byPage function.

```ts src/api/testClientOperations.ts interface SimplePageSettings
export interface SimplePageSettings {}
```

## SimplePageResponse

Page responses and will be used as output for byPage function.

```ts src/api/testClientOperations.ts interface SimplePageResponse
export interface SimplePageResponse {
  pets: Array<Pet>;
}
```

## Client

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, options);
  }
  simple(filter: string, options?: SimpleOptions) {
    return simple(this.#context, filter, options);
  }
}
```
