# Should handle a basic request

This test verifies that a basic `GET` request with no headers, body, or parameters is correctly handled.

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
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
export async function read(client: WidgetsClientContext): Promise<void> {
  const path = parse("/widgets").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

# Should handle a request with headers, body, and query parameters

This test verifies that a `POST` request with headers, a body, and query parameters is correctly handled.

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
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
  foo: string,
  etag: string,
  id: string,
  name: string,
): Promise<void> {
  const path = parse("/widgets/{id}{?foo}").expand({
    id: id,
    foo: foo,
  });

  const httpRequestOptions = {
    headers: {
      "content-type": "application/json",
      etag: etag,
    },
    body: {
      name: name,
    },
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

# Should handle a scalar body

This test verifies that a `GET` request with a scalar body is correctly handled.

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
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
): Promise<void> {
  const path = parse("/widgets").expand({});

  const httpRequestOptions = {
    headers: {
      "content-type": "application/json",
    },
    body: readPayloadToTransport(count),
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```
