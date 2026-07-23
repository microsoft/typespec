# Should handle a basic request

This test verifies that a basic `GET` request with no headers, body, or parameters is correctly handled.

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @get read(): void;
}
```

## TypeScript

### Request

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext, options?: ReadOptions): Promise<void> {
  const path = parse("/widgets").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

# Should handle a request with headers, body, and query parameters

This test verifies that a `POST` request with headers, a body, and query parameters is correctly handled.

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

@test
model Widget {
  @path id: string;
  @header etag: string;
  @query foo: string;
  name: string;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @post read(...Widget): void;
}
```

## TypeScript

### Request

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(
  client: WidgetsClientContext,
  id: string,
  etag: string,
  foo: string,
  name: string,
  options?: ReadOptions,
): Promise<void> {
  const path = parse("/widgets/{id}{?foo}").expand({
    id: id,
    foo: foo,
  });
  const httpRequestOptions = {
    headers: {
      etag: etag,
    },
    body: {
      name: name,
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

# Should handle a scalar body

This test verifies that a `GET` request with a scalar body is correctly handled.

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @get read(@body count: int32): void;
}
```

## TypeScript

### Request

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(
  client: WidgetsClientContext,
  count: number,
  options?: ReadOptions,
): Promise<void> {
  const path = parse("/widgets").expand({});
  const httpRequestOptions = {
    headers: {},
    body: count,
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

# Should preserve falsy optional HTTP parameters

This test verifies optional query and header parameters are emitted when their value is falsy but present.

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test
  @get
  read(
    @query isActive?: boolean,
    @query count?: int32,
    @query filter?: string,
    @header ifMatch?: string,
  ): void;
}
```

## TypeScript

### Request

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext, options?: ReadOptions): Promise<void> {
  const path = parse("/widgets{?isActive,count,filter}").expand({
    ...(options?.isActive != undefined && { isActive: options.isActive }),
    ...(options?.count != undefined && { count: options.count }),
    ...(options?.filter != undefined && { filter: options.filter }),
  });
  const httpRequestOptions = {
    headers: {
      ...(options?.ifMatch != undefined && { "if-match": options.ifMatch }),
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```
