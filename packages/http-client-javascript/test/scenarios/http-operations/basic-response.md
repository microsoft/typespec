# Should handle a basic response

This test verifies that a basic response with status `204` and no body is correctly handled.

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

### Response

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

# Should handle a response with body

This test verifies that a response with a body containing a `Widget` model is correctly handled.

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

@test
model Widget {
  name: string;
  age: int32;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @get read(): Widget;
}
```

## TypeScript

### Response

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext): Promise<Widget> {
  const path = parse("/widgets").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return widgetToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
```

# Should handle a response with multiple status codes

This test verifies that a response with multiple status codes (`200` and `204`) is correctly handled, where `200` returns a `Widget` and `204` returns void.

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

@test
model Widget {
  name: string;
  age: int32;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @get read(): Widget | void;
}
```

## TypeScript

### Response

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext): Promise<Widget | void> {
  const path = parse("/widgets").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return widgetToApplication(response.body);
  }

  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

# Should handle a response with multiple content types

This test verifies that a response with multiple content types is correctly handled. The response can have a content type of `application/json+something` or the default `Widget` model, or return void.

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

model Widget {
  name: string;
  age: int32;
}

model JsonResponse {
  @body body: Widget;
  @header contentType: "application/json";
}

model XmlResponse {
  @body body: Widget;
  @header contentType: "application/xml";
}

@route("/widgets")
interface Widgets {
  @get read(): JsonResponse | XmlResponse;
}
```

## TypeScript

### Response

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext): Promise<Widget> {
  const path = parse("/widgets").expand({});

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return widgetToApplication(response.body);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/xml")) {
    return widgetToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
```
